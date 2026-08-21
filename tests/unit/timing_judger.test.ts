import { describe, it, expect } from 'vitest';
import { TimingJudger } from '../../src/rhythm/TimingJudger';

describe('TimingJudger Rhythm System', () => {
  const judger = new TimingJudger();

  it('should correctly judge PERFECT hits (<= 35ms)', () => {
    const resExact = judger.judge(0);
    expect(resExact.rating).toBe('PERFECT');
    expect(resExact.multiplier).toBe(1.5);
    expect(resExact.damageBonus).toBe(0.5);
    expect(resExact.comboIncrement).toBe(2);

    const resPositive = judger.judge(34.9);
    expect(resPositive.rating).toBe('PERFECT');

    const resNegative = judger.judge(-35.0);
    expect(resNegative.rating).toBe('PERFECT');
  });

  it('should correctly judge GREAT hits (>35ms and <= 70ms)', () => {
    const res1 = judger.judge(45.0);
    expect(res1.rating).toBe('GREAT');
    expect(res1.multiplier).toBe(1.2);
    expect(res1.comboIncrement).toBe(1);

    const res2 = judger.judge(-69.5);
    expect(res2.rating).toBe('GREAT');
  });

  it('should correctly judge GOOD hits (>70ms and <= 110ms)', () => {
    const res1 = judger.judge(85.0);
    expect(res1.rating).toBe('GOOD');
    expect(res1.multiplier).toBe(1.0);
    expect(res1.comboIncrement).toBe(1);

    const res2 = judger.judge(-109.9);
    expect(res2.rating).toBe('GOOD');
  });

  it('should correctly judge MISS for deltas > 110ms', () => {
    const res1 = judger.judge(115.0);
    expect(res1.rating).toBe('MISS');
    expect(res1.multiplier).toBe(0.0);
    expect(res1.damageBonus).toBe(-1.0);
    expect(res1.comboIncrement).toBe(0);
    expect(res1.corruptionDelta).toBe(5.0);

    const res2 = judger.judge(-200.0);
    expect(res2.rating).toBe('MISS');
  });

  it('should evaluate timestamp differences accurately', () => {
    const targetTimeMs = 1846.15;
    const inputTimeMs = 1860.0; // +13.85ms delta -> PERFECT

    const result = judger.judgeTimestamp(inputTimeMs, targetTimeMs);
    expect(result.rating).toBe('PERFECT');
    expect(result.deltaMs).toBeCloseTo(13.85, 2);
  });

  it('should validate hit window checks', () => {
    expect(judger.isValidHit(30)).toBe(true);
    expect(judger.isValidHit(100)).toBe(true);
    expect(judger.isValidHit(120)).toBe(false);
  });
});
