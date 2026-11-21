import { t } from '../i18n';
import {
  at, ball, blob, bone, boulder, C2D, circ, clip, coals, ell, flame, foliage, fs, gem, glow, GOLD, INK, leafShape, lin, line, magicFlame,
  METAL, METAL_D, pick, poly, radial, rect, rock, rod, rrange, rrect, shade, shadow, skull, sparkle, StampDef, st, STONE, STONE_D, STONE_L,
  sword, TAU, WOOD, WOOD_D, WOOD_L, candle,
} from '../art';
import { mulberry32, type Rng } from '../util';
import { arcaneCircle, rune } from './arcane';

function toadstool(c: C2D, r: Rng, x: number, y: number, R: number, col = '#d02a2a') {
  shadow(c, true, 4, 2, 3, 0.45); circ(c, x, y, R); fs(c, ball(c, x, y, R, col, 0.35), 1.4); shadow(c, false);
  for (let i = 0; i < Math.max(3, R / 2); i++) { const a = r() * TAU, d = Math.sqrt(r()) * R * 0.75; circ(c, x + Math.cos(a) * d, y + Math.sin(a) * d, R * rrange(r, 0.08, 0.16)); c.fillStyle = '#fff6ea'; c.fill(); }
}
function wisp(c: C2D, x: number, y: number, R: number, rgb: string, core = '#ffffff') {
  glow(c, x, y, R * 3, rgb, 0.55); circ(c, x, y, R); c.fillStyle = core; c.fill();
}
function butterfly(c: C2D, x: number, y: number, s: number, col: string, rot: number) {
  at(c, x, y, rot, () => {
    for (const sx of [-1, 1]) { ell(c, sx * s * 0.45, -s * 0.15, s * 0.45, s * 0.35, sx * 0.4); fs(c, col, 0.8); ell(c, sx * s * 0.32, s * 0.3, s * 0.28, s * 0.22, -sx * 0.4); fs(c, shade(col, -0.2), 0.8); circ(c, sx * s * 0.45, -s * 0.15, s * 0.1); c.fillStyle = '#fff'; c.fill(); }
    ell(c, 0, 0, s * 0.08, s * 0.4); c.fillStyle = INK; c.fill();
  });
}

