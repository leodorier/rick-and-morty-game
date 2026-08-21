import { describe, it, expect } from 'vitest';
import { Rick } from '../../src/entities/Rick';
import { Morty } from '../../src/entities/Morty';
import { Vector2 } from '../../src/utils/Vector2';

describe('Rick & Morty Entity State Machines', () => {
  it('should initialize Rick with full health and default state', () => {
    const rick = new Rick(50, 200);
    expect(rick.health).toBe(100);
    expect(rick.state).toBe('IDLE');

    rick.triggerBlaster();
    expect(rick.state).toBe('BLASTER');
    expect(rick.getActiveHitBox()).not.toBeNull();
    expect(rick.getActiveHitBox()?.damage).toBe(30);

    rick.triggerHammer();
    expect(rick.state).toBe('HAMMER');
    expect(rick.getActiveHitBox()?.damage).toBe(65);

    rick.triggerParry();
    expect(rick.state).toBe('PARRY');
    expect(rick.getHurtBox().isParrying).toBe(true);
  });

  it('should initialize Morty and support companion slide & broom spin moves', () => {
    const morty = new Morty(30, 200);
    expect(morty.health).toBe(80);
    expect(morty.state).toBe('IDLE');

    morty.triggerSlide();
    expect(morty.state).toBe('SLIDE');
    expect(morty.getHurtBox().lowProfile).toBe(true);
    expect(morty.getActiveHitBox()?.damage).toBe(25);

    morty.triggerBroomSpin();
    expect(morty.state).toBe('BROOM_SPIN');
    expect(morty.getActiveHitBox()?.damageType).toBe('PURIFICATION');
  });

  it('should follow Rick when distance exceeds threshold', () => {
    const morty = new Morty(0, 200);
    const rickPos = new Vector2(200, 200);

    morty.update(0.1, rickPos);
    expect(morty.state).toBe('RUN');
    expect(morty.velocity.x).toBeGreaterThan(0);
  });
});
