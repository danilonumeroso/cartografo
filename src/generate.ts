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
type CaveKind = 'plain' | 'lake' | 'fungal' | 'crystal' | 'ice' | 'lava';
function cave(b: B) {
  const { doc, r, rt } = b;
  // every cave has a character: a plain grotto, an underground lake, a mushroom grotto, a crystal
  // cavern, an ice cave or a lava cave; tight or open passages
  const kind = pick(r, ['plain', 'plain', 'lake', 'fungal', 'crystal', 'ice', 'lava'] as CaveKind[]);
  doc.bg = 'rock'; doc.fogEnabled = true;
  doc.caveFloor = kind === 'ice' ? 'ice' : kind === 'lava' ? pick(r, ['ash', 'obsidian']) : 'cave';
  doc.ambient = kind === 'fungal' || kind === 'crystal' ? 0.72 : kind === 'lava' ? 0.5 : 0.6;
  const S = 2, gw = doc.cols * S, gh = doc.rows * S;
  const fill = rrange(r, 0.42, 0.48), passes = rint(r, 4, 6);
  let g = new Uint8Array(gw * gh);
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
    const edge = x < 2 || y < 2 || x >= gw - 2 || y >= gh - 2;
    g[y * gw + x] = edge || r() < fill ? 1 : 0;
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
  for (let it = 0; it < passes; it++) {
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
  const [ex, ey] = open[0];
  const farFromEntrance = open.filter(([x, y]) => Math.hypot(x - ex, y - ey) > 6);
  // pools: water everywhere, a big lake in a lake cave, lava pools in a lava cave
  const liquid = kind === 'lava' ? 'lava' : 'water';
  const pools = kind === 'lake' ? 1 : Math.max(1, Math.round(area / 90));
  for (let k = 0; k < pools; k++) {
    const [x, y] = pick(r, farFromEntrance.length ? farFromEntrance : open);
    const big = kind === 'lake' ? rrange(r, 2.5, 4) : 1;
    for (let j = 0; j < 4 * big; j++) b.paint(liquid, x + rrange(r, -0.8, 0.8) * big, y + rrange(r, -0.8, 0.8) * big, rrange(r, 0.7, 1.4) * Math.sqrt(big), 0.2);
    if (liquid === 'water') b.paint('deep', x, y, 0.6 * big, 0.2);
    if (kind === 'lake') { b.stamp('rowboat', x + big * 0.9, y + rrange(r, -0.5, 0.5), r() * 6.28, 0.8); for (let j = 0; j < 4; j++) b.stamp('river_stones', x + rrange(r, -1.5, 1.5) * big, y + rrange(r, -1.2, 1.2) * big, r() * 6.28, 0.8); }
    if (kind === 'lava') b.stamp('lava_vent', x, y, r() * 6.28, 0.9);
  }
  const crystal = pick(r, ['crystals_blue', 'crystals_red', 'crystals_green', 'crystals']);
  const wallProps = kind === 'ice' ? ['ice_spikes', 'ice_spikes', 'snow_drift', 'rocks'] : kind === 'lava' ? ['rocks', 'boulder', 'stalagmite', 'lava_vent'] : ['stalagmite', 'stalagmite', 'stalagmites', 'rocks', 'boulder'];
  const glowProps = kind === 'fungal' ? ['glowshrooms', 'glowshrooms', 'mushrooms', 'giant_mushroom'] : kind === 'crystal' ? [crystal, crystal, 'geode', 'floating_crystal', 'crystal_tree'] : kind === 'ice' ? ['crystals_blue', 'ice_spikes'] : [crystal, 'glowshrooms', 'mushrooms', 'geode'];
  const glowK = kind === 'fungal' || kind === 'crystal' ? 14 : 40;
  for (let k = 0; k < area / 12; k++) b.stamp(pick(r, wallProps), ...pick(r, nearWall), r() * 6.28, rrange(r, 0.7, 1.2));
  for (let k = 0; k < area / glowK; k++) b.stamp(pick(r, glowProps), ...pick(r, nearWall), r() * 6.28);
  for (let k = 0; k < area / 50; k++) b.stamp(pick(r, kind === 'ice' ? ['bones', 'snow_drift', 'puddle', 'skulls'] : ['bones', 'rubble', 'puddle', 'cave_moss', 'glowmoss', 'skulls']), ...pick(r, open), r() * 6.28);
  for (let k = 0; k < area / 160; k++) b.stamp(pick(r, kind === 'fungal' ? ['giant_mushroom', 'giant_mushroom', 'cave_column'] : ['cave_column', 'giant_mushroom', 'bear_den', 'ore_vein']), ...pick(r, open), r() * 6.28);
  if (kind !== 'lava' && kind !== 'ice') for (let k = 0; k < area / (kind === 'fungal' ? 25 : 60); k++) b.paint('moss', ...pick(r, open), rrange(r, 0.8, 1.6), 0.1, 0.6);
  b.label(t('Entrance'), ex, ey, 30);
}

// ------------------------------------------------------------------ forest and winter wood
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
/** A wobbly path through the given points (from map edge to map edge, say). */
function pathThrough(r: Rng, way: [number, number][]): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 1; i < way.length; i++) {
    const [ax, ay] = way[i - 1], [bx, by] = way[i], n = Math.max(2, Math.round(Math.hypot(bx - ax, by - ay) / 1.2));
    for (let k = i === 1 ? 0 : 1; k <= n; k++) { const f = k / n, wob = k > 0 && k < n ? rrange(r, -0.6, 0.6) : 0; out.push([ax + (bx - ax) * f + wob, ay + (by - ay) * f + wob]); }
  }
  return out;
}
type Woods = { snow: boolean; trees: string[]; undergrowth: string[]; litter: string[] };
const WOODS: Record<string, Woods> = {
  mixed: { snow: false, trees: ['tree', 'tree', 'tree', 'birch', 'tree_autumn', 'fruit_tree', 'pine', 'pine', 'cypress'], undergrowth: ['bush', 'bush', 'berry_bush', 'fern', 'flower_bush'], litter: ['tallgrass', 'flowers', 'rocks', 'wildflowers', 'fern', 'stump', 'log', 'mossy_log', 'mushrooms', 'grass_tufts', 'mossy_boulder'] },
  pine: { snow: false, trees: ['pine', 'pine', 'pine', 'cypress', 'tree'], undergrowth: ['fern', 'fern', 'bush', 'mossy_boulder'], litter: ['fern', 'mossy_log', 'mossy_boulder', 'mushrooms', 'stump', 'rocks', 'roots'] },
  autumn: { snow: false, trees: ['autumn_maple', 'autumn_maple', 'tree_autumn', 'golden_tree', 'tree', 'birch'], undergrowth: ['bush', 'berry_bush', 'fern'], litter: ['fallen_leaves', 'fallen_leaves', 'mushrooms', 'stump', 'log', 'pumpkins', 'rocks'] },
  birch: { snow: false, trees: ['birch', 'birch', 'birch', 'tree', 'cherry_tree'], undergrowth: ['flower_bush', 'bush', 'fern'], litter: ['wildflowers', 'flowers', 'tallgrass', 'clover', 'tulips', 'rocks'] },
  swamp: { snow: false, trees: ['willow', 'willow', 'dead_tree', 'mangrove', 'tree'], undergrowth: ['reeds', 'reeds', 'fern', 'bush'], litter: ['lily_pads', 'mossy_log', 'mushrooms', 'reeds', 'roots', 'fireflies'] },
  winter: { snow: true, trees: ['snowy_pine', 'snowy_pine', 'snowy_pine', 'pine', 'dead_tree'], undergrowth: ['holly_bush', 'snow_drift', 'rocks'], litter: ['snow_drift', 'snowballs', 'rocks', 'ice_spikes', 'firewood', 'paw_prints'] },
};

