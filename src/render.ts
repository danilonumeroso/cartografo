import { assets } from './assets';
import { WALL_TEX } from './engine';
import { CELL, CONDITIONS, Door, GridSettings, Label, Light, MapPath, Marker, Stamp, Token, TOKEN_CELLS, TOKEN_KIND_COLORS } from './model';
import type { MapRuntime } from './runtime';
import { STAMP_BY_ID, STAMP_PAD, stampImage } from './stamps';
import { getTexture } from './textures';
import { drawBuildings } from './buildings';
import { ctx2d, makeCanvas, pattern, rgba } from './util';
import { t } from './i18n';

export interface View { z: number; x: number; y: number }
export interface RenderOpts {
  player: boolean;
  fogAlpha: number;      // 0 = hidden
  markers: boolean;
  grid: boolean;
  tokens: boolean;
  ambientScale: number;  // 1 for players, lower for DM
  time: number;
  background: string | null;
  turn?: string | null;
  hoverToken?: string | null;
}

type C2D = CanvasRenderingContext2D;
const COND_ICON = new Map(CONDITIONS.map((c) => [c.id, c.icon]));
let lightCanvas: HTMLCanvasElement | null = null;

export function visibleRect(view: View, vw: number, vh: number) {
  return { x: -view.x / view.z, y: -view.y / view.z, w: vw / view.z, h: vh / view.z };
}

export function stampSize(s: Stamp): { w: number; h: number; pad: number; img: CanvasImageSource | null } {
  if (s.type.startsWith('asset:')) {
    const id = s.type.slice(6);
    const rec = assets.recs.get(id);
    const img = assets.imgs.get(id) || null;
    if (!rec) return { w: CELL, h: CELL, pad: 0, img: null };
    const w = rec.cells * CELL;
    return { w, h: (w * rec.h) / rec.w, pad: 0, img };
  }
  const def = STAMP_BY_ID.get(s.type);
  if (!def) return { w: CELL, h: CELL, pad: 0, img: null };
  return { w: def.w * CELL, h: def.h * CELL, pad: STAMP_PAD, img: stampImage(s.type, s.variant) };
}
export function stampLayer(s: Stamp) {
  if (s.type.startsWith('asset:')) return 1;
  return STAMP_BY_ID.get(s.type)?.layer ?? 1;
}

/** All active light sources: explicit lights + light-emitting stamps. */
export function allLights(rt: MapRuntime, player: boolean): Light[] {
  const out: Light[] = [...rt.doc.lights];
  for (const s of rt.doc.stamps) {
    if (s.hidden && player) continue;
    const def = STAMP_BY_ID.get(s.type);
    if (def?.light) out.push({ id: s.id, x: s.x, y: s.y, radius: def.light.radius * Math.sqrt(s.scale), color: def.light.color, intensity: def.light.intensity, flicker: true, stampId: s.id });
  }
  return out;
}

export function renderScene(ctx: C2D, rt: MapRuntime, view: View, vw: number, vh: number, dpr: number, o: RenderOpts) {
  const doc = rt.doc, W = rt.W, H = rt.H, z = view.z;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (o.background) { ctx.fillStyle = o.background; ctx.fillRect(0, 0, vw, vh); }
  else ctx.clearRect(0, 0, vw, vh);
  ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * view.x, dpr * view.y);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  if (o.background) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 40 * dpr; ctx.shadowOffsetY = 8 * dpr;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  ctx.drawImage(rt.engine.cache, 0, 0);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  const vis = visibleRect(view, vw, vh);

  const stamps = doc.stamps;
  if (doc.paths?.length) drawPaths(ctx, doc.paths);
  if (doc.buildings?.length) drawBuildings(ctx, doc.buildings, vis);
  drawStamps(ctx, stamps, 0, vis, o);
  drawWalls(ctx, rt);
  for (const d of doc.doors) drawDoor(ctx, d, o.player);
  drawStamps(ctx, stamps, 1, vis, o);
  drawStamps(ctx, stamps, 2, vis, o);
  drawLighting(ctx, rt, view, vw, vh, dpr, o);
  if (doc.weather && doc.weather !== 'none') drawWeather(ctx, rt, vis, o.time);
  if (o.grid && doc.grid.show && (!o.player || doc.grid.showPlayers)) drawGrid(ctx, rt, vis, z);
  for (const l of doc.labels) if (!(l.hidden && o.player)) drawLabel(ctx, l, !o.player && !!l.hidden);
  if (o.tokens) for (const t of doc.tokens) if (!(o.player && t.kind === 'pc')) drawToken(ctx, t, z, o);
  if (o.fogAlpha > 0 && doc.fogEnabled) {
    ctx.globalAlpha = o.fogAlpha;
    ctx.drawImage(rt.fog.img, 0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  if (o.tokens && o.player) for (const t of doc.tokens) if (t.kind === 'pc') drawToken(ctx, t, z, o);
  if (o.markers) for (const m of doc.markers) if (!(o.player && !m.visible)) drawMarker(ctx, m, z, !o.player && !m.visible);
  ctx.restore();
}

function drawStamps(ctx: C2D, stamps: Stamp[], layer: number, vis: { x: number; y: number; w: number; h: number }, o: RenderOpts) {
  for (const s of stamps) {
    if (stampLayer(s) !== layer) continue;
    if (s.hidden && o.player) continue;
    const { w, h, pad, img } = stampSize(s);
    const rad = (Math.max(w, h) / 2 + pad) * s.scale * 1.5;
    if (s.x + rad < vis.x || s.x - rad > vis.x + vis.w || s.y + rad < vis.y || s.y - rad > vis.y + vis.h) continue;
    if (!img) continue;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot);
    ctx.scale(s.scale * (s.flip ? -1 : 1), s.scale);
    if (s.hidden) ctx.globalAlpha = 0.5;
    ctx.drawImage(img, -w / 2 - pad, -h / 2 - pad, w + pad * 2, h + pad * 2);
    ctx.restore();
  }
}

