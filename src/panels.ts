import { assets } from './assets';
import { area, btn, check, color, field, h, hint, icon, num, pickFile, row, section, seg, select, slider, text, toast } from './dom';
import type { Editor } from './editor';
import { EDIT_TOOLS, SESSION_TOOLS } from './editor';
import { GEN_NAMES, GenKind } from './generate';
import {
  CELL, CONDITIONS, DoorKind, FONTS, hpStatus, Label, Light, MARKER_ICONS, Marker, Room, Stamp, Token, TOKEN_KIND_COLORS, TOKEN_KIND_NAMES, TOKEN_SIZE_NAMES, TokenKind, TokenSize, Wall, WallStyle,
} from './model';
import { CATEGORIES, STAMP_BY_ID, STAMPS, stampThumb, VARIANTS } from './stamps';
import { deleteMap } from './storage';
import { getTexture, TEX_BY_ID, TEXTURES } from './textures';
import { ctx2d, makeCanvas } from './util';

const WALL_NAMES: [WallStyle, string][] = [['stone', 'Pietra'], ['brick', 'Mattoni'], ['wood', 'Legno'], ['cave', 'Roccia grezza']];
const DOOR_NAMES: [DoorKind, string][] = [['wood', 'Legno'], ['double', 'Doppia'], ['iron', 'Grata'], ['secret', 'Segreta'], ['arch', 'Arco']];
let stampCat = 'Arredi';

const swatchCache = new Map<string, string>();
function texSwatch(id: string) {
  let u = swatchCache.get(id);
  if (!u) {
    const c = makeCanvas(56, 56);
    ctx2d(c).drawImage(getTexture(id), 40, 40, 140, 140, 0, 0, 56, 56);
    u = c.toDataURL();
    swatchCache.set(id, u);
  }
  return u;
}
const thumbCache = new Map<string, string>();
function sThumb(id: string) { let u = thumbCache.get(id); if (!u) { u = stampThumb(id); thumbCache.set(id, u); } return u; }

function texGrid(ids: string[], value: string, onPick: (id: string) => void) {
  return h('div', { class: 'swatches' }, ...ids.map((id) => h('button', {
    class: 'swatch' + (id === value ? ' on' : ''), title: TEX_BY_ID.get(id)?.name, onclick: () => onPick(id),
  }, h('img', { src: texSwatch(id), alt: '' }), h('span', null, TEX_BY_ID.get(id)?.name || id))));
}
const FLOORS = TEXTURES.filter((t) => t.floor).map((t) => t.id);

// ============================================================================ toolbar
export function buildToolbar(ed: Editor) {
  const tb = ed.toolbar;
  tb.innerHTML = '';
  const list = ed.mode === 'edit' ? EDIT_TOOLS : SESSION_TOOLS;
  for (const t of list) {
    tb.appendChild(h('button', { class: 'tool-btn' + (ed.tool === t.id ? ' on' : ''), title: `${t.name}  (${t.key})`, onclick: () => ed.setTool(t.id) }, icon(t.id), h('kbd', null, t.key)));
  }
}

// ============================================================================ panel
export function buildPanel(ed: Editor) {
  const side = ed.side;
  const scroll = side.querySelector('.panel-body')?.scrollTop || 0;
  side.innerHTML = '';
  const tabs: [typeof ed.tab, string][] = ed.mode === 'edit' ? [['tool', 'Strumento'], ['map', 'Mappa']] : [['tool', 'Sessione'], ['combat', 'Combattimento'], ['map', 'Mappa']];
  side.appendChild(h('div', { class: 'tabs' }, ...tabs.map(([id, l]) => h('button', { class: ed.tab === id ? 'on' : '', onclick: () => { ed.tab = id; buildPanel(ed); } }, l))));
  const body = h('div', { class: 'panel-body' });
  side.appendChild(body);
  if (ed.tab === 'map') body.append(...mapPanel(ed));
  else if (ed.tab === 'combat') body.append(...combatPanel(ed));
  else {
    if (ed.sel) body.append(...propsPanel(ed));
    if (ed.mode === 'session') body.append(...sessionPanel(ed));
    else if (!ed.sel) body.append(...toolPanel(ed));
  }
  body.scrollTop = scroll;
}

