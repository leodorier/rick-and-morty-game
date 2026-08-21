/**
 * 2D Vector mathematics for positioning, velocity, forces, and collisions.
 */
export class Vector2 {
  public x: number;
  public y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  public static zero(): Vector2 {
    return new Vector2(0, 0);
  }

  public static from(x: number, y: number): Vector2 {
    return new Vector2(x, y);
  }

  public set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  public clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  public copy(other: Vector2): this {
    this.x = other.x;
    this.y = other.y;
    return this;
  }

  public add(other: Vector2): Vector2 {
    return new Vector2(this.x + other.x, this.y + other.y);
  }

  public addMut(other: Vector2): this {
    this.x += other.x;
    this.y += other.y;
    return this;
  }

  public addScalars(x: number, y: number): Vector2 {
    return new Vector2(this.x + x, this.y + y);
  }

  public sub(other: Vector2): Vector2 {
    return new Vector2(this.x - other.x, this.y - other.y);
  }

  public subMut(other: Vector2): this {
    this.x -= other.x;
    this.y -= other.y;
    return this;
  }

  public scale(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  public scaleMut(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  public mul(other: Vector2): Vector2 {
    return new Vector2(this.x * other.x, this.y * other.y);
  }

  public div(scalar: number): Vector2 {
    if (scalar === 0) return new Vector2(0, 0);
    return new Vector2(this.x / scalar, this.y / scalar);
  }

  public lengthSq(): number {
    return this.x * this.x + this.y * this.y;
  }

  public length(): number {
    return Math.sqrt(this.lengthSq());
  }

  public normalize(): Vector2 {
    const len = this.length();
    if (len === 0) return new Vector2(0, 0);
    return new Vector2(this.x / len, this.y / len);
  }

  public normalizeMut(): this {
    const len = this.length();
    if (len > 0) {
      this.x /= len;
      this.y /= len;
    }
    return this;
  }

  public dot(other: Vector2): number {
    return this.x * other.x + this.y * other.y;
  }

  public distance(other: Vector2): number {
    return Math.sqrt(this.distanceSq(other));
  }

  public distanceSq(other: Vector2): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return dx * dx + dy * dy;
  }

  public lerp(other: Vector2, t: number): Vector2 {
    const clampedT = Math.max(0, Math.min(1, t));
    return new Vector2(
      this.x + (other.x - this.x) * clampedT,
      this.y + (other.y - this.y) * clampedT
    );
  }

  public equals(other: Vector2, epsilon = 0.0001): boolean {
    return Math.abs(this.x - other.x) <= epsilon && Math.abs(this.y - other.y) <= epsilon;
  }
}
