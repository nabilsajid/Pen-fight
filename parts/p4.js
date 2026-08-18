
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
}

class GameUI {
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
    this.shakeIntensity = 0;

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
        // REALISTIC HUMAN SHOT VARIANCE / MICRO ERROR:
        // Tabletop pen fighting human release has subtle natural deviations:
        // 1. Angle jitter (~0.4� to 1.2� depending on power)
        const angleJitter = (Math.random() - 0.5) * (0.015 + (this.calculatedPower / 100) * 0.018);
        const finalAngle = this.aimAngle + angleJitter;

        // 2. Power micro-variance (�1.5%)
        const powerJitter = 1.0 + (Math.random() - 0.5) * 0.032;
        const effectivePower = Math.min(100, Math.max(5, this.calculatedPower * powerJitter));

        // 3. Contact point micro-variance (�1.5mm finger placement error)
        const contactJitter = (Math.random() - 0.5) * 0.035;
        const jitteredOffsetT = Math.max(-0.88, Math.min(0.88, this.strikeOffsetT + contactJitter));
        const strikePoint = this.selectedPen.getPointAlongAxis(jitteredOffsetT);

        const impulseMag = (effectivePower / 100) * (this.selectedPen.mass * 1750 + 3500);
        const impulseDir = Vector2D.fromAngle(finalAngle);
        const impulse = Vector2D.mult(impulseDir, impulseMag);
        this.game.executeShot(this.selectedPen, strikePoint, impulse, effectivePower);
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

  setStrikeOffsetT(t) { this.strikeOffsetT = Math.max(-0.9, Math.min(0.9, t)); }

  triggerCameraShake(amount = 8) {
    if (this.game.cameraEffectsEnabled) {
      this.shakeIntensity = amount;
    }
  }

  updatePowerGaugeUI(power) {
    const powerFill = document.getElementById('powerTrackFill');
    const powerBadge = document.getElementById('powerLevelLabel');
    if (powerFill) {
      powerFill.style.width = power + '%';
    }
    if (powerBadge) {
      const rounded = Math.round(power);
      if (power >= 88) {
        powerBadge.className = 'power-badge max';
        powerBadge.textContent = 'MAX (' + rounded + '%) [RISKY]';
      } else if (power >= 60) {
        powerBadge.className = 'power-badge high';
        powerBadge.textContent = 'HIGH (' + rounded + '%)';
      } else if (power >= 30) {
        powerBadge.className = 'power-badge med';
        powerBadge.textContent = 'MED (' + rounded + '%)';
      } else {
        powerBadge.className = 'power-badge low';
        powerBadge.textContent = 'LOW (' + rounded + '%)';
      }
    }
  }