function toolPanel(ed: Editor): HTMLElement[] {
  const o = ed.opts;
  const rr = () => buildPanel(ed);
  switch (ed.tool) {
    case 'select': return [section('Seleziona', hint('Clicca un oggetto per selezionarlo e trascinalo per spostarlo. Trascina il vuoto per muovere la vista.<br><b>Q/E</b> ruota · <b>Canc</b> elimina · <b>Ctrl/Cmd+D</b> duplica · <b>frecce</b> sposta · <b>doppio clic</b> su una porta la apre.'))];
    case 'terrain': return [
      section('Texture', texGrid(TEXTURES.map((t) => t.id), o.terrain.tex, (id) => { o.terrain.tex = id; rr(); })),
      section('Pennello',
        seg([['paint', '🖌 Dipingi'], ['erase', '🧽 Cancella']], o.terrain.erase ? 'erase' : 'paint', (v) => { o.terrain.erase = v === 'erase'; }),
        slider('Dimensione (caselle)', o.terrain.size, 0.25, 12, 0.25, (v) => { o.terrain.size = v; ed.requestRender(); }),
        slider('Morbidezza bordo', 1 - o.terrain.hard, 0, 0.95, 0.05, (v) => { o.terrain.hard = 1 - v; }, (v) => Math.round(v * 100) + '%'),
        slider('Intensità', o.terrain.strength, 0.05, 1, 0.05, (v) => { o.terrain.strength = v; }, (v) => Math.round(v * 100) + '%'),
        hint('Le texture si fondono in ordine fisso: acqua, lava e muschio stanno sempre sopra i pavimenti. <b>[ ]</b> cambiano la dimensione.')),
    ];
    case 'room': return [
      section('Stanza',
        seg([['rect', '▭ Rettangolo'], ['poly', '⬠ Poligono']], o.room.shape, (v) => { o.room.shape = v; ed.requestRender(); }),
        check('Zona nebbia (solo per "rivela stanza", invisibile)', o.room.zone, (v) => { o.room.zone = v; }),
        hint(o.room.shape === 'rect' ? 'Trascina sulla griglia. Le stanze che si toccano si fondono e i muri vengono generati da soli.' : 'Clicca i vertici (aggancio a mezza casella), poi doppio clic, <b>Invio</b> o clic sul primo punto per chiudere.')),
      section('Pavimento', texGrid(FLOORS, o.room.floor, (id) => { o.room.floor = id; rr(); })),
      section('Muri (tutte le stanze)', select('Stile', WALL_NAMES, ed.rt.doc.wallStyle, (v) => { ed.rt.doc.wallStyle = v as WallStyle; ed.rt.engine.invalidateAll(); ed.changed('settings'); })),
    ];
    case 'cave': return [
      section('Caverna',
        seg([['dig', '⛏ Scava'], ['fill', '🪨 Riempi']], o.cave.erase ? 'fill' : 'dig', (v) => { o.cave.erase = v === 'fill'; }),
        slider('Dimensione (caselle)', o.cave.size, 0.5, 12, 0.25, (v) => { o.cave.size = v; ed.requestRender(); }),
        hint('Scava gallerie con pareti di roccia irregolari. Le pareti vengono generate automaticamente.')),
      section('Pavimento della caverna', texGrid(FLOORS, ed.rt.doc.caveFloor, (id) => { ed.rt.doc.caveFloor = id; ed.rt.engine.invalidateAll(); ed.changed('settings'); rr(); })),
    ];
    case 'wall': return [section('Muro',
      select('Stile', WALL_NAMES, o.wall.style, (v) => { o.wall.style = v as WallStyle; }),
      hint('Clicca per aggiungere punti (aggancio agli incroci della griglia, <b>Alt</b> per punti liberi). Doppio clic o <b>Invio</b> per terminare, <b>Esc</b> per annullare.'))];
    case 'door': return [section('Porta',
      seg(DOOR_NAMES, o.door.kind, (v) => { o.door.kind = v; }),
      seg([['1', '1 casella'], ['2', '2 caselle']], String(o.door.width) as '1' | '2', (v) => { o.door.width = +v; if (+v === 2 && o.door.kind === 'wood') o.door.kind = 'double'; rr(); }),
      hint('Clicca vicino a un bordo della griglia per piazzare la porta. Clic su una porta esistente: apre o chiude. Le porte <b>segrete</b> chiuse sono invisibili ai giocatori.'))];
    case 'stamp': return stampPanel(ed);
    case 'light': return [
      section('Nuova luce',
        slider('Raggio (caselle)', o.light.radius, 1, 20, 0.5, (v) => { o.light.radius = v; }),
        color('Colore', o.light.color, (v) => { o.light.color = v; }),
        slider('Intensità', o.light.intensity, 0.1, 1, 0.05, (v) => { o.light.intensity = v; }, (v) => Math.round(v * 100) + '%'),
        check('Tremolio (fuoco)', o.light.flicker, (v) => { o.light.flicker = v; }),
        hint('Torce, bracieri, camini e cristalli emettono luce da soli.')),
      ambientSection(ed),
    ];
    case 'token': return tokenToolPanel(ed);
    case 'text': return [section('Testo',
      select('Font', FONTS.map((f) => [f, f]), o.text.font, (v) => { o.text.font = v; }),
      slider('Dimensione', o.text.size, 12, 200, 2, (v) => { o.text.size = v; }),
      row(color('Colore', o.text.color, (v) => { o.text.color = v; }), color('Contorno', o.text.stroke, (v) => { o.text.stroke = v; })),
      check('Grassetto', o.text.bold, (v) => { o.text.bold = v; }),
      hint('Clicca sulla mappa per inserire un testo.'))];
    case 'marker': return [section('Segnaposto',
      iconGrid(o.marker.icon, (i) => { o.marker.icon = i; rr(); }),
      color('Colore', o.marker.color, (v) => { o.marker.color = v; }),
      hint('Clicca per piazzare un segnaposto con note per il DM. In sessione un clic mostra le note; puoi renderlo visibile ai giocatori o collegarlo a un\'altra mappa.'))];
    case 'measure': return [section('Righello',
      num('Piedi per casella', ed.rt.doc.grid.feet, (v) => { ed.rt.doc.grid.feet = v; ed.changed('settings'); }, 1, 100),
      hint('Trascina da una casella all\'altra. Distanze calcolate come in D&D 5e (le diagonali valgono 1 casella). In sessione il righello appare anche ai giocatori.'))];
    default: return [];
  }
}

