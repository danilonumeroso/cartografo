import { CELL } from './model';
import { ctx2d, makeCanvas, mulberry32, Rng, rrange, shade } from './util';
import { t } from './i18n';

type C2D = CanvasRenderingContext2D;
/** Draw function: origin at box center, units = world px. w/h = box size in world px. */
type Draw = (c: C2D, r: Rng, w: number, h: number) => void;

export interface StampDef {
  id: string; name: string; cat: string;
  w: number; h: number;           // size in grid cells
  layer: 0 | 1 | 2;               // 0 decal, 1 object, 2 canopy
  light?: { radius: number; color: string; intensity: number };
  draw: Draw;
}

export const CATEGORIES = ['furniture', 'dungeon', 'caves', 'outdoor', 'decor'] as const;
export const categoryName = (c: string) => ({ furniture: t('Furniture'), dungeon: t('Dungeon'), caves: t('Caves'), outdoor: t('Outdoor'), decor: t('Decorations') } as Record<string, string>)[c] || c;

const RES = 2;
export const STAMP_PAD = 16;
const INK = '#1c1510';
const WOOD = '#8a5a33', WOOD_L = '#a8743f', WOOD_D = '#5e3b1f';
const STONE = '#9a958c', STONE_L = '#bdb8ad', STONE_D = '#67635c';
const METAL = '#8d939a', METAL_D = '#4f555c', GOLD = '#d4af37';
const LEAF = '#4f8a33', LEAF_L = '#7cb34a', LEAF_D = '#2d5620';

