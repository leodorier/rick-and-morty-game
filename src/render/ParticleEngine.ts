export type ParticleType = 'SPARK' | 'STARBURST' | 'PORTAL_VORTEX' | 'BRINE' | 'GLITCH_VOXEL' | 'TEXT_POPUP' | 'SHOCKWAVE' | 'TRAIL';

export interface Particle {
  active: boolean;
  type: ParticleType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  drag: number;
  size: number;
  growth: number;
  angle: number;
  angularVelocity: number;
  life: number;
  maxLife: number;
  color: string;
  endColor?: string;
  text?: string;
  fontSize?: number;
  blendMode: GlobalCompositeOperation;
}

export class ParticleEngine {
  private pool: Particle[];
  private maxParticles = 600;

  constructor(maxParticles = 600) {
    this.maxParticles = maxParticles;
    this.pool = new Array(maxParticles);
    for (let i = 0; i < maxParticles; i++) {
      this.pool[i] = {
        active: false,
        type: 'SPARK',
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        gravity: 0,
        drag: 1.0,
        size: 2,
        growth: 0,
        angle: 0,
        angularVelocity: 0,
        life: 0,
        maxLife: 1.0,
        color: '#FFFFFF',
        blendMode: 'source-over'
      };
    }
  }

  public emit(config: Partial<Particle> & { x: number; y: number }): void {
    const p = this.getFreeParticle();
    if (!p) return;

    p.active = true;
    p.type = config.type ?? 'SPARK';
    p.x = config.x;
    p.y = config.y;
    p.vx = config.vx ?? (Math.random() * 120 - 60);
    p.vy = config.vy ?? (Math.random() * 120 - 60);
    p.gravity = config.gravity ?? 0;
    p.drag = config.drag ?? 0.98;
    p.size = config.size ?? 3;
    p.growth = config.growth ?? 0;
    p.angle = config.angle ?? Math.random() * Math.PI * 2;
    p.angularVelocity = config.angularVelocity ?? (Math.random() * 4 - 2);
    p.maxLife = config.maxLife ?? 0.5;
    p.life = p.maxLife;
    p.color = config.color ?? '#00FFFF';
    p.endColor = config.endColor;
    p.text = config.text;
    p.fontSize = config.fontSize ?? 10;
    p.blendMode = config.blendMode ?? (p.type === 'PORTAL_VORTEX' || p.type === 'STARBURST' ? 'lighter' : 'source-over');
  }

  public emitHitSpark(x: number, y: number, color = '#FFFF00', count = 8): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
      const speed = Math.random() * 140 + 80;
      this.emit({
        type: 'STARBURST',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 2,
        maxLife: 0.25,
        color,
        drag: 0.92,
        blendMode: 'lighter'
      });
    }
  }

  public emitPortalBurst(x: number, y: number, count = 16): void {
    const portalColors = ['#00FFFF', '#39FF14', '#E8FFD7', '#120024'];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = Math.random() * 180 + 60;
      this.emit({
        type: 'PORTAL_VORTEX',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 3,
        maxLife: 0.6,
        color: portalColors[i % portalColors.length],
        angularVelocity: 6.0,
        drag: 0.94,
        blendMode: 'lighter'
      });
    }
  }

  public emitTextPopup(x: number, y: number, text: string, color = '#00FFFF', size = 12): void {
    this.emit({
      type: 'TEXT_POPUP',
      x,
      y,
      vx: (Math.random() - 0.5) * 20,
      vy: -70, // Floats upward
      drag: 0.96,
      gravity: -10,
      maxLife: 0.8,
      text,
      color,
      fontSize: size,
      blendMode: 'source-over'
    });
  }

  public emitGlitchVoxels(x: number, y: number, count = 10): void {
    const colors = ['#6BDF38', '#41E502', '#15DA17', '#081820', '#FF0055'];
    for (let i = 0; i < count; i++) {
      this.emit({
        type: 'GLITCH_VOXEL',
        x: x + (Math.random() * 40 - 20),
        y: y + (Math.random() * 40 - 20),
        vx: (Math.random() - 0.5) * 60,
        vy: -Math.random() * 80 - 20,
        size: Math.random() * 6 + 3,
        maxLife: 0.45,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  public emitShockwave(x: number, y: number, color = '#39FF14'): void {
    this.emit({
      type: 'SHOCKWAVE',
      x,
      y,
      vx: 0,
      vy: 0,
      size: 4,
      growth: 90,
      maxLife: 0.35,
      color,
      blendMode: 'lighter'
    });
  }

  public update(dtSec: number): void {
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.pool[i];
      if (!p.active) continue;

      p.life -= dtSec;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }

      p.vy += p.gravity * dtSec;
      p.vx *= Math.pow(p.drag, dtSec * 60);
      p.vy *= Math.pow(p.drag, dtSec * 60);

      p.x += p.vx * dtSec;
      p.y += p.vy * dtSec;

      p.size += p.growth * dtSec;
      p.angle += p.angularVelocity * dtSec;
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const prevComposite = ctx.globalCompositeOperation;
    const prevAlpha = ctx.globalAlpha;

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.pool[i];
      if (!p.active) continue;

      const progress = p.life / p.maxLife; // 1.0 -> 0.0
      ctx.globalAlpha = Math.max(0, Math.min(1, progress));
      ctx.globalCompositeOperation = p.blendMode;

      ctx.save();
      ctx.translate(Math.round(p.x), Math.round(p.y));

      switch (p.type) {
        case 'TEXT_POPUP':
          if (p.text) {
            ctx.fillStyle = '#000000';
            ctx.font = `bold ${p.fontSize ?? 10}px "Courier New", monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(p.text, 1, 1); // Shadow

            ctx.fillStyle = p.color;
            ctx.fillText(p.text, 0, 0);
          }
          break;

        case 'STARBURST':
          ctx.rotate(p.angle);
          ctx.fillStyle = p.color;
          const half = p.size;
          // Draw 4-point pixel star
          ctx.fillRect(-half, -1, half * 2, 2);
          ctx.fillRect(-1, -half, 2, half * 2);
          break;

        case 'PORTAL_VORTEX':
          ctx.rotate(p.angle);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 1.5);
          ctx.stroke();
          break;

        case 'SHOCKWAVE':
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.stroke();
          break;

        case 'GLITCH_VOXEL':
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          break;

        default: // SPARK & BRINE
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          break;
      }

      ctx.restore();
    }

    ctx.globalAlpha = prevAlpha;
    ctx.globalCompositeOperation = prevComposite;
  }

  public clear(): void {
    for (let i = 0; i < this.maxParticles; i++) {
      this.pool[i].active = false;
    }
  }

  private getFreeParticle(): Particle | null {
    for (let i = 0; i < this.maxParticles; i++) {
      if (!this.pool[i].active) {
        return this.pool[i];
      }
    }
    return null;
  }
}
