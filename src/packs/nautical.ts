import { t } from '../i18n';
import {
  at, ball, blob, boulder, C2D, chain, circ, clip, cloth, coin, ell, flame, fs, glow, GOLD, grain, INK, IRON, lin, line, METAL, METAL_D,
  METAL_L, pick, plankBox, poly, radial, rect, rock, rod, ropeCoil, rrange, rrect, shade, shadow, StampDef, st, STONE, TAU, tub, WOOD, WOOD_D,
  WOOD_L, LINEN, BRASS, starPath,
} from '../art';
import type { Rng } from '../util';

function hull(c: C2D, W: number, H: number) {
  c.beginPath(); c.moveTo(0, -H / 2); c.bezierCurveTo(W * 0.62, -H * 0.3, W / 2, H * 0.3, W * 0.36, H / 2); c.lineTo(-W * 0.36, H / 2); c.bezierCurveTo(-W / 2, H * 0.3, -W * 0.62, -H * 0.3, 0, -H / 2); c.closePath();
}
function oar(c: C2D, x: number, y: number, L: number, rot: number) {
  at(c, x, y, rot, () => { rod(c, -L / 2, 0, L * 0.2, 0, WOOD_L, 3); ell(c, L * 0.33, 0, L * 0.16, L * 0.05); fs(c, WOOD_L, 1.4); });
}
function shell(c: C2D, r: Rng, x: number, y: number, s: number) {
  at(c, x, y, r() * TAU, () => {
    c.beginPath(); c.moveTo(0, s * 0.5); for (let i = 0; i <= 8; i++) { const a = Math.PI + (i / 8) * Math.PI; c.lineTo(Math.cos(a) * s * 0.6, Math.sin(a) * s * 0.55 - s * 0.05); } c.closePath();
    fs(c, lin(c, 0, -s / 2, 0, s / 2, [[0, pick(r, ['#f8e8d8', '#f0d0c0', '#e8e0f0'])], [1, '#c8a890']]), 0.9);
    for (let i = 1; i < 8; i++) { const a = Math.PI + (i / 8) * Math.PI; line(c, 0, s * 0.45, Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.5 - s * 0.05, 'rgba(120,80,60,0.45)', 0.7); }
  });
}
function starfish(c: C2D, x: number, y: number, R: number, col: string, rot: number) {
  at(c, x, y, rot, () => {
    c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i / 10) * TAU, d = i % 2 ? R * 0.42 : R; i ? c.lineTo(Math.cos(a) * d, Math.sin(a) * d) : c.moveTo(Math.cos(a) * d, Math.sin(a) * d); } c.closePath();
    fs(c, ball(c, 0, 0, R, col, 0.3), 1.2);
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i / 5) * TAU; for (let k = 1; k < 4; k++) { circ(c, Math.cos(a) * R * k * 0.22, Math.sin(a) * R * k * 0.22, 0.9); c.fillStyle = 'rgba(255,255,255,0.6)'; c.fill(); } }
  });
}

