import './style.css';
import { preloadTextures } from './textures';
import { nextFrame } from './util';

const root = document.getElementById('app')!;
const loader = document.getElementById('loader');

(async () => {
  await nextFrame();
  preloadTextures();
  if (new URLSearchParams(location.search).has('player')) {
    const { Player } = await import('./player');
    await new Player(root).init();
  } else {
    const { Editor } = await import('./editor');
    const ed = new Editor(root);
    (window as any).editor = ed;
    await ed.init();
  }
  loader?.remove();
})().catch((e) => {
  console.error(e);
  if (loader) loader.textContent = 'Errore di avvio: ' + (e?.message || e);
});
