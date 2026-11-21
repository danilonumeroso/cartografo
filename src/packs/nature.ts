import { t } from '../i18n';
import {
  at, ball, blob, bone, boulder, C2D, circ, clip, ell, foliage, fs, glow, grain, INK, leafShape, lin, line, LEAF, LEAF_D, LEAF_L, pick, poly,
  radial, rect, rock, rod, rrange, rrect, shade, shadow, skull, StampDef, st, STONE, TAU, WOOD, WOOD_D, WOOD_L, STRAW,
} from '../art';
import { mulberry32, type Rng } from '../util';

/** Branching bare tree limbs from the origin. */
function branches(c: C2D, r: Rng, R: number, col = '#5a4030', depth = 3, n = 6) {
  const limb = (x: number, y: number, a: number, L: number, wd: number, d: number) => {
    const x1 = x + Math.cos(a) * L, y1 = y + Math.sin(a) * L;
    const mx = (x + x1) / 2 + rrange(r, -L, L) * 0.15, my = (y + y1) / 2 + rrange(r, -L, L) * 0.15;
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(mx, my, x1, y1);
    c.lineCap = 'round'; c.strokeStyle = INK; c.lineWidth = wd + 2.4; c.stroke(); c.strokeStyle = col; c.lineWidth = wd; c.stroke();
    if (wd > 3) { c.strokeStyle = shade(col, 0.25); c.lineWidth = wd * 0.3; c.beginPath(); c.moveTo(x - wd * 0.15, y - wd * 0.15); c.quadraticCurveTo(mx - wd * 0.15, my - wd * 0.15, x1, y1); c.stroke(); }
    if (d > 0) { const k = 2 + (r() < 0.4 ? 1 : 0); for (let i = 0; i < k; i++) limb(x1, y1, a + rrange(r, -0.7, 0.7), L * rrange(r, 0.55, 0.75), wd * 0.62, d - 1); }
  };
  for (let i = 0; i < n; i++) limb(0, 0, (i / n) * TAU + rrange(r, -0.3, 0.3), R * rrange(r, 0.32, 0.42), R * 0.09, depth);
  circ(c, 0, 0, R * 0.13); fs(c, ball(c, 0, 0, R * 0.13, col, 0.25), 2);
}
function fern(c: C2D, r: Rng, x: number, y: number, R: number, col = '#4f8a33') {
  at(c, x, y, r() * TAU, () => {
    const n = 7 + Math.floor(r() * 3);
    shadow(c, true, 5, 3, 4, 0.4);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rrange(r, -0.2, 0.2), L = R * rrange(r, 0.75, 1);
      c.save(); c.rotate(a);
      c.beginPath(); c.moveTo(0, 0);
      for (let k = 0; k <= 10; k++) { const px = (k / 10) * L, wd = Math.sin((k / 10) * Math.PI) * L * 0.16 * (1 - k / 14); c.lineTo(px, -wd - (k % 2) * 2); }
      for (let k = 10; k >= 0; k--) { const px = (k / 10) * L, wd = Math.sin((k / 10) * Math.PI) * L * 0.16 * (1 - k / 14); c.lineTo(px, wd + (k % 2) * 2); }
      c.closePath(); fs(c, lin(c, 0, -L * 0.15, 0, L * 0.15, [[0, shade(col, 0.2)], [1, shade(col, -0.2)]]), 1.1, shade(col, -0.6));
      line(c, 0, 0, L, 0, shade(col, -0.45), 1);
      for (let k = 1; k < 10; k++) { const px = (k / 10) * L, wd = Math.sin((k / 10) * Math.PI) * L * 0.14; line(c, px, 0, px + 3, -wd, shade(col, -0.35), 0.7); line(c, px, 0, px + 3, wd, shade(col, -0.35), 0.7); }
      c.restore();
    }
    shadow(c, false);
  });
}
function flower(c: C2D, x: number, y: number, R: number, col: string, center = '#f0c030', petals = 5) {
  for (let p = 0; p < petals; p++) { const q = (p / petals) * TAU; ell(c, x + Math.cos(q) * R * 0.55, y + Math.sin(q) * R * 0.55, R * 0.5, R * 0.32, q); c.fillStyle = col; c.fill(); }
  circ(c, x, y, R * 0.3); c.fillStyle = center; c.fill();
}
function lily(c: C2D, x: number, y: number, R: number, rot: number) {
  at(c, x, y, rot, () => {
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R, 0.3, TAU - 0.05); c.closePath();
    shadow(c, true, 2, 1, 1.5, 0.35); fs(c, radial(c, 0, 0, R, '#7ab84a', '#3a7028', 0.2), 1.2); shadow(c, false);
    for (let i = 0; i < 7; i++) { const a = 0.5 + (i / 7) * 5.4; line(c, 0, 0, Math.cos(a) * R * 0.85, Math.sin(a) * R * 0.85, 'rgba(30,60,20,0.4)', 0.8); }
  });
}
function grassTuft(c: C2D, r: Rng, x: number, y: number, L: number, cols = ['#3d6a22', '#8cbf55', '#5a8f36']) {
  for (let k = 0; k < 9; k++) { const a = rrange(r, 0, TAU), l = L * rrange(r, 0.6, 1); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a + 0.3) * l * 0.5, y + Math.sin(a + 0.3) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); st(c, pick(r, cols), 1.8); }
}
function pumpkin(c: C2D, x: number, y: number, R: number) {
  shadow(c, true, 4, 2, 3, 0.45); circ(c, x, y, R); fs(c, ball(c, x, y, R, '#e8822a', 0.3), 1.6); shadow(c, false);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a + 0.3) * R * 0.7, y + Math.sin(a + 0.3) * R * 0.7, x + Math.cos(a) * R, y + Math.sin(a) * R); st(c, 'rgba(120,50,10,0.45)', 1.2); }
  rrect(c, x - 2, y - 3, 4, 6, 1); fs(c, '#5a6a2a', 0.8);
}

