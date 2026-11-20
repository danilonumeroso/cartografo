import { expect, test } from 'playwright/test';
import { empty } from './helpers';

// Render pairs from identical fixtures with the real Canvas 2D scene entry point.
// Compare frames to each other on this browser, independent of fonts and textures.
// §4.3/§4.4: a creature at 0 HP may be shown as down, and player characters stay visible above fog by design.
for (const scenario of ['hidden objects', 'positive HP', 'opaque fog', 'PC above fog'] as const) {
  test('player canvas privacy for ' + scenario, async ({ page }) => {
    await empty(page);
    const result = await page.evaluate(async scenario => {
      const renderPath = '/src/render.ts', modelPath = '/src/model.ts', runtimePath = '/src/runtime.ts';
      const { renderScene } = await import(renderPath);
      const { newToken, newDoc } = await import(modelPath);
      const { MapRuntime } = await import(runtimePath);
      const rt = new MapRuntime(newDoc('Privacy fixture', 5, 5));
      rt.engine.flush();
      const d = rt.doc;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 500;
      const ctx = canvas.getContext('2d')!;
      function frame(player = true) {
        renderScene(ctx, rt, { x: 0, y: 0, z: 1 }, 500, 500, 1,
          { player, fogAlpha: player ? 1 : 0.5, markers: true, grid: true, tokens: true, ambientScale: 1, time: 0, background: null });
        return canvas.toDataURL();
      }
      const token = scenario === 'opaque fog' ? { ...newToken(250, 250, 'monster', 'Ogre'), hidden: false } : newToken(250, 250, 'pc', 'Scout');
      const fogged = scenario === 'opaque fog' || scenario === 'PC above fog';
      if (fogged) d.fogEnabled = true;
      const bare = frame();
      if (scenario === 'hidden objects') {
        d.tokens.push({ ...token, hidden: true });
        d.stamps.push({ id: 'cask', type: 'barrel', x: 150, y: 150, rot: 0, scale: 1, variant: 0, hidden: true });
        d.labels.push({ id: 'label', text: 'SECRET', x: 160, y: 250, rot: 0, font: 'serif', size: 30, color: '#fff', stroke: '#000', hidden: true });
        d.markers.push({ id: 'pin', x: 300, y: 150, visible: false, notes: 'Private', playerNotes: '', title: 'Key', icon: '📍', color: '#fff' });
        d.doors.push({ id: 'secret', kind: 'secret', x: 250, y: 300, open: false, rot: 0, width: 1 });
        const hidden = frame();
        d.tokens[0].hidden = false;
        return { same: bare === hidden, control: hidden !== frame() };
      }
      d.tokens.push(token);
      const healthy = frame(), dmHealthy = frame(false);
      if (fogged) {
        d.fogEnabled = false;
        return { same: bare === healthy, control: frame() !== healthy };
      }
      token.hp = 4;
      return { same: healthy === frame(), control: dmHealthy !== frame(false) };
    }, scenario);
    expect(result.control).toBe(true);
    expect(result.same).toBe(scenario !== 'PC above fog');
  });
}
