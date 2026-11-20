import { assets } from '../assets';
import { check, h, icon, modal, pickFile, toast } from '../dom';
import type { Editor } from '../editor';
import { GEN_NAMES, GenKind } from '../generate';
import { migrateDoc, MIN_SIZE, WallStyle } from '../model';
import { deleteMap, getMap, listAssets, listMaps, putAsset, putMap, StoredMap } from '../storage';
import { blobToDataURL, dataURLToBlob, downloadBlob, uid } from '../util';
import { FLOORS, listPicker, miniSlider, texName, texSwatch, toggle, WALL_NAMES, WALL_SWATCH } from './common';
import { lang, LANGS, setLang, t } from '../i18n';

export function moreMenu(ed: Editor, anchor: HTMLElement) {
  document.querySelector('.menu')?.remove();
  const r = anchor.getBoundingClientRect();
  const item = (ico: string, label: string, fn: () => void) => h('button', { onclick: () => { close(); fn(); } }, icon(ico, 18), label);
  const menu = h('div', { class: 'menu', role: 'menu', style: { top: r.bottom + 8 + 'px', right: window.innerWidth - r.right + 'px' } },
    item('settings', t('Map settings…'), () => mapSettings(ed)),
    item('map', t('Your maps'), () => ed.showHome()),
    h('div', { class: 'menu-sep' }),
    item('image', t('Export PNG image…'), () => exportPngDialog(ed)),
    item('upload', t('Export this map (.json)'), async () => downloadJSON([await ed.storedCurrent()], ed.rt.doc.name)),
    item('upload', t('Back up all maps'), () => backupAll(ed)),
    item('download', t('Import map or backup…'), () => importFile(ed)),
    h('div', { class: 'menu-sep' }),
    item('help', t('Help & shortcuts'), () => helpDialog()),
    item('globe', `${t('Language')}: ${LANGS.find((l) => l.id === lang)!.name}`, () => switchLang(ed)));
  document.body.appendChild(menu);
  const off = (e: PointerEvent) => { if (!menu.contains(e.target as Node)) close(); };
  const close = () => { menu.remove(); window.removeEventListener('pointerdown', off, true); };
  setTimeout(() => window.addEventListener('pointerdown', off, true));
}

async function switchLang(ed: Editor) {
  const next = lang === 'en' ? 'it' : 'en';
  if (ed.rt) await ed.saveNow();
  setLang(next);
  ed.channel.send({ t: 'lang' });
  location.reload();
}

export function mapSettings(ed: Editor) {
  const doc = ed.rt.doc, g = doc.grid;
  const name = h('input', { type: 'text', value: doc.name, oninput: () => { doc.name = name.value; ed.updateTitle(); ed.changed('settings'); } });
  const cols = h('input', { type: 'number', value: doc.cols, min: MIN_SIZE, max: 80, class: 'num-sm' });
  const rows = h('input', { type: 'number', value: doc.rows, min: MIN_SIZE, max: 80, class: 'num-sm' });
  const grid = h('input', { type: 'color', value: g.color, oninput: () => { g.color = grid.value; ed.changed('objects'); } });
  const feet = h('input', { type: 'number', value: g.feet, min: 1, max: 100, class: 'num-sm', onchange: () => { g.feet = +feet.value || 5; ed.changed('objects'); } });
  let gen: GenKind = 'dungeon';
  const bgGrid = h('div', { class: 'swatches' }, ...FLOORS.map((f) => h('button', {
    class: 'swatch' + (f === doc.bg ? ' on' : ''), title: texName(f),
    onclick: () => { doc.bg = f; ed.rt.engine.invalidateAll(); ed.changed('settings'); bgGrid.querySelectorAll('.swatch').forEach((b) => b.classList.toggle('on', (b as HTMLElement).title === texName(f))); },
  }, h('img', { src: texSwatch(f), alt: '' }), h('span', null, texName(f)))));
  const close = modal(t('Map settings'), h('div', { class: 'settings' },
    h('label', { class: 'field' }, h('span', { class: 'field-label' }, t('Name')), name),
    h('div', { class: 'field' }, h('span', { class: 'field-label' }, t('Size in squares (the top-left corner stays put)')),
      h('div', { class: 'row' }, cols, h('span', null, '×'), rows, h('button', { class: 'chip-btn', onclick: () => {
        const c = Math.max(MIN_SIZE, Math.min(80, +cols.value || MIN_SIZE)), r = Math.max(MIN_SIZE, Math.min(80, +rows.value || MIN_SIZE));
        cols.value = String(c); rows.value = String(r);
        if (c === doc.cols && r === doc.rows) return;
        ed.rt.resize(c, r); ed.hist.clear(); ed.fitView(); ed.changed('masks'); toast(t('Map resized'));
      } }, t('Apply')))),
    h('div', { class: 'field' }, h('span', { class: 'field-label' }, t('Base terrain')), bgGrid),
    listPicker<WallStyle>(t('Room walls'), WALL_NAMES, doc.wallStyle, (v) => { doc.wallStyle = v; ed.rt.engine.invalidateAll(); ed.changed('settings'); close(); mapSettings(ed); }, (v) => WALL_SWATCH[v]),
    h('h3', null, t('Grid')),
    h('div', { class: 'row' }, toggle(t('Show'), g.show, (v) => { g.show = v; ed.changed('objects'); }), toggle(t('Also on the TV'), g.showPlayers, (v) => { g.showPlayers = v; ed.changed('objects'); })),
    h('div', { class: 'row' }, h('label', { class: 'color-dot' }, grid, h('span', null, t('Color'))), h('label', { class: 'mini-slider' }, h('span', { class: 'mini-label' }, t('Feet per square')), feet)),
    miniSlider(t('Opacity'), g.opacity, 0.05, 1, 0.05, (v) => { g.opacity = v; ed.changed('objects'); }, (v) => Math.round(v * 100) + '%'),
    h('h3', null, t('Light & fog')),
    miniSlider(t('Ambient darkness'), doc.ambient, 0, 0.95, 0.05, (v) => { doc.ambient = v; ed.changed('objects'); }, (v) => Math.round(v * 100) + '%'),
    toggle(t('Full lighting preview while preparing'), ed.opts.previewLights, (v) => { ed.opts.previewLights = v; ed.requestRender(); }),
    toggle(t('Fog of war enabled'), doc.fogEnabled, (v) => { ed.mutate(t('Fog'), () => { doc.fogEnabled = v; }); }),
    h('h3', null, t('Regenerate')),
    h('div', { class: 'row' },
      h('select', { onchange: (e: Event) => { gen = (e.target as HTMLSelectElement).value as GenKind; } }, ...Object.entries(GEN_NAMES).map(([k, v]) => h('option', { value: k }, v))),
      h('button', { class: 'chip-btn', onclick: () => {
        if (doc.combat.active) { toast(t('End combat before regenerating the map')); return; }
        if (confirm(t('Replace everything with a generated map? This cannot be undone.'))) { close(); ed.regenerate(gen); }
      } }, icon('dice', 16), t('Regenerate'))),
    h('h3', null, t('Danger zone')),
    h('button', { class: 'chip-btn danger', onclick: async () => {
      if (!confirm(t('Permanently delete “{name}”?', { name: doc.name }))) return;
      close();
      ed.forgetCurrent();
      await deleteMap(doc.id);
      await ed.refreshMaps();
      if (ed.maps.length) await ed.openMap(ed.maps[0].id); else ed.showHome();
    } }, icon('trash', 16), t('Delete this map'))), [], false);
}

