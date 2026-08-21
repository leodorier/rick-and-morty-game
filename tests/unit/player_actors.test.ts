import { describe, it, expect, beforeEach } from 'vitest';
import { Rick } from '../../src/entities/Rick';
import { Morty } from '../../src/entities/Morty';
import { Vector2 } from '../../src/utils/Vector2';
import { eventBus } from '../../src/core/EventBus';

describe('Player Actors (Rick & Morty)', () => {
  beforeEach(() => {
    eventBus.clear();
  });

  describe('Rick Sanchez (Heavy / Tech Leader)', () => {
    let rick: Rick;

    beforeEach(() => {
      rick = new Rick(100, 200);
    });

    it('initializes with full health and default state', () => {
      expect(rick.health).toBe(100);
      expect(rick.maxHealth).toBe(100);
      expect(rick.state).toBe('IDLE');
      expect(rick.facingRight).toBe(true);
      expect(rick.position.x).toBe(100);
      expect(rick.position.y).toBe(200);
    });

    it('moves in 4 directions based on input and updates facing', () => {
      const inputRight = {
        left: false,
        right: true,
        up: false,
        down: false,
        attackJ: false,
        attackK: false,
        attackL: false,
        space: false
      };

      rick.update(0.1, inputRight);
      expect(rick.state).toBe('RUN');
      expect(rick.facingRight).toBe(true);
      expect(rick.position.x).toBeGreaterThan(100);

      const inputLeft = { ...inputRight, right: false, left: true };
      rick.update(0.1, inputLeft);
      expect(rick.facingRight).toBe(false);
    });

    it('clamps player coordinates within stage playfield bounds', () => {
      const inputLeft = {
        left: true,
        right: false,
        up: false,
        down: false,
        attackJ: false,
        attackK: false,
        attackL: false,
        space: false
      };

      // Move left for a long duration
      for (let i = 0; i < 50; i++) {
        rick.update(0.1, inputLeft);
      }
      expect(rick.position.x).toBeGreaterThanOrEqual(20);
    });

    it('triggers Blaster Shot (J) with plasma projectile hitbox', () => {
      rick.triggerBlaster();
      expect(rick.state).toBe('BLASTER');

      const hitbox = rick.getActiveHitBox();
      expect(hitbox).not.toBeNull();
      expect(hitbox!.damage).toBe(30);
      expect(hitbox!.damageType).toBe('PLASMA');
      expect(hitbox!.sourceType).toBe('PLAYER');
    });

    it('triggers Sledgehammer Smash (K) with high physical damage hitbox', () => {
      rick.triggerHammer();
      expect(rick.state).toBe('HAMMER');

      const hitbox = rick.getActiveHitBox();
      expect(hitbox).not.toBeNull();
      expect(hitbox!.damage).toBe(65);
      expect(hitbox!.damageType).toBe('PHYSICAL');
      expect(hitbox!.staggerDuration).toBe(45);
    });

    it('triggers Portal Parry (L) and absorbs incoming attacks', () => {
      rick.triggerParry();
      expect(rick.state).toBe('PARRY');

      const hurtbox = rick.getHurtBox();
      expect(hurtbox.isParrying).toBe(true);

      // Taking damage during parry is blocked
      const tookDamage = rick.takeDamage(20);
      expect(tookDamage).toBe(false);
      expect(rick.health).toBe(100);
    });

    it('triggers Overhead Mob Toss (Space)', () => {
      rick.triggerToss();
      expect(rick.state).toBe('TOSS');

      const hitbox = rick.getActiveHitBox();
      expect(hitbox).not.toBeNull();
      expect(hitbox!.damage).toBe(45);
      expect(hitbox!.knockback.x).toBe(280);
    });

    it('takes damage, activates i-frames, and enters HURT state', () => {
      const tookDamage = rick.takeDamage(25);
      expect(tookDamage).toBe(true);
      expect(rick.health).toBe(75);
      expect(rick.state).toBe('HURT');
      expect(rick.invulnerableTimer).toBeGreaterThan(0);

      // Damage during i-frames should be ignored
      const secondHit = rick.takeDamage(25);
      expect(secondHit).toBe(false);
      expect(rick.health).toBe(75);
    });
  });

  describe('Morty Smith (Companion & Scrapper)', () => {
    let morty: Morty;

    beforeEach(() => {
      morty = new Morty(50, 200);
    });

    it('initializes with Morty attributes and lower health pool', () => {
      expect(morty.health).toBe(80);
      expect(morty.maxHealth).toBe(80);
      expect(morty.state).toBe('IDLE');
    });

    it('triggers Slide Tackle with low profile hurtbox and forward knockback', () => {
      morty.triggerSlide();
      expect(morty.state).toBe('SLIDE');

      const hurtbox = morty.getHurtBox();
      expect(hurtbox.lowProfile).toBe(true);

      const hitbox = morty.getActiveHitBox();
      expect(hitbox).not.toBeNull();
      expect(hitbox!.damage).toBe(25);
      expect(hitbox!.damageType).toBe('PHYSICAL');
    });

    it('triggers Noob-Noob Broom Spin Special with 360 purification damage', () => {
      morty.triggerBroomSpin();
      expect(morty.state).toBe('BROOM_SPIN');

      const hitbox = morty.getActiveHitBox();
      expect(hitbox).not.toBeNull();
      expect(hitbox!.damage).toBe(40);
      expect(hitbox!.damageType).toBe('PURIFICATION');
      expect(hitbox!.width).toBe(60);
    });

    it('follows Rick position via companion AI update', () => {
      const rickPos = new Vector2(300, 200);
      morty.update(0.2, rickPos, null, null);

      expect(morty.state).toBe('RUN');
      expect(morty.facingRight).toBe(true);
      expect(morty.position.x).toBeGreaterThan(50);
    });

    it('responds to manual assist triggers (SLIDE / BROOM_SPIN)', () => {
      const rickPos = new Vector2(100, 200);
      morty.update(0.1, rickPos, null, 'BROOM_SPIN');

      expect(morty.state).toBe('BROOM_SPIN');
    });
  });
});