export const NAUTICAL: StampDef[] = [
  { id: 'merchant_ship', name: t('Sailing ship'), cat: 'nautical', w: 5, h: 12, layer: 0, tags: 'ship galleon vessel deck naval boat', draw: (c, r, w, h) => {
    const W = w * 0.86, H = h * 0.96;
    const hullPath = (k: number) => { c.beginPath(); c.moveTo(0, -H / 2 * k); c.bezierCurveTo(W * 0.52 * k, -H * 0.36 * k, W / 2 * k, -H * 0.05, W * 0.46 * k, H * 0.36); c.quadraticCurveTo(W * 0.42 * k, H / 2 * k, 0, H / 2 * k); c.quadraticCurveTo(-W * 0.42 * k, H / 2 * k, -W * 0.46 * k, H * 0.36); c.bezierCurveTo(-W / 2 * k, -H * 0.05, -W * 0.52 * k, -H * 0.36 * k, 0, -H / 2 * k); c.closePath(); };
    shadow(c, true, 20, 8, 12, 0.5); hullPath(1); fs(c, lin(c, -W / 2, 0, W / 2, 0, [[0, '#4a2c18'], [0.5, '#6a4024'], [1, '#2e1a0c']]), 3); shadow(c, false);
    hullPath(0.9); c.fillStyle = '#c8a070'; c.fill();
    clip(c, () => hullPath(0.9), () => {
      for (let x = -W / 2; x < W / 2; x += 14) { rect(c, x, -H / 2, 14, H); c.fillStyle = shade('#c8a070', rrange(r, -0.12, 0.08)); c.fill(); line(c, x, -H / 2, x, H / 2, 'rgba(70,40,15,0.55)', 1.2); }
      for (let i = 0; i < 40; i++) { const x = -W / 2 + Math.floor(r() * (W / 14)) * 14, y = rrange(r, -H / 2, H / 2); line(c, x, y, x + 14, y, 'rgba(70,40,15,0.5)', 1); }
      // forecastle and quarterdeck
      rect(c, -W / 2, H * 0.28, W, H * 0.22); c.fillStyle = 'rgba(60,35,15,0.25)'; c.fill(); line(c, -W / 2, H * 0.28, W / 2, H * 0.28, '#3a2210', 4);
      rect(c, -W / 2, -H / 2, W, H * 0.12); c.fillStyle = 'rgba(60,35,15,0.25)'; c.fill(); line(c, -W / 2, -H * 0.38, W / 2, -H * 0.38, '#3a2210', 4);
    });
    hullPath(0.9); st(c, '#2a160a', 3);
    // gunwale posts
    for (let i = 0; i < 16; i++) { const y = -H * 0.12 + (i / 15) * H * 0.44; for (const sd of [-1, 1]) { circ(c, sd * W * 0.43, y, 3); c.fillStyle = '#2a160a'; c.fill(); } }
    // cannons along the sides
    for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) { const y = -H * 0.12 + i * H * 0.09; at(c, sd * W * 0.36, y, sd > 0 ? 0 : Math.PI, () => { rrect(c, -10, -9, 18, 18, 3); fs(c, '#6a4024', 1.4); rrect(c, -2, -4, 22, 8, 3); fs(c, lin(c, 0, -4, 0, 4, [[0, '#6a6e74'], [1, '#1e2024']]), 1.4); }); }
    // hatches and masts
    for (const y of [-H * 0.2, H * 0.02]) { rect(c, -W * 0.14, y - 18, W * 0.28, 36); fs(c, '#4a2c18', 2); for (let k = 0; k < 5; k++) line(c, -W * 0.14 + 4, y - 14 + k * 7, W * 0.14 - 4, y - 14 + k * 7, '#8a6038', 2); }
    for (const [y, R] of [[-H * 0.3, 13], [-H * 0.08, 16], [H * 0.18, 13]] as [number, number][]) {
      for (const sd of [-1, 1]) line(c, 0, y, sd * W * 0.45, y + 30, 'rgba(60,40,20,0.7)', 1.2);
      shadow(c, true, 6, 4, 6); circ(c, 0, y, R); fs(c, ball(c, 0, y, R, '#7a5030', 0.35), 2); shadow(c, false);
      circ(c, 0, y, R * 0.35); fs(c, '#4a2c18', 1);
    }
    // stern cabin and helm
    rrect(c, -W * 0.3, H * 0.32, W * 0.6, H * 0.1, 6); fs(c, lin(c, 0, H * 0.32, 0, H * 0.42, [[0, '#8a5a32'], [1, '#5a3a1e']]), 2);
    for (let k = 0; k < 4; k++) { rect(c, -W * 0.24 + k * W * 0.13, H * 0.35, W * 0.08, H * 0.03); fs(c, '#e8c870', 1); }
    at(c, 0, H * 0.3, 0, () => { for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; rod(c, 0, 0, Math.cos(a) * 15, Math.sin(a) * 15, '#8a5a32', 2.4); } circ(c, 0, 0, 10); st(c, INK, 5); circ(c, 0, 0, 10); st(c, '#a8743f', 3); });
    // bowsprit and anchor
    rod(c, 0, -H / 2 + 6, 0, -H / 2 - 18, '#5a3a1e', 6);
    ropeCoil(c, W * 0.2, -H * 0.34, 10); ropeCoil(c, -W * 0.22, H * 0.1, 9);
    for (let i = 0; i < 3; i++) { const x = rrange(r, -W * 0.3, W * 0.3), y = rrange(r, -H * 0.05, H * 0.25); tub(c, x, y, 9, '#4a3420', WOOD); }
  } },
  { id: 'longship', name: t('Longship'), cat: 'nautical', w: 3, h: 9, layer: 0, tags: 'viking longship drakkar raider boat ship', draw: (c, r, w, h) => {
    const W = w * 0.8, H = h * 0.94;
    const hullPath = (k: number) => { c.beginPath(); c.moveTo(0, -H / 2 * k); c.bezierCurveTo(W * 0.62 * k, -H * 0.3 * k, W * 0.62 * k, H * 0.3 * k, 0, H / 2 * k); c.bezierCurveTo(-W * 0.62 * k, H * 0.3 * k, -W * 0.62 * k, -H * 0.3 * k, 0, -H / 2 * k); c.closePath(); };
    shadow(c, true, 16, 6, 10, 0.5); hullPath(1); fs(c, lin(c, -W / 2, 0, W / 2, 0, [[0, '#3a2412'], [0.5, '#5a3a20'], [1, '#2a180a']]), 3); shadow(c, false);
    hullPath(0.86); c.fillStyle = '#a87c4c'; c.fill();
    clip(c, () => hullPath(0.86), () => { for (let y = -H / 2; y < H / 2; y += 18) { line(c, -W, y, W, y, 'rgba(60,35,15,0.6)', 1.4); } });
    hullPath(0.86); st(c, '#2a160a', 2.4);
    // shields on both rails
    const n = 9;
    for (let i = 0; i < n; i++) for (const sd of [-1, 1]) {
      const t2 = -0.32 + (i / (n - 1)) * 0.64, y = t2 * H, x = sd * W * 0.46 * Math.sqrt(1 - Math.pow(t2 / 0.5, 2));
      circ(c, x, y, 11); fs(c, ball(c, x, y, 11, pick(r, ['#b83a2a', '#e8d8b0', '#2a5a8a', '#3a6a3a', '#c8a040']), 0.25), 1.6); circ(c, x, y, 3.5); fs(c, '#8a8e94', 1);
    }
    // benches and oars
    for (let i = 0; i < 7; i++) { const y = -H * 0.27 + i * H * 0.09; rect(c, -W * 0.3, y - 3, W * 0.6, 6); fs(c, '#6a4428', 1.2); for (const sd of [-1, 1]) rod(c, sd * W * 0.3, y, sd * W * 0.72, y + 10, '#c8a070', 2.2); }
    // mast and furled sail
    shadow(c, true, 8, 6, 10); rrect(c, -W * 0.44, -H * 0.02 - 8, W * 0.88, 16, 8); fs(c, lin(c, 0, -8, 0, 8, [[0, '#e8d8b8'], [1, '#a8987a']]), 1.6); shadow(c, false);
    for (let k = 0; k < 6; k++) line(c, -W * 0.44 + k * W * 0.176, -H * 0.02 - 8, -W * 0.44 + k * W * 0.176, -H * 0.02 + 8, 'rgba(160,40,30,0.8)', 4);
    circ(c, 0, -H * 0.02, 9); fs(c, ball(c, 0, 0, 9, '#6a4428'), 1.6);
    // dragon prow and tail
    at(c, 0, -H / 2, 0, () => { c.beginPath(); c.moveTo(0, 6); c.quadraticCurveTo(-10, -14, 4, -26); c.quadraticCurveTo(14, -30, 10, -20); st(c, INK, 8); st(c, '#6a4428', 5); circ(c, 9, -24, 2); c.fillStyle = '#e8c840'; c.fill(); });
    at(c, 0, H / 2, 0, () => { c.beginPath(); c.moveTo(0, -6); c.quadraticCurveTo(10, 14, -2, 22); st(c, INK, 7); st(c, '#6a4428', 4.5); });
  } },
  { id: 'rowboat', name: t('Rowboat'), cat: 'nautical', w: 1.2, h: 2.4, layer: 1, tags: 'boat rowboat dinghy oars', draw: (c, r, w, h) => {
    const W = w * 0.66, H = h * 0.86;
    for (const s of [-1, 1]) oar(c, s * W * 0.5, H * 0.02, h * 0.42, s > 0 ? 0.35 : Math.PI - 0.35);
    shadow(c, true, 10, 5, 7); hull(c, W, H); fs(c, lin(c, -W / 2, 0, W / 2, 0, [[0, WOOD_L], [0.5, WOOD], [1, WOOD_D]]), 2.4); shadow(c, false);
    c.save(); c.scale(0.84, 0.92); hull(c, W, H); c.restore(); fs(c, shade(WOOD, -0.3), 1.2);
    clip(c, () => { c.save(); c.scale(0.84, 0.92); hull(c, W, H); c.restore(); }, () => { for (let i = -2; i <= 2; i++) line(c, i * W * 0.12, -H / 2, i * W * 0.12, H / 2, 'rgba(255,220,170,0.15)', 1.4); });
    for (const y of [-H * 0.12, H * 0.18]) { rect(c, -W * 0.38, y - 5, W * 0.76, 10); fs(c, WOOD_L, 1.4); }
    if (r() < 0.6) ropeCoil(c, 0, -H * 0.32, 8);
  } },
  { id: 'sailboat', name: t('Sailboat'), cat: 'nautical', w: 2, h: 4, layer: 1, tags: 'boat ship sail sloop vessel', draw: (c, r, w, h) => {
    const W = w * 0.62, H = h * 0.9;
    shadow(c, true, 14, 7, 10); hull(c, W, H); fs(c, lin(c, -W / 2, 0, W / 2, 0, [[0, '#7a4a2a'], [0.5, '#9a643a'], [1, '#5a341a']]), 2.6); shadow(c, false);
    c.save(); c.scale(0.86, 0.94); hull(c, W, H); c.restore(); fs(c, '#c8a070', 1.2);
    clip(c, () => { c.save(); c.scale(0.86, 0.94); hull(c, W, H); c.restore(); }, () => { for (let i = -4; i <= 4; i++) line(c, i * W * 0.1, -H / 2, i * W * 0.1, H / 2, 'rgba(90,50,20,0.35)', 1.2); });
    rect(c, -W * 0.2, H * 0.18, W * 0.4, H * 0.16); fs(c, WOOD_D, 1.6); rect(c, -W * 0.14, H * 0.21, W * 0.28, H * 0.1); fs(c, '#2a1a0e', 1);
    const sailCol = pick(r, ['#f0e8d6', '#e8d8b8', '#c84a3a']);
    shadow(c, true, 14, 10, 14, 0.4);
    c.beginPath(); c.moveTo(0, -H * 0.12); c.quadraticCurveTo(W * 0.9, -H * 0.02, W * 0.05, H * 0.15); c.closePath(); fs(c, lin(c, 0, 0, W * 0.6, 0, [[0, sailCol], [1, shade(sailCol, -0.2)]]), 1.8);
    shadow(c, false);
    for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(0, -H * 0.12 + i * H * 0.065); c.quadraticCurveTo(W * 0.5 - i * 6, -H * 0.04 + i * H * 0.05, W * 0.05, -H * 0.1 + i * H * 0.07); st(c, 'rgba(0,0,0,0.15)', 1); }
    rod(c, 0, -H * 0.12, 0, H * 0.15, WOOD_D, 3.5);
    circ(c, 0, -H * 0.12, 6); fs(c, ball(c, 0, 0, 6, WOOD_D), 1.4);
    line(c, 0, -H / 2, 0, -H * 0.12, 'rgba(240,230,200,0.7)', 1);
    ropeCoil(c, W * 0.15, -H * 0.3, 7);
  } },
  { id: 'ship_wheel', name: t('Ship wheel'), cat: 'nautical', w: 1, h: 1, layer: 1, tags: 'helm wheel ship steering captain', draw: (c, r, w) => {
    const R = w * 0.3;
    shadow(c, true, 6, 3, 5); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; rod(c, 0, 0, Math.cos(a) * R * 1.35, Math.sin(a) * R * 1.35, WOOD, 4); circ(c, Math.cos(a) * R * 1.38, Math.sin(a) * R * 1.38, 4); fs(c, ball(c, 0, 0, 4, WOOD_L), 1.2); } shadow(c, false);
    circ(c, 0, 0, R); st(c, INK, 9); circ(c, 0, 0, R); st(c, WOOD_L, 6.5); circ(c, 0, 0, R); st(c, 'rgba(60,30,10,0.4)', 1);
    circ(c, 0, 0, R * 0.25); fs(c, ball(c, 0, 0, R * 0.25, BRASS), 1.6);
    void r;
  } },
  { id: 'anchor', name: t('Anchor'), cat: 'nautical', w: 1, h: 1.3, layer: 1, tags: 'anchor ship harbor iron', draw: (c, r, w, h) => {
    at(c, 0, 0, rrange(r, -0.4, 0.4), () => {
      shadow(c, true, 5, 3, 4);
      rod(c, 0, -h * 0.34, 0, h * 0.3, IRON, 6);
      rod(c, -w * 0.18, -h * 0.24, w * 0.18, -h * 0.24, IRON, 5);
      c.beginPath(); c.moveTo(-w * 0.34, h * 0.08); c.quadraticCurveTo(-w * 0.3, h * 0.36, 0, h * 0.36); c.quadraticCurveTo(w * 0.3, h * 0.36, w * 0.34, h * 0.08); st(c, INK, 8.4); st(c, IRON, 6);
      shadow(c, false);
      for (const s of [-1, 1]) { poly(c, [s * w * 0.34, h * 0.0, s * w * 0.42, h * 0.12, s * w * 0.28, h * 0.12]); fs(c, IRON, 1.4); }
      circ(c, 0, -h * 0.38, 7); st(c, INK, 5); circ(c, 0, -h * 0.38, 7); st(c, '#5a5e64', 2.6);
      line(c, -1.5, -h * 0.32, -1.5, h * 0.25, 'rgba(255,255,255,0.25)', 1.4);
      chain(c, 0, -h * 0.45, w * 0.35, -h * 0.5, 3.2, '#5a5e64');
    });
  } },
  { id: 'dock', name: t('Dock section'), cat: 'nautical', w: 2, h: 4, layer: 0, tags: 'dock pier jetty wharf planks', draw: (c, r, w, h) => {
    const W = w * 0.86, H = h;
    shadow(c, true, 10, 5, 8, 0.55); rect(c, -W / 2, -H / 2, W, H); c.fillStyle = '#3a2614'; c.fill(); shadow(c, false);
    const n = 28;
    for (let i = 0; i < n; i++) { const y = -H / 2 + (i * H) / n; const off = rrange(r, -3, 3); plankBox(c, r, -W / 2 + off, y + 0.5, W, H / n - 1, 1, shade('#8a6a48', rrange(r, -0.18, 0.08)), false, 1, 1.2); for (const s of [-1, 1]) { circ(c, s * W * 0.38 + off, y + H / n / 2, 1.2); c.fillStyle = '#2a2a2a'; c.fill(); } }
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const y = -H / 2 + 12 + (i * (H - 24)) / 3; shadow(c, true, 4, 2, 3); circ(c, s * (W / 2 + 2), y, 9); fs(c, ball(c, 0, 0, 9, '#6a4a2e', 0.3), 1.8); shadow(c, false); circ(c, s * (W / 2 + 2), y, 4); st(c, 'rgba(60,30,10,0.5)', 1); }
  } },
  { id: 'pilings', name: t('Dock pilings'), cat: 'nautical', w: 1, h: 1, layer: 1, tags: 'pilings posts dock water', draw: (c, r, w) => {
    for (let i = 0; i < 3; i++) { const x = rrange(r, -w * 0.25, w * 0.25), y = rrange(r, -w * 0.25, w * 0.25), R = rrange(r, 9, 12); circ(c, x + 3, y + 3, R * 1.5); c.fillStyle = 'rgba(200,240,255,0.18)'; c.fill(); shadow(c, true, 5, 3, 4); circ(c, x, y, R); fs(c, ball(c, x, y, R, '#6a4a2e', 0.3), 1.8); shadow(c, false); circ(c, x, y, R * 0.75); fs(c, '#a8805a', 0); for (let k = 1; k < 3; k++) { circ(c, x, y, R * 0.25 * k); st(c, 'rgba(90,50,20,0.5)', 0.8); } }
  } },
  { id: 'bollard', name: t('Mooring bollard'), cat: 'nautical', w: 0.6, h: 0.6, layer: 1, tags: 'bollard mooring rope dock', draw: (c, r, w) => {
    const R = w * 0.22;
    shadow(c, true, 4, 2, 3); circ(c, 0, 0, R * 1.3); fs(c, ball(c, 0, 0, R * 1.3, '#3a3e44', 0.4), 1.8); shadow(c, false);
    circ(c, 0, 0, R); fs(c, ball(c, 0, 0, R, '#4a4e54', 0.4), 1.2);
    circ(c, 0, 0, R * 1.05); st(c, INK, 4); circ(c, 0, 0, R * 1.05); st(c, '#b0905a', 2.4);
    c.beginPath(); c.moveTo(R, 0); c.quadraticCurveTo(w * 0.35, w * 0.1, w * 0.48, w * 0.35); st(c, INK, 4); st(c, '#b0905a', 2.4);
    void r;
  } },
  { id: 'lobster_pot', name: t('Lobster trap'), cat: 'nautical', w: 0.9, h: 0.7, layer: 1, tags: 'crab lobster pot trap fishing', draw: (c, r, w, h) => {
    const W = w * 0.76, H = h * 0.7;
    shadow(c, true, 5, 2, 4); rrect(c, -W / 2, -H / 2, W, H, H * 0.45); fs(c, 'rgba(110,80,50,0.35)', 2.2, '#6a4a2a'); shadow(c, false);
    clip(c, () => rrect(c, -W / 2, -H / 2, W, H, H * 0.45), () => { for (let i = -10; i < 10; i++) { line(c, i * 6, -H / 2, i * 6 + H, H / 2, 'rgba(60,40,20,0.7)', 1); line(c, i * 6, H / 2, i * 6 + H, -H / 2, 'rgba(60,40,20,0.7)', 1); } });
    for (let i = 0; i < 4; i++) line(c, -W / 2 + (i + 1) * W / 5, -H / 2, -W / 2 + (i + 1) * W / 5, H / 2, '#8a6a3a', 2.4);
    if (r() < 0.6) { at(c, rrange(r, -6, 6), 0, r() * 3, () => { ell(c, 0, 0, 8, 5); fs(c, ball(c, 0, 0, 8, '#c8402a'), 1); for (const s of [-1, 1]) { ell(c, 10, s * 5, 4, 2.4, s * 0.5); fs(c, '#c8402a', 0.8); } }); }
    ropeCoil(c, W * 0.5, H * 0.4, 6);
  } },
  { id: 'fishing_net', name: t('Fishing net'), cat: 'nautical', w: 2, h: 2, layer: 0, tags: 'net fishing drying nets', draw: (c, r, w) => {
    const R = w * 0.42;
    const pts: [number, number][] = [];
    const n = 9;
    for (let gy = -n; gy <= n; gy++) for (let gx = -n; gx <= n; gx++) { const x = (gx / n) * R + rrange(r, -2, 2), y = (gy / n) * R + rrange(r, -2, 2); pts.push([x, y]); }
    const idx = (gx: number, gy: number) => (gy + n) * (2 * n + 1) + (gx + n);
    c.save(); c.shadowColor = 'rgba(0,0,0,0.45)'; c.shadowBlur = 3; c.shadowOffsetY = 2;
    for (let gy = -n; gy <= n; gy++) for (let gx = -n; gx <= n; gx++) {
      const [x, y] = pts[idx(gx, gy)];
      if (Math.hypot(x, y) > R * (0.85 + 0.15 * Math.sin(gx + gy * 2))) continue;
      if (gx < n) { const [x2, y2] = pts[idx(gx + 1, gy)]; if (Math.hypot(x2, y2) < R) line(c, x, y, x2, y2, '#8a7a52', 1.8); }
      if (gy < n) { const [x2, y2] = pts[idx(gx, gy + 1)]; if (Math.hypot(x2, y2) < R) line(c, x, y, x2, y2, '#8a7a52', 1.8); }
    }
    c.restore();
    for (let i = 0; i < 6; i++) { const a = r() * TAU, d = R * rrange(r, 0.6, 0.85); circ(c, Math.cos(a) * d, Math.sin(a) * d, 5); fs(c, ball(c, 0, 0, 5, '#e8b030'), 1); }
  } },
  { id: 'buoy', name: t('Buoy'), cat: 'nautical', w: 0.7, h: 0.7, layer: 1, tags: 'buoy float marker sea', draw: (c, r, w) => {
    const R = w * 0.26;
    circ(c, 0, 0, R * 1.6); c.fillStyle = 'rgba(220,245,255,0.25)'; c.fill();
    shadow(c, true, 5, 2, 4); circ(c, 0, 0, R); fs(c, ball(c, 0, 0, R, '#d03030', 0.35), 1.8); shadow(c, false);
    clip(c, () => circ(c, 0, 0, R), () => { rect(c, -R, -R * 0.25, R * 2, R * 0.5); c.fillStyle = '#f4f0e6'; c.fill(); });
    circ(c, 0, 0, R * 0.3); fs(c, '#3a3e44', 1);
    void r;
  } },
  { id: 'ship_mast', name: t('Ship mast'), cat: 'nautical', w: 3, h: 1, layer: 2, tags: 'mast sail yard rigging ship deck', draw: (c, r, w, h) => {
    shadow(c, true, 12, 10, 14, 0.4);
    c.beginPath(); c.moveTo(-w * 0.45, -h * 0.05); c.quadraticCurveTo(0, h * 0.45, w * 0.45, -h * 0.05); c.lineTo(w * 0.45, -h * 0.12); c.lineTo(-w * 0.45, -h * 0.12); c.closePath();
    fs(c, lin(c, 0, -h * 0.1, 0, h * 0.35, [[0, '#f0e8d6'], [1, '#bfae8a']]), 1.8); shadow(c, false);
    for (let i = 1; i < 6; i++) { const x = -w * 0.45 + (i * w * 0.9) / 6; line(c, x, -h * 0.1, x, -h * 0.1 + Math.sin((i / 6) * Math.PI) * h * 0.4, 'rgba(0,0,0,0.12)', 1.4); }
    rod(c, -w * 0.47, -h * 0.12, w * 0.47, -h * 0.12, WOOD_D, 5);
    circ(c, 0, -h * 0.12, 11); fs(c, ball(c, 0, 0, 11, WOOD, 0.35), 2);
    for (const s of [-1, 1]) line(c, s * w * 0.45, -h * 0.12, s * w * 0.2, h * 0.45, 'rgba(60,40,20,0.6)', 1);
    void r;
  } },
  { id: 'cargo', name: t('Cargo bundle'), cat: 'nautical', w: 1.5, h: 1.5, layer: 1, tags: 'cargo freight net crates sacks shipment', draw: (c, r, w) => {
    for (let i = 0; i < 5; i++) { const x = rrange(r, -w * 0.18, w * 0.18), y = rrange(r, -w * 0.18, w * 0.18); if (r() < 0.5) { shadow(c, true, 5, 2, 4); rect(c, x - 16, y - 16, 32, 32); fs(c, WOOD_L, 1.6); shadow(c, false); line(c, x - 14, y - 14, x + 14, y + 14, WOOD_D, 3); } else { shadow(c, true, 5, 2, 4); ell(c, x, y, 18, 14, r() * 3); fs(c, ball(c, x, y, 18, '#c8b088', 0.3), 1.6); shadow(c, false); } }
    const R = w * 0.36;
    for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(i * R * 0.22, -R); c.quadraticCurveTo(i * R * 0.3, 0, i * R * 0.22, R); st(c, 'rgba(50,35,15,0.85)', 2.2); c.beginPath(); c.moveTo(-R, i * R * 0.22); c.quadraticCurveTo(0, i * R * 0.3, R, i * R * 0.22); st(c, 'rgba(50,35,15,0.85)', 2.2); }
    circ(c, 0, 0, 6); fs(c, METAL, 1.2);
  } },
  { id: 'deck_hatch', name: t('Deck hatch'), cat: 'nautical', w: 1.2, h: 1.2, layer: 0, tags: 'hatch grate ship deck hold', draw: (c, r, w) => {
    const S = w * 0.7;
    rect(c, -S / 2 - 6, -S / 2 - 6, S + 12, S + 12); fs(c, WOOD_D, 2);
    rect(c, -S / 2, -S / 2, S, S); c.fillStyle = '#100a06'; c.fill();
    for (let i = 0; i <= 6; i++) { const k = -S / 2 + (i * S) / 6; rod(c, k, -S / 2, k, S / 2, WOOD_L, 3.5); rod(c, -S / 2, k, S / 2, k, WOOD_L, 3.5); }
    void r;
  } },
  { id: 'seashells', name: t('Seashells'), cat: 'nautical', w: 1.2, h: 1.2, layer: 0, tags: 'shells beach sand starfish', draw: (c, r, w) => {
    for (let i = 0; i < 8; i++) shell(c, r, rrange(r, -w * 0.38, w * 0.38), rrange(r, -w * 0.38, w * 0.38), rrange(r, 7, 12));
    for (let i = 0; i < 2; i++) starfish(c, rrange(r, -w * 0.3, w * 0.3), rrange(r, -w * 0.3, w * 0.3), rrange(r, 9, 13), pick(r, ['#e8722a', '#d84a4a', '#e8a040']), r() * TAU);
  } },
  { id: 'coral', name: t('Coral'), cat: 'nautical', w: 1.4, h: 1.4, layer: 1, tags: 'coral reef underwater sea', draw: (c, r, w) => {
    const cols = ['#f0708a', '#f0a040', '#b070e0', '#f05a5a', '#50c0c0'];
    for (let k = 0; k < 4; k++) {
      const col = pick(r, cols), x0 = rrange(r, -w * 0.2, w * 0.2), y0 = rrange(r, -w * 0.2, w * 0.2);
      const branch = (x: number, y: number, a: number, L: number, wd: number, d: number) => { const x1 = x + Math.cos(a) * L, y1 = y + Math.sin(a) * L; line(c, x, y, x1, y1, shade(col, -0.45), wd + 2); line(c, x, y, x1, y1, col, wd); if (d > 0) for (let i = 0; i < 2; i++) branch(x1, y1, a + rrange(r, -0.7, 0.7), L * 0.72, wd * 0.75, d - 1); else { circ(c, x1, y1, wd * 0.7); c.fillStyle = shade(col, 0.35); c.fill(); } };
      shadow(c, true, 4, 2, 3, 0.4); for (let i = 0; i < 3; i++) branch(x0, y0, r() * TAU, w * 0.12, 5, 3); shadow(c, false);
    }
    for (let i = 0; i < 3; i++) { const x = rrange(r, -w * 0.35, w * 0.35), y = rrange(r, -w * 0.35, w * 0.35); circ(c, x, y, 9); fs(c, ball(c, x, y, 9, '#c8c060', 0.3), 1.2); for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(x, y, 7 - k * 2, r() * 6, r() * 6 + 3); st(c, 'rgba(90,80,20,0.6)', 0.8); } }
  } },
  { id: 'seaweed', name: t('Seaweed'), cat: 'nautical', w: 1.4, h: 1.4, layer: 0, tags: 'seaweed kelp algae beach', draw: (c, r, w) => {
    for (let i = 0; i < 9; i++) { let x = rrange(r, -w * 0.3, w * 0.3), y = rrange(r, -w * 0.3, w * 0.3), a = r() * TAU; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 6; k++) { a += rrange(r, -0.6, 0.6); x += Math.cos(a) * 9; y += Math.sin(a) * 9; c.lineTo(x, y); } st(c, 'rgba(20,40,20,0.6)', 6); st(c, pick(r, ['#4a6a2a', '#6a7a2a', '#3a5a3a']), 4); }
  } },
  { id: 'shipwreck', name: t('Shipwreck'), cat: 'nautical', w: 3, h: 4.5, layer: 1, tags: 'wreck ship broken hull ruins beach', draw: (c, r, w, h) => {
    const W = w * 0.62, H = h * 0.86;
    at(c, 0, 0, rrange(r, -0.25, 0.25), () => {
      const jag = Array.from({ length: 6 }, () => [rrange(r, -5, 5), rrange(r, -6, 6)]);
      const broken = () => { c.beginPath(); c.moveTo(0, -H / 2); c.bezierCurveTo(W * 0.62, -H * 0.3, W / 2, H * 0.1, W * 0.45, H * 0.2); for (let i = 0; i < 6; i++) c.lineTo(W * 0.45 - (i * W * 0.9) / 6 + jag[i][0], H * 0.2 + (i % 2 ? 14 : -4) + jag[i][1]); c.lineTo(-W * 0.45, H * 0.2); c.bezierCurveTo(-W / 2, H * 0.1, -W * 0.62, -H * 0.3, 0, -H / 2); c.closePath(); };
      shadow(c, true, 14, 7, 10); broken(); fs(c, lin(c, -W / 2, 0, W / 2, 0, [[0, '#6a4a32'], [1, '#3a2618']]), 2.6); shadow(c, false);
      clip(c, broken, () => {
        c.save(); c.scale(0.86, 0.94); broken(); c.restore(); c.fillStyle = '#1e140c'; c.fill();
        for (let i = -5; i <= 5; i++) { if (r() < 0.25) continue; line(c, i * W * 0.08, -H / 2, i * W * 0.08 + rrange(r, -4, 4), H * 0.25, shade('#7a5a3e', rrange(r, -0.2, 0.1)), rrange(r, 5, 8)); }
        for (let i = 0; i < 5; i++) { const y = -H * 0.35 + i * H * 0.12; c.beginPath(); c.moveTo(-W * 0.45, y); c.quadraticCurveTo(0, y - 10, W * 0.45, y); st(c, '#4a3020', 5); }
      });
      at(c, W * 0.1, H * 0.38, 0.5, () => { shadow(c, true, 8, 4, 6); rect(c, -W * 0.3, -10, W * 0.6, 20); fs(c, '#5a3a24', 1.8); shadow(c, false); });
      rod(c, -W * 0.05, -H * 0.1, W * 0.7, H * 0.25, WOOD_D, 8);
      for (let i = 0; i < 8; i++) at(c, rrange(r, -W, W), rrange(r, H * 0.2, H * 0.48), r() * TAU, () => { rect(c, -12, -3, 24, 6); fs(c, '#6a4a32', 1.2); });
      tubLike(c, r, -W * 0.6, H * 0.35);
    });
  } },
  { id: 'capstan', name: t('Capstan'), cat: 'nautical', w: 1.2, h: 1.2, layer: 1, tags: 'capstan winch ship deck anchor', draw: (c, r, w) => {
    const R = w * 0.18;
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + 0.2; shadow(c, true, 4, 2, 3); rod(c, Math.cos(a) * R, Math.sin(a) * R, Math.cos(a) * w * 0.46, Math.sin(a) * w * 0.46, WOOD_L, 5); shadow(c, false); }
    shadow(c, true, 6, 3, 5); circ(c, 0, 0, R * 1.2); fs(c, ball(c, 0, 0, R * 1.2, WOOD, 0.3), 2); shadow(c, false);
    circ(c, 0, 0, R * 0.85); st(c, METAL_D, 3); circ(c, 0, 0, R * 0.4); fs(c, ball(c, 0, 0, R * 0.4, BRASS), 1.2);
    void r;
  } },
  { id: 'dinghy_flipped', name: t('Overturned boat'), cat: 'nautical', w: 1.2, h: 2.4, layer: 1, tags: 'boat overturned beach hull keel', draw: (c, r, w, h) => {
    const W = w * 0.66, H = h * 0.86;
    at(c, 0, 0, rrange(r, -0.3, 0.3), () => {
      shadow(c, true, 10, 5, 7); hull(c, W, H); fs(c, lin(c, -W / 2, 0, W / 2, 0, [[0, '#5a6a6a'], [0.4, '#7a8a88'], [1, '#3a4648']]), 2.4); shadow(c, false);
      clip(c, () => hull(c, W, H), () => { for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * W * 0.14, -H / 2); c.quadraticCurveTo(i * W * 0.2, 0, i * W * 0.14, H / 2); st(c, 'rgba(0,0,0,0.25)', 1.2); } for (let i = 0; i < 5; i++) { blob(c, r, rrange(r, 4, 9), 6, 0.3, rrange(r, -W * 0.3, W * 0.3), rrange(r, -H * 0.4, H * 0.4)); c.fillStyle = 'rgba(160,120,80,0.35)'; c.fill(); } });
      rod(c, 0, -H / 2 + 4, 0, H / 2 - 2, WOOD_D, 5);
    });
  } },
  { id: 'lighthouse', name: t('Lighthouse top'), cat: 'nautical', w: 3, h: 3, layer: 2, light: { radius: 9, color: '#fff2c0', intensity: 0.9 }, tags: 'lighthouse beacon tower coast light', draw: (c, r, w) => {
    const R = w * 0.4;
    shadow(c, true, 20, 12, 16, 0.5); circ(c, 0, 0, R); fs(c, '#e8e4da', 2.6); shadow(c, false);
    for (let i = 0; i < 8; i++) { const a0 = (i / 8) * TAU, a1 = ((i + 1) / 8) * TAU; if (i % 2) continue; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R, a0, a1); c.closePath(); c.fillStyle = 'rgba(200,40,40,0.85)'; c.fill(); }
    circ(c, 0, 0, R); st(c, INK, 2.6);
    circ(c, 0, 0, R * 0.78); st(c, '#2a2c30', 4);
    for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU; line(c, Math.cos(a) * R * 0.78, Math.sin(a) * R * 0.78, Math.cos(a) * R * 0.9, Math.sin(a) * R * 0.9, '#2a2c30', 1.6); }
    circ(c, 0, 0, R * 0.55); fs(c, radial(c, 0, 0, R * 0.55, '#fffbe0', '#f0c860', 0), 2);
    glow(c, 0, 0, R * 1.2, '255,240,180', 0.6);
    c.save(); c.globalCompositeOperation = 'lighter'; const a = r() * TAU; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R * 1.5, a - 0.25, a + 0.25); c.closePath(); c.fillStyle = 'rgba(255,240,190,0.35)'; c.fill(); c.restore();
    circ(c, 0, 0, R * 0.22); fs(c, ball(c, 0, 0, R * 0.22, '#2a2c30'), 1.6);
  } },
  { id: 'hammock', name: t('Hammock'), cat: 'nautical', w: 1, h: 2.4, layer: 1, tags: 'hammock bed sailor rest', draw: (c, r, w, h) => {
    for (const s of [-1, 1]) { shadow(c, true, 4, 2, 3); circ(c, 0, s * h * 0.44, 7); fs(c, ball(c, 0, 0, 7, WOOD_D), 1.6); shadow(c, false); for (let k = -2; k <= 2; k++) line(c, 0, s * h * 0.44, k * w * 0.1, s * h * 0.3, '#c8b080', 1); }
    shadow(c, true, 8, 6, 10, 0.4); c.beginPath(); c.moveTo(-w * 0.22, -h * 0.3); c.quadraticCurveTo(-w * 0.34, 0, -w * 0.22, h * 0.3); c.lineTo(w * 0.22, h * 0.3); c.quadraticCurveTo(w * 0.34, 0, w * 0.22, -h * 0.3); c.closePath();
    fs(c, lin(c, -w * 0.3, 0, w * 0.3, 0, [[0, '#d8ccb0'], [0.5, '#f0e8d6'], [1, '#a8987a']]), 1.6); shadow(c, false);
    for (let i = 1; i < 6; i++) { const y = -h * 0.3 + (i * h * 0.6) / 6; c.beginPath(); c.moveTo(-w * 0.26, y); c.quadraticCurveTo(0, y + 6, w * 0.26, y); st(c, 'rgba(90,70,40,0.3)', 1.2); }
    void r;
  } },
];

function tubLike(c: C2D, r: Rng, x: number, y: number) { tub(c, x, y, 16, '#2a5a6a', WOOD); void r; }
void boulder; void cloth; void coin; void flame; void GOLD; void grain; void METAL; void METAL_L; void radial; void rock; void STONE; void LINEN; void starPath;