function ambientSection(ed: Editor) {
  return section('Illuminazione della mappa',
    slider('Oscurità ambientale', ed.rt.doc.ambient, 0, 0.95, 0.05, (v) => { ed.rt.doc.ambient = v; ed.changed('objects'); }, (v) => Math.round(v * 100) + '%'),
    check('Anteprima completa nell\'editor', ed.opts.previewLights, (v) => { ed.opts.previewLights = v; ed.requestRender(); }));
}

function iconGrid(value: string, onPick: (i: string) => void) {
  return h('div', { class: 'icons' }, ...MARKER_ICONS.map((i) => h('button', { class: i === value ? 'on' : '', onclick: () => onPick(i) }, i)));
}

function stampPanel(ed: Editor): HTMLElement[] {
  const o = ed.opts.stamp;
  const rr = () => buildPanel(ed);
  const cats = [...CATEGORIES, 'I miei'];
  const grid = h('div', { class: 'stamps' });
  if (stampCat === 'I miei') {
    for (const a of assets.list('stamp')) {
      const id = 'asset:' + a.id;
      grid.appendChild(h('button', { class: 'stamp' + (o.type === id ? ' on' : ''), title: a.name, onclick: () => { o.type = id; rr(); } }, h('img', { src: assets.urls.get(a.id) }), h('span', null, a.name)));
    }
  } else {
    for (const s of STAMPS.filter((s) => s.cat === stampCat)) {
      grid.appendChild(h('button', { class: 'stamp' + (o.type === s.id ? ' on' : ''), title: s.name, onclick: () => { o.type = s.id; rr(); } }, h('img', { src: sThumb(s.id) }), h('span', null, s.name)));
    }
  }
  const out = [
    section('Oggetti',
      h('div', { class: 'chips' }, ...cats.map((c) => h('button', { class: 'chip' + (c === stampCat ? ' on' : ''), onclick: () => { stampCat = c; rr(); } }, c))),
      grid,
      stampCat === 'I miei' ? h('div', null,
        btn('📥 Importa PNG…', async () => {
          const files = await pickFile('image/png,image/webp,image/jpeg', true);
          for (const f of files) await assets.add(f, f.name.replace(/\.\w+$/, ''), 'stamp');
          if (files.length) toast(`${files.length} asset importati`);
        }),
        hint('Importa asset con sfondo trasparente (es. pacchetti per battle map). La dimensione si regola dalla proprietà "larghezza in caselle" dopo averli selezionati.')) : null,
    ),
    section('Piazzamento',
      slider('Scala', o.scale, 0.2, 4, 0.05, (v) => { o.scale = v; ed.requestRender(); }, (v) => v.toFixed(2) + '×'),
      slider('Variazione scala', o.jitter, 0, 0.5, 0.02, (v) => { o.jitter = v; }, (v) => '±' + Math.round(v * 100) + '%'),
      check('Rotazione casuale', o.randomRot, (v) => { o.randomRot = v; }),
      check('Aggancia a mezza casella', o.snap, (v) => { o.snap = v; }),
      check('Pennello a spargimento (trascina per spargere)', o.scatter, (v) => { o.scatter = v; rr(); ed.requestRender(); }),
      o.scatter ? slider('Distanza tra oggetti (caselle)', o.spacing, 0.3, 5, 0.1, (v) => { o.spacing = v; ed.requestRender(); }) : null,
    ),
  ];
  if (stampCat === 'I miei' && o.type.startsWith('asset:')) {
    const rec = assets.recs.get(o.type.slice(6));
    if (rec) out.push(section('Asset: ' + rec.name,
      num('Larghezza in caselle', rec.cells, (v) => { rec.cells = Math.max(0.1, v); assets.update(rec); ed.requestRender(); }, 0.1, 50, 0.1),
      btn('🗑 Elimina asset', async () => { if (confirm('Eliminare questo asset? Gli oggetti già piazzati spariranno.')) { await assets.remove(rec.id); o.type = 'barrel'; } }, 'danger')));
  }
  return out;
}

