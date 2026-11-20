# Cartografo — D&D battle maps

Painted-style D&D battle map editor that runs in the browser, with a player view for your TV, fog of war and initiative tracking.

> The interface is available in English (default) and Italian — switch language from the ⋯ menu.

## Getting started

```bash
npm install
npm run dev        # then open http://localhost:5173
```

For a static build (deployable to any static host, or served locally with `npm run preview`):

```bash
npm run build      # output in dist/
```

## Features

- **Prepare mode**: five intents — Select, Paint, Build, Furnish, Annotate — with a contextual dock that only shows the active tool's options.
  - Terrain brushes (grass, dirt, flagstone, wood, water, lava…) with natural, irregular edges.
  - Rooms with automatic walls, brush-dug caves, free-standing walls, doors (including secret ones).
  - ~60 hand-drawn top-down props, imported PNG assets, light sources, labels and markers with private notes.
- **Generators**: a dungeon generator with live preview and variants — three styles (rooms and corridors,
  mixed with caves, ruins), presets, room shapes, loops, dead ends, doors, secret doors, traps, themed
  furnishing and shareable seeds — plus cave, forest clearing and tavern generators.
- **Play mode**: synchronized player window (fog of war, doors, tokens, pings, ruler, initiative), with real-scale calibration
  (1 square = 1 inch) for miniatures on a table-mounted TV, plus screen rotation.
- **Combat**: initiative order, HP, AC and 5e conditions. Players only see names and conditions; health stays DM-only.
- **Storage**: autosave in the browser (IndexedDB), PNG export, `.json` export/import and full backups.

## Project structure

| Path | Purpose |
| --- | --- |
| `src/engine.ts` | terrain compositing: paint masks, rough edges, walls and shadows generated from rooms and caves |
| `src/textures.ts` | procedural tileable textures (4 grid squares per tile) |
| `src/stamps.ts` | props drawn in code |
| `src/render.ts` | scene rendering (editor, player view, export) |
| `src/editor.ts` | DM editor: input, tools, history, saving, session sync |
| `src/ui/` | DM interface: top bar, intent rail and dock, object library, inspector, initiative panel, home screen, menus |
| `src/player.ts` | player view |
| `src/dungeon.ts` | dungeon generator (styles, presets, seeds) |
| `src/generate.ts` · `src/genkit.ts` | cave, forest and tavern generators and shared helpers |

## License

Copyright (C) 2026 Danilo Numeroso

Cartografo is free software: you can redistribute it and/or modify it under the terms of the
[GNU General Public License](LICENSE) as published by the Free Software Foundation, either version 3
of the License, or (at your option) any later version. Modified versions you distribute must be
released under the same license.
