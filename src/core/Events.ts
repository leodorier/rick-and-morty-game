import { TimingRating, ComboRank, AttackType, DamageType, Vector2, CharacterId } from './Types';

export interface BeatEvent {
  beatIndex: number;
  barIndex: number;
  isDownbeat: boolean;
  isDrop: boolean;
  bpm: number;
  timestamp: number;
}

export interface TimingJudgedEvent {
  rating: TimingRating;
  deltaMs: number;
  action: AttackType;
  character: CharacterId;
  position: Vector2;
  multiplier: number;
}

export interface HitEvent {
  attackerId: string;
  targetId: string;
  damage: number;
  damageType: DamageType;
  rating?: TimingRating;
  isParried?: boolean;
  position: Vector2;
  knockback: Vector2;
}

export interface ParryEvent {
  defenderId: string;
  attackerId: string;
  isPerfect: boolean;
  position: Vector2;
}

export interface ComboUpdateEvent {
  comboCount: number;
  multiplier: number;
  rank: ComboRank;
  score: number;
  isBroken: boolean;
}

export interface GlitchEvent {
  corruption: number; // 0 to 100
  intensity: number;  // 0.0 to 1.0
  activeShaders: string[];
}

export interface BossPhaseEvent {
  bossId: string;
  bossName: string;
  phase: number;
  maxPhases: number;
  healthPercent: number;
}

export interface DialogueEvent {
  speaker: string;
  text: string;
  portrait?: string;
  durationMs?: number;
}

export interface SFXTriggerEvent {
  name: string;
  volume?: number;
  pitch?: number;
}

export interface GameStatusEvent {
  status: 'START' | 'PAUSE' | 'RESUME' | 'GAME_OVER' | 'VICTORY';
  finalScore?: number;
  rank?: ComboRank;
}

export type GameEventMap = {
  'beat': BeatEvent;
  'timing:judged': TimingJudgedEvent;
  'combat:hit': HitEvent;
  'combat:parry': ParryEvent;
  'combat:combo': ComboUpdateEvent;
  'glitch:update': GlitchEvent;
  'boss:phase': BossPhaseEvent;
  'ui:dialogue': DialogueEvent;
  'audio:sfx': SFXTriggerEvent;
  'game:status': GameStatusEvent;
};