const TOKEN_PRESETS: { name: string; kind: TokenKind; size: TokenSize }[] = [
  { name: 'Eroe', kind: 'pc', size: 'medium' }, { name: 'Goblin', kind: 'monster', size: 'small' }, { name: 'Coboldo', kind: 'monster', size: 'small' },
  { name: 'Scheletro', kind: 'monster', size: 'medium' }, { name: 'Orco', kind: 'monster', size: 'medium' }, { name: 'Lupo', kind: 'monster', size: 'medium' },
  { name: 'Ogre', kind: 'monster', size: 'large' }, { name: 'Troll', kind: 'monster', size: 'large' }, { name: 'Drago', kind: 'monster', size: 'huge' },
  { name: 'Mercante', kind: 'npc', size: 'medium' }, { name: 'Guardia', kind: 'ally', size: 'medium' },
];
function tokenToolPanel(ed: Editor): HTMLElement[] {
  const o = ed.opts.token;
  const rr = () => buildPanel(ed);
  return [
    section('Nuova pedina',
      h('div', { class: 'chips' }, ...TOKEN_PRESETS.map((p) => h('button', { class: 'chip' + (o.name === p.name ? ' on' : ''), onclick: () => { o.name = p.name; o.kind = p.kind; o.size = p.size; rr(); } }, p.name))),
      text('Nome', o.name, (v) => { o.name = v; }),
      select('Tipo', Object.entries(TOKEN_KIND_NAMES) as [string, string][], o.kind, (v) => { o.kind = v as TokenKind; }),
      select('Taglia', Object.entries(TOKEN_SIZE_NAMES) as [string, string][], o.size, (v) => { o.size = v as TokenSize; }),
      tokenImagePicker(o.image, (id) => { o.image = id; rr(); }),
      hint('Clicca sulla mappa per piazzare la pedina (si aggancia alla griglia). I mostri nuovi sono <b>nascosti</b> ai giocatori finché non li riveli.')),
  ];
}
function tokenImagePicker(value: string | undefined, onPick: (id: string) => void) {
  const list = assets.list('token');
  return h('div', { class: 'field' },
    h('span', { class: 'field-label' }, 'Immagine'),
    h('div', { class: 'token-imgs' },
      h('button', { class: !value ? 'on' : '', onclick: () => onPick(''), title: 'Nessuna (iniziali)' }, 'Aa'),
      ...list.map((a) => h('button', { class: value === a.id ? 'on' : '', onclick: () => onPick(a.id), title: a.name }, h('img', { src: assets.urls.get(a.id) }))),
      h('button', { title: 'Importa ritratto', onclick: async () => { const f = await pickFile('image/*'); if (f[0]) { const r = await assets.add(f[0], f[0].name, 'token'); onPick(r.id); } } }, '＋')));
}

