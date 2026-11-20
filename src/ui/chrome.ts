import { closePopover, h, icon, popover } from '../dom';
import type { Editor, Tool } from '../editor';
import { FONTS, MARKER_ICONS, TOKEN_KIND_NAMES, TOKEN_SIZE_NAMES, TokenKind, TokenSize, WallStyle } from '../model';
import { TEXTURES } from '../textures';
import { DOOR_NAMES, FLOORS, iconBtn, listPicker, miniSlider, sep, subBtn, texPicker, toggle, TOKEN_PRESETS, WALL_NAMES, WALL_SWATCH } from './common';

export type Intent = 'select' | 'paint' | 'build' | 'furnish' | 'annotate';
export const TOOL_INTENT: Record<Tool, Intent> = {
  select: 'select', terrain: 'paint', room: 'build', cave: 'build', wall: 'build', door: 'build',
  stamp: 'furnish', light: 'furnish', token: 'annotate', text: 'annotate', marker: 'annotate', measure: 'annotate', fog: 'select', ping: 'select',
};
export const INTENTS: { id: Intent; name: string; icon: string; tool: Tool; key: string }[] = [
  { id: 'select', name: 'Seleziona', icon: 'select', tool: 'select', key: 'V' },
  { id: 'paint', name: 'Dipingi', icon: 'paint', tool: 'terrain', key: 'B' },
  { id: 'build', name: 'Costruisci', icon: 'build', tool: 'room', key: 'R' },
  { id: 'furnish', name: 'Arreda', icon: 'furnish', tool: 'stamp', key: 'O' },
  { id: 'annotate', name: 'Annota', icon: 'annotate', tool: 'text', key: 'T' },
];

// ============================================================================ top bar
export function buildTopbar(ed: Editor): HTMLElement {
  const u = ed.el;
  u.mapThumb = h('img', { class: 'map-thumb-sm', alt: '' });
  u.mapName = h('span', { class: 'map-name' });
  u.modeSeg = h('div', { class: 'mode-seg', role: 'group', 'aria-label': 'Modalità' },
    h('button', { 'data-v': 'edit', onclick: () => ed.setMode('edit') }, icon('edit', 16), 'Prepara'),
    h('button', { 'data-v': 'session', onclick: () => ed.setMode('session') }, icon('play', 16), 'Gioca'));
  u.undo = iconBtn('undo', 'Annulla (Ctrl/Cmd+Z)', () => ed.undo());
  u.redo = iconBtn('redo', 'Ripeti (Shift+Ctrl/Cmd+Z)', () => ed.redo());
  u.tv = h('div', { class: 'tv-area' });
  const more: HTMLButtonElement = iconBtn('more', 'Altre azioni', () => import('./menus').then((m) => m.moreMenu(ed, more)));
  return h('header', { class: 'topbar' },
    h('div', { class: 'top-left' },
      h('button', { class: 'brand', title: 'Le tue mappe', onclick: () => ed.showHome() }, h('span', { class: 'brand-mark' }, icon('swords', 16)), h('span', { class: 'brand-name' }, 'Cartografo')),
      h('span', { class: 'top-sep' }),
      h('button', { class: 'map-switch', title: 'Le tue mappe', onclick: () => ed.showHome() }, u.mapThumb, u.mapName, icon('chevron', 14))),
    u.modeSeg,
    h('div', { class: 'top-right' }, u.undo, u.redo, h('span', { class: 'top-sep' }), u.tv, more));
}

