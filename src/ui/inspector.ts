import { assets } from '../assets';
import { closePopover, h, icon, pickFile, popover } from '../dom';
import type { Editor } from '../editor';
import {
  CELL, CONDITIONS, Door, FONTS, hpStatus, Label, Light, MARKER_ICONS, Marker, Room, Stamp, Token, TOKEN_KIND_COLORS, TOKEN_KIND_NAMES, TOKEN_SIZE_NAMES, TokenKind, TokenSize, Wall, WallStyle, MapPath, PathKind,
} from '../model';
import { labelFont, markerGeom, tokenRadius } from '../render';
import { STAMP_BY_ID, VARIANTS } from '../stamps';
import { BUILDING_KINDS, buildingName, buildingTemplate, LINK_TEMPLATES, ROOF_NAMES, suggestedTemplate } from '../places';
import { ROOF_COLORS, roofColor } from '../buildings';
import type { Building, BuildingKind, RoofStyle } from '../model';
import { DOOR_NAMES, FLOORS, iconBtn, PATH_NAMES, listPicker, miniSlider, texName, texSwatch, toggle, WALL_NAMES, WALL_SWATCH } from './common';
import { t } from '../i18n';

type M = (label: string, fn: () => void, key?: string) => void;

export function renderInspector(ed: Editor) {
  const box = ed.el.inspector;
  box.innerHTML = '';
  box.className = 'inspector';
  const o = ed.getSel();
  if (!o || !ed.sel) { box.hidden = true; return; }
  box.hidden = false;
  const id = o.id;
  const m: M = (label, fn, key) => ed.mutate(label, fn, key ? key + ':' + id : undefined);
  const session = ed.mode === 'session';
  const del = iconBtn('trash', t('Delete'), () => ed.deleteSel(), 'danger');
  const dup = iconBtn('copy', t('Duplicate'), () => ed.duplicateSel());
  switch (ed.sel.kind) {
    case 'stamp': return stampBar(ed, box, o as Stamp, m, dup, del);
    case 'building': return buildingCard(ed, box, o as Building, m, dup, del);
    case 'wall': {
      const w = o as Wall;
      box.classList.add('toolbar');
      box.append(h('span', { class: 'tb-title' }, t('Wall')), listPicker<WallStyle>(t('Style'), WALL_NAMES, w.style, (v) => { m(t('Style'), () => { w.style = v; }); ed.refreshUI(); }, (v) => WALL_SWATCH[v]), h('span', { class: 'tb-sep' }), dup, del);
      return;
    }
    case 'path': {
      const p = o as MapPath;
      box.classList.add('toolbar');
      box.append(h('span', { class: 'tb-title' }, t('Path')),
        listPicker<PathKind>(t('Type'), PATH_NAMES.map(([k, n]) => [k, n] as [PathKind, string]), p.kind, (v) => { m(t('Type'), () => { p.kind = v; }); ed.refreshUI(); }),
        miniSlider(t('Width'), p.width, 3, 30, 1, (v) => m(t('Width'), () => { p.width = v; }, 'width')),
        h('span', { class: 'tb-sep' }), dup, del);
      return;
    }
    case 'door': {
      const d = o as Door;
      box.classList.add('toolbar');
      box.append(h('span', { class: 'tb-title' }, t('Door')),
        h('button', { class: 'chip-btn' + (d.open ? ' on' : ''), onclick: () => ed.toggleDoor(d.id) }, d.open ? t('Open') : t('Closed')));
      if (!session) box.append(
        listPicker(t('Type'), DOOR_NAMES, d.kind, (v) => { m(t('Door type'), () => { d.kind = v; }); ed.refreshUI(); }),
        iconBtn('rotate', t('Rotate 90°'), () => m(t('Rotate'), () => { d.rot += Math.PI / 2; })),
        h('span', { class: 'tb-sep' }), dup, del);
      return;
    }
    case 'room': return roomCard(ed, box, o as Room, m, dup, del);
    case 'light': return lightCard(ed, box, o as Light, m, del);
    case 'label': return labelCard(ed, box, o as Label, m, dup, del);
    case 'marker': return markerCard(ed, box, o as Marker, m, del);
    case 'token': return tokenCard(ed, box, o as Token, m, del);
  }
}

