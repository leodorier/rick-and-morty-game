/**
 * High-performance 16-bit procedural pixel-art rendering routines.
 * Faithfully recreates Paul Robertson's hyper-saturated arcade sprite art.
 */

export interface SpriteRenderContext {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  facingRight: boolean;
  animFrame: number;
  state: string;
  staggerTimer?: number;
  flash?: boolean;
}

export class PixelRenderers {
  /**
   * Render Rick Sanchez
   */
  public static drawRick(renderCtx: SpriteRenderContext): void {
    const { ctx, x, y, facingRight, animFrame, state, flash } = renderCtx;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (!facingRight) ctx.scale(-1, 1);

    if (flash) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-16, -56, 32, 56);
      ctx.restore();
      return;
    }

    const bob = Math.sin(animFrame * 0.4) * 2;

    // 1. Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Legs & Brown Pants
    ctx.fillStyle = '#6B4423';
    if (state === 'RUN') {
      const legOffset = Math.sin(animFrame * 0.8) * 8;
      ctx.fillRect(-8 + legOffset, -18, 6, 18);
      ctx.fillRect(2 - legOffset, -18, 6, 18);
    } else {
      ctx.fillRect(-8, -18, 6, 18);
      ctx.fillRect(2, -18, 6, 18);
    }

    // Shoes
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(-9, -2, 8, 3);
    ctx.fillRect(2, -2, 8, 3);

    // 3. Lab Coat (White/Silver)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-12, -40 + bob, 24, 26);
    // Coat inner shadow & hem
    ctx.fillStyle = '#CBD5E1';
    ctx.fillRect(-12, -16 + bob, 24, 4);

    // 4. Cyan Shirt
    ctx.fillStyle = '#17C8C4';
    ctx.fillRect(-6, -38 + bob, 12, 20);

    // Belt
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(-6, -20 + bob, 12, 3);
    ctx.fillStyle = '#F1C40F'; // Buckle
    ctx.fillRect(-2, -20 + bob, 4, 3);

    // 5. Head & Spiky Hair
    const headY = -54 + bob;
    // Spiky Hair (Light Blue)
    ctx.fillStyle = '#A0D8EF';
    ctx.beginPath();
    ctx.moveTo(-16, headY + 4);
    ctx.lineTo(-20, headY - 4);
    ctx.lineTo(-12, headY - 6);
    ctx.lineTo(-14, headY - 14);
    ctx.lineTo(-4, headY - 10);
    ctx.lineTo(0, headY - 18);
    ctx.lineTo(6, headY - 10);
    ctx.lineTo(14, headY - 14);
    ctx.lineTo(12, headY - 6);
    ctx.lineTo(20, headY - 4);
    ctx.lineTo(16, headY + 4);
    ctx.closePath();
    ctx.fill();

    // Face Skin
    ctx.fillStyle = '#EBD5BE';
    ctx.fillRect(-9, headY - 2, 18, 16);

    // Unibrow (Cyan)
    ctx.fillStyle = '#6CBAD8';
    ctx.fillRect(-7, headY + 1, 14, 2);

    // Eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-6, headY + 4, 4, 4);
    ctx.fillRect(2, headY + 4, 4, 4);
    // Pupils
    ctx.fillStyle = '#000000';
    ctx.fillRect(-4, headY + 5, 2, 2);
    ctx.fillRect(4, headY + 5, 2, 2);

    // Mouth / Drool
    ctx.fillStyle = '#39FF14'; // Toxic green drool
    ctx.fillRect(-1, headY + 11, 2, 3);

    // 6. Action-Specific Weapons / Poses
    if (state === 'BLASTER') {
      // Blaster Gun
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(8, -32 + bob, 14, 6);
      ctx.fillStyle = '#39FF14'; // Glowing cell
      ctx.fillRect(10, -31 + bob, 4, 4);
      // Muzzle Flare
      ctx.fillStyle = '#00FFFF';
      ctx.fillRect(22, -34 + bob, 8, 10);
    } else if (state === 'HAMMER') {
      // Charged Sledgehammer
      ctx.fillStyle = '#8C6239'; // Wooden handle
      ctx.fillRect(6, -60 + bob, 4, 36);
      ctx.fillStyle = '#475569'; // Steel head
      ctx.fillRect(0, -68 + bob, 16, 12);
      ctx.fillStyle = '#39FF14'; // Electric arcs
      ctx.fillRect(-2, -66 + bob, 20, 2);
    } else if (state === 'PARRY') {
      // Portal Shield Ring
      ctx.strokeStyle = '#39FF14';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(8, -30 + bob, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(8, -30 + bob, 18, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Render Morty Smith
   */
  public static drawMorty(renderCtx: SpriteRenderContext): void {
    const { ctx, x, y, facingRight, animFrame, state, flash } = renderCtx;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (!facingRight) ctx.scale(-1, 1);

    if (flash) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-12, -42, 24, 42);
      ctx.restore();
      return;
    }

    const bob = Math.sin(animFrame * 0.4) * 1.5;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    if (state === 'SLIDE') {
      // Low Slide Tackle Pose
      ctx.fillStyle = '#1D4ED8'; // Blue Jeans extended
      ctx.fillRect(-16, -10, 28, 8);
      ctx.fillStyle = '#FFFF00'; // Yellow Shirt
      ctx.fillRect(-20, -16, 14, 10);
      // Head
      ctx.fillStyle = '#6A4F00'; // Hair
      ctx.fillRect(-26, -22, 10, 10);
      ctx.fillStyle = '#EBD5BE'; // Face
      ctx.fillRect(-24, -18, 8, 8);
      ctx.restore();
      return;
    }

    // Legs / Jeans
    ctx.fillStyle = '#1D4ED8';
    if (state === 'RUN') {
      const leg = Math.sin(animFrame * 0.8) * 6;
      ctx.fillRect(-6 + leg, -14, 5, 14);
      ctx.fillRect(1 - leg, -14, 5, 14);
    } else {
      ctx.fillRect(-6, -14, 5, 14);
      ctx.fillRect(1, -14, 5, 14);
    }
    // Shoes (White sneakers)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-7, -2, 6, 3);
    ctx.fillRect(1, -2, 6, 3);

    // Yellow Shirt
    ctx.fillStyle = '#FFFF00';
    ctx.fillRect(-8, -28 + bob, 16, 16);

    // Head
    const headY = -40 + bob;
    // Brown round hair
    ctx.fillStyle = '#6A4F00';
    ctx.beginPath();
    ctx.arc(0, headY, 10, Math.PI, 0);
    ctx.fill();

    // Face
    ctx.fillStyle = '#EBD5BE';
    ctx.fillRect(-7, headY - 2, 14, 12);

    // Eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-5, headY + 1, 4, 4);
    ctx.fillRect(1, headY + 1, 4, 4);
    ctx.fillStyle = '#000000';
    ctx.fillRect(-3, headY + 2, 2, 2);
    ctx.fillRect(3, headY + 2, 2, 2);

    // Open mouth / Nervous expression
    ctx.fillStyle = '#9E0059';
    ctx.fillRect(-2, headY + 7, 4, 2);

    // Special: Noob-Noob Broom Spin Pose
    if (state === 'BROOM_SPIN') {
      ctx.strokeStyle = '#39FF14';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -20 + bob, 24, 0, Math.PI * 2);
      ctx.stroke();

      // Golden Broomstick
      ctx.fillStyle = '#D4A373';
      ctx.fillRect(-20, -22 + bob, 40, 4);
      ctx.fillStyle = '#39FF14'; // Toxic bristles
      ctx.fillRect(16, -26 + bob, 8, 12);
      ctx.fillRect(-24, -26 + bob, 8, 12);
    }

    ctx.restore();
  }

  /**
   * Render Caterpillar Grub Monster
   */
  public static drawCaterpillar(renderCtx: SpriteRenderContext): void {
    const { ctx, x, y, facingRight, animFrame, flash } = renderCtx;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (!facingRight) ctx.scale(-1, 1);

    if (flash) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-24, -30, 48, 30);
      ctx.restore();
      return;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4 Writhing Segments
    for (let i = 3; i >= 0; i--) {
      const segX = -i * 10 + 10;
      const segBob = Math.sin(animFrame * 0.6 + i) * 3;
      const radius = 10 - i * 1.2;

      ctx.fillStyle = i % 2 === 0 ? '#70FF00' : '#009944';
      ctx.beginPath();
      ctx.arc(segX, -12 + segBob, radius, 0, Math.PI * 2);
      ctx.fill();

      // Yellow spots
      ctx.fillStyle = '#FFFF00';
      ctx.fillRect(segX - 2, -16 + segBob, 4, 4);
    }

    // Head & Fangs (Front)
    const headX = 14;
    const headBob = Math.sin(animFrame * 0.6) * 3;
    ctx.fillStyle = '#FF0055'; // Mouth
    ctx.fillRect(headX + 4, -15 + headBob, 6, 8);
    // Orange Fangs
    ctx.fillStyle = '#FB8500';
    ctx.beginPath();
    ctx.moveTo(headX + 6, -18 + headBob);
    ctx.lineTo(headX + 12, -14 + headBob);
    ctx.lineTo(headX + 6, -10 + headBob);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Render Flying Corrupted Moth
   */
  public static drawFlyingMoth(renderCtx: SpriteRenderContext): void {
    const { ctx, x, y, facingRight, animFrame, flash } = renderCtx;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (!facingRight) ctx.scale(-1, 1);

    if (flash) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-18, -24, 36, 24);
      ctx.restore();
      return;
    }

    const wingFlap = Math.sin(animFrame * 1.2) * 12;

    // Glowing Neon Wings
    ctx.fillStyle = 'rgba(0, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(-18, -26 + wingFlap);
    ctx.lineTo(-12, -4);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 0, 127, 0.75)';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(18, -26 + wingFlap);
    ctx.lineTo(12, -4);
    ctx.fill();

    // Body
    ctx.fillStyle = '#3D001D';
    ctx.fillRect(-5, -16, 10, 14);

    // Glowing Eyes
    ctx.fillStyle = '#FFFF00';
    ctx.fillRect(2, -14, 3, 3);

    ctx.restore();
  }

  /**
   * Render Bio-Suit Plasma Trooper
   */
  public static drawPinkTrooper(renderCtx: SpriteRenderContext): void {
    const { ctx, x, y, facingRight, animFrame, flash } = renderCtx;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (!facingRight) ctx.scale(-1, 1);

    if (flash) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-14, -40, 28, 40);
      ctx.restore();
      return;
    }

    const bob = Math.sin(animFrame * 0.4) * 1.5;

    // Legs
    ctx.fillStyle = '#8A0044';
    ctx.fillRect(-7, -16, 5, 16);
    ctx.fillRect(2, -16, 5, 16);

    // Bio Suit Torso
    ctx.fillStyle = '#FF4DA6';
    ctx.fillRect(-9, -32 + bob, 18, 18);

    // Helmet & Dark Visor
    ctx.fillStyle = '#FFB3D9';
    ctx.fillRect(-7, -44 + bob, 14, 13);
    ctx.fillStyle = '#100010';
    ctx.fillRect(0, -40 + bob, 6, 4);

    // Plasma Rifle
    ctx.fillStyle = '#CBD5E1';
    ctx.fillRect(6, -26 + bob, 14, 5);
    ctx.fillStyle = '#00FFFF';
    ctx.fillRect(16, -25 + bob, 4, 3);

    ctx.restore();
  }

  /**
   * Render Butter Bot Legion
   */
  public static drawButterBot(renderCtx: SpriteRenderContext): void {
    const { ctx, x, y, facingRight, animFrame, flash } = renderCtx;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (!facingRight) ctx.scale(-1, 1);

    if (flash) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-12, -32, 24, 32);
      ctx.restore();
      return;
    }

    // Treads
    ctx.fillStyle = '#334155';
    ctx.fillRect(-10, -6, 20, 6);

    // Chassis Box
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(-8, -22, 16, 16);

    // Red Camera Eye
    ctx.fillStyle = '#FF0055';
    ctx.fillRect(2, -18, 4, 4);

    // Butter Stick on Head
    ctx.fillStyle = '#FFFF00';
    ctx.fillRect(-5, -28, 10, 6);

    // Laser Blade Arm
    const armSwing = Math.sin(animFrame * 0.8) * 6;
    ctx.fillStyle = '#00FFFF';
    ctx.fillRect(6, -20 + armSwing, 12, 3);

    ctx.restore();
  }

  /**
   * Render Boss 1: The Rick-Car Mech
   */
  public static drawRickCarBoss(renderCtx: SpriteRenderContext & { coreExposed?: boolean; healthRatio?: number }): void {
    const { ctx, x, y, facingRight, animFrame, flash, coreExposed } = renderCtx;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (!facingRight) ctx.scale(-1, 1);

    if (flash) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-55, -60, 110, 60);
      ctx.restore();
      return;
    }

    const hover = Math.sin(animFrame * 0.3) * 3;

    // Jet Thruster Fire
    ctx.fillStyle = '#00FFFF';
    ctx.fillRect(-65, -30 + hover, 14, 12);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-55, -28 + hover, 8, 8);

    // Main Spaceship Body (Green metallic)
    ctx.fillStyle = '#2D6A4F';
    ctx.fillRect(-50, -45 + hover, 100, 38);
    ctx.fillStyle = '#52B788';
    ctx.fillRect(-45, -42 + hover, 90, 8);

    // Glass Dome Cockpit (Cyan glass)
    ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.ellipse(0, -45 + hover, 24, 18, 0, Math.PI, 0);
    ctx.fill();

    // Dual Headlight Eyes
    ctx.fillStyle = '#FFFF00';
    ctx.fillRect(40, -32 + hover, 8, 8);
    ctx.fillStyle = '#FF0055';
    ctx.fillRect(44, -30 + hover, 4, 4);

    // Radiator Core (Glows when vulnerable)
    if (coreExposed) {
      ctx.fillStyle = '#FF0055';
      ctx.fillRect(10, -28 + hover, 20, 16);
      ctx.fillStyle = '#FFFF00';
      ctx.fillRect(14, -24 + hover, 12, 8);
    } else {
      ctx.fillStyle = '#1B4332';
      ctx.fillRect(10, -28 + hover, 20, 16);
    }

    ctx.restore();
  }

  /**
   * Render Boss 2: Steely Mop Boss (Noob-Noob)
   */
  public static drawSteelyMopBoss(renderCtx: SpriteRenderContext & { isCharging?: boolean }): void {
    const { ctx, x, y, facingRight, animFrame, flash, isCharging } = renderCtx;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (!facingRight) ctx.scale(-1, 1);

    if (flash) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-25, -60, 50, 60);
      ctx.restore();
      return;
    }

    const bob = Math.sin(animFrame * 0.4) * 2;

    // Steel Armor Body
    ctx.fillStyle = '#475569';
    ctx.fillRect(-16, -42 + bob, 32, 28);
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(-12, -38 + bob, 24, 6);

    // Cape (Red)
    ctx.fillStyle = '#FF0055';
    ctx.fillRect(-22, -40 + bob, 8, 30);

    // Head (Noob-Noob snout)
    ctx.fillStyle = '#EBD5BE';
    ctx.fillRect(-10, -56 + bob, 20, 16);
    // Yellow snout
    ctx.fillStyle = '#FFFF00';
    ctx.fillRect(6, -50 + bob, 8, 6);
    // Eye mask
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(-6, -53 + bob, 14, 4);

    // Giant Steely Mop Weapon
    const mopAngle = isCharging ? Math.PI / 4 : 0;
    ctx.save();
    ctx.rotate(mopAngle);
    ctx.fillStyle = '#CBD5E1'; // Handle
    ctx.fillRect(12, -64 + bob, 6, 54);
    ctx.fillStyle = '#39FF14'; // Toxic Mop Strings
    ctx.fillRect(4, -72 + bob, 22, 12);
    ctx.restore();

    ctx.restore();
  }

  /**
   * Render Boss 3: The Toilet Throne King (Gloobie)
   */
  public static drawToiletThroneBoss(renderCtx: SpriteRenderContext & { phase?: number }): void {
    const { ctx, x, y, facingRight, animFrame, flash } = renderCtx;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (!facingRight) ctx.scale(-1, 1);

    if (flash) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-45, -90, 90, 90);
      ctx.restore();
      return;
    }

    // 1. Pristine Porcelain Multi-Tier Throne
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-35, -45, 70, 45);
    ctx.fillStyle = '#CBD5E1'; // Marble base
    ctx.fillRect(-45, -12, 90, 12);

    // Golden Toilet Tank & Pipes
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(-30, -80, 20, 40);
    ctx.fillRect(-20, -85, 40, 10);

    // Glowing Cyan Toilet Bowl Vortex
    ctx.fillStyle = '#00FFFF';
    ctx.beginPath();
    ctx.ellipse(10, -32, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Gloobie (The Slime King) on the throne
    const bob = Math.sin(animFrame * 0.5) * 2;
    ctx.fillStyle = '#FF9900'; // Slime body
    ctx.beginPath();
    ctx.arc(8, -50 + bob, 16, 0, Math.PI * 2);
    ctx.fill();

    // Crown
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(-2, -66 + bob);
    ctx.lineTo(2, -74 + bob);
    ctx.lineTo(8, -68 + bob);
    ctx.lineTo(14, -74 + bob);
    ctx.lineTo(18, -66 + bob);
    ctx.closePath();
    ctx.fill();

    // Derp Eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(4, -54 + bob, 5, 5);
    ctx.fillRect(11, -54 + bob, 5, 5);
    ctx.fillStyle = '#000000';
    ctx.fillRect(6, -53 + bob, 2, 2);
    ctx.fillRect(13, -53 + bob, 2, 2);

    ctx.restore();
  }
}