export function updateTopbar(ed: Editor) {
  const u = ed.el;
  if (!ed.rt) return;
  u.mapName.textContent = ed.rt.doc.name;
  const meta = ed.maps.find((m) => m.id === ed.rt.doc.id);
  (u.mapThumb as HTMLImageElement).src = meta?.thumb || '';
  u.mapThumb.style.visibility = meta?.thumb ? 'visible' : 'hidden';
  u.modeSeg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', (b as HTMLElement).dataset.v === ed.mode));
  (u.undo as HTMLButtonElement).disabled = !ed.hist.canUndo;
  (u.redo as HTMLButtonElement).disabled = !ed.hist.canRedo;
  u.tv.innerHTML = '';
  if (!ed.playerConnected) {
    u.tv.append(h('button', { class: 'tv-btn', title: 'Apri la finestra da mostrare sulla TV', onclick: () => ed.openPlayer() }, icon('tv', 18), 'Schermo TV', h('span', { class: 'dot off' })));
  } else {
    u.tv.append(h('div', { class: 'tv-chip' },
      h('span', { class: 'tv-on' }, h('span', { class: 'dot on' }), 'TV collegata'),
      h('button', { title: 'Mostra ai giocatori quello che vedi ora', onclick: () => { ed.sendView(); import('../dom').then((d) => d.toast('Vista inviata alla TV')); } }, icon('expand', 16), 'Invia vista')));
    if (ed.mode === 'session') u.tv.append(toggle('Segui la mia vista', ed.follow, (v) => { ed.follow = v; if (v) ed.sendView(); }));
  }
}

// ============================================================================ rail
export function renderRail(ed: Editor) {
  const rail = ed.el.rail;
  rail.innerHTML = '';
  rail.hidden = ed.mode !== 'edit';
  if (ed.mode !== 'edit') return;
  const cur = TOOL_INTENT[ed.tool];
  for (const it of INTENTS) {
    rail.appendChild(h('button', {
      class: 'rail-btn' + (cur === it.id ? ' on' : ''), 'aria-pressed': String(cur === it.id), title: `${it.name} (${it.key})`,
      onclick: () => ed.setTool(ed.lastTool[it.id] || it.tool),
    }, icon(it.icon, 20), h('span', null, it.name)));
  }
}

