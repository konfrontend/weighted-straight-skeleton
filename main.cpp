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

#include <vector>
#include <memory>
#include <rapidjson/document.h>
#include <rapidjson/stringbuffer.h>
#include <rapidjson/writer.h>

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

extern "C" {
EMSCRIPTEN_KEEPALIVE
const char *extrude_straight_skeleton(const char *jsonStr) {
  rapidjson::Document doc;
  doc.Parse(jsonStr);

  // --- Extract rings ---
  const auto &contours = doc["rings"];
  std::vector<Polygon_2> rings;
  for (const auto &ring: contours.GetArray()) {
    Polygon_2 poly;
    for (const auto &pt: ring.GetArray()) {
      poly.push_back(Point_2(pt[0].GetDouble(), pt[1].GetDouble()));
    }
    rings.push_back(std::move(poly));
  }

  // --- Extract weights ---
  const auto &weights = doc["weights"];
  std::vector<std::vector<double> > weightArrays;
  for (const auto &weightRing: weights.GetArray()) {
    std::vector<double> ws;
    for (const auto &w: weightRing.GetArray()) {
      ws.push_back(w.GetDouble());
    }
    weightArrays.push_back(std::move(ws));
  }

  double max_height = doc.HasMember("maxHeight") ? doc["maxHeight"].GetDouble() : 0.0;

  // Construct polygon with holes
  Polygon_with_holes_2 pwh(rings[0]);
  for (size_t i = 1; i < rings.size(); ++i) {
    pwh.add_hole(rings[i]);
  }

  // Create mesh
  CGAL::Surface_mesh<Point_3> mesh;
  CGAL::extrude_skeleton(
    pwh, mesh,
    CGAL::parameters::weights(weightArrays)
    .maximum_height(max_height)
  );

  // Serialize and return
  rapidjson::StringBuffer buffer;
  rapidjson::Writer writer(buffer);

  writer.StartObject();

  // Serialize vertices
  writer.Key("vertices");
  writer.StartArray();
  for (auto v: mesh.vertices()) {
    const auto &p = mesh.point(v);
    writer.StartArray();
    writer.Double(p.x());
    writer.Double(p.y());
    writer.Double(p.z());
    writer.EndArray();
  }
  writer.EndArray();

  // Serialize polygons (triangles)
  writer.Key("polygons");
  writer.StartArray();
  for (auto f: mesh.faces()) {
    writer.StartArray();
    auto h = mesh.halfedge(f);
    for (int i = 0; i < 3; ++i) {
      writer.Int(mesh.target(h));
      h = mesh.next(h);
    }
    writer.EndArray();
  }
  writer.EndArray();

  writer.EndObject();

  // Copy buffer to memory and return a pointer
  static std::string resultJson;
  resultJson.assign(buffer.GetString(), buffer.GetSize());

  return resultJson.c_str();
}

EMSCRIPTEN_KEEPALIVE
const char *create_straight_skeleton(const char *jsonStr) {
  rapidjson::Document doc;
  doc.Parse(jsonStr);

  // --- Extract rings ---
  const auto &contours = doc["rings"];
  std::vector<Polygon_2> rings;
  for (const auto &ring: contours.GetArray()) {
    Polygon_2 poly;
    for (const auto &pt: ring.GetArray()) {
      poly.push_back(Point_2(pt[0].GetDouble(), pt[1].GetDouble()));
    }
    rings.push_back(std::move(poly));
  }

  // --- Extract weights ---
  const auto &weights = doc["weights"];
  std::vector<std::vector<double> > weightArrays;
  for (const auto &weightRing: weights.GetArray()) {
    std::vector<double> ws;
    for (const auto &w: weightRing.GetArray()) {
      ws.push_back(w.GetDouble());
    }
    weightArrays.push_back(std::move(ws));
  }

  // double max_height = doc.HasMember("maxHeight") ? doc["maxHeight"].GetDouble() : 0.0;

  // Construct polygon with holes
  Polygon_with_holes_2 pwh(rings[0]);
  for (size_t i = 1; i < rings.size(); ++i) {
    pwh.add_hole(rings[i]);
  }

  // Create skeleton
  const Straight_skeleton_2_ptr skeleton = CGAL::create_interior_weighted_straight_skeleton_2(pwh, weightArrays);

  // Serialize and return
  rapidjson::StringBuffer buffer;
  rapidjson::Writer writer(buffer);

  writer.StartObject();

  // Serialize vertices
  writer.Key("vertices");
  writer.StartArray();

  std::unordered_map<Straight_skeleton_2::Vertex_const_handle, int> vertex_map;
  int idx = 0;
  for (auto vertex = skeleton->vertices_begin(); vertex != skeleton->vertices_end(); ++vertex) {
    const auto &p = vertex->point();
    writer.StartArray();
    writer.Double(p.x());
    writer.Double(p.y());
    writer.Double(vertex->time());
    writer.EndArray();

    // Update vertex_map for the next step (polygons mapping)
    vertex_map[vertex] = idx;
    idx++;
  }
  writer.EndArray();

  // Serialize polygons (triangles)
  writer.Key("polygons");
  writer.StartArray();

  for (auto face = skeleton->faces_begin(); face != skeleton->faces_end(); ++face) {
    std::vector<uint32_t> face_polygon;

    writer.StartArray();

    for (auto h = face->halfedge();;) {
      const uint32_t vertexIndex = vertex_map[h->vertex()];
      writer.Int(static_cast<int>(vertexIndex));

      h = h->next();

      if (h == face->halfedge()) break;
    }

    writer.EndArray();
  }

  writer.EndArray();

  writer.EndObject();

  // Copy buffer to memory and return a pointer
  static std::string resultJson;
  resultJson.assign(buffer.GetString(), buffer.GetSize());

  return resultJson.c_str();
}
}
