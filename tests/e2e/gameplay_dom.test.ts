// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Game } from '../../src/core/Game';
import { eventBus } from '../../src/core/EventBus';

describe('Game E2E Simulation & Integration Test (DOM Environment)', () => {
  let canvas: HTMLCanvasElement;
  let game: Game;

  beforeEach(() => {
    eventBus.clear();
    document.body.innerHTML = `
      <div id="arcade-cabinet">
        <div id="screen-container">
          <canvas id="game-canvas" width="480" height="270"></canvas>
        </div>
      </div>
    `;

    canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    // Mock 2D context methods on canvas for happy-dom
    const mockCtx = {
      canvas,
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      measureText: vi.fn(() => ({ width: 50 })),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      ellipse: vi.fn(),
      bezierCurveTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      setTransform: vi.fn(),
      resetTransform: vi.fn(),
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(100) })),
      putImageData: vi.fn(),
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn()
      })),
      globalAlpha: 1.0,
      globalCompositeOperation: 'source-over',
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      font: '10px monospace',
      textAlign: 'left',
      shadowColor: 'transparent',
      shadowBlur: 0,
      imageSmoothingEnabled: false
    } as unknown as CanvasRenderingContext2D;

    canvas.getContext = vi.fn().mockReturnValue(mockCtx);

    // Mock AudioContext
    const mockAudioContext = {
      currentTime: 0,
      sampleRate: 44100,
      destination: {},
      createGain: () => ({
        gain: { value: 1, setValueAtTime: vi.fn() },
        connect: vi.fn()
      }),
      createBiquadFilter: () => ({
        type: 'lowpass',
        frequency: { value: 20000, setValueAtTime: vi.fn() },
        connect: vi.fn()
      }),
      createBufferSource: () => ({
        buffer: null,
        loop: false,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        disconnect: vi.fn()
      }),
      createBuffer: (channels: number, length: number) => {
        const channelData = new Float32Array(length);
        return {
          length,
          numberOfChannels: channels,
          sampleRate: 44100,
          getChannelData: () => channelData
        };
      },
      createOscillator: () => ({
        type: 'square',
        frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn()
      })
    };

    (window as any).AudioContext = vi.fn().mockImplementation(() => mockAudioContext);

    game = new Game(canvas);
  });

  it('mounts canvas and initializes with TITLE state', () => {
    expect(game).toBeDefined();
    expect(game.state).toBe('TITLE');
    expect(game.canvas.width).toBe(480);
    expect(game.canvas.height).toBe(270);
    expect(game.beatClock.bpm).toBe(130.0);
  });

  it('starts simulation on user action and sets state to PLAYING', async () => {
    await game.startGame();

    expect(game.state).toBe('PLAYING');
    expect(game.rick.health).toBe(100);
    expect(game.morty.health).toBe(80);
    expect(game.sceneManager.currentStage).toBe('PROLOGUE_DINING');
  });

  it('handles movement and attack keyboard events', async () => {
    await game.startGame();

    // 1. Move Rick Right
    const initialX = game.rick.position.x;
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD' }));
    game.update(0.1);
    expect(game.rick.position.x).toBeGreaterThan(initialX);
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyD' }));
    game.update(0.1);

    // 2. Trigger Blaster Shot (J)
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyJ' }));
    game.update(0.05);
    expect(game.rick.state).toBe('BLASTER');
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyJ' }));
    game.update(0.3); // Wait for blaster state to finish

    // 3. Trigger Sledgehammer Smash (K)
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyK' }));
    game.update(0.05);
    expect(game.rick.state).toBe('HAMMER');
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyK' }));
    game.update(0.5); // Wait for hammer state to finish

    // 4. Trigger Portal Parry (L)
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyL' }));
    game.update(0.05);
    expect(game.rick.state).toBe('PARRY');
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyL' }));
    game.update(0.4);

    // 5. Trigger Morty Broom Spin Assist (I)
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyI' }));
    game.update(0.05);
    expect(game.morty.state).toBe('BROOM_SPIN');
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyI' }));
  });

  it('orchestrates boss spawning and stage progression over time', async () => {
    await game.startGame();

    // Fast-forward to Boss 1 (Rick-Car at 65s)
    game.beatClock.start(65.0);
    game.update(0.1);

    expect(game.sceneManager.currentStage).toBe('BOSS_1_RICK_CAR');
    expect(game.currentBoss).not.toBeNull();
    expect(game.currentBoss?.name).toBe('THE RICK-CAR MECH');

    // Defeat Boss 1 and advance to Interlude (95s)
    if (game.currentBoss) game.currentBoss.takeDamage(300);
    game.beatClock.start(95.0);
    game.update(0.1);

    expect(game.sceneManager.currentStage).toBe('INTERLUDE_BUTTER_BOTS');

    // Advance to Boss 2 (Steely Mop at 120s)
    game.beatClock.start(120.0);
    game.update(0.1);

    expect(game.sceneManager.currentStage).toBe('BOSS_2_STEELY_MOP');
    expect(game.currentBoss?.name).toBe('STEELY MOP BOSS (NOOB-NOOB)');

    // Advance to Final Boss (Toilet Throne at 155s)
    if (game.currentBoss) game.currentBoss.takeDamage(350);
    game.beatClock.start(155.0);
    game.update(0.1);

    expect(game.sceneManager.currentStage).toBe('BOSS_3_TOILET_THRONE');
    expect(game.currentBoss?.name).toBe('THE TOILET THRONE KING (GLOOBIE)');

    // Defeat Final Boss -> Victory
    if (game.currentBoss) game.currentBoss.takeDamage(450);
    game.beatClock.start(185.0);
    game.update(0.1);

    expect(game.state).toBe('VICTORY');
  });

  it('renders frame without error across all stages', async () => {
    await game.startGame();
    expect(() => game.render()).not.toThrow();
  });
});
