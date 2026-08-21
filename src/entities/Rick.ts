import { HitBox, HurtBox } from '../core/Types';
import { Vector2 } from '../utils/Vector2';
import { PixelRenderers } from '../render/PixelRenderers';
import { eventBus } from '../core/EventBus';

export type RickState = 'IDLE' | 'RUN' | 'JUMP' | 'BLASTER' | 'HAMMER' | 'PARRY' | 'TOSS' | 'HURT';

export class Rick {
  public id = 'player-rick';
  public position: Vector2;
  public velocity: Vector2;
  public facingRight = true;
  public state: RickState = 'IDLE';

  public health = 100;
  public maxHealth = 100;
  public superCharge = 0; // 0..100
  public invulnerableTimer = 0;
  public stateTimer = 0;
  public animFrame = 0;

  private walkSpeed = 140;

  constructor(x = 60, y = 210) {
    this.position = new Vector2(x, y);
    this.velocity = new Vector2(0, 0);
  }

  public update(dtSec: number, input: { left: boolean; right: boolean; up: boolean; down: boolean; attackJ: boolean; attackK: boolean; attackL: boolean; space: boolean }): void {
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

    // Process State & Movement if not in locked action
    if (this.state === 'IDLE' || this.state === 'RUN') {
      let moveX = 0;
      let moveY = 0;

      if (input.left) {
        moveX -= 1;
        this.facingRight = false;
      }
      if (input.right) {
        moveX += 1;
        this.facingRight = true;
      }
      if (input.up) moveY -= 1;
      if (input.down) moveY += 1;

      if (moveX !== 0 || moveY !== 0) {
        this.velocity.x = moveX * this.walkSpeed;
        this.velocity.y = moveY * (this.walkSpeed * 0.7);
        this.state = 'RUN';
      } else {
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.state = 'IDLE';
      }

      // Attack Inputs
      if (input.attackJ) {
        this.triggerBlaster();
      } else if (input.attackK) {
        this.triggerHammer();
      } else if (input.attackL) {
        this.triggerParry();
      } else if (input.space) {
        this.triggerToss();
      }
    } else {
      // Friction during attacks
      this.velocity.scaleMut(0.85);
    }

    // Integrate Position with boundary clamps
    this.position.x += this.velocity.x * dtSec;
    this.position.y += this.velocity.y * dtSec;

    this.position.x = Math.max(20, Math.min(460, this.position.x));
    this.position.y = Math.max(140, Math.min(250, this.position.y));
  }

  public triggerBlaster(): void {
    this.state = 'BLASTER';
    this.stateTimer = 0.25;
    eventBus.emit('audio:sfx', { name: 'blaster' });
  }

  public triggerHammer(): void {
    this.state = 'HAMMER';
    this.stateTimer = 0.45;
    eventBus.emit('audio:sfx', { name: 'hammer_hit' });
  }

  public triggerParry(): void {
    this.state = 'PARRY';
    this.stateTimer = 0.35;
    eventBus.emit('audio:sfx', { name: 'portal_parry' });
  }

  public triggerToss(): void {
    this.state = 'TOSS';
    this.stateTimer = 0.4;
    eventBus.emit('audio:sfx', { name: 'whoosh' });
  }

  public takeDamage(amount: number): boolean {
    if (this.invulnerableTimer > 0 || this.state === 'PARRY') return false;

    this.health = Math.max(0, this.health - amount);
    this.invulnerableTimer = 0.8; // i-frames
    this.state = 'HURT';
    this.stateTimer = 0.3;
    eventBus.emit('audio:sfx', { name: 'miss' });
    return true;
  }

  public getHurtBox(): HurtBox {
    return {
      id: 'rick-hurtbox',
      entityId: this.id,
      x: this.position.x - 12,
      y: this.position.y - 48,
      width: 24,
      height: 48,
      isInvulnerable: this.invulnerableTimer > 0,
      isParrying: this.state === 'PARRY'
    };
  }

  public getActiveHitBox(): HitBox | null {
    if (this.state === 'BLASTER') {
      return {
        id: `rick-blaster-${Date.now()}`,
        sourceId: this.id,
        sourceType: 'PLAYER',
        damage: 30,
        damageType: 'PLASMA',
        knockback: new Vector2(this.facingRight ? 180 : -180, -30),
        staggerDuration: 20,
        x: this.facingRight ? this.position.x + 10 : this.position.x - 120,
        y: this.position.y - 36,
        width: 110,
        height: 16
      };
    }

    if (this.state === 'HAMMER') {
      return {
        id: `rick-hammer-${Date.now()}`,
        sourceId: this.id,
        sourceType: 'PLAYER',
        damage: 65,
        damageType: 'PHYSICAL',
        knockback: new Vector2(this.facingRight ? 240 : -240, -80),
        staggerDuration: 45,
        x: this.facingRight ? this.position.x + 6 : this.position.x - 56,
        y: this.position.y - 50,
        width: 50,
        height: 52
      };
    }

    if (this.state === 'TOSS') {
      return {
        id: `rick-toss-${Date.now()}`,
        sourceId: this.id,
        sourceType: 'PLAYER',
        damage: 45,
        damageType: 'PHYSICAL',
        knockback: new Vector2(this.facingRight ? 280 : -280, -120),
        staggerDuration: 30,
        x: this.facingRight ? this.position.x + 8 : this.position.x - 48,
        y: this.position.y - 40,
        width: 40,
        height: 36
      };
    }

    return null;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const flash = this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer * 20) % 2 === 0;
    PixelRenderers.drawRick({
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
