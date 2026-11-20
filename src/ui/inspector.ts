import { assets } from '../assets';
import { closePopover, h, icon, pickFile, popover } from '../dom';
import type { Editor } from '../editor';
import {
  CELL, CONDITIONS, Door, FONTS, hpStatus, Label, Light, MARKER_ICONS, Marker, Room, Stamp, Token, TOKEN_KIND_COLORS, TOKEN_KIND_NAMES, TOKEN_SIZE_NAMES, TokenKind, TokenSize, Wall, WallStyle,
} from '../model';
import { labelFont, markerGeom, tokenRadius } from '../render';
import { STAMP_BY_ID, VARIANTS } from '../stamps';
import { DOOR_NAMES, FLOORS, iconBtn, listPicker, miniSlider, texName, texSwatch, toggle, WALL_NAMES, WALL_SWATCH } from './common';

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
  const del = iconBtn('trash', 'Elimina', () => ed.deleteSel(), 'danger');
  const dup = iconBtn('copy', 'Duplica', () => ed.duplicateSel());
  switch (ed.sel.kind) {
    case 'stamp': return stampBar(ed, box, o as Stamp, m, dup, del);
    case 'wall': {
      const w = o as Wall;
      box.classList.add('toolbar');
      box.append(h('span', { class: 'tb-title' }, 'Muro'), listPicker<WallStyle>('Stile', WALL_NAMES, w.style, (v) => { m('Stile', () => { w.style = v; }); ed.refreshUI(); }, (v) => WALL_SWATCH[v]), h('span', { class: 'tb-sep' }), dup, del);
      return;
    }
    case 'door': {
      const d = o as Door;
      box.classList.add('toolbar');
      box.append(h('span', { class: 'tb-title' }, 'Porta'),
        h('button', { class: 'chip-btn' + (d.open ? ' on' : ''), onclick: () => ed.toggleDoor(d.id) }, d.open ? 'Aperta' : 'Chiusa'));
      if (!session) box.append(
        listPicker('Tipo', DOOR_NAMES, d.kind, (v) => { m('Tipo porta', () => { d.kind = v; }); ed.refreshUI(); }),
        iconBtn('rotate', 'Ruota di 90°', () => m('Ruota', () => { d.rot += Math.PI / 2; })),
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
  return h('div', { class: 'card-head' }, typeof title === 'string' ? h('strong', null, title) : title, ...extra, iconBtn('x', 'Chiudi', () => ed.select(null)));
}

function stampBar(ed: Editor, box: HTMLElement, s: Stamp, m: M, dup: HTMLElement, del: HTMLElement) {
  box.classList.add('toolbar');
  const isAsset = s.type.startsWith('asset:');
  const name = isAsset ? assets.recs.get(s.type.slice(6))?.name || 'Asset' : STAMP_BY_ID.get(s.type)?.name || s.type;
  const scaleTxt = h('span', { class: 'tb-val' }, s.scale.toFixed(1) + '×');
  const setScale = (k: number) => { m('Scala', () => { s.scale = Math.max(0.1, Math.min(10, +(s.scale * k).toFixed(2))); }, 'scale'); scaleTxt.textContent = s.scale.toFixed(1) + '×'; };
  box.append(
    h('span', { class: 'tb-title' }, name),
    h('span', { class: 'tb-sep' }),
    iconBtn('rotate', 'Ruota di 15° (E)', () => m('Ruota', () => { s.rot += Math.PI / 12; }, 'rot')),
    iconBtn('flip', 'Specchia', () => m('Specchia', () => { s.flip = !s.flip; })),
    iconBtn('minus', 'Rimpicciolisci', () => setScale(1 / 1.1)), scaleTxt, iconBtn('plus', 'Ingrandisci', () => setScale(1.1)),
    !isAsset ? iconBtn('dice', 'Altra variante', () => m('Variante', () => { s.variant = (s.variant + 1) % VARIANTS; })) : '',
    h('span', { class: 'tb-sep' }),
    iconBtn(s.hidden ? 'eyeOff' : 'eye', s.hidden ? 'Nascosto ai giocatori: mostra' : 'Visibile ai giocatori: nascondi', () => { m('Visibilità', () => { s.hidden = !s.hidden; }); ed.refreshUI(); }, s.hidden ? 'warn' : ''),
    dup, del,
  );
}

function roomCard(ed: Editor, box: HTMLElement, r: Room, m: M, dup: HTMLElement, del: HTMLElement) {
  box.classList.add('card');
  const name = h('input', { type: 'text', class: 'title-input', value: r.name || '', 'aria-label': 'Nome', oninput: () => m('Nome', () => { r.name = name.value; }, 'name') });
  box.append(cardHead(ed, name));
  if (!r.zoneOnly) box.append(h('div', { class: 'card-sec' }, h('span', { class: 'card-label' }, 'Pavimento · ' + texName(r.floor)),
    h('div', { class: 'swatches compact' }, ...FLOORS.map((f) => h('button', { class: 'swatch' + (f === r.floor ? ' on' : ''), title: texName(f), 'aria-label': texName(f), onclick: () => { m('Pavimento', () => { r.floor = f; }); ed.refreshUI(); } }, h('img', { src: texSwatch(f), alt: '' }))))));
  box.append(
    toggle('Solo zona nebbia (senza pavimento e muri)', !!r.zoneOnly, (v) => { m('Zona', () => { r.zoneOnly = v || undefined; }); ed.refreshUI(); }),
    h('div', { class: 'card-actions' }, dup, del));
}

function lightCard(ed: Editor, box: HTMLElement, l: Light, m: M, del: HTMLElement) {
  box.classList.add('card');
  const col = h('input', { type: 'color', value: l.color, 'aria-label': 'Colore', oninput: () => m('Luce', () => { l.color = col.value; }, 'lc') });
  box.append(cardHead(ed, 'Luce'),
    miniSlider('Raggio', l.radius, 1, 20, 0.5, (v) => m('Luce', () => { l.radius = v; }, 'lr'), (v) => v + ' cas.'),
    miniSlider('Intensità', l.intensity, 0.1, 1, 0.05, (v) => m('Luce', () => { l.intensity = v; }, 'li'), (v) => Math.round(v * 100) + '%'),
    h('div', { class: 'card-row' }, h('label', { class: 'color-dot' }, col, h('span', null, 'Colore')), toggle('Tremolio', l.flicker, (v) => m('Luce', () => { l.flicker = v; }))),
    h('div', { class: 'card-actions' }, del));
}

function labelCard(ed: Editor, box: HTMLElement, l: Label, m: M, dup: HTMLElement, del: HTMLElement) {
  box.classList.add('card');
  const ta = h('textarea', { rows: 2, 'aria-label': 'Testo', oninput: () => m('Testo', () => { l.text = ta.value; }, 'text') });
  ta.value = l.text;
  const col = h('input', { type: 'color', value: l.color, 'aria-label': 'Colore', oninput: () => m('Colore', () => { l.color = col.value; }, 'col') });
  const str = h('input', { type: 'color', value: l.stroke, 'aria-label': 'Contorno', oninput: () => m('Colore', () => { l.stroke = str.value; }, 'str') });
  box.append(cardHead(ed, 'Testo'), ta,
    listPicker('Font', FONTS.map((f) => [f, f] as [string, string]), l.font, (v) => { m('Font', () => { l.font = v; }); ed.refreshUI(); }),
    miniSlider('Dimensione', l.size, 10, 300, 2, (v) => m('Dimensione', () => { l.size = v; }, 'size')),
    miniSlider('Rotazione', Math.round((l.rot * 180) / Math.PI), -180, 180, 1, (v) => m('Ruota', () => { l.rot = (v * Math.PI) / 180; }, 'rot'), (v) => v + '°'),
    h('div', { class: 'card-row' }, h('label', { class: 'color-dot' }, col, h('span', null, 'Colore')), h('label', { class: 'color-dot' }, str, h('span', null, 'Contorno'))),
    h('div', { class: 'card-row' }, toggle('Grassetto', !!l.bold, (v) => m('Stile', () => { l.bold = v; })), toggle('Corsivo', !!l.italic, (v) => m('Stile', () => { l.italic = v; }))),
    toggle('Solo per me (nascosto ai giocatori)', !!l.hidden, (v) => m('Visibilità', () => { l.hidden = v; })),
    h('div', { class: 'card-actions' }, dup, del));
}

function markerCard(ed: Editor, box: HTMLElement, mk: Marker, m: M, del: HTMLElement) {
  box.classList.add('card', 'wide');
  const linked = mk.link ? ed.maps.find((x) => x.id === mk.link) : null;
  const vis = toggle('Visibile ai giocatori', mk.visible, (v) => { m('Visibilità', () => { mk.visible = v; }); });
  if (ed.mode === 'session') {
    box.append(cardHead(ed, h('strong', null, mk.icon + '  ' + (mk.title || 'Segnaposto'))),
      h('div', { class: 'notes' + (mk.notes ? '' : ' muted') }, mk.notes || 'Nessuna nota.'),
      mk.playerNotes ? h('div', { class: 'notes player' }, h('small', null, 'Per i giocatori'), mk.playerNotes) : '',
      vis,
      linked ? h('button', { class: 'btn-primary', onclick: () => ed.openMap(linked.id) }, icon('arrowRight', 16), 'Apri ' + linked.name) : '');
    return;
  }
  const title = h('input', { type: 'text', class: 'title-input', value: mk.title, 'aria-label': 'Titolo', oninput: () => m('Titolo', () => { mk.title = title.value; }, 'title') });
  const notes = h('textarea', { rows: 5, placeholder: 'Note segrete: PNG, tesori, trappole…', 'aria-label': 'Note del DM', oninput: () => m('Note', () => { mk.notes = notes.value; }, 'notes') });
  notes.value = mk.notes;
  const pn = h('textarea', { rows: 2, placeholder: 'Quello che vedono i giocatori cliccando', 'aria-label': 'Testo per i giocatori', oninput: () => m('Note', () => { mk.playerNotes = pn.value; }, 'pnotes') });
  pn.value = mk.playerNotes;
  const ib: HTMLButtonElement = h('button', { class: 'emoji-btn', 'aria-label': 'Cambia icona', onclick: () => popover(ib, h('div', { class: 'pop-body' },
    h('div', { class: 'icons' }, ...MARKER_ICONS.map((i) => h('button', { class: i === mk.icon ? 'on' : '', onclick: () => { m('Icona', () => { mk.icon = i; }); closePopover(); ed.refreshUI(); } }, i)))), 'below') }, mk.icon);
  const others = ed.maps.filter((x) => x.id !== ed.rt.doc.id);
  box.append(cardHead(ed, h('div', { class: 'title-row' }, ib, title)),
    h('div', { class: 'card-sec' }, h('span', { class: 'card-label' }, 'Note del DM'), notes),
    h('div', { class: 'card-sec' }, h('span', { class: 'card-label' }, 'Per i giocatori'), pn),
    vis,
    listPicker('Collega a mappa', [['', '— nessuna —'], ...others.map((x) => [x.id, x.name] as [string, string])], mk.link || '', (v) => { m('Collegamento', () => { mk.link = v || undefined; }); ed.refreshUI(); }),
    h('div', { class: 'card-actions' }, linked ? h('button', { class: 'chip-btn', onclick: () => ed.openMap(linked.id) }, 'Apri mappa collegata') : '', del));
}

function tokenCard(ed: Editor, box: HTMLElement, t: Token, m: M, del: HTMLElement) {
  box.classList.add('card');
  const session = ed.mode === 'session';
  const rr = () => ed.refreshUI();
  const img = t.image ? assets.urls.get(t.image) : null;
  const avatar = h('span', { class: 'avatar', style: { background: t.color, borderColor: TOKEN_KIND_COLORS[t.kind] } },
    img ? h('img', { src: img, alt: '' }) : t.name.split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase());
  const titleEl = session
    ? h('div', { class: 'tok-title' }, h('strong', null, t.name), h('small', null, `${TOKEN_KIND_NAMES[t.kind]} · ${TOKEN_SIZE_NAMES[t.size]} · CA ${t.ac}`))
    : (() => { const i = h('input', { type: 'text', class: 'title-input', value: t.name, 'aria-label': 'Nome', oninput: () => m('Nome', () => { t.name = i.value; }, 'name') }); return h('div', { class: 'tok-title' }, i); })();
  box.append(cardHead(ed, h('div', { class: 'title-row' }, avatar, titleEl),
    iconBtn(t.hidden ? 'eyeOff' : 'eye', t.hidden ? 'Nascosta ai giocatori: mostra' : 'Visibile ai giocatori: nascondi', () => { m('Visibilità', () => { t.hidden = !t.hidden; }); rr(); }, t.hidden ? 'warn' : '')));
  // hit points
  const f = t.maxHp ? Math.max(0, Math.min(1, t.hp / t.maxHp)) : 0;
  const amt = h('input', { type: 'number', min: 0, value: ed.ui.hpAmt, class: 'hp-amt', 'aria-label': 'Quantità', oninput: () => { ed.ui.hpAmt = Math.max(0, +amt.value || 0); } });
  const apply = (sign: number) => { const v = ed.ui.hpAmt; if (!v) return; m(sign < 0 ? 'Danno' : 'Cura', () => { t.hp = Math.min(t.maxHp, Math.max(-t.maxHp, t.hp + sign * v)); }); rr(); };
  const maxIn = h('input', { type: 'number', value: t.maxHp, class: 'num-sm', 'aria-label': 'PF massimi', onchange: () => { m('PF max', () => { t.maxHp = Math.max(0, +maxIn.value || 0); t.hp = Math.min(t.hp, t.maxHp); }); rr(); } });
  box.append(h('div', { class: 'card-sec' },
    h('div', { class: 'hp-top' }, h('span', { class: 'card-label' }, 'Punti ferita', h('em', null, hpStatus(t))),
      session ? h('span', { class: 'hp-num' }, h('b', null, String(t.hp)), ' / ' + t.maxHp) : h('span', { class: 'hp-num' }, h('b', null, String(t.hp)), ' / ', maxIn)),
    h('div', { class: 'hpbar' }, h('div', { style: { width: f * 100 + '%', background: f > 0.5 ? '#5CC28A' : f > 0.25 ? '#E0B030' : '#E26A5F' } })),
    h('div', { class: 'hp-actions' }, h('button', { class: 'dmg', onclick: () => apply(-1) }, 'Danno'), amt, h('button', { class: 'heal', onclick: () => apply(1) }, 'Cura'))));
  // conditions
  const condSet = new Set(t.conditions);
  const toggleCond = (c: string) => { m('Condizione', () => { t.conditions = condSet.has(c) ? t.conditions.filter((x) => x !== c) : [...t.conditions, c]; }); rr(); };
  const add: HTMLButtonElement = h('button', { class: 'cond add', onclick: () => popover(add, h('div', { class: 'pop-body' }, h('div', { class: 'pop-title' }, 'Condizioni'),
    h('div', { class: 'cond-grid' }, ...CONDITIONS.map((c) => h('button', { class: 'cond' + (condSet.has(c.id) ? ' on' : ''), onclick: () => { closePopover(); toggleCond(c.id); } }, c.icon + ' ' + c.name)))), 'below') }, '+ Aggiungi');
  box.append(h('div', { class: 'card-sec' }, h('span', { class: 'card-label' }, 'Condizioni'),
    h('div', { class: 'cond-row' }, ...t.conditions.map((c) => { const d = CONDITIONS.find((x) => x.id === c); return h('button', { class: 'cond on', title: 'Rimuovi', onclick: () => toggleCond(c) }, (d ? d.icon + ' ' + d.name : c) + ' ×'); }), add)));
  if (!session) {
    const ac = h('input', { type: 'number', value: t.ac, class: 'num-sm', 'aria-label': 'CA', onchange: () => m('CA', () => { t.ac = +ac.value || 0; }) });
    const im = h('input', { type: 'number', value: t.initMod, class: 'num-sm', 'aria-label': 'Modificatore iniziativa', onchange: () => m('Iniziativa', () => { t.initMod = +im.value || 0; }) });
    box.append(
      h('div', { class: 'card-row' },
        listPicker('Tipo', Object.entries(TOKEN_KIND_NAMES) as [TokenKind, string][], t.kind, (v) => { m('Tipo', () => { t.kind = v; t.color = TOKEN_KIND_COLORS[v]; }); rr(); }),
        listPicker('Taglia', Object.entries(TOKEN_SIZE_NAMES) as [TokenSize, string][], t.size, (v) => { m('Taglia', () => { t.size = v; ed.snapToken(t); }); rr(); })),
      h('div', { class: 'card-row' }, h('label', { class: 'mini-slider' }, h('span', { class: 'mini-label' }, 'CA'), ac), h('label', { class: 'mini-slider' }, h('span', { class: 'mini-label' }, 'Mod. iniziativa'), im)),
      h('div', { class: 'card-sec' }, h('span', { class: 'card-label' }, 'Ritratto'),
        h('div', { class: 'token-imgs' },
          h('button', { class: !t.image ? 'on' : '', onclick: () => { m('Immagine', () => { t.image = undefined; }); rr(); }, title: 'Iniziali' }, 'Aa'),
          ...assets.list('token').map((a) => h('button', { class: t.image === a.id ? 'on' : '', title: a.name, onclick: () => { m('Immagine', () => { t.image = a.id; }); rr(); } }, h('img', { src: assets.urls.get(a.id), alt: '' }))),
          h('button', { title: 'Importa ritratto', onclick: async () => { const fs = await pickFile('image/*'); if (fs[0]) { const r = await assets.add(fs[0], fs[0].name, 'token'); m('Immagine', () => { t.image = r.id; }); rr(); } } }, '+'))));
  }
  const inCombat = ed.rt.doc.combat.members.includes(t.id);
  box.append(h('div', { class: 'card-actions' },
    !inCombat ? h('button', { class: 'chip-btn', onclick: () => { m('Combattimento', () => { ed.rt.doc.combat.members.push(t.id); ed.sortCombat(); }); rr(); } }, '+ Combattimento') : '',
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
    case 'room': case 'wall': for (let i = 0; i < o.pts.length; i += 2) add(o.pts[i], o.pts[i + 1]); break;
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