export function drawWalls(ctx: C2D, rt: MapRuntime) {
  if (!rt.doc.walls.length) return;
  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const w of rt.doc.walls) {
    if (w.pts.length < 4) continue;
    const path = () => { ctx.beginPath(); for (let i = 0; i < w.pts.length; i += 2) ctx.lineTo(w.pts[i], w.pts[i + 1]); };
    path();
    ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
    ctx.strokeStyle = '#120d0a'; ctx.lineWidth = 22; ctx.stroke();
    ctx.shadowColor = 'transparent';
    const p = pattern(ctx, getTexture(WALL_TEX[w.style] ?? 'wall_stone'));
    p.setTransform(new DOMMatrix());
    path(); ctx.strokeStyle = p; ctx.lineWidth = 16; ctx.stroke();
  }
  ctx.restore();
}

export function drawDoor(ctx: C2D, d: Door, player: boolean) {
  if (d.kind === 'secret' && player && !d.open) return;
  const L = d.width * CELL, T = 24;
  ctx.save();
  ctx.translate(d.x, d.y); ctx.rotate(d.rot);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const grad = (y0: number, y1: number, a: string, b: string) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
  // threshold over the wall
  ctx.fillStyle = grad(-T / 2, T / 2, '#5a5248', '#3a342e');
  ctx.fillRect(-L / 2 + 6, -T / 2, L - 12, T);
  ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(-L / 2 + 6, -T / 2, L - 12, T);
  // jambs
  for (const s of [-1, 1]) {
    ctx.fillStyle = grad(-T / 2, T / 2, '#4a423a', '#1e1a16'); ctx.fillRect(s * (L / 2) - 8, -T / 2 - 2, 16, T + 4);
    ctx.strokeStyle = '#120d0a'; ctx.lineWidth = 1.5; ctx.strokeRect(s * (L / 2) - 8, -T / 2 - 2, 16, T + 4);
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(s * (L / 2) - 7, -T / 2 - 1, 14, 2);
  }
  const shadowOn = () => { ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 3; };
  const shadowOff = () => { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; };
  const leaf = (x0: number, len: number, dir: number) => {
    ctx.save();
    ctx.translate(x0, 0);
    if (d.open) ctx.rotate(dir * -1.25);
    const X = dir > 0 ? 0 : -len, free = dir > 0 ? len : -len;
    shadowOn();
    if (d.kind === 'iron') {
      ctx.fillStyle = '#4b5158'; ctx.fillRect(X, -3.5, len, 7); shadowOff();
      ctx.strokeStyle = '#1e2226'; ctx.lineWidth = 1.5; ctx.strokeRect(X, -3.5, len, 7);
      for (let i = 1; i < 7; i++) { const x = X + (len * i) / 7; ctx.fillStyle = '#2a2e33'; ctx.fillRect(x - 2, -8, 4, 16); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x - 2, -8, 1.2, 16); }
    } else if (d.kind === 'bars') {
      ctx.fillStyle = '#3a3e44'; ctx.fillRect(X, -4, len, 8); shadowOff();
      ctx.fillStyle = '#16181b'; ctx.fillRect(X + 3, -2, len - 6, 4);
      for (let i = 1; i < 8; i++) { const x = X + (len * i) / 8; ctx.beginPath(); ctx.arc(x, 0, 2.6, 0, Math.PI * 2); ctx.fillStyle = '#6a7078'; ctx.fill(); ctx.strokeStyle = '#16181b'; ctx.lineWidth = 1; ctx.stroke(); }
      ctx.fillStyle = '#8a7a3a'; ctx.fillRect(X + (dir > 0 ? len - 12 : 4), -6, 8, 12); ctx.strokeStyle = '#2a2410'; ctx.strokeRect(X + (dir > 0 ? len - 12 : 4), -6, 8, 12);
    } else if (d.kind === 'stone') {
      ctx.fillStyle = grad(-8, 8, '#a8a296', '#6a655c'); ctx.fillRect(X, -8, len, 16); shadowOff();
      ctx.strokeStyle = '#1c1814'; ctx.lineWidth = 2; ctx.strokeRect(X, -8, len, 16);
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.2; ctx.strokeRect(X + 3, -5, len - 6, 10);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.moveTo(X + len * 0.3, -8); ctx.lineTo(X + len * 0.36, 0); ctx.lineTo(X + len * 0.3, 8); ctx.stroke();
    } else {
      const secret = d.kind === 'secret';
      ctx.fillStyle = secret ? grad(-6, 6, '#7a746a', '#58524a') : grad(-6, 6, '#a8743f', '#6a4422');
      ctx.fillRect(X, -6, len, 12); shadowOff();
      ctx.strokeStyle = '#1c1510'; ctx.lineWidth = 2; ctx.strokeRect(X, -6, len, 12);
      ctx.strokeStyle = secret ? 'rgba(20,18,14,0.5)' : 'rgba(30,15,5,0.5)'; ctx.lineWidth = 1;
      const n = secret ? 3 : 5;
      for (let i = 1; i < n; i++) { const x = X + (len * i) / n; ctx.beginPath(); ctx.moveTo(x, -6); ctx.lineTo(x, 6); ctx.stroke(); }
      if (!secret) {
        ctx.strokeStyle = 'rgba(40,20,5,0.25)'; ctx.beginPath(); ctx.moveTo(X + 2, -2); ctx.quadraticCurveTo(X + len / 2, 0, X + len - 2, -2.5); ctx.moveTo(X + 2, 2.5); ctx.quadraticCurveTo(X + len / 2, 1, X + len - 2, 2); ctx.stroke();
        for (const k of [0.2, 0.75]) { const x = X + len * k; ctx.fillStyle = '#3a3e44'; ctx.fillRect(x - 2.5, -6.5, 5, 13); ctx.fillStyle = '#7a8088'; ctx.fillRect(x - 2.5, -6.5, 1.2, 13); }
        ctx.beginPath(); ctx.arc(free - dir * 9, 0, 3.2, 0, Math.PI * 2); ctx.strokeStyle = '#1c1510'; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 1.6; ctx.stroke();
      }
    }
    ctx.restore();
  };
  if (d.kind === 'arch') {
    ctx.fillStyle = grad(-T / 2, T / 2, '#7a746a', '#5a544c');
    ctx.fillRect(-L / 2 + 8, -T / 2 + 3, L - 16, T - 6);
    const n = Math.max(3, Math.round(L / 22));
    for (let i = 0; i < n; i++) { const x = -L / 2 + 8 + ((L - 16) * i) / n; ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.2; ctx.strokeRect(x, -T / 2 + 3, (L - 16) / n, T - 6); }
    ctx.fillStyle = '#8a847a'; ctx.fillRect(-7, -T / 2 + 1, 14, T - 2); ctx.strokeStyle = '#1c1814'; ctx.lineWidth = 1.5; ctx.strokeRect(-7, -T / 2 + 1, 14, T - 2);
  } else if (d.kind === 'curtain') {
    const bunch = d.open ? 0.18 : 0.5;
    for (const s of [-1, 1]) {
      const x0 = s * (L / 2 - 8), w = (L - 16) * bunch;
      ctx.save(); shadowOn();
      ctx.beginPath(); ctx.moveTo(x0, -5);
      const folds = Math.max(3, Math.round(w / 8));
      for (let i = 0; i <= folds; i++) { const x = x0 - s * (w * i) / folds; ctx.lineTo(x, i % 2 ? 7 : 3); }
      ctx.lineTo(x0 - s * w, -5); ctx.closePath();
      ctx.fillStyle = grad(-5, 7, '#9a2f3a', '#4a0e16'); ctx.fill(); shadowOff();
      ctx.strokeStyle = '#1c0a0c'; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1;
      for (let i = 1; i < folds; i++) { const x = x0 - s * (w * i) / folds; ctx.beginPath(); ctx.moveTo(x, -4); ctx.lineTo(x, i % 2 ? 6 : 3); ctx.stroke(); }
      ctx.restore();
    }
    ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-L / 2 + 8, -6); ctx.lineTo(L / 2 - 8, -6); ctx.stroke();
  } else if (d.kind === 'double') {
    leaf(-L / 2 + 8, L / 2 - 8, 1);
    leaf(L / 2 - 8, L / 2 - 8, -1);
  } else {
    leaf(-L / 2 + 8, L - 16, 1);
  }
  if (d.kind === 'secret' && !player) {
    ctx.fillStyle = '#ffe28a'; ctx.font = 'bold 22px Cinzel, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText('S', 0, 0); ctx.fillText('S', 0, 0);
  }
  ctx.restore();
}

