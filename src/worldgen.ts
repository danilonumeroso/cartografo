import { CELL, Label, MapPath } from './model';
import type { MapRuntime } from './runtime';
import { B, Box, declutter, nearby, reset } from './genkit';
import { fbmTile, sampleWrap } from './noise';
import { seedNumber } from './dungeon';
import { clamp, ctx2d, makeCanvas, mulberry32, pick, Rng, rrange, smoothstep, uid } from './util';
import { t } from './i18n';

export type WorldShape = 'continent' | 'archipelago' | 'twin' | 'coast';
export interface WorldParams {
  shape: WorldShape;
  /** Share of the map covered by land, 0.2..0.7. */
  land: number;
  /** 0 = cold north, 1 = warm everywhere. */
  climate: number;
  /** 0..4: how many settlements. */
  settlements: number;
  rivers: number;
  roads: boolean;
}
export const DEFAULT_WORLD: WorldParams = { shape: 'continent', land: 0.42, climate: 0.5, settlements: 2, rivers: 2, roads: true };
export interface WorldStats { landPct: number; settlements: number; rivers: number; mountains: number; realm: string }

/** Samples of the height field per map cell. */
const S = 4;

// ------------------------------------------------------------------ names
const SYL_A = ['al', 'ar', 'bel', 'cor', 'dun', 'el', 'fal', 'gal', 'har', 'is', 'kar', 'lor', 'mar', 'nor', 'or', 'ral', 'sel', 'tal', 'ul', 'val', 'ver', 'wyn', 'zan', 'bra', 'dra', 'thal', 'mor', 'ast', 'eld', 'cal'];
const SYL_B = ['a', 'e', 'i', 'o', 'u', 'ae', 'ia', 'ea', 'or', 'en', 'an', 'ir', 'un', 'yr'];
const SYL_C = ['dor', 'mere', 'wick', 'heim', 'ford', 'gard', 'mont', 'thas', 'ria', 'vale', 'holm', 'stead', 'gate', 'reach', 'mir', 'dell', 'fen', 'crest', 'moor', 'th', 'nar', 'ros', 'lin', 'thar'];
/** Pronounceable fantasy names from a seeded syllable chain. */
export function fantasyName(r: Rng): string {
  const parts = [pick(r, SYL_A)];
  if (r() < 0.6) parts.push(pick(r, SYL_B));
  parts.push(pick(r, SYL_C));
  const s = parts.join('').replace(/(.)\1\1/g, '$1$1');
  return s[0].toUpperCase() + s.slice(1);
}

