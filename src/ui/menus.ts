import { assets } from '../assets';
import { check, h, icon, modal, pickFile, toast } from '../dom';
import type { Editor } from '../editor';
import { GEN_NAMES, GenKind } from '../generate';
import { migrateDoc, WallStyle } from '../model';
import { deleteMap, getMap, listAssets, listMaps, putAsset, putMap, StoredMap } from '../storage';
import { blobToDataURL, dataURLToBlob, downloadBlob, uid } from '../util';
import { FLOORS, listPicker, miniSlider, texName, texSwatch, toggle, WALL_NAMES, WALL_SWATCH } from './common';

export function moreMenu(ed: Editor, anchor: HTMLElement) {
  document.querySelector('.menu')?.remove();
  const r = anchor.getBoundingClientRect();
  const item = (ico: string, label: string, fn: () => void) => h('button', { onclick: () => { close(); fn(); } }, icon(ico, 18), label);
  const menu = h('div', { class: 'menu', role: 'menu', style: { top: r.bottom + 8 + 'px', right: window.innerWidth - r.right + 'px' } },
    item('settings', 'Impostazioni mappa…', () => mapSettings(ed)),
    item('map', 'Le tue mappe', () => ed.showHome()),
    h('div', { class: 'menu-sep' }),
    item('image', 'Esporta immagine PNG…', () => exportPngDialog(ed)),
    item('upload', 'Esporta questa mappa (.json)', async () => downloadJSON([await ed.storedCurrent()], ed.rt.doc.name)),
    item('upload', 'Backup di tutte le mappe', () => backupAll(ed)),
    item('download', 'Importa mappa o backup…', () => importFile(ed)),
    h('div', { class: 'menu-sep' }),
    item('help', 'Aiuto e scorciatoie', () => helpDialog()));
  document.body.appendChild(menu);
  const off = (e: PointerEvent) => { if (!menu.contains(e.target as Node)) close(); };
  const close = () => { menu.remove(); window.removeEventListener('pointerdown', off, true); };
  setTimeout(() => window.addEventListener('pointerdown', off, true));
}

