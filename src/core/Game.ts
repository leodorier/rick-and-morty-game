import { GameState } from './Types';
import { Vector2 } from '../utils/Vector2';
import { Collision } from '../utils/Collision';
import { eventBus } from './EventBus';
import { BeatClock } from '../audio/BeatClock';
import { MusicPlayer } from '../audio/MusicPlayer';
import { ProceduralSFXEngine } from '../audio/ProceduralSFXEngine';
import { TimingJudger } from '../rhythm/TimingJudger';
import { ReticleManager } from '../rhythm/ReticleManager';
import { ComboSystem } from '../combat/ComboSystem';
import { ParticleEngine } from '../render/ParticleEngine';
import { HUDRenderer } from '../render/HUDRenderer';
import { SceneManager } from './SceneManager';

import { Rick } from '../entities/Rick';
import { Morty } from '../entities/Morty';
import { Caterpillar } from '../entities/enemies/Caterpillar';
import { FlyingMoth } from '../entities/enemies/FlyingMoth';
import { PinkTrooper } from '../entities/enemies/PinkTrooper';
import { ButterBot } from '../entities/enemies/ButterBot';

import { RickCarBoss } from '../entities/bosses/RickCarBoss';
import { SteelyMopBoss } from '../entities/bosses/SteelyMopBoss';
import { ToiletThroneBoss } from '../entities/bosses/ToiletThroneBoss';

export class Game {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public state: GameState = 'TITLE';

  public beatClock: BeatClock;
  public musicPlayer: MusicPlayer;
  public sfxEngine: ProceduralSFXEngine;
  public timingJudger: TimingJudger;
  public reticleManager: ReticleManager;
  public comboSystem: ComboSystem;
  public particleEngine: ParticleEngine;
  public hudRenderer: HUDRenderer;
  public sceneManager: SceneManager;

  public rick: Rick;
  public morty: Morty;

  // Enemy Entities
  public caterpillars: Caterpillar[] = [];
  public moths: FlyingMoth[] = [];
  public troopers: PinkTrooper[] = [];
  public butterBots: ButterBot[] = [];

  // Boss
  public currentBoss: RickCarBoss | SteelyMopBoss | ToiletThroneBoss | null = null;

  public corruption = 0;
  public totalKills = 0;
  public isRunning = false;
  private lastTime = 0;

  // Input state
  public input = {
    left: false,
    right: false,
    up: false,
    down: false,
    attackJ: false,
    attackK: false,
    attackL: false,
    space: false,
    mortyAssistI: false
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not obtain 2D rendering context');
    this.ctx = ctx;

    this.canvas.width = 480;
    this.canvas.height = 270;
    this.ctx.imageSmoothingEnabled = false;

    // Subsystems
    this.beatClock = new BeatClock({ bpm: 130.0 });
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.beatClock.setAudioContext(audioCtx);

    this.musicPlayer = new MusicPlayer({ audioContext: audioCtx, beatClock: this.beatClock });
    this.sfxEngine = new ProceduralSFXEngine(audioCtx);
    this.timingJudger = new TimingJudger();
    this.particleEngine = new ParticleEngine();
    this.reticleManager = new ReticleManager(this.timingJudger, this.particleEngine);
    this.comboSystem = new ComboSystem();
    this.hudRenderer = new HUDRenderer();
    this.sceneManager = new SceneManager();

    this.rick = new Rick(80, 210);
    this.morty = new Morty(40, 210);

    this.bindInputs();
    this.bindEvents();
  }

