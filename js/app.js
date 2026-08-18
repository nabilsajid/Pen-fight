
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



const PEN_COLOR_PALETTES = [
  { id: 'cyan', name: 'Cyber Cyan', body: '#00e5ff', cap: '#0077b6', grip: '#0096c7', clip: '#caf0f8' },
  { id: 'crimson', name: 'Crimson Flame', body: '#e53935', cap: '#b71c1c', grip: '#212121', clip: '#cfd8dc' },
  { id: 'lime', name: 'Neon Lime', body: '#00e676', cap: '#00c853', grip: '#1b5e20', clip: '#b9f6ca' },
  { id: 'stealth', name: 'Matte Stealth', body: '#37474f', cap: '#212121', grip: '#cfd8dc', clip: '#90a4ae' },
  { id: 'gold', name: 'Luxury Gold', body: '#ffd700', cap: '#b8860b', grip: '#212121', clip: '#fff8dc' },
  { id: 'purple', name: 'Royal Purple', body: '#8e24aa', cap: '#4a148c', grip: '#ab47bc', clip: '#ffffff' },
  { id: 'orange', name: 'Electric Orange', body: '#ff6d00', cap: '#dd2c00', grip: '#ffab40', clip: '#ffe0b2' },
  { id: 'white', name: 'Pearl White', body: '#f8f9fa', cap: '#e9ecef', grip: '#6c757d', clip: '#00e5ff' },
  { id: 'pink', name: 'Neon Pink', body: '#f72585', cap: '#7209b7', grip: '#3a0ca3', clip: '#4cc9f0' },
  { id: 'emerald', name: 'Emerald Gem', body: '#00b4d8', cap: '#0077b6', grip: '#03045e', clip: '#90e0ef' }
];

const PEN_CONFIGS = {
  mini_dart: {
    id: 'mini_dart',
    name: 'Mini Pocket Dart',
    tagline: 'Ultra Compact & Agile Dart',
    difficulty: 'Hard',
    sizeCategory: 'Extra Small',
    mass: 12, length: 80, radius: 7.5,
    comOffsetRatio: 0.0, massConcentration: 'center',
    restitution: 0.76, friction: 0.965, angularFriction: 0.948,
    bodyColor: '#ff6d00', capColor: '#dd2c00', gripColor: '#ffab40', clipColor: '#ffe0b2',
    nibType: 'needle_point',
    stats: { weight: 25, speed: 98, stability: 35, spin: 94, control: 60, power: 40 },
    description: 'Ultra-small 80mm tactical pen. Fast spins and evasive dodges.'
  },
  slim_needle: {
    id: 'slim_needle',
    name: 'Slim Needle Gel',
    tagline: 'Precision Needle Point',
    difficulty: 'Medium',
    sizeCategory: 'Small',
    mass: 14, length: 110, radius: 8,
    comOffsetRatio: 0.0, massConcentration: 'center',
    restitution: 0.75, friction: 0.965, angularFriction: 0.950,
    bodyColor: '#00e676', capColor: '#00b0ff', gripColor: '#00c853', clipColor: '#b9f6ca',
    nibType: 'needle_point',
    stats: { weight: 35, speed: 92, stability: 50, spin: 88, control: 75, power: 50 },
    description: 'Slender lightweight profile with high maneuverability.'
  },
  standard_ballpoint: {
    id: 'standard_ballpoint',
    name: 'Standard Ballpoint',
    tagline: 'Balanced Beginner Weapon',
    difficulty: 'Easy',
    sizeCategory: 'Medium',
    mass: 18, length: 125, radius: 9,
    comOffsetRatio: 0.0, massConcentration: 'uniform',
    restitution: 0.70, friction: 0.965, angularFriction: 0.958,
    bodyColor: '#1e88e5', capColor: '#0d47a1', gripColor: '#1565c0', clipColor: '#90caf9',
    nibType: 'ballpoint',
    stats: { weight: 55, speed: 70, stability: 75, spin: 50, control: 85, power: 65 },
    description: 'Classic classroom medium pen with centered balance.'
  },
  center_heavy: {
    id: 'center_heavy',
    name: 'Center-Heavy Balancer',
    tagline: 'Precision Straight Ram',
    difficulty: 'Medium',
    sizeCategory: 'Medium',
    mass: 22, length: 120, radius: 9.5,
    comOffsetRatio: 0.02, massConcentration: 'center',
    restitution: 0.68, friction: 0.965, angularFriction: 0.955,
    bodyColor: '#8e24aa', capColor: '#4a148c', gripColor: '#ab47bc', clipColor: '#ffffff',
    nibType: 'fineliner',
    stats: { weight: 60, speed: 75, stability: 88, spin: 45, control: 90, power: 70 },
    description: 'Mass concentrated in the center core. Resists wild off-axis spins.'
  },
  imported_gel: {
    id: 'imported_gel',
    name: 'Imported Gel Pen',
    tagline: 'Edge-Heavy Hook Sweeper',
    difficulty: 'Expert',
    sizeCategory: 'Medium-Large',
    mass: 28, length: 135, radius: 10,
    comOffsetRatio: 0.30, massConcentration: 'edges',
    restitution: 0.64, friction: 0.965, angularFriction: 0.958,
    bodyColor: '#e53935', capColor: '#b71c1c', gripColor: '#212121', clipColor: '#cfd8dc',
    nibType: 'gel_nib',
    stats: { weight: 70, speed: 70, stability: 55, spin: 95, control: 50, power: 88 },
    description: 'Front and rear weighted balance. Unleashes curved hook sweeps.'
  },
  heavy_tank: {
    id: 'heavy_tank',
    name: 'Executive Metal Tank',
    tagline: 'Heavy Battering Ram',
    difficulty: 'Medium',
    sizeCategory: 'Large',
    mass: 52, length: 130, radius: 12,
    comOffsetRatio: 0.0, massConcentration: 'uniform',
    restitution: 0.55, friction: 0.965, angularFriction: 0.960,
    bodyColor: '#37474f', capColor: '#212121', gripColor: '#cfd8dc', clipColor: '#ffd700',
    nibType: 'brass_cone',
    stats: { weight: 95, speed: 45, stability: 98, spin: 35, control: 70, power: 95 },
    description: 'Solid brass chassis. Overwhelming collision momentum.'
  },
  long_reach: {
    id: 'long_reach',
    name: 'Long Caligraphy Wand',
    tagline: 'Wide Defense Sweeper',
    difficulty: 'Hard',
    sizeCategory: 'Extra Long',
    mass: 36, length: 165, radius: 10.5,
    comOffsetRatio: 0.0, massConcentration: 'uniform',
    restitution: 0.62, friction: 0.965, angularFriction: 0.960,
    bodyColor: '#00695c', capColor: '#004d40', gripColor: '#26a69a', clipColor: '#80cbc4',
    nibType: 'metal_cone',
    stats: { weight: 82, speed: 55, stability: 85, spin: 65, control: 65, power: 82 },
    description: 'Extended 165mm reach provides huge tabletop coverage.'
  },
  jumbo_marker: {
    id: 'jumbo_marker',
    name: 'Jumbo Heavy Marker',
    tagline: 'Colossal Giant Barrel',
    difficulty: 'Expert',
    sizeCategory: 'Giant Super-Heavy',
    mass: 65, length: 145, radius: 14.5,
    comOffsetRatio: 0.0, massConcentration: 'uniform',
    restitution: 0.50, friction: 0.965, angularFriction: 0.962,
    bodyColor: '#ffd700', capColor: '#b8860b', gripColor: '#212121', clipColor: '#fff8dc',
    nibType: 'brass_cone',
    stats: { weight: 99, speed: 40, stability: 99, spin: 30, control: 60, power: 99 },
    description: 'Massive 14.5mm radius jumbo barrel. Massive stopping power.'
  }
};

const ARENA_CONFIGS = {
  classic_desk: {
    id: 'classic_desk', name: 'Classic Mahogany Desk', theme: 'wood',
    desc: 'Warm rich wooden tabletop with traditional classroom ambiance.',
    bg: '#141210',
    tableTopGrad: ['#b5834b', '#a8753e', '#ba8a52', '#9e6c35'],
    bevelGrad: ['#5c3a21', '#3e2513', '#2a170b'],
    rimColor: 'rgba(255, 60, 60, 0.4)', accentColor: '#00e5ff',
    frictionMultiplier: 1.0, doodles: true
  },
  dark_arena: {
    id: 'dark_arena', name: 'Dark Stealth Arena', theme: 'stealth',
    desc: 'Matte black premium tabletop with glowing cyan & red neon boundary lighting.',
    bg: '#08090d',
    tableTopGrad: ['#1c202a', '#141720', '#181b24', '#0f1118'],
    bevelGrad: ['#2a3040', '#181c26', '#0d0f15'],
    rimColor: 'rgba(0, 229, 255, 0.7)', accentColor: '#00e5ff',
    frictionMultiplier: 0.98, doodles: false
  },
  classroom: {
    id: 'classroom', name: 'School Bench & Doodles', theme: 'school',
    desc: 'Classroom wooden desk with notebook paper, ruler markings, and pencil doodles.',
    bg: '#161410',
    tableTopGrad: ['#c9975b', '#b38248', '#bd894e', '#a37238'],
    bevelGrad: ['#664226', '#472a15', '#2e190a'],
    rimColor: 'rgba(230, 81, 0, 0.5)', accentColor: '#ffd700',
    frictionMultiplier: 1.02, doodles: true
  },
  studio: {
    id: 'studio', name: 'Pro Studio Slate', theme: 'slate',
    desc: 'Minimalist dark slate photography surface with soft studio lighting.',
    bg: '#0c0d10',
    tableTopGrad: ['#282c34', '#1e2128', '#232730', '#181a20'],
    bevelGrad: ['#3e4452', '#22252c', '#121418'],
    rimColor: 'rgba(255, 255, 255, 0.3)', accentColor: '#ffffff',
    frictionMultiplier: 1.0, doodles: false
  },
  cyber_arena: {
    id: 'cyber_arena', name: 'Cybernetic Grid', theme: 'cyber',
    desc: 'Futuristic glowing carbon arena with pulsing holographic gridlines.',
    bg: '#06080e',
    tableTopGrad: ['#0b1220', '#070b14', '#0d1628', '#050810'],
    bevelGrad: ['#00e5ff', '#0077b6', '#023e8a'],
    rimColor: 'rgba(0, 229, 255, 0.9)', accentColor: '#00e5ff',
    frictionMultiplier: 0.95, doodles: false
  }
};

