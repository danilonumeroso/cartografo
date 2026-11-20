import { CELL, Door, DoorKind, Label, MapDoc, Room, Stamp } from './model';
import type { MapRuntime } from './runtime';
import { STAMP_BY_ID, STAMP_PAD, VARIANTS } from './stamps';
import { ctx2d, makeCanvas, mulberry32, pick, rint, Rng, rrange, uid } from './util';
import { fbmTile, sampleWrap } from './noise';
import { t } from './i18n';
import { B, reset } from './genkit';
import { generateDungeon, PRESETS, seedPrefix } from './dungeon';

export type GenKind = 'dungeon' | 'cave' | 'forest' | 'tavern';
export const GEN_NAMES: Record<GenKind, string> = { dungeon: 'Dungeon', cave: t('Cave'), forest: t('Forest clearing'), tavern: t('Tavern') };

export function generate(rt: MapRuntime, kind: GenKind, seed = Date.now() % 100000) {
  if (kind === 'dungeon') { generateDungeon(rt, PRESETS.crypt, `${seedPrefix('crypt')}-${seed}`); return; }
  reset(rt.doc);
  rt.engine.masks.clear();
  const b = new B(rt, seed);
  if (kind === 'cave') cave(b);
  else if (kind === 'forest') forest(b);
  else tavern(b);
  for (const k of rt.engine.masks.keys()) rt.engine.changed.add(k);
  rt.fog.fillAll();
  rt.engine.invalidateAll();
}

// ------------------------------------------------------------------ cave
function cave(b: B) {
  const { doc, r, rt } = b;
  doc.bg = 'rock'; doc.caveFloor = 'cave'; doc.ambient = 0.6; doc.fogEnabled = true;
  const S = 2, gw = doc.cols * S, gh = doc.rows * S;
  let g = new Uint8Array(gw * gh);
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
    const edge = x < 2 || y < 2 || x >= gw - 2 || y >= gh - 2;
    g[y * gw + x] = edge || r() < 0.46 ? 1 : 0;
  }
  const wallsAround = (x: number, y: number) => {
    let n = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const X = x + dx, Y = y + dy;
      n += X < 0 || Y < 0 || X >= gw || Y >= gh ? 1 : g[Y * gw + X];
    }
    return n;
  };
  for (let it = 0; it < 5; it++) {
    const ng = new Uint8Array(gw * gh);
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
      const n = wallsAround(x, y);
      ng[y * gw + x] = n >= 5 || (it < 2 && n <= 1) ? 1 : 0;
      if (x < 1 || y < 1 || x >= gw - 1 || y >= gh - 1) ng[y * gw + x] = 1;
    }
    g = ng;
  }
  // keep the largest open region
  const comp = new Int32Array(gw * gh).fill(-1);
  let best = -1, bestSize = 0, id = 0;
  for (let i = 0; i < gw * gh; i++) {
    if (g[i] || comp[i] >= 0) continue;
    const st = [i]; comp[i] = id; let size = 0;
    while (st.length) {
      const k = st.pop()!; size++;
      const x = k % gw, y = (k / gw) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= gw || Y >= gh) continue;
        const j = Y * gw + X;
        if (!g[j] && comp[j] < 0) { comp[j] = id; st.push(j); }
      }
    }
    if (size > bestSize) { bestSize = size; best = id; }
    id++;
  }
  for (let i = 0; i < gw * gh; i++) g[i] = g[i] || comp[i] !== best ? 1 : 0;
  const small = makeCanvas(gw, gh);
  const sc = ctx2d(small);
  const img = sc.createImageData(gw, gh);
  for (let i = 0; i < gw * gh; i++) { img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = 255; img.data[i * 4 + 3] = g[i] ? 0 : 255; }
  sc.putImageData(img, 0, 0);
  const m = rt.engine.mask('cave', true)!;
  const mc = ctx2d(m);
  mc.imageSmoothingEnabled = true; mc.imageSmoothingQuality = 'high';
  mc.drawImage(small, 0, 0, m.width, m.height);
  const open: [number, number][] = [];
  for (let y = 1; y < gh - 1; y++) for (let x = 1; x < gw - 1; x++) if (!g[y * gw + x] && wallsAround(x, y) === 0) open.push([(x + 0.5) / S, (y + 0.5) / S]);
  const nearWall: [number, number][] = [];
  for (let y = 1; y < gh - 1; y++) for (let x = 1; x < gw - 1; x++) if (!g[y * gw + x] && wallsAround(x, y) >= 2 && wallsAround(x, y) <= 4) nearWall.push([(x + 0.5) / S, (y + 0.5) / S]);
  if (!open.length) return;
  const area = open.length / (S * S);
  for (let k = 0; k < Math.max(1, Math.round(area / 90)); k++) {
    const [x, y] = pick(r, open);
    for (let j = 0; j < 4; j++) b.paint('water', x + rrange(r, -0.8, 0.8), y + rrange(r, -0.8, 0.8), rrange(r, 0.7, 1.4), 0.2);
    b.paint('deep', x, y, 0.6, 0.2);
  }
  for (let k = 0; k < area / 12; k++) b.stamp(pick(r, ['stalagmite', 'stalagmite', 'rocks', 'boulder']), ...pick(r, nearWall), r() * 6.28, rrange(r, 0.7, 1.2));
  for (let k = 0; k < area / 40; k++) b.stamp(pick(r, ['crystals', 'glowshrooms', 'mushrooms']), ...pick(r, nearWall), r() * 6.28);
  for (let k = 0; k < area / 50; k++) b.stamp(pick(r, ['bones', 'rubble', 'puddle']), ...pick(r, open), r() * 6.28);
  for (let k = 0; k < area / 60; k++) b.paint('moss', ...pick(r, open), rrange(r, 0.8, 1.6), 0.1, 0.6);
  const [ex, ey] = open[0];
  b.label(t('Entrance'), ex, ey, 30);
}

