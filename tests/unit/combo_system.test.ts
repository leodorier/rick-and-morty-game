import { describe, it, expect, beforeEach } from 'vitest';
import { ComboSystem } from '../../src/combat/ComboSystem';
import { eventBus } from '../../src/core/EventBus';
import { ComboUpdateEvent } from '../../src/core/Events';

describe('ComboSystem', () => {
  let combo: ComboSystem;

  beforeEach(() => {
    eventBus.clear();
    combo = new ComboSystem();
  });

  describe('Initial State', () => {
    it('starts with default initial zeroed values', () => {
      expect(combo.comboCount).toBe(0);
      expect(combo.maxCombo).toBe(0);
      expect(combo.score).toBe(0);
      expect(combo.multiplier).toBe(1.0);
      expect(combo.rank).toBe('D');
    });
  });

  describe('Hit Registration & Multipliers', () => {
    it('increments combo by 2 on PERFECT rating and applies 2.0x rating bonus', () => {
      // Base score 100
      // Combo: 0 -> 2 (Rank D -> multiplier 1.0)
      // Added score = Math.round(100 * 1.0 * 2.0) = 200
      const added = combo.registerHit(100, 'PERFECT');
      expect(added).toBe(200);
      expect(combo.comboCount).toBe(2);
      expect(combo.score).toBe(200);
      expect(combo.maxCombo).toBe(2);
    });

    it('increments combo by 1 on GREAT rating and applies 1.5x rating bonus', () => {
      // Base score 100
      // Combo: 0 -> 1 (Rank D -> multiplier 1.0)
      // Added score = Math.round(100 * 1.0 * 1.5) = 150
      const added = combo.registerHit(100, 'GREAT');
      expect(added).toBe(150);
      expect(combo.comboCount).toBe(1);
      expect(combo.score).toBe(150);
    });

    it('increments combo by 1 on GOOD rating and applies 1.0x rating bonus', () => {
      // Base score 100
      // Added score = Math.round(100 * 1.0 * 1.0) = 100
      const added = combo.registerHit(100, 'GOOD');
      expect(added).toBe(100);
      expect(combo.comboCount).toBe(1);
      expect(combo.score).toBe(100);
    });

    it('breaks combo and awards 0 score on MISS rating', () => {
      combo.registerHit(100, 'PERFECT'); // combo = 2
      expect(combo.comboCount).toBe(2);

      const added = combo.registerHit(100, 'MISS');
      expect(added).toBe(0);
      expect(combo.comboCount).toBe(0);
      expect(combo.rank).toBe('D');
      expect(combo.multiplier).toBe(1.0);
    });
  });

  describe('Rank Progression & Multiplier Scaling', () => {
    it('progresses through ranks correctly based on combo thresholds', () => {
      // Rank D: 0-4 (< 5)
      for (let i = 0; i < 4; i++) {
        combo.registerHit(10, 'GOOD');
      }
      expect(combo.comboCount).toBe(4);
      expect(combo.rank).toBe('D');
      expect(combo.multiplier).toBe(1.0);

      // Rank C: 5-9
      combo.registerHit(10, 'GOOD');
      expect(combo.comboCount).toBe(5);
      expect(combo.rank).toBe('C');
      expect(combo.multiplier).toBe(1.2);

      // Rank B: 10-19
      for (let i = 0; i < 5; i++) {
        combo.registerHit(10, 'GOOD');
      }
      expect(combo.comboCount).toBe(10);
      expect(combo.rank).toBe('B');
      expect(combo.multiplier).toBe(1.5);

      // Rank A: 20-34
      for (let i = 0; i < 10; i++) {
        combo.registerHit(10, 'GOOD');
      }
      expect(combo.comboCount).toBe(20);
      expect(combo.rank).toBe('A');
      expect(combo.multiplier).toBe(2.0);

      // Rank S: 35-54
      for (let i = 0; i < 15; i++) {
        combo.registerHit(10, 'GOOD');
      }
      expect(combo.comboCount).toBe(35);
      expect(combo.rank).toBe('S');
      expect(combo.multiplier).toBe(2.5);

      // Rank SS: 55-79
      for (let i = 0; i < 20; i++) {
        combo.registerHit(10, 'GOOD');
      }
      expect(combo.comboCount).toBe(55);
      expect(combo.rank).toBe('SS');
      expect(combo.multiplier).toBe(3.0);

      // Rank DIMENSIONAL: 80+
      for (let i = 0; i < 25; i++) {
        combo.registerHit(10, 'GOOD');
      }
      expect(combo.comboCount).toBe(80);
      expect(combo.rank).toBe('DIMENSIONAL');
      expect(combo.multiplier).toBe(4.0);
    });

    it('retains maxCombo after combo breaks', () => {
      for (let i = 0; i < 25; i++) {
        combo.registerHit(10, 'GOOD');
      }
      expect(combo.maxCombo).toBe(25);

      combo.registerMiss();
      expect(combo.comboCount).toBe(0);
      expect(combo.maxCombo).toBe(25);

      combo.registerHit(10, 'GOOD');
      expect(combo.comboCount).toBe(1);
      expect(combo.maxCombo).toBe(25);
    });
  });

  describe('Combo Timeout & Decay', () => {
    it('decays combo after comboTimeoutSec passes without hits', () => {
      const customCombo = new ComboSystem({ comboTimeoutSec: 2.0 });
      customCombo.registerHit(100, 'PERFECT');
      expect(customCombo.comboCount).toBe(2);

      // Advance by 1.5s (still within window)
      customCombo.update(1.5);
      expect(customCombo.comboCount).toBe(2);

      // Advance another 0.6s (exceeds 2.0s total)
      customCombo.update(0.6);
      expect(customCombo.comboCount).toBe(0);
      expect(customCombo.rank).toBe('D');
    });

    it('resets timer when a new hit is registered', () => {
      const customCombo = new ComboSystem({ comboTimeoutSec: 2.0 });
      customCombo.registerHit(100, 'GOOD');

      customCombo.update(1.5);
      expect(customCombo.comboCount).toBe(1);

      // Chain hit refreshes timer back to 2.0s
      customCombo.registerHit(100, 'GOOD');
      expect(customCombo.comboCount).toBe(2);

      customCombo.update(1.5);
      expect(customCombo.comboCount).toBe(2); // Still active!
    });
  });

  describe('Event Bus Notifications', () => {
    it('emits combat:combo events on hit and combo drop', () => {
      const events: ComboUpdateEvent[] = [];
      eventBus.on('combat:combo', (evt) => events.push(evt));

      combo.registerHit(100, 'PERFECT');
      expect(events.length).toBe(1);
      expect(events[0]).toEqual({
        comboCount: 2,
        multiplier: 1.0,
        rank: 'D',
        score: 200,
        isBroken: false
      });

      combo.registerMiss();
      expect(events.length).toBe(2);
      expect(events[1]).toEqual({
        comboCount: 0,
        multiplier: 1.0,
        rank: 'D',
        score: 200,
        isBroken: true
      });
    });
  });

  describe('Full Reset', () => {
    it('resets all combo metrics to clean baseline', () => {
      combo.registerHit(500, 'PERFECT');
      combo.registerHit(500, 'PERFECT');
      expect(combo.score).toBeGreaterThan(0);
      expect(combo.comboCount).toBe(4);

      combo.reset();
      expect(combo.comboCount).toBe(0);
      expect(combo.maxCombo).toBe(0);
      expect(combo.score).toBe(0);
      expect(combo.multiplier).toBe(1.0);
      expect(combo.rank).toBe('D');
    });
  });
});
