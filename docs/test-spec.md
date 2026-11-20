# Cartografo — expected behavior (test specification)

This document describes **what the app must do**, from a user's point of view. It is the reference
for the automated test suite. It deliberately says little about how the code is organized: read the
source only to find entry points and APIs, and derive expectations from this document, not from the
current implementation. If the app disagrees with this document, that is a bug to report.

## The product

Cartografo is a browser-only battle map editor for tabletop RPGs (D&D). No backend: everything is
stored in the browser (IndexedDB). It has two windows:

- **Editor** (`/`): used by the Dungeon Master (DM).
- **Player view** (`/?player=1`): a second window shown on a TV. It talks to the editor through a
  `BroadcastChannel`, so both pages must run in the same browser profile/origin.

The UI is bilingual: **English by default**, Italian selectable from the "⋯" (More actions) menu.

Run locally with `npm run dev` (Vite). For debugging, the editor page exposes `window.editor`.
Tests may use it to **read state** or to set up complex fixtures, but should drive the behaviors
under test through the UI wherever practical (clicks, drags, keyboard).

## Core concepts

- A **map** is a grid of squares (default 5 ft per square), between 10 and 80 squares per side (smaller sizes are clamped to 10).
- Content: terrain paint, **rooms** (polygons that get walls automatically), **caves** (painted
  areas with natural rock walls), free **walls**, **doors** (wood, double, portcullis, secret,
  archway; open or closed), **props** (top-down objects, some emit light), **lights**, **labels**,
  **markers** (pins with private DM notes, optional text for players, optional link to another map),
  **tokens** (creatures with size, kind, HP, AC, initiative modifier, conditions, hidden flag).
- Token kinds: player character, ally, NPC, monster. Sizes: tiny, small, medium, large (2×2),
  huge (3×3), gargantuan (4×4).
- **Fog of war**: a per-map mask the DM reveals or covers. When enabled, players only see revealed
  areas.

## Behaviors

### 1. First run and Home screen
1. With empty storage, the app opens on the **Home** screen: a "New map" section with templates
   (Dungeon, Cave, Forest, Tavern, Empty) and size presets (Small 20×15, Medium 30×22, Large 40×30),
   plus a "Your maps" section that says there are no maps yet.
2. Choosing a template creates a map of the selected size, closes Home and opens the editor with a
   non-blank map rendered on the canvas. The new map appears in "Your maps" afterwards.
3. The four generator templates produce populated maps (rooms/caves/props as appropriate). "Empty"
   offers dark rock, grass or wood backgrounds.
4. "Your maps" can search by name, duplicate a map (the copy gets a "(copy)" suffix) and delete a
   map other than the one currently open. Clicking a card opens that map.
5. On later launches the app reopens the most recently used map.

### 2. Prepare mode (editing)
1. A rail offers five actions: Select, Paint, Build, Furnish, Annotate. Picking one shows a
   contextual bottom bar with only that action's tools/options.
2. **Build → Room**: dragging on the grid creates a rectangular room snapped to whole squares;
   drags smaller than one square create nothing. Rooms render with floor and walls.
3. **Build → Freeform**: clicking points and closing (double-click or Enter) creates a polygonal room.
4. **Build → Cave**: dragging digs a cave area; "Fill" removes it.
5. **Build → Wall / Door**: clicking adds wall points (Enter/double-click finishes); clicking near a
   grid edge places a door aligned to that edge; clicking an existing door toggles open/closed.
6. **Paint**: dragging paints the selected terrain texture; "Erase" removes that texture.
7. **Furnish**: a prop library with search (matches prop names in the active language) and
   categories (All, Furniture, Dungeon, Caves, Outdoor, Decorations, Lights, My assets). Clicking a
   tile then the map places that prop. "Lights" includes an "Invisible light" tool.
8. **Annotate**: Text, Marker, Token, Ruler. New tokens of kind *monster* start hidden from players
   when placed in Play mode. Placing a token does not select it, so several tokens can be placed in a row.
9. **Selection**: clicking an object selects it and shows a contextual card/toolbar next to it.
   From there the object can be edited, duplicated or deleted. Delete/Backspace deletes the
   selection, Escape deselects, Ctrl/Cmd+D duplicates, arrow keys nudge (tokens move by one square).
   Dropped tokens snap to the grid according to their size.
10. **Undo/redo**: every edit (objects and paint) can be undone (Ctrl/Cmd+Z) and redone
    (Shift+Ctrl/Cmd+Z, Ctrl+Y). Rapid consecutive edits of the same property on the same object
    (e.g. dragging a slider) collapse into a single undo step. History is per map and cleared when
    switching maps.
