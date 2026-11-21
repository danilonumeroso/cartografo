export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export function smoothstep(e0: number, e1: number, x: number) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}

/** Scramble a 32-bit number (murmur3 finaliser): nearby inputs give unrelated outputs. */
export function mix32(h: number) {
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return h >>> 0;
}
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export type Rng = () => number;
export const rrange = (r: Rng, a: number, b: number) => a + (b - a) * r();
export const rint = (r: Rng, a: number, b: number) => Math.floor(a + (b - a + 1) * r());
export const pick = <T>(r: Rng, arr: readonly T[]): T => arr[Math.floor(r() * arr.length) % arr.length];

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

export interface Rect { x: number; y: number; w: number; h: number }
export function unionRect(a: Rect | null, b: Rect): Rect {
  if (!a) return { ...b };
  const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
}
export function expandRect(r: Rect, m: number): Rect {
  return { x: r.x - m, y: r.y - m, w: r.w + 2 * m, h: r.h + 2 * m };
}
export function clipRect(r: Rect, W: number, H: number): Rect | null {
  const x0 = Math.max(0, Math.floor(r.x)), y0 = Math.max(0, Math.floor(r.y));
  const x1 = Math.min(W, Math.ceil(r.x + r.w)), y1 = Math.min(H, Math.ceil(r.y + r.h));
  if (x1 <= x0 || y1 <= y0) return null;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
export function rectsIntersect(a: Rect, b: Rect) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}
export function ptsBBox(pts: number[]): Rect {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < pts.length; i += 2) {
    x0 = Math.min(x0, pts[i]); x1 = Math.max(x1, pts[i]);
    y0 = Math.min(y0, pts[i + 1]); y1 = Math.max(y1, pts[i + 1]);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
export function pointInPoly(x: number, y: number, pts: number[]) {
  let inside = false;
  const n = pts.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = pts[i * 2], yi = pts[i * 2 + 1], xj = pts[j * 2], yj = pts[j * 2 + 1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
export function distToSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax, dy = by - ay;
  const l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
  t = clamp(t, 0, 1);
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}
export function ctx2d(c: HTMLCanvasElement, read = false): CanvasRenderingContext2D {
  return c.getContext('2d', read ? { willReadFrequently: true } : undefined)!;
}
/** Resize canvas if needed (or clear it) and return its context. */
export function fit(c: HTMLCanvasElement, w: number, h: number, read = false): CanvasRenderingContext2D {
  const ctx = ctx2d(c, read);
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  else { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, w, h); }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  return ctx;
}

const patCache = new WeakMap<CanvasRenderingContext2D, Map<CanvasImageSource, CanvasPattern>>();
export function pattern(ctx: CanvasRenderingContext2D, img: CanvasImageSource): CanvasPattern {
  let m = patCache.get(ctx);
  if (!m) { m = new Map(); patCache.set(ctx, m); }
  let p = m.get(img);
  if (!p) { p = ctx.createPattern(img, 'repeat')!; m.set(img, p); }
  return p;
}
export function fillPattern(ctx: CanvasRenderingContext2D, img: CanvasImageSource, ox: number, oy: number, w: number, h: number, scale = 1) {
  const p = pattern(ctx, img);
  p.setTransform(new DOMMatrix().translate(-ox, -oy).scale(scale));
  ctx.fillStyle = p;
  ctx.fillRect(0, 0, w, h);
}

export function hexToRgb(hex: string): [number, number, number] {
  if (hex.startsWith('rgb')) {
    const m = hex.match(/[\d.]+/g) || [];
    return [+(m[0] ?? 0), +(m[1] ?? 0), +(m[2] ?? 0)];
  }
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgba(hex: string, a: number) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
export function shade(hex: string, f: number) {
  const [r, g, b] = hexToRgb(hex);
  const m = (v: number) => clamp(Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f)), 0, 255);
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}

export function debounce<T extends (...a: any[]) => void>(fn: T, ms: number) {
  let t: number | undefined;
  const d = (...a: Parameters<T>) => { clearTimeout(t); t = window.setTimeout(() => fn(...a), ms); };
  d.cancel = () => clearTimeout(t);
  return d;
}

export function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
export function blobToDataURL(b: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result as string);
    fr.onerror = rej;
    fr.readAsDataURL(b);
  });
}
export async function dataURLToBlob(u: string): Promise<Blob> {
  return (await fetch(u)).blob();
}
export function canvasToBlob(c: HTMLCanvasElement, type = 'image/png', q?: number): Promise<Blob> {
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('toBlob failed'))), type, q));
}
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r(null)));

/** Centre of the pointy-top hex (one cell wide, odd rows shifted right) that contains a point. */
export function hexCenter(x: number, y: number, cell = 100): [number, number] {
  const R = cell / Math.sqrt(3), dy = R * 1.5;
  let best: [number, number] = [x, y], bd = Infinity;
  const row0 = Math.round(y / dy);
  for (let row = row0 - 1; row <= row0 + 1; row++) {
    const off = row % 2 ? cell / 2 : 0, col = Math.round((x - off) / cell);
    for (let c = col - 1; c <= col + 1; c++) {
      const cx = c * cell + off, cy = row * dy, d = (cx - x) ** 2 + (cy - y) ** 2;
      if (d < bd) { bd = d; best = [cx, cy]; }
    }
  }
  return best;
}
