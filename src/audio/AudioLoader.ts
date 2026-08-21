/**
 * Asset loader and memory cache for Web Audio API AudioBuffers.
 */
export class AudioLoader {
  private static instance: AudioLoader;
  private cache: Map<string, AudioBuffer> = new Map();
  private audioCtx: AudioContext | null = null;

  private constructor() {}

  public static getInstance(): AudioLoader {
    if (!AudioLoader.instance) {
      AudioLoader.instance = new AudioLoader();
    }
    return AudioLoader.instance;
  }

  public setAudioContext(ctx: AudioContext): void {
    this.audioCtx = ctx;
  }

  public async load(url: string, key?: string): Promise<AudioBuffer> {
    const cacheKey = key || url;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    if (!this.audioCtx) {
      throw new Error('AudioContext must be set in AudioLoader before loading audio files');
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio from ${url}: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
      this.cache.set(cacheKey, audioBuffer);
      return audioBuffer;
    } catch (err) {
      console.error(`AudioLoader failed to load ${url}:`, err);
      throw err;
    }
  }

  public get(key: string): AudioBuffer | undefined {
    return this.cache.get(key);
  }

  public has(key: string): boolean {
    return this.cache.has(key);
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const audioLoader = AudioLoader.getInstance();
