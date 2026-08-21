import { describe, it, expect } from 'vitest';
import { Collision } from '../../src/utils/Collision';
import { Vector2 } from '../../src/utils/Vector2';
import { BoundingBox, HitBox, HurtBox } from '../../src/core/Types';

describe('Vector2 Mathematics', () => {
  it('performs basic vector arithmetic', () => {
    const v1 = new Vector2(3, 4);
    const v2 = new Vector2(1, 2);

    const sum = v1.add(v2);
    expect(sum.x).toBe(4);
    expect(sum.y).toBe(6);

    const diff = v1.sub(v2);
    expect(diff.x).toBe(2);
    expect(diff.y).toBe(2);

    const scaled = v1.scale(2);
    expect(scaled.x).toBe(6);
    expect(scaled.y).toBe(8);

    const div = v1.div(2);
    expect(div.x).toBe(1.5);
    expect(div.y).toBe(2);
  });

  it('calculates length, dot product, and normalization', () => {
    const v = new Vector2(3, 4);
    expect(v.lengthSq()).toBe(25);
    expect(v.length()).toBe(5);

    const normalized = v.normalize();
    expect(normalized.x).toBeCloseTo(0.6, 5);
    expect(normalized.y).toBeCloseTo(0.8, 5);
    expect(normalized.length()).toBeCloseTo(1.0, 5);

    const v2 = new Vector2(2, 0);
    expect(v.dot(v2)).toBe(6);
  });

  it('interpolates (lerp) and checks distance', () => {
    const start = new Vector2(0, 0);
    const end = new Vector2(100, 200);

    const mid = start.lerp(end, 0.5);
    expect(mid.x).toBe(50);
    expect(mid.y).toBe(100);

    expect(start.distance(new Vector2(30, 40))).toBe(50);
  });
});

