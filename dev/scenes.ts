// Showcase scenes used to eyeball the art in context (dev only).
// Room: [x, y, w, h, floor]; stamp: [type, x, y, rot?, scale?] in grid squares.
type Scene = {
  cols: number; rows: number; bg: string; wall?: string; ambient?: number; weather?: string; rooms: [number, number, number, number, string][]; stamps: [string, number, number, number?, number?][];
  /** Door: [x, y, vertical, kind, open, width] in grid squares. */
  doors?: [number, number, boolean, string, boolean, number?][];
};

export const SCENES: Record<string, Scene> = {
  tavern: {
    cols: 24, rows: 16, bg: 'cobble', wall: 'wood', ambient: 0.35,
    rooms: [[2, 2, 12, 9, 'parquet'], [14, 2, 7, 6, 'flagstone'], [14, 8, 7, 3, 'stonetiles'], [3, 11, 7, 4, 'straw']],
    stamps: [
      ['bar_counter', 4, 3.5], ['keg_rack', 3.2, 2.6, 0, 0.8], ['wine_rack', 7.5, 2.4], ['xmas_tree', 12.6, 3.4], ['presents', 11.6, 4.6],
      ['feast_table', 8, 8.2], ['dining_set', 11.6, 7], ['card_table', 4, 8.6], ['tankards', 8.2, 6.9], ['rug_round', 4, 8.6],
      ['xmas_fireplace', 8, 10.4, Math.PI], ['chandelier', 8, 6.2], ['garland', 8, 2.3],
      ['stove', 15.5, 2.7], ['kitchen_table', 17.5, 5], ['cooking_pots', 19.6, 3], ['crate_apples', 15, 7.2], ['crate_veg', 15.9, 7.2],
      ['pantry_shelf', 19, 2.4], ['hanging_meat', 17.5, 4], ['chopping_block', 20, 6.5], ['grain_sack', 19.8, 7.2], ['washtub', 15.4, 5.2],
      ['wardrobe', 15.5, 8.5], ['bed_canopy', 19, 9.5, Math.PI / 2], ['vanity', 15.5, 10.4, Math.PI], ['potted_plant', 20.3, 8.4],
      ['hay_bales', 4.2, 12.5], ['trough', 6.5, 14.3], ['scattered_straw', 7.8, 12.5], ['saddle', 8.8, 13.8], ['wheelbarrow', 9.2, 12],
      ['lamppost', 1.2, 1.2], ['market_stall', 22.5, 13.5], ['barrel_planter', 13, 13], ['town_fountain', 17.5, 13.3], ['snowman', 11.5, 14.4],
    ],
  },
  arcane: {
    cols: 24, rows: 16, bg: 'rock', wall: 'dark', ambient: 0.6,
    rooms: [[2, 2, 9, 8, 'runes'], [11, 2, 11, 8, 'marbledark'], [2, 10, 20, 5, 'crystal']],
    stamps: [
      ['magic_circle', 6.5, 6], ['alchemy_table', 4, 2.8], ['potion_shelf', 8.5, 2.4], ['crystal_ball', 9.8, 4], ['arcane_pylon', 3, 8.8], ['arcane_pylon', 10, 8.8],
      ['spellbook_lectern', 6.5, 3.6], ['floating_candles', 6.5, 6], ['book_piles', 2.8, 5],
      ['portal', 16.5, 5.8], ['blue_brazier', 13, 3.2], ['green_brazier', 20, 3.2], ['statue_dragon', 16.5, 3], ['summoning_circle', 13.3, 8.2, 0, 0.6],
      ['orrery', 20.4, 8.4], ['arcane_bookcase', 16.5, 2.4], ['witch_cauldron', 12.5, 6],
      ['crystals_blue', 4, 12.4], ['crystals_red', 9, 13], ['crystals_green', 14, 12], ['geode', 18, 13.5], ['moon_pool', 20, 12], ['floating_crystal', 11.5, 11.5], ['glowworms', 7, 12.5],
    ],
  },
  outdoor: {
    cols: 26, rows: 18, bg: 'grass', wall: 'palisade', ambient: 0.05,
    rooms: [[3, 3, 6, 5, 'wood']],
    stamps: [
      ['cottage_roof', 6, 5.5], ['well_roofed', 11, 4], ['chicken_coop', 2, 9.5], ['haystack', 12.5, 9], ['scarecrow', 16, 9], ['wheat', 16, 11.5], ['wheat', 18, 11.5], ['pumpkins', 13.5, 12.5],
      ['oak_giant', 21.5, 4], ['cherry_tree', 2, 14], ['fruit_tree', 5, 15.5], ['willow', 9.5, 15.5], ['birch', 24.5, 9.5], ['pine', 24, 14], ['dead_tree', 19, 16],
      ['lily_pads', 9.5, 13], ['reeds', 11.3, 12.6], ['river_stones', 12, 14.2], ['fairy_ring', 22, 15], ['stone_circle', 17, 4.5],
      ['flower_bush', 8.6, 8.2], ['rose_bush', 4, 8.6], ['hedge', 6, 9.3], ['wildflowers', 13.8, 6.3], ['sunflowers', 9.5, 9.5], ['fern', 23.8, 6.2],
      ['covered_wagon', 14.5, 2.4, Math.PI / 2], ['campfire', 18.5, 8], ['yurt', 22.5, 11], ['beehive', 1.2, 6], ['butterflies', 11.5, 10.8], ['mossy_log', 19.6, 13.5, 0.4],
    ],
  },
  doors: {
    cols: 18, rows: 8, bg: 'rock', wall: 'stone', ambient: 0,
    rooms: [[1, 1, 16, 3, 'flagstone'], [1, 4, 16, 3, 'wood']],
    stamps: [],
    doors: [
      [2.5, 4, false, 'wood', false], [4.5, 4, false, 'wood', true], [7, 4, false, 'double', false, 2], [10, 4, false, 'double', true, 2],
      [12.5, 4, false, 'iron', false], [14.5, 4, false, 'bars', false], [16, 4, false, 'bars', true],
      [2.5, 1, false, 'stone', false], [4.5, 1, false, 'stone', true], [7, 1, false, 'curtain', false, 2], [10, 1, false, 'curtain', true, 2], [12.5, 1, false, 'arch', false], [14.5, 1, false, 'secret', false],
    ],
  },
};
SCENES.rainy = { ...SCENES.tavern, weather: 'rain' };
SCENES.embers = { ...SCENES.arcane, weather: 'embers' };
SCENES.autumn = { ...SCENES.outdoor, weather: 'leaves' };
