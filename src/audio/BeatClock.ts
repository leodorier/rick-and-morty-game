import { eventBus } from '../core/EventBus';
import { BeatState } from '../core/Types';

export interface BeatClockConfig {
  bpm?: number;
  beatsPerBar?: number;
  dropTimestampSec?: number;
  audioContext?: AudioContext;
}

/**
 * Sample-accurate Web Audio Beat Clock & Lookahead Scheduler.
 * Operates at 130 BPM with drift-free timing analysis for rhythm scoring.
 */
export class BeatClock {
  public bpm: number;
  public beatsPerBar: number;
  public beatDurationSec: number;
  public beatDurationMs: number;
  public dropTimestampSec: number;

  private audioCtx: AudioContext | null = null;
  private isRunning = false;
  private isPaused = false;
  private startTimeSec = 0;
  private pauseTimeSec = 0;
  private lastProcessedBeat = -1;

  constructor(config?: BeatClockConfig) {
    this.bpm = config?.bpm ?? 130.0;
    this.beatsPerBar = config?.beatsPerBar ?? 4;
    this.dropTimestampSec = config?.dropTimestampSec ?? 47.077;
    this.beatDurationSec = 60.0 / this.bpm;
    this.beatDurationMs = this.beatDurationSec * 1000.0;

    if (config?.audioContext) {
      this.audioCtx = config.audioContext;
    }
  }

  public setAudioContext(ctx: AudioContext): void {
    this.audioCtx = ctx;
  }

  public getAudioContext(): AudioContext | null {
    return this.audioCtx;
  }

  public start(offsetSec = 0): void {
    const now = this.getCurrentTimeSec();
    this.startTimeSec = now - offsetSec;
    this.isRunning = true;
    this.isPaused = false;
    this.lastProcessedBeat = Math.floor(offsetSec / this.beatDurationSec) - 1;
  }

  public pause(): void {
    if (!this.isRunning || this.isPaused) return;
    this.pauseTimeSec = this.getCurrentTimeSec();
    this.isPaused = true;
  }

  public resume(): void {
    if (!this.isRunning || !this.isPaused) return;
    const pausedDuration = this.getCurrentTimeSec() - this.pauseTimeSec;
    this.startTimeSec += pausedDuration;
    this.isPaused = false;
  }

  public stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    this.startTimeSec = 0;
    this.lastProcessedBeat = -1;
  }

  public sync(currentAudioTimeSec: number): void {
    this.startTimeSec = this.getCurrentTimeSec() - currentAudioTimeSec;
  }

  /**
   * Get the current elapsed playback time in seconds.
   */
  public getElapsedTimeSec(): number {
    if (!this.isRunning) return 0;
    if (this.isPaused) return Math.max(0, this.pauseTimeSec - this.startTimeSec);
    return Math.max(0, this.getCurrentTimeSec() - this.startTimeSec);
  }

  /**
   * Get elapsed playback time in milliseconds.
   */
  public getElapsedTimeMs(): number {
    return this.getElapsedTimeSec() * 1000;
  }

  /**
   * Returns complete beat state snapshot.
   */
  public getState(): BeatState {
    const elapsedSec = this.getElapsedTimeSec();
    const exactBeat = elapsedSec / this.beatDurationSec;
    const currentBeat = Math.floor(exactBeat);
    const beatProgress = exactBeat - currentBeat;
    const currentBar = Math.floor(currentBeat / this.beatsPerBar);
    const isDrop = elapsedSec >= this.dropTimestampSec;

    // Signed delta to the closest beat (negative = before beat, positive = after beat)
    const closestBeat = Math.round(exactBeat);
    const deltaMs = (exactBeat - closestBeat) * this.beatDurationMs;

    return {
      bpm: this.bpm,
      currentBeat,
      currentTimeSec: elapsedSec,
      currentBar,
      beatProgress,
      deltaMs,
      isDrop
    };
  }

  /**
   * Get difference in ms between a given timestamp and the closest beat.
   */
  public getNearestBeatDeltaMs(timestampMs?: number): number {
    const timeMs = timestampMs !== undefined ? timestampMs : this.getElapsedTimeMs();
    const timeSec = timeMs / 1000.0;
    const exactBeat = timeSec / this.beatDurationSec;
    const closestBeat = Math.round(exactBeat);
    return (exactBeat - closestBeat) * this.beatDurationMs;
  }

  /**
   * Lookahead update loop called every frame (e.g. 60 FPS requestAnimationFrame).
   * Emits beat events as timestamps advance.
   */
  public update(): void {
    if (!this.isRunning || this.isPaused) return;

    const elapsedSec = this.getElapsedTimeSec();
    const currentBeatIndex = Math.floor(elapsedSec / this.beatDurationSec);

    // Trigger all beats passed since last update
    while (this.lastProcessedBeat < currentBeatIndex) {
      this.lastProcessedBeat++;
      const beatNum = this.lastProcessedBeat;
      const barNum = Math.floor(beatNum / this.beatsPerBar);
      const isDownbeat = beatNum % this.beatsPerBar === 0;
      const isDrop = elapsedSec >= this.dropTimestampSec;

      eventBus.emit('beat', {
        beatIndex: beatNum,
        barIndex: barNum,
        isDownbeat,
        isDrop,
        bpm: this.bpm,
        timestamp: beatNum * this.beatDurationMs
      });
    }
  }

  private getCurrentTimeSec(): number {
    if (this.audioCtx) {
      return this.audioCtx.currentTime;
    }
    if (typeof performance !== 'undefined') {
      return performance.now() / 1000.0;
    }
    return Date.now() / 1000.0;
  }
}