export function mapSettings(ed: Editor) {
  const doc = ed.rt.doc, g = doc.grid;
  const name = h('input', { type: 'text', value: doc.name, oninput: () => { doc.name = name.value; ed.updateTitle(); ed.changed('settings'); } });
  const cols = h('input', { type: 'number', value: doc.cols, min: 5, max: 80, class: 'num-sm' });
  const rows = h('input', { type: 'number', value: doc.rows, min: 5, max: 80, class: 'num-sm' });
  const grid = h('input', { type: 'color', value: g.color, oninput: () => { g.color = grid.value; ed.changed('objects'); } });
  const feet = h('input', { type: 'number', value: g.feet, min: 1, max: 100, class: 'num-sm', onchange: () => { g.feet = +feet.value || 5; ed.changed('objects'); } });
  let gen: GenKind = 'dungeon';
  const bgGrid = h('div', { class: 'swatches' }, ...FLOORS.map((f) => h('button', {
    class: 'swatch' + (f === doc.bg ? ' on' : ''), title: texName(f),
    onclick: () => { doc.bg = f; ed.rt.engine.invalidateAll(); ed.changed('settings'); bgGrid.querySelectorAll('.swatch').forEach((b) => b.classList.toggle('on', (b as HTMLElement).title === texName(f))); },
  }, h('img', { src: texSwatch(f), alt: '' }), h('span', null, texName(f)))));
  const close = modal('Impostazioni mappa', h('div', { class: 'settings' },
    h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Nome'), name),
    h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Dimensioni in caselle (l\'angolo in alto a sinistra resta fermo)'),
      h('div', { class: 'row' }, cols, h('span', null, '×'), rows, h('button', { class: 'chip-btn', onclick: () => {
        const c = Math.max(5, Math.min(80, +cols.value)), r = Math.max(5, Math.min(80, +rows.value));
        if (c === doc.cols && r === doc.rows) return;
        ed.rt.resize(c, r); ed.hist.clear(); ed.fitView(); ed.changed('masks'); toast('Mappa ridimensionata');
      } }, 'Applica'))),
    h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Terreno di base'), bgGrid),
    listPicker<WallStyle>('Muri delle stanze', WALL_NAMES, doc.wallStyle, (v) => { doc.wallStyle = v; ed.rt.engine.invalidateAll(); ed.changed('settings'); close(); mapSettings(ed); }, (v) => WALL_SWATCH[v]),
    h('h3', null, 'Griglia'),
    h('div', { class: 'row' }, toggle('Mostra', g.show, (v) => { g.show = v; ed.changed('objects'); }), toggle('Anche sulla TV', g.showPlayers, (v) => { g.showPlayers = v; ed.changed('objects'); })),
    h('div', { class: 'row' }, h('label', { class: 'color-dot' }, grid, h('span', null, 'Colore')), h('label', { class: 'mini-slider' }, h('span', { class: 'mini-label' }, 'Piedi per casella'), feet)),
    miniSlider('Opacità', g.opacity, 0.05, 1, 0.05, (v) => { g.opacity = v; ed.changed('objects'); }, (v) => Math.round(v * 100) + '%'),
    h('h3', null, 'Luce e nebbia'),
    miniSlider('Oscurità ambientale', doc.ambient, 0, 0.95, 0.05, (v) => { doc.ambient = v; ed.changed('objects'); }, (v) => Math.round(v * 100) + '%'),
    toggle('Anteprima completa delle luci mentre prepari', ed.opts.previewLights, (v) => { ed.opts.previewLights = v; ed.requestRender(); }),
    toggle('Nebbia di guerra attiva', doc.fogEnabled, (v) => { ed.mutate('Nebbia', () => { doc.fogEnabled = v; }); }),
    h('h3', null, 'Rigenera'),
    h('div', { class: 'row' },
      h('select', { onchange: (e: Event) => { gen = (e.target as HTMLSelectElement).value as GenKind; } }, ...Object.entries(GEN_NAMES).map(([k, v]) => h('option', { value: k }, v))),
      h('button', { class: 'chip-btn', onclick: () => { if (confirm('Sostituire tutto il contenuto con una mappa generata? Non si può annullare.')) { close(); ed.regenerate(gen); } } }, icon('dice', 16), 'Rigenera')),
    h('h3', null, 'Zona pericolosa'),
    h('button', { class: 'chip-btn danger', onclick: async () => {
      if (!confirm(`Eliminare definitivamente "${doc.name}"?`)) return;
      close();
      ed.forgetCurrent();
      await deleteMap(doc.id);
      await ed.refreshMaps();
      if (ed.maps.length) await ed.openMap(ed.maps[0].id); else ed.showHome();
    } }, icon('trash', 16), 'Elimina questa mappa')), [], false);
}

export async function duplicateMap(id: string) {
  const rec = await getMap(id);
  if (!rec) return;
  const copy: StoredMap = { ...rec, id: uid(), name: rec.name + ' (copia)', updatedAt: Date.now(), doc: { ...rec.doc } };
  copy.doc.id = copy.id; copy.doc.name = copy.name;
  await putMap(copy);
}

