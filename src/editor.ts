import { assets } from './assets';
import { Channel, Msg } from './channel';
import { h, icon, toast } from './dom';
import { MARGIN } from './engine';
import { generate, GenKind } from './generate';
import { History } from './history';
import {
  CELL, Combat, DoorKind, Label, Light, MapDoc, Marker, MASK_SCALE, newDoc, newToken, OBJECT_KEYS, Room, Stamp, Token, TOKEN_CELLS, TokenKind, TokenSize, WallStyle,
} from './model';
import { buildTopbar, buildZoom, Intent, renderDock, renderRail, TOOL_INTENT, updateTopbar } from './ui/chrome';
import { renderDrawer } from './ui/drawer';
import { hideHome, showHome } from './ui/home';
import { renderInitiative } from './ui/initiative';
import { positionInspector, renderInspector } from './ui/inspector';
import { allLights, drawLabel, drawMeasure, drawPing, labelFont, markerGeom, renderScene, stampSize, stampLayer, tokenRadius, View, visibleRect } from './render';
import { MapRuntime } from './runtime';
import { getMap, getMeta, listMaps, putMap, setMeta, StoredMap } from './storage';
import { STAMP_BY_ID, VARIANTS } from './stamps';
import { canvasToBlob, clamp, clipRect, ctx2d, debounce, distToSeg, expandRect, makeCanvas, nextFrame, pointInPoly, ptsBBox, Rect, unionRect, uid } from './util';

export type Mode = 'edit' | 'session';
export type Tool = 'select' | 'terrain' | 'room' | 'cave' | 'wall' | 'door' | 'stamp' | 'light' | 'token' | 'text' | 'marker' | 'measure' | 'fog' | 'ping';
export type SelKind = 'stamp' | 'room' | 'wall' | 'door' | 'light' | 'label' | 'marker' | 'token';
export interface Sel { kind: SelKind; id: string }
export const SEL_KEY: Record<SelKind, keyof MapDoc> = { stamp: 'stamps', room: 'rooms', wall: 'walls', door: 'doors', light: 'lights', label: 'labels', marker: 'markers', token: 'tokens' };

export const EDIT_TOOLS: { id: Tool; name: string; key: string }[] = [
  { id: 'select', name: 'Seleziona / sposta', key: 'V' },
  { id: 'terrain', name: 'Pennello terreno', key: 'B' },
  { id: 'room', name: 'Stanza', key: 'R' },
  { id: 'cave', name: 'Caverna', key: 'C' },
  { id: 'wall', name: 'Muro', key: 'W' },
  { id: 'door', name: 'Porta', key: 'D' },
  { id: 'stamp', name: 'Oggetti', key: 'O' },
  { id: 'light', name: 'Luce', key: 'L' },
  { id: 'token', name: 'Pedina', key: 'K' },
  { id: 'text', name: 'Testo', key: 'T' },
  { id: 'marker', name: 'Segnaposto con note', key: 'M' },
  { id: 'measure', name: 'Righello', key: 'U' },
];
export const SESSION_TOOLS: { id: Tool; name: string; key: string }[] = [
  { id: 'select', name: 'Interagisci (sposta pedine, apri porte)', key: 'V' },
  { id: 'fog', name: 'Nebbia di guerra', key: 'F' },
  { id: 'ping', name: 'Ping per i giocatori', key: 'G' },
  { id: 'measure', name: 'Righello', key: 'U' },
  { id: 'token', name: 'Pedina', key: 'K' },
  { id: 'marker', name: 'Segnaposto', key: 'M' },
];

export interface MapMeta { id: string; name: string; updatedAt: number; cols: number; rows: number; thumb?: string }

export class Editor {
  root: HTMLElement;
  canvas!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;
  stage!: HTMLElement;
  /** UI element references, filled by the ui/* builders. */
  el: Record<string, HTMLElement> = {};
  /** Transient UI state shared by the ui/* modules. */
  ui = { stampCat: 'Arredi', search: '', drawerOpen: true, hpAmt: 5 };
  lastTool: Partial<Record<Intent, Tool>> = {};
  playerConnected = false;
  dpr = 1; vw = 1; vh = 1;
  view: View = { z: 0.5, x: 0, y: 0 };
  rt!: MapRuntime;
  mode: Mode = 'edit';
  tool: Tool = 'select';
  sel: Sel | null = null;
  hist = new History();
  maps: MapMeta[] = [];
  opts = {
    terrain: { tex: 'grass', size: 2, hard: 0.35, strength: 0.8, erase: false },
    room: { shape: 'rect' as 'rect' | 'poly', floor: 'flagstone', zone: false },
    cave: { size: 2, erase: false },
    wall: { style: 'stone' as WallStyle },
    door: { kind: 'wood' as DoorKind, width: 1 },
    stamp: { type: 'barrel', scale: 1, jitter: 0.12, randomRot: true, scatter: false, spacing: 1.2, snap: false },
    light: { radius: 4, color: '#ffb35a', intensity: 0.9, flicker: true },
    token: { kind: 'monster' as TokenKind, size: 'medium' as TokenSize, name: 'Goblin', image: '' },
    text: { font: 'Cinzel', size: 40, color: '#f3e6c4', stroke: '#1a120c', bold: true },
    marker: { icon: '📍', color: '#c0392b' },
    fog: { size: 3, mode: 'reveal' as 'reveal' | 'hide' | 'room' },
    previewLights: false,
  };
  private drag: any = null;
  private pointer: [number, number] | null = null;
  private space = false;
  private draft: number[] | null = null;
  private rectDraft: [number, number, number, number] | null = null;
  measure: { a: [number, number]; b: [number, number] } | null = null;
  pings: { x: number; y: number; t: number }[] = [];
  private needRender = true;
  private lastAnim = 0;
  private maskSnap: Map<string, HTMLCanvasElement> | null = null;
  private strokeRect: Rect | null = null;
  private masksDirtyForPlayers = false;
  private saving: Promise<void> | null = null;
  private saveAgain = false;
  channel: Channel;
  follow = false;
  playerWin: Window | null = null;
  hoverToken: string | null = null;

  saveSoon = debounce(() => this.saveNow(), 1500);
  private bcastDoc = debounce(() => { if (this.mode === 'session') this.channel.send({ t: 'doc', doc: this.rt.doc }); }, 40);
  private bcastView = debounce(() => { if (this.follow && this.mode === 'session') this.sendView(); }, 120);

  constructor(root: HTMLElement) {
    this.root = root;
    this.channel = new Channel((m) => this.onMsg(m));
  }

  // ======================================================================== setup
  async init() {
    this.buildLayout();
    await assets.loadAll();
    assets.onChange = () => { this.refreshUI(); this.requestRender(); };
    await this.refreshMaps();
    const last = await getMeta<string>('lastMap');
    const target = this.maps.find((m) => m.id === last) || this.maps[0];
    if (target) await this.openMap(target.id);
    else await this.showHome();
    document.fonts?.ready.then(() => this.requestRender());
    this.channel.send({ t: 'dmhello' });
    requestAnimationFrame(this.loop);
  }

  private buildLayout() {
    const el = this.el;
    this.canvas = h('canvas', { id: 'cv' });
    this.ctx = this.canvas.getContext('2d')!;
    el.rail = h('nav', { class: 'rail', 'aria-label': 'Strumenti' });
    el.dock = h('div', { class: 'dock' });
    el.drawer = h('section', { class: 'drawer', 'aria-label': 'Libreria oggetti', hidden: true });
    el.inspector = h('div', { class: 'inspector', hidden: true });
    el.initPanel = h('aside', { class: 'init-panel', 'aria-label': 'Iniziativa', hidden: true });
    el.save = h('div', { class: 'save-status' });
    el.home = h('div', { class: 'home', hidden: true });
    this.stage = h('main', { class: 'stage' }, this.canvas, el.rail, el.initPanel, el.inspector, el.drawer, el.dock, buildZoom(this), el.save);
    this.root.append(buildTopbar(this), this.stage, el.home);
    this.hist.onChange = () => updateTopbar(this);
    this.setSaveStatus('saved');

    new ResizeObserver(() => this.resize()).observe(this.stage);
    const c = this.canvas;
    c.addEventListener('pointerdown', (e) => this.onDown(e));
    c.addEventListener('pointermove', (e) => this.onMove(e));
    c.addEventListener('pointerup', (e) => this.onUp(e));
    c.addEventListener('pointercancel', (e) => this.onUp(e));
    c.addEventListener('pointerleave', () => { this.pointer = null; this.requestRender(); });
    c.addEventListener('dblclick', (e) => this.onDbl(e));
    c.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', (e) => this.onKey(e));
    window.addEventListener('keyup', (e) => { if (e.code === 'Space') { this.space = false; this.updateCursor(); } });
    window.addEventListener('beforeunload', () => { this.channel.send({ t: 'bye' }); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.saveNow(); });
  }

