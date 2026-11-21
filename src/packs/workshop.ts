import { t } from '../i18n';
import {
  at, ball, blob, BRASS, C2D, circ, clip, cloth, CLOTH, coals, COPPER, ell, flame, fs, glow, GOLD, grain, INK, IRON, lin, line, METAL, METAL_D,
  METAL_L, OAK, PINE_W, pick, plankBox, poly, radial, rect, rock, rod, ropeCoil, rrange, rrect, shade, shadow, StampDef, st, STONE, STONE_D,
  STONE_L, TAU, tub, WOOD, WOOD_D, WOOD_L, boulder,
} from '../art';
import type { Rng } from '../util';
import { seat } from './furniture';

export function hammer(c: C2D, x: number, y: number, L: number, rot: number) {
  at(c, x, y, rot, () => {
    rod(c, -L / 2, 0, L * 0.35, 0, '#8a5a33', L * 0.09);
    shadow(c, true, 3, 1.5, 2, 0.45); rrect(c, L * 0.3, -L * 0.2, L * 0.18, L * 0.4, 2); fs(c, lin(c, 0, -L * 0.2, 0, L * 0.2, [[0, METAL_L], [1, METAL_D]]), 1.2); shadow(c, false);
  });
}
export function tongs(c: C2D, x: number, y: number, L: number, rot: number) {
  at(c, x, y, rot, () => { for (const s of [-1, 1]) { c.beginPath(); c.moveTo(-L / 2, s * L * 0.06); c.lineTo(L * 0.2, s * L * 0.02); c.lineTo(L / 2, s * L * 0.07); st(c, INK, 4); st(c, '#5a5e64', 2.2); } circ(c, L * 0.2, 0, 2.2); fs(c, METAL, 0.8); });
}
function saw(c: C2D, x: number, y: number, L: number, rot: number) {
  at(c, x, y, rot, () => {
    poly(c, [-L * 0.3, -L * 0.1, L / 2, -L * 0.04, L / 2, L * 0.04, -L * 0.3, L * 0.12]); fs(c, lin(c, 0, -L * 0.1, 0, L * 0.1, [[0, '#ffffff'], [1, METAL]]), 1);
    c.beginPath(); for (let i = 0; i < 14; i++) { const k = i / 14, xx = -L * 0.3 + k * L * 0.8, yy = L * 0.12 - k * L * 0.08; c.lineTo(xx, yy); c.lineTo(xx + L * 0.03, yy + 2); } st(c, '#5a5e64', 0.8);
    rrect(c, -L / 2, -L * 0.12, L * 0.22, L * 0.26, 4); fs(c, WOOD, 1.2); rrect(c, -L * 0.44, -L * 0.05, L * 0.1, L * 0.1, 2); c.fillStyle = '#2a1a10'; c.fill();
  });
}
export function gear(c: C2D, x: number, y: number, R: number, teeth: number, col: string, rot = 0) {
  at(c, x, y, rot, () => {
    c.beginPath();
    for (let i = 0; i < teeth * 2; i++) { const a0 = (i / (teeth * 2)) * TAU, a1 = ((i + 1) / (teeth * 2)) * TAU, d = i % 2 ? R * 0.82 : R; c.arc(0, 0, d, a0 + 0.04, a1 - 0.04); }
    c.closePath();
    shadow(c, true, 4, 2, 3, 0.45); fs(c, ball(c, 0, 0, R, col, 0.3), 1.6); shadow(c, false);
    circ(c, 0, 0, R * 0.6); st(c, shade(col, -0.4), 1.4);
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; circ(c, Math.cos(a) * R * 0.42, Math.sin(a) * R * 0.42, R * 0.12); c.fillStyle = shade(col, -0.55); c.fill(); }
    circ(c, 0, 0, R * 0.18); fs(c, shade(col, 0.3), 1);
  });
}
function anvil(c: C2D, x: number, y: number, s: number, rot = 0) {
  at(c, x, y, rot, () => {
    const p = () => { c.beginPath(); c.moveTo(-s * 0.5, -s * 0.2); c.lineTo(s * 0.25, -s * 0.2); c.quadraticCurveTo(s * 0.62, -s * 0.12, s * 0.75, 0); c.quadraticCurveTo(s * 0.62, s * 0.12, s * 0.25, s * 0.2); c.lineTo(-s * 0.5, s * 0.2); c.closePath(); };
    shadow(c, true, 6, 3, 5, 0.6); p(); fs(c, lin(c, 0, -s * 0.2, 0, s * 0.2, [[0, '#8a9098'], [0.45, '#5a6068'], [1, '#2a2e34']]), 2); shadow(c, false);
    rect(c, -s * 0.38, -s * 0.06, s * 0.08, s * 0.08); c.fillStyle = '#16181c'; c.fill();
    line(c, -s * 0.46, -s * 0.14, s * 0.4, -s * 0.12, 'rgba(255,255,255,0.35)', 1.4);
  });
}