// ------------------------------------------------------------------ generator
/** Replace the map content with a generated world. Same seed + params = same world. */
export function generateWorld(rt: MapRuntime, params: WorldParams, seed: string): WorldStats {
  const doc = rt.doc;
  reset(doc);
  rt.engine.masks.clear();
  doc.paths = [];
  doc.bg = 'w_ocean';
  doc.weather = 'none';
  doc.ambient = 0;
  doc.fogEnabled = true;
  const seedN = seedNumber(seed);
  const r = mulberry32(seedN);
  const b = new B(rt, seedN ^ 0x9e3779b9);
  const C = doc.cols, R = doc.rows, gw = C * S, gh = R * S;
  const idx = (x: number, y: number) => y * gw + x;

  // ---- height field: fbm noise shaped by the chosen layout
  const N1 = fbmTile(256, params.shape === 'archipelago' ? 7 : 3, 6, seedN & 0xffff, 0.52), N2 = fbmTile(256, 8, 4, (seedN >>> 8) & 0xffff);
  const NM = fbmTile(256, 4, 5, (seedN >>> 4) & 0xffff), NT = fbmTile(256, 3, 4, (seedN >>> 12) & 0xffff);
  const ox = r() * 256, oy = r() * 256, k = 256 / Math.max(gw, gh) * 0.98;
  const centres: [number, number][] = params.shape === 'twin' ? [[0.3, 0.45], [0.72, 0.58]] : params.shape === 'coast' ? [[0.15, 0.5]] : [[0.5, 0.5]];
  const h = new Float32Array(gw * gh);
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
    const u = x / gw, v = y / gh;
    let n = sampleWrap(N1, 256, ox + x * k, oy + y * k) * 0.8 + sampleWrap(N2, 256, ox + x * k * 2, oy + y * k * 2) * 0.2;
    let shape: number;
    if (params.shape === 'archipelago') shape = 0.35;
    else if (params.shape === 'coast') shape = 1 - clamp((u - 0.05) * 1.3, 0, 1);
    else shape = Math.max(...centres.map(([cx, cy]) => 1 - Math.hypot((u - cx) * 1.25, (v - cy) * 1.5) * (params.shape === 'twin' ? 2.6 : 1.6)));
    if (params.shape === 'twin') shape -= (1 - smoothstep(0, 0.07, Math.abs(u - 0.51 - (v - 0.5) * 0.3))) * 0.5;
    // always keep a band of sea at the map edge (except the coast's land side)
    const edge = Math.min(u, v, 1 - u, 1 - v), edgeK = params.shape === 'coast' ? Math.min(v, 1 - v, 1 - u) : edge;
    n = n * 0.75 + clamp(shape, -0.6, 1) * 0.45 - (1 - smoothstep(0, 0.08, edgeK)) * 0.5;
    h[idx(x, y)] = n;
  }
  // sea level at the requested land share
  const sorted = Float32Array.from(h).sort();
  const sea = sorted[Math.floor(sorted.length * (1 - clamp(params.land, 0.15, 0.75)))];
  let hmax = -Infinity;
  for (let i = 0; i < h.length; i++) if (h[i] > hmax) hmax = h[i];
  const elev = (i: number) => (h[i] - sea) / (hmax - sea || 1);
  const isLand = (x: number, y: number) => x >= 0 && y >= 0 && x < gw && y < gh && h[idx(x, y)] > sea;

  // ---- climate
  const temp = new Float32Array(gw * gh), moist = new Float32Array(gw * gh), seaDist = new Float32Array(gw * gh).fill(1e9);
  const queue: number[] = [];
  for (let i = 0; i < h.length; i++) if (h[i] <= sea) { seaDist[i] = 0; queue.push(i); }
  for (let qi = 0; qi < queue.length; qi++) {
    const i = queue[qi], x = i % gw, y = (i / gw) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= gw || Y >= gh) continue;
      const j = idx(X, Y); if (seaDist[j] > seaDist[i] + 1) { seaDist[j] = seaDist[i] + 1; queue.push(j); }
    }
  }
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
    const i = idx(x, y), e = Math.max(0, elev(i));
    const lat = y / gh; // north (top) is colder
    temp[i] = clamp(0.15 + lat * 0.75 * (1 - params.climate * 0.5) + params.climate * 0.35 - e * 0.45 + (sampleWrap(NT, 256, x * k, y * k) - 0.5) * 0.25, 0, 1);
    moist[i] = clamp(sampleWrap(NM, 256, ox + x * k * 1.3, oy + y * k * 1.3) * 0.9 + 0.35 - Math.min(seaDist[i], 40) / 60, 0, 1);
  }
  const biomeOf = (i: number): string | null => {
    const e = elev(i), T = temp[i], M = moist[i];
    if (e > 0.62) return T < 0.3 ? 'w_snow' : 'w_highland';
    if (T < 0.18) return 'w_snow';
    if (T < 0.3) return 'w_tundra';
    if (T > 0.72 && M > 0.58) return 'w_jungle';
    if (T > 0.6 && M < 0.3) return e > 0.35 ? 'w_badlands' : 'w_desert';
    if (M < 0.36) return 'w_steppe';
    if (M > 0.68 && e < 0.12) return 'w_swamp';
    if (M > 0.48) return 'w_forest';
    return null;
  };

  // ---- paint land and biome masks from small canvases scaled up
  const paintMask = (key: string, alpha: (i: number) => number, soften = 0) => {
    const small = makeCanvas(gw, gh), sc = ctx2d(small), img = sc.createImageData(gw, gh);
    let a = new Float32Array(gw * gh), any = false;
    for (let i = 0; i < gw * gh; i++) { a[i] = alpha(i); if (a[i] > 0) any = true; }
    // box-blur passes round off the stair steps of the sample grid
    for (let pass = 0; pass < soften; pass++) {
      const o = new Float32Array(gw * gh);
      for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
        let s2 = 0, n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < gw && Y < gh) { s2 += a[Y * gw + X]; n++; } }
        o[y * gw + x] = s2 / n;
      }
      a = o;
    }
    for (let i = 0; i < gw * gh; i++) { img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = 255; img.data[i * 4 + 3] = a[i] * 255; }
    if (!any) return;
    sc.putImageData(img, 0, 0);
    const m = rt.engine.mask(key, true)!, mc = ctx2d(m);
    mc.imageSmoothingEnabled = true; mc.imageSmoothingQuality = 'high';
    mc.drawImage(small, 0, 0, m.width, m.height);
    rt.engine.changed.add(key);
  };
  paintMask('land', (i) => smoothstep(sea - 0.004, sea + 0.004, h[i]));
  const biome = new Array<string | null>(gw * gh);
  for (let i = 0; i < h.length; i++) biome[i] = h[i] > sea ? biomeOf(i) : null;
  // biome masks are softened, then masked to land by the engine
  for (const id of ['w_forest', 'w_jungle', 'w_steppe', 'w_desert', 'w_badlands', 'w_swamp', 'w_highland', 'w_tundra', 'w_snow']) paintMask(id, (i) => (biome[i] === id ? 1 : 0), 2);

  // ---- icons (collected, then pushed sorted by y so lower icons overlap upper ones)
  const icons: { type: string; x: number; y: number; scale: number }[] = [];
  const taken = new Uint8Array(gw * gh);
  const free = (x: number, y: number, rad: number) => { for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < gw && Y < gh && taken[idx(X, Y)]) return false; } return true; };
  const take = (x: number, y: number, rad: number) => { for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < gw && Y < gh) taken[idx(X, Y)] = 1; } };
  const toCell = (x: number, y: number): [number, number] => [(x + 0.5) / S, (y + 0.5) / S];

  // ---- rivers: from high ground down the steepest slope to the sea
  const riverCell = new Uint8Array(gw * gh);
  const nRivers = [0, 3, 6, 10, 14][clamp(Math.round(params.rivers), 0, 4)] * (C * R) / (48 * 32);
  const sources = [] as number[];
  for (let i = 0; i < h.length; i++) if (elev(i) > 0.45 && elev(i) < 0.8 && moist[i] > 0.35) sources.push(i);
  let riversMade = 0;
  for (let tries = 0; tries < nRivers * 6 && riversMade < nRivers && sources.length; tries++) {
    const s0 = pick(r, sources);
    let x = s0 % gw, y = (s0 / gw) | 0;
    if (!free(x, y, 3) || riverCell[s0]) continue;
    const pts: number[] = [];
    const seen = new Set<number>();
    let ok = false;
    for (let step = 0; step < gw * 2; step++) {
      const i = idx(x, y);
      seen.add(i);
      pts.push(((x + 0.5) / S) * CELL + rrange(r, -6, 6), ((y + 0.5) / S) * CELL + rrange(r, -6, 6));
      if (h[i] <= sea || riverCell[i]) { ok = true; break; }
      let best = -1, bh = Infinity;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
        const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= gw || Y >= gh) continue;
        const j = idx(X, Y); if (seen.has(j)) continue;
        // a little noise keeps rivers from running in straight lines
        const v = h[j] + rrange(r, 0, 0.004);
        if (v < bh) { bh = v; best = j; }
      }
      // a basin with no way down: the river would meander in circles, so drop it
      if (best < 0 || bh > h[i] + 0.003) break;
      x = best % gw; y = (best / gw) | 0;
    }
    if (!ok || pts.length < 10) continue;
    // keep every other point for smooth curves; mark the cells as river
    const simple: number[] = [];
    for (let p = 0; p < pts.length; p += 4) simple.push(pts[p], pts[p + 1]);
    simple.push(pts[pts.length - 2], pts[pts.length - 1]);
    for (const i of seen) riverCell[i] = 1;
    doc.paths.push({ id: uid(), kind: 'river', pts: simple, width: rrange(r, 9, 14) } as MapPath);
    riversMade++;
  }

  // ---- mountains and hills
  let mountains = 0;
  for (let y = 1; y < gh - 1; y += 3) for (let x = 1; x < gw - 1; x += 3) {
    const jx = clamp(x + Math.floor(rrange(r, -1, 2)), 0, gw - 1), jy = clamp(y + Math.floor(rrange(r, -1, 2)), 0, gh - 1), i = idx(jx, jy);
    if (h[i] <= sea || riverCell[i]) continue;
    const e = elev(i);
    if (e > 0.6 && free(jx, jy, 1)) {
      const big = e > 0.75 && r() < 0.45;
      icons.push({ type: temp[i] < 0.32 ? 'w_snowpeaks' : big ? 'w_mountains' : 'w_mountain', x: toCell(jx, jy)[0], y: toCell(jx, jy)[1], scale: big ? rrange(r, 0.7, 0.9) : rrange(r, 0.8, 1.1) });
      take(jx, jy, big ? 2 : 1); mountains++;
    } else if (e > 0.42 && r() < 0.35 && free(jx, jy, 1)) {
      icons.push({ type: 'w_hills', x: toCell(jx, jy)[0], y: toCell(jx, jy)[1], scale: rrange(r, 0.7, 0.95) }); take(jx, jy, 1);
    }
  }
  // a volcano on the highest warm peak, sometimes
  if (r() < 0.45) {
    let best = -1;
    for (let i = 0; i < h.length; i++) if (h[i] > sea && temp[i] > 0.35 && (best < 0 || h[i] > h[best])) best = i;
    if (best >= 0) { const [cx, cy] = toCell(best % gw, (best / gw) | 0); icons.push({ type: 'w_volcano', x: cx, y: cy - 0.3, scale: 0.9 }); take(best % gw, (best / gw) | 0, 2); }
  }

  // ---- settlements, preferring flat land by coasts and rivers
  const counts = [[0, 1, 2], [2, 3, 4], [3, 5, 8], [5, 8, 12], [7, 11, 16]][clamp(Math.round(params.settlements), 0, 4)];
  const areaK = Math.max(0.5, (C * R) / (48 * 32) * (params.land / 0.42));
  const want = { city: Math.round(counts[0] * areaK), town: Math.round(counts[1] * areaK), village: Math.round(counts[2] * areaK) };
  const score = (i: number) => {
    const e = elev(i), bm = biome[i], x = i % gw, y = (i / gw) | 0;
    if (h[i] <= sea || e > 0.5 || riverCell[i]) return -1;
    let s = 1 - e;
    if (seaDist[i] <= 2) s += 0.8;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < gw && Y < gh && riverCell[idx(X, Y)]) { s += 0.7; dy = 3; break; } }
    if (bm === 'w_snow' || bm === 'w_desert' || bm === 'w_swamp' || bm === 'w_badlands') s -= 0.8;
    return s + r() * 0.6;
  };
  const cand: number[] = [];
  for (let y = 2; y < gh - 2; y += 2) for (let x = 2; x < gw - 2; x += 2) { const i = idx(x, y); if (score(i) > 0) cand.push(i); }
  cand.sort((a, c2) => score(c2) - score(a));
  const towns: { x: number; y: number; kind: string; name: string; i: number }[] = [];
  const place = (kind: 'capital' | 'city' | 'town' | 'village', count: number, minDist: number) => {
    for (const i of cand) {
      if (count <= 0) break;
      const x = i % gw, y = (i / gw) | 0;
      if (!free(x, y, 2) || towns.some((t2) => Math.hypot(t2.x - x, t2.y - y) < minDist)) continue;
      const coastal = seaDist[i] <= 2;
      const type = kind === 'capital' ? 'w_capital' : kind === 'city' ? (coastal && r() < 0.6 ? 'w_port' : 'w_city') : kind === 'town' ? (coastal && r() < 0.35 ? 'w_port' : 'w_town') : 'w_village';
      const [cx, cy] = toCell(x, y);
      icons.push({ type, x: cx, y: cy, scale: kind === 'village' ? 0.85 : 1 });
      take(x, y, kind === 'village' ? 1 : 2);
      towns.push({ x, y, kind, name: fantasyName(r), i });
      count--;
    }
  };
  if (want.city + want.town + want.village > 0) place('capital', 1, 0);
  place('city', want.city, S * 7);
  place('town', want.town, S * 5);
  place('village', want.village, S * 3);

  // ---- points of interest
  const landCells = cand.length ? cand : [];
  const poi = (type: string, n: number, ok: (i: number) => boolean) => {
    for (let k2 = 0, tries = 0; k2 < n && tries < 200; tries++) {
      const i = pick(r, landCells.length ? landCells : [0]); if (!ok(i)) continue;
      const x = i % gw, y = (i / gw) | 0; if (!free(x, y, 2)) continue;
      const [cx, cy] = toCell(x, y); icons.push({ type, x: cx, y: cy, scale: 0.9 }); take(x, y, 2); k2++;
    }
  };
  const nearMountains = (i: number) => { const x = i % gw, y = (i / gw) | 0; for (let dy = -6; dy <= 6; dy += 2) for (let dx = -6; dx <= 6; dx += 2) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < gw && Y < gh && elev(idx(X, Y)) > 0.6) return true; } return false; };
  const scaleK = Math.max(1, Math.round(areaK));
  poi('w_castle', scaleK, () => true);
  poi('w_mine', scaleK, nearMountains);
  poi('w_ruins', scaleK + 1, () => true);
  poi('w_tower', scaleK, () => r() < 0.5);
  poi('w_temple', 1, () => true);
  poi('w_cave', scaleK, nearMountains);
  poi('w_lair', scaleK, (i) => seaDist[i] > 6);
  poi('w_stones', 1, (i) => biome[i] === 'w_forest' || biome[i] === null);

  // ---- forests and other biome decorations on the free land left
  for (let y = 1; y < gh - 1; y += 3) for (let x = 1; x < gw - 1; x += 3) {
    const jx = clamp(x + Math.floor(rrange(r, -1, 2)), 0, gw - 1), jy = clamp(y + Math.floor(rrange(r, -1, 2)), 0, gh - 1), i = idx(jx, jy);
    if (h[i] <= sea || riverCell[i] || !free(jx, jy, 1)) continue;
    const bm = biome[i];
    let type: string | null = null, p = 0;
    if (bm === 'w_forest') { type = temp[i] < 0.42 ? 'w_pines' : 'w_forest'; p = 0.75; }
    else if (bm === 'w_jungle') { type = 'w_jungle'; p = 0.8; }
    else if (bm === 'w_tundra') { type = 'w_pines'; p = 0.25; }
    else if (bm === 'w_swamp') { type = r() < 0.5 ? 'w_swamp' : 'w_deadwood'; p = 0.5; }
    else if (bm === 'w_desert') { type = r() < 0.7 ? 'w_dunes' : 'w_cactus'; p = 0.3; }
    else if (bm === 'w_badlands') { type = 'w_mesa'; p = 0.3; }
    else if (bm === null && moist[i] > 0.42) { type = 'w_forest'; p = 0.12; }
    if (type && r() < p) { const [cx, cy] = toCell(jx, jy); icons.push({ type, x: cx, y: cy, scale: rrange(r, 0.75, 1) }); take(jx, jy, 1); }
  }

  // ---- roads between settlements (minimum spanning tree, routed around water and mountains)
  if (params.roads && towns.length > 1) {
    const inTree = [0], edges: [number, number][] = [];
    while (inTree.length < towns.length) {
      let best: [number, number] | null = null, bd = Infinity;
      for (const a of inTree) for (let c2 = 0; c2 < towns.length; c2++) {
        if (inTree.includes(c2)) continue;
        const d = Math.hypot(towns[a].x - towns[c2].x, towns[a].y - towns[c2].y);
        if (d < bd) { bd = d; best = [a, c2]; }
      }
      if (!best) break;
      inTree.push(best[1]); edges.push(best);
    }
    for (const [a, c2] of edges) {
      const route = astar(towns[a].i, towns[c2].i, gw, gh, (i) => (h[i] <= sea ? Infinity : 1 + Math.max(0, elev(i) - 0.4) * 12 + (riverCell[i] ? 3 : 0)));
      if (!route || route.length < 2) continue;
      const pts: number[] = [];
      for (let p = 0; p < route.length; p += 3) { const i = route[p]; pts.push((((i % gw) + 0.5) / S) * CELL, ((((i / gw) | 0) + 0.5) / S) * CELL); }
      const last = route[route.length - 1]; pts.push((((last % gw) + 0.5) / S) * CELL, ((((last / gw) | 0) + 0.5) / S) * CELL);
      const minor = towns[a].kind === 'village' || towns[c2].kind === 'village';
      doc.paths.push({ id: uid(), kind: minor ? 'trail' : 'road', pts, width: minor ? 5 : 7 });
    }
  }

  // ---- sea decorations
  const seaCells: number[] = [];
  for (let y = 2; y < gh - 2; y += 3) for (let x = 2; x < gw - 2; x += 3) if (seaDist[idx(x, y)] === 0 && !isLand(x, y)) seaCells.push(idx(x, y));
  const deepSea = (i: number) => { const x = i % gw, y = (i / gw) | 0; for (let dy = -8; dy <= 8; dy += 2) for (let dx = -8; dx <= 8; dx += 2) if (isLand(x + dx, y + dy)) return false; return true; };
  const seaIcon = (type: string, n: number, deep: boolean) => {
    for (let k2 = 0, tries = 0; k2 < n && tries < 120 && seaCells.length; tries++) {
      const i = pick(r, seaCells); if (deep && !deepSea(i)) continue; const x = i % gw, y = (i / gw) | 0; if (!free(x, y, 3)) continue;
      const [cx, cy] = toCell(x, y); icons.push({ type, x: cx, y: cy, scale: 1 }); take(x, y, 3); k2++;
    }
  };
  seaIcon('w_ship', Math.max(1, Math.round(areaK * 2)), false);
  seaIcon(r() < 0.5 ? 'w_serpent' : 'w_kraken', 1, true);
  if (r() < 0.5) seaIcon('w_whirlpool', 1, true);
  // compass rose in the emptiest sea corner
  const corners: [number, number][] = [[3, 3], [C - 3, 3], [3, R - 3], [C - 3, R - 3]];
  const cornerScore = ([cx, cy]: [number, number]) => { let n = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (isLand(Math.floor((cx + dx) * S), Math.floor((cy + dy) * S))) n++; return n; };
  const corner = [...corners].sort((a, c2) => cornerScore(a) - cornerScore(c2))[0];

  // ---- push icons sorted by y
  icons.sort((a, c2) => a.y - c2.y);
  for (const ic of icons) b.stamp(ic.type, ic.x, ic.y, 0, ic.scale);
  if (cornerScore(corner) < 6) b.stamp('w_compass', corner[0], corner[1], 0, 1);

  // ---- labels
  const label = (text: string, x: number, y: number, size: number, opts: Partial<Label> = {}) => {
    const l = b.label(text, x, y, size, false);
    Object.assign(l, { font: 'IM Fell English', color: '#2a1e14', stroke: 'rgba(244,236,216,0.85)', bold: false }, opts);
    return l;
  };
  // labels are laid out at the end (declutter): towns first, they sit under their icon or just above it
  const layout: { l: Label; moves: [number, number][] }[] = [];
  const townBoxes: Box[] = [];
  for (const tw of towns) {
    const [cx, cy] = toCell(tw.x, tw.y);
    const size = tw.kind === 'capital' ? 54 : tw.kind === 'city' ? 42 : tw.kind === 'town' ? 34 : 27;
    const off = tw.kind === 'village' ? 0.6 : tw.kind === 'capital' ? 1.05 : 0.8;
    const l = label(tw.name, cx, cy + off, size, tw.kind === 'capital' ? { bold: true, font: 'Cinzel' } : {});
    layout.push({ l, moves: [[0, 0], [0, -2 * off], [0, 0.4], [0, -2 * off - 0.4]] });
    townBoxes.push({ x0: (cx - 0.45) * CELL, y0: (cy - 0.5) * CELL, x1: (cx + 0.45) * CELL, y1: (cy + 0.35) * CELL });
  }
  // the realm, named after the capital, over the biggest stretch of land
  const realm = towns[0]?.name ?? fantasyName(r);
  if (towns[0]) { const [cx, cy] = toCell(towns[0].x, towns[0].y); layout.push({ l: label(t('Kingdom of {name}', { name: realm }).toUpperCase(), cx, cy - 1.8, 64, { font: 'Cinzel', color: 'rgba(60,30,20,0.75)', italic: false, bold: true }), moves: nearby(3, 4) }); }
  // seas: label the open water far from land
  const seaLabels = seaCells.filter((i) => deepSea(i) && (i % gw) > gw * 0.18 && (i % gw) < gw * 0.82);
  if (seaLabels.length) {
    const i = pick(r, seaLabels), [cx, cy] = toCell(i % gw, (i / gw) | 0);
    layout.push({ l: label(pick(r, [t('Sea of {name}', { name: fantasyName(r) }), t('The {name} Ocean', { name: fantasyName(r) })]), cx, cy, 60, { color: 'rgba(230,245,255,0.92)', stroke: 'rgba(20,50,70,0.7)', italic: true }), moves: nearby(3, 6) });
  }
  // the main mountain range
  const peaks = icons.filter((ic) => ic.type === 'w_mountains' || ic.type === 'w_snowpeaks');
  if (peaks.length >= 3) {
    // centre of the densest cluster of peaks, not the average of every range
    const near = (p: { x: number; y: number }) => peaks.filter((q) => Math.hypot(q.x - p.x, q.y - p.y) < 4).length;
    const hub = peaks.reduce((a, p) => (near(p) > near(a) ? p : a), peaks[0]);
    const group = peaks.filter((q) => Math.hypot(q.x - hub.x, q.y - hub.y) < 4);
    const mx = group.reduce((s2, p) => s2 + p.x, 0) / group.length, my = Math.max(...group.map((p) => p.y));
    layout.push({ l: label(t('{name} Mountains', { name: fantasyName(r) }), mx, my + 0.9, 44, { italic: true, color: 'rgba(50,35,25,0.85)' }), moves: nearby(2, 3) });
  }
  // the biggest forest
  const forestIcons = icons.filter((ic) => ic.type === 'w_forest' || ic.type === 'w_pines');
  if (forestIcons.length >= 5) {
    const f = pick(r, forestIcons);
    layout.push({ l: label(t('{name} Woods', { name: fantasyName(r) }), f.x, f.y + 0.8, 36, { italic: true, color: 'rgba(30,50,25,0.9)' }), moves: nearby(2, 3) });
  }
  declutter(rt.doc, layout, townBoxes);

  for (const k2 of rt.engine.masks.keys()) rt.engine.changed.add(k2);
  rt.fog.fillAll();
  rt.engine.invalidateAll();
  let land = 0; for (let i = 0; i < h.length; i++) if (h[i] > sea) land++;
  return { landPct: land / h.length, settlements: towns.length, rivers: riversMade, mountains, realm: t('Kingdom of {name}', { name: realm }) };
}