  private resize() {
    const r = this.stage.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;
    this.vw = r.width; this.vh = r.height;
    this.canvas.width = Math.round(r.width * this.dpr);
    this.canvas.height = Math.round(r.height * this.dpr);
    this.canvas.style.width = r.width + 'px';
    this.canvas.style.height = r.height + 'px';
    this.requestRender();
  }

  // ======================================================================== maps
  async refreshMaps() {
    const all = await listMaps();
    this.maps.forEach((m) => m.thumb && URL.revokeObjectURL(m.thumb));
    this.maps = all.sort((a, b) => b.updatedAt - a.updatedAt).map((m) => ({ id: m.id, name: m.name, updatedAt: m.updatedAt, cols: m.doc.cols, rows: m.doc.rows, thumb: m.thumb ? URL.createObjectURL(m.thumb) : undefined }));
  }

  async openMap(id: string) {
    if (this.rt) await this.saveNow();
    const rec = await getMap(id);
    if (!rec) { toast('Mappa non trovata'); return; }
    this.showBusy('Carico la mappa…');
    await nextFrame();
    const rt = await MapRuntime.load(rec);
    rt.engine.flush();
    this.setRuntime(rt);
    this.hideBusy();
    await setMeta('lastMap', id);
    if (this.mode === 'session') this.channel.send({ t: 'map', id });
  }

  async createMap(o: { name: string; cols: number; rows: number; template: string }) {
    if (this.rt) await this.saveNow();
    const bg = o.template === 'outdoor' ? 'grass' : o.template === 'interior' ? 'wood' : 'rock';
    const doc = newDoc(o.name, o.cols, o.rows, bg);
    const rt = new MapRuntime(doc);
    if (['dungeon', 'cave', 'forest', 'tavern'].includes(o.template)) generate(rt, o.template as GenKind);
    this.showBusy('Dipingo la mappa…');
    await nextFrame();
    rt.engine.flush();
    this.hideBusy();
    this.setRuntime(rt);
    await this.saveNow();
    await this.refreshMaps();
    this.updateTitle();
  }

  async regenerate(kind: GenKind) {
    const rt = this.rt;
    this.showBusy('Genero…');
    await nextFrame();
    generate(rt, kind);
    rt.engine.flush();
    this.hideBusy();
    this.hist.clear();
    this.sel = null;
    this.changed('masks');
    this.refreshUI();
  }

  setRuntime(rt: MapRuntime) {
    this.rt = rt;
    this.hideHome();
    this.discarded = false;
    this.sel = null;
    this.draft = null;
    this.measure = null;
    this.hist.clear();
    this.fitView();
    this.updateTitle();
    this.refreshUI();
    this.updateHud();
    this.requestRender();
  }

  updateTitle() {
    updateTopbar(this);
    document.title = (this.rt?.doc.name || 'Mappa') + ' · Cartografo';
  }

  private busyEl: HTMLElement | null = null;
  showBusy(t: string) {
    if (!this.busyEl) { this.busyEl = h('div', { class: 'busy' }); this.stage.appendChild(this.busyEl); }
    this.busyEl.textContent = t;
    this.busyEl.hidden = false;
  }
  hideBusy() { if (this.busyEl) this.busyEl.hidden = true; }

  fitView() {
    if (!this.rt) return;
    const W = this.rt.W, H = this.rt.H;
    const left = this.mode === 'edit' ? 100 : 330, bottom = 96, top = 12, right = 12;
    const aw = Math.max(200, this.vw - left - right), ah = Math.max(200, this.vh - top - bottom);
    const z = Math.min(aw / W, ah / H) * 0.96;
    this.view = { z, x: left + (aw - W * z) / 2, y: top + (ah - H * z) / 2 };
    this.updateHud();
    this.requestRender();
  }

  // ======================================================================== saving
  changed(kind: 'objects' | 'masks' | 'fog' | 'settings') {
    if (kind === 'masks' || kind === 'settings') this.masksDirtyForPlayers = true;
    if (kind !== 'fog') this.bcastDoc();
    this.saveSoon();
    this.requestRender();
  }

  /** Stop autosaving the current map (used right before deleting it). */
  forgetCurrent() { this.discarded = true; this.saveSoon.cancel(); }
  private discarded = false;

  async saveNow(): Promise<void> {
    if (!this.rt || this.discarded) return;
    this.saveSoon.cancel();
    if (this.saving) { this.saveAgain = true; return this.saving; }
    this.setSaveStatus('saving');
    this.saving = (async () => {
      try {
        const thumb = await this.makeThumb();
        const rec = await this.rt.toStored(thumb);
        await putMap(rec);
        const meta = this.maps.find((m) => m.id === rec.id);
        if (meta) { meta.name = rec.name; meta.updatedAt = rec.updatedAt; }
        else this.maps.unshift({ id: rec.id, name: rec.name, updatedAt: rec.updatedAt, cols: rec.doc.cols, rows: rec.doc.rows });
        if (this.mode === 'session' && this.masksDirtyForPlayers) { this.masksDirtyForPlayers = false; this.channel.send({ t: 'map', id: rec.id }); }
        this.setSaveStatus('saved');
      } catch (e) {
        this.setSaveStatus('error');
        console.error(e);
        toast('Errore durante il salvataggio');
      } finally {
        this.saving = null;
        if (this.saveAgain) { this.saveAgain = false; this.saveSoon(); }
      }
    })();
    return this.saving;
  }

  async makeThumb(): Promise<Blob> {
    const W = this.rt.W, H = this.rt.H, k = 360 / Math.max(W, H);
    const c = makeCanvas(W * k, H * k);
    renderScene(ctx2d(c), this.rt, { z: k, x: 0, y: 0 }, c.width, c.height, 1, { player: true, fogAlpha: 0, markers: false, grid: false, tokens: false, ambientScale: 0.5, time: 0, background: null });
    return canvasToBlob(c, 'image/jpeg', 0.8);
  }

  // ======================================================================== history
  snap(): string {
    const d = this.rt.doc as any;
    const o: any = { combat: d.combat };
    for (const k of OBJECT_KEYS) o[k] = d[k];
    return JSON.stringify(o);
  }
  private invalidateRoomDiff(before: Room[], after: Room[]) {
    const a = new Map(before.map((r) => [r.id, r])), b = new Map(after.map((r) => [r.id, r]));
    for (const id of new Set([...a.keys(), ...b.keys()])) {
      const x = a.get(id), y = b.get(id);
      if (x && y && JSON.stringify(x) === JSON.stringify(y)) continue;
      if (x) this.rt.engine.invalidateRooms(x.pts);
      if (y) this.rt.engine.invalidateRooms(y.pts);
    }
  }
  private applySnap(json: string) {
    const o = JSON.parse(json);
    const d = this.rt.doc as any;
    this.invalidateRoomDiff(d.rooms, o.rooms);
    for (const k of OBJECT_KEYS) d[k] = o[k];
    d.combat = o.combat;
    if (this.sel && !this.getSel()) this.sel = null;
    this.refreshUI();
    this.changed('objects');
  }
  begin(): string { return this.snap(); }
  commit(label: string, before: string, key?: string) {
    const after = this.snap();
    if (after === before) return;
    this.invalidateRoomDiff(JSON.parse(before).rooms, this.rt.doc.rooms);
    this.hist.push({ label, key, undo: () => this.applySnap(before), redo: () => this.applySnap(after) });
    this.changed('objects');
  }
  mutate(label: string, fn: () => void, key?: string) {
    const b = this.begin();
    fn();
    this.commit(label, b, key);
  }
  undo() { this.hist.undo(); this.requestRender(); }
  redo() { this.hist.redo(); this.requestRender(); }

