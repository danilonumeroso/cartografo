import { t } from '../i18n';
import {
  at, ball, blob, boulder, C2D, chain, circ, clip, cloth, CLOTH, coals, ell, flame, fs, GOLD, GOLD_L, grain, INK, IRON, lin, line, METAL,
  METAL_D, METAL_L, pick, plankBox, poly, radial, rect, rock, rod, ropeCoil, rrange, rrect, shade, shadow, StampDef, st, STONE, sword, TAU,
  WOOD, WOOD_D, WOOD_L, PARCH, LINEN, tub,
} from '../art';
import type { Rng } from '../util';
import { hammer } from './workshop';

function axe(c: C2D, x: number, y: number, L: number, rot: number) {
  at(c, x, y, rot, () => {
    rod(c, -L / 2, 0, L / 2, 0, WOOD, L * 0.06);
    shadow(c, true, 3, 1.5, 2, 0.45);
    c.beginPath(); c.moveTo(L * 0.3, -L * 0.04); c.quadraticCurveTo(L * 0.38, -L * 0.28, L * 0.5, -L * 0.3); c.quadraticCurveTo(L * 0.44, -L * 0.1, L * 0.5, L * 0.08); c.quadraticCurveTo(L * 0.4, L * 0.04, L * 0.3, L * 0.04); c.closePath();
    fs(c, lin(c, L * 0.3, 0, L * 0.5, 0, [[0, METAL_D], [1, METAL_L]]), 1.2); shadow(c, false);
  });
}
function spear(c: C2D, x: number, y: number, L: number, rot: number) {
  at(c, x, y, rot, () => { rod(c, -L / 2, 0, L * 0.36, 0, WOOD_L, L * 0.035); poly(c, [L * 0.34, -L * 0.04, L / 2, 0, L * 0.34, L * 0.04]); fs(c, METAL_L, 1); });
}
function shield(c: C2D, r: Rng, x: number, y: number, R: number, round = true) {
  const col = pick(r, ['#8a1f2a', '#1f3f7a', '#3a6a2a', '#7a5a2a', '#5a2a6a']);
  shadow(c, true, 4, 2, 3, 0.45);
  if (round) { circ(c, x, y, R); fs(c, ball(c, x, y, R, col, 0.2), 1.8); shadow(c, false); circ(c, x, y, R * 0.86); st(c, METAL, 2); for (let i = 0; i < 4; i++) line(c, x, y - R * 0.86, x, y + R * 0.86, 'rgba(0,0,0,0)', 1); circ(c, x, y, R * 0.28); fs(c, ball(c, x, y, R * 0.28, '#b0b6bc'), 1.2); }
  else { c.beginPath(); c.moveTo(x - R * 0.8, y - R); c.lineTo(x + R * 0.8, y - R); c.lineTo(x + R * 0.8, y); c.quadraticCurveTo(x + R * 0.7, y + R * 0.8, x, y + R * 1.1); c.quadraticCurveTo(x - R * 0.7, y + R * 0.8, x - R * 0.8, y); c.closePath(); fs(c, lin(c, x - R, y, x + R, y, [[0, shade(col, 0.2)], [1, shade(col, -0.2)]]), 1.8); shadow(c, false); line(c, x, y - R, x, y + R, GOLD, 2.2); line(c, x - R * 0.8, y - R * 0.3, x + R * 0.8, y - R * 0.3, GOLD, 2.2); }
}
function tentCloth(c: C2D, r: Rng, R: number, n: number, col: string, col2?: string) {
  shadow(c, true, 16, 8, 12, 0.5); circ(c, 0, 0, R); c.fillStyle = col; c.fill(); shadow(c, false);
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * TAU, a1 = ((i + 1) / n) * TAU, mid = (a0 + a1) / 2;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a0) * R, Math.sin(a0) * R); c.quadraticCurveTo(Math.cos(mid) * R * 0.94, Math.sin(mid) * R * 0.94, Math.cos(a1) * R, Math.sin(a1) * R); c.closePath();
    const base = col2 && i % 2 ? col2 : col;
    c.fillStyle = shade(base, -Math.cos(mid - Math.PI * 1.25) * 0.22); c.fill(); st(c, 'rgba(0,0,0,0.35)', 1.2);
  }
  circ(c, 0, 0, R); st(c, INK, 2.4);
  void r;
}

