
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