// ---------------------------------------------------------------- helpers
function shadow(c: C2D, on: boolean, blur = 9, ox = 4, oy = 6, a = 0.5) {
  if (on) { c.shadowColor = `rgba(0,0,0,${a})`; c.shadowBlur = blur * RES; c.shadowOffsetX = ox * RES; c.shadowOffsetY = oy * RES; }
  else { c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetX = 0; c.shadowOffsetY = 0; }
}
function rrect(c: C2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath(); c.roundRect(x, y, w, h, r);
}
function circ(c: C2D, x: number, y: number, r: number) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); }
function fs(c: C2D, fill: string | CanvasGradient, lw = 2.2, ink = INK) {
  c.fillStyle = fill; c.fill();
  if (lw > 0) { c.save(); shadow(c, false); c.lineWidth = lw; c.strokeStyle = ink; c.lineJoin = 'round'; c.stroke(); c.restore(); }
}
function line(c: C2D, x0: number, y0: number, x1: number, y1: number, col: string, lw: number) {
  c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.stroke();
}
function radial(c: C2D, x: number, y: number, r: number, inner: string, outer: string, off = 0.3) {
  const g = c.createRadialGradient(x - r * off, y - r * off, r * 0.05, x, y, r);
  g.addColorStop(0, inner); g.addColorStop(1, outer);
  return g;
}
function woodPlanks(c: C2D, x: number, y: number, w: number, h: number, n: number, vertical = false) {
  c.save(); c.clip();
  for (let i = 1; i < n; i++) {
    if (vertical) line(c, x + (w * i) / n, y, x + (w * i) / n, y + h, 'rgba(40,20,5,0.45)', 1.2);
    else line(c, x, y + (h * i) / n, x + w, y + (h * i) / n, 'rgba(40,20,5,0.45)', 1.2);
  }
  c.restore();
}
function flame(c: C2D, x: number, y: number, s: number) {
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
function canopy(c: C2D, r: Rng, R: number, base = LEAF, light = LEAF_L, dark = LEAF_D, lobes = 8) {
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
function rockShape(c: C2D, r: Rng, R: number, n = 9) {
  c.beginPath();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, d = R * rrange(r, 0.72, 1);
    i ? c.lineTo(Math.cos(a) * d, Math.sin(a) * d) : c.moveTo(Math.cos(a) * d, Math.sin(a) * d);
  }
  c.closePath();
}
function rock(c: C2D, r: Rng, x: number, y: number, R: number, col = STONE) {
  c.save(); c.translate(x, y); c.rotate(r() * 6.28);
  shadow(c, true, 6, 3, 4, 0.5);
  rockShape(c, r, R);
  fs(c, radial(c, 0, 0, R, shade(col, 0.25), shade(col, -0.3), 0.45), 2);
  shadow(c, false);
  line(c, -R * 0.3, -R * 0.1, R * 0.2, R * 0.3, 'rgba(0,0,0,0.3)', 1.2);
  c.restore();
}
function barrelTop(c: C2D, x: number, y: number, R: number) {
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
function book(c: C2D, x: number, y: number, w: number, h: number, col: string) {
  c.fillStyle = col; c.fillRect(x, y, w, h);
  c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(x, y, w, h * 0.2);
}
const pick2 = <T,>(r: Rng, a: T[]) => a[Math.floor(r() * a.length) % a.length];
const CLOTH = ['#9b2c2c', '#2c4f9b', '#3f7a3a', '#7a3f8a', '#b07a2a'];

// ---------------------------------------------------------------- defs
export const STAMPS: StampDef[] = [
  // ------------------------------------------------ Arredi
  { id: 'table', name: t('Table'), cat: 'furniture', w: 2, h: 1, layer: 1, draw: (c, r, w, h) => {
    const W = w * 0.9, H = h * 0.8;
    shadow(c, true); rrect(c, -W / 2, -H / 2, W, H, 6); fs(c, WOOD);
    shadow(c, false); rrect(c, -W / 2, -H / 2, W, H, 6); woodPlanks(c, -W / 2, -H / 2, W, H, 4);
    rrect(c, -W / 2 + 4, -H / 2 + 4, W - 8, H - 8, 4); c.strokeStyle = 'rgba(255,220,170,0.25)'; c.lineWidth = 2; c.stroke();
    if (r() < 0.7) { circ(c, -W * 0.25, 0, 9); fs(c, '#d9d4c8', 1.5); circ(c, -W * 0.25, 0, 5); c.fillStyle = '#b9b2a2'; c.fill(); }
    if (r() < 0.6) { circ(c, W * 0.2, -4, 6); fs(c, '#8a6a3a', 1.5); circ(c, W * 0.2, -4, 3.5); c.fillStyle = '#d9a43a'; c.fill(); }
  } },
  { id: 'table_round', name: t('Round table'), cat: 'furniture', w: 1.5, h: 1.5, layer: 1, draw: (c, r, w) => {
    const R = w * 0.42;
    shadow(c, true); circ(c, 0, 0, R); fs(c, WOOD);
    shadow(c, false); circ(c, 0, 0, R); woodPlanks(c, -R, -R, R * 2, R * 2, 5, true);
    circ(c, 0, 0, R - 5); c.strokeStyle = 'rgba(255,220,170,0.25)'; c.lineWidth = 2; c.stroke();
    for (let i = 0; i < 3; i++) if (r() < 0.6) { const a = r() * 6.28; circ(c, Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5, 7); fs(c, '#d9d4c8', 1.5); }
  } },
  { id: 'chair', name: t('Chair'), cat: 'furniture', w: 0.6, h: 0.6, layer: 1, draw: (c, r, w) => {
    const s = w * 0.7;
    shadow(c, true, 5, 2, 3); rrect(c, -s / 2, -s / 2, s, s, 4); fs(c, WOOD_L, 2);
    shadow(c, false); rrect(c, -s / 2, -s / 2 - 2, s, s * 0.28, 3); fs(c, WOOD_D, 2);
  } },
  { id: 'stool', name: t('Stool'), cat: 'furniture', w: 0.45, h: 0.45, layer: 1, draw: (c, r, w) => {
    shadow(c, true, 4, 2, 3); circ(c, 0, 0, w * 0.34); fs(c, WOOD_L, 2);
    shadow(c, false); circ(c, 0, 0, w * 0.2); c.strokeStyle = 'rgba(60,30,10,0.4)'; c.lineWidth = 1.2; c.stroke();
  } },
  { id: 'bench', name: t('Bench'), cat: 'furniture', w: 2, h: 0.5, layer: 1, draw: (c, r, w, h) => {
    const W = w * 0.92, H = h * 0.6;
    shadow(c, true, 5, 2, 4); rrect(c, -W / 2, -H / 2, W, H, 3); fs(c, WOOD_L);
    shadow(c, false); rrect(c, -W / 2, -H / 2, W, H, 3); woodPlanks(c, -W / 2, -H / 2, W, H, 2);
  } },
  { id: 'bed', name: t('Bed'), cat: 'furniture', w: 1, h: 2, layer: 1, draw: (c, r, w, h) => {
    const W = w * 0.86, H = h * 0.92, col = CLOTH[Math.floor(r() * CLOTH.length)];
    shadow(c, true); rrect(c, -W / 2, -H / 2, W, H, 5); fs(c, WOOD_D);
    shadow(c, false);
    rrect(c, -W / 2 + 6, -H / 2 + 6, W - 12, H - 12, 4); fs(c, '#e8e2d2', 1.5);
    rrect(c, -W / 2 + 12, -H / 2 + 12, W - 24, H * 0.16, 8); fs(c, '#ffffff', 1.5);
    rrect(c, -W / 2 + 6, -H / 2 + H * 0.32, W - 12, H * 0.62, 4); fs(c, col, 1.5);
    line(c, -W / 2 + 6, -H / 2 + H * 0.36, W / 2 - 6, -H / 2 + H * 0.36, 'rgba(255,255,255,0.35)', 3);
    line(c, -W * 0.15, -H * 0.05, W * 0.2, H * 0.3, 'rgba(0,0,0,0.18)', 2);
  } },
  { id: 'bed_double', name: t('Double bed'), cat: 'furniture', w: 2, h: 2, layer: 1, draw: (c, r, w, h) => {
    const W = w * 0.88, H = h * 0.92, col = CLOTH[Math.floor(r() * CLOTH.length)];
    shadow(c, true); rrect(c, -W / 2, -H / 2, W, H, 6); fs(c, WOOD_D);
    shadow(c, false);
    rrect(c, -W / 2 + 7, -H / 2 + 7, W - 14, H - 14, 4); fs(c, '#e8e2d2', 1.5);
    for (const sx of [-1, 1]) { rrect(c, sx * W * 0.22 - W * 0.18, -H / 2 + 14, W * 0.36, H * 0.15, 8); fs(c, '#ffffff', 1.5); }
    rrect(c, -W / 2 + 7, -H / 2 + H * 0.32, W - 14, H * 0.62, 4); fs(c, col, 1.5);
    line(c, -W / 2 + 7, -H / 2 + H * 0.36, W / 2 - 7, -H / 2 + H * 0.36, 'rgba(255,255,255,0.35)', 3);
  } },
  { id: 'bookshelf', name: t('Bookshelf'), cat: 'furniture', w: 2, h: 0.5, layer: 1, draw: (c, r, w, h) => {
    const W = w * 0.95, H = h * 0.8;
    shadow(c, true, 6, 2, 4); rrect(c, -W / 2, -H / 2, W, H, 2); fs(c, WOOD_D);
    shadow(c, false);
    let x = -W / 2 + 5;
    while (x < W / 2 - 8) {
      const bw = rrange(r, 5, 10);
      book(c, x, -H / 2 + 5, bw - 1, H - 10, CLOTH[Math.floor(r() * CLOTH.length)]);
      x += bw;
    }
    rrect(c, -W / 2, -H / 2, W, H, 2); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
  } },
  { id: 'wardrobe', name: t('Wardrobe'), cat: 'furniture', w: 1.5, h: 0.7, layer: 1, draw: (c, r, w, h) => {
    const W = w * 0.92, H = h * 0.8;
    shadow(c, true); rrect(c, -W / 2, -H / 2, W, H, 3); fs(c, WOOD);
    shadow(c, false); rrect(c, -W / 2 + 6, -H / 2 + 6, W - 12, H - 12, 2); c.strokeStyle = 'rgba(40,20,5,0.5)'; c.lineWidth = 2; c.stroke();
    line(c, 0, -H / 2 + 6, 0, H / 2 - 6, 'rgba(40,20,5,0.5)', 2);
  } },
  { id: 'chest', name: t('Chest'), cat: 'furniture', w: 0.8, h: 0.55, layer: 1, draw: (c, r, w, h) => {
    const W = w * 0.9, H = h * 0.8;
    shadow(c, true, 6, 3, 4); rrect(c, -W / 2, -H / 2, W, H, 4); fs(c, WOOD);
    shadow(c, false);
    for (const k of [-0.3, 0.3]) { c.fillStyle = METAL_D; c.fillRect(k * W - 3, -H / 2, 6, H); }
    line(c, -W / 2, 0, W / 2, 0, 'rgba(30,15,5,0.6)', 2);
    rrect(c, -5, -6, 10, 12, 2); fs(c, GOLD, 1.5);
  } },
  { id: 'crate', name: t('Crate'), cat: 'furniture', w: 0.8, h: 0.8, layer: 1, draw: (c, r, w) => {
    const S = w * 0.86;
    shadow(c, true, 6, 3, 5); c.beginPath(); c.rect(-S / 2, -S / 2, S, S); fs(c, WOOD_L);
    shadow(c, false); c.beginPath(); c.rect(-S / 2, -S / 2, S, S); woodPlanks(c, -S / 2, -S / 2, S, S, 4);
    c.strokeStyle = WOOD_D; c.lineWidth = 5; c.strokeRect(-S / 2 + 3, -S / 2 + 3, S - 6, S - 6);
    line(c, -S / 2 + 4, -S / 2 + 4, S / 2 - 4, S / 2 - 4, WOOD_D, 5);
    c.beginPath(); c.rect(-S / 2, -S / 2, S, S); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
  } },
  { id: 'barrel', name: t('Barrel'), cat: 'furniture', w: 0.7, h: 0.7, layer: 1, draw: (c, r, w) => barrelTop(c, 0, 0, w * 0.4) },
  { id: 'barrels', name: t('Barrels'), cat: 'furniture', w: 1.5, h: 1.5, layer: 1, draw: (c, r, w) => {
    const R = w * 0.21;
    barrelTop(c, -R * 1.05, R * 0.7, R); barrelTop(c, R * 1.05, R * 0.7, R); barrelTop(c, 0, -R * 1.1, R);
  } },
  { id: 'sacks', name: t('Sacks'), cat: 'furniture', w: 1, h: 1, layer: 1, draw: (c, r, w) => {
    for (let i = 0; i < 3; i++) {
      const x = rrange(r, -w * 0.18, w * 0.18), y = rrange(r, -w * 0.18, w * 0.18), R = w * rrange(r, 0.2, 0.26);
      shadow(c, true, 6, 3, 4);
      c.beginPath(); c.ellipse(x, y, R, R * 0.8, r() * 3, 0, 7); fs(c, radial(c, x, y, R, '#d8c49a', '#a08654'), 2);
      shadow(c, false); circ(c, x, y - R * 0.5, 3); c.fillStyle = '#6e5634'; c.fill();
    }
  } },
  { id: 'counter', name: t('Counter'), cat: 'furniture', w: 3, h: 0.8, layer: 1, draw: (c, r, w, h) => {
    const W = w * 0.96, H = h * 0.75;
    shadow(c, true); rrect(c, -W / 2, -H / 2, W, H, 4); fs(c, WOOD_D);
    shadow(c, false); rrect(c, -W / 2 + 4, -H / 2 + 4, W - 8, H - 8, 3); fs(c, WOOD, 1.2);
    rrect(c, -W / 2 + 4, -H / 2 + 4, W - 8, H - 8, 3); woodPlanks(c, -W / 2, -H / 2, W, H, 3);
    for (let i = 0; i < 5; i++) {
      const x = rrange(r, -W * 0.42, W * 0.42);
      circ(c, x, rrange(r, -6, 6), rrange(r, 4, 6)); fs(c, ['#2f6b3a', '#6b2f2f', '#d9d4c8', '#8a6a3a'][i % 4], 1.4);
    }
  } },
  { id: 'fireplace', name: t('Fireplace'), cat: 'furniture', w: 2, h: 0.9, layer: 1, light: { radius: 5, color: '#ffb15a', intensity: 0.9 }, draw: (c, r, w, h) => {
    const W = w * 0.92, H = h * 0.82;
    shadow(c, true); c.beginPath(); c.rect(-W / 2, -H / 2, W, H); fs(c, STONE);
    shadow(c, false);
    for (let i = 0; i < 7; i++) { c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 1.5; c.strokeRect(-W / 2 + (i * W) / 7, -H / 2, W / 7, H / 2); }
    rrect(c, -W * 0.3, -H * 0.2, W * 0.6, H * 0.62, 6); fs(c, '#1e1712', 2);
    line(c, -W * 0.15, H * 0.15, W * 0.15, H * 0.05, WOOD_D, 6); line(c, -W * 0.12, H * 0.02, W * 0.14, H * 0.18, WOOD_D, 6);
    flame(c, 0, H * 0.08, 10);
  } },
  { id: 'cauldron', name: t('Cauldron'), cat: 'furniture', w: 0.9, h: 0.9, layer: 1, draw: (c, r, w) => {
    const R = w * 0.38;
    shadow(c, true); circ(c, 0, 0, R); fs(c, '#2a2a2e', 2.5);
    shadow(c, false); circ(c, 0, 0, R * 0.78); c.fillStyle = radial(c, 0, 0, R * 0.78, '#9be36a', '#3e7a2a', 0.1); c.fill();
    for (let i = 0; i < 4; i++) { circ(c, rrange(r, -R * 0.4, R * 0.4), rrange(r, -R * 0.4, R * 0.4), rrange(r, 2, 5)); c.strokeStyle = 'rgba(220,255,190,0.7)'; c.lineWidth = 1.2; c.stroke(); }
  } },
  { id: 'candles', name: t('Candelabra'), cat: 'furniture', w: 0.5, h: 0.5, layer: 1, light: { radius: 2.5, color: '#ffd38a', intensity: 0.7 }, draw: (c, r, w) => {
    shadow(c, true, 4, 2, 3); circ(c, 0, 0, w * 0.3); fs(c, GOLD, 1.8);
    shadow(c, false);
    for (let i = 0; i < 3; i++) { const a = (i / 3) * 6.28; circ(c, Math.cos(a) * 6, Math.sin(a) * 6, 3); c.fillStyle = '#f2ead6'; c.fill(); flame(c, Math.cos(a) * 6, Math.sin(a) * 6, 2.2); }
  } },
  { id: 'throne', name: t('Throne'), cat: 'furniture', w: 1.3, h: 1.3, layer: 1, draw: (c, r, w) => {
    const S = w * 0.8;
    shadow(c, true); rrect(c, -S / 2, -S / 2, S, S, 6); fs(c, GOLD);
    shadow(c, false);
    rrect(c, -S / 2 + 8, -S / 2 + 14, S - 16, S - 22, 5); fs(c, '#8a1f2a', 1.8);
    rrect(c, -S / 2, -S / 2, S, 14, 4); fs(c, shade(GOLD, -0.2), 1.8);
    for (const sx of [-1, 1]) { circ(c, sx * (S / 2 - 4), -S / 2 + 4, 6); fs(c, '#c0392b', 1.5); }
  } },
  { id: 'rug', name: t('Rug'), cat: 'furniture', w: 3, h: 2, layer: 0, draw: (c, r, w, h) => {
    const W = w * 0.92, H = h * 0.86, col = pick2(r, ['#8a1f2a', '#1f3f7a', '#5a2a6a', '#6a4a1a']);
    rrect(c, -W / 2, -H / 2, W, H, 4); fs(c, col, 2);
    rrect(c, -W / 2 + 10, -H / 2 + 10, W - 20, H - 20, 3); c.strokeStyle = GOLD; c.lineWidth = 4; c.stroke();
    rrect(c, -W / 2 + 18, -H / 2 + 18, W - 36, H - 36, 3); c.strokeStyle = 'rgba(255,230,180,0.5)'; c.lineWidth = 1.5; c.stroke();
    c.beginPath(); c.ellipse(0, 0, W * 0.18, H * 0.22, 0, 0, 7); c.strokeStyle = GOLD; c.lineWidth = 3; c.stroke();
    for (let x = -W / 2 + 4; x < W / 2; x += 6) for (const s of [-1, 1]) line(c, x, s * H / 2, x, s * (H / 2 + 6), '#d8c49a', 1.5);
  } },
  // ------------------------------------------------ Dungeon
  { id: 'pillar', name: t('Pillar'), cat: 'dungeon', w: 1, h: 1, layer: 1, draw: (c, r, w) => {
    const R = w * 0.38;
    shadow(c, true, 12, 6, 8, 0.6); c.beginPath(); c.rect(-R * 1.05, -R * 1.05, R * 2.1, R * 2.1); fs(c, STONE_D);
    shadow(c, false);
    circ(c, 0, 0, R); fs(c, radial(c, 0, 0, R, STONE_L, STONE_D, 0.35));
    for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.28; line(c, Math.cos(a) * R * 0.55, Math.sin(a) * R * 0.55, Math.cos(a) * R * 0.95, Math.sin(a) * R * 0.95, 'rgba(0,0,0,0.25)', 1.5); }
  } },
  { id: 'pillar_round', name: t('Round pillar'), cat: 'dungeon', w: 0.8, h: 0.8, layer: 1, draw: (c, r, w) => {
    const R = w * 0.4;
    shadow(c, true, 10, 5, 7, 0.6); circ(c, 0, 0, R); fs(c, radial(c, 0, 0, R, STONE_L, STONE_D, 0.35));
    shadow(c, false); circ(c, 0, 0, R * 0.7); c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 1.5; c.stroke();
  } },
  { id: 'statue', name: t('Statue'), cat: 'dungeon', w: 1, h: 1, layer: 1, draw: (c, r, w) => {
    const S = w * 0.84;
    shadow(c, true, 10, 5, 7); c.beginPath(); c.rect(-S / 2, -S / 2, S, S); fs(c, STONE_D);
    shadow(c, false); c.beginPath(); c.rect(-S / 2 + 6, -S / 2 + 6, S - 12, S - 12); fs(c, STONE, 1.5);
    shadow(c, true, 6, 3, 4);
    c.beginPath(); c.ellipse(0, 4, S * 0.32, S * 0.18, 0, 0, 7); fs(c, radial(c, 0, 4, S * 0.32, STONE_L, STONE_D), 2);
    circ(c, 0, -2, S * 0.13); fs(c, radial(c, 0, -2, S * 0.13, '#e0dcd2', STONE), 2);
    shadow(c, false);
  } },
  { id: 'altar', name: t('Altar'), cat: 'dungeon', w: 2, h: 1, layer: 1, light: { radius: 3, color: '#ffd38a', intensity: 0.6 }, draw: (c, r, w, h) => {
    const W = w * 0.9, H = h * 0.8;
    shadow(c, true); c.beginPath(); c.rect(-W / 2, -H / 2, W, H); fs(c, STONE);
    shadow(c, false);
    c.beginPath(); c.rect(-W * 0.3, -H / 2, W * 0.6, H); fs(c, '#7a1f2a', 1.5);
    line(c, -W * 0.3 + 4, -H / 2, -W * 0.3 + 4, H / 2, GOLD, 2); line(c, W * 0.3 - 4, -H / 2, W * 0.3 - 4, H / 2, GOLD, 2);
    for (const sx of [-0.4, 0.4]) { circ(c, sx * W, 0, 4); c.fillStyle = '#f2ead6'; c.fill(); flame(c, sx * W, 0, 3); }
    rrect(c, -10, -10, 20, 20, 3); fs(c, GOLD, 1.5);
  } },
  { id: 'sarcophagus', name: t('Sarcophagus'), cat: 'dungeon', w: 1, h: 2, layer: 1, draw: (c, r, w, h) => {
    const W = w * 0.78, H = h * 0.9;
    shadow(c, true);
    c.beginPath(); c.moveTo(-W / 2, -H / 2 + 12); c.lineTo(-W / 2 + 12, -H / 2); c.lineTo(W / 2 - 12, -H / 2); c.lineTo(W / 2, -H / 2 + 12);
    c.lineTo(W / 2 - 6, H / 2); c.lineTo(-W / 2 + 6, H / 2); c.closePath(); fs(c, STONE);
    shadow(c, false);
    c.beginPath(); c.ellipse(0, -H * 0.3, W * 0.16, W * 0.18, 0, 0, 7); c.strokeStyle = 'rgba(0,0,0,0.4)'; c.lineWidth = 2; c.stroke();
    c.beginPath(); c.moveTo(-W * 0.25, -H * 0.15); c.lineTo(-W * 0.18, H * 0.38); c.lineTo(W * 0.18, H * 0.38); c.lineTo(W * 0.25, -H * 0.15); c.closePath(); c.stroke();
    line(c, 0, -H * 0.1, 0, H * 0.2, 'rgba(0,0,0,0.4)', 2); line(c, -W * 0.12, 0, W * 0.12, 0, 'rgba(0,0,0,0.4)', 2);
  } },
  { id: 'brazier', name: t('Brazier'), cat: 'dungeon', w: 0.8, h: 0.8, layer: 1, light: { radius: 5, color: '#ffa94d', intensity: 0.9 }, draw: (c, r, w) => {
    const R = w * 0.34;
    shadow(c, true, 8, 3, 5); circ(c, 0, 0, R); fs(c, METAL_D, 2.5);
    shadow(c, false); circ(c, 0, 0, R * 0.75); c.fillStyle = '#2a1a10'; c.fill();
    for (let i = 0; i < 6; i++) { circ(c, rrange(r, -R * 0.4, R * 0.4), rrange(r, -R * 0.4, R * 0.4), 3); c.fillStyle = '#ff6a1a'; c.fill(); }
    flame(c, 0, 0, R * 0.55);
  } },
  { id: 'torch', name: t('Torch'), cat: 'dungeon', w: 0.4, h: 0.4, layer: 1, light: { radius: 4, color: '#ffae5a', intensity: 0.85 }, draw: (c, r, w) => {
    line(c, 0, w * 0.3, 0, -w * 0.05, WOOD_D, 6); line(c, 0, w * 0.3, 0, -w * 0.05, WOOD, 3);
    flame(c, 0, -w * 0.12, 7);
  } },
  { id: 'stairs', name: t('Stairs'), cat: 'dungeon', w: 1, h: 2, layer: 1, draw: (c, r, w, h) => {
    const W = w * 0.96, H = h * 0.96, n = 8;
    c.beginPath(); c.rect(-W / 2, -H / 2, W, H); fs(c, STONE_D);
    for (let i = 0; i < n; i++) {
      const y = -H / 2 + (H * i) / n, k = i / n;
      c.fillStyle = shade(STONE, -k * 0.75); c.fillRect(-W / 2, y, W, H / n);
      line(c, -W / 2, y, W / 2, y, 'rgba(0,0,0,0.6)', 2);
      line(c, -W / 2, y + 2, W / 2, y + 2, `rgba(255,255,255,${0.2 * (1 - k)})`, 1.5);
    }
    c.beginPath(); c.rect(-W / 2, -H / 2, W, H); c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke();
  } },
  { id: 'trapdoor', name: t('Trapdoor'), cat: 'dungeon', w: 1, h: 1, layer: 0, draw: (c, r, w) => {
    const S = w * 0.8;
    c.beginPath(); c.rect(-S / 2, -S / 2, S, S); fs(c, WOOD_D);
    c.beginPath(); c.rect(-S / 2, -S / 2, S, S); woodPlanks(c, -S / 2, -S / 2, S, S, 4, true);
    for (const y of [-S * 0.3, S * 0.3]) { c.fillStyle = METAL_D; c.fillRect(-S / 2, y - 3, S, 6); }
    circ(c, S * 0.25, 0, 6); c.strokeStyle = METAL; c.lineWidth = 2.5; c.stroke();
  } },
  { id: 'cage', name: t('Cage'), cat: 'dungeon', w: 1, h: 1, layer: 1, draw: (c, r, w) => {
    const S = w * 0.86;
    shadow(c, true, 6, 3, 4); c.beginPath(); c.rect(-S / 2, -S / 2, S, S); c.strokeStyle = METAL_D; c.lineWidth = 6; c.stroke();
    shadow(c, false);
    for (let i = 1; i < 6; i++) { const x = -S / 2 + (S * i) / 6; line(c, x, -S / 2, x, S / 2, METAL, 2.5); line(c, -S / 2, x, S / 2, x, METAL, 2.5); }
  } },
  { id: 'well', name: t('Well'), cat: 'dungeon', w: 1.3, h: 1.3, layer: 1, draw: (c, r, w) => {
    const R = w * 0.4;
    shadow(c, true); circ(c, 0, 0, R); fs(c, STONE);
    shadow(c, false);
    for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.28; line(c, Math.cos(a) * R * 0.65, Math.sin(a) * R * 0.65, Math.cos(a) * R, Math.sin(a) * R, 'rgba(0,0,0,0.4)', 1.5); }
    circ(c, 0, 0, R * 0.65); fs(c, radial(c, 0, 0, R * 0.65, '#0a1a24', '#020608', -0.2), 2);
    line(c, -R * 1.1, 0, R * 1.1, 0, WOOD_D, 7); line(c, -R * 1.1, 0, R * 1.1, 0, WOOD, 4);
  } },
  { id: 'fountain', name: t('Fountain'), cat: 'dungeon', w: 2, h: 2, layer: 1, draw: (c, r, w) => {
    const R = w * 0.44;
    shadow(c, true); circ(c, 0, 0, R); fs(c, STONE_L);
    shadow(c, false); circ(c, 0, 0, R * 0.82); fs(c, radial(c, 0, 0, R * 0.82, '#6fc3d6', '#2a7a96', 0), 2);
    for (let k = 1; k < 4; k++) { circ(c, 0, 0, R * 0.2 * k + 6); c.strokeStyle = 'rgba(220,250,255,0.35)'; c.lineWidth = 1.5; c.stroke(); }
    circ(c, 0, 0, R * 0.2); fs(c, radial(c, 0, 0, R * 0.2, STONE_L, STONE_D), 2);
  } },
  { id: 'pentagram', name: t('Ritual circle'), cat: 'dungeon', w: 2, h: 2, layer: 0, draw: (c, r, w) => {
    const R = w * 0.44;
    c.strokeStyle = 'rgba(160,20,30,0.85)'; c.lineWidth = 3;
    circ(c, 0, 0, R); c.stroke(); circ(c, 0, 0, R * 0.9); c.stroke();
    c.beginPath();
    for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + (i * 2 * Math.PI * 2) / 5; const x = Math.cos(a) * R * 0.9, y = Math.sin(a) * R * 0.9; i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke();
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5; circ(c, Math.cos(a) * R, Math.sin(a) * R, 5); c.fillStyle = '#f2ead6'; c.fill(); }
  } },
  { id: 'bones', name: t('Bones'), cat: 'decor', w: 1, h: 1, layer: 0, draw: (c, r, w) => {
    const bone = (x: number, y: number, L: number, a: number) => {
      c.save(); c.translate(x, y); c.rotate(a);
      line(c, -L / 2, 0, L / 2, 0, '#3a2f22', 6); line(c, -L / 2, 0, L / 2, 0, '#e8e0c8', 4);
      for (const s of [-1, 1]) { circ(c, s * L / 2, -2.5, 3); c.fillStyle = '#e8e0c8'; c.fill(); circ(c, s * L / 2, 2.5, 3); c.fill(); }
      c.restore();
    };
    for (let i = 0; i < 5; i++) bone(rrange(r, -w * 0.3, w * 0.3), rrange(r, -w * 0.3, w * 0.3), rrange(r, 14, 26), r() * 6.28);
    if (r() < 0.8) { const x = rrange(r, -w * 0.15, w * 0.15), y = rrange(r, -w * 0.15, w * 0.15); circ(c, x, y, 9); fs(c, '#e8e0c8', 1.8); circ(c, x - 3, y - 1, 2.2); c.fillStyle = INK; c.fill(); circ(c, x + 3, y - 1, 2.2); c.fill(); }
  } },
  { id: 'cobweb', name: t('Cobweb'), cat: 'decor', w: 1, h: 1, layer: 0, draw: (c, r, w) => {
    const o = -w / 2, L = w;
    c.strokeStyle = 'rgba(240,240,240,0.55)'; c.lineWidth = 1.2;
    const rays = 6;
    for (let i = 0; i <= rays; i++) { const a = (i / rays) * Math.PI / 2; line(c, o, o, o + Math.cos(a) * L, o + Math.sin(a) * L, 'rgba(240,240,240,0.55)', 1.2); }
    for (let k = 1; k <= 5; k++) {
      c.beginPath();
      for (let i = 0; i <= rays; i++) { const a = (i / rays) * Math.PI / 2, d = (L * k) / 5.5; const x = o + Math.cos(a) * d, y = o + Math.sin(a) * d; i ? c.quadraticCurveTo(o + Math.cos(a - 0.13) * d * 0.9, o + Math.sin(a - 0.13) * d * 0.9, x, y) : c.moveTo(x, y); }
      c.stroke();
    }
  } },
  { id: 'rubble', name: t('Rubble'), cat: 'decor', w: 1.5, h: 1.5, layer: 0, draw: (c, r, w) => {
    for (let i = 0; i < 14; i++) rock(c, r, rrange(r, -w * 0.35, w * 0.35), rrange(r, -w * 0.35, w * 0.35), rrange(r, 4, 12), STONE);
  } },
  { id: 'blood', name: t('Blood'), cat: 'decor', w: 1, h: 1, layer: 0, draw: (c, r, w) => {
    c.fillStyle = 'rgba(110,10,15,0.8)';
    c.beginPath(); c.ellipse(0, 0, w * 0.22, w * 0.18, r() * 3, 0, 7); c.fill();
    for (let i = 0; i < 12; i++) { const a = r() * 6.28, d = rrange(r, w * 0.15, w * 0.42); circ(c, Math.cos(a) * d, Math.sin(a) * d, rrange(r, 1.5, 5)); c.fill(); }
  } },
  { id: 'trap', name: t('Trap'), cat: 'dungeon', w: 1, h: 1, layer: 0, draw: (c, r, w) => {
    const S = w * 0.7;
    c.beginPath(); c.rect(-S / 2, -S / 2, S, S); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.55)'; c.lineWidth = 2; c.stroke();
    c.beginPath(); c.rect(-S / 2 + 5, -S / 2 + 5, S - 10, S - 10); c.strokeStyle = 'rgba(255,255,255,0.12)'; c.stroke();
  } },
  // ------------------------------------------------ Caverne
  { id: 'stalagmite', name: 'Stalagmite', cat: 'caves', w: 0.9, h: 0.9, layer: 1, draw: (c, r, w) => {
    const R = w * 0.4;
    shadow(c, true, 10, 5, 7, 0.6);
    rockShape(c, r, R, 11); fs(c, radial(c, 0, 0, R, '#a99c8c', '#4e443b', 0.2), 2);
    shadow(c, false);
    for (const k of [0.7, 0.45, 0.22]) { rockShape(c, r, R * k, 9); c.fillStyle = `rgba(255,245,230,${0.12 + (0.7 - k) * 0.25})`; c.fill(); }
  } },
  { id: 'boulder', name: t('Boulder'), cat: 'caves', w: 1.2, h: 1.2, layer: 1, draw: (c, r, w) => rock(c, r, 0, 0, w * 0.4, '#8b8176') },
  { id: 'rocks', name: t('Rocks'), cat: 'caves', w: 1, h: 1, layer: 1, draw: (c, r, w) => {
    for (let i = 0; i < 4; i++) rock(c, r, rrange(r, -w * 0.25, w * 0.25), rrange(r, -w * 0.25, w * 0.25), rrange(r, 7, 16), '#8b8176');
  } },
  { id: 'crystals', name: t('Crystals'), cat: 'caves', w: 1, h: 1, layer: 1, light: { radius: 3, color: '#b28cff', intensity: 0.7 }, draw: (c, r, w) => {
    const g = c.createRadialGradient(0, 0, 0, 0, 0, w * 0.5); g.addColorStop(0, 'rgba(190,150,255,0.45)'); g.addColorStop(1, 'rgba(190,150,255,0)');
    c.fillStyle = g; circ(c, 0, 0, w * 0.5); c.fill();
    for (let i = 0; i < 6; i++) {
      const a = r() * 6.28, L = rrange(r, 14, 30), Wd = rrange(r, 5, 9);
      c.save(); c.rotate(a); c.translate(rrange(r, 0, 8), 0);
      shadow(c, true, 4, 2, 3);
      c.beginPath(); c.moveTo(0, -Wd); c.lineTo(L * 0.75, -Wd); c.lineTo(L, 0); c.lineTo(L * 0.75, Wd); c.lineTo(0, Wd); c.closePath();
      fs(c, i % 2 ? '#9a6cf0' : '#c3a6ff', 1.6);
      shadow(c, false); line(c, 0, 0, L, 0, 'rgba(255,255,255,0.6)', 1.5);
      c.restore();
    }
  } },
  { id: 'mushrooms', name: t('Mushrooms'), cat: 'caves', w: 1, h: 1, layer: 1, draw: (c, r, w) => {
    for (let i = 0; i < 6; i++) {
      const x = rrange(r, -w * 0.3, w * 0.3), y = rrange(r, -w * 0.3, w * 0.3), R = rrange(r, 5, 12);
      shadow(c, true, 4, 2, 3); circ(c, x, y, R); fs(c, radial(c, x, y, R, '#e8a0a0', '#9a3a3a'), 1.8);
      shadow(c, false);
      for (let k = 0; k < 3; k++) { circ(c, x + rrange(r, -R * 0.5, R * 0.5), y + rrange(r, -R * 0.5, R * 0.5), R * 0.15); c.fillStyle = '#fff2e0'; c.fill(); }
    }
  } },
  { id: 'glowshrooms', name: t('Glowing mushrooms'), cat: 'caves', w: 1, h: 1, layer: 1, light: { radius: 2.5, color: '#6affd8', intensity: 0.65 }, draw: (c, r, w) => {
    const g = c.createRadialGradient(0, 0, 0, 0, 0, w * 0.5); g.addColorStop(0, 'rgba(100,255,220,0.35)'); g.addColorStop(1, 'rgba(100,255,220,0)');
    c.fillStyle = g; circ(c, 0, 0, w * 0.5); c.fill();
    for (let i = 0; i < 7; i++) {
      const x = rrange(r, -w * 0.3, w * 0.3), y = rrange(r, -w * 0.3, w * 0.3), R = rrange(r, 4, 10);
      circ(c, x, y, R); fs(c, radial(c, x, y, R, '#d6fff4', '#2fb59a'), 1.6);
    }
  } },
  // ------------------------------------------------ Esterni
  { id: 'tree', name: t('Tree'), cat: 'outdoor', w: 2, h: 2, layer: 2, draw: (c, r, w) => canopy(c, r, w * 0.42) },
  { id: 'tree_big', name: t('Large tree'), cat: 'outdoor', w: 3, h: 3, layer: 2, draw: (c, r, w) => canopy(c, r, w * 0.43, '#4a8030', '#76a845', '#2a4f1d', 10) },
  { id: 'tree_autumn', name: t('Autumn tree'), cat: 'outdoor', w: 2, h: 2, layer: 2, draw: (c, r, w) => canopy(c, r, w * 0.42, '#c26a2a', '#e8a040', '#7a3a1a') },
  { id: 'pine', name: t('Pine'), cat: 'outdoor', w: 1.6, h: 1.6, layer: 2, draw: (c, r, w) => {
    const R = w * 0.44;
    const star = (rad: number, n: number, col: string, rot: number) => {
      c.beginPath();
      for (let i = 0; i < n * 2; i++) { const a = rot + (i / (n * 2)) * Math.PI * 2, d = i % 2 ? rad * 0.62 : rad * rrange(r, 0.92, 1); i ? c.lineTo(Math.cos(a) * d, Math.sin(a) * d) : c.moveTo(Math.cos(a) * d, Math.sin(a) * d); }
      c.closePath(); fs(c, col, 2);
    };
    shadow(c, true, 12, 7, 9, 0.55); star(R, 11, '#24452a', 0); shadow(c, false);
    star(R * 0.74, 10, '#2f5a33', 0.3); star(R * 0.5, 9, '#3d7040', 0.1); star(R * 0.26, 7, '#4f8a4c', 0.5);
  } },
  { id: 'bush', name: t('Bush'), cat: 'outdoor', w: 1, h: 1, layer: 1, draw: (c, r, w) => canopy(c, r, w * 0.38, '#5a8f36', '#86b955', '#33601f', 6) },
  { id: 'stump', name: t('Stump'), cat: 'outdoor', w: 0.8, h: 0.8, layer: 1, draw: (c, r, w) => {
    const R = w * 0.34;
    shadow(c, true, 6, 3, 4); rockShape(c, r, R, 10); fs(c, WOOD_D, 2.2);
    shadow(c, false); circ(c, 0, 0, R * 0.78); c.fillStyle = '#c99a62'; c.fill();
    for (let k = 1; k < 4; k++) { circ(c, 0, 0, R * 0.2 * k); c.strokeStyle = 'rgba(90,50,20,0.55)'; c.lineWidth = 1.2; c.stroke(); }
  } },
  { id: 'log', name: t('Log'), cat: 'outdoor', w: 2, h: 0.6, layer: 1, draw: (c, r, w, h) => {
    const W = w * 0.86, H = h * 0.62;
    shadow(c, true, 7, 3, 5); rrect(c, -W / 2, -H / 2, W, H, H / 2); fs(c, WOOD_D);
    shadow(c, false);
    for (let i = 0; i < 4; i++) line(c, -W * 0.4, rrange(r, -H * 0.3, H * 0.3), W * 0.35, rrange(r, -H * 0.3, H * 0.3), 'rgba(20,10,0,0.4)', 1.5);
    c.beginPath(); c.ellipse(W / 2 - H * 0.3, 0, H * 0.3, H / 2, 0, 0, 7); fs(c, '#c99a62', 2);
    c.beginPath(); c.ellipse(W / 2 - H * 0.3, 0, H * 0.15, H * 0.25, 0, 0, 7); c.strokeStyle = 'rgba(90,50,20,0.55)'; c.lineWidth = 1.2; c.stroke();
  } },
  { id: 'campfire', name: t('Campfire'), cat: 'outdoor', w: 1, h: 1, layer: 1, light: { radius: 6, color: '#ffa04a', intensity: 1 }, draw: (c, r, w) => {
    const R = w * 0.38;
    for (let i = 0; i < 9; i++) { const a = (i / 9) * 6.28; rock(c, r, Math.cos(a) * R, Math.sin(a) * R, 7, '#8a8378'); }
    circ(c, 0, 0, R * 0.75); c.fillStyle = '#2a1a10'; c.fill();
    for (let i = 0; i < 3; i++) { const a = (i / 3) * 3.14; line(c, Math.cos(a) * R * 0.6, Math.sin(a) * R * 0.6, -Math.cos(a) * R * 0.6, -Math.sin(a) * R * 0.6, WOOD_D, 6); }
    flame(c, 0, 0, R * 0.5);
  } },
  { id: 'tent', name: t('Tent'), cat: 'outdoor', w: 2, h: 2, layer: 1, draw: (c, r, w) => {
    const S = w * 0.8, col = r() < 0.5 ? '#c9b48a' : '#8a6a4a';
    shadow(c, true, 12, 6, 8);
    c.beginPath(); c.moveTo(-S / 2, -S / 2); c.lineTo(S / 2, -S / 2); c.lineTo(S / 2, S / 2); c.lineTo(-S / 2, S / 2); c.closePath(); fs(c, col);
    shadow(c, false);
    c.beginPath(); c.moveTo(-S / 2, -S / 2); c.lineTo(0, -S / 2); c.lineTo(0, S / 2); c.lineTo(-S / 2, S / 2); c.closePath(); c.fillStyle = 'rgba(255,255,255,0.15)'; c.fill();
    line(c, 0, -S / 2 - 4, 0, S / 2 + 4, INK, 2.5);
    c.beginPath(); c.moveTo(-S * 0.12, S / 2); c.lineTo(0, S * 0.3); c.lineTo(S * 0.12, S / 2); c.closePath(); c.fillStyle = 'rgba(0,0,0,0.45)'; c.fill();
  } },
  { id: 'cart', name: t('Cart'), cat: 'outdoor', w: 1.5, h: 2.5, layer: 1, draw: (c, r, w, h) => {
    const W = w * 0.62, H = h * 0.6;
    shadow(c, true);
    for (const sx of [-1, 1]) for (const sy of [-0.3, 0.3]) { rrect(c, sx * (W / 2 + 2) - 4, sy * H - 12, 8, 24, 3); fs(c, WOOD_D, 1.5); }
    c.beginPath(); c.rect(-W / 2, -H / 2, W, H); fs(c, WOOD);
    shadow(c, false); c.beginPath(); c.rect(-W / 2, -H / 2, W, H); woodPlanks(c, -W / 2, -H / 2, W, H, 4, true);
    line(c, -W * 0.25, -H / 2, -W * 0.15, -h * 0.48, WOOD_D, 5); line(c, W * 0.25, -H / 2, W * 0.15, -h * 0.48, WOOD_D, 5);
  } },
  { id: 'fence', name: t('Fence'), cat: 'outdoor', w: 2, h: 0.3, layer: 1, draw: (c, r, w) => {
    const W = w * 0.98;
    shadow(c, true, 4, 2, 3);
    line(c, -W / 2, -3, W / 2, -3, WOOD_D, 6); line(c, -W / 2, 4, W / 2, 4, WOOD_D, 6);
    line(c, -W / 2, -3, W / 2, -3, WOOD_L, 3.5); line(c, -W / 2, 4, W / 2, 4, WOOD_L, 3.5);
    shadow(c, false);
    for (let i = 0; i <= 4; i++) { const x = -W / 2 + (W * i) / 4; c.beginPath(); c.rect(x - 4, -7, 8, 14); fs(c, WOOD, 1.5); }
  } },
  { id: 'signpost', name: t('Signpost'), cat: 'outdoor', w: 0.8, h: 0.5, layer: 1, draw: (c, r, w, h) => {
    shadow(c, true, 4, 2, 3); rrect(c, -w * 0.38, -h * 0.25, w * 0.76, h * 0.5, 3); fs(c, WOOD_L, 2);
    shadow(c, false); circ(c, 0, 0, 4); fs(c, WOOD_D, 1.5);
  } },
  { id: 'gravestone', name: t('Gravestone'), cat: 'outdoor', w: 0.7, h: 0.5, layer: 1, draw: (c, r, w, h) => {
    shadow(c, true, 5, 3, 4); rrect(c, -w * 0.3, -h * 0.3, w * 0.6, h * 0.6, [12, 12, 2, 2] as any); fs(c, STONE);
    shadow(c, false); line(c, -w * 0.15, 0, w * 0.15, 0, 'rgba(0,0,0,0.4)', 2);
  } },
  { id: 'menhir', name: 'Menhir', cat: 'outdoor', w: 1, h: 1, layer: 1, draw: (c, r, w) => {
    c.save(); c.scale(1, 0.7); rock(c, r, 0, 0, w * 0.36, '#9a9488'); c.restore();
    c.strokeStyle = 'rgba(80,140,255,0.5)'; c.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(rrange(r, -8, 8), rrange(r, -6, 6), rrange(r, 3, 6), 0, 4); c.stroke(); }
  } },
  { id: 'lamppost', name: t('Lamppost'), cat: 'outdoor', w: 0.5, h: 0.5, layer: 1, light: { radius: 4, color: '#ffd38a', intensity: 0.8 }, draw: (c, r, w) => {
    shadow(c, true, 4, 2, 3); c.beginPath(); c.rect(-w * 0.2, -w * 0.2, w * 0.4, w * 0.4); fs(c, METAL_D, 2);
    shadow(c, false); c.beginPath(); c.rect(-w * 0.11, -w * 0.11, w * 0.22, w * 0.22); c.fillStyle = '#ffe9a8'; c.fill();
    flame(c, 0, 0, 3);
  } },
  { id: 'boat', name: t('Boat'), cat: 'outdoor', w: 1.2, h: 2.6, layer: 1, draw: (c, r, w, h) => {
    const W = w * 0.7, H = h * 0.9;
    shadow(c, true, 10, 5, 7);
    c.beginPath(); c.moveTo(0, -H / 2); c.bezierCurveTo(W * 0.6, -H * 0.3, W / 2, H * 0.35, W * 0.35, H / 2); c.lineTo(-W * 0.35, H / 2); c.bezierCurveTo(-W / 2, H * 0.35, -W * 0.6, -H * 0.3, 0, -H / 2); c.closePath();
    fs(c, WOOD_D, 2.5);
    shadow(c, false);
    c.beginPath(); c.moveTo(0, -H / 2 + 10); c.bezierCurveTo(W * 0.45, -H * 0.28, W * 0.38, H * 0.33, W * 0.26, H / 2 - 6); c.lineTo(-W * 0.26, H / 2 - 6); c.bezierCurveTo(-W * 0.38, H * 0.33, -W * 0.45, -H * 0.28, 0, -H / 2 + 10); c.closePath();
    c.fillStyle = WOOD; c.fill();
    for (const y of [-H * 0.1, H * 0.2]) line(c, -W * 0.38, y, W * 0.38, y, WOOD_D, 6);
  } },
  { id: 'tallgrass', name: t('Tall grass'), cat: 'decor', w: 1, h: 1, layer: 0, draw: (c, r, w) => {
    for (let i = 0; i < 9; i++) {
      const x = rrange(r, -w * 0.35, w * 0.35), y = rrange(r, -w * 0.35, w * 0.35);
      for (let k = 0; k < 7; k++) {
        const a = -Math.PI / 2 + rrange(r, -0.9, 0.9), L = rrange(r, 8, 16);
        line(c, x, y, x + Math.cos(a) * L, y + Math.sin(a) * L, k % 2 ? '#3d6a22' : '#8cbf55', 2);
      }
    }
  } },
  { id: 'flowers', name: t('Flowers'), cat: 'decor', w: 1, h: 1, layer: 0, draw: (c, r, w) => {
    const cols = ['#f4d35e', '#ee6c9c', '#ffffff', '#9b7ddb', '#ff8c42'];
    for (let i = 0; i < 16; i++) {
      const x = rrange(r, -w * 0.4, w * 0.4), y = rrange(r, -w * 0.4, w * 0.4), col = cols[Math.floor(r() * cols.length)];
      for (let p = 0; p < 5; p++) { const a = (p / 5) * 6.28; circ(c, x + Math.cos(a) * 2.6, y + Math.sin(a) * 2.6, 2.2); c.fillStyle = col; c.fill(); }
      circ(c, x, y, 1.6); c.fillStyle = '#c9851a'; c.fill();
    }
  } },
  { id: 'puddle', name: t('Puddle'), cat: 'decor', w: 1.2, h: 1, layer: 0, draw: (c, r, w, h) => {
    rockShape(c, r, w * 0.38, 12); c.save(); c.scale(1, h / w);
    c.fillStyle = 'rgba(40,90,120,0.55)'; c.fill(); c.strokeStyle = 'rgba(20,30,30,0.4)'; c.lineWidth = 2; c.stroke(); c.restore();
    line(c, -w * 0.15, -h * 0.1, w * 0.05, -h * 0.15, 'rgba(255,255,255,0.4)', 2);
  } },
];
export const STAMP_BY_ID = new Map(STAMPS.map((s) => [s.id, s]));