function cardHead(ed: Editor, title: HTMLElement | string, ...extra: HTMLElement[]) {
  return h('div', { class: 'card-head' }, typeof title === 'string' ? h('strong', null, title) : title, ...extra, iconBtn('x', t('Close'), () => ed.select(null)));
}

function stampBar(ed: Editor, box: HTMLElement, s: Stamp, m: M, dup: HTMLElement, del: HTMLElement) {
  box.classList.add('toolbar');
  const isAsset = s.type.startsWith('asset:');
  const name = isAsset ? assets.recs.get(s.type.slice(6))?.name || 'Asset' : STAMP_BY_ID.get(s.type)?.name || s.type;
  const scaleTxt = h('span', { class: 'tb-val' }, s.scale.toFixed(1) + '×');
  const setScale = (k: number) => { m(t(t('Stairs')), () => { s.scale = Math.max(0.1, Math.min(10, +(s.scale * k).toFixed(2))); }, 'scale'); scaleTxt.textContent = s.scale.toFixed(1) + '×'; };
  box.append(
    h('span', { class: 'tb-title' }, name),
    h('span', { class: 'tb-sep' }),
    iconBtn('rotate', t('Rotate 15° (E)'), () => m(t('Rotate'), () => { s.rot += Math.PI / 12; }, 'rot')),
    iconBtn('flip', t('Mirror'), () => m(t('Mirror'), () => { s.flip = !s.flip; })),
    iconBtn('minus', t('Shrink'), () => setScale(1 / 1.1)), scaleTxt, iconBtn('plus', t('Enlarge'), () => setScale(1.1)),
    !isAsset ? iconBtn('dice', t('Another variant'), () => m(t('Variant'), () => { s.variant = (s.variant + 1) % VARIANTS; })) : '',
    h('span', { class: 'tb-sep' }),
    iconBtn(s.hidden ? 'eyeOff' : 'eye', s.hidden ? t('Hidden from players: show') : t('Visible to players: hide'), () => { m(t('Visibility'), () => { s.hidden = !s.hidden; }); ed.refreshUI(); }, s.hidden ? 'warn' : ''),
    dup, del,
  );
  if (STAMP_BY_ID.get(s.type)?.world) box.append(h('span', { class: 'tb-sep' }), placeLink(ed, s, m, suggestedTemplate(s.type)));
}

/** Link a place on the world map to a battle map: open it, create one, or pick an existing map. */
function placeLink(ed: Editor, s: Stamp | Building, m: M, suggested: string): HTMLElement {
  const linked = s.link ? ed.maps.find((x) => x.id === s.link) : null;
  if (linked) return h('span', { class: 'tb-group' },
    h('button', { class: 'btn-primary btn-sm', onclick: () => ed.openLinked(s) }, icon('arrowRight', 16), t('Open {name}', { name: linked.name })),
    iconBtn('x', t('Remove the link'), () => { m(t('Link'), () => { s.link = undefined; }); ed.refreshUI(); }));
  const btn: HTMLButtonElement = h('button', { class: 'chip-btn', onclick: () => {
    const others = ed.maps.filter((x) => x.id !== ed.rt.doc.id);
    const opts = [...LINK_TEMPLATES].sort((a, b) => (a[0] === suggested ? -1 : b[0] === suggested ? 1 : 0));
    popover(btn, h('div', { class: 'pop-body' },
      h('div', { class: 'pop-title' }, t('Create a map for this place')),
      h('div', { class: 'pop-list' }, ...opts.map(([tpl, name]) => h('button', { onclick: () => { closePopover(); ed.createLinkedMap(s, tpl); } },
        name(), tpl === suggested ? h('small', { class: 'pop-note' }, t('suggested')) : ''))),
      others.length ? h('div', { class: 'pop-title' }, t('Or link an existing map')) : '',
      others.length ? h('div', { class: 'pop-list' }, ...others.map((x) => h('button', { onclick: () => { closePopover(); m(t('Link'), () => { s.link = x.id; }); ed.refreshUI(); } }, x.name))) : ''), 'below');
  } }, icon('map', 16), t('Battle map…'));
  return btn;
}