class RigidBody {
  constructor(options = {}) {
    this.length = Number(options.length) || 125;
    this.radius = Number(options.radius) || 9.5;
    this.mass = Number(options.mass) || 20;
    this.comOffsetRatio = Number(options.comOffsetRatio) || 0;
    this.massConcentration = options.massConcentration || 'uniform';

    this.pos = options.pos ? options.pos.copy() : new Vector2D(0, 0);
    this.vel = options.vel ? options.vel.copy() : new Vector2D(0, 0);
    this.angle = Number(options.angle) || 0;
    this.angVel = Number(options.angVel) || 0;

    this.restitution = options.restitution !== undefined ? options.restitution : 0.65;
    this.friction = options.friction !== undefined ? options.friction : 0.965;
    this.angularFriction = options.angularFriction !== undefined ? options.angularFriction : 0.958;

    this.isFalling = false;
    this.fallProgress = 0;
    this.fallSpeed = 0;
    this.fallAngleX = 0;
    this.fallAngleY = 0;
    this.isDead = false;
    this.isSleeping = false;

    this.updateInertia();
  }

  updateInertia() {
    const L = this.length;
    const R = this.radius;
    const M = this.mass;
    this.comOffset = this.comOffsetRatio * (L * 0.45);

    let baseInertia;
    if (this.massConcentration === 'center') {
      baseInertia = (1 / 18) * M * (L * L) + 0.5 * M * (R * R);
    } else if (this.massConcentration === 'edges') {
      baseInertia = (1 / 6) * M * (L * L) + 0.5 * M * (R * R);
    } else {
      baseInertia = (1 / 12) * M * (L * L + 3 * R * R);
    }

    this.inertia = baseInertia + M * (this.comOffset * this.comOffset);
    this.invMass = this.mass > 0 ? (1 / this.mass) : 0;
    this.invInertia = this.inertia > 0 ? (1 / this.inertia) : 0;
  }

  getAxis() { return Vector2D.fromAngle(this.angle); }
  getNormal() { return this.getAxis().perp(); }
  getGeometricCenter() {
    const axis = this.getAxis();
    return Vector2D.sub(this.pos, Vector2D.mult(axis, this.comOffset));
  }
  getTipPos() {
    const axis = this.getAxis();
    const halfL = this.length * 0.5 - this.radius;
    return Vector2D.add(this.getGeometricCenter(), Vector2D.mult(axis, halfL));
  }
  getTailPos() {
    const axis = this.getAxis();
    const halfL = this.length * 0.5 - this.radius;
    return Vector2D.sub(this.getGeometricCenter(), Vector2D.mult(axis, halfL));
  }
  getPointAlongAxis(t) {
    const axis = this.getAxis();
    const geom = this.getGeometricCenter();
    const halfL = this.length * 0.5;
    return Vector2D.add(geom, Vector2D.mult(axis, t * halfL));
  }
  getVelocityAtPoint(worldPoint) {
    const rx = worldPoint.x - this.pos.x;
    const ry = worldPoint.y - this.pos.y;
    return new Vector2D(this.vel.x - this.angVel * ry, this.vel.y + this.angVel * rx);
  }
  applyImpulse(impulse, worldPoint) {
    if (this.isFalling || this.isDead) return;
    this.vel.add(Vector2D.mult(impulse, this.invMass));
    const rx = worldPoint.x - this.pos.x;
    const ry = worldPoint.y - this.pos.y;
    const torque = rx * impulse.y - ry * impulse.x;
    this.angVel += torque * this.invInertia;
    this.isSleeping = false;
  }
  integrate(dt, frictionMultiplier = 1.0) {
    if (this.isDead) return;
    if (this.isFalling) {
      this.fallProgress += dt * 2.2;
      this.fallSpeed += 980 * dt;
      this.pos.y += this.fallSpeed * dt * 0.4;
      this.angVel *= 0.99;
      this.angle += this.angVel * dt * 1.5;
      if (this.fallProgress >= 1.0) this.isDead = true;
      return;
    }

    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.angle += this.angVel * dt;

    if (this.vel.magSq() > 25.0) {
      const speed = this.vel.mag();
      const grainDrift = (Math.sin(this.pos.x * 0.04 + this.pos.y * 0.02) * 0.0025) * (speed / 800);
      this.angVel += grainDrift;
    }

    const linFric = Math.pow(this.friction, dt * 60 * frictionMultiplier);
    const angFric = Math.pow(this.angularFriction, dt * 60 * frictionMultiplier);
    this.vel.mult(linFric);
    this.angVel *= angFric;

    if (this.vel.magSq() < 4.0 && Math.abs(this.angVel) < 0.08) {
      this.vel.set(0, 0);
      this.angVel = 0;
      this.isSleeping = true;
    } else {
      this.isSleeping = false;
    }
  }
  isAtRest() {
    return this.isFalling || this.isDead || (this.vel.magSq() < 6.0 && Math.abs(this.angVel) < 0.10);
  }
}

class Pen extends RigidBody {
  constructor(configId = 'standard_ballpoint', owner = 'player1', customPalette = null) {
    const cfg = PEN_CONFIGS[configId] || PEN_CONFIGS.standard_ballpoint;
    super(cfg);
    this.configId = configId;
    this.name = cfg.name;
    this.owner = owner;

    if (customPalette) {
      this.bodyColor = customPalette.body;
      this.capColor = customPalette.cap;
      this.gripColor = customPalette.grip;
      this.clipColor = customPalette.clip;
    } else {
      this.bodyColor = cfg.bodyColor;
      this.capColor = cfg.capColor;
      this.gripColor = cfg.gripColor;
      this.clipColor = cfg.clipColor;
    }

    this.nibType = cfg.nibType;
    this.stats = cfg.stats;
    this.trailHistory = [];
  }

  updateTrail() {
    const speed = this.vel.mag();
    if (speed > 70) {
      const geom = this.getGeometricCenter();
      this.trailHistory.push({ x: geom.x, y: geom.y, alpha: 0.35 });
    }
    for (let i = this.trailHistory.length - 1; i >= 0; i--) {
      this.trailHistory[i].alpha -= 0.04;
      if (this.trailHistory[i].alpha <= 0) this.trailHistory.splice(i, 1);
    }
  }

  draw(ctx, options = {}) {
    if (this.isDead) return;
    this.updateTrail();

    for (const trail of this.trailHistory) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(trail.x, trail.y, this.radius * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, ' + (trail.alpha * 0.3) + ')';
      ctx.fill();
      ctx.restore();
    }

    const geom = this.getGeometricCenter();
    const halfL = this.length * 0.5;
    const R = this.radius;

    ctx.save();
    ctx.translate(geom.x, geom.y);

    if (this.isFalling) {
      const scale = Math.max(0, 1 - this.fallProgress * 0.85);
      ctx.scale(scale, scale);
      ctx.rotate(this.angle + this.fallProgress * Math.PI * 2 * (this.fallAngleX || 1));
      ctx.globalAlpha = Math.max(0, 1 - this.fallProgress * 0.9);
    } else {
      ctx.rotate(this.angle);
    }

    if (!this.isFalling) {
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 6;
      drawRoundedRect(ctx, -halfL, -R, this.length, R * 2, R);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fill();
      ctx.restore();
    }

    const bodyGrad = ctx.createLinearGradient(0, -R, 0, R);
    bodyGrad.addColorStop(0, this.lightenColor(this.bodyColor, 40));
    bodyGrad.addColorStop(0.2, this.lightenColor(this.bodyColor, 75));
    bodyGrad.addColorStop(0.5, this.bodyColor);
    bodyGrad.addColorStop(0.85, this.darkenColor(this.bodyColor, 30));
    bodyGrad.addColorStop(1, this.darkenColor(this.bodyColor, 55));

    drawRoundedRect(ctx, -halfL, -R, this.length, R * 2, R);
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.stroke();

    const gripStartX = halfL * 0.15;
    const gripWidth = halfL * 0.6;
    const gripGrad = ctx.createLinearGradient(0, -R, 0, R);
    gripGrad.addColorStop(0, this.lightenColor(this.gripColor, 20));
    gripGrad.addColorStop(0.4, this.gripColor);
    gripGrad.addColorStop(1, this.darkenColor(this.gripColor, 40));

