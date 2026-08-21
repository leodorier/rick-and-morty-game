import { audioLoader } from './AudioLoader';
import { BeatClock } from './BeatClock';

export interface MusicPlayerOptions {
  audioContext: AudioContext;
  beatClock?: BeatClock;
  volume?: number;
}

/**
 * High-performance BGM playback engine with gain, filters, and beat sync.
 */
export class MusicPlayer {
  private audioCtx: AudioContext;
  private beatClock?: BeatClock;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode;
  private filterNode: BiquadFilterNode;
  private audioBuffer: AudioBuffer | null = null;

  private isPlaying = false;
  private isPaused = false;
  private pauseOffsetSec = 0;
  private playbackStartTime = 0;

  constructor(options: MusicPlayerOptions) {
    this.audioCtx = options.audioContext;
    this.beatClock = options.beatClock;

    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.value = options.volume ?? 0.8;

    this.filterNode = this.audioCtx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.value = 20000; // default fully open

    // Signal chain: source -> filter -> gain -> destination
    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(this.audioCtx.destination);
  }

  public async loadTrack(url: string): Promise<void> {
    this.audioBuffer = await audioLoader.load(url);
  }

  public setBuffer(buffer: AudioBuffer): void {
    this.audioBuffer = buffer;
  }

  public play(offsetSec = 0, loop = true): void {
    if (!this.audioBuffer) {
      console.warn('Cannot play music: No audio buffer loaded');
      return;
    }

    this.stop();

    this.sourceNode = this.audioCtx.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.loop = loop;
    this.sourceNode.connect(this.filterNode);

    const startTime = this.audioCtx.currentTime;
    this.sourceNode.start(0, offsetSec);
    this.playbackStartTime = startTime - offsetSec;
    this.pauseOffsetSec = offsetSec;
    this.isPlaying = true;
    this.isPaused = false;

    if (this.beatClock) {
      this.beatClock.start(offsetSec);
    }
  }

  public pause(): void {
    if (!this.isPlaying || this.isPaused) return;

    this.pauseOffsetSec = this.getCurrentTime();
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    this.isPaused = true;
    this.isPlaying = false;

    if (this.beatClock) {
      this.beatClock.pause();
    }
  }

  public resume(): void {
    if (!this.isPaused) return;
    this.play(this.pauseOffsetSec);
  }

  public stop(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch {
        // Source already stopped
      }
      this.sourceNode = null;
    }
    this.isPlaying = false;
    this.isPaused = false;
    this.pauseOffsetSec = 0;

    if (this.beatClock) {
      this.beatClock.stop();
    }
  }

  public getCurrentTime(): number {
    if (!this.isPlaying) return this.pauseOffsetSec;
    return this.audioCtx.currentTime - this.playbackStartTime;
  }

  public setVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    this.gainNode.gain.setValueAtTime(clamped, this.audioCtx.currentTime);
  }

  public setGlitchFilter(cutoffFreq: number): void {
    const freq = Math.max(100, Math.min(20000, cutoffFreq));
    this.filterNode.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
  }

  public resetFilter(): void {
    this.filterNode.frequency.setValueAtTime(20000, this.audioCtx.currentTime);
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}
