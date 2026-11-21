import { CELL, MapDoc, Stamp } from './model';
import { STAMP_BY_ID } from './stamps';
import { t } from './i18n';

/** Battle-map template that suits a place on the world map. */
export function suggestedTemplate(type: string): string {
  if (['w_cave', 'w_mine', 'w_lair'].includes(type)) return 'cave';
  if (['w_ruins', 'w_castle', 'w_tower', 'w_temple', 'w_portal'].includes(type)) return 'dungeon';
  if (['w_capital', 'w_city', 'w_town', 'w_village', 'w_port'].includes(type)) return 'tavern';
  if (['w_snowpeaks', 'w_iceberg'].includes(type)) return 'winter';
  if (['w_forest', 'w_pines', 'w_jungle', 'w_deadwood', 'w_camp', 'w_stones', 'w_swamp'].includes(type)) return 'forest';
  return 'dungeon';
}
export const LINK_TEMPLATES: [string, () => string][] = [
  ['dungeon', () => 'Dungeon'], ['cave', () => t('Cave')], ['forest', () => t('Forest')], ['tavern', () => t('Tavern')],
  ['winter', () => t('Winter forest')], ['outdoor', () => t('Grass (outdoor)')], ['empty-dungeon', () => t('Dark rock (dungeon)')],
];

/** Name of a place: the nearest label just below or on the icon, else the icon's name. */
export function placeName(doc: MapDoc, s: Stamp): string {
  let best = '', bd = Infinity;
  for (const l of doc.labels) {
    const dx = l.x - s.x, dy = l.y - s.y, d = Math.hypot(dx, dy * 1.5);
    if (d < CELL * 1.6 && dy > -CELL * 0.6 && d < bd) { bd = d; best = l.text; }
  }
  return best || STAMP_BY_ID.get(s.type)?.name || t('Map');
}
