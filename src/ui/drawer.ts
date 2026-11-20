import { assets } from '../assets';
import { h, icon, pickFile, toast } from '../dom';
import type { Editor } from '../editor';
import { CATEGORIES, STAMPS } from '../stamps';
import { TOOL_INTENT } from './chrome';
import { iconBtn, miniSlider, sThumb, toggle } from './common';

const CATS = ['Tutti', ...CATEGORIES, 'Luci', 'I miei'];

export function renderDrawer(ed: Editor) {
  const d = ed.el.drawer;
  d.innerHTML = '';
  const show = ed.mode === 'edit' && TOOL_INTENT[ed.tool] === 'furnish';
  d.hidden = !show;
  ed.stage.classList.toggle('furnishing', show);
  if (!show) return;
  const o = ed.opts.stamp, u = ed.ui;
  const grid = h('div', { class: 'lib-grid' });
  const fillGrid = () => { grid.innerHTML = ''; grid.append(...tiles(ed)); };
  const search = h('input', {
    type: 'text', value: u.search, placeholder: 'Cerca: barile, torcia, albero…', 'aria-label': 'Cerca oggetti',
    oninput: () => { u.search = search.value; fillGrid(); },
  });
  const head = h('div', { class: 'lib-head' },
    h('label', { class: 'search' }, icon('search', 16), search),
    h('div', { class: 'chips' }, ...CATS.map((c) => h('button', {
      class: 'chip' + (c === u.stampCat && !u.search ? ' on' : ''), onclick: () => { u.stampCat = c; u.search = ''; ed.refreshUI(); },
    }, c))),
    h('div', { class: 'lib-opts' },
      ed.tool === 'light'
        ? [miniSlider('Raggio', ed.opts.light.radius, 1, 20, 0.5, (v) => { ed.opts.light.radius = v; }, (v) => v + ' cas.')]
        : [
          miniSlider('Scala', o.scale, 0.2, 4, 0.05, (v) => { o.scale = v; ed.requestRender(); }, (v) => v.toFixed(1) + '×'),
          toggle('Rotazione casuale', o.randomRot, (v) => { o.randomRot = v; }),
          toggle('Spargi trascinando', o.scatter, (v) => { o.scatter = v; ed.refreshUI(); ed.requestRender(); }),
          o.scatter ? miniSlider('Distanza', o.spacing, 0.3, 5, 0.1, (v) => { o.spacing = v; ed.requestRender(); }, (v) => v.toFixed(1)) : null,
        ],
      u.stampCat === 'Luci' ? miniSlider('Oscurità', ed.rt.doc.ambient, 0, 0.95, 0.05, (v) => { ed.rt.doc.ambient = v; ed.changed('objects'); }, (v) => Math.round(v * 100) + '%') : null,
      iconBtn(u.drawerOpen ? 'chevron' : 'chevronUp', u.drawerOpen ? 'Riduci libreria' : 'Espandi libreria', () => { u.drawerOpen = !u.drawerOpen; ed.refreshUI(); })),
  );
  d.append(head);
  if (u.drawerOpen) { fillGrid(); d.append(grid); }
  const sel = o.type.startsWith('asset:') ? assets.recs.get(o.type.slice(6)) : null;
  if (u.drawerOpen && sel && ed.tool === 'stamp') {
    const w = h('input', { type: 'number', value: sel.cells, min: 0.1, max: 50, step: 0.1, class: 'num-sm', onchange: () => { sel.cells = Math.max(0.1, +w.value || 1); assets.update(sel); ed.requestRender(); } });
    d.append(h('div', { class: 'lib-foot' },
      h('span', null, h('b', null, sel.name)),
      h('label', { class: 'mini-slider' }, h('span', { class: 'mini-label' }, 'Larghezza in caselle'), w),
      h('button', { class: 'chip-btn danger', onclick: async () => { if (confirm('Eliminare questo asset? Gli oggetti già piazzati spariranno.')) { await assets.remove(sel.id); o.type = 'barrel'; } } }, 'Elimina asset')));
  }
}

function tile(label: string, img: string | HTMLElement, active: boolean, onClick: () => void) {
  return h('button', { class: 'lib-tile' + (active ? ' on' : ''), 'aria-pressed': String(active), title: label, onclick: onClick },
    typeof img === 'string' ? h('img', { src: img, alt: '' }) : img, h('span', null, label));
}

function tiles(ed: Editor): HTMLElement[] {
  const o = ed.opts.stamp, u = ed.ui;
  const pick = (type: string) => () => { o.type = type; ed.setTool('stamp'); };
  const q = u.search.trim().toLowerCase();
  const out: HTMLElement[] = [];
  const mine = () => assets.list('stamp').map((a) => tile(a.name, assets.urls.get(a.id) || '', ed.tool === 'stamp' && o.type === 'asset:' + a.id, pick('asset:' + a.id)));
  if (q) {
    for (const s of STAMPS) if (s.name.toLowerCase().includes(q)) out.push(tile(s.name, sThumb(s.id), ed.tool === 'stamp' && o.type === s.id, pick(s.id)));
    out.push(...mine().filter((t) => (t.title || '').toLowerCase().includes(q)));
    if (!out.length) out.push(h('p', { class: 'hint' }, 'Nessun oggetto trovato.'));
    return out;
  }
  if (u.stampCat === 'I miei') {
    out.push(...mine());
    out.push(h('button', { class: 'lib-tile add', onclick: async () => {
      const files = await pickFile('image/png,image/webp,image/jpeg', true);
      for (const f of files) await assets.add(f, f.name.replace(/\.\w+$/, ''), 'stamp');
      if (files.length) toast(`${files.length} asset importati`);
    } }, icon('upload', 24), h('span', null, 'Importa PNG')));
    return out;
  }
  if (u.stampCat === 'Luci') {
    out.push(tile('Luce invisibile', h('span', { class: 'lib-ico' }, icon('light', 30)), ed.tool === 'light', () => ed.setTool('light')));
  }
  for (const s of STAMPS) {
    if (u.stampCat === 'Luci' ? !s.light : u.stampCat !== 'Tutti' && s.cat !== u.stampCat) continue;
    out.push(tile(s.name, sThumb(s.id), ed.tool === 'stamp' && o.type === s.id, pick(s.id)));
  }
  return out;
}
