import { t } from '../i18n';
import {
  at, ball, blob, bone, boulder, C2D, circ, clip, coals, ell, fs, gem, glow, GOLD, INK, IRON, lin, line, METAL, METAL_D, pick, poly, radial,
  rect, rock, rod, rrange, rrect, shade, shadow, skull, sparkle, StampDef, st, STONE, TAU, WOOD, WOOD_D, WOOD_L, magicFlame,
} from '../art';
import { mulberry32, type Rng } from '../util';

/** Pointed crystal shard from (0,0) toward angle a. */
function shard(c: C2D, a: number, L: number, W: number, col: string, off = 0) {
  at(c, 0, 0, a, () => {
    c.translate(off, 0);
    shadow(c, true, 4, 2, 3, 0.45);
    poly(c, [0, -W, L * 0.72, -W, L, 0, L * 0.72, W, 0, W]); fs(c, shade(col, -0.15), 1.6);
    shadow(c, false);
    poly(c, [0, -W, L * 0.72, -W, L, 0, 0, 0]); c.fillStyle = shade(col, 0.25); c.fill();
    line(c, 0, 0, L, 0, 'rgba(255,255,255,0.6)', 1.2);
    line(c, L * 0.1, -W * 0.6, L * 0.6, -W * 0.6, 'rgba(255,255,255,0.45)', 1);
  });
}
function crystalCluster(c: C2D, r: Rng, R: number, col: string, rgb: string, n = 9) {
  glow(c, 0, 0, R * 1.3, rgb, 0.4);
  // rocky base the crystals grow from
  for (let i = 0; i < 5; i++) boulder(c, r, rrange(r, -R * 0.35, R * 0.35), rrange(r, -R * 0.35, R * 0.35), rrange(r, R * 0.18, R * 0.3), '#6e665c');
  const groups = 3 + Math.floor(r() * 2);
  const shards: [number, number, number, number, number][] = [];
  for (let g = 0; g < groups; g++) {
    const gx = rrange(r, -R * 0.35, R * 0.35), gy = rrange(r, -R * 0.35, R * 0.35), a0 = r() * TAU, k = Math.ceil(n / groups);
    for (let i = 0; i < k; i++) shards.push([gx, gy, a0 + rrange(r, -0.8, 0.8), rrange(r, R * 0.35, R * 0.85), rrange(r, R * 0.07, R * 0.14)]);
  }
  shards.sort((p, q) => p[3] - q[3]);
  for (const [x, y, a, L, W] of shards) at(c, x, y, 0, () => shard(c, a, L, W, shade(col, rrange(r, -0.12, 0.12))));
  for (let i = 0; i < 6; i++) sparkle(c, rrange(r, -R * 0.7, R * 0.7), rrange(r, -R * 0.7, R * 0.7), rrange(r, 2, 4.5));
}
function stalag(c: C2D, r: Rng, x: number, y: number, R: number) {
  at(c, x, y, 0, () => {
    shadow(c, true, 8, 4, 6, 0.6); blob(c, r, R, 10, 0.18); fs(c, radial(c, 0, 0, R, '#b1a494', '#4e443b', 0.25), 2); shadow(c, false);
    for (const k of [0.72, 0.5, 0.3, 0.14]) { blob(c, r, R * k, 9, 0.15, -R * (0.7 - k) * 0.2, -R * (0.7 - k) * 0.2); c.fillStyle = `rgba(255,245,230,${0.1 + (0.72 - k) * 0.28})`; c.fill(); }
  });
}

