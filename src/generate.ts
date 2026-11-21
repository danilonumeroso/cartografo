import { CELL, Door, DoorKind, Label, MapDoc, Room, Stamp } from './model';
import type { MapRuntime } from './runtime';
import { STAMP_BY_ID, STAMP_PAD, VARIANTS } from './stamps';
import { ctx2d, makeCanvas, mulberry32, pick, rint, Rng, rrange, uid } from './util';
import { fbmTile, sampleWrap } from './noise';
import { t } from './i18n';
import { B, reset, tavernName } from './genkit';
import { generateDungeon, PRESETS, seedPrefix } from './dungeon';

export type GenKind = 'dungeon' | 'cave' | 'forest' | 'tavern' | 'winter';
export const GEN_NAMES: Record<GenKind, string> = { dungeon: 'Dungeon', cave: t('Cave'), forest: t('Forest clearing'), tavern: t('Tavern'), winter: t('Winter forest') };

export function generate(rt: MapRuntime, kind: GenKind, seed = Date.now() % 100000) {
  if (kind === 'dungeon') { generateDungeon(rt, PRESETS.crypt, `${seedPrefix('crypt')}-${seed}`); return; }
  reset(rt.doc);
  rt.doc.weather = kind === 'winter' ? 'snow' : 'none';
  rt.engine.masks.clear();
  const b = new B(rt, seed);
  if (kind === 'cave') cave(b);
  else if (kind === 'forest') forest(b);
  else if (kind === 'winter') winter(b);
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
  const crystal = pick(r, ['crystals_blue', 'crystals_red', 'crystals_green', 'crystals']);
  for (let k = 0; k < area / 12; k++) b.stamp(pick(r, ['stalagmite', 'stalagmite', 'stalagmites', 'rocks', 'boulder']), ...pick(r, nearWall), r() * 6.28, rrange(r, 0.7, 1.2));
  for (let k = 0; k < area / 40; k++) b.stamp(pick(r, [crystal, 'glowshrooms', 'mushrooms', 'geode']), ...pick(r, nearWall), r() * 6.28);
  for (let k = 0; k < area / 50; k++) b.stamp(pick(r, ['bones', 'rubble', 'puddle', 'cave_moss', 'glowmoss', 'skulls']), ...pick(r, open), r() * 6.28);
  for (let k = 0; k < area / 160; k++) b.stamp(pick(r, ['cave_column', 'giant_mushroom', 'bear_den', 'ore_vein']), ...pick(r, open), r() * 6.28);
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
    if (t < 0.03) b.stamp('oak_giant', x, y, r() * 6.28, rrange(r, 0.8, 1));
    else if (t < 0.12) b.stamp('tree_big', x, y, r() * 6.28, rrange(r, 0.8, 1.1));
    else if (t < 0.55) b.stamp(pick(r, ['tree', 'tree', 'tree', 'birch', r() < 0.3 ? 'tree_autumn' : 'tree', 'fruit_tree']), x, y, r() * 6.28, rrange(r, 0.75, 1.2));
    else if (t < 0.8) b.stamp(r() < 0.2 ? 'cypress' : 'pine', x, y, r() * 6.28, rrange(r, 0.8, 1.3));
    else b.stamp(pick(r, ['bush', 'bush', 'berry_bush', 'fern', 'flower_bush']), x, y, r() * 6.28, rrange(r, 0.7, 1.3));
    k += 3;
  }
  for (let k = 0; k < C * R * 0.02; k++) {
    const x = rrange(r, 0, C), y = rrange(r, 0, R);
    if (onPath(x, y) || onStream(x, y)) continue;
    b.stamp(pick(r, ['tallgrass', 'flowers', 'rocks', 'wildflowers', 'fern', 'stump', 'log', 'mossy_log', 'mushrooms', 'fallen_leaves', 'grass_tufts', 'mossy_boulder']), x, y, r() * 6.28, rrange(r, 0.8, 1.2));
  }
  if (stream) for (let k = 0; k < stream.length; k += 3) {
    const [sx, sy] = stream[k];
    b.stamp(pick(r, ['reeds', 'river_stones', 'lily_pads', 'reeds']), sx + rrange(r, -1, 1), sy + rrange(r, -1, 1), r() * 6.28, rrange(r, 0.7, 1));
  }
  if (r() < 0.7) {
    b.stamp('campfire', cx, cy);
    b.stamp('log', cx - 1.3, cy, Math.PI / 2); b.stamp('log', cx + 1.3, cy, Math.PI / 2);
    b.stamp('tent', cx + 2.6, cy - 2, rrange(r, -0.4, 0.4)); b.stamp('tent', cx - 2.6, cy - 2.2, rrange(r, -0.4, 0.4));
    b.stamp('sacks', cx + 1.5, cy + 1.6); b.stamp('chest', cx - 1.6, cy + 1.6);
    b.stamp('bedroll', cx + 0.4, cy + 2.4, Math.PI / 2 + rrange(r, -0.3, 0.3)); b.stamp('firewood', cx - 2.6, cy + 0.4, Math.PI / 2);
  } else if (r() < 0.5) {
    b.stamp('stone_circle', cx, cy);
    b.stamp('fairy_ring', cx + 3.5, cy + 2.5, 0, 0.8);
  } else {
    b.stamp('menhir', cx, cy - 2); b.stamp('menhir', cx + 2, cy); b.stamp('menhir', cx, cy + 2); b.stamp('menhir', cx - 2, cy);
    b.stamp('altar', cx, cy, 0, 0.8);
  }
}

