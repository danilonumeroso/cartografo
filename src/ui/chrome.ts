import { closePopover, h, icon, popover } from '../dom';
import type { Editor, Tool } from '../editor';
import { FONTS, MARKER_ICONS, TOKEN_KIND_NAMES, TOKEN_SIZE_NAMES, TokenKind, TokenSize, WallStyle } from '../model';
import { BIOMES, TEXTURES } from '../textures';
import { DOOR_NAMES, FLOORS, iconBtn, PATH_NAMES, PATH_WIDTH, listPicker, miniSlider, sep, subBtn, texPicker, toggle, TOKEN_PRESETS, WALL_NAMES, WALL_SWATCH } from './common';
import { t } from '../i18n';
import { BUILDING_KINDS, ROOF_NAMES } from '../places';
import { ROOF_COLORS } from '../buildings';
import type { BuildingKind, RoofStyle } from '../model';

export type Intent = 'select' | 'paint' | 'build' | 'furnish' | 'annotate';
export const TOOL_INTENT: Record<Tool, Intent> = {
  select: 'select', terrain: 'paint', room: 'build', cave: 'build', wall: 'build', door: 'build', path: 'build', building: 'build',
  stamp: 'furnish', light: 'furnish', token: 'annotate', text: 'annotate', marker: 'annotate', measure: 'annotate', fog: 'select', ping: 'select',
};
export const INTENTS: { id: Intent; name: string; icon: string; tool: Tool; key: string }[] = [
  { id: 'select', name: t('Select'), icon: 'select', tool: 'select', key: 'V' },
  { id: 'paint', name: t('Paint'), icon: 'paint', tool: 'terrain', key: 'B' },
  { id: 'build', name: t('Build'), icon: 'build', tool: 'room', key: 'R' },
  { id: 'furnish', name: t('Furnish'), icon: 'furnish', tool: 'stamp', key: 'O' },
  { id: 'annotate', name: t('Annotate'), icon: 'annotate', tool: 'text', key: 'T' },
];

// ============================================================================ top bar
export function buildTopbar(ed: Editor): HTMLElement {
  const u = ed.el;
  u.mapThumb = h('img', { class: 'map-thumb-sm', alt: '' });
  u.mapName = h('span', { class: 'map-name' });
  u.modeSeg = h('div', { class: 'mode-seg', role: 'group', 'aria-label': t('Mode') },
    h('button', { 'data-v': 'edit', onclick: () => ed.setMode('edit') }, icon('edit', 16), t('Prepare')),
    h('button', { 'data-v': 'session', onclick: () => ed.setMode('session') }, icon('play', 16), t('Play')));
  u.undo = iconBtn('undo', t('Undo (Ctrl/Cmd+Z)'), () => ed.undo());
  u.redo = iconBtn('redo', t('Redo (Shift+Ctrl/Cmd+Z)'), () => ed.redo());
  u.tv = h('div', { class: 'tv-area' });
  const more: HTMLButtonElement = iconBtn('more', t('More actions'), () => import('./menus').then((m) => m.moreMenu(ed, more)));
  return h('header', { class: 'topbar' },
    h('div', { class: 'top-left' },
      h('button', { class: 'brand', title: t('Your maps'), onclick: () => ed.showHome() }, h('span', { class: 'brand-mark' }, icon('swords', 16)), h('span', { class: 'brand-name' }, 'Cartografo')),
      h('span', { class: 'top-sep' }),
      h('button', { class: 'map-switch', title: t('Your maps'), onclick: () => ed.showHome() }, u.mapThumb, u.mapName, icon('chevron', 14)),
      u.parent = h('button', { class: 'chip-btn parent-btn', hidden: true })),
    u.modeSeg,
    h('div', { class: 'top-right' }, u.undo, u.redo, h('span', { class: 'top-sep' }), u.tv, more));
}

