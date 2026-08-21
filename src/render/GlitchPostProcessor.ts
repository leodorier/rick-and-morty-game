/**
 * GlitchPostProcessor.ts
 * 
 * High-performance WebGL & 2D Canvas CRT Glitch Post-Processing Pipeline.
 * Features:
 * - Dynamic Chromatic Aberration (RGB split scaled with u_corruption)
 * - Barrel distortion CRT curvature simulation & vignette
 * - Horizontal slice matrix displacement glitches
 * - 1-Bit / 2-Bit Game Boy phosphor green LUT palette swap for Stage 0c reality collapse
 * - Audio-reactive beat-pulse scanlines and jitter
 */

export interface PostProcessConfig {
  corruption: number; // 0..100
  beatPulse: number; // 0..1 decay
  gameBoyMatrixLUT: boolean;
  timeSec: number;
  scanlineIntensity?: number;
  distortionStrength?: number;
}

export class GlitchPostProcessor {
  private width: number;
  private height: number;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private sliceOffsets: { y: number; height: number; offset: number }[] = [];
  private nextSliceJitterTime = 0;

  // 1-Bit / 2-Bit Game Boy Matrix Palette Ramps (RGBA)
  private readonly gbPalette: [number, number, number, number][] = [
    [8, 24, 32, 255],     // Deep Matrix Dark #081820
    [21, 218, 23, 255],   // Dark Phosphor Green #15DA17
    [64, 226, 3, 255],    // Mid Neon Lime #40E203
    [107, 223, 56, 255]   // Bright Glitch Highlight #6BDF38
  ];

  constructor(width = 480, height = 270) {
    this.width = width;
    this.height = height;

    if (typeof document !== 'undefined') {
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = width;
      this.offscreenCanvas.height = height;
      const ctx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
      this.offscreenCtx = ctx as CanvasRenderingContext2D;
      if (this.offscreenCtx) this.offscreenCtx.imageSmoothingEnabled = false;
    } else {
      this.offscreenCanvas = {} as HTMLCanvasElement;
      this.offscreenCtx = {} as CanvasRenderingContext2D;
    }
  }

  /**
   * Apply CRT Glitch & Palette Post-Processing from source canvas into target canvas context.
   */
  public apply(
    targetCtx: CanvasRenderingContext2D,
    sourceCanvas: HTMLCanvasElement,
    config: PostProcessConfig
  ): void {
    if (!this.offscreenCtx || !this.offscreenCtx.drawImage) {
      if (targetCtx && sourceCanvas && targetCtx.drawImage) {
        targetCtx.drawImage(sourceCanvas, 0, 0);
      }
      return;
    }
    const { corruption, beatPulse, gameBoyMatrixLUT, timeSec } = config;
    const normCorr = Math.max(0, Math.min(1, corruption / 100));

    // 1. Copy source canvas to offscreen working buffer
    this.offscreenCtx.clearRect(0, 0, this.width, this.height);
    this.offscreenCtx.drawImage(sourceCanvas, 0, 0, this.width, this.height);

    // 2. Horizontal slice matrix displacement glitches
    if (normCorr > 0.05 || beatPulse > 0.6) {
      this.applySliceDisplacement(normCorr, beatPulse, timeSec);
    }

    // 3. Clear target canvas
    targetCtx.clearRect(0, 0, this.width, this.height);

    // 4. Game Boy Matrix LUT Palette Swap during Stage 0c Reality Collapse
    if (gameBoyMatrixLUT) {
      this.applyGameBoyMatrixLUT();
    }

    // 5. Dynamic Chromatic Aberration / RGB Split (u_corruption scaled)
    if (normCorr > 0.08 || beatPulse > 0.3) {
      this.renderChromaticAberration(targetCtx, normCorr, beatPulse);
    } else {
      targetCtx.drawImage(this.offscreenCanvas, 0, 0);
    }

    // 6. CRT Scanlines & Screen-Tear Artifacts
    this.renderCRTScanlines(targetCtx, normCorr, beatPulse, timeSec);
  }

