/**
 * BackgroundRenderer.ts
 * 
 * Manages 16-bit background parallax layers, sprite layer caching,
 * dynamic stage transitions (Smith Dining Room -> Wasteland -> Toilet Throne),
 * and robust procedural fallbacks for all stages.
 */

export type StageId = 'STAGE_0_DINING' | 'STAGE_1_WASTELAND' | 'STAGE_BOSS_1_CAR' | 'STAGE_BOSS_2_MOP' | 'STAGE_BOSS_3_TOILET';

export interface BackgroundRenderContext {
  ctx: CanvasRenderingContext2D;
  stageId: StageId;
  timeSec: number;
  cameraX: number;
  cameraY: number;
  corruption: number; // 0..100
  beatPulse: number; // 0..1
  width?: number;
  height?: number;
}

export class BackgroundRenderer {
  private images: Map<string, HTMLImageElement> = new Map();
  private loaded: Map<string, boolean> = new Map();

  constructor() {
    this.preloadImages();
  }

  private preloadImages(): void {
    const assets: Record<string, string[]> = {
      'stage0_dining': [
        './assets/images/stage0_dining.png',
        './assets/backgrounds/stage0_dining.png',
        '/assets/images/stage0_dining.png'
      ],
      'stage1_wasteland': [
        './assets/images/stage1_wasteland.png',
        './assets/backgrounds/stage1_wasteland.png',
        '/assets/images/stage1_wasteland.png'
      ],
      'boss3_toilet_glade': [
        './assets/images/boss3_toilet_glade.png',
        './assets/backgrounds/boss3_toilet_glade.png',
        '/assets/images/boss3_toilet_glade.png'
      ]
    };

    if (typeof Image === 'undefined') return;

    for (const [key, paths] of Object.entries(assets)) {
      const img = new Image();
      img.onload = () => {
        this.loaded.set(key, true);
      };
      img.onerror = () => {
        if (paths.length > 1) {
          img.src = paths[1];
        } else {
          console.warn(`[BackgroundRenderer] Asset failed to load: ${key}, using procedural fallback.`);
        }
      };
      img.src = paths[0];
      this.images.set(key, img);
    }
  }

  public isAssetLoaded(key: string): boolean {
    return this.loaded.get(key) === true;
  }

  public render(renderCtx: BackgroundRenderContext): void {
    const { ctx, stageId, timeSec, cameraX, corruption } = renderCtx;
    const width = renderCtx.width ?? 480;
    const height = renderCtx.height ?? 270;

    switch (stageId) {
      case 'STAGE_0_DINING':
        this.renderStage0Dining(ctx, timeSec, corruption, width, height);
        break;
      case 'STAGE_1_WASTELAND':
      case 'STAGE_BOSS_1_CAR':
      case 'STAGE_BOSS_2_MOP':
        this.renderStage1Wasteland(ctx, timeSec, cameraX, width, height);
        break;
      case 'STAGE_BOSS_3_TOILET':
        this.renderBoss3ToiletGlade(ctx, width, height);
        break;
      default:
        this.renderStage1Wasteland(ctx, timeSec, cameraX, width, height);
        break;
    }
  }

