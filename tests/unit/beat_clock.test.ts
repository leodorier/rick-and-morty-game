import { describe, it, expect, beforeEach } from 'vitest';
import { BeatClock } from '../../src/audio/BeatClock';
import { eventBus } from '../../src/core/EventBus';

describe('BeatClock Timing & Lookahead Scheduler', () => {
  let clock: BeatClock;

  beforeEach(() => {
    eventBus.clear();
    clock = new BeatClock({ bpm: 130.0, dropTimestampSec: 47.077 });
  });

  it('should initialize with accurate 130 BPM constants', () => {
    expect(clock.bpm).toBe(130.0);
    expect(clock.beatDurationSec).toBeCloseTo(0.461538, 5);
    expect(clock.beatDurationMs).toBeCloseTo(461.54, 2);
    expect(clock.beatsPerBar).toBe(4);
  });

  it('should compute nearest beat deltas accurately', () => {
    // 1 beat = 461.538ms
    // Exact beat 0: delta = 0
    expect(clock.getNearestBeatDeltaMs(0)).toBeCloseTo(0, 2);

    // Exact beat 1: 461.54ms -> delta = 0
    expect(clock.getNearestBeatDeltaMs(461.538)).toBeCloseTo(0, 2);

    // 480ms -> +18.46ms after beat 1
    expect(clock.getNearestBeatDeltaMs(480)).toBeCloseTo(18.46, 1);

    // 440ms -> -21.54ms before beat 1
    expect(clock.getNearestBeatDeltaMs(440)).toBeCloseTo(-21.54, 1);
  });

  it('should transition to drop state at configured timestamp', () => {
    clock.start(48.0); // start after 47.077s
    const state = clock.getState();
    expect(state.isDrop).toBe(true);
  });
});