  private beginMask(keys: string[]) {
    this.maskSnap = new Map();
    for (const k of keys) {
      const m = this.rt.engine.mask(k, true)!;
      const c = makeCanvas(m.width, m.height);
      ctx2d(c).drawImage(m, 0, 0);
      this.maskSnap.set(k, c);
    }
    this.strokeRect = null;
  }
  private commitMask(label: string) {
    const snap = this.maskSnap, R = this.strokeRect;
    this.maskSnap = null;
    if (!snap || !R) return;
    const s = MASK_SCALE, eng = this.rt.engine;
    const mr = clipRect({ x: R.x * s - 2, y: R.y * s - 2, w: R.w * s + 4, h: R.h * s + 4 }, eng.mw, eng.mh);
    if (!mr) return;
    const patches = [...snap.entries()].map(([k, c]) => ({
      k, before: ctx2d(c).getImageData(mr.x, mr.y, mr.w, mr.h), after: ctx2d(eng.mask(k)!).getImageData(mr.x, mr.y, mr.w, mr.h),
    }));
    const world = expandRect(R, MARGIN);
    const apply = (which: 'before' | 'after') => {
      for (const p of patches) { ctx2d(this.rt.engine.mask(p.k, true)!).putImageData(p[which], mr.x, mr.y); this.rt.engine.changed.add(p.k); }
      this.rt.engine.invalidate(world);
      this.changed('masks');
    };
    this.hist.push({ label, undo: () => apply('before'), redo: () => apply('after') });
    this.changed('masks');
  }

  // ======================================================================== selection
  getSel(): any {
    if (!this.sel) return null;
    const arr = this.rt.doc[SEL_KEY[this.sel.kind]] as any[];
    return arr.find((o) => o.id === this.sel!.id) || null;
  }
  select(s: Sel | null) {
    this.sel = s;
    this.refreshUI();
    this.requestRender();
  }
  deleteSel() {
    if (!this.sel) return;
    const s = this.sel;
    this.mutate('Elimina', () => {
      const k = SEL_KEY[s.kind] as keyof MapDoc;
      (this.rt.doc as any)[k] = (this.rt.doc[k] as any[]).filter((o) => o.id !== s.id);
      if (s.kind === 'token') this.removeFromCombat(s.id);
    });
    this.select(null);
  }
  duplicateSel() {
    const o = this.getSel();
    if (!o || !this.sel) return;
    const kind = this.sel.kind;
    const c = JSON.parse(JSON.stringify(o));
    c.id = uid();
    if ('pts' in c) c.pts = c.pts.map((v: number) => v + CELL);
    else { c.x += CELL; c.y += CELL; }
    this.mutate('Duplica', () => { (this.rt.doc[SEL_KEY[kind]] as any[]).push(c); });
    this.select({ kind, id: c.id });
  }
  removeFromCombat(id: string) {
    const cb = this.rt.doc.combat;
    if (cb.turn === id) {
      const i = cb.members.indexOf(id);
      const rest = cb.members.filter((m) => m !== id);
      cb.turn = rest.length ? rest[i % rest.length] : null;
    }
    cb.members = cb.members.filter((m) => m !== id);
  }

  hit(x: number, y: number, session = this.mode === 'session'): Sel | null {
    const d = this.rt.doc, z = this.view.z;
    for (let i = d.markers.length - 1; i >= 0; i--) {
      const m = d.markers[i], g = markerGeom(m, z);
      if (Math.hypot(x - g.cx, y - g.cy) < g.r * 1.25 || (Math.abs(x - m.x) < g.r * 0.5 && y < m.y && y > g.cy)) return { kind: 'marker', id: m.id };
    }
    for (let i = d.tokens.length - 1; i >= 0; i--) {
      const t = d.tokens[i];
      if (Math.hypot(x - t.x, y - t.y) < tokenRadius(t)) return { kind: 'token', id: t.id };
    }
    for (const dr of d.doors) {
      const c = Math.cos(-dr.rot), s = Math.sin(-dr.rot);
      const lx = (x - dr.x) * c - (y - dr.y) * s, ly = (x - dr.x) * s + (y - dr.y) * c;
      if (Math.abs(lx) < (dr.width * CELL) / 2 && Math.abs(ly) < 22) return { kind: 'door', id: dr.id };
    }
    if (session) return null;
    for (let i = d.labels.length - 1; i >= 0; i--) {
      const l = d.labels[i];
      this.ctx.font = labelFont(l);
      const lines = l.text.split('\n');
      const w = Math.max(...lines.map((t) => this.ctx.measureText(t).width)), hh = l.size * 1.15 * lines.length;
      const c = Math.cos(-l.rot), s = Math.sin(-l.rot);
      const lx = (x - l.x) * c - (y - l.y) * s, ly = (x - l.x) * s + (y - l.y) * c;
      if (Math.abs(lx) < w / 2 + 6 && Math.abs(ly) < hh / 2 + 4) return { kind: 'label', id: l.id };
    }
    for (const l of d.lights) if (Math.hypot(x - l.x, y - l.y) < 16 / z) return { kind: 'light', id: l.id };
    const order = d.stamps.map((s, i) => [s, i] as [Stamp, number]).sort((a, b) => stampLayer(b[0]) - stampLayer(a[0]) || b[1] - a[1]);
    for (const [s] of order) if (this.inStamp(s, x, y)) return { kind: 'stamp', id: s.id };
    for (let i = d.walls.length - 1; i >= 0; i--) {
      const w = d.walls[i];
      for (let k = 2; k < w.pts.length; k += 2) if (distToSeg(x, y, w.pts[k - 2], w.pts[k - 1], w.pts[k], w.pts[k + 1]) < 14) return { kind: 'wall', id: w.id };
    }
    for (let i = d.rooms.length - 1; i >= 0; i--) if (pointInPoly(x, y, d.rooms[i].pts)) return { kind: 'room', id: d.rooms[i].id };
    return null;
  }
  private inStamp(s: Stamp, x: number, y: number) {
    const { w, h } = stampSize(s);
    const c = Math.cos(-s.rot), sn = Math.sin(-s.rot);
    const lx = ((x - s.x) * c - (y - s.y) * sn) / s.scale, ly = ((x - s.x) * sn + (y - s.y) * c) / s.scale;
    return Math.abs(lx) < w / 2 && Math.abs(ly) < h / 2;
  }
  stampHandles(s: Stamp) {
    const { w, h } = stampSize(s);
    const c = Math.cos(s.rot), sn = Math.sin(s.rot), k = s.scale;
    const tr = (lx: number, ly: number): [number, number] => [s.x + (lx * c - ly * sn) * k, s.y + (lx * sn + ly * c) * k];
    return { corners: [tr(-w / 2, -h / 2), tr(w / 2, -h / 2), tr(w / 2, h / 2), tr(-w / 2, h / 2)], scale: tr(w / 2, h / 2), rotate: tr(0, -h / 2 - 26 / this.view.z / k) };
  }

  // ======================================================================== snapping
  snapCorner(x: number, y: number): [number, number] { return [Math.round(x / CELL) * CELL, Math.round(y / CELL) * CELL]; }
  snapHalf(x: number, y: number): [number, number] { const g = CELL / 2; return [Math.round(x / g) * g, Math.round(y / g) * g]; }
  snapCenter(x: number, y: number): [number, number] { return [(Math.floor(x / CELL) + 0.5) * CELL, (Math.floor(y / CELL) + 0.5) * CELL]; }
  snapToken(t: Token) {
    const n = TOKEN_CELLS[t.size];
    if (n < 1) { const g = CELL / 2; t.x = (Math.floor(t.x / g) + 0.5) * g; t.y = (Math.floor(t.y / g) + 0.5) * g; }
    else if (n % 2) [t.x, t.y] = this.snapCenter(t.x, t.y);
    else [t.x, t.y] = this.snapCorner(t.x, t.y);
  }
  snapDoor(x: number, y: number, width: number): { x: number; y: number; rot: number } {
    const off = width % 2 ? 0.5 : 0;
    const hx = (Math.floor(x / CELL - off + 0.5) + off) * CELL, hy = Math.round(y / CELL) * CELL;
    const vx = Math.round(x / CELL) * CELL, vy = (Math.floor(y / CELL - off + 0.5) + off) * CELL;
    return Math.abs(y - hy) <= Math.abs(x - vx) ? { x: hx, y: hy, rot: 0 } : { x: vx, y: vy, rot: Math.PI / 2 };
  }

