# Cartografo test report

## Run the suites

From the repository root, use Node 20 or later and a free TCP port 5199.

```sh
npm ci
npx playwright install chromium
npm test
npm run test:e2e
```

If the Chromium download is unavailable, the configuration uses installed Google Chrome. Playwright starts Vite on 127.0.0.1:5199, opens a fresh browser context for each case and shares that context between the DM and TV pages. No account or existing map collection is needed. Use `npm run test:e2e -- --list` to inspect discovery and `npm run test:e2e -- -g "in-flight"` to select a case.

## Execution

| Command | Result |
| --- | --- |
| `npm test` | 10 passed across 3 files. |
| `npm run test:e2e` | 40 passed (Chromium, about 1 minute). |

The suite was written by an independent agent from [the behavior specification](test-spec.md). Its first
real browser run (outside the agent's sandbox) found 4 unexpected failures: 2 were test mistakes
(comparing `undefined` fields that JSON serialisation drops) and 2 were new app bugs, listed below.
All bugs have since been fixed and their expected-failure marks removed, so every test now asserts
the specified behavior.

## Coverage

Section numbers refer to [the behavior specification](test-spec.md). Browser entries below describe implemented tests. Their execution status is recorded above.

| Spec item | Test names |
| --- | --- |
| 1.1 First launch, templates, presets, empty library | Home lists templates, size presets and empty backgrounds |
| 1.2 Size, editor canvas, saved card | Home lists templates, size presets and empty backgrounds · Dungeon creates populated, bounded terrain · map cards search, duplicate, open, clear history and delete |
| 1.3 Populated generators and empty backgrounds | Dungeon / Cave / Forest / Tavern creates populated, bounded terrain (four cases) · Home lists templates, size presets and empty backgrounds |
| 1.4 Library search, duplication, deletion and opening | map cards search, duplicate, open, clear history and delete |
| 1.5 Reopen last map | map cards search, duplicate, open, clear history and delete (reloads after explicitly opening the copy) |
| 2.1 Rail and contextual tools | room drag snaps, selection edits, duplicates, deletes and traverses history · furnish filters tiles and places the selected prop · freeform, cave fill and wall tools change map geometry |
| 2.2 Rectangular room, floor, walls, short drags | room drag snaps, selection edits, duplicates, deletes and traverses history · sub-square room drag crossing snap midpoints creates nothing · a new room paints its floor and boundary on the map |
| 2.3 Polygon room | freeform, cave fill and wall tools change map geometry |
| 2.4 Cave dig and fill | freeform, cave fill and wall tools change map geometry |
| 2.5 Wall path, door alignment and toggling | freeform, cave fill and wall tools change map geometry · doors align with a grid edge and toggle in Prepare and Play |
| 2.6 Terrain paint and erase | paint and room edits autosave and survive reload |
| 2.7 Furnish categories, search, light tool, placement | furnish filters tiles and places the selected prop · language follows the DM, persists and keeps generated names |
| 2.8 Annotate tools and default monster visibility | furnish filters tiles and places the selected prop · placed monsters start hidden, snap to the grid and nudge one square |
| 2.9 Selection and card actions, keyboard, size and grid | room drag snaps, selection edits, duplicates, deletes and traverses history · placed monsters start hidden, snap to the grid and nudge one square · dropping a large token aligns its two-square footprint |
| 2.10 Object and paint history, coalescing and map isolation | merges rapid edits of the same property and restores both endpoints · keeps different targets separate and clears redo after a branching edit · room drag snaps, selection edits, duplicates, deletes and traverses history · paint and room edits autosave and survive reload · map cards search, duplicate, open, clear history and delete |
| 2.11 Saving status, content, terrain and fog after reload | paint and room edits autosave and survive reload · idle foreground fog edits autosave and survive reload |
| 2.12 Settings, regeneration and open-map deletion | map settings resize from top left and apply terrain, walls, grid, darkness and fog · regeneration clears the previous encounter · deleting the open map survives pending autosave and reload · a slow in-flight autosave cannot put a deleted map back in IndexedDB · a discarded map cannot commit an already pending save |
| 3.1 Initiative panel and Play tools | combat starts in order, wraps, reverses and removes the current combatant |
| 3.2 Add, order, roll, start, advance, wrap, reverse, remove, end | combat starts in order, wraps, reverses and removes the current combatant · sorts initiative by score, modifier, then name · rolls a d20 plus modifier for NPCs and monsters and preserves PC scores · preserves ally initiative on an NPC and monster roll · Roll changes only NPC and monster scores |
| 3.3 Token HP, healing cap, conditions and visibility | distinguishes injured and healthy tokens for the DM · token card damages, caps healing, toggles visibility and manages conditions |
| 3.4 Enable fog, paint mask, reveal room and whole-map actions | room and brush fog reveal, cover and whole-map actions · idle foreground fog edits autosave and survive reload |
| 3.5 Play doors | doors align with a grid edge and toggle in Prepare and Play |
| 3.6 Ping | token moves, door toggles, fog and pings reach the live TV canvas |
| 4.1 Standalone waiting screen | TV waits alone and persists orientation and real-scale calibration |
| 4.2 Map loading, TV controls, connection and disconnect | TV shows visible turns and conditions live and disconnects on close · token moves, door toggles, fog and pings reach the live TV canvas |
| 4.3 Hidden content, closed secret doors, notes, HP, names, conditions, visible turn order | player canvas privacy for hidden objects · player canvas privacy for positive HP · player canvas privacy for zero HP · changing HP alone never changes player-facing combatant styling · marker popups expose player notes and keep DM notes private · TV shows visible turns and conditions live and disconnects on close |
| 4.4 Player fog opacity | player canvas privacy for opaque fog · room and brush fog reveal, cover and whole-map actions |
| 4.5 Live moves, doors, turns, fog and pings | token moves, door toggles, fog and pings reach the live TV canvas · TV shows visible turns and conditions live and disconnects on close |
| 4.6 Rotation and calibration | TV waits alone and persists orientation and real-scale calibration |
| 5.1 English, Italian, persistence, TV propagation and switch back | defaults to English and substitutes parameters in Italian · language follows the DM, persists and keeps generated names |
| 5.2 Italian dictionary coverage | covers all translation calls and preserves every placeholder (TypeScript syntax-tree walk, including conditional keys and identical-language exceptions) |
| 5.3 Stored generated text | language follows the DM, persists and keeps generated names |
| 6.1 JSON export, backup, import, ID collisions and links | single map JSON restores map content with a new ID · backup import remaps links to the imported destination · restores legacy map content with usable grid and combat defaults |
| 6.2 Whole-map PNG, both scales and player-safe export | PNG exports the whole map at 100 pixels per square · PNG exports the whole map at 200 pixels per square · PNG omits fog, markers, hidden tokens and hidden furnishings |
| 7.1 Generator bounds | Dungeon / Cave / Forest / Tavern creates populated, bounded terrain · Tavern remains inside the minimum supported map |
| 7.2 Dungeon connectivity, door boundaries, secret numbering, fog, connected cave, tavern interior | Dungeon creates populated, bounded terrain · Cave creates populated, bounded terrain · Tavern creates populated, bounded terrain |
| 7.3 Regeneration replaces content | regeneration clears the previous encounter |

## Bugs found and fixed

| Spec | Bug | Fix | Regression test |
| --- | --- | --- | --- |
| 3.4 / 4.4 | Turning fog on (Reveal/Cover or Map settings) on a map that started without fog was neither saved nor sent to the TV: the snapshot used for undo ignored `fogEnabled`, so the edit looked like "no change". | `fogEnabled` is part of the undoable snapshot. | token moves, door toggles, fog and pings reach the live TV canvas |
| 2.12 | In Map settings, list pickers (e.g. Room walls) opened behind the dialog and could not be clicked. | Popovers render above dialogs. | map settings resize from top left and apply terrain, walls, grid, darkness and fog |
| 2.11 | Dirty fog restarted the autosave timer every frame, so fog edits were never autosaved in the foreground. | Fog edits bump a version counter; autosave restarts only on new edits. | idle foreground fog edits autosave and survive reload |
| 2.12 | A save already encoding its thumbnail wrote a just-deleted map back to storage. | In-flight saves skip writing when their map was discarded or replaced. | a slow in-flight autosave cannot put a deleted map back in IndexedDB · a discarded map cannot commit an already pending save |
| 2.2 | A tiny drag crossing two snap midpoints created a 1×1 room. | A room needs a real drag of at least half a square on both axes. | sub-square room drag crossing snap midpoints creates nothing |
| 3.2 | Roll re-rolled allies. | Roll covers NPCs and monsters, plus player-side tokens without initiative, and reports the count. | Roll changes only NPC and monster scores · preserves ally initiative on an NPC and monster roll |
| 7.3 | Regenerating kept old tokens and an active combat. | Regenerating is blocked during combat and clears tokens otherwise. | regeneration is blocked during combat and clears the previous encounter |
| 7.1 | Forest and Tavern placed props across the map edge; a tiny Tavern was built outside the map. | Generated props and labels are kept inside the map; maps are at least 10×10 and the Tavern adapts to small maps. | Forest / Tavern creates populated, bounded terrain · maps cannot be smaller than 10×10 and Tavern fits the minimum size |

Decided behaviors (not bugs): a creature at 0 HP is shown as *down* on the TV, and player-character
tokens stay visible above fog. The specification documents both.

The template cases freeze the browser date at `2026-01-01T00:00:00.042Z` for a repeatable seed. Dungeon connectivity uses four-neighbour reachability over the union of room and corridor polygons. Cave connectivity uses the painted mask at half-square resolution. Bounds checks cover object centers, polygon and wall vertices, and transformed nontransparent prop pixels.

## Limits

- The suite exercises Enter to finish geometry and the Ping button. Double-click completion, Alt+click ping, every keyboard alias and every token size are alternative paths without dedicated cases. The selection tests check the card and its actions, without measuring the card's distance from each object.
- The generator tests cover a deterministic seed, representative sizes and a minimum-size Tavern. They cannot establish bounds or connectivity across all seeds and dimensions. They do not measure glyph overhang or shadows of labels and doors.
- TV tests verify calibration values and rotation persistence. Measuring one physical inch requires a calibrated display. The fog privacy test compares the player frame with and without a PC under full cover. Exact DM fog translucency is unmeasured.
- JSON tests compare document content and remapped links. Custom asset binaries and every possible painted layer in a backup have no dedicated round-trip case. Terrain and fog persistence are exercised separately.
