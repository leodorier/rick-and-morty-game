# eternal-nightmare-machine — agent rules

Stack: TypeScript, zero-dependency HTML5 Canvas + Web Audio
Entry: `src/main.ts`
Test: `npm run test` · E2E: `npm run test:e2e` · Build: `npm run build` · Dev: `npm run dev`

Architecture:
- `src/core` (game loop, `BeatClock`), `src/rhythm`, `src/entities` (Rick/Morty,
  bosses, enemies), `src/combat`, `src/audio`, `src/render`.

Invariants:
- 130 BPM (461.54 ms/beat) sample-accurate lookahead scheduler.
- Native 480×270, integer nearest-neighbor scaling (`image-rendering: pixelated`).

Do not touch: `dist/`.
Memory: `MEMORY.md` (ADRs, current release only).
