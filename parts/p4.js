
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