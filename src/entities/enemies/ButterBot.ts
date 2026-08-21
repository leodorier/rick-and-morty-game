import { HitBox, HurtBox } from '../../core/Types';
import { Vector2 } from '../../utils/Vector2';
import { PixelRenderers } from '../../render/PixelRenderers';

export class ButterBot {
  public id: string;
  public position: Vector2;
  public velocity: Vector2;
  public facingRight = false;
  public health = 40;
  public maxHealth = 40;
  public staggerTimer = 0;
  public isDead = false;

  private animFrame = 0;
  private attackTimer = 1.8;

  constructor(x: number, y = 210) {
    this.id = `butterbot-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    this.position = new Vector2(x, y);
    this.velocity = new Vector2(0, 0);
  }

  public update(dtSec: number, targetPos: Vector2): void {
    this.animFrame += dtSec * 12;

    if (this.staggerTimer > 0) {
      this.staggerTimer -= dtSec;
      this.position.x += this.velocity.x * dtSec;
      return;
    }

    const dx = targetPos.x - this.position.x;
    this.facingRight = dx > 0;

    this.attackTimer -= dtSec;
    if (this.attackTimer <= 0) {
      // Rapid rolling melee dash
      this.velocity.x = (this.facingRight ? 1 : -1) * 130;
      if (Math.abs(dx) < 30) {
        this.attackTimer = 2.0;
      }
    } else {
      this.velocity.x = (this.facingRight ? 1 : -1) * 40;
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
      x: this.position.x - 12,
      y: this.position.y - 28,
      width: 24,
      height: 28
    };
  }

  public getHitBox(): HitBox | null {
    if (this.staggerTimer > 0) return null;
    return {
      id: `${this.id}-hit`,
      sourceId: this.id,
      sourceType: 'ENEMY',
      damage: 10,
      damageType: 'ELECTRIC',
      knockback: new Vector2(this.facingRight ? 90 : -90, -15),
      staggerDuration: 14,
      x: this.facingRight ? this.position.x : this.position.x - 20,
      y: this.position.y - 22,
      width: 20,
      height: 20
    };
  }

  public render(ctx: CanvasRenderingContext2D): void {
    PixelRenderers.drawButterBot({
      ctx,
      x: this.position.x,
      y: this.position.y,
      facingRight: this.facingRight,
      animFrame: this.animFrame,
      state: 'ROLL',
      flash: this.staggerTimer > 0
    });
  }
}