export const CAVES: StampDef[] = [
  { id: 'stalagmites', name: t('Stalagmite cluster'), cat: 'caves', w: 1.6, h: 1.6, layer: 1, tags: 'stalagmite rock spikes cave', draw: (c, r, w) => {
    const n = 5 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) { const a = r() * TAU, d = Math.sqrt(r()) * w * 0.28; stalag(c, r, Math.cos(a) * d, Math.sin(a) * d, rrange(r, w * 0.08, w * 0.2)); }
  } },
  { id: 'cave_column', name: t('Cave column'), cat: 'caves', w: 1.6, h: 1.6, layer: 1, tags: 'column stalagnate pillar rock', draw: (c, r, w) => {
    const R = w * 0.4;
    shadow(c, true, 14, 8, 10, 0.6); blob(c, r, R, 14, 0.15); fs(c, radial(c, 0, 0, R, '#9a8e80', '#3e362e', 0.3), 2.4); shadow(c, false);
    for (let k = 0; k < 6; k++) { blob(c, r, R * (0.85 - k * 0.13), 12, 0.12, -k * 2, -k * 2); c.fillStyle = `rgba(255,240,220,${0.05 + k * 0.035})`; c.fill(); st(c, 'rgba(40,30,20,0.25)', 1); }
    for (let i = 0; i < 4; i++) stalag(c, r, Math.cos(i * 1.7) * R * 1.05, Math.sin(i * 1.7) * R * 1.05, rrange(r, 7, 12));
  } },
  { id: 'crystals_blue', name: t('Ice crystals'), cat: 'caves', w: 1.8, h: 1.8, layer: 1, light: { radius: 4, color: '#8ad8ff', intensity: 0.75 }, tags: 'crystal blue ice glowing gems', draw: (c, r, w) => crystalCluster(c, r, w * 0.38, '#7ac8f0', '120,210,255', 11) },
  { id: 'crystals_red', name: t('Fire crystals'), cat: 'caves', w: 1.8, h: 1.8, layer: 1, light: { radius: 4, color: '#ff7a5a', intensity: 0.75 }, tags: 'crystal red fire glowing gems ruby', draw: (c, r, w) => crystalCluster(c, r, w * 0.38, '#f0604a', '255,100,70', 11) },
  { id: 'crystals_green', name: t('Emerald crystals'), cat: 'caves', w: 1.8, h: 1.8, layer: 1, light: { radius: 4, color: '#7aff9a', intensity: 0.7 }, tags: 'crystal green glowing gems emerald', draw: (c, r, w) => crystalCluster(c, r, w * 0.38, '#4ad080', '90,255,140', 11) },
  { id: 'geode', name: 'Geode', cat: 'caves', w: 1.2, h: 1.2, layer: 1, light: { radius: 2, color: '#d08aff', intensity: 0.45 }, tags: 'geode amethyst crystal rock', draw: (c, r, w) => {
    const R = w * 0.38;
    shadow(c, true, 8, 4, 6); blob(c, r, R, 11, 0.12); fs(c, radial(c, 0, 0, R, '#9a8c80', '#4a4038'), 2.2); shadow(c, false);
    blob(c, r, R * 0.7, 10, 0.12); fs(c, '#e8e0f0', 1.2);
    const seed = Math.floor(r() * 1e9), inner = () => blob(c, mulberry32(seed), R * 0.6, 10, 0.1);
    inner(); c.fillStyle = radial(c, 0, 0, R * 0.6, '#f0d0ff', '#5a1a8a', 0); c.fill();
    clip(c, inner, () => { for (let i = 0; i < 26; i++) { const a = r() * TAU, d = R * rrange(r, 0.2, 0.6); gem(c, Math.cos(a) * d, Math.sin(a) * d, rrange(r, 3, 6), '#b070e0', 5, r()); } });
    glow(c, 0, 0, R * 0.8, '200,120,255', 0.3);
  } },
  { id: 'lava_vent', name: t('Lava vent'), cat: 'caves', w: 1.4, h: 1.4, layer: 0, light: { radius: 4, color: '#ff6a2a', intensity: 0.85 }, tags: 'lava magma fire volcano crack', draw: (c, r, w) => {
    const R = w * 0.38;
    glow(c, 0, 0, R * 1.6, '255,110,30', 0.4);
    const plateSeed = Math.floor(r() * 1e9), plate = () => blob(c, mulberry32(plateSeed), R, 13, 0.2);
    shadow(c, true, 6, 2, 3, 0.5); plate(); fs(c, radial(c, 0, 0, R, '#4a3428', '#20160f', 0.2), 2); shadow(c, false);
    clip(c, plate, () => {
      for (let i = 0; i < 26; i++) { blob(c, r, rrange(r, R * 0.1, R * 0.22), 6, 0.3, rrange(r, -R, R), rrange(r, -R, R)); c.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '120,90,70'},0.25)`; c.fill(); st(c, 'rgba(255,110,20,0.55)', 1.2); }
    });
    blob(c, r, R * 0.55, 10, 0.2); fs(c, '#2a160c', 2.4);
    const seed = Math.floor(r() * 1e9), core = () => blob(c, mulberry32(seed), R * 0.42, 9, 0.2);
    core(); c.fillStyle = radial(c, 0, 0, R * 0.42, '#fff0a0', '#ff4a0a', 0); c.fill();
    clip(c, core, () => { for (let i = 0; i < 6; i++) { blob(c, r, rrange(r, 3, 7), 6, 0.3, rrange(r, -R * 0.3, R * 0.3), rrange(r, -R * 0.3, R * 0.3)); c.fillStyle = 'rgba(120,30,5,0.6)'; c.fill(); } });
  } },
  { id: 'steam_vent', name: t('Steam vent'), cat: 'caves', w: 1.2, h: 1.2, layer: 2, tags: 'steam geyser vapor fumarole', draw: (c, r, w) => {
    const R = w * 0.4;
    for (let i = 0; i < 9; i++) { const a = r() * TAU, d = rrange(r, 0, R * 0.6); blob(c, r, rrange(r, R * 0.25, R * 0.5), 9, 0.2, Math.cos(a) * d, Math.sin(a) * d); c.fillStyle = `rgba(235,240,245,${rrange(r, 0.12, 0.25)})`; c.fill(); }
    circ(c, 0, 0, R * 0.16); c.fillStyle = 'rgba(20,15,10,0.7)'; c.fill();
  } },
  { id: 'ore_vein', name: t('Ore vein'), cat: 'caves', w: 1.6, h: 1.6, layer: 0, tags: 'gold ore vein mine mineral', draw: (c, r, w) => {
    const col = pick(r, ['#e8c040', '#d8dce0', '#c87a4a']);
    for (let i = 0; i < 3; i++) { let x = rrange(r, -w * 0.3, w * 0.3), y = rrange(r, -w * 0.3, w * 0.3), a = r() * TAU; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 7; k++) { a += rrange(r, -0.6, 0.6); x += Math.cos(a) * 10; y += Math.sin(a) * 10; c.lineTo(x, y); } st(c, 'rgba(20,15,10,0.55)', 5); st(c, col, 2);
      for (let k = 0; k < 6; k++) { circ(c, x + rrange(r, -30, 30) * 0.5, y + rrange(r, -30, 30) * 0.5, rrange(r, 1.5, 3.5)); fs(c, ball(c, 0, 0, 3, col.startsWith('#e8') ? '#f0d060' : col), 0.6); } }
    for (let i = 0; i < 14; i++) sparkle(c, rrange(r, -w * 0.35, w * 0.35), rrange(r, -w * 0.35, w * 0.35), rrange(r, 1.5, 3));
  } },
  { id: 'mine_supports', name: t('Mine supports'), cat: 'caves', w: 2, h: 0.6, layer: 1, tags: 'timber beams mine shaft frame', draw: (c, r, w, h) => {
    const W = w * 0.92;
    for (const s of [-1, 1]) { shadow(c, true, 6, 3, 5); rect(c, s * W / 2 - (s > 0 ? 16 : 0), -h * 0.3, 16, h * 0.6); fs(c, WOOD_D, 1.8); shadow(c, false); }
    shadow(c, true, 6, 3, 5); rect(c, -W / 2, -8, W, 16); fs(c, lin(c, 0, -8, 0, 8, [[0, WOOD_L], [1, WOOD_D]]), 1.8); shadow(c, false);
    for (let i = 0; i < 3; i++) line(c, -W / 2 + 6, -4 + i * 4, W / 2 - 6, -4 + i * 4 + rrange(r, -1, 1), 'rgba(40,20,5,0.4)', 1);
    for (const s of [-1, 1]) { circ(c, s * (W / 2 - 8), 0, 2.5); fs(c, METAL, 0.8); }
  } },
  { id: 'minecart', name: t('Minecart'), cat: 'caves', w: 1, h: 1.5, layer: 1, tags: 'mine cart ore rails', draw: (c, r, w, h) => {
    const W = w * 0.62, H = h * 0.62;
    for (const sx of [-1, 1]) for (const sy of [-0.3, 0.3]) { rrect(c, sx * (W / 2 + 3) - 4, sy * H - 9, 8, 18, 3); fs(c, IRON, 1.4); }
    shadow(c, true, 8, 3, 6); rrect(c, -W / 2, -H / 2, W, H, 4); fs(c, lin(c, -W / 2, 0, W / 2, 0, [[0, '#6a6e74'], [1, '#3a3e44']]), 2.2); shadow(c, false);
    rrect(c, -W / 2 + 6, -H / 2 + 6, W - 12, H - 12, 3); c.fillStyle = '#1a1410'; c.fill();
    clip(c, () => rrect(c, -W / 2 + 6, -H / 2 + 6, W - 12, H - 12, 3), () => { for (let i = 0; i < 14; i++) boulder(c, r, rrange(r, -W * 0.35, W * 0.35), rrange(r, -H * 0.4, H * 0.4), rrange(r, 6, 10), pick(r, ['#6a5a50', '#5a4a44', '#7a6458'])); for (let i = 0; i < 8; i++) { circ(c, rrange(r, -W * 0.3, W * 0.3), rrange(r, -H * 0.35, H * 0.35), 2); c.fillStyle = pick(r, ['#e8c040', '#c87a4a']); c.fill(); } });
    for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { circ(c, x * (W / 2 - 3), y * (H / 2 - 3), 2.4); fs(c, METAL, 0.8); }
    rod(c, 0, -H / 2, 0, -H / 2 - 10, METAL_D, 3);
  } },
  { id: 'rails', name: t('Mine rails'), cat: 'caves', w: 1, h: 2, layer: 0, tags: 'rails track mine', draw: (c, r, w, h) => {
    const G = w * 0.3, H = h;
    for (let i = 0; i < 6; i++) { const y = -H / 2 + (i + 0.5) * H / 6; shadow(c, true, 3, 1, 2, 0.4); rect(c, -G - 12, y - 6, G * 2 + 24, 12); fs(c, shade(WOOD_D, rrange(r, -0.1, 0.1)), 1.4); shadow(c, false); }
    for (const s of [-1, 1]) { rect(c, s * G - 3, -H / 2, 6, H); fs(c, lin(c, s * G - 3, 0, s * G + 3, 0, [[0, '#9aa0a6'], [1, '#3a3e44']]), 1.2); }
  } },
  { id: 'giant_mushroom', name: t('Giant mushroom'), cat: 'caves', w: 2.5, h: 2.5, layer: 2, light: { radius: 3, color: '#a07aff', intensity: 0.45 }, tags: 'mushroom fungus underdark giant purple', draw: (c, r, w) => {
    const R = w * 0.42, col = pick(r, ['#8a4ac0', '#c04a5a', '#4a8ac0', '#c0864a']);
    shadow(c, true, 18, 10, 14, 0.5); circ(c, 0, 0, R); fs(c, radial(c, 0, 0, R, shade(col, 0.35), shade(col, -0.35), 0.4), 2.6); shadow(c, false);
    for (let k = 1; k < 4; k++) { c.beginPath(); c.arc(-R * 0.05 * k, -R * 0.05 * k, R * (1 - k * 0.22), Math.PI * 0.9, Math.PI * 1.6); st(c, 'rgba(255,255,255,0.18)', 3); }
    for (let i = 0; i < 16; i++) { const a = r() * TAU, d = Math.sqrt(r()) * R * 0.82, x = Math.cos(a) * d, y = Math.sin(a) * d, s = rrange(r, 4, 10); blob(c, r, s, 7, 0.25, x, y); fs(c, radial(c, x, y, s, '#fffbe8', '#d8d0b0'), 1); glow(c, x, y, s * 2, '220,200,255', 0.25); }
    for (let i = 0; i < 40; i++) { const a = (i / 40) * TAU; line(c, Math.cos(a) * R * 0.96, Math.sin(a) * R * 0.96, Math.cos(a) * R * 1.0, Math.sin(a) * R * 1.0, 'rgba(0,0,0,0.3)', 1); }
  } },
  { id: 'cave_moss', name: t('Cave moss'), cat: 'caves', w: 1.5, h: 1.5, layer: 0, tags: 'moss lichen growth', draw: (c, r, w) => {
    const cols = ['rgba(90,130,50,0.7)', 'rgba(120,160,60,0.6)', 'rgba(60,100,40,0.7)'];
    for (let i = 0; i < 30; i++) { const a = r() * TAU, d = Math.sqrt(r()) * w * 0.4; blob(c, r, rrange(r, 4, 12), 7, 0.3, Math.cos(a) * d, Math.sin(a) * d); c.fillStyle = pick(r, cols); c.fill(); }
    for (let i = 0; i < 40; i++) { const a = r() * TAU, d = Math.sqrt(r()) * w * 0.4; circ(c, Math.cos(a) * d, Math.sin(a) * d, rrange(r, 0.8, 2)); c.fillStyle = 'rgba(200,230,120,0.6)'; c.fill(); }
  } },
  { id: 'glowmoss', name: t('Glowing moss'), cat: 'caves', w: 1.5, h: 1.5, layer: 0, light: { radius: 2.5, color: '#5affc0', intensity: 0.5 }, tags: 'moss bioluminescent glowing lichen', draw: (c, r, w) => {
    glow(c, 0, 0, w * 0.5, '80,255,190', 0.3);
    for (let i = 0; i < 26; i++) { const a = r() * TAU, d = Math.sqrt(r()) * w * 0.38; blob(c, r, rrange(r, 4, 10), 7, 0.3, Math.cos(a) * d, Math.sin(a) * d); c.fillStyle = pick(r, ['rgba(60,200,150,0.7)', 'rgba(100,255,200,0.6)', 'rgba(40,140,110,0.7)']); c.fill(); }
    for (let i = 0; i < 30; i++) { const a = r() * TAU, d = Math.sqrt(r()) * w * 0.4; circ(c, Math.cos(a) * d, Math.sin(a) * d, rrange(r, 1, 2.2)); c.fillStyle = 'rgba(220,255,240,0.9)'; c.fill(); }
  } },
  { id: 'fossil', name: t('Fossil'), cat: 'caves', w: 1.2, h: 1.2, layer: 0, tags: 'fossil ammonite bones ancient', draw: (c, r, w) => {
    const R = w * 0.32;
    c.beginPath(); for (let i = 0; i < 160; i++) { const a = i * 0.12, d = R * 0.08 + i * R * 0.0058; const x = Math.cos(a) * d, y = Math.sin(a) * d; i ? c.lineTo(x, y) : c.moveTo(x, y); } st(c, 'rgba(30,20,12,0.6)', 3.4); st(c, 'rgba(230,215,190,0.55)', 1.6);
    for (let i = 0; i < 26; i++) { const a = i * 0.48 + 1, d = R * 0.15 + i * R * 0.033; line(c, Math.cos(a) * d * 0.85, Math.sin(a) * d * 0.85, Math.cos(a) * d * 1.15, Math.sin(a) * d * 1.15, 'rgba(60,45,30,0.45)', 1.2); }
  } },
  { id: 'crevasse', name: t('Crevasse'), cat: 'caves', w: 3, h: 1.2, layer: 0, tags: 'chasm crack fissure gap', draw: (c, r, w, h) => {
    const n = 14, top: number[] = [], bot: number[] = [];
    for (let i = 0; i <= n; i++) { const x = -w * 0.46 + (i / n) * w * 0.92, k = Math.sin((i / n) * Math.PI); const cy = rrange(r, -h * 0.06, h * 0.06); top.push(x, cy - h * 0.3 * k * rrange(r, 0.6, 1)); bot.push(x, cy + h * 0.3 * k * rrange(r, 0.6, 1)); }
    const path = () => { c.beginPath(); for (let i = 0; i < top.length; i += 2) c.lineTo(top[i], top[i + 1]); for (let i = bot.length - 2; i >= 0; i -= 2) c.lineTo(bot[i], bot[i + 1]); c.closePath(); };
    shadow(c, true, 6, 0, 0, 0.6); path(); fs(c, lin(c, 0, -h * 0.3, 0, h * 0.3, [[0, '#000'], [0.6, '#120d0a'], [1, '#2a2018']]), 2.4); shadow(c, false);
    clip(c, path, () => { c.beginPath(); for (let i = 0; i < top.length; i += 2) c.lineTo(top[i], top[i + 1] + 8); st(c, 'rgba(120,100,80,0.35)', 4); });
    for (let i = 0; i < 12; i++) rock(c, r, rrange(r, -w * 0.4, w * 0.4), rrange(r, -h * 0.4, h * 0.4), rrange(r, 2, 5), STONE);
  } },
  { id: 'rope_ladder_hole', name: t('Shaft with rope'), cat: 'caves', w: 1.2, h: 1.2, layer: 0, tags: 'hole shaft rope descend pit well', draw: (c, r, w) => {
    const R = w * 0.32, seed = Math.floor(r() * 1e9), shape = () => blob(c, mulberry32(seed), R, 11, 0.1);
    shape(); fs(c, radial(c, R * 0.1, R * 0.1, R, '#000', '#2a221c', -0.1), 2.4);
    for (let i = 0; i < 8; i++) { const a = r() * TAU; rock(c, r, Math.cos(a) * R * 1.05, Math.sin(a) * R * 1.05, rrange(r, 3, 6), '#7a7268'); }
    rod(c, -R * 1.3, -R * 1.1, -R * 0.2, -R * 0.1, WOOD_D, 5);
    c.beginPath(); c.moveTo(-R * 1.1, -R * 0.95); c.quadraticCurveTo(-R * 0.3, -R * 0.5, 0, R * 0.1); st(c, INK, 4); st(c, '#a88a58', 2.4);
    for (let i = 0; i < 4; i++) { const k = i / 4; circ(c, -R * 1.1 + k * R * 1.1, -R * 0.95 + k * R * 1.05, 2); c.fillStyle = '#6a5228'; c.fill(); }
  } },
  { id: 'glowworms', name: t('Glowworm ceiling'), cat: 'caves', w: 2, h: 2, layer: 2, light: { radius: 3.5, color: '#7ad8ff', intensity: 0.4 }, tags: 'glowworms stars ceiling bioluminescent lights', draw: (c, r, w) => {
    for (let i = 0; i < 60; i++) { const a = r() * TAU, d = Math.sqrt(r()) * w * 0.45; const x = Math.cos(a) * d, y = Math.sin(a) * d; glow(c, x, y, rrange(r, 5, 10), '120,210,255', 0.5); circ(c, x, y, rrange(r, 0.8, 1.6)); c.fillStyle = '#e8fbff'; c.fill(); }
  } },
  { id: 'cave_pool', name: t('Cave pool'), cat: 'caves', w: 2, h: 1.6, layer: 0, tags: 'pool water underground spring', draw: (c, r, w, h) => {
    const seed = Math.floor(r() * 1e9), shape = () => { c.save(); c.scale(1, h / w); blob(c, mulberry32(seed), w * 0.4, 13, 0.18); c.restore(); };
    shape(); fs(c, radial(c, 0, 0, w * 0.42, '#3a8aa0', '#0e2a3a', 0), 3, '#2a2420');
    clip(c, shape, () => { for (let k = 0; k < 3; k++) { c.beginPath(); c.ellipse(rrange(r, -10, 10), rrange(r, -10, 10), w * 0.1 * (k + 1), h * 0.08 * (k + 1), 0, 0, TAU); st(c, 'rgba(200,240,255,0.2)', 1.4); } ell(c, -w * 0.15, -h * 0.12, w * 0.12, h * 0.04, -0.3); c.fillStyle = 'rgba(255,255,255,0.18)'; c.fill(); });
    for (let i = 0; i < 14; i++) { const a = r() * TAU; rock(c, r, Math.cos(a) * w * 0.4, Math.sin(a) * h * 0.4, rrange(r, 3, 8), '#7a7268'); }
  } },
  { id: 'bear_den', name: t('Beast den'), cat: 'caves', w: 2, h: 1.6, layer: 0, tags: 'den lair nest bones beast', draw: (c, r, w, h) => {
    for (let i = 0; i < 120; i++) { const a = r() * TAU, d = Math.sqrt(r()) * w * 0.4; const x = Math.cos(a) * d, y = Math.sin(a) * d * (h / w), ang = r() * TAU; line(c, x, y, x + Math.cos(ang) * 9, y + Math.sin(ang) * 9, pick(r, ['#8a7040', '#a88a50', '#6a5430']), 1.4); }
    for (let i = 0; i < 9; i++) bone(c, rrange(r, -w * 0.35, w * 0.35), rrange(r, -h * 0.35, h * 0.35), rrange(r, 16, 26), r() * TAU, pick(r, ['#e8e0c8', '#d0c4a4']));
    skull(c, rrange(r, -w * 0.2, w * 0.2), rrange(r, -h * 0.2, h * 0.2), 16, r() * TAU);
    for (let i = 0; i < 4; i++) { blob(c, r, rrange(r, 3, 6), 6, 0.3, rrange(r, -w * 0.3, w * 0.3), rrange(r, -h * 0.3, h * 0.3)); c.fillStyle = 'rgba(90,10,10,0.5)'; c.fill(); }
  } },
];
