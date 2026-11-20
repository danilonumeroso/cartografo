import { assets } from './assets';
import { Channel, Msg } from './channel';
import { h } from './dom';
import { CELL, CONDITIONS, MapDoc, Marker, TOKEN_KIND_COLORS } from './model';
import { drawMeasure, drawPing, markerGeom, renderScene, View } from './render';
import { MapRuntime } from './runtime';
import { getMap } from './storage';
import { clamp, nextFrame } from './util';

const LS = 'cartografo-player';
interface Prefs { ppi: number; real: boolean; rot: number }
function loadPrefs(): Prefs {
  try { return { ppi: 96, real: false, rot: 0, ...JSON.parse(localStorage.getItem(LS) || '{}') }; } catch { return { ppi: 96, real: false, rot: 0 }; }
}

export class Player {
  root: HTMLElement;
  canvas = h('canvas', { class: 'player-canvas' });
  ctx = this.canvas.getContext('2d')!;
  rt: MapRuntime | null = null;
  view: View = { z: 0.3, x: 0, y: 0 };
  target: { view: View; t0: number; from: View } | null = null;
  dpr = 1; vw = 1; vh = 1;
  prefs = loadPrefs();
  channel: Channel;
  pings: { x: number; y: number; t: number }[] = [];
  measure: { a: [number, number]; b: [number, number] } | null = null;
  needRender = true;
  waiting = h('div', { class: 'player-wait' }, h('div', { class: 'brand-mark big' }, '⚔'), h('h1', null, 'Vista giocatori'), h('p', null, 'In attesa del Dungeon Master…'), h('small', null, 'Apri questa finestra dal pulsante "📺 Vista giocatori" dell\'editor.'));
  initBar = h('div', { class: 'init-bar', hidden: true });
  popup = h('div', { class: 'popup', hidden: true });
  gear = h('button', { class: 'player-gear', title: 'Impostazioni schermo', onclick: () => this.settings() }, '⚙');
  private drag: any = null;
  private lastMove = 0;
  private lastLastDoc = '';

  constructor(root: HTMLElement) {
    this.root = root;
    this.channel = new Channel((m) => this.onMsg(m));
  }

  async init() {
    document.title = 'Vista giocatori · Cartografo';
    this.root.classList.add('player');
    this.root.append(this.canvas, this.initBar, this.popup, this.gear, this.waiting);
    await assets.loadAll();
    window.addEventListener('resize', () => this.layout());
    this.layout();
    const c = this.canvas;
    c.addEventListener('pointerdown', (e) => this.onDown(e));
    c.addEventListener('pointermove', (e) => this.onMove(e));
    c.addEventListener('pointerup', () => { this.drag = null; });
    c.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    c.addEventListener('dblclick', () => this.toggleFull());
    window.addEventListener('keydown', (e) => {
      if (e.key === 'f' || e.key === 'F') this.toggleFull();
      if (e.key === 'Escape') this.popup.hidden = true;
    });
    window.addEventListener('pointermove', () => { this.lastMove = performance.now(); this.gear.classList.add('show'); });
    window.addEventListener('beforeunload', () => this.channel.send({ t: 'pbye' }));
    this.channel.send({ t: 'hello' });
    requestAnimationFrame(this.loop);
  }

