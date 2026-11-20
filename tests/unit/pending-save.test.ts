import { expect, it, vi } from 'vitest';
import { Editor } from '../../src/editor';
import { newDoc } from '../../src/model';
import { putMap, type StoredMap } from '../../src/storage';

vi.mock('../../src/storage', async importOriginal => ({
  ...await importOriginal<typeof import('../../src/storage')>(), putMap: vi.fn(),
}));
vi.mock('../../src/ui/chrome', async importOriginal => ({
  ...await importOriginal<typeof import('../../src/ui/chrome')>(), updateTopbar: vi.fn(),
}));

// Regression §2.12: a save waiting for its thumbnail used to write after the map was discarded.
it('a discarded map cannot commit an already pending save', async () => {
  const doc = newDoc('Retired', 20, 15);
  const record = { id: doc.id, name: doc.name, updatedAt: doc.updatedAt, doc, masks: {} } satisfies StoredMap;
  let finishThumbnail!: (blob: Blob) => void;
  const thumbnail = new Promise<Blob>(resolve => { finishThumbnail = resolve; });
  const ed: Editor = Object.assign(Object.create(Editor.prototype), {
    rt: { doc, toStored: async () => record }, makeThumb: () => thumbnail,
    saveSoon: { cancel() {} }, maps: [], setSaveStatus() {},
  });
  const pending = ed.saveNow();
  ed.forgetCurrent();
  finishThumbnail(new Blob());
  await pending;
  for (const map of ed.maps) if (map.thumb) URL.revokeObjectURL(map.thumb);
  expect(putMap).not.toHaveBeenCalled();
});