// ------------------------------------------------------------------ forest
function noisePath(r: Rng, C: number, R: number, horizontal: boolean): [number, number][] {
  const pts: [number, number][] = [];
  const n = 24;
  let off = rrange(r, 0.35, 0.65) * (horizontal ? R : C);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    off += rrange(r, -0.9, 0.9);
    pts.push(horizontal ? [t * C, off] : [off, t * R]);
  }
  return pts;
}
function forest(b: B) {
  const { doc, r } = b;
  doc.bg = 'grass'; doc.ambient = 0; doc.fogEnabled = false;
  const C = doc.cols, R = doc.rows;
  const cx = C * rrange(r, 0.4, 0.6), cy = R * rrange(r, 0.4, 0.6), clr = Math.min(C, R) * 0.28;
  const N = fbmTile(256, 4, 4, Math.floor(r() * 9999));
  const density = (x: number, y: number) => {
    const d = Math.hypot((x - cx) / clr, (y - cy) / clr);
    return Math.max(0, Math.min(1, (d - 0.9) * 1.3)) * 0.8 + sampleWrap(N, 256, x * 8, y * 8) * 0.35 - 0.12;
  };
  for (let y = 0; y < R; y += 1.5) for (let x = 0; x < C; x += 1.5) if (density(x, y) > 0.45) b.paint('forest', x, y, 1.8, 0.1, 0.5);
  const path = noisePath(r, C, R, C >= R);
  b.stroke('dirt', path, 0.9, 0.3);
  const onPath = (x: number, y: number) => path.some(([px, py]) => Math.hypot(px - x, py - y) < 1.6);
  const stream = r() < 0.5 ? noisePath(r, C, R, C < R) : null;
  if (stream) b.stroke('water', stream, 0.7, 0.35);
  const onStream = (x: number, y: number) => !!stream && stream.some(([px, py]) => Math.hypot(px - x, py - y) < 1.4);
  const n = C * R * 0.5;
  for (let k = 0; k < n; k++) {
    const x = rrange(r, -0.5, C + 0.5), y = rrange(r, -0.5, R + 0.5);
    const d = density(x, y);
    if (r() > d || onPath(x, y) || onStream(x, y)) continue;
    const t = r();
    if (t < 0.12) b.stamp('tree_big', x, y, r() * 6.28, rrange(r, 0.8, 1.1));
    else if (t < 0.55) b.stamp(r() < 0.1 ? 'tree_autumn' : 'tree', x, y, r() * 6.28, rrange(r, 0.75, 1.2));
    else if (t < 0.8) b.stamp('pine', x, y, r() * 6.28, rrange(r, 0.8, 1.3));
    else b.stamp('bush', x, y, r() * 6.28, rrange(r, 0.7, 1.3));
    k += 3;
  }
  for (let k = 0; k < C * R * 0.02; k++) {
    const x = rrange(r, 0, C), y = rrange(r, 0, R);
    if (onPath(x, y) || onStream(x, y)) continue;
    b.stamp(pick(r, ['tallgrass', 'flowers', 'rocks', 'tallgrass', 'flowers', 'stump', 'log', 'bush']), x, y, r() * 6.28, rrange(r, 0.8, 1.2));
  }
  if (r() < 0.7) {
    b.stamp('campfire', cx, cy);
    b.stamp('log', cx - 1.3, cy, Math.PI / 2); b.stamp('log', cx + 1.3, cy, Math.PI / 2);
    b.stamp('tent', cx + 2.6, cy - 2, rrange(r, -0.4, 0.4)); b.stamp('tent', cx - 2.6, cy - 2.2, rrange(r, -0.4, 0.4));
    b.stamp('sacks', cx + 1.5, cy + 1.6); b.stamp('chest', cx - 1.6, cy + 1.6);
  } else {
    b.stamp('menhir', cx, cy - 2); b.stamp('menhir', cx + 2, cy); b.stamp('menhir', cx, cy + 2); b.stamp('menhir', cx - 2, cy);
    b.stamp('altar', cx, cy, 0, 0.8);
  }
}

