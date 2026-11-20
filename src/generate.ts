import { CELL, Door, DoorKind, Label, MapDoc, Room, Stamp } from './model';
import type { MapRuntime } from './runtime';
import { STAMP_BY_ID, STAMP_PAD, VARIANTS } from './stamps';
import { ctx2d, makeCanvas, mulberry32, pick, rint, Rng, rrange, uid } from './util';
import { fbmTile, sampleWrap } from './noise';
import { t } from './i18n';

export type GenKind = 'dungeon' | 'cave' | 'forest' | 'tavern';
export const GEN_NAMES: Record<GenKind, string> = { dungeon: 'Dungeon', cave: t('Cave'), forest: t('Forest clearing'), tavern: t('Tavern') };

class B {
  doc: MapDoc; r: Rng; rt: MapRuntime;
  constructor(rt: MapRuntime, seed: number) { this.rt = rt; this.doc = rt.doc; this.r = mulberry32(seed); }
  stamp(type: string, cx: number, cy: number, rot = 0, scale = 1): Stamp {
    const def = STAMP_BY_ID.get(type);
    if (def) {
      const r = (Math.hypot(def.w, def.h) / 2) * scale + (STAMP_PAD + 6) / CELL;
      const fit = (v: number, max: number) => (max > 2 * r ? Math.min(max - r, Math.max(r, v)) : max / 2);
      cx = fit(cx, this.doc.cols); cy = fit(cy, this.doc.rows);
    }
    const s: Stamp = { id: uid(), type, x: cx * CELL, y: cy * CELL, rot, scale, variant: Math.floor(this.r() * VARIANTS), flip: this.r() < 0.5 && !!STAMP_BY_ID.get(type) };
    this.doc.stamps.push(s);
    return s;
  }
  room(x: number, y: number, w: number, h: number, floor: string, name?: string): Room {
    const rm: Room = { id: uid(), pts: [x * CELL, y * CELL, (x + w) * CELL, y * CELL, (x + w) * CELL, (y + h) * CELL, x * CELL, (y + h) * CELL], floor, name };
    this.doc.rooms.push(rm);
    return rm;
  }
  door(x: number, y: number, vertical: boolean, kind: DoorKind = 'wood', width = 1): Door {
    const d: Door = { id: uid(), x: x * CELL, y: y * CELL, rot: vertical ? Math.PI / 2 : 0, kind, open: false, width };
    this.doc.doors.push(d);
    return d;
  }
  label(text: string, cx: number, cy: number, size = 46, hidden = true): Label {
    cx = Math.min(this.doc.cols - 0.5, Math.max(0.5, cx)); cy = Math.min(this.doc.rows - 0.5, Math.max(0.5, cy));
    const l: Label = { id: uid(), x: cx * CELL, y: cy * CELL, text, font: 'Cinzel', size, color: '#f3e6c4', stroke: '#1a120c', rot: 0, bold: true, hidden };
    this.doc.labels.push(l);
    return l;
  }
  paint(key: string, cx: number, cy: number, rCells: number, hard = 0.3, strength = 1) {
    this.rt.engine.dab(key, cx * CELL, cy * CELL, rCells * CELL, hard, strength, false);
  }
  stroke(key: string, pts: [number, number][], rCells: number, hard = 0.35) {
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (rCells * 0.3)));
      for (let k = 0; k <= n; k++) this.paint(key, x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, rCells, hard, 0.6);
    }
  }
}

function reset(doc: MapDoc) {
  doc.rooms = []; doc.walls = []; doc.doors = []; doc.stamps = []; doc.lights = []; doc.labels = []; doc.markers = [];
  doc.tokens = [];
  doc.combat = { active: false, round: 1, turn: null, members: [] };
}

export function generate(rt: MapRuntime, kind: GenKind, seed = Date.now() % 100000) {
  reset(rt.doc);
  rt.engine.masks.clear();
  const b = new B(rt, seed);
  if (kind === 'dungeon') dungeon(b);
  else if (kind === 'cave') cave(b);
  else if (kind === 'forest') forest(b);
  else tavern(b);
  for (const k of rt.engine.masks.keys()) rt.engine.changed.add(k);
  rt.fog.fillAll();
  rt.engine.invalidateAll();
}

