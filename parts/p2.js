
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
