import {
  Box3,
  BufferAttribute,
  BufferGeometry,
  Float32BufferAttribute,
  Quaternion, Shape,
  ShapeGeometry, Triangle, Vector2,
  Vector3,
} from 'three';

const triangle = new Triangle();
const vec3 = new Vector3();

export function getTriangleNormal(points: Vector3[]): Vector3 {
  return triangle.set(points[0], points[1], points[2]).getNormal(vec3.clone());
}

/**
 * Converts a set of 3D points into a ShapeGeometry object by projecting the points onto the XY plane.
 *
 * @param {Vector3[]} points - An array of 3D vectors representing the points to be converted into a shape geometry.
 * @return {ShapeGeometry} The resulting ShapeGeometry object created from the given points.
 */
function pointsToShapeGeometry(points: Vector3[]): ShapeGeometry {
  const normal = getTriangleNormal(points.slice(0, 3));

  // Create quaternion to rotate points to XY plane (where ShapeGeometry works best)
  const upVector = new Vector3(0, 0, 1);
  const quaternion = new Quaternion().setFromUnitVectors(normal, upVector);

  const shapePoints = points.map(p => {
    const rotated = p.clone().applyQuaternion(quaternion);
    return new Vector2(rotated.x, rotated.y);
  });
  const shape = new Shape(shapePoints);

  return new ShapeGeometry(shape);
}

export function computePolygon(polygonPoints: Vector3[]): BufferGeometry {
  const shapeGeometry = pointsToShapeGeometry(polygonPoints);

  const geometry = new BufferGeometry();
  const vertices = polygonPoints.map(p => p.toArray()).reverse().flat(); // Fix material side flipping

  const position = new Float32BufferAttribute(vertices, 3);
  geometry.setAttribute('position', position);

  const uv = createUVAttributeFromPosition(geometry.attributes.position as BufferAttribute);
  geometry.setAttribute('uv', uv);

  geometry.setIndex(shapeGeometry.getIndex()); // use shape indices
  geometry.computeVertexNormals(); // compute normal attribute automatically
  geometry.computeBoundingBox(); // compute bounding box (optionally)

  return geometry;
}

export function createUVAttributeFromPosition(position: BufferAttribute, box?: Box3) {
  if (!box) {
    box = new Box3().setFromBufferAttribute(position);
  }
  const size = box.getSize(new Vector3());
  const tempV = new Vector3();

  const uv = new BufferAttribute(new Float32Array(position.count * 2), 2);

  for (let i = 0; i < position.count; i++) {
    tempV.fromBufferAttribute(position, i);

    uv.setXY(
      i,
      (tempV.x - box.min.x) / size.x,
      (tempV.z - box.min.z) / size.z,
    );
  }

  return uv;
}