export const CAMP: StampDef[] = [
  { id: 'yurt', name: t('Round tent'), cat: 'camp', w: 2.6, h: 2.6, layer: 2, tags: 'yurt tent round nomad camp', draw: (c, r, w) => {
    const R = w * 0.43; tentCloth(c, r, R, 12, pick(r, ['#c8b48a', '#a89068', '#d8c8a0']));
    for (let k = 1; k < 3; k++) { circ(c, 0, 0, R * k * 0.33); st(c, 'rgba(90,60,30,0.4)', 2); }
    circ(c, 0, 0, R * 0.14); fs(c, '#2a1a10', 1.8); for (let i = 0; i < 3; i++) { circ(c, 6 + i * 5, -6 - i * 7, 5 + i * 2); c.fillStyle = `rgba(220,220,225,${0.25 - i * 0.06})`; c.fill(); }
    poly(c, [-R * 0.2, R * 0.98, R * 0.2, R * 0.98, R * 0.14, R * 0.8, -R * 0.14, R * 0.8]); fs(c, '#7a2a2a', 1.4);
  } },
  { id: 'pavilion', name: t('Command pavilion'), cat: 'camp', w: 3, h: 3, layer: 2, tags: 'tent pavilion command war striped noble', draw: (c, r, w) => {
    const R = w * 0.44, [a, b] = pick(r, [['#9b2c2c', '#f0e6d0'], ['#2c4f9b', '#f0e6d0'], ['#3a6a3a', '#e8d890']]);
    tentCloth(c, r, R, 16, a, b);
    for (let i = 0; i < 16; i++) { const a0 = (i / 16) * TAU; c.beginPath(); c.arc(Math.cos(a0 + 0.2) * R, Math.sin(a0 + 0.2) * R, 6, 0, TAU); c.fillStyle = i % 2 ? a : b; c.fill(); }
    circ(c, 0, 0, 8); fs(c, ball(c, 0, 0, 8, GOLD), 1.4);
    shadow(c, true, 6, 8, 12, 0.4); c.beginPath(); c.moveTo(0, 0); c.lineTo(R * 0.4, -R * 0.12); c.lineTo(R * 0.3, 0); c.lineTo(R * 0.4, R * 0.12); c.closePath(); fs(c, a, 1.4); shadow(c, false);
  } },
  { id: 'bedroll', name: t('Bedroll'), cat: 'camp', w: 0.9, h: 1.9, layer: 0, tags: 'bedroll sleeping bag camp blanket', draw: (c, r, w, h) => {
    const W = w * 0.66, H = h * 0.78, col = pick(r, ['#6a4a3a', '#4a5a3a', '#3a4a6a', '#7a3a2a']);
    shadow(c, true, 4, 2, 3, 0.4); rrect(c, -W / 2, -H / 2, W, H, 10); fs(c, '#d8ccb0', 1.6); shadow(c, false);
    cloth(c, r, -W / 2, -H / 2 + H * 0.22, W, H * 0.78, col, 10);
    rrect(c, -W * 0.34, -H / 2 + 6, W * 0.68, H * 0.14, 8); fs(c, radial(c, 0, -H * 0.4, W * 0.4, '#f0e8d8', '#c8bca0'), 1.2);
    for (const y of [-H * 0.05, H * 0.25]) line(c, -W / 2, y, W / 2, y, '#5a3a22', 2.4);
  } },
  { id: 'cookfire', name: t('Cooking fire'), cat: 'camp', w: 1.3, h: 1.3, layer: 1, light: { radius: 6, color: '#ffa04a', intensity: 1 }, tags: 'campfire cooking pot tripod stew', draw: (c, r, w) => {
    const R = w * 0.32;
    for (let i = 0; i < 11; i++) { const a = (i / 11) * TAU; boulder(c, r, Math.cos(a) * R * 1.1, Math.sin(a) * R * 1.1, rrange(r, 6, 9), '#8a8378'); }
    coals(c, r, 0, 0, R * 0.9, 16); flame(c, -4, 3, 9); flame(c, 6, -2, 7);
    for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU - Math.PI / 2; rod(c, 0, 0, Math.cos(a) * R * 1.45, Math.sin(a) * R * 1.45, WOOD_D, 3.5); }
    chain(c, 0, -2, 0, 4, 2.4, METAL_D);
    shadow(c, true, 6, 3, 4); circ(c, 0, 4, R * 0.5); fs(c, ball(c, 0, 4, R * 0.5, '#2e2e34', 0.25), 2); shadow(c, false);
    circ(c, 0, 4, R * 0.38); fs(c, radial(c, 0, 4, R * 0.38, '#c8904a', '#7a4a22'), 0.8);
    for (let i = 0; i < 4; i++) { circ(c, rrange(r, -6, 6), 4 + rrange(r, -6, 6), 1.6); c.fillStyle = pick(r, ['#e8a040', '#6aa84f', '#f0e0c0']); c.fill(); }
  } },
  { id: 'weapon_rack', name: t('Weapon rack'), cat: 'camp', w: 1.8, h: 0.6, layer: 1, tags: 'weapons armory swords spears axes rack', draw: (c, r, w, h) => {
    const W = w * 0.92;
    for (const s of [-1, 1]) { shadow(c, true, 4, 2, 3); rect(c, s * W / 2 - 6, -h * 0.3, 12, h * 0.6); fs(c, WOOD_D, 1.6); shadow(c, false); }
    rod(c, -W / 2, -h * 0.12, W / 2, -h * 0.12, WOOD, 5); rod(c, -W / 2, h * 0.14, W / 2, h * 0.14, WOOD, 5);
    const n = 6;
    for (let i = 0; i < n; i++) { const x = -W * 0.38 + (i * W * 0.76) / (n - 1), k = r(); if (k < 0.4) spear(c, x, 0, h * 1.6, Math.PI / 2 + rrange(r, -0.1, 0.1)); else if (k < 0.7) sword(c, x, 0, h * 1.4, -Math.PI / 2 + rrange(r, -0.1, 0.1)); else axe(c, x, 0, h * 1.2, -Math.PI / 2); }
  } },
  { id: 'armor_stand', name: t('Armor stand'), cat: 'camp', w: 0.9, h: 0.9, layer: 1, tags: 'armor mannequin plate knight', draw: (c, r, w) => {
    const S = w * 0.8;
    shadow(c, true, 6, 3, 5); rod(c, -S * 0.4, 0, S * 0.4, 0, WOOD_D, 4); shadow(c, false);
    shadow(c, true, 6, 3, 5); ell(c, 0, 0, S * 0.36, S * 0.22); fs(c, lin(c, -S * 0.36, 0, S * 0.36, 0, [[0, METAL_D], [0.4, METAL_L], [1, METAL_D]]), 1.8); shadow(c, false);
    for (const s of [-1, 1]) { ell(c, s * S * 0.34, 0, S * 0.12, S * 0.14); fs(c, ball(c, s * S * 0.34, 0, S * 0.14, METAL, 0.35), 1.4); }
    line(c, 0, -S * 0.2, 0, S * 0.2, 'rgba(0,0,0,0.3)', 1.2);
    circ(c, 0, 0, S * 0.15); fs(c, ball(c, 0, 0, S * 0.15, METAL, 0.4), 1.6);
    line(c, -S * 0.08, -S * 0.02, S * 0.08, -S * 0.02, '#111', 1.8);
    if (r() < 0.6) { line(c, 0, -S * 0.15, 0, -S * 0.3, '#a02a2a', 3); }
  } },
  { id: 'archery_target', name: t('Archery target'), cat: 'camp', w: 1, h: 1, layer: 1, tags: 'target archery bullseye practice range', draw: (c, r, w) => {
    const R = w * 0.36;
    shadow(c, true, 6, 3, 5); circ(c, 0, 0, R); fs(c, '#d8b864', 2); shadow(c, false);
    for (let k = 0; k < 5; k++) { circ(c, 0, 0, R * (0.92 - k * 0.18)); c.fillStyle = ['#f4f0e6', '#2a2a2e', '#3a7ad8', '#d03030', '#f0c830'][k]; c.fill(); }
    for (let i = 0; i < 4; i++) { const a = r() * TAU, d = rrange(r, 0, R * 0.7), x = Math.cos(a) * d, y = Math.sin(a) * d; circ(c, x, y, 2); c.fillStyle = INK; c.fill(); line(c, x, y, x + 6, y + 5, '#6a4a2a', 1.6); poly(c, [x + 6, y + 5, x + 10, y + 5, x + 6, y + 9]); c.fillStyle = '#f0f0f0'; c.fill(); }
  } },
  { id: 'training_dummy', name: t('Training dummy'), cat: 'camp', w: 1, h: 1, layer: 1, tags: 'dummy practice combat training straw', draw: (c, r, w) => {
    rod(c, -w * 0.4, 0, w * 0.4, 0, WOOD, 6);
    shadow(c, true, 6, 3, 5); ell(c, 0, 0, w * 0.22, w * 0.16); fs(c, ball(c, 0, 0, w * 0.22, '#c8a868', 0.25), 1.8); shadow(c, false);
    for (let i = 0; i < 4; i++) line(c, -w * 0.18 + i * w * 0.12, -w * 0.12, -w * 0.16 + i * w * 0.12, w * 0.12, '#8a6a2a', 1.4);
    line(c, -w * 0.2, 0, w * 0.2, 0, '#5a3a1a', 2.4);
    circ(c, 0, 0, w * 0.1); fs(c, ball(c, 0, 0, w * 0.1, '#d8b878', 0.3), 1.6);
    for (const s of [-1, 1]) { line(c, s * w * 0.04, -w * 0.02, s * w * 0.02, w * 0.02, INK, 1.4); }
    for (let i = 0; i < 6; i++) line(c, rrange(r, -w * 0.42, -w * 0.36), rrange(r, -5, 5), rrange(r, -w * 0.48, -w * 0.44), rrange(r, -8, 8), '#d8b864', 1.2);
  } },
  { id: 'barricade', name: t('Spiked barricade'), cat: 'camp', w: 2.2, h: 1, layer: 1, tags: 'barricade spikes cheval de frise defense stakes', draw: (c, r, w, h) => {
    const W = w * 0.9;
    shadow(c, true, 6, 3, 5); rod(c, -W / 2, 0, W / 2, 0, WOOD_D, 9); shadow(c, false);
    for (let i = 0; i < 6; i++) { const x = -W * 0.42 + (i * W * 0.84) / 5; for (const s of [-1, 1]) { const x2 = x + s * 14, y2 = (i % 2 ? 1 : -1) * s * h * 0.42; shadow(c, true, 4, 2, 4); line(c, x, 0, x2, y2, INK, 7); shadow(c, false); line(c, x, 0, x2, y2, WOOD_L, 5); poly(c, [x2 - 3, y2, x2 + 3, y2, x2 + (x2 - x) * 0.15, y2 + y2 * 0.15]); fs(c, '#d8c8a0', 0.8); } }
  } },
  { id: 'palisade_stakes', name: t('Sharpened stakes'), cat: 'camp', w: 2, h: 0.5, layer: 1, tags: 'stakes palisade fence defense spikes', draw: (c, r, w) => {
    const W = w * 0.96;
    for (let i = 0; i < 11; i++) { const x = -W / 2 + (i * W) / 10 + rrange(r, -2, 2); shadow(c, true, 4, 2, 4); circ(c, x, 0, 8); fs(c, ball(c, x, 0, 8, '#7a5a3a', 0.3), 1.8); shadow(c, false); circ(c, x, 0, 3.5); fs(c, '#c8a878', 0.8); }
    rod(c, -W / 2, 6, W / 2, 6, '#a88a58', 1.4);
  } },
  { id: 'ballista', name: t('Ballista'), cat: 'camp', w: 1.6, h: 2, layer: 1, tags: 'siege weapon ballista crossbow bolt', draw: (c, r, w, h) => {
    const at0 = rrange(r, -0.15, 0.15);
    at(c, 0, 0, at0, () => {
      shadow(c, true, 8, 4, 6); plankBox(c, r, -w * 0.1, -h * 0.42, w * 0.2, h * 0.86, 1, WOOD, true); shadow(c, false);
      c.beginPath(); c.moveTo(-w * 0.45, -h * 0.1); c.quadraticCurveTo(0, -h * 0.4, w * 0.45, -h * 0.1); st(c, INK, 9); st(c, WOOD_D, 6.5);
      line(c, -w * 0.45, -h * 0.1, 0, h * 0.18, 'rgba(240,230,210,0.9)', 1.6); line(c, w * 0.45, -h * 0.1, 0, h * 0.18, 'rgba(240,230,210,0.9)', 1.6);
      spear(c, 0, -h * 0.05, h * 0.7, -Math.PI / 2);
      circ(c, 0, h * 0.34, 10); st(c, INK, 4); circ(c, 0, h * 0.34, 10); st(c, METAL_D, 2.4);
      for (const s of [-1, 1]) { rect(c, s * w * 0.18 - 5, -h * 0.25, 10, 22); fs(c, METAL_D, 1.2); }
    });
    for (const s of [-1, 1]) { rrect(c, s * w * 0.32 - 6, h * 0.1, 12, 30, 4); fs(c, WOOD_D, 1.6); }
  } },
  { id: 'catapult', name: t('Catapult'), cat: 'camp', w: 2, h: 2.6, layer: 1, tags: 'siege catapult mangonel war machine', draw: (c, r, w, h) => {
    const W = w * 0.56, H = h * 0.72;
    for (const sx of [-1, 1]) for (const sy of [-0.32, 0.32]) { rrect(c, sx * (W / 2 + 4) - 6, sy * H - 20, 12, 40, 4); fs(c, WOOD_D, 1.6); }
    for (const s of [-1, 1]) { shadow(c, true, 8, 4, 6); rod(c, s * W / 2, -H / 2, s * W / 2, H / 2, WOOD, 10); shadow(c, false); }
    for (const y of [-H / 2, -H * 0.05, H / 2]) rod(c, -W / 2, y, W / 2, y, WOOD, 8);
    for (const s of [-1, 1]) { shadow(c, true, 8, 6, 10); rod(c, s * W * 0.42, -H * 0.12, s * W * 0.42, H * 0.12, WOOD_D, 10); shadow(c, false); }
    rod(c, -W * 0.42, 0, W * 0.42, 0, WOOD_D, 6);
    shadow(c, true, 10, 8, 12); rod(c, 0, H * 0.08, 0, -H * 0.62, WOOD_L, 9); shadow(c, false);
    circ(c, 0, -H * 0.62, 16); fs(c, '#5a3a22', 2); circ(c, 0, -H * 0.62, 12); c.fillStyle = '#2a1a0e'; c.fill();
    boulder(c, r, 0, -H * 0.62, 10, '#8a8578');
    ropeCoil(c, W * 0.3, H * 0.32, 10);
  } },
  { id: 'cannon', name: t('Cannon'), cat: 'camp', w: 1.2, h: 2, layer: 1, tags: 'cannon gun artillery pirate ship', draw: (c, r, w, h) => {
    const W = w * 0.5, H = h * 0.5;
    for (const s of [-1, 1]) { ell(c, s * W * 0.62, H * 0.2, 7, H * 0.3); fs(c, WOOD_D, 1.8); for (let i = 0; i < 4; i++) line(c, s * W * 0.62 - 6, H * 0.2 - H * 0.25 + i * H * 0.16, s * W * 0.62 + 6, H * 0.2 - H * 0.25 + i * H * 0.16, '#2a1a0e', 1); }
    shadow(c, true, 6, 3, 5); rect(c, -W / 2, -H * 0.05, W, H * 0.6); fs(c, WOOD, 1.8); shadow(c, false);
    shadow(c, true, 8, 4, 6);
    c.beginPath(); c.moveTo(-W * 0.38, H * 0.45); c.lineTo(-W * 0.26, -H * 0.85); c.lineTo(W * 0.26, -H * 0.85); c.lineTo(W * 0.38, H * 0.45); c.quadraticCurveTo(0, H * 0.62, -W * 0.38, H * 0.45); c.closePath();
    fs(c, lin(c, -W * 0.4, 0, W * 0.4, 0, [[0, '#1e2024'], [0.35, '#6a6e74'], [1, '#141618']]), 2); shadow(c, false);
    for (const y of [-H * 0.7, -H * 0.2, H * 0.3]) line(c, -W * 0.36, y, W * 0.36, y, 'rgba(0,0,0,0.5)', 3);
    ell(c, 0, -H * 0.85, W * 0.26, 5); fs(c, '#0a0a0c', 1.4);
    circ(c, 0, H * 0.55, 6); fs(c, ball(c, 0, 0, 6, '#3a3e44'), 1.4);
    void r;
  } },
  { id: 'cannonballs', name: t('Cannonballs'), cat: 'camp', w: 0.7, h: 0.7, layer: 1, tags: 'cannonballs ammo shot pile', draw: (c, r, w) => {
    const R = w * 0.12;
    const pos: [number, number][] = [[-R, R * 0.6], [R, R * 0.6], [0, -R * 1.1], [-R * 2, -R * 0.4], [R * 2, -R * 0.4], [0, R * 2.2]];
    for (const [x, y] of pos) { shadow(c, true, 3, 2, 3, 0.45); circ(c, x, y, R); fs(c, ball(c, x, y, R, '#3a3e44', 0.45), 1.4); shadow(c, false); }
    shadow(c, true, 3, 2, 3, 0.45); circ(c, 0, 0, R); fs(c, ball(c, 0, 0, R, '#3a3e44', 0.45), 1.4); shadow(c, false);
    void r;
  } },
  { id: 'quiver', name: t('Arrow bundle'), cat: 'camp', w: 0.8, h: 0.8, layer: 1, tags: 'arrows quiver bundle ammunition archer', draw: (c, r, w) => {
    for (let i = 0; i < 9; i++) { const a = rrange(r, -0.35, 0.35) + Math.PI / 4, y0 = rrange(r, -6, 6); at(c, 0, y0, a, () => { line(c, -w * 0.4, 0, w * 0.32, 0, '#8a6a3a', 1.8); poly(c, [w * 0.32, -3, w * 0.42, 0, w * 0.32, 3]); fs(c, METAL, 0.8); poly(c, [-w * 0.4, 0, -w * 0.3, -4, -w * 0.26, 0, -w * 0.3, 4]); c.fillStyle = pick(r, ['#f0f0f0', '#c03030', '#3a3a3a']); c.fill(); }); }
    rod(c, -w * 0.06, -w * 0.06, w * 0.06, w * 0.06, '#5a3a22', 4);
  } },
  { id: 'shields', name: t('Shields'), cat: 'camp', w: 1.2, h: 1.2, layer: 1, tags: 'shields armor war loot', draw: (c, r, w) => { for (let i = 0; i < 3; i++) shield(c, r, rrange(r, -w * 0.15, w * 0.15), rrange(r, -w * 0.15, w * 0.15), rrange(r, 22, 28), r() < 0.5); } },
  { id: 'war_drum', name: t('War drum'), cat: 'camp', w: 0.9, h: 0.9, layer: 1, tags: 'drum music war orc', draw: (c, r, w) => {
    const R = w * 0.36;
    shadow(c, true, 6, 3, 5); circ(c, 0, 0, R); fs(c, '#7a2a1a', 2.2); shadow(c, false);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; line(c, Math.cos(a) * R * 0.85, Math.sin(a) * R * 0.85, Math.cos(a + 0.26) * R, Math.sin(a + 0.26) * R, '#e8d8b0', 1.2); }
    circ(c, 0, 0, R * 0.82); fs(c, radial(c, 0, 0, R * 0.82, '#f0e0c0', '#c8b088'), 1.4);
    for (const s of [-1, 1]) { at(c, s * R * 0.35, R * 0.2, s * 0.6, () => { rod(c, 0, 0, R * 0.7, 0, WOOD_L, 3); circ(c, 0, 0, 4); fs(c, '#e8d8b0', 1); }); }
    void r;
  } },
  { id: 'siege_ladder', name: t('Siege ladder'), cat: 'camp', w: 1, h: 3, layer: 1, tags: 'ladder siege assault wall', draw: (c, r, w, h) => {
    const W = w * 0.56, H = h * 0.94;
    shadow(c, true, 6, 3, 5); for (const s of [-1, 1]) rod(c, s * W / 2, -H / 2, s * W / 2, H / 2, WOOD_D, 8); shadow(c, false);
    for (let i = 0; i < 12; i++) { const y = -H / 2 + 10 + (i * (H - 20)) / 11; rod(c, -W / 2, y, W / 2, y, WOOD, 4.5); }
    for (const s of [-1, 1]) { poly(c, [s * W / 2 - 4, -H / 2, s * W / 2 + 4, -H / 2, s * W / 2, -H / 2 - 10]); fs(c, METAL, 1); }
    void r;
  } },
  { id: 'war_table', name: t('War table'), cat: 'camp', w: 2.2, h: 1.6, layer: 1, light: { radius: 2.5, color: '#ffd38a', intensity: 0.5 }, tags: 'map table strategy tactics general', draw: (c, r, w, h) => {
    const W = w * 0.86, H = h * 0.78;
    shadow(c, true); plankBox(c, r, -W / 2, -H / 2, W, H, 3, WOOD_D); shadow(c, false);
    at(c, 0, 0, rrange(r, -0.04, 0.04), () => {
      rect(c, -W * 0.42, -H * 0.4, W * 0.84, H * 0.8); fs(c, lin(c, -W * 0.4, -H * 0.4, W * 0.4, H * 0.4, [[0, '#f0e0b8'], [1, '#c8b080']]), 1.2);
      c.beginPath(); c.moveTo(-W * 0.42, H * 0.1); c.bezierCurveTo(-W * 0.1, H * 0.25, W * 0.05, -H * 0.1, W * 0.42, -H * 0.05); st(c, '#5a8ab0', 3);
      for (let i = 0; i < 5; i++) { const x = rrange(r, -W * 0.35, W * 0.35), y = rrange(r, -H * 0.3, H * 0.3); c.beginPath(); c.moveTo(x - 7, y + 4); c.lineTo(x, y - 6); c.lineTo(x + 7, y + 4); st(c, '#6a5a40', 1.4); }
      for (let i = 0; i < 6; i++) { const x = rrange(r, -W * 0.35, W * 0.35), y = rrange(r, -H * 0.3, H * 0.3); circ(c, x, y, 4); fs(c, ball(c, x, y, 4, i % 2 ? '#c03030' : '#3060c0'), 1); }
      c.beginPath(); c.moveTo(-W * 0.2, H * 0.2); c.quadraticCurveTo(0, -H * 0.05, W * 0.15, -H * 0.18); st(c, '#c03030', 2); poly(c, [W * 0.15, -H * 0.18, W * 0.1, -H * 0.2, W * 0.12, -H * 0.13]); c.fillStyle = '#c03030'; c.fill();
    });
    for (const [x, y] of [[-W * 0.46, -H * 0.42], [W * 0.46, H * 0.4]]) { circ(c, x, y, 5); fs(c, GOLD, 1); flame(c, x, y, 3.5); }
    sword(c, W * 0.3, H * 0.32, 50, 0.2);
  } },
  { id: 'watch_platform', name: t('Watchtower top'), cat: 'camp', w: 2.4, h: 2.4, layer: 2, tags: 'watchtower lookout tower platform guard', draw: (c, r, w) => {
    const S = w * 0.8;
    shadow(c, true, 20, 12, 16, 0.55); rect(c, -S / 2, -S / 2, S, S); c.fillStyle = WOOD_D; c.fill(); shadow(c, false);
    plankBox(c, r, -S / 2, -S / 2, S, S, 8, WOOD, false, 2);
    for (const s of [-1, 1]) { rod(c, -S / 2, s * S / 2, S / 2, s * S / 2, WOOD_D, 8); rod(c, s * S / 2, -S / 2, s * S / 2, S / 2, WOOD_D, 8); }
    for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { circ(c, x * S / 2, y * S / 2, 8); fs(c, ball(c, 0, 0, 8, WOOD_D), 1.6); }
    rect(c, S * 0.2, S * 0.2, S * 0.18, S * 0.18); fs(c, '#1a0e06', 1.4);
    for (let i = 0; i < 3; i++) line(c, S * 0.22, S * 0.24 + i * 7, S * 0.36, S * 0.24 + i * 7, WOOD_L, 2);
    ropeCoil(c, -S * 0.25, S * 0.25, 10);
  } },
  { id: 'caltrops', name: t('Caltrops'), cat: 'camp', w: 1, h: 1, layer: 0, tags: 'caltrops spikes trap ground', draw: (c, r, w) => {
    for (let i = 0; i < 14; i++) { const x = rrange(r, -w * 0.4, w * 0.4), y = rrange(r, -w * 0.4, w * 0.4), a = r() * TAU; for (let k = 0; k < 3; k++) { const b = a + (k / 3) * TAU; line(c, x, y, x + Math.cos(b) * 5, y + Math.sin(b) * 5, INK, 2.6); line(c, x, y, x + Math.cos(b) * 5, y + Math.sin(b) * 5, METAL_L, 1.3); } }
  } },
  { id: 'weapon_pile', name: t('Weapon pile'), cat: 'camp', w: 1.4, h: 1.2, layer: 1, tags: 'weapons loot pile armory battle', draw: (c, r, w, h) => {
    for (let i = 0; i < 7; i++) { const k = r(), x = rrange(r, -w * 0.2, w * 0.2), y = rrange(r, -h * 0.2, h * 0.2), a = r() * TAU; if (k < 0.35) sword(c, x, y, w * 0.55, a); else if (k < 0.6) axe(c, x, y, w * 0.45, a); else if (k < 0.8) spear(c, x, y, w * 0.8, a); else hammer(c, x, y, w * 0.4, a); }
    if (r() < 0.7) shield(c, r, rrange(r, -w * 0.2, w * 0.2), rrange(r, -h * 0.2, h * 0.2), 15, r() < 0.5);
  } },
  { id: 'lean_to', name: t('Lean-to shelter'), cat: 'camp', w: 2, h: 1.6, layer: 2, tags: 'shelter lean-to camp hut branches', draw: (c, r, w, h) => {
    const W = w * 0.86, H = h * 0.76;
    shadow(c, true, 14, 8, 12, 0.5); rect(c, -W / 2, -H / 2, W, H); c.fillStyle = '#4a3a22'; c.fill(); shadow(c, false);
    for (let i = 0; i < 14; i++) { const x = -W / 2 + (i * W) / 13; rod(c, x, -H / 2, x + rrange(r, -4, 4), H / 2, shade('#6a4a2a', rrange(r, -0.15, 0.15)), 6); }
    for (let i = 0; i < 70; i++) { const x = rrange(r, -W / 2, W / 2), y = rrange(r, -H / 2, H / 2); c.save(); c.translate(x, y); c.rotate(r() * 3); ell(c, 0, 0, 7, 3); c.fillStyle = pick(r, ['#3a6a2a', '#4a7a32', '#2a5020', '#6a7a32']); c.fill(); c.restore(); }
    rect(c, -W / 2, -H / 2, W, H); st(c, INK, 2); rod(c, -W / 2 - 4, -H / 2, W / 2 + 4, -H / 2, WOOD_D, 6);
  } },
  { id: 'pup_tent', name: t('Small tent'), cat: 'camp', w: 1.2, h: 2, layer: 2, tags: 'tent small camp adventurer', draw: (c, r, w, h) => {
    const W = w * 0.72, H = h * 0.8, col = pick(r, ['#8a7a5a', '#6a5a3a', '#5a6a4a', '#8a4a3a']);
    shadow(c, true, 12, 6, 9, 0.5); rect(c, -W / 2, -H / 2, W, H); c.fillStyle = col; c.fill(); shadow(c, false);
    rect(c, -W / 2, -H / 2, W / 2, H); fs(c, lin(c, -W / 2, 0, 0, 0, [[0, shade(col, 0.05)], [1, shade(col, 0.25)]]), 1.6);
    rect(c, 0, -H / 2, W / 2, H); fs(c, lin(c, 0, 0, W / 2, 0, [[0, shade(col, -0.15)], [1, shade(col, -0.3)]]), 1.6);
    line(c, 0, -H / 2 - 6, 0, H / 2 + 6, INK, 3); line(c, 0, -H / 2 - 6, 0, H / 2 + 6, WOOD_L, 1.4);
    poly(c, [-W * 0.18, H / 2, 0, H * 0.3, W * 0.18, H / 2]); c.fillStyle = 'rgba(0,0,0,0.5)'; c.fill();
    for (const s of [-1, 1]) for (const t2 of [-1, 1]) { line(c, s * W / 2, t2 * H * 0.4, s * (W / 2 + 12), t2 * H * 0.48, '#c8b080', 1); circ(c, s * (W / 2 + 12), t2 * H * 0.48, 1.8); c.fillStyle = WOOD_D; c.fill(); }
  } },
  { id: 'saddle', name: t('Saddle and tack'), cat: 'camp', w: 1, h: 0.8, layer: 1, tags: 'saddle horse tack stable riding', draw: (c, r, w, h) => {
    rect(c, -w * 0.34, -h * 0.34, w * 0.68, h * 0.68); fs(c, pick(r, ['#7a2a2a', '#2a4a6a', '#4a5a2a']), 1.4);
    shadow(c, true, 5, 2, 4); c.beginPath(); c.moveTo(-w * 0.2, -h * 0.3); c.quadraticCurveTo(0, -h * 0.4, w * 0.2, -h * 0.3); c.lineTo(w * 0.24, h * 0.3); c.quadraticCurveTo(0, h * 0.18, -w * 0.24, h * 0.3); c.closePath(); fs(c, lin(c, -w * 0.2, 0, w * 0.2, 0, [[0, '#8a5a2a'], [0.5, '#b07a3a'], [1, '#6a4020']]), 1.8); shadow(c, false);
    ell(c, 0, -h * 0.26, w * 0.06, h * 0.06); fs(c, '#6a4020', 1.2);
    for (const s of [-1, 1]) { line(c, s * w * 0.22, 0, s * w * 0.42, h * 0.1, '#5a3a1a', 2.4); rrect(c, s * w * 0.42 - 4, h * 0.08, 8, 6, 2); fs(c, METAL, 1); }
  } },
];
void blob; void boulder; void CLOTH; void grain; void IRON; void PARCH; void LINEN; void tub; void rock; void STONE; void GOLD_L;
