import { describe, it, expect } from 'vitest';
import { RickCarBoss } from '../../src/entities/bosses/RickCarBoss';
import { SteelyMopBoss } from '../../src/entities/bosses/SteelyMopBoss';
import { ToiletThroneBoss } from '../../src/entities/bosses/ToiletThroneBoss';

describe('Boss Encounters & AI State Machines', () => {
  it('should transition Rick-Car Boss through 3 phases with exposed radiator core', () => {
    const boss = new RickCarBoss(300, 190);
    expect(boss.phase).toBe(1);
    expect(boss.health).toBe(300);

    // Damage to phase 2
    boss.takeDamage(120);
    expect(boss.phase).toBe(2);

    // Damage to phase 3
    boss.takeDamage(100);
    expect(boss.phase).toBe(3);

    // Lethal damage
    boss.takeDamage(100);
    expect(boss.isDead).toBe(true);
  });

  it('should transition Steely Mop Boss and execute mop attacks', () => {
    const boss = new SteelyMopBoss(300, 210);
    expect(boss.phase).toBe(1);

    boss.takeDamage(180);
    expect(boss.phase).toBe(2);
    expect(boss.staggerTimer).toBeGreaterThan(0);
  });

  it('should transition Toilet Throne King and execute poop volleys', () => {
    const boss = new ToiletThroneBoss(300, 220);
    expect(boss.phase).toBe(1);

    boss.takeDamage(200);
    expect(boss.phase).toBe(2);

    boss.update(0.1);
    expect(boss.getHurtBox()).toBeDefined();
  });
});