  /**
   * Stage 0: Smith Family Dining Room & Parasite Mutation
   */
  private renderStage0Dining(
    ctx: CanvasRenderingContext2D,
    timeSec: number,
    corruption: number,
    width: number,
    height: number
  ): void {
    const img = this.images.get('stage0_dining');
    if (img && this.loaded.get('stage0_dining')) {
      ctx.drawImage(img, 0, 0, width, height);
    } else {
      ctx.fillStyle = '#F4E3BC'; // Beige wall
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#BEA073';
      ctx.fillRect(0, height - 100, width, 100);

      ctx.fillStyle = '#8C6239';
      ctx.fillRect(0, height - 40, width, 40);

      ctx.fillStyle = '#A0CFB0';
      ctx.fillRect(20, 20, 90, 110);
      ctx.fillStyle = '#72ECE9';
      ctx.fillRect(30, 30, 70, 90);

      ctx.fillStyle = '#C29D0B';
      ctx.fillRect(160, 30, 80, 55);
      ctx.fillStyle = '#8BAC0F';
      ctx.fillRect(165, 35, 70, 45);
    }

    if (corruption > 5) {
      const normCorr = corruption / 100;
      ctx.save();
      const tearWidth = Math.floor(width * (0.35 + normCorr * 0.45));
      const tearX = width - tearWidth;

      ctx.fillStyle = '#081820';
      ctx.fillRect(tearX, 0, tearWidth, height);

      ctx.fillStyle = '#D800B8';
      const wave = Math.sin(timeSec * 6) * 15;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(tearX + 40 + i * 35, 80 + i * 25 + wave, 20 + i * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFE57F';
        ctx.beginPath();
        ctx.arc(tearX + 40 + i * 35, 80 + i * 25 + wave, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FF0055';
        ctx.beginPath();
        ctx.arc(tearX + 40 + i * 35, 80 + i * 25 + wave, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#D800B8';
      }

      ctx.restore();
    }
  }

  /**
   * Stage 1: Corrupted Simulation Wasteland & Pickled Rick Jars
   */
  private renderStage1Wasteland(
    ctx: CanvasRenderingContext2D,
    timeSec: number,
    cameraX: number,
    width: number,
    height: number
  ): void {
    const img = this.images.get('stage1_wasteland');
    if (img && this.loaded.get('stage1_wasteland')) {
      const parallaxOffset = (cameraX * 0.25) % width;
      ctx.drawImage(img, -parallaxOffset, 0, width, height);
      if (parallaxOffset > 0) {
        ctx.drawImage(img, width - parallaxOffset, 0, width, height);
      }
    } else {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#070B19');
      skyGrad.addColorStop(0.5, '#21285E');
      skyGrad.addColorStop(1, '#463B54');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = 'rgba(0, 245, 212, 0.25)';
      ctx.beginPath();
      ctx.moveTo(0, 40);
      for (let x = 0; x <= width; x += 40) {
        ctx.lineTo(x, 40 + Math.sin(x * 0.02 + timeSec * 2) * 15);
      }
      ctx.lineTo(width, 100);
      ctx.lineTo(0, 100);
      ctx.closePath();
      ctx.fill();

      for (let i = 0; i < 3; i++) {
        const jarX = (i * 180 - cameraX * 0.5 + width * 2) % (width + 120) - 60;
        ctx.fillStyle = 'rgba(184, 242, 230, 0.4)';
        ctx.fillRect(jarX, 60, 50, 100);
        ctx.strokeStyle = '#00DF68';
        ctx.lineWidth = 2;
        ctx.strokeRect(jarX, 60, 50, 100);

        ctx.fillStyle = '#70FF00';
        ctx.beginPath();
        ctx.ellipse(jarX + 25, 110 + Math.sin(timeSec * 3 + i) * 5, 12, 30, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#6B3B58';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 30) {
        ctx.lineTo(x, height - 45 + Math.sin(x * 0.05) * 8);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
    }
  }

  /**
   * Boss 3 Arena: Sacred Toilet Throne Glade
   */
  private renderBoss3ToiletGlade(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    const img = this.images.get('boss3_toilet_glade');
    if (img && this.loaded.get('boss3_toilet_glade')) {
      ctx.drawImage(img, 0, 0, width, height);
    } else {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#1D002B');
      skyGrad.addColorStop(0.4, '#8B008B');
      skyGrad.addColorStop(0.8, '#FF84B7');
      skyGrad.addColorStop(1, '#FFAA00');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = 'rgba(255, 255, 204, 0.35)';
      ctx.beginPath();
      ctx.moveTo(width / 2 - 30, 0);
      ctx.lineTo(width / 2 + 30, 0);
      ctx.lineTo(width / 2 + 60, height);
      ctx.lineTo(width / 2 - 60, height);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#00FFFF';
      ctx.fillRect(20, 40, 60, 120);
      ctx.fillStyle = '#FF007F';
      ctx.fillRect(width - 80, 50, 60, 110);

      ctx.fillStyle = '#334155';
      ctx.fillRect(0, height - 60, width, 60);
    }
  }
}
