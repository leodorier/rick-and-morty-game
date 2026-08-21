import { HitBox, HurtBox } from '../../core/Types';
import { Vector2 } from '../../utils/Vector2';
import { PixelRenderers } from '../../render/PixelRenderers';
import { eventBus } from '../../core/EventBus';

export type ToiletThroneState = 'IDLE' | 'POOP_VOLLEY' | 'FLUSH_VORTEX' | 'STAGGER';

export class ToiletThroneBoss {
  public id = 'boss-toilet-throne';
  public name = 'THE TOILET THRONE KING (GLOOBIE)';
  public position: Vector2;
  public velocity: Vector2;
  public facingRight = false;
  public state: ToiletThroneState = 'IDLE';

  public health = 450;
  public maxHealth = 450;
  public phase = 1;
  public maxPhases = 3;

  public isDead = false;
  public staggerTimer = 0;

  private animFrame = 0;
  private stateTimer = 3.0;

  constructor(x = 390, y = 220) {
    this.position = new Vector2(x, y);
    this.velocity = new Vector2(0, 0);
  }

  public update(dtSec: number): void {
    this.animFrame += dtSec * 10;

    if (this.staggerTimer > 0) {
      this.staggerTimer -= dtSec;
      if (this.staggerTimer <= 0) {
        this.state = 'IDLE';
        this.stateTimer = 2.5;
      }
      return;
    }

    this.stateTimer -= dtSec;

    switch (this.state) {
      case 'IDLE':
        if (this.stateTimer <= 0) {
          if (Math.random() < 0.6) {
            this.state = 'POOP_VOLLEY';
            this.stateTimer = 2.0;
            eventBus.emit('audio:sfx', { name: 'laser' });
          } else {
            this.state = 'FLUSH_VORTEX';
            this.stateTimer = 2.2;
            eventBus.emit('audio:sfx', { name: 'whoosh' });
          }
        }
        break;

      case 'POOP_VOLLEY':
        if (this.stateTimer <= 0) {
          this.state = 'IDLE';
          this.stateTimer = 2.5;
        }
        break;

      case 'FLUSH_VORTEX':
        if (this.stateTimer <= 0) {
          this.state = 'IDLE';
          this.stateTimer = 2.5;
        }
        break;
    }
  }

  public takeDamage(damage: number): void {
    this.health = Math.max(0, this.health - damage);

    const prevPhase = this.phase;
    if (this.health <= 150) {
      this.phase = 3;
    } else if (this.health <= 300) {
      this.phase = 2;
    }

    if (this.phase !== prevPhase) {
      this.staggerTimer = 1.8;
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
      x: this.position.x - 40,
      y: this.position.y - 85,
      width: 80,
      height: 85
    };
  }

  public getHitBox(): HitBox | null {
    if (this.staggerTimer > 0) return null;

    if (this.state === 'POOP_VOLLEY') {
      return {
        id: `${this.id}-poop`,
        sourceId: this.id,
        sourceType: 'BOSS',
        damage: 20,
        damageType: 'GLITCH',
        knockback: new Vector2(-150, -30),
        staggerDuration: 20,
        x: this.position.x - 200,
        y: this.position.y - 50,
        width: 180,
        height: 35
      };
    }

    if (this.state === 'FLUSH_VORTEX') {
      return {
        id: `${this.id}-vortex`,
        sourceId: this.id,
        sourceType: 'BOSS',
        damage: 24,
        damageType: 'PURIFICATION',
        knockback: new Vector2(100, -40), // Pulls toward toilet
        staggerDuration: 30,
        x: this.position.x - 120,
        y: this.position.y - 45,
        width: 100,
        height: 45
      };
    }

    return null;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    PixelRenderers.drawToiletThroneBoss({
      ctx,
      x: this.position.x,
      y: this.position.y,
      facingRight: false,
      animFrame: this.animFrame,
      state: this.state,
      flash: this.staggerTimer > 0 && Math.floor(this.staggerTimer * 20) % 2 === 0,
      phase: this.phase
    });
  }
}
