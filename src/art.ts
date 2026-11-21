/**
 * Painting kit shared by every stamp pack. All stamps are drawn top-down with
 * light coming from the upper left: highlights sit up-left, shadows fall
 * down-right. Coordinates are world px with the origin at the stamp center.
 */
import { Rng, rrange, shade } from './util';

export type C2D = CanvasRenderingContext2D;
/** Draw function: origin at box center, units = world px. w/h = box size in world px. */
export type Draw = (c: C2D, r: Rng, w: number, h: number) => void;

export interface StampDef {
  id: string; name: string; cat: string;
  w: number; h: number;           // size in grid cells
  layer: 0 | 1 | 2;               // 0 decal, 1 object, 2 canopy
  light?: { radius: number; color: string; intensity: number };
  /** Extra search words (English, lower case). */
  tags?: string;
  draw: Draw;
}

/** Supersampling factor of cached stamp bitmaps. */
export const RES = 2;
export const TAU = Math.PI * 2;

// ---------------------------------------------------------------- palette
export const INK = '#1c1510';
export const WOOD = '#8a5a33', WOOD_L = '#a8743f', WOOD_D = '#5e3b1f';
export const OAK = '#9b6b3c', OAK_L = '#c08a52', DARKWOOD = '#4a2e1a', PINE_W = '#c49a62';
export const STONE = '#9a958c', STONE_L = '#bdb8ad', STONE_D = '#67635c';
export const MARBLE = '#e6e1d6', MARBLE_D = '#b9b2a4';
export const METAL = '#8d939a', METAL_L = '#c3c8cd', METAL_D = '#4f555c', IRON = '#3d4146';
export const GOLD = '#d4af37', GOLD_L = '#f3d77a', GOLD_D = '#9a7a1c';
export const COPPER = '#b8733a', BRASS = '#c9a24a';
export const LEAF = '#4f8a33', LEAF_L = '#7cb34a', LEAF_D = '#2d5620';
export const CLOTH = ['#9b2c2c', '#2c4f9b', '#3f7a3a', '#7a3f8a', '#b07a2a'];
export const LINEN = '#e8e2d2', PAPER = '#efe4c8', PARCH = '#e2cf9e';
export const STRAW = '#d8b964', STRAW_D = '#a8893c';

// ---------------------------------------------------------------- primitives
export function shadow(c: C2D, on: boolean, blur = 9, ox = 4, oy = 6, a = 0.5) {
  if (on) { c.shadowColor = `rgba(0,0,0,${a})`; c.shadowBlur = blur * RES; c.shadowOffsetX = ox * RES; c.shadowOffsetY = oy * RES; }
  else { c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetX = 0; c.shadowOffsetY = 0; }
}
export function rrect(c: C2D, x: number, y: number, w: number, h: number, r: number | number[]) {
  c.beginPath(); c.roundRect(x, y, w, h, r);
}
export function rect(c: C2D, x: number, y: number, w: number, h: number) { c.beginPath(); c.rect(x, y, w, h); }
export function circ(c: C2D, x: number, y: number, r: number) { c.beginPath(); c.arc(x, y, Math.max(0.01, r), 0, TAU); }
export function ell(c: C2D, x: number, y: number, rx: number, ry: number, rot = 0) { c.beginPath(); c.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, TAU); }
export function poly(c: C2D, pts: number[], close = true) {
  c.beginPath();
  for (let i = 0; i < pts.length; i += 2) i ? c.lineTo(pts[i], pts[i + 1]) : c.moveTo(pts[i], pts[i + 1]);
  if (close) c.closePath();
}
/** Fill the current path, then ink its outline (shadow-free). */
export function fs(c: C2D, fill: string | CanvasGradient | CanvasPattern, lw = 2.2, ink = INK) {
  c.fillStyle = fill; c.fill();
  if (lw > 0) { c.save(); shadow(c, false); c.lineWidth = lw; c.strokeStyle = ink; c.lineJoin = 'round'; c.stroke(); c.restore(); }
}
/** Stroke the current path without a shadow. */
export function st(c: C2D, col: string, lw: number) {
  c.save(); shadow(c, false); c.strokeStyle = col; c.lineWidth = lw; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); c.restore();
}
export function line(c: C2D, x0: number, y0: number, x1: number, y1: number, col: string, lw: number) {
  c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.stroke();
}
/** Ink-outlined thick line: dark border, colored core. */
export function rod(c: C2D, x0: number, y0: number, x1: number, y1: number, col: string, lw: number, ink = INK) {
  line(c, x0, y0, x1, y1, ink, lw + 2.4); line(c, x0, y0, x1, y1, col, lw);
}
export function radial(c: C2D, x: number, y: number, r: number, inner: string, outer: string, off = 0.3) {
  const g = c.createRadialGradient(x - r * off, y - r * off, r * 0.05, x, y, Math.max(0.01, r));
  g.addColorStop(0, inner); g.addColorStop(1, outer);
  return g;
}
export function lin(c: C2D, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  for (const [k, col] of stops) g.addColorStop(k, col);
  return g;
}
/** Shaded sphere-ish fill for a round object of base color `col`. */
export function ball(c: C2D, x: number, y: number, R: number, col: string, k = 0.35) {
  return radial(c, x, y, R, shade(col, k), shade(col, -k), 0.4);
}
/** Soft additive-looking glow. `rgb` is "r,g,b". */
export function glow(c: C2D, x: number, y: number, R: number, rgb: string, a = 0.5) {
  const g = c.createRadialGradient(x, y, 0, x, y, Math.max(0.01, R));
  g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.45, `rgba(${rgb},${a * 0.4})`); g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g; circ(c, x, y, R); c.fill();
}
/** Smooth organic closed outline through jittered radial points. */
export function blob(c: C2D, r: Rng, R: number, n = 10, jit = 0.22, ox = 0, oy = 0, sy = 1) {
  const p: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU, d = R * (1 - jit + r() * jit * 2);
    p.push([ox + Math.cos(a) * d, oy + Math.sin(a) * d * sy]);
  }
  c.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = p[i % n], b = p[(i + 1) % n];
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    i ? c.quadraticCurveTo(a[0], a[1], mx, my) : c.moveTo(mx, my);
  }
  c.closePath();
}
/** Star path with n points. */
export function starPath(c: C2D, x: number, y: number, n: number, R: number, r: number, rot = -Math.PI / 2) {
  c.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i / (n * 2)) * TAU, d = i % 2 ? r : R;
    i ? c.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d) : c.moveTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
  }
  c.closePath();
}
/** Four-pointed twinkle. */
export function sparkle(c: C2D, x: number, y: number, s: number, col = 'rgba(255,255,255,0.95)') {
  c.beginPath();
  c.moveTo(x, y - s); c.quadraticCurveTo(x, y, x + s, y); c.quadraticCurveTo(x, y, x, y + s);
  c.quadraticCurveTo(x, y, x - s, y); c.quadraticCurveTo(x, y, x, y - s);
  c.fillStyle = col; c.fill();
}
export function clip(c: C2D, path: () => void, fn: () => void) { c.save(); path(); c.clip(); fn(); c.restore(); }
export function at(c: C2D, x: number, y: number, rot: number, fn: () => void, s = 1) {
  c.save(); c.translate(x, y); if (rot) c.rotate(rot); if (s !== 1) c.scale(s, s); fn(); c.restore();
}

