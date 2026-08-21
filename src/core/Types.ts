import { Vector2 } from '../utils/Vector2';

export { Vector2 };

/**
 * Rhythm-action timing judgment window ratings.
 */
export type TimingRating = 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS';

/**
 * Combo rating ranks based on active multiplier and momentum.
 */
export type ComboRank = 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'DIMENSIONAL';

/**
 * Playable character identifiers.
 */
export type CharacterId = 'RICK' | 'MORTY';

/**
 * Entity categories in the simulation.
 */
export type EntityCategory = 'PLAYER' | 'ENEMY' | 'BOSS' | 'PROJECTILE' | 'PICKUP' | 'VFX';

/**
 * Attack classifications for rhythm-linked specials and basic strikes.
 */
export type AttackType =
  | 'BLASTER_BURST'
  | 'SLEDGEHAMMER_SMASH'
  | 'PORTAL_PARRY'
  | 'OVERHEAD_TOSS'
  | 'SLIDE_TACKLE'
  | 'AIR_DROPKICK'
  | 'BROOM_SPIN'
  | 'PUNCH_FLURRY'
  | 'BOSS_SPECIAL';

/**
 * Damage types influencing hit effects and vulnerability.
 */
export type DamageType = 'PHYSICAL' | 'PLASMA' | 'GLITCH' | 'ELECTRIC' | 'PURIFICATION';

/**
 * Axis-Aligned Bounding Box (AABB) for physics and combat collision detection.
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Attack hitbox payload with damage, stagger frames, knockback, and rating.
 */
export interface HitBox extends BoundingBox {
  id: string;
  sourceId: string;
  sourceType: EntityCategory;
  damage: number;
  damageType: DamageType;
  knockback: Vector2;
  staggerDuration: number;
  rating?: TimingRating;
  canParry?: boolean;
}

/**
 * Defensive hurtbox definition for receiving damage.
 */
export interface HurtBox extends BoundingBox {
  id: string;
  entityId: string;
  isInvulnerable?: boolean;
  isParrying?: boolean;
  lowProfile?: boolean; // For ducking / slide tackles
}

/**
 * Timing window tolerances in milliseconds.
 */
export interface TimingWindows {
  perfect: number; // e.g. 35ms
  great: number;   // e.g. 70ms
  good: number;    // e.g. 110ms
  miss: number;    // > 110ms
}

/**
 * Result of a rhythm timing calculation.
 */
export interface TimingResult {
  rating: TimingRating;
  deltaMs: number;
  multiplier: number;
  damageBonus: number;
  comboIncrement: number;
  corruptionDelta: number;
}

/**
 * Reticle prompt target on screen.
 */
export interface ReticlePrompt {
  id: string;
  targetBeat: number;
  targetTimeMs: number;
  position: Vector2;
  radius: number;
  currentRadius: number;
  initialRadius: number;
  action: AttackType;
  color: string;
  shape: 'CIRCLE' | 'SQUARE';
  entityTargetId?: string;
  resolved: boolean;
}

/**
 * Beat clock state payload.
 */
export interface BeatState {
  bpm: number;
  currentBeat: number;
  currentTimeSec: number;
  currentBar: number;
  beatProgress: number; // 0.0 to 1.0 within current beat
  deltaMs: number;
  isDrop: boolean;
}

/**
 * Game simulation state.
 */
export type GameState = 'TITLE' | 'INTRO' | 'PLAYING' | 'BOSS_BATTLE' | 'PAUSED' | 'GAME_OVER' | 'VICTORY';