// ============================================================================ dock
export function renderDock(ed: Editor) {
  const dock = ed.el.dock;
  dock.innerHTML = '';
  closePopover();
  const intent = TOOL_INTENT[ed.tool];
  dock.classList.toggle('session', ed.mode === 'session');
  if (ed.mode === 'edit' && (intent === 'furnish' || intent === 'select')) {
    dock.hidden = intent === 'furnish' || !ed.dockHint();
    if (!dock.hidden) dock.append(h('div', { class: 'dock-hint' }, ed.dockHint()));
    return;
  }
  dock.hidden = false;
  const bar = h('div', { class: 'dock-bar' });
  const hintText = ed.dockHint();
  if (hintText) dock.append(h('div', { class: 'dock-hint' }, hintText));
  dock.append(bar);
  const o = ed.opts;
  const rr = () => ed.refreshUI();
  const set = (t: Tool, extra?: () => void) => () => { extra?.(); ed.setTool(t); };
  if (ed.mode === 'session') {
    const fogMode = ed.tool === 'fog' ? o.fog.mode : null;
    bar.append(
      subBtn('Muovi', 'select', ed.tool === 'select', set('select')),
      sep(),
      subBtn('Rivela', 'eye', fogMode === 'reveal', set('fog', () => { o.fog.mode = 'reveal'; ed.ensureFog(); })),
      subBtn('Copri', 'fog', fogMode === 'hide', set('fog', () => { o.fog.mode = 'hide'; ed.ensureFog(); })),
      subBtn('Rivela stanza', 'revealRoom', fogMode === 'room', set('fog', () => { o.fog.mode = 'room'; ed.ensureFog(); })),
      sep(),
      subBtn('Ping', 'ping', ed.tool === 'ping', set('ping')),
      subBtn('Righello', 'measure', ed.tool === 'measure', set('measure')),
      sep(),
      subBtn('Pedina', 'tokenAdd', ed.tool === 'token', set('token')),
    );
    if (ed.tool === 'fog' && fogMode !== 'room') {
      bar.append(sep(), miniSlider('Pennello', o.fog.size, 0.5, 16, 0.5, (v) => { o.fog.size = v; ed.requestRender(); }, (v) => v + ' cas.'));
    }
    if (ed.tool === 'fog') {
      bar.append(h('button', { class: 'chip-btn', onclick: () => { ed.rt.fog.fillAll(); ed.requestRender(); } }, 'Copri tutto'),
        h('button', { class: 'chip-btn', onclick: () => { ed.rt.fog.clearAll(); ed.requestRender(); } }, 'Rivela tutto'));
    }
    if (ed.tool === 'token') bar.append(sep(), ...tokenOptions(ed));
    return;
  }
  if (intent === 'paint') {
    const t = o.terrain;
    bar.append(
      texPicker('Texture', TEXTURES.map((x) => x.id), t.tex, (id) => { t.tex = id; t.erase = false; rr(); }),
      sep(),
      subBtn('Dipingi', 'paint', !t.erase, () => { t.erase = false; rr(); }),
      subBtn('Cancella', 'x', t.erase, () => { t.erase = true; rr(); }),
      sep(),
      miniSlider('Dimensione', t.size, 0.25, 12, 0.25, (v) => { t.size = v; ed.requestRender(); }, (v) => v + ' cas.'),
      miniSlider('Morbidezza', 1 - t.hard, 0, 0.95, 0.05, (v) => { t.hard = 1 - v; }, (v) => Math.round(v * 100) + '%'),
    );
    return;
  }
  if (intent === 'build') {
    const isRect = ed.tool === 'room' && o.room.shape === 'rect', isPoly = ed.tool === 'room' && o.room.shape === 'poly';
    bar.append(
      subBtn('Stanza', 'roomRect', isRect, set('room', () => { o.room.shape = 'rect'; })),
      subBtn('Forma libera', 'roomPoly', isPoly, set('room', () => { o.room.shape = 'poly'; })),
      subBtn('Caverna', 'cave', ed.tool === 'cave', set('cave')),
      subBtn('Muro', 'wall', ed.tool === 'wall', set('wall')),
      subBtn('Porta', 'door', ed.tool === 'door', set('door')),
      sep(),
    );
    const doc = ed.rt.doc;
    if (ed.tool === 'room') {
      bar.append(
        texPicker('Pavimento', FLOORS, o.room.floor, (id) => { o.room.floor = id; rr(); }),
        listPicker<WallStyle>('Muri', WALL_NAMES, doc.wallStyle, (v) => { doc.wallStyle = v; ed.rt.engine.invalidateAll(); ed.changed('settings'); rr(); }, (v) => WALL_SWATCH[v]),
        toggle('Zona nebbia', o.room.zone, (v) => { o.room.zone = v; ed.refreshDockHint(); }),
      );
    } else if (ed.tool === 'cave') {
      bar.append(
        subBtn('Scava', 'cave', !o.cave.erase, () => { o.cave.erase = false; rr(); }),
        subBtn('Riempi', 'x', o.cave.erase, () => { o.cave.erase = true; rr(); }),
        miniSlider('Dimensione', o.cave.size, 0.5, 12, 0.25, (v) => { o.cave.size = v; ed.requestRender(); }, (v) => v + ' cas.'),
        texPicker('Pavimento', FLOORS, doc.caveFloor, (id) => { doc.caveFloor = id; ed.rt.engine.invalidateAll(); ed.changed('settings'); rr(); }),
      );
    } else if (ed.tool === 'wall') {
      bar.append(listPicker<WallStyle>('Stile', WALL_NAMES, o.wall.style, (v) => { o.wall.style = v; rr(); }, (v) => WALL_SWATCH[v]));
    } else if (ed.tool === 'door') {
      bar.append(
        listPicker('Tipo', DOOR_NAMES, o.door.kind, (v) => { o.door.kind = v; rr(); }),
        listPicker('Larghezza', [['1', '1 casella'], ['2', '2 caselle']] as ['1' | '2', string][], String(o.door.width) as '1' | '2', (v) => { o.door.width = +v; if (+v === 2 && o.door.kind === 'wood') o.door.kind = 'double'; rr(); }),
      );
    }
    return;
  }
  if (intent === 'annotate') {
    bar.append(
      subBtn('Testo', 'text', ed.tool === 'text', set('text')),
      subBtn('Segnaposto', 'marker', ed.tool === 'marker', set('marker')),
      subBtn('Pedina', 'token', ed.tool === 'token', set('token')),
      subBtn('Righello', 'measure', ed.tool === 'measure', set('measure')),
      sep(),
    );
    if (ed.tool === 'text') {
      const t = o.text;
      bar.append(
        listPicker('Font', FONTS.map((f) => [f, f] as [string, string]), t.font, (v) => { t.font = v; rr(); }),
        miniSlider('Dimensione', t.size, 12, 200, 2, (v) => { t.size = v; }),
        colorDot('Colore', t.color, (v) => { t.color = v; }),
      );
    } else if (ed.tool === 'marker') {
      const m = o.marker;
      const ib: HTMLButtonElement = h('button', { class: 'picker', onclick: () => popover(ib, h('div', { class: 'pop-body' }, h('div', { class: 'pop-title' }, 'Icona'),
        h('div', { class: 'icons' }, ...MARKER_ICONS.map((i) => h('button', { class: i === m.icon ? 'on' : '', onclick: () => { m.icon = i; closePopover(); rr(); } }, i))))) },
        h('span', { class: 'picker-emoji' }, m.icon), h('span', { class: 'picker-text' }, h('small', null, 'Icona'), h('span', null, 'Cambia')), icon('chevron', 14));
      bar.append(ib, colorDot('Colore', m.color, (v) => { m.color = v; }));
    } else if (ed.tool === 'token') {
      bar.append(...tokenOptions(ed));
    } else if (ed.tool === 'measure') {
      const inp = h('input', { type: 'number', value: ed.rt.doc.grid.feet, min: 1, max: 100, class: 'num-sm', 'aria-label': 'Piedi per casella', onchange: () => { ed.rt.doc.grid.feet = +inp.value || 5; ed.changed('settings'); } });
      bar.append(h('label', { class: 'mini-slider' }, h('span', { class: 'mini-label' }, 'Piedi per casella'), inp));
    }
  }
}