export const WORKSHOP: StampDef[] = [
  { id: 'anvil', name: t('Anvil'), cat: 'workshop', w: 1, h: 0.8, layer: 1, tags: 'smith forge blacksmith', draw: (c, r, w, h) => {
    shadow(c, true, 6, 3, 4); circ(c, -w * 0.04, 0, h * 0.34); fs(c, '#6a4428'); shadow(c, false);
    for (let k = 1; k < 4; k++) { circ(c, -w * 0.04, 0, h * 0.09 * k); st(c, 'rgba(40,20,5,0.4)', 1); }
    anvil(c, 0, 0, w * 0.6);
    hammer(c, w * 0.05, h * 0.3, w * 0.36, rrange(r, -0.4, 0.2));
  } },
  { id: 'forge', name: t('Forge'), cat: 'workshop', w: 1.6, h: 1.6, layer: 1, light: { radius: 5, color: '#ff8a3a', intensity: 0.95 }, tags: 'smith hearth fire blacksmith', draw: (c, r, w) => {
    const S = w * 0.84;
    shadow(c, true, 12, 5, 8); rrect(c, -S / 2, -S / 2, S, S, 8); fs(c, STONE_D); shadow(c, false);
    clip(c, () => rrect(c, -S / 2, -S / 2, S, S, 8), () => { for (let i = 0; i < 22; i++) { const x = rrange(r, -S / 2, S / 2), y = rrange(r, -S / 2, S / 2); blob(c, r, rrange(r, 9, 15), 7, 0.2, x, y); fs(c, shade(STONE, rrange(r, -0.25, 0.1)), 1.4, 'rgba(20,15,10,0.8)'); } });
    rrect(c, -S / 2, -S / 2, S, S, 8); st(c, INK, 2.4);
    circ(c, 0, 0, S * 0.3); c.fillStyle = '#120806'; c.fill();
    coals(c, r, 0, 0, S * 0.28, 20); glow(c, 0, 0, S * 0.42, '255,140,40', 0.55); flame(c, -4, 2, 8); flame(c, 7, -5, 6);
    circ(c, 0, 0, S * 0.3); st(c, INK, 2);
    tongs(c, S * 0.2, S * 0.3, S * 0.5, -0.6);
    rrect(c, -S * 0.46, -S * 0.46, S * 0.22, S * 0.14, 2); fs(c, METAL_D, 1.2);
  } },
  { id: 'bellows', name: t('Bellows'), cat: 'workshop', w: 0.9, h: 0.6, layer: 1, tags: 'forge smith air', draw: (c, r, w, h) => {
    shadow(c, true, 5, 2, 3);
    c.beginPath(); c.moveTo(-w * 0.4, -h * 0.32); c.quadraticCurveTo(w * 0.1, -h * 0.42, w * 0.2, 0); c.quadraticCurveTo(w * 0.1, h * 0.42, -w * 0.4, h * 0.32); c.closePath(); fs(c, WOOD); shadow(c, false);
    for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-w * 0.36 + i * 4, -h * 0.28 + i * 2); c.quadraticCurveTo(w * 0.05, -h * 0.3 + i * 4, w * 0.16, 0); st(c, 'rgba(60,30,10,0.45)', 1.2); }
    c.beginPath(); c.moveTo(-w * 0.3, -h * 0.25); c.quadraticCurveTo(w * 0.05, -h * 0.25, w * 0.15, 0); c.quadraticCurveTo(w * 0.05, h * 0.25, -w * 0.3, h * 0.25); c.closePath(); fs(c, '#8a5a3a', 1.2);
    rod(c, w * 0.18, 0, w * 0.44, 0, BRASS, 4);
    rod(c, -w * 0.48, -h * 0.1, -w * 0.38, -h * 0.1, WOOD_D, 4); rod(c, -w * 0.48, h * 0.1, -w * 0.38, h * 0.1, WOOD_D, 4);
    void r;
  } },
  { id: 'quench_trough', name: t('Quench trough'), cat: 'workshop', w: 1.4, h: 0.6, layer: 1, tags: 'water trough smith', draw: (c, r, w, h) => {
    const W = w * 0.9, H = h * 0.76;
    shadow(c, true, 6, 2, 4); rrect(c, -W / 2, -H / 2, W, H, 3); fs(c, STONE_D); shadow(c, false);
    rrect(c, -W / 2 + 5, -H / 2 + 5, W - 10, H - 10, 3); fs(c, radial(c, 0, 0, W * 0.45, '#4a7a80', '#1a3438', 0), 1.2);
    for (let i = 0; i < 6; i++) { circ(c, rrange(r, -W * 0.35, W * 0.35), rrange(r, -H * 0.2, H * 0.2), rrange(r, 1.5, 3)); c.fillStyle = 'rgba(230,240,240,0.5)'; c.fill(); }
    tongs(c, W * 0.1, 0, W * 0.45, 0.2);
  } },
  { id: 'grindstone', name: t('Grindstone'), cat: 'workshop', w: 1.1, h: 0.8, layer: 1, tags: 'sharpen whetstone wheel', draw: (c, r, w, h) => {
    for (const s of [-1, 1]) { rect(c, -w * 0.38, s * h * 0.22 - 4, w * 0.76, 8); fs(c, WOOD, 1.6); }
    rod(c, 0, -h * 0.4, 0, h * 0.4, METAL_D, 3);
    shadow(c, true, 5, 2, 3); rrect(c, -w * 0.22, -h * 0.12, w * 0.44, h * 0.24, 4); fs(c, lin(c, -w * 0.22, 0, w * 0.22, 0, [[0, STONE_D], [0.4, STONE_L], [1, STONE_D]]), 1.8); shadow(c, false);
    for (let i = 0; i < 8; i++) { const x = -w * 0.18 + i * w * 0.05; line(c, x, -h * 0.12, x, h * 0.12, 'rgba(0,0,0,0.15)', 1); }
    rod(c, 0, h * 0.4, w * 0.1, h * 0.46, WOOD_D, 3);
    rrect(c, -w * 0.46, -h * 0.4, w * 0.16, h * 0.8, 3); fs(c, WOOD_D, 1.4);
    void r;
  } },
  { id: 'workbench', name: t('Workbench'), cat: 'workshop', w: 2, h: 1, layer: 1, tags: 'carpenter tools table', draw: (c, r, w, h) => {
    const W = w * 0.92, H = h * 0.76;
    shadow(c, true); plankBox(c, r, -W / 2, -H / 2, W, H, 2, OAK); shadow(c, false);
    rect(c, W / 2 - 18, -H / 2 - 4, 14, 16); fs(c, METAL_D, 1.4); rod(c, W / 2 - 11, -H / 2 - 10, W / 2 - 11, -H / 2 - 2, METAL, 2);
    hammer(c, -W * 0.3, -H * 0.12, 34, rrange(r, -0.3, 0.3)); saw(c, W * 0.06, H * 0.1, 48, rrange(r, -0.15, 0.15));
    for (let i = 0; i < 3; i++) at(c, -W * 0.32 + i * 8, H * 0.22, Math.PI / 2 + rrange(r, -0.15, 0.15), () => { rod(c, -8, 0, 4, 0, WOOD_D, 3); rod(c, 4, 0, 11, 0, METAL_L, 1.8); });
    for (let i = 0; i < 14; i++) { const x = rrange(r, -W * 0.1, W * 0.45), y = rrange(r, -H * 0.4, H * 0.4); c.beginPath(); c.arc(x, y, rrange(r, 2, 4), 0, rrange(r, 3, 5)); st(c, '#e0b878', 1.2); }
    plankBox(c, r, W * 0.18, -H * 0.36, W * 0.26, 10, 1, PINE_W, false, 1, 1.2);
  } },
  { id: 'tool_rack', name: t('Tool rack'), cat: 'workshop', w: 1.6, h: 0.4, layer: 1, tags: 'tools wall hammer saw axe', draw: (c, r, w, h) => {
    const W = w * 0.94;
    shadow(c, true, 4, 2, 3); rect(c, -W / 2, -h * 0.35, W, h * 0.2); fs(c, WOOD_D, 1.6); shadow(c, false);
    hammer(c, -W * 0.38, h * 0.08, 26, Math.PI / 2); saw(c, -W * 0.15, h * 0.05, 32, Math.PI / 2 + 0.1); tongs(c, W * 0.05, h * 0.05, 30, Math.PI / 2);
    at(c, W * 0.25, h * 0.05, Math.PI / 2, () => { rod(c, -14, 0, 12, 0, WOOD, 3); poly(c, [-14, -1, -8, -9, -4, -9, -8, -1]); fs(c, METAL_L, 1); });
    at(c, W * 0.4, h * 0.05, Math.PI / 2, () => { rod(c, -14, 0, 12, 0, WOOD, 3); rect(c, -16, -6, 6, 12); fs(c, METAL, 1); });
    void r;
  } },
  { id: 'sawhorse', name: t('Sawhorse'), cat: 'workshop', w: 1.6, h: 0.8, layer: 1, tags: 'log carpenter lumber', draw: (c, r, w, h) => {
    for (const s of [-1, 1]) { line(c, s * w * 0.28 - 10, -h * 0.35, s * w * 0.28 + 10, h * 0.35, INK, 6); line(c, s * w * 0.28 - 10, -h * 0.35, s * w * 0.28 + 10, h * 0.35, WOOD, 4); line(c, s * w * 0.28 + 10, -h * 0.35, s * w * 0.28 - 10, h * 0.35, INK, 6); line(c, s * w * 0.28 + 10, -h * 0.35, s * w * 0.28 - 10, h * 0.35, WOOD, 4); }
    shadow(c, true, 6, 3, 5); rrect(c, -w * 0.45, -h * 0.17, w * 0.82, h * 0.34, h * 0.17); fs(c, lin(c, 0, -h * 0.17, 0, h * 0.17, [[0, '#8a6040'], [1, '#4a301a']])); shadow(c, false);
    for (let i = 0; i < 4; i++) line(c, -w * 0.4, rrange(r, -h * 0.12, h * 0.12), w * 0.3, rrange(r, -h * 0.12, h * 0.12), 'rgba(20,10,0,0.35)', 1.2);
    ell(c, w * 0.37, 0, h * 0.09, h * 0.17); fs(c, '#d8a86a', 1.6);
    for (let k = 1; k < 3; k++) { ell(c, w * 0.37, 0, h * 0.03 * k, h * 0.06 * k); st(c, 'rgba(110,60,20,0.5)', 0.8); }
    for (let i = 0; i < 30; i++) { circ(c, rrange(r, -w * 0.1, w * 0.1), rrange(r, h * 0.2, h * 0.45), rrange(r, 0.8, 1.8)); c.fillStyle = '#e8c490'; c.fill(); }
  } },
  { id: 'lumber', name: t('Lumber pile'), cat: 'workshop', w: 2, h: 1, layer: 1, tags: 'planks wood boards stack', draw: (c, r, w, h) => {
    for (let k = 0; k < 3; k++) {
      const y0 = -h * 0.32 + k * 3, rot = rrange(r, -0.04, 0.04);
      at(c, rrange(r, -4, 4), k * -2, rot, () => { shadow(c, true, 5, 2, 4); for (let i = 0; i < 4; i++) plankBox(c, r, -w * 0.44, y0 + i * h * 0.16, w * 0.86 - rrange(r, 0, 20), h * 0.15, 1, shade(PINE_W, rrange(r, -0.2, 0.05)), false, 1, 1.4); shadow(c, false); });
    }
  } },
  { id: 'loom', name: t('Loom'), cat: 'workshop', w: 1.6, h: 1.2, layer: 1, tags: 'weaving cloth textile', draw: (c, r, w, h) => {
    const W = w * 0.84, H = h * 0.8, col = pick(r, CLOTH);
    shadow(c, true, 8, 3, 5); rect(c, -W / 2, -H / 2, W, H); fs(c, 'rgba(0,0,0,0)', 0); shadow(c, false);
    for (const s of [-1, 1]) rod(c, s * W / 2, -H / 2, s * W / 2, H / 2, WOOD_D, 6);
    for (const y of [-H / 2, -H * 0.1, H * 0.25, H / 2]) rod(c, -W / 2, y, W / 2, y, WOOD, 5);
    for (let i = 0; i < 30; i++) { const x = -W / 2 + 6 + i * (W - 12) / 29; line(c, x, -H / 2 + 3, x, H * 0.22, 'rgba(240,230,210,0.85)', 0.8); }
    cloth(c, r, -W / 2 + 5, H * 0.27, W - 10, H * 0.21, col, 1, 1);
    for (let i = 0; i < 5; i++) line(c, -W / 2 + 5, H * 0.3 + i * 4, W / 2 - 5, H * 0.3 + i * 4, shade(col, 0.2), 1);
    ell(c, 0, H * 0.05, 18, 5); fs(c, WOOD_L, 1.4);
    seat(c, 0, H / 2 + 18, 26, Math.PI);
  } },
  { id: 'spinning_wheel', name: t('Spinning wheel'), cat: 'workshop', w: 1.1, h: 0.8, layer: 1, tags: 'yarn wool weaving', draw: (c, r, w, h) => {
    shadow(c, true, 6, 3, 4); rrect(c, -w * 0.42, -h * 0.12, w * 0.84, h * 0.24, 4); fs(c, WOOD); shadow(c, false);
    for (const s of [-1, 1]) rod(c, s * w * 0.3, -h * 0.35, s * w * 0.3, h * 0.35, WOOD_D, 3);
    shadow(c, true, 5, 3, 4); rrect(c, -w * 0.06, -h * 0.4, w * 0.12, h * 0.8, 4); fs(c, lin(c, -w * 0.06, 0, w * 0.06, 0, [[0, WOOD_D], [0.5, WOOD_L], [1, WOOD_D]]), 1.6); shadow(c, false);
    ell(c, w * 0.32, 0, w * 0.06, h * 0.12); fs(c, ball(c, w * 0.32, 0, w * 0.08, '#e8e0d0', 0.2), 1.2);
    for (let i = 0; i < 5; i++) line(c, w * 0.28, -h * 0.08 + i * 4, w * 0.36, -h * 0.08 + i * 4, 'rgba(120,110,90,0.5)', 0.8);
    line(c, -w * 0.06, -h * 0.35, w * 0.3, -h * 0.08, 'rgba(240,230,210,0.9)', 0.8);
    void r;
  } },
  { id: 'pottery_wheel', name: t('Pottery wheel'), cat: 'workshop', w: 0.9, h: 0.9, layer: 1, tags: 'clay potter ceramics', draw: (c, r, w) => {
    const R = w * 0.36;
    shadow(c, true, 6, 3, 4); circ(c, 0, 0, R); fs(c, WOOD_D); shadow(c, false);
    circ(c, 0, 0, R * 0.86); fs(c, radial(c, 0, 0, R, '#a88060', '#6a4a30'), 1.2);
    for (let k = 1; k < 4; k++) { circ(c, 0, 0, R * 0.22 * k); st(c, 'rgba(60,35,20,0.35)', 1); }
    shadow(c, true, 4, 2, 3); circ(c, 0, 0, R * 0.42); fs(c, ball(c, 0, 0, R * 0.42, '#b0724a', 0.3), 1.4); shadow(c, false);
    circ(c, 0, 0, R * 0.26); fs(c, radial(c, 0, 0, R * 0.26, '#6a3a1e', '#3a1e0e'), 1);
    for (let i = 0; i < 6; i++) { blob(c, r, rrange(r, 2, 4), 5, 0.3, rrange(r, -R, R), rrange(r, -R, R)); c.fillStyle = 'rgba(176,114,74,0.7)'; c.fill(); }
  } },
  { id: 'kiln', name: t('Kiln'), cat: 'workshop', w: 1.4, h: 1.4, layer: 1, light: { radius: 3, color: '#ff8a3a', intensity: 0.7 }, tags: 'oven pottery brick furnace', draw: (c, r, w) => {
    const R = w * 0.4;
    shadow(c, true, 12, 5, 8); circ(c, 0, 0, R); fs(c, '#9a5440'); shadow(c, false);
    for (let k = 0; k < 4; k++) { const rr = R * (1 - k * 0.22), n = 16 - k * 3; for (let i = 0; i < n; i++) { const a0 = (i / n) * TAU + k * 0.3, a1 = ((i + 1) / n) * TAU + k * 0.3; c.beginPath(); c.arc(0, 0, rr, a0, a1); c.arc(0, 0, rr - R * 0.2, a1, a0, true); c.closePath(); const lit = -Math.cos((a0 + a1) / 2 - Math.PI * 1.25); c.fillStyle = shade('#a05a42', lit * 0.18 + rrange(r, -0.08, 0.08)); c.fill(); st(c, 'rgba(40,20,10,0.7)', 1); } }
    circ(c, 0, 0, R * 0.14); c.fillStyle = '#1a0c06'; c.fill(); glow(c, 0, 0, R * 0.3, '255,140,50', 0.35);
    rrect(c, -R * 0.3, R * 0.78, R * 0.6, R * 0.3, [6, 6, 0, 0]); c.fillStyle = '#140806'; c.fill(); st(c, INK, 1.6);
    clip(c, () => rrect(c, -R * 0.3, R * 0.78, R * 0.6, R * 0.3, [6, 6, 0, 0]), () => coals(c, r, 0, R, R * 0.3, 8));
  } },
  { id: 'hide_rack', name: t('Hide stretching rack'), cat: 'workshop', w: 1.2, h: 1.4, layer: 1, tags: 'tanner leather pelt hunter', draw: (c, r, w, h) => {
    const W = w * 0.8, H = h * 0.82;
    shadow(c, true, 6, 3, 5); rect(c, -W / 2, -H / 2, W, H); fs(c, 'rgba(0,0,0,0)', 0); shadow(c, false);
    for (const s of [-1, 1]) { rod(c, s * W / 2, -H / 2 - 6, s * W / 2, H / 2 + 6, WOOD_D, 5); rod(c, -W / 2 - 6, s * H / 2, W / 2 + 6, s * H / 2, WOOD_D, 5); }
    const hide = () => { c.beginPath(); c.moveTo(0, -H * 0.42); c.quadraticCurveTo(W * 0.2, -H * 0.4, W * 0.38, -H * 0.36); c.quadraticCurveTo(W * 0.28, -H * 0.1, W * 0.3, 0); c.quadraticCurveTo(W * 0.3, H * 0.2, W * 0.38, H * 0.38); c.quadraticCurveTo(0, H * 0.3, -W * 0.38, H * 0.38); c.quadraticCurveTo(-W * 0.3, H * 0.2, -W * 0.3, 0); c.quadraticCurveTo(-W * 0.28, -H * 0.1, -W * 0.38, -H * 0.36); c.quadraticCurveTo(-W * 0.2, -H * 0.4, 0, -H * 0.42); c.closePath(); };
    hide(); fs(c, radial(c, 0, 0, H * 0.45, '#d8b088', '#9a6a40', 0), 1.6);
    clip(c, hide, () => { for (let i = 0; i < 8; i++) { blob(c, r, rrange(r, 5, 12), 7, 0.3, rrange(r, -W * 0.3, W * 0.3), rrange(r, -H * 0.3, H * 0.3)); c.fillStyle = 'rgba(120,70,30,0.2)'; c.fill(); } });
    for (const [x, y, x2, y2] of [[-0.38, -0.36, -0.5, -0.5], [0.38, -0.36, 0.5, -0.5], [0.38, 0.38, 0.5, 0.5], [-0.38, 0.38, -0.5, 0.5], [-0.3, 0, -0.5, 0], [0.3, 0, 0.5, 0]]) line(c, x * W, y * H, x2 * W, y2 * H, '#c8b080', 1.2);
  } },
  { id: 'toolbox', name: t('Toolbox'), cat: 'workshop', w: 0.7, h: 0.45, layer: 1, tags: 'tools box', draw: (c, r, w, h) => {
    const W = w * 0.8, H = h * 0.7;
    shadow(c, true, 4, 2, 3); plankBox(c, r, -W / 2, -H / 2, W, H, 1, WOOD); shadow(c, false);
    rect(c, -W / 2 + 4, -H / 2 + 4, W - 8, H - 8); c.fillStyle = '#2a1a10'; c.fill();
    rod(c, -W / 2 + 2, 0, W / 2 - 2, 0, WOOD_D, 3);
    hammer(c, -W * 0.15, -H * 0.2, 22, 0.1); tongs(c, W * 0.12, H * 0.2, 22, -0.1);
    for (let i = 0; i < 6; i++) { circ(c, rrange(r, -W * 0.4, W * 0.4), rrange(r, -H * 0.3, H * 0.3), 1.2); c.fillStyle = METAL_L; c.fill(); }
  } },
  { id: 'ladder', name: t('Ladder'), cat: 'workshop', w: 0.6, h: 2, layer: 1, tags: 'climb rungs', draw: (c, r, w, h) => {
    const W = w * 0.5, H = h * 0.92;
    shadow(c, true, 5, 3, 4); for (const s of [-1, 1]) rod(c, s * W / 2, -H / 2, s * W / 2, H / 2, WOOD, 5); shadow(c, false);
    for (let i = 0; i < 8; i++) { const y = -H / 2 + 10 + (i * (H - 20)) / 7; rod(c, -W / 2, y, W / 2, y, WOOD_L, 3.5); }
    void r;
  } },
  { id: 'rope', name: t('Rope coil'), cat: 'workshop', w: 0.6, h: 0.6, layer: 1, tags: 'rope coil sailor climbing', draw: (c, r, w) => { ropeCoil(c, 0, 0, w * 0.33); line(c, w * 0.3, w * 0.05, w * 0.45, w * 0.3, INK, 5); line(c, w * 0.3, w * 0.05, w * 0.45, w * 0.3, '#a88a58', 3.4); void r; } },
  { id: 'crucible', name: t('Smelting crucible'), cat: 'workshop', w: 1.2, h: 1.2, layer: 1, light: { radius: 4, color: '#ffa040', intensity: 0.85 }, tags: 'foundry molten metal furnace smelter', draw: (c, r, w) => {
    const R = w * 0.38;
    shadow(c, true, 10, 4, 7); circ(c, 0, 0, R); fs(c, STONE_D); shadow(c, false);
    for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; blob(c, r, R * 0.22, 6, 0.2, Math.cos(a) * R * 0.78, Math.sin(a) * R * 0.78); fs(c, shade(STONE, rrange(r, -0.25, 0.05)), 1.2); }
    circ(c, 0, 0, R * 0.58); fs(c, '#2a2a2e', 2);
    circ(c, 0, 0, R * 0.48); c.fillStyle = radial(c, 0, 0, R * 0.48, '#fff4b0', '#ff7a10', 0); c.fill();
    clip(c, () => circ(c, 0, 0, R * 0.48), () => { for (let i = 0; i < 7; i++) { blob(c, r, rrange(r, 3, 7), 6, 0.3, rrange(r, -R * 0.4, R * 0.4), rrange(r, -R * 0.4, R * 0.4)); c.fillStyle = 'rgba(160,50,10,0.55)'; c.fill(); } });
    glow(c, 0, 0, R * 0.9, '255,160,60', 0.45);
    rod(c, R * 0.55, 0, R * 1.2, R * 0.2, METAL_D, 3);
  } },
  { id: 'clockwork', name: t('Clockwork machine'), cat: 'workshop', w: 2, h: 2, layer: 1, tags: 'gears cogs machine gnome artificer steampunk', draw: (c, r, w) => {
    const S = w * 0.86;
    shadow(c, true, 12, 5, 8); rrect(c, -S / 2, -S / 2, S, S, 8); fs(c, lin(c, -S / 2, -S / 2, S / 2, S / 2, [[0, '#5a4a3a'], [1, '#2a2018']])); shadow(c, false);
    for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { circ(c, x * (S / 2 - 8), y * (S / 2 - 8), 3.5); fs(c, BRASS, 1); }
    gear(c, -S * 0.17, -S * 0.12, S * 0.24, 14, BRASS, r());
    gear(c, S * 0.2, -S * 0.2, S * 0.15, 10, COPPER, r());
    gear(c, S * 0.17, S * 0.18, S * 0.18, 12, '#9aa0a8', r());
    gear(c, -S * 0.25, S * 0.26, S * 0.1, 8, COPPER, r());
    rod(c, -S * 0.4, S * 0.4, S * 0.4, S * 0.4, COPPER, 5); rod(c, S * 0.4, -S * 0.4, S * 0.4, S * 0.4, COPPER, 5);
    circ(c, S * 0.36, -S * 0.38, 8); fs(c, radial(c, S * 0.36, -S * 0.38, 8, '#f4f0e6', '#c8c0b0'), 1.4); line(c, S * 0.36, -S * 0.38, S * 0.4, -S * 0.42, INK, 1.2);
    glow(c, -S * 0.17, -S * 0.12, 10, '120,220,255', 0.7); circ(c, -S * 0.17, -S * 0.12, 4); fs(c, '#c8f4ff', 1);
  } },
  { id: 'cart_wheel', name: t('Cart wheel'), cat: 'workshop', w: 1, h: 1, layer: 0, tags: 'wheel wagon wheelwright', draw: (c, r, w) => {
    const R = w * 0.4;
    shadow(c, true, 4, 2, 3); circ(c, 0, 0, R); st(c, INK, 10); shadow(c, false); circ(c, 0, 0, R); st(c, WOOD, 7);
    circ(c, 0, 0, R + 3); st(c, METAL_D, 2);
    for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; rod(c, Math.cos(a) * R * 0.2, Math.sin(a) * R * 0.2, Math.cos(a) * R * 0.95, Math.sin(a) * R * 0.95, WOOD_L, 3); }
    circ(c, 0, 0, R * 0.22); fs(c, ball(c, 0, 0, R * 0.22, WOOD, 0.3), 1.6); circ(c, 0, 0, R * 0.08); c.fillStyle = METAL_D; c.fill();
    void r;
  } },
  { id: 'tannery_vat', name: t('Tannery vat'), cat: 'workshop', w: 1, h: 1, layer: 1, tags: 'dye tanning leather vat', draw: (c, r, w) => {
    const col = pick(r, ['#5a3a1a', '#2a4a8a', '#8a2a3a', '#4a6a2a']);
    tub(c, 0, 0, w * 0.42, (R) => { circ(c, 0, 0, R); c.fillStyle = radial(c, 0, 0, R, shade(col, 0.2), shade(col, -0.3), 0.2); c.fill(); for (let i = 0; i < 5; i++) { circ(c, rrange(r, -R * 0.6, R * 0.6), rrange(r, -R * 0.6, R * 0.6), rrange(r, 2, 5)); st(c, `rgba(255,255,255,0.25)`, 1); } line(c, -R * 0.2, R * 0.9, R * 0.5, -R * 0.4, INK, 5); line(c, -R * 0.2, R * 0.9, R * 0.5, -R * 0.4, WOOD_L, 3); });
  } },
  { id: 'ore_pile', name: t('Ore pile'), cat: 'workshop', w: 1.2, h: 1, layer: 1, tags: 'iron ore mine rocks metal', draw: (c, r, w, h) => {
    for (let i = 0; i < 16; i++) { const x = rrange(r, -w * 0.32, w * 0.32) * (1 - i / 22), y = rrange(r, -h * 0.28, h * 0.28) * (1 - i / 22); boulder(c, r, x, y, rrange(r, 7, 13), pick(r, ['#6a5a50', '#5a4a44', '#7a6458'])); if (r() < 0.6) { circ(c, x + rrange(r, -3, 3), y + rrange(r, -3, 3), rrange(r, 1.5, 3)); c.fillStyle = pick(r, ['#c87a4a', '#d8c070', '#a8b0b8']); c.fill(); } }
  } },
  { id: 'coal_pile', name: t('Coal pile'), cat: 'workshop', w: 1.2, h: 1, layer: 1, tags: 'coal fuel black', draw: (c, r, w, h) => {
    for (let i = 0; i < 30; i++) { const k = 1 - i / 40, x = rrange(r, -w * 0.35, w * 0.35) * k, y = rrange(r, -h * 0.3, h * 0.3) * k; boulder(c, r, x, y, rrange(r, 4, 8), '#2e2c2c'); }
    void rock;
  } },
];

