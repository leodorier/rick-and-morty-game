import { HitBox, HurtBox } from '../core/Types';
import { Vector2 } from '../utils/Vector2';
import { PixelRenderers } from '../render/PixelRenderers';
import { eventBus } from '../core/EventBus';

export type MortyState = 'IDLE' | 'RUN' | 'SLIDE' | 'DROPKICK' | 'BROOM_SPIN' | 'HURT';

export class Morty {
  public id = 'player-morty';
  public position: Vector2;
  public velocity: Vector2;
  public facingRight = true;
  public state: MortyState = 'IDLE';

  public health = 80;
  public maxHealth = 80;
  public invulnerableTimer = 0;
  public stateTimer = 0;
  public animFrame = 0;

  private walkSpeed = 160;

  constructor(x = 30, y = 210) {
    this.position = new Vector2(x, y);
    this.velocity = new Vector2(0, 0);
  }

  public update(
    dtSec: number,
    rickPos: Vector2,
    nearestEnemyPos?: Vector2 | null,
    manualAssistTrigger?: 'SLIDE' | 'BROOM_SPIN' | null
  ): void {
    this.animFrame += dtSec * 12;

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dtSec;
    }

    if (this.stateTimer > 0) {
      this.stateTimer -= dtSec;
      if (this.stateTimer <= 0) {
        this.state = 'IDLE';
      }
    }

    // Manual Assist Command overrides AI
    if (manualAssistTrigger && this.state !== 'BROOM_SPIN' && this.state !== 'SLIDE') {
      if (manualAssistTrigger === 'BROOM_SPIN') {
        this.triggerBroomSpin();
      } else {
        this.triggerSlide();
      }
    }

    // AI Companion Behavior
    if (this.state === 'IDLE' || this.state === 'RUN') {
      const targetX = nearestEnemyPos ? nearestEnemyPos.x : rickPos.x - 35;
      const targetY = nearestEnemyPos ? nearestEnemyPos.y : rickPos.y;

      const dx = targetX - this.position.x;
      const dy = targetY - this.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 30) {
        this.facingRight = dx > 0;
        this.velocity.x = (dx / dist) * this.walkSpeed;
        this.velocity.y = (dy / dist) * (this.walkSpeed * 0.7);
        this.state = 'RUN';

        // Auto Attack Opportunity if close to enemy
        if (nearestEnemyPos && dist < 45 && Math.random() < 0.05) {
          this.triggerSlide();
        }
      } else {
        this.velocity.set(0, 0);
        this.state = 'IDLE';
      }
    }

    // Integrate Position
    this.position.x += this.velocity.x * dtSec;
    this.position.y += this.velocity.y * dtSec;

    this.position.x = Math.max(20, Math.min(460, this.position.x));
    this.position.y = Math.max(140, Math.min(250, this.position.y));
  }

  public triggerSlide(): void {
    this.state = 'SLIDE';
    this.stateTimer = 0.35;
    this.velocity.x = (this.facingRight ? 1 : -1) * 220;
    eventBus.emit('audio:sfx', { name: 'slide' });
  }

  public triggerBroomSpin(): void {
    this.state = 'BROOM_SPIN';
    this.stateTimer = 0.55;
    this.velocity.set(0, 0);
    eventBus.emit('audio:sfx', { name: 'broom_spin' });
  }

  public takeDamage(amount: number): boolean {
    if (this.invulnerableTimer > 0) return false;

    this.health = Math.max(0, this.health - amount);
    this.invulnerableTimer = 0.8;
    this.state = 'HURT';
    this.stateTimer = 0.3;
    return true;
  }

  public getHurtBox(): HurtBox {
    return {
      id: 'morty-hurtbox',
      entityId: this.id,
      x: this.position.x - 8,
      y: this.position.y - 36,
      width: 16,
      height: 36,
      isInvulnerable: this.invulnerableTimer > 0,
      lowProfile: this.state === 'SLIDE'
    };
  }

  public getActiveHitBox(): HitBox | null {
    if (this.state === 'SLIDE') {
      return {
        id: `morty-slide-${Date.now()}`,
        sourceId: this.id,
        sourceType: 'PLAYER',
        damage: 25,
        damageType: 'PHYSICAL',
        knockback: new Vector2(this.facingRight ? 150 : -150, -40),
        staggerDuration: 25,
        x: this.facingRight ? this.position.x : this.position.x - 30,
        y: this.position.y - 16,
        width: 30,
        height: 16
      };
    }

    if (this.state === 'BROOM_SPIN') {
      return {
        id: `morty-broom-${Date.now()}`,
        sourceId: this.id,
        sourceType: 'PLAYER',
        damage: 40,
        damageType: 'PURIFICATION',
        knockback: new Vector2(this.facingRight ? 180 : -180, -60),
        staggerDuration: 35,
        x: this.position.x - 30,
        y: this.position.y - 36,
        width: 60,
        height: 36
      };
    }

    return null;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const flash = this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer * 20) % 2 === 0;
    PixelRenderers.drawMorty({
      ctx,
      x: this.position.x,
      y: this.position.y,
      facingRight: this.facingRight,
      animFrame: this.animFrame,
      state: this.state,
      flash
    });
  }
}