const GREENS = { base: LEAF, light: LEAF_L, dark: LEAF_D, hi: '#a8d070' };

export const NATURE: StampDef[] = [
  { id: 'oak_giant', name: t('Ancient oak'), cat: 'nature', w: 4, h: 4, layer: 2, tags: 'tree oak giant huge forest', draw: (c, r, w) => foliage(c, r, w * 0.44, { base: '#477a2c', light: '#6fa043', dark: '#264a19', hi: '#94c060' }, { lobes: 12 }) },
  { id: 'birch', name: t('Birch'), cat: 'nature', w: 1.6, h: 1.6, layer: 2, tags: 'tree birch light', draw: (c, r, w) => foliage(c, r, w * 0.4, { base: '#8ab446', light: '#b8d870', dark: '#4e7a2a', hi: '#e0f090' }, { lobes: 7 }) },
  { id: 'fruit_tree', name: t('Apple tree'), cat: 'nature', w: 2, h: 2, layer: 2, tags: 'tree apple fruit orchard', draw: (c, r, w) => foliage(c, r, w * 0.42, GREENS, { fruit: '#d03028' }) },
  { id: 'cherry_tree', name: t('Cherry blossom'), cat: 'nature', w: 2, h: 2, layer: 2, tags: 'tree sakura pink blossom flower', draw: (c, r, w) => foliage(c, r, w * 0.42, { base: '#e8a0b8', light: '#fbd0dc', dark: '#a85a78', hi: '#ffffff' }, { blossom: '#ffe4ee' }) },
  { id: 'autumn_maple', name: t('Red maple'), cat: 'nature', w: 2, h: 2, layer: 2, tags: 'tree maple red autumn fall', draw: (c, r, w) => foliage(c, r, w * 0.42, { base: '#b83a26', light: '#e8743a', dark: '#6a1e14', hi: '#f8b050' }) },
  { id: 'golden_tree', name: t('Golden tree'), cat: 'nature', w: 2, h: 2, layer: 2, tags: 'tree yellow autumn ginkgo', draw: (c, r, w) => foliage(c, r, w * 0.42, { base: '#d0a028', light: '#f0d060', dark: '#7a5a14', hi: '#fff0a0' }) },
  { id: 'willow', name: t('Willow'), cat: 'nature', w: 2.6, h: 2.6, layer: 2, tags: 'tree willow weeping river swamp', draw: (c, r, w) => {
    const R = w * 0.44;
    shadow(c, true, 16, 9, 12, 0.45); circ(c, 0, 0, R * 0.92); c.fillStyle = '#3a6a28'; c.fill(); shadow(c, false);
    for (let i = 0; i < 90; i++) {
      const a = r() * TAU, d0 = R * rrange(r, 0.05, 0.4), d1 = R * rrange(r, 0.75, 1);
      const x0 = Math.cos(a) * d0, y0 = Math.sin(a) * d0, x1 = Math.cos(a + rrange(r, -0.2, 0.2)) * d1, y1 = Math.sin(a + rrange(r, -0.2, 0.2)) * d1;
      c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 + rrange(r, -6, 6), (y0 + y1) / 2 + rrange(r, -6, 6), x1, y1);
      const lit = (-x1 - y1) / (R * 1.4);
      st(c, lit > 0.2 ? '#9ac860' : lit < -0.3 ? '#2a5018' : pick(r, ['#5a8f36', '#6aa040', '#4a7a2c']), rrange(r, 2, 4));
    }
    for (let i = 0; i < 160; i++) { const a = r() * TAU, d = R * Math.sqrt(r()); leafShape(c, Math.cos(a) * d, Math.sin(a) * d, 5, 1.6, a); c.fillStyle = pick(r, ['#8ab850', '#5a8f36', '#b0d878']); c.fill(); }
    circ(c, 0, 0, R * 0.12); fs(c, ball(c, 0, 0, R * 0.12, '#5a4030'), 1.6);
  } },
  { id: 'palm', name: t('Palm tree'), cat: 'nature', w: 2.2, h: 2.2, layer: 2, tags: 'tree palm tropical beach island', draw: (c, r, w) => {
    const R = w * 0.45, n = 9;
    shadow(c, true, 14, 10, 14, 0.45);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rrange(r, -0.15, 0.15), L = R * rrange(r, 0.85, 1);
      at(c, 0, 0, a, () => {
        c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(L * 0.5, -L * 0.12, L, L * 0.05);
        c.quadraticCurveTo(L * 0.5, L * 0.22, 0, 0); c.closePath();
        fs(c, lin(c, 0, -L * 0.1, 0, L * 0.2, [[0, '#7ab04a'], [1, '#2e5a1e']]), 1.6);
        shadow(c, false);
        c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(L * 0.5, -L * 0.02, L, L * 0.05); st(c, '#c8d890', 1.2);
        for (let k = 1; k < 14; k++) { const px = (k / 14) * L; line(c, px, px * 0.02 - L * 0.01, px + L * 0.04, -L * 0.13 + px * 0.06, 'rgba(20,45,10,0.5)', 1); line(c, px, px * 0.02, px + L * 0.04, L * 0.17 - px * 0.05, 'rgba(20,45,10,0.5)', 1); }
        shadow(c, true, 14, 10, 14, 0.45);
      });
    }
    shadow(c, false);
    for (let i = 0; i < 4; i++) { const a = r() * TAU; circ(c, Math.cos(a) * 7, Math.sin(a) * 7, 6); fs(c, ball(c, 0, 0, 6, '#6a4a22'), 1.2); }
    circ(c, 0, 0, 7); fs(c, '#8a6a3a', 1.4);
  } },
  { id: 'dead_tree', name: t('Dead tree'), cat: 'nature', w: 2, h: 2, layer: 2, tags: 'tree dead bare spooky haunted withered', draw: (c, r, w) => { shadow(c, true, 8, 8, 12, 0.4); branches(c, r, w * 0.46, '#5a4a3e', 3, 6); shadow(c, false); } },
  { id: 'cypress', name: t('Cypress'), cat: 'nature', w: 1, h: 1, layer: 2, tags: 'tree cypress slim conifer', draw: (c, r, w) => {
    const R = w * 0.38;
    shadow(c, true, 12, 9, 13, 0.5); circ(c, 0, 0, R); c.fillStyle = '#1e3a22'; c.fill(); shadow(c, false);
    for (let k = 0; k < 5; k++) { blob(c, r, R * (1 - k * 0.17), 11, 0.14, -k * 1.5, -k * 1.5); c.fillStyle = shade('#2a4e2c', k * 0.12); c.fill(); st(c, 'rgba(10,25,10,0.4)', 1); }
    circ(c, 0, 0, R); st(c, INK, 2.2);
  } },
  { id: 'mangrove', name: t('Swamp tree'), cat: 'nature', w: 2.4, h: 2.4, layer: 2, tags: 'tree swamp mangrove bog moss', draw: (c, r, w) => {
    foliage(c, r, w * 0.42, { base: '#4a6a32', light: '#6a8a42', dark: '#26381a', hi: '#8aa060' }, { lobes: 10 });
    for (let i = 0; i < 14; i++) { const a = r() * TAU, d = Math.sqrt(r()) * w * 0.36, x = Math.cos(a) * d, y = Math.sin(a) * d; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 4; k++) c.lineTo(x + rrange(r, -6, 6), y + k * 6); st(c, 'rgba(160,170,120,0.7)', 2); }
  } },
  { id: 'berry_bush', name: t('Berry bush'), cat: 'nature', w: 1.2, h: 1.2, layer: 1, tags: 'bush berries shrub', draw: (c, r, w) => {
    foliage(c, r, w * 0.38, { base: '#3e7a32', light: '#62a04a', dark: '#22481c' }, { lobes: 7, fruit: pick(r, ['#3a3aa8', '#c02040', '#6a2a8a']) });
  } },
  { id: 'flower_bush', name: t('Flowering bush'), cat: 'nature', w: 1.2, h: 1.2, layer: 1, tags: 'bush flowers hydrangea rhododendron', draw: (c, r, w) => {
    foliage(c, r, w * 0.38, GREENS, { lobes: 7, blossom: pick(r, ['#b890e8', '#f0a0c0', '#ffffff', '#90b8f0']) });
  } },
  { id: 'rose_bush', name: t('Rose bush'), cat: 'nature', w: 1, h: 1, layer: 1, tags: 'roses bush garden flowers red', draw: (c, r, w) => {
    foliage(c, r, w * 0.36, { base: '#2e6a2a', light: '#4a8a3a', dark: '#1a3e18' }, { lobes: 6 });
    const col = pick(r, ['#c01830', '#f8f0f0', '#f0a0b8', '#f0c840']);
    for (let i = 0; i < 9; i++) { const a = r() * TAU, d = Math.sqrt(r()) * w * 0.3, x = Math.cos(a) * d, y = Math.sin(a) * d; circ(c, x, y, 4.5); fs(c, ball(c, x, y, 4.5, col, 0.3), 0.8); c.beginPath(); c.arc(x, y, 2.2, 0, 4.5); st(c, shade(col, -0.35), 0.8); }
  } },
  { id: 'hedge', name: t('Hedge'), cat: 'nature', w: 2, h: 0.8, layer: 1, tags: 'hedge bush wall garden topiary', draw: (c, r, w, h) => {
    const W = w * 0.92, H = h * 0.7;
    shadow(c, true, 10, 5, 7, 0.5); rrect(c, -W / 2, -H / 2, W, H, 10); c.fillStyle = '#244a1c'; c.fill(); shadow(c, false);
    rrect(c, -W / 2, -H / 2, W, H, 10); fs(c, lin(c, 0, -H / 2, 0, H / 2, [[0, '#5a9038'], [1, '#2a5420']]), 2.2);
    clip(c, () => rrect(c, -W / 2, -H / 2, W, H, 10), () => { for (let i = 0; i < 220; i++) { const x = rrange(r, -W / 2, W / 2), y = rrange(r, -H / 2, H / 2); leafShape(c, x, y, rrange(r, 5, 8), 2.4, r() * TAU); c.fillStyle = y < -H * 0.1 ? pick(r, ['#7ab04a', '#5a9038']) : pick(r, ['#3a6a28', '#2a5420']); c.fill(); } });
    rrect(c, -W / 2, -H / 2, W, H, 10); st(c, INK, 2.2);
  } },
  { id: 'fern', name: t('Ferns'), cat: 'nature', w: 1, h: 1, layer: 1, tags: 'fern undergrowth plant forest', draw: (c, r, w) => { for (let i = 0; i < 3; i++) fern(c, r, rrange(r, -w * 0.12, w * 0.12), rrange(r, -w * 0.12, w * 0.12), w * rrange(r, 0.3, 0.4), pick(r, ['#4f8a33', '#5a9a3a', '#3e7a2a'])); } },
  { id: 'reeds', name: t('Reeds'), cat: 'nature', w: 1, h: 1, layer: 1, tags: 'reeds cattails marsh pond water', draw: (c, r, w) => {
    for (let i = 0; i < 26; i++) {
      const x = rrange(r, -w * 0.35, w * 0.35), y = rrange(r, -w * 0.35, w * 0.35), a = rrange(r, -2.4, -0.7), L = rrange(r, 14, 26);
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a) * L * 0.5 + 3, y + Math.sin(a) * L * 0.5, x + Math.cos(a) * L, y + Math.sin(a) * L); st(c, pick(r, ['#6a8a3a', '#8aa04a', '#4a6a2a']), 1.8);
      if (r() < 0.35) { ell(c, x + Math.cos(a) * L * 0.8, y + Math.sin(a) * L * 0.8, 2.4, 6, a + Math.PI / 2); fs(c, '#6a4024', 0.8); }
    }
  } },
  { id: 'lily_pads', name: t('Lily pads'), cat: 'nature', w: 1.4, h: 1.4, layer: 0, tags: 'lily pads pond water lotus', draw: (c, r, w) => {
    for (let i = 0; i < 7; i++) lily(c, rrange(r, -w * 0.34, w * 0.34), rrange(r, -w * 0.34, w * 0.34), rrange(r, 9, 15), r() * TAU);
    for (let i = 0; i < 2; i++) { const x = rrange(r, -w * 0.25, w * 0.25), y = rrange(r, -w * 0.25, w * 0.25); flower(c, x, y, 7, pick(r, ['#f8d0e0', '#ffffff']), '#f0d040', 8); }
  } },
  { id: 'sunflowers', name: t('Sunflowers'), cat: 'nature', w: 1.2, h: 1.2, layer: 1, tags: 'sunflower flowers yellow field', draw: (c, r, w) => {
    for (let i = 0; i < 7; i++) { const x = rrange(r, -w * 0.32, w * 0.32), y = rrange(r, -w * 0.32, w * 0.32); for (let k = 0; k < 3; k++) { leafShape(c, x + rrange(r, -10, 10), y + rrange(r, -10, 10), 14, 6, r() * TAU); fs(c, '#4a7a2a', 0.8); }
      shadow(c, true, 3, 2, 3, 0.4); for (let p = 0; p < 14; p++) { const q = (p / 14) * TAU; ell(c, x + Math.cos(q) * 8, y + Math.sin(q) * 8, 5, 2.4, q); c.fillStyle = '#f8c820'; c.fill(); } shadow(c, false);
      circ(c, x, y, 6); fs(c, radial(c, x, y, 6, '#8a5a20', '#3a2010'), 0.8); }
  } },
  { id: 'lavender', name: t('Lavender'), cat: 'nature', w: 1.5, h: 1, layer: 0, tags: 'lavender purple flowers herbs field', draw: (c, r, w, h) => {
    for (let row = 0; row < 3; row++) { const y = -h * 0.28 + row * h * 0.28; for (let i = 0; i < 6; i++) { const x = -w * 0.38 + i * w * 0.15 + rrange(r, -3, 3); grassTuft(c, r, x, y, 12, ['#5a7a4a', '#7a9a6a']); for (let k = 0; k < 6; k++) { circ(c, x + rrange(r, -8, 8), y + rrange(r, -8, 8), 1.8); c.fillStyle = pick(r, ['#9a70d0', '#b890e8', '#7a50b0']); c.fill(); } } }
  } },
  { id: 'wildflowers', name: t('Wildflowers'), cat: 'nature', w: 1.5, h: 1.5, layer: 0, tags: 'flowers meadow wild colorful', draw: (c, r, w) => {
    for (let i = 0; i < 10; i++) grassTuft(c, r, rrange(r, -w * 0.4, w * 0.4), rrange(r, -w * 0.4, w * 0.4), 10);
    for (let i = 0; i < 26; i++) flower(c, rrange(r, -w * 0.4, w * 0.4), rrange(r, -w * 0.4, w * 0.4), rrange(r, 3, 5), pick(r, ['#f4d35e', '#ee6c9c', '#ffffff', '#9b7ddb', '#ff8c42', '#e83a3a', '#6ab0f0']));
  } },
  { id: 'tulips', name: t('Tulip bed'), cat: 'nature', w: 1.5, h: 1, layer: 0, tags: 'tulips flowers garden bed', draw: (c, r, w, h) => {
    rrect(c, -w * 0.45, -h * 0.4, w * 0.9, h * 0.8, 8); fs(c, radial(c, 0, 0, w * 0.5, '#6a4a2e', '#4a3420', 0.2), 1.6);
    const col = pick(r, ['#e83a4a', '#f0d030', '#f080b0', '#a050d0']);
    for (let row = 0; row < 3; row++) for (let i = 0; i < 7; i++) { const x = -w * 0.38 + i * w * 0.126, y = -h * 0.24 + row * h * 0.24; leafShape(c, x + 4, y + 4, 10, 3, 0.8); fs(c, '#4a8a3a', 0.6); circ(c, x, y, 4); fs(c, ball(c, x, y, 4, row === 1 && r() < 0.3 ? '#f8f0f0' : col, 0.35), 0.8); }
  } },
  { id: 'mossy_log', name: t('Mossy log'), cat: 'nature', w: 2.5, h: 0.8, layer: 1, tags: 'log fallen tree moss rotten', draw: (c, r, w, h) => {
    const W = w * 0.86, H = h * 0.62;
    shadow(c, true, 8, 4, 6); rrect(c, -W / 2, -H / 2, W, H, H / 2); fs(c, lin(c, 0, -H / 2, 0, H / 2, [[0, '#7a5a3e'], [1, '#3a2a1a']])); shadow(c, false);
    for (let i = 0; i < 6; i++) line(c, -W * 0.42, rrange(r, -H * 0.35, H * 0.35), W * 0.38, rrange(r, -H * 0.35, H * 0.35), 'rgba(20,10,0,0.4)', 1.4);
    clip(c, () => rrect(c, -W / 2, -H / 2, W, H, H / 2), () => { for (let i = 0; i < 30; i++) { blob(c, r, rrange(r, 4, 10), 6, 0.3, rrange(r, -W / 2, W / 2), rrange(r, -H / 2, 0)); c.fillStyle = pick(r, ['#5a8a2e', '#6f9e3a', '#4a7526']); c.fill(); } });
    ell(c, W / 2 - H * 0.3, 0, H * 0.3, H / 2); fs(c, '#a8805a', 2);
    for (let k = 1; k < 3; k++) { ell(c, W / 2 - H * 0.3, 0, H * 0.1 * k, H * 0.16 * k); st(c, 'rgba(90,50,20,0.55)', 1); }
    for (let i = 0; i < 4; i++) { const x = rrange(r, -W * 0.3, W * 0.3); ell(c, x, H / 2, 5, 3); fs(c, '#d8c8a0', 0.8); }
  } },
  { id: 'roots', name: t('Tree roots'), cat: 'nature', w: 2, h: 2, layer: 0, tags: 'roots tree base gnarled', draw: (c, r, w) => {
    const n = 9 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      let x = 0, y = 0, a = (i / n) * TAU + rrange(r, -0.2, 0.2);
      const L = rrange(r, 0.3, 0.45) * w, steps = 8, pts: [number, number][] = [[x, y]];
      for (let k = 0; k < steps; k++) { a += rrange(r, -0.3, 0.3); x += Math.cos(a) * L / steps; y += Math.sin(a) * L / steps; pts.push([x, y]); }
      const W0 = rrange(r, 9, 14), left: number[] = [], right: number[] = [];
      for (let k = 0; k < pts.length; k++) {
        const [px, py] = pts[k], [qx, qy] = pts[Math.min(k + 1, pts.length - 1)], [ox, oy] = pts[Math.max(k - 1, 0)];
        const ang = Math.atan2(qy - oy, qx - ox), wd = W0 * (1 - k / pts.length) + 1;
        left.push(px + Math.cos(ang - Math.PI / 2) * wd, py + Math.sin(ang - Math.PI / 2) * wd);
        right.push(px + Math.cos(ang + Math.PI / 2) * wd, py + Math.sin(ang + Math.PI / 2) * wd);
      }
      const outline: number[] = [...left];
      for (let k = right.length - 2; k >= 0; k -= 2) outline.push(right[k], right[k + 1]);
      shadow(c, true, 4, 2, 3, 0.4); poly(c, outline); fs(c, lin(c, -10, -10, 10, 10, [[0, '#8a6a4a'], [1, '#5a3e28']]), 2); shadow(c, false);
      c.beginPath(); for (let k = 0; k < pts.length - 2; k++) { const [px, py] = pts[k]; k ? c.lineTo(px - 2, py - 2) : c.moveTo(px - 2, py - 2); } st(c, 'rgba(255,220,170,0.25)', 2);
    }
    circ(c, 0, 0, w * 0.2); fs(c, ball(c, 0, 0, w * 0.2, '#6a4a32', 0.2), 2.4);
    circ(c, 0, 0, w * 0.16); fs(c, radial(c, 0, 0, w * 0.16, '#c8986a', '#8a6a4a'), 1.6);
    for (let k = 1; k < 4; k++) { circ(c, 0, 0, w * 0.04 * k); st(c, 'rgba(90,50,20,0.5)', 1); }
  } },
  { id: 'cactus', name: 'Cactus', cat: 'nature', w: 1, h: 1, layer: 1, tags: 'cactus desert succulent', draw: (c, r, w) => {
    const arm = (x: number, y: number, R: number) => { shadow(c, true, 6, 3, 5, 0.45); circ(c, x, y, R); fs(c, ball(c, x, y, R, '#4a8a4a', 0.3), 1.8); shadow(c, false); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; line(c, x + Math.cos(a) * R * 0.3, y + Math.sin(a) * R * 0.3, x + Math.cos(a) * R * 0.95, y + Math.sin(a) * R * 0.95, 'rgba(20,50,20,0.5)', 1); circ(c, x + Math.cos(a + 0.4) * R * 0.75, y + Math.sin(a + 0.4) * R * 0.75, 0.8); c.fillStyle = '#f0f0d0'; c.fill(); } };
    arm(rrange(r, -w * 0.3, -w * 0.2), rrange(r, -6, 6), w * 0.14); arm(rrange(r, w * 0.2, w * 0.3), rrange(r, -8, 8), w * 0.12);
    arm(0, 0, w * 0.24);
    if (r() < 0.6) flower(c, 0, 0, 5, '#f060a0', '#f0e040');
  } },
  { id: 'desert_shrub', name: t('Dry shrub'), cat: 'nature', w: 1, h: 1, layer: 1, tags: 'tumbleweed desert dry bush scrub', draw: (c, r, w) => {
    shadow(c, true, 5, 3, 4, 0.4);
    for (let i = 0; i < 70; i++) { const a = r() * TAU, d = rrange(r, 0, w * 0.32); const x = Math.cos(a) * d, y = Math.sin(a) * d, b = r() * TAU; line(c, x, y, x + Math.cos(b) * 10, y + Math.sin(b) * 10, pick(r, ['#8a7040', '#a88a50', '#6a5430', '#b8a070']), 1.2); }
    shadow(c, false);
  } },
  { id: 'cow_skull', name: t('Bleached skull'), cat: 'nature', w: 1, h: 0.8, layer: 0, tags: 'skull cow desert bones horns', draw: (c, r, w, h) => {
    at(c, 0, 0, rrange(r, -0.4, 0.4), () => {
      for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * w * 0.1, -h * 0.15); c.quadraticCurveTo(s * w * 0.35, -h * 0.25, s * w * 0.42, -h * 0.45); st(c, INK, 6); st(c, '#e8dcc0', 4); }
      shadow(c, true, 3, 2, 3, 0.4); c.beginPath(); c.moveTo(-w * 0.15, -h * 0.2); c.lineTo(w * 0.15, -h * 0.2); c.lineTo(w * 0.08, h * 0.35); c.lineTo(-w * 0.08, h * 0.35); c.closePath(); fs(c, ball(c, 0, 0, w * 0.2, '#ece2c8', 0.2), 1.6); shadow(c, false);
      for (const s of [-1, 1]) { ell(c, s * w * 0.07, -h * 0.05, 4, 5); c.fillStyle = '#2a2018'; c.fill(); }
      for (const s of [-1, 1]) { ell(c, s * w * 0.03, h * 0.28, 1.6, 3); c.fillStyle = '#2a2018'; c.fill(); }
    });
    void bone; void skull;
  } },
  { id: 'beehive', name: t('Beehive'), cat: 'nature', w: 0.7, h: 0.7, layer: 1, tags: 'bees hive skep honey farm', draw: (c, r, w) => {
    const R = w * 0.34;
    shadow(c, true, 6, 3, 4); circ(c, 0, 0, R); fs(c, ball(c, 0, 0, R, STRAW, 0.25), 1.8); shadow(c, false);
    for (let k = 1; k < 6; k++) { circ(c, 0, 0, R * (1 - k * 0.16)); st(c, 'rgba(110,80,20,0.5)', 1.4); }
    ell(c, R * 0.4, R * 0.6, 4, 3); c.fillStyle = '#1a1008'; c.fill();
    for (let i = 0; i < 6; i++) { const x = rrange(r, -R * 1.3, R * 1.3), y = rrange(r, -R * 1.3, R * 1.3); ell(c, x, y, 1.8, 1.2, r() * 3); c.fillStyle = '#f0c030'; c.fill(); line(c, x - 0.5, y - 1, x + 0.5, y + 1, '#1a1008', 0.6); }
  } },
  { id: 'bird_nest', name: t('Bird nest'), cat: 'nature', w: 0.6, h: 0.6, layer: 1, tags: 'nest eggs bird twigs', draw: (c, r, w) => {
    const R = w * 0.32;
    shadow(c, true, 4, 2, 3); circ(c, 0, 0, R); fs(c, '#7a5a34', 1.4); shadow(c, false);
    for (let i = 0; i < 50; i++) { const a = r() * TAU, d = rrange(r, R * 0.6, R); const x = Math.cos(a) * d, y = Math.sin(a) * d, b = a + Math.PI / 2 + rrange(r, -0.4, 0.4); line(c, x, y, x + Math.cos(b) * 6, y + Math.sin(b) * 6, pick(r, ['#9a7a4a', '#5a3e22', '#b8945a']), 1); }
    circ(c, 0, 0, R * 0.58); c.fillStyle = '#4a321a'; c.fill();
    const col = pick(r, ['#a8d8e8', '#f0ead8', '#d8c8a0']);
    for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + r(); ell(c, Math.cos(a) * R * 0.25, Math.sin(a) * R * 0.25, 4, 5.5, a); fs(c, ball(c, 0, 0, 5, col, 0.3), 0.8); }
  } },
  { id: 'pumpkins', name: t('Pumpkin patch'), cat: 'nature', w: 1.5, h: 1.5, layer: 1, tags: 'pumpkins autumn halloween farm vegetables', draw: (c, r, w) => {
    for (let i = 0; i < 6; i++) { let x = rrange(r, -w * 0.4, w * 0.4), y = rrange(r, -w * 0.4, w * 0.4); c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 5; k++) { x += rrange(r, -15, 15); y += rrange(r, -15, 15); c.lineTo(x, y); } st(c, '#4a7a2a', 2); leafShape(c, x, y, 14, 9, r() * TAU); fs(c, '#4a8a3a', 1); }
    for (let i = 0; i < 5; i++) pumpkin(c, rrange(r, -w * 0.3, w * 0.3), rrange(r, -w * 0.3, w * 0.3), rrange(r, 9, 15));
  } },
  { id: 'wheat', name: t('Wheat field'), cat: 'nature', w: 2, h: 2, layer: 0, tags: 'wheat grain field crops farm', draw: (c, r, w) => {
    for (let row = 0; row < 7; row++) for (let i = 0; i < 16; i++) {
      const x = -w * 0.44 + i * w * 0.058 + rrange(r, -3, 3), y = -w * 0.42 + row * w * 0.14 + rrange(r, -3, 3), a = rrange(r, -0.5, 0.5) - Math.PI / 2 + 0.4;
      line(c, x, y, x + Math.cos(a) * 12, y + Math.sin(a) * 12, '#a88a3a', 1.2);
      ell(c, x + Math.cos(a) * 12, y + Math.sin(a) * 12, 2, 4.4, a + Math.PI / 2); fs(c, pick(r, ['#e8c860', '#d8b050', '#f0d878']), 0.6, '#8a6a24');
    }
  } },
  { id: 'grass_tufts', name: t('Grass tufts'), cat: 'nature', w: 1.5, h: 1.5, layer: 0, tags: 'grass tufts weeds scatter', draw: (c, r, w) => { for (let i = 0; i < 9; i++) grassTuft(c, r, rrange(r, -w * 0.4, w * 0.4), rrange(r, -w * 0.4, w * 0.4), rrange(r, 8, 14)); } },
  { id: 'clover', name: t('Clover patch'), cat: 'nature', w: 1.2, h: 1.2, layer: 0, tags: 'clover ground cover plants', draw: (c, r, w) => {
    for (let i = 0; i < 40; i++) { const a = r() * TAU, d = Math.sqrt(r()) * w * 0.4, x = Math.cos(a) * d, y = Math.sin(a) * d; for (let k = 0; k < 3; k++) { const q = (k / 3) * TAU + r(); circ(c, x + Math.cos(q) * 2.5, y + Math.sin(q) * 2.5, 2.4); c.fillStyle = pick(r, ['#5a9a3a', '#4a8a2e', '#6aaa48']); c.fill(); } }
    for (let i = 0; i < 6; i++) { circ(c, rrange(r, -w * 0.35, w * 0.35), rrange(r, -w * 0.35, w * 0.35), 3); c.fillStyle = '#f0e0f0'; c.fill(); }
  } },
  { id: 'outcrop', name: t('Rock outcrop'), cat: 'nature', w: 3, h: 2.2, layer: 1, tags: 'rocks cliff boulder outcrop hill', draw: (c, r, w, h) => {
    const items: [number, number, number][] = [];
    for (let i = 0; i < 12; i++) items.push([rrange(r, -w * 0.32, w * 0.32), rrange(r, -h * 0.28, h * 0.28), rrange(r, 16, 34)]);
    items.sort((a, b) => a[1] - b[1]);
    for (const [x, y, R] of items) boulder(c, r, x, y, R, pick(r, ['#8e897e', '#9a958c', '#7e796f']), r() < 0.5 ? 0.6 : 0);
    for (let i = 0; i < 10; i++) rock(c, r, rrange(r, -w * 0.45, w * 0.45), rrange(r, -h * 0.45, h * 0.45), rrange(r, 3, 7), STONE);
  } },
  { id: 'mossy_boulder', name: t('Mossy boulder'), cat: 'nature', w: 1.4, h: 1.4, layer: 1, tags: 'rock boulder moss stone', draw: (c, r, w) => boulder(c, r, 0, 0, w * 0.38, '#8a867c', 1.2) },
  { id: 'river_stones', name: t('River stones'), cat: 'nature', w: 1.5, h: 1.5, layer: 0, tags: 'stones pebbles stepping stones river', draw: (c, r, w) => {
    for (let i = 0; i < 6; i++) { const x = -w * 0.35 + i * w * 0.14 + rrange(r, -4, 4), y = rrange(r, -w * 0.3, w * 0.3); shadow(c, true, 3, 2, 3, 0.4); ell(c, x, y, rrange(r, 9, 14), rrange(r, 7, 10), r() * 3); fs(c, radial(c, x, y, 12, '#b8b4aa', '#6a665c', 0.4), 1.6); shadow(c, false); }
  } },
  { id: 'fallen_leaves', name: t('Fallen leaves'), cat: 'nature', w: 1.5, h: 1.5, layer: 0, tags: 'leaves autumn fall scatter', draw: (c, r, w) => {
    for (let i = 0; i < 60; i++) { const a = r() * TAU, d = Math.sqrt(r()) * w * 0.42, x = Math.cos(a) * d, y = Math.sin(a) * d; leafShape(c, x, y, rrange(r, 7, 11), rrange(r, 2.5, 4), r() * TAU); fs(c, pick(r, ['#c86a2a', '#e8a040', '#a83a1a', '#d8b040', '#8a5a2a']), 0.6, 'rgba(60,30,10,0.6)'); }
  } },
  { id: 'firewood', name: t('Firewood pile'), cat: 'nature', w: 1.4, h: 0.8, layer: 1, tags: 'firewood logs wood stack', draw: (c, r, w, h) => {
    for (let row = 0; row < 3; row++) for (let i = 0; i < 6 - row; i++) {
      const x = -w * 0.34 + i * w * 0.13 + row * w * 0.065, y = h * 0.18 - row * h * 0.2, R = h * 0.12;
      shadow(c, true, 3, 2, 3, 0.4); circ(c, x, y, R); fs(c, '#6a4a2a', 1.4); shadow(c, false);
      circ(c, x, y, R * 0.78); c.fillStyle = radial(c, x, y, R, '#e0b07a', '#a8784a'); c.fill();
      circ(c, x, y, R * 0.35); st(c, 'rgba(90,50,20,0.5)', 0.8);
    }
    void grain; void rect; void rod; void poly; void WOOD; void WOOD_D; void WOOD_L; void glow; void mulberry32;
  } },
];
