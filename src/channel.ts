import type { MapDoc } from './model';

export type Msg =
  | { t: 'hello' }
  | { t: 'ready'; mapId: string }
  | { t: 'map'; id: string }
  | { t: 'doc'; doc: MapDoc }
  | { t: 'fog'; mapId: string; x: number; y: number; data: ImageData }
  | { t: 'view'; mapId: string; cx: number; cy: number; w: number; h: number }
  | { t: 'ping'; x: number; y: number }
  | { t: 'measure'; a: [number, number] | null; b: [number, number] | null }
  | { t: 'bye' }
  | { t: 'dmhello' }
  | { t: 'pbye' }
  | { t: 'lang' };

export class Channel {
  private bc = new BroadcastChannel('cartografo-dnd-session');
  constructor(onMsg: (m: Msg) => void) { this.bc.onmessage = (e) => onMsg(e.data as Msg); }
  send(m: Msg) { this.bc.postMessage(m); }
}