  addSparkParticles(x, y, count = 16, color = '#00e5ff') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 180;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3,
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
    if (this.shakeIntensity > 0) {
      this.shakeIntensity *= 0.88;
      if (this.shakeIntensity < 0.2) this.shakeIntensity = 0;
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

  drawDesk(desk, arenaCfg) {
    const ctx = this.ctx;
    const { width, height } = this.canvas;

    const dX = desk ? desk.x : 100;
    const dY = desk ? desk.y : 100;
    const dW = desk ? desk.width : (width - 200);
    const dH = desk ? desk.height : (height - 200);

    // 1. CLASSROOM AMBIENT BACKGROUND (Floorboards & Chalkboard ambient)
    ctx.fillStyle = '#11141a';
    ctx.fillRect(0, 0, width, height);

    // School floorboard planks
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 2;
    for (let x = 0; x < width; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Faint chalkboard math notes in upper classroom background
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.font = 'italic 16px monospace';
    ctx.fillText('E = mc�', 30, 45);
    ctx.fillText('F = m � a', 140, 45);
    ctx.fillText('v = u + at', 260, 45);
    ctx.fillText('t = r � F', width - 200, 45);
    ctx.fillText('? = ? � t', width - 100, 45);

    // Classroom ambient light ray
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

    // Pencil groove at top of desk
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    drawRoundedRect(ctx, dX + dW * 0.25, dY + 4, dW * 0.5, 6, 3);
    ctx.fill();

    // 4. MAIN PLAYING SURFACE (Wood Grain / Slate)
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

    // Authentic school desk wood grain lines
    ctx.fillStyle = 'rgba(80, 45, 15, 0.07)';
    for (let gy = playY + 6; gy < playY + playH; gy += 12) {
      ctx.fillRect(playX, gy, playW, 2.5);
    }
    // Subtle wood knots
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

    // Center line and circle
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

    // Boundary Table Rim
    ctx.strokeStyle = arenaCfg.rimColor || 'rgba(255, 60, 60, 0.45)';
    ctx.lineWidth = 2.5;
    drawRoundedRect(ctx, playX, playY, playW, playH, 10);
    ctx.stroke();
  }

  drawNotebookPaper(ctx, x, y, w, h) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.035);

    // Paper Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(5, 5, w, h);

    // White Ruled Sheet
    ctx.fillStyle = '#faf8ef';
    ctx.fillRect(0, 0, w, h);

    // Blue horizontal lines
    ctx.strokeStyle = '#c5d8ea';
    ctx.lineWidth = 1;
    for (let ly = 20; ly < h - 8; ly += 14) {
      ctx.beginPath();
      ctx.moveTo(6, ly);
      ctx.lineTo(w - 6, ly);
      ctx.stroke();
    }

    // Red left margin line
    ctx.strokeStyle = '#f8bbd0';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(26, 0);
    ctx.lineTo(26, h);
    ctx.stroke();

    // Masking Tape on top and bottom corners
    ctx.fillStyle = 'rgba(235, 230, 200, 0.75)';
    ctx.fillRect(-8, -4, 28, 12);
    ctx.fillRect(w - 20, h - 8, 28, 12);

    // Handwritten classroom doodles and battle notes
    ctx.fillStyle = '#1565c0';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('PEN FIGHT RULES', 30, 16);
    ctx.fillStyle = '#546e7a';
    ctx.font = '9px sans-serif';
    ctx.fillText('� 1st Turn: Shield active', 30, 31);
    ctx.fillText('� Aim: Pull back to flick', 30, 45);
    ctx.fillText('� Tip = Hook | Tail = Sweep', 30, 59);
    ctx.fillText('� Knock off table to win!', 30, 73);

    // Tally marks
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

    // Wooden / Amber Classroom Ruler
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

    // Centimeter & Millimeter Graduation Marks
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

    // Eraser shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(3, 3, w, h);

    // Pink / Blue dual eraser
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

    // Carved desk initials & doodles
    ctx.strokeRect(x + w - 110, y + h - 55, 42, 26);
    ctx.fillText('VS', x + w - 96, y + h - 38);

    // Compass circle sketch
    ctx.beginPath();
    ctx.arc(x + 130, y + h - 45, 18, 0, Math.PI * 2);
    ctx.stroke();

    // Carved "P1 WAS HERE" graffiti
    ctx.font = '9px monospace';
    ctx.fillText('P1 WAS HERE ??', x + 35, y + h - 16);

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
    ctx.fillStyle = 'rgba(0, 229, 255, ' + (0.2 + powerRatio * 0.35) + ')';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00e5ff';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(strikePoint.x, strikePoint.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

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

    const pullDist = (this.calculatedPower / 100) * this.maxPullDistance;
    const pullEnd = Vector2D.sub(strikePoint, Vector2D.mult(aimDir, 12 + pullDist));
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(strikePoint.x, strikePoint.y);
    ctx.lineTo(pullEnd.x, pullEnd.y);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(pullEnd.x, pullEnd.y, 5 + powerRatio * 4, 0, Math.PI * 2);
    ctx.fillStyle = powerRatio > 0.8 ? '#ff1744' : powerRatio > 0.4 ? '#ffea00' : '#00e5ff';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
    ctx.fill();

    ctx.restore();
  }

  render(desk, pens, arenaCfg, options = {}) {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);

    this.ctx.save();
    if (this.shakeIntensity > 0) {
      const sx = (Math.random() - 0.5) * this.shakeIntensity * 2;
      const sy = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.ctx.translate(sx, sy);
    }

    try {
      this.drawDesk(desk, arenaCfg);

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
      console.error('Render error:', err);
    }

    this.ctx.restore();
  }
}
