import { Vector2D } from '../physics/Vector2D.js';
import { PEN_PRESETS } from '../models/Pen.js';

export function drawRoundedRect(ctx, x, y, width, height, radius = 0) {
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

export class GameUI {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.game = game;

    this.isDragging = false;
    this.dragStartPos = new Vector2D(0, 0);
    this.currentDragPos = new Vector2D(0, 0);
    this.selectedPen = null;
    this.strikeOffsetT = 0;
    this.maxPullDistance = 220;
    this.calculatedPower = 0;
    this.aimAngle = 0;
    this.particles = [];

    this.bindEvents();
  }

  bindEvents() {
    const c = this.canvas;
    const getCanvasPos = (e) => {
      const rect = c.getBoundingClientRect();
      const clientX = (e.touches && e.touches.length > 0) ? e.touches[0].clientX : e.clientX;
      const clientY = (e.touches && e.touches.length > 0) ? e.touches[0].clientY : e.clientY;
      const scaleX = c.width / (rect.width || 1);
      const scaleY = c.height / (rect.height || 1);
      return new Vector2D((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
    };

    const handlePointerDown = (e) => {
      if (this.game.state !== 'AIMING') return;
      const currentActivePen = this.game.getCurrentActivePen();
      if (!currentActivePen || currentActivePen.owner === 'ai') return;

      const pos = getCanvasPos(e);
      const geom = currentActivePen.getGeometricCenter();
      const clickDist = pos.dist(geom);

      if (clickDist < currentActivePen.length * 0.8 + 60) {
        this.isDragging = true;
        this.selectedPen = currentActivePen;
        this.dragStartPos = pos;
        this.currentDragPos = pos.copy();

        const axis = currentActivePen.getAxis();
        const toClick = Vector2D.sub(pos, geom);
        const projectedDist = toClick.dot(axis);
        const halfL = currentActivePen.length * 0.5;
        this.strikeOffsetT = Math.max(-0.88, Math.min(0.88, projectedDist / (halfL || 1)));
      }
    };

    const handlePointerMove = (e) => {
      if (!this.isDragging || !this.selectedPen) return;
      const pos = getCanvasPos(e);
      this.currentDragPos = pos;

      const strikePoint = this.selectedPen.getPointAlongAxis(this.strikeOffsetT);
      const pullVec = Vector2D.sub(strikePoint, pos);
      const pullDist = pullVec.mag();

      this.calculatedPower = Math.min(100, Math.max(5, (pullDist / this.maxPullDistance) * 100));
      this.aimAngle = pullVec.heading();
      this.updatePowerGaugeUI(this.calculatedPower);
    };

    const handlePointerUp = () => {
      if (!this.isDragging || !this.selectedPen) return;
      if (this.calculatedPower >= 8) {
        const strikePoint = this.selectedPen.getPointAlongAxis(this.strikeOffsetT);
        const impulseMag = (this.calculatedPower / 100) * 820;
        const impulseDir = Vector2D.fromAngle(this.aimAngle);
        const impulse = Vector2D.mult(impulseDir, impulseMag);
        this.game.executeShot(this.selectedPen, strikePoint, impulse, this.calculatedPower);
      }
      this.isDragging = false;
      this.calculatedPower = 0;
      this.updatePowerGaugeUI(0);
    };

    c.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    c.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handlePointerDown(e);
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (this.isDragging) e.preventDefault();
      handlePointerMove(e);
    }, { passive: false });

    window.addEventListener('touchend', handlePointerUp);
  }

  setStrikeOffsetT(t) {
    this.strikeOffsetT = Math.max(-0.9, Math.min(0.9, t));
  }

  updatePowerGaugeUI(power) {
    const powerFill = document.getElementById('powerGaugeFill');
    const powerVal = document.getElementById('powerGaugeValue');
    if (powerFill) {
      powerFill.style.width = power + '%';
      if (power > 75) {
        powerFill.style.background = 'linear-gradient(90deg, #ff9100, #ff1744)';
      } else if (power > 40) {
        powerFill.style.background = 'linear-gradient(90deg, #00e5ff, #ffea00)';
      } else {
        powerFill.style.background = 'linear-gradient(90deg, #00e5ff, #76ff03)';
      }
    }
    if (powerVal) {
      powerVal.textContent = Math.round(power) + '%';
    }
  }

  addSparkParticles(x, y, count = 12, color = '#ffffff') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 140;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 2.5,
        alpha: 1,
        decay: 0.035 + Math.random() * 0.03,
        color
      });
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.alpha -= p.decay;
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }
  }

  drawParticles() {
    const ctx = this.ctx;
    for (const p of this.particles) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();
    }
  }

  drawDesk(desk) {
    const ctx = this.ctx;
    const { width, height } = this.canvas;

    const dX = desk ? desk.x : 100;
    const dY = desk ? desk.y : 100;
    const dW = desk ? desk.width : (width - 200);
    const dH = desk ? desk.height : (height - 200);

    // 1. Dark Classroom Floor
    ctx.fillStyle = '#141210';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 2. Desk Shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 36;
    ctx.shadowOffsetY = 20;
    ctx.fillStyle = '#2d1d12';
    drawRoundedRect(ctx, dX - 4, dY - 4, dW + 8, dH + 8, 16);
    ctx.fill();
    ctx.restore();

    // 3. Wooden Bevel / Rim
    const bevelGrad = ctx.createLinearGradient(dX, dY, dX, dY + dH);
    bevelGrad.addColorStop(0, '#5c3a21');
    bevelGrad.addColorStop(0.5, '#3e2513');
    bevelGrad.addColorStop(1, '#2a170b');
    ctx.fillStyle = bevelGrad;
    drawRoundedRect(ctx, dX, dY, dW, dH, 12);
    ctx.fill();

    // 4. Playing surface
    const pad = 12;
    const playX = dX + pad;
    const playY = dY + pad;
    const playW = Math.max(10, dW - pad * 2);
    const playH = Math.max(10, dH - pad * 2);

    ctx.save();
    drawRoundedRect(ctx, playX, playY, playW, playH, 8);
    ctx.clip();

    // Warm Wooden Surface
    const deskGrad = ctx.createLinearGradient(playX, playY, playX + playW, playY + playH);
    deskGrad.addColorStop(0, '#b5834b');
    deskGrad.addColorStop(0.35, '#a8753e');
    deskGrad.addColorStop(0.7, '#ba8a52');
    deskGrad.addColorStop(1, '#9e6c35');
    ctx.fillStyle = deskGrad;
    ctx.fillRect(playX, playY, playW, playH);

    // Wood Grain lines
    ctx.fillStyle = 'rgba(90, 50, 15, 0.08)';
    for (let gy = playY + 8; gy < playY + playH; gy += 14) {
      ctx.fillRect(playX, gy, playW, 3);
    }

    // Ambient Lighting
    const lightGrad = ctx.createRadialGradient(
      playX + playW * 0.45, playY + playH * 0.4, 60,
      playX + playW * 0.5, playY + playH * 0.5, playW * 0.7
    );
    lightGrad.addColorStop(0, 'rgba(255, 245, 220, 0.22)');
    lightGrad.addColorStop(0.6, 'rgba(100, 60, 20, 0.12)');
    lightGrad.addColorStop(1, 'rgba(30, 15, 5, 0.42)');
    ctx.fillStyle = lightGrad;
    ctx.fillRect(playX, playY, playW, playH);

    // Notebook Paper
    this.drawNotebookPaper(ctx, playX + 35, playY + 30, 140, 95);

    // Doodles
    this.drawDeskDoodles(ctx, playX, playY, playW, playH);

    // Center dividing line
    ctx.beginPath();
    ctx.setLineDash([8, 8]);
    ctx.moveTo(playX + playW * 0.5, playY + 15);
    ctx.lineTo(playX + playW * 0.5, playY + playH - 15);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center ring
    ctx.beginPath();
    ctx.arc(playX + playW * 0.5, playY + playH * 0.5, 65, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();

    // Cliff Edge Danger Outline
    ctx.strokeStyle = 'rgba(255, 60, 60, 0.45)';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, playX, playY, playW, playH, 8);
    ctx.stroke();
  }

  drawNotebookPaper(ctx, x, y, w, h) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.05);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(4, 4, w, h);

    ctx.fillStyle = '#fdfdf6';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#bbdefb';
    ctx.lineWidth = 1;
    for (let ly = 18; ly < h - 8; ly += 14) {
      ctx.beginPath();
      ctx.moveTo(8, ly);
      ctx.lineTo(w - 8, ly);
      ctx.stroke();
    }

    ctx.strokeStyle = '#ffcdd2';
    ctx.beginPath();
    ctx.moveTo(24, 4);
    ctx.lineTo(24, h - 4);
    ctx.stroke();

    ctx.fillStyle = '#1565c0';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('PEN FIGHT 2026', 28, 15);
    ctx.fillStyle = '#78909c';
    ctx.font = '9px sans-serif';
    ctx.fillText('Tip = Spin Hook', 28, 30);
    ctx.fillText('Tail = Sweep Bat', 28, 44);
    ctx.fillText('Center = Ram Hit', 28, 58);
    ctx.fillText('Knock off desk to win!', 28, 72);

    ctx.restore();
  }

  drawDeskDoodles(ctx, x, y, w, h) {
    ctx.save();
    ctx.strokeStyle = 'rgba(60, 35, 10, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.fillStyle = 'rgba(60, 35, 10, 0.4)';
    ctx.font = 'bold 12px sans-serif';

    ctx.strokeRect(x + w - 110, y + h - 60, 40, 25);
    ctx.fillText('VS', x + w - 96, y + h - 43);

    for (let rx = x + 30; rx < x + w - 30; rx += 12) {
      const tickH = (rx % 60 === 0) ? 12 : (rx % 24 === 0) ? 8 : 4;
      ctx.beginPath();
      ctx.moveTo(rx, y + h - 14);
      ctx.lineTo(rx, y + h - 14 - tickH);
      ctx.stroke();
    }
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

    // Reticle
    ctx.beginPath();
    ctx.arc(strikePoint.x, strikePoint.y, 14 * (0.8 + powerRatio * 0.4), 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 229, 255, ' + (0.2 + powerRatio * 0.35) + ')';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00e5ff';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(strikePoint.x, strikePoint.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Trajectory Line
    const lineLen = 120 + powerRatio * 280;
    const endPoint = Vector2D.add(strikePoint, Vector2D.mult(aimDir, lineLen));

    ctx.beginPath();
    ctx.setLineDash([8, 6]);
    ctx.moveTo(strikePoint.x, strikePoint.y);
    ctx.lineTo(endPoint.x, endPoint.y);
    ctx.strokeStyle = 'rgba(0, 229, 255, ' + (0.75 + powerRatio * 0.25) + ')';
    ctx.lineWidth = 2.5 + powerRatio * 2;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(endPoint.x, endPoint.y, 6 + powerRatio * 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Cue Stick
    const pullDist = (this.calculatedPower / 100) * this.maxPullDistance;
    const cueStart = Vector2D.sub(strikePoint, Vector2D.mult(aimDir, 18 + pullDist));
    const cueEnd = Vector2D.sub(cueStart, Vector2D.mult(aimDir, 140));

    ctx.beginPath();
    ctx.moveTo(cueStart.x + 4, cueStart.y + 6);
    ctx.lineTo(cueEnd.x + 4, cueEnd.y + 6);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 7;
    ctx.stroke();

    const cueGrad = ctx.createLinearGradient(cueStart.x, cueStart.y, cueEnd.x, cueEnd.y);
    cueGrad.addColorStop(0, '#ffffff');
    cueGrad.addColorStop(0.08, '#00e5ff');
    cueGrad.addColorStop(0.18, '#d7ccc8');
    cueGrad.addColorStop(0.8, '#8d6e63');
    cueGrad.addColorStop(1, '#3e2723');

    ctx.beginPath();
    ctx.moveTo(cueStart.x, cueStart.y);
    ctx.lineTo(cueEnd.x, cueEnd.y);
    ctx.strokeStyle = cueGrad;
    ctx.lineWidth = 6.5;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Spin preview indicator
    const rx = strikePoint.x - pen.pos.x;
    const ry = strikePoint.y - pen.pos.y;
    const expectedTorque = rx * (aimDir.y * this.calculatedPower) - ry * (aimDir.x * this.calculatedPower);
    if (Math.abs(expectedTorque) > 250) {
      const isCW = expectedTorque > 0;
      const spinAngle = isCW ? 1 : -1;
      ctx.beginPath();
      ctx.arc(pen.pos.x, pen.pos.y, pen.length * 0.45, pen.angle - 0.6 * spinAngle, pen.angle + 0.6 * spinAngle, !isCW);
      ctx.strokeStyle = 'rgba(255, 234, 0, 0.75)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    ctx.restore();
  }

  drawObstacles(obstacles) {
    const ctx = this.ctx;
    for (const obs of obstacles) {
      ctx.save();
      if (obs.type === 'box') {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 5;
        ctx.fillStyle = obs.color || '#eceff1';
        drawRoundedRect(ctx, obs.x, obs.y, obs.width, obs.height, 6);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#78909c';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(obs.label || 'ERASER', obs.x + obs.width * 0.5, obs.y + obs.height * 0.5);
      }
      ctx.restore();
    }
  }

  render(desk, pens, obstacles, options = {}) {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);

    try {
      this.drawDesk(desk);
      this.drawObstacles(obstacles);

      for (const pen of pens) {
        const isCurrentActive = this.game.getCurrentActivePen() === pen;
        pen.draw(this.ctx, {
          showCom: isCurrentActive || options.showCom,
          isAiming: isCurrentActive && this.game.state === 'AIMING'
        });
      }

      if (this.game.state === 'AIMING') {
        this.drawAimingGuide();
      }

      this.drawParticles();
    } catch (err) {
      console.error('Error during Canvas render:', err);
    }
  }
}