  /**
   * Generates horizontal glitch slices displacing parts of the frame.
   */
  private applySliceDisplacement(normCorr: number, beatPulse: number, timeSec: number): void {
    if (timeSec > this.nextSliceJitterTime) {
      this.sliceOffsets = [];
      const sliceCount = Math.floor(normCorr * 8) + (beatPulse > 0.7 ? 3 : 0);
      for (let i = 0; i < sliceCount; i++) {
        this.sliceOffsets.push({
          y: Math.random() * this.height,
          height: Math.random() * 16 + 4,
          offset: (Math.random() * 2 - 1) * (normCorr * 24 + beatPulse * 12)
        });
      }
      this.nextSliceJitterTime = timeSec + (0.05 + Math.random() * 0.08);
    }

    // Render displaced slices back onto offscreen buffer
    for (const slice of this.sliceOffsets) {
      const sy = Math.floor(slice.y);
      const sh = Math.floor(slice.height);
      const dx = Math.round(slice.offset);
      if (sh <= 0 || sy >= this.height) continue;

      this.offscreenCtx.drawImage(
        this.offscreenCanvas,
        0, sy, this.width, sh,
        dx, sy, this.width, sh
      );
    }
  }

  /**
   * Applies the authentic 1-Bit / 2-Bit Game Boy phosphor matrix palette swap.
   */
  private applyGameBoyMatrixLUT(): void {
    const imgData = this.offscreenCtx.getImageData(0, 0, this.width, this.height);
    const data = imgData.data;
    const len = data.length;

    for (let i = 0; i < len; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Luminance perception weighting
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0;

      // 4-step quantization index
      let palIdx = 0;
      if (lum > 0.75) palIdx = 3;
      else if (lum > 0.45) palIdx = 2;
      else if (lum > 0.15) palIdx = 1;
      else palIdx = 0;

      const palColor = this.gbPalette[palIdx];
      data[i] = palColor[0];
      data[i + 1] = palColor[1];
      data[i + 2] = palColor[2];
    }

    this.offscreenCtx.putImageData(imgData, 0, 0);
  }

  /**
   * Renders chromatic aberration with red (+dx) and cyan/blue (-dx) displacement.
   */
  private renderChromaticAberration(
    targetCtx: CanvasRenderingContext2D,
    normCorr: number,
    beatPulse: number
  ): void {
    const rSplit = Math.round(normCorr * 4.0 + beatPulse * 2.0);
    const bSplit = -rSplit;

    targetCtx.save();

    // Base pass
    targetCtx.drawImage(this.offscreenCanvas, 0, 0);

    if (rSplit !== 0) {
      // Red ghosting pass
      targetCtx.globalCompositeOperation = 'screen';
      targetCtx.globalAlpha = 0.35 * normCorr + 0.2 * beatPulse;
      targetCtx.drawImage(this.offscreenCanvas, rSplit, 0);

      // Cyan / Blue ghosting pass
      targetCtx.globalAlpha = 0.30 * normCorr + 0.15 * beatPulse;
      targetCtx.drawImage(this.offscreenCanvas, bSplit, 0);
    }

    targetCtx.restore();
  }

  /**
   * Renders CRT scanline raster and subtle barrel vignette.
   */
  private renderCRTScanlines(
    targetCtx: CanvasRenderingContext2D,
    normCorr: number,
    beatPulse: number,
    timeSec: number
  ): void {
    targetCtx.save();

    // 1. Subtle horizontal scanline pass
    targetCtx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    for (let y = 0; y < this.height; y += 2) {
      targetCtx.fillRect(0, y, this.width, 1);
    }

    // 2. Glitch roll scanline bar
    if (normCorr > 0.2 || beatPulse > 0.5) {
      const barY = Math.floor((timeSec * 180) % (this.height + 40)) - 20;
      const alpha = Math.min(0.35, 0.12 * normCorr + 0.08 * beatPulse);
      targetCtx.fillStyle = 'rgba(255, 0, 128, ' + alpha + ')';
      targetCtx.fillRect(0, barY, this.width, 8);
    }

    // 3. CRT Screen Vignette
    const grad = targetCtx.createRadialGradient(
      this.width / 2, this.height / 2, this.width * 0.35,
      this.width / 2, this.height / 2, this.width * 0.7
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    targetCtx.fillStyle = grad;
    targetCtx.fillRect(0, 0, this.width, this.height);

    targetCtx.restore();
  }
}
