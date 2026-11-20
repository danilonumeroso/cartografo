import { assets } from '../assets';
import { h, icon, pickFile, toast } from '../dom';
import type { Editor } from '../editor';
import { CATEGORIES, categoryName, STAMPS } from '../stamps';
import { TOOL_INTENT } from './chrome';
import { iconBtn, miniSlider, sThumb, toggle } from './common';
import { t } from '../i18n';

const CATS: string[] = ['all', ...CATEGORIES, 'lights', 'mine'];
const catLabel = (c: string) => c === 'all' ? t('All') : c === 'lights' ? t('Lights') : c === 'mine' ? t('My assets') : categoryName(c);

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
    type: 'text', value: u.search, placeholder: t('Search: barrel, torch, tree…'), 'aria-label': t('Search props'),
    oninput: () => { u.search = search.value; fillGrid(); },
  });
  const head = h('div', { class: 'lib-head' },
    h('label', { class: 'search' }, icon('search', 16), search),
    h('div', { class: 'chips' }, ...CATS.map((c) => h('button', {
      class: 'chip' + (c === u.stampCat && !u.search ? ' on' : ''), onclick: () => { u.stampCat = c; u.search = ''; ed.refreshUI(); },
    }, catLabel(c)))),
    h('div', { class: 'lib-opts' },
      ed.tool === 'light'
        ? [miniSlider(t('Radius'), ed.opts.light.radius, 1, 20, 0.5, (v) => { ed.opts.light.radius = v; }, (v) => t('{n} sq.', { n: v }))]
        : [
          miniSlider(t('Scale'), o.scale, 0.2, 4, 0.05, (v) => { o.scale = v; ed.requestRender(); }, (v) => v.toFixed(1) + '×'),
          toggle(t('Random rotation'), o.randomRot, (v) => { o.randomRot = v; }),
          toggle(t('Scatter while dragging'), o.scatter, (v) => { o.scatter = v; ed.refreshUI(); ed.requestRender(); }),
          o.scatter ? miniSlider(t('Spacing'), o.spacing, 0.3, 5, 0.1, (v) => { o.spacing = v; ed.requestRender(); }, (v) => v.toFixed(1)) : null,
        ],
      u.stampCat === 'lights' ? miniSlider(t('Darkness'), ed.rt.doc.ambient, 0, 0.95, 0.05, (v) => { ed.rt.doc.ambient = v; ed.changed('objects'); }, (v) => Math.round(v * 100) + '%') : null,
      iconBtn(u.drawerOpen ? 'chevron' : 'chevronUp', u.drawerOpen ? t('Collapse library') : t('Expand library'), () => { u.drawerOpen = !u.drawerOpen; ed.refreshUI(); })),
  );
  d.append(head);
  if (u.drawerOpen) { fillGrid(); d.append(grid); }
  const sel = o.type.startsWith('asset:') ? assets.recs.get(o.type.slice(6)) : null;
  if (u.drawerOpen && sel && ed.tool === 'stamp') {
    const w = h('input', { type: 'number', value: sel.cells, min: 0.1, max: 50, step: 0.1, class: 'num-sm', onchange: () => { sel.cells = Math.max(0.1, +w.value || 1); assets.update(sel); ed.requestRender(); } });
    d.append(h('div', { class: 'lib-foot' },
      h('span', null, h('b', null, sel.name)),
      h('label', { class: 'mini-slider' }, h('span', { class: 'mini-label' }, t('Width in squares')), w),
      h('button', { class: 'chip-btn danger', onclick: async () => { if (confirm(t('Delete this asset? Props already placed will disappear.'))) { await assets.remove(sel.id); o.type = 'barrel'; } } }, t('Delete asset'))));
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
    if (!out.length) out.push(h('p', { class: 'hint' }, t('No props found.')));
    return out;
  }
  if (u.stampCat === 'mine') {
    out.push(...mine());
    out.push(h('button', { class: 'lib-tile add', onclick: async () => {
      const files = await pickFile('image/png,image/webp,image/jpeg', true);
      for (const f of files) await assets.add(f, f.name.replace(/\.\w+$/, ''), 'stamp');
      if (files.length) toast(t('{n} assets imported', { n: files.length }));
    } }, icon('upload', 24), h('span', null, t('Import PNG'))));
    return out;
  }
  if (u.stampCat === 'lights') {
    out.push(tile(t('Invisible light'), h('span', { class: 'lib-ico' }, icon('light', 30)), ed.tool === 'light', () => ed.setTool('light')));
  }
  for (const s of STAMPS) {
    if (u.stampCat === 'lights' ? !s.light : u.stampCat !== 'all' && s.cat !== u.stampCat) continue;
    out.push(tile(s.name, sThumb(s.id), ed.tool === 'stamp' && o.type === s.id, pick(s.id)));
  }
  return out;
}