/** A building on a city map: name, type, roof, size and the map it opens. */
function buildingCard(ed: Editor, box: HTMLElement, b: Building, m: M, dup: HTMLElement, del: HTMLElement) {
  box.classList.add('card');
  const name = h('input', { type: 'text', class: 'title-input', value: b.name || '', placeholder: buildingName({ ...b, name: undefined }), 'aria-label': t('Name'), oninput: () => m(t('Name'), () => { b.name = name.value || undefined; }, 'name') });
  const col = h('input', { type: 'color', value: roofColor(b), 'aria-label': t('Roof color'), oninput: () => m(t('Color'), () => { b.color = col.value; }, 'col') });
  if (ed.mode === 'session') {
    box.append(cardHead(ed, h('strong', null, buildingName(b))));
    if (b.link) box.append(h('div', { class: 'card-actions' }, placeLink(ed, b, m, buildingTemplate(b))));
    return;
  }
  box.append(cardHead(ed, name),
    h('div', { class: 'card-row' },
      listPicker<BuildingKind>(t('Type'), BUILDING_KINDS, b.kind, (v) => { m(t('Type'), () => { b.kind = v; }); ed.refreshUI(); }),
      listPicker<RoofStyle>(t('Roof'), ROOF_NAMES, b.roof, (v) => { m(t('Roof'), () => { b.roof = v; b.color = undefined; }); ed.refreshUI(); }, (v) => ROOF_COLORS[v][0])),
    miniSlider(t('Width'), +(b.w / CELL * 10).toFixed(0), 3, 60, 1, (v) => m(t('Size'), () => { b.w = (v / 10) * CELL; }, 'w'), (v) => v + ' m'),
    miniSlider(t('Depth'), +(b.h / CELL * 10).toFixed(0), 3, 60, 1, (v) => m(t('Size'), () => { b.h = (v / 10) * CELL; }, 'h'), (v) => v + ' m'),
    miniSlider(t('Rotation'), Math.round((b.rot * 180) / Math.PI), -180, 180, 1, (v) => m(t('Rotate'), () => { b.rot = (v * Math.PI) / 180; }, 'rot'), (v) => v + '°'),
    h('div', { class: 'card-row' }, h('label', { class: 'color-dot' }, col, h('span', null, t('Roof color')))),
    h('div', { class: 'card-sec' }, h('span', { class: 'card-label' }, t('Interior')), placeLink(ed, b, m, buildingTemplate(b))),
    h('div', { class: 'card-actions' }, dup, del));
}

function roomCard(ed: Editor, box: HTMLElement, r: Room, m: M, dup: HTMLElement, del: HTMLElement) {
  box.classList.add('card');
  const name = h('input', { type: 'text', class: 'title-input', value: r.name || '', 'aria-label': t('Name'), oninput: () => m(t('Name'), () => { r.name = name.value; }, 'name') });
  box.append(cardHead(ed, name));
  if (!r.zoneOnly) box.append(h('div', { class: 'card-sec' }, h('span', { class: 'card-label' }, t('Floor · {name}', { name: texName(r.floor) })),
    h('div', { class: 'swatches compact' }, ...FLOORS.map((f) => h('button', { class: 'swatch' + (f === r.floor ? ' on' : ''), title: texName(f), 'aria-label': texName(f), onclick: () => { m(t('Floor'), () => { r.floor = f; }); ed.refreshUI(); } }, h('img', { src: texSwatch(f), alt: '' }))))));
  box.append(
    toggle(t('Fog zone only (no floor or walls)'), !!r.zoneOnly, (v) => { m(t('Zone'), () => { r.zoneOnly = v || undefined; }); ed.refreshUI(); }),
    h('div', { class: 'card-actions' }, dup, del));
}