/** A forest (or a snowy wood): one or two clearings, paths, a stream, and something in the main clearing. */
function woods(b: B, snow: boolean) {
  const { doc, r } = b;
  const C = doc.cols, R = doc.rows;
  const biome = snow ? 'winter' : pick(r, ['mixed', 'mixed', 'pine', 'autumn', 'birch', 'swamp']);
  const W = WOODS[biome];
  doc.bg = snow ? 'snow' : biome === 'swamp' ? 'swamp' : 'grass';
  const dusk = r() < 0.25;
  doc.ambient = snow ? (dusk ? 0.5 : 0.25) : dusk ? 0.4 : 0; doc.fogEnabled = false;
  // clearings: the main one, sometimes a second, smaller one
  const clearings: [number, number, number][] = [[C * rrange(r, 0.3, 0.7), R * rrange(r, 0.35, 0.65), Math.min(C, R) * rrange(r, 0.22, 0.32)]];
  if (C * R >= 400 && r() < 0.45) {
    const [mx, my] = clearings[0];
    for (let tries = 0; tries < 20; tries++) {
      const x = C * rrange(r, 0.15, 0.85), y = R * rrange(r, 0.2, 0.8);
      if (Math.hypot(x - mx, y - my) > Math.min(C, R) * 0.45) { clearings.push([x, y, Math.min(C, R) * rrange(r, 0.12, 0.18)]); break; }
    }
  }
  const N = fbmTile(256, 4, 4, Math.floor(r() * 9999));
  const thick = rrange(r, -0.1, 0.12); // denser or sparser woods
  const density = (x: number, y: number) => {
    const d = Math.min(...clearings.map(([cx, cy, cr]) => Math.hypot((x - cx) / cr, (y - cy) / cr)));
    return Math.max(0, Math.min(1, (d - 0.9) * 1.3)) * 0.8 + sampleWrap(N, 256, x * 8, y * 8) * 0.35 - 0.12 + thick;
  };
  if (!snow) for (let y = 0; y < R; y += 1.5) for (let x = 0; x < C; x += 1.5) if (density(x, y) > 0.45) b.paint(biome === 'autumn' ? 'leaves' : 'forest', x, y, 1.8, 0.1, 0.5);
  if (biome === 'swamp') for (let k = 0; k < C * R / 60; k++) { const x = rrange(r, 0, C), y = rrange(r, 0, R); b.paint(r() < 0.6 ? 'swampwater' : 'mud', x, y, rrange(r, 0.8, 1.8), 0.3, 0.9); }
  // paths: none, one through the clearings, or a crossroads
  const paths: [number, number][][] = [];
  const pathMode = pick(r, ['one', 'one', 'cross', 'none']);
  const horizontal = C >= R;
  if (pathMode !== 'none') {
    // the path skirts each clearing's middle, where its scene stands
    const side = r() < 0.5 ? 1 : -1;
    const stops = clearings.map(([x, y, cr]) => (horizontal ? [x, y + side * cr * 0.7] : [x + side * cr * 0.7, y]) as [number, number]);
    const way: [number, number][] = horizontal ? [[-0.5, R * rrange(r, 0.3, 0.7)], ...stops.sort((a, c) => a[0] - c[0]), [C + 0.5, R * rrange(r, 0.3, 0.7)]]
      : [[C * rrange(r, 0.3, 0.7), -0.5], ...stops.sort((a, c) => a[1] - c[1]), [C * rrange(r, 0.3, 0.7), R + 0.5]];
    paths.push(pathThrough(r, way));
    if (pathMode === 'cross') paths.push(noisePath(r, C, R, !horizontal));
  }
  for (const p of paths) {
    b.stroke(snow ? 'gravel' : biome === 'swamp' ? 'mud' : 'dirt', p, snow ? 0.75 : 0.9, 0.3);
    if (snow) for (let k = 0; k < p.length; k += 2) b.paint('snowcover', p[k][0] + rrange(r, -0.4, 0.4), p[k][1] + rrange(r, -0.4, 0.4), rrange(r, 0.3, 0.6), 0.1, 0.5);
  }
  const onPath = (x: number, y: number) => paths.some((p) => p.some(([px, py]) => Math.hypot(px - x, py - y) < 1.6));
  const stream = r() < (snow ? 0.6 : biome === 'swamp' ? 0.3 : 0.5) ? noisePath(r, C, R, !horizontal) : null;
  if (stream) b.stroke(snow ? 'ice' : 'water', stream, snow ? 0.8 : 0.7, 0.35);
  const onStream = (x: number, y: number) => !!stream && stream.some(([px, py]) => Math.hypot(px - x, py - y) < 1.4);
  // bridges where paths cross the stream
  if (stream) for (const p of paths) {
    const k = p.findIndex(([px, py]) => stream.some(([sx, sy]) => Math.hypot(sx - px, sy - py) < 0.6));
    if (k < 0) continue;
    // the bridge deck runs along the path (the stamp's deck is drawn top to bottom)
    const [ax, ay] = p[Math.max(0, k - 1)], [bx, by] = p[Math.min(p.length - 1, k + 1)];
    b.stamp('bridge_wood', p[k][0], p[k][1], Math.atan2(by - ay, bx - ax) - Math.PI / 2, 0.8);
  }
  // trees and undergrowth
  for (let k = 0; k < C * R * 0.5; k++) {
    const x = rrange(r, -0.5, C + 0.5), y = rrange(r, -0.5, R + 0.5);
    if (r() > density(x, y) || onPath(x, y) || onStream(x, y)) continue;
    const tt = r();
    if (!snow && tt < 0.03) b.stamp(biome === 'swamp' ? 'willow' : 'oak_giant', x, y, r() * 6.28, rrange(r, 0.8, 1));
    else if (!snow && biome !== 'swamp' && tt < 0.1) b.stamp(biome === 'autumn' ? 'autumn_maple' : 'tree_big', x, y, r() * 6.28, rrange(r, 0.9, 1.2));
    else if (tt < 0.8) b.stamp(pick(r, W.trees), x, y, r() * 6.28, rrange(r, 0.75, 1.3));
    else b.stamp(pick(r, W.undergrowth), x, y, r() * 6.28, rrange(r, 0.7, 1.3));
    k += 3;
  }
  const [cx, cy] = clearings[0];
  for (let k = 0; k < C * R * 0.02; k++) {
    const x = rrange(r, 0, C), y = rrange(r, 0, R);
    if (onPath(x, y) || onStream(x, y) || Math.hypot(x - cx, y - cy) < 3.5) continue;
    b.stamp(pick(r, W.litter), x, y, r() * 6.28, rrange(r, 0.8, 1.2));
  }
  if (stream) for (let k = 0; k < stream.length; k += 3) {
    const [sx, sy] = stream[k];
    if (!snow) b.stamp(pick(r, ['reeds', 'river_stones', 'lily_pads', 'reeds']), sx + rrange(r, -1, 1), sy + rrange(r, -1, 1), r() * 6.28, rrange(r, 0.7, 1));
  }
  // what the main clearing holds (the second clearing gets something small)
  const scenes = snow ? ['festive', 'frozen', 'lodge', 'wolves', 'caravan', 'ruins'] : ['camp', 'camp', 'stones', 'menhirs', 'ruins', 'cabin', 'ambush', 'woodcutters', 'pond', 'shrine'];
  clearingScene(b, pick(r, scenes), cx, cy, snow);
  if (clearings[1]) clearingScene(b, pick(r, snow ? ['wolves', 'frozen'] : ['stones', 'shrine', 'pond', 'woodcutters']), clearings[1][0], clearings[1][1], snow);
}

