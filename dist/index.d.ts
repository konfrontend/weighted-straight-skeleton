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
export declare class SkeletonBuilder {
    private static module;
    /**
     * Initializes the WebAssembly module. Must be called before any other method.
     */
    static init(): Promise<void>;
    /**
     * Builds a skeleton from a polygon represented as an array of rings.
     * The polygon must have at least one ring. The first ring is always the outer ring, and the rest are inner rings.
     * Outer rings must be counter-clockwise oriented and inner rings must be clockwise oriented.
     * All rings must be weakly simple.
     * Each ring must have a duplicate of the first vertex at the end.
     * @param coordinates The polygon represented as an array of rings.
     */
    static buildFromPolygon(coordinates: number[][][]): Skeleton;
    private static checkModule;
    private static serializeInput;
    /**
     * Because the closing, duplicated vertex `vn` is **not** written to the buffer, the number of stored `(x,y,w)` triplets is `n`, which is exactly the number of edges of the ring. Consequently there is still **one and only one weight per edge.**
     *    [v0.x, v0.y, w0]   // edge (v0,v1)
     *    [v1.x, v1.y, w1]   // edge (v1,v2)
     *    …
     *    [vn-1.x, vn-1.y, wn-1]   // edge (vn-1,v0)
     *   */
    private static serializeInputW;
}
