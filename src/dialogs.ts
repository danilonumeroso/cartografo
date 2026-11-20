import { assets } from './assets';
import { btn, check, h, modal, pickFile, toast } from './dom';
import type { Editor } from './editor';
import { migrateDoc } from './model';
import { getMap, listAssets, listMaps, putAsset, putMap, deleteMap, StoredMap } from './storage';
import { blobToDataURL, dataURLToBlob, downloadBlob, uid } from './util';

const TEMPLATES: { id: string; name: string; desc: string; emoji: string }[] = [
  { id: 'dungeon', name: 'Dungeon casuale', desc: 'Stanze, corridoi, porte, arredi e torce', emoji: '🏰' },
  { id: 'cave', name: 'Caverna casuale', desc: 'Gallerie naturali, pozze, cristalli', emoji: '🕳️' },
  { id: 'forest', name: 'Radura casuale', desc: 'Bosco, sentiero, accampamento', emoji: '🌲' },
  { id: 'tavern', name: 'Taverna', desc: 'Sala comune, cucina, dispensa, strada', emoji: '🍺' },
  { id: 'empty-dungeon', name: 'Dungeon vuoto', desc: 'Roccia scura: disegna stanze e caverne', emoji: '⬛' },
  { id: 'outdoor', name: 'Esterno vuoto', desc: 'Prato da dipingere', emoji: '🟩' },
  { id: 'interior', name: 'Interno vuoto', desc: 'Pavimento in legno', emoji: '🟫' },
];
const SIZES: [string, number, number][] = [['Piccola', 20, 15], ['Media', 30, 22], ['Grande', 40, 30], ['Enorme', 60, 40]];

export function newMapDialog(ed: Editor) {
  let tpl = 'dungeon', cols = 30, rows = 22;
  const name = h('input', { type: 'text', value: 'Nuova mappa' });
  const cIn = h('input', { type: 'number', value: cols, min: 5, max: 80 });
  const rIn = h('input', { type: 'number', value: rows, min: 5, max: 80 });
  const cards = h('div', { class: 'tpl-grid' }, ...TEMPLATES.map((t) => h('button', {
    class: 'tpl' + (t.id === tpl ? ' on' : ''), 'data-id': t.id,
    onclick: (e: MouseEvent) => { tpl = t.id; cards.querySelectorAll('.tpl').forEach((b) => b.classList.toggle('on', (b as HTMLElement).dataset.id === tpl)); void e; },
  }, h('span', { class: 'tpl-emoji' }, t.emoji), h('strong', null, t.name), h('small', null, t.desc))));
  const sizes = h('div', { class: 'chips' }, ...SIZES.map(([n, c, r]) => h('button', { class: 'chip', onclick: () => { cIn.value = String(c); rIn.value = String(r); } }, `${n} ${c}×${r}`)));
  modal('Nuova mappa', h('div', null,
    h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Nome'), name),
    h('span', { class: 'field-label' }, 'Punto di partenza'), cards,
    h('span', { class: 'field-label' }, 'Dimensioni in caselle (1 casella = 5 ft)'), sizes,
    h('div', { class: 'row' }, cIn, h('span', null, '×'), rIn)),
  [{ label: 'Annulla' }, {
    label: 'Crea mappa', cls: 'accent', onClick: async () => {
      cols = Math.max(5, Math.min(80, +cIn.value || 30)); rows = Math.max(5, Math.min(80, +rIn.value || 22));
      await ed.createMap({ name: name.value || 'Mappa', cols, rows, template: tpl });
    },
  }], true);
  setTimeout(() => { name.focus(); name.select(); }, 30);
}

export async function mapsDialog(ed: Editor) {
  await ed.saveNow();
  await ed.refreshMaps();
  let close = () => {};
  const grid = h('div', { class: 'maps-grid' }, ...ed.maps.map((m) => h('div', { class: 'map-card' + (m.id === ed.rt.doc.id ? ' on' : '') },
    h('button', { class: 'map-thumb', onclick: async () => { close(); await ed.openMap(m.id); } }, m.thumb ? h('img', { src: m.thumb }) : h('span', null, '🗺')),
    h('div', { class: 'map-meta' }, h('strong', null, m.name), h('small', null, new Date(m.updatedAt).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }))),
    h('div', { class: 'row' },
      btn('Duplica', async () => { await duplicateMap(m.id); close(); await ed.refreshMaps(); mapsDialog(ed); }, 'small'),
      m.id !== ed.rt.doc.id ? btn('Elimina', async () => { if (!confirm(`Eliminare "${m.name}"?`)) return; await deleteMap(m.id); close(); mapsDialog(ed); }, 'small danger') : null),
  )));
  close = modal('Le mie mappe', h('div', null, grid, h('div', { class: 'row' }, btn('＋ Nuova mappa', () => { close(); newMapDialog(ed); }, 'accent'))), [], true);
}

async function duplicateMap(id: string) {
  const rec = await getMap(id);
  if (!rec) return;
  const copy: StoredMap = { ...rec, id: uid(), name: rec.name + ' (copia)', updatedAt: Date.now(), doc: { ...rec.doc } };
  copy.doc.id = copy.id; copy.doc.name = copy.name;
  await putMap(copy);
}

