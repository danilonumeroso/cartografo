# Cartografo — mappe per D&D

Editor di battle map in stile "dipinto" che gira nel browser, con una vista giocatori da mandare sulla TV.

## Avvio

```bash
npm install
npm run dev        # poi apri http://localhost:5173
```

Per una versione statica (da mettere su qualunque hosting o aprire con `npm run preview`):

```bash
npm run build      # output in dist/
```

## Cosa c'è

- **Editor**: pennelli di terreno (erba, terra, lastricato, legno, acqua, lava…), stanze con muri automatici,
  caverne a pennello, muri liberi, porte (anche segrete), ~60 oggetti visti dall'alto, PNG importati, luci, testi, segnaposti con note.
- **Generatori**: dungeon, caverna, radura nel bosco, taverna.
- **Sessione**: finestra giocatori sincronizzata (nebbia di guerra, porte, pedine, ping, righello, iniziativa),
  calibrazione a 1 casella = 1 pollice per le miniature sulla TV sdraiata, rotazione dello schermo.
- **Combattimento**: iniziativa, PF, CA, condizioni 5e; ai giocatori i mostri mostrano solo lo stato (Ferito, Sanguinante…).
- **Salvataggio** automatico nel browser (IndexedDB), export PNG, export/import `.json` e backup.

## Struttura

| File | Ruolo |
| --- | --- |
| `src/engine.ts` | composizione del terreno: maschere, bordi irregolari, muri e ombre generati da stanze e caverne |
| `src/textures.ts` | texture procedurali ripetibili (4 caselle per tile) |
| `src/stamps.ts` | oggetti disegnati via codice |
| `src/render.ts` | rendering della scena (editor, giocatori, export) |
| `src/editor.ts` · `src/panels.ts` · `src/dialogs.ts` | interfaccia del DM |
| `src/player.ts` | vista giocatori |
| `src/generate.ts` | generatori casuali |

## Licenza

Copyright (C) 2026 Danilo Numeroso

Cartografo è software libero: puoi ridistribuirlo e/o modificarlo secondo i termini della
[GNU General Public License](LICENSE) pubblicata dalla Free Software Foundation, versione 3
o (a tua scelta) qualsiasi versione successiva. Chi distribuisce versioni modificate deve
rilasciarle con la stessa licenza.