// ---------------------------------------------------------------- cache
const cache = new Map<string, HTMLCanvasElement>();
export const VARIANTS = 4;

export function stampImage(id: string, variant: number): HTMLCanvasElement | null {
  const def = STAMP_BY_ID.get(id);
  if (!def) return null;
  const key = id + '|' + (variant % VARIANTS);
  let cv = cache.get(key);
  if (!cv) {
    const w = def.w * CELL, h = def.h * CELL;
    cv = makeCanvas((w + STAMP_PAD * 2) * RES, (h + STAMP_PAD * 2) * RES);
    const c = ctx2d(cv);
    c.scale(RES, RES);
    c.translate(STAMP_PAD + w / 2, STAMP_PAD + h / 2);
    c.lineJoin = 'round'; c.lineCap = 'round';
    def.draw(c, mulberry32((variant % VARIANTS) * 7919 + id.length * 131 + 1), w, h);
    cache.set(key, cv);
  }
  return cv;
}

export function stampThumb(id: string, size = 56): string {
  const img = stampImage(id, 0)!;
  const c = makeCanvas(size, size);
  const x = ctx2d(c);
  const k = Math.min(size / img.width, size / img.height) * 0.95;
  x.drawImage(img, (size - img.width * k) / 2, (size - img.height * k) / 2, img.width * k, img.height * k);
  return c.toDataURL();
}
