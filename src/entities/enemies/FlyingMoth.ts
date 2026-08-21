import { HitBox, HurtBox } from '../../core/Types';
import { Vector2 } from '../../utils/Vector2';
import { PixelRenderers } from '../../render/PixelRenderers';

export class FlyingMoth {
  public id: string;
  public position: Vector2;
  public velocity: Vector2;
  public facingRight = false;
  public health = 35;
  public maxHealth = 35;
  public staggerTimer = 0;
  public isDead = false;

  private animFrame = 0;
  private diveTimer = 1.5;
  private baseHeight = 150;

  constructor(x: number, y = 140) {
    this.id = `moth-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    this.position = new Vector2(x, y);
    this.velocity = new Vector2(0, 0);
  }

  public update(dtSec: number, targetPos: Vector2): void {
    this.animFrame += dtSec * 14;

    if (this.staggerTimer > 0) {
      this.staggerTimer -= dtSec;
      this.position.x += this.velocity.x * dtSec;
      this.position.y += this.velocity.y * dtSec;
      return;
    }

    const dx = targetPos.x - this.position.x;
    this.facingRight = dx > 0;

    this.diveTimer -= dtSec;
    if (this.diveTimer <= 0) {
      // Dive bomb toward player
      this.velocity.x = (this.facingRight ? 1 : -1) * 140;
      this.velocity.y = 120;
      if (this.position.y >= 210) {
        this.diveTimer = 2.0;
      }
    } else {
      // Swoop back up to aerial altitude
      this.velocity.x = (this.facingRight ? 1 : -1) * 60;
      this.velocity.y = (this.baseHeight - this.position.y) * 2;
    }

    this.position.x += this.velocity.x * dtSec;
    this.position.y += this.velocity.y * dtSec;
  }

  public takeDamage(damage: number, knockback: Vector2, staggerDuration: number): void {
    this.health -= damage;
    this.velocity.copy(knockback);
    this.staggerTimer = staggerDuration / 60;
    if (this.health <= 0) {
      this.isDead = true;
    }
  }

  public getHurtBox(): HurtBox {
    return {
      id: `${this.id}-hurt`,
      entityId: this.id,
      x: this.position.x - 15,
      y: this.position.y - 20,
      width: 30,
      height: 20
    };
  }

  public getHitBox(): HitBox | null {
    if (this.staggerTimer > 0) return null;
    return {
      id: `${this.id}-hit`,
      sourceId: this.id,
      sourceType: 'ENEMY',
      damage: 10,
      damageType: 'GLITCH',
      knockback: new Vector2(this.facingRight ? 80 : -80, -20),
      staggerDuration: 12,
      x: this.position.x - 12,
      y: this.position.y - 12,
      width: 24,
      height: 16
    };
  }

  public render(ctx: CanvasRenderingContext2D): void {
    PixelRenderers.drawFlyingMoth({
      ctx,
      x: this.position.x,
      y: this.position.y,
      facingRight: this.facingRight,
      animFrame: this.animFrame,
      state: 'FLY',
      flash: this.staggerTimer > 0
    });
  }
}
