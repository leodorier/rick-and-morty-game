import { describe, it, expect } from 'vitest';
import { Vector2 } from '../../src/utils/Vector2';

describe('Vector2 Utility', () => {
  it('should initialize with default or provided coordinates', () => {
    const v1 = new Vector2();
    expect(v1.x).toBe(0);
    expect(v1.y).toBe(0);

    const v2 = new Vector2(10, -5);
    expect(v2.x).toBe(10);
    expect(v2.y).toBe(-5);
  });

  it('should perform vector addition, subtraction, and scaling', () => {
    const a = new Vector2(3, 4);
    const b = new Vector2(1, 2);

    const sum = a.add(b);
    expect(sum.x).toBe(4);
    expect(sum.y).toBe(6);

    const diff = a.sub(b);
    expect(diff.x).toBe(2);
    expect(diff.y).toBe(2);

    const scaled = a.scale(2);
    expect(scaled.x).toBe(6);
    expect(scaled.y).toBe(8);
  });

  it('should compute length and normalization correctly', () => {
    const v = new Vector2(3, 4);
    expect(v.length()).toBe(5);
    expect(v.lengthSq()).toBe(25);

    const normalized = v.normalize();
    expect(normalized.length()).toBeCloseTo(1.0, 5);
    expect(normalized.x).toBeCloseTo(0.6, 5);
    expect(normalized.y).toBeCloseTo(0.8, 5);
  });

  it('should compute distance and dot product', () => {
    const p1 = new Vector2(0, 0);
    const p2 = new Vector2(3, 4);
    expect(p1.distance(p2)).toBe(5);
    expect(p1.dot(p2)).toBe(0);

    const a = new Vector2(2, 3);
    const b = new Vector2(4, 5);
    expect(a.dot(b)).toBe(2 * 4 + 3 * 5); // 8 + 15 = 23
  });

  it('should lerp smoothly between two vectors', () => {
    const start = new Vector2(0, 100);
    const end = new Vector2(100, 200);

    const mid = start.lerp(end, 0.5);
    expect(mid.x).toBe(50);
    expect(mid.y).toBe(150);
  });
});
