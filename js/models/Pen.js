import { drawRoundedRect } from '../ui/GameUI.js';
import { RigidBody } from '../physics/RigidBody.js';
import { Vector2D } from '../physics/Vector2D.js';

export const PEN_PRESETS = {
  classic_ballpoint: {
    id: 'classic_ballpoint',
    name: 'Classic Ballpoint',
    tagline: 'Light & Agile Speedster',
    description: 'Lightweight plastic pen with rapid acceleration and snappy spins. Highly maneuverable.',
    mass: 14,
    length: 125,
    radius: 9,
    comOffsetRatio: 0.0,
    massConcentration: 'uniform',
    restitution: 0.72,
    friction: 0.983,
    angularFriction: 0.976,
    gripFriction: 0.32,
    bodyColor: '#1e88e5',
    capColor: '#0d47a1',
    gripColor: '#1565c0',
    clipColor: '#90caf9',
    nibType: 'ballpoint',
    weightCategory: 'Light (14g)',
    comLabel: 'Centered'
  },
  gel_pen: {
    id: 'gel_pen',
    name: 'Imported Gel Pen',
    tagline: 'Front-Heavy Whipper',
    description: 'Heavy metal tip and rubberized grip make this front-weighted pen devastating for hook sweeps and curve flicks.',
    mass: 24,
    length: 135,
    radius: 10,
    comOffsetRatio: 0.28,
    massConcentration: 'edges',
    restitution: 0.65,
    friction: 0.985,
    angularFriction: 0.979,
    gripFriction: 0.42,
    bodyColor: '#e53935',
    capColor: '#b71c1c',
    gripColor: '#212121',
    clipColor: '#cfd8dc',
    nibType: 'gel_nib',
    weightCategory: 'Medium (24g)',
    comLabel: 'Front-Heavy (Tip)'
  },
  metal_tank: {
    id: 'metal_tank',
    name: 'Executive Metal Pen',
    tagline: 'Heavy Battering Ram',
    description: 'Solid brass and stainless steel chassis. Hard to push off, delivers crushing direct blows.',
    mass: 48,
    length: 130,
    radius: 11.5,
    comOffsetRatio: 0.0,
    massConcentration: 'uniform',
    restitution: 0.58,
    friction: 0.988,
    angularFriction: 0.984,
    gripFriction: 0.28,
    bodyColor: '#37474f',
    capColor: '#263238',
    gripColor: '#cfd8dc',
    clipColor: '#ffd700',
    nibType: 'metal_cone',
    weightCategory: 'Heavy Tank (48g)',
    comLabel: 'Centered'
  },
  fountain_pen: {
    id: 'fountain_pen',
    name: 'Vintage Fountain Pen',
    tagline: 'Back-Heavy Sweeper',
    description: 'With its weighted cap posted on the tail, it sweeps like a broadsword with large rotational momentum.',
    mass: 32,
    length: 140,
    radius: 11,
    comOffsetRatio: -0.26,
    massConcentration: 'edges',
    restitution: 0.62,
    friction: 0.986,
    angularFriction: 0.982,
    gripFriction: 0.36,
    bodyColor: '#1b5e20',
    capColor: '#004d40',
    gripColor: '#ffd700',
    clipColor: '#ffd700',
    nibType: 'gold_nib',
    weightCategory: 'Medium-Heavy (32g)',
    comLabel: 'Tail-Heavy (Cap)'
  },
  center_marker: {
    id: 'center_marker',
    name: 'Fineliner Clicker',
    tagline: 'Center-Weighted Balancer',
    description: 'Mass concentrated in the center mechanism gives tight, responsive spin recovery and crisp straight thrusts.',
    mass: 19,
    length: 120,
    radius: 9.5,
    comOffsetRatio: 0.04,
    massConcentration: 'center',
    restitution: 0.70,
    friction: 0.984,
    angularFriction: 0.972,
    gripFriction: 0.35,
    bodyColor: '#8e24aa',
    capColor: '#4a148c',
    gripColor: '#ab47bc',
    clipColor: '#ffffff',
    nibType: 'fineliner',
    weightCategory: 'Balanced (19g)',
    comLabel: 'Center-Heavy'
  }
};