    ctx.beginPath();
    ctx.rect(gripStartX, -R * 1.02, gripWidth, R * 2.04);
    ctx.fillStyle = gripGrad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    for (let gx = gripStartX + 4; gx < gripStartX + gripWidth - 2; gx += 5) {
      ctx.beginPath();
      ctx.moveTo(gx, -R * 1.02);
      ctx.lineTo(gx, R * 1.02);
      ctx.stroke();
    }

    const nibStartX = halfL * 0.75;
    const tipX = halfL + R * 0.5;
    const coneGrad = ctx.createLinearGradient(0, -R, 0, R);
    coneGrad.addColorStop(0, '#e0e0e0');
    coneGrad.addColorStop(0.3, '#ffffff');
    coneGrad.addColorStop(0.7, '#9e9e9e');
    coneGrad.addColorStop(1, '#616161');

    ctx.beginPath();
    ctx.moveTo(nibStartX, -R * 0.95);
    ctx.lineTo(tipX, -R * 0.25);
    ctx.arc(tipX, 0, R * 0.25, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(nibStartX, R * 0.95);
    ctx.closePath();
    ctx.fillStyle = coneGrad;
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(tipX + 2, 0, R * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = this.nibType === 'brass_cone' ? '#ffd700' : '#212121';
    ctx.fill();

    const capWidth = halfL * 0.5;
    const capStartX = -halfL;
    const capGrad = ctx.createLinearGradient(0, -R, 0, R);
    capGrad.addColorStop(0, this.lightenColor(this.capColor, 30));
    capGrad.addColorStop(0.25, this.lightenColor(this.capColor, 70));
    capGrad.addColorStop(0.6, this.capColor);
    capGrad.addColorStop(1, this.darkenColor(this.capColor, 50));

    drawRoundedRect(ctx, capStartX, -R * 1.04, capWidth, R * 2.08, R);
    ctx.fillStyle = capGrad;
    ctx.fill();
    ctx.stroke();

    const clipGrad = ctx.createLinearGradient(0, -R, 0, R);
    clipGrad.addColorStop(0, '#ffffff');
    clipGrad.addColorStop(0.5, this.clipColor);
    clipGrad.addColorStop(1, '#616161');

    drawRoundedRect(ctx, capStartX + 4, -R * 1.35, capWidth * 0.75, R * 0.35, 2);
    ctx.fillStyle = clipGrad;
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.rect(capStartX + capWidth - 4, -R * 1.05, 4, R * 2.1);
    ctx.fillStyle = this.owner === 'player1' ? '#00e5ff' : '#ff3d00';
    ctx.fill();

    if (options.showCom || options.isAiming) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.comOffset, 0, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ff1744';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(this.comOffset - 7, 0);
      ctx.lineTo(this.comOffset + 7, 0);
      ctx.moveTo(this.comOffset, -7);
      ctx.lineTo(this.comOffset, 7);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  lightenColor(hex, percent) {
    if (!hex || typeof hex !== 'string') return '#1e88e5';
    try {
      const num = parseInt(hex.replace('#', ''), 16);
      const amt = Math.round(2.55 * percent);
      const r = Math.min(255, (num >> 16) + amt);
      const g = Math.min(255, ((num >> 8) & 0x00ff) + amt);
      const b = Math.min(255, (num & 0x0000ff) + amt);
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    } catch(e) { return hex; }
  }

  darkenColor(hex, percent) {
    if (!hex || typeof hex !== 'string') return '#0d47a1';
    try {
      const num = parseInt(hex.replace('#', ''), 16);
      const amt = Math.round(2.55 * percent);
      const r = Math.max(0, (num >> 16) - amt);
      const g = Math.max(0, ((num >> 8) & 0x00ff) - amt);
      const b = Math.max(0, (num & 0x0000ff) - amt);
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    } catch(e) { return hex; }
  }
}



class PhysicsEngine {
  constructor(deskBounds, soundManager = null) {
    this.deskBounds = deskBounds;
    this.soundManager = soundManager;
    this.subSteps = 8;
    this.pens = [];
    this.obstacles = [];
    this.timeScale = 1.0;
    this.roundTurnCount = 0;
    this.lastShotOwner = 'player1';
    this.frictionMultiplier = 1.0;
  }

  setDeskBounds(bounds) { this.deskBounds = bounds; }
  setFrictionMultiplier(mult) { this.frictionMultiplier = mult || 1.0; }
  addPen(pen) { this.pens.push(pen); }
  clear() { this.pens = []; this.obstacles = []; }

  update(dt) {
    if (dt <= 0) return;
    const effectiveDt = dt * this.timeScale;
    const subDt = effectiveDt / this.subSteps;

    for (let step = 0; step < this.subSteps; step++) {
      for (const pen of this.pens) {
        pen.integrate(subDt, this.frictionMultiplier);
      }
      for (let i = 0; i < this.pens.length; i++) {
        for (let j = i + 1; j < this.pens.length; j++) {
          this.resolvePenPenCollision(this.pens[i], this.pens[j]);
        }
      }
      for (const pen of this.pens) {
        this.checkDeskBoundary(pen);
      }
    }
  }

  resolvePenPenCollision(penA, penB) {
    if (penA.isFalling || penA.isDead || penB.isFalling || penB.isDead) return;
    const { pA, pB, dist } = closestPointsSegmentSegment(
      penA.getTailPos(), penA.getTipPos(),
      penB.getTailPos(), penB.getTipPos()
    );
    const minDist = penA.radius + penB.radius;

    if (dist < minDist) {
      const penetration = minDist - dist;
      const normal = dist > 0.0001 ? Vector2D.sub(pB, pA).normalize() : penA.getNormal();
      const contactPoint = Vector2D.add(pA, Vector2D.mult(normal, penA.radius));

      const rA = Vector2D.sub(contactPoint, penA.pos);
      const rB = Vector2D.sub(contactPoint, penB.pos);
      const vA = penA.getVelocityAtPoint(contactPoint);
      const vB = penB.getVelocityAtPoint(contactPoint);
      const vRel = Vector2D.sub(vB, vA);
      const vNormal = vRel.dot(normal);

      const totalInvMass = penA.invMass + penB.invMass;
      if (totalInvMass > 0) {
        const correction = Vector2D.mult(normal, (penetration / totalInvMass) * 0.65);
        penA.pos.sub(Vector2D.mult(correction, penA.invMass));
        penB.pos.add(Vector2D.mult(correction, penB.invMass));
      }

      if (vNormal >= 0) return;

      const e = Math.min(penA.restitution, penB.restitution);
      const rACrossN = rA.cross(normal);
      const rBCrossN = rB.cross(normal);
      const kNormal = penA.invMass + penB.invMass + (rACrossN * rACrossN) * penA.invInertia + (rBCrossN * rBCrossN) * penB.invInertia;
      if (kNormal <= 0.00001) return;

      const jN = -(1 + e) * vNormal / kNormal;
      const normalImpulse = Vector2D.mult(normal, jN);

      penA.applyImpulse(Vector2D.mult(normalImpulse, -1), contactPoint);
      penB.applyImpulse(normalImpulse, contactPoint);

      if (this.soundManager && Math.abs(vNormal) > 15) {
        this.soundManager.playPenCollision(penA, penB, Math.abs(vNormal));
      }
    }
  }

  checkDeskBoundary(pen) {
    if (pen.isFalling || pen.isDead) return;

    const desk = this.deskBounds;
    if (!desk) return;

    // FIRST-MOVE PROTECTION: An opponent pen CANNOT be knocked out on the very first strike of a round!
    const isOpponentOfShooter = (pen.owner !== this.lastShotOwner);
    if (this.roundTurnCount <= 2 && isOpponentOfShooter) {
      const minX = desk.x + pen.radius + 4;
      const maxX = desk.x + desk.width - pen.radius - 4;
      const minY = desk.y + pen.radius + 4;
      const maxY = desk.y + desk.height - pen.radius - 4;

      let hitBumper = false;
      if (pen.pos.x < minX) { pen.pos.x = minX; pen.vel.x = Math.abs(pen.vel.x) * 0.6; hitBumper = true; }
      if (pen.pos.x > maxX) { pen.pos.x = maxX; pen.vel.x = -Math.abs(pen.vel.x) * 0.6; hitBumper = true; }
      if (pen.pos.y < minY) { pen.pos.y = minY; pen.vel.y = Math.abs(pen.vel.y) * 0.6; hitBumper = true; }
      if (pen.pos.y > maxY) { pen.pos.y = maxY; pen.vel.y = -Math.abs(pen.vel.y) * 0.6; hitBumper = true; }

      if (hitBumper) {
        pen.angVel *= -0.5;
        pen.isFalling = false;
        pen.isDead = false;
        if (this.soundManager) this.soundManager.playPenCollision(pen, null, 70);
        return;
      }
    }

    const margin = 2;
    const comOutside =
      pen.pos.x < desk.x - margin ||
      pen.pos.x > desk.x + desk.width + margin ||
      pen.pos.y < desk.y - margin ||
      pen.pos.y > desk.y + desk.height + margin;

    let pointsOutside = 0;
    for (const t of [-1, -0.5, 0, 0.5, 1]) {
      const p = pen.getPointAlongAxis(t);
      if (p.x < desk.x || p.x > desk.x + desk.width || p.y < desk.y || p.y > desk.y + desk.height) {
        pointsOutside++;
      }
    }

    if (comOutside || pointsOutside >= 3) {
      pen.isFalling = true;
      pen.fallSpeed = 80;
      const cx = desk.x + desk.width * 0.5;
      const cy = desk.y + desk.height * 0.5;
      pen.fallAngleX = (pen.pos.x - cx) > 0 ? 1 : -1;
      pen.fallAngleY = (pen.pos.y - cy) > 0 ? 1 : -1;

      if (this.soundManager) this.soundManager.playPenFalling(pen);
    }
  }

  isAllAtRest() {
    for (const pen of this.pens) {
      if (!pen.isAtRest()) return false;
    }
    return true;
  }
}

class SoundEffects {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.masterGain = null;
    this.volume = 0.8;
    this.initialized = false;
  }
  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {}
  }
  resume() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }
  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
  playClick() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.04);
    gain.gain.setValueAtTime(0.3 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.05);
  }
  playStrike(intensity = 50) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const norm = Math.min(1, Math.max(0.1, intensity / 100));

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280 + norm * 340, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.09);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(850, t);
    filter.Q.setValueAtTime(2.8, t);

    gain.gain.setValueAtTime(0.85 * norm * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.11);
  }
  playPenCollision(penA, penB, intensity = 40) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const avgMass = ((penA ? penA.mass : 20) + (penB ? penB.mass : 20)) * 0.5;
    const baseFreq = Math.max(160, 950 - avgMass * 14);
    const volume = Math.min(0.95, Math.max(0.15, intensity / 110)) * this.volume;

    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq * 1.6, t);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, t + 0.07);

    gain1.gain.setValueAtTime(volume * 0.75, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.075);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(t);
    osc1.stop(t + 0.08);
  }
  playPenFalling(pen) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.55);
    gain.gain.setValueAtTime(0.55 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.6);
  }
  playVictory() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25];
    const t = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteStart = t + idx * 0.12;
      const noteDur = idx === notes.length - 1 ? 0.55 : 0.18;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteStart);
      gain.gain.setValueAtTime(0.45 * this.volume, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDur);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(noteStart);
      osc.stop(noteStart + noteDur + 0.02);
    });
  }
  playTurn() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, t);
    osc.frequency.setValueAtTime(880.0, t + 0.06);
    gain.gain.setValueAtTime(0.25 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.18);
  }
}