function lightCard(ed: Editor, box: HTMLElement, l: Light, m: M, del: HTMLElement) {
  box.classList.add('card');
  const col = h('input', { type: 'color', value: l.color, 'aria-label': t('Color'), oninput: () => m(t('Light'), () => { l.color = col.value; }, 'lc') });
  box.append(cardHead(ed, t('Light')),
    miniSlider(t('Radius'), l.radius, 1, 20, 0.5, (v) => m(t('Light'), () => { l.radius = v; }, 'lr'), (v) => t('{n} sq.', { n: v })),
    miniSlider(t('Intensity'), l.intensity, 0.1, 1, 0.05, (v) => m(t('Light'), () => { l.intensity = v; }, 'li'), (v) => Math.round(v * 100) + '%'),
    h('div', { class: 'card-row' }, h('label', { class: 'color-dot' }, col, h('span', null, t('Color'))), toggle(t('Flicker'), l.flicker, (v) => m(t('Light'), () => { l.flicker = v; }))),
    h('div', { class: 'card-actions' }, del));
}

function labelCard(ed: Editor, box: HTMLElement, l: Label, m: M, dup: HTMLElement, del: HTMLElement) {
  box.classList.add('card');
  const ta = h('textarea', { rows: 2, 'aria-label': t('Text'), oninput: () => m(t('Text'), () => { l.text = ta.value; }, 'text') });
  ta.value = l.text;
  const col = h('input', { type: 'color', value: l.color, 'aria-label': t('Color'), oninput: () => m(t('Color'), () => { l.color = col.value; }, 'col') });
  const str = h('input', { type: 'color', value: l.stroke, 'aria-label': t('Outline'), oninput: () => m(t('Color'), () => { l.stroke = str.value; }, 'str') });
  box.append(cardHead(ed, t('Text')), ta,
    listPicker('Font', FONTS.map((f) => [f, f] as [string, string]), l.font, (v) => { m('Font', () => { l.font = v; }); ed.refreshUI(); }),
    miniSlider(t('Size'), l.size, 10, 300, 2, (v) => m(t('Size'), () => { l.size = v; }, 'size')),
    miniSlider(t('Rotation'), Math.round((l.rot * 180) / Math.PI), -180, 180, 1, (v) => m(t('Rotate'), () => { l.rot = (v * Math.PI) / 180; }, 'rot'), (v) => v + '°'),
    h('div', { class: 'card-row' }, h('label', { class: 'color-dot' }, col, h('span', null, t('Color'))), h('label', { class: 'color-dot' }, str, h('span', null, t('Outline')))),
    h('div', { class: 'card-row' }, toggle(t('Bold'), !!l.bold, (v) => m(t('Style'), () => { l.bold = v; })), toggle(t('Italic'), !!l.italic, (v) => m(t('Style'), () => { l.italic = v; }))),
    toggle(t('Only for me (hidden from players)'), !!l.hidden, (v) => m(t('Visibility'), () => { l.hidden = v; })),
    h('div', { class: 'card-actions' }, dup, del));
}

