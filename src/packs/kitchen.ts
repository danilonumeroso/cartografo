import { t } from '../i18n';
import {
  at, ball, barrelTop, blob, bottle, circ, clip, coals, coin, ell, flame, fs, glow, GOLD, grain, INK, IRON, jar, lin, line, LINEN,
  METAL, METAL_D, METAL_L, OAK, OAK_L, pick, plankBox, poly, radial, rect, rod, rrange, rrect, shade, shadow, StampDef, st, STONE,
  STONE_D, STONE_L, TAU, tub, WOOD, WOOD_D, WOOD_L, C2D, STRAW, rock,
} from '../art';
import { mug, plate, seat } from './furniture';
import type { Rng } from '../util';

function apple(c: C2D, x: number, y: number, R: number, col: string) {
  circ(c, x, y, R); fs(c, ball(c, x, y, R, col, 0.4), 0.9);
  line(c, x, y - R * 0.2, x + R * 0.25, y - R * 0.6, '#4a2a10', 1);
}
function loaf(c: C2D, x: number, y: number, L: number, rot: number) {
  at(c, x, y, rot, () => {
    shadow(c, true, 3, 1.5, 2, 0.4); ell(c, 0, 0, L / 2, L * 0.28); fs(c, ball(c, 0, 0, L / 2, '#c88a3e', 0.35), 1.2); shadow(c, false);
    for (let i = -1; i <= 1; i++) line(c, i * L * 0.18 - L * 0.06, -L * 0.14, i * L * 0.18 + L * 0.06, L * 0.14, 'rgba(255,230,170,0.75)', 1.6);
  });
}
function fish(c: C2D, x: number, y: number, L: number, rot: number) {
  at(c, x, y, rot, () => {
    c.beginPath(); c.moveTo(-L / 2, 0); c.quadraticCurveTo(0, -L * 0.24, L * 0.32, 0); c.quadraticCurveTo(0, L * 0.24, -L / 2, 0); c.closePath();
    fs(c, lin(c, 0, -L * 0.2, 0, L * 0.2, [[0, '#a8b8c0'], [0.5, '#e0e8ec'], [1, '#6a7a88']]), 1);
    poly(c, [L * 0.3, 0, L / 2, -L * 0.14, L / 2, L * 0.14]); fs(c, '#8a9aa8', 1);
    circ(c, -L * 0.33, -L * 0.02, 1.2); c.fillStyle = '#111'; c.fill();
  });
}
function crateOf(c: C2D, r: Rng, w: number, fill: (S: number) => void) {
  const S = w * 0.84;
  shadow(c, true, 6, 3, 5); rect(c, -S / 2, -S / 2, S, S); fs(c, WOOD_L); shadow(c, false);
  for (let i = 0; i < 4; i++) { const y = -S / 2 + (i * S) / 4; rect(c, -S / 2, y, S, S / 4 - 1); c.fillStyle = `rgba(${i % 2 ? '255,230,190' : '40,20,5'},0.08)`; c.fill(); }
  rect(c, -S / 2 + 6, -S / 2 + 6, S - 12, S - 12); c.fillStyle = '#2a1a0e'; c.fill();
  clip(c, () => rect(c, -S / 2 + 6, -S / 2 + 6, S - 12, S - 12), () => fill(S - 12));
  rect(c, -S / 2, -S / 2, S, S); st(c, INK, 2);
  rect(c, -S / 2 + 6, -S / 2 + 6, S - 12, S - 12); st(c, 'rgba(20,10,5,0.8)', 1.4);
  void r;
}
function cask(c: C2D, r: Rng, x: number, y: number, L: number, R: number, rot = 0, tap = true) {
  at(c, x, y, rot, () => {
    shadow(c, true, 7, 3, 5);
    c.beginPath(); c.moveTo(-L / 2, -R * 0.85); c.quadraticCurveTo(0, -R * 1.12, L / 2, -R * 0.85); c.lineTo(L / 2, R * 0.85); c.quadraticCurveTo(0, R * 1.12, -L / 2, R * 0.85); c.closePath();
    fs(c, lin(c, 0, -R, 0, R, [[0, WOOD_L], [0.4, WOOD], [1, WOOD_D]]), 2.2); shadow(c, false);
    for (let i = 1; i < 5; i++) { const yy = -R + (i * 2 * R) / 5; line(c, -L / 2 + 2, yy, L / 2 - 2, yy, 'rgba(40,20,5,0.4)', 1); }
    for (const k of [-0.38, -0.18, 0.18, 0.38]) { c.beginPath(); c.moveTo(k * L, -R * (1.02 - Math.abs(k) * 0.3)); c.lineTo(k * L, R * (1.02 - Math.abs(k) * 0.3)); st(c, IRON, 3.2); }
    ell(c, L / 2, 0, R * 0.22, R * 0.85); fs(c, WOOD_L, 1.6);
    if (tap) { rect(c, L / 2 + 2, -2, 8, 4); fs(c, '#c9a24a', 1); }
    void r;
  });
}

