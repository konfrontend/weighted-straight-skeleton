#ifdef EMSCRIPTEN
//#define CGAL_ALWAYS_ROUND_TO_NEAREST
#define CGAL_NO_ASSERTIONS
#define CGAL_NO_PRECONDITIONS
#define CGAL_NO_POSTCONDITIONS
#define CGAL_NO_WARNINGS
#include <emscripten.h>
#include <emscripten/bind.h>
#endif

#include <CGAL/Exact_predicates_inexact_constructions_kernel.h>
#include <CGAL/Exact_predicates_exact_constructions_kernel.h>
#include <CGAL/Surface_mesh.h>
#include <CGAL/extrude_skeleton.h>
#include <CGAL/Polygon_2.h>

#include <iostream>
#include <unordered_map>
#include <vector>
#include <memory>
#include <rapidjson/document.h>
#include <rapidjson/stringbuffer.h>

namespace SS = CGAL::CGAL_SS_i;
namespace PMP = CGAL::Polygon_mesh_processing;

// Kernel choice:
using K = CGAL::Exact_predicates_inexact_constructions_kernel; // EPICK: Robust and fast
// using K = CGAL::Exact_predicates_exact_constructions_kernel; // EPECK_with_sqrt: Exact and slow
// using K = CGAL::Exact_predicates_exact_constructions_kernel_with_sqrt; // EPECK: More robust, and less slow than EPECK_with_sqrt

using FT = K::FT;
using Point_2 = K::Point_2;
using Segment_2 = K::Segment_2;
using Line_2 = K::Line_2;
using Point_3 = K::Point_3;
using Vector_3 = K::Vector_3;

using Polygon_2 = CGAL::Polygon_2<K>;
using Polygon_with_holes_2 = CGAL::Polygon_with_holes_2<K>;

using Straight_skeleton_2 = CGAL::Straight_skeleton_2<K>;
using Straight_skeleton_2_ptr = std::shared_ptr<Straight_skeleton_2>;

using Mesh = CGAL::Surface_mesh<Point_3>;
using uint = std::uint32_t;

struct Parsed_input {
  Polygon_with_holes_2 polygon;
  std::vector<std::vector<FT> > weights;
};

// Decodes rings from data and generates a polygon with holes.
// Data contains a list of rings; each ring is represented by a number of points (uint32_t),
// followed by the points themselves (each point is represented by 3 floats: x, y, weight).
Parsed_input parse_skeleton_rings(void *data) {
  auto *data_uint32 = static_cast<uint32_t *>(data);
  uint32_t edges = data_uint32[0]; // #triplets in first ring

  ++data_uint32;

  assert(points != 0);
  assert(points > 2);
  assert(edges != 0 && edges > 2);

  Polygon_2 outer;
  Polygon_2 hole;
  Polygon_with_holes_2 polygon;
  bool outer_set = false;

  std::vector<std::vector<FT> > weights; // one inner vector per ring

  while (edges != 0) {
    Polygon_2 *target = outer_set ? &hole : &outer;
    weights.emplace_back(); // create a slot for this ring

    /* ---- read   edges   triples (x,y,w) ---- */
    for (uint32_t i = 0; i < edges; ++i) {
      const float x = *(reinterpret_cast<float *>(data_uint32) + i * 3);
      const float y = *(reinterpret_cast<float *>(data_uint32) + i * 3 + 1);
      const float w = *(reinterpret_cast<float *>(data_uint32) + i * 3 + 2);

      target->push_back(Point_2(x, y));
      weights.back().push_back(w); // store weight
      // std::cout << "Edge:" << i << "Weight:" << w << std::endl;
    }

    data_uint32 += edges * 3; // skip x-y-w triplets
    edges = data_uint32[0]; // next ring size or 0

    ++data_uint32;

    /* close current ring */
    if (!outer_set) {
      assert(outer.is_counterclockwise_oriented());
      polygon = Polygon_with_holes_2(outer);
      outer_set = true;
    } else {
      assert(hole.is_clockwise_oriented());
      polygon.add_hole(hole);
      hole.clear();
    }
  }

  return Parsed_input{std::move(polygon), std::move(weights)};
}

// Serializes a skeleton into a format that can be sent to the JS side.
// The first part of the data describes the vertices:
// The first value (uint32_t) specifies the number of vertices.
// After that, each vertex is represented by 3 floats: x, y, time.
// Then, the second part describes the faces:
// Each face is represented by an uint32_t specifying the number of vertices in the face, followed by the indices
// of its vertices (also uint32_t).
// The last value is 0.
// The caller receives ownership of the malloc-ed buffer and must `free()` it later.
void *serialize_skeleton(const Straight_skeleton_2_ptr &iss) {
  if (iss == nullptr) {
    return nullptr;
  }

  std::unordered_map<Straight_skeleton_2::Vertex_const_handle, int> vertex_map;
  std::vector<std::tuple<float, float, float> > vertices;

  for (auto vertex = iss->vertices_begin(); vertex != iss->vertices_end(); ++vertex) {
    CGAL::Point_2 point = vertex->point();

    vertices.emplace_back(point.x(), point.y(), vertex->time());
    vertex_map[vertex] = vertices.size() - 1;
  }


  std::vector<std::vector<uint32_t> > faces; // polygons
  int total_vertices = 0; // to compute the final buffer size

  for (auto face = iss->faces_begin(); face != iss->faces_end(); ++face) {
    std::vector<uint32_t> face_polygon;

    for (auto h = face->halfedge();;) {
      auto vertex_index = static_cast<uint32_t>(vertex_map[h->vertex()]);
      face_polygon.push_back(vertex_index);
      ++total_vertices;

      h = h->next();

      if (h == face->halfedge()) break;
    }

    faces.emplace_back(face_polygon);
  }


  const int total_size =
      1 // number of vertices
      + vertices.size() * 3 // x y time for every vertex
      + faces.size() // 1 integer per face: vertex count
      + total_vertices // all vertex indices
      + 1; // sentinel 0 at the end


  auto *data = static_cast<uint32_t *>(malloc(total_size * sizeof(uint32_t)));
  auto *data_float = reinterpret_cast<float *>(data);


  int i = 0;
  data[i++] = vertices.size();

  for (auto vertex: vertices) {
    data_float[i++] = std::get<0>(vertex);
    data_float[i++] = std::get<1>(vertex);
    data_float[i++] = std::get<2>(vertex);
  }

  for (const auto &face: faces) {
    data[i++] = face.size();

    for (const auto vertex_index: face) {
      data[i++] = vertex_index;
    }
  }

  data[i] = 0;

  return data;
}

extern "C" {
EMSCRIPTEN_KEEPALIVE
void *create_straight_skeleton(void *data) {
  std::cout << "Calling create_straight_skeleton" << std::endl;
  auto [polygon, weights] = parse_skeleton_rings(data);

  const Straight_skeleton_2_ptr skeleton = CGAL::create_interior_weighted_straight_skeleton_2(polygon, weights);
  return serialize_skeleton(skeleton);
}
}