// ------------------------------------------------------------------ winter
function winter(b: B) {
  const { doc, r } = b;
  doc.bg = 'snow'; doc.ambient = 0.25; doc.fogEnabled = false;
  const C = doc.cols, R = doc.rows;
  const cx = C * rrange(r, 0.42, 0.58), cy = R * rrange(r, 0.42, 0.58), clr = Math.min(C, R) * 0.3;
  const N = fbmTile(256, 4, 4, Math.floor(r() * 9999));
  const density = (x: number, y: number) => {
    const d = Math.hypot((x - cx) / clr, (y - cy) / clr);
    return Math.max(0, Math.min(1, (d - 0.9) * 1.3)) * 0.8 + sampleWrap(N, 256, x * 8, y * 8) * 0.35 - 0.12;
  };
  const path = noisePath(r, C, R, C >= R);
  b.stroke('gravel', path, 0.75, 0.25);
  for (let k = 0; k < path.length; k += 2) b.paint('snowcover', path[k][0] + rrange(r, -0.4, 0.4), path[k][1] + rrange(r, -0.4, 0.4), rrange(r, 0.3, 0.6), 0.1, 0.5);
  const onPath = (x: number, y: number) => path.some(([px, py]) => Math.hypot(px - x, py - y) < 1.5);
  const stream = r() < 0.6 ? noisePath(r, C, R, C < R) : null;
  if (stream) b.stroke('ice', stream, 0.8, 0.35);
  const onStream = (x: number, y: number) => !!stream && stream.some(([px, py]) => Math.hypot(px - x, py - y) < 1.4);
  const n = C * R * 0.5;
  for (let k = 0; k < n; k++) {
    const x = rrange(r, -0.5, C + 0.5), y = rrange(r, -0.5, R + 0.5);
    if (r() > density(x, y) || onPath(x, y) || onStream(x, y)) continue;
    const t = r();
    if (t < 0.6) b.stamp('snowy_pine', x, y, r() * 6.28, rrange(r, 0.8, 1.3));
    else if (t < 0.75) b.stamp('pine', x, y, r() * 6.28, rrange(r, 0.8, 1.2));
    else if (t < 0.85) b.stamp('dead_tree', x, y, r() * 6.28, rrange(r, 0.7, 1));
    else b.stamp(pick(r, ['holly_bush', 'snow_drift', 'rocks']), x, y, r() * 6.28, rrange(r, 0.8, 1.2));
    k += 3;
  }
  for (let k = 0; k < C * R * 0.015; k++) {
    const x = rrange(r, 0, C), y = rrange(r, 0, R);
    if (onPath(x, y) || onStream(x, y) || Math.hypot(x - cx, y - cy) < 4) continue;
    b.stamp(pick(r, ['snow_drift', 'snowballs', 'rocks', 'ice_spikes', 'firewood', 'paw_prints']), x, y, r() * 6.28, rrange(r, 0.8, 1.1));
  }
  if (r() < 0.65) {
    // a festive camp around a decorated tree
    b.stamp('xmas_tree', cx, cy - 0.5);
    b.stamp('presents', cx + 1.4, cy + 0.6, r() * 6.28); b.stamp('presents', cx - 1.3, cy + 0.8, r() * 6.28, 0.8);
    b.stamp('campfire', cx, cy + 2.6);
    b.stamp('log', cx - 1.4, cy + 2.6, Math.PI / 2); b.stamp('log', cx + 1.4, cy + 2.6, Math.PI / 2);
    b.stamp('snowman', cx + 3, cy - 1.5, rrange(r, -0.3, 0.3)); b.stamp('sled', cx - 3, cy + 1.5, rrange(r, -0.6, 0.6));
    b.stamp('winter_lantern', cx - 2.2, cy - 1.8); b.stamp('winter_lantern', cx + 2.2, cy + 3.6);
    b.stamp('hot_cocoa', cx + 0.6, cy + 3.5, r() * 6.28);
  } else {
    b.stamp('frozen_pond', cx, cy, r() * 6.28);
    b.stamp('snowman', cx + 2.8, cy + 1.8, rrange(r, -0.3, 0.3)); b.stamp('snowman', cx - 2.6, cy - 1.6, rrange(r, -0.3, 0.3), 0.8);
    b.stamp('sled', cx - 2.8, cy + 2, rrange(r, -0.6, 0.6)); b.stamp('snowballs', cx + 2, cy - 2.2);
    b.stamp('winter_lantern', cx, cy - 2.6);
  }
}

