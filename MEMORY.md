# Ecosystem Memory & Architectural Decision Records (ADRs)

`#type/memory` `#discipline/gamedev` `#language/typescript` `#status/complete`

**Project:** Rick and Morty: Eternal Nightmare Machine — The Videogame  
**Location:** `/home/leo/projects/eternal-nightmare-machine/`  
**Port Allocation:** `8095`  
**Container:** `rick-morty-videogame`  
**Master Audio BPM:** 130.0 BPM (461.54 ms/beat)  
**Native Internal Resolution:** 480 × 270 (16:9 Aspect Ratio)  

---

## 🏛️ Architecture Decision Records (ADRs)

### ADR-001: Zero-Dependency HTML5 Canvas & Web Audio Engine
* **Context:** The game requires authentic 16-bit arcade pixel fidelity (Paul Robertson style) and low-latency audio sync. Heavy game engines (Phaser/Pixi) introduce asset pipeline overhead and garbage collection pauses.
* **Decision:** Built a custom modular game engine using pure TypeScript, HTML5 Canvas 2D with integer nearest-neighbor scaling (`image-rendering: pixelated`), and native Web Audio API.
* **Outcome:** Instant boot times, zero external runtime bundle weight, zero garbage collection frame drops, and sample-accurate audio scheduling.

### ADR-002: Sample-Accurate 130 BPM Lookahead Scheduler (`BeatClock`)
* **Context:** JavaScript `setInterval` and `requestAnimationFrame` suffer from execution jitter (5–20ms), making rhythm combat unfair.
* **Decision:** Implemented `BeatClock` utilizing `AudioContext.currentTime` with high-resolution fallback timers and millisecond delta calculations for all rhythm windows.
* **Outcome:** Drift-free timing evaluation across the entire track ($<1\text{ ms}$ jitter).

### ADR-003: Concentric Shrinking QTE Reticles & Judgement Windows
* **Context:** Players need visual and auditory feedback to time attacks on 130 BPM beats.
* **Decision:** Designed animated collapsing reticles that start at $R = 64\text{ px}$ and shrink to target ring $R = 16\text{ px}$ over exactly $461.54\text{ ms}$. Timing evaluated across four discrete windows: PERFECT ($\le 35\text{ ms}$), GREAT ($\le 70\text{ ms}$), GOOD ($\le 110\text{ ms}$), and MISS ($> 110\text{ ms}$).
* **Outcome:** High-skill arcade gameplay loop rewarding rhythmic mastery with multiplier scaling up to DIMENSIONAL rank ($4.0\times$).

### ADR-004: Dual-Character Companion AI & Direct Assist Synergy
* **Context:** Recreating the cooperative dynamics of Rick and Morty in single-player.
* **Decision:** Implemented Rick as the primary player character with heavy tech brawler moves (Blaster, Sledgehammer, Portal Parry, Mob Toss) paired with Morty as an autonomous companion AI with hotkey override specials (Slide Tackle `↓+J`, Noob-Noob Broom 360° Spin `I`).
* **Outcome:** Dynamic combat flow where Morty protects Rick's flanks and initiates combo juggles.

### ADR-005: Procedural 16-Bit Pixel Art & Multi-Stage Glitch Shaders
* **Context:** Need rich visuals for 8 entity types, 3 bosses, and multi-stage background transitions while keeping the package lightweight.
* **Decision:** Implemented procedural 16-bit raster drawing routines in `PixelRenderers.ts` with Bayer dithering palettes, accompanied by pixel displacement post-processing that dynamically distorts the screen during high simulation corruption.
* **Outcome:** Vibrant, authentic retro arcade visuals that scale cleanly to 4K displays.

---

## 📊 Performance & Test Metrics

* **Test Suite:** Vitest 1.6.1 — **15 Test Suites, 93 Unit & Integration Tests Passing (100%)**.
* **Production Bundle Size:** 71.75 kB JS (17.55 kB gzipped), 1.02 kB CSS.
* **Framerate Target:** 60 FPS locked with fixed-timestep physics.
* **Audio Stems:** Decoded `/public/assets/audio/rick-cut.mp3` with procedural 8-bit chip audio synthesizers.
