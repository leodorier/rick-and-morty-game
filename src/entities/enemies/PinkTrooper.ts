import { HitBox, HurtBox } from '../../core/Types';
import { Vector2 } from '../../utils/Vector2';
import { PixelRenderers } from '../../render/PixelRenderers';
import { eventBus } from '../../core/EventBus';

export class PinkTrooper {
  public id: string;
  public position: Vector2;
  public velocity: Vector2;
  public facingRight = false;
  public health = 60;
  public maxHealth = 60;
  public staggerTimer = 0;
  public isDead = false;

  private animFrame = 0;
  private shootCooldown = 2.2;

  constructor(x: number, y = 205) {
    this.id = `trooper-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    this.position = new Vector2(x, y);
    this.velocity = new Vector2(0, 0);
  }

  public update(dtSec: number, targetPos: Vector2): void {
    this.animFrame += dtSec * 10;

    if (this.staggerTimer > 0) {
      this.staggerTimer -= dtSec;
      this.position.x += this.velocity.x * dtSec;
      return;
    }

    const dx = targetPos.x - this.position.x;
    this.facingRight = dx > 0;

    const dist = Math.abs(dx);
    if (dist > 160) {
      this.velocity.x = (this.facingRight ? 1 : -1) * 60;
    } else if (dist < 100) {
      this.velocity.x = (this.facingRight ? -1 : 1) * 50; // Retreat
    } else {
      this.velocity.x = 0;
    }

    this.shootCooldown -= dtSec;
    if (this.shootCooldown <= 0) {
      this.shootCooldown = 2.5;
      eventBus.emit('audio:sfx', { name: 'laser' });
    }

    this.position.x += this.velocity.x * dtSec;
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
      x: this.position.x - 14,
      y: this.position.y - 36,
      width: 28,
      height: 36
    };
  }

  public getHitBox(): HitBox | null {
    if (this.staggerTimer > 0 || this.shootCooldown > 0.4) return null;
    return {
      id: `${this.id}-shot`,
      sourceId: this.id,
      sourceType: 'ENEMY',
      damage: 15,
      damageType: 'PLASMA',
      knockback: new Vector2(this.facingRight ? 120 : -120, -10),
      staggerDuration: 18,
      x: this.facingRight ? this.position.x + 10 : this.position.x - 80,
      y: this.position.y - 26,
      width: 70,
      height: 8
    };
  }

  public render(ctx: CanvasRenderingContext2D): void {
    PixelRenderers.drawPinkTrooper({
      ctx,
      x: this.position.x,
      y: this.position.y,
      facingRight: this.facingRight,
      animFrame: this.animFrame,
      state: 'SHOOT',
      flash: this.staggerTimer > 0
    });
  }
}