function markerCard(ed: Editor, box: HTMLElement, mk: Marker, m: M, del: HTMLElement) {
  box.classList.add('card', 'wide');
  const linked = mk.link ? ed.maps.find((x) => x.id === mk.link) : null;
  const vis = toggle(t('Visible to players'), mk.visible, (v) => { m(t('Visibility'), () => { mk.visible = v; }); });
  if (ed.mode === 'session') {
    box.append(cardHead(ed, h('strong', null, mk.icon + '  ' + (mk.title || t('Marker')))),
      h('div', { class: 'notes' + (mk.notes ? '' : ' muted') }, mk.notes || t('No notes.')),
      mk.playerNotes ? h('div', { class: 'notes player' }, h('small', null, t('For players')), mk.playerNotes) : '',
      vis,
      linked ? h('button', { class: 'btn-primary', onclick: () => ed.openMap(linked.id) }, icon('arrowRight', 16), t('Open {name}', { name: linked.name })) : '');
    return;
  }
  const title = h('input', { type: 'text', class: 'title-input', value: mk.title, 'aria-label': t('Title'), oninput: () => m(t('Title'), () => { mk.title = title.value; }, 'title') });
  const notes = h('textarea', { rows: 5, placeholder: t('Secret notes: NPCs, treasure, traps…'), 'aria-label': t('DM notes'), oninput: () => m(t('Notes'), () => { mk.notes = notes.value; }, 'notes') });
  notes.value = mk.notes;
  const pn = h('textarea', { rows: 2, placeholder: t('What players see when they click'), 'aria-label': t('Player text'), oninput: () => m(t('Notes'), () => { mk.playerNotes = pn.value; }, 'pnotes') });
  pn.value = mk.playerNotes;
  const ib: HTMLButtonElement = h('button', { class: 'emoji-btn', 'aria-label': t('Change icon'), onclick: () => popover(ib, h('div', { class: 'pop-body' },
    h('div', { class: 'icons' }, ...MARKER_ICONS.map((i) => h('button', { class: i === mk.icon ? 'on' : '', onclick: () => { m(t('Icon'), () => { mk.icon = i; }); closePopover(); ed.refreshUI(); } }, i)))), 'below') }, mk.icon);
  const others = ed.maps.filter((x) => x.id !== ed.rt.doc.id);
  box.append(cardHead(ed, h('div', { class: 'title-row' }, ib, title)),
    h('div', { class: 'card-sec' }, h('span', { class: 'card-label' }, t('DM notes')), notes),
    h('div', { class: 'card-sec' }, h('span', { class: 'card-label' }, t('For players')), pn),
    vis,
    listPicker(t('Link to map'), [['', '— nessuna —'], ...others.map((x) => [x.id, x.name] as [string, string])], mk.link || '', (v) => { m(t('Link'), () => { mk.link = v || undefined; }); ed.refreshUI(); }),
    h('div', { class: 'card-actions' }, linked ? h('button', { class: 'chip-btn', onclick: () => ed.openMap(linked.id) }, t('Open linked map')) : '', del));
}