// ------------------------------------------------------------------ tavern
function tavern(b: B) {
  const { doc, r } = b;
  const C = doc.cols, R = doc.rows;
  // ---- look: every seed has its own materials, season and time of day
  const wall = pick(r, ['wood', 'wood', 'stone', 'brick'] as const);
  const hallFloor = wall === 'wood' ? pick(r, ['wood', 'wornplanks', 'parquet']) : pick(r, ['wornplanks', 'flagstone', 'wood']);
  const season = pick(r, ['summer', 'summer', 'autumn', 'pines'] as const);
  const night = r() < 0.3;
  doc.bg = season === 'autumn' && r() < 0.5 ? 'leaves' : r() < 0.25 ? 'meadow' : 'grass';
  doc.wallStyle = wall; doc.ambient = night ? 0.55 : 0.15; doc.fogEnabled = false;
  // ---- the plan is drawn with the street below the inn and the kitchen on its right; mirroring puts
  // the street above and/or the kitchen on the left
  const fx = r() < 0.5, fy = r() < 0.35;
  const P = (x: number, y: number): [number, number] => [fx ? C - x : x, fy ? R - y : y];
  const rect = (x: number, y: number, w: number, h: number): [number, number, number, number] => [fx ? C - x - w : x, fy ? R - y - h : y, w, h];
  const rot = (a: number) => { if (fx) a = -a; if (fy) a = Math.PI - a; return a; };
  const stamp = (type: string, x: number, y: number, a = 0, scale = 1) => { const [X, Y] = P(x, y); return b.stamp(type, X, Y, rot(a), scale); };
  const room = (x: number, y: number, w: number, h: number, floor: string, name: string) => { const [X, Y] = rect(x, y, w, h); return b.room(X, Y, w, h, floor, name); };
  const door = (x: number, y: number, vertical: boolean, kind?: DoorKind, width = 1) => { const [X, Y] = P(x, y); return b.door(X, Y, vertical, kind, width); };
  const wallSeg = (x1: number, y1: number, x2: number, y2: number) => {
    const [a1, b1] = P(x1, y1), [a2, b2] = P(x2, y2);
    doc.walls.push({ id: uid(), pts: [a1 * CELL, b1 * CELL, a2 * CELL, b2 * CELL], style: wall });
  };

  // ---- sizes: common room, kitchen wing, optional row of guest rooms at the back
  const kw = C >= 16 ? rint(r, 4, 6) : 0;
  const hw = Math.max(4, Math.min(rint(r, 8, 13), C - 4 - kw)), hh = Math.max(4, Math.min(rint(r, 6, 9), R - 7));
  const guest = R >= 16 && r() < 0.55 ? 3 : 0; // depth of the guest wing
  const total = hw + kw;
  const x0 = Math.max(1, Math.min(C - total - 1, Math.round((C - total) / 2 + rrange(r, -0.2, 0.2) * (C - total))));
  const y0 = Math.max(1 + guest, Math.min(R - hh - 4, Math.round((R - hh - guest - 4) / 2) + guest + rint(r, -1, 1)));
  const front = y0 + hh; // the street side
  const streetY = front + rrange(r, 1.8, 2.6);
  const used: [number, number, number, number][] = [[x0 - 1, y0 - guest - 1, total + 2, hh + guest + 2.2]];
  const isFree = (x: number, y: number, w: number, h: number) => x >= 0.5 && y >= 0.5 && x + w <= C - 0.5 && y + h <= R - 0.5 && !used.some(([ux, uy, uw, uh]) => x < ux + uw && ux < x + w && y < uy + uh && uy < y + h);

  // street (cobbles or a dirt road), sometimes with a lane branching off it
  const road = r() < 0.6 ? 'cobble' : 'dirt';
  for (let x = -1; x <= C + 1; x += 0.6) { const [X, Y] = P(x, streetY); b.paint(road, X, Y, 1.6, 0.4, 0.8); }
  used.push([0, streetY - 1.3, C, 2.6]);
  if (r() < 0.4) {
    const lx = r() < 0.5 ? rrange(r, 1.5, Math.max(1.6, x0 - 2)) : rrange(r, Math.min(C - 1.6, x0 + total + 2), C - 1.5);
    if (lx > 1 && lx < C - 1) { for (let y = streetY; y <= R + 1; y += 0.6) { const [X, Y] = P(lx, y); b.paint(road, X, Y, 1.2, 0.4, 0.8); } used.push([lx - 1, streetY, 2, R]); }
  }

  // ---- rooms and walls
  room(x0, y0, hw, hh, hallFloor, t('Common room'));
  const kh = kw ? Math.max(2, Math.round(hh * rrange(r, 0.45, 0.62))) : 0;
  if (kw) {
    room(x0 + hw, y0, kw, kh, pick(r, ['flagstone', 'brickfloor', 'tiles']), t('Kitchen'));
    room(x0 + hw, y0 + kh, kw, hh - kh, pick(r, ['wood', 'wornplanks']), t('Pantry'));
    wallSeg(x0 + hw, y0, x0 + hw, y0 + hh);
    wallSeg(x0 + hw, y0 + kh, x0 + hw + kw, y0 + kh);
    door(x0 + hw, y0 + rint(r, 1, kh - 1) + 0.5, true);
    if (r() < 0.5) door(x0 + hw, y0 + kh + Math.max(0.5, (hh - kh) / 2), true); else door(x0 + hw + kw / 2, y0 + kh, false);
    if (r() < 0.5) door(x0 + hw + kw - 0.5 - rint(r, 0, Math.max(0, kw - 2)), y0, false); // back door
  }
  const guestRooms: [number, number][] = [];
  if (guest) {
    // a row of small rooms behind the common room, each opening onto it
    wallSeg(x0, y0, x0 + hw, y0);
    let gx = x0;
    while (x0 + hw - gx >= 3) {
      const gw = x0 + hw - gx < 7 ? x0 + hw - gx : rint(r, 3, 4);
      room(gx, y0 - guest, gw, guest, pick(r, ['wood', 'wornplanks']), t('Guest room'));
      if (gx > x0) wallSeg(gx, y0 - guest, gx, y0);
      door(gx + gw / 2, y0, false);
      guestRooms.push([gx, gw]);
      gx += gw;
    }
  }
  const doorX = x0 + rrange(r, 0.3, 0.7) * hw;
  door(doorX, front, false, 'double', 2);

  // ---- common room: a bar, the hearth, tables, sometimes a bard's corner and stairs up
  const barRight = kw > 0 && r() < 0.4; // bar along the kitchen wall instead of the back wall
  if (barRight) {
    stamp(pick(r, ['bar_counter', 'counter']), x0 + hw - 1.3, y0 + hh / 2, Math.PI / 2, 1);
    stamp(pick(r, ['keg_rack', 'wine_rack']), x0 + hw - 0.45, y0 + hh / 2 + 1.6, Math.PI / 2, 0.8);
    stamp('tankards', x0 + hw - 1.3, y0 + hh / 2 - 0.6, r() * 6.28, 0.7);
  } else {
    const bx = x0 + hw * rrange(r, 0.35, 0.65);
    stamp(pick(r, ['bar_counter', 'counter']), bx, y0 + 1.3, 0, 1);
    stamp('tankards', bx - 0.7, y0 + 1.3, r() * 6.28, 0.7); stamp('bottles', bx + 0.8, y0 + 1.3, 0, 0.7);
    if (hw >= 7) stamp(pick(r, ['keg_rack', 'wine_rack']), bx, y0 + 0.45, 0, 0.8);
    else for (let k = 0; k < 3; k++) stamp('barrel', bx - 0.8 + k * 0.8, y0 + 0.45);
  }
  const hearthY = y0 + hh * rrange(r, 0.35, 0.65);
  stamp('fireplace', x0 + 0.45, hearthY, Math.PI / 2);
  stamp(pick(r, ['rug', 'rug_fur', 'rug_round']), x0 + 1.9, hearthY, Math.PI / 2, 0.8);
  if (r() < 0.5) stamp('armchair', x0 + 1.4, hearthY - 1.2, Math.PI / 2 + 0.4, 0.9);
  if (hw >= 8) stamp('chandelier', x0 + hw / 2, y0 + hh / 2 + 0.5);
  const bard = r() < 0.4, stairs = r() < 0.5;
  if (bard) { stamp('rug_round', x0 + 1.4, y0 + hh - 1.3, 0, 0.8); stamp(pick(r, ['lute', 'harp']), x0 + 1.2, y0 + hh - 1.4, r() * 6.28, 0.8); stamp('stool', x0 + 1.8, y0 + hh - 1.1); }
  if (stairs) stamp('stairs', x0 + hw - 0.8, y0 + hh - 1.2, Math.PI / 2, 0.8);
  // tables on a loose grid that keeps clear of the hearth, the bar and the corners in use
  const tx0 = x0 + 3.1, tx1 = x0 + hw - (barRight ? 2.6 : 1.2) - (stairs ? 0.6 : 0), ty0 = y0 + (barRight ? 1.6 : 3), ty1 = y0 + hh - 1.1;
  const sx = rrange(r, 2.4, 2.9), sy = rrange(r, 2.3, 2.7);
  for (let ty = ty0; ty < ty1; ty += sy) for (let tx = tx0; tx < tx1; tx += sx) {
    if (bard && tx < x0 + 3 && ty > y0 + hh - 2.5) continue;
    if (Math.abs(tx - doorX) < 1.2 && ty > y0 + hh - 1.8) continue;
    const jx = tx + rrange(r, -0.25, 0.25), jy = ty + rrange(r, -0.2, 0.2);
    const kind = r();
    if (kind < 0.12) { stamp('card_table', jx, jy, 0, 0.85); continue; }
    if (kind < 0.55) {
      stamp('table_round', jx, jy, r() * 6.28, 0.9);
      for (let k = 0, n = rint(r, 2, 4); k < n; k++) { const a = (k / n) * 6.28 + r() * 0.5; stamp(r() < 0.7 ? 'stool' : 'chair', jx + Math.cos(a) * 0.85, jy + Math.sin(a) * 0.85, a + Math.PI / 2); }
    } else {
      stamp('table', jx, jy, 0, 0.9);
      stamp('bench', jx, jy - 0.7, 0, 0.8); stamp('bench', jx, jy + 0.7, 0, 0.8);
    }
    if (r() < 0.55) stamp(night ? 'candles' : pick(r, ['candles', 'bread_basket']), jx + 0.3, jy, 0, 0.7);
    else if (r() < 0.5) stamp('tankards', jx - 0.2, jy, r() * 6.28, 0.6);
  }
  // ---- kitchen and pantry
  const kx = x0 + hw;
  if (kw) {
    stamp(pick(r, ['stove', 'spit_roast']), kx + kw / 2, y0 + 0.5, 0, 0.9);
    stamp('cooking_pots', kx + 0.7, y0 + 1.4, r() * 6.28, 0.8);
    if (kh >= 3) stamp('kitchen_table', kx + kw / 2, y0 + kh - 0.8, 0, 0.9);
    stamp(pick(r, ['hanging_meat', 'chopping_block', 'washtub', 'sink']), kx + kw - 0.7, y0 + 1.4, 0, 0.8);
    for (let k = 0, n = Math.round((kw * (hh - kh)) / 3); k < n; k++)
      stamp(pick(r, ['crate', 'barrel', 'sacks', 'crate_apples', 'crate_veg', 'cheese', 'grain_sack', 'cask', 'pantry_shelf', 'basket_fish']), kx + 0.6 + rrange(r, 0, kw - 1.2), y0 + kh + 0.6 + rrange(r, 0, hh - kh - 1.2), r() * 6.28);
  }
  // ---- guest rooms
  for (const [gx, gw] of guestRooms) {
    stamp(pick(r, ['bed', 'bed', 'bed_straw', 'bunk_bed']), gx + 0.75, y0 - guest + 1.05, 0, 0.9);
    stamp(pick(r, ['chest', 'trunk_open', 'nightstand', 'washstand']), gx + gw - 0.6, y0 - guest + 0.5, 0, 0.8);
    if (r() < 0.4) stamp('candles', gx + gw - 0.6, y0 - 0.6, 0, 0.6);
  }

  // ---- the front of the inn
  stamp(night ? 'lamppost' : pick(r, ['lamppost', 'barrel_planter']), doorX - 2, front + 0.8);
  stamp('lamppost', doorX + 2, front + 0.8);
  stamp(pick(r, ['signpost', 'notice_board']), doorX + rrange(r, 2.6, 3.4), front + 0.5);
  if (r() < 0.7) { stamp('hitching_post', doorX - 3.4, front + 0.6); stamp('trough', doorX - 3.4, front + 1.3, 0, 0.8); }

  // ---- the yard: a few features of a country inn, placed where there is room
  const feature = (w: number, h: number, draw: (x: number, y: number) => void) => {
    for (let tries = 0; tries < 40; tries++) {
      const x = rrange(r, 0.5, C - w - 0.5), y = rrange(r, 0.5, R - h - 0.5);
      if (!isFree(x, y, w, h)) continue;
      used.push([x - 0.5, y - 0.5, w + 1, h + 1]);
      draw(x, y);
      return;
    }
  };
  const fence = (x: number, y: number, w: number, h: number) => {
    for (let k = 0.5; k < w; k += 1) { stamp('picket_fence', x + k, y, 0, 0.9); if (k > 1.5 || r() < 0.5) stamp('picket_fence', x + k, y + h, 0, 0.9); }
    for (let k = 0.5; k < h; k += 1) { stamp('picket_fence', x, y + k, Math.PI / 2, 0.9); stamp('picket_fence', x + w, y + k, Math.PI / 2, 0.9); }
  };
  const yard: Record<string, [number, number, (x: number, y: number) => void]> = {
    stable: [5, 4, (x, y) => { fence(x, y, 5, 4); stamp('haystack', x + 1.2, y + 1.2); stamp('hay_bales', x + 3.5, y + 1, r() * 6.28); stamp('trough', x + 2.5, y + 2.8, 0, 0.9); if (r() < 0.5) stamp('covered_wagon', x + 3.6, y + 2.6, Math.PI / 2, 0.8); }],
    garden: [4, 3, (x, y) => { fence(x, y, 4, 3); for (let k = 0; k < 4; k++) stamp(pick(r, ['pumpkins', 'wheat', 'sunflowers', 'lavender', 'flower_bush']), x + 0.8 + (k % 2) * 2.2, y + 0.8 + Math.floor(k / 2) * 1.3, 0, 0.8); if (r() < 0.6) stamp('scarecrow', x + 2, y + 1.5, 0, 0.8); }],
    well: [2, 2, (x, y) => { stamp(pick(r, ['well_roofed', 'well', 'water_pump']), x + 1, y + 1); if (r() < 0.5) stamp('bucket', x + 1.8, y + 1.6, 0, 0.7); }],
    coop: [3, 2, (x, y) => { stamp('chicken_coop', x + 1.5, y + 1); if (r() < 0.6) stamp('firewood', x + 2.7, y + 1.5, r() * 6.28, 0.8); }],
    market: [4, 2, (x, y) => { stamp(pick(r, ['market_stall', 'fruit_stall']), x + 1, y + 1); stamp(pick(r, ['crate_stack', 'wheelbarrow', 'crate_apples']), x + 3, y + 1, r() * 6.28, 0.9); }],
    outhouse: [2, 2, (x, y) => stamp('outhouse', x + 1, y + 1)],
    pond: [4, 3, (x, y) => { for (let k = 0; k < 4; k++) { const [X, Y] = P(x + 2 + rrange(r, -0.8, 0.8), y + 1.5 + rrange(r, -0.4, 0.4)); b.paint('water', X, Y, rrange(r, 0.8, 1.3), 0.3, 1); } stamp('reeds', x + 0.6, y + 0.6, 0, 0.8); stamp('lily_pads', x + 2, y + 1.5, 0, 0.8); }],
    beehives: [3, 2, (x, y) => { stamp('beehive', x + 0.8, y + 1, 0, 0.9); stamp('beehive', x + 2.2, y + 1, 0, 0.9); stamp('lavender', x + 1.5, y + 1.8, 0, 0.8); }],
  };
  const picks = Object.keys(yard).sort(() => r() - 0.5).slice(0, rint(r, 2, 4));
  for (const k of picks) { const [w, h, draw] = yard[k]; feature(w, h, draw); }

  // ---- vegetation, by season
  const plants = season === 'autumn' ? ['autumn_maple', 'tree_autumn', 'bush', 'fallen_leaves', 'pumpkins', 'rocks', 'golden_tree']
    : season === 'pines' ? ['pine', 'pine', 'birch', 'fern', 'rocks', 'mossy_log', 'bush']
    : ['tree', 'bush', 'tallgrass', 'flowers', 'rocks', 'birch', 'flower_bush', 'wildflowers', 'berry_bush', 'fruit_tree'];
  for (let k = 0; k < C * R * rrange(r, 0.06, 0.11); k++) {
    const x = rrange(r, 0, C), y = rrange(r, 0, R);
    if (!isFree(x - 0.4, y - 0.4, 0.8, 0.8)) continue;
    stamp(pick(r, plants), x, y, r() * 6.28, rrange(r, 0.8, 1.2));
  }
  const [lx, ly] = P(x0 + hw / 2, y0 - guest - 0.8);
  b.label(doc.parent ? doc.name : tavernName(r), lx, ly, 48, false).font = 'Pirata One';
}