export const FANTASY: StampDef[] = [
  { id: 'fairy_ring', name: t('Fairy ring'), cat: 'fantasy', w: 2.2, h: 2.2, layer: 0, light: { radius: 3, color: '#c8a0ff', intensity: 0.45 }, tags: 'fairy ring mushrooms fey circle magic', draw: (c, r, w) => {
    const R = w * 0.38;
    glow(c, 0, 0, R * 1.3, '190,150,255', 0.22);
    for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU + rrange(r, -0.1, 0.1), d = R + rrange(r, -6, 6); toadstool(c, r, Math.cos(a) * d, Math.sin(a) * d, rrange(r, 6, 11), pick(r, ['#d02a2a', '#e8c870', '#f0e8d8', '#a050c0'])); }
    for (let i = 0; i < 14; i++) { const a = r() * TAU, d = Math.sqrt(r()) * R * 0.8; wisp(c, Math.cos(a) * d, Math.sin(a) * d, rrange(r, 1, 2), pick(r, ['220,180,255', '180,255,220', '255,240,180'])); }
  } },
  { id: 'moonflowers', name: t('Moonflowers'), cat: 'fantasy', w: 1.2, h: 1.2, layer: 0, light: { radius: 2, color: '#a8d8ff', intensity: 0.4 }, tags: 'glowing flowers moon luminous fey', draw: (c, r, w) => {
    for (let i = 0; i < 9; i++) { const ga = i * 2.39996 + r(), gd = Math.sqrt((i + 0.5) / 9) * w * 0.38, x = Math.cos(ga) * gd, y = Math.sin(ga) * gd; for (let k = 0; k < 3; k++) { leafShape(c, x + rrange(r, -7, 7), y + rrange(r, -7, 7), 12, 4, r() * TAU); fs(c, '#2a5a4a', 0.6); }
      glow(c, x, y, 14, '170,220,255', 0.45); for (let p = 0; p < 6; p++) { const q = (p / 6) * TAU; ell(c, x + Math.cos(q) * 6, y + Math.sin(q) * 6, 6.5, 3.4, q); fs(c, '#eef8ff', 0.8, '#5a7aa8'); } circ(c, x, y, 3); c.fillStyle = '#a8e0ff'; c.fill(); }
  } },
  { id: 'crystal_tree', name: t('Crystal tree'), cat: 'fantasy', w: 2.4, h: 2.4, layer: 2, light: { radius: 4.5, color: '#9ae0ff', intensity: 0.6 }, tags: 'crystal tree magic glowing fey', draw: (c, r, w) => {
    const R = w * 0.42;
    glow(c, 0, 0, R * 1.25, '140,220,255', 0.35);
    foliage(c, r, R, { base: '#8aa8f0', light: '#d8f0ff', dark: '#4a4aa8', hi: '#ffffff' }, { lobes: 9, leafy: 0 });
    clip(c, () => circ(c, 0, 0, R * 0.95), () => {
      for (let i = 0; i < 46; i++) { const a2 = r() * TAU, d = Math.sqrt(r()) * R * 0.9; const x = Math.cos(a2) * d, y = Math.sin(a2) * d, s2 = rrange(r, 5, 10); poly(c, [x, y - s2, x + s2 * 0.7, y, x, y + s2, x - s2 * 0.7, y]); const lit = (-x - y) / (R * 1.4); c.fillStyle = lit > 0.1 ? 'rgba(255,255,255,0.55)' : lit < -0.3 ? 'rgba(60,40,150,0.45)' : 'rgba(170,210,255,0.5)'; c.fill(); st(c, 'rgba(255,255,255,0.5)', 0.6); }
    });
    for (let i = 0; i < 6; i++) { const a2 = r() * TAU, d = Math.sqrt(r()) * R * 0.75; gem(c, Math.cos(a2) * d, Math.sin(a2) * d, rrange(r, 5, 8), pick(r, ['#9ae0ff', '#c8a0ff', '#a0ffe0']), 6, r()); }
    for (let i = 0; i < 12; i++) sparkle(c, rrange(r, -R * 0.8, R * 0.8), rrange(r, -R * 0.8, R * 0.8), rrange(r, 3, 6));
  } },
  { id: 'great_trunk', name: t('Great tree trunk'), cat: 'fantasy', w: 3, h: 3, layer: 1, tags: 'tree trunk giant elven home door world tree', draw: (c, r, w) => {
    const R = w * 0.3;
    for (let i = 0; i < 9; i++) { let x = 0, y = 0, a = (i / 9) * TAU + rrange(r, -0.2, 0.2); const pts: number[] = [], right: number[] = []; for (let k = 0; k <= 8; k++) { const wd = (1 - k / 9) * R * 0.32 + 2, ang = a + Math.PI / 2; pts.push(x + Math.cos(ang) * wd, y + Math.sin(ang) * wd); right.push(x - Math.cos(ang) * wd, y - Math.sin(ang) * wd); a += rrange(r, -0.25, 0.25); x += Math.cos(a) * w * 0.06; y += Math.sin(a) * w * 0.06; }
      for (let k = right.length - 2; k >= 0; k -= 2) pts.push(right[k], right[k + 1]);
      shadow(c, true, 6, 3, 5, 0.45); poly(c, pts); fs(c, lin(c, -R, -R, R, R, [[0, '#8a6a4a'], [1, '#4a3220']]), 2); shadow(c, false); }
    shadow(c, true, 16, 8, 12, 0.55); blob(c, r, R, 16, 0.08); fs(c, '#5a3e28', 2.6); shadow(c, false);
    blob(c, r, R * 0.88, 16, 0.06); c.fillStyle = radial(c, 0, 0, R, '#d8b080', '#a8784a', 0); c.fill();
    for (let k = 1; k < 9; k++) { blob(c, r, R * 0.1 * k, 14, 0.05, rrange(r, -2, 2), rrange(r, -2, 2)); st(c, 'rgba(90,50,20,0.4)', 1.2); }
    for (let i = 0; i < 4; i++) { const a = r() * TAU; line(c, Math.cos(a) * R * 0.2, Math.sin(a) * R * 0.2, Math.cos(a) * R * 0.85, Math.sin(a) * R * 0.85, 'rgba(60,30,10,0.5)', 1.6); }
    for (let i = 0; i < 12; i++) { const a = r() * TAU; blob(c, r, rrange(r, 5, 10), 6, 0.3, Math.cos(a) * R * 0.95, Math.sin(a) * R * 0.95); c.fillStyle = pick(r, ['#5a8a2e', '#6f9e3a']); c.fill(); }
  } },
  { id: 'stone_circle', name: t('Stone circle'), cat: 'fantasy', w: 4, h: 4, layer: 1, light: { radius: 3, color: '#9affd0', intensity: 0.35 }, tags: 'standing stones henge druid circle ritual ancient', draw: (c, r, w) => {
    const R = w * 0.4, n = 10;
    glow(c, 0, 0, R * 0.6, '150,255,210', 0.2);
    c.save(); c.scale(0.55, 0.55); arcaneCircle(c, r, R, 'rgba(150,255,210,0.7)', '120,255,200', 5); c.restore();
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU; at(c, Math.cos(a) * R, Math.sin(a) * R, a, () => { c.save(); c.scale(0.6, 1); boulder(c, r, 0, 0, w * 0.075, '#8a8a84', 0.5); c.restore(); }); if (i % 2 === 0) rune(c, r, Math.cos(a) * R, Math.sin(a) * R, 8, 'rgba(150,255,210,0.9)', 1.6); }
    shadow(c, true, 8, 4, 6); rrect(c, -w * 0.08, -w * 0.05, w * 0.16, w * 0.1, 4); fs(c, lin(c, 0, -w * 0.05, 0, w * 0.05, [[0, STONE_L], [1, STONE_D]]), 2); shadow(c, false);
  } },
  { id: 'dragon_egg', name: t('Dragon eggs'), cat: 'fantasy', w: 1.4, h: 1.4, layer: 1, light: { radius: 2.5, color: '#ff8a3a', intensity: 0.4 }, tags: 'dragon eggs nest hatchling', draw: (c, r, w) => {
    const R = w * 0.4;
    for (let i = 0; i < 70; i++) { const a = r() * TAU, d = rrange(r, R * 0.55, R); const x = Math.cos(a) * d, y = Math.sin(a) * d, b = a + Math.PI / 2 + rrange(r, -0.5, 0.5); line(c, x, y, x + Math.cos(b) * 10, y + Math.sin(b) * 10, pick(r, ['#6a5a40', '#8a7050', '#4a3a28']), 2); }
    circ(c, 0, 0, R * 0.6); fs(c, radial(c, 0, 0, R * 0.6, '#5a4028', '#2a1a10'), 1.4);
    coals(c, r, 0, 0, R * 0.5, 10);
    const cols = pick(r, [['#c83a2a', '#ffb040'], ['#2a6ac8', '#80e0ff'], ['#2a8a4a', '#c0f080'], ['#6a2a9a', '#e0a0ff']]);
    for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + r(), x = Math.cos(a) * R * 0.25, y = Math.sin(a) * R * 0.25; shadow(c, true, 5, 3, 4); ell(c, x, y, R * 0.24, R * 0.3, a); fs(c, radial(c, x, y, R * 0.3, cols[1], cols[0], 0.4), 1.6); shadow(c, false);
      clip(c, () => ell(c, x, y, R * 0.24, R * 0.3, a), () => { for (let k = 0; k < 10; k++) { c.beginPath(); c.arc(x + rrange(r, -R * 0.2, R * 0.2), y + rrange(r, -R * 0.25, R * 0.25), R * 0.06, 0, Math.PI); st(c, 'rgba(0,0,0,0.3)', 1); } }); }
  } },
  { id: 'dragon_skull', name: t('Dragon skull'), cat: 'fantasy', w: 3, h: 2, layer: 1, tags: 'dragon skull bones remains giant horns', draw: (c, r, w, h) => {
    const col = '#e2d8be';
    at(c, 0, 0, rrange(r, -0.2, 0.2), () => {
      shadow(c, true, 12, 6, 9, 0.5);
      c.beginPath(); c.moveTo(w * 0.46, 0); c.quadraticCurveTo(w * 0.36, -h * 0.14, w * 0.12, -h * 0.2); c.quadraticCurveTo(-w * 0.12, -h * 0.38, -w * 0.3, -h * 0.28); c.quadraticCurveTo(-w * 0.42, 0, -w * 0.3, h * 0.28); c.quadraticCurveTo(-w * 0.12, h * 0.38, w * 0.12, h * 0.2); c.quadraticCurveTo(w * 0.36, h * 0.14, w * 0.46, 0); c.closePath();
      fs(c, radial(c, -w * 0.05, 0, w * 0.4, '#fbf4e0', '#a89a78', 0.3), 2.4); shadow(c, false);
      for (const s of [-1, 1]) {
        c.beginPath(); c.moveTo(-w * 0.25, s * h * 0.2); c.quadraticCurveTo(-w * 0.42, s * h * 0.45, -w * 0.48, s * h * 0.25); c.quadraticCurveTo(-w * 0.4, s * h * 0.32, -w * 0.3, s * h * 0.12); c.closePath(); fs(c, lin(c, -w * 0.3, 0, -w * 0.48, 0, [[0, col], [1, '#8a7a5a']]), 1.8);
        ell(c, -w * 0.02, s * h * 0.15, w * 0.07, h * 0.07, s * 0.3); fs(c, '#2a2018', 1.6);
        ell(c, w * 0.36, s * h * 0.05, w * 0.025, h * 0.03); c.fillStyle = '#2a2018'; c.fill();
        for (let i = 0; i < 6; i++) { const x = w * 0.08 + i * w * 0.055; poly(c, [x, s * h * 0.17 - s * i * 2, x + w * 0.02, s * h * 0.17 - s * i * 2, x + w * 0.01, s * h * 0.26 - s * i * 2]); fs(c, '#f8f2e0', 0.8); }
      }
      line(c, -w * 0.25, 0, w * 0.3, 0, 'rgba(90,70,40,0.35)', 2);
      for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(rrange(r, -w * 0.3, w * 0.3), rrange(r, -h * 0.2, h * 0.2)); c.lineTo(rrange(r, -w * 0.3, w * 0.3), rrange(r, -h * 0.2, h * 0.2)); st(c, 'rgba(60,45,25,0.3)', 1); }
    });
  } },
  { id: 'giant_ribcage', name: t('Giant ribcage'), cat: 'fantasy', w: 3, h: 2.6, layer: 1, tags: 'ribcage bones giant skeleton remains beast', draw: (c, r, w, h) => {
    const col = '#e2d8be';
    shadow(c, true, 8, 4, 6); rod(c, -w * 0.44, 0, w * 0.44, 0, col, 12); shadow(c, false);
    for (let i = 0; i < 18; i++) { const x = -w * 0.42 + i * w * 0.05; circ(c, x, 0, 5); fs(c, '#d8ceb0', 1); }
    for (let i = 0; i < 8; i++) for (const s of [-1, 1]) {
      const x = -w * 0.32 + i * w * 0.085, L = h * 0.42 * Math.sin(((i + 1) / 9) * Math.PI) + h * 0.08;
      shadow(c, true, 6, 4, 6, 0.4); c.beginPath(); c.moveTo(x, s * 4); c.quadraticCurveTo(x + w * 0.06, s * L * 0.7, x - w * 0.02, s * L); st(c, INK, 8); shadow(c, false); st(c, col, 5.6);
    }
    skull(c, w * 0.46, 0, h * 0.2, Math.PI / 2, col);
    void bone;
  } },
  { id: 'moon_pool', name: t('Moon pool'), cat: 'fantasy', w: 2.2, h: 2.2, layer: 0, light: { radius: 4, color: '#c8e0ff', intensity: 0.55 }, tags: 'pool spring silver moon magical water fey', draw: (c, r, w) => {
    const R = w * 0.36;
    for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU; boulder(c, r, Math.cos(a) * R * 1.12, Math.sin(a) * R * 1.12, rrange(r, 9, 14), '#b8b8c0', 0.3); }
    circ(c, 0, 0, R); fs(c, radial(c, -R * 0.1, -R * 0.1, R, '#f0f8ff', '#3a5a8a', 0), 2.4);
    glow(c, 0, 0, R * 1.1, '200,225,255', 0.45);
    circ(c, -R * 0.2, -R * 0.15, R * 0.28); c.fillStyle = 'rgba(255,255,255,0.7)'; c.fill(); circ(c, -R * 0.1, -R * 0.2, R * 0.24); c.fillStyle = 'rgba(80,110,160,0.6)'; c.fill();
    for (let i = 0; i < 12; i++) sparkle(c, rrange(r, -R * 0.7, R * 0.7), rrange(r, -R * 0.7, R * 0.7), rrange(r, 2, 4));
  } },
  { id: 'wisps', name: t('Will-o\'-wisps'), cat: 'fantasy', w: 1.6, h: 1.6, layer: 2, light: { radius: 3, color: '#8affd8', intensity: 0.55 }, tags: 'wisps lights spirits swamp ghost lights', draw: (c, r, w) => {
    for (let i = 0; i < 5; i++) { const x = rrange(r, -w * 0.35, w * 0.35), y = rrange(r, -w * 0.35, w * 0.35); for (let k = 0; k < 6; k++) { circ(c, x - k * 3, y + k * 2, 3 - k * 0.4); c.fillStyle = `rgba(160,255,220,${0.3 - k * 0.04})`; c.fill(); } wisp(c, x, y, rrange(r, 3, 5), '120,255,210', '#eafff8'); }
  } },
  { id: 'fireflies', name: t('Fireflies'), cat: 'fantasy', w: 2, h: 2, layer: 2, light: { radius: 3, color: '#e8ff8a', intensity: 0.35 }, tags: 'fireflies lights night insects glow', draw: (c, r, w) => {
    for (let i = 0; i < 26; i++) { const a = r() * TAU, d = Math.sqrt(r()) * w * 0.45; wisp(c, Math.cos(a) * d, Math.sin(a) * d, rrange(r, 1, 1.8), '230,255,130', '#fbffd8'); }
  } },
  { id: 'butterflies', name: t('Butterflies'), cat: 'fantasy', w: 1.2, h: 1.2, layer: 2, tags: 'butterflies insects colorful meadow', draw: (c, r, w) => { for (let i = 0; i < 6; i++) { shadow(c, true, 3, 6, 9, 0.25); butterfly(c, rrange(r, -w * 0.38, w * 0.38), rrange(r, -w * 0.38, w * 0.38), rrange(r, 10, 14), pick(r, ['#f0a030', '#4a90e0', '#e05aa0', '#f0e040', '#a060e0']), r() * TAU); shadow(c, false); } } },
  { id: 'tentacles', name: t('Eldritch tentacles'), cat: 'fantasy', w: 2.4, h: 2.4, layer: 1, light: { radius: 2.5, color: '#b05aff', intensity: 0.4 }, tags: 'tentacles eldritch kraken horror pit aberration', draw: (c, r, w) => {
    const R = w * 0.2, seed = Math.floor(r() * 1e9), pit = () => blob(c, mulberry32(seed), R, 12, 0.14);
    pit(); fs(c, radial(c, 0, 0, R, '#3a0a4a', '#050008', 0), 2.4);
    glow(c, 0, 0, R * 1.2, '160,80,255', 0.4);
    for (let i = 0; i < 6; i++) {
      let a = (i / 6) * TAU + rrange(r, -0.3, 0.3), x = Math.cos(a) * R * 0.5, y = Math.sin(a) * R * 0.5;
      const pts: [number, number][] = [[x, y]], n = 10;
      for (let k = 0; k < n; k++) { a += rrange(r, -0.55, 0.55); x += Math.cos(a) * w * 0.035; y += Math.sin(a) * w * 0.035; pts.push([x, y]); }
      for (let k = 0; k < pts.length - 1; k++) { const wd = (1 - k / n) * 14 + 2; const [x0, y0] = pts[k], [x1, y1] = pts[k + 1]; shadow(c, true, 4, 2, 4, 0.4); line(c, x0, y0, x1, y1, INK, wd + 2.6); shadow(c, false); }
      for (let k = 0; k < pts.length - 1; k++) { const wd = (1 - k / n) * 14 + 2; const [x0, y0] = pts[k], [x1, y1] = pts[k + 1]; line(c, x0, y0, x1, y1, '#6a3a7a', wd); line(c, x0 - wd * 0.15, y0 - wd * 0.15, x1 - wd * 0.15, y1 - wd * 0.15, '#9a6aaa', wd * 0.35); }
      for (let k = 1; k < pts.length - 2; k += 2) { circ(c, pts[k][0] + 2, pts[k][1] + 2, 2); c.fillStyle = '#e8c8f0'; c.fill(); }
    }
  } },
  { id: 'void_rift', name: t('Void rift'), cat: 'fantasy', w: 2, h: 1.2, layer: 0, light: { radius: 3.5, color: '#a05aff', intensity: 0.7 }, tags: 'rift portal tear void planar crack shadow', draw: (c, r, w, h) => {
    glow(c, 0, 0, w * 0.5, '160,80,255', 0.4);
    const n = 12, top: number[] = [], bot: number[] = [];
    for (let i = 0; i <= n; i++) { const x = -w * 0.44 + (i / n) * w * 0.88, k = Math.sin((i / n) * Math.PI); top.push(x, -h * 0.28 * k * rrange(r, 0.5, 1)); bot.push(x, h * 0.28 * k * rrange(r, 0.5, 1)); }
    const path = () => { c.beginPath(); for (let i = 0; i < top.length; i += 2) c.lineTo(top[i], top[i + 1]); for (let i = bot.length - 2; i >= 0; i -= 2) c.lineTo(bot[i], bot[i + 1]); c.closePath(); };
    path(); fs(c, radial(c, 0, 0, w * 0.4, '#1a0030', '#000000', 0), 2, '#c090ff');
    clip(c, path, () => { for (let i = 0; i < 30; i++) sparkle(c, rrange(r, -w * 0.4, w * 0.4), rrange(r, -h * 0.2, h * 0.2), rrange(r, 1, 3), pick(r, ['#ffffff', '#d0b0ff', '#a0e0ff'])); });
    path(); st(c, 'rgba(220,180,255,0.8)', 1.2);
  } },
  { id: 'blue_brazier', name: t('Eternal flame'), cat: 'fantasy', w: 1, h: 1, layer: 1, light: { radius: 5, color: '#6ab8ff', intensity: 0.9 }, tags: 'brazier blue flame magic fire eternal', draw: (c, r, w) => {
    const R = w * 0.34;
    shadow(c, true, 8, 3, 5); circ(c, 0, 0, R); fs(c, ball(c, 0, 0, R, '#4a4e58', 0.3), 2.4); shadow(c, false);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; rune(c, r, Math.cos(a) * R * 0.86, Math.sin(a) * R * 0.86, 5, 'rgba(140,200,255,0.9)', 1); }
    circ(c, 0, 0, R * 0.7); c.fillStyle = '#0a1420'; c.fill();
    magicFlame(c, 0, 0, R * 0.55, ['#2a6aff', '#6ab8ff', '#e0f4ff'], '90,160,255');
  } },
  { id: 'green_brazier', name: t('Soulfire brazier'), cat: 'fantasy', w: 1, h: 1, layer: 1, light: { radius: 5, color: '#7aff7a', intensity: 0.85 }, tags: 'brazier green flame necromantic soul fire', draw: (c, r, w) => {
    const R = w * 0.34;
    shadow(c, true, 8, 3, 5); circ(c, 0, 0, R); fs(c, ball(c, 0, 0, R, '#3a3a34', 0.3), 2.4); shadow(c, false);
    for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + Math.PI / 4; skull(c, Math.cos(a) * R * 0.85, Math.sin(a) * R * 0.85, 9, a + Math.PI / 2); }
    circ(c, 0, 0, R * 0.62); c.fillStyle = '#081208'; c.fill();
    magicFlame(c, 0, 0, R * 0.5, ['#1a8a2a', '#5aff6a', '#e8ffe0'], '90,255,110');
  } },
  { id: 'totem', name: t('Totem pole'), cat: 'fantasy', w: 1, h: 1, layer: 1, tags: 'totem pole carved tribal spirit', draw: (c, r, w) => {
    const R = w * 0.22;
    for (const s of [-1, 1]) { shadow(c, true, 6, 4, 6); poly(c, [s * R * 0.6, -R * 0.4, s * R * 2.1, -R * 0.9, s * R * 2.2, -R * 0.3, s * R * 0.6, R * 0.2]); fs(c, lin(c, 0, -R, s * R * 2, 0, [[0, '#c84a2a'], [1, '#3a6ac8']]), 1.8); shadow(c, false); for (let i = 0; i < 3; i++) line(c, s * R * (0.9 + i * 0.4), -R * 0.5 - i * 0.1 * R, s * R * (0.9 + i * 0.4), R * 0.1 - i * 0.15 * R, 'rgba(0,0,0,0.35)', 1.4); }
    shadow(c, true, 8, 4, 6); circ(c, 0, 0, R); fs(c, ball(c, 0, 0, R, '#a8703a', 0.3), 2); shadow(c, false);
    for (const s of [-1, 1]) { circ(c, s * R * 0.35, -R * 0.15, R * 0.2); fs(c, '#f0e8d8', 1); circ(c, s * R * 0.35, -R * 0.15, R * 0.08); c.fillStyle = INK; c.fill(); }
    poly(c, [0, -R * 0.05, -R * 0.15, R * 0.35, R * 0.15, R * 0.35]); fs(c, '#c84a2a', 1);
    void r;
  } },
  { id: 'goblin_totem', name: t('Skull totem'), cat: 'fantasy', w: 0.9, h: 0.9, layer: 1, tags: 'goblin orc totem skulls feathers warning stake', draw: (c, r, w) => {
    rod(c, -w * 0.3, -w * 0.3, w * 0.3, w * 0.3, WOOD_D, 5);
    for (let i = 0; i < 5; i++) { const a = r() * TAU; line(c, 0, 0, Math.cos(a) * w * 0.38, Math.sin(a) * w * 0.38, pick(r, ['#c03030', '#3a3a3a', '#d8c8a0']), 2); leafShape(c, Math.cos(a) * w * 0.38, Math.sin(a) * w * 0.38, 10, 3, a); fs(c, pick(r, ['#c03030', '#2a2a2a', '#e0d8c0']), 0.6); }
    skull(c, -w * 0.12, -w * 0.08, 18, rrange(r, -0.4, 0.4));
    skull(c, w * 0.14, w * 0.12, 13, rrange(r, -0.4, 0.4));
  } },
  { id: 'sacrificial_altar', name: t('Sacrificial altar'), cat: 'fantasy', w: 2, h: 1.2, layer: 1, light: { radius: 3, color: '#ff4a3a', intensity: 0.5 }, tags: 'altar sacrifice blood cult dark ritual stone', draw: (c, r, w, h) => {
    const W = w * 0.78, H = h * 0.6;
    shadow(c, true, 10, 5, 8); rrect(c, -W / 2, -H / 2, W, H, 6); fs(c, lin(c, -W / 2, -H / 2, W / 2, H / 2, [[0, '#6a625a'], [1, '#3a342e']]), 2.4); shadow(c, false);
    for (let i = 0; i < 4; i++) { const x = -W * 0.4 + i * W * 0.26; line(c, x, -H / 2, x, H / 2, 'rgba(0,0,0,0.25)', 1.4); }
    for (const s of [-1, 1]) for (const t2 of [-1, 1]) { circ(c, s * W * 0.38, t2 * H * 0.3, 4); st(c, INK, 4); circ(c, s * W * 0.38, t2 * H * 0.3, 4); st(c, METAL, 2); }
    blob(c, r, H * 0.3, 10, 0.3, rrange(r, -W * 0.1, W * 0.1), 0); c.fillStyle = 'rgba(120,8,14,0.85)'; c.fill();
    for (let i = 0; i < 4; i++) { const x = rrange(r, -W * 0.4, W * 0.4); c.beginPath(); c.moveTo(x, H / 2 - 2); c.quadraticCurveTo(x + rrange(r, -4, 4), H / 2 + 10, x + rrange(r, -3, 3), H / 2 + rrange(r, 10, 22)); st(c, 'rgba(120,8,14,0.85)', 3); }
    at(c, W * 0.25, -H * 0.2, 0.4, () => { poly(c, [-14, -3, 12, -1, 16, 0, 12, 1, -14, 3]); fs(c, lin(c, 0, -3, 0, 3, [[0, '#ffffff'], [1, METAL]]), 1); rect(c, -24, -2.5, 10, 5); fs(c, '#3a1a10', 1); });
    for (const s of [-1, 1]) candle(c, s * W * 0.55, 0, 4.5, '#2a2020');
  } },
  { id: 'giant_sword', name: t('Fallen giant\'s sword'), cat: 'fantasy', w: 4, h: 1, layer: 1, tags: 'giant sword huge blade relic battlefield titan', draw: (c, r, w, h) => {
    sword(c, 0, 0, w * 0.96, rrange(r, -0.08, 0.08), '#7a6a4a', '#a8aeb6');
    for (let i = 0; i < 8; i++) { blob(c, r, rrange(r, 3, 7), 6, 0.3, rrange(r, -w * 0.1, w * 0.4), rrange(r, -h * 0.1, h * 0.1)); c.fillStyle = 'rgba(140,70,30,0.45)'; c.fill(); }
    for (let i = 0; i < 4; i++) { blob(c, r, rrange(r, 4, 8), 6, 0.3, rrange(r, -w * 0.2, w * 0.4), rrange(r, -h * 0.15, h * 0.15)); c.fillStyle = 'rgba(90,130,50,0.5)'; c.fill(); }
  } },
  { id: 'floating_crystal', name: t('Floating crystal'), cat: 'fantasy', w: 1.2, h: 1.2, layer: 2, light: { radius: 4, color: '#c08aff', intensity: 0.7 }, tags: 'floating crystal levitating magic focus power', draw: (c, r, w) => {
    const R = w * 0.22;
    ell(c, R * 0.8, R * 1.4, R * 0.8, R * 0.4); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fill();
    glow(c, 0, 0, R * 2.4, '200,140,255', 0.5);
    poly(c, [0, -R * 1.6, R * 0.7, 0, 0, R * 1.6, -R * 0.7, 0]); fs(c, lin(c, -R, -R, R, R, [[0, '#f0e0ff'], [0.5, '#b07ae8'], [1, '#5a2a9a']]), 1.6);
    poly(c, [0, -R * 1.6, R * 0.7, 0, 0, 0]); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fill();
    poly(c, [0, R * 1.6, -R * 0.7, 0, 0, 0]); c.fillStyle = 'rgba(40,0,80,0.3)'; c.fill();
    for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(0, 0, R * (1.6 + i * 0.3), R * (0.5 + i * 0.1), i * 1.1, 0, TAU); st(c, 'rgba(220,190,255,0.55)', 1); }
    for (let i = 0; i < 6; i++) sparkle(c, rrange(r, -R * 2, R * 2), rrange(r, -R * 2, R * 2), rrange(r, 2, 4));
  } },
  { id: 'moon_gate', name: t('Moon gate'), cat: 'fantasy', w: 2.4, h: 0.8, layer: 1, light: { radius: 2.5, color: '#d0e8ff', intensity: 0.45 }, tags: 'arch gate elven moon archway fey crossing', draw: (c, r, w, h) => {
    for (const s of [-1, 1]) { shadow(c, true, 8, 4, 6); rrect(c, s * w * 0.36 - 14, -h * 0.3, 28, h * 0.6, 6); fs(c, lin(c, 0, -h * 0.3, 0, h * 0.3, ['#f0ece4', '#b8b2a6'].map((x, i) => [i, x] as [number, string])), 2); shadow(c, false); }
    shadow(c, true, 10, 6, 10, 0.4); rrect(c, -w * 0.4, -h * 0.12, w * 0.8, h * 0.24, 8); fs(c, lin(c, 0, -h * 0.12, 0, h * 0.12, [[0, '#f4f0e8'], [1, '#c0baae']]), 2); shadow(c, false);
    for (let i = 0; i < 7; i++) rune(c, r, -w * 0.3 + i * w * 0.1, 0, 7, 'rgba(120,170,255,0.9)', 1.4);
    glow(c, 0, 0, w * 0.3, '200,225,255', 0.3);
    for (let i = 0; i < 12; i++) { const x = rrange(r, -w * 0.4, w * 0.4); leafShape(c, x, rrange(r, -h * 0.15, h * 0.15), 9, 3.5, r() * TAU); fs(c, pick(r, ['#4a8a3a', '#6aa84a']), 0.6); }
    for (let i = 0; i < 5; i++) { const x = rrange(r, -w * 0.4, w * 0.4), y = rrange(r, -h * 0.12, h * 0.12); for (let p = 0; p < 5; p++) { const q = (p / 5) * TAU; circ(c, x + Math.cos(q) * 2, y + Math.sin(q) * 2, 1.8); c.fillStyle = '#f0d0f0'; c.fill(); } }
  } },
  { id: 'phoenix_nest', name: t('Phoenix nest'), cat: 'fantasy', w: 1.6, h: 1.6, layer: 1, light: { radius: 4, color: '#ff8a2a', intensity: 0.8 }, tags: 'phoenix nest fire egg feathers', draw: (c, r, w) => {
    const R = w * 0.38;
    for (let i = 0; i < 90; i++) { const a = r() * TAU, d = rrange(r, R * 0.6, R); const x = Math.cos(a) * d, y = Math.sin(a) * d, b = a + Math.PI / 2 + rrange(r, -0.5, 0.5); line(c, x, y, x + Math.cos(b) * 12, y + Math.sin(b) * 12, pick(r, ['#5a3a20', '#8a6a3a', '#3a2614']), 2.2); }
    coals(c, r, 0, 0, R * 0.62, 16);
    for (let i = 0; i < 4; i++) flame(c, rrange(r, -R * 0.3, R * 0.3), rrange(r, -R * 0.3, R * 0.3), rrange(r, 6, 10));
    shadow(c, true, 5, 3, 4); ell(c, 0, 0, R * 0.26, R * 0.34, 0.4); fs(c, radial(c, 0, 0, R * 0.34, '#fff0a0', '#e85a1a', 0.4), 1.6); shadow(c, false);
    for (let i = 0; i < 5; i++) { const a = r() * TAU, d = R * rrange(r, 0.7, 1.05); at(c, Math.cos(a) * d, Math.sin(a) * d, a, () => { leafShape(c, 0, 0, 22, 6, 0); fs(c, lin(c, -11, 0, 11, 0, [[0, '#ffd040'], [0.5, '#ff6a1a'], [1, '#c81a1a']]), 1); line(c, -11, 0, 11, 0, 'rgba(120,20,0,0.6)', 0.8); }); }
  } },
  { id: 'whispering_stump', name: t('Whispering stump'), cat: 'fantasy', w: 1.4, h: 1.4, layer: 1, light: { radius: 2, color: '#a8ff8a', intensity: 0.35 }, tags: 'stump face treant spooky haunted tree spirit', draw: (c, r, w) => {
    const R = w * 0.34;
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + rrange(r, -0.3, 0.3); rod(c, Math.cos(a) * R * 0.6, Math.sin(a) * R * 0.6, Math.cos(a) * R * 1.35, Math.sin(a) * R * 1.35, '#5a4030', 8); }
    shadow(c, true, 8, 4, 6); blob(c, r, R, 12, 0.12); fs(c, '#5a4030', 2.4); shadow(c, false);
    blob(c, r, R * 0.82, 12, 0.08); c.fillStyle = radial(c, 0, 0, R, '#b8905a', '#7a5a34', 0); c.fill();
    for (let k = 1; k < 5; k++) { blob(c, r, R * 0.18 * k, 10, 0.06); st(c, 'rgba(70,40,15,0.45)', 1); }
    for (const s of [-1, 1]) { ell(c, s * R * 0.32, -R * 0.15, R * 0.14, R * 0.1, s * 0.3); fs(c, '#140c06', 1.2); glow(c, s * R * 0.32, -R * 0.15, R * 0.14, '170,255,140', 0.8); }
    c.beginPath(); c.ellipse(0, R * 0.3, R * 0.25, R * 0.1, 0, 0, Math.PI); c.closePath(); fs(c, '#140c06', 1.2);
    for (let i = 0; i < 8; i++) { const a = r() * TAU; blob(c, r, rrange(r, 4, 8), 6, 0.3, Math.cos(a) * R * 0.9, Math.sin(a) * R * 0.9); c.fillStyle = pick(r, ['#5a8a2e', '#6f9e3a']); c.fill(); }
  } },
  { id: 'ley_line', name: t('Ley line'), cat: 'fantasy', w: 1, h: 3, layer: 0, light: { radius: 2.5, color: '#7ad8ff', intensity: 0.45 }, tags: 'ley line magic energy path runes glowing', draw: (c, r, w, h) => {
    c.save(); c.shadowColor = 'rgba(120,210,255,0.9)'; c.shadowBlur = 12;
    c.beginPath(); c.moveTo(0, -h * 0.48); for (let i = 1; i <= 12; i++) c.lineTo(rrange(r, -w * 0.12, w * 0.12), -h * 0.48 + (i * h * 0.96) / 12); c.strokeStyle = 'rgba(150,225,255,0.85)'; c.lineWidth = 3; c.stroke();
    c.restore();
    for (let i = 0; i < 6; i++) rune(c, r, rrange(r, -w * 0.25, w * 0.25), -h * 0.4 + (i * h * 0.8) / 5, 9, 'rgba(150,225,255,0.85)', 1.4);
    for (let i = 0; i < 12; i++) sparkle(c, rrange(r, -w * 0.3, w * 0.3), rrange(r, -h * 0.45, h * 0.45), rrange(r, 1.5, 3), 'rgba(220,245,255,0.9)');
  } },
  { id: 'giant_toadstools', name: t('Giant toadstools'), cat: 'fantasy', w: 1.6, h: 1.6, layer: 2, tags: 'toadstools mushrooms giant fey red white', draw: (c, r, w) => {
    const items: [number, number, number][] = [];
    for (let i = 0; i < 4; i++) items.push([rrange(r, -w * 0.22, w * 0.22), rrange(r, -w * 0.22, w * 0.22), rrange(r, w * 0.12, w * 0.24)]);
    items.sort((a, b) => a[2] - b[2]);
    for (const [x, y, R] of items) { shadow(c, true, 10, 6, 9, 0.4); circ(c, x, y, R); c.fillStyle = '#000'; c.fill(); shadow(c, false); toadstool(c, r, x, y, R, pick(r, ['#d02a2a', '#c8402a', '#e05a2a'])); }
  } },
];
void ball; void boulder; void coals; void flame; void foliage; void GOLD; void METAL_D; void rect; void rock; void STONE; void WOOD; void WOOD_L;
