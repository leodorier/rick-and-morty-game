import { describe, it, expect } from 'vitest';
import { SceneManager, StageId } from '../../src/core/SceneManager';

describe('SceneManager (Stage Progression & Camera)', () => {
  it('starts on PROLOGUE_DINING stage', () => {
    const sceneManager = new SceneManager();
    expect(sceneManager.currentStage).toBe('PROLOGUE_DINING');
    expect(sceneManager.stageTimer).toBe(0);
  });

  it('transitions cleanly between all stage flow milestones', () => {
    const sceneManager = new SceneManager();
    const stageFlow: StageId[] = [
      'PROLOGUE_DINING',
      'WASTELAND_WAVES',
      'BOSS_1_RICK_CAR',
      'INTERLUDE_BUTTER_BOTS',
      'BOSS_2_STEELY_MOP',
      'BOSS_3_TOILET_THRONE',
      'VICTORY'
    ];

    for (const stage of stageFlow) {
      sceneManager.setStage(stage);
      expect(sceneManager.currentStage).toBe(stage);
      expect(sceneManager.stageTimer).toBe(0);

      sceneManager.update(1.0);
      expect(sceneManager.stageTimer).toBe(1.0);
    }
  });

  it('advances camera parallax scroll position during update', () => {
    const sceneManager = new SceneManager();
    const initialCam = sceneManager.cameraX;

    sceneManager.update(2.0); // 2 seconds * 15 px/s = 30px
    expect(sceneManager.cameraX).toBe(initialCam + 30);
  });
});
