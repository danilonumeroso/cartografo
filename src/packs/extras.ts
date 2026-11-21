import { t } from '../i18n';
import {
  at, ball, blob, bone, boulder, circ, clip, coals, coin, COPPER, ell, flame, fs, gem, glow, GOLD, GOLD_D, GOLD_L, INK, lin, line, METAL,
  METAL_D, METAL_L, pick, plankBox, poly, radial, rect, rod, rrange, rrect, shade, shadow, skull, sparkle, StampDef, st, STONE, STONE_D,
  STONE_L, TAU, WOOD, WOOD_D, WOOD_L, PAPER, DARKWOOD,
} from '../art';
import { rune } from './arcane';

/** Extra props that round out the thinner sets. */
export const EXTRAS: StampDef[] = [
  { id: 'powder_keg', name: t('Powder keg'), cat: 'dungeon', w: 0.8, h: 0.8, layer: 1, tags: 'gunpowder explosive barrel bomb fuse trap', draw: (c, r, w) => {
    const R = w * 0.36;
    shadow(c, true, 6, 3, 4); circ(c, 0, 0, R); fs(c, lin(c, -R, -R, R, R, [[0, '#7a5232'], [1, '#3a2412']]), 2.2); shadow(c, false);
    for (const k of [0.9, 0.62]) { circ(c, 0, 0, R * k); st(c, METAL_D, 2.6); }
    circ(c, 0, 0, R * 0.55); fs(c, '#5a3a20', 1);
    poly(c, [-R * 0.28, -R * 0.1, -R * 0.08, -R * 0.3, R * 0.28, R * 0.06, R * 0.06, R * 0.28]); c.fillStyle = '#c8302a'; c.fill();
    c.font = `bold ${R * 0.42}px Cinzel, serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#f0e0c0'; c.fillText('XXX', 0, R * 0.02);
    c.beginPath(); c.moveTo(R * 0.2, -R * 0.2); c.bezierCurveTo(R * 0.6, -R * 0.6, R * 1.1, -R * 0.2, R * 1.2, -R * 0.8); st(c, '#3a2a1a', 1.8);
    if (r() < 0.5) flame(c, R * 1.2, -R * 0.8, 3);
  } },
  { id: 'sewer_outlet', name: t('Sewer outlet'), cat: 'dungeon', w: 1.4, h: 1.4, layer: 0, tags: 'sewer pipe drain sludge outlet wall', draw: (c, r, w) => {
    const R = w * 0.18;
    blob(c, r, w * 0.36, 11, 0.25, 0, w * 0.12); fs(c, 'rgba(70,90,40,0.55)', 0);
    for (let i = 0; i < 6; i++) { circ(c, rrange(r, -w * 0.25, w * 0.25), rrange(r, 0, w * 0.35), rrange(r, 2, 5)); c.fillStyle = 'rgba(160,190,90,0.5)'; c.fill(); }
    shadow(c, true, 6, 3, 4); rect(c, -R * 1.5, -w * 0.42, R * 3, w * 0.3); fs(c, lin(c, 0, -w * 0.42, 0, -w * 0.12, [[0, STONE_L], [1, STONE_D]]), 2); shadow(c, false);
    ell(c, 0, -w * 0.12, R * 1.2, R * 0.5); fs(c, '#0c0a08', 1.6);
    for (let i = 0; i < 4; i++) { const x = -R * 0.8 + i * R * 0.53; line(c, x, -w * 0.15, x, -w * 0.08, METAL_D, 2.4); }
    c.beginPath(); c.moveTo(-R * 0.4, -w * 0.1); c.quadraticCurveTo(0, w * 0.05, R * 0.2, w * 0.18); st(c, 'rgba(120,150,60,0.7)', 6);
  } },
  { id: 'bone_throne', name: t('Bone throne'), cat: 'temple', w: 1.6, h: 1.6, layer: 1, tags: 'throne bones skulls dark lord lich evil', draw: (c, r, w) => {
    const S = w * 0.62, col = '#e2d8be';
    shadow(c, true, 10, 4, 7); rrect(c, -S / 2, -S / 2, S, S, 6); fs(c, '#3a2e26', 2.2); shadow(c, false);
    for (let i = 0; i < 7; i++) { const x = -S * 0.45 + i * S * 0.15; rod(c, x, -S / 2 - 14 - (i % 2) * 8, x, -S / 2 + 6, col, 4); }
    for (let i = 0; i < 5; i++) skull(c, -S * 0.36 + i * S * 0.18, -S / 2 - 6, 15, rrange(r, -0.2, 0.2), col);
    for (const sd of [-1, 1]) { rrect(c, sd > 0 ? S / 2 - 14 : -S / 2 + 2, -S * 0.2, 12, S * 0.66, 5); fs(c, '#5a4a3a', 1.4); for (let k = 0; k < 4; k++) bone(c, sd * (S / 2 - 8), -S * 0.12 + k * S * 0.16, 12, Math.PI / 2, col); skull(c, sd * (S / 2 - 8), S * 0.42, 13, 0, col); }
    rrect(c, -S / 2 + 16, -S * 0.2, S - 32, S * 0.62, 6); fs(c, ball(c, 0, S * 0.1, S * 0.4, '#3a0a14', 0.3), 1.6);
    glow(c, 0, -S / 2 - 6, S * 0.4, '120,255,150', 0.25);
  } },
  { id: 'scrying_pool', name: t('Scrying pool'), cat: 'arcane', w: 1.6, h: 1.6, layer: 0, light: { radius: 3, color: '#9ad8ff', intensity: 0.55 }, tags: 'scrying pool basin vision water magic', draw: (c, r, w) => {
    const R = w * 0.38;
    shadow(c, true, 8, 3, 5); poly(c, Array.from({ length: 16 }, (_, i) => (i % 2 ? Math.sin : Math.cos)((Math.floor(i / 2) / 8) * TAU + Math.PI / 8) * R)); fs(c, lin(c, -R, -R, R, R, [[0, STONE_L], [1, STONE_D]]), 2.2); shadow(c, false);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + Math.PI / 8; rune(c, r, Math.cos(a) * R * 0.84, Math.sin(a) * R * 0.84, 6, 'rgba(150,220,255,0.9)', 1.2); }
    circ(c, 0, 0, R * 0.7); fs(c, radial(c, 0, 0, R * 0.7, '#e0f6ff', '#1a3a6a', -0.05), 2);
    glow(c, 0, 0, R * 0.8, '150,210,255', 0.45);
    clip(c, () => circ(c, 0, 0, R * 0.7), () => { for (let k = 0; k < 10; k++) { const a0 = k * 0.7; c.beginPath(); c.arc(0, 0, R * (0.1 + k * 0.06), a0, a0 + 2); st(c, 'rgba(255,255,255,0.45)', 1.2); } for (let i = 0; i < 6; i++) sparkle(c, rrange(r, -R * 0.5, R * 0.5), rrange(r, -R * 0.5, R * 0.5), rrange(r, 2, 4)); });
  } },
  { id: 'copper_still', name: t('Copper still'), cat: 'workshop', w: 1.4, h: 1, layer: 1, light: { radius: 2, color: '#ff9a4a', intensity: 0.4 }, tags: 'still distillery alchemy brewing moonshine copper', draw: (c, r, w, h) => {
    const R = h * 0.3;
    coals(c, r, -w * 0.18, 0, R * 1.1, 10);
    shadow(c, true, 6, 3, 5); circ(c, -w * 0.18, 0, R); fs(c, ball(c, -w * 0.18, 0, R, COPPER, 0.4), 2); shadow(c, false);
    circ(c, -w * 0.18, 0, R * 0.35); fs(c, ball(c, -w * 0.18, 0, R * 0.35, '#e0a070', 0.3), 1.2);
    c.beginPath(); c.moveTo(-w * 0.18 + R * 0.3, -R * 0.2); c.quadraticCurveTo(w * 0.05, -R * 1.4, w * 0.2, -R * 0.2); st(c, INK, 6); st(c, COPPER, 3.6);
    for (let k = 0; k < 4; k++) { circ(c, w * 0.22, 0, R * (0.25 + k * 0.12)); st(c, INK, 4); circ(c, w * 0.22, 0, R * (0.25 + k * 0.12)); st(c, '#d08850', 2.2); }
    rect(c, w * 0.32, R * 0.4, 14, 14); fs(c, WOOD_L, 1.2); circ(c, w * 0.32 + 7, R * 0.4 + 7, 5); fs(c, '#d8c890', 0.8);
  } },
  { id: 'printing_press', name: t('Printing press'), cat: 'workshop', w: 1.6, h: 1.2, layer: 1, tags: 'printing press books paper printer', draw: (c, r, w, h) => {
    const W = w * 0.62, H = h * 0.76;
    shadow(c, true, 8, 3, 6); plankBox(c, r, -W / 2, -H / 2, W, H, 2, DARKWOOD, true); shadow(c, false);
    rect(c, -W * 0.36, -H * 0.3, W * 0.72, H * 0.42); fs(c, lin(c, 0, -H * 0.3, 0, H * 0.12, [[0, METAL_L], [1, METAL_D]]), 1.6);
    rod(c, 0, -H * 0.1, w * 0.42, -H * 0.36, WOOD, 4); circ(c, w * 0.42, -H * 0.36, 5); fs(c, WOOD_D, 1.2);
    circ(c, 0, -H * 0.1, 8); fs(c, ball(c, 0, 0, 8, METAL), 1.4);
    for (let i = 0; i < 3; i++) at(c, -W * 0.9 + i * 6, H * 0.2 - i * 3, rrange(r, -0.2, 0.2), () => { rect(c, -14, -18, 28, 36); fs(c, PAPER, 0.8); for (let k = 0; k < 6; k++) line(c, -10, -13 + k * 5, 10, -13 + k * 5, 'rgba(30,30,30,0.6)', 0.8); });
  } },
  { id: 'bread_oven', name: t('Bread oven'), cat: 'kitchen', w: 1.6, h: 1.6, layer: 1, light: { radius: 3, color: '#ff9a4a', intensity: 0.6 }, tags: 'oven bakery bread dome clay', draw: (c, r, w) => {
    const R = w * 0.38;
    shadow(c, true, 12, 5, 8); circ(c, 0, 0, R); fs(c, radial(c, 0, 0, R, '#d8a878', '#8a5a3a', 0.4), 2.4); shadow(c, false);
    for (let k = 1; k < 4; k++) { c.beginPath(); c.arc(-R * 0.05 * k, -R * 0.05 * k, R * (1 - k * 0.22), Math.PI * 0.9, Math.PI * 1.7); st(c, 'rgba(255,240,210,0.25)', 2); }
    for (let i = 0; i < 12; i++) { blob(c, r, rrange(r, 3, 7), 6, 0.3, rrange(r, -R * 0.7, R * 0.7), rrange(r, -R * 0.7, R * 0.7)); c.fillStyle = 'rgba(90,50,25,0.25)'; c.fill(); }
    rrect(c, -R * 0.4, R * 0.75, R * 0.8, R * 0.4, [10, 10, 2, 2]); fs(c, '#1a0c06', 1.8);
    clip(c, () => rrect(c, -R * 0.4, R * 0.75, R * 0.8, R * 0.4, [10, 10, 2, 2]), () => coals(c, r, 0, R * 0.98, R * 0.4, 8));
    glow(c, 0, R * 0.95, R * 0.5, '255,150,60', 0.4);
    at(c, R * 0.95, R * 0.5, 0.6, () => { rod(c, 0, 0, R * 0.9, 0, WOOD_L, 4); ell(c, R * 1.05, 0, 12, 9); fs(c, WOOD_L, 1.4); });
  } },
  { id: 'fruit_bowl', name: t('Fruit bowl'), cat: 'kitchen', w: 0.6, h: 0.6, layer: 1, tags: 'fruit bowl apples grapes pears food table', draw: (c, r, w) => {
    const R = w * 0.32;
    shadow(c, true, 4, 2, 3); circ(c, 0, 0, R); fs(c, radial(c, 0, 0, R, '#f0e8d8', '#b8a890'), 1.4); shadow(c, false);
    for (let i = 0; i < 6; i++) { const a = r() * TAU, d = rrange(r, 0, R * 0.55), x = Math.cos(a) * d, y = Math.sin(a) * d, k = r();
      if (k < 0.3) { for (let g = 0; g < 7; g++) { circ(c, x + rrange(r, -4, 4), y + rrange(r, -4, 4), 2.4); fs(c, ball(c, 0, 0, 3, '#6a2a6a', 0.4), 0.5); } }
      else { circ(c, x, y, rrange(r, 4, 6)); fs(c, ball(c, x, y, 5, pick(r, ['#c0392b', '#e6b422', '#8ab832', '#e8822a'])), 0.8); } }
  } },
  { id: 'silver_pile', name: t('Silver hoard'), cat: 'treasure', w: 1.2, h: 1.2, layer: 1, tags: 'silver coins platinum treasure loot', draw: (c, r, w) => {
    const R = w * 0.36;
    shadow(c, true, 8, 4, 6); blob(c, r, R, 13, 0.12); fs(c, radial(c, 0, 0, R, '#f4f6f8', '#7a8088', 0.35), 2, '#3a3e44'); shadow(c, false);
    for (let i = 0; i < 60; i++) { const a = r() * TAU, d = Math.sqrt(r()) * R * 0.9; coin(c, Math.cos(a) * d, Math.sin(a) * d, rrange(r, 3, 5), pick(r, ['#c8ccd0', '#dfe3e8', '#b0b6bc', GOLD])); }
    for (let i = 0; i < 3; i++) gem(c, rrange(r, -R * 0.5, R * 0.5), rrange(r, -R * 0.5, R * 0.5), 5, pick(r, ['#3060d0', '#30b0c0', '#f0f0ff']), 6);
    for (let i = 0; i < 5; i++) sparkle(c, rrange(r, -R * 0.6, R * 0.6), rrange(r, -R * 0.6, R * 0.6), rrange(r, 3, 5));
  } },
  { id: 'ring_cushion', name: t('Ring on a cushion'), cat: 'treasure', w: 0.6, h: 0.6, layer: 1, light: { radius: 1.2, color: '#ffd96a', intensity: 0.35 }, tags: 'ring magic artifact cushion relic precious', draw: (c, r, w) => {
    const S = w * 0.56;
    shadow(c, true, 4, 2, 3); rrect(c, -S / 2, -S / 2, S, S, 8); fs(c, ball(c, 0, 0, S * 0.6, pick(r, ['#7a1424', '#1f3a6a', '#3a1a5a']), 0.3), 1.6); shadow(c, false);
    for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { circ(c, x * S / 2, y * S / 2, 3); fs(c, GOLD, 0.8); }
    glow(c, 0, 0, S * 0.5, '255,220,110', 0.4);
    circ(c, 0, 0, S * 0.2); st(c, INK, 5); circ(c, 0, 0, S * 0.2); st(c, GOLD_L, 3);
    gem(c, 0, -S * 0.2, 4, pick(r, ['#d02040', '#2070e0', '#20b060']), 6);
  } },
  { id: 'tavern_sign', name: t('Tavern sign'), cat: 'town', w: 1.2, h: 0.6, layer: 2, tags: 'sign tavern inn shop hanging board', draw: (c, r, w, h) => {
    rod(c, -w * 0.48, 0, w * 0.1, 0, METAL_D, 4);
    for (const x of [-w * 0.1, w * 0.06]) line(c, x, 0, x, h * 0.12, METAL, 1.4);
    shadow(c, true, 6, 6, 10, 0.4); rrect(c, -w * 0.2, h * 0.08, w * 0.42, h * 0.36, 4); fs(c, lin(c, 0, h * 0.08, 0, h * 0.44, [[0, WOOD_L], [1, WOOD_D]]), 1.8); shadow(c, false);
    const k = Math.floor(r() * 3);
    at(c, w * 0.01, h * 0.26, 0, () => {
      if (k === 0) { rrect(c, -9, -9, 18, 18, 3); fs(c, '#e8c860', 1); rrect(c, 9, -5, 5, 10, 2); st(c, INK, 2); }
      else if (k === 1) { circ(c, 0, 0, 10); fs(c, ball(c, 0, 0, 10, WOOD, 0.3), 1.2); circ(c, 0, 0, 7); st(c, METAL_D, 1.6); }
      else { poly(c, [-10, 8, 0, -10, 10, 8]); fs(c, '#c84a2a', 1); }
    });
  } },
];