  private bindInputs(): void {
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      if (code === 'KeyA' || code === 'ArrowLeft') this.input.left = true;
      if (code === 'KeyD' || code === 'ArrowRight') this.input.right = true;
      if (code === 'KeyW' || code === 'ArrowUp') this.input.up = true;
      if (code === 'KeyS' || code === 'ArrowDown') this.input.down = true;
      if (code === 'KeyJ') {
        this.input.attackJ = true;
        this.handleRhythmInput('BLASTER_BURST', 'RICK');
      }
      if (code === 'KeyK') {
        this.input.attackK = true;
        this.handleRhythmInput('SLEDGEHAMMER_SMASH', 'RICK');
      }
      if (code === 'KeyL' || code === 'ShiftLeft') {
        this.input.attackL = true;
        this.handleRhythmInput('PORTAL_PARRY', 'RICK');
      }
      if (code === 'Space') {
        this.input.space = true;
        this.handleRhythmInput('OVERHEAD_TOSS', 'RICK');
      }
      if (code === 'KeyI') {
        this.input.mortyAssistI = true;
        this.handleRhythmInput('BROOM_SPIN', 'MORTY');
      }

      if (this.state === 'TITLE' || this.state === 'GAME_OVER' || this.state === 'VICTORY') {
        this.startGame();
      }
    });

    window.addEventListener('keyup', (e) => {
      const code = e.code;
      if (code === 'KeyA' || code === 'ArrowLeft') this.input.left = false;
      if (code === 'KeyD' || code === 'ArrowRight') this.input.right = false;
      if (code === 'KeyW' || code === 'ArrowUp') this.input.up = false;
      if (code === 'KeyS' || code === 'ArrowDown') this.input.down = false;
      if (code === 'KeyJ') this.input.attackJ = false;
      if (code === 'KeyK') this.input.attackK = false;
      if (code === 'KeyL' || code === 'ShiftLeft') this.input.attackL = false;
      if (code === 'Space') this.input.space = false;
      if (code === 'KeyI') this.input.mortyAssistI = false;
    });
  }

  private bindEvents(): void {
    eventBus.on('beat', (beat) => {
      // Spawn on-beat rhythmic reticles
      if (this.state === 'PLAYING' || this.state === 'BOSS_BATTLE') {
        this.onBeatTrigger(beat.beatIndex);
      }
    });

    eventBus.on('timing:judged', (e) => {
      if (e.rating === 'PERFECT') {
        this.rick.superCharge = Math.min(100, this.rick.superCharge + 10);
        this.corruption = Math.max(0, this.corruption - 3);
      } else if (e.rating === 'MISS') {
        this.corruption = Math.min(100, this.corruption + 5);
      }
    });
  }

  private handleRhythmInput(action: any, character: 'RICK' | 'MORTY'): void {
    const timeMs = this.beatClock.getElapsedTimeMs();
    const pos = character === 'RICK' ? this.rick.position : this.morty.position;
    this.reticleManager.evaluateInput(timeMs, action, character, pos);
  }

  private onBeatTrigger(beatIndex: number): void {
    const nextBeatTimeMs = (beatIndex + 1) * this.beatClock.beatDurationMs;

    // Spawn reticles on active enemies or player targets
    if (this.currentBoss) {
      this.reticleManager.spawnReticle(
        nextBeatTimeMs,
        this.currentBoss.position.addScalars(0, -30),
        'SLEDGEHAMMER_SMASH',
        'CIRCLE',
        '#FF0055'
      );
    } else if (this.caterpillars.length > 0) {
      const mob = this.caterpillars[0];
      this.reticleManager.spawnReticle(
        nextBeatTimeMs,
        mob.position.addScalars(0, -15),
        'BLASTER_BURST',
        'CIRCLE',
        '#00FFFF'
      );
    }
  }

  public async startGame(): Promise<void> {
    this.state = 'PLAYING';
    this.corruption = 0;
    this.totalKills = 0;
    this.rick = new Rick(80, 210);
    this.morty = new Morty(40, 210);
    this.comboSystem.reset();
    this.sceneManager.setStage('PROLOGUE_DINING');

    this.caterpillars = [];
    this.moths = [];
    this.troopers = [];
    this.butterBots = [];
    this.currentBoss = null;

    try {
      await this.musicPlayer.loadTrack('/assets/audio/rick-cut.mp3');
      this.musicPlayer.play(0);
    } catch {
      this.beatClock.start(0);
    }

    if (!this.isRunning) {
      this.isRunning = true;
      this.lastTime = performance.now();
      requestAnimationFrame(this.loop.bind(this));
    }
  }

  private loop(timestamp: number): void {
    if (!this.isRunning) return;

    const dtSec = Math.min(0.1, (timestamp - this.lastTime) / 1000.0);
    this.lastTime = timestamp;

    this.update(dtSec);
    this.render();

    requestAnimationFrame(this.loop.bind(this));
  }

  public update(dtSec: number): void {
    if (this.state === 'PAUSED') return;

    this.beatClock.update();
    const elapsedSec = this.beatClock.getElapsedTimeSec();
    const elapsedMs = elapsedSec * 1000;

    this.sceneManager.update(dtSec);
    this.particleEngine.update(dtSec);
    this.reticleManager.update(elapsedMs);
    this.comboSystem.update(dtSec);

    // Stage Flow & Progression based on music elapsed time
    this.handleStageProgression(elapsedSec);

    // Find nearest target for Morty AI
    let nearestEnemyPos: Vector2 | null = null;
    if (this.currentBoss) {
      nearestEnemyPos = this.currentBoss.position;
    } else if (this.caterpillars.length > 0) {
      nearestEnemyPos = this.caterpillars[0].position;
    } else if (this.troopers.length > 0) {
      nearestEnemyPos = this.troopers[0].position;
    }

    // Update Player & Companion
    this.rick.update(dtSec, this.input);
    this.morty.update(
      dtSec,
      this.rick.position,
      nearestEnemyPos,
      this.input.mortyAssistI ? 'BROOM_SPIN' : null
    );

    // Update Enemies & Boss
    this.caterpillars.forEach((c) => c.update(dtSec, this.rick.position));
    this.moths.forEach((m) => m.update(dtSec, this.rick.position));
    this.troopers.forEach((t) => t.update(dtSec, this.rick.position));
    this.butterBots.forEach((b) => b.update(dtSec, this.rick.position));

    if (this.currentBoss) {
      this.currentBoss.update(dtSec, this.rick.position);
    }

    // Resolve Collisions
    this.resolveCombatCollisions();

    // Clean dead enemies
    this.cleanDeadEntities();

    // Check Game Over
    if (this.rick.health <= 0) {
      this.state = 'GAME_OVER';
    }
  }

  private handleStageProgression(elapsedSec: number): void {
    // Stage 0: 0s -> 30s
    if (elapsedSec < 30) {
      if (this.sceneManager.currentStage !== 'PROLOGUE_DINING') {
        this.sceneManager.setStage('PROLOGUE_DINING');
      }
      if (this.caterpillars.length === 0 && elapsedSec > 8) {
        this.caterpillars.push(new Caterpillar(420, 200));
      }
    }
    // Stage 1: 30s -> 60s
    else if (elapsedSec < 60) {
      if (this.sceneManager.currentStage !== 'WASTELAND_WAVES') {
        this.sceneManager.setStage('WASTELAND_WAVES');
        this.particleEngine.emitTextPopup(240, 100, 'STAGE 1: CORRUPTED WASTELAND', '#00FFFF', 12);
      }
      if (this.caterpillars.length < 2 && Math.random() < 0.02) {
        this.caterpillars.push(new Caterpillar(480, 190 + Math.random() * 40));
      }
      if (this.moths.length < 2 && Math.random() < 0.015) {
        this.moths.push(new FlyingMoth(480, 120 + Math.random() * 40));
      }
      if (this.troopers.length < 1 && Math.random() < 0.01) {
        this.troopers.push(new PinkTrooper(480, 205));
      }
    }
    // Boss 1: Rick-Car Mech (60s -> 90s)
    else if (elapsedSec < 90) {
      if (this.sceneManager.currentStage !== 'BOSS_1_RICK_CAR') {
        this.sceneManager.setStage('BOSS_1_RICK_CAR');
        this.state = 'BOSS_BATTLE';
        this.currentBoss = new RickCarBoss(400, 190);
        this.particleEngine.emitTextPopup(240, 80, 'BOSS 1: THE RICK-CAR MECH!', '#FF0055', 14);
      }
      if (this.currentBoss && this.currentBoss.isDead) {
        this.currentBoss = null;
        this.particleEngine.emitTextPopup(240, 120, 'RICK-CAR DESTROYED!', '#FFFF00', 14);
      }
    }
    // Interlude: Butter Bots (90s -> 115s)
    else if (elapsedSec < 115) {
      if (this.sceneManager.currentStage !== 'INTERLUDE_BUTTER_BOTS') {
        this.sceneManager.setStage('INTERLUDE_BUTTER_BOTS');
        this.state = 'PLAYING';
        this.currentBoss = null;
        this.particleEngine.emitTextPopup(240, 80, 'INTERLUDE: "PASS THE BUTTER"', '#FFFF00', 12);
      }
      if (this.butterBots.length < 3 && Math.random() < 0.03) {
        this.butterBots.push(new ButterBot(480, 205 + Math.random() * 30));
      }
    }
    // Boss 2: Steely Mop Boss (115s -> 145s)
    else if (elapsedSec < 145) {
      if (this.sceneManager.currentStage !== 'BOSS_2_STEELY_MOP') {
        this.sceneManager.setStage('BOSS_2_STEELY_MOP');
        this.state = 'BOSS_BATTLE';
        this.currentBoss = new SteelyMopBoss(380, 210);
        this.particleEngine.emitTextPopup(240, 80, 'BOSS 2: STEELY MOP NOOB-NOOB!', '#FF0055', 14);
      }
      if (this.currentBoss && this.currentBoss.isDead) {
        this.currentBoss = null;
        this.particleEngine.emitTextPopup(240, 120, 'GOT DAMN! BROOM UNLOCKED!', '#39FF14', 14);
      }
    }
    // Boss 3: Toilet Throne King (145s -> 180s)
    else if (elapsedSec < 180) {
      if (this.sceneManager.currentStage !== 'BOSS_3_TOILET_THRONE') {
        this.sceneManager.setStage('BOSS_3_TOILET_THRONE');
        this.state = 'BOSS_BATTLE';
        this.currentBoss = new ToiletThroneBoss(390, 220);
        this.particleEngine.emitTextPopup(240, 80, 'FINAL BOSS: THE TOILET THRONE KING!', '#FFD700', 14);
      }
      if (this.currentBoss && this.currentBoss.isDead) {
        this.currentBoss = null;
        this.state = 'VICTORY';
      }
    } else {
      this.state = 'VICTORY';
    }
  }

  private resolveCombatCollisions(): void {
    const rickHit = this.rick.getActiveHitBox();
    const mortyHit = this.morty.getActiveHitBox();
    const rickHurt = this.rick.getHurtBox();
    const mortyHurt = this.morty.getHurtBox();

    // 1. Players attack Mobs
    const mobs = [...this.caterpillars, ...this.moths, ...this.troopers, ...this.butterBots];
    for (const mob of mobs) {
      const hurt = mob.getHurtBox();

      if (rickHit) {
        const res = Collision.resolveHit(rickHit, hurt);
        if (res && res.hit) {
          mob.takeDamage(res.damage, res.knockback, res.staggerDuration);
          this.particleEngine.emitHitSpark(res.contactPoint.x, res.contactPoint.y, '#00FFFF', 8);
          this.comboSystem.registerHit(res.damage * 10, 'PERFECT');
        }
      }

      if (mortyHit) {
        const res = Collision.resolveHit(mortyHit, hurt);
        if (res && res.hit) {
          mob.takeDamage(res.damage, res.knockback, res.staggerDuration);
          this.particleEngine.emitHitSpark(res.contactPoint.x, res.contactPoint.y, '#FF007F', 8);
          this.comboSystem.registerHit(res.damage * 10, 'GREAT');
        }
      }

      // Mobs attack Players
      const mobHit = mob.getHitBox();
      if (mobHit) {
        const resRick = Collision.resolveHit(mobHit, rickHurt);
        if (resRick && resRick.hit) {
          if (resRick.isParried) {
            this.particleEngine.emitPortalBurst(resRick.contactPoint.x, resRick.contactPoint.y);
            mob.takeDamage(40, resRick.knockback, 30);
          } else {
            this.rick.takeDamage(resRick.damage);
            this.comboSystem.registerMiss();
          }
        }

        const resMorty = Collision.resolveHit(mobHit, mortyHurt);
        if (resMorty && resMorty.hit && !resMorty.isParried) {
          this.morty.takeDamage(resMorty.damage);
        }
      }
    }

    // 2. Boss Combat
    if (this.currentBoss) {
      const bossHurt = this.currentBoss.getHurtBox();

      if (rickHit) {
        const res = Collision.resolveHit(rickHit, bossHurt);
        if (res && res.hit) {
          this.currentBoss.takeDamage(res.damage);
          this.particleEngine.emitHitSpark(res.contactPoint.x, res.contactPoint.y, '#FFFF00', 12);
          this.comboSystem.registerHit(res.damage * 15, 'PERFECT');
        }
      }

      if (mortyHit) {
        const res = Collision.resolveHit(mortyHit, bossHurt);
        if (res && res.hit) {
          this.currentBoss.takeDamage(res.damage);
          this.particleEngine.emitHitSpark(res.contactPoint.x, res.contactPoint.y, '#39FF14', 10);
          this.comboSystem.registerHit(res.damage * 15, 'GREAT');
        }
      }

      const bossHit = this.currentBoss.getHitBox();
      if (bossHit) {
        const resRick = Collision.resolveHit(bossHit, rickHurt);
        if (resRick && resRick.hit) {
          if (resRick.isParried) {
            this.particleEngine.emitPortalBurst(resRick.contactPoint.x, resRick.contactPoint.y);
            this.currentBoss.takeDamage(50, true);
          } else {
            this.rick.takeDamage(resRick.damage);
            this.comboSystem.registerMiss();
          }
        }
      }
    }
  }

  private cleanDeadEntities(): void {
    const filterAndCount = <T extends { isDead: boolean; position: Vector2 }>(arr: T[]): T[] => {
      return arr.filter((e) => {
        if (e.isDead) {
          this.totalKills++;
          this.particleEngine.emitGlitchVoxels(e.position.x, e.position.y, 12);
          eventBus.emit('audio:sfx', { name: 'heavy_hit' });
          return false;
        }
        return true;
      });
    };

    this.caterpillars = filterAndCount(this.caterpillars);
    this.moths = filterAndCount(this.moths);
    this.troopers = filterAndCount(this.troopers);
    this.butterBots = filterAndCount(this.butterBots);
  }

  public render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Stage Background
    this.sceneManager.renderBackground(this.ctx, this.canvas.width, this.canvas.height, this.corruption);

    // 2. Entities (Y-sorted for isometric depth)
    const entities: { y: number; draw: () => void }[] = [];

    entities.push({ y: this.rick.position.y, draw: () => this.rick.render(this.ctx) });
    entities.push({ y: this.morty.position.y, draw: () => this.morty.render(this.ctx) });

    this.caterpillars.forEach((c) => entities.push({ y: c.position.y, draw: () => c.render(this.ctx) }));
    this.moths.forEach((m) => entities.push({ y: m.position.y, draw: () => m.render(this.ctx) }));
    this.troopers.forEach((t) => entities.push({ y: t.position.y, draw: () => t.render(this.ctx) }));
    this.butterBots.forEach((b) => entities.push({ y: b.position.y, draw: () => b.render(this.ctx) }));

    if (this.currentBoss) {
      entities.push({ y: this.currentBoss.position.y, draw: () => this.currentBoss!.render(this.ctx) });
    }

    entities.sort((a, b) => a.y - b.y);
    entities.forEach((e) => e.draw());

    // 3. Rhythm Reticles
    this.reticleManager.render(this.ctx);

    // 4. Particles & Floating Text Popups
    this.particleEngine.render(this.ctx);

    // 5. HUD Layer
    this.hudRenderer.render(
      this.ctx,
      {
        rickHealth: this.rick.health,
        rickMaxHealth: this.rick.maxHealth,
        mortyHealth: this.morty.health,
        mortyMaxHealth: this.morty.maxHealth,
        comboCount: this.comboSystem.comboCount,
        comboRank: this.comboSystem.rank,
        comboMultiplier: this.comboSystem.multiplier,
        score: this.comboSystem.score,
        corruption: this.corruption,
        superCharge: this.rick.superCharge,
        beatState: this.beatClock.getState(),
        boss: this.currentBoss
          ? {
              name: this.currentBoss.name,
              health: this.currentBoss.health,
              maxHealth: this.currentBoss.maxHealth,
              phase: this.currentBoss.phase,
              maxPhases: this.currentBoss.maxPhases
            }
          : null
      },
      this.canvas.width,
      this.canvas.height
    );

    // 6. Title / Game Over / Victory Overlays
    if (this.state === 'TITLE') {
      this.renderTitleOverlay();
    } else if (this.state === 'GAME_OVER') {
      this.renderGameOverOverlay();
    } else if (this.state === 'VICTORY') {
      this.renderVictoryOverlay();
    }
  }

  private renderTitleOverlay(): void {
    this.ctx.fillStyle = 'rgba(8, 7, 16, 0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#00FFCC';
    this.ctx.font = 'bold 22px "Courier New", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = '#00FFCC';
    this.ctx.shadowBlur = 12;
    this.ctx.fillText('RICK AND MORTY', this.canvas.width / 2, 75);

    this.ctx.fillStyle = '#FF0055';
    this.ctx.shadowColor = '#FF0055';
    this.ctx.font = 'bold 14px "Courier New", monospace';
    this.ctx.fillText('ETERNAL NIGHTMARE MACHINE', this.canvas.width / 2, 100);

    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = '#39FF14';
    this.ctx.font = 'bold 10px "Courier New", monospace';
    this.ctx.fillText('PRESS ANY KEY TO INITIALIZE SIMULATION', this.canvas.width / 2, 175);

    this.ctx.fillStyle = '#AAAAAA';
    this.ctx.font = '8px "Courier New", monospace';
    this.ctx.fillText('CONTROLS: [WASD] Move | [J] Blaster | [K] Hammer | [L] Parry', this.canvas.width / 2, 215);
    this.ctx.fillText('[SPC] Mob Toss | [I] Morty Broom Spin Assist', this.canvas.width / 2, 230);
  }

  private renderGameOverOverlay(): void {
    this.ctx.fillStyle = 'rgba(20, 0, 10, 0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#FF0055';
    this.ctx.font = 'bold 20px "Courier New", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = '#FF0055';
    this.ctx.shadowBlur = 10;
    this.ctx.fillText('SIMULATION CORRUPTED', this.canvas.width / 2, 90);
    this.ctx.shadowBlur = 0;

    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '10px "Courier New", monospace';
    this.ctx.fillText(`FINAL SCORE: ${this.comboSystem.score}`, this.canvas.width / 2, 130);
    this.ctx.fillText(`MAX COMBO: ${this.comboSystem.maxCombo} HITS`, this.canvas.width / 2, 150);

    this.ctx.fillStyle = '#39FF14';
    this.ctx.font = 'bold 10px "Courier New", monospace';
    this.ctx.fillText('PRESS ANY KEY TO REBOOT SIMULATION', this.canvas.width / 2, 200);
  }

  private renderVictoryOverlay(): void {
    this.ctx.fillStyle = 'rgba(0, 20, 15, 0.88)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#00FFFF';
    this.ctx.font = 'bold 20px "Courier New", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = '#00FFFF';
    this.ctx.shadowBlur = 10;
    this.ctx.fillText('SIMULATION RESTORED!', this.canvas.width / 2, 80);
    this.ctx.shadowBlur = 0;

    this.ctx.fillStyle = '#FFFF00';
    this.ctx.font = 'bold 14px "Courier New", monospace';
    this.ctx.fillText(`RANK: ${this.comboSystem.rank}`, this.canvas.width / 2, 115);

    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '10px "Courier New", monospace';
    this.ctx.fillText(`FINAL SCORE: ${this.comboSystem.score}`, this.canvas.width / 2, 145);
    this.ctx.fillText(`TOTAL KILLS: ${this.totalKills}`, this.canvas.width / 2, 165);
    this.ctx.fillText(`MAX COMBO: ${this.comboSystem.maxCombo} HITS`, this.canvas.width / 2, 185);

    this.ctx.fillStyle = '#39FF14';
    this.ctx.font = 'bold 10px "Courier New", monospace';
    this.ctx.fillText('PRESS ANY KEY TO PLAY AGAIN', this.canvas.width / 2, 225);
  }
}
