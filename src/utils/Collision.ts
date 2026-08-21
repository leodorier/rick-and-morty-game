import { BoundingBox, HitBox, HurtBox, Vector2 as Vector2Type } from '../core/Types';
import { Vector2 } from './Vector2';

export interface HitResolution {
  hit: boolean;
  damage: number;
  isParried: boolean;
  knockback: Vector2;
  staggerDuration: number;
  contactPoint: Vector2;
}

export class Collision {
  /**
   * Check if two Axis-Aligned Bounding Boxes (AABB) intersect.
   */
  public static checkAABB(a: BoundingBox, b: BoundingBox): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  /**
   * Check if a 2D point is inside a bounding box.
   */
  public static pointInAABB(p: Vector2Type, box: BoundingBox): boolean {
    return (
      p.x >= box.x &&
      p.x <= box.x + box.width &&
      p.y >= box.y &&
      p.y <= box.y + box.height
    );
  }

  /**
   * Check collision between two circles.
   */
  public static checkCircle(
    c1: { x: number; y: number; radius: number },
    c2: { x: number; y: number; radius: number }
  ): boolean {
    const dx = c1.x - c2.x;
    const dy = c1.y - c2.y;
    const distSq = dx * dx + dy * dy;
    const radSum = c1.radius + c2.radius;
    return distSq <= radSum * radSum;
  }

  /**
   * Calculate penetration depth and minimum translation vector (MTV).
   */
  public static getPenetration(a: BoundingBox, b: BoundingBox): Vector2 | null {
    if (!this.checkAABB(a, b)) return null;

    const overlapX1 = a.x + a.width - b.x;
    const overlapX2 = b.x + b.width - a.x;
    const overlapY1 = a.y + a.height - b.y;
    const overlapY2 = b.y + b.height - a.y;

    const minX = overlapX1 < overlapX2 ? overlapX1 : -overlapX2;
    const minY = overlapY1 < overlapY2 ? overlapY1 : -overlapY2;

    if (Math.abs(minX) < Math.abs(minY)) {
      return new Vector2(minX, 0);
    } else {
      return new Vector2(0, minY);
    }
  }

  /**
   * Resolve an offensive HitBox hitting a defensive HurtBox.
   */
  public static resolveHit(hitbox: HitBox, hurtbox: HurtBox): HitResolution | null {
    // 1. Same entity / friendly fire check
    if (hitbox.sourceId === hurtbox.entityId) return null;

    // 2. Invulnerability check
    if (hurtbox.isInvulnerable) return null;

    // 3. AABB overlap check
    if (!this.checkAABB(hitbox, hurtbox)) return null;

    // Calculate approximate contact point (center of overlap)
    const contactX = Math.max(hitbox.x, hurtbox.x) + Math.min(hitbox.x + hitbox.width, hurtbox.x + hurtbox.width) / 2;
    const contactY = Math.max(hitbox.y, hurtbox.y) + Math.min(hitbox.y + hitbox.height, hurtbox.y + hurtbox.height) / 2;
    const contactPoint = new Vector2(contactX, contactY);

    // 4. Parry detection
    if (hurtbox.isParrying && hitbox.canParry !== false) {
      return {
        hit: true,
        damage: 0,
        isParried: true,
        knockback: hitbox.knockback.scale(-1.5), // Deflect knockback to attacker
        staggerDuration: 30, // Parry counter window
        contactPoint
      };
    }

    // 5. Normal damage resolution
    return {
      hit: true,
      damage: hitbox.damage,
      isParried: false,
      knockback: hitbox.knockback.clone(),
      staggerDuration: hitbox.staggerDuration,
      contactPoint
    };
  }
}
