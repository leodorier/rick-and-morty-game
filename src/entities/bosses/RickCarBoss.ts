import { HitBox, HurtBox } from '../../core/Types';
import { Vector2 } from '../../utils/Vector2';
import { PixelRenderers } from '../../render/PixelRenderers';
import { eventBus } from '../../core/EventBus';

export type RickCarState = 'HOVER' | 'CHARGE' | 'BLASTER' | 'STAGGER_CORE';

export class RickCarBoss {
  public id = 'boss-rick-car';
  public name = 'THE RICK-CAR MECH';
  public position: Vector2;
  public velocity: Vector2;
  public facingRight = false;
  public state: RickCarState = 'HOVER';

  public health = 300;
  public maxHealth = 300;
  public phase = 1;
  public maxPhases = 3;

  public isDead = false;
  public staggerTimer = 0;
  public coreExposed = false;

  private animFrame = 0;
  private stateTimer = 3.0;

  constructor(x = 380, y = 190) {
    this.position = new Vector2(x, y);
    this.velocity = new Vector2(0, 0);
  }

  public update(dtSec: number, targetPos: Vector2): void {
    this.animFrame += dtSec * 10;

    if (this.staggerTimer > 0) {
      this.staggerTimer -= dtSec;
      this.coreExposed = true;
      if (this.staggerTimer <= 0) {
        this.coreExposed = false;
        this.state = 'HOVER';
        this.stateTimer = 2.0;
      }
      return;
    }

    this.stateTimer -= dtSec;
    const dx = targetPos.x - this.position.x;
    this.facingRight = dx > 0;

    switch (this.state) {
      case 'HOVER':
        // Hover and align Y
        this.velocity.x = (dx > 0 ? 1 : -1) * 40;
        this.velocity.y = (targetPos.y - this.position.y) * 1.5;

        if (this.stateTimer <= 0) {
          if (Math.random() < 0.5) {
            this.state = 'CHARGE';
            this.stateTimer = 1.8;
            this.velocity.x = (this.facingRight ? 1 : -1) * 260;
            eventBus.emit('audio:sfx', { name: 'whoosh' });
          } else {
            this.state = 'BLASTER';
            this.stateTimer = 1.5;
            this.velocity.set(0, 0);
            eventBus.emit('audio:sfx', { name: 'laser' });
          }
        }
        break;

      case 'CHARGE':
        // Ramming speed
        if (this.stateTimer <= 0 || this.position.x <= 40 || this.position.x >= 440) {
          // Ram finished -> Radiator core becomes temporarily exposed for rhythm sledgehammer hit!
          this.state = 'STAGGER_CORE';
          this.staggerTimer = 2.0;
          this.coreExposed = true;
          this.velocity.set(0, 0);
        }
        break;

      case 'BLASTER':
        this.velocity.set(0, 0);
        if (this.stateTimer <= 0) {
          this.state = 'HOVER';
          this.stateTimer = 2.5;
        }
        break;
    }

    this.position.x += this.velocity.x * dtSec;
    this.position.y += this.velocity.y * dtSec;
    this.position.x = Math.max(40, Math.min(440, this.position.x));
    this.position.y = Math.max(150, Math.min(230, this.position.y));
  }

  public takeDamage(damage: number, isCritical = false): void {
    // 2x damage if radiator core is exposed!
    const netDamage = this.coreExposed || isCritical ? damage * 2 : damage;
    this.health = Math.max(0, this.health - netDamage);

    // Phase transitions at 200 and 100 HP
    const prevPhase = this.phase;
    if (this.health <= 100) {
      this.phase = 3;
    } else if (this.health <= 200) {
      this.phase = 2;
    }

    if (this.phase !== prevPhase) {
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
      x: this.position.x - 45,
      y: this.position.y - 50,
      width: 90,
      height: 50
    };
  }

  public getHitBox(): HitBox | null {
    if (this.coreExposed || this.staggerTimer > 0) return null;

    if (this.state === 'CHARGE') {
      return {
        id: `${this.id}-ram`,
        sourceId: this.id,
        sourceType: 'BOSS',
        damage: 22,
        damageType: 'PHYSICAL',
        knockback: new Vector2(this.facingRight ? 200 : -200, -50),
        staggerDuration: 30,
        x: this.position.x - 40,
        y: this.position.y - 45,
        width: 80,
        height: 45
      };
    }

    if (this.state === 'BLASTER') {
      return {
        id: `${this.id}-blaster`,
        sourceId: this.id,
        sourceType: 'BOSS',
        damage: 18,
        damageType: 'PLASMA',
        knockback: new Vector2(this.facingRight ? 140 : -140, -20),
        staggerDuration: 20,
        x: this.facingRight ? this.position.x + 20 : this.position.x - 140,
        y: this.position.y - 35,
        width: 120,
        height: 20
      };
    }

    return null;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    PixelRenderers.drawRickCarBoss({
      ctx,
      x: this.position.x,
      y: this.position.y,
      facingRight: this.facingRight,
      animFrame: this.animFrame,
      state: this.state,
      flash: this.staggerTimer > 0 && Math.floor(this.staggerTimer * 20) % 2 === 0,
      coreExposed: this.coreExposed
    });
  }
}