/** Cheap integer hash in [0, 1). */
function hash01(n: number) { n = (n ^ 61) ^ (n >>> 16); n = Math.imul(n, 0x27d4eb2d); n ^= n >>> 15; return (n >>> 0) / 4294967296; }

/** Wind-driven particles over the whole map, deterministic in time so every screen agrees. */
function drawWeather(ctx: C2D, rt: MapRuntime, vis: { x: number; y: number; w: number; h: number }, time: number) {
  const kind = rt.doc.weather, W = rt.W, H = rt.H, sec = time / 1000;
  const perCell = { snow: 1.3, rain: 2.2, ash: 0.8, embers: 0.35, leaves: 0.25, none: 0 }[kind] ?? 0;
  const n = Math.min(4000, Math.round((W * H) / (CELL * CELL) * perCell));
  ctx.save();
  for (let i = 0; i < n; i++) {
    const a = hash01(i * 3 + 1), b = hash01(i * 3 + 2), c = hash01(i * 3 + 3);
    let x = 0, y = 0;
    const wrapIn = (vx: number, vy: number) => { x = (((a * W + vx * sec) % W) + W) % W; y = (((b * H + vy * sec) % H) + H) % H; };
    if (kind === 'snow') {
      const sp = 30 + c * 40; wrapIn(14 + c * 10, sp);
      x += Math.sin(sec * (0.8 + c) + i) * 10;
      if (x < vis.x - 10 || x > vis.x + vis.w + 10 || y < vis.y - 10 || y > vis.y + vis.h + 10) continue;
      const r = 1.6 + c * 3;
      ctx.fillStyle = `rgba(255,255,255,${0.55 + c * 0.4})`; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    } else if (kind === 'rain') {
      const sp = 900 + c * 500; wrapIn(sp * 0.25, sp);
      if (x < vis.x - 40 || x > vis.x + vis.w + 40 || y < vis.y - 40 || y > vis.y + vis.h + 40) continue;
      ctx.strokeStyle = `rgba(190,215,240,${0.25 + c * 0.3})`; ctx.lineWidth = 1 + c; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 7, y - 28); ctx.stroke();
      if (hash01(i + Math.floor(sec * 3)) < 0.04) { ctx.strokeStyle = 'rgba(200,225,250,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y, 6, 3, 0, 0, Math.PI * 2); ctx.stroke(); }
    } else if (kind === 'ash') {
      wrapIn(18 + c * 12, 12 + c * 14);
      x += Math.sin(sec * 0.6 + i) * 14; y += Math.cos(sec * 0.5 + i * 1.3) * 8;
      if (x < vis.x - 10 || x > vis.x + vis.w + 10 || y < vis.y - 10 || y > vis.y + vis.h + 10) continue;
      const g = 90 + c * 90;
      ctx.fillStyle = `rgba(${g},${g - 6},${g - 10},${0.45 + c * 0.35})`; ctx.beginPath(); ctx.ellipse(x, y, 2 + c * 2.5, 1.2 + c, sec + i, 0, Math.PI * 2); ctx.fill();
    } else if (kind === 'embers') {
      wrapIn(10 * Math.sin(i), -(25 + c * 35));
      x += Math.sin(sec * 1.7 + i) * 9;
      if (x < vis.x - 20 || x > vis.x + vis.w + 20 || y < vis.y - 20 || y > vis.y + vis.h + 20) continue;
      const f = 0.55 + 0.45 * Math.sin(sec * 6 + i * 2.1), r = 1.4 + c * 2.2;
      const gr = ctx.createRadialGradient(x, y, 0, x, y, r * 5); gr.addColorStop(0, `rgba(255,170,60,${0.55 * f})`); gr.addColorStop(1, 'rgba(255,90,20,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r * 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,${200 + c * 50},${120 + c * 60},${0.85 * f})`; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    } else if (kind === 'leaves') {
      wrapIn(45 + c * 30, 25 + c * 25);
      x += Math.sin(sec * 0.9 + i) * 18;
      if (x < vis.x - 20 || x > vis.x + vis.w + 20 || y < vis.y - 20 || y > vis.y + vis.h + 20) continue;
      const L = 9 + c * 7, rot = sec * (1 + c) + i, col = ['#c86a2a', '#e8a040', '#a83a1a', '#d8b040', '#8a5a2a'][i % 5];
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1, 0.55 + 0.45 * Math.abs(Math.sin(sec * 2 + i)));
      ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 4; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 6;
      ctx.beginPath(); ctx.moveTo(-L / 2, 0); ctx.quadraticCurveTo(0, -L * 0.4, L / 2, 0); ctx.quadraticCurveTo(0, L * 0.4, -L / 2, 0); ctx.fillStyle = col; ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawGrid(ctx: C2D, rt: MapRuntime, vis: { x: number; y: number; w: number; h: number }, z: number) {
  const g = rt.doc.grid;
  if (g.shape === 'hex') { drawHexGrid(ctx, rt, vis, z); return; }
  const x0 = Math.max(0, Math.floor(vis.x / CELL)), x1 = Math.min(rt.doc.cols, Math.ceil((vis.x + vis.w) / CELL));
  const y0 = Math.max(0, Math.floor(vis.y / CELL)), y1 = Math.min(rt.doc.rows, Math.ceil((vis.y + vis.h) / CELL));
  ctx.save();
  ctx.strokeStyle = rgba(g.color, g.opacity);
  ctx.lineWidth = Math.max(1 / z, 1.5);
  ctx.beginPath();
  for (let x = x0; x <= x1; x++) { ctx.moveTo(x * CELL, y0 * CELL); ctx.lineTo(x * CELL, y1 * CELL); }
  for (let y = y0; y <= y1; y++) { ctx.moveTo(x0 * CELL, y * CELL); ctx.lineTo(x1 * CELL, y * CELL); }
  ctx.stroke();
  ctx.restore();
}

/** Pointy-top hexes, one cell wide: neighbouring centres are exactly one cell apart. */
export const HEX_R = CELL / Math.sqrt(3);
function drawHexGrid(ctx: C2D, rt: MapRuntime, vis: { x: number; y: number; w: number; h: number }, z: number) {
  const g = rt.doc.grid, dy = HEX_R * 1.5;
  const r0 = Math.max(0, Math.floor(vis.y / dy) - 1), r1 = Math.min(Math.ceil(rt.H / dy), Math.ceil((vis.y + vis.h) / dy) + 1);
  const c0 = Math.max(-1, Math.floor(vis.x / CELL) - 1), c1 = Math.min(Math.ceil(rt.W / CELL), Math.ceil((vis.x + vis.w) / CELL) + 1);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, rt.W, rt.H); ctx.clip();
  ctx.strokeStyle = rgba(g.color, g.opacity);
  ctx.lineWidth = Math.max(1 / z, 1.6);
  ctx.beginPath();
  for (let row = r0; row <= r1; row++) for (let col = c0; col <= c1; col++) {
    const cx = col * CELL + (row % 2 ? CELL / 2 : 0), cy = row * dy;
    // three edges per hex, so shared edges are stroked once
    for (let k = 3; k <= 6; k++) {
      const a = (Math.PI / 3) * k - Math.PI / 2, px = cx + Math.cos(a) * HEX_R, py = cy + Math.sin(a) * HEX_R;
      k === 3 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
  }
  ctx.stroke();
  ctx.restore();
}

/** Smooth polyline through the points (quadratic curves via midpoints). */
function smoothPath(ctx: C2D, pts: number[]) {
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  if (pts.length === 4) { ctx.lineTo(pts[2], pts[3]); return; }
  for (let i = 2; i < pts.length - 2; i += 2) ctx.quadraticCurveTo(pts[i], pts[i + 1], (pts[i] + pts[i + 2]) / 2, (pts[i + 1] + pts[i + 3]) / 2);
  ctx.lineTo(pts[pts.length - 2], pts[pts.length - 1]);
}

/** Chaikin corner cutting: rounds a polyline while keeping its end points. */
export function chaikin(pts: number[], iterations = 2): number[] {
  let p = pts;
  for (let it = 0; it < iterations; it++) {
    if (p.length < 6) return p;
    const out = [p[0], p[1]];
    for (let i = 0; i < p.length - 2; i += 2) {
      const x0 = p[i], y0 = p[i + 1], x1 = p[i + 2], y1 = p[i + 3];
      out.push(x0 * 0.75 + x1 * 0.25, y0 * 0.75 + y1 * 0.25, x0 * 0.25 + x1 * 0.75, y0 * 0.25 + y1 * 0.75);
    }
    out.push(p[p.length - 2], p[p.length - 1]);
    p = out;
  }
  return p;
}

/** Rivers, roads, trails and borders on world maps. */
export function drawPaths(ctx: C2D, paths: MapPath[]) {
  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const order: Record<string, number> = { border: 0, river: 1, road: 2, trail: 3, citywall: 4 };
  for (const p of [...paths].sort((a, b) => order[a.kind] - order[b.kind])) {
    if (p.pts.length < 4) continue;
    const w = p.width;
    if (p.kind === 'river') {
      // widen from source to mouth by drawing short runs of growing width along a rounded line
      const sp = chaikin(p.pts, 3), n = sp.length / 2, run = 6;
      for (const [col, extra] of [['#1c2a34', 3], ['#5a9dbc', 0], ['rgba(220,245,255,0.5)', -w * 0.62]] as const) {
        for (let i = 0; i < n - 1; i += run) {
          const k = 0.35 + 0.65 * (i / Math.max(1, n - 2));
          ctx.beginPath(); ctx.moveTo(sp[i * 2], sp[i * 2 + 1]);
          for (let j = i + 1; j <= Math.min(n - 1, i + run); j++) ctx.lineTo(sp[j * 2], sp[j * 2 + 1]);
          ctx.strokeStyle = col; ctx.lineWidth = Math.max(0.8, w * k + extra); ctx.stroke();
        }
      }
    } else if (p.kind === 'road') {
      smoothPath(ctx, p.pts); ctx.strokeStyle = 'rgba(60,40,20,0.55)'; ctx.lineWidth = w + 3; ctx.stroke();
      smoothPath(ctx, p.pts); ctx.strokeStyle = '#c9a874'; ctx.lineWidth = w; ctx.stroke();
      ctx.setLineDash([w * 1.6, w * 1.4]); smoothPath(ctx, p.pts); ctx.strokeStyle = 'rgba(110,80,40,0.55)'; ctx.lineWidth = Math.max(1, w * 0.25); ctx.stroke(); ctx.setLineDash([]);
    } else if (p.kind === 'citywall') {
      // thick stone curtain wall with a walkway and round towers at the corners
      smoothPath(ctx, p.pts); ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 14; ctx.shadowOffsetX = 6; ctx.shadowOffsetY = 8;
      ctx.strokeStyle = '#1c1814'; ctx.lineWidth = w + 6; ctx.stroke();
      ctx.shadowColor = 'transparent';
      ctx.beginPath(); for (let i = 0; i < p.pts.length; i += 2) ctx.lineTo(p.pts[i], p.pts[i + 1]);
      ctx.strokeStyle = '#9a948a'; ctx.lineWidth = w; ctx.stroke();
      ctx.strokeStyle = '#b8b2a6'; ctx.lineWidth = w * 0.45; ctx.stroke();
      ctx.setLineDash([w * 0.35, w * 0.35]); ctx.strokeStyle = 'rgba(40,35,30,0.55)'; ctx.lineWidth = w * 0.18;
      ctx.beginPath(); for (let i = 0; i < p.pts.length; i += 2) ctx.lineTo(p.pts[i], p.pts[i + 1]); ctx.stroke(); ctx.setLineDash([]);
      ctx.lineCap = 'round';
      for (let i = 0; i < p.pts.length; i += 2) {
        const x = p.pts[i], y = p.pts[i + 1], R = w * 0.95;
        ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 12; ctx.shadowOffsetX = 5; ctx.shadowOffsetY = 7;
        ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fillStyle = '#8a847a'; ctx.fill();
        ctx.shadowColor = 'transparent';
        const g = ctx.createRadialGradient(x - R * 0.3, y - R * 0.3, R * 0.1, x, y, R); g.addColorStop(0, '#c8c2b6'); g.addColorStop(1, '#7a746a');
        ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = '#1c1814'; ctx.lineWidth = 2.4; ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, R * 0.62, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(40,35,30,0.45)'; ctx.lineWidth = R * 0.18; ctx.setLineDash([R * 0.22, R * 0.18]); ctx.stroke(); ctx.setLineDash([]);
      }
    } else if (p.kind === 'trail') {
      ctx.setLineDash([w * 0.4, w * 1.6]); smoothPath(ctx, p.pts); ctx.strokeStyle = 'rgba(70,45,20,0.85)'; ctx.lineWidth = w; ctx.stroke(); ctx.setLineDash([]);
    } else {
      smoothPath(ctx, p.pts); ctx.strokeStyle = 'rgba(150,40,90,0.18)'; ctx.lineWidth = w * 3.5; ctx.stroke();
      ctx.setLineDash([w * 2.2, w * 1.2, w * 0.4, w * 1.2]); smoothPath(ctx, p.pts); ctx.strokeStyle = 'rgba(120,30,70,0.85)'; ctx.lineWidth = w * 0.7; ctx.stroke(); ctx.setLineDash([]);
    }
  }
  ctx.restore();
}

function drawLighting(ctx: C2D, rt: MapRuntime, view: View, vw: number, vh: number, dpr: number, o: RenderOpts) {
  const amb = rt.doc.ambient * o.ambientScale;
  const lights = allLights(rt, o.player);
  if (amb <= 0.01 && !lights.length) return;
  const z = view.z;
  const flick = (l: Light) => l.flicker ? 1 + 0.035 * Math.sin(o.time * 0.009 + l.x * 0.13) + 0.02 * Math.sin(o.time * 0.023 + l.y) : 1;
  if (amb > 0.01) {
    const cw = Math.ceil(vw * dpr), ch = Math.ceil(vh * dpr);
    if (!lightCanvas) lightCanvas = makeCanvas(cw, ch);
    if (lightCanvas.width !== cw || lightCanvas.height !== ch) { lightCanvas.width = cw; lightCanvas.height = ch; }
    const lc = ctx2d(lightCanvas);
    lc.setTransform(1, 0, 0, 1, 0, 0);
    lc.clearRect(0, 0, cw, ch);
    lc.setTransform(dpr * z, 0, 0, dpr * z, dpr * view.x, dpr * view.y);
    lc.fillStyle = `rgba(6,8,20,${amb})`;
    lc.fillRect(0, 0, rt.W, rt.H);
    lc.globalCompositeOperation = 'destination-out';
    for (const l of lights) {
      const R = l.radius * CELL * flick(l);
      const g = lc.createRadialGradient(l.x, l.y, 0, l.x, l.y, R);
      g.addColorStop(0, `rgba(0,0,0,${l.intensity})`);
      g.addColorStop(0.55, `rgba(0,0,0,${l.intensity * 0.75})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      lc.fillStyle = g;
      lc.beginPath(); lc.arc(l.x, l.y, R, 0, Math.PI * 2); lc.fill();
    }
    lc.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(lightCanvas, 0, 0);
    ctx.restore();
  }
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (const l of lights) {
    const R = l.radius * CELL * 0.8 * flick(l);
    const g = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, R);
    g.addColorStop(0, rgba(l.color, 0.32 * l.intensity * (0.4 + amb)));
    g.addColorStop(1, rgba(l.color, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(l.x, l.y, R, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function labelFont(l: Label) {
  return `${l.italic ? 'italic ' : ''}${l.bold ? '700 ' : ''}${l.size}px "${l.font}", serif`;
}
export function drawLabel(ctx: C2D, l: Label, dim = false) {
  ctx.save();
  ctx.translate(l.x, l.y); ctx.rotate(l.rot);
  ctx.font = labelFont(l);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (dim) ctx.globalAlpha = 0.85;
  const lines = l.text.split('\n');
  const lh = l.size * 1.15;
  lines.forEach((t, i) => {
    const y = (i - (lines.length - 1) / 2) * lh;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = l.stroke; ctx.lineWidth = Math.max(2, l.size * 0.18);
    ctx.strokeText(t, 0, y);
    ctx.fillStyle = l.color;
    ctx.fillText(t, 0, y);
  });
  ctx.restore();
}

export function markerGeom(m: Marker, z: number) {
  const s = 30 / z;
  return { s, cx: m.x, cy: m.y - s * 0.62, r: s * 0.42 };
}
export function drawMarker(ctx: C2D, m: Marker, z: number, hidden: boolean) {
  const { s, cx, cy, r } = markerGeom(m, z);
  ctx.save();
  if (hidden) ctx.globalAlpha = 0.6;
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI * 0.82, Math.PI * 0.18);
  ctx.lineTo(m.x, m.y);
  ctx.closePath();
  ctx.fillStyle = m.color; ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 2 / z; ctx.strokeStyle = '#fff';
  if (hidden) ctx.setLineDash([4 / z, 3 / z]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = `${r * 1.15}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(m.icon, cx, cy + r * 0.05);
  if (m.title && z > 0.25) {
    ctx.font = `600 ${12 / z}px system-ui, sans-serif`;
    ctx.lineWidth = 3 / z; ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.fillStyle = '#fff';
    ctx.strokeText(m.title, cx, m.y + 9 / z);
    ctx.fillText(m.title, cx, m.y + 9 / z);
  }
  ctx.restore();
  void s;
}

export function tokenRadius(t: Token) { return (TOKEN_CELLS[t.size] * CELL) / 2 * 0.9; }

export function drawToken(ctx: C2D, t: Token, z: number, o: RenderOpts) {
  if (o.player && t.hidden) return;
  const R = tokenRadius(t);
  const dead = t.maxHp > 0 && t.hp <= 0;
  ctx.save();
  ctx.translate(t.x, t.y);
  if (t.hidden) ctx.globalAlpha = 0.55;
  if (o.turn === t.id) {
    const pulse = 1 + 0.06 * Math.sin(o.time * 0.006);
    const g = ctx.createRadialGradient(0, 0, R * 0.9, 0, 0, R * 1.45 * pulse);
    g.addColorStop(0, 'rgba(255,210,80,0.9)'); g.addColorStop(1, 'rgba(255,210,80,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R * 1.45 * pulse, 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.fillStyle = t.color; ctx.fill();
  ctx.shadowColor = 'transparent';
  const img = t.image ? assets.imgs.get(t.image) : undefined;
  ctx.save();
  ctx.beginPath(); ctx.arc(0, 0, R * 0.88, 0, Math.PI * 2); ctx.clip();
  if (img) {
    const k = Math.max((R * 2) / img.width, (R * 2) / img.height);
    ctx.drawImage(img, (-img.width * k) / 2, (-img.height * k) / 2, img.width * k, img.height * k);
  } else {
    const g = ctx.createRadialGradient(-R * 0.3, -R * 0.4, R * 0.1, 0, 0, R);
    g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = g; ctx.fillRect(-R, -R, R * 2, R * 2);
    const initials = t.name.split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';
    ctx.fillStyle = '#fff'; ctx.font = `700 ${R * (initials.length > 1 ? 0.72 : 0.95)}px Cinzel, serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = R * 0.08; ctx.strokeText(initials, 0, R * 0.05);
    ctx.fillText(initials, 0, R * 0.05);
  }
  if (dead) { ctx.fillStyle = 'rgba(20,0,0,0.55)'; ctx.fillRect(-R, -R, R * 2, R * 2); }
  ctx.restore();
  ctx.lineWidth = R * 0.13; ctx.strokeStyle = TOKEN_KIND_COLORS[t.kind];
  ctx.beginPath(); ctx.arc(0, 0, R * 0.93, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = Math.max(1.5, R * 0.03); ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();
  if (dead) {
    ctx.strokeStyle = '#d33'; ctx.lineWidth = R * 0.14; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-R * 0.45, -R * 0.45); ctx.lineTo(R * 0.45, R * 0.45); ctx.moveTo(R * 0.45, -R * 0.45); ctx.lineTo(-R * 0.45, R * 0.45); ctx.stroke();
  }
  // HP bar
  // Health is DM-only: players never see HP bars, only conditions.
  const showHp = t.maxHp > 0 && !o.player;
  if (showHp) {
    const bw = R * 1.5, bh = Math.max(7, R * 0.16), by = R + 4;
    const f = Math.max(0, Math.min(1, t.hp / t.maxHp));
    ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(-bw / 2 - 2, by - 2, bw + 4, bh + 4);
    ctx.fillStyle = f > 0.5 ? '#3fbf5a' : f > 0.25 ? '#e0b030' : '#e04040';
    ctx.fillRect(-bw / 2, by, bw * f, bh);
  }
  // conditions
  const conds = t.conditions.slice(0, 6);
  conds.forEach((c, i) => {
    const a = -Math.PI / 4 + i * 0.55;
    const cr = Math.max(9, R * 0.24);
    const x = Math.cos(a) * R, y = Math.sin(a) * R - (i > 2 ? 0 : 0);
    ctx.fillStyle = 'rgba(15,15,20,0.85)'; ctx.beginPath(); ctx.arc(x, y, cr, 0, Math.PI * 2); ctx.fill();
    ctx.font = `${cr * 1.2}px system-ui, "Apple Color Emoji", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(COND_ICON.get(c) || '•', x, y + cr * 0.05);
  });
  // name
  if (z * R > 18 || o.hoverToken === t.id) {
    const fs = Math.max(12 / z, R * 0.3);
    ctx.font = `600 ${fs}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const y = R + (showHp ? Math.max(7, R * 0.16) + 8 : 4);
    ctx.lineWidth = fs * 0.25; ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.strokeText(t.name, 0, y);
    ctx.fillStyle = '#fff'; ctx.fillText(t.name, 0, y);
  }
  ctx.restore();
}

export function drawPing(ctx: C2D, x: number, y: number, age: number, z: number) {
  const k = age / 1600;
  if (k >= 1) return;
  ctx.save();
  for (let i = 0; i < 3; i++) {
    const kk = (k + i * 0.18) % 1;
    ctx.globalAlpha = (1 - kk) * (1 - k * 0.5);
    ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 4 / z;
    ctx.beginPath(); ctx.arc(x, y, (10 + kk * 70) / z, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.globalAlpha = 1 - k;
  ctx.fillStyle = '#ffd34d';
  ctx.beginPath(); ctx.arc(x, y, 6 / z, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/** Distance label for a ruler: grid squares (5e diagonals) or straight-line travel on world maps. */
export function measureText(a: [number, number], b: [number, number], g: Pick<GridSettings, 'feet' | 'unit' | 'shape'>) {
  const unit = g.unit || 'ft';
  if (unit === 'ft' && g.shape !== 'hex') {
    const dx = Math.abs(b[0] - a[0]) / CELL, dy = Math.abs(b[1] - a[1]) / CELL;
    // D&D 5e grid distance: every diagonal counts as 1 square
    const squares = Math.round(Math.max(dx, dy));
    return t(squares === 1 ? '{ft} ft · {n} square' : '{ft} ft · {n} squares', { ft: squares * g.feet, n: squares });
  }
  const cells = Math.hypot(b[0] - a[0], b[1] - a[1]) / CELL, dist = cells * g.feet;
  const d = dist >= 100 ? Math.round(dist) : Math.round(dist * 10) / 10;
  // 5e travel pace: 24 miles (about 38 km) a day at a normal pace
  const days = unit === 'ft' || unit === 'm' ? 0 : dist / (unit === 'mi' ? 24 : 38);
  const base = `${d} ${unit}`;
  return days >= 0.1 ? t('{dist} · {days} days on foot', { dist: base, days: Math.round(days * 10) / 10 }) : base;
}

export function drawMeasure(ctx: C2D, a: [number, number], b: [number, number], z: number, grid: Pick<GridSettings, 'feet' | 'unit' | 'shape'>) {
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 6 / z; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 3 / z; ctx.setLineDash([10 / z, 6 / z]);
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  ctx.setLineDash([]);
  for (const p of [a, b]) { ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.arc(p[0], p[1], 5 / z, 0, Math.PI * 2); ctx.fill(); }
  const txt = measureText(a, b, grid);
  ctx.font = `700 ${15 / z}px system-ui, sans-serif`;
  const tw = ctx.measureText(txt).width;
  const mx = b[0] + 14 / z, my = b[1] - 14 / z;
  ctx.fillStyle = 'rgba(15,15,20,0.88)';
  ctx.beginPath(); ctx.roundRect(mx - 6 / z, my - 13 / z, tw + 12 / z, 26 / z, 6 / z); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText(txt, mx, my);
  ctx.restore();
}
