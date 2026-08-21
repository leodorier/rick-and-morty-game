export type StageId =
  | 'PROLOGUE_DINING'
  | 'WASTELAND_WAVES'
  | 'BOSS_1_RICK_CAR'
  | 'INTERLUDE_BUTTER_BOTS'
  | 'BOSS_2_STEELY_MOP'
  | 'BOSS_3_TOILET_THRONE'
  | 'VICTORY';

export class SceneManager {
  public currentStage: StageId = 'PROLOGUE_DINING';
  public stageTimer = 0;
  public cameraX = 0;

  private bgImages: Map<string, HTMLImageElement> = new Map();

  constructor() {
    this.preloadBackgrounds();
  }

  private preloadBackgrounds(): void {
    if (typeof Image === 'undefined') return;

    const stages = [
      { key: 'dining', src: '/assets/backgrounds/stage0_dining_mutation_1787350166355_480x270.png' },
      { key: 'wasteland', src: '/assets/backgrounds/stage1_corrupted_wasteland_1787350175145_480x270.png' },
      { key: 'toilet_glade', src: '/assets/backgrounds/boss3_toilet_throne_glade_1787350185464_480x270.png' }
    ];

    for (const s of stages) {
      const img = new Image();
      img.src = s.src;
      this.bgImages.set(s.key, img);
    }
  }

  public setStage(stage: StageId): void {
    this.currentStage = stage;
    this.stageTimer = 0;
  }

  public update(dtSec: number): void {
    this.stageTimer += dtSec;
    this.cameraX += dtSec * 15; // Slow ambient parallax scroll
  }

  public renderBackground(ctx: CanvasRenderingContext2D, width = 480, height = 270, corruption = 0): void {
    let bgImg: HTMLImageElement | undefined;

    switch (this.currentStage) {
      case 'PROLOGUE_DINING':
        bgImg = this.bgImages.get('dining');
        break;
      case 'WASTELAND_WAVES':
      case 'BOSS_1_RICK_CAR':
      case 'INTERLUDE_BUTTER_BOTS':
      case 'BOSS_2_STEELY_MOP':
        bgImg = this.bgImages.get('wasteland');
        break;
      case 'BOSS_3_TOILET_THRONE':
      case 'VICTORY':
        bgImg = this.bgImages.get('toilet_glade');
        break;
    }

    if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
      ctx.drawImage(bgImg, 0, 0, width, height);
    } else {
      // High quality procedural background fallback
      this.renderProceduralBackground(ctx, width, height);
    }

    // Dynamic Glitch Shader / Scanline Overlay
    if (corruption > 20) {
      this.applyGlitchEffect(ctx, width, height, corruption);
    }
  }

  private renderProceduralBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Deep purple cosmic twilight
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#070B19');
    skyGrad.addColorStop(0.6, '#21285E');
    skyGrad.addColorStop(1, '#322744');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Neon Aurora Ribbon
    ctx.strokeStyle = 'rgba(0, 245, 212, 0.25)';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(0, 80 + Math.sin(this.cameraX * 0.05) * 20);
    ctx.bezierCurveTo(160, 40, 320, 120, 480, 70);
    ctx.stroke();

    // Pickled Rick Specimen Jars (Midground)
    ctx.fillStyle = '#0F2027';
    ctx.fillRect(80 - (this.cameraX * 0.4) % 480, 110, 40, 70);
    ctx.fillStyle = 'rgba(112, 255, 0, 0.4)';
    ctx.fillRect(84 - (this.cameraX * 0.4) % 480, 115, 32, 60);

    // Foreground Terrain
    ctx.fillStyle = '#1A1423';
    ctx.fillRect(0, 190, width, 80);
    ctx.fillStyle = '#A370F7';
    ctx.fillRect(0, 188, width, 2);
  }

  private applyGlitchEffect(ctx: CanvasRenderingContext2D, width: number, height: number, corruption: number): void {
    const intensity = (corruption - 20) / 80;
    const tearCount = Math.floor(intensity * 6);

    for (let i = 0; i < tearCount; i++) {
      const tearY = Math.random() * height;
      const tearH = Math.random() * 8 + 4;
      const shiftX = (Math.random() - 0.5) * (intensity * 24);

      try {
        const slice = ctx.getImageData(0, Math.floor(tearY), width, Math.floor(tearH));
        ctx.putImageData(slice, Math.floor(shiftX), Math.floor(tearY));
      } catch {
        // Fallback for tainted canvas
      }
    }
  }
}
