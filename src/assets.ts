import { AssetRec, deleteAsset, listAssets, putAsset } from './storage';
import { uid } from './util';

/** User-imported PNG assets (stamps and token portraits). */
class AssetLib {
  recs = new Map<string, AssetRec>();
  imgs = new Map<string, ImageBitmap>();
  urls = new Map<string, string>();
  onChange: (() => void) | null = null;

  async loadAll() {
    for (const r of await listAssets()) await this.register(r);
  }
  private async register(r: AssetRec) {
    this.recs.set(r.id, r);
    try { this.imgs.set(r.id, await createImageBitmap(r.blob)); } catch { /* corrupted */ }
    this.urls.set(r.id, URL.createObjectURL(r.blob));
  }
  async add(file: Blob, name: string, kind: 'stamp' | 'token'): Promise<AssetRec> {
    const bmp = await createImageBitmap(file);
    const cells = kind === 'token' ? 1 : Math.max(0.5, Math.round((bmp.width / 200) * 2) / 2);
    const rec: AssetRec = { id: uid(), name, blob: file, w: bmp.width, h: bmp.height, cells, kind };
    await putAsset(rec);
    await this.register(rec);
    this.onChange?.();
    return rec;
  }
  async update(rec: AssetRec) { this.recs.set(rec.id, rec); await putAsset(rec); this.onChange?.(); }
  async remove(id: string) {
    await deleteAsset(id);
    this.recs.delete(id); this.imgs.delete(id);
    const u = this.urls.get(id); if (u) URL.revokeObjectURL(u);
    this.urls.delete(id);
    this.onChange?.();
  }
  list(kind?: 'stamp' | 'token') { return [...this.recs.values()].filter((r) => !kind || r.kind === kind); }
}
export const assets = new AssetLib();
