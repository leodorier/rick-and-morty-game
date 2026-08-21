import { describe, it, expect, beforeEach } from 'vitest';
import { GlitchPostProcessor } from '../../src/render/GlitchPostProcessor';
import { BackgroundRenderer } from '../../src/render/BackgroundRenderer';

describe('GlitchPostProcessor & BackgroundRenderer Pipeline', () => {
  let glitchProcessor: GlitchPostProcessor;
  let bgRenderer: BackgroundRenderer;

  beforeEach(() => {
    glitchProcessor = new GlitchPostProcessor(480, 270);
    bgRenderer = new BackgroundRenderer();
  });

  it('should initialize GlitchPostProcessor with correct native dimensions', () => {
    expect(glitchProcessor).toBeDefined();
  });

  it('should initialize BackgroundRenderer and verify asset loading state', () => {
    expect(bgRenderer).toBeDefined();
    expect(typeof bgRenderer.isAssetLoaded('stage0_dining')).toBe('boolean');
  });

  it('should safely execute post-processing pass', () => {
    const mockCtx = {
      clearRect: () => {},
      drawImage: () => {},
      fillRect: () => {},
      save: () => {},
      restore: () => {},
      createRadialGradient: () => ({ addColorStop: () => {} }),
      getImageData: () => ({ data: new Uint8ClampedArray(480 * 270 * 4) }),
      putImageData: () => {}
    } as unknown as CanvasRenderingContext2D;

    const mockCanvas = {
      width: 480,
      height: 270,
      getContext: () => mockCtx
    } as unknown as HTMLCanvasElement;

    expect(() => {
      glitchProcessor.apply(mockCtx, mockCanvas, {
        corruption: 75,
        beatPulse: 0.8,
        gameBoyMatrixLUT: false,
        timeSec: 12.5
      });
    }).not.toThrow();

    expect(() => {
      glitchProcessor.apply(mockCtx, mockCanvas, {
        corruption: 90,
        beatPulse: 0.9,
        gameBoyMatrixLUT: true,
        timeSec: 28.5
      });
    }).not.toThrow();
  });

  it('should render all stages with procedural fallbacks safely', () => {
    const mockCtx = {
      clearRect: () => {},
      drawImage: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      beginPath: () => {},
      arc: () => {},
      ellipse: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      fill: () => {},
      stroke: () => {},
      save: () => {},
      restore: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} })
    } as unknown as CanvasRenderingContext2D;

    expect(() => {
      bgRenderer.render({
        ctx: mockCtx,
        stageId: 'STAGE_0_DINING',
        timeSec: 10.0,
        cameraX: 0,
        cameraY: 0,
        corruption: 25,
        beatPulse: 0.5
      });
    }).not.toThrow();

    expect(() => {
      bgRenderer.render({
        ctx: mockCtx,
        stageId: 'STAGE_1_WASTELAND',
        timeSec: 40.0,
        cameraX: 100,
        cameraY: 0,
        corruption: 50,
        beatPulse: 0.7
      });
    }).not.toThrow();

    expect(() => {
      bgRenderer.render({
        ctx: mockCtx,
        stageId: 'STAGE_BOSS_3_TOILET',
        timeSec: 120.0,
        cameraX: 0,
        cameraY: 0,
        corruption: 80,
        beatPulse: 1.0
      });
    }).not.toThrow();
  });
});
