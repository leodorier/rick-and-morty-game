import { HitBox, HurtBox } from '../../core/Types';
import { Vector2 } from '../../utils/Vector2';
import { PixelRenderers } from '../../render/PixelRenderers';

export class Caterpillar {
  public id: string;
  public position: Vector2;
  public velocity: Vector2;
  public facingRight = false;
  public health = 50;
  public maxHealth = 50;
  public staggerTimer = 0;
  public isDead = false;

  private animFrame = 0;
  private chargeCooldown = 2.0;

  constructor(x: number, y: number) {
    this.id = `caterpillar-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    this.position = new Vector2(x, y);
    this.velocity = new Vector2(0, 0);
  }

  public update(dtSec: number, targetPos: Vector2): void {
    this.animFrame += dtSec * 10;

    if (this.staggerTimer > 0) {
      this.staggerTimer -= dtSec;
      this.velocity.scaleMut(0.9);
      this.position.x += this.velocity.x * dtSec;
      return;
    }

    const dx = targetPos.x - this.position.x;
    this.facingRight = dx > 0;

    this.chargeCooldown -= dtSec;
    if (this.chargeCooldown <= 0) {
      // Charge Burst
      this.velocity.x = (this.facingRight ? 1 : -1) * 160;
      this.chargeCooldown = 2.5;
    } else {
      this.velocity.x = (this.facingRight ? 1 : -1) * 50;
    }

    this.position.x += this.velocity.x * dtSec;
    this.position.y = Math.max(160, Math.min(250, this.position.y));
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
      x: this.position.x - 20,
      y: this.position.y - 25,
      width: 40,
      height: 25
    };
  }

  public getHitBox(): HitBox | null {
    if (this.staggerTimer > 0) return null;
    return {
      id: `${this.id}-hit`,
      sourceId: this.id,
      sourceType: 'ENEMY',
      damage: 12,
      damageType: 'PHYSICAL',
      knockback: new Vector2(this.facingRight ? 100 : -100, -20),
      staggerDuration: 15,
      x: this.facingRight ? this.position.x : this.position.x - 25,
      y: this.position.y - 20,
      width: 25,
      height: 20
    };
  }

  public render(ctx: CanvasRenderingContext2D): void {
    PixelRenderers.drawCaterpillar({
      ctx,
      x: this.position.x,
      y: this.position.y,
      facingRight: this.facingRight,
      animFrame: this.animFrame,
      state: 'WALK',
      flash: this.staggerTimer > 0
    });
  }
}