export async function duplicateMap(id: string) {
  const rec = await getMap(id);
  if (!rec) return;
  const copy: StoredMap = { ...rec, id: uid(), name: rec.name + t(' (copy)'), updatedAt: Date.now(), doc: { ...rec.doc } };
  copy.doc.id = copy.id; copy.doc.name = copy.name;
  await putMap(copy);
}

function exportPngDialog(ed: Editor) {
  let scale = 1, grid = true, tokens = false;
  const px = () => `${ed.rt.doc.cols * 100 * scale} × ${ed.rt.doc.rows * 100 * scale} px`;
  const info = h('p', { class: 'hint' }, px());
  const seg = h('div', { class: 'seg' }, ...[1, 2].map((s) => h('button', {
    class: s === scale ? 'on' : '', onclick: () => { scale = s; info.textContent = px(); seg.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', i === s - 1)); },
  }, s === 1 ? t('100 px/square') : t('200 px/square (print)'))));
  modal(t('Export image'), h('div', null, seg, info,
    check(t('Include the grid'), grid, (v) => { grid = v; }),
    check(t('Include visible tokens'), tokens, (v) => { tokens = v; }),
    h('p', { class: 'hint' }, t('Items hidden from players, fog and markers are not exported. To print at real scale (1 square = 1 inch) use 100 px/square at 100 dpi.'))),
  [{ label: t('Cancel') }, { label: t('Export'), cls: 'accent', onClick: () => { ed.exportPNG(scale, grid, tokens); } }]);
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
    toast(t('Imported {n} maps', { n: data.maps.length }));
    if (first) { ed.hideHome(); await ed.openMap(first); }
  } catch (e) {
    console.error(e);
    toast(t('Invalid file'));
  }
}

export function helpDialog() {
  const k = (keys: string, what: string) => h('tr', null, h('td', null, h('kbd', null, keys)), h('td', null, what));
  modal(t('Help'), h('div', { class: 'help' },
    h('h3', null, t('How it works')),
    h('ol', null,
      h('li', null, h('b', null, t('Prepare')), t(': use the five actions on the left — Select, Paint, Build, Furnish, Annotate. Their options appear in the bottom bar.')),
      h('li', null, t('Select something to edit it: its card appears right next to it.')),
      h('li', null, t('Connect the TV with '), h('b', null, t('TV screen')), t(', drag the window onto the TV and press F for full screen.')),
      h('li', null, h('b', null, t('Play')), t(': move tokens, reveal fog, open doors and run initiative from the left panel.'))),
    h('h3', null, t('Shortcuts')),
    h('table', null,
      k('V B R O T', t('Select · Paint · Build · Furnish · Annotate')),
      k('C W D L K M U', t('Cave · Wall · Door · Light · Token · Marker · Ruler')),
      k(t('Space + drag / right mouse button'), t('pan the view')), k(t('Wheel / pinch'), t('zoom')), k('0', t('fit to window')),
      k('Ctrl/Cmd + Z', t('undo')), k('Shift + Ctrl/Cmd + Z', t('redo')), k('Ctrl/Cmd + D', t('duplicate')), k(t('Del'), t('delete selection')),
      k('Q / E', t('rotate')), k(t('Arrows'), t('move selection (tokens by 1 square)')), k('[ / ]', t('brush size')),
      k(t('Enter / double-click'), t('close freeform shape or wall')), k('Esc', t('cancel / deselect')), k('Alt', t('no grid snapping'))),
    h('p', { class: 'hint' }, t('Everything is saved automatically in the browser. Make a backup from the ⋯ menu every now and then.'))), [], true);
}
