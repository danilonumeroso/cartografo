import { uid } from './util';

/** World pixels per grid square (5 ft). */
export const CELL = 100;
/** Resolution of paint masks relative to world pixels. */
export const MASK_SCALE = 0.5;

export type WallStyle = 'stone' | 'brick' | 'wood' | 'cave';
export type DoorKind = 'wood' | 'double' | 'iron' | 'secret' | 'arch';
export type TokenSize = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';
export type TokenKind = 'pc' | 'ally' | 'npc' | 'monster';

export interface Room { id: string; pts: number[]; floor: string; zoneOnly?: boolean; name?: string }
export interface Wall { id: string; pts: number[]; style: WallStyle }
export interface Door { id: string; x: number; y: number; rot: number; kind: DoorKind; open: boolean; width: number }
export interface Stamp { id: string; type: string; x: number; y: number; rot: number; scale: number; flip?: boolean; variant: number; hidden?: boolean }
export interface Light { id: string; x: number; y: number; radius: number; color: string; intensity: number; flicker: boolean; stampId?: string }
export interface Label { id: string; x: number; y: number; text: string; font: string; size: number; color: string; stroke: string; rot: number; bold?: boolean; italic?: boolean; hidden?: boolean }
export interface Marker { id: string; x: number; y: number; icon: string; color: string; title: string; notes: string; playerNotes: string; visible: boolean; link?: string }
export interface Token {
  id: string; name: string; x: number; y: number; size: TokenSize; kind: TokenKind; color: string; image?: string;
  hp: number; maxHp: number; ac: number; initMod: number; init: number | null; conditions: string[]; hidden: boolean;
}
export interface Combat { active: boolean; round: number; turn: string | null; members: string[] }
export interface GridSettings { show: boolean; color: string; opacity: number; showPlayers: boolean; feet: number }

export interface MapDoc {
  id: string; name: string; kind: 'battle';
  cols: number; rows: number;
  bg: string; caveFloor: string; wallStyle: WallStyle;
  rooms: Room[]; walls: Wall[]; doors: Door[]; stamps: Stamp[]; lights: Light[];
  labels: Label[]; markers: Marker[]; tokens: Token[];
  combat: Combat;
  grid: GridSettings;
  ambient: number;
  fogEnabled: boolean;
  createdAt: number; updatedAt: number;
}

export const OBJECT_KEYS = ['rooms', 'walls', 'doors', 'stamps', 'lights', 'labels', 'markers', 'tokens'] as const;
export type ObjectKey = typeof OBJECT_KEYS[number];

export function newDoc(name: string, cols: number, rows: number, bg = 'rock'): MapDoc {
  const now = Date.now();
  return {
    id: uid(), name, kind: 'battle', cols, rows,
    bg, caveFloor: 'cave', wallStyle: 'stone',
    rooms: [], walls: [], doors: [], stamps: [], lights: [], labels: [], markers: [], tokens: [],
    combat: { active: false, round: 1, turn: null, members: [] },
    grid: { show: true, color: '#000000', opacity: 0.22, showPlayers: true, feet: 5 },
    ambient: 0, fogEnabled: false, createdAt: now, updatedAt: now,
  };
}

/** Fill in fields added in later versions. */
export function migrateDoc(d: any): MapDoc {
  const base = newDoc(d.name || 'Mappa', d.cols || 30, d.rows || 20);
  const out = { ...base, ...d } as MapDoc;
  for (const k of OBJECT_KEYS) if (!Array.isArray((out as any)[k])) (out as any)[k] = [];
  out.grid = { ...base.grid, ...(d.grid || {}) };
  out.combat = { ...base.combat, ...(d.combat || {}) };
  return out;
}

export const TOKEN_CELLS: Record<TokenSize, number> = { tiny: 0.5, small: 1, medium: 1, large: 2, huge: 3, gargantuan: 4 };
export const TOKEN_SIZE_NAMES: Record<TokenSize, string> = { tiny: 'Minuscola', small: 'Piccola', medium: 'Media', large: 'Grande', huge: 'Enorme', gargantuan: 'Mastodontica' };
export const TOKEN_KIND_NAMES: Record<TokenKind, string> = { pc: 'Personaggio', ally: 'Alleato', npc: 'PNG', monster: 'Mostro' };
export const TOKEN_KIND_COLORS: Record<TokenKind, string> = { pc: '#3b82f6', ally: '#22c55e', npc: '#eab308', monster: '#ef4444' };

export const CONDITIONS: { id: string; name: string; icon: string }[] = [
  { id: 'blinded', name: 'Accecato', icon: '🙈' },
  { id: 'charmed', name: 'Affascinato', icon: '💘' },
  { id: 'deafened', name: 'Assordato', icon: '🙉' },
  { id: 'frightened', name: 'Spaventato', icon: '😱' },
  { id: 'grappled', name: 'Afferrato', icon: '✊' },
  { id: 'incapacitated', name: 'Incapacitato', icon: '💫' },
  { id: 'invisible', name: 'Invisibile', icon: '👻' },
  { id: 'paralyzed', name: 'Paralizzato', icon: '⚡' },
  { id: 'petrified', name: 'Pietrificato', icon: '🗿' },
  { id: 'poisoned', name: 'Avvelenato', icon: '🤢' },
  { id: 'prone', name: 'Prono', icon: '⬇️' },
  { id: 'restrained', name: 'Trattenuto', icon: '⛓️' },
  { id: 'stunned', name: 'Stordito', icon: '😵' },
  { id: 'unconscious', name: 'Privo di sensi', icon: '💤' },
  { id: 'exhaustion', name: 'Esausto', icon: '😩' },
  { id: 'concentration', name: 'Concentrazione', icon: '🎯' },
];

export const FONTS = ['IM Fell English', 'Cinzel', 'MedievalSharp', 'Uncial Antiqua', 'Pirata One', 'Almendra'];
export const MARKER_ICONS = ['📍', '⚔️', '💀', '💰', '🗝️', '🚪', '⚠️', '❓', '⭐', '🔥', '🐉', '🧙', '👁️', '📜', '🪤', '⛺'];

export function newToken(x: number, y: number, kind: TokenKind = 'monster', name = 'Mostro'): Token {
  return {
    id: uid(), name, x, y, size: 'medium', kind, color: TOKEN_KIND_COLORS[kind],
    hp: 10, maxHp: 10, ac: 12, initMod: 0, init: null, conditions: [], hidden: kind === 'monster',
  };
}

export function hpStatus(t: Token): string {
  if (t.maxHp <= 0) return '';
  const r = t.hp / t.maxHp;
  if (t.hp <= 0) return 'A terra';
  if (r >= 1) return 'Illeso';
  if (r > 0.5) return 'Ferito';
  if (r > 0.25) return 'Sanguinante';
  return 'Morente';
}
