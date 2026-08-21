import { HitBox, HurtBox } from '../../core/Types';
import { Vector2 } from '../../utils/Vector2';
import { PixelRenderers } from '../../render/PixelRenderers';
import { eventBus } from '../../core/EventBus';

export type SteelyMopState = 'IDLE' | 'MOP_SWEEP' | 'SLAM_CHARGE' | 'STAGGER';

export class SteelyMopBoss {
  public id = 'boss-steely-mop';
  public name = 'STEELY MOP BOSS (NOOB-NOOB)';
  public position: Vector2;
  public velocity: Vector2;
  public facingRight = false;
  public state: SteelyMopState = 'IDLE';

  public health = 350;
  public maxHealth = 350;
  public phase = 1;
  public maxPhases = 2;

  public isDead = false;
  public staggerTimer = 0;

  private animFrame = 0;
  private stateTimer = 2.5;

  constructor(x = 360, y = 210) {
    this.position = new Vector2(x, y);
    this.velocity = new Vector2(0, 0);
  }

  public update(dtSec: number, targetPos: Vector2): void {
    this.animFrame += dtSec * 10;

    if (this.staggerTimer > 0) {
      this.staggerTimer -= dtSec;
      if (this.staggerTimer <= 0) {
        this.state = 'IDLE';
        this.stateTimer = 2.0;
      }
      return;
    }

    this.stateTimer -= dtSec;
    const dx = targetPos.x - this.position.x;
    this.facingRight = dx > 0;

    switch (this.state) {
      case 'IDLE':
        this.velocity.x = (dx > 0 ? 1 : -1) * 70;
        if (this.stateTimer <= 0) {
          if (Math.abs(dx) < 60) {
            this.state = 'SLAM_CHARGE';
            this.stateTimer = 1.0;
            this.velocity.set(0, 0);
          } else {
            this.state = 'MOP_SWEEP';
            this.stateTimer = 1.2;
            this.velocity.x = (this.facingRight ? 1 : -1) * 180;
            eventBus.emit('audio:sfx', { name: 'whoosh' });
          }
        }
        break;

      case 'SLAM_CHARGE':
        if (this.stateTimer <= 0) {
          // Hammer clash slam
          eventBus.emit('audio:sfx', { name: 'heavy_hit' });
          this.state = 'IDLE';
          this.stateTimer = 2.2;
        }
        break;

      case 'MOP_SWEEP':
        if (this.stateTimer <= 0) {
          this.state = 'IDLE';
          this.stateTimer = 2.0;
        }
        break;
    }

    this.position.x += this.velocity.x * dtSec;
    this.position.x = Math.max(40, Math.min(440, this.position.x));
  }

  public takeDamage(damage: number): void {
    this.health = Math.max(0, this.health - damage);

    if (this.health <= 175 && this.phase === 1) {
      this.phase = 2;
      this.staggerTimer = 1.5;
      this.state = 'STAGGER';
      eventBus.emit('boss:phase', {
        bossId: this.id,
        bossName: this.name,
        phase: this.phase,
        maxPhases: this.maxPhases,
        healthPercent: (this.health / this.maxHealth) * 100
      });
      eventBus.emit('audio:sfx', { name: 'got_damn' });
    }

    if (this.health <= 0) {
      this.isDead = true;
    }
  }

  public getHurtBox(): HurtBox {
    return {
      id: `${this.id}-hurt`,
      entityId: this.id,
      x: this.position.x - 20,
      y: this.position.y - 60,
      width: 40,
      height: 60
    };
  }

  public getHitBox(): HitBox | null {
    if (this.state === 'SLAM_CHARGE' && this.stateTimer < 0.2) {
      return {
        id: `${this.id}-slam`,
        sourceId: this.id,
        sourceType: 'BOSS',
        damage: 26,
        damageType: 'PHYSICAL',
        knockback: new Vector2(this.facingRight ? 220 : -220, -70),
        staggerDuration: 35,
        x: this.facingRight ? this.position.x : this.position.x - 60,
        y: this.position.y - 45,
        width: 60,
        height: 45
      };
    }

    if (this.state === 'MOP_SWEEP') {
      return {
        id: `${this.id}-sweep`,
        sourceId: this.id,
        sourceType: 'BOSS',
        damage: 20,
        damageType: 'PHYSICAL',
        knockback: new Vector2(this.facingRight ? 160 : -160, -30),
        staggerDuration: 25,
        x: this.facingRight ? this.position.x : this.position.x - 45,
        y: this.position.y - 40,
        width: 45,
        height: 40
      };
    }

    return null;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    PixelRenderers.drawSteelyMopBoss({
      ctx,
      x: this.position.x,
      y: this.position.y,
      facingRight: this.facingRight,
      animFrame: this.animFrame,
      state: this.state,
      flash: this.staggerTimer > 0 && Math.floor(this.staggerTimer * 20) % 2 === 0,
      isCharging: this.state === 'SLAM_CHARGE'
    });
  }
}