  // ======================================================================== input
  toWorld(e: { clientX: number; clientY: number }): [number, number] {
    const r = this.canvas.getBoundingClientRect();
    return [(e.clientX - r.left - this.view.x) / this.view.z, (e.clientY - r.top - this.view.y) / this.view.z];
  }
  private brushRadius(): number {
    if (this.tool === 'terrain') return (this.opts.terrain.size * CELL) / 2;
    if (this.tool === 'cave') return (this.opts.cave.size * CELL) / 2;
    if (this.tool === 'fog') return (this.opts.fog.size * CELL) / 2;
    if (this.tool === 'stamp' && this.opts.stamp.scatter) return this.opts.stamp.spacing * CELL;
    return 0;
  }

  private onDown(e: PointerEvent) {
    this.canvas.setPointerCapture(e.pointerId);
    import('./dom').then((d) => d.closePopover());
    const p = this.toWorld(e);
    const [x, y] = p;
    if (e.button === 1 || e.button === 2 || this.space) {
      if (e.button === 2 && (this.draft || this.rectDraft)) { this.draft = null; this.rectDraft = null; this.requestRender(); return; }
      this.drag = { kind: 'pan', sx: e.clientX, sy: e.clientY, vx: this.view.x, vy: this.view.y };
      this.updateCursor(true);
      return;
    }
    if (e.button !== 0) return;
    const doc = this.rt.doc;
    if (this.mode === 'session' && e.altKey && this.tool === 'select') { this.ping(x, y); return; }
    switch (this.tool) {
      case 'select': return this.downSelect(e, x, y);
      case 'terrain': {
        const o = this.opts.terrain;
        this.beginMask([o.tex]);
        this.drag = { kind: 'brush', last: p };
        this.brushAt(x, y);
        return;
      }
      case 'cave': {
        this.beginMask(['cave']);
        this.drag = { kind: 'brush', last: p };
        this.brushAt(x, y);
        return;
      }
      case 'fog': {
        if (this.opts.fog.mode === 'room') { this.revealAt(x, y); return; }
        this.drag = { kind: 'brush', last: p };
        this.brushAt(x, y);
        return;
      }
      case 'room': {
        if (this.opts.room.shape === 'rect') {
          const [cx, cy] = this.snapCorner(x, y);
          this.rectDraft = [cx, cy, cx, cy];
          this.drag = { kind: 'rect' };
        } else this.addDraftPoint(this.snapHalf(x, y), true);
        return;
      }
      case 'wall': this.addDraftPoint(e.altKey ? [x, y] : this.snapCorner(x, y), false); return;
      case 'door': {
        const hit = this.hit(x, y, true);
        if (hit?.kind === 'door') { this.toggleDoor(hit.id); return; }
        const o = this.opts.door, sp = this.snapDoor(x, y, o.width);
        const id = uid();
        this.mutate('Porta', () => doc.doors.push({ id, x: sp.x, y: sp.y, rot: sp.rot, kind: o.kind, open: false, width: o.width }));
        this.select({ kind: 'door', id });
        return;
      }
      case 'stamp': {
        const before = this.begin();
        this.placeStamp(x, y);
        this.drag = { kind: 'scatter', last: p, before };
        return;
      }
      case 'light': {
        const o = this.opts.light, id = uid();
        this.mutate('Luce', () => doc.lights.push({ id, x, y, radius: o.radius, color: o.color, intensity: o.intensity, flicker: o.flicker }));
        this.select({ kind: 'light', id });
        return;
      }
      case 'token': {
        const o = this.opts.token;
        const n = doc.tokens.filter((t) => t.name.startsWith(o.name)).length;
        const t = newToken(x, y, o.kind, n ? `${o.name} ${n + 1}` : o.name);
        t.size = o.size;
        if (o.image) t.image = o.image;
        if (this.mode === 'session' && o.kind === 'monster') t.hidden = true;
        this.snapToken(t);
        this.mutate('Pedina', () => { doc.tokens.push(t); if (doc.combat.active) doc.combat.members.push(t.id); });
        this.select({ kind: 'token', id: t.id });
        return;
      }
      case 'text': {
        const o = this.opts.text, id = uid();
        const l: Label = { id, x, y, text: 'Testo', font: o.font, size: o.size, color: o.color, stroke: o.stroke, rot: 0, bold: o.bold };
        this.mutate('Testo', () => doc.labels.push(l));
        this.select({ kind: 'label', id });
        setTimeout(() => { const ta = this.el.inspector.querySelector('textarea'); if (ta) { (ta as HTMLTextAreaElement).focus(); (ta as HTMLTextAreaElement).select(); } }, 30);
        return;
      }
      case 'marker': {
        const o = this.opts.marker, id = uid();
        const m: Marker = { id, x, y, icon: o.icon, color: o.color, title: 'Nuovo segnaposto', notes: '', playerNotes: '', visible: false };
        this.mutate('Segnaposto', () => doc.markers.push(m));
        this.select({ kind: 'marker', id });
        setTimeout(() => { const i = this.el.inspector.querySelector('input[type=text]'); if (i) { (i as HTMLInputElement).focus(); (i as HTMLInputElement).select(); } }, 30);
        return;
      }
      case 'measure': {
        const a = this.snapCenter(x, y);
        this.measure = { a, b: a };
        this.drag = { kind: 'measure' };
        this.sendMeasure();
        this.requestRender();
        return;
      }
      case 'ping': this.ping(x, y); return;
    }
  }

  private downSelect(e: PointerEvent, x: number, y: number) {
    const session = this.mode === 'session';
    const cur = this.getSel();
    if (cur && this.sel?.kind === 'stamp' && !session) {
      const hd = this.stampHandles(cur);
      const tol = 9 / this.view.z;
      if (Math.hypot(x - hd.scale[0], y - hd.scale[1]) < tol) { this.drag = { kind: 'scale', before: this.begin(), s0: cur.scale, d0: Math.hypot(x - cur.x, y - cur.y) }; return; }
      if (Math.hypot(x - hd.rotate[0], y - hd.rotate[1]) < tol) { this.drag = { kind: 'rotate', before: this.begin(), r0: cur.rot, a0: Math.atan2(y - cur.y, x - cur.x) }; return; }
    }
    const hit = this.hit(x, y);
    if (!hit) {
      this.select(null);
      this.drag = { kind: 'pan', sx: e.clientX, sy: e.clientY, vx: this.view.x, vy: this.view.y };
      this.updateCursor(true);
      return;
    }
    if (session && hit.kind === 'door') { this.toggleDoor(hit.id); return; }
    this.select(hit);
    const o = this.getSel();
    const orig = 'pts' in o ? { pts: [...o.pts] } : { x: o.x, y: o.y };
    this.drag = { kind: 'move', before: this.begin(), sx: x, sy: y, orig, moved: false, alt: e.altKey };
  }