function tokenCard(ed: Editor, box: HTMLElement, tok: Token, m: M, del: HTMLElement) {
  box.classList.add('card');
  const session = ed.mode === 'session';
  const rr = () => ed.refreshUI();
  const img = tok.image ? assets.urls.get(tok.image) : null;
  const avatar = h('span', { class: 'avatar', style: { background: tok.color, borderColor: TOKEN_KIND_COLORS[tok.kind] } },
    img ? h('img', { src: img, alt: '' }) : tok.name.split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase());
  const titleEl = session
    ? h('div', { class: 'tok-title' }, h('strong', null, tok.name), h('small', null, `${TOKEN_KIND_NAMES[tok.kind]} · ${TOKEN_SIZE_NAMES[tok.size]} · ${t('AC')} ${tok.ac}`))
    : (() => { const i = h('input', { type: 'text', class: 'title-input', value: tok.name, 'aria-label': t('Name'), oninput: () => m(t('Name'), () => { tok.name = i.value; }, 'name') }); return h('div', { class: 'tok-title' }, i); })();
  box.append(cardHead(ed, h('div', { class: 'title-row' }, avatar, titleEl),
    iconBtn(tok.hidden ? 'eyeOff' : 'eye', tok.hidden ? t('Token hidden from players: show') : t('Visible to players: hide'), () => { m(t('Visibility'), () => { tok.hidden = !tok.hidden; }); rr(); }, tok.hidden ? 'warn' : '')));
  // hit points
  const f = tok.maxHp ? Math.max(0, Math.min(1, tok.hp / tok.maxHp)) : 0;
  const amt = h('input', { type: 'number', min: 0, value: ed.ui.hpAmt, class: 'hp-amt', 'aria-label': t('Amount'), oninput: () => { ed.ui.hpAmt = Math.max(0, +amt.value || 0); } });
  const apply = (sign: number) => { const v = ed.ui.hpAmt; if (!v) return; m(sign < 0 ? t('Damage') : t('Heal'), () => { tok.hp = Math.min(tok.maxHp, Math.max(-tok.maxHp, tok.hp + sign * v)); }); rr(); };
  const maxIn = h('input', { type: 'number', value: tok.maxHp, class: 'num-sm', 'aria-label': t('Max HP'), onchange: () => { m(t('Max HP'), () => { tok.maxHp = Math.max(0, +maxIn.value || 0); tok.hp = Math.min(tok.hp, tok.maxHp); }); rr(); } });
  box.append(h('div', { class: 'card-sec' },
    h('div', { class: 'hp-top' }, h('span', { class: 'card-label' }, t('Hit points'), h('em', null, hpStatus(tok))),
      session ? h('span', { class: 'hp-num' }, h('b', null, String(tok.hp)), ' / ' + tok.maxHp) : h('span', { class: 'hp-num' }, h('b', null, String(tok.hp)), ' / ', maxIn)),
    h('div', { class: 'hpbar' }, h('div', { style: { width: f * 100 + '%', background: f > 0.5 ? '#5CC28A' : f > 0.25 ? '#E0B030' : '#E26A5F' } })),
    h('div', { class: 'hp-actions' }, h('button', { class: 'dmg', onclick: () => apply(-1) }, t('Damage')), amt, h('button', { class: 'heal', onclick: () => apply(1) }, t('Heal')))));
  // conditions
  const condSet = new Set(tok.conditions);
  const toggleCond = (c: string) => { m(t('Condition'), () => { tok.conditions = condSet.has(c) ? tok.conditions.filter((x) => x !== c) : [...tok.conditions, c]; }); rr(); };
  const add: HTMLButtonElement = h('button', { class: 'cond add', onclick: () => popover(add, h('div', { class: 'pop-body' }, h('div', { class: 'pop-title' }, t('Conditions')),
    h('div', { class: 'cond-grid' }, ...CONDITIONS.map((c) => h('button', { class: 'cond' + (condSet.has(c.id) ? ' on' : ''), onclick: () => { closePopover(); toggleCond(c.id); } }, c.icon + ' ' + c.name)))), 'below') }, t('+ Add'));
  box.append(h('div', { class: 'card-sec' }, h('span', { class: 'card-label' }, t('Conditions')),
    h('div', { class: 'cond-row' }, ...tok.conditions.map((c) => { const d = CONDITIONS.find((x) => x.id === c); return h('button', { class: 'cond on', title: t('Remove'), onclick: () => toggleCond(c) }, (d ? d.icon + ' ' + d.name : c) + ' ×'); }), add)));
  if (!session) {
    const ac = h('input', { type: 'number', value: tok.ac, class: 'num-sm', 'aria-label': t('AC'), onchange: () => m(t('AC'), () => { tok.ac = +ac.value || 0; }) });
    const im = h('input', { type: 'number', value: tok.initMod, class: 'num-sm', 'aria-label': t('Initiative modifier'), onchange: () => m(t('Initiative'), () => { tok.initMod = +im.value || 0; }) });
    box.append(
      h('div', { class: 'card-row' },
        listPicker(t('Type'), Object.entries(TOKEN_KIND_NAMES) as [TokenKind, string][], tok.kind, (v) => { m(t('Type'), () => { tok.kind = v; tok.color = TOKEN_KIND_COLORS[v]; }); rr(); }),
        listPicker(t('Creature size'), Object.entries(TOKEN_SIZE_NAMES) as [TokenSize, string][], tok.size, (v) => { m(t('Creature size'), () => { tok.size = v; ed.snapToken(tok); }); rr(); })),
      h('div', { class: 'card-row' }, h('label', { class: 'mini-slider' }, h('span', { class: 'mini-label' }, t('AC')), ac), h('label', { class: 'mini-slider' }, h('span', { class: 'mini-label' }, t('Init. mod.')), im)),
      h('div', { class: 'card-sec' }, h('span', { class: 'card-label' }, t('Portrait')),
        h('div', { class: 'token-imgs' },
          h('button', { class: !tok.image ? 'on' : '', onclick: () => { m(t('Image'), () => { tok.image = undefined; }); rr(); }, title: t('Initials') }, 'Aa'),
          ...assets.list('token').map((a) => h('button', { class: tok.image === a.id ? 'on' : '', title: a.name, onclick: () => { m(t('Image'), () => { tok.image = a.id; }); rr(); } }, h('img', { src: assets.urls.get(a.id), alt: '' }))),
          h('button', { title: t('Import portrait'), onclick: async () => { const fs = await pickFile('image/*'); if (fs[0]) { const r = await assets.add(fs[0], fs[0].name, 'token'); m(t('Image'), () => { tok.image = r.id; }); rr(); } } }, '+'))));
  }
  const inCombat = ed.rt.doc.combat.members.includes(tok.id);
  box.append(h('div', { class: 'card-actions' },
    !inCombat ? h('button', { class: 'chip-btn', onclick: () => { m(t('Combat'), () => { ed.rt.doc.combat.members.push(tok.id); ed.sortCombat(); }); rr(); } }, t('+ Combat')) : '',
    del));
}

