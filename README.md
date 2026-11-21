# Cartografo — D&D battle maps

Painted-style D&D battle map editor that runs in the browser, with a player view for your TV, fog of war and initiative tracking.

> The interface is available in English and Italian: it starts in your browser's language, and you can switch from the ⋯ menu.

## Getting started

```bash
npm install
npm run dev        # then open http://localhost:5173
```

For a static build (deployable to any static host, or served locally with `npm run preview`):

```bash
npm run build      # output in dist/
```

The build uses relative paths, so it also works from a sub-folder. Every push to `main` publishes it on
GitHub Pages through `.github/workflows/pages.yml` (enable it once under Settings → Pages → Source: GitHub Actions).
Maps are saved in the browser, per site: use Backup and Import on the home screen to move them between sites.

## Features

- **Prepare mode**: five intents — Select, Paint, Build, Furnish, Annotate — with a contextual dock that only shows the active tool's options.
  - 51 terrain and floor textures (grass, flagstone, herringbone parquet, marble, mosaic, runic stone, obsidian, ice, astral void…)
    and liquids (water, swamp, lava, acid, poison, blood, tar) painted with natural, irregular edges.
  - Rooms with automatic walls in 13 materials (stone, brick, marble, palisade, hedge, ice, bone, crystal…), brush-dug caves,
    free-standing walls and 8 door types (including secret doors, curtains and cell doors).
  - About 450 hand-drawn top-down props in 15 themed sets — furniture, kitchen and tavern, workshop and forge, magic and alchemy,
    temple and graveyard, dungeon, caves, nature, town and farm, camp and war, docks and ships, treasure, Christmas and winter,
    fey wonders, clutter — each with four random variants, many casting light. Plus imported PNG assets, light sources, labels and
    markers with private notes. The library has search (names, synonyms, categories) and a list of recently used props.
- **Generators**: a dungeon generator with live preview and variants — three styles (rooms and corridors,
  mixed with caves, ruins), presets, room shapes, loops, dead ends, doors, secret doors, traps, themed
  furnishing and shareable seeds — plus cave, forest clearing, winter forest and tavern generators.
- **Play mode**: synchronized player window (fog of war, doors, tokens, pings, ruler, initiative), with real-scale calibration
  (1 square = 1 inch) for miniatures on a table-mounted TV, plus screen rotation.
- **Combat**: initiative order, HP, AC and 5e conditions. Players only see names and conditions; health stays DM-only.
- **Storage**: autosave in the browser (IndexedDB), PNG export, `.json` export/import and full backups.

## Project structure

| Path | Purpose |
| --- | --- |
| `src/engine.ts` | terrain compositing: paint masks, rough edges, walls and shadows generated from rooms and caves |
| `src/textures.ts` | procedural tileable textures (4 grid squares per tile) |
| `src/stamps.ts` · `src/art.ts` · `src/packs/` | props drawn in code: registry and cache, shared painting kit, one file per themed set |
| `src/render.ts` | scene rendering (editor, player view, export) |
| `src/editor.ts` | DM editor: input, tools, history, saving, session sync |
| `src/ui/` | DM interface: top bar, intent rail and dock, object library, inspector, initiative panel, home screen, menus |
| `src/player.ts` | player view |
| `src/dungeon.ts` | dungeon generator (styles, presets, seeds) |
| `src/generate.ts` · `src/genkit.ts` | cave, forest and tavern generators and shared helpers |

## Developing art

`npm run dev`, then open `/dev/gallery.html` to see every prop (`?cat=nature`, `?variants`, `?z=1` for zoom) or every texture and
wall (`?tex`). Props are drawn top-down with light from the upper left; `src/art.ts` has the shared helpers (shading, wood grain,
foliage, boulders, gems, flames…). Stamp ids are saved in maps, so never rename one.

## Tests

```bash
npm test           # unit tests (Vitest)
npm run test:e2e   # end-to-end tests (Playwright, starts its own dev server on port 5199)
```

## License

Copyright (C) 2026 Danilo Numeroso

Cartografo is free software: you can redistribute it and/or modify it under the terms of the
[GNU General Public License](LICENSE) as published by the Free Software Foundation, either version 3
of the License, or (at your option) any later version. Modified versions you distribute must be
released under the same license.
