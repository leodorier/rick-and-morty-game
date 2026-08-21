import { Game } from './core/Game';

console.log('Rick and Morty: Eternal Nightmare Machine — Mounting Game...');

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;
  if (!canvas) {
    console.error('Failed to locate #game-canvas');
    return;
  }

  const game = new Game(canvas);
  game.render();

  (window as any).__ENM_GAME__ = game;
  console.log('Eternal Nightmare Machine successfully mounted and ready.');
});