// ------------------------------------------------------------------ dungeon
interface Box { x: number; y: number; w: number; h: number }
function dungeon(b: B) {
  const { doc, r } = b;
  doc.bg = 'rock'; doc.wallStyle = 'stone'; doc.ambient = 0.55; doc.fogEnabled = true;
  const C = doc.cols, R = doc.rows;
  const target = Math.max(4, Math.min(14, Math.round((C * R) / 70)));
  const boxes: Box[] = [];
  for (let a = 0; a < 400 && boxes.length < target; a++) {
    const w = rint(r, 3, 8), h = rint(r, 3, 7);
    const x = rint(r, 1, C - w - 1), y = rint(r, 1, R - h - 1);
    if (x < 1 || y < 1) continue;
    if (boxes.some((o) => x < o.x + o.w + 2 && o.x < x + w + 2 && y < o.y + o.h + 2 && o.y < y + h + 2)) continue;
    boxes.push({ x, y, w, h });
  }
  const inBox = (cx: number, cy: number) => boxes.findIndex((o) => cx >= o.x && cx < o.x + o.w && cy >= o.y && cy < o.y + o.h);
  // spanning tree (Prim) + a couple of extra links
  const center = (o: Box) => [Math.floor(o.x + o.w / 2), Math.floor(o.y + o.h / 2)];
  const links: [number, number][] = [];
  const done = new Set([0]);
  while (done.size < boxes.length) {
    let best: [number, number, number] | null = null;
    for (const i of done) for (let j = 0; j < boxes.length; j++) {
      if (done.has(j)) continue;
      const [ax, ay] = center(boxes[i]), [bx, by] = center(boxes[j]);
      const d = Math.abs(ax - bx) + Math.abs(ay - by);
      if (!best || d < best[2]) best = [i, j, d];
    }
    if (!best) break;
    links.push([best[0], best[1]]); done.add(best[1]);
  }
  for (let k = 0; k < Math.floor(boxes.length / 4); k++) {
    const i = rint(r, 0, boxes.length - 1), j = rint(r, 0, boxes.length - 1);
    if (i !== j) links.push([i, j]);
  }
  const roomObjs = boxes.map((o, i) => b.room(o.x, o.y, o.w, o.h, r() < 0.2 ? 'tiles' : 'flagstone', t('Room {n}', { n: i + 1 })));
  const doorAt = new Set<string>();
  for (const [i, j] of links) {
    const [ax, ay] = center(boxes[i]), [bx, by] = center(boxes[j]);
    const cells: [number, number][] = [];
    const horizFirst = r() < 0.5;
    let x = ax, y = ay;
    cells.push([x, y]);
    const stepTo = (tx: number, ty: number) => {
      while (x !== tx) { x += Math.sign(tx - x); cells.push([x, y]); }
      while (y !== ty) { y += Math.sign(ty - y); cells.push([x, y]); }
    };
    if (horizFirst) { stepTo(bx, ay); stepTo(bx, by); } else { stepTo(ax, by); stepTo(bx, by); }
    // corridor rooms for cells outside boxes (merged into runs)
    let run: [number, number][] = [];
    const flush = () => {
      if (!run.length) return;
      const xs = run.map((c) => c[0]), ys = run.map((c) => c[1]);
      const x0 = Math.min(...xs), y0 = Math.min(...ys);
      b.room(x0, y0, Math.max(...xs) - x0 + 1, Math.max(...ys) - y0 + 1, 'flagstone').name = t('Corridor');
      run = [];
    };
    for (let k = 0; k < cells.length; k++) {
      const [cx, cy] = cells[k];
      const inside = inBox(cx, cy) >= 0;
      if (!inside) {
        if (run.length && run[run.length - 1][0] !== cx && run[run.length - 1][1] !== cy) flush();
        if (run.length >= 2) {
          const [px, py] = run[run.length - 1], [qx, qy] = run[run.length - 2];
          if ((px - qx) !== (cx - px) || (py - qy) !== (cy - py)) { const last = run[run.length - 1]; flush(); run.push(last); }
        }
        run.push([cx, cy]);
      } else flush();
      if (k > 0) {
        const [px, py] = cells[k - 1];
        const a = inBox(px, py) >= 0;
        if (a !== inside) {
          const vertical = px !== cx;
          const ex = vertical ? Math.max(px, cx) : cx + 0.5;
          const ey = vertical ? cy + 0.5 : Math.max(py, cy);
          const key = `${ex},${ey}`;
          if (!doorAt.has(key)) {
            doorAt.add(key);
            if (r() < 0.75) b.door(ex, ey, vertical, r() < 0.15 ? 'iron' : r() < 0.08 ? 'secret' : 'wood');
          }
        }
      }
    }
    flush();
  }
  // furnish
  const themes = ['crypt', 'storage', 'throne', 'ritual', 'library', 'prison', 'barracks', 'empty', 'empty'];
  boxes.forEach((o, i) => {
    b.label(String(i + 1), o.x + 0.55, o.y + 0.5, 44);
    const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
    // torches on top wall
    if (r() < 0.85) b.stamp('torch', o.x + o.w / 2, o.y + 0.22);
    if (o.w >= 6 && r() < 0.6) b.stamp('torch', o.x + 0.22, o.y + o.h / 2);
    if (i === 0) { b.stamp('stairs', o.x + 0.5, o.y + o.h - 1); b.label(t('Entrance'), cx, o.y + o.h - 0.4, 30); return; }
    const theme = pick(r, themes);
    const free = () => [rrange(r, o.x + 0.8, o.x + o.w - 0.8), rrange(r, o.y + 0.8, o.y + o.h - 0.8)];
    switch (theme) {
      case 'crypt':
        for (let x = o.x + 1; x < o.x + o.w - 0.5; x += 2) b.stamp('sarcophagus', x, cy, 0);
        b.stamp('candles', o.x + 0.5, o.y + 0.5);
        break;
      case 'storage':
        for (let k = 0; k < o.w + o.h; k++) {
          const t = pick(r, ['barrel', 'crate', 'crate', 'sacks', 'barrels']);
          const side = rint(r, 0, 3);
          const p = side === 0 ? [rrange(r, o.x + 0.5, o.x + o.w - 0.5), o.y + 0.5] : side === 1 ? [rrange(r, o.x + 0.5, o.x + o.w - 0.5), o.y + o.h - 0.5] : side === 2 ? [o.x + 0.5, rrange(r, o.y + 0.5, o.y + o.h - 0.5)] : [o.x + o.w - 0.5, rrange(r, o.y + 0.5, o.y + o.h - 0.5)];
          b.stamp(t, p[0], p[1], r() * 6.28);
        }
        break;
      case 'throne':
        b.stamp('rug', cx, cy + 0.5, Math.PI / 2, Math.min(1, (o.h - 1) / 3));
        b.stamp('throne', cx, o.y + 0.75);
        for (let y = o.y + 1.5; y < o.y + o.h - 0.5; y += 2) { b.stamp('pillar', o.x + 0.6, y); b.stamp('pillar', o.x + o.w - 0.6, y); }
        b.stamp('brazier', cx - 1.2, o.y + 0.7); b.stamp('brazier', cx + 1.2, o.y + 0.7);
        break;
      case 'ritual':
        b.stamp('pentagram', cx, cy, 0, Math.min(1.2, (Math.min(o.w, o.h) - 1) / 2));
        b.stamp('altar', cx, o.y + 0.6);
        b.stamp('candles', cx - 1.4, cy + 1); b.stamp('candles', cx + 1.4, cy + 1);
        b.stamp('blood', cx + 0.4, cy - 0.3);
        break;
      case 'library':
        for (let x = o.x + 1; x < o.x + o.w - 0.9; x += 2) b.stamp('bookshelf', x, o.y + 0.3);
        b.stamp('table', cx, cy); b.stamp('chair', cx - 0.5, cy + 0.7); b.stamp('chair', cx + 0.5, cy - 0.7, Math.PI);
        b.stamp('candles', cx + 0.6, cy);
        break;
      case 'prison':
        for (let x = o.x + 0.5; x < o.x + o.w - 0.4; x += 1.2) b.stamp('cage', x, o.y + 0.5);
        b.stamp('bones', ...free() as [number, number]); b.stamp('bones', ...free() as [number, number]);
        b.stamp('chest', o.x + o.w - 0.6, o.y + o.h - 0.5);
        break;
      case 'barracks':
        for (let x = o.x + 0.5; x < o.x + o.w - 0.4; x += 1.4) { b.stamp('bed', x, o.y + 1); b.stamp('chest', x, o.y + 2.3); }
        b.stamp('table', cx, o.y + o.h - 1); b.stamp('stool', cx - 0.5, o.y + o.h - 0.35); b.stamp('stool', cx + 0.5, o.y + o.h - 0.35);
        break;
      default:
        for (let k = 0; k < 3; k++) b.stamp(pick(r, ['rubble', 'bones', 'rocks', 'puddle']), ...free() as [number, number], r() * 6.28);
    }
    b.stamp('cobweb', o.x + 0.5, o.y + 0.5, 0);
    if (r() < 0.3) b.stamp('cobweb', o.x + o.w - 0.5, o.y + o.h - 0.5, Math.PI);
    if (r() < 0.35) b.paint('water', ...free() as [number, number], rrange(r, 0.6, 1.2), 0.2);
    if (r() < 0.35) b.paint('moss', ...free() as [number, number], rrange(r, 0.8, 1.6), 0.1, 0.7);
  });
  void roomObjs;
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
