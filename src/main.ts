import './style.css';
import { preloadTextures } from './textures';
import { loadPhotos } from './photos';
import { nextFrame } from './util';
import { t } from './i18n';

const root = document.getElementById('app')!;
const loader = document.getElementById('loader');
const loaderText = document.getElementById('loader-text');
if (loaderText) loaderText.textContent = t('Preparing brushes and parchment…');

(async () => {
  await nextFrame();
  // photo textures replace painted ones, so they must be in before the first texture is built
  await Promise.race([loadPhotos(), new Promise((r) => setTimeout(r, 4000))]);
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
  if (loader) loader.textContent = t('Startup error: ') + (e?.message || e);
});
