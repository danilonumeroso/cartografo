import { t } from '../i18n';
import {
  at, ball, blob, bone, boulder, C2D, chain, circ, clip, coin, ell, flame, fs, gem, glow, GOLD, grain, INK, IRON, lin, line, METAL, METAL_D,
  METAL_L, pick, plankBox, poly, radial, rect, rock, rod, rrange, rrect, shade, shadow, skull, StampDef, st, STONE, STONE_D, STONE_L, sword,
  TAU, tub, WOOD, WOOD_D, WOOD_L, DARKWOOD,
} from '../art';
import { mulberry32, type Rng } from '../util';

function shackle(c: C2D, x: number, y: number, R: number) { ell(c, x, y, R, R * 0.8); st(c, INK, 4); ell(c, x, y, R, R * 0.8); st(c, METAL, 2.2); }
/** Lying skeleton, head toward -y. */
export function skeleton(c: C2D, r: Rng, s: number, col = '#e2d9bf') {
  const j = () => rrange(r, -0.15, 0.15);
  skull(c, 0, -s * 0.38, s * 0.2, j(), col);
  line(c, 0, -s * 0.27, 0, s * 0.08, '#3a2f22', 4.5); line(c, 0, -s * 0.27, 0, s * 0.08, col, 2.8);
  for (let i = 0; i < 5; i++) { const y = -s * 0.24 + i * s * 0.055; c.beginPath(); c.moveTo(-s * 0.1, y + 3); c.quadraticCurveTo(0, y - 2, s * 0.1, y + 3); st(c, '#3a2f22', 3.4); st(c, col, 1.9); }
  ell(c, 0, s * 0.1, s * 0.1, s * 0.05); fs(c, col, 1.2);
  const limb = (x0: number, y0: number, a: number, L: number) => { const x1 = x0 + Math.cos(a) * L, y1 = y0 + Math.sin(a) * L; line(c, x0, y0, x1, y1, '#3a2f22', 4.2); line(c, x0, y0, x1, y1, col, 2.6); return [x1, y1]; };
  for (const sx of [-1, 1]) {
    const [ex, ey] = limb(sx * s * 0.12, -s * 0.24, Math.PI / 2 + sx * (-0.35 + j()), s * 0.18);
    const [hx, hy] = limb(ex, ey, Math.PI / 2 + sx * (-0.1 + j() * 2), s * 0.16);
    for (let k = 0; k < 3; k++) line(c, hx, hy, hx + rrange(r, -4, 4), hy + rrange(r, 2, 6), col, 1);
    const [kx, ky] = limb(sx * s * 0.07, s * 0.12, Math.PI / 2 + sx * (-0.12 + j()), s * 0.2);
    const [fx, fy] = limb(kx, ky, Math.PI / 2 + sx * (-0.05 + j()), s * 0.19);
    ell(c, fx, fy + 3, 2.5, 4); fs(c, col, 1);
  }
}