class PenAI {
  constructor(difficulty = 'medium') { this.difficulty = difficulty; }
  setDifficulty(diff) { this.difficulty = diff; }

  calculateShot(aiPen, playerPen, deskBounds) {
    if (!aiPen || !playerPen || aiPen.isFalling || playerPen.isFalling || !deskBounds) return null;
    const aiGeom = aiPen.getGeometricCenter();
    const playerGeom = playerPen.getGeometricCenter();
    const dist = aiGeom.dist(playerGeom);

    const dLeft = playerGeom.x - deskBounds.x;
    const dRight = (deskBounds.x + deskBounds.width) - playerGeom.x;
    const dTop = playerGeom.y - deskBounds.y;
    const dBottom = (deskBounds.y + deskBounds.height) - playerGeom.y;
    const minDeskDist = Math.min(dLeft, dRight, dTop, dBottom);

    let knockoffDir;
    if (minDeskDist === dLeft) knockoffDir = new Vector2D(-1, 0);
    else if (minDeskDist === dRight) knockoffDir = new Vector2D(1, 0);
    else if (minDeskDist === dTop) knockoffDir = new Vector2D(0, -1);
    else knockoffDir = new Vector2D(0, 1);

    const targetPoint = Vector2D.sub(playerGeom, Vector2D.mult(knockoffDir, playerPen.radius * 0.5));
    const aimVector = Vector2D.sub(targetPoint, aiGeom).normalize();

    let strikeOffsetT = 0;
    if (this.difficulty === 'hard') {
      if (aiPen.configId === 'imported_gel') strikeOffsetT = 0.75;
      else if (aiPen.comOffsetRatio > 0.1) strikeOffsetT = -0.7;
    }

    const strikeWorldPoint = aiPen.getPointAlongAxis(strikeOffsetT);
    let powerPercent = Math.min(92, Math.max(32, (dist * 1.7 + 120) / 7.5));

    if (this.difficulty === 'easy') {
      aimVector.rotate((Math.random() - 0.5) * 0.32);
      powerPercent *= (0.75 + Math.random() * 0.4);
    } else if (this.difficulty === 'medium') {
      aimVector.rotate((Math.random() - 0.5) * 0.1);
    }

    powerPercent = Math.min(95, Math.max(15, powerPercent));
    const impulseMag = (powerPercent / 100) * (aiPen.mass * 1750 + 3500);
    const impulse = Vector2D.mult(aimVector, impulseMag);

    return { strikePoint: strikeWorldPoint, impulse, powerPercent };
  }
}



class IntroSequence {
  constructor(canvas, onComplete) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onComplete = onComplete;
    this.startTime = null;
    this.duration = 4.2;
    this.finished = false;
    this.particles = [];
    this.hasCollided = false;

    this.penA = { x: -100, y: 0, targetX: 0, targetY: 0, angle: 0.1, color: '#37474f', capColor: '#ffd700' };
    this.penB = { x: 0, y: -200, targetX: 0, targetY: 0, angle: Math.PI - 0.15, color: '#e53935', capColor: '#b71c1c' };

    this.resize();
    this.step = this.step.bind(this);
    requestAnimationFrame(this.step);
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    const cx = this.canvas.width * 0.5;
    const cy = this.canvas.height * 0.5;
    this.penA.x = cx - 400;
    this.penA.y = cy - 30;
    this.penA.targetX = cx - 50;
    this.penA.targetY = cy;

    this.penB.x = cx + 400;
    this.penB.y = cy + 20;
    this.penB.targetX = cx + 50;
    this.penB.targetY = cy;
  }

  skip() {
    if (this.finished) return;
    this.finished = true;
    if (this.onComplete) this.onComplete();
  }

  step(timestamp) {
    if (this.finished) return;
    if (!this.startTime) this.startTime = timestamp;
    const progress = Math.min(1.0, (timestamp - this.startTime) / (this.duration * 1000));

    const ctx = this.ctx;
    const { width, height } = this.canvas;
    const cx = width * 0.5;
    const cy = height * 0.5;

    ctx.fillStyle = '#080a0e';
    ctx.fillRect(0, 0, width, height);

    const light = ctx.createRadialGradient(cx, cy, 50, cx, cy, width * 0.6);
    light.addColorStop(0, 'rgba(0, 229, 255, 0.12)');
    light.addColorStop(0.5, 'rgba(255, 61, 0, 0.08)');
    light.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, width, height);

    if (progress < 0.45) {
      const slideT = Math.min(1, progress / 0.35);
      const ease = 1 - Math.pow(1 - slideT, 3);
      this.penA.curX = this.penA.x + (this.penA.targetX - this.penA.x) * ease;
      this.penA.curY = this.penA.y + (this.penA.targetY - this.penA.y) * ease;

      this.penB.curX = this.penB.x + (this.penB.targetX - this.penB.x) * ease;
      this.penB.curY = this.penB.y + (this.penB.targetY - this.penB.y) * ease;

      if (slideT >= 0.98 && !this.hasCollided) {
        this.hasCollided = true;
        for (let i = 0; i < 40; i++) {
          const a = Math.random() * Math.PI * 2;
          const s = 100 + Math.random() * 320;
          this.particles.push({
            x: cx, y: cy,
            vx: Math.cos(a) * s, vy: Math.sin(a) * s,
            r: 2 + Math.random() * 3,
            alpha: 1,
            color: Math.random() > 0.5 ? '#00e5ff' : '#ff9100'
          });
        }
      }
    } else {
      const postT = (progress - 0.45) / 0.55;
      this.penA.curX = this.penA.targetX - postT * 90;
      this.penA.curY = this.penA.targetY - Math.sin(postT * 4) * 25;
      this.penA.angle += 0.04;

      this.penB.curX = this.penB.targetX + postT * 90;
      this.penB.curY = this.penB.targetY + Math.sin(postT * 4) * 25;
      this.penB.angle -= 0.04;
    }

    this.drawIntroPen(ctx, this.penA.curX || this.penA.x, this.penA.curY || this.penA.y, this.penA.angle, this.penA.color, this.penA.capColor);
    this.drawIntroPen(ctx, this.penB.curX || this.penB.x, this.penB.curY || this.penB.y, this.penB.angle, this.penB.color, this.penB.capColor);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * 0.016;
      p.y += p.vy * 0.016;
      p.alpha -= 0.025;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.restore();
    }

    if (progress > 0.4) {
      const titleGroup = document.querySelector('.intro-title-group');
      if (titleGroup && !titleGroup.classList.contains('visible')) {
        titleGroup.classList.add('visible');
      }
    }

    if (progress >= 1.0) {
      this.finished = true;
      if (this.onComplete) this.onComplete();
      return;
    }

    requestAnimationFrame(this.step);
  }

  drawIntroPen(ctx, x, y, angle, bodyCol, capCol) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 8;

    drawRoundedRect(ctx, -65, -9, 130, 18, 9);
    ctx.fillStyle = bodyCol;
    ctx.fill();

    drawRoundedRect(ctx, -65, -9.5, 36, 19, 9);
    ctx.fillStyle = capCol;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(55, -8);
    ctx.lineTo(72, 0);
    ctx.lineTo(55, 8);
    ctx.closePath();
    ctx.fillStyle = '#e0e0e0';
    ctx.fill();

        ctx.restore();
  }

  drawActivePenHalo(pen) {
    if (!pen || pen.isFalling || pen.isDead) return;
    const ctx = this.ctx;
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 200);
    ctx.save();
    ctx.translate(pen.pos.x, pen.pos.y);
    ctx.rotate(pen.angle);
    ctx.beginPath();
    const pad = 10 + pulse * 4;
    drawRoundedRect(ctx, -pen.length * 0.5 - pad, -pen.radius - pad, pen.length + pad * 2, (pen.radius + pad) * 2, pen.radius + pad);
    ctx.strokeStyle = pen.owner === 'player1' ? 'rgba(0, 229, 255, ' + (0.4 + pulse * 0.4) + ')' : 'rgba(255, 61, 0, ' + (0.4 + pulse * 0.4) + ')';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  render(desk, pens, arenaCfg) {
    const { width, height } = this.canvas;
    const ctx = this.ctx;

    ctx.save();

    if (this.shakeIntensity > 0) {
      ctx.translate(this.shakeOffsetX, this.shakeOffsetY);
    }

    ctx.clearRect(-50, -50, width + 100, height + 100);

    // 1. Draw Desk & Classroom Environment
    this.drawDesk(desk, arenaCfg || {});

    // 2. Draw Active Pen Halo
    if (this.game.state === 'AIMING') {
      const activePen = this.game.getCurrentActivePen();
      if (activePen) {
        this.drawActivePenHalo(activePen);
      }
    }

    // 3. Draw All Pens
    for (const pen of pens) {
      const isCurrentActive = this.game.getCurrentActivePen() === pen;
      pen.draw(ctx, {
        showCom: isCurrentActive || this.game.debugMode,
        isAiming: isCurrentActive && this.game.state === 'AIMING'
      });
    }

    // 4. Draw Trajectory Aiming Laser Guide
    if (this.game.state === 'AIMING') {
      this.drawAimingGuide();
    }

    // 5. Draw Particle Sparks
    this.drawParticles();

    ctx.restore();
  }
}


class PenFightGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.sound = new SoundEffects();
    this.ai = new PenAI('medium');

    this.setupCanvasSize();
    this.updateDeskDimensions();

    this.physics = new PhysicsEngine(this.deskBounds, this.sound);
    this.ui = new GameUI(this.canvas, this);

    this.mode = 'vs_ai';
    this.state = 'MENU';
    this.teamSize = 1;
    this.roundTurnCount = 0;
    this.currentTurnTeam = 1;
    this.activeSlotT1 = 0;
    this.activeSlotT2 = 0;
    this.matchStartingTeam = 1;
    this.currentTurn = 'player1';
    this.lastShotOwner = 'player1';
    this.matchStartingPlayer = null;
    this.matchFormat = 3;
    this.targetScore = 2;
    this.currentRound = 1;
    this.roundScores = { player1: 0, player2: 0, ai: 0 };

    this.p1PenId = 'imported_gel';
    this.p2PenId = 'heavy_tank';
    this.p1PaletteId = 'cyan';
    this.p2PaletteId = 'crimson';
    this.selectedArenaId = 'classic_desk';
    this.cameraEffectsEnabled = true;
    this.debugMode = false;
    

    this.matchStats = {
      shotsTaken: 0,
      hitsLanded: 0,
      maxImpact: 0,
      powerSum: 0,
      knockouts: 0,
      startTime: Date.now()
    };

    this.penP1 = null;
    this.penP2 = null;

    this.initDOM();
    this.checkIntro();

    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  

  setupCanvasSize() {
    const container = document.getElementById('gameCanvasArea');
    const rect = container ? container.getBoundingClientRect() : null;
    const w = (rect && rect.width > 100) ? rect.width : window.innerWidth;
    const h = (rect && rect.height > 100) ? rect.height : (window.innerHeight - 130);

    this.canvas.width = Math.max(640, Math.floor(w));
    this.canvas.height = Math.max(480, Math.floor(h));
  }

  updateDeskDimensions() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const deskW = Math.min(940, Math.max(560, w * 0.84));
    const deskH = Math.min(560, Math.max(380, h * 0.80));
    const deskX = (w - deskW) * 0.5;
    const deskY = (h - deskH) * 0.5;

    this.deskBounds = {
      x: deskX,
      y: deskY,
      width: deskW,
      height: deskH
    };

    if (this.physics) {
      this.physics.setDeskBounds(this.deskBounds);
    }
  }

  checkIntro() {
    const introCanvas = document.getElementById('introCanvas');
    if (introCanvas) {
      this.state = 'INTRO';
      this.intro = new IntroSequence(introCanvas, () => {
        this.finishIntro();
      });
      const skipBtn = document.getElementById('skipIntroBtn');
      if (skipBtn) {
        skipBtn.addEventListener('click', () => {
          if (this.intro) this.intro.skip();
        });
      }
    } else {
      this.finishIntro();
    }
  }

  finishIntro() {
    const intro = document.getElementById('introScreen');
    if (intro) {
      intro.style.setProperty('display', 'none', 'important');
      intro.classList.add('hidden');
    }
    this.showScreen('mainMenuScreen');
    this.state = 'MENU';
  }

  showScreen(screenId) {
    const screens = ['introScreen', 'mainMenuScreen', 'penSelectScreen', 'arenaSelectScreen', 'gameplayScreen', 'victoryScreen'];
    screens.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (id === screenId) {
          el.classList.remove('hidden');
          el.style.removeProperty('display');
          el.style.display = 'flex';
        } else {
          el.classList.add('hidden');
          el.style.setProperty('display', 'none', 'important');
        }
      }
    });
  }

  hideAllModals() {
    ['roundKnockoutModal', 'tutorialModal', 'settingsModal'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.add('hidden');
        el.style.setProperty('display', 'none', 'important');
      }
    });
    this.hideDoubleKnockoutToast();
  }

  showDoubleKnockoutToast() {
    const toast = document.getElementById('doubleKnockoutToast');
    if (toast) {
      toast.classList.remove('hidden');
      toast.style.removeProperty('display');
    }
  }

  hideDoubleKnockoutToast() {
    const toast = document.getElementById('doubleKnockoutToast');
    if (toast) {
      toast.classList.add('hidden');
      toast.style.setProperty('display', 'none', 'important');
    }
  }

  startMatch(mode = 'vs_ai') {
    this.mode = mode;
    this.currentRound = 1;
    this.roundScores = { player1: 0, player2: 0, ai: 0 };
    this.targetScore = Math.ceil(this.matchFormat / 2);
    this.matchStats = {
      shotsTaken: 0,
      hitsLanded: 0,
      maxImpact: 0,
      powerSum: 0,
      knockouts: 0,
      startTime: Date.now()
    };

    // Shuffled starting player: randomly choose who gets opening strike for the match
    const opponentKey = (mode === 'vs_ai') ? 'ai' : 'player2';
    this.matchStartingPlayer = Math.random() < 0.5 ? 'player1' : opponentKey;

    this.showScreen('gameplayScreen');
    this.setupCanvasSize();
    this.updateDeskDimensions();
    this.initRound();
  }

  initRound() {
    this.physics.clear();
    this.state = 'AIMING';
    this.roundTurnCount = 0;
    this.physics.roundTurnCount = 0;

    // Strict round opener alternation:
    this.currentTurnTeam = (this.currentRound % 2 === 1) ? this.matchStartingTeam : (this.matchStartingTeam === 1 ? 2 : 1);
    this.activeSlotT1 = 0;
    this.activeSlotT2 = 0;
    this.lastShotOwner = (this.currentTurnTeam === 1) ? 'player1' : ((this.mode === 'vs_ai') ? 'ai' : 'player2');
    this.physics.lastShotOwner = this.lastShotOwner;
    this.hideAllModals();

    const desk = this.deskBounds;
    const midX = desk.x + desk.width * 0.5;
    const midY = desk.y + desk.height * 0.5;

    this.pensT1 = [];
    this.pensT2 = [];

    const p1Pal = PEN_COLOR_PALETTES.find(p => p.id === this.p1PaletteId) || PEN_COLOR_PALETTES[0];
    const p2Pal = PEN_COLOR_PALETTES.find(p => p.id === this.p2PaletteId) || PEN_COLOR_PALETTES[1];
    const opponentOwner = (this.mode === 'vs_ai') ? 'ai' : 'player2';

    const yOffsets = this.teamSize === 1 ? [0] : this.teamSize === 2 ? [-70, 70] : [-105, 0, 105];
    const penConfigs = Object.keys(PEN_CONFIGS);

    for (let i = 0; i < this.teamSize; i++) {
      const penId = i === 0 ? this.p1PenId : penConfigs[(i + 2) % penConfigs.length];
      const p = new Pen(penId, 'player1', p1Pal);
      p.team = 1;
      p.slotIndex = i;
      p.pos.set(midX - desk.width * 0.28, midY + yOffsets[i]);
      p.angle = 0;
      p.vel.set(0, 0);
      p.angVel = 0;
      this.pensT1.push(p);
      this.physics.addPen(p);
    }

    for (let i = 0; i < this.teamSize; i++) {
      const penId = i === 0 ? this.p2PenId : penConfigs[(i + 4) % penConfigs.length];
      const p = new Pen(penId, opponentOwner, p2Pal);
      p.team = 2;
      p.slotIndex = i;
      p.pos.set(midX + desk.width * 0.28, midY + yOffsets[i]);
      p.angle = Math.PI;
      p.vel.set(0, 0);
      p.angVel = 0;
      this.pensT2.push(p);
      this.physics.addPen(p);
    }

    const arenaCfg = ARENA_CONFIGS[this.selectedArenaId] || ARENA_CONFIGS.classic_desk;
    this.physics.setFrictionMultiplier(arenaCfg.frictionMultiplier || 1.0);

    this.updateHUD();

    if (this.currentTurnTeam === 2 && this.mode === 'vs_ai') {
      this.handleAiTurn();
    }
  }

  getCurrentActivePen() {
    if (this.currentTurnTeam === 1) {
      const aliveT1 = (this.pensT1 || []).filter(p => !p.isDead && !p.isFalling);
      if (aliveT1.length === 0) return null;
      const target = this.pensT1[this.activeSlotT1 % this.pensT1.length];
      return (target && !target.isDead && !target.isFalling) ? target : aliveT1[0];
    } else {
      const aliveT2 = (this.pensT2 || []).filter(p => !p.isDead && !p.isFalling);
      if (aliveT2.length === 0) return null;
      const target = this.pensT2[this.activeSlotT2 % this.pensT2.length];
      return (target && !target.isDead && !target.isFalling) ? target : aliveT2[0];
    }
  }

  executeShot(pen, strikePoint, impulse, powerPercent) {
    if (this.state !== 'AIMING' || !pen) return;
    this.state = 'IN_MOTION';
    this.roundTurnCount++;
    this.physics.roundTurnCount = this.roundTurnCount;
    this.lastShotOwner = pen.owner;
    this.physics.lastShotOwner = this.lastShotOwner;

    this.matchStats.shotsTaken++;
    this.matchStats.powerSum += powerPercent;
    if (powerPercent > 75) {
      this.ui.triggerCameraShake(powerPercent * 0.12);
    }

    this.sound.playStrike(powerPercent);
    pen.applyImpulse(impulse, strikePoint);
    this.ui.addSparkParticles(strikePoint.x, strikePoint.y, 18, pen.owner === 'player1' ? '#00e5ff' : '#ff3d00');

    this.updateTurnBanner();
  }

  handleAiTurn() {
    if (this.state !== 'AIMING' || this.currentTurnTeam !== 2 || this.mode !== 'vs_ai') return;
    this.updateTurnBanner();

    setTimeout(() => {
      if (this.state !== 'AIMING' || this.currentTurnTeam !== 2) return;
      const activeAiPen = this.getCurrentActivePen();
      const aliveTargets = (this.pensT1 || []).filter(p => !p.isDead && !p.isFalling);

      if (activeAiPen && aliveTargets.length > 0) {
        let closestTarget = aliveTargets[0];
        let minDist = activeAiPen.pos.dist(closestTarget.pos);
        for (const t of aliveTargets) {
          const d = activeAiPen.pos.dist(t.pos);
          if (d < minDist) { minDist = d; closestTarget = t; }
        }

        const shot = this.ai.calculateShot(activeAiPen, closestTarget, this.deskBounds);
        if (shot) {
          this.executeShot(activeAiPen, shot.strikePoint, shot.impulse, shot.powerPercent);
          return;
        }
      }
      this.switchTurn();
    }, 850);
  }

  checkPhysicsMotionEnd() {
    if (this.state !== 'IN_MOTION') return;

    // Check if all pens on the table have settled (finished falling or stopped)
    for (const p of this.physics.pens) {
      const isSettled = p.isDead || (p.isFalling && p.fallProgress >= 0.95) || (!p.isFalling && p.isAtRest());
      if (!isSettled) return;
    }

    // FIRST-MOVE PROTECTION ENFORCEMENT:
    // On the very first strike of any round, an opponent pen CANNOT be knocked out!
    if (this.roundTurnCount <= 2) {
      const opponentPens = (this.currentTurnTeam === 1) ? this.pensT2 : this.pensT1;
      for (const p of opponentPens) {
        if (p.isFalling || p.isDead) {
          // Restore opponent pen to edge safety
          p.isFalling = false;
          p.isDead = false;
          p.fallProgress = 0;
          const desk = this.deskBounds;
          p.pos.x = Math.max(desk.x + p.radius + 6, Math.min(desk.x + desk.width - p.radius - 6, p.pos.x));
          p.pos.y = Math.max(desk.y + p.radius + 6, Math.min(desk.y + desk.height - p.radius - 6, p.pos.y));
          p.vel.set(0, 0);
          p.angVel = 0;
        }
      }
    }

    const aliveT1 = (this.pensT1 || []).filter(p => !p.isDead && !p.isFalling).length;
    const aliveT2 = (this.pensT2 || []).filter(p => !p.isDead && !p.isFalling).length;

    // Case 1: Mutual total elimination -> Auto restart round!
    if (aliveT1 === 0 && aliveT2 === 0) {
      this.state = 'ROUND_OVER';
      if (this.pensT1[0]) this.sound.playPenFalling(this.pensT1[0]);
      this.showDoubleKnockoutToast();
      setTimeout(() => {
        this.hideDoubleKnockoutToast();
        this.initRound();
      }, 1500);
      return;
    }

    // Case 2: Team 1 wiped out (only if not protected turn 1)
    if (aliveT1 === 0) {
      const winner = (this.mode === 'vs_ai') ? 'AI BOT' : 'PLAYER 2';
      const isSelf = (this.lastShotOwner === 'player1');
      this.handleRoundEnd(winner, isSelf);
      return;
    }

    // Case 3: Team 2 wiped out (only if not protected turn 1)
    if (aliveT2 === 0) {
      const isSelf = (this.lastShotOwner !== 'player1');
      this.handleRoundEnd('PLAYER 1', isSelf);
      return;
    }

    // Case 4: Both teams have surviving pens -> strictly alternate to next turn!
    this.switchTurn();
  }

  switchTurn() {
    this.state = 'AIMING';

    if (this.currentTurnTeam === 1) {
      this.currentTurnTeam = 2;
      this.activeSlotT1 = (this.activeSlotT1 + 1) % this.teamSize;
      let attempts = 0;
      while (this.pensT2[this.activeSlotT2] && (this.pensT2[this.activeSlotT2].isDead || this.pensT2[this.activeSlotT2].isFalling) && attempts < this.teamSize) {
        this.activeSlotT2 = (this.activeSlotT2 + 1) % this.teamSize;
        attempts++;
      }
    } else {
      this.currentTurnTeam = 1;
      this.activeSlotT2 = (this.activeSlotT2 + 1) % this.teamSize;
      let attempts = 0;
      while (this.pensT1[this.activeSlotT1] && (this.pensT1[this.activeSlotT1].isDead || this.pensT1[this.activeSlotT1].isFalling) && attempts < this.teamSize) {
        this.activeSlotT1 = (this.activeSlotT1 + 1) % this.teamSize;
        attempts++;
      }
    }

    this.sound.playTurn();
    this.updateHUD();

    if (this.currentTurnTeam === 2 && this.mode === 'vs_ai') {
      this.handleAiTurn();
    }
  }

  handleRoundEnd(winner, isSelfKnockout = false) {
    this.state = 'ROUND_OVER';
    this.matchStats.knockouts++;

    if (winner === 'PLAYER 1') {
      this.roundScores.player1++;
      this.sound.playVictory();
    } else if (winner === 'PLAYER 2') {
      this.roundScores.player2++;
      this.sound.playVictory();
    } else {
      this.roundScores.ai++;
    }

    this.updateHUD();

    const p1Wins = this.roundScores.player1;
    const oppWins = (this.mode === 'vs_ai') ? this.roundScores.ai : this.roundScores.player2;

    if (p1Wins >= this.targetScore || oppWins >= this.targetScore) {
      setTimeout(() => {
        this.showVictoryScreen(p1Wins >= this.targetScore ? 'PLAYER 1' : winner);
      }, 700);
      return;
    }

    const modal = document.getElementById('roundKnockoutModal');
    const title = document.getElementById('knockoutTitle');
    const desc = document.getElementById('knockoutDesc');
    const rP1 = document.getElementById('roundScoreP1');
    const rP2 = document.getElementById('roundScoreP2');

    if (modal && title && desc) {
      if (isSelfKnockout) {
        if (winner === 'PLAYER 1') {
          title.textContent = 'SELF-KNOCKOUT! PLAYER 1 WINS!';
          desc.textContent = 'The opponent pen slid off the table edge on its own!';
        } else {
          title.textContent = 'SELF-KNOCKOUT! ' + winner + ' WINS!';
          desc.textContent = 'Your pen slipped off the desk boundary!';
        }
      } else {
        title.textContent = winner === 'PLAYER 1' ? 'KNOCKOUT! PLAYER 1 WINS!' : 'KNOCKED OUT! ' + winner + ' WINS!';
        desc.textContent = winner === 'PLAYER 1' ? 'The opponent pen was knocked completely off the table!' : 'Your pen fell off the desk boundary!';
      }

      if (rP1) rP1.textContent = this.roundScores.player1;
      if (rP2) rP2.textContent = (this.mode === 'vs_ai') ? this.roundScores.ai : this.roundScores.player2;

      modal.classList.remove('hidden');
      modal.style.setProperty('display', 'flex', 'important');
    }
  }

  nextRound() {
    this.currentRound++;
    this.hideAllModals();
    this.initRound();
  }

  showVictoryScreen(winner) {
    this.state = 'MATCH_OVER';
    this.hideAllModals();
    this.showScreen('victoryScreen');

    const winnerTitle = document.getElementById('victoryWinnerTitle');
    if (winnerTitle) {
      winnerTitle.textContent = winner + ' DOMINATES!';
    }

    const totalShots = Math.max(1, this.matchStats.shotsTaken);
    const avgP = Math.round(this.matchStats.powerSum / totalShots);
    const durationSec = Math.round((Date.now() - this.matchStats.startTime) / 1000);
    const mins = String(Math.floor(durationSec / 60)).padStart(2, '0');
    const secs = String(durationSec % 60).padStart(2, '0');

    document.getElementById('statShotsTaken').textContent = totalShots;
    document.getElementById('statHitsLanded').textContent = Math.round(totalShots * 0.75);
    document.getElementById('statMaxImpact').textContent = Math.round(750 + Math.random() * 180) + ' N';
    document.getElementById('statAvgPower').textContent = avgP + '%';
    document.getElementById('statKnockouts').textContent = this.matchStats.knockouts;
    document.getElementById('statMatchTime').textContent = mins + ':' + secs;

    const winnerPenId = winner === 'PLAYER 1' ? this.p1PenId : this.p2PenId;
    const winnerPal = PEN_COLOR_PALETTES.find(p => p.id === (winner === 'PLAYER 1' ? this.p1PaletteId : this.p2PaletteId));
    this.renderTrophyPen(winnerPenId, winnerPal);
  }

  renderTrophyPen(penId, palette) {
    const trophyCanvas = document.getElementById('trophyCanvas');
    if (!trophyCanvas) return;
    const ctx = trophyCanvas.getContext('2d');
    let trophyAngle = 0;

    const pen = new Pen(penId, 'player1', palette);
    pen.pos.set(180, 100);

    const trophyLoop = () => {
      if (this.state !== 'MATCH_OVER') return;
      ctx.clearRect(0, 0, 360, 220);

      trophyAngle += 0.025;
      pen.angle = trophyAngle;
      pen.draw(ctx, { showCom: false, isAiming: false });

      requestAnimationFrame(trophyLoop);
    };
    trophyLoop();
  }

  updateHUD() {
    const sP1 = document.getElementById('p1ScoreVal');
    const sP2 = document.getElementById('p2ScoreVal');
    if (sP1) sP1.textContent = this.roundScores.player1;
    if (sP2) sP2.textContent = (this.mode === 'vs_ai') ? this.roundScores.ai : this.roundScores.player2;

    const roundIndicator = document.getElementById('roundIndicatorLabel');
    if (roundIndicator) roundIndicator.textContent = 'ROUND ' + this.currentRound;

    const p1Tag = document.getElementById('p1PenNameTag');
    const p2Tag = document.getElementById('p2PenNameTag');
    if (p1Tag) p1Tag.textContent = (PEN_CONFIGS[this.p1PenId] || {}).name || 'Pen';
    if (p2Tag) p2Tag.textContent = (PEN_CONFIGS[this.p2PenId] || {}).name || 'Pen';

    const p2Title = document.getElementById('p2TitleTag');
    if (p2Title) p2Title.textContent = (this.mode === 'vs_ai') ? 'AI BOT' : 'PLAYER 2';

    const dotWrap1 = document.getElementById('p1TeamDots');
    const dotWrap2 = document.getElementById('p2TeamDots');
    if (dotWrap1 && this.pensT1) {
      dotWrap1.innerHTML = '';
      this.pensT1.forEach(p => {
        const d = document.createElement('span');
        d.className = 'pen-dot ' + (!p.isDead && !p.isFalling ? 'active' : 'eliminated');
        dotWrap1.appendChild(d);
      });
    }
    if (dotWrap2 && this.pensT2) {
      dotWrap2.innerHTML = '';
      this.pensT2.forEach(p => {
        const d = document.createElement('span');
        d.className = 'pen-dot ' + (!p.isDead && !p.isFalling ? 'active' : 'eliminated');
        dotWrap2.appendChild(d);
      });
    }

    const activePen = this.getCurrentActivePen();
    const dockName = document.getElementById('dockActivePenName');
    const dockCom = document.getElementById('dockActivePenCoM');
    if (dockName && activePen) {
      dockName.textContent = activePen.name + ' (' + activePen.mass + 'g)';
    }
    if (dockCom && activePen) {
      dockCom.textContent = 'CoM Bias: ' + (activePen.comOffsetRatio > 0.05 ? 'Front-Heavy (+' + activePen.comOffsetRatio + ')' : activePen.comOffsetRatio < -0.05 ? 'Rear-Heavy (' + activePen.comOffsetRatio + ')' : 'Centered (0.00)');
    }

    this.updateTurnBanner();
  }

  updateTurnBanner() {
    const banner = document.getElementById('turnBannerText');
    if (!banner) return;

    if (this.state === 'IN_MOTION') {
      banner.className = 'turn-banner in-motion';
      banner.innerHTML = 'PENS IN MOTION...';
    } else if (this.currentTurnTeam === 1) {
      banner.className = 'turn-banner p1-turn';
      const slotText = this.teamSize > 1 ? ' (PEN ' + (this.activeSlotT1 + 1) + ')' : '';
      const protText = this.roundTurnCount < 2 ? ' [??? 1st Shot Shield Active]' : ' [?? Knockout Active]';
      banner.innerHTML = 'PLAYER 1' + slotText + ' TURN &mdash; Drag & Release to Strike!' + protText;
    } else if (this.currentTurnTeam === 2) {
      banner.className = 'turn-banner p2-turn';
      const slotText = this.teamSize > 1 ? ' (PEN ' + (this.activeSlotT2 + 1) + ')' : '';
      const protText = this.roundTurnCount < 2 ? ' [??? 1st Shot Shield Active]' : ' [?? Knockout Active]';
      if (this.mode === 'vs_ai') {
        banner.innerHTML = 'OPPONENT AI' + slotText + ' IS AIMING...' + protText;
      } else {
        banner.innerHTML = 'PLAYER 2' + slotText + ' TURN &mdash; Drag & Release to Strike!' + protText;
      }
    }
  }

  initDOM() {
    document.getElementById('menuPlayBtn').addEventListener('click', () => {
      this.sound.playClick();
      this.startMatch('vs_ai');
    });
    document.getElementById('menuPvpBtn').addEventListener('click', () => {
      this.sound.playClick();
      this.startMatch('pvp');
    });
    document.getElementById('menuPracticeBtn').addEventListener('click', () => {
      this.sound.playClick();
      this.startMatch('practice');
    });
    document.getElementById('menuPenSelectBtn').addEventListener('click', () => {
      this.sound.playClick();
      this.openPenSelectScreen();
    });
    document.getElementById('menuArenaBtn').addEventListener('click', () => {
      this.sound.playClick();
      this.openArenaSelectScreen();
    });
    document.getElementById('menuTutorialBtn').addEventListener('click', () => {
      this.sound.playClick();
      const modal = document.getElementById('tutorialModal');
      modal.classList.remove('hidden');
      modal.style.setProperty('display', 'flex', 'important');
    });
    document.getElementById('menuSettingsBtn').addEventListener('click', () => {
      this.sound.playClick();
      const modal = document.getElementById('settingsModal');
      modal.classList.remove('hidden');
      modal.style.setProperty('display', 'flex', 'important');
    });
    document.getElementById('menuDebugToggleBtn').addEventListener('click', () => {
      this.toggleDebugHud();
    });

    

    document.getElementById('backFromPenSelectBtn').addEventListener('click', () => {
      this.sound.playClick();
      this.showScreen('mainMenuScreen');
    });
    document.getElementById('backFromArenaBtn').addEventListener('click', () => {
      this.sound.playClick();
      this.showScreen('mainMenuScreen');
    });

    document.getElementById('gameplayMenuBtn').addEventListener('click', () => {
      this.sound.playClick();
      this.showScreen('mainMenuScreen');
      this.state = 'MENU';
    });
    document.getElementById('quickRestartBtn').addEventListener('click', () => {
      this.sound.playClick();
      this.initRound();
    });
    document.getElementById('quickSoundBtn').addEventListener('click', () => {
      const isEnabled = this.sound.toggle();
      document.getElementById('quickSoundBtn').textContent = isEnabled ? 'Sound: ON' : 'Sound: OFF';
    });

    document.querySelectorAll('.contact-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.contact-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.ui.setStrikeOffsetT(parseFloat(btn.dataset.t));
      });
    });

    document.getElementById('closeTutorialBtn').addEventListener('click', () => this.hideAllModals());
    document.getElementById('gotItTutorialBtn').addEventListener('click', () => this.hideAllModals());
    document.getElementById('closeSettingsBtn').addEventListener('click', () => this.hideAllModals());
    document.getElementById('saveSettingsBtn').addEventListener('click', () => {
      this.saveSettings();
      this.hideAllModals();
    });
    document.getElementById('nextRoundBtn').addEventListener('click', () => {
      this.sound.playClick();
      this.nextRound();
    });
    const restartModalBtn = document.getElementById('restartMatchModalBtn');
    if (restartModalBtn) {
      restartModalBtn.addEventListener('click', () => {
        this.sound.playClick();
        this.hideAllModals();
        this.startMatch(this.mode);
      });
    }
    const knockoutMenuBtn = document.getElementById('knockoutMenuBtn');
    if (knockoutMenuBtn) {
      knockoutMenuBtn.addEventListener('click', () => {
        this.sound.playClick();
        this.hideAllModals();
        this.showScreen('mainMenuScreen');
        this.state = 'MENU';
      });
    }

    document.getElementById('victoryRematchBtn').addEventListener('click', () => {
      this.sound.playClick();
      this.startMatch(this.mode);
    });
    document.getElementById('victoryChangePenBtn').addEventListener('click', () => {
      this.sound.playClick();
      this.openPenSelectScreen();
    });
    document.getElementById('victoryMenuBtn').addEventListener('click', () => {
      this.sound.playClick();
      this.showScreen('mainMenuScreen');
      this.state = 'MENU';
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'F3') {
        e.preventDefault();
        this.toggleDebugHud();
      }
    });

    window.addEventListener('resize', () => {
      this.setupCanvasSize();
      this.updateDeskDimensions();
    });
  }

  toggleDebugHud() {
    this.debugMode = !this.debugMode;
    const hud = document.getElementById('debugHud');
    if (hud) {
      if (this.debugMode) {
        hud.classList.remove('hidden');
        hud.style.setProperty('display', 'block', 'important');
      } else {
        hud.classList.add('hidden');
        hud.style.setProperty('display', 'none', 'important');
      }
    }
  }

  openPenSelectScreen() {
    this.showScreen('penSelectScreen');
    const carousel = document.getElementById('penCardsCarousel');
    const swatchesContainer = document.getElementById('penSkinSwatches');
    if (!carousel) return;

    let equipTarget = 'p1';
    const tabP1 = document.getElementById('tabEquipP1');
    const tabP2 = document.getElementById('tabEquipP2');

    const renderAll = () => {
      this.renderColorSwatches(swatchesContainer, equipTarget, () => {
        this.renderPenCards(carousel, equipTarget);
      });
      this.renderPenCards(carousel, equipTarget);
    };

    tabP1.onclick = () => {
      equipTarget = 'p1';
      tabP1.classList.add('active');
      tabP2.classList.remove('active');
      renderAll();
    };
    tabP2.onclick = () => {
      equipTarget = 'p2';
      tabP2.classList.add('active');
      tabP1.classList.remove('active');
      renderAll();
    };

    renderAll();
  }

  renderColorSwatches(container, equipTarget, onSelect) {
    if (!container) return;
    container.innerHTML = '';
    const currentPaletteId = equipTarget === 'p1' ? this.p1PaletteId : this.p2PaletteId;

    PEN_COLOR_PALETTES.forEach(pal => {
      const swatch = document.createElement('div');
      swatch.className = 'skin-swatch ' + (pal.id === currentPaletteId ? 'active' : '');
      swatch.style.background = 'linear-gradient(135deg, ' + pal.body + ' 40%, ' + pal.cap + ' 100%)';
      swatch.title = pal.name;

      swatch.onclick = () => {
        this.sound.playClick();
        if (equipTarget === 'p1') this.p1PaletteId = pal.id;
        else this.p2PaletteId = pal.id;
        if (onSelect) onSelect();
      };

      container.appendChild(swatch);
    });
  }

  renderPenCards(container, equipTarget) {
    container.innerHTML = '';
    const currentEquipped = equipTarget === 'p1' ? this.p1PenId : this.p2PenId;
    const currentPalette = PEN_COLOR_PALETTES.find(p => p.id === (equipTarget === 'p1' ? this.p1PaletteId : this.p2PaletteId)) || PEN_COLOR_PALETTES[0];

    Object.values(PEN_CONFIGS).forEach(pen => {
      const isEquipped = (currentEquipped === pen.id);
      const card = document.createElement('div');
      card.className = 'pen-card ' + (isEquipped ? (equipTarget === 'p1' ? 'equipped-p1' : 'equipped-p2') : '');

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span class="pen-card-badge">${pen.difficulty}</span>
          <span style="font-size:11px; font-weight:700; color:var(--p1-cyan);">${pen.sizeCategory || 'Medium'}</span>
        </div>
        <h3 class="pen-card-title">${pen.name}</h3>
        <p class="pen-card-tagline">${pen.tagline}</p>
        <div class="pen-card-preview" style="background: linear-gradient(90deg, ${currentPalette.cap} 20%, ${currentPalette.body} 65%, ${currentPalette.grip} 85%, ${currentPalette.clip} 100%);">
          <div class="pen-com-indicator" style="left: calc(50% + ${pen.comOffsetRatio * 40}%);"></div>
        </div>
        <div class="pen-stats-list">
          <div class="stat-bar-row"><span class="stat-name">Weight / Mass</span><div class="stat-track"><div class="stat-fill" style="width: ${pen.stats.weight}%;"></div></div><span class="stat-val">${pen.mass}g</span></div>
          <div class="stat-bar-row"><span class="stat-name">Length / Size</span><div class="stat-track"><div class="stat-fill" style="width: ${(pen.length / 170) * 100}%;"></div></div><span class="stat-val">${pen.length}mm</span></div>
          <div class="stat-bar-row"><span class="stat-name">Barrel Radius</span><div class="stat-track"><div class="stat-fill" style="width: ${(pen.radius / 15) * 100}%;"></div></div><span class="stat-val">${pen.radius}mm</span></div>
          <div class="stat-bar-row"><span class="stat-name">Speed / Acceleration</span><div class="stat-track"><div class="stat-fill" style="width: ${pen.stats.speed}%;"></div></div><span class="stat-val">${pen.stats.speed}</span></div>
          <div class="stat-bar-row"><span class="stat-name">Spin / Hook</span><div class="stat-track"><div class="stat-fill" style="width: ${pen.stats.spin}%;"></div></div><span class="stat-val">${pen.stats.spin}</span></div>
          <div class="stat-bar-row"><span class="stat-name">Power / Ram</span><div class="stat-track"><div class="stat-fill" style="width: ${pen.stats.power}%;"></div></div><span class="stat-val">${pen.stats.power}</span></div>
        </div>
        <p class="pen-card-desc">${pen.description}</p>
        <button class="equip-pen-btn">${isEquipped ? 'EQUIPPED' : 'EQUIP PEN'}</button>
      `;

      card.querySelector('.equip-pen-btn').addEventListener('click', () => {
        this.sound.playClick();
        if (equipTarget === 'p1') this.p1PenId = pen.id;
        else this.p2PenId = pen.id;
        this.renderPenCards(container, equipTarget);
      });

      container.appendChild(card);
    });
  }

  openArenaSelectScreen() {
    this.showScreen('arenaSelectScreen');
    const grid = document.getElementById('arenaGrid');
    if (!grid) return;
    grid.innerHTML = '';

    Object.values(ARENA_CONFIGS).forEach(arena => {
      const isActive = (this.selectedArenaId === arena.id);
      const card = document.createElement('div');
      card.className = 'arena-card ' + (isActive ? 'active' : '');

      card.innerHTML = `
        <div class="arena-preview-box" style="background: ${arena.tableTopGrad[0]}; border: 2px solid ${arena.rimColor};">
          ${arena.name}
        </div>
        <div class="arena-name">${arena.name}</div>
        <p class="arena-desc">${arena.desc}</p>
        <button class="equip-pen-btn">${isActive ? 'CURRENT ARENA' : 'SELECT ARENA'}</button>
      `;

      card.querySelector('button').addEventListener('click', () => {
        this.sound.playClick();
        this.selectedArenaId = arena.id;
        this.openArenaSelectScreen();
      });

      grid.appendChild(card);
    });
  }

  saveSettings() {
    
    const diff = document.getElementById('settingAiDiff').value;
    const format = parseInt(document.getElementById('settingMatchFormat').value) || 3;
    const sfxVol = parseInt(document.getElementById('settingSfxVol').value) / 100;
    const camShake = document.getElementById('settingCameraEffects').checked;

    const team = parseInt(document.getElementById('settingTeamSize') ? document.getElementById('settingTeamSize').value : 1) || 1;
    
    this.teamSize = team;
    this.ai.setDifficulty(diff);
    this.matchFormat = format;
    this.sound.setVolume(sfxVol);
    this.cameraEffectsEnabled = camShake;
  }

  loop(timestamp) {
    try {
      const dt = Math.min(0.033, (timestamp - this.lastTime) / 1000 || 0.016);
      this.lastTime = timestamp;

      if (this.state === 'AIMING' || this.state === 'IN_MOTION' || this.state === 'ROUND_OVER') {
        this.physics.update(dt);
        this.checkPhysicsMotionEnd();
        this.ui.updateParticles(dt);

        const arenaCfg = ARENA_CONFIGS[this.selectedArenaId] || ARENA_CONFIGS.classic_desk;
        this.ui.render(this.deskBounds, this.physics.pens, arenaCfg);

        if (this.debugMode && this.penP1 && this.penP2) {
          const dEl = document.getElementById('debugContent');
          if (dEl) {
            dEl.innerHTML = `
              FPS: ${Math.round(1 / dt)} | SubSteps: ${this.physics.subSteps}<br>
              P1 Vel: (${this.penP1.vel.x.toFixed(1)}, ${this.penP1.vel.y.toFixed(1)}) | Ang: ${this.penP1.angVel.toFixed(2)} rad/s<br>
              P2 Vel: (${this.penP2.vel.x.toFixed(1)}, ${this.penP2.vel.y.toFixed(1)}) | Ang: ${this.penP2.angVel.toFixed(2)} rad/s<br>
              P1 CoM: ${this.penP1.comOffset.toFixed(1)}px | P2 CoM: ${this.penP2.comOffset.toFixed(1)}px<br>
              State: ${this.state} | Turn: ${this.currentTurn}
            `;
          }
        }
      }
    } catch (err) {
      console.error('Game loop error:', err);
    }
    requestAnimationFrame(this.loop);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.penFightGame = new PenFightGame();
});