/** Screen-space bounding box of the current selection, or null. */
function selBox(ed: Editor): { x0: number; y0: number; x1: number; y1: number } | null {
  const o = ed.getSel();
  if (!o || !ed.sel) return null;
  const z = ed.view.z;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (x: number, y: number) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); };
  switch (ed.sel.kind) {
    case 'stamp': ed.stampHandles(o).corners.forEach((c) => add(c[0], c[1])); break;
    case 'room': case 'wall': case 'path': for (let i = 0; i < o.pts.length; i += 2) add(o.pts[i], o.pts[i + 1]); break;
    case 'door': { const L = (o.width * CELL) / 2 + 10; add(o.x - L, o.y - L); add(o.x + L, o.y + L); break; }
    case 'token': { const r = tokenRadius(o); add(o.x - r, o.y - r); add(o.x + r, o.y + r); break; }
    case 'marker': { const g = markerGeom(o, z); add(g.cx - g.r, g.cy - g.r); add(o.x + g.r, o.y); break; }
    case 'light': add(o.x - 12 / z, o.y - 12 / z); add(o.x + 12 / z, o.y + 12 / z); break;
    case 'label': {
      ed.ctx.font = labelFont(o);
      const w = Math.max(...o.text.split('\n').map((t: string) => ed.ctx.measureText(t).width)) / 2 + 6, hh = (o.size * 1.15 * o.text.split('\n').length) / 2;
      add(o.x - w, o.y - hh); add(o.x + w, o.y + hh); break;
    }
  }
  return { x0: x0 * z + ed.view.x, y0: y0 * z + ed.view.y, x1: x1 * z + ed.view.x, y1: y1 * z + ed.view.y };
}

export function positionInspector(ed: Editor) {
  const box = ed.el.inspector;
  if (box.hidden) return;
  const b = selBox(ed);
  if (!b) return;
  const W = ed.vw, H = ed.vh, bw = box.offsetWidth, bh = box.offsetHeight;
  const topMin = 12, botMax = H - 72 - (ed.el.dock.hidden ? 0 : ed.el.dock.offsetHeight + 12) - (ed.el.drawer.hidden ? 0 : ed.el.drawer.offsetHeight + 16);
  const leftMin = ed.mode === 'edit' ? 104 : 332;
  let x: number, y: number;
  if (box.classList.contains('toolbar')) {
    x = (b.x0 + b.x1) / 2 - bw / 2;
    y = b.y0 - bh - 14;
    if (y < topMin) y = b.y1 + 14;
  } else {
    x = b.x1 + 16;
    if (x + bw > W - 12) x = b.x0 - bw - 16;
    y = b.y0;
  }
  x = Math.max(leftMin, Math.min(W - bw - 12, x));
  y = Math.max(topMin, Math.min(Math.max(topMin, botMax - bh), y));
  box.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
}