/** Dress a clearing around (cx, cy). */
function clearingScene(b: B, scene: string, cx: number, cy: number, snow: boolean) {
  const { r, doc } = b;
  const st = (type: string, dx: number, dy: number, rot = r() * 6.28, scale = 1) => b.stamp(type, cx + dx, cy + dy, rot, scale);
  switch (scene) {
    case 'camp':
      st('campfire', 0, 0); st('log', -1.3, 0, Math.PI / 2); st('log', 1.3, 0, Math.PI / 2);
      st('tent', 2.6, -2, rrange(r, -0.4, 0.4)); if (r() < 0.6) st('tent', -2.6, -2.2, rrange(r, -0.4, 0.4));
      st('sacks', 1.5, 1.6); st('chest', -1.6, 1.6); st('bedroll', 0.4, 2.4, Math.PI / 2 + rrange(r, -0.3, 0.3)); st('firewood', -2.6, 0.4, Math.PI / 2);
      break;
    case 'stones': st('stone_circle', 0, 0, 0); st('fairy_ring', 3.5, 2.5, 0, 0.8); break;
    case 'menhirs':
      for (let k = 0, n = rint(r, 4, 6); k < n; k++) { const a = (k / n) * Math.PI * 2; st('menhir', Math.cos(a) * 2.2, Math.sin(a) * 2.2, a); }
      st(pick(r, ['altar', 'sacrificial_altar', 'totem']), 0, 0, 0, 0.8);
      break;
    case 'ruins': {
      // the broken walls of a small building, a fallen column, rubble
      const w = rint(r, 4, 6), h = rint(r, 3, 5);
      for (let k = 0.5; k < w; k++) { if (r() < 0.7) st('stone_wall', -w / 2 + k, -h / 2, 0, 0.9); if (r() < 0.45) st('stone_wall', -w / 2 + k, h / 2, 0, 0.9); }
      for (let k = 0.5; k < h; k++) { if (r() < 0.6) st('stone_wall', -w / 2, -h / 2 + k, Math.PI / 2, 0.9); if (r() < 0.5) st('stone_wall', w / 2, -h / 2 + k, Math.PI / 2, 0.9); }
      st('pillar_broken', rrange(r, -1, 1), rrange(r, -1, 1)); st('rubble', rrange(r, -1.5, 1.5), rrange(r, -1, 1));
      st(pick(r, ['statue_angel', 'shrine', 'statue']), 0, 0, 0, 0.8);
      if (snow) st('snow_drift', w / 2 - 0.5, h / 2 - 0.5); else b.paint('moss', cx, cy, 1.6, 0.1, 0.6);
      break;
    }
    case 'cabin': case 'lodge': {
      const w = rint(r, 4, 5), h = rint(r, 3, 4), x = Math.round(cx - w / 2), y = Math.round(cy - h / 2);
      b.room(x, y, w, h, 'wornplanks', snow ? t('Hunting lodge') : t('Hunter’s cabin'));
      doc.wallStyle = 'wood';
      b.door(x + Math.floor(w / 2) + 0.5, y + h, false);
      b.stamp('fireplace', x + 0.45, y + h / 2, Math.PI / 2, 0.9);
      b.stamp(pick(r, ['bed_straw', 'bed']), x + w - 0.8, y + 1.1, 0, 0.85);
      b.stamp('table', x + w / 2 - 0.3, y + h / 2, 0, 0.7);
      b.stamp(pick(r, ['chest', 'barrel', 'sacks']), x + w - 0.6, y + h - 0.6, 0, 0.8);
      b.stamp('firewood', x - 0.8, y + h - 0.6, Math.PI / 2);
      b.stamp(snow ? 'sled' : 'chopping_block', x + w + 0.9, y + h - 0.6, r() * 6.28, 0.9);
      break;
    }
    case 'ambush':
      st('cart', 0, 0, rrange(r, -1, 1)); st(pick(r, ['crate', 'barrels', 'sacks']), 1.6, 0.8); st(pick(r, ['crate', 'barrel']), -1.4, 1.2);
      st('arrows_stuck', 0.6, -1.2); st('arrows_stuck', -0.8, -0.6); st('blood', 0.4, 1.8); st('weapon_pile', -2, -1.4, r() * 6.28, 0.8);
      break;
    case 'woodcutters':
      for (let k = 0; k < 6; k++) st('stump', rrange(r, -3, 3), rrange(r, -2.5, 2.5));
      st('lumber', -1.2, 0.6, rrange(r, -0.3, 0.3)); st('sawhorse', 1.2, -0.4); st('firewood', 1.8, 1.4); st('log', -2.2, -1.6, r() * 6.28); st('chopping_block', 0.4, 1.6);
      break;
    case 'pond':
      for (let k = 0; k < 6; k++) b.paint('water', cx + rrange(r, -1.2, 1.2), cy + rrange(r, -0.8, 0.8), rrange(r, 1, 1.6), 0.3, 1);
      b.paint('deep', cx, cy, 0.9, 0.3);
      st('reeds', -2.2, 0.8); st('reeds', 2, -1); st('lily_pads', 0.6, 0.3, 0, 0.9);
      if (r() < 0.5) st('rowboat', 1.6, 1.4, r() * 6.28, 0.7); else st('river_stones', -1.6, -1.2);
      break;
    case 'shrine':
      st(pick(r, ['shrine', 'statue_angel', 'totem']), 0, 0, 0, 0.9); st('fireflies', 1.5, -1); st('fireflies', -1.4, 1.2);
      for (let k = 0; k < 5; k++) st(pick(r, ['flowers', 'wildflowers', 'tulips', 'lavender']), rrange(r, -2, 2), rrange(r, -2, 2));
      break;
    case 'festive':
      st('xmas_tree', 0, -0.5, 0); st('presents', 1.4, 0.6); st('presents', -1.3, 0.8, r() * 6.28, 0.8);
      st('campfire', 0, 2.6, 0); st('log', -1.4, 2.6, Math.PI / 2); st('log', 1.4, 2.6, Math.PI / 2);
      st('snowman', 3, -1.5, rrange(r, -0.3, 0.3)); st('sled', -3, 1.5, rrange(r, -0.6, 0.6));
      st('winter_lantern', -2.2, -1.8, 0); st('winter_lantern', 2.2, 3.6, 0); st('hot_cocoa', 0.6, 3.5);
      break;
    case 'frozen':
      st('frozen_pond', 0, 0); st('snowman', 2.8, 1.8, rrange(r, -0.3, 0.3)); st('snowman', -2.6, -1.6, rrange(r, -0.3, 0.3), 0.8);
      st('sled', -2.8, 2, rrange(r, -0.6, 0.6)); st('snowballs', 2, -2.2); st('winter_lantern', 0, -2.6, 0);
      break;
    case 'wolves':
      st('bear_den', 0, 0, r() * 6.28, 0.9); for (let k = 0; k < 4; k++) st(pick(r, ['bones', 'paw_prints', 'paw_prints', 'skulls']), rrange(r, -2.5, 2.5), rrange(r, -2, 2));
      st('snow_drift', 2, -1.5);
      break;
    case 'caravan':
      st('covered_wagon', 0, 0, rrange(r, -0.4, 0.4)); st('cookfire', 0, 2.2, 0); st('bedroll', -1.4, 2.6, Math.PI / 2); st('bedroll', 1.4, 2.6, Math.PI / 2);
      st('crate', 2.2, -0.6); st('barrel', -2.2, -0.4); st('snow_drift', -2.8, -1.6);
      break;
  }
}
function forest(b: B) { woods(b, false); }
function winter(b: B) { woods(b, true); }

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