// ============================================================================ properties
function propsPanel(ed: Editor): HTMLElement[] {
  const o = ed.getSel();
  if (!o || !ed.sel) return [];
  const id = o.id;
  const m = (label: string, fn: () => void, key?: string) => ed.mutate(label, fn, key ? key + ':' + id : undefined);
  const actions = row(btn('⧉ Duplica', () => ed.duplicateSel()), btn('🗑 Elimina', () => ed.deleteSel(), 'danger'));
  const rr = () => buildPanel(ed);
  switch (ed.sel.kind) {
    case 'stamp': {
      const s = o as Stamp;
      const isAsset = s.type.startsWith('asset:');
      const name = isAsset ? assets.recs.get(s.type.slice(6))?.name || 'Asset' : STAMP_BY_ID.get(s.type)?.name || s.type;
      return [section('Oggetto: ' + name,
        slider('Scala', s.scale, 0.1, 6, 0.05, (v) => { m('Scala', () => { s.scale = v; }, 'scale'); }, (v) => v.toFixed(2) + '×'),
        slider('Rotazione', Math.round(((s.rot * 180) / Math.PI) % 360 + 360) % 360, 0, 359, 1, (v) => { m('Ruota', () => { s.rot = (v * Math.PI) / 180; }, 'rot'); }, (v) => v + '°'),
        check('Specchiato', !!s.flip, (v) => m('Specchia', () => { s.flip = v; })),
        check('Nascosto ai giocatori', !!s.hidden, (v) => m('Visibilità', () => { s.hidden = v; })),
        !isAsset ? btn('🎲 Altra variante', () => m('Variante', () => { s.variant = (s.variant + 1) % VARIANTS; })) : null,
        actions)];
    }
    case 'room': {
      const r = o as Room;
      return [section(r.zoneOnly ? 'Zona nebbia' : 'Stanza',
        text('Nome', r.name || '', (v) => m('Nome', () => { r.name = v; }, 'name')),
        !r.zoneOnly ? h('div', null, h('span', { class: 'field-label' }, 'Pavimento'), texGrid(FLOORS, r.floor, (fl) => { m('Pavimento', () => { r.floor = fl; }); rr(); })) : null,
        check('Solo zona nebbia (senza pavimento e muri)', !!r.zoneOnly, (v) => { m('Zona', () => { r.zoneOnly = v || undefined; }); rr(); }),
        ed.mode === 'session' ? row(btn('👁 Rivela', () => { ed.rt.fog.polygon(r.pts, true); ed.requestRender(); }), btn('☁ Copri', () => { ed.rt.fog.polygon(r.pts, false, 0); ed.requestRender(); })) : null,
        hint('Trascina per spostare (si aggancia alla griglia, <b>Alt</b> per muovere liberamente).'),
        actions)];
    }
    case 'wall': {
      const w = o as Wall;
      return [section('Muro', select('Stile', WALL_NAMES, w.style, (v) => m('Stile', () => { w.style = v as WallStyle; })), actions)];
    }
    case 'door': {
      const d = o as typeof ed.rt.doc.doors[number];
      return [section('Porta',
        seg(DOOR_NAMES, d.kind, (v) => m('Tipo porta', () => { d.kind = v; })),
        seg([['1', '1 casella'], ['2', '2 caselle']], String(d.width) as '1' | '2', (v) => m('Larghezza', () => { d.width = +v; })),
        check('Aperta', d.open, (v) => m('Porta', () => { d.open = v; })),
        hint('Ruota con <b>Q/E</b>.'),
        actions)];
    }
    case 'light': {
      const l = o as Light;
      return [section('Luce',
        slider('Raggio (caselle)', l.radius, 1, 20, 0.5, (v) => m('Luce', () => { l.radius = v; }, 'lr')),
        color('Colore', l.color, (v) => m('Luce', () => { l.color = v; }, 'lc')),
        slider('Intensità', l.intensity, 0.1, 1, 0.05, (v) => m('Luce', () => { l.intensity = v; }, 'li'), (v) => Math.round(v * 100) + '%'),
        check('Tremolio', l.flicker, (v) => m('Luce', () => { l.flicker = v; })),
        actions), ambientSection(ed)];
    }
    case 'label': {
      const l = o as Label;
      return [section('Testo',
        area('Testo', l.text, (v) => m('Testo', () => { l.text = v; }, 'text'), 2),
        select('Font', FONTS.map((f) => [f, f]), l.font, (v) => m('Font', () => { l.font = v; })),
        slider('Dimensione', l.size, 10, 300, 2, (v) => m('Dimensione', () => { l.size = v; }, 'size')),
        slider('Rotazione', Math.round((l.rot * 180) / Math.PI), -180, 180, 1, (v) => m('Ruota', () => { l.rot = (v * Math.PI) / 180; }, 'rot'), (v) => v + '°'),
        row(color('Colore', l.color, (v) => m('Colore', () => { l.color = v; }, 'col')), color('Contorno', l.stroke, (v) => m('Colore', () => { l.stroke = v; }, 'str'))),
        row(check('Grassetto', !!l.bold, (v) => m('Stile', () => { l.bold = v; })), check('Corsivo', !!l.italic, (v) => m('Stile', () => { l.italic = v; }))),
        check('Nascosto ai giocatori (nota del DM)', !!l.hidden, (v) => m('Visibilità', () => { l.hidden = v; })),
        actions)];
    }
    case 'marker': return markerProps(ed, o as Marker, m, actions);
    case 'token': return tokenProps(ed, o as Token, m, actions);
  }
  return [];
}

function markerProps(ed: Editor, mk: Marker, m: (l: string, f: () => void, k?: string) => void, actions: HTMLElement): HTMLElement[] {
  const rr = () => buildPanel(ed);
  const others = ed.maps.filter((x) => x.id !== ed.rt.doc.id);
  return [section('Segnaposto',
    text('Titolo', mk.title, (v) => m('Titolo', () => { mk.title = v; }, 'title')),
    iconGrid(mk.icon, (i) => { m('Icona', () => { mk.icon = i; }); rr(); }),
    color('Colore', mk.color, (v) => m('Colore', () => { mk.color = v; }, 'col')),
    area('Note del DM (segrete)', mk.notes, (v) => m('Note', () => { mk.notes = v; }, 'notes'), 6, 'Descrizione, PNG, tesori, trappole…'),
    area('Testo per i giocatori', mk.playerNotes, (v) => m('Note', () => { mk.playerNotes = v; }, 'pnotes'), 2, 'Quello che vedono cliccando'),
    check('Visibile ai giocatori', mk.visible, (v) => m('Visibilità', () => { mk.visible = v; })),
    select('Collega a mappa', [['', '— nessuna —'], ...others.map((x) => [x.id, x.name] as [string, string])], mk.link || '', (v) => m('Collegamento', () => { mk.link = v || undefined; })),
    mk.link ? btn('➜ Apri mappa collegata', () => ed.openMap(mk.link!), 'accent') : null,
    actions)];
}