  private onMove(e: PointerEvent) {
    const p = this.toWorld(e);
    const [x, y] = p;
    this.pointer = p;
    const d = this.drag;
    if (!d) {
      if (this.tool === 'select') {
        const hit = this.hit(x, y);
        const ht = hit?.kind === 'token' ? hit.id : null;
        if (ht !== this.hoverToken) { this.hoverToken = ht; }
        this.canvas.style.cursor = hit ? (this.mode === 'session' && hit.kind === 'door' ? 'pointer' : 'move') : 'default';
      }
      this.updateHud();
      this.requestRender();
      return;
    }
    switch (d.kind) {
      case 'pan':
        this.view.x = d.vx + e.clientX - d.sx; this.view.y = d.vy + e.clientY - d.sy;
        this.bcastView();
        break;
      case 'brush': {
        const r = this.brushRadius();
        const step = Math.max(2, r * 0.22);
        const [lx, ly] = d.last;
        const dist = Math.hypot(x - lx, y - ly);
        if (dist >= step) {
          const n = Math.floor(dist / step);
          for (let i = 1; i <= n; i++) this.brushAt(lx + ((x - lx) * i) / n, ly + ((y - ly) * i) / n);
          d.last = [lx + ((x - lx) * n) / n, ly + ((y - ly) * n) / n];
        }
        break;
      }
      case 'scatter': {
        if (!this.opts.stamp.scatter) break;
        const sp = this.opts.stamp.spacing * CELL;
        if (Math.hypot(x - d.last[0], y - d.last[1]) >= sp) {
          const a = Math.random() * Math.PI * 2, rr = Math.random() * sp * 0.6;
          this.placeStamp(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
          d.last = p;
        }
        break;
      }
      case 'rect': {
        const [cx, cy] = this.snapCorner(x, y);
        this.rectDraft![2] = cx; this.rectDraft![3] = cy;
        break;
      }
      case 'measure': this.measure!.b = this.snapCenter(x, y); this.sendMeasure(); break;
      case 'scale': {
        const s = this.getSel();
        if (s) s.scale = clamp(d.s0 * Math.hypot(x - s.x, y - s.y) / Math.max(1, d.d0), 0.1, 10);
        break;
      }
      case 'rotate': {
        const s = this.getSel();
        if (s) { let r = d.r0 + Math.atan2(y - s.y, x - s.x) - d.a0; if (e.shiftKey) r = Math.round(r / (Math.PI / 12)) * (Math.PI / 12); s.rot = r; }
        break;
      }
      case 'move': {
        const o = this.getSel();
        if (!o) break;
        let dx = x - d.sx, dy = y - d.sy;
        if (!d.moved && Math.hypot(dx, dy) * this.view.z < 3) break;
        d.moved = true;
        if (d.orig.pts) {
          if (!e.altKey) { dx = Math.round(dx / CELL) * CELL; dy = Math.round(dy / CELL) * CELL; }
          const old = o.pts;
          o.pts = d.orig.pts.map((v: number, i: number) => v + (i % 2 ? dy : dx));
          if (this.sel!.kind === 'room') { this.rt.engine.invalidateRooms(old); this.rt.engine.invalidateRooms(o.pts); }
        } else {
          o.x = d.orig.x + dx; o.y = d.orig.y + dy;
        }
        if (this.mode === 'session') this.bcastDoc();
        break;
      }
    }
    this.updateHud();
    this.requestRender();
  }

  private onUp(e: PointerEvent) {
    const d = this.drag;
    this.drag = null;
    this.updateCursor();
    if (!d) return;
    switch (d.kind) {
      case 'brush':
        if (this.tool === 'terrain') this.commitMask('Pennello');
        else if (this.tool === 'cave') this.commitMask('Caverna');
        break;
      case 'scatter': this.commit('Oggetti', d.before); break;
      case 'rect': {
        const [x0, y0, x1, y1] = this.rectDraft!;
        this.rectDraft = null;
        if (Math.abs(x1 - x0) >= CELL && Math.abs(y1 - y0) >= CELL) {
          const a = Math.min(x0, x1), b = Math.min(y0, y1), c = Math.max(x0, x1), dd = Math.max(y0, y1);
          this.addRoom([a, b, c, b, c, dd, a, dd]);
        }
        break;
      }
      case 'scale': case 'rotate': this.commit('Trasforma', d.before); this.refreshUI(); break;
      case 'move': {
        const o = this.getSel();
        if (o && d.moved) {
          if (this.sel!.kind === 'token') this.snapToken(o);
          if (this.sel!.kind === 'door' && !d.alt) Object.assign(o, this.snapDoor(o.x, o.y, o.width));
          this.commit('Sposta', d.before);
        }
        break;
      }
      case 'measure':
        if (this.measure && this.measure.a[0] === this.measure.b[0] && this.measure.a[1] === this.measure.b[1]) { this.measure = null; this.sendMeasure(); }
        break;
    }
    this.requestRender();
    void e;
  }

  private onDbl(e: MouseEvent) {
    if ((this.tool === 'room' && this.opts.room.shape === 'poly') || this.tool === 'wall') { this.finishDraft(); return; }
    if (this.tool === 'select' && this.mode === 'edit') {
      const [x, y] = this.toWorld(e);
      const hit = this.hit(x, y);
      if (hit?.kind === 'door') this.toggleDoor(hit.id);
    }
  }

  private onWheel(e: WheelEvent) {
    e.preventDefault();
    if (!e.ctrlKey && !e.metaKey && Math.abs(e.deltaX) > 0.5 && e.deltaMode === 0) {
      this.view.x -= e.deltaX; this.view.y -= e.deltaY;
    } else {
      const k = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018) * (e.deltaMode === 1 ? 30 : 1));
      this.zoomAt(e.clientX, e.clientY, k);
    }
    this.bcastView();
    this.updateHud();
    this.requestRender();
  }
  zoomAt(cx: number, cy: number, k: number) {
    const r = this.canvas.getBoundingClientRect();
    const sx = cx - r.left, sy = cy - r.top;
    const nz = clamp(this.view.z * k, 0.03, 6);
    const wx = (sx - this.view.x) / this.view.z, wy = (sy - this.view.y) / this.view.z;
    this.view.z = nz;
    this.view.x = sx - wx * nz; this.view.y = sy - wy * nz;
  }

  private onKey(e: KeyboardEvent) {
    const t = e.target as HTMLElement;
    const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); e.shiftKey ? this.redo() : this.undo(); return; }
    if (mod && e.key.toLowerCase() === 'y' && !typing) { e.preventDefault(); this.redo(); return; }
    if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); this.saveNow().then(() => toast('Salvato')); return; }
    if (typing) { if (e.key === 'Escape') t.blur(); return; }
    if (!this.el.home.hidden) { if (e.key === 'Escape' && this.rt) this.hideHome(); return; }
    if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); this.duplicateSel(); return; }
    if (e.code === 'Space') { if (!this.space) { this.space = true; this.updateCursor(); } e.preventDefault(); return; }
    if (e.key === 'Escape') { this.draft = null; this.rectDraft = null; this.measure = null; this.sendMeasure(); this.select(null); return; }
    if (e.key === 'Enter') { this.finishDraft(); return; }
    if (e.key === 'Delete' || e.key === 'Backspace') { this.deleteSel(); e.preventDefault(); return; }
    if (e.key === '[' || e.key === ']') { this.bumpBrush(e.key === ']' ? 1 : -1); return; }
    if (e.key.startsWith('Arrow') && this.sel) {
      const o = this.getSel();
      if (o && 'x' in o) {
        e.preventDefault();
        const st = this.sel.kind === 'token' || e.shiftKey ? CELL : CELL / 10;
        const dx = e.key === 'ArrowLeft' ? -st : e.key === 'ArrowRight' ? st : 0, dy = e.key === 'ArrowUp' ? -st : e.key === 'ArrowDown' ? st : 0;
        this.mutate('Sposta', () => { o.x += dx; o.y += dy; }, 'nudge:' + o.id);
      }
      return;
    }
    if (e.key === '0' && !mod) { this.fitView(); return; }
    if (e.key === 'q' || e.key === 'e') {
      const o = this.getSel();
      if (o && this.sel && (this.sel.kind === 'stamp' || this.sel.kind === 'label')) { this.mutate('Ruota', () => { o.rot += (e.key === 'e' ? 1 : -1) * Math.PI / 12; }, 'rot:' + o.id); this.refreshUI(); }
      return;
    }
    const list = this.mode === 'edit' ? EDIT_TOOLS : SESSION_TOOLS;
    const tool = list.find((x) => x.key.toLowerCase() === e.key.toLowerCase());
    if (tool && !mod && !e.altKey) this.setTool(tool.id);
  }

  bumpBrush(dir: number) {
    const o = this.tool === 'terrain' ? this.opts.terrain : this.tool === 'cave' ? this.opts.cave : this.tool === 'fog' ? this.opts.fog : null;
    if (!o) return;
    o.size = clamp(+(o.size * (dir > 0 ? 1.25 : 0.8)).toFixed(2), 0.25, 20);
    this.refreshUI();
    this.requestRender();
  }

  updateCursor(grabbing = false) {
    if (grabbing || this.drag?.kind === 'pan') this.canvas.style.cursor = 'grabbing';
    else if (this.space) this.canvas.style.cursor = 'grab';
    else if (['terrain', 'cave', 'fog'].includes(this.tool)) this.canvas.style.cursor = 'none';
    else if (this.tool === 'select') this.canvas.style.cursor = 'default';
    else this.canvas.style.cursor = 'crosshair';
  }

  // ======================================================================== tools
  setTool(t: Tool) {
    this.tool = t;
    if (this.mode === 'edit') this.lastTool[TOOL_INTENT[t]] = t;
    this.draft = null; this.rectDraft = null;
    this.updateCursor();
    this.refreshUI();
    this.requestRender();
  }

  private brushAt(x: number, y: number) {
    const r = this.brushRadius();
    if (this.tool === 'terrain') {
      const o = this.opts.terrain;
      const rect = this.rt.engine.dab(o.tex, x, y, r, o.hard, o.strength, o.erase);
      this.strokeRect = unionRect(this.strokeRect, rect);
    } else if (this.tool === 'cave') {
      const rect = this.rt.engine.dab('cave', x, y, r, 0.45, 1, this.opts.cave.erase);
      this.strokeRect = unionRect(this.strokeRect, rect);
    } else if (this.tool === 'fog') {
      this.rt.fog.dab(x, y, r, this.opts.fog.mode === 'reveal');
    }
  }

  revealAt(x: number, y: number) {
    const rooms = this.rt.doc.rooms.filter((r) => pointInPoly(x, y, r.pts));
    if (rooms.length) { for (const r of rooms) this.rt.fog.polygon(r.pts, true); this.requestRender(); return; }
    // cave region flood fill
    const m = this.rt.engine.mask('cave');
    if (m) {
      const s = MASK_SCALE, R = Math.round(7 * CELL * s);
      const cx = Math.round(x * s), cy = Math.round(y * s);
      const rx = Math.max(0, cx - R), ry = Math.max(0, cy - R), rw = Math.min(m.width, cx + R) - rx, rh = Math.min(m.height, cy + R) - ry;
      if (rw > 0 && rh > 0) {
        const src = ctx2d(m, true).getImageData(rx, ry, rw, rh).data;
        const sx = cx - rx, sy = cy - ry;
        if (sx >= 0 && sy >= 0 && sx < rw && sy < rh && src[(sy * rw + sx) * 4 + 3] > 100) {
          const out = new ImageData(rw, rh);
          const seen = new Uint8Array(rw * rh);
          const st = [sy * rw + sx];
          seen[st[0]] = 1;
          while (st.length) {
            const k = st.pop()!;
            const px = k % rw, py = (k / rw) | 0;
            out.data[k * 4 + 3] = 255;
            if ((px - sx) ** 2 + (py - sy) ** 2 > R * R) continue;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
              const X = px + dx, Y = py + dy;
              if (X < 0 || Y < 0 || X >= rw || Y >= rh) continue;
              const j = Y * rw + X;
              if (seen[j]) continue;
              seen[j] = 1;
              if (src[j * 4 + 3] > 60) st.push(j); else out.data[j * 4 + 3] = 255;
            }
          }
          const tmp = makeCanvas(rw, rh);
          ctx2d(tmp).putImageData(out, 0, 0);
          const fc = ctx2d(this.rt.fog.mask);
          fc.globalCompositeOperation = 'destination-out';
          fc.shadowColor = '#fff'; fc.shadowBlur = 8;
          fc.drawImage(tmp, rx, ry);
          fc.drawImage(tmp, rx, ry);
          fc.shadowColor = 'transparent';
          fc.globalCompositeOperation = 'source-over';
          this.rt.fog.refresh({ x: rx - 10, y: ry - 10, w: rw + 20, h: rh + 20 });
          this.rt.fog.pending = unionRect(this.rt.fog.pending, { x: rx - 10, y: ry - 10, w: rw + 20, h: rh + 20 });
          this.rt.fog.changed = true;
          this.requestRender();
          return;
        }
      }
    }
    toast('Nessuna stanza qui: usa il pennello o crea una "zona nebbia" con lo strumento Stanza');
  }

  placeStamp(x: number, y: number) {
    const o = this.opts.stamp;
    if (o.snap) [x, y] = this.snapHalf(x, y);
    const isAsset = o.type.startsWith('asset:');
    if (!isAsset && !STAMP_BY_ID.get(o.type)) return;
    const s: Stamp = {
      id: uid(), type: o.type, x, y,
      rot: o.randomRot ? Math.random() * Math.PI * 2 : 0,
      scale: o.scale * (1 + (Math.random() * 2 - 1) * o.jitter),
      variant: Math.floor(Math.random() * VARIANTS),
      flip: !isAsset && Math.random() < 0.5,
    };
    this.rt.doc.stamps.push(s);
    this.changed('objects');
  }

  private addDraftPoint(p: [number, number], room: boolean) {
    if (!this.draft) { this.draft = [...p]; this.requestRender(); return; }
    const n = this.draft.length;
    if (n >= 6 && room && Math.hypot(p[0] - this.draft[0], p[1] - this.draft[1]) < 1) { this.finishDraft(); return; }
    if (this.draft[n - 2] === p[0] && this.draft[n - 1] === p[1]) return;
    this.draft.push(...p);
    this.requestRender();
  }
  finishDraft() {
    const d = this.draft;
    this.draft = null;
    if (!d) return;
    if (this.tool === 'room' && d.length >= 6) this.addRoom(d);
    else if (this.tool === 'wall' && d.length >= 4) {
      const id = uid();
      this.mutate('Muro', () => this.rt.doc.walls.push({ id, pts: d, style: this.opts.wall.style }));
    }
    this.requestRender();
  }
  addRoom(pts: number[]) {
    const o = this.opts.room, id = uid();
    const n = this.rt.doc.rooms.filter((r) => !r.zoneOnly).length + 1;
    this.mutate('Stanza', () => this.rt.doc.rooms.push({ id, pts, floor: o.floor, zoneOnly: o.zone || undefined, name: o.zone ? 'Zona' : `Stanza ${n}` }));
  }

  toggleDoor(id: string) {
    const d = this.rt.doc.doors.find((x) => x.id === id);
    if (!d) return;
    this.mutate(d.open ? 'Chiudi porta' : 'Apri porta', () => { d.open = !d.open; });
    if (this.sel?.id === id) this.refreshUI();
  }

  ping(x: number, y: number) {
    this.pings.push({ x, y, t: performance.now() });
    this.channel.send({ t: 'ping', x, y });
    this.requestRender();
  }
  sendMeasure() {
    if (this.mode !== 'session') return;
    this.channel.send({ t: 'measure', a: this.measure?.a || null, b: this.measure?.b || null });
  }

  // ======================================================================== session
  async setMode(m: Mode) {
    if (m === this.mode) return;
    this.mode = m;
    this.tool = 'select';
    this.sel = null;
    this.draft = null;
    this.root.classList.toggle('session', m === 'session');
    this.refreshUI();
    this.requestRender();
    if (m === 'session') {
      await this.saveNow();
      this.channel.send({ t: 'map', id: this.rt.doc.id });
      if (!this.rt.doc.fogEnabled) toast('Suggerimento: attiva la nebbia di guerra nel pannello a destra');
    }
  }

  openPlayer() {
    const url = location.pathname + '?player=1';
    this.playerWin = window.open(url, 'cartografo-giocatori', 'popup,width=1280,height=800');
    if (this.mode !== 'session') this.setMode('session');
  }

  sendView() {
    const v = visibleRect(this.view, this.vw, this.vh);
    this.channel.send({ t: 'view', mapId: this.rt.doc.id, cx: v.x + v.w / 2, cy: v.y + v.h / 2, w: v.w, h: v.h });
  }
  sendFogFull() {
    const f = this.rt.fog;
    this.channel.send({ t: 'fog', mapId: this.rt.doc.id, x: 0, y: 0, data: ctx2d(f.mask).getImageData(0, 0, f.mw, f.mh) });
  }

  private async onMsg(m: Msg) {
    if (m.t === 'pbye') { this.playerConnected = false; updateTopbar(this); return; }
    if (!this.rt) return;
    if (m.t === 'hello') {
      if (this.mode !== 'session') await this.setMode('session');
      await this.saveNow();
      this.channel.send({ t: 'map', id: this.rt.doc.id });
    } else if (m.t === 'ready') {
      if (m.mapId !== this.rt.doc.id) { this.channel.send({ t: 'map', id: this.rt.doc.id }); return; }
      this.channel.send({ t: 'doc', doc: this.rt.doc });
      this.sendFogFull();
      this.sendView();
      if (!this.playerConnected) toast('TV collegata');
      this.playerConnected = true;
      updateTopbar(this);
    }
  }

  // ---- combat
  combat(): Combat { return this.rt.doc.combat; }
  rollInitiative(which: 'all' | 'npc') {
    this.mutate('Iniziativa', () => {
      for (const id of this.combat().members) {
        const t = this.rt.doc.tokens.find((x) => x.id === id);
        if (!t) continue;
        if (which === 'npc' && t.kind === 'pc') continue;
        t.init = 1 + Math.floor(Math.random() * 20) + t.initMod;
      }
      this.sortCombat();
    });
  }
  sortCombat() {
    const cb = this.combat(), toks = new Map(this.rt.doc.tokens.map((t) => [t.id, t]));
    cb.members = cb.members.filter((id) => toks.has(id)).sort((a, b) => {
      const A = toks.get(a)!, B = toks.get(b)!;
      return (B.init ?? -99) - (A.init ?? -99) || B.initMod - A.initMod || A.name.localeCompare(B.name);
    });
  }
  nextTurn(dir = 1) {
    this.mutate('Turno', () => {
      const cb = this.combat();
      if (!cb.members.length) return;
      if (!cb.active) { cb.active = true; cb.round = 1; cb.turn = cb.members[0]; return; }
      let i = cb.members.indexOf(cb.turn || '');
      i += dir;
      if (i >= cb.members.length) { i = 0; cb.round++; }
      if (i < 0) { i = cb.members.length - 1; cb.round = Math.max(1, cb.round - 1); }
      cb.turn = cb.members[i];
    });
    const t = this.rt.doc.tokens.find((x) => x.id === this.combat().turn);
    if (t) this.centerOn(t.x, t.y, false);
  }
  centerOn(x: number, y: number, force = true) {
    const sx = x * this.view.z + this.view.x, sy = y * this.view.z + this.view.y;
    if (!force && sx > this.vw * 0.15 && sx < this.vw * 0.85 && sy > this.vh * 0.15 && sy < this.vh * 0.85) return;
    this.view.x = this.vw / 2 - x * this.view.z; this.view.y = this.vh / 2 - y * this.view.z;
    this.bcastView();
    this.requestRender();
  }

  // ======================================================================== rendering
  requestRender() { this.needRender = true; }
  refreshUI() {
    if (!this.rt) return;
    this.root.classList.toggle('session', this.mode === 'session');
    updateTopbar(this);
    renderRail(this);
    renderDock(this);
    renderDrawer(this);
    renderInitiative(this);
    renderInspector(this);
    positionInspector(this);
    this.updateHud();
  }
  refreshDockHint() {
    const hint = this.el.dock.querySelector('.dock-hint');
    if (hint) hint.textContent = this.dockHint();
  }
  dockHint(): string {
    if (this.mode === 'session') {
      if (this.tool === 'fog') return this.opts.fog.mode === 'room' ? 'Clicca dentro una stanza per rivelarla tutta' : this.opts.fog.mode === 'reveal' ? 'Dipingi per rivelare la mappa ai giocatori' : 'Dipingi per coprire di nuovo';
      if (this.tool === 'ping') return 'Clicca per attirare lo sguardo dei giocatori';
      if (this.tool === 'measure') return 'Trascina da una casella all\'altra (anche i giocatori lo vedono)';
      if (this.tool === 'token') return 'Clicca per piazzare la pedina · i mostri nuovi sono nascosti ai giocatori';
      return 'Trascina le pedine · clic su una porta per aprirla · Alt + clic per un ping';
    }
    switch (this.tool) {
      case 'select': return this.sel ? '' : 'Clicca un oggetto per modificarlo · trascina il vuoto per muovere la vista';
      case 'terrain': return this.opts.terrain.erase ? 'Trascina per cancellare la texture scelta' : 'Trascina per dipingere · [ ] cambiano la dimensione';
      case 'room': return this.opts.room.zone ? 'Disegna una zona invisibile da rivelare con un clic durante il gioco' : this.opts.room.shape === 'rect' ? 'Trascina sulla griglia per creare una stanza — i muri si disegnano da soli' : 'Clicca i vertici · doppio clic o Invio per chiudere';
      case 'cave': return this.opts.cave.erase ? 'Trascina per riempire di roccia' : 'Trascina per scavare gallerie con pareti naturali';
      case 'wall': return 'Clicca per aggiungere punti · doppio clic o Invio per finire · Alt per punti liberi';
      case 'door': return 'Clicca su un bordo della griglia · clic su una porta esistente per aprirla';
      case 'text': return 'Clicca sulla mappa per scrivere';
      case 'marker': return 'Clicca per piazzare un segnaposto con note segrete';
      case 'token': return 'Clicca per piazzare una pedina';
      case 'measure': return 'Trascina da una casella all\'altra';
      default: return '';
    }
  }
  ensureFog() {
    if (this.rt.doc.fogEnabled) return;
    this.mutate('Nebbia', () => { this.rt.doc.fogEnabled = true; });
    toast('Nebbia di guerra attivata');
  }
  zoomCenter(k: number) {
    const r = this.canvas.getBoundingClientRect();
    this.zoomAt(r.left + this.vw / 2, r.top + this.vh / 2, k);
    this.bcastView(); this.updateHud(); this.requestRender();
  }
  setSaveStatus(st: 'saving' | 'saved' | 'error') {
    const e = this.el.save;
    if (!e) return;
    e.className = 'save-status ' + st;
    e.innerHTML = '';
    e.append(icon(st === 'error' ? 'x' : 'check', 14), st === 'saving' ? 'Salvataggio…' : st === 'saved' ? 'Salvato' : 'Errore di salvataggio');
  }
  async showHome() { await showHome(this); }
  hideHome() { hideHome(this); }

  private loop = (t: number) => {
    requestAnimationFrame(this.loop);
    if (!this.rt) return;
    const animated = this.pings.length > 0 || (this.rt.doc.combat.active && !!this.rt.doc.combat.turn) || (this.mode === 'session' && allLights(this.rt, false).some((l) => l.flicker) && this.rt.doc.ambient > 0);
    if (animated && t - this.lastAnim > 33) { this.needRender = true; this.lastAnim = t; }
    const flushed = this.rt.engine.flush();
    if (flushed) this.needRender = true;
    if (this.mode === 'session') {
      const p = this.rt.fog.takePatch();
      if (p) { this.channel.send({ t: 'fog', mapId: this.rt.doc.id, x: p.x, y: p.y, data: p.data }); this.saveSoon(); }
    } else this.rt.fog.pending = null;
    if (this.rt.fog.changed) this.saveSoon();
    if (!this.needRender) return;
    this.needRender = false;
    this.draw(t);
    positionInspector(this);
  };

  private draw(time: number) {
    const ctx = this.ctx, rt = this.rt, z = this.view.z, session = this.mode === 'session';
    renderScene(ctx, rt, this.view, this.vw, this.vh, this.dpr, {
      player: false,
      fogAlpha: session ? 0.55 : this.tool === 'fog' ? 0.55 : 0,
      markers: true, grid: true, tokens: true,
      ambientScale: session ? 0.55 : this.opts.previewLights ? 1 : 0.25,
      time, background: '#15171c', turn: rt.doc.combat.active ? rt.doc.combat.turn : null, hoverToken: this.hoverToken,
    });
    ctx.save();
    ctx.setTransform(this.dpr * z, 0, 0, this.dpr * z, this.dpr * this.view.x, this.dpr * this.view.y);
    // zones & room outlines
    for (const r of rt.doc.rooms) {
      const show = r.zoneOnly || (this.tool === 'room' && !session) || (this.tool === 'fog' && this.opts.fog.mode === 'room');
      if (!show) continue;
      ctx.beginPath();
      for (let i = 0; i < r.pts.length; i += 2) ctx.lineTo(r.pts[i], r.pts[i + 1]);
      ctx.closePath();
      ctx.setLineDash([8 / z, 6 / z]);
      ctx.strokeStyle = r.zoneOnly ? 'rgba(120,200,255,0.8)' : 'rgba(255,220,120,0.6)';
      ctx.lineWidth = 2 / z;
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (!session) {
      for (const l of allLights(rt, false)) {
        if (l.stampId) continue;
        ctx.fillStyle = l.color; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5 / z;
        ctx.beginPath(); ctx.arc(l.x, l.y, 8 / z, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(l.x, l.y, l.radius * CELL, 0, Math.PI * 2); ctx.setLineDash([4 / z, 6 / z]); ctx.strokeStyle = 'rgba(255,220,140,0.35)'; ctx.stroke(); ctx.setLineDash([]);
      }
    }
    this.drawSelection(ctx, z);
    // drafts
    if (this.rectDraft) {
      const [x0, y0, x1, y1] = this.rectDraft;
      ctx.fillStyle = 'rgba(255,220,120,0.18)'; ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 2 / z;
      ctx.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));
      ctx.strokeRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));
      this.drawDimLabel(ctx, Math.max(x0, x1), Math.max(y0, y1), `${Math.abs(x1 - x0) / CELL} × ${Math.abs(y1 - y0) / CELL}`, z);
    }
    if (this.draft) {
      const pts = [...this.draft];
      if (this.pointer) pts.push(...(this.tool === 'room' ? this.snapHalf(...this.pointer) : this.snapCorner(...this.pointer)));
      ctx.beginPath();
      for (let i = 0; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
      if (this.tool === 'room') { ctx.closePath(); ctx.fillStyle = 'rgba(255,220,120,0.18)'; ctx.fill(); }
      ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = (this.tool === 'wall' ? 4 : 2) / z; ctx.stroke();
      for (let i = 0; i < this.draft.length; i += 2) { ctx.fillStyle = '#ffd36b'; ctx.beginPath(); ctx.arc(this.draft[i], this.draft[i + 1], 4 / z, 0, Math.PI * 2); ctx.fill(); }
    }
    if (this.measure) drawMeasure(ctx, this.measure.a, this.measure.b, z, rt.doc.grid.feet);
    const now = performance.now();
    this.pings = this.pings.filter((p) => now - p.t < 1600);
    for (const p of this.pings) drawPing(ctx, p.x, p.y, now - p.t, z);
    // previews
    if (this.pointer && !this.drag || (this.drag && this.drag.kind === 'brush')) {
      const p = this.pointer;
      if (p) {
        const r = this.brushRadius();
        if (r > 0 && ['terrain', 'cave', 'fog', 'stamp'].includes(this.tool)) {
          ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 3 / z; ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.5 / z; ctx.stroke();
        }
        if (this.tool === 'door' && !this.drag) {
          const sp = this.snapDoor(p[0], p[1], this.opts.door.width);
          ctx.save(); ctx.translate(sp.x, sp.y); ctx.rotate(sp.rot);
          ctx.fillStyle = 'rgba(255,211,107,0.55)'; ctx.fillRect((-this.opts.door.width * CELL) / 2, -12, this.opts.door.width * CELL, 24);
          ctx.restore();
        }
        if ((this.tool === 'wall' || (this.tool === 'room' && !this.drag)) && !this.draft) {
          const [cx, cy] = this.tool === 'room' && this.opts.room.shape === 'poly' ? this.snapHalf(p[0], p[1]) : this.snapCorner(p[0], p[1]);
          ctx.fillStyle = '#ffd36b'; ctx.beginPath(); ctx.arc(cx, cy, 5 / z, 0, Math.PI * 2); ctx.fill();
        }
        if (this.tool === 'stamp' && !this.drag && !this.opts.stamp.scatter) {
          const s: Stamp = { id: '', type: this.opts.stamp.type, x: p[0], y: p[1], rot: 0, scale: this.opts.stamp.scale, variant: 0 };
          if (this.opts.stamp.snap) [s.x, s.y] = this.snapHalf(s.x, s.y);
          const { w, h, pad, img } = stampSize(s);
          if (img) { ctx.globalAlpha = 0.55; ctx.drawImage(img, s.x - (w / 2 + pad) * s.scale, s.y - (h / 2 + pad) * s.scale, (w + 2 * pad) * s.scale, (h + 2 * pad) * s.scale); ctx.globalAlpha = 1; }
        }
      }
    }
    ctx.restore();
  }

  private drawDimLabel(ctx: CanvasRenderingContext2D, x: number, y: number, t: string, z: number) {
    ctx.font = `700 ${14 / z}px system-ui, sans-serif`;
    const w = ctx.measureText(t).width;
    ctx.fillStyle = 'rgba(15,15,20,0.85)';
    ctx.fillRect(x + 8 / z, y + 8 / z, w + 12 / z, 22 / z);
    ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle';
    ctx.fillText(t, x + 14 / z, y + 19 / z);
  }

  private drawSelection(ctx: CanvasRenderingContext2D, z: number) {
    const o = this.getSel();
    if (!o || !this.sel) return;
    ctx.save();
    ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 2 / z; ctx.setLineDash([6 / z, 4 / z]);
    switch (this.sel.kind) {
      case 'stamp': {
        const hd = this.stampHandles(o);
        ctx.beginPath(); hd.corners.forEach((c) => ctx.lineTo(c[0], c[1])); ctx.closePath(); ctx.stroke();
        ctx.setLineDash([]);
        if (this.mode === 'edit') {
          ctx.beginPath(); ctx.moveTo((hd.corners[0][0] + hd.corners[1][0]) / 2, (hd.corners[0][1] + hd.corners[1][1]) / 2); ctx.lineTo(hd.rotate[0], hd.rotate[1]); ctx.stroke();
          for (const [p, round] of [[hd.scale, false], [hd.rotate, true]] as [[number, number], boolean][]) {
            ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5 / z;
            ctx.beginPath();
            if (round) ctx.arc(p[0], p[1], 6 / z, 0, Math.PI * 2); else ctx.rect(p[0] - 5 / z, p[1] - 5 / z, 10 / z, 10 / z);
            ctx.fill(); ctx.stroke();
          }
        }
        break;
      }
      case 'room': case 'wall': {
        ctx.beginPath();
        for (let i = 0; i < o.pts.length; i += 2) ctx.lineTo(o.pts[i], o.pts[i + 1]);
        if (this.sel.kind === 'room') ctx.closePath();
        ctx.lineWidth = 3 / z; ctx.stroke();
        break;
      }
      case 'door': {
        ctx.translate(o.x, o.y); ctx.rotate(o.rot);
        ctx.strokeRect((-o.width * CELL) / 2 - 4, -20, o.width * CELL + 8, 40);
        break;
      }
      case 'token': {
        ctx.setLineDash([]); ctx.lineWidth = 3 / z;
        ctx.beginPath(); ctx.arc(o.x, o.y, tokenRadius(o) + 6 / z, 0, Math.PI * 2); ctx.stroke();
        break;
      }
      case 'label': {
        ctx.font = labelFont(o);
        const lines = o.text.split('\n');
        const w = Math.max(...lines.map((t: string) => ctx.measureText(t).width)), hh = o.size * 1.15 * lines.length;
        ctx.translate(o.x, o.y); ctx.rotate(o.rot);
        ctx.strokeRect(-w / 2 - 6, -hh / 2 - 4, w + 12, hh + 8);
        break;
      }
      case 'marker': {
        const g = markerGeom(o, z);
        ctx.beginPath(); ctx.arc(g.cx, g.cy, g.r * 1.5, 0, Math.PI * 2); ctx.stroke();
        break;
      }
      case 'light': {
        ctx.beginPath(); ctx.arc(o.x, o.y, 14 / z, 0, Math.PI * 2); ctx.stroke();
        break;
      }
    }
    ctx.restore();
    void drawLabel; void ptsBBox;
  }

  updateHud() {
    if (this.el.zoomVal) this.el.zoomVal.textContent = Math.round(this.view.z * 100) + '%';
  }

  // ======================================================================== misc
  async exportPNG(scale: number, grid: boolean, tokens: boolean) {
    const rt = this.rt;
    this.showBusy('Esporto l\'immagine…');
    await nextFrame();
    try {
      const c = makeCanvas(rt.W * scale, rt.H * scale);
      renderScene(ctx2d(c), rt, { z: scale, x: 0, y: 0 }, c.width, c.height, 1, { player: true, fogAlpha: 0, markers: false, grid, tokens, ambientScale: 1, time: 0, background: null });
      const blob = await canvasToBlob(c);
      const { downloadBlob } = await import('./util');
      downloadBlob(blob, (rt.doc.name || 'mappa').replace(/[^\w\- àèéìòù]/gi, '') + '.png');
    } finally { this.hideBusy(); }
  }

  async storedCurrent(): Promise<StoredMap> {
    await this.saveNow();
    return (await getMap(this.rt.doc.id))!;
  }
  newLight(): Light { const o = this.opts.light; return { id: uid(), x: 0, y: 0, radius: o.radius, color: o.color, intensity: o.intensity, flicker: o.flicker }; }
}