export const DUNGEON: StampDef[] = [
  { id: 'shackles', name: t('Wall shackles'), cat: 'dungeon', w: 1, h: 0.6, layer: 1, tags: 'chains manacles prisoner', draw: (c, r, w, h) => {
    for (const s of [-1, 1]) { rect(c, s * w * 0.28 - 5, -h * 0.4, 10, 8); fs(c, METAL_D, 1.4); chain(c, s * w * 0.28, -h * 0.32, s * w * rrange(r, 0.12, 0.3), h * 0.12, 3); shackle(c, s * w * rrange(r, 0.12, 0.3), h * 0.22, 6); }
  } },
  { id: 'chains', name: t('Chains'), cat: 'dungeon', w: 1, h: 1, layer: 0, tags: 'chain floor iron', draw: (c, r, w) => {
    for (let i = 0; i < 2; i++) { const a = r() * TAU, b = a + rrange(r, 2, 4); chain(c, Math.cos(a) * w * 0.4, Math.sin(a) * w * 0.4, Math.cos(b) * w * 0.35, Math.sin(b) * w * 0.35, 4); }
    circ(c, 0, 0, 7); st(c, INK, 4); circ(c, 0, 0, 7); st(c, METAL, 2.4);
  } },
  { id: 'iron_maiden', name: t('Iron maiden'), cat: 'dungeon', w: 1, h: 1.4, layer: 1, tags: 'torture spikes coffin', draw: (c, r, w, h) => {
    const W = w * 0.6, H = h * 0.84;
    const shape = (k: number) => { c.beginPath(); c.moveTo(0, -H / 2 * k); c.bezierCurveTo(W * 0.5 * k, -H / 2 * k, W * 0.5 * k, -H * 0.25 * k, W * 0.4 * k, -H * 0.2 * k); c.lineTo(W / 2 * k, H / 2 * k); c.lineTo(-W / 2 * k, H / 2 * k); c.lineTo(-W * 0.4 * k, -H * 0.2 * k); c.bezierCurveTo(-W * 0.5 * k, -H * 0.25 * k, -W * 0.5 * k, -H / 2 * k, 0, -H / 2 * k); c.closePath(); };
    at(c, W * 0.62, H * 0.02, 0.5, () => { shadow(c, true, 5, 2, 4); c.save(); c.scale(0.55, 1); shape(1); c.restore(); fs(c, IRON, 2); shadow(c, false); for (let i = 0; i < 6; i++) { circ(c, rrange(r, -6, 6), -H * 0.3 + i * H * 0.13, 2); c.fillStyle = METAL_L; c.fill(); } });
    shadow(c, true, 8, 3, 6); shape(1); fs(c, lin(c, -W / 2, 0, W / 2, 0, [[0, '#4a4e54'], [0.5, '#6a6e74'], [1, '#2a2e34']]), 2.4); shadow(c, false);
    shape(0.84); fs(c, '#140c0a', 1.2);
    for (let i = 0; i < 14; i++) { const x = rrange(r, -W * 0.3, W * 0.3), y = rrange(r, -H * 0.35, H * 0.4); poly(c, [x - 2, y + 2, x + 2, y + 2, x, y - 3]); fs(c, METAL_L, 0.6); }
    blob(c, r, 8, 6, 0.3, 0, H * 0.3); c.fillStyle = 'rgba(110,10,15,0.7)'; c.fill();
  } },
  { id: 'torture_rack', name: t('Torture rack'), cat: 'dungeon', w: 1.2, h: 2.2, layer: 1, tags: 'rack torture interrogation', draw: (c, r, w, h) => {
    const W = w * 0.62, H = h * 0.86;
    shadow(c, true, 8, 3, 6); plankBox(c, r, -W / 2, -H / 2 + 12, W, H - 24, 4, WOOD_D, true); shadow(c, false);
    for (const s of [-1, 1]) { rod(c, -W / 2 - 10, s * (H / 2 - 8), W / 2 + 10, s * (H / 2 - 8), WOOD, 8); for (let k = 0; k < 4; k++) { const a = (k / 4) * TAU; rod(c, W / 2 + 10, s * (H / 2 - 8), W / 2 + 10 + Math.cos(a) * 12, s * (H / 2 - 8) + Math.sin(a) * 12, WOOD_D, 3); } }
    for (const s of [-1, 1]) for (const sx of [-1, 1]) { line(c, sx * W * 0.2, s * (H / 2 - 8), sx * W * 0.18, s * H * 0.3, '#a88a58', 2); shackle(c, sx * W * 0.18, s * H * 0.3, 5); }
    for (let i = 0; i < 4; i++) { blob(c, r, rrange(r, 3, 7), 6, 0.3, rrange(r, -W * 0.3, W * 0.3), rrange(r, -H * 0.2, H * 0.2)); c.fillStyle = 'rgba(100,10,15,0.5)'; c.fill(); }
  } },
  { id: 'stocks', name: t('Stocks'), cat: 'dungeon', w: 1.4, h: 0.6, layer: 1, tags: 'pillory punishment village', draw: (c, r, w, h) => {
    const W = w * 0.86, H = h * 0.36;
    for (const s of [-1, 1]) { shadow(c, true, 5, 2, 4); circ(c, s * W * 0.46, 0, 7); fs(c, ball(c, 0, 0, 8, WOOD_D, 0.3), 1.6); shadow(c, false); }
    shadow(c, true, 6, 2, 5); plankBox(c, r, -W / 2, -H / 2, W, H, 2, WOOD); shadow(c, false);
    for (const x of [-W * 0.25, 0, W * 0.25]) { circ(c, x, 0, x === 0 ? 8 : 5); c.fillStyle = '#1a0e08'; c.fill(); st(c, INK, 1.2); }
    for (const s of [-1, 1]) { rect(c, s * W * 0.38 - 3, -H / 2 - 1, 6, H + 2); fs(c, METAL_D, 1); }
  } },
  { id: 'guillotine', name: t('Guillotine'), cat: 'dungeon', w: 1.2, h: 1.6, layer: 1, tags: 'execution blade scaffold', draw: (c, r, w, h) => {
    const W = w * 0.62, H = h * 0.86;
    shadow(c, true, 8, 3, 6); plankBox(c, r, -W * 0.24, -H * 0.1, W * 0.48, H * 0.6, 1, WOOD_D, true); shadow(c, false);
    for (const s of [-1, 1]) { shadow(c, true, 6, 4, 8); rect(c, s * W / 2 - 6, -H / 2, 12, 16); fs(c, WOOD, 1.8); shadow(c, false); }
    rod(c, -W / 2, -H / 2 + 8, W / 2, -H / 2 + 8, WOOD, 8);
    poly(c, [-W / 2 + 6, -H / 2 + 18, W / 2 - 6, -H / 2 + 12, W / 2 - 6, -H / 2 + 28, -W / 2 + 6, -H / 2 + 28]); fs(c, lin(c, 0, -H / 2 + 12, 0, -H / 2 + 28, [[0, '#ffffff'], [1, METAL]]), 1.4);
    rect(c, -W * 0.3, -H / 2 + 34, W * 0.6, 14); fs(c, WOOD, 1.6); circ(c, 0, -H / 2 + 41, 6); c.fillStyle = '#1a0e08'; c.fill();
    jar(c, 0, -H / 2 + 62, 12);
    blob(c, r, 8, 7, 0.3, rrange(r, -6, 6), -H / 2 + 54); c.fillStyle = 'rgba(110,10,15,0.65)'; c.fill();
    function jar(c2: C2D, x: number, y: number, R: number) { void c2; tub(c, x, y, R, '#4a2a1a', WOOD_L); }
  } },
  { id: 'bucket', name: t('Bucket'), cat: 'dungeon', w: 0.5, h: 0.5, layer: 1, tags: 'pail water slop', draw: (c, r, w) => {
    const col = pick(r, ['#3a6a7a', '#4a3a24', '#5a5a3a']);
    tub(c, 0, 0, w * 0.32, col, WOOD_L);
    c.beginPath(); c.arc(0, 0, w * 0.4, Math.PI * 1.1, Math.PI * 1.9); st(c, INK, 3); c.beginPath(); c.arc(0, 0, w * 0.4, Math.PI * 1.1, Math.PI * 1.9); st(c, METAL, 1.6);
  } },
  { id: 'spike_pit', name: t('Spike pit'), cat: 'dungeon', w: 2, h: 2, layer: 0, tags: 'trap pit spikes hole', draw: (c, r, w) => {
    const S = w * 0.8;
    rect(c, -S / 2, -S / 2, S, S); fs(c, lin(c, 0, -S / 2, 0, S / 2, [[0, '#0a0806'], [0.4, '#1e1812'], [1, '#2e261e']]), 2.6);
    clip(c, () => rect(c, -S / 2, -S / 2, S, S), () => {
      for (let i = 0; i < 4; i++) line(c, -S / 2, -S / 2 + i * 6, S / 2, -S / 2 + i * 6, 'rgba(0,0,0,0.4)', 3);
      for (let gy = 0; gy < 5; gy++) for (let gx = 0; gx < 5; gx++) {
        const x = -S / 2 + (gx + 0.5) * S / 5 + rrange(r, -4, 4), y = -S / 2 + (gy + 0.5) * S / 5 + rrange(r, -4, 4);
        shadow(c, true, 3, 2, 3, 0.6); circ(c, x, y, 5); fs(c, radial(c, x, y, 5, '#b8bcc2', '#3a3e44', 0.5), 1); shadow(c, false);
        circ(c, x - 1, y - 1, 1.2); c.fillStyle = '#fff'; c.fill();
      }
      skull(c, rrange(r, -S * 0.2, S * 0.2), rrange(r, -S * 0.1, S * 0.3), 14, r() * 3);
    });
    rect(c, -S / 2, -S / 2, S, S); st(c, '#5a4a3a', 3);
  } },
  { id: 'pressure_plate', name: t('Pressure plate'), cat: 'dungeon', w: 1, h: 1, layer: 0, tags: 'trap plate trigger', draw: (c, r, w) => {
    const S = w * 0.6;
    rect(c, -S / 2 - 2, -S / 2 - 2, S + 4, S + 4); c.fillStyle = 'rgba(0,0,0,0.45)'; c.fill();
    rect(c, -S / 2, -S / 2, S, S); fs(c, lin(c, -S / 2, -S / 2, S / 2, S / 2, [[0, '#a39d92'], [1, '#77726a']]), 1.2, 'rgba(20,15,10,0.8)');
    line(c, -S / 2 + 2, -S / 2 + 2, S / 2 - 2, -S / 2 + 2, 'rgba(255,255,255,0.2)', 1.5);
    for (let i = 0; i < 3; i++) { const a = r() * TAU; line(c, Math.cos(a) * S * 0.2, Math.sin(a) * S * 0.2, Math.cos(a) * S * 0.45, Math.sin(a) * S * 0.45, 'rgba(0,0,0,0.25)', 0.8); }
  } },
  { id: 'floor_grate', name: t('Floor grate'), cat: 'dungeon', w: 1, h: 1, layer: 0, tags: 'drain sewer grate bars', draw: (c, r, w) => {
    const S = w * 0.66;
    rect(c, -S / 2, -S / 2, S, S); fs(c, radial(c, 0, 0, S * 0.7, '#1a1612', '#050403', 0), 2);
    for (let i = 1; i < 6; i++) { const x = -S / 2 + (i * S) / 6; rod(c, x, -S / 2, x, S / 2, '#4a4e54', 3); }
    for (let i = 1; i < 3; i++) { const y = -S / 2 + (i * S) / 3; rod(c, -S / 2, y, S / 2, y, '#3a3e44', 3); }
    rect(c, -S / 2, -S / 2, S, S); st(c, '#2a2e34', 4); rect(c, -S / 2, -S / 2, S, S); st(c, INK, 1.4);
    void r;
  } },
  { id: 'pit', name: t('Pit'), cat: 'dungeon', w: 2, h: 2, layer: 0, tags: 'hole chasm drop dark', draw: (c, r, w) => {
    const R = w * 0.4, seed = Math.floor(r() * 1e9), shape = () => blob(c, mulberry32(seed), R, 14, 0.12);
    shape(); fs(c, radial(c, R * 0.15, R * 0.15, R * 1.1, '#000000', '#2a221c', -0.05), 2.6);
    clip(c, shape, () => { for (let k = 1; k < 4; k++) { blob(c, r, R * (1 - k * 0.2), 12, 0.1, R * 0.05 * k, R * 0.05 * k); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fill(); } });
    for (let i = 0; i < 10; i++) { const a = r() * TAU; rock(c, r, Math.cos(a) * R * 1.05, Math.sin(a) * R * 1.05, rrange(r, 3, 6), '#7a7268'); }
  } },
  { id: 'lever', name: t('Lever'), cat: 'dungeon', w: 0.6, h: 0.6, layer: 1, tags: 'switch mechanism trap', draw: (c, r, w) => {
    shadow(c, true, 4, 2, 3); rrect(c, -w * 0.25, -w * 0.12, w * 0.5, w * 0.24, 3); fs(c, METAL_D, 1.6); shadow(c, false);
    line(c, -w * 0.18, 0, w * 0.18, 0, '#111', 2.5);
    const a = r() < 0.5 ? -0.6 : 0.6;
    shadow(c, true, 3, 2, 3); rod(c, 0, 0, Math.sin(a) * w * 0.32, -Math.cos(a) * w * 0.32, WOOD, 3.4); shadow(c, false);
    circ(c, Math.sin(a) * w * 0.32, -Math.cos(a) * w * 0.32, 4.5); fs(c, ball(c, 0, 0, 5, '#c03030'), 1.2);
  } },
  { id: 'pillar_broken', name: t('Broken pillar'), cat: 'dungeon', w: 2.5, h: 1.2, layer: 1, tags: 'column ruins fallen collapsed', draw: (c, r, w, h) => {
    const R = h * 0.3;
    shadow(c, true, 10, 5, 7, 0.6); circ(c, -w * 0.32, 0, R); fs(c, radial(c, -w * 0.32, 0, R, STONE_L, STONE_D, 0.35)); shadow(c, false);
    clip(c, () => circ(c, -w * 0.32, 0, R), () => { poly(c, [-w * 0.32 - R, -R * 0.2, -w * 0.32 + R * 0.2, -R, -w * 0.32 + R, 0, -w * 0.32 + R * 0.4, R]); c.fillStyle = 'rgba(0,0,0,0.15)'; c.fill(); });
    at(c, w * 0.08, h * 0.04, rrange(r, -0.12, 0.12), () => {
      for (let k = 0; k < 2; k++) {
        const x0 = -w * 0.12 + k * w * 0.24, L = w * 0.22;
        shadow(c, true, 8, 4, 6); rrect(c, x0, -R * 0.85, L, R * 1.7, 4); fs(c, lin(c, 0, -R, 0, R, [[0, STONE_L], [0.5, STONE], [1, STONE_D]]), 2); shadow(c, false);
        for (let i = 1; i < 5; i++) line(c, x0 + 3, -R * 0.85 + i * R * 0.34, x0 + L - 3, -R * 0.85 + i * R * 0.34, 'rgba(0,0,0,0.2)', 1.4);
        ell(c, x0 + L, 0, R * 0.2, R * 0.85); fs(c, STONE_L, 1.4);
      }
    });
    for (let i = 0; i < 9; i++) rock(c, r, rrange(r, -w * 0.15, w * 0.1), rrange(r, -h * 0.35, h * 0.35), rrange(r, 4, 9), STONE);
  } },
  { id: 'spiral_stairs', name: t('Spiral stairs'), cat: 'dungeon', w: 2, h: 2, layer: 1, tags: 'stairs tower spiral steps', draw: (c, r, w) => {
    const R = w * 0.44, n = 12;
    shadow(c, true, 8, 3, 5); circ(c, 0, 0, R); fs(c, STONE_D, 2.4); shadow(c, false);
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * TAU - Math.PI / 2, a1 = ((i + 1) / n) * TAU - Math.PI / 2, k = i / n;
      c.beginPath(); c.arc(0, 0, R - 2, a0, a1); c.arc(0, 0, R * 0.18, a1, a0, true); c.closePath();
      c.fillStyle = shade(STONE, 0.15 - k * 0.8); c.fill(); st(c, 'rgba(0,0,0,0.6)', 1.4);
      c.beginPath(); c.moveTo(Math.cos(a0) * R * 0.18, Math.sin(a0) * R * 0.18); c.lineTo(Math.cos(a0) * (R - 2), Math.sin(a0) * (R - 2)); st(c, `rgba(255,255,255,${0.25 * (1 - k)})`, 1.4);
    }
    circ(c, 0, 0, R * 0.18); fs(c, radial(c, 0, 0, R * 0.18, STONE_L, STONE_D), 2);
    circ(c, 0, 0, R); st(c, INK, 2.6);
    void r;
  } },
  { id: 'skeleton', name: t('Skeleton'), cat: 'dungeon', w: 1, h: 1.8, layer: 0, tags: 'skeleton remains dead body corpse adventurer', draw: (c, r, w, h) => {
    at(c, 0, 0, rrange(r, -0.3, 0.3), () => skeleton(c, r, h * 0.85));
    if (r() < 0.6) sword(c, w * 0.22, h * 0.1, h * 0.4, rrange(r, 1.2, 2), '#8a7a5a', '#8a8e94');
  } },
  { id: 'mimic', name: t('Mimic chest'), cat: 'dungeon', w: 1, h: 0.8, layer: 1, tags: 'mimic chest monster trap teeth', draw: (c, r, w, h) => {
    const W = w * 0.76, H = h * 0.6;
    shadow(c, true, 6, 3, 4); rrect(c, -W / 2, -H / 2 - H * 0.3, W, H * 0.5, 4); fs(c, WOOD); shadow(c, false);
    rect(c, -W / 2 + 3, -H / 2 - H * 0.08, W - 6, H * 0.28); c.fillStyle = '#5a0a14'; c.fill();
    shadow(c, true, 6, 3, 4); rrect(c, -W / 2, -H / 2 + H * 0.15, W, H * 0.9, 4); fs(c, WOOD); shadow(c, false);
    for (const k of [-0.3, 0.3]) { c.fillStyle = METAL_D; c.fillRect(k * W - 3, -H / 2 + H * 0.15, 6, H * 0.9); c.fillRect(k * W - 3, -H / 2 - H * 0.3, 6, H * 0.5); }
    rect(c, -W / 2 + 4, -H / 2 + H * 0.05, W - 8, H * 0.18); c.fillStyle = '#3a0408'; c.fill();
    for (let i = 0; i < 9; i++) { const x = -W / 2 + 7 + i * (W - 14) / 8; poly(c, [x - 3, -H / 2 + H * 0.15, x + 3, -H / 2 + H * 0.15, x, -H / 2 + H * 0.02]); fs(c, '#f4eed8', 0.7); poly(c, [x - 3, -H / 2 - H * 0.06, x + 3, -H / 2 - H * 0.06, x, -H / 2 + H * 0.08]); fs(c, '#f4eed8', 0.7); }
    c.beginPath(); c.moveTo(W * 0.1, -H / 2 + H * 0.12); c.bezierCurveTo(W * 0.3, H * 0.2, W * 0.6, H * 0.1, W * 0.55, H * 0.55); st(c, INK, 8); st(c, '#c0405a', 6);
    rrect(c, -5, -H / 2 + H * 0.35, 10, 12, 2); fs(c, GOLD, 1.2);
  } },
  { id: 'slime_puddle', name: t('Slime puddle'), cat: 'dungeon', w: 1.5, h: 1.2, layer: 0, light: { radius: 2, color: '#9aff5a', intensity: 0.4 }, tags: 'ooze slime acid goo jelly', draw: (c, r, w, h) => {
    glow(c, 0, 0, w * 0.5, '150,255,90', 0.25);
    c.save(); c.scale(1, h / w); blob(c, r, w * 0.38, 12, 0.25); c.restore(); fs(c, radial(c, 0, 0, w * 0.4, 'rgba(200,255,140,0.85)', 'rgba(70,160,40,0.85)', 0.3), 1.6, 'rgba(30,70,20,0.8)');
    for (let i = 0; i < 8; i++) { const x = rrange(r, -w * 0.25, w * 0.25), y = rrange(r, -h * 0.25, h * 0.25), R = rrange(r, 2, 6); circ(c, x, y, R); c.fillStyle = 'rgba(230,255,200,0.5)'; c.fill(); st(c, 'rgba(255,255,255,0.6)', 0.8); }
    skull(c, rrange(r, -w * 0.15, w * 0.15), rrange(r, -h * 0.1, h * 0.1), 12, r() * 3, 'rgba(232,224,200,0.7)');
  } },
  { id: 'giant_web', name: t('Giant web'), cat: 'dungeon', w: 3, h: 3, layer: 2, tags: 'spider web cobweb giant', draw: (c, r, w) => {
    const R = w * 0.47, rays = 12;
    const ang = Array.from({ length: rays }, (_, i) => (i / rays) * TAU + rrange(r, -0.12, 0.12));
    c.save(); c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 4; c.shadowOffsetY = 4;
    for (const a of ang) line(c, 0, 0, Math.cos(a) * R, Math.sin(a) * R, 'rgba(245,245,245,0.75)', 1.6);
    for (let k = 1; k <= 9; k++) {
      const d = (R * k) / 9.5;
      c.beginPath();
      for (let i = 0; i <= rays; i++) { const a = ang[i % rays], x = Math.cos(a) * d, y = Math.sin(a) * d; if (!i) c.moveTo(x, y); else { const pa = (ang[(i - 1) % rays] + (i === rays ? a + TAU : a)) / 2; c.quadraticCurveTo(Math.cos(pa) * d * 0.88, Math.sin(pa) * d * 0.88, x, y); } }
      c.strokeStyle = 'rgba(240,240,240,0.6)'; c.lineWidth = 1.1; c.stroke();
    }
    c.restore();
    for (let i = 0; i < 3; i++) { const a = r() * TAU, d = rrange(r, R * 0.3, R * 0.8); ell(c, Math.cos(a) * d, Math.sin(a) * d, 7, 11, a); fs(c, radial(c, 0, 0, 10, '#f4f0e8', '#c8c0b0'), 1); for (let k = 0; k < 4; k++) line(c, Math.cos(a) * d - 6, Math.sin(a) * d - 8 + k * 5, Math.cos(a) * d + 6, Math.sin(a) * d - 6 + k * 5, 'rgba(160,150,140,0.6)', 0.8); }
  } },
  { id: 'egg_sacs', name: t('Spider egg sacs'), cat: 'dungeon', w: 1.2, h: 1.2, layer: 1, tags: 'eggs spider nest cocoon', draw: (c, r, w) => {
    for (let i = 0; i < 9; i++) { const a = r() * TAU, d = Math.sqrt(r()) * w * 0.3, x = Math.cos(a) * d, y = Math.sin(a) * d, R = rrange(r, 8, 13);
      shadow(c, true, 4, 2, 3); circ(c, x, y, R); fs(c, radial(c, x, y, R, '#fbf7ee', '#bdb3a0', 0.35), 1.2); shadow(c, false);
      for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(x, y, R * rrange(r, 0.4, 0.9), r() * 6, r() * 6 + 2); st(c, 'rgba(150,140,120,0.5)', 0.8); } }
    for (let i = 0; i < 16; i++) { const a = r() * TAU; line(c, 0, 0, Math.cos(a) * w * 0.48, Math.sin(a) * w * 0.48, 'rgba(240,240,240,0.35)', 0.8); }
  } },
  { id: 'cocoon', name: t('Webbed cocoon'), cat: 'dungeon', w: 0.8, h: 1.6, layer: 1, tags: 'cocoon victim web spider wrapped', draw: (c, r, w, h) => {
    shadow(c, true, 6, 3, 5); ell(c, 0, 0, w * 0.3, h * 0.42); fs(c, radial(c, 0, 0, h * 0.4, '#f4f0e6', '#b0a890', 0.3), 1.6); shadow(c, false);
    clip(c, () => ell(c, 0, 0, w * 0.3, h * 0.42), () => { for (let i = 0; i < 22; i++) { const y = -h * 0.45 + i * h * 0.045; c.beginPath(); c.moveTo(-w * 0.35, y + rrange(r, -5, 5)); c.quadraticCurveTo(0, y + rrange(r, -8, 8), w * 0.35, y + rrange(r, -5, 5)); st(c, 'rgba(140,130,110,0.5)', 1); } });
    ell(c, 0, -h * 0.28, w * 0.13, h * 0.08); c.fillStyle = 'rgba(110,80,60,0.35)'; c.fill();
  } },
  { id: 'jail_bars', name: t('Prison bars'), cat: 'dungeon', w: 2, h: 0.3, layer: 1, tags: 'cell bars jail prison', draw: (c, r, w) => {
    const W = w * 0.98;
    shadow(c, true, 3, 2, 3); rod(c, -W / 2, 0, W / 2, 0, '#2a2c30', 4); shadow(c, false);
    for (let i = 0; i <= 10; i++) { const x = -W / 2 + (W * i) / 10; circ(c, x, 0, 4.5); fs(c, ball(c, x, 0, 4.5, '#5a5e64', 0.4), 1.2); }
    void r;
  } },
  { id: 'chained_skeleton', name: t('Chained skeleton'), cat: 'dungeon', w: 1.2, h: 1.4, layer: 1, tags: 'prisoner dead skeleton chains wall', draw: (c, r, w, h) => {
    for (const s of [-1, 1]) { rect(c, s * w * 0.32 - 4, -h * 0.46, 8, 8); fs(c, METAL_D, 1.2); }
    at(c, 0, h * 0.06, 0, () => skeleton(c, r, h * 0.8));
    for (const s of [-1, 1]) chain(c, s * w * 0.32, -h * 0.42, s * w * 0.16, -h * 0.08, 3);
  } },
  { id: 'weapon_barrel', name: t('Barrel of weapons'), cat: 'dungeon', w: 0.8, h: 0.8, layer: 1, tags: 'weapons spears swords armory', draw: (c, r, w) => {
    tub(c, 0, 0, w * 0.4, (R) => { circ(c, 0, 0, R); c.fillStyle = '#140c06'; c.fill(); for (let i = 0; i < 6; i++) { const a = r() * TAU; at(c, Math.cos(a) * R * 0.3, Math.sin(a) * R * 0.3, a, () => { rod(c, 0, 0, R * 0.9, 0, WOOD_L, 3); poly(c, [R * 0.9, -4, R * 1.4, 0, R * 0.9, 4]); fs(c, METAL_L, 1); }); } });
    for (let i = 0; i < 2; i++) sword(c, rrange(r, -6, 6), rrange(r, -6, 6), w * 0.7, r() * TAU);
  } },
  { id: 'rubble_big', name: t('Rubble heap'), cat: 'dungeon', w: 2.5, h: 2, layer: 1, tags: 'collapse rocks debris cave-in', draw: (c, r, w, h) => {
    for (let i = 0; i < 26; i++) { const k = 1 - i / 34; boulder(c, r, rrange(r, -w * 0.38, w * 0.38) * k, rrange(r, -h * 0.36, h * 0.36) * k, rrange(r, 8, 22) * (0.6 + (1 - k)), pick(r, ['#8a857c', '#7a756c', '#9a958c'])); }
    for (let i = 0; i < 3; i++) at(c, rrange(r, -w * 0.25, w * 0.25), rrange(r, -h * 0.2, h * 0.2), r() * TAU, () => { shadow(c, true, 5, 3, 4); rect(c, -30, -5, 60, 10); fs(c, WOOD_D, 1.6); shadow(c, false); });
  } },
  { id: 'dungeon_door_rubble', name: t('Collapsed passage'), cat: 'dungeon', w: 2, h: 1, layer: 1, tags: 'blocked passage collapse rocks', draw: (c, r, w, h) => {
    for (let i = 0; i < 18; i++) boulder(c, r, rrange(r, -w * 0.4, w * 0.4), rrange(r, -h * 0.3, h * 0.3), rrange(r, 9, 18), pick(r, ['#7d786f', '#8a857c', '#6a655c']));
    for (let i = 0; i < 20; i++) rock(c, r, rrange(r, -w * 0.45, w * 0.45), rrange(r, -h * 0.45, h * 0.45), rrange(r, 2, 5), STONE);
  } },
  { id: 'treasure_cache', name: t('Hidden cache'), cat: 'dungeon', w: 1, h: 1, layer: 0, tags: 'loose stone cache hidden secret coins', draw: (c, r, w) => {
    const S = w * 0.5;
    rect(c, -S / 2, -S / 2, S, S); fs(c, '#140c08', 1.6);
    for (let i = 0; i < 8; i++) coin(c, rrange(r, -S * 0.3, S * 0.3), rrange(r, -S * 0.3, S * 0.3), 4);
    gem(c, rrange(r, -S * 0.2, S * 0.2), rrange(r, -S * 0.2, S * 0.2), 5, pick(r, ['#d03050', '#3080e0', '#40c060']));
    at(c, S * 0.62, S * 0.1, 0.25, () => { shadow(c, true, 4, 2, 3); rect(c, -S / 2, -S / 2, S, S); fs(c, lin(c, -S / 2, -S / 2, S / 2, S / 2, [[0, '#a39d92'], [1, '#6a655c']]), 1.6); shadow(c, false); });
  } },
];

