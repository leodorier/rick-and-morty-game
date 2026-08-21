import { ComboRank, BeatState } from '../core/Types';

export interface HUDState {
  rickHealth: number;
  rickMaxHealth: number;
  mortyHealth: number;
  mortyMaxHealth: number;
  comboCount: number;
  comboRank: ComboRank;
  comboMultiplier: number;
  score: number;
  corruption: number; // 0..100
  superCharge: number; // 0..100
  beatState: BeatState;
  boss?: {
    name: string;
    health: number;
    maxHealth: number;
    phase: number;
    maxPhases: number;
  } | null;
}

export class HUDRenderer {
  private flashTimer = 0;

  public render(ctx: CanvasRenderingContext2D, state: HUDState, width = 480, height = 270): void {
    this.flashTimer += 0.05;

    this.renderPlayerHealth(ctx, state);
    this.renderComboDisplay(ctx, state);
    this.renderCorruptionMeter(ctx, state, width);
    this.renderRhythmBeatBar(ctx, state.beatState, width, height);

    if (state.boss) {
      this.renderBossHealth(ctx, state.boss, width);
    }
  }

  private renderPlayerHealth(ctx: CanvasRenderingContext2D, state: HUDState): void {
    // 1. P1 RICK Health (Top Left)
    const p1X = 10;
    const p1Y = 8;
    const barWidth = 110;
    const barHeight = 8;

    // Rick Name & Portrait Tag
    ctx.fillStyle = '#00FFFF';
    ctx.font = 'bold 8px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('P1 RICK', p1X, p1Y + 6);

    // Health Bar Frame
    const hpX = p1X + 42;
    ctx.fillStyle = '#03045E';
    ctx.fillRect(hpX - 1, p1Y - 1, barWidth + 2, barHeight + 2);
    ctx.fillStyle = '#101020';
    ctx.fillRect(hpX, p1Y, barWidth, barHeight);

    // Health Fill (Cyan Gradient)
    const hpRatio = Math.max(0, Math.min(1, state.rickHealth / state.rickMaxHealth));
    const fillW = Math.round(barWidth * hpRatio);
    if (fillW > 0) {
      const grad = ctx.createLinearGradient(hpX, p1Y, hpX + fillW, p1Y);
      grad.addColorStop(0, '#00FFFF');
      grad.addColorStop(1, '#0077B6');
      ctx.fillStyle = grad;
      ctx.fillRect(hpX, p1Y, fillW, barHeight);

      // Specular highlight line
      ctx.fillStyle = '#E0FFFF';
      ctx.fillRect(hpX, p1Y, fillW, 2);
    }

    // Super Meter Bar under Rick
    const superY = p1Y + 11;
    const superW = Math.round((barWidth * Math.min(100, state.superCharge)) / 100);
    ctx.fillStyle = '#101020';
    ctx.fillRect(hpX, superY, barWidth, 4);

    const isMax = state.superCharge >= 100;
    ctx.fillStyle = isMax ? (Math.sin(this.flashTimer * 10) > 0 ? '#FFFF00' : '#FB8500') : '#39FF14';
    ctx.fillRect(hpX, superY, superW, 4);

    ctx.fillStyle = '#AAAAAA';
    ctx.font = '6px "Courier New", monospace';
    ctx.fillText(isMax ? 'SUPER MAX!' : 'SP', p1X, superY + 4);

    // 2. P2 MORTY Health & Assist (Top Right)
    const p2X = 320;
    const p2HpX = p2X + 42;

    ctx.fillStyle = '#FF007F';
    ctx.font = 'bold 8px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('P2 MORTY', p2X - 5, p1Y + 6);

    ctx.fillStyle = '#3D001D';
    ctx.fillRect(p2HpX - 1, p1Y - 1, barWidth + 2, barHeight + 2);
    ctx.fillStyle = '#101020';
    ctx.fillRect(p2HpX, p1Y, barWidth, barHeight);

    const mortyHpRatio = Math.max(0, Math.min(1, state.mortyHealth / state.mortyMaxHealth));
    const mortyFillW = Math.round(barWidth * mortyHpRatio);
    if (mortyFillW > 0) {
      const gradM = ctx.createLinearGradient(p2HpX, p1Y, p2HpX + mortyFillW, p1Y);
      gradM.addColorStop(0, '#FFE5F1');
      gradM.addColorStop(0.5, '#FF007F');
      gradM.addColorStop(1, '#8A0044');
      ctx.fillStyle = gradM;
      ctx.fillRect(p2HpX, p1Y, mortyFillW, barHeight);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(p2HpX, p1Y, mortyFillW, 2);
    }
  }

  private renderComboDisplay(ctx: CanvasRenderingContext2D, state: HUDState): void {
    if (state.comboCount > 0) {
      ctx.save();
      const comboX = 14;
      const comboY = 55;

      ctx.fillStyle = '#FFFF00';
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.shadowColor = '#FF8800';
      ctx.shadowBlur = 4;
      ctx.fillText(`${state.comboCount} HIT!`, comboX, comboY);

      // Rank Badge
      ctx.fillStyle = this.getRankColor(state.comboRank);
      ctx.font = 'bold 9px "Courier New", monospace';
      ctx.fillText(`[RANK ${state.comboRank}] x${state.comboMultiplier.toFixed(1)}`, comboX, comboY + 12);

      ctx.restore();
    }

    // Score readout (Top right corner below Morty)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 8px "Courier New", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${state.score.toString().padStart(7, '0')}`, 470, 32);
  }