export const KITCHEN: StampDef[] = [
  { id: 'stove', name: t('Stove'), cat: 'kitchen', w: 1.5, h: 1, layer: 1, light: { radius: 3.5, color: '#ff9a4a', intensity: 0.75 }, tags: 'oven cook hearth', draw: (c, r, w, h) => {
    const W = w * 0.9, H = h * 0.82;
    shadow(c, true); rrect(c, -W / 2, -H / 2, W, H, 4); fs(c, '#8a4a36'); shadow(c, false);
    for (let row = 0; row < 6; row++) for (let k = 0; k < 9; k++) { const bx = -W / 2 + ((k + (row % 2) * 0.5) * W) / 8.5, by = -H / 2 + (row * H) / 6; if (bx > W / 2 - 4) continue; rect(c, bx, by, W / 8.5 - 1.5, H / 6 - 1.5); c.fillStyle = shade('#9a5440', rrange(r, -0.15, 0.12)); c.fill(); }
    rrect(c, -W * 0.42, -H * 0.4, W * 0.84, H * 0.56, 3); fs(c, lin(c, 0, -H * 0.4, 0, H * 0.16, [[0, '#4a4f56'], [1, '#24282c']]), 1.6);
    for (const x of [-W * 0.22, W * 0.2]) { circ(c, x, -H * 0.12, H * 0.18); st(c, '#16181a', 2); circ(c, x, -H * 0.12, H * 0.12); st(c, '#3a3e44', 1.4); }
    circ(c, -W * 0.22, -H * 0.12, H * 0.2); fs(c, ball(c, -W * 0.22, -H * 0.12, H * 0.2, '#3a3a3e', 0.3), 1.4);
    circ(c, -W * 0.22, -H * 0.12, H * 0.14); fs(c, radial(c, -W * 0.22, -H * 0.12, H * 0.14, '#d9a050', '#8a5220', 0), 0.8);
    rrect(c, W * 0.06, -H * 0.3, W * 0.3, H * 0.36, 3); fs(c, lin(c, 0, -H * 0.3, 0, H * 0.06, [[0, METAL_L], [1, METAL_D]]), 1.4);
    line(c, W * 0.36, -H * 0.12, W * 0.48, -H * 0.12, INK, 4); line(c, W * 0.36, -H * 0.12, W * 0.48, -H * 0.12, '#5a3a22', 2.4);
    rrect(c, -W * 0.2, H * 0.2, W * 0.4, H * 0.24, [8, 8, 2, 2]); c.fillStyle = '#140a05'; c.fill();
    clip(c, () => rrect(c, -W * 0.2, H * 0.2, W * 0.4, H * 0.24, [8, 8, 2, 2]), () => coals(c, r, 0, H * 0.36, W * 0.2, 10));
    flame(c, 0, H * 0.32, 6);
  } },
  { id: 'spit_roast', name: t('Spit roast'), cat: 'kitchen', w: 1.8, h: 1.2, layer: 1, light: { radius: 5, color: '#ffa04a', intensity: 0.9 }, tags: 'fire pig boar cooking camp', draw: (c, r, w, h) => {
    const R = h * 0.32;
    for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; rock(c, r, Math.cos(a) * R * 1.25, Math.sin(a) * R * 1.05, 8, '#8a8378'); }
    coals(c, r, 0, 0, R, 18); flame(c, -6, 4, 9); flame(c, 8, -2, 7);
    for (const s of [-1, 1]) { rod(c, s * w * 0.4, -6, s * w * 0.4, 6, WOOD_D, 4); line(c, s * w * 0.4 - 6, -8, s * w * 0.4 + 6, 8, WOOD_D, 3); }
    rod(c, -w * 0.43, 0, w * 0.43, 0, METAL_D, 2.5);
    shadow(c, true, 6, 3, 4);
    c.beginPath(); c.ellipse(0, 0, w * 0.22, h * 0.17, 0, 0, TAU); fs(c, ball(c, 0, 0, w * 0.22, '#a0582a', 0.35), 1.8); shadow(c, false);
    ell(c, w * 0.22, 0, h * 0.1, h * 0.09); fs(c, ball(c, w * 0.22, 0, h * 0.1, '#8a4a22', 0.3), 1.4);
    for (const s of [-1, 1]) { ell(c, w * 0.24, s * h * 0.07, 4, 3, s * 0.5); fs(c, '#7a3a1a', 1); }
    for (const s of [-1, 1]) { line(c, -w * 0.1, s * h * 0.14, -w * 0.2, s * h * 0.25, '#7a3a1a', 5); line(c, w * 0.1, s * h * 0.14, w * 0.16, s * h * 0.25, '#7a3a1a', 5); }
    for (let i = 0; i < 4; i++) line(c, -w * 0.15 + i * w * 0.08, -h * 0.12, -w * 0.12 + i * w * 0.08, h * 0.12, 'rgba(60,20,5,0.4)', 1.4);
    ell(c, -w * 0.06, -h * 0.07, w * 0.1, h * 0.04, -0.2); c.fillStyle = 'rgba(255,220,150,0.35)'; c.fill();
  } },
  { id: 'keg_rack', name: t('Keg rack'), cat: 'kitchen', w: 2, h: 1, layer: 1, tags: 'barrels ale beer casks', draw: (c, r, w, h) => {
    const W = w * 0.92, H = h * 0.86;
    shadow(c, true, 6, 2, 4); rect(c, -W / 2, -H / 2, W, H); fs(c, 'rgba(0,0,0,0)', 0); shadow(c, false);
    for (const y of [-H * 0.42, H * 0.42]) { rod(c, -W / 2, y, W / 2, y, WOOD_D, 5); }
    for (let i = 0; i < 3; i++) cask(c, r, -W / 3 + i * W / 3, 0, H * 0.78, W * 0.13, Math.PI / 2, true);
  } },
  { id: 'cask', name: t('Cask'), cat: 'kitchen', w: 1.4, h: 0.9, layer: 1, tags: 'barrel keg wine ale', draw: (c, r, w, h) => {
    for (const s of [-1, 1]) { rect(c, s * w * 0.28 - 5, -h * 0.4, 10, h * 0.8); fs(c, WOOD_D, 1.6); }
    cask(c, r, 0, 0, w * 0.8, h * 0.34);
  } },
  { id: 'tankards', name: t('Tankards'), cat: 'kitchen', w: 0.7, h: 0.7, layer: 1, tags: 'mugs beer ale drinks', draw: (c, r, w) => {
    for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + r(); mug(c, Math.cos(a) * w * 0.2, Math.sin(a) * w * 0.2, w * 0.15, r() * TAU); }
  } },
  { id: 'wine_rack', name: t('Wine rack'), cat: 'kitchen', w: 1.5, h: 0.5, layer: 1, tags: 'bottles cellar', draw: (c, r, w, h) => {
    const W = w * 0.94, H = h * 0.84;
    shadow(c, true, 6, 2, 4); rect(c, -W / 2, -H / 2, W, H); fs(c, DARK(WOOD_D)); shadow(c, false);
    const n = 9;
    for (let i = 0; i < n; i++) for (let j = 0; j < 2; j++) {
      const x = -W / 2 + (i + 0.5) * W / n, y = -H / 4 + j * H / 2;
      rect(c, x - W / n / 2 + 1, y - H / 4 + 1, W / n - 2, H / 2 - 2); c.fillStyle = '#140a05'; c.fill();
      if (r() < 0.85) bottle(c, x, y, Math.min(W / n, H / 2) * 0.38, pick(r, ['#3a5a2a', '#4a1a2a', '#2a3a4a', '#5a4a1a']), true);
    }
  } },
  { id: 'kitchen_table', name: t('Kitchen table'), cat: 'kitchen', w: 2, h: 1, layer: 1, tags: 'cook prep food chopping', draw: (c, r, w, h) => {
    const W = w * 0.92, H = h * 0.8;
    shadow(c, true); plankBox(c, r, -W / 2, -H / 2, W, H, 3, PINE()); shadow(c, false);
    rrect(c, -W * 0.38, -H * 0.3, W * 0.3, H * 0.5, 4); fs(c, lin(c, -W * 0.4, 0, -W * 0.1, 0, [[0, OAK_L], [1, OAK]]), 1.4);
    for (let i = 0; i < 4; i++) { circ(c, -W * 0.3 + i * 7, -H * 0.05 + (i % 2) * 6, 4); fs(c, pick(r, ['#e8722a', '#e8722a', '#f0e8d0']), 0.8); }
    at(c, -W * 0.15, H * 0.12, 0.3, () => { rect(c, -12, -2.5, 16, 5); fs(c, METAL_L, 1); rect(c, 4, -2, 9, 4); fs(c, WOOD_D, 1); });
    for (let i = 0; i < 3; i++) apple(c, W * 0.05 + i * 9, -H * 0.26, 4.5, pick(r, ['#5a9a2a', '#7aa832', '#c0392b']));
    loaf(c, W * 0.25, H * 0.12, 26, 0.2); loaf(c, W * 0.36, -H * 0.12, 22, -0.4);
    circ(c, W * 0.06, H * 0.18, 10); fs(c, radial(c, W * 0.06, H * 0.18, 10, '#f8f4ea', '#c8c0b0'), 1.2); blob(c, r, 6, 8, 0.25, W * 0.06, H * 0.18); c.fillStyle = '#f2ecdc'; c.fill();
    for (let i = 0; i < 20; i++) { circ(c, rrange(r, -W * 0.02, W * 0.14), rrange(r, H * 0.04, H * 0.34), 0.9); c.fillStyle = 'rgba(255,255,255,0.7)'; c.fill(); }
  } },
  { id: 'bread_basket', name: t('Bread basket'), cat: 'kitchen', w: 0.7, h: 0.7, layer: 1, tags: 'bread food baker', draw: (c, r, w) => {
    const R = w * 0.34;
    basket(c, R);
    clip(c, () => circ(c, 0, 0, R * 0.8), () => { loaf(c, -R * 0.2, -R * 0.15, R * 1.1, 0.6); loaf(c, R * 0.25, R * 0.1, R, -0.3); loaf(c, -R * 0.1, R * 0.4, R * 0.9, 0.1); });
    void r;
  } },
  { id: 'cheese', name: t('Cheese wheels'), cat: 'kitchen', w: 1, h: 1, layer: 1, tags: 'food cheese', draw: (c, r, w) => {
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * w * 0.24 + rrange(r, -4, 4), y = (i % 2 ? -1 : 1) * w * 0.1, R = w * rrange(r, 0.17, 0.21);
      shadow(c, true, 5, 2, 3); circ(c, x, y, R); fs(c, ball(c, x, y, R, '#e8b838', 0.3), 1.6); shadow(c, false);
      circ(c, x, y, R * 0.82); st(c, 'rgba(160,100,20,0.4)', 1.2);
      if (i === 1) { poly(c, [x, y, x + R, y - R * 0.3, x + R * 0.8, y + R * 0.6]); fs(c, '#fbe39a', 1); for (let k = 0; k < 3; k++) { circ(c, x + R * rrange(r, 0.4, 0.8), y + R * rrange(r, -0.1, 0.3), 1.6); c.fillStyle = '#d0a030'; c.fill(); } }
    }
  } },
  { id: 'crate_apples', name: t('Crate of apples'), cat: 'kitchen', w: 0.8, h: 0.8, layer: 1, tags: 'fruit produce market food', draw: (c, r, w) => crateOf(c, r, w, (S) => { for (let i = 0; i < 28; i++) apple(c, rrange(r, -S / 2, S / 2), rrange(r, -S / 2, S / 2), 6, pick(r, ['#c0392b', '#a8281e', '#d84a2a', '#8ab832'])); }) },
  { id: 'crate_veg', name: t('Crate of vegetables'), cat: 'kitchen', w: 0.8, h: 0.8, layer: 1, tags: 'cabbage carrot produce market food', draw: (c, r, w) => crateOf(c, r, w, (S) => {
    for (let i = 0; i < 9; i++) { at(c, rrange(r, -S / 2, S / 2), rrange(r, -S / 2, S / 2), r() * TAU, () => { poly(c, [-10, -3, 10, 0, -10, 3]); fs(c, '#e8762a', 1); line(c, -10, 0, -16, rrange(r, -4, 4), '#5a9a2a', 2); }); }
    for (let i = 0; i < 4; i++) { const x = rrange(r, -S / 3, S / 3), y = rrange(r, -S / 3, S / 3); circ(c, x, y, 11); fs(c, ball(c, x, y, 11, '#8ac04a', 0.3), 1.2); for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(x, y, 11 - k * 2.5, k, k + 2.4); st(c, 'rgba(40,80,20,0.6)', 1); } }
  }) },
  { id: 'basket_fish', name: t('Basket of fish'), cat: 'kitchen', w: 0.8, h: 0.8, layer: 1, tags: 'fish fisherman market food docks', draw: (c, r, w) => {
    const R = w * 0.38; basket(c, R);
    clip(c, () => circ(c, 0, 0, R * 0.8), () => { for (let i = 0; i < 8; i++) fish(c, rrange(r, -R * 0.5, R * 0.5), rrange(r, -R * 0.5, R * 0.5), R * 0.9, r() * TAU); });
  } },
  { id: 'cooking_pots', name: t('Pots and pans'), cat: 'kitchen', w: 1, h: 1, layer: 1, tags: 'cookware kitchen pan', draw: (c, r, w) => {
    const pan = (x: number, y: number, R: number, rot: number) => at(c, x, y, rot, () => { rod(c, R, 0, R * 2.1, 0, '#2a2a2e', 4); shadow(c, true, 4, 2, 3); circ(c, 0, 0, R); fs(c, '#3a3a3e', 1.8); shadow(c, false); circ(c, 0, 0, R * 0.8); fs(c, radial(c, 0, 0, R * 0.8, '#5a5a60', '#1e1e22', 0.4), 0.8); });
    const pot = (x: number, y: number, R: number) => { shadow(c, true, 5, 2, 3); circ(c, x, y, R); fs(c, ball(c, x, y, R, COPPER(), 0.35), 1.8); shadow(c, false); circ(c, x, y, R * 0.78); fs(c, radial(c, x, y, R * 0.78, '#6a3a1a', '#2a160a'), 0.8); for (const s of [-1, 1]) { ell(c, x + s * R * 1.05, y, 3, 5); st(c, INK, 2.5); } };
    pot(-w * 0.15, -w * 0.12, w * 0.2); pan(w * 0.1, w * 0.18, w * 0.14, rrange(r, -0.5, 0.5)); pot(w * 0.22, -w * 0.15, w * 0.12);
  } },
  { id: 'washtub', name: t('Washtub with dishes'), cat: 'kitchen', w: 0.9, h: 0.9, layer: 1, tags: 'sink dishes water wash', draw: (c, r, w) => {
    tub(c, 0, 0, w * 0.4, (R) => {
      circ(c, 0, 0, R); c.fillStyle = radial(c, 0, 0, R, '#a8c8c8', '#5a8080', 0); c.fill();
      for (let i = 0; i < 4; i++) { const x = rrange(r, -R * 0.5, R * 0.5), y = rrange(r, -R * 0.5, R * 0.5); circ(c, x, y, R * 0.36); fs(c, 'rgba(240,240,230,0.85)', 1); }
      for (let i = 0; i < 14; i++) { circ(c, rrange(r, -R, R), rrange(r, -R, R), rrange(r, 1.5, 4)); c.fillStyle = 'rgba(255,255,255,0.8)'; c.fill(); }
    });
  } },
  { id: 'butter_churn', name: t('Butter churn'), cat: 'kitchen', w: 0.5, h: 0.5, layer: 1, tags: 'farm dairy', draw: (c, r, w) => {
    const R = w * 0.34;
    shadow(c, true, 5, 2, 3); circ(c, 0, 0, R); fs(c, WOOD_L); shadow(c, false);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; line(c, Math.cos(a) * R * 0.75, Math.sin(a) * R * 0.75, Math.cos(a) * R, Math.sin(a) * R, 'rgba(40,20,5,0.4)', 1); }
    circ(c, 0, 0, R * 0.85); st(c, METAL_D, 2.4); circ(c, 0, 0, R * 0.6); fs(c, WOOD, 1.2);
    circ(c, 0, 0, R * 0.18); fs(c, ball(c, 0, 0, R * 0.18, WOOD_L), 1.4);
    void r;
  } },
  { id: 'water_barrel', name: t('Water barrel'), cat: 'kitchen', w: 0.75, h: 0.75, layer: 1, tags: 'rain barrel open water', draw: (c, r, w) => {
    tub(c, 0, 0, w * 0.4, (R) => { circ(c, 0, 0, R); c.fillStyle = radial(c, 0, 0, R, '#5aa8c0', '#1e5a70', 0.2); c.fill(); c.beginPath(); c.ellipse(-R * 0.3, -R * 0.3, R * 0.3, R * 0.1, -0.7, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.4)'; c.fill(); if (r() < 0.6) { ell(c, R * 0.2, R * 0.15, 6, 3, 0.4); fs(c, '#c8a060', 1); } });
  } },
  { id: 'grain_sack', name: t('Open grain sack'), cat: 'kitchen', w: 1, h: 1, layer: 1, tags: 'flour wheat sack spill', draw: (c, r, w) => {
    for (let i = 0; i < 160; i++) { const a = r() * TAU, d = Math.sqrt(r()) * w * 0.42; ell(c, Math.cos(a) * d + w * 0.08, Math.sin(a) * d * 0.7 + w * 0.12, 1.6, 1, r() * 3); c.fillStyle = pick(r, ['#e0c070', '#c8a050', '#f0d890']); c.fill(); }
    shadow(c, true, 6, 3, 4); blob(c, r, w * 0.28, 10, 0.12, -w * 0.06, -w * 0.06); fs(c, ball(c, -w * 0.06, -w * 0.06, w * 0.3, '#c8b088', 0.3), 2); shadow(c, false);
    ell(c, -w * 0.02, -w * 0.02, w * 0.16, w * 0.12); fs(c, radial(c, 0, 0, w * 0.16, '#f4dc90', '#c8a050', 0.2), 1.4);
    for (let i = 0; i < 6; i++) line(c, -w * 0.3 + i * 6, -w * 0.28, -w * 0.24 + i * 6, -w * 0.1, 'rgba(90,70,40,0.4)', 1);
  } },
  { id: 'card_table', name: t('Card table'), cat: 'kitchen', w: 1.6, h: 1.6, layer: 1, tags: 'gambling cards dice coins tavern game', draw: (c, r, w) => {
    const R = w * 0.25;
    for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU; seat(c, Math.cos(a) * R * 1.5, Math.sin(a) * R * 1.5, 24, a + Math.PI / 2, WOOD_L); }
    shadow(c, true); circ(c, 0, 0, R); fs(c, WOOD_D); shadow(c, false);
    circ(c, 0, 0, R - 5); fs(c, radial(c, 0, 0, R, '#2f7a46', '#1a4a2a', 0), 1.2);
    for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + 0.3; for (let k = 0; k < 3; k++) at(c, Math.cos(a) * R * 0.55 + k * 2, Math.sin(a) * R * 0.55, a + k * 0.25, () => { rrect(c, -4, -6, 8, 12, 1.5); fs(c, k === 2 ? '#f8f4ea' : '#8a1f2a', 0.8); }); }
    for (let i = 0; i < 9; i++) coin(c, rrange(r, -R * 0.25, R * 0.25), rrange(r, -R * 0.25, R * 0.25), 3);
    for (let i = 0; i < 2; i++) { const x = rrange(r, -R * 0.3, R * 0.3), y = rrange(r, -R * 0.3, R * 0.3); at(c, x, y, r() * 3, () => { rrect(c, -3.5, -3.5, 7, 7, 1.5); fs(c, '#f4f0e6', 0.8); circ(c, 0, 0, 0.9); c.fillStyle = INK; c.fill(); }); }
  } },
  { id: 'sink', name: t('Stone sink'), cat: 'kitchen', w: 1.2, h: 0.6, layer: 1, tags: 'basin trough wash', draw: (c, r, w, h) => {
    const W = w * 0.9, H = h * 0.8;
    shadow(c, true, 6, 2, 4); rrect(c, -W / 2, -H / 2, W, H, 4); fs(c, lin(c, 0, -H / 2, 0, H / 2, [[0, STONE_L], [1, STONE_D]])); shadow(c, false);
    rrect(c, -W / 2 + 6, -H / 2 + 6, W - 12, H - 12, 6); fs(c, radial(c, 0, 0, W * 0.4, '#7aa8b0', '#2a4a50', 0), 1.4);
    rect(c, -3, -H / 2 - 3, 6, 9); fs(c, METAL, 1);
    for (let i = 0; i < 3; i++) { circ(c, rrange(r, -W * 0.3, W * 0.3), rrange(r, -H * 0.2, H * 0.2), 2); c.fillStyle = 'rgba(255,255,255,0.4)'; c.fill(); }
  } },
  { id: 'pantry_shelf', name: t('Pantry shelf'), cat: 'kitchen', w: 1.6, h: 0.5, layer: 1, tags: 'jars storage spices', draw: (c, r, w, h) => {
    const W = w * 0.94, H = h * 0.8;
    shadow(c, true, 6, 2, 4); plankBox(c, r, -W / 2, -H / 2, W, H, 1, WOOD_D); shadow(c, false);
    let x = -W / 2 + 9;
    while (x < W / 2 - 9) {
      const k = r();
      if (k < 0.45) { jar(c, x, 0, rrange(r, 5, 7), pick(r, ['#b06a3e', '#c8b898', '#8a6a4a', '#6a8a9a']), false); x += 15; }
      else if (k < 0.75) { bottle(c, x, 0, 4.5, pick(r, ['#3a5a2a', '#a07a30', '#7a3050'])); x += 11; }
      else { ell(c, x + 4, 0, 9, H * 0.35); fs(c, ball(c, x + 4, 0, 9, '#c8b088', 0.25), 1.2); x += 21; }
    }
  } },
  { id: 'chopping_block', name: t('Chopping block'), cat: 'kitchen', w: 0.7, h: 0.7, layer: 1, tags: 'butcher cleaver meat', draw: (c, r, w) => {
    const R = w * 0.34;
    shadow(c, true, 6, 3, 4); circ(c, 0, 0, R); fs(c, WOOD_D, 2.2); shadow(c, false);
    circ(c, 0, 0, R * 0.86); fs(c, '#c8945a', 0);
    for (let k = 1; k < 5; k++) { circ(c, rrange(r, -1, 1), rrange(r, -1, 1), R * 0.18 * k); st(c, 'rgba(110,60,20,0.45)', 1); }
    for (let i = 0; i < 7; i++) { const a = r() * Math.PI; line(c, Math.cos(a) * -R * 0.6, Math.sin(a) * -R * 0.6, Math.cos(a) * R * 0.6, Math.sin(a) * R * 0.6, 'rgba(80,40,15,0.35)', 0.8); }
    blob(c, r, R * 0.25, 7, 0.3, R * 0.25, R * 0.2); c.fillStyle = 'rgba(120,10,15,0.55)'; c.fill();
    at(c, -R * 0.1, -R * 0.05, rrange(r, -0.6, 0.6), () => { rrect(c, -R * 0.45, -R * 0.24, R * 0.62, R * 0.42, 2); fs(c, lin(c, 0, -R * 0.24, 0, R * 0.2, [[0, '#ffffff'], [1, METAL]]), 1.2); circ(c, -R * 0.3, -R * 0.12, 2); c.fillStyle = INK; c.fill(); rrect(c, R * 0.17, -R * 0.07, R * 0.55, R * 0.14, 2); fs(c, WOOD_D, 1); });
  } },
  { id: 'hanging_meat', name: t('Hanging meat'), cat: 'kitchen', w: 1, h: 1, layer: 2, tags: 'ham sausages smokehouse butcher ceiling', draw: (c, r, w) => {
    rod(c, -w * 0.45, 0, w * 0.45, 0, WOOD_D, 5);
    for (let i = 0; i < 4; i++) {
      const x = -w * 0.33 + i * w * 0.22;
      if (i % 2 === 0) { shadow(c, true, 6, 6, 9, 0.4); c.beginPath(); c.moveTo(x, -4); c.quadraticCurveTo(x + 14, 6, x + 4, w * 0.28); c.quadraticCurveTo(x - 12, 10, x, -4); fs(c, ball(c, x, 10, 16, '#a0402a', 0.35), 1.6); shadow(c, false); circ(c, x + 3, w * 0.24, 4); fs(c, '#efe6d0', 1); }
      else { for (let k = 0; k < 3; k++) { shadow(c, true, 4, 4, 6, 0.4); ell(c, x + k * 5 - 5, 10 + k * 4, 3.5, 12, rrange(r, -0.2, 0.2)); fs(c, ball(c, x, 10, 8, '#7a2a1a', 0.3), 1.2); shadow(c, false); } }
      circ(c, x, 0, 2.4); fs(c, METAL, 1);
    }
  } },
  { id: 'bottles', name: t('Bottles'), cat: 'kitchen', w: 0.6, h: 0.6, layer: 1, tags: 'wine drink booze', draw: (c, r, w) => {
    for (let i = 0; i < 5; i++) bottle(c, rrange(r, -w * 0.22, w * 0.22), rrange(r, -w * 0.22, w * 0.22), rrange(r, 4.5, 6.5), pick(r, ['#3a5a2a', '#4a1a2a', '#2a3a4a', '#6a5a1a', '#8a8a7a']), r() < 0.8);
  } },
  { id: 'bar_counter', name: t('Bar counter'), cat: 'kitchen', w: 3, h: 2, layer: 1, tags: 'tavern inn bar L shaped taps', draw: (c, r, w, h) => {
    const T = h * 0.32, W = w * 0.94, H = h * 0.92;
    const shape = () => poly(c, [-W / 2, -H / 2, W / 2, -H / 2, W / 2, H / 2, W / 2 - T, H / 2, W / 2 - T, -H / 2 + T, -W / 2, -H / 2 + T]);
    shadow(c, true); shape(); fs(c, DARKWOOD()); shadow(c, false);
    c.save(); shape(); c.clip();
    plankBox(c, r, -W / 2, -H / 2 + 4, W - 4, T - 8, 1, OAK, false, 2, 0); plankBox(c, r, W / 2 - T + 4, -H / 2, T - 8, H - 4, 1, OAK, true, 2, 0);
    c.restore();
    shape(); st(c, INK, 2.4);
    for (let i = 0; i < 4; i++) { const x = -W * 0.38 + i * W * 0.13; mug(c, x, -H / 2 + T / 2, 6, r() * TAU); }
    for (let i = 0; i < 3; i++) { const y = -H * 0.05 + i * H * 0.17; rect(c, W / 2 - T / 2 - 5, y - 2, 10, 4); fs(c, '#c9a24a', 1); circ(c, W / 2 - T / 2, y, 3); fs(c, '#8a6a2a', 1); }
    bottle(c, W / 2 - T / 2, -H / 2 + T / 2, 5, '#3a5a2a');
    for (let i = 0; i < 4; i++) seat(c, -W * 0.38 + i * W * 0.15, -H / 2 + T + 14, 18, Math.PI, WOOD_L);
  } },
];

function basket(c: C2D, R: number) {
  shadow(c, true, 5, 2, 3); circ(c, 0, 0, R); fs(c, '#b08a4a', 2); shadow(c, false);
  for (let i = 0; i < 28; i++) { const a = (i / 28) * TAU; line(c, Math.cos(a) * R * 0.8, Math.sin(a) * R * 0.8, Math.cos(a) * R, Math.sin(a) * R, 'rgba(70,45,15,0.6)', 1); }
  circ(c, 0, 0, R * 0.9); st(c, '#8a6a32', 2);
  circ(c, 0, 0, R * 0.8); c.fillStyle = '#5a4020'; c.fill();
}
const DARK = (x: string) => shade(x, -0.25);
const DARKWOOD = () => '#4a2e1a';
const PINE = () => '#c49a62';
const COPPER = () => '#b8733a';