// ------------------------------------------------------------------ tavern
function tavern(b: B) {
  const { doc, r } = b;
  doc.bg = 'grass'; doc.wallStyle = 'wood'; doc.ambient = 0.15; doc.fogEnabled = false;
  const C = doc.cols, R = doc.rows;
  const kw = C >= 16 ? 5 : 0;
  const hw = Math.max(4, Math.min(12, C - 4 - kw)), hh = Math.max(4, Math.min(8, R - 6));
  const x0 = Math.max(1, Math.floor((C - hw - kw) / 2)), y0 = Math.max(2, Math.min(Math.floor((R - hh) / 2) - 1, R - hh - 4));
  // street
  for (let x = -1; x <= C + 1; x += 0.6) b.paint('cobble', x, y0 + hh + 2.2, 1.6, 0.4, 0.8);
  b.room(x0, y0, hw, hh, 'wood', t('Common room'));
  if (kw) {
    b.room(x0 + hw, y0, kw, Math.ceil(hh / 2), 'flagstone', t('Kitchen'));
    b.room(x0 + hw, y0 + Math.ceil(hh / 2), kw, hh - Math.ceil(hh / 2), 'wood', t('Pantry'));
    // inner walls
    doc.walls.push({ id: uid(), pts: [(x0 + hw) * CELL, y0 * CELL, (x0 + hw) * CELL, (y0 + hh) * CELL], style: 'wood' });
    doc.walls.push({ id: uid(), pts: [(x0 + hw) * CELL, (y0 + Math.ceil(hh / 2)) * CELL, (x0 + hw + kw) * CELL, (y0 + Math.ceil(hh / 2)) * CELL], style: 'wood' });
    b.door(x0 + hw, y0 + 1.5, true);
    b.door(x0 + hw, y0 + hh - 1.5, true);
  }
  b.door(x0 + hw / 2, y0 + hh, false, 'double', 2);
  // common room
  b.stamp('counter', x0 + hw / 2, y0 + 1.3, 0, 1);
  for (let k = 0; k < 4; k++) b.stamp('barrel', x0 + hw / 2 - 1.2 + k * 0.8, y0 + 0.45);
  b.stamp('fireplace', x0 + 0.45, y0 + hh / 2, Math.PI / 2);
  b.stamp('rug', x0 + 2, y0 + hh / 2, Math.PI / 2, 0.8);
  const tables: [number, number][] = [];
  for (let ty = y0 + 3; ty < y0 + hh - 1; ty += 2.4) for (let tx = x0 + 3.2; tx < x0 + hw - 1; tx += 2.6) tables.push([tx, ty]);
  for (const [tx, ty] of tables) {
    if (r() < 0.5) {
      b.stamp('table_round', tx, ty, r() * 6.28, 0.9);
      for (let k = 0; k < 4; k++) { const a = (k / 4) * 6.28 + r() * 0.5; b.stamp('stool', tx + Math.cos(a) * 0.85, ty + Math.sin(a) * 0.85); }
    } else {
      b.stamp('table', tx, ty, 0, 0.9);
      b.stamp('bench', tx, ty - 0.7, 0, 0.8); b.stamp('bench', tx, ty + 0.7, 0, 0.8);
    }
    if (r() < 0.6) b.stamp('candles', tx + 0.3, ty, 0, 0.7);
  }
  const kx = x0 + hw;
  if (kw) {
    // kitchen
    b.stamp('fireplace', kx + kw / 2, y0 + 0.45, 0, 0.9);
    b.stamp('cauldron', kx + kw / 2, y0 + 1.4);
    b.stamp('table', kx + kw / 2, y0 + Math.ceil(hh / 2) - 0.8, 0, 0.9);
    b.stamp('barrels', kx + kw - 0.8, y0 + 1);
  }
  // pantry
  if (kw) for (let k = 0; k < 6; k++) b.stamp(pick(r, ['crate', 'barrel', 'sacks']), kx + 0.6 + rrange(r, 0, kw - 1.2), y0 + Math.ceil(hh / 2) + 0.6 + rrange(r, 0, hh - Math.ceil(hh / 2) - 1.2), r() * 6.28);
  // outside
  b.stamp('lamppost', x0 + hw / 2 - 2, y0 + hh + 1);
  b.stamp('lamppost', x0 + hw / 2 + 2, y0 + hh + 1);
  b.stamp('signpost', x0 + hw / 2 + 3, y0 + hh + 0.6);
  b.stamp('cart', x0 + hw + 3, y0 + hh + 2.4, Math.PI / 2);
  for (let k = 0; k < C * R * 0.05; k++) {
    const x = rrange(r, 0, C), y = rrange(r, 0, R);
    if (x > x0 - 1.5 && x < x0 + hw + kw + 1.5 && y > y0 - 1.5 && y < y0 + hh + 3.8) continue;
    b.stamp(pick(r, ['tree', 'bush', 'tallgrass', 'flowers', 'pine', 'rocks']), x, y, r() * 6.28, rrange(r, 0.8, 1.2));
  }
  b.label(t('The Jolly Barrel'), x0 + hw / 2, y0 - 0.8, 48, false).font = 'Pirata One';
}