/** A* on the sample grid with 8-way moves; returns sample indices from a to b. */
function astar(a: number, b: number, gw: number, gh: number, cost: (i: number) => number): number[] | null {
  const n = gw * gh, g = new Float32Array(n).fill(Infinity), from = new Int32Array(n).fill(-1), closed = new Uint8Array(n);
  const bx = b % gw, by = (b / gw) | 0;
  const heur = (i: number) => Math.hypot((i % gw) - bx, ((i / gw) | 0) - by);
  // binary heap of [f, i]
  const heap: [number, number][] = [];
  const push = (f: number, i: number) => { heap.push([f, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => { const top = heap[0], last = heap.pop()!; if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = k * 2 + 1, rr = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (rr < heap.length && heap[rr][0] < heap[m][0]) m = rr; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
  g[a] = 0; push(heur(a), a);
  let iter = 0;
  while (heap.length && iter++ < n * 4) {
    const [, i] = pop();
    if (i === b) { const path = [b]; let k = b; while (from[k] >= 0) { k = from[k]; path.push(k); } return path.reverse(); }
    if (closed[i]) continue; closed[i] = 1;
    const x = i % gw, y = (i / gw) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= gw || Y >= gh) continue;
      const j = Y * gw + X; if (closed[j]) continue;
      const c = cost(j); if (!isFinite(c)) continue;
      const ng = g[i] + c * (dx && dy ? Math.SQRT2 : 1);
      if (ng < g[j]) { g[j] = ng; from[j] = i; push(ng + heur(j), j); }
    }
  }
  return null;
}