export class Pen extends RigidBody {
  constructor(presetId = 'classic_ballpoint', customConfig = {}, owner = 'player1') {
    const basePreset = PEN_PRESETS[presetId] || PEN_PRESETS.classic_ballpoint;
    const config = { ...basePreset, ...customConfig };
    super(config);
    this.presetId = presetId;
    this.name = config.name;
    this.owner = owner;
    this.bodyColor = config.bodyColor;
    this.capColor = config.capColor;
    this.gripColor = config.gripColor;
    this.clipColor = config.clipColor;
    this.nibType = config.nibType || 'ballpoint';
    this.hitsDealt = 0;
    this.knockouts = 0;
    this.totalDistance = 0;
    this.trailHistory = [];
  }

  updateTrail() {
    const speed = this.vel.mag();
    if (speed > 80) {
      const geom = this.getGeometricCenter();
      this.trailHistory.push({
        x: geom.x,
        y: geom.y,
        alpha: 0.35,
        speed
      });
    }
    for (let i = this.trailHistory.length - 1; i >= 0; i--) {
      this.trailHistory[i].alpha -= 0.04;
      if (this.trailHistory[i].alpha <= 0) {
        this.trailHistory.splice(i, 1);
      }
    }
  }

  draw(ctx, options = {}) {
    if (this.isDead) return;
    this.updateTrail();
    for (const trail of this.trailHistory) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(trail.x, trail.y, this.radius * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, ' + (trail.alpha * 0.4) + ')';
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
      ctx.rotate(this.angle + this.fallProgress * Math.PI * 2 * this.fallAngleX);
      ctx.globalAlpha = Math.max(0, 1 - this.fallProgress * 0.9);
    } else {
      ctx.rotate(this.angle);
    }
    if (!this.isFalling) {
      ctx.save();
      ctx.shadowColor = 'rgba(15, 10, 5, 0.45)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetX = 6;
      ctx.shadowOffsetY = 8;
      ctx.beginPath();
      drawRoundedRect(ctx, -halfL, -R, this.length, R * 2, R);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fill();
      ctx.restore();
    }
    const bodyGrad = ctx.createLinearGradient(0, -R, 0, R);
    bodyGrad.addColorStop(0, this.lightenColor(this.bodyColor, 40));
    bodyGrad.addColorStop(0.2, this.lightenColor(this.bodyColor, 80));
    bodyGrad.addColorStop(0.5, this.bodyColor);
    bodyGrad.addColorStop(0.85, this.darkenColor(this.bodyColor, 30));
    bodyGrad.addColorStop(1, this.darkenColor(this.bodyColor, 60));
    ctx.beginPath();
    drawRoundedRect(ctx, -halfL, -R, this.length, R * 2, R);
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
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
    ctx.fillStyle = this.nibType === 'gold_nib' ? '#ffd700' : '#212121';
    ctx.fill();
    const capWidth = halfL * 0.5;
    const capStartX = -halfL;
    const capGrad = ctx.createLinearGradient(0, -R, 0, R);
    capGrad.addColorStop(0, this.lightenColor(this.capColor, 30));
    capGrad.addColorStop(0.25, this.lightenColor(this.capColor, 70));
    capGrad.addColorStop(0.6, this.capColor);
    capGrad.addColorStop(1, this.darkenColor(this.capColor, 50));
    ctx.beginPath();
    drawRoundedRect(ctx, capStartX, -R * 1.04, capWidth, R * 2.08, [R, 0, 0, R]);
    ctx.fillStyle = capGrad;
    ctx.fill();
    ctx.stroke();
    const clipGrad = ctx.createLinearGradient(0, -R, 0, R);
    clipGrad.addColorStop(0, '#ffffff');
    clipGrad.addColorStop(0.5, this.clipColor);
    clipGrad.addColorStop(1, '#616161');
    ctx.beginPath();
    drawRoundedRect(ctx, capStartX + 4, -R * 1.35, capWidth * 0.75, R * 0.35, 2);
    ctx.fillStyle = clipGrad;
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.rect(capStartX + capWidth - 4, -R * 1.05, 4, R * 2.1);
    ctx.fillStyle = this.owner === 'player1' ? '#00e5ff' : this.owner === 'player2' ? '#ff3d00' : '#ffea00';
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
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const r = Math.min(255, (num >> 16) + amt);
    const g = Math.min(255, ((num >> 8) & 0x00ff) + amt);
    const b = Math.min(255, (num & 0x0000ff) + amt);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  darkenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const r = Math.max(0, (num >> 16) - amt);
    const g = Math.max(0, ((num >> 8) & 0x00ff) - amt);
    const b = Math.max(0, (num & 0x0000ff) - amt);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
}
