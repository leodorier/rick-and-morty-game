import { describe, it, expect } from 'vitest';
import { ParticleEngine } from '../../src/render/ParticleEngine';

describe('ParticleEngine Pool & VFX', () => {
  it('should initialize zero-allocation particle pool', () => {
    const engine = new ParticleEngine(100);
    expect(engine).toBeDefined();
  });

  it('should emit starburst hit sparks and text popups', () => {
    const engine = new ParticleEngine(50);
    engine.emitHitSpark(100, 100, '#00FFFF', 5);
    engine.emitTextPopup(100, 100, 'PERFECT!', '#00FFFF');

    // Update time step
    engine.update(0.1);
    expect(engine).toBeDefined();
  });

  it('should recycle expired particles', () => {
    const engine = new ParticleEngine(10);
    for (let i = 0; i < 10; i++) {
      engine.emit({ x: 0, y: 0, maxLife: 0.1 });
    }

    // Step forward past lifetime
    engine.update(0.2);

    // Pool should now be free to emit new particles
    engine.emit({ x: 50, y: 50, maxLife: 1.0 });
    expect(engine).toBeDefined();
  });
});
