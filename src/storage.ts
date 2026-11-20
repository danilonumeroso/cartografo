import type { MapDoc } from './model';

export interface StoredMap {
  id: string; name: string; updatedAt: number;
  doc: MapDoc; masks: Record<string, Blob>; fog?: Blob; thumb?: Blob;
}
export interface AssetRec { id: string; name: string; blob: Blob; w: number; h: number; cells: number; kind: 'stamp' | 'token' }

const DB_NAME = 'cartografo-dnd';
let dbp: Promise<IDBDatabase> | null = null;

function db(): Promise<IDBDatabase> {
  if (!dbp) {
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = () => {
        const d = r.result;
        if (!d.objectStoreNames.contains('maps')) d.createObjectStore('maps', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('assets')) d.createObjectStore('assets', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta');
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  return dbp;
}
function wrap<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
}
async function store(name: string, mode: IDBTransactionMode) {
  return (await db()).transaction(name, mode).objectStore(name);
}

export const listMaps = async (): Promise<StoredMap[]> => wrap((await store('maps', 'readonly')).getAll());
export const getMap = async (id: string): Promise<StoredMap | undefined> => wrap((await store('maps', 'readonly')).get(id));
export const putMap = async (m: StoredMap) => { await wrap((await store('maps', 'readwrite')).put(m)); };
export const deleteMap = async (id: string) => { await wrap((await store('maps', 'readwrite')).delete(id)); };
export const listAssets = async (): Promise<AssetRec[]> => wrap((await store('assets', 'readonly')).getAll());
export const putAsset = async (a: AssetRec) => { await wrap((await store('assets', 'readwrite')).put(a)); };
export const deleteAsset = async (id: string) => { await wrap((await store('assets', 'readwrite')).delete(id)); };
export const getMeta = async <T = any>(k: string): Promise<T | undefined> => wrap((await store('meta', 'readonly')).get(k));
export const setMeta = async (k: string, v: any) => { await wrap((await store('meta', 'readwrite')).put(v, k)); };