function tokenProps(ed: Editor, t: Token, m: (l: string, f: () => void, k?: string) => void, actions: HTMLElement): HTMLElement[] {
  const rr = () => buildPanel(ed);
  const inCombat = ed.rt.doc.combat.members.includes(t.id);
  return [section('Pedina',
    text('Nome', t.name, (v) => m('Nome', () => { t.name = v; }, 'name')),
    row(select('Tipo', Object.entries(TOKEN_KIND_NAMES) as [string, string][], t.kind, (v) => { m('Tipo', () => { t.kind = v as TokenKind; t.color = TOKEN_KIND_COLORS[t.kind]; }); rr(); }),
      select('Taglia', Object.entries(TOKEN_SIZE_NAMES) as [string, string][], t.size, (v) => m('Taglia', () => { t.size = v as TokenSize; ed.snapToken(t); }))),
    hpEditor(ed, t, m),
    row(num('CA', t.ac, (v) => m('CA', () => { t.ac = v; })), num('Mod. iniz.', t.initMod, (v) => m('Iniziativa', () => { t.initMod = v; })), num('Iniziativa', t.init ?? 0, (v) => m('Iniziativa', () => { t.init = v; ed.sortCombat(); }))),
    condEditor(t, m, rr),
    color('Colore', t.color, (v) => m('Colore', () => { t.color = v; }, 'col')),
    tokenImagePicker(t.image, (id) => { m('Immagine', () => { t.image = id || undefined; }); rr(); }),
    check('Nascosta ai giocatori', t.hidden, (v) => m('Visibilità', () => { t.hidden = v; })),
    !inCombat ? btn('⚔ Aggiungi al combattimento', () => { m('Combattimento', () => { ed.rt.doc.combat.members.push(t.id); ed.sortCombat(); }); rr(); }) : null,
    actions)];
}

function hpEditor(ed: Editor, t: Token, m: (l: string, f: () => void, k?: string) => void) {
  const amt = h('input', { type: 'number', value: 1, min: 0, class: 'hp-amt' });
  const cur = h('input', { type: 'number', value: t.hp, class: 'hp-cur', onchange: () => m('PF', () => { t.hp = +cur.value; }) });
  const apply = (sign: number) => { const v = Math.abs(+amt.value || 0); m(sign < 0 ? 'Danno' : 'Cura', () => { t.hp = Math.min(t.maxHp, Math.max(sign < 0 ? -t.maxHp : 0, t.hp + sign * v)); }); cur.value = String(t.hp); ed.refreshPanel(); };
  return h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Punti ferita ', h('small', null, hpStatus(t))),
    h('div', { class: 'hp-row' },
      cur, h('span', null, '/'),
      h('input', { type: 'number', value: t.maxHp, class: 'hp-max', onchange: (e: Event) => m('PF max', () => { t.maxHp = +(e.target as HTMLInputElement).value; }) }),
      h('span', { class: 'sep' }),
      h('button', { class: 'btn small danger', onclick: () => apply(-1), title: 'Danno' }, '−'), amt,
      h('button', { class: 'btn small ok', onclick: () => apply(1), title: 'Cura' }, '+')));
}
function condEditor(t: Token, m: (l: string, f: () => void, k?: string) => void, rr: () => void) {
  return h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Condizioni'),
    h('div', { class: 'conds' }, ...CONDITIONS.map((c) => h('button', {
      class: 'cond' + (t.conditions.includes(c.id) ? ' on' : ''), title: c.name,
      onclick: () => { m('Condizione', () => { t.conditions = t.conditions.includes(c.id) ? t.conditions.filter((x) => x !== c.id) : [...t.conditions, c.id]; }); rr(); },
    }, c.icon, h('span', null, c.name)))));
}