  private renderCorruptionMeter(ctx: CanvasRenderingContext2D, state: HUDState, width: number): void {
    const meterW = 90;
    const meterH = 6;
    const meterX = (width - meterW) / 2;
    const meterY = 8;

    ctx.fillStyle = '#220033';
    ctx.fillRect(meterX - 1, meterY - 1, meterW + 2, meterH + 2);
    ctx.fillStyle = '#080010';
    ctx.fillRect(meterX, meterY, meterW, meterH);

    const corrRatio = Math.max(0, Math.min(1, state.corruption / 100));
    const fillW = Math.round(meterW * corrRatio);
    if (fillW > 0) {
      ctx.fillStyle = state.corruption > 75 ? (Math.sin(this.flashTimer * 15) > 0 ? '#FF0055' : '#880022') : '#6BDF38';
      ctx.fillRect(meterX, meterY, fillW, meterH);
    }

    ctx.fillStyle = '#BBBBBB';
    ctx.font = '6px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`GLITCH: ${Math.round(state.corruption)}%`, width / 2, meterY + 12);
  }

  private renderRhythmBeatBar(ctx: CanvasRenderingContext2D, beat: BeatState, width: number, height: number): void {
    const barY = height - 16;
    const barWidth = 240;
    const barX = (width - barWidth) / 2;
    const centerNodeX = width / 2;

    // Track line
    ctx.strokeStyle = 'rgba(0, 255, 204, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(barX, barY);
    ctx.lineTo(barX + barWidth, barY);
    ctx.stroke();

    // Center Trigger Target Box
    const targetSize = 10;
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(centerNodeX - targetSize / 2, barY - targetSize / 2, targetSize, targetSize);

    // Inner beat pulse indicator
    const pulseScale = 1.0 + (1.0 - beat.beatProgress) * 0.4;
    ctx.fillStyle = beat.isDrop ? '#FF0055' : '#39FF14';
    ctx.fillRect(
      centerNodeX - (targetSize * pulseScale) / 4,
      barY - (targetSize * pulseScale) / 4,
      (targetSize * pulseScale) / 2,
      (targetSize * pulseScale) / 2
    );

    // Moving beat indicators traveling from edges to center
    const travelDistance = barWidth / 2;
    for (let offset = -2; offset <= 2; offset++) {
      if (offset === 0) continue;
      const dotX = offset < 0 
        ? centerNodeX - travelDistance * (1.0 - (beat.beatProgress - offset) % 1.0)
        : centerNodeX + travelDistance * (1.0 - (beat.beatProgress + offset) % 1.0);

      if (dotX >= barX && dotX <= barX + barWidth) {
        ctx.fillStyle = offset % 2 === 0 ? '#00FFFF' : '#FFFF00';
        ctx.beginPath();
        ctx.arc(dotX, barY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private renderBossHealth(ctx: CanvasRenderingContext2D, boss: NonNullable<HUDState['boss']>, width: number): void {
    const bossW = 200;
    const bossH = 8;
    const bossX = (width - bossW) / 2;
    const bossY = 32;

    ctx.fillStyle = '#FF0055';
    ctx.font = 'bold 8px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#FF0055';
    ctx.shadowBlur = 3;
    ctx.fillText(`${boss.name} [PHASE ${boss.phase}/${boss.maxPhases}]`, width / 2, bossY - 3);
    ctx.shadowBlur = 0;

    // Boss Bar Frame
    ctx.fillStyle = '#330011';
    ctx.fillRect(bossX - 1, bossY - 1, bossW + 2, bossH + 2);
    ctx.fillStyle = '#100008';
    ctx.fillRect(bossX, bossY, bossW, bossH);

    // Boss Bar Fill
    const ratio = Math.max(0, Math.min(1, boss.health / boss.maxHealth));
    const fillW = Math.round(bossW * ratio);
    if (fillW > 0) {
      const gradB = ctx.createLinearGradient(bossX, bossY, bossX + fillW, bossY);
      gradB.addColorStop(0, '#FF0055');
      gradB.addColorStop(1, '#9E0059');
      ctx.fillStyle = gradB;
      ctx.fillRect(bossX, bossY, fillW, bossH);
      ctx.fillStyle = '#FFAACC';
      ctx.fillRect(bossX, bossY, fillW, 2);
    }
  }

  private getRankColor(rank: ComboRank): string {
    switch (rank) {
      case 'DIMENSIONAL': return '#FF0055';
      case 'SS': return '#FFFF00';
      case 'S': return '#FB8500';
      case 'A': return '#39FF14';
      case 'B': return '#00FFFF';
      case 'C': return '#A0CFB0';
      default: return '#888888';
    }
  }
}
