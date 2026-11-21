import { h, icon } from '../dom';
import type { Editor } from '../editor';
import { iconBtn } from './common';
import { showGenerator } from './generator';
import { showWorldGenerator } from './worldgen';
import { showCityGenerator } from './citygen';
import { lang, t } from '../i18n';

const BASE = import.meta.env.BASE_URL;
const TEMPLATES = [
  { id: 'dungeon', name: 'Dungeon', desc: t('Rooms, doors, furniture, torches'), img: 'templates/dungeon.jpg' },
  { id: 'cave', name: t('Cave'), desc: t('Tunnels, pools, crystals'), img: 'templates/cave.jpg' },
  { id: 'forest', name: t('Forest'), desc: t('Clearing, trail, camp'), img: 'templates/forest.jpg' },
  { id: 'tavern', name: t('Tavern'), desc: t('Hall, kitchen, street'), img: 'templates/tavern.jpg' },
  { id: 'winter', name: t('Winter forest'), desc: t('Snowy pines, frozen stream, festive camp'), img: 'templates/winter.jpg' },
];
const BIG = [
  { id: 'world', name: t('World'), desc: t('Continents, kingdoms, rivers, roads'), img: 'templates/world.jpg' },
  { id: 'city', name: t('City'), desc: t('Streets, roofs, walls, taverns'), img: 'templates/city.jpg' },
];
const KIND_TAG: Record<string, () => string> = { world: () => t('World'), city: () => t('City') };
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
      const parent = m.parent ? ed.maps.find((x) => x.id === m.parent) : null;
      grid.append(h('div', { class: 'home-card' + (current ? ' current' : '') },
        h('button', { class: 'home-thumb', onclick: async () => { hideHome(ed); if (!current) await ed.openMap(m.id); } },
          m.thumb ? h('img', { src: m.thumb, alt: '' }) : icon('map', 40),
          current ? h('span', { class: 'badge' }, t('Open')) : i === 0 ? h('span', { class: 'badge' }, t('Continue')) : '',
          KIND_TAG[m.kind] ? h('span', { class: 'kind-tag ' + m.kind }, icon(m.kind === 'world' ? 'map' : 'roomRect', 12), KIND_TAG[m.kind]()) : ''),
        h('div', { class: 'home-meta' },
          h('div', { class: 'home-meta-text' }, h('strong', null, m.name),
            parent ? h('small', { class: 'home-parent' }, icon('arrowLeft', 11), t('inside {name}', { name: parent.name })) : '',
            h('small', null, `${m.cols}×${m.rows} · ${rel(m.updatedAt)}`)),
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
  const card = (tp: { id: string; name: string; desc: string; img: string }) => h('button', {
    class: 'tpl', onclick: () => (tp.id === 'dungeon' ? showGenerator(ed, 'new', size) : tp.id === 'world' ? showWorldGenerator(ed, 'new', size) : tp.id === 'city' ? showCityGenerator(ed, 'new', size) : create(tp.id, tp.name)),
  }, h('img', { class: 'tpl-img', src: BASE + tp.img, alt: '' }), h('span', { class: 'tpl-text' }, h('strong', null, tp.name), h('small', null, tp.desc)));
  const fresh = h('section', { class: 'home-sec' },
    h('div', { class: 'home-sec-head' },
      h('div', null, h(ed.maps.length ? 'h2' : 'h1', null, t('New map')), h('p', null, t('Pick a starting point: a generator gives you a complete map to polish.'))),
      sizeSeg),
    h('h3', { class: 'tpl-group' }, t('Battle maps'), h('small', null, t('One square is 5 feet: rooms, caves, clearings'))),
    h('div', { class: 'tpl-grid' }, ...TEMPLATES.map(card), empty),
    h('h3', { class: 'tpl-group' }, t('Worlds and cities'), h('small', null, t('The big picture: link places and buildings to their battle maps'))),
    h('div', { class: 'tpl-grid big' }, ...BIG.map(card)));
  // returning users see their maps first; the very first visit starts from the templates
  const mine = h('section', { class: 'home-sec' },
    h('div', { class: 'home-sec-head' }, h(ed.maps.length ? 'h1' : 'h2', null, t('Your maps')), h('label', { class: 'search' }, icon('search', 16), q)),
    grid);
  el.append(
    h('header', { class: 'home-top' },
      h('span', { class: 'brand' }, h('span', { class: 'brand-mark' }, icon('swords', 16)), h('span', { class: 'brand-name' }, 'Cartografo')),
      h('div', { class: 'spacer' }),
      h('button', { class: 'chip-btn', onclick: () => import('./menus').then((x) => x.importFile(ed)) }, icon('download', 16), t('Import')),
      h('button', { class: 'chip-btn', onclick: () => import('./menus').then((x) => x.backupAll(ed)) }, icon('upload', 16), 'Backup'),
      ed.rt ? h('button', { class: 'chip-btn', onclick: () => hideHome(ed) }, icon('x', 16), t('Back to map')) : ''),
    h('main', { class: 'home-main' }, ...(ed.maps.length ? [mine, fresh] : [fresh, mine])));
  fill();
}
