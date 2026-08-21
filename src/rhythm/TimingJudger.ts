import { TimingResult, TimingWindows } from '../core/Types';

export const DEFAULT_TIMING_WINDOWS: TimingWindows = {
  perfect: 35.0,
  great: 70.0,
  good: 110.0,
  miss: 110.1
};

export class TimingJudger {
  private windows: TimingWindows;

  constructor(windows: TimingWindows = DEFAULT_TIMING_WINDOWS) {
    this.windows = { ...windows };
  }

  /**
   * Evaluates delta in milliseconds between input time and expected beat/prompt time.
   * @param deltaMs Signed or unsigned difference in milliseconds
   */
  public judge(deltaMs: number): TimingResult {
    const absDelta = Math.abs(deltaMs);

    if (absDelta <= this.windows.perfect) {
      return {
        rating: 'PERFECT',
        deltaMs,
        multiplier: 1.5,
        damageBonus: 0.5, // +50% extra damage
        comboIncrement: 2,
        corruptionDelta: -3.0 // purges simulation corruption
      };
    }

    if (absDelta <= this.windows.great) {
      return {
        rating: 'GREAT',
        deltaMs,
        multiplier: 1.2,
        damageBonus: 0.2, // +20% extra damage
        comboIncrement: 1,
        corruptionDelta: -1.5
      };
    }

    if (absDelta <= this.windows.good) {
      return {
        rating: 'GOOD',
        deltaMs,
        multiplier: 1.0,
        damageBonus: 0.0,
        comboIncrement: 1,
        corruptionDelta: 0.0
      };
    }

    return {
      rating: 'MISS',
      deltaMs,
      multiplier: 0.0,
      damageBonus: -1.0,
      comboIncrement: 0,
      corruptionDelta: +5.0 // increases simulation glitch
    };
  }

  /**
   * Judge an action based on timestamp comparison.
   */
  public judgeTimestamp(inputTimeMs: number, targetTimeMs: number): TimingResult {
    const deltaMs = inputTimeMs - targetTimeMs;
    return this.judge(deltaMs);
  }

  /**
   * Check if a delta falls within any valid hit window (Good or better).
   */
  public isValidHit(deltaMs: number): boolean {
    return Math.abs(deltaMs) <= this.windows.good;
  }

  public getWindows(): TimingWindows {
    return { ...this.windows };
  }

  public setWindows(windows: Partial<TimingWindows>): void {
    this.windows = { ...this.windows, ...windows };
  }
}
