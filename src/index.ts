//@ts-ignore
import Module from '../cmake-build-release/main.js';

interface WasmModule {
  HEAPU8: Uint8Array;
  HEAPU32: Uint32Array;
  HEAPF32: Float32Array;

  _malloc(size: number): number;

  _free(ptr: number): void;

  _extrude_straight_skeleton(ptr: number): number;
}

/**
 * Each skeleton vertex is represented by x, y and time. Time can be used to calculate z coordinate.
 */
export type Vertex = [number, number, number];

/**
 * Each polygon is represented by an array of vertex indices.
 */
export type Polygon = number[];

export interface Skeleton {
  vertices: Vertex[];
  polygons: Polygon[];
}

export interface SkeletonBuilderInput {
  rings: number[][][]; // polygons and holes
  weights: number[][]; // weights per polygon edge
  maxHeight: number;
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
   * Decodes result buffer to a JSON string
   * */
  static UTF8ToString(ptr: number) {
    const heap = this.module.HEAPU8;
    let end = ptr;
    while (heap[end] !== 0) end++; // find null terminator
    const bytes = heap.subarray(ptr, end);
    return new TextDecoder('utf-8').decode(bytes);
  }

  /**
   * Builds a skeleton from a polygon represented as an array of rings.
   * The polygon must have at least one ring. The first ring is always the outer ring,
   * and the rest are inner rings (holes).
   * All rings must be weakly simple.
   * Each ring must have a duplicate of the first vertex at the end.
   */
  public static build(input: SkeletonBuilderInput): Skeleton {
    this.checkModule();

    // Serialize input
    const inputJson = JSON.stringify(input);
    const inputBytes = new TextEncoder().encode(inputJson);

    // Allocate memory in WASM
    const ptr = this.module._malloc(inputBytes.length + 1);
    this.module.HEAPU8.set(inputBytes, ptr);
    this.module.HEAPU8[ptr + inputBytes.length] = 0; // null-terminate

    // Call WASM function with char* ptr
    const resultPtr = this.module._extrude_straight_skeleton(ptr);
    if (resultPtr === 0) {
      throw new Error('Failed to create straight skeleton');
    }

    // Free the memory after use
    this.module._free(ptr);

    console.log(ptr);

    // Return result object
    const resultJSON = SkeletonBuilder.UTF8ToString(resultPtr); // helper from Emscripten

    return JSON.parse(resultJSON);
  }

  private static checkModule(): void {
    if (this.module === null) {
      throw new Error('The WebAssembly module has not been initialized, call SkeletonBuilder.init() first.');
    }
  }
}