function colorDot(label: string, value: string, onInput: (v: string) => void) {
  const i = h('input', { type: 'color', value, 'aria-label': label, oninput: () => onInput(i.value) });
  return h('label', { class: 'color-dot', title: label }, i, h('span', null, label));
}

function tokenOptions(ed: Editor): HTMLElement[] {
  const o = ed.opts.token;
  const rr = () => ed.refreshUI();
  const pb: HTMLButtonElement = h('button', { class: 'picker', onclick: () => popover(pb, h('div', { class: 'pop-body' }, h('div', { class: 'pop-title' }, 'Modelli rapidi'),
    h('div', { class: 'chips' }, ...TOKEN_PRESETS.map((p) => h('button', { class: 'chip' + (o.name === p.name ? ' on' : ''), onclick: () => { o.name = p.name; o.kind = p.kind; o.size = p.size; closePopover(); rr(); } }, p.name))))) },
    h('span', { class: 'picker-text' }, h('small', null, 'Nome'), h('span', null, o.name)), icon('chevron', 14));
  return [
    pb,
    listPicker('Tipo', Object.entries(TOKEN_KIND_NAMES) as [TokenKind, string][], o.kind, (v) => { o.kind = v; rr(); }),
    listPicker('Taglia', Object.entries(TOKEN_SIZE_NAMES) as [TokenSize, string][], o.size, (v) => { o.size = v; rr(); }),
  ];
}

// ============================================================================ zoom + save
export function buildZoom(ed: Editor): HTMLElement {
  ed.el.zoomVal = h('span', { class: 'zoom-val' }, '100%');
  return h('div', { class: 'zoom' },
    iconBtn('minus', 'Riduci zoom', () => ed.zoomCenter(1 / 1.25)),
    ed.el.zoomVal,
    iconBtn('plus', 'Aumenta zoom', () => ed.zoomCenter(1.25)),
    h('button', { class: 'zoom-fit', onclick: () => ed.fitView() }, 'Adatta'));
}