function exportPngDialog(ed: Editor) {
  let scale = 1, grid = true, tokens = false;
  const px = () => `${ed.rt.doc.cols * 100 * scale} × ${ed.rt.doc.rows * 100 * scale} px`;
  const info = h('p', { class: 'hint' }, px());
  const seg = h('div', { class: 'seg' }, ...[1, 2].map((s) => h('button', {
    class: s === scale ? 'on' : '', onclick: () => { scale = s; info.textContent = px(); seg.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', i === s - 1)); },
  }, s === 1 ? '100 px/casella' : '200 px/casella (stampa)')));
  modal('Esporta immagine', h('div', null, seg, info,
    check('Includi la griglia', grid, (v) => { grid = v; }),
    check('Includi le pedine visibili', tokens, (v) => { tokens = v; }),
    h('p', { class: 'hint' }, 'Elementi nascosti ai giocatori, nebbia e segnaposti non vengono esportati. Per stampare a scala reale (1 casella = 2,54 cm) usa 100 px/casella a 100 dpi.')),
  [{ label: 'Annulla' }, { label: 'Esporta', cls: 'accent', onClick: () => { ed.exportPNG(scale, grid, tokens); } }]);
}

export async function backupAll(ed: Editor) {
  if (ed.rt) await ed.saveNow();
  await downloadJSON(await listMaps(), 'backup-cartografo');
}

async function downloadJSON(recs: StoredMap[], name: string) {
  const used = new Set<string>();
  const maps = [];
  for (const r of recs) {
    for (const s of r.doc.stamps || []) if (s.type.startsWith('asset:')) used.add(s.type.slice(6));
    for (const t of r.doc.tokens || []) if (t.image) used.add(t.image);
    const masks: Record<string, string> = {};
    for (const [k, b] of Object.entries(r.masks || {})) masks[k] = await blobToDataURL(b);
    maps.push({ doc: r.doc, masks, fog: r.fog ? await blobToDataURL(r.fog) : undefined });
  }
  const out = [];
  for (const a of await listAssets()) if (used.has(a.id)) out.push({ id: a.id, name: a.name, w: a.w, h: a.h, cells: a.cells, kind: a.kind, data: await blobToDataURL(a.blob) });
  const blob = new Blob([JSON.stringify({ app: 'cartografo-dnd', version: 1, maps, assets: out })], { type: 'application/json' });
  downloadBlob(blob, name.replace(/[^\w\- àèéìòù]/gi, '') + '.cartografo.json');
}

export async function importFile(ed: Editor) {
  const [f] = await pickFile('.json,application/json');
  if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    if (data.app !== 'cartografo-dnd') throw new Error('format');
    for (const a of data.assets || []) {
      if (assets.recs.has(a.id)) continue;
      await putAsset({ id: a.id, name: a.name, w: a.w, h: a.h, cells: a.cells, kind: a.kind, blob: await dataURLToBlob(a.data) });
    }
    await assets.loadAll();
    const existing = new Set((await listMaps()).map((m) => m.id));
    const remap = new Map<string, string>();
    for (const m of data.maps) if (existing.has(m.doc.id)) remap.set(m.doc.id, uid());
    let first = '';
    for (const m of data.maps) {
      const doc = migrateDoc(m.doc);
      doc.id = remap.get(doc.id) || doc.id;
      for (const mk of doc.markers) if (mk.link && remap.has(mk.link)) mk.link = remap.get(mk.link);
      const masks: Record<string, Blob> = {};
      for (const [k, u] of Object.entries(m.masks || {})) masks[k] = await dataURLToBlob(u as string);
      await putMap({ id: doc.id, name: doc.name, updatedAt: Date.now(), doc, masks, fog: m.fog ? await dataURLToBlob(m.fog) : undefined });
      first ||= doc.id;
    }
    await ed.refreshMaps();
    toast(`Importate ${data.maps.length} mappe`);
    if (first) { ed.hideHome(); await ed.openMap(first); }
  } catch (e) {
    console.error(e);
    toast('File non valido');
  }
}

export function helpDialog() {
  const k = (keys: string, what: string) => h('tr', null, h('td', null, h('kbd', null, keys)), h('td', null, what));
  modal('Aiuto', h('div', { class: 'help' },
    h('h3', null, 'Come si usa'),
    h('ol', null,
      h('li', null, h('b', null, 'Prepara'), ': usa le cinque azioni a sinistra — Seleziona, Dipingi, Costruisci, Arreda, Annota. Le opzioni compaiono nella barra in basso.'),
      h('li', null, 'Seleziona qualcosa per modificarlo: la scheda appare accanto all\'oggetto.'),
      h('li', null, 'Collega la TV con ', h('b', null, 'Schermo TV'), ', trascina la finestra sul televisore e premi F per lo schermo intero.'),
      h('li', null, h('b', null, 'Gioca'), ': muovi le pedine, rivela la nebbia, apri le porte e gestisci l\'iniziativa nel pannello a sinistra.')),
    h('h3', null, 'Scorciatoie'),
    h('table', null,
      k('V B R O T', 'Seleziona · Dipingi · Costruisci · Arreda · Annota'),
      k('C W D L K M U', 'Caverna · Muro · Porta · Luce · Pedina · Segnaposto · Righello'),
      k('Spazio + trascina / tasto destro', 'muovi la vista'), k('Rotella / pinch', 'zoom'), k('0', 'adatta alla finestra'),
      k('Ctrl/Cmd + Z', 'annulla'), k('Shift + Ctrl/Cmd + Z', 'ripeti'), k('Ctrl/Cmd + D', 'duplica'), k('Canc', 'elimina'),
      k('Q / E', 'ruota'), k('Frecce', 'sposta (pedine di 1 casella)'), k('[ / ]', 'dimensione pennello'),
      k('Invio / doppio clic', 'chiudi forma libera o muro'), k('Esc', 'annulla / deseleziona'), k('Alt', 'senza aggancio alla griglia')),
    h('p', { class: 'hint' }, 'Tutto viene salvato automaticamente nel browser. Ogni tanto fai un backup dal menu ⋯.')), [], true);
}