describe('Collision Detection', () => {
  describe('AABB Overlap (checkAABB)', () => {
    it('detects intersecting bounding boxes', () => {
      const boxA: BoundingBox = { x: 10, y: 10, width: 50, height: 50 };
      const boxB: BoundingBox = { x: 40, y: 40, width: 50, height: 50 };

      expect(Collision.checkAABB(boxA, boxB)).toBe(true);
      expect(Collision.checkAABB(boxB, boxA)).toBe(true);
    });

    it('returns false for separated boxes', () => {
      const boxA: BoundingBox = { x: 0, y: 0, width: 20, height: 20 };
      const boxB: BoundingBox = { x: 30, y: 30, width: 20, height: 20 };

      expect(Collision.checkAABB(boxA, boxB)).toBe(false);
    });

    it('returns false for adjacent edge-touching boxes', () => {
      const boxA: BoundingBox = { x: 0, y: 0, width: 20, height: 20 };
      const boxB: BoundingBox = { x: 20, y: 0, width: 20, height: 20 };

      expect(Collision.checkAABB(boxA, boxB)).toBe(false);
    });
  });

  describe('Point in AABB (pointInAABB)', () => {
    const box: BoundingBox = { x: 10, y: 10, width: 100, height: 50 };

    it('identifies points inside box boundaries', () => {
      expect(Collision.pointInAABB(new Vector2(20, 20), box)).toBe(true);
      expect(Collision.pointInAABB(new Vector2(10, 10), box)).toBe(true);
      expect(Collision.pointInAABB(new Vector2(110, 60), box)).toBe(true);
    });

    it('identifies points outside box boundaries', () => {
      expect(Collision.pointInAABB(new Vector2(5, 20), box)).toBe(false);
      expect(Collision.pointInAABB(new Vector2(20, 65), box)).toBe(false);
      expect(Collision.pointInAABB(new Vector2(150, 100), box)).toBe(false);
    });
  });

  describe('Circle Collision (checkCircle)', () => {
    it('detects overlapping circles', () => {
      const c1 = { x: 0, y: 0, radius: 10 };
      const c2 = { x: 15, y: 0, radius: 10 };

      expect(Collision.checkCircle(c1, c2)).toBe(true);
    });

    it('detects separated circles', () => {
      const c1 = { x: 0, y: 0, radius: 10 };
      const c2 = { x: 25, y: 0, radius: 10 };

      expect(Collision.checkCircle(c1, c2)).toBe(false);
    });
  });

  describe('Penetration Resolution (getPenetration)', () => {
    it('calculates minimum translation vector for colliding boxes', () => {
      const boxA: BoundingBox = { x: 0, y: 0, width: 50, height: 50 };
      const boxB: BoundingBox = { x: 40, y: 10, width: 50, height: 50 }; // overlaps by 10 on X

      const mtv = Collision.getPenetration(boxA, boxB);
      expect(mtv).not.toBeNull();
      expect(mtv!.x).toBe(10);
      expect(mtv!.y).toBe(0);
    });

    it('returns null when boxes do not overlap', () => {
      const boxA: BoundingBox = { x: 0, y: 0, width: 20, height: 20 };
      const boxB: BoundingBox = { x: 50, y: 50, width: 20, height: 20 };

      expect(Collision.getPenetration(boxA, boxB)).toBeNull();
    });
  });

  describe('Hit Resolution (resolveHit)', () => {
    const baseHitbox: HitBox = {
      id: 'hb-1',
      sourceId: 'rick-1',
      sourceType: 'PLAYER',
      x: 50,
      y: 50,
      width: 40,
      height: 40,
      damage: 25,
      damageType: 'PHYSICAL',
      knockback: new Vector2(10, -5),
      staggerDuration: 15
    };

    const enemyHurtbox: HurtBox = {
      id: 'hb-enemy',
      entityId: 'caterpillar-1',
      x: 60,
      y: 60,
      width: 40,
      height: 40
    };

    it('resolves a normal hit between player hitbox and enemy hurtbox', () => {
      const resolution = Collision.resolveHit(baseHitbox, enemyHurtbox);
      expect(resolution).not.toBeNull();
      expect(resolution!.hit).toBe(true);
      expect(resolution!.damage).toBe(25);
      expect(resolution!.isParried).toBe(false);
      expect(resolution!.knockback.x).toBe(10);
      expect(resolution!.knockback.y).toBe(-5);
      expect(resolution!.staggerDuration).toBe(15);
      expect(resolution!.contactPoint).toBeDefined();
    });

    it('prevents self-inflicted damage / friendly fire with identical entityId', () => {
      const selfHurtbox: HurtBox = {
        id: 'hb-rick',
        entityId: 'rick-1',
        x: 50,
        y: 50,
        width: 40,
        height: 40
      };

      const resolution = Collision.resolveHit(baseHitbox, selfHurtbox);
      expect(resolution).toBeNull();
    });

    it('ignores hits when target hurtbox is invulnerable', () => {
      const invulnerableHurtbox: HurtBox = {
        ...enemyHurtbox,
        isInvulnerable: true
      };

      const resolution = Collision.resolveHit(baseHitbox, invulnerableHurtbox);
      expect(resolution).toBeNull();
    });

    it('returns null when hitbox and hurtbox do not intersect', () => {
      const farHurtbox: HurtBox = {
        ...enemyHurtbox,
        x: 200,
        y: 200
      };

      const resolution = Collision.resolveHit(baseHitbox, farHurtbox);
      expect(resolution).toBeNull();
    });

    it('executes parry deflection when hurtbox is in parrying state', () => {
      const parryingHurtbox: HurtBox = {
        ...enemyHurtbox,
        isParrying: true
      };

      const resolution = Collision.resolveHit(baseHitbox, parryingHurtbox);
      expect(resolution).not.toBeNull();
      expect(resolution!.hit).toBe(true);
      expect(resolution!.isParried).toBe(true);
      expect(resolution!.damage).toBe(0); // 0 damage taken
      // Reflected knockback: 10 * -1.5 = -15, -5 * -1.5 = 7.5
      expect(resolution!.knockback.x).toBeCloseTo(-15, 3);
      expect(resolution!.knockback.y).toBeCloseTo(7.5, 3);
      expect(resolution!.staggerDuration).toBe(30);
    });

    it('bypasses parry if attack hitbox is unparryable (canParry: false)', () => {
      const unparryableHitbox: HitBox = {
        ...baseHitbox,
        canParry: false
      };

      const parryingHurtbox: HurtBox = {
        ...enemyHurtbox,
        isParrying: true
      };

      const resolution = Collision.resolveHit(unparryableHitbox, parryingHurtbox);
      expect(resolution).not.toBeNull();
      expect(resolution!.isParried).toBe(false);
      expect(resolution!.damage).toBe(25);
    });
  });
});
