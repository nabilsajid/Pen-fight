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
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return new Vector2D(
        (clientX - rect.left) * (this.canvas.width / rect.width),
        (clientY - rect.top) * (this.canvas.height / rect.height)
      );
    };

    const handleDown = (pos) => {
      if (this.game.state !== 'AIMING') return;

      const currentActivePen = this.game.getCurrentActivePen();
      if (!currentActivePen || currentActivePen.owner === 'ai') return;

      const clickDist = pos.dist(currentActivePen.pos);
      if (clickDist < currentActivePen.length * 0.85 + 50) {
        this.isDragging = true;
        this.selectedPen = currentActivePen;
        this.dragStartPos = pos;
        this.dragCurrentPos = pos;
        this.game.sound.init();
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
        const impulseMag = finalPower * 28 * (this.selectedPen.mass / 20);
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

    this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleDown(getPos(e)); }, { passive: false });
    window.addEventListener('touchmove', (e) => { if (this.isDragging) { e.preventDefault(); handleMove(getPos(e)); } }, { passive: false });
    window.addEventListener('touchend', () => handleUp());
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
    ctx.fillText('τ = r × F', width - 200, 45);
    ctx.fillText('θ = ω · t', width - 100, 45);

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

    // 5. SCHOOL PROPS: Taped Notebook Paper, 30cm School Ruler, Pink Eraser & Doodles
    this.drawNotebookPaper(ctx, playX + 28, playY + 24, 155, 105);
    this.drawSchoolRuler(ctx, playX + playW * 0.38, playY + playH - 24, 210, 16);
    this.drawPinkEraser(ctx, playX + playW - 85, playY + 28, 48, 22);
    this.drawDeskDoodles(ctx, playX, playY, playW, playH);

    ctx.beginPath();
    ctx.setLineDash([8, 8]);
    ctx.moveTo(playX + playW * 0.5, playY + 15);
    ctx.lineTo(playX + playW * 0.5, playY + playH - 15);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(playX + playW * 0.5, playY + playH * 0.5, 65, 0, Math.PI * 2);
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

    ctx.strokeRect(x + w - 110, y + h - 55, 42, 26);
    ctx.fillText('VS', x + w - 96, y + h - 38);

    ctx.beginPath();
    ctx.arc(x + 130, y + h - 45, 18, 0, Math.PI * 2);
    ctx.stroke();

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

    if (this.game.state === 'AIMING') {
      const activePen = this.game.getCurrentActivePen();
      if (activePen) {
        this.drawActivePenHalo(activePen);
      }
    }

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
