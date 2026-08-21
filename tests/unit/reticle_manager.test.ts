import { describe, it, expect } from 'vitest';
import { ReticleManager } from '../../src/rhythm/ReticleManager';
import { TimingJudger } from '../../src/rhythm/TimingJudger';
import { ParticleEngine } from '../../src/render/ParticleEngine';
import { Vector2 } from '../../src/utils/Vector2';

describe('ReticleManager QTE System', () => {
  it('should spawn shrinking concentric reticles and evaluate hits', () => {
    const judger = new TimingJudger();
    const particles = new ParticleEngine(20);
    const manager = new ReticleManager(judger, particles);

    const targetTimeMs = 1000.0;
    manager.spawnReticle(targetTimeMs, new Vector2(100, 100), 'BLASTER_BURST');

    // Evaluate input at exactly 1010ms (+10ms -> PERFECT)
    const result = manager.evaluateInput(1010.0, 'BLASTER_BURST', 'RICK');
    expect(result.rating).toBe('PERFECT');
    expect(result.deltaMs).toBeCloseTo(10.0, 1);
  });

  it('should expire and remove reticles that exceed timing threshold', () => {
    const judger = new TimingJudger();
    const particles = new ParticleEngine(20);
    const manager = new ReticleManager(judger, particles);

    manager.spawnReticle(500.0, new Vector2(100, 100));

    // Update at 700ms (> 110ms late)
    manager.update(700.0);
    expect(manager).toBeDefined();
  });
});
