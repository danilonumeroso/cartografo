import { mulberry32 } from './util';

/** Tileable fractal value noise in [0,1], size x size. */
export function fbmTile(size: number, baseCells: number, octaves: number, seed: number, persistence = 0.5): Float32Array {
  const out = new Float32Array(size * size);
  const rand = mulberry32(seed * 9973 + 17);
  let amp = 1;
  for (let o = 0; o < octaves; o++) {
    const cells = Math.min(size, baseCells << o);
    const lat = new Float32Array(cells * cells);
    for (let i = 0; i < lat.length; i++) lat[i] = rand();
    const sc = cells / size;
    for (let y = 0; y < size; y++) {
      const fy = y * sc, y0 = Math.floor(fy), ty = fy - y0, sy = ty * ty * (3 - 2 * ty);
      const r0 = (y0 % cells) * cells, r1 = ((y0 + 1) % cells) * cells;
      const row = y * size;
      for (let x = 0; x < size; x++) {
        const fx = x * sc, x0 = Math.floor(fx), tx = fx - x0, sx = tx * tx * (3 - 2 * tx);
        const c0 = x0 % cells, c1 = (x0 + 1) % cells;
        const a = lat[r0 + c0], b = lat[r0 + c1], c = lat[r1 + c0], d = lat[r1 + c1];
        out[row + x] += amp * ((a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy);
      }
    }
    amp *= persistence;
  }
  let mn = Infinity, mx = -Infinity;
  for (let i = 0; i < out.length; i++) { const v = out[i]; if (v < mn) mn = v; if (v > mx) mx = v; }
  const k = 1 / (mx - mn || 1);
  for (let i = 0; i < out.length; i++) out[i] = (out[i] - mn) * k;
  return out;
}

/** Bilinear sample with wrap-around. */
export function sampleWrap(n: Float32Array, size: number, x: number, y: number): number {
  x = ((x % size) + size) % size; y = ((y % size) + size) % size;
  const x0 = Math.floor(x), y0 = Math.floor(y), tx = x - x0, ty = y - y0;
  const x1 = (x0 + 1) % size, y1 = (y0 + 1) % size;
  const a = n[y0 * size + x0], b = n[y0 * size + x1], c = n[y1 * size + x0], d = n[y1 * size + x1];
  return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
}

/** Shared threshold noise used to roughen brush edges. */
export const EDGE_N = 512;
let edgeNoise: Float32Array | null = null;
export function getEdgeNoise(): Float32Array {
  if (!edgeNoise) edgeNoise = fbmTile(EDGE_N, 8, 5, 4242, 0.55);
  return edgeNoise;
}
