
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
    const impulseMag = (powerPercent / 100) * (aiPen.mass * 1350);
    const impulse = Vector2D.mult(aimVector, impulseMag);

    return { strikePoint: strikeWorldPoint, impulse, powerPercent };
  }
}


class IntroSequence {
  constructor(canvas, onComplete) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.onComplete = onComplete;
    this.startTime = null;
    this.duration = 2.5;
    this.finished = false;
    this.particles = [];
    this.hasCollided = false;

    this.penA = { x: -100, y: 0, targetX: 0, targetY: 0, angle: 0.1, color: '#00e5ff', capColor: '#00838f' };
    this.penB = { x: 0, y: -200, targetX: 0, targetY: 0, angle: Math.PI - 0.15, color: '#ff3d00', capColor: '#b71c1c' };

    if (this.canvas) {
      this.resize();
      this.step = this.step.bind(this);
      requestAnimationFrame(this.step);
    } else {
      this.skip();
    }
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth || 800;
    this.canvas.height = window.innerHeight || 600;
    const cx = this.canvas.width * 0.5;
    const cy = this.canvas.height * 0.5;
    this.penA.x = cx - 350;
    this.penA.y = cy - 25;
    this.penA.targetX = cx - 45;
    this.penA.targetY = cy;

    this.penB.x = cx + 350;
    this.penB.y = cy + 15;
    this.penB.targetX = cx + 45;
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
    if (!ctx) { this.skip(); return; }

    const { width, height } = this.canvas;
    const cx = width * 0.5;
    const cy = height * 0.5;

    ctx.fillStyle = '#080a0e';
    ctx.fillRect(0, 0, width, height);

    const light = ctx.createRadialGradient(cx, cy, 40, cx, cy, width * 0.6);
    light.addColorStop(0, 'rgba(0, 229, 255, 0.15)');
    light.addColorStop(0.5, 'rgba(255, 61, 0, 0.1)');
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
        for (let i = 0; i < 35; i++) {
          const a = Math.random() * Math.PI * 2;
          const s = 100 + Math.random() * 300;
          this.particles.push({
            x: cx, y: cy,
            vx: Math.cos(a) * s, vy: Math.sin(a) * s,
            r: 2 + Math.random() * 3,
            alpha: 1,
            color: Math.random() > 0.5 ? '#00e5ff' : '#ff3d00'
          });
        }
      }
    } else {
      const postT = (progress - 0.45) / 0.55;
      this.penA.curX = this.penA.targetX - postT * 80;
      this.penA.curY = this.penA.targetY - Math.sin(postT * 4) * 20;
      this.penA.angle += 0.03;

      this.penB.curX = this.penB.targetX + postT * 80;
      this.penB.curY = this.penB.targetY + Math.sin(postT * 4) * 20;
      this.penB.angle -= 0.03;
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
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fill();
      ctx.restore();
    }

    const titleGroup = document.querySelector('.intro-title-group');
    if (titleGroup && progress > 0.3) {
      titleGroup.classList.add('visible');
    }

    if (progress >= 1.0) {
      this.skip();
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

    drawRoundedRect(ctx, -60, -8, 120, 16, 8);
    ctx.fillStyle = bodyCol;
    ctx.fill();

    drawRoundedRect(ctx, -60, -8.5, 34, 17, 8);
    ctx.fillStyle = capCol;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(50, -7);
    ctx.lineTo(65, 0);
    ctx.lineTo(50, 7);
    ctx.closePath();
    ctx.fillStyle = '#e0e0e0';
    ctx.fill();

    ctx.restore();
  }
}

class GameUI {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.game = game;

    this.isDragging = false;
    this.dragStartPos = new Vector2D(0, 0);
    this.dragCurrentPos = new Vector2D(0, 0);
    this.selectedPen = null;
    this.strikeOffsetT = 0;
    this.calculatedPower = 0;
    this.aimAngle = 0;

    this.particles = [];
    this.shakeIntensity = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;

