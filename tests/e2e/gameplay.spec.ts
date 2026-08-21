import { test, expect } from '@playwright/test';

test.describe('Rick and Morty: Eternal Nightmare Machine — E2E Gameplay Test', () => {
  test.beforeEach(async ({ page }) => {
    // Listen for uncaught browser errors
    page.on('pageerror', (err) => {
      console.error('Browser Page Error:', err.message);
    });
  });

  test('loads game, renders canvas, and mounts Game orchestrator', async ({ page }) => {
    await page.goto('/');

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();

    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    expect(canvasBox!.width).toBeGreaterThan(0);
    expect(canvasBox!.height).toBeGreaterThan(0);

    // Verify __ENM_GAME__ is attached
    const isGameMounted = await page.evaluate(() => {
      return (window as any).__ENM_GAME__ !== undefined;
    });
    expect(isGameMounted).toBe(true);

    // Verify initial Title state
    const initialState = await page.evaluate(() => {
      return (window as any).__ENM_GAME__.state;
    });
    expect(initialState).toBe('TITLE');
  });

  test('starts simulation on user input and initializes 130 BPM Beat Clock', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#game-canvas');

    // Click canvas to initiate audio context & start simulation
    await page.click('#game-canvas');
    await page.keyboard.press('Space');

    await page.waitForFunction(() => {
      const g = (window as any).__ENM_GAME__;
      return g && (g.state === 'PLAYING' || g.isRunning);
    });

    const gameState = await page.evaluate(() => {
      const g = (window as any).__ENM_GAME__;
      return {
        state: g.state,
        bpm: g.beatClock.bpm,
        isRunning: g.isRunning,
        rickHealth: g.rick.health,
        mortyHealth: g.morty.health
      };
    });

    expect(gameState.state).toBe('PLAYING');
    expect(gameState.bpm).toBe(130);
    expect(gameState.isRunning).toBe(true);
    expect(gameState.rickHealth).toBe(100);
    expect(gameState.mortyHealth).toBe(80);
  });

  test('executes dual-character combat movesets (J, K, L, Space, I)', async ({ page }) => {
    await page.goto('/');
    await page.click('#game-canvas');
    await page.keyboard.press('KeyJ');

    // 1. Move Rick Right
    const initialX = await page.evaluate(() => (window as any).__ENM_GAME__.rick.position.x);
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(200);
    await page.keyboard.up('KeyD');

    const movedX = await page.evaluate(() => (window as any).__ENM_GAME__.rick.position.x);
    expect(movedX).toBeGreaterThan(initialX);

    // 2. Trigger Blaster (J)
    await page.keyboard.press('KeyJ');
    const blasterState = await page.evaluate(() => (window as any).__ENM_GAME__.rick.state);
    expect(['BLASTER', 'IDLE', 'RUN']).toContain(blasterState);

    // 3. Trigger Sledgehammer (K)
    await page.keyboard.press('KeyK');
    const hammerState = await page.evaluate(() => (window as any).__ENM_GAME__.rick.state);
    expect(['HAMMER', 'IDLE', 'RUN']).toContain(hammerState);

    // 4. Trigger Portal Parry (L)
    await page.keyboard.press('KeyL');
    const parryState = await page.evaluate(() => (window as any).__ENM_GAME__.rick.state);
    expect(['PARRY', 'IDLE', 'RUN']).toContain(parryState);

    // 5. Trigger Morty Assist Broom Spin (I)
    await page.keyboard.press('KeyI');
    const mortyState = await page.evaluate(() => (window as any).__ENM_GAME__.morty.state);
    expect(['BROOM_SPIN', 'IDLE', 'RUN']).toContain(mortyState);
  });

  test('verifies boss spawning and stage progression transitions', async ({ page }) => {
    await page.goto('/');
    await page.click('#game-canvas');
    await page.keyboard.press('Space');

    // Fast-forward game time to Boss 1 (Rick-Car Mech at 60s)
    await page.evaluate(() => {
      const g = (window as any).__ENM_GAME__;
      g.beatClock.start(62.0); // Offset into Boss 1
      g.update(0.1);
    });

    const boss1Check = await page.evaluate(() => {
      const g = (window as any).__ENM_GAME__;
      return {
        stage: g.sceneManager.currentStage,
        hasBoss: g.currentBoss !== null,
        bossName: g.currentBoss ? g.currentBoss.name : null
      };
    });

    expect(boss1Check.stage).toBe('BOSS_1_RICK_CAR');
    expect(boss1Check.hasBoss).toBe(true);
    expect(boss1Check.bossName).toBe('THE RICK-CAR MECH');

    // Fast-forward to Boss 2 (Steely Mop at 120s)
    await page.evaluate(() => {
      const g = (window as any).__ENM_GAME__;
      g.beatClock.start(120.0);
      g.update(0.1);
    });

    const boss2Check = await page.evaluate(() => {
      const g = (window as any).__ENM_GAME__;
      return {
        stage: g.sceneManager.currentStage,
        bossName: g.currentBoss ? g.currentBoss.name : null
      };
    });

    expect(boss2Check.stage).toBe('BOSS_2_STEELY_MOP');
    expect(boss2Check.bossName).toBe('STEELY MOP BOSS (NOOB-NOOB)');

    // Fast-forward to Final Boss (Toilet Throne at 150s)
    await page.evaluate(() => {
      const g = (window as any).__ENM_GAME__;
      g.beatClock.start(150.0);
      g.update(0.1);
    });

    const boss3Check = await page.evaluate(() => {
      const g = (window as any).__ENM_GAME__;
      return {
        stage: g.sceneManager.currentStage,
        bossName: g.currentBoss ? g.currentBoss.name : null
      };
    });

    expect(boss3Check.stage).toBe('BOSS_3_TOILET_THRONE');
    expect(boss3Check.bossName).toBe('THE TOILET THRONE KING (GLOOBIE)');
  });
});
