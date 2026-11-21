import type { Building, RoofStyle } from './model';
import { mulberry32, shade } from './util';

type C2D = CanvasRenderingContext2D;

export const ROOF_COLORS: Record<RoofStyle, string[]> = {
  tile: ['#a8482e', '#b8583a', '#9a4030', '#b0603e', '#8a3a28'],
  slate: ['#4a525e', '#565e6a', '#3e4652'],
  thatch: ['#c8a050', '#b8903e', '#d0aa5e'],
  wood: ['#7a5a3a', '#6a4a2e', '#8a6644'],
  copper: ['#5a9a8a', '#4e8a7a'],
};
/** Light comes from the upper left, as on every other map. */
const LIGHT: [number, number] = [-0.7071, -0.7071];

function seedOf(id: string) { let h = 2166136261; for (const c of id) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
export function roofColor(b: Building) { const list = ROOF_COLORS[b.roof] ?? ROOF_COLORS.tile; return b.color ?? list[seedOf(b.id) % list.length]; }

/** Corners of a building's footprint in world coordinates. */
export function buildingCorners(b: Building): [number, number][] {
  const c = Math.cos(b.rot), s = Math.sin(b.rot), hw = b.w / 2, hh = b.h / 2;
  return ([[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]] as const).map(([x, y]) => [b.x + x * c - y * s, b.y + x * s + y * c] as [number, number]);
}
export function inBuilding(b: Building, x: number, y: number) {
  const c = Math.cos(-b.rot), s = Math.sin(-b.rot), lx = (x - b.x) * c - (y - b.y) * s, ly = (x - b.x) * s + (y - b.y) * c;
  return Math.abs(lx) <= b.w / 2 && Math.abs(ly) <= b.h / 2;
}

/** Hip roof of a w×h rectangle centred at the origin, faces shaded by their direction. */
function hipRoof(ctx: C2D, w: number, h: number, col: string, rot: number, style: RoofStyle, r: () => number) {
  const long = w >= h, ridge = Math.abs(w - h) / 2;
  const hw = w / 2, hh = h / 2;
  // faces with their outward normals in local space
  const faces: [number[], [number, number]][] = long ? [
    [[-hw, -hh, hw, -hh, ridge, 0, -ridge, 0], [0, -1]],
    [[-hw, hh, hw, hh, ridge, 0, -ridge, 0], [0, 1]],
    [[-hw, -hh, -hw, hh, -ridge, 0], [-1, 0]],
    [[hw, -hh, hw, hh, ridge, 0], [1, 0]],
  ] : [
    [[-hw, -hh, -hw, hh, 0, ridge, 0, -ridge], [-1, 0]],
    [[hw, -hh, hw, hh, 0, ridge, 0, -ridge], [1, 0]],
    [[-hw, -hh, hw, -hh, 0, -ridge], [0, -1]],
    [[-hw, hh, hw, hh, 0, ridge], [0, 1]],
  ];
  const c = Math.cos(rot), s = Math.sin(rot);
  for (const [pts, [nx, ny]] of faces) {
    const wx = nx * c - ny * s, wy = nx * s + ny * c, lit = wx * LIGHT[0] + wy * LIGHT[1];
    ctx.beginPath();
    for (let i = 0; i < pts.length; i += 2) i ? ctx.lineTo(pts[i], pts[i + 1]) : ctx.moveTo(pts[i], pts[i + 1]);
    ctx.closePath();
    ctx.fillStyle = shade(col, lit * 0.22);
    ctx.fill();
    // courses parallel to the eave
    ctx.save(); ctx.clip();
    const step = style === 'thatch' ? 3 : style === 'slate' ? 5 : 6;
    ctx.strokeStyle = style === 'thatch' ? 'rgba(90,60,20,0.22)' : 'rgba(0,0,0,0.2)'; ctx.lineWidth = style === 'thatch' ? 0.8 : 1;
    ctx.beginPath();
    for (let d = step; d < Math.max(hw, hh); d += step) {
      if (nx) { const x = nx * (hw - d); ctx.moveTo(x, -hh); ctx.lineTo(x, hh); } else { const y = ny * (hh - d); ctx.moveTo(-hw, y); ctx.lineTo(hw, y); }
    }
    ctx.stroke();
    if (style === 'tile' || style === 'wood') {
      ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath();
      for (let k = -Math.max(hw, hh); k < Math.max(hw, hh); k += 7) { if (nx) { ctx.moveTo(-hw, k); ctx.lineTo(hw, k); } else { ctx.moveTo(k, -hh); ctx.lineTo(k, hh); } }
      ctx.stroke();
    }
    ctx.restore();
  }
  // ridge and hips
  ctx.strokeStyle = shade(col, -0.45); ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  ctx.beginPath();
  if (long) { ctx.moveTo(-ridge, 0); ctx.lineTo(ridge, 0); for (const sx of [-1, 1]) for (const sy of [-1, 1]) { ctx.moveTo(sx * ridge, 0); ctx.lineTo(sx * hw, sy * hh); } }
  else { ctx.moveTo(0, -ridge); ctx.lineTo(0, ridge); for (const sx of [-1, 1]) for (const sy of [-1, 1]) { ctx.moveTo(0, sy * ridge); ctx.lineTo(sx * hw, sy * hh); } }
  ctx.stroke();
  // a chimney on some houses
  if (r() < 0.45 && Math.min(w, h) > 40) {
    const cx = (r() - 0.5) * w * 0.5, cy = (r() - 0.5) * h * 0.4, cs = Math.min(w, h) * 0.14;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(cx - cs / 2 + 3, cy - cs / 2 + 3, cs, cs);
    ctx.fillStyle = '#8a5a44'; ctx.fillRect(cx - cs / 2, cy - cs / 2, cs, cs);
    ctx.fillStyle = '#2a1a10'; ctx.fillRect(cx - cs / 4, cy - cs / 4, cs / 2, cs / 2);
    ctx.strokeStyle = '#1c1510'; ctx.lineWidth = 1.2; ctx.strokeRect(cx - cs / 2, cy - cs / 2, cs, cs);
  }
}

/** Conical roof for round towers. */
function coneRoof(ctx: C2D, R: number, col: string) {
  const n = 12;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, m = (a0 + a1) / 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a0) * R, Math.sin(a0) * R); ctx.lineTo(Math.cos(a1) * R, Math.sin(a1) * R); ctx.closePath();
    ctx.fillStyle = shade(col, (Math.cos(m) * LIGHT[0] + Math.sin(m) * LIGHT[1]) * 0.28); ctx.fill();
  }
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.strokeStyle = '#1c1510'; ctx.lineWidth = 2.2; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, R * 0.16, 0, Math.PI * 2); ctx.fillStyle = '#d4af37'; ctx.fill();
}

