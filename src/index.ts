//@ts-ignore
import Module from '../cmake-build-release/main.js';

interface WasmModule {
  HEAPU8: Uint8Array;
  HEAPU32: Uint32Array;
  HEAPF32: Float32Array;

  _malloc(size: number): number;

  _free(ptr: number): void;

  _create_straight_skeleton(ptr: number): number;
}

/**
 * Each skeleton vertex is represented by x, y and time. Time can be used to calculate z coordinate.
 */
export type Vertex = [number, number, number];

/**
 * Each polygon is represented by an array of vertex indices.
 */
export type Polygon = number[];

/**
 * Straight skeleton calculation result.
 */
export interface Skeleton {
  vertices: Vertex[];
  polygons: Polygon[];
}

export class SkeletonBuilder {
  private static module: WasmModule;

  /**
   * Initializes the WebAssembly module. Must be called before any other method.
   */
  public static async init(): Promise<void> {
    return Module().then((library: WasmModule) => {
      this.module = library;
    });
  }

  /**
   * Builds a skeleton from a polygon represented as an array of rings.
   * The polygon must have at least one ring. The first ring is always the outer ring, and the rest are inner rings.
   * Outer rings must be counter-clockwise oriented and inner rings must be clockwise oriented.
   * All rings must be weakly simple.
   * Each ring must have a duplicate of the first vertex at the end.
   * @param coordinates The polygon represented as an array of rings.
   */
  public static buildFromPolygon(coordinates: number[][][]): Skeleton {
    this.checkModule();

    const inputBuffer = this.serializeInputW(coordinates);
    const inputPtr = this.module._malloc(inputBuffer.byteLength);
    this.module.HEAPU8.set(new Uint8Array(inputBuffer), inputPtr);

    const ptr = this.module._create_straight_skeleton(inputPtr);

    if (ptr === 0) {
      throw new Error('Failed to create straight skeleton with zero points.');
    }

    let offset = ptr / 4;
    const arrayU32 = this.module.HEAPU32;
    const arrayF32 = this.module.HEAPF32;

    const vertices: Vertex[] = [];
    const polygons: number[][] = [];

    const vertexCount = arrayU32[offset++];

    for (let i = 0; i < vertexCount; i++) {
      const x = arrayF32[offset++];
      const y = arrayF32[offset++];
      const time = arrayF32[offset++];

      vertices.push([x, y, time]);
    }

    let polygonVertexCount = arrayU32[offset++];

    while (polygonVertexCount > 0) {
      const polygon = [];

      for (let i = 0; i < polygonVertexCount; i++) {
        polygon.push(arrayU32[offset++]);
      }

      polygons.push(polygon);
      polygonVertexCount = arrayU32[offset++];
    }

    this.module._free(ptr);
    this.module._free(inputPtr);

    return { vertices, polygons };
  }

  private static checkModule(): void {
    if (this.module === null) {
      throw new Error('The WebAssembly module has not been initialized, call SkeletonBuilder.init() first.');
    }
  }

  private static serializeInput(input: number[][][]): ArrayBuffer {
    let size: number = 1;

    for (const ring of input) {
      size += 1 + (ring.length - 1) * 2;
    }

    const uint32Array = new Uint32Array(size);
    const float32Array = new Float32Array(uint32Array.buffer);
    let offset = 0;

    for (const ring of input) {
      uint32Array[offset++] = ring.length - 1;

      for (let i = 0; i < ring.length - 1; i++) {
        float32Array[offset++] = ring[i][0];
        float32Array[offset++] = ring[i][1];
      }
    }

    uint32Array[offset++] = 0;

    return float32Array.buffer;
  }

  // (x coordinate of edge start, y coordinate of edge start, weight of that edge)
  /**
   * Because the closing, duplicated vertex `vn` is **not** written to the buffer, the number of stored `(x,y,w)` triplets is `n`, which is exactly the number of edges of the ring. Consequently there is still **one and only one weight per edge.**
   *    [v0.x, v0.y, w0]   // edge (v0,v1)
   *    [v1.x, v1.y, w1]   // edge (v1,v2)
   *    …
   *    [vn-1.x, vn-1.y, wn-1]   // edge (vn-1,v0)
   *   */
  private static serializeInputW(input: number[][][]): ArrayBuffer {
    /* ----------  compute number of 32-bit words  ---------- */
    let size = 1;                         // final terminator 0
    for (const ring of input) {
      const edges = ring.length - 1;      // duplicate last vertex not stored
      size += 1 + edges * 3;              // 1 = edges counter, 3 = X Y W
    }

    const u32 = new Uint32Array(size);
    const f32 = new Float32Array(u32.buffer);
    let off = 0;

    /* ----------  serialize one ring after another  ---------- */
    for (const ring of input) {
      const edges = ring.length - 1;
      u32[off++] = edges;

      for (let i = 0; i < edges; ++i) {
        f32[off++] = ring[i][0];                   // X
        f32[off++] = ring[i][1];                   // Y
        f32[off++] = ring[i][2] ?? 1.0;            // W  (default 1)
      }
    }

    u32[off++] = 0;                                // terminator
    return f32.buffer;
  }
}

