import { eventBus } from '../core/EventBus';

/**
 * High-performance 8-bit procedural chip audio synthesis engine.
 * Generates arcade SFX dynamically without external sample dependencies.
 */
export class ProceduralSFXEngine {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  constructor(audioContext?: AudioContext) {
    if (audioContext) {
      this.init(audioContext);
    }
  }

  public init(audioContext: AudioContext): void {
    this.audioCtx = audioContext;

    if (typeof this.audioCtx.createGain === 'function') {
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = 0.5;
      if (this.audioCtx.destination) {
        this.masterGain.connect(this.audioCtx.destination);
      }
    }

    this.createNoiseBuffer();
    this.setupEventListeners();
  }

  private createNoiseBuffer(): void {
    if (!this.audioCtx || typeof this.audioCtx.createBuffer !== 'function') return;
    try {
      const sampleRate = this.audioCtx.sampleRate || 44100;
      const bufferSize = sampleRate * 2; // 2 seconds of noise
      this.noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, sampleRate);
      const output = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    } catch {
      // Ignore if mock audio context does not support buffers
    }
  }

  private setupEventListeners(): void {
    eventBus.on('audio:sfx', (event) => {
      this.play(event.name, event.volume, event.pitch);
    });
  }

  public play(sfxName: string, volume = 1.0, pitchMultiplier = 1.0): void {
    if (!this.audioCtx || !this.masterGain) return;
    if (this.audioCtx.state === 'suspended' && typeof this.audioCtx.resume === 'function') {
      this.audioCtx.resume();
    }

    const t = this.audioCtx.currentTime || 0;

    switch (sfxName.toLowerCase()) {
      case 'blaster':
      case 'laser':
        this.playBlaster(t, volume, pitchMultiplier);
        break;
      case 'hammer_hit':
      case 'heavy_hit':
        this.playHeavyHammer(t, volume, pitchMultiplier);
        break;
      case 'portal_parry':
      case 'parry':
        this.playPortalParry(t, volume, pitchMultiplier);
        break;
      case 'perfect':
      case 'perfect_chime':
        this.playPerfectChime(t, volume, pitchMultiplier);
        break;
      case 'great':
      case 'great_chime':
        this.playGreatChime(t, volume, pitchMultiplier);
        break;
      case 'good':
        this.playGoodChime(t, volume, pitchMultiplier);
        break;
      case 'miss':
      case 'miss_buzz':
        this.playMissBuzz(t, volume, pitchMultiplier);
        break;
      case 'slide':
      case 'whoosh':
        this.playSlideWhoosh(t, volume, pitchMultiplier);
        break;
      case 'broom_spin':
        this.playBroomSpin(t, volume, pitchMultiplier);
        break;
      case 'glitch_burst':
        this.playGlitchBurst(t, volume, pitchMultiplier);
        break;
      case 'got_damn':
        this.playGotDamnFanfare(t, volume, pitchMultiplier);
        break;
      default:
        this.playGenericHit(t, volume, pitchMultiplier);
        break;
    }
  }

  public setMasterVolume(vol: number): void {
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.audioCtx.currentTime || 0);
    }
  }

  /**
   * 8-Bit Plasma Blaster Zap (Square Wave Descending Pitch)
   */
  private playBlaster(t: number, volume: number, pitch: number): void {
    if (!this.audioCtx || !this.masterGain || typeof this.audioCtx.createOscillator !== 'function') return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(900 * pitch, t);
      osc.frequency.exponentialRampToValueAtTime(120 * pitch, t + 0.09);

      gain.gain.setValueAtTime(0.3 * volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.09);
    } catch {
      // Safe fallback
    }
  }

  /**
   * Heavy Sledgehammer Smash (Bass Sub + Impact Noise)
   */
  private playHeavyHammer(t: number, volume: number, pitch: number): void {
    if (!this.audioCtx || !this.masterGain || typeof this.audioCtx.createOscillator !== 'function') return;

    try {
      // Sub Boom
      const osc = this.audioCtx.createOscillator();
      const oscGain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160 * pitch, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.25);

      oscGain.gain.setValueAtTime(0.6 * volume, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(oscGain);
      oscGain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.25);

      // Noise Clang
      if (this.noiseBuffer && typeof this.audioCtx.createBufferSource === 'function') {
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 600 * pitch;
        filter.Q.value = 2.0;

        const noiseGain = this.audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0.5 * volume, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(t);
        noise.stop(t + 0.15);
      }
    } catch {
      // Safe fallback
    }
  }

  /**
   * Portal Parry Harmonic Shimmer
   */
  private playPortalParry(t: number, volume: number, pitch: number): void {
    if (!this.audioCtx || !this.masterGain || typeof this.audioCtx.createOscillator !== 'function') return;

    try {
      const frequencies = [523.25, 659.25, 783.99, 1046.5];
      frequencies.forEach((freq, idx) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * pitch, t + idx * 0.02);
        osc.frequency.linearRampToValueAtTime(freq * 1.5 * pitch, t + 0.2);

        gain.gain.setValueAtTime(0, t);
        gain.gain.setValueAtTime(0.25 * volume, t + idx * 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(t + idx * 0.02);
        osc.stop(t + 0.25);
      });
    } catch {
      // Safe fallback
    }
  }

  /**
   * Perfect Timing Harmonic Chime
   */
  private playPerfectChime(t: number, volume: number, pitch: number): void {
    if (!this.audioCtx || !this.masterGain || typeof this.audioCtx.createOscillator !== 'function') return;

    try {
      const notes = [880, 1174.66, 1318.51, 1760];
      notes.forEach((freq, i) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq * pitch, t + i * 0.025);

        gain.gain.setValueAtTime(0.18 * volume, t + i * 0.025);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.025 + 0.18);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(t + i * 0.025);
        osc.stop(t + i * 0.025 + 0.18);
      });
    } catch {
      // Safe fallback
    }
  }

  /**
   * Great Timing Chime
   */
  private playGreatChime(t: number, volume: number, pitch: number): void {
    if (!this.audioCtx || !this.masterGain || typeof this.audioCtx.createOscillator !== 'function') return;

    try {
      const notes = [659.25, 880];
      notes.forEach((freq, i) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq * pitch, t + i * 0.03);

        gain.gain.setValueAtTime(0.2 * volume, t + i * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.03 + 0.15);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(t + i * 0.03);
        osc.stop(t + i * 0.03 + 0.15);
      });
    } catch {
      // Safe fallback
    }
  }

  /**
   * Good Timing Chime
   */
  private playGoodChime(t: number, volume: number, pitch: number): void {
    if (!this.audioCtx || !this.masterGain || typeof this.audioCtx.createOscillator !== 'function') return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25 * pitch, t);

      gain.gain.setValueAtTime(0.15 * volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.12);
    } catch {
      // Safe fallback
    }
  }

  /**
   * Miss Buzz (Dissonant Buzz)
   */
  private playMissBuzz(t: number, volume: number, pitch: number): void {
    if (!this.audioCtx || !this.masterGain || typeof this.audioCtx.createOscillator !== 'function') return;

    try {
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(80 * pitch, t);
      osc2.frequency.setValueAtTime(85 * pitch, t);

      gain.gain.setValueAtTime(0.3 * volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.18);
      osc2.stop(t + 0.18);
    } catch {
      // Safe fallback
    }
  }

  /**
   * Slide Tackle Swoosh
   */
  private playSlideWhoosh(t: number, volume: number, pitch: number): void {
    if (!this.audioCtx || !this.masterGain || !this.noiseBuffer || typeof this.audioCtx.createBufferSource !== 'function') return;

    try {
      const noise = this.audioCtx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400 * pitch, t);
      filter.frequency.exponentialRampToValueAtTime(250 * pitch, t + 0.2);

      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.35 * volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(t);
      noise.stop(t + 0.2);
    } catch {
      // Safe fallback
    }
  }

  /**
   * Morty Broom Spin Multi-tone Swirl
   */
  private playBroomSpin(t: number, volume: number, pitch: number): void {
    if (!this.audioCtx || !this.masterGain || typeof this.audioCtx.createOscillator !== 'function') return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240 * pitch, t);
      osc.frequency.linearRampToValueAtTime(480 * pitch, t + 0.1);
      osc.frequency.linearRampToValueAtTime(240 * pitch, t + 0.2);

      gain.gain.setValueAtTime(0.25 * volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.22);
    } catch {
      // Safe fallback
    }
  }

  /**
   * Glitch Simulation Burst
   */
  private playGlitchBurst(t: number, volume: number, pitch: number): void {
    if (!this.audioCtx || !this.masterGain || !this.noiseBuffer || typeof this.audioCtx.createBufferSource !== 'function') return;

    try {
      const noise = this.audioCtx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2000 * pitch, t);

      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.4 * volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(t);
      noise.stop(t + 0.1);
    } catch {
      // Safe fallback
    }
  }

  /**
   * Boss Stagger / "GOT DAMN!" Fanfare
   */
  private playGotDamnFanfare(t: number, volume: number, pitch: number): void {
    if (!this.audioCtx || !this.masterGain || typeof this.audioCtx.createOscillator !== 'function') return;

    try {
      const chord = [392.0, 493.88, 587.33, 783.99];
      chord.forEach((freq) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq * pitch, t);

        gain.gain.setValueAtTime(0.18 * volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(t);
        osc.stop(t + 0.45);
      });
    } catch {
      // Safe fallback
    }
  }

  private playGenericHit(t: number, volume: number, pitch: number): void {
    if (!this.audioCtx || !this.masterGain || typeof this.audioCtx.createOscillator !== 'function') return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200 * pitch, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);

      gain.gain.setValueAtTime(0.3 * volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.1);
    } catch {
      // Safe fallback
    }
  }
}