export function fileMenu(ed: Editor, anchor: HTMLElement) {
  document.querySelector('.menu')?.remove();
  const r = anchor.getBoundingClientRect();
  const item = (label: string, fn: () => void) => h('button', { onclick: () => { menu.remove(); fn(); } }, label);
  const menu = h('div', { class: 'menu', style: { top: r.bottom + 6 + 'px', right: window.innerWidth - r.right + 'px' } },
    item('🖼  Esporta immagine PNG…', () => exportPngDialog(ed)),
    item('💾  Esporta questa mappa (.json)', async () => downloadJSON([await ed.storedCurrent()], ed.rt.doc.name)),
    item('🗄  Backup di tutte le mappe', async () => { await ed.saveNow(); downloadJSON(await listMaps(), 'backup-cartografo'); }),
    item('📂  Importa mappa o backup…', () => importFile(ed)),
    item('🗺  Le mie mappe', () => mapsDialog(ed)),
  );
  document.body.appendChild(menu);
  const off = (e: PointerEvent) => { if (!menu.contains(e.target as Node)) { menu.remove(); window.removeEventListener('pointerdown', off, true); } };
  setTimeout(() => window.addEventListener('pointerdown', off, true));
}

function exportPngDialog(ed: Editor) {
  let scale = 1, grid = true, tokens = false;
  const px = () => `${ed.rt.doc.cols * 100 * scale} × ${ed.rt.doc.rows * 100 * scale} px`;
  const info = h('p', { class: 'hint' }, px());
  modal('Esporta immagine', h('div', null,
    h('div', { class: 'seg' },
      ...[1, 2].map((s) => h('button', { class: s === scale ? 'on' : '', onclick: (e: MouseEvent) => { scale = s; info.textContent = px(); (e.currentTarget as HTMLElement).parentElement!.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', i === s - 1)); } }, s === 1 ? '100 px/casella' : '200 px/casella (stampa)'))),
    info,
    check('Includi la griglia', grid, (v) => { grid = v; }),
    check('Includi le pedine visibili', tokens, (v) => { tokens = v; }),
    h('p', { class: 'hint' }, 'Gli elementi nascosti ai giocatori, la nebbia e i segnaposti non vengono esportati. Per stampare a scala reale (1 casella = 2,54 cm) usa 100 px/casella a 100 dpi o 200 px/casella a 200 dpi.')),
  [{ label: 'Annulla' }, { label: 'Esporta', cls: 'accent', onClick: () => { ed.exportPNG(scale, grid, tokens); } }]);
}

async function downloadJSON(recs: StoredMap[], name: string) {
  const usedAssets = new Set<string>();
  const maps = [];
  for (const r of recs) {
    for (const s of r.doc.stamps || []) if (s.type.startsWith('asset:')) usedAssets.add(s.type.slice(6));
    for (const t of r.doc.tokens || []) if (t.image) usedAssets.add(t.image);
    const masks: Record<string, string> = {};
    for (const [k, b] of Object.entries(r.masks || {})) masks[k] = await blobToDataURL(b);
    maps.push({ doc: r.doc, masks, fog: r.fog ? await blobToDataURL(r.fog) : undefined });
  }
  const all = await listAssets();
  const assetsOut = [];
  for (const a of all) if (usedAssets.has(a.id)) assetsOut.push({ id: a.id, name: a.name, w: a.w, h: a.h, cells: a.cells, kind: a.kind, data: await blobToDataURL(a.blob) });
  const blob = new Blob([JSON.stringify({ app: 'cartografo-dnd', version: 1, maps, assets: assetsOut })], { type: 'application/json' });
  downloadBlob(blob, name.replace(/[^\w\- àèéìòù]/gi, '') + '.cartografo.json');
}

async function importFile(ed: Editor) {
  const [f] = await pickFile('.json,application/json');
  if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    if (data.app !== 'cartografo-dnd') throw new Error('formato');
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
    if (first) await ed.openMap(first);
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
      h('li', null, 'Crea una mappa da ', h('b', null, '＋ Nuova mappa'), ': parti da un generatore o da una mappa vuota.'),
      h('li', null, 'In modalità ', h('b', null, 'Editor'), ' dipingi il terreno, disegna stanze e caverne (i muri si generano da soli), aggiungi porte, oggetti, luci, testi e segnaposti con note.'),
      h('li', null, 'Passa a ', h('b', null, 'Sessione'), ' e apri ', h('b', null, '📺 Vista giocatori'), ': trascina la finestra sulla TV e mettila a schermo intero.'),
      h('li', null, 'Durante il gioco rivela la nebbia, sposta le pedine, apri le porte, fai ping e gestisci l\'iniziativa nella scheda Combattimento.')),
    h('h3', null, 'Scorciatoie'),
    h('table', null,
      k('Spazio + trascina / tasto destro', 'muovi la vista'), k('Rotella / pinch', 'zoom'), k('0', 'adatta alla finestra'),
      k('Ctrl/Cmd + Z', 'annulla'), k('Shift + Ctrl/Cmd + Z', 'ripeti'), k('Ctrl/Cmd + D', 'duplica'), k('Canc', 'elimina selezione'),
      k('Q / E', 'ruota oggetto'), k('Frecce', 'sposta selezione (pedine di 1 casella)'), k('[ / ]', 'dimensione pennello'),
      k('Invio / doppio clic', 'chiudi poligono o muro'), k('Esc', 'annulla / deseleziona'), k('Alt', 'disattiva aggancio alla griglia')),
    h('p', { class: 'hint' }, 'Tutto viene salvato automaticamente nel browser. Fai ogni tanto un backup da File ▾ → Backup di tutte le mappe.')), [], true);
}