    this.bindEvents();
  }

  bindEvents() {
    if (!this.canvas) return;

    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      let clientX, clientY;
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if (e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      return new Vector2D(
        (clientX - rect.left) * (this.canvas.width / rect.width),
        (clientY - rect.top) * (this.canvas.height / rect.height)
      );
    };

    const handleDown = (pos) => {
      if (this.game.state !== 'AIMING') return;

      // Online turn lock: only allow dragging if it is this local player's turn
      if (!this.game.isLocalPlayerTurn()) return;

      const currentActivePen = this.game.getCurrentActivePen();
      if (!currentActivePen || currentActivePen.owner === 'ai') return;

      // Generous grab radius for touchscreen thumbs and mouse precision
      const clickDist = pos.dist(currentActivePen.pos);
      const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
      const grabThreshold = currentActivePen.length * 1.1 + (isTouch ? 85 : 55);

      if (clickDist < grabThreshold) {
        this.isDragging = true;
        this.selectedPen = currentActivePen;

        // Dynamically compute exact strike contact point from cursor click along pen axis:
        const axisDir = Vector2D.fromAngle(currentActivePen.angle);
        const clickVec = Vector2D.sub(pos, currentActivePen.pos);
        const distAlongAxis = clickVec.dot(axisDir);
        const halfLength = currentActivePen.length * 0.5;
        this.strikeOffsetT = Math.max(-0.85, Math.min(0.85, distAlongAxis / halfLength));

        const exactStrikePoint = currentActivePen.getPointAlongAxis(this.strikeOffsetT);
        this.dragStartPos = exactStrikePoint;
        this.dragCurrentPos = pos;
        this.game.sound.init();

        document.querySelectorAll('.contact-btn').forEach(btn => {
          const btnT = parseFloat(btn.dataset.t);
          if (Math.abs(btnT - this.strikeOffsetT) < 0.4) {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        });
      }
    };

    const handleMove = (pos) => {
      if (!this.isDragging || !this.selectedPen) return;
      this.dragCurrentPos = pos;

      const dragVec = Vector2D.sub(this.dragStartPos, this.dragCurrentPos);
      const pullDist = dragVec.mag();

      const maxPull = 180;
      this.calculatedPower = Math.min(100, (pullDist / maxPull) * 100);
      this.aimAngle = dragVec.heading();

      this.updatePowerGaugeUI(this.calculatedPower);
    };

    const handleUp = () => {
      if (!this.isDragging || !this.selectedPen) return;

      if (this.calculatedPower >= 6) {
        const angleJitter = (Math.random() - 0.5) * 0.025;
        const powerJitter = 1 + (Math.random() - 0.5) * 0.03;
        const finalAngle = this.aimAngle + angleJitter;
        const finalPower = Math.min(100, Math.max(5, this.calculatedPower * powerJitter));

        const aimDir = Vector2D.fromAngle(finalAngle);
        const impulseMag = (finalPower / 100) * (this.selectedPen.mass * 1350);
        const impulse = Vector2D.mult(aimDir, impulseMag);

        const strikePoint = this.selectedPen.getPointAlongAxis(this.strikeOffsetT);
        this.game.executeShot(this.selectedPen, strikePoint, impulse, finalPower);
      }

      this.isDragging = false;
      this.selectedPen = null;
      this.calculatedPower = 0;
      this.updatePowerGaugeUI(0);
    };

    this.canvas.addEventListener('mousedown', (e) => handleDown(getPos(e)));
    window.addEventListener('mousemove', (e) => { if (this.isDragging) handleMove(getPos(e)); });
    window.addEventListener('mouseup', () => handleUp());

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.cancelable) e.preventDefault();
      handleDown(getPos(e));
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (this.isDragging) {
        if (e.cancelable) e.preventDefault();
        handleMove(getPos(e));
      }
    }, { passive: false });

    window.addEventListener('touchend', () => handleUp());
    window.addEventListener('touchcancel', () => handleUp());
  }

  setStrikeOffsetT(t) {
    this.strikeOffsetT = Math.max(-0.8, Math.min(0.8, t));
  }

  triggerCameraShake(amount = 8) {
    if (this.game.cameraEffectsEnabled) {
      this.shakeIntensity = Math.min(22, this.shakeIntensity + amount);
    }
  }

  updatePowerGaugeUI(power) {
    const powerFill = document.getElementById('powerGaugeFill');
    const powerBadge = document.getElementById('powerGaugeBadge');
    if (powerFill) {
      powerFill.style.width = power + '%';
    }
    if (powerBadge) {
      powerBadge.textContent = Math.round(power) + '%';
      if (power >= 88) {
        powerBadge.style.color = 'var(--p2-red)';
      } else if (power >= 55) {
        powerBadge.style.color = 'var(--accent-gold)';
      } else {
        powerBadge.style.color = 'var(--p1-cyan)';
      }
    }
  }

  addSparkParticles(x, y, count = 16, color = '#00e5ff') {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 40 + Math.random() * 220;
      this.particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        r: 1.5 + Math.random() * 2.5,
        alpha: 1,
        color
      });
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= dt * 1.8;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    if (this.shakeIntensity > 0) {
      this.shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 25);
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  drawParticles() {
    const ctx = this.ctx;
    for (const p of this.particles) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fill();
      ctx.restore();
    }
  }

  drawDesk(desk, arenaCfg) {
    const ctx = this.ctx;
    const { width, height } = this.canvas;

    const dX = desk ? desk.x : 100;
    const dY = desk ? desk.y : 100;
    const dW = desk ? desk.width : (width - 200);
    const dH = desk ? desk.height : (height - 200);

    // 1. CLASSROOM AMBIENT BACKGROUND
    ctx.fillStyle = '#11141a';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 2;
    for (let x = 0; x < width; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.font = 'italic 16px monospace';
    ctx.fillText('E = mc²', 30, 45);
    ctx.fillText('F = m · a', 140, 45);
    ctx.fillText('v = u + at', 260, 45);
    if (width > 600) {
      ctx.fillText('τ = r × F', width - 200, 45);
      ctx.fillText('θ = ω · t', width - 100, 45);
    }

    const sunBeam = ctx.createLinearGradient(0, 0, width, height);
    sunBeam.addColorStop(0, 'rgba(255, 220, 150, 0.04)');
    sunBeam.addColorStop(0.5, 'rgba(255, 255, 255, 0.0)');
    sunBeam.addColorStop(1, 'rgba(0, 229, 255, 0.02)');
    ctx.fillStyle = sunBeam;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    // 2. DESK SHADOW
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 45;
    ctx.shadowOffsetY = 28;
    ctx.fillStyle = '#0a0d12';
    drawRoundedRect(ctx, dX - 6, dY - 6, dW + 12, dH + 12, 18);
    ctx.fill();
    ctx.restore();

    // 3. DESK BEVEL FRAME & PENCIL GROOVE
    const bevelColors = arenaCfg.bevelGrad || ['#5c3a21', '#3e2513', '#2a170b'];
    const bevelGrad = ctx.createLinearGradient(dX, dY, dX, dY + dH);
    bevelGrad.addColorStop(0, bevelColors[0]);
    bevelGrad.addColorStop(0.5, bevelColors[1]);
    bevelGrad.addColorStop(1, bevelColors[2]);
    ctx.fillStyle = bevelGrad;
    drawRoundedRect(ctx, dX, dY, dW, dH, 14);
    ctx.fill();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    drawRoundedRect(ctx, dX + dW * 0.25, dY + 4, dW * 0.5, 6, 3);
    ctx.fill();

    // 4. MAIN PLAYING SURFACE
    const pad = 14;
    const playX = dX + pad;
    const playY = dY + pad;
    const playW = Math.max(10, dW - pad * 2);
    const playH = Math.max(10, dH - pad * 2);

    ctx.save();
    drawRoundedRect(ctx, playX, playY, playW, playH, 10);
    ctx.clip();

    const tableColors = arenaCfg.tableTopGrad || ['#b5834b', '#a8753e', '#ba8a52', '#9e6c35'];
    const deskGrad = ctx.createLinearGradient(playX, playY, playX + playW, playY + playH);
    deskGrad.addColorStop(0, tableColors[0]);
    deskGrad.addColorStop(0.3, tableColors[1]);
    deskGrad.addColorStop(0.7, tableColors[2]);
    deskGrad.addColorStop(1, tableColors[3]);
    ctx.fillStyle = deskGrad;
    ctx.fillRect(playX, playY, playW, playH);

    ctx.fillStyle = 'rgba(80, 45, 15, 0.07)';
    for (let gy = playY + 6; gy < playY + playH; gy += 12) {
      ctx.fillRect(playX, gy, playW, 2.5);
    }
    ctx.beginPath();
    ctx.ellipse(playX + playW * 0.3, playY + playH * 0.25, 24, 6, 0.1, 0, Math.PI * 2);
    ctx.ellipse(playX + playW * 0.75, playY + playH * 0.8, 30, 8, -0.08, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(70, 35, 10, 0.08)';
    ctx.fill();

    // 5. SCHOOL PROPS: Adaptive for screen widths
    if (playW > 520) {
      this.drawNotebookPaper(ctx, playX + 28, playY + 24, 155, 105);
      this.drawSchoolRuler(ctx, playX + playW * 0.38, playY + playH - 24, 210, 16);
      this.drawPinkEraser(ctx, playX + playW - 85, playY + 28, 48, 22);
    } else {
      this.drawSchoolRuler(ctx, playX + 20, playY + playH - 20, 140, 14);
      this.drawPinkEraser(ctx, playX + playW - 60, playY + 16, 38, 18);
    }
    this.drawDeskDoodles(ctx, playX, playY, playW, playH);

    ctx.beginPath();
    ctx.setLineDash([8, 8]);
    ctx.moveTo(playX + playW * 0.5, playY + 15);
    ctx.lineTo(playX + playW * 0.5, playY + playH - 15);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(playX + playW * 0.5, playY + playH * 0.5, Math.min(65, playW * 0.15), 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();

    ctx.strokeStyle = arenaCfg.rimColor || 'rgba(255, 60, 60, 0.45)';
    ctx.lineWidth = 2.5;
    drawRoundedRect(ctx, playX, playY, playW, playH, 10);
    ctx.stroke();
  }

  drawNotebookPaper(ctx, x, y, w, h) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.035);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(5, 5, w, h);

    ctx.fillStyle = '#faf8ef';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#c5d8ea';
    ctx.lineWidth = 1;
    for (let ly = 20; ly < h - 8; ly += 14) {
      ctx.beginPath();
      ctx.moveTo(6, ly);
      ctx.lineTo(w - 6, ly);
      ctx.stroke();
    }

    ctx.strokeStyle = '#f8bbd0';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(26, 0);
    ctx.lineTo(26, h);
    ctx.stroke();

    ctx.fillStyle = 'rgba(235, 230, 200, 0.75)';
    ctx.fillRect(-8, -4, 28, 12);
    ctx.fillRect(w - 20, h - 8, 28, 12);

    ctx.fillStyle = '#1565c0';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('PEN FIGHT RULES', 30, 16);
    ctx.fillStyle = '#546e7a';
    ctx.font = '9px sans-serif';
    ctx.fillText('• 1st Turn: Shield active', 30, 31);
    ctx.fillText('• Aim: Pull back to flick', 30, 45);
    ctx.fillText('• Tip = Hook | Tail = Sweep', 30, 59);
    ctx.fillText('• Knock off table to win!', 30, 73);

    ctx.strokeStyle = '#d32f2f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(32, 88); ctx.lineTo(32, 100);
    ctx.moveTo(37, 88); ctx.lineTo(37, 100);
    ctx.moveTo(42, 88); ctx.lineTo(42, 100);
    ctx.moveTo(47, 88); ctx.lineTo(47, 100);
    ctx.moveTo(30, 97); ctx.lineTo(50, 90);
    ctx.stroke();

    ctx.restore();
  }

  drawSchoolRuler(ctx, x, y, w, h) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(0.015);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(3, 3, w, h);

    const rGrad = ctx.createLinearGradient(0, 0, 0, h);
    rGrad.addColorStop(0, '#fbe7a1');
    rGrad.addColorStop(0.5, '#e9c46a');
    rGrad.addColorStop(1, '#d4a373');
    ctx.fillStyle = rGrad;
    drawRoundedRect(ctx, 0, 0, w, h, 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.strokeStyle = '#264653';
    ctx.fillStyle = '#264653';
    ctx.font = '8px monospace';
    ctx.lineWidth = 1;

    let cmCount = 0;
    for (let rx = 8; rx < w - 8; rx += 7) {
      const isCm = (cmCount % 5 === 0);
      const isHalf = (cmCount % 5 === 2 || cmCount % 5 === 3);
      const tickH = isCm ? 8 : (isHalf ? 5 : 3);
      ctx.beginPath();
      ctx.moveTo(rx, 0);
      ctx.lineTo(rx, tickH);
      ctx.stroke();

      if (isCm && cmCount > 0 && rx < w - 20) {
        ctx.fillText(String(cmCount / 5), rx - 3, 13);
      }
      cmCount++;
    }

    ctx.restore();
  }

  drawPinkEraser(ctx, x, y, w, h) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.06);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(3, 3, w, h);

    ctx.fillStyle = '#ff80ab';
    drawRoundedRect(ctx, 0, 0, w * 0.65, h, 3);
    ctx.fill();

    ctx.fillStyle = '#80d8ff';
    drawRoundedRect(ctx, w * 0.65, 0, w * 0.35, h, 3);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText('DUST-FREE', 4, 14);

    ctx.restore();
  }

  drawDeskDoodles(ctx, x, y, w, h) {
    ctx.save();
    ctx.strokeStyle = 'rgba(50, 30, 10, 0.38)';
    ctx.lineWidth = 1.3;
    ctx.fillStyle = 'rgba(50, 30, 10, 0.45)';
    ctx.font = 'bold 13px sans-serif';

    if (w > 400) {
      ctx.strokeRect(x + w - 110, y + h - 55, 42, 26);
      ctx.fillText('VS', x + w - 96, y + h - 38);

      ctx.beginPath();
      ctx.arc(x + 130, y + h - 45, 18, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.font = '9px monospace';
    ctx.fillText('P1 WAS HERE ✏️', x + 35, y + h - 16);

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

  drawAimingGuide() {
    if (!this.isDragging || !this.selectedPen || this.calculatedPower <= 0) return;

    const ctx = this.ctx;
    const pen = this.selectedPen;
    const strikePoint = pen.getPointAlongAxis(this.strikeOffsetT);
    const aimDir = Vector2D.fromAngle(this.aimAngle);
    const powerRatio = this.calculatedPower / 100;

    ctx.save();

    ctx.beginPath();
    ctx.arc(strikePoint.x, strikePoint.y, 14 * (0.8 + powerRatio * 0.4), 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 229, 255, ' + (0.25 + powerRatio * 0.35) + ')';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 12;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(strikePoint.x, strikePoint.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    const lineLen = 130 + powerRatio * 290;
    const endPoint = Vector2D.add(strikePoint, Vector2D.mult(aimDir, lineLen));

    ctx.beginPath();
    ctx.setLineDash([8, 6]);
    ctx.lineDashOffset = -(Date.now() / 25) % 14;
    ctx.moveTo(strikePoint.x, strikePoint.y);
    ctx.lineTo(endPoint.x, endPoint.y);
    ctx.strokeStyle = 'rgba(0, 229, 255, ' + (0.8 + powerRatio * 0.2) + ')';
    ctx.lineWidth = 2.5 + powerRatio * 2.5;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    const arrowHeadLen = 14 + powerRatio * 8;
    const arrowAngle1 = this.aimAngle + Math.PI - 0.45;
    const arrowAngle2 = this.aimAngle + Math.PI + 0.45;
    ctx.moveTo(endPoint.x, endPoint.y);
    ctx.lineTo(endPoint.x + Math.cos(arrowAngle1) * arrowHeadLen, endPoint.y + Math.sin(arrowAngle1) * arrowHeadLen);
    ctx.moveTo(endPoint.x, endPoint.y);
    ctx.lineTo(endPoint.x + Math.cos(arrowAngle2) * arrowHeadLen, endPoint.y + Math.sin(arrowAngle2) * arrowHeadLen);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 3;
    ctx.stroke();

    const midPoint = Vector2D.add(strikePoint, Vector2D.mult(aimDir, lineLen * 0.5));
    ctx.save();
    ctx.translate(midPoint.x, midPoint.y);
    ctx.rotate(this.aimAngle);
    ctx.fillStyle = 'rgba(10, 15, 25, 0.85)';
    ctx.strokeStyle = powerRatio > 0.8 ? '#ff3d00' : '#00e5ff';
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, -32, -22, 64, 18, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(Math.round(this.calculatedPower) + '%', 0, -9);
    ctx.restore();

    ctx.restore();
  }

  render(desk, pens, arenaCfg) {
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.save();

    if (this.shakeIntensity > 0) {
      ctx.translate(this.shakeOffsetX, this.shakeOffsetY);
    }

    ctx.clearRect(-50, -50, width + 100, height + 100);

    this.drawDesk(desk, arenaCfg || {});

    // Active pen outline removed per user request for clean aesthetic

    for (const pen of pens) {
      const isCurrentActive = this.game.getCurrentActivePen() === pen;
      pen.draw(ctx, {
        showCom: isCurrentActive || this.game.debugMode,
        isAiming: isCurrentActive && this.game.state === 'AIMING'
      });
    }

    if (this.game.state === 'AIMING') {
      this.drawAimingGuide();
    }

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
    this.network = new NetworkManager(this);

    this.mode = 'vs_ai'; // 'vs_ai', 'pvp', 'practice', 'online_host', 'online_guest'
    this.state = 'MENU';
    this.teamSize = 1;
    this.roundTurnCount = 0;
    this.currentTurnTeam = 1;
    this.activeSlotT1 = 0;
    this.activeSlotT2 = 0;
    this.matchStartingTeam = 1;
    this.lastShotOwner = 'player1';

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

    this.pensT1 = [];
    this.pensT2 = [];

    this.initDOM();
    this.checkIntro();

    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  isLocalPlayerTurn() {
    if (this.mode === 'online_host') {
      return this.currentTurnTeam === 1;
    }
    if (this.mode === 'online_guest') {
      return this.currentTurnTeam === 2;
    }
    if (this.mode === 'vs_ai') {
      return this.currentTurnTeam === 1;
    }
    return true; // pvp local / practice
  }

  isOnlineMultiplayer() {
    return this.mode === 'online_host' || this.mode === 'online_guest';
  }

  setupCanvasSize() {
    const container = document.getElementById('gameCanvasArea');
    const rect = container ? container.getBoundingClientRect() : null;
    const w = (rect && rect.width > 50) ? rect.width : window.innerWidth;
    const h = (rect && rect.height > 50) ? rect.height : (window.innerHeight - 120);

    if (this.canvas) {
      this.canvas.width = Math.max(360, Math.floor(w));
      this.canvas.height = Math.max(360, Math.floor(h));
    }
  }

  updateDeskDimensions() {
    if (!this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;

    let deskW, deskH;
    if (w < 600) {
      // Mobile Phone
      if (h > w) {
        deskW = Math.min(w * 0.92, 540);
        deskH = Math.min(h * 0.72, 460);
      } else {
        deskW = Math.min(w * 0.86, 780);
        deskH = Math.min(h * 0.78, 440);
      }
    } else if (w <= 1024) {
      // Tablet / iPad
      deskW = Math.min(w * 0.88, 860);
      deskH = Math.min(h * 0.78, 520);
    } else {
      // Desktop / Laptop
      deskW = Math.min(940, Math.max(560, w * 0.84));
      deskH = Math.min(560, Math.max(380, h * 0.80));
    }

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
    ['roundKnockoutModal', 'tutorialModal', 'settingsModal', 'multiplayerModal'].forEach(id => {
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

    this.matchStartingTeam = Math.random() < 0.5 ? 1 : 2;

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

    if (!this.matchStartingTeam) this.matchStartingTeam = 1;
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

  executeShot(pen, strikePoint, impulse, powerPercent, isRemote = false) {
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

    // Broadcast shot packet to opponent if local
    if (!isRemote && this.isOnlineMultiplayer()) {
      const desk = this.deskBounds;
      this.network.send({
        type: 'SHOT_FIRED',
        team: pen.team,
        slotIndex: pen.slotIndex || 0,
        aimAngle: impulse.heading(),
        powerPercent: powerPercent,
        strikeOffsetT: this.ui.strikeOffsetT,
        relPos: {
          x: (pen.pos.x - desk.x) / desk.width,
          y: (pen.pos.y - desk.y) / desk.height
        },
        penAngle: pen.angle
      });
    }

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

    // Only host decides turn settlement in online multiplayer
    if (this.mode === 'online_guest') return;

    for (const p of this.physics.pens) {
      const isSettled = p.isDead || (p.isFalling && p.fallProgress >= 0.95) || (!p.isFalling && p.isAtRest());
      if (!isSettled) return;
    }

    // Individual 2-shot shield protection
    if (this.roundTurnCount <= 2) {
      const opponentPens = (this.currentTurnTeam === 1) ? this.pensT2 : this.pensT1;
      for (const p of opponentPens) {
        if (p.isFalling || p.isDead) {
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

    if (aliveT1 === 0 && aliveT2 === 0) {
      this.state = 'ROUND_OVER';
      if (this.pensT1[0]) this.sound.playPenFalling(this.pensT1[0]);
      this.showDoubleKnockoutToast();
      if (this.mode === 'online_host') {
        this.network.send({ type: 'DOUBLE_KNOCKOUT' });
      }
      setTimeout(() => {
        this.hideDoubleKnockoutToast();
        this.initRound();
      }, 1500);
      return;
    }

    if (aliveT1 === 0) {
      const winner = (this.mode === 'vs_ai') ? 'AI BOT' : (this.mode === 'online_guest' ? 'YOU (PLAYER 2)' : 'PLAYER 2');
      const isSelf = (this.lastShotOwner === 'player1');
      if (this.mode === 'online_host') {
        this.network.send({ type: 'ROUND_OVER', winner: 'PLAYER 2', isSelf: isSelf });
      }
      this.handleRoundEnd(winner, isSelf);
      return;
    }

    if (aliveT2 === 0) {
      const winner = (this.mode === 'online_host' ? 'YOU (PLAYER 1)' : 'PLAYER 1');
      const isSelf = (this.lastShotOwner !== 'player1');
      if (this.mode === 'online_host') {
        this.network.send({ type: 'ROUND_OVER', winner: 'PLAYER 1', isSelf: isSelf });
      }
      this.handleRoundEnd(winner, isSelf);
      return;
    }

    // Switch turn
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

    // If host in online multiplayer, broadcast new turn state & authoritative pen positions
    if (this.mode === 'online_host') {
      const desk = this.deskBounds;
      const penSync = [];
      this.pensT1.forEach((p, idx) => penSync.push({
        team: 1,
        slotIndex: idx,
        relX: (p.pos.x - desk.x) / desk.width,
        relY: (p.pos.y - desk.y) / desk.height,
        angle: p.angle,
        isDead: p.isDead,
        isFalling: p.isFalling
      }));
      this.pensT2.forEach((p, idx) => penSync.push({
        team: 2,
        slotIndex: idx,
        relX: (p.pos.x - desk.x) / desk.width,
        relY: (p.pos.y - desk.y) / desk.height,
        angle: p.angle,
        isDead: p.isDead,
        isFalling: p.isFalling
      }));
      this.network.send({
        type: 'TURN_SWITCH',
        currentTurnTeam: this.currentTurnTeam,
        activeSlotT1: this.activeSlotT1,
        activeSlotT2: this.activeSlotT2,
        roundTurnCount: this.roundTurnCount,
        roundScores: this.roundScores,
        pens: penSync
      });
    }

    if (this.currentTurnTeam === 2 && this.mode === 'vs_ai') {
      this.handleAiTurn();
    }
  }

  handleRoundEnd(winner, isSelfKnockout = false) {
    this.state = 'ROUND_OVER';
    this.matchStats.knockouts++;

    if (winner.includes('PLAYER 1')) {
      this.roundScores.player1++;
      this.sound.playVictory();
    } else if (winner.includes('PLAYER 2')) {
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
        title.textContent = 'SELF-KNOCKOUT! ' + winner + ' WINS!';
        desc.textContent = 'A pen slid off the desk boundary on its own!';
      } else {
        title.textContent = 'KNOCKOUT! ' + winner + ' WINS!';
        desc.textContent = 'All opponent team pens were knocked completely off the desk!';
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
    if (this.mode === 'online_host') {
      this.network.send({ type: 'NEXT_ROUND' });
    }
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

    const sShots = document.getElementById('statShotsTaken');
    const sHits = document.getElementById('statHitsLanded');
    const sImpact = document.getElementById('statMaxImpact');
    const sAvgP = document.getElementById('statAvgPower');
    const sKo = document.getElementById('statKnockouts');
    const sTime = document.getElementById('statMatchTime');

    if (sShots) sShots.textContent = totalShots;
    if (sHits) sHits.textContent = Math.round(totalShots * 0.75);
    if (sImpact) sImpact.textContent = Math.round(750 + Math.random() * 180) + ' N';
    if (sAvgP) sAvgP.textContent = avgP + '%';
    if (sKo) sKo.textContent = this.matchStats.knockouts;
    if (sTime) sTime.textContent = mins + ':' + secs;

    const winnerPenId = winner.includes('PLAYER 1') ? this.p1PenId : this.p2PenId;
    const winnerPal = PEN_COLOR_PALETTES.find(p => p.id === (winner.includes('PLAYER 1') ? this.p1PaletteId : this.p2PaletteId));
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

    const formatBadge = document.getElementById('matchFormatLabel');
    if (formatBadge) {
      formatBadge.textContent = this.teamSize === 1 ? '1v1 DUEL' : this.teamSize === 2 ? '2v2 TAG TEAM' : '3v3 SQUAD BRAWL';
    }

    const p1Tag = document.getElementById('p1PenNameTag');
    const p2Tag = document.getElementById('p2PenNameTag');
    if (p1Tag) p1Tag.textContent = (PEN_CONFIGS[this.p1PenId] || {}).name || 'Pen';
    if (p2Tag) p2Tag.textContent = (PEN_CONFIGS[this.p2PenId] || {}).name || 'Pen';

    const p2Title = document.getElementById('p2TitleTag');
    if (p2Title) {
      if (this.mode === 'vs_ai') p2Title.textContent = 'AI SQUAD';
      else if (this.mode === 'online_host') p2Title.textContent = 'PLAYER 2 (GUEST)';
      else if (this.mode === 'online_guest') p2Title.textContent = 'YOU (PLAYER 2)';
      else p2Title.textContent = 'PLAYER 2';
    }

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
      const protText = this.roundTurnCount < 2 ? ' [🛡️ 1st Shot Shield Active]' : ' [⚔️ Knockout Active]';
      if (this.mode === 'online_guest') {
        banner.innerHTML = 'PLAYER 1' + slotText + ' (OPPONENT) IS AIMING...' + protText;
      } else {
        banner.innerHTML = (this.mode === 'online_host' ? 'YOUR TURN (PLAYER 1)' : 'PLAYER 1') + slotText + ' &mdash; Drag & Release to Strike!' + protText;
      }
    } else if (this.currentTurnTeam === 2) {
      banner.className = 'turn-banner p2-turn';
      const slotText = this.teamSize > 1 ? ' (PEN ' + (this.activeSlotT2 + 1) + ')' : '';
      const protText = this.roundTurnCount < 2 ? ' [🛡️ 1st Shot Shield Active]' : ' [⚔️ Knockout Active]';
      if (this.mode === 'vs_ai') {
        banner.innerHTML = 'OPPONENT AI' + slotText + ' IS AIMING...' + protText;
      } else if (this.mode === 'online_host') {
        banner.innerHTML = 'PLAYER 2' + slotText + ' (OPPONENT) IS AIMING...' + protText;
      } else {
        banner.innerHTML = (this.mode === 'online_guest' ? 'YOUR TURN (PLAYER 2)' : 'PLAYER 2') + slotText + ' &mdash; Drag & Release to Strike!' + protText;
      }
    }
  }

  openMultiplayerModal() {
    this.hideAllModals();
    const modal = document.getElementById('multiplayerModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.style.setProperty('display', 'flex', 'important');
    }
    this.switchMultiplayerTab('host');
  }

  switchMultiplayerTab(tab) {
    const tabHost = document.getElementById('tabHostRoom');
    const tabJoin = document.getElementById('tabJoinRoom');
    const panelHost = document.getElementById('mpHostPanel');
    const panelJoin = document.getElementById('mpJoinPanel');

    if (tab === 'host') {
      if (tabHost) tabHost.classList.add('active');
      if (tabJoin) tabJoin.classList.remove('active');
      if (panelHost) {
        panelHost.classList.remove('hidden');
        panelHost.style.removeProperty('display');
      }
      if (panelJoin) {
        panelJoin.classList.add('hidden');
        panelJoin.style.setProperty('display', 'none', 'important');
      }
      this.startHostingRoom();
    } else {
      if (tabJoin) tabJoin.classList.add('active');
      if (tabHost) tabHost.classList.remove('active');
      if (panelJoin) {
        panelJoin.classList.remove('hidden');
        panelJoin.style.removeProperty('display');
      }
      if (panelHost) {
        panelHost.classList.add('hidden');
        panelHost.style.setProperty('display', 'none', 'important');
      }
      this.network.cleanup();
      const input = document.getElementById('joinRoomCodeInput');
      if (input) setTimeout(() => input.focus(), 100);
    }
  }

  startHostingRoom() {
    const codeEl = document.getElementById('hostRoomCodeVal');
    const statusText = document.getElementById('hostStatusText');
    if (codeEl) codeEl.textContent = 'CONNECTING...';
    if (statusText) statusText.textContent = 'Opening room channel...';

    this.network.initHost(
      (roomCode) => {
        if (codeEl) codeEl.textContent = roomCode;
        if (statusText) statusText.textContent = 'Waiting for Player 2 to join...';
      },
      (data) => {
        this.handleRemoteData(data);
      },
      (err) => {
        const msg = (err && err.message) ? err.message : (typeof err === 'string' ? err : 'Reconnecting...');
        if (statusText) statusText.textContent = msg;
      }
    );
  }

  joinExistingRoom(roomCode) {
    const statusBadge = document.getElementById('joinStatusBadge');
    const statusText = document.getElementById('joinStatusText');
    let clean = (roomCode || '').trim().toUpperCase();
    if (!clean.startsWith('PEN-')) {
      clean = 'PEN-' + clean.replace(/[^A-Z0-9]/g, '');
    }

    if (statusBadge) {
      statusBadge.classList.remove('hidden');
      statusBadge.style.removeProperty('display');
    }
    if (statusText) statusText.textContent = 'Connecting to ' + clean + '...';

    this.network.joinRoom(
      clean,
      (role) => {
        if (statusText) statusText.textContent = 'Joined room! Waiting for match start...';
        this.sound.playVictory();
      },
      (data) => {
        this.handleRemoteData(data);
      },
      (err) => {
        const msg = (err && err.message) ? err.message : (typeof err === 'string' ? err : 'Could not find room. Please check the code.');
        if (statusBadge) statusBadge.classList.remove('hidden');
        if (statusText) statusText.textContent = msg;
      }
    );
  }

  startOnlineMatch(role = 'online_host') {
    this.mode = role;
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

    this.showScreen('gameplayScreen');
    this.setupCanvasSize();
    this.updateDeskDimensions();
    this.initRound();
  }

  handleRemoteData(msg) {
    if (!msg || !msg.type) return;

    if (msg.type === 'GUEST_JOINED') {
      if (this.mode === 'online_host' && this.state !== 'MENU') return;

      if (msg.guestPenId) this.p2PenId = msg.guestPenId;
      if (msg.guestPaletteId) this.p2PaletteId = msg.guestPaletteId;

      this.sound.playVictory();
      this.matchStartingTeam = Math.random() < 0.5 ? 1 : 2;

      this.network.send({
        type: 'START_MATCH',
        hostPenId: this.p1PenId,
        hostPaletteId: this.p1PaletteId,
        arenaId: this.selectedArenaId,
        matchFormat: this.matchFormat,
        teamSize: this.teamSize,
        matchStartingTeam: this.matchStartingTeam
      });

      this.hideAllModals();
      this.startOnlineMatch('online_host');
      return;
    }

    if (msg.type === 'START_MATCH') {
      if (this.mode === 'online_guest' && this.state !== 'MENU') return;

      this.p1PenId = msg.hostPenId || this.p1PenId;
      this.p1PaletteId = msg.hostPaletteId || this.p1PaletteId;
      this.selectedArenaId = msg.arenaId || this.selectedArenaId;
      this.matchFormat = msg.matchFormat || 3;
      this.teamSize = msg.teamSize || 1;
      this.matchStartingTeam = msg.matchStartingTeam || 1;

      this.hideAllModals();
      this.startOnlineMatch('online_guest');
      return;
    }

    if (msg.type === 'SHOT_FIRED') {
      const penList = msg.team === 1 ? this.pensT1 : this.pensT2;
      const targetPen = (penList && penList[msg.slotIndex]) ? penList[msg.slotIndex] : (penList ? penList[0] : null);
      if (targetPen) {
        // Align relative desk coordinates
        const desk = this.deskBounds;
        if (msg.relPos) {
          targetPen.pos.x = desk.x + msg.relPos.x * desk.width;
          targetPen.pos.y = desk.y + msg.relPos.y * desk.height;
        }
        if (msg.penAngle !== undefined) {
          targetPen.angle = msg.penAngle;
        }

        const strikePoint = targetPen.getPointAlongAxis(msg.strikeOffsetT !== undefined ? msg.strikeOffsetT : 0);
        const impulse = Vector2D.fromAngle(msg.aimAngle).mult((msg.powerPercent / 100) * targetPen.mass * 1350);

        this.executeShot(targetPen, strikePoint, impulse, msg.powerPercent, true);
      }
      return;
    }

    if (msg.type === 'TURN_SWITCH') {
      const desk = this.deskBounds;
      this.state = 'AIMING';
      this.currentTurnTeam = msg.currentTurnTeam;
      this.activeSlotT1 = msg.activeSlotT1 || 0;
      this.activeSlotT2 = msg.activeSlotT2 || 0;
      this.roundTurnCount = msg.roundTurnCount;
      this.physics.roundTurnCount = msg.roundTurnCount;

      if (msg.roundScores) {
        this.roundScores.player1 = msg.roundScores.player1;
        this.roundScores.player2 = msg.roundScores.player2;
      }
      if (msg.pens && Array.isArray(msg.pens)) {
        msg.pens.forEach(pData => {
          const list = pData.team === 1 ? this.pensT1 : this.pensT2;
          const p = list ? list[pData.slotIndex || 0] : null;
          if (p) {
            p.pos.x = desk.x + pData.relX * desk.width;
            p.pos.y = desk.y + pData.relY * desk.height;
            p.angle = pData.angle;
            p.vel.set(0, 0);
            p.angVel = 0;
            p.isDead = pData.isDead;
            p.isFalling = pData.isFalling;
          }
        });
      }
      this.sound.playTurn();
      this.updateHUD();
      return;
    }

    if (msg.type === 'ROUND_OVER') {
      this.handleRoundEnd(msg.winner, msg.isSelf);
      return;
    }

    if (msg.type === 'DOUBLE_KNOCKOUT') {
      this.state = 'ROUND_OVER';
      if (this.pensT1[0]) this.sound.playPenFalling(this.pensT1[0]);
      this.showDoubleKnockoutToast();
      setTimeout(() => {
        this.hideDoubleKnockoutToast();
        this.initRound();
      }, 1500);
      return;
    }

    if (msg.type === 'NEXT_ROUND') {
      this.nextRound();
      return;
    }

    if (msg.type === 'REMATCH') {
      this.startOnlineMatch(this.mode);
      return;
    }
  }

  handlePeerDisconnect() {
    if (this.isOnlineMultiplayer()) {
      alert('Opponent left or disconnected.');
      this.showScreen('mainMenuScreen');
      this.state = 'MENU';
      this.network.cleanup();
    }
  }

  initDOM() {
    const bindBtn = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', fn);
    };

    bindBtn('menuOnlineBtn', () => {
      this.sound.playClick();
      this.openMultiplayerModal();
    });

    bindBtn('tabHostRoom', () => {
      this.sound.playClick();
      this.switchMultiplayerTab('host');
    });

    bindBtn('tabJoinRoom', () => {
      this.sound.playClick();
      this.switchMultiplayerTab('join');
    });

    bindBtn('closeMultiplayerBtn', () => {
      this.sound.playClick();
      this.hideAllModals();
      this.network.cleanup();
    });

    bindBtn('copyRoomCodeBtn', () => {
      const code = this.network.roomCode || '';
      if (code) {
        navigator.clipboard.writeText(code);
        const btn = document.getElementById('copyRoomCodeBtn');
        if (btn) btn.textContent = 'COPIED!';
        setTimeout(() => { if (btn) btn.textContent = 'COPY CODE'; }, 1800);
      }
    });

    bindBtn('copyInviteLinkBtn', () => {
      const code = this.network.roomCode || '';
      if (code) {
        const link = window.location.origin + window.location.pathname + '?room=' + code;
        navigator.clipboard.writeText(link);
        const btn = document.getElementById('copyInviteLinkBtn');
        if (btn) btn.innerHTML = '<span>LINK COPIED!</span>';
        setTimeout(() => {
          if (btn) btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg><span>COPY INVITE LINK</span>';
        }, 1800);
      }
    });

    const submitJoin = () => {
      this.sound.playClick();
      const input = document.getElementById('joinRoomCodeInput');
      const val = input ? input.value : '';
      this.joinExistingRoom(val);
    };

    bindBtn('joinRoomSubmitBtn', submitJoin);

    const joinInput = document.getElementById('joinRoomCodeInput');
    if (joinInput) {
      joinInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitJoin();
        }
      });
      joinInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
      });
    }

    bindBtn('menuPlayBtn', () => {
      this.sound.playClick();
      this.startMatch('vs_ai');
    });
    bindBtn('menuPvpBtn', () => {
      this.sound.playClick();
      this.startMatch('pvp');
    });
    bindBtn('menuPracticeBtn', () => {
      this.sound.playClick();
      this.startMatch('practice');
    });
    bindBtn('menuPenSelectBtn', () => {
      this.sound.playClick();
      this.openPenSelectScreen();
    });
    bindBtn('menuArenaBtn', () => {
      this.sound.playClick();
      this.openArenaSelectScreen();
    });
    bindBtn('menuTutorialBtn', () => {
      this.sound.playClick();
      const modal = document.getElementById('tutorialModal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.style.setProperty('display', 'flex', 'important');
      }
    });
    bindBtn('menuSettingsBtn', () => {
      this.sound.playClick();
      const modal = document.getElementById('settingsModal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.style.setProperty('display', 'flex', 'important');
      }
    });
    bindBtn('menuDebugToggleBtn', () => {
      this.toggleDebugHud();
    });

    bindBtn('backFromPenSelectBtn', () => {
      this.sound.playClick();
      this.showScreen('mainMenuScreen');
    });
    bindBtn('backFromArenaBtn', () => {
      this.sound.playClick();
      this.showScreen('mainMenuScreen');
    });

    bindBtn('gameplayMenuBtn', () => {
      this.sound.playClick();
      this.showScreen('mainMenuScreen');
      this.state = 'MENU';
      if (this.isOnlineMultiplayer()) this.network.cleanup();
    });
    bindBtn('quickRestartBtn', () => {
      this.sound.playClick();
      this.initRound();
    });
    bindBtn('quickSoundBtn', () => {
      const isEnabled = this.sound.toggle();
      const sBtn = document.getElementById('quickSoundBtn');
      if (sBtn) sBtn.textContent = isEnabled ? 'Sound: ON' : 'Sound: OFF';
    });

    document.querySelectorAll('.contact-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.contact-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.ui.setStrikeOffsetT(parseFloat(btn.dataset.t));
      });
    });

    bindBtn('closeTutorialBtn', () => this.hideAllModals());
    bindBtn('gotItTutorialBtn', () => this.hideAllModals());
    bindBtn('closeSettingsBtn', () => this.hideAllModals());
    bindBtn('saveSettingsBtn', () => {
      this.saveSettings();
      this.hideAllModals();
    });
    bindBtn('nextRoundBtn', () => {
      this.sound.playClick();
      this.nextRound();
    });
    bindBtn('restartMatchModalBtn', () => {
      this.sound.playClick();
      this.hideAllModals();
      if (this.mode === 'online_host') this.network.send({ type: 'REMATCH' });
      this.startMatch(this.mode);
    });
    bindBtn('knockoutMenuBtn', () => {
      this.sound.playClick();
      this.hideAllModals();
      this.showScreen('mainMenuScreen');
      this.state = 'MENU';
      if (this.isOnlineMultiplayer()) this.network.cleanup();
    });

    bindBtn('victoryRematchBtn', () => {
      this.sound.playClick();
      if (this.mode === 'online_host') this.network.send({ type: 'REMATCH' });
      this.startMatch(this.mode);
    });
    bindBtn('victoryChangePenBtn', () => {
      this.sound.playClick();
      this.openPenSelectScreen();
    });
    bindBtn('victoryMenuBtn', () => {
      this.sound.playClick();
      this.showScreen('mainMenuScreen');
      this.state = 'MENU';
      if (this.isOnlineMultiplayer()) this.network.cleanup();
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

    if (tabP1) {
      tabP1.onclick = () => {
        equipTarget = 'p1';
        tabP1.classList.add('active');
        if (tabP2) tabP2.classList.remove('active');
        renderAll();
      };
    }
    if (tabP2) {
      tabP2.onclick = () => {
        equipTarget = 'p2';
        tabP2.classList.add('active');
        if (tabP1) tabP1.classList.remove('active');
        renderAll();
      };
    }

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
    if (!container) return;
    container.innerHTML = '';
    const currentEquipped = equipTarget === 'p1' ? this.p1PenId : this.p2PenId;
    const currentPalette = PEN_COLOR_PALETTES.find(p => p.id === (equipTarget === 'p1' ? this.p1PaletteId : this.p2PaletteId)) || PEN_COLOR_PALETTES[0];

    Object.values(PEN_CONFIGS).forEach(pen => {
      const isEquipped = (currentEquipped === pen.id);
      const card = document.createElement('div');
      card.className = 'pen-card ' + (isEquipped ? (equipTarget === 'p1' ? 'equipped-p1' : 'equipped-p2') : '');

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span class="pen-card-badge">\${pen.difficulty}</span>
          <span style="font-size:11px; font-weight:700; color:var(--p1-cyan);">\${pen.sizeCategory || 'Medium'}</span>
        </div>
        <h3 class="pen-card-title">\${pen.name}</h3>
        <p class="pen-card-tagline">\${pen.tagline}</p>
        <div class="pen-card-preview" style="background: linear-gradient(90deg, \${currentPalette.cap} 20%, \${currentPalette.body} 65%, \${currentPalette.grip} 85%, \${currentPalette.clip} 100%);">
          <div class="pen-com-indicator" style="left: calc(50% + \${pen.comOffsetRatio * 40}%);"></div>
        </div>
        <div class="pen-stats-list">
          <div class="stat-bar-row"><span class="stat-name">Weight / Mass</span><div class="stat-track"><div class="stat-fill" style="width: \${pen.stats.weight}%;"></div></div><span class="stat-val">\${pen.mass}g</span></div>
          <div class="stat-bar-row"><span class="stat-name">Length / Size</span><div class="stat-track"><div class="stat-fill" style="width: \${(pen.length / 170) * 100}%;"></div></div><span class="stat-val">\${pen.length}mm</span></div>
          <div class="stat-bar-row"><span class="stat-name">Barrel Radius</span><div class="stat-track"><div class="stat-fill" style="width: \${(pen.radius / 15) * 100}%;"></div></div><span class="stat-val">\${pen.radius}mm</span></div>
          <div class="stat-bar-row"><span class="stat-name">Speed / Acceleration</span><div class="stat-track"><div class="stat-fill" style="width: \${pen.stats.speed}%;"></div></div><span class="stat-val">\${pen.stats.speed}</span></div>
          <div class="stat-bar-row"><span class="stat-name">Spin / Hook</span><div class="stat-track"><div class="stat-fill" style="width: \${pen.stats.spin}%;"></div></div><span class="stat-val">\${pen.stats.spin}</span></div>
          <div class="stat-bar-row"><span class="stat-name">Power / Ram</span><div class="stat-track"><div class="stat-fill" style="width: \${pen.stats.power}%;"></div></div><span class="stat-val">\${pen.stats.power}</span></div>
        </div>
        <p class="pen-card-desc">\${pen.description}</p>
        <button class="equip-pen-btn">\${isEquipped ? 'EQUIPPED' : 'EQUIP PEN'}</button>
      `;

      const btn = card.querySelector('.equip-pen-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          this.sound.playClick();
          if (equipTarget === 'p1') this.p1PenId = pen.id;
          else this.p2PenId = pen.id;
          this.renderPenCards(container, equipTarget);
        });
      }

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
        <div class="arena-preview-box" style="background: \${arena.tableTopGrad[0]}; border: 2px solid \${arena.rimColor};">
          \${arena.name}
        </div>
        <div class="arena-name">\${arena.name}</div>
        <p class="arena-desc">\${arena.desc}</p>
        <button class="equip-pen-btn">\${isActive ? 'CURRENT ARENA' : 'SELECT ARENA'}</button>
      `;

      const btn = card.querySelector('button');
      if (btn) {
        btn.addEventListener('click', () => {
          this.sound.playClick();
          this.selectedArenaId = arena.id;
          this.openArenaSelectScreen();
        });
      }

      grid.appendChild(card);
    });
  }

  saveSettings() {
    const diffEl = document.getElementById('settingAiDiff');
    const formatEl = document.getElementById('settingMatchFormat');
    const sfxEl = document.getElementById('settingSfxVol');
    const camEl = document.getElementById('settingCameraEffects');
    const teamEl = document.getElementById('settingTeamSize');

    if (diffEl) this.ai.setDifficulty(diffEl.value);
    if (formatEl) this.matchFormat = parseInt(formatEl.value) || 3;
    if (sfxEl) this.sound.setVolume(parseInt(sfxEl.value) / 100);
    if (camEl) this.cameraEffectsEnabled = camEl.checked;
    if (teamEl) this.teamSize = parseInt(teamEl.value) || 1;
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

        if (this.debugMode) {
          const dEl = document.getElementById('debugContent');
          if (dEl) {
            dEl.innerHTML = `
              FPS: \${Math.round(1 / dt)} | SubSteps: \${this.physics.subSteps}<br>
              Pens Active: \${this.physics.pens.length} | Team Size: \${this.teamSize}v\${this.teamSize}<br>
              Turn Team: \${this.currentTurnTeam} | Turn Count: \${this.roundTurnCount}<br>
              1st Strike Shield: \${this.roundTurnCount <= 2 ? 'ACTIVE' : 'OFF'}<br>
              Mode: \${this.mode} | State: \${this.state}
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

  // Check URL parameter for auto-join
  try {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setTimeout(() => {
        const game = window.penFightGame;
        if (game) {
          game.openMultiplayerModal();
          game.switchMultiplayerTab('join');
          const input = document.getElementById('joinRoomCodeInput');
          if (input) input.value = roomParam;
          game.joinExistingRoom(roomParam);
        }
      }, 500);
    }
  } catch(e) {}
});


class NetworkManager {
  constructor(game) {
    this.game = game;
    this.client = null;
    this.role = null; // 'host' or 'guest'
    this.roomCode = null;
    this.isConnected = false;
    this.topic = null;
    this.currentBrokerIndex = 0;
    this.brokers = [
      'wss://broker.hivemq.com:8884/mqtt',
      'wss://broker.emqx.io:8084/mqtt'
    ];
  }

  generateRoomCode() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  initHost(onRoomReady, onData, onError) {
    this.cleanup();
    this.role = 'host';
    const rawCode = this.generateRoomCode();
    this.roomCode = 'PEN-' + rawCode;
    this.topic = 'penfight/v10/' + rawCode.toLowerCase();

    this.connectBroker(() => {
      this.client.subscribe(this.topic, { qos: 0 }, (err) => {
        if (err) {
          console.error('[Host] Subscribe error:', err);
          if (onError) onError('Could not initialize room. Retrying...');
          return;
        }
        console.log('[Host] Subscribed to unified room topic:', this.topic);
        this.isConnected = true;
        if (onRoomReady) onRoomReady(this.roomCode);
      });
    }, onData, onError);
  }

  joinRoom(inputCode, onConnected, onData, onError) {
    this.cleanup();
    this.role = 'guest';
    let cleanCode = (inputCode || '').trim().toUpperCase().replace('PEN-', '').replace(/[^A-Z0-9]/g, '');
    if (!cleanCode || cleanCode.length < 3) {
      if (onError) onError('Please enter a 4-digit code (e.g. M5JL)');
      return;
    }
    this.roomCode = 'PEN-' + cleanCode;
    this.topic = 'penfight/v10/' + cleanCode.toLowerCase();

    this.connectBroker(() => {
      this.client.subscribe(this.topic, { qos: 0 }, (err) => {
        if (err) {
          console.error('[Guest] Subscribe error:', err);
          if (onError) onError('Could not find room. Please check the code.');
          return;
        }
        console.log('[Guest] Subscribed to unified room topic:', this.topic);
        this.isConnected = true;
        if (onConnected) onConnected('guest');

        // Immediately send join signal and keep repeating until host responds
        const announceTimer = setInterval(() => {
          if (this.game.mode === 'online_guest' || !this.client || !this.client.connected) {
            clearInterval(announceTimer);
            return;
          }
          this.send({
            type: 'GUEST_JOINED',
            guestPenId: this.game.p2PenId,
            guestPaletteId: this.game.p2PaletteId
          });
        }, 400);

        setTimeout(() => clearInterval(announceTimer), 25000);
      });
    }, onData, onError);
  }

  connectBroker(onSubscribed, onData, onError) {
    const mqttLib = window.mqtt || (typeof mqtt !== 'undefined' ? mqtt : null);
    if (!mqttLib) {
      if (onError) onError('Multiplayer service loading, tap connect in a moment...');
      return;
    }

    try {
      const brokerUrl = this.brokers[this.currentBrokerIndex % this.brokers.length];
      const clientId = 'pf10_' + this.role + '_' + Math.random().toString(16).substring(2, 9);
      console.log('[Network] Connecting:', brokerUrl);

      this.client = mqttLib.connect(brokerUrl, {
        clientId: clientId,
        clean: true,
        connectTimeout: 7000,
        reconnectPeriod: 2500,
        keepalive: 30
      });

      this.client.on('connect', () => {
        console.log('[Network] Connected to broker!');
        if (onSubscribed) onSubscribed();
      });

      this.client.on('message', (topic, payload) => {
        try {
          const data = JSON.parse(payload.toString());
          if (data && data.senderRole !== this.role) {
            if (onData) onData(data);
          }
        } catch (e) {
          console.error('[Network] Parse error:', e);
        }
      });

      this.client.on('error', (err) => {
        console.warn('[Network] Broker warning:', err);
        this.currentBrokerIndex++;
      });
    } catch (e) {
      console.error('[Network] Connect error:', e);
      if (onError) onError('Connection error. Please check your internet.');
    }
  }

  send(data) {
    if (this.client && this.client.connected && this.topic) {
      try {
        const payload = Object.assign({}, data, { senderRole: this.role });
        this.client.publish(this.topic, JSON.stringify(payload), { qos: 0 });
      } catch (err) {
        console.error('[Network] Send error:', err);
      }
    }
  }

  cleanup() {
    if (this.client) {
      try {
        if (this.topic) this.client.unsubscribe(this.topic);
        this.client.end(true);
      } catch (e) {}
      this.client = null;
    }
    this.isConnected = false;
  }
}
