import { h, icon } from '../dom';
import type { Editor } from '../editor';
import { iconBtn } from './common';
import { lang, t } from '../i18n';

const BASE = import.meta.env.BASE_URL;
const TEMPLATES = [
  { id: 'dungeon', name: 'Dungeon', desc: t('Rooms, doors, furniture, torches'), img: 'templates/dungeon.jpg' },
  { id: 'cave', name: t('Cave'), desc: t('Tunnels, pools, crystals'), img: 'templates/cave.jpg' },
  { id: 'forest', name: t('Forest'), desc: t('Clearing, trail, camp'), img: 'templates/forest.jpg' },
  { id: 'tavern', name: t('Tavern'), desc: t('Hall, kitchen, street'), img: 'templates/tavern.jpg' },
];
const SIZES: [string, number, number][] = [[t('Small'), 20, 15], [t('Medium'), 30, 22], [t('Large'), 40, 30]];
let size = 1;

function rel(ts: number) {
  const d = Math.floor((Date.now() - ts) / 86400000);
  if (d <= 0) return t('edited today');
  if (d === 1) return t('edited yesterday');
  if (d < 7) return t('{n} days ago', { n: d });
  if (d < 30) return t('{n} weeks ago', { n: Math.floor(d / 7) });
  return new Date(ts).toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US');
}

export async function showHome(ed: Editor) {
  if (ed.rt) await ed.saveNow();
  await ed.refreshMaps();
  const el = ed.el.home;
  el.hidden = false;
  render(ed);
}
export function hideHome(ed: Editor) { ed.el.home.hidden = true; }

function render(ed: Editor) {
  const el = ed.el.home;
  el.innerHTML = '';
  const create = async (template: string, name: string) => {
    const [, c, r] = SIZES[size];
    const n = ed.maps.filter((m) => m.name.startsWith(name)).length;
    hideHome(ed);
    await ed.createMap({ name: n ? `${name} ${n + 1}` : name, cols: c, rows: r, template });
  };
  const q = h('input', { type: 'text', placeholder: t('Search maps'), 'aria-label': t('Search maps') });
  const grid = h('div', { class: 'home-maps' });
  const fill = () => {
    grid.innerHTML = '';
    const term = q.value.trim().toLowerCase();
    const list = ed.maps.filter((m) => !term || m.name.toLowerCase().includes(term));
    if (!list.length) grid.append(h('p', { class: 'hint' }, ed.maps.length ? t('No maps found.') : t('No maps yet: pick a template above.')));
    list.forEach((m, i) => {
      const current = ed.rt?.doc.id === m.id;
      grid.append(h('div', { class: 'home-card' + (current ? ' current' : '') },
        h('button', { class: 'home-thumb', onclick: async () => { hideHome(ed); if (!current) await ed.openMap(m.id); } },
          m.thumb ? h('img', { src: m.thumb, alt: '' }) : icon('map', 40),
          current ? h('span', { class: 'badge' }, t('Open')) : i === 0 ? h('span', { class: 'badge' }, t('Continue')) : ''),
        h('div', { class: 'home-meta' },
          h('div', { class: 'home-meta-text' }, h('strong', null, m.name), h('small', null, `${m.cols}×${m.rows} · ${rel(m.updatedAt)}`)),
          iconBtn('copy', t('Duplicate'), async () => { await import('./menus').then((x) => x.duplicateMap(m.id)); await ed.refreshMaps(); render(ed); }),
          !current ? iconBtn('trash', t('Delete'), async () => { if (!confirm(t('Delete “{name}”?', { name: m.name }))) return; const s = await import('../storage'); await s.deleteMap(m.id); await ed.refreshMaps(); render(ed); }, 'danger') : '')));
    });
  };
  q.addEventListener('input', fill);
  const sizeSeg = h('div', { class: 'seg', role: 'group', 'aria-label': t('Size') }, ...SIZES.map(([n, c, r], i) => h('button', {
    class: i === size ? 'on' : '', onclick: () => { size = i; render(ed); },
  }, `${n} ${c}×${r}`)));
  const empty: HTMLButtonElement = h('button', { class: 'tpl empty', onclick: () => {
    import('../dom').then(({ popover, closePopover }) => popover(empty, h('div', { class: 'pop-body' }, h('div', { class: 'pop-title' }, t('Empty map')),
      h('div', { class: 'pop-list' },
        h('button', { onclick: () => { closePopover(); create('empty-dungeon', 'Dungeon'); } }, t('Dark rock (dungeon)')),
        h('button', { onclick: () => { closePopover(); create('outdoor', t('Outdoor')); } }, t('Grass (outdoor)')),
        h('button', { onclick: () => { closePopover(); create('interior', t('Indoor')); } }, t('Wood (indoor)')))), 'below'));
  } }, h('span', { class: 'tpl-img grid-bg' }, icon('plus', 32)), h('span', { class: 'tpl-text' }, h('strong', null, t('Empty')), h('small', null, t('Rock, grass or wood'))));
  el.append(
    h('header', { class: 'home-top' },
      h('span', { class: 'brand' }, h('span', { class: 'brand-mark' }, icon('swords', 16)), h('span', { class: 'brand-name' }, 'Cartografo')),
      h('div', { class: 'spacer' }),
      h('button', { class: 'chip-btn', onclick: () => import('./menus').then((x) => x.importFile(ed)) }, icon('download', 16), t('Import')),
      h('button', { class: 'chip-btn', onclick: () => import('./menus').then((x) => x.backupAll(ed)) }, icon('upload', 16), 'Backup'),
      ed.rt ? h('button', { class: 'chip-btn', onclick: () => hideHome(ed) }, icon('x', 16), t('Back to map')) : ''),
    h('main', { class: 'home-main' },
      h('section', { class: 'home-sec' },
        h('div', { class: 'home-sec-head' },
          h('div', null, h('h1', null, t('New map')), h('p', null, t('Pick a starting point: a generator gives you a complete map to polish.'))),
          sizeSeg),
        h('div', { class: 'tpl-grid' },
          ...TEMPLATES.map((t) => h('button', { class: 'tpl', onclick: () => create(t.id, t.name) },
            h('img', { class: 'tpl-img', src: BASE + t.img, alt: '' }),
            h('span', { class: 'tpl-text' }, h('strong', null, t.name), h('small', null, t.desc)))),
          empty)),
      h('section', { class: 'home-sec' },
        h('div', { class: 'home-sec-head' }, h('h2', null, t('Your maps')), h('label', { class: 'search' }, icon('search', 16), q)),
        grid)));
  fill();
}