export function updateTopbar(ed: Editor) {
  const u = ed.el;
  if (!ed.rt) return;
  u.mapName.textContent = ed.rt.doc.name;
  const parent = ed.rt.doc.parent ? ed.maps.find((m) => m.id === ed.rt.doc.parent) : null;
  u.parent.hidden = !parent;
  if (parent) { u.parent.replaceChildren(icon('arrowLeft', 14), t('Back to {name}', { name: parent.name })); u.parent.onclick = () => ed.openMap(parent.id); }
  const meta = ed.maps.find((m) => m.id === ed.rt.doc.id);
  if (meta?.thumb) { (u.mapThumb as HTMLImageElement).src = meta.thumb; u.mapThumb.hidden = false; }
  else u.mapThumb.hidden = true;
  u.modeSeg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', (b as HTMLElement).dataset.v === ed.mode));
  (u.undo as HTMLButtonElement).disabled = !ed.hist.canUndo;
  (u.redo as HTMLButtonElement).disabled = !ed.hist.canRedo;
  u.tv.innerHTML = '';
  if (!ed.playerConnected) {
    u.tv.append(h('button', { class: 'tv-btn', title: t('Open the window to show on the TV'), onclick: () => ed.openPlayer() }, icon('tv', 18), t('TV screen'), h('span', { class: 'dot off' })));
  } else {
    u.tv.append(h('div', { class: 'tv-chip' },
      h('span', { class: 'tv-on' }, h('span', { class: 'dot on' }), t('TV connected')),
      h('button', { title: t('Show players what you see now'), onclick: () => { ed.sendView(); import('../dom').then((d) => d.toast(t('View sent to the TV'))); } }, icon('expand', 16), t('Send view'))));
    if (ed.mode === 'session') u.tv.append(toggle(t('Follow my view'), ed.follow, (v) => { ed.follow = v; if (v) ed.sendView(); }));
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
      onclick: () => ed.setTool(ed.lastTool[it.id] || (it.id === 'build' && ed.rt.doc.kind === 'world' ? 'path' : it.id === 'build' && ed.rt.doc.kind === 'city' ? 'building' : it.tool)),
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
      subBtn(t('Move'), 'select', ed.tool === 'select', set('select')),
      sep(),
      subBtn(t('Reveal'), 'eye', fogMode === 'reveal', set('fog', () => { o.fog.mode = 'reveal'; ed.ensureFog(); })),
      subBtn(t('Cover'), 'fog', fogMode === 'hide', set('fog', () => { o.fog.mode = 'hide'; ed.ensureFog(); })),
      subBtn(t('Reveal room'), 'revealRoom', fogMode === 'room', set('fog', () => { o.fog.mode = 'room'; ed.ensureFog(); })),
      sep(),
      subBtn('Ping', 'ping', ed.tool === 'ping', set('ping')),
      subBtn(t('Ruler'), 'measure', ed.tool === 'measure', set('measure')),
      sep(),
      subBtn(t('Token'), 'tokenAdd', ed.tool === 'token', set('token')),
    );
    if (ed.tool === 'fog' && fogMode !== 'room') {
      bar.append(sep(), miniSlider(t('Brush'), o.fog.size, 0.5, 16, 0.5, (v) => { o.fog.size = v; ed.requestRender(); }, (v) => t('{n} sq.', { n: v })));
    }
    if (ed.tool === 'fog') {
      bar.append(h('button', { class: 'chip-btn', onclick: () => { ed.rt.fog.fillAll(); ed.requestRender(); } }, t('Cover all')),
        h('button', { class: 'chip-btn', onclick: () => { ed.rt.fog.clearAll(); ed.requestRender(); } }, t('Reveal all')));
    }
    if (ed.tool === 'token') bar.append(sep(), ...tokenOptions(ed));
    return;
  }
  const world = ed.rt.doc.kind === 'world';
  if (intent === 'paint') {
    const tok = o.terrain;
    const ids = world ? ['land', ...BIOMES] : TEXTURES.filter((x) => !x.world && x.id !== 'land').map((x) => x.id);
    if (!ids.includes(tok.tex)) tok.tex = ids[0];
    bar.append(
      texPicker(world ? t('Terrain') : 'Texture', ids, tok.tex, (id) => { tok.tex = id; tok.erase = false; rr(); }),
      sep(),
      subBtn(t('Paint'), 'paint', !tok.erase, () => { tok.erase = false; rr(); }),
      subBtn(t('Erase'), 'x', tok.erase, () => { tok.erase = true; rr(); }),
      sep(),
      miniSlider(t('Size'), tok.size, 0.25, 12, 0.25, (v) => { tok.size = v; ed.requestRender(); }, (v) => t('{n} sq.', { n: v })),
      miniSlider(t('Softness'), 1 - tok.hard, 0, 0.95, 0.05, (v) => { tok.hard = 1 - v; }, (v) => Math.round(v * 100) + '%'),
    );
    return;
  }
  if (intent === 'build' && world) {
    const pk = o.path;
    bar.append(...PATH_NAMES.filter(([k]) => k !== 'citywall').map(([k, name, ico]) => subBtn(name, ico, ed.tool === 'path' && pk.kind === k, set('path', () => { pk.kind = k; pk.width = PATH_WIDTH[k]; }))), sep(),
      miniSlider(t('Width'), pk.width, 3, 30, 1, (v) => { pk.width = v; }, (v) => String(v)));
    return;
  }
  if (intent === 'build' && ed.rt.doc.kind === 'city') {
    const pk = o.path, bo = o.building;
    bar.append(
      subBtn(t('Building'), 'roomRect', ed.tool === 'building', set('building')),
      subBtn(t('City wall'), 'wall', ed.tool === 'path' && pk.kind === 'citywall', set('path', () => { pk.kind = 'citywall'; pk.width = PATH_WIDTH.citywall; })),
      subBtn(t('River'), 'river', ed.tool === 'path' && pk.kind === 'river', set('path', () => { pk.kind = 'river'; pk.width = 60; })),
      sep());
    if (ed.tool === 'building') bar.append(
      listPicker<BuildingKind>(t('Type'), BUILDING_KINDS, bo.kind, (v) => { bo.kind = v; rr(); }),
      listPicker<RoofStyle>(t('Roof'), ROOF_NAMES, bo.roof, (v) => { bo.roof = v; rr(); }, (v) => ROOF_COLORS[v][0]));
    else bar.append(miniSlider(t('Width'), pk.width, 3, 120, 1, (v) => { pk.width = v; }, (v) => String(v)));
    return;
  }
  if (intent === 'build') {
    const isRect = ed.tool === 'room' && o.room.shape === 'rect', isPoly = ed.tool === 'room' && o.room.shape === 'poly';
    bar.append(
      subBtn(t('Room'), 'roomRect', isRect, set('room', () => { o.room.shape = 'rect'; })),
      subBtn(t('Freeform'), 'roomPoly', isPoly, set('room', () => { o.room.shape = 'poly'; })),
      subBtn(t('Cave'), 'cave', ed.tool === 'cave', set('cave')),
      subBtn(t('Wall'), 'wall', ed.tool === 'wall', set('wall')),
      subBtn(t('Door'), 'door', ed.tool === 'door', set('door')),
      sep(),
    );
    const doc = ed.rt.doc;
    if (ed.tool === 'room') {
      bar.append(
        texPicker(t('Floor'), FLOORS, o.room.floor, (id) => { o.room.floor = id; rr(); }),
        listPicker<WallStyle>(t('Walls'), WALL_NAMES, doc.wallStyle, (v) => { doc.wallStyle = v; ed.rt.engine.invalidateAll(); ed.changed('settings'); rr(); }, (v) => WALL_SWATCH[v]),
        toggle(t('Fog zone'), o.room.zone, (v) => { o.room.zone = v; ed.refreshDockHint(); }),
      );
    } else if (ed.tool === 'cave') {
      bar.append(
        subBtn(t('Dig'), 'cave', !o.cave.erase, () => { o.cave.erase = false; rr(); }),
        subBtn(t('Fill'), 'x', o.cave.erase, () => { o.cave.erase = true; rr(); }),
        miniSlider(t('Size'), o.cave.size, 0.5, 12, 0.25, (v) => { o.cave.size = v; ed.requestRender(); }, (v) => t('{n} sq.', { n: v })),
        texPicker(t('Floor'), FLOORS, doc.caveFloor, (id) => { doc.caveFloor = id; ed.rt.engine.invalidateAll(); ed.changed('settings'); rr(); }),
      );
    } else if (ed.tool === 'wall') {
      bar.append(listPicker<WallStyle>(t('Style'), WALL_NAMES, o.wall.style, (v) => { o.wall.style = v; rr(); }, (v) => WALL_SWATCH[v]));
    } else if (ed.tool === 'door') {
      bar.append(
        listPicker(t('Type'), DOOR_NAMES, o.door.kind, (v) => { o.door.kind = v; rr(); }),
        listPicker(t('Width'), [['1', '1 casella'], ['2', '2 caselle']] as ['1' | '2', string][], String(o.door.width) as '1' | '2', (v) => { o.door.width = +v; if (+v === 2 && o.door.kind === 'wood') o.door.kind = 'double'; rr(); }),
      );
    }
    return;
  }
  if (intent === 'annotate') {
    bar.append(
      subBtn(t('Text'), 'text', ed.tool === 'text', set('text')),
      subBtn(t('Marker'), 'marker', ed.tool === 'marker', set('marker')),
      subBtn(t('Token'), 'token', ed.tool === 'token', set('token')),
      subBtn(t('Ruler'), 'measure', ed.tool === 'measure', set('measure')),
      sep(),
    );
    if (ed.tool === 'text') {
      const tok = o.text;
      bar.append(
        listPicker('Font', FONTS.map((f) => [f, f] as [string, string]), tok.font, (v) => { tok.font = v; rr(); }),
        miniSlider(t('Size'), tok.size, 12, 200, 2, (v) => { tok.size = v; }),
        colorDot(t('Color'), tok.color, (v) => { tok.color = v; }),
      );
    } else if (ed.tool === 'marker') {
      const m = o.marker;
      const ib: HTMLButtonElement = h('button', { class: 'picker', onclick: () => popover(ib, h('div', { class: 'pop-body' }, h('div', { class: 'pop-title' }, t('Icon')),
        h('div', { class: 'icons' }, ...MARKER_ICONS.map((i) => h('button', { class: i === m.icon ? 'on' : '', onclick: () => { m.icon = i; closePopover(); rr(); } }, i))))) },
        h('span', { class: 'picker-emoji' }, m.icon), h('span', { class: 'picker-text' }, h('small', null, t('Icon')), h('span', null, t('Change'))), icon('chevron', 14));
      bar.append(ib, colorDot(t('Color'), m.color, (v) => { m.color = v; }));
    } else if (ed.tool === 'token') {
      bar.append(...tokenOptions(ed));
    } else if (ed.tool === 'measure' && world) {
      const g = ed.rt.doc.grid;
      const inp = h('input', { type: 'number', value: g.feet, min: 0.5, max: 500, step: 0.5, class: 'num-sm', 'aria-label': t('Distance per hex'), onchange: () => { g.feet = +inp.value || 6; ed.changed('settings'); } });
      bar.append(h('label', { class: 'mini-slider' }, h('span', { class: 'mini-label' }, t('Distance per hex')), inp),
        listPicker<'mi' | 'km'>(t('Unit'), [['mi', t('Miles')], ['km', t('Kilometres')]], g.unit === 'km' ? 'km' : 'mi', (v) => { g.unit = v; ed.changed('settings'); rr(); }));
    } else if (ed.tool === 'measure') {
      const inp = h('input', { type: 'number', value: ed.rt.doc.grid.feet, min: 1, max: 100, class: 'num-sm', 'aria-label': t('Feet per square'), onchange: () => { ed.rt.doc.grid.feet = +inp.value || 5; ed.changed('settings'); } });
      bar.append(h('label', { class: 'mini-slider' }, h('span', { class: 'mini-label' }, t('Feet per square')), inp));
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
  const pb: HTMLButtonElement = h('button', { class: 'picker', onclick: () => popover(pb, h('div', { class: 'pop-body' }, h('div', { class: 'pop-title' }, t('Quick presets')),
    h('div', { class: 'chips' }, ...TOKEN_PRESETS.map((p) => h('button', { class: 'chip' + (o.name === p.name ? ' on' : ''), onclick: () => { o.name = p.name; o.kind = p.kind; o.size = p.size; closePopover(); rr(); } }, p.name))))) },
    h('span', { class: 'picker-text' }, h('small', null, t('Name')), h('span', null, o.name)), icon('chevron', 14));
  return [
    pb,
    listPicker(t('Type'), Object.entries(TOKEN_KIND_NAMES) as [TokenKind, string][], o.kind, (v) => { o.kind = v; rr(); }),
    listPicker(t('Creature size'), Object.entries(TOKEN_SIZE_NAMES) as [TokenSize, string][], o.size, (v) => { o.size = v; rr(); }),
  ];
}

// ============================================================================ zoom + save
export function buildZoom(ed: Editor): HTMLElement {
  ed.el.zoomVal = h('span', { class: 'zoom-val' }, '100%');
  return h('div', { class: 'zoom' },
    iconBtn('minus', t('Zoom out'), () => ed.zoomCenter(1 / 1.25)),
    ed.el.zoomVal,
    iconBtn('plus', t('Zoom in'), () => ed.zoomCenter(1.25)),
    h('button', { class: 'zoom-fit', onclick: () => ed.fitView() }, t('Fit')));
}
