import { eventBus } from '../core/EventBus';
import { ComboRank, TimingRating } from '../core/Types';

export interface ComboConfig {
  comboTimeoutSec?: number;
}

export class ComboSystem {
  public comboCount = 0;
  public maxCombo = 0;
  public score = 0;
  public multiplier = 1.0;
  public rank: ComboRank = 'D';

  private comboTimer = 0;
  private readonly comboTimeoutSec: number;

  constructor(config?: ComboConfig) {
    this.comboTimeoutSec = config?.comboTimeoutSec ?? 3.0; // 3 seconds window to chain hits
  }

  /**
   * Register a successful hit with a given timing rating.
   * Calculates score with multiplier and advances combo counter.
   */
  public registerHit(baseScore: number, rating: TimingRating): number {
    let ratingBonus = 1.0;
    let comboInc = 1;

    switch (rating) {
      case 'PERFECT':
        ratingBonus = 2.0;
        comboInc = 2;
        break;
      case 'GREAT':
        ratingBonus = 1.5;
        comboInc = 1;
        break;
      case 'GOOD':
        ratingBonus = 1.0;
        comboInc = 1;
        break;
      case 'MISS':
        this.registerMiss();
        return 0;
    }

    this.comboCount += comboInc;
    if (this.comboCount > this.maxCombo) {
      this.maxCombo = this.comboCount;
    }

    this.comboTimer = this.comboTimeoutSec;
    this.updateRankAndMultiplier();

    const addedScore = Math.round(baseScore * this.multiplier * ratingBonus);
    this.score += addedScore;

    this.emitUpdate(false);
    return addedScore;
  }

  /**
   * Drops current combo streak upon whiff or taking damage.
   */
  public registerMiss(): void {
    if (this.comboCount > 0) {
      this.comboCount = 0;
      this.updateRankAndMultiplier();
      this.emitUpdate(true);
    }
  }

  /**
   * Update combo decay timer each frame.
   */
  public update(dtSec: number): void {
    if (this.comboCount > 0) {
      this.comboTimer -= dtSec;
      if (this.comboTimer <= 0) {
        this.registerMiss();
      }
    }
  }

  public reset(): void {
    this.comboCount = 0;
    this.maxCombo = 0;
    this.score = 0;
    this.multiplier = 1.0;
    this.rank = 'D';
    this.comboTimer = 0;
    this.emitUpdate(false);
  }

  private updateRankAndMultiplier(): void {
    if (this.comboCount >= 80) {
      this.rank = 'DIMENSIONAL';
      this.multiplier = 4.0;
    } else if (this.comboCount >= 55) {
      this.rank = 'SS';
      this.multiplier = 3.0;
    } else if (this.comboCount >= 35) {
      this.rank = 'S';
      this.multiplier = 2.5;
    } else if (this.comboCount >= 20) {
      this.rank = 'A';
      this.multiplier = 2.0;
    } else if (this.comboCount >= 10) {
      this.rank = 'B';
      this.multiplier = 1.5;
    } else if (this.comboCount >= 5) {
      this.rank = 'C';
      this.multiplier = 1.2;
    } else {
      this.rank = 'D';
      this.multiplier = 1.0;
    }
  }

  private emitUpdate(isBroken: boolean): void {
    eventBus.emit('combat:combo', {
      comboCount: this.comboCount,
      multiplier: this.multiplier,
      rank: this.rank,
      score: this.score,
      isBroken
    });
  }
}