// ============================================================================ session
function sessionPanel(ed: Editor): HTMLElement[] {
  const doc = ed.rt.doc, o = ed.opts.fog;
  const rr = () => buildPanel(ed);
  const out: HTMLElement[] = [];
  out.push(section('📺 Vista giocatori',
    row(btn('Apri finestra', () => ed.openPlayer(), 'accent'), btn('Invia questa vista', () => { ed.sendView(); toast('Vista inviata ai giocatori'); })),
    check('I giocatori seguono la mia vista', ed.follow, (v) => { ed.follow = v; if (v) ed.sendView(); }),
    hint('Trascina la finestra sulla TV e premi <b>F</b> (o doppio clic) per lo schermo intero. Con <b>⚙</b> calibri la scala reale per le miniature e ruoti l\'immagine se la TV è sdraiata sul tavolo.')));
  out.push(section('☁ Nebbia di guerra',
    check('Nebbia attiva', doc.fogEnabled, (v) => { ed.mutate('Nebbia', () => { doc.fogEnabled = v; }); }),
    seg([['reveal', '👁 Rivela'], ['hide', '☁ Copri'], ['room', '🚪 Rivela stanza']], o.mode, (v) => { o.mode = v; if (ed.tool !== 'fog') ed.setTool('fog'); else { rr(); ed.requestRender(); } }),
    o.mode !== 'room' ? slider('Pennello (caselle)', o.size, 0.5, 16, 0.5, (v) => { o.size = v; ed.requestRender(); }) : hint('Clicca dentro una stanza (o una zona nebbia) per rivelarla tutta. Nelle caverne rivela la galleria intorno al punto.'),
    row(btn('Copri tutto', () => { ed.rt.fog.fillAll(); ed.requestRender(); }), btn('Rivela tutto', () => { ed.rt.fog.clearAll(); ed.requestRender(); }))));
  const toks = doc.tokens;
  if (toks.length) out.push(section('Pedine',
    h('div', { class: 'list' }, ...toks.map((t) => h('div', { class: 'list-row' + (ed.sel?.id === t.id ? ' on' : '') },
      h('span', { class: 'dot', style: { background: TOKEN_KIND_COLORS[t.kind] } }),
      h('button', { class: 'link', onclick: () => { ed.select({ kind: 'token', id: t.id }); ed.centerOn(t.x, t.y); } }, t.name),
      t.maxHp ? h('small', null, `${t.hp}/${t.maxHp}`) : null,
      h('button', { class: 'icon-btn', title: t.hidden ? 'Mostra ai giocatori' : 'Nascondi ai giocatori', onclick: () => { ed.mutate('Visibilità', () => { t.hidden = !t.hidden; }); rr(); } }, t.hidden ? '🙈' : '👁'))))));
  if (doc.markers.length) out.push(section('Segnaposti',
    h('div', { class: 'list' }, ...doc.markers.map((mk) => h('div', { class: 'list-row' + (ed.sel?.id === mk.id ? ' on' : '') },
      h('span', null, mk.icon),
      h('button', { class: 'link', onclick: () => { ed.select({ kind: 'marker', id: mk.id }); ed.centerOn(mk.x, mk.y); } }, mk.title),
      h('button', { class: 'icon-btn', title: mk.visible ? 'Nascondi ai giocatori' : 'Mostra ai giocatori', onclick: () => { ed.mutate('Visibilità', () => { mk.visible = !mk.visible; }); rr(); } }, mk.visible ? '👁' : '🙈'))))));
  if (ed.tool === 'token') out.push(...tokenToolPanel(ed));
  if (ed.tool === 'marker') out.push(...toolPanel(ed));
  out.push(ambientSection(ed));
  return out;
}

function combatPanel(ed: Editor): HTMLElement[] {
  const doc = ed.rt.doc, cb = doc.combat;
  const rr = () => buildPanel(ed);
  const toks = new Map(doc.tokens.map((t) => [t.id, t]));
  const notIn = doc.tokens.filter((t) => !cb.members.includes(t.id));
  const head = section(cb.active ? `⚔ Round ${cb.round}` : '⚔ Combattimento',
    cb.active
      ? row(btn('◀', () => { ed.nextTurn(-1); rr(); }, '', 'Turno precedente'), btn('Turno successivo ▶', () => { ed.nextTurn(1); rr(); }, 'accent'), btn('Fine', () => { ed.mutate('Fine combattimento', () => { cb.active = false; cb.turn = null; cb.round = 1; }); rr(); }, 'danger'))
      : row(btn('▶ Inizia combattimento', () => { ed.sortCombat(); ed.nextTurn(1); rr(); }, 'accent')),
    row(
      notIn.length ? btn(`＋ Aggiungi pedine (${notIn.length})`, () => { ed.mutate('Combattimento', () => { cb.members.push(...notIn.map((t) => t.id)); ed.sortCombat(); }); rr(); }) : null,
      btn('🎲 Tira iniziativa PNG/mostri', () => { ed.rollInitiative('npc'); rr(); }),
    ),
    hint('Inserisci l\'iniziativa dei giocatori a mano; i mostri la tirano con il loro modificatore. La lista si ordina da sola.'));
  const list = h('div', { class: 'init-list' });
  for (const id of cb.members) {
    const t = toks.get(id);
    if (!t) continue;
    const initIn = h('input', { type: 'number', value: t.init ?? '', placeholder: '–', class: 'init-in', onchange: () => { ed.mutate('Iniziativa', () => { t.init = initIn.value === '' ? null : +initIn.value; ed.sortCombat(); }); rr(); } });
    const amt = h('input', { type: 'number', value: '', placeholder: 'PF', class: 'hp-amt' });
    const dmg = (s: number) => { const v = Math.abs(+amt.value || 0); if (!v) return; ed.mutate(s < 0 ? 'Danno' : 'Cura', () => { t.hp = Math.min(t.maxHp, Math.max(-t.maxHp, t.hp + s * v)); }); rr(); };
    list.appendChild(h('div', { class: 'init-row' + (cb.turn === id && cb.active ? ' turn' : '') + (t.hp <= 0 && t.maxHp > 0 ? ' dead' : '') },
      initIn,
      h('div', { class: 'init-main' },
        h('div', { class: 'init-name' },
          h('span', { class: 'dot', style: { background: TOKEN_KIND_COLORS[t.kind] } }),
          h('button', { class: 'link', onclick: () => { ed.tab = 'tool'; ed.select({ kind: 'token', id: t.id }); ed.centerOn(t.x, t.y); } }, t.name),
          t.hidden ? h('span', { title: 'Nascosta ai giocatori' }, '🙈') : null,
          h('small', { class: 'ac' }, `CA ${t.ac}`)),
        h('div', { class: 'init-hp' },
          h('div', { class: 'hpbar' }, h('div', { style: { width: (t.maxHp ? Math.max(0, Math.min(1, t.hp / t.maxHp)) * 100 : 0) + '%' } })),
          h('small', null, `${t.hp}/${t.maxHp}`),
          h('button', { class: 'btn small danger', onclick: () => dmg(-1) }, '−'), amt, h('button', { class: 'btn small ok', onclick: () => dmg(1) }, '+')),
        t.conditions.length ? h('div', { class: 'init-conds' }, ...t.conditions.map((c) => { const d = CONDITIONS.find((x) => x.id === c); return h('span', { title: d?.name }, d?.icon || c); })) : null),
      h('button', { class: 'icon-btn', title: 'Rimuovi dal combattimento', onclick: () => { ed.mutate('Combattimento', () => ed.removeFromCombat(id)); rr(); } }, '✕')));
  }
  if (!cb.members.length) list.appendChild(hint('Nessuna pedina in combattimento. Piazza delle pedine con lo strumento <b>Pedina (K)</b> e aggiungile qui.'));
  return [head, section('Ordine di iniziativa', list)];
}

