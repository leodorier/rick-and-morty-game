import { describe, it, expect, beforeEach } from 'vitest';
import { RickCarBoss } from '../../src/entities/bosses/RickCarBoss';
import { SteelyMopBoss } from '../../src/entities/bosses/SteelyMopBoss';
import { ToiletThroneBoss } from '../../src/entities/bosses/ToiletThroneBoss';
import { Vector2 } from '../../src/utils/Vector2';
import { eventBus } from '../../src/core/EventBus';
import { BossPhaseEvent } from '../../src/core/Events';

describe('Boss State Machines & Encounter Mechanics', () => {
  beforeEach(() => {
    eventBus.clear();
  });

  describe('Boss 1: The Rick-Car Mech', () => {
    let boss: RickCarBoss;

    beforeEach(() => {
      boss = new RickCarBoss(380, 190);
    });

    it('initializes with 300 HP and 3-phase configuration', () => {
      expect(boss.health).toBe(300);
      expect(boss.maxHealth).toBe(300);
      expect(boss.phase).toBe(1);
      expect(boss.maxPhases).toBe(3);
      expect(boss.coreExposed).toBe(false);
      expect(boss.isDead).toBe(false);
    });

    it('exposes radiator core after ramming charge, allowing 2x damage vulnerability', () => {
      // Simulate ramming state completion
      boss.state = 'CHARGE';
      boss.position.x = 30; // Triggers wall slam
      boss.update(0.1, new Vector2(100, 190));

      expect(boss.state).toBe('STAGGER_CORE');
      expect(boss.coreExposed).toBe(true);
      expect(boss.staggerTimer).toBeGreaterThan(0);

      // Hit exposed core with 50 damage -> should deal 100 net damage (2x)
      boss.takeDamage(50);
      expect(boss.health).toBe(200); // 300 - 100 = 200
    });

    it('transitions through Phase 2 (<=200 HP) and Phase 3 (<=100 HP) with boss:phase events', () => {
      const phaseEvents: BossPhaseEvent[] = [];
      eventBus.on('boss:phase', (evt) => phaseEvents.push(evt));

      boss.takeDamage(100); // HP -> 200 (Phase 2)
      expect(boss.phase).toBe(2);
      expect(phaseEvents.length).toBe(1);
      expect(phaseEvents[0].phase).toBe(2);

      boss.takeDamage(100); // HP -> 100 (Phase 3)
      expect(boss.phase).toBe(3);
      expect(phaseEvents.length).toBe(2);
      expect(phaseEvents[1].phase).toBe(3);
    });

    it('registers defeat when HP drops to zero', () => {
      boss.takeDamage(300);
      expect(boss.health).toBe(0);
      expect(boss.isDead).toBe(true);
    });
  });

  describe('Boss 2: Steely Mop Boss (Noob-Noob)', () => {
    let boss: SteelyMopBoss;

    beforeEach(() => {
      boss = new SteelyMopBoss(360, 210);
    });

    it('initializes with 350 HP and 2-phase configuration', () => {
      expect(boss.health).toBe(350);
      expect(boss.maxHealth).toBe(350);
      expect(boss.phase).toBe(1);
      expect(boss.state).toBe('IDLE');
    });

    it('generates sweep and hammer clash hitboxes', () => {
      boss.state = 'MOP_SWEEP';
      const sweepHitbox = boss.getHitBox();
      expect(sweepHitbox).not.toBeNull();
      expect(sweepHitbox!.damage).toBe(20);
      expect(sweepHitbox!.sourceType).toBe('BOSS');
    });

    it('triggers Phase 2 stagger when reduced below 50% HP (<=175 HP)', () => {
      const phaseEvents: BossPhaseEvent[] = [];
      eventBus.on('boss:phase', (evt) => phaseEvents.push(evt));

      boss.takeDamage(180);
      expect(boss.phase).toBe(2);
      expect(boss.state).toBe('STAGGER');
      expect(boss.staggerTimer).toBeGreaterThan(0);
      expect(phaseEvents.length).toBe(1);
    });

    it('registers defeat upon losing all HP', () => {
      boss.takeDamage(350);
      expect(boss.health).toBe(0);
      expect(boss.isDead).toBe(true);
    });
  });

  describe('Boss 3: The Toilet Throne King (Gloobie)', () => {
    let boss: ToiletThroneBoss;

    beforeEach(() => {
      boss = new ToiletThroneBoss(390, 220);
    });

    it('initializes with 450 HP and 3-phase configuration', () => {
      expect(boss.health).toBe(450);
      expect(boss.maxHealth).toBe(450);
      expect(boss.phase).toBe(1);
      expect(boss.state).toBe('IDLE');
    });

    it('executes poop volley and flush vortex attack states', () => {
      boss.state = 'POOP_VOLLEY';
      const poopHitbox = boss.getHitBox();
      expect(poopHitbox).not.toBeNull();
      expect(poopHitbox!.damageType).toBe('GLITCH');

      boss.state = 'FLUSH_VORTEX';
      const vortexHitbox = boss.getHitBox();
      expect(vortexHitbox).not.toBeNull();
      expect(vortexHitbox!.damageType).toBe('PURIFICATION');
    });

    it('transitions across 3 phases (300 HP -> 150 HP -> 0 HP)', () => {
      boss.takeDamage(150); // HP = 300
      expect(boss.phase).toBe(2);

      boss.takeDamage(150); // HP = 150
      expect(boss.phase).toBe(3);

      boss.takeDamage(150); // HP = 0
      expect(boss.health).toBe(0);
      expect(boss.isDead).toBe(true);
    });
  });
});