11. **Autosave**: changes are saved automatically (status shows "Saving…" then "Saved");
    reloading the page restores the same map with the same content, including terrain paint and fog.
12. **Map settings** (⋯ menu): rename, resize (content keeps its position relative to the top-left
    corner), base terrain, room wall style, grid options, ambient darkness, fog on/off, regenerate,
    delete map. **Deleting the open map must not resurrect it** through a pending autosave.

### 3. Play mode (session)
1. Switching to Play shows an initiative panel on the left and a play bar at the bottom
   (Move, Reveal, Cover, Reveal room, Ping, Ruler, Token).
2. **Initiative**: tokens can be added to combat; "Start combat" begins round 1 with the highest
   initiative first; "Next turn" advances and wraps to the top while incrementing the round;
   "previous turn" goes back; "End combat" stops it. The order is sorted by initiative (ties broken
   by modifier, then name). "Roll" rolls 1d20 + modifier for NPCs and monsters, and for player characters or allies only
   when they have no initiative yet (existing player-side scores are kept); a message reports how
   many creatures were rolled. Removing a token from combat keeps the turn consistent.
3. **Token card**: Damage/Heal apply the amount; HP never exceeds max HP. Conditions can be added and
   removed. Visibility can be toggled.
4. **Fog**: Reveal/Cover paint the fog mask; "Reveal room" reveals a whole room when clicking inside
   it; "Cover all"/"Reveal all" act on the whole map. Using Reveal/Cover turns fog on if it was off.
5. **Doors**: clicking a door in Play toggles it.
6. **Ping**: clicking with the Ping tool (or Alt+click with Move) shows a ping to the players.

### 4. Player view (TV)
1. Opened alone, it shows a "Waiting for the Dungeon Master…" screen.
2. With an editor open in the same browser, it loads and shows the DM's current map; the editor's top
   bar then shows **"TV connected"** (with "Send view" and, in Play mode, "Follow my view").
   Closing the player window turns the indicator back off.
3. The player view **never shows**: hidden tokens, hidden props/labels, hidden markers, secret doors
   that are closed, DM notes, and **any health information** (no HP bars, no HP numbers, no health
   status words such as "Bloodied"). The one deliberate exception: a creature at 0 HP is shown as
   *down* (darkened token with a cross, struck-through name in the initiative bar). It **does show** token names and conditions, including in the
   initiative bar at the top during combat ("Round N" and the visible combatants in order).
4. With fog enabled, unrevealed areas are fully covered for players (the DM sees fog semi-transparent).
   By design, player-character tokens stay visible above the fog so players always see where they are;
   every other creature in a covered area is hidden.
5. Changes made by the DM in Play mode (token moves, door toggles, fog painting, combat turn, pings)
   reach the player view without reloading it.
6. A settings panel (gear icon) offers rotation (0/90/180/270°) and real-scale calibration
   (1 square = 1 inch), persisted per browser.

### 5. Language
1. Default language is English. The "⋯" menu has a "Language" entry that switches to Italian (and
   back); the choice persists across reloads and the player window follows the switch.
2. Every string used through the translation function has an Italian translation, except strings that
   are identical in both languages (e.g. "Dungeon", "zoom").
3. Content generated while a language is active (e.g. "Room 1", "Entrance") is stored in the map and
   does not change when the language changes later.

### 6. Import / export
1. "Export this map (.json)" and "Back up all maps" download a JSON file; importing it restores the
   maps with the same content. Importing a map whose id already exists creates a new map (new id)
   and marker links between imported maps still point to the right maps.
2. "Export PNG image" downloads a PNG of the whole map at 100 px per square (or 200 px per square),
   without fog, markers or anything hidden from players.

### 7. Generators
1. Each generator (dungeon, cave, forest, tavern) produces content entirely inside the map bounds,
   down to the minimum 10×10 map.
2. Dungeon: several rooms that are all reachable from each other (rooms and corridors form one
   connected area), doors placed on room boundaries, numbered room labels hidden from players, fog
   enabled. Cave: one connected cave area. Tavern: a building with interior walls and doors.
3. Regenerating replaces the previous content, tokens included (no leftover objects from the previous
   generation). Regenerating is not allowed while combat is active: the DM is asked to end combat first.

## Out of scope
- Pixel-perfect visual comparisons of the painted terrain.
- Performance benchmarks.