// ============================================================================ map
function mapPanel(ed: Editor): HTMLElement[] {
  const doc = ed.rt.doc;
  const cols = h('input', { type: 'number', value: doc.cols, min: 5, max: 80 });
  const rows = h('input', { type: 'number', value: doc.rows, min: 5, max: 80 });
  const g = doc.grid;
  let gen: GenKind = 'dungeon';
  return [
    section('Mappa',
      text('Nome', doc.name, (v) => { doc.name = v; ed.updateTitle(); ed.changed('settings'); }),
      h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Dimensioni (caselle)'),
        h('div', { class: 'row' }, cols, h('span', null, '×'), rows,
          btn('Applica', () => {
            const c = Math.max(5, Math.min(80, +cols.value)), r = Math.max(5, Math.min(80, +rows.value));
            if (c === doc.cols && r === doc.rows) return;
            ed.rt.resize(c, r);
            ed.hist.clear(); ed.fitView(); ed.changed('masks'); buildPanel(ed);
          }))),
      hint(`${doc.cols * doc.grid.feet} × ${doc.rows * doc.grid.feet} ft. Il ridimensionamento mantiene l'angolo in alto a sinistra.`)),
    section('Sfondo e muri',
      h('span', { class: 'field-label' }, 'Terreno di base'),
      texGrid(FLOORS, doc.bg, (id) => { doc.bg = id; ed.rt.engine.invalidateAll(); ed.changed('settings'); buildPanel(ed); }),
      select('Stile muri delle stanze', WALL_NAMES, doc.wallStyle, (v) => { doc.wallStyle = v as WallStyle; ed.rt.engine.invalidateAll(); ed.changed('settings'); })),
    section('Griglia',
      check('Mostra griglia', g.show, (v) => { g.show = v; ed.changed('objects'); }),
      check('Mostra ai giocatori', g.showPlayers, (v) => { g.showPlayers = v; ed.changed('objects'); }),
      row(color('Colore', g.color, (v) => { g.color = v; ed.changed('objects'); }), num('Piedi/casella', g.feet, (v) => { g.feet = v; ed.changed('objects'); }, 1, 100)),
      slider('Opacità', g.opacity, 0.05, 1, 0.05, (v) => { g.opacity = v; ed.changed('objects'); }, (v) => Math.round(v * 100) + '%')),
    ambientSection(ed),
    section('Generatore',
      field('Tipo', h('select', { onchange: (e: Event) => { gen = (e.target as HTMLSelectElement).value as GenKind; } }, ...Object.entries(GEN_NAMES).map(([k, v]) => h('option', { value: k }, v)))),
      btn('🎲 Rigenera questa mappa', () => { if (confirm('Sostituire tutto il contenuto della mappa con una nuova generata? (non annullabile)')) ed.regenerate(gen); }),
      hint('Genera un punto di partenza da ritoccare: stanze, porte, arredi, luci e numeri delle stanze (visibili solo a te).')),
    section('Zona pericolosa',
      btn('🗑 Elimina questa mappa', async () => {
        if (!confirm(`Eliminare definitivamente "${doc.name}"?`)) return;
        ed.forgetCurrent();
        await deleteMap(doc.id);
        await ed.refreshMaps();
        if (ed.maps.length) await ed.openMap(ed.maps[0].id);
        else await ed.createMap({ name: 'Nuova mappa', cols: 30, rows: 20, template: 'dungeon' });
      }, 'danger')),
  ];
  void CELL;
}
