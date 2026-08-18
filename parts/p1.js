
class Vector2D {
  constructor(x = 0, y = 0) {
    this.x = Number(x) || 0;
    this.y = Number(y) || 0;
  }
  set(x, y) { this.x = Number(x) || 0; this.y = Number(y) || 0; return this; }
  copy() { return new Vector2D(this.x, this.y); }
  add(v) { this.x += v.x; this.y += v.y; return this; }
  static add(v1, v2) { return new Vector2D(v1.x + v2.x, v1.y + v2.y); }
  sub(v) { this.x -= v.x; this.y -= v.y; return this; }
  static sub(v1, v2) { return new Vector2D(v1.x - v2.x, v1.y - v2.y); }
  mult(n) { this.x *= n; this.y *= n; return this; }
  static mult(v, n) { return new Vector2D(v.x * n, v.y * n); }
  div(n) { if (n !== 0) { this.x /= n; this.y /= n; } return this; }
  magSq() { return this.x * this.x + this.y * this.y; }
  mag() { return Math.sqrt(this.magSq()); }
  heading() { return Math.atan2(this.y, this.x); }
  normalize() {
    const m = this.mag();
    if (m > 0.00001) this.div(m);
    else this.set(0, 0);
    return this;
  }
  unit() { return this.copy().normalize(); }
  dot(v) { return this.x * v.x + this.y * v.y; }
  cross(v) { return this.x * v.y - this.y * v.x; }
  distSq(v) { const dx = this.x - v.x; const dy = this.y - v.y; return dx * dx + dy * dy; }
  dist(v) { return Math.sqrt(this.distSq(v)); }
  rotate(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const nx = this.x * cos - this.y * sin;
    const ny = this.x * sin + this.y * cos;
    this.x = nx; this.y = ny;
    return this;
  }
  static rotate(v, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector2D(v.x * cos - v.y * sin, v.x * sin + v.y * cos);
  }
  perp() { return new Vector2D(-this.y, this.x); }
  static fromAngle(angle, length = 1) {
    return new Vector2D(Math.cos(angle) * length, Math.sin(angle) * length);
  }
}

function drawRoundedRect(ctx, x, y, width, height, radius = 0) {
  const r = Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.lineTo(x + width, y + height - r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
  ctx.lineTo(x + r, y + height);
  ctx.arcTo(x, y + height, x, y + height - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function closestPointsSegmentSegment(p1, q1, p2, q2) {
  const d1 = Vector2D.sub(q1, p1);
  const d2 = Vector2D.sub(q2, p2);
  const r  = Vector2D.sub(p1, p2);
  const a = d1.magSq();
  const e = d2.magSq();
  const f = d2.dot(r);
  let s = 0, t = 0;

  if (a <= 0.0001 && e <= 0.0001) return { pA: p1.copy(), pB: p2.copy(), dist: p1.dist(p2) };
  if (a <= 0.0001) { s = 0; t = Math.max(0, Math.min(1, f / e)); }
  else {
    const c = d1.dot(r);
    if (e <= 0.0001) { t = 0; s = Math.max(0, Math.min(1, -c / a)); }
    else {
      const b = d1.dot(d2);
      const denom = a * e - b * b;
      s = denom !== 0 ? Math.max(0, Math.min(1, (b * f - c * e) / denom)) : 0;
      t = (b * s + f) / e;
      if (t < 0) { t = 0; s = Math.max(0, Math.min(1, -c / a)); }
      else if (t > 1) { t = 1; s = Math.max(0, Math.min(1, (b - c) / a)); }
    }
  }
  const pA = Vector2D.add(p1, Vector2D.mult(d1, s));
  const pB = Vector2D.add(p2, Vector2D.mult(d2, t));
  return { pA, pB, dist: pA.dist(pB) };
}