// ---------------------------------------------------------------- materials
export function woodPlanks(c: C2D, x: number, y: number, w: number, h: number, n: number, vertical = false) {
  c.save(); c.clip();
  for (let i = 1; i < n; i++) {
    if (vertical) line(c, x + (w * i) / n, y, x + (w * i) / n, y + h, 'rgba(40,20,5,0.45)', 1.2);
    else line(c, x, y + (h * i) / n, x + w, y + (h * i) / n, 'rgba(40,20,5,0.45)', 1.2);
  }
  c.restore();
}
/** Wavy wood grain inside the current clip/path region box. */
export function grain(c: C2D, r: Rng, x: number, y: number, w: number, h: number, n = 6, vertical = false, col = 'rgba(50,25,8,0.28)') {
  c.save(); c.clip();
  c.strokeStyle = col; c.lineWidth = 1;
  for (let i = 0; i < n; i++) {
    const o = rrange(r, 0.05, 0.95), amp = rrange(r, 0.6, 2.2), ph = r() * TAU, f = rrange(r, 0.04, 0.09);
    c.beginPath();
    const L = vertical ? h : w;
    for (let s = 0; s <= L; s += 4) {
      const d = Math.sin(s * f + ph) * amp;
      const px = vertical ? x + o * w + d : x + s, py = vertical ? y + s : y + o * h + d;
      s ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.stroke();
  }
  if (r() < 0.7) { // a knot
    const kx = x + rrange(r, 0.2, 0.8) * w, ky = y + rrange(r, 0.2, 0.8) * h;
    ell(c, kx, ky, vertical ? 1.6 : 3.2, vertical ? 3.2 : 1.6); c.fillStyle = 'rgba(50,25,8,0.35)'; c.fill();
  }
  c.restore();
}
/** A plank-built rectangle with grain, seams, nails and an ink border. */
export function plankBox(c: C2D, r: Rng, x: number, y: number, w: number, h: number, n: number, col = WOOD, vertical = false, rad = 3, lw = 2.2) {
  rrect(c, x, y, w, h, rad); fs(c, lin(c, x, y, x + w, y + h, [[0, shade(col, 0.12)], [1, shade(col, -0.12)]]), lw);
  for (let i = 0; i < n; i++) {
    const px = vertical ? x + (w * i) / n : x, py = vertical ? y : y + (h * i) / n;
    const pw = vertical ? w / n : w, ph = vertical ? h : h / n;
    c.save(); rrect(c, x, y, w, h, rad); c.clip();
    c.fillStyle = `rgba(${r() < 0.5 ? '255,230,190' : '30,15,5'},${rrange(r, 0.02, 0.1)})`; c.fillRect(px, py, pw, ph);
    c.restore();
    c.save(); rrect(c, x, y, w, h, rad); c.clip(); c.beginPath(); c.rect(px, py, pw, ph); grain(c, r, px, py, pw, ph, 2, vertical); c.restore();
  }
  rrect(c, x, y, w, h, rad); woodPlanks(c, x, y, w, h, n, vertical);
  rrect(c, x, y, w, h, rad); st(c, INK, lw);
}
export function flame(c: C2D, x: number, y: number, s: number) {
  const g = c.createRadialGradient(x, y, 0, x, y, s * 2.2);
  g.addColorStop(0, 'rgba(255,200,80,0.75)'); g.addColorStop(1, 'rgba(255,120,20,0)');
  c.fillStyle = g; circ(c, x, y, s * 2.2); c.fill();
  const tongue = (col: string, k: number) => {
    c.beginPath();
    c.moveTo(x, y - s * 1.3 * k);
    c.bezierCurveTo(x + s * 0.9 * k, y - s * 0.3 * k, x + s * 0.7 * k, y + s * 0.8 * k, x, y + s * 0.8 * k);
    c.bezierCurveTo(x - s * 0.7 * k, y + s * 0.8 * k, x - s * 0.9 * k, y - s * 0.3 * k, x, y - s * 1.3 * k);
    c.fillStyle = col; c.fill();
  };
  tongue('#ff7a1a', 1); tongue('#ffb52e', 0.7); tongue('#fff1a0', 0.38);
}
/** Flame in any hue: [outer, mid, core] colors and glow rgb. */
export function magicFlame(c: C2D, x: number, y: number, s: number, cols: [string, string, string], rgb: string) {
  glow(c, x, y, s * 2.6, rgb, 0.6);
  const tongue = (col: string, k: number) => {
    c.beginPath();
    c.moveTo(x, y - s * 1.3 * k);
    c.bezierCurveTo(x + s * 0.9 * k, y - s * 0.3 * k, x + s * 0.7 * k, y + s * 0.8 * k, x, y + s * 0.8 * k);
    c.bezierCurveTo(x - s * 0.7 * k, y + s * 0.8 * k, x - s * 0.9 * k, y - s * 0.3 * k, x, y - s * 1.3 * k);
    c.fillStyle = col; c.fill();
  };
  tongue(cols[0], 1); tongue(cols[1], 0.7); tongue(cols[2], 0.38);
}
/** Glowing embers / coal bed inside radius R. */
export function coals(c: C2D, r: Rng, x: number, y: number, R: number, n = 14) {
  circ(c, x, y, R); c.fillStyle = radial(c, x, y, R, '#3a1a0c', '#160a05', 0); c.fill();
  for (let i = 0; i < n; i++) {
    const a = r() * TAU, d = Math.sqrt(r()) * R * 0.85, s = rrange(r, R * 0.1, R * 0.22);
    const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
    blob(c, r, s, 6, 0.3, px, py); c.fillStyle = r() < 0.5 ? '#2a1610' : '#3b2216'; c.fill();
    blob(c, r, s * 0.55, 5, 0.3, px, py); c.fillStyle = pick(r, ['#ff5a14', '#ff8a1e', '#ffb43a', '#d63a0e']); c.fill();
  }
}
export function canopy(c: C2D, r: Rng, R: number, base = LEAF, light = LEAF_L, dark = LEAF_D, lobes = 8) {
  const blobs: [number, number, number][] = [[0, 0, R * 0.62]];
  for (let i = 0; i < lobes; i++) {
    const a = (i / lobes) * Math.PI * 2 + rrange(r, -0.25, 0.25);
    const d = R * rrange(r, 0.48, 0.6);
    blobs.push([Math.cos(a) * d, Math.sin(a) * d, R * rrange(r, 0.36, 0.46)]);
  }
  const path = () => { c.beginPath(); for (const [x, y, rr] of blobs) { c.moveTo(x + rr, y); c.arc(x, y, rr, 0, Math.PI * 2); } };
  shadow(c, true, 14, 8, 10, 0.55);
  path(); c.fillStyle = dark; c.fill();
  shadow(c, false);
  c.lineWidth = 2.6; c.strokeStyle = INK;
  for (const [x, y, rr] of blobs) { circ(c, x, y, rr); c.stroke(); }
  path(); c.fillStyle = dark; c.fill();
  c.save(); path(); c.clip();
  c.fillStyle = base;
  for (const [x, y, rr] of blobs) { circ(c, x - rr * 0.18, y - rr * 0.2, rr * 0.88); c.fill(); }
  c.fillStyle = light;
  for (const [x, y, rr] of blobs) { circ(c, x - rr * 0.35, y - rr * 0.38, rr * 0.5); c.fill(); }
  c.strokeStyle = 'rgba(20,40,10,0.35)'; c.lineWidth = 1.2;
  for (let i = 0; i < 26; i++) {
    const a = r() * 6.28, d = r() * R * 0.9;
    const x = Math.cos(a) * d, y = Math.sin(a) * d;
    c.beginPath(); c.arc(x, y, rrange(r, 3, 7), rrange(r, 0, 3), rrange(r, 3.5, 6)); c.stroke();
  }
  c.restore();
}
/** Richer canopy with leaf clusters; returns nothing, draws at origin. */
export function foliage(c: C2D, r: Rng, R: number, cols: { base: string; light: string; dark: string; hi?: string }, opts: { lobes?: number; leafy?: number; fruit?: string; blossom?: string; trunk?: boolean } = {}) {
  const lobes = opts.lobes ?? 9;
  const blobs: [number, number, number][] = [[0, 0, R * 0.6]];
  for (let i = 0; i < lobes; i++) {
    const a = (i / lobes) * TAU + rrange(r, -0.25, 0.25);
    const d = R * rrange(r, 0.5, 0.62);
    blobs.push([Math.cos(a) * d, Math.sin(a) * d, R * rrange(r, 0.34, 0.44)]);
  }
  const path = () => { c.beginPath(); for (const [x, y, rr] of blobs) { c.moveTo(x + rr, y); c.arc(x, y, rr, 0, TAU); } };
  shadow(c, true, 16, 9, 12, 0.5); path(); c.fillStyle = cols.dark; c.fill(); shadow(c, false);
  c.lineWidth = 2.6; c.strokeStyle = INK;
  for (const [x, y, rr] of blobs) { circ(c, x, y, rr); c.stroke(); }
  path(); c.fillStyle = cols.dark; c.fill();
  c.save(); path(); c.clip();
  c.fillStyle = cols.base;
  for (const [x, y, rr] of blobs) { circ(c, x - rr * 0.16, y - rr * 0.18, rr * 0.86); c.fill(); }
  // leaf clusters
  const nLeaf = opts.leafy ?? Math.round(R * 1.4);
  for (let i = 0; i < nLeaf; i++) {
    const a = r() * TAU, d = Math.sqrt(r()) * R;
    const x = Math.cos(a) * d, y = Math.sin(a) * d;
    const lit = (-x - y) / (R * 1.4);
    const col = lit > 0.25 ? cols.light : lit < -0.3 ? cols.dark : cols.base;
    leafShape(c, x, y, rrange(r, 6, 11), rrange(r, 3, 5), r() * TAU); c.fillStyle = col; c.fill();
  }
  c.fillStyle = cols.light; c.globalAlpha = 0.55;
  for (const [x, y, rr] of blobs) { circ(c, x - rr * 0.38, y - rr * 0.4, rr * 0.42); c.fill(); }
  c.globalAlpha = 1;
  if (cols.hi) for (let i = 0; i < R * 0.4; i++) {
    const a = r() * TAU, d = Math.sqrt(r()) * R * 0.8;
    leafShape(c, Math.cos(a) * d - R * 0.15, Math.sin(a) * d - R * 0.15, rrange(r, 4, 7), 2.4, r() * TAU); c.fillStyle = cols.hi; c.fill();
  }
  if (opts.fruit) for (let i = 0; i < R * 0.18; i++) {
    const a = r() * TAU, d = Math.sqrt(r()) * R * 0.85, x = Math.cos(a) * d, y = Math.sin(a) * d;
    circ(c, x, y, rrange(r, 3, 4.5)); fs(c, ball(c, x, y, 4, opts.fruit), 1);
  }
  if (opts.blossom) for (let i = 0; i < R * 0.9; i++) {
    const a = r() * TAU, d = Math.sqrt(r()) * R * 0.95, x = Math.cos(a) * d, y = Math.sin(a) * d;
    for (let p = 0; p < 5; p++) { const q = (p / 5) * TAU; circ(c, x + Math.cos(q) * 2, y + Math.sin(q) * 2, 1.8); c.fillStyle = opts.blossom; c.fill(); }
    circ(c, x, y, 1); c.fillStyle = '#fff6b0'; c.fill();
  }
  c.strokeStyle = 'rgba(10,25,5,0.3)'; c.lineWidth = 1.2;
  for (let i = 0; i < R * 0.5; i++) {
    const a = r() * TAU, d = r() * R * 0.9;
    c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d, rrange(r, 3, 7), rrange(r, 0, 3), rrange(r, 3.5, 6)); c.stroke();
  }
  c.restore();
}
/** Layered fir seen from above. */
export function fir(c: C2D, r: Rng, R: number, snow = 0, cols = ['#1f4f2c', '#27603a', '#317246', '#3e8452']) {
  const layer = (rad: number, n: number, col: string, rot: number) => {
    const pts: number[] = [];
    for (let i = 0; i < n * 2; i++) { const a = rot + (i / (n * 2)) * TAU + rrange(r, -0.05, 0.05), d = i % 2 ? rad * rrange(r, 0.74, 0.82) : rad * rrange(r, 0.92, 1.02); pts.push(Math.cos(a) * d, Math.sin(a) * d); }
    const path = () => poly(c, pts);
    path(); fs(c, radial(c, 0, 0, rad, shade(col, 0.12), shade(col, -0.25), 0.3), 2);
    clip(c, path, () => {
      for (let i = 0; i < rad * 3.2; i++) {
        const a = r() * TAU, d = rad * Math.sqrt(r()), x = Math.cos(a) * d, y = Math.sin(a) * d, L = rrange(r, 5, 9);
        const lit = (-x - y) / (rad * 1.4);
        line(c, x, y, x + Math.cos(a) * L, y + Math.sin(a) * L, lit > 0.15 ? shade(col, 0.35) : lit < -0.25 ? shade(col, -0.45) : shade(col, 0.12), 1.3);
      }
      if (snow > 0) for (let i = 0; i < n * snow; i++) { const a = rot + (i / (n * snow)) * TAU + rrange(r, -0.1, 0.1), d = rad * rrange(r, 0.55, 0.9); blob(c, r, rad * rrange(r, 0.08, 0.14), 6, 0.3, Math.cos(a) * d - 2, Math.sin(a) * d - 2); c.fillStyle = 'rgba(250,252,255,0.92)'; c.fill(); }
    });
    path(); st(c, INK, 1.6);
  };
  shadow(c, true, 14, 8, 12, 0.5); circ(c, 0, 0, R * 0.8); c.fillStyle = cols[0]; c.fill(); shadow(c, false);
  layer(R, 22, cols[0], 0); layer(R * 0.76, 18, cols[1], 0.3); layer(R * 0.52, 14, cols[2], 0.1); layer(R * 0.3, 10, cols[3], 0.5);
}
export function leafShape(c: C2D, x: number, y: number, L: number, W: number, a: number) {
  const ca = Math.cos(a), sa = Math.sin(a);
  const px = (u: number, v: number) => [x + u * ca - v * sa, y + u * sa + v * ca];
  const [x0, y0] = px(-L / 2, 0), [x1, y1] = px(L / 2, 0), [c1x, c1y] = px(0, -W), [c2x, c2y] = px(0, W);
  c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(c1x, c1y, x1, y1); c.quadraticCurveTo(c2x, c2y, x0, y0); c.closePath();
}
export function rockShape(c: C2D, r: Rng, R: number, n = 9) {
  c.beginPath();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, d = R * rrange(r, 0.72, 1);
    i ? c.lineTo(Math.cos(a) * d, Math.sin(a) * d) : c.moveTo(Math.cos(a) * d, Math.sin(a) * d);
  }
  c.closePath();
}
export function rock(c: C2D, r: Rng, x: number, y: number, R: number, col = STONE) {
  c.save(); c.translate(x, y); c.rotate(r() * 6.28);
  shadow(c, true, 6, 3, 4, 0.5);
  rockShape(c, r, R);
  fs(c, radial(c, 0, 0, R, shade(col, 0.25), shade(col, -0.3), 0.45), 2);
  shadow(c, false);
  line(c, -R * 0.3, -R * 0.1, R * 0.2, R * 0.3, 'rgba(0,0,0,0.3)', 1.2);
  c.restore();
}
/** Faceted boulder with lit top facets (painterly). */
export function boulder(c: C2D, r: Rng, x: number, y: number, R: number, col = STONE, moss = 0) {
  c.save(); c.translate(x, y);
  const n = 8 + Math.floor(r() * 4), pts: number[] = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU + rrange(r, -0.15, 0.15), d = R * rrange(r, 0.78, 1); pts.push(Math.cos(a) * d, Math.sin(a) * d); }
  shadow(c, true, 10, 5, 7, 0.55); poly(c, pts); c.fillStyle = shade(col, -0.25); c.fill(); shadow(c, false);
  // facets: fan from an off-center apex
  const ax = -R * 0.18 + rrange(r, -R * 0.1, R * 0.1), ay = -R * 0.2 + rrange(r, -R * 0.1, R * 0.1);
  for (let i = 0; i < n; i++) {
    const x0 = pts[i * 2], y0 = pts[i * 2 + 1], x1 = pts[((i + 1) % n) * 2], y1 = pts[((i + 1) % n) * 2 + 1];
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    const lit = (-(mx - ax) - (my - ay)) / (R * 1.4);
    poly(c, [ax, ay, x0, y0, x1, y1]); c.fillStyle = shade(col, lit * 0.35 + rrange(r, -0.05, 0.05)); c.fill();
    st(c, 'rgba(0,0,0,0.12)', 0.8);
  }
  if (moss > 0) {
    clip(c, () => poly(c, pts), () => {
      for (let i = 0; i < 18 * moss; i++) {
        const a = rrange(r, Math.PI * 0.9, Math.PI * 1.9), d = R * rrange(r, 0.3, 1);
        blob(c, r, R * rrange(r, 0.12, 0.24), 7, 0.3, Math.cos(a) * d, Math.sin(a) * d); c.fillStyle = pick(r, ['#5a8a2e', '#6f9e3a', '#4a7526']); c.fill();
      }
    });
  }
  poly(c, pts); st(c, INK, 2.2);
  c.restore();
}
export function barrelTop(c: C2D, x: number, y: number, R: number) {
  shadow(c, true, 7, 3, 4);
  circ(c, x, y, R); fs(c, WOOD, 2.2);
  shadow(c, false);
  circ(c, x, y, R * 0.82); c.strokeStyle = METAL_D; c.lineWidth = R * 0.12; c.stroke();
  circ(c, x, y, R * 0.68); c.fillStyle = WOOD_L; c.fill();
  c.save(); circ(c, x, y, R * 0.68); c.clip();
  for (let i = -3; i <= 3; i++) line(c, x - R, y + i * R * 0.2, x + R, y + i * R * 0.2, 'rgba(60,30,10,0.35)', 1);
  c.restore();
  circ(c, x, y, R * 0.68); c.strokeStyle = 'rgba(40,20,5,0.6)'; c.lineWidth = 1.2; c.stroke();
}
/** Open barrel/tub seen from above, filled with `fill` (a color or a callback). */
export function tub(c: C2D, x: number, y: number, R: number, fill: string | ((R: number) => void), wood = WOOD) {
  shadow(c, true, 7, 3, 4); circ(c, x, y, R); fs(c, wood, 2.2); shadow(c, false);
  circ(c, x, y, R * 0.86); c.strokeStyle = METAL_D; c.lineWidth = R * 0.1; c.stroke();
  circ(c, x, y, R * 0.74); c.fillStyle = shade(wood, -0.35); c.fill();
  c.save(); c.translate(x, y); circ(c, 0, 0, R * 0.7); c.clip();
  if (typeof fill === 'string') { circ(c, 0, 0, R * 0.7); c.fillStyle = radial(c, 0, 0, R * 0.7, shade(fill, 0.25), shade(fill, -0.2)); c.fill(); }
  else fill(R * 0.7);
  c.restore();
  circ(c, x, y, R * 0.72); st(c, 'rgba(20,10,5,0.7)', 1.4);
}
export function book(c: C2D, x: number, y: number, w: number, h: number, col: string) {
  c.fillStyle = col; c.fillRect(x, y, w, h);
  c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(x, y, w, h * 0.2);
}
/** Closed book lying flat, seen from above. */
export function tome(c: C2D, x: number, y: number, w: number, h: number, rot: number, col: string) {
  at(c, x, y, rot, () => {
    shadow(c, true, 3, 1.5, 2, 0.45); rrect(c, -w / 2, -h / 2, w, h, 1.5); fs(c, col, 1.4); shadow(c, false);
    c.fillStyle = PAPER; c.fillRect(w / 2 - 2.2, -h / 2 + 1.5, 1.6, h - 3);
    line(c, -w / 2 + 2.5, -h / 2 + 1, -w / 2 + 2.5, h / 2 - 1, 'rgba(0,0,0,0.35)', 1);
    rrect(c, -w * 0.15, -h * 0.2, w * 0.35, h * 0.4, 1); st(c, 'rgba(255,220,140,0.6)', 0.8);
  });
}
/** Open book with text lines. */
export function openBook(c: C2D, x: number, y: number, w: number, rot: number, cover = '#6b2a1e') {
  const h = w * 0.68;
  at(c, x, y, rot, () => {
    shadow(c, true, 4, 2, 3, 0.45); rrect(c, -w / 2 - 2, -h / 2 - 2, w + 4, h + 4, 2); fs(c, cover, 1.4); shadow(c, false);
    for (const s of [-1, 1]) {
      c.beginPath(); c.moveTo(0, -h / 2); c.quadraticCurveTo(s * w * 0.25, -h / 2 - 3, s * w / 2, -h / 2 + 1); c.lineTo(s * w / 2, h / 2); c.quadraticCurveTo(s * w * 0.25, h / 2 - 3, 0, h / 2); c.closePath();
      fs(c, lin(c, 0, 0, s * w / 2, 0, [[0, '#cfc2a0'], [0.25, PAPER], [1, '#f6eed8']]), 1);
      for (let i = 0; i < 6; i++) { const yy = -h * 0.34 + i * h * 0.13; line(c, s * w * 0.08, yy, s * w * 0.42, yy, 'rgba(60,40,20,0.45)', 0.9); }
    }
    line(c, 0, -h / 2, 0, h / 2, 'rgba(60,40,20,0.6)', 1);
  });
}
export function scroll(c: C2D, x: number, y: number, L: number, rot: number, open = false) {
  at(c, x, y, rot, () => {
    if (open) {
      shadow(c, true, 3, 1.5, 2, 0.4); rect(c, -L / 2, -L * 0.35, L, L * 0.7); fs(c, PARCH, 1.2); shadow(c, false);
      for (let i = 0; i < 5; i++) line(c, -L * 0.38, -L * 0.22 + i * L * 0.11, L * 0.3, -L * 0.22 + i * L * 0.11, 'rgba(60,40,20,0.45)', 0.9);
      for (const s of [-1, 1]) { rrect(c, s * L / 2 - 3, -L * 0.4, 6, L * 0.8, 3); fs(c, '#c9b37a', 1.2); }
    } else {
      shadow(c, true, 3, 1.5, 2, 0.4); rrect(c, -L / 2, -3.5, L, 7, 3.5); fs(c, lin(c, 0, -3.5, 0, 3.5, [[0, '#f0e2b8'], [1, '#bfa66c']]), 1.2); shadow(c, false);
      rect(c, -2, -4, 4, 8); fs(c, '#8a2020', 0.8);
    }
  });
}
export function coin(c: C2D, x: number, y: number, R: number, col = GOLD) {
  circ(c, x, y, R); fs(c, radial(c, x, y, R, shade(col, 0.45), shade(col, -0.25), 0.4), Math.min(1, R * 0.3), shade(col, -0.6));
  circ(c, x, y, R * 0.6); st(c, `rgba(120,80,10,0.5)`, 0.6);
}
/** Faceted gem seen from above. */
export function gem(c: C2D, x: number, y: number, R: number, col: string, sides = 6, rot = 0) {
  const pts: number[] = [];
  for (let i = 0; i < sides; i++) { const a = rot + (i / sides) * TAU; pts.push(x + Math.cos(a) * R, y + Math.sin(a) * R); }
  poly(c, pts); fs(c, shade(col, -0.25), Math.min(1.2, R * 0.25));
  const inner: number[] = [];
  for (let i = 0; i < sides; i++) { const a = rot + (i / sides) * TAU; inner.push(x + Math.cos(a) * R * 0.5, y + Math.sin(a) * R * 0.5); }
  for (let i = 0; i < sides; i++) {
    const j = (i + 1) % sides;
    poly(c, [pts[i * 2], pts[i * 2 + 1], pts[j * 2], pts[j * 2 + 1], inner[j * 2], inner[j * 2 + 1], inner[i * 2], inner[i * 2 + 1]]);
    const mx = (pts[i * 2] + pts[j * 2]) / 2 - x, my = (pts[i * 2 + 1] + pts[j * 2 + 1]) / 2 - y;
    c.fillStyle = shade(col, ((-mx - my) / (R * 1.4)) * 0.45); c.fill();
  }
  poly(c, inner); c.fillStyle = shade(col, 0.3); c.fill();
  sparkle(c, x - R * 0.25, y - R * 0.25, R * 0.45);
}
/** Glass bottle seen from above (round body + neck + cork). */
export function bottle(c: C2D, x: number, y: number, R: number, col: string, cork = true) {
  shadow(c, true, 3, 1.5, 2, 0.45); circ(c, x, y, R); fs(c, radial(c, x, y, R, shade(col, 0.5), shade(col, -0.35), 0.35), 1.2); shadow(c, false);
  circ(c, x, y, R * 0.42); c.fillStyle = shade(col, -0.2); c.fill();
  if (cork) { circ(c, x, y, R * 0.3); fs(c, '#b48a5a', 0.8); }
  ell(c, x - R * 0.42, y - R * 0.42, R * 0.22, R * 0.12, -0.8); c.fillStyle = 'rgba(255,255,255,0.75)'; c.fill();
}
/** Flask with liquid and glow. rgb = "r,g,b" glow color. */
export function potion(c: C2D, x: number, y: number, R: number, col: string, rgb: string) {
  glow(c, x, y, R * 2.4, rgb, 0.35);
  bottle(c, x, y, R, col);
}
/** Clay jar / amphora / urn from above. */
export function jar(c: C2D, x: number, y: number, R: number, col = '#b06a3e', open = true) {
  shadow(c, true, 5, 2.5, 3.5, 0.5); circ(c, x, y, R); fs(c, ball(c, x, y, R, col, 0.3), 1.8); shadow(c, false);
  circ(c, x, y, R * 0.45); fs(c, shade(col, 0.1), 1.2);
  if (open) { circ(c, x, y, R * 0.32); c.fillStyle = '#1e120a'; c.fill(); }
  c.beginPath(); c.arc(x, y, R * 0.75, Math.PI * 1.05, Math.PI * 1.45); st(c, 'rgba(255,255,255,0.35)', 1.5);
}
export function candle(c: C2D, x: number, y: number, R = 3, col = '#f2ead6', lit = true) {
  circ(c, x, y, R); fs(c, radial(c, x, y, R, '#ffffff', col, 0.3), 0.9);
  if (lit) flame(c, x, y, R * 0.75);
}
export function skull(c: C2D, x: number, y: number, s: number, rot = 0, col = '#e8e0c8') {
  at(c, x, y, rot, () => {
    shadow(c, true, 3, 1.5, 2, 0.45);
    c.beginPath(); c.ellipse(0, -s * 0.12, s * 0.5, s * 0.46, 0, 0, TAU); fs(c, ball(c, 0, -s * 0.12, s * 0.5, col, 0.2), 1.2);
    shadow(c, false);
    rrect(c, -s * 0.28, s * 0.18, s * 0.56, s * 0.3, s * 0.08); fs(c, shade(col, -0.08), 1);
    for (const sx of [-1, 1]) { ell(c, sx * s * 0.19, -s * 0.06, s * 0.13, s * 0.15); c.fillStyle = '#241a12'; c.fill(); }
    poly(c, [0, s * 0.06, -s * 0.06, s * 0.17, s * 0.06, s * 0.17]); c.fillStyle = '#241a12'; c.fill();
    for (let i = -1; i <= 1; i++) line(c, i * s * 0.1, s * 0.22, i * s * 0.1, s * 0.44, 'rgba(40,30,20,0.6)', 0.8);
  });
}
export function bone(c: C2D, x: number, y: number, L: number, a: number, col = '#e8e0c8') {
  at(c, x, y, a, () => {
    line(c, -L / 2, 0, L / 2, 0, '#3a2f22', 6); line(c, -L / 2, 0, L / 2, 0, col, 4);
    for (const s of [-1, 1]) { circ(c, s * L / 2, -2.5, 3); c.fillStyle = col; c.fill(); circ(c, s * L / 2, 2.5, 3); c.fill(); }
  });
}
/** Cloth-covered rectangle with soft folds. */
export function cloth(c: C2D, r: Rng, x: number, y: number, w: number, h: number, col: string, rad = 3, lw = 1.5) {
  rrect(c, x, y, w, h, rad); fs(c, lin(c, x, y, x + w, y + h, [[0, shade(col, 0.15)], [1, shade(col, -0.15)]]), lw);
  clip(c, () => rrect(c, x, y, w, h, rad), () => {
    for (let i = 0; i < 4; i++) {
      const px = x + rrange(r, 0.1, 0.9) * w;
      c.beginPath(); c.moveTo(px, y); c.quadraticCurveTo(px + rrange(r, -w * 0.15, w * 0.15), y + h / 2, px + rrange(r, -w * 0.1, w * 0.1), y + h);
      st(c, `rgba(0,0,0,0.12)`, rrange(r, 2, 5));
      c.beginPath(); c.moveTo(px - 3, y); c.quadraticCurveTo(px - 3 + rrange(r, -w * 0.1, w * 0.1), y + h / 2, px - 3, y + h);
      st(c, `rgba(255,255,255,0.10)`, 2);
    }
  });
}
/** Rope coil seen from above. */
export function ropeCoil(c: C2D, x: number, y: number, R: number) {
  shadow(c, true, 4, 2, 3, 0.45); circ(c, x, y, R); fs(c, '#a88a58', 1.6); shadow(c, false);
  for (let k = 1; k < 5; k++) { circ(c, x, y, R * (1 - k * 0.18)); st(c, 'rgba(70,50,20,0.7)', 1.2); }
  circ(c, x, y, R * 0.18); c.fillStyle = '#3a2a14'; c.fill();
  for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU; line(c, x + Math.cos(a) * R * 0.85, y + Math.sin(a) * R * 0.85, x + Math.cos(a + 0.15) * R * 0.98, y + Math.sin(a + 0.15) * R * 0.98, 'rgba(70,50,20,0.5)', 0.8); }
}
/** Chain link line from (x0,y0) to (x1,y1). */
export function chain(c: C2D, x0: number, y0: number, x1: number, y1: number, s = 4, col = METAL) {
  const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.floor(L / (s * 1.6))), a = Math.atan2(y1 - y0, x1 - x0);
  for (let i = 0; i < n; i++) {
    const k = (i + 0.5) / n;
    at(c, x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, a, () => {
      ell(c, 0, 0, s, i % 2 ? s * 0.32 : s * 0.55); c.strokeStyle = INK; c.lineWidth = 2.6; c.stroke(); c.strokeStyle = col; c.lineWidth = 1.4; c.stroke();
    });
  }
}
/** Sword lying flat, pointing +x. */
export function sword(c: C2D, x: number, y: number, L: number, rot: number, hilt = GOLD, blade = METAL_L) {
  at(c, x, y, rot, () => {
    shadow(c, true, 3, 1.5, 2, 0.45);
    poly(c, [-L * 0.2, -L * 0.035, L * 0.45, -L * 0.035, L * 0.5, 0, L * 0.45, L * 0.035, -L * 0.2, L * 0.035]);
    fs(c, lin(c, 0, -L * 0.04, 0, L * 0.04, [[0, '#ffffff'], [0.5, blade], [1, shade(blade, -0.4)]]), 1.2);
    shadow(c, false);
    line(c, -L * 0.18, 0, L * 0.42, 0, 'rgba(0,0,0,0.25)', 0.8);
    rrect(c, -L * 0.24, -L * 0.12, L * 0.05, L * 0.24, 1.5); fs(c, hilt, 1.1);
    rrect(c, -L * 0.42, -L * 0.025, L * 0.19, L * 0.05, 1.5); fs(c, '#5a3a22', 1);
    circ(c, -L * 0.44, 0, L * 0.04); fs(c, hilt, 1);
  });
}
export function pick<T>(r: Rng, a: readonly T[]): T { return a[Math.floor(r() * a.length) % a.length]; }
export { shade, rrange };