  toggleFull() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }

  savePrefs() { localStorage.setItem(LS, JSON.stringify(this.prefs)); }

  layout() {
    const W = window.innerWidth, H = window.innerHeight;
    const rot = ((this.prefs.rot % 360) + 360) % 360;
    const side = rot % 180 !== 0;
    const cw = side ? H : W, ch = side ? W : H;
    this.dpr = window.devicePixelRatio || 1;
    const oldW = this.vw, oldH = this.vh;
    this.vw = cw; this.vh = ch;
    this.canvas.width = Math.round(cw * this.dpr);
    this.canvas.height = Math.round(ch * this.dpr);
    Object.assign(this.canvas.style, { width: cw + 'px', height: ch + 'px', left: (W - cw) / 2 + 'px', top: (H - ch) / 2 + 'px', transform: `rotate(${rot}deg)` });
    this.initBar.style.transform = `rotate(${rot}deg)`;
    // keep the same world point centered
    this.view.x += (cw - oldW) / 2; this.view.y += (ch - oldH) / 2;
    if (this.prefs.real) this.view.z = this.realZ();
    this.needRender = true;
  }
  realZ() { return this.prefs.ppi / CELL; }

  /** Screen (client) coords → canvas local coords, accounting for CSS rotation. */
  local(e: { clientX: number; clientY: number }): [number, number] {
    const W = window.innerWidth, H = window.innerHeight;
    const dx = e.clientX - W / 2, dy = e.clientY - H / 2;
    const a = (-this.prefs.rot * Math.PI) / 180;
    return [dx * Math.cos(a) - dy * Math.sin(a) + this.vw / 2, dx * Math.sin(a) + dy * Math.cos(a) + this.vh / 2];
  }
  toWorld(e: { clientX: number; clientY: number }): [number, number] {
    const [x, y] = this.local(e);
    return [(x - this.view.x) / this.view.z, (y - this.view.y) / this.view.z];
  }

  async onMsg(m: Msg) {
    switch (m.t) {
      case 'map': await this.load(m.id); break;
      case 'doc': if (this.rt && m.doc.id === this.rt.doc.id) this.applyDoc(m.doc); break;
      case 'fog': if (this.rt && m.mapId === this.rt.doc.id) { this.rt.fog.applyPatch(m.x, m.y, m.data); this.needRender = true; } break;
      case 'view': if (this.rt && m.mapId === this.rt.doc.id) this.goTo(m.cx, m.cy, m.w, m.h); break;
      case 'ping': this.pings.push({ x: m.x, y: m.y, t: performance.now() }); break;
      case 'measure': this.measure = m.a && m.b ? { a: m.a, b: m.b } : null; this.needRender = true; break;
      case 'bye': this.rt = null; this.waiting.hidden = false; break;
      case 'dmhello': this.channel.send({ t: 'hello' }); break;
    }
  }

  async load(id: string) {
    const rec = await getMap(id);
    if (!rec) return;
    for (const s of [...rec.doc.stamps, ...rec.doc.tokens] as any[]) {
      const aid = s.type?.startsWith?.('asset:') ? s.type.slice(6) : s.image;
      if (aid && !assets.recs.has(aid)) { await assets.loadAll(); break; }
    }
    const first = !this.rt;
    const keepView = this.rt?.doc.id === id ? { ...this.view } : null;
    const rt = await MapRuntime.load(rec);
    await nextFrame();
    rt.engine.flush();
    this.rt = rt;
    this.lastLastDoc = this.renderKey(rt.doc);
    this.waiting.hidden = true;
    if (keepView) this.view = keepView; else this.fit();
    this.needRender = true;
    this.channel.send({ t: 'ready', mapId: id });
    void first;
  }

  private renderKey(d: MapDoc) { return JSON.stringify([d.bg, d.caveFloor, d.wallStyle, d.cols, d.rows]); }

  applyDoc(doc: MapDoc) {
    const rt = this.rt!;
    const key = this.renderKey(doc);
    if (doc.cols !== rt.doc.cols || doc.rows !== rt.doc.rows) return; // a full reload message will follow
    const before = new Map(rt.doc.rooms.map((r) => [r.id, JSON.stringify(r)]));
    const after = new Map(doc.rooms.map((r) => [r.id, JSON.stringify(r)]));
    for (const id of new Set([...before.keys(), ...after.keys()])) {
      if (before.get(id) === after.get(id)) continue;
      const a = rt.doc.rooms.find((r) => r.id === id), b = doc.rooms.find((r) => r.id === id);
      if (a) rt.engine.invalidateRooms(a.pts);
      if (b) rt.engine.invalidateRooms(b.pts);
    }
    Object.assign(rt.doc, doc);
    if (key !== this.lastLastDoc) { rt.engine.invalidateAll(); this.lastLastDoc = key; }
    this.updateInitBar();
    this.needRender = true;
  }

  fit() {
    if (!this.rt) return;
    this.goTo(this.rt.W / 2, this.rt.H / 2, this.rt.W, this.rt.H, false);
  }
  goTo(cx: number, cy: number, w: number, h: number, animate = true) {
    const z = this.prefs.real ? this.realZ() : clamp(Math.min(this.vw / w, this.vh / h), 0.02, 8);
    const v: View = { z, x: this.vw / 2 - cx * z, y: this.vh / 2 - cy * z };
    if (!animate) { this.view = v; this.target = null; }
    else this.target = { view: v, from: { ...this.view }, t0: performance.now() };
    this.needRender = true;
  }

  onDown(e: PointerEvent) {
    this.canvas.setPointerCapture(e.pointerId);
    this.popup.hidden = true;
    const [x, y] = this.toWorld(e);
    if (this.rt) {
      for (const m of this.rt.doc.markers) {
        if (!m.visible) continue;
        const g = markerGeom(m, this.view.z);
        if (Math.hypot(x - g.cx, y - g.cy) < g.r * 1.3) { this.showMarker(m, e); return; }
      }
    }
    this.drag = { p: this.local(e), v: { ...this.view } };
    this.target = null;
  }
  onMove(e: PointerEvent) {
    if (!this.drag) return;
    const [x, y] = this.local(e);
    this.view.x = this.drag.v.x + x - this.drag.p[0];
    this.view.y = this.drag.v.y + y - this.drag.p[1];
    this.needRender = true;
  }
  onWheel(e: WheelEvent) {
    e.preventDefault();
    if (this.prefs.real) return;
    const [sx, sy] = this.local(e);
    const k = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018));
    const nz = clamp(this.view.z * k, 0.02, 8);
    const wx = (sx - this.view.x) / this.view.z, wy = (sy - this.view.y) / this.view.z;
    this.view = { z: nz, x: sx - wx * nz, y: sy - wy * nz };
    this.target = null;
    this.needRender = true;
  }

  showMarker(m: Marker, e: PointerEvent) {
    this.popup.innerHTML = '';
    this.popup.append(
      h('div', { class: 'popup-head' }, h('span', { class: 'popup-icon' }, m.icon), h('strong', null, m.title)),
      m.playerNotes ? h('div', { class: 'popup-notes' }, m.playerNotes) : '');
    this.popup.style.left = Math.min(window.innerWidth - 300, e.clientX + 12) + 'px';
    this.popup.style.top = Math.min(window.innerHeight - 160, e.clientY + 12) + 'px';
    this.popup.hidden = false;
  }

  updateInitBar() {
    const cb = this.rt?.doc.combat;
    if (!cb || !cb.active) { this.initBar.hidden = true; return; }
    const toks = new Map(this.rt!.doc.tokens.map((t) => [t.id, t]));
    this.initBar.innerHTML = '';
    this.initBar.append(h('div', { class: 'init-round' }, `Round ${cb.round}`));
    for (const id of cb.members) {
      const t = toks.get(id);
      if (!t || t.hidden) continue;
      // No health info for players: only name and conditions.
      const conds = t.conditions.map((c) => CONDITIONS.find((x) => x.id === c)).filter(Boolean);
      this.initBar.append(h('div', { class: 'init-chip' + (cb.turn === id ? ' turn' : '') + (t.hp <= 0 && t.maxHp > 0 ? ' dead' : '') },
        h('span', { class: 'dot', style: { background: TOKEN_KIND_COLORS[t.kind] } }), h('b', null, t.name),
        conds.length ? h('span', { class: 'init-chip-conds' }, ...conds.map((c) => h('span', { title: c!.name }, c!.icon))) : null));
    }
    this.initBar.hidden = false;
  }

  settings() {
    document.querySelector('.player-settings')?.remove();
    const p = this.prefs;
    const card = h('div', { class: 'card-proxy' });
    const sizeCard = () => { card.style.width = 3.37 * p.ppi + 'px'; card.style.height = 2.125 * p.ppi + 'px'; };
    sizeCard();
    const ppiOut = h('span', null, String(Math.round(p.ppi)));
    const setPpi = (v: number) => { p.ppi = clamp(v, 20, 400); ppiOut.textContent = String(Math.round(p.ppi)); range.value = String(p.ppi); sizeCard(); this.savePrefs(); if (p.real) { this.view.z = this.realZ(); this.needRender = true; } };
    const range = h('input', { type: 'range', min: 20, max: 400, step: 0.5, value: p.ppi, oninput: () => setPpi(+range.value) });
    const diag = h('input', { type: 'number', placeholder: 'es. 55', min: 5, max: 120, step: 0.5 });
    const box = h('div', { class: 'player-settings modal' },
      h('header', null, h('h2', null, 'Impostazioni schermo'), h('button', { class: 'icon-btn', onclick: () => box.remove() }, '✕')),
      h('div', { class: 'modal-body' },
        h('h3', null, 'Orientamento'),
        h('div', { class: 'seg' }, ...[0, 90, 180, 270].map((r) => h('button', { class: p.rot === r ? 'on' : '', onclick: (e: MouseEvent) => { p.rot = r; this.savePrefs(); this.layout(); (e.currentTarget as HTMLElement).parentElement!.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === e.currentTarget)); } }, r + '°'))),
        h('p', { class: 'hint' }, 'Con la TV sdraiata sul tavolo ruota di 180° per chi siede dall\'altra parte.'),
        h('h3', null, 'Scala reale (miniature)'),
        h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: p.real, onchange: (e: Event) => { p.real = (e.target as HTMLInputElement).checked; this.savePrefs(); this.view.z = p.real ? this.realZ() : this.view.z; this.needRender = true; } }), h('span', null, '1 casella = 1 pollice (2,54 cm)')),
        h('p', { class: 'hint' }, 'Appoggia una carta di credito sul rettangolo e regola finché coincide perfettamente.'),
        card,
        h('div', { class: 'row' }, h('button', { class: 'btn small', onclick: () => setPpi(p.ppi - 1) }, '−'), range, h('button', { class: 'btn small', onclick: () => setPpi(p.ppi + 1) }, '+'), ppiOut, h('small', null, 'px/pollice')),
        h('div', { class: 'row' }, h('span', null, 'Oppure diagonale dello schermo (pollici):'), diag,
          h('button', { class: 'btn small', onclick: () => { const d = +diag.value; if (d > 0) setPpi(Math.hypot(screen.width, screen.height) / d); } }, 'Calcola')),
        h('h3', null, 'Schermo intero'),
        h('button', { class: 'btn', onclick: () => this.toggleFull() }, '⛶ Schermo intero (F)')));
    document.body.appendChild(box);
  }

  private loop = (t: number) => {
    requestAnimationFrame(this.loop);
    if (performance.now() - this.lastMove > 2500) this.gear.classList.remove('show');
    const rt = this.rt;
    if (!rt) return;
    if (rt.engine.flush()) this.needRender = true;
    if (this.target) {
      const k = Math.min(1, (t - this.target.t0) / 450), e = 1 - Math.pow(1 - k, 3);
      const a = this.target.from, b = this.target.view;
      this.view = { z: a.z + (b.z - a.z) * e, x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e };
      if (k >= 1) this.target = null;
      this.needRender = true;
    }
    const animated = this.pings.length || (rt.doc.combat.active && rt.doc.combat.turn) || (rt.doc.ambient > 0 && (rt.doc.lights.length || rt.doc.stamps.length));
    if (animated) this.needRender = true;
    if (!this.needRender) return;
    this.needRender = false;
    renderScene(this.ctx, rt, this.view, this.vw, this.vh, this.dpr, {
      player: true, fogAlpha: 1, markers: true, grid: true, tokens: true, ambientScale: 1, time: t, background: '#000',
      turn: rt.doc.combat.active ? rt.doc.combat.turn : null,
    });
    const ctx = this.ctx, z = this.view.z;
    ctx.save();
    ctx.setTransform(this.dpr * z, 0, 0, this.dpr * z, this.dpr * this.view.x, this.dpr * this.view.y);
    if (this.measure) drawMeasure(ctx, this.measure.a, this.measure.b, z, rt.doc.grid.feet);
    const now = performance.now();
    this.pings = this.pings.filter((p) => now - p.t < 1600);
    for (const p of this.pings) drawPing(ctx, p.x, p.y, now - p.t, z);
    ctx.restore();
  };
}
