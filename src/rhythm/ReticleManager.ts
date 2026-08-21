import { AttackType, CharacterId, ReticlePrompt, TimingRating, Vector2 as Vector2Type } from '../core/Types';
import { Vector2 } from '../utils/Vector2';
import { TimingJudger } from './TimingJudger';
import { ParticleEngine } from '../render/ParticleEngine';
import { eventBus } from '../core/EventBus';

export class ReticleManager {
  private reticles: ReticlePrompt[] = [];
  private judger: TimingJudger;
  private particleEngine: ParticleEngine;
  private readonly shrinkDurationMs = 461.54; // 1 beat at 130 BPM

  constructor(judger: TimingJudger, particleEngine: ParticleEngine) {
    this.judger = judger;
    this.particleEngine = particleEngine;
  }

  public spawnReticle(
    targetTimeMs: number,
    position: Vector2Type,
    action: AttackType = 'BLASTER_BURST',
    shape: 'CIRCLE' | 'SQUARE' = 'CIRCLE',
    color = '#00FFFF',
    entityTargetId?: string
  ): ReticlePrompt {
    const prompt: ReticlePrompt = {
      id: `reticle-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      targetBeat: 0,
      targetTimeMs,
      position: new Vector2(position.x, position.y),
      radius: 16,
      currentRadius: 64,
      initialRadius: 64,
      action,
      color,
      shape,
      entityTargetId,
      resolved: false
    };

    this.reticles.push(prompt);
    return prompt;
  }

  public evaluateInput(
    currentTimeMs: number,
    action: AttackType,
    character: CharacterId,
    targetPos?: Vector2Type
  ): { rating: TimingRating; deltaMs: number; multiplier: number } {
    let closestIndex = -1;
    let minDelta = Infinity;

    for (let i = 0; i < this.reticles.length; i++) {
      const r = this.reticles[i];
      if (r.resolved) continue;

      const delta = Math.abs(currentTimeMs - r.targetTimeMs);
      if (delta < minDelta && (r.action === action || !action)) {
        minDelta = delta;
        closestIndex = i;
      }
    }

    if (closestIndex !== -1 && minDelta <= 110.0) {
      const prompt = this.reticles[closestIndex];
      prompt.resolved = true;
      const signedDelta = currentTimeMs - prompt.targetTimeMs;
      const result = this.judger.judge(signedDelta);

      // Trigger VFX & SFX
      this.handleHitFeedback(prompt.position.x, prompt.position.y, result.rating);

      eventBus.emit('timing:judged', {
        rating: result.rating,
        deltaMs: signedDelta,
        action: prompt.action,
        character,
        position: prompt.position,
        multiplier: result.multiplier
      });

      this.reticles.splice(closestIndex, 1);
      return { rating: result.rating, deltaMs: signedDelta, multiplier: result.multiplier };
    }

    // Direct beat evaluation if no specific reticle prompt matched
    const genericJudgement = this.judger.judge(0);
    const targetX = targetPos ? targetPos.x : 240;
    const targetY = targetPos ? targetPos.y : 135;

    this.handleHitFeedback(targetX, targetY, genericJudgement.rating);

    eventBus.emit('timing:judged', {
      rating: genericJudgement.rating,
      deltaMs: 0,
      action,
      character,
      position: new Vector2(targetX, targetY),
      multiplier: genericJudgement.multiplier
    });

    return { rating: genericJudgement.rating, deltaMs: 0, multiplier: genericJudgement.multiplier };
  }

  private handleHitFeedback(x: number, y: number, rating: TimingRating): void {
    switch (rating) {
      case 'PERFECT':
        this.particleEngine.emitTextPopup(x, y - 20, 'PERFECT! +150%', '#00FFFF', 11);
        this.particleEngine.emitHitSpark(x, y, '#00FFFF', 12);
        this.particleEngine.emitShockwave(x, y, '#00FFFF');
        eventBus.emit('audio:sfx', { name: 'perfect' });
        break;
      case 'GREAT':
        this.particleEngine.emitTextPopup(x, y - 20, 'GREAT! +120%', '#FF007F', 10);
        this.particleEngine.emitHitSpark(x, y, '#FF007F', 8);
        eventBus.emit('audio:sfx', { name: 'great' });
        break;
      case 'GOOD':
        this.particleEngine.emitTextPopup(x, y - 20, 'GOOD', '#39FF14', 9);
        this.particleEngine.emitHitSpark(x, y, '#39FF14', 5);
        eventBus.emit('audio:sfx', { name: 'good' });
        break;
      case 'MISS':
        this.particleEngine.emitTextPopup(x, y - 20, 'MISS...', '#FF0055', 9);
        eventBus.emit('audio:sfx', { name: 'miss' });
        break;
    }
  }

  public update(currentTimeMs: number): void {
    for (let i = this.reticles.length - 1; i >= 0; i--) {
      const r = this.reticles[i];
      const remainingMs = r.targetTimeMs - currentTimeMs;

      // Shrink progress: from 1.0 (start of beat) down to 0.0 (exact hit beat)
      const progress = Math.max(0, remainingMs / this.shrinkDurationMs);
      r.currentRadius = r.radius + (r.initialRadius - r.radius) * progress;

      // Expired past miss window (> 110ms late)
      if (currentTimeMs - r.targetTimeMs > 110) {
        r.resolved = true;
        this.handleHitFeedback(r.position.x, r.position.y, 'MISS');
        this.reticles.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    for (const r of this.reticles) {
      if (r.resolved) continue;

      ctx.save();
      ctx.translate(Math.round(r.position.x), Math.round(r.position.y));

      // 1. Inner Target Ring (Fixed)
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (r.shape === 'CIRCLE') {
        ctx.arc(0, 0, r.radius, 0, Math.PI * 2);
      } else {
        ctx.strokeRect(-r.radius, -r.radius, r.radius * 2, r.radius * 2);
      }
      ctx.stroke();

      // 2. Outer Shrinking Reticle
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (r.shape === 'CIRCLE') {
        ctx.arc(0, 0, Math.max(r.radius, r.currentRadius), 0, Math.PI * 2);
      } else {
        const size = Math.max(r.radius, r.currentRadius);
        ctx.strokeRect(-size, -size, size * 2, size * 2);
      }
      ctx.stroke();

      // 3. Action button prompt indicator (e.g. J, K, L)
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 7px "Courier New", monospace';
      ctx.textAlign = 'center';
      const keyLabel = this.getActionKeyLabel(r.action);
      ctx.fillText(keyLabel, 0, 3);

      ctx.restore();
    }
  }

  private getActionKeyLabel(action: AttackType): string {
    switch (action) {
      case 'BLASTER_BURST': return 'J';
      case 'SLEDGEHAMMER_SMASH': return 'K';
      case 'PORTAL_PARRY': return 'L';
      case 'OVERHEAD_TOSS': return 'SPC';
      case 'SLIDE_TACKLE': return '↓+J';
      case 'AIR_DROPKICK': return '↑+J';
      case 'BROOM_SPIN': return 'I';
      default: return 'HIT';
    }
  }

  public clear(): void {
    this.reticles = [];
  }
}