/** Flat crenellated stone roof for keeps. */
function keepRoof(ctx: C2D, w: number, h: number) {
  ctx.fillStyle = '#8e897e'; ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = '#6e695e'; ctx.fillRect(-w / 2 + 8, -h / 2 + 8, w - 16, h - 16);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
  for (let x = -w / 2 + 8; x < w / 2 - 8; x += 14) { ctx.beginPath(); ctx.moveTo(x, -h / 2 + 8); ctx.lineTo(x, h / 2 - 8); ctx.stroke(); }
  ctx.fillStyle = '#b8b2a6';
  for (let x = -w / 2; x < w / 2 - 4; x += 10) { ctx.fillRect(x, -h / 2, 6, 6); ctx.fillRect(x, h / 2 - 6, 6, 6); }
  for (let y = -h / 2; y < h / 2 - 4; y += 10) { ctx.fillRect(-w / 2, y, 6, 6); ctx.fillRect(w / 2 - 6, y, 6, 6); }
  ctx.strokeStyle = '#1c1510'; ctx.lineWidth = 2.4; ctx.strokeRect(-w / 2, -h / 2, w, h);
}

export function drawBuilding(ctx: C2D, b: Building) {
  const r = mulberry32(seedOf(b.id));
  const col = roofColor(b);
  ctx.save();
  ctx.translate(b.x, b.y);
  // cast shadow: the roof outline pushed down-right
  ctx.save(); ctx.translate(7, 9); ctx.rotate(b.rot);
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  if (b.kind === 'tower') { ctx.beginPath(); ctx.arc(0, 0, b.w / 2, 0, Math.PI * 2); ctx.fill(); } else ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
  ctx.restore();
  ctx.rotate(b.rot);
  if (b.kind === 'tower') coneRoof(ctx, b.w / 2, col);
  else if (b.kind === 'keep') keepRoof(ctx, b.w, b.h);
  else {
    hipRoof(ctx, b.w, b.h, col, b.rot, b.roof, r);
    ctx.strokeStyle = '#1c1510'; ctx.lineWidth = 2.2; ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h);
    if (b.kind === 'temple') {
      // bell tower at one end
      const s = Math.min(b.w, b.h) * 0.42, x = (b.w >= b.h ? b.w / 2 - s * 0.7 : 0), y = (b.w >= b.h ? 0 : b.h / 2 - s * 0.7);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x - s / 2 + 4, y - s / 2 + 5, s, s);
      ctx.save(); ctx.translate(x, y); hipRoof(ctx, s, s, shade(col, -0.1), b.rot, b.roof, r); ctx.restore();
      ctx.strokeStyle = '#1c1510'; ctx.lineWidth = 2; ctx.strokeRect(x - s / 2, y - s / 2, s, s);
      ctx.beginPath(); ctx.arc(x, y, s * 0.12, 0, Math.PI * 2); ctx.fillStyle = '#d4af37'; ctx.fill();
    }
    if (b.kind === 'tavern' || b.kind === 'shop') {
      // a hanging sign on the long side facing the street
      const long = b.w >= b.h, sx = long ? 0 : b.w / 2 + 5, sy = long ? b.h / 2 + 5 : 0;
      ctx.fillStyle = b.kind === 'tavern' ? '#d4af37' : '#c8c0b0';
      ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#1c1510'; ctx.lineWidth = 1.4; ctx.stroke();
    }
  }
  ctx.restore();
}

/** Every building that may touch the visible rectangle. */
export function drawBuildings(ctx: C2D, list: Building[], vis: { x: number; y: number; w: number; h: number }) {
  for (const b of list) {
    const R = Math.max(b.w, b.h) * 0.75 + 12;
    if (b.x + R < vis.x || b.x - R > vis.x + vis.w || b.y + R < vis.y || b.y - R > vis.y + vis.h) continue;
    drawBuilding(ctx, b);
  }
}
