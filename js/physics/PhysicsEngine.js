import { Vector2D } from './Vector2D.js';

function closestPointsSegmentSegment(p1, q1, p2, q2) {
  const d1 = Vector2D.sub(q1, p1);
  const d2 = Vector2D.sub(q2, p2);
  const r  = Vector2D.sub(p1, p2);

  const a = d1.magSq();
  const e = d2.magSq();
  const f = d2.dot(r);

  let s = 0;
  let t = 0;

  if (a <= 0.0001 && e <= 0.0001) {
    return { pA: p1.copy(), pB: p2.copy(), dist: p1.dist(p2) };
  }

  if (a <= 0.0001) {
    s = 0;
    t = Math.max(0, Math.min(1, f / e));
  } else {
    const c = d1.dot(r);
    if (e <= 0.0001) {
      t = 0;
      s = Math.max(0, Math.min(1, -c / a));
    } else {
      const b = d1.dot(d2);
      const denom = a * e - b * b;

      if (denom !== 0) {
        s = Math.max(0, Math.min(1, (b * f - c * e) / denom));
      } else {
        s = 0;
      }

      t = (b * s + f) / e;

      if (t < 0) {
        t = 0;
        s = Math.max(0, Math.min(1, -c / a));
      } else if (t > 1) {
        t = 1;
        s = Math.max(0, Math.min(1, (b - c) / a));
      }
    }
  }

  const pA = Vector2D.add(p1, Vector2D.mult(d1, s));
  const pB = Vector2D.add(p2, Vector2D.mult(d2, t));

  return { pA, pB, dist: pA.dist(pB) };
}

function closestPointOnSegment(p, a, b) {
  const ab = Vector2D.sub(b, a);
  const l2 = ab.magSq();
  if (l2 <= 0.0001) return a.copy();
  const t = Math.max(0, Math.min(1, Vector2D.sub(p, a).dot(ab) / l2));
  return Vector2D.add(a, Vector2D.mult(ab, t));
}

export class PhysicsEngine {
  constructor(deskBounds, soundManager = null) {
    this.deskBounds = deskBounds;
    this.soundManager = soundManager;
    this.subSteps = 8;
    this.pens = [];
    this.obstacles = [];
    this.collisionEvents = [];
  }

  setDeskBounds(bounds) {
    this.deskBounds = bounds;
  }

  addPen(pen) {
    this.pens.push(pen);
  }

  removePen(pen) {
    const idx = this.pens.indexOf(pen);
    if (idx !== -1) this.pens.splice(idx, 1);
  }

  clear() {
    this.pens = [];
    this.obstacles = [];
    this.collisionEvents = [];
  }

  addObstacle(obstacle) {
    this.obstacles.push(obstacle);
  }

  update(dt) {
    this.collisionEvents = [];
    if (dt <= 0) return;

    const subDt = dt / this.subSteps;

    for (let step = 0; step < this.subSteps; step++) {
      for (const pen of this.pens) {
        pen.integrate(subDt);
      }
      for (const obs of this.obstacles) {
        if (obs.integrate) obs.integrate(subDt);
      }

      for (let i = 0; i < this.pens.length; i++) {
        for (let j = i + 1; j < this.pens.length; j++) {
          this.resolvePenPenCollision(this.pens[i], this.pens[j]);
        }
      }

      for (const pen of this.pens) {
        for (const obs of this.obstacles) {
          this.resolvePenObstacleCollision(pen, obs);
        }
      }

      for (const pen of this.pens) {
        this.checkDeskBoundary(pen);
      }
    }
  }

  resolvePenPenCollision(penA, penB) {
    if (penA.isFalling || penA.isDead || penB.isFalling || penB.isDead) return;

    const tipA = penA.getTipPos();
    const tailA = penA.getTailPos();
    const tipB = penB.getTipPos();
    const tailB = penB.getTailPos();

    const { pA, pB, dist } = closestPointsSegmentSegment(tailA, tipA, tailB, tipB);
    const minDist = penA.radius + penB.radius;

    if (dist < minDist) {
      const penetration = minDist - dist;
      let normal;

      if (dist > 0.0001) {
        normal = Vector2D.sub(pB, pA).normalize();
      } else {
        normal = penA.getNormal();
      }

      const contactPoint = Vector2D.add(pA, Vector2D.mult(normal, penA.radius));
      const rA = Vector2D.sub(contactPoint, penA.pos);
      const rB = Vector2D.sub(contactPoint, penB.pos);

      const vA = penA.getVelocityAtPoint(contactPoint);
      const vB = penB.getVelocityAtPoint(contactPoint);
      const vRel = Vector2D.sub(vB, vA);

      const vNormal = vRel.dot(normal);

      const totalInvMass = penA.invMass + penB.invMass;
      if (totalInvMass > 0) {
        const percent = 0.6;
        const correction = Vector2D.mult(normal, (penetration / totalInvMass) * percent);
        penA.pos.sub(Vector2D.mult(correction, penA.invMass));
        penB.pos.add(Vector2D.mult(correction, penB.invMass));
      }

      if (vNormal >= 0) return;

      const e = Math.min(penA.restitution, penB.restitution);
      const rACrossN = rA.cross(normal);
      const rBCrossN = rB.cross(normal);
      const kNormal =
        penA.invMass +
        penB.invMass +
        (rACrossN * rACrossN) * penA.invInertia +
        (rBCrossN * rBCrossN) * penB.invInertia;

      if (kNormal <= 0.00001) return;

      const jN = -(1 + e) * vNormal / kNormal;
      const normalImpulse = Vector2D.mult(normal, jN);

      const tangent = Vector2D.sub(vRel, Vector2D.mult(normal, vNormal));
      const tangentSpeed = tangent.mag();
      let frictionImpulse = new Vector2D(0, 0);

      if (tangentSpeed > 0.001) {
        const tUnit = Vector2D.mult(tangent, 1 / tangentSpeed);
        const rACrossT = rA.cross(tUnit);
        const rBCrossT = rB.cross(tUnit);
        const kTangent =
          penA.invMass +
          penB.invMass +
          (rACrossT * rACrossT) * penA.invInertia +
          (rBCrossT * rBCrossT) * penB.invInertia;

        if (kTangent > 0.00001) {
          let jT = -tangentSpeed / kTangent;
          const mu = Math.sqrt(penA.gripFriction * penB.gripFriction);
          const maxFriction = jN * mu;
          jT = Math.max(-maxFriction, Math.min(maxFriction, jT));
          frictionImpulse = Vector2D.mult(tUnit, jT);
        }
      }

      const totalImpulse = Vector2D.add(normalImpulse, frictionImpulse);

      penA.applyImpulse(Vector2D.mult(totalImpulse, -1), contactPoint);
      penB.applyImpulse(totalImpulse, contactPoint);

      const impactIntensity = Math.abs(vNormal);
      if (this.soundManager && impactIntensity > 15) {
        this.soundManager.playPenCollision(penA, penB, impactIntensity);
      }

      this.collisionEvents.push({
        x: contactPoint.x,
        y: contactPoint.y,
        intensity: Math.min(100, impactIntensity),
        normal: normal.copy(),
        type: 'pen'
      });
    }
  }

  resolvePenObstacleCollision(pen, obs) {
    if (pen.isFalling || pen.isDead) return;

    if (obs.type === 'circle') {
      const tip = pen.getTipPos();
      const tail = pen.getTailPos();
      const closest = closestPointOnSegment(obs.pos, tail, tip);
      const dist = closest.dist(obs.pos);
      const minDist = pen.radius + obs.radius;

      if (dist < minDist) {
        const normal = dist > 0.0001
          ? Vector2D.sub(closest, obs.pos).normalize()
          : pen.getNormal();
        const penetration = minDist - dist;
        const contactPoint = Vector2D.add(obs.pos, Vector2D.mult(normal, obs.radius));

        pen.pos.add(Vector2D.mult(normal, penetration * 0.8));

        const r = Vector2D.sub(contactPoint, pen.pos);
        const vPen = pen.getVelocityAtPoint(contactPoint);
        const vNormal = vPen.dot(normal);

        if (vNormal < 0) {
          const e = pen.restitution * (obs.restitution || 0.6);
          const rCrossN = r.cross(normal);
          const kNormal = pen.invMass + (rCrossN * rCrossN) * pen.invInertia;
          const jN = -(1 + e) * vNormal / kNormal;
          pen.applyImpulse(Vector2D.mult(normal, jN), contactPoint);

          if (this.soundManager && Math.abs(vNormal) > 15) {
            this.soundManager.playObstacleHit(Math.abs(vNormal));
          }
        }
      }
    } else if (obs.type === 'box') {
      const corners = pen.getCorners();
      for (const corner of corners) {
        if (
          corner.x >= obs.x &&
          corner.x <= obs.x + obs.width &&
          corner.y >= obs.y &&
          corner.y <= obs.y + obs.height
        ) {
          const dl = corner.x - obs.x;
          const dr = (obs.x + obs.width) - corner.x;
          const dt = corner.y - obs.y;
          const db = (obs.y + obs.height) - corner.y;
          const min = Math.min(dl, dr, dt, db);

          let normal = new Vector2D(0, 0);
          if (min === dl) normal.set(-1, 0);
          else if (min === dr) normal.set(1, 0);
          else if (min === dt) normal.set(0, -1);
          else normal.set(0, 1);

          pen.pos.add(Vector2D.mult(normal, (min + 1) * 0.8));

          const r = Vector2D.sub(corner, pen.pos);
          const v = pen.getVelocityAtPoint(corner);
          const vn = v.dot(normal);

          if (vn < 0) {
            const e = pen.restitution * (obs.restitution || 0.5);
            const rCrossN = r.cross(normal);
            const kn = pen.invMass + (rCrossN * rCrossN) * pen.invInertia;
            const jn = -(1 + e) * vn / kn;
            pen.applyImpulse(Vector2D.mult(normal, jn), corner);

            if (this.soundManager && Math.abs(vn) > 15) {
              this.soundManager.playEraserHit(Math.abs(vn));
            }
          }
        }
      }
    }
  }

  checkDeskBoundary(pen) {
    if (pen.isFalling || pen.isDead) return;

    // Safety guard: A pen only falls if it is moving with meaningful speed or spin
    const speedSq = pen.vel.magSq();
    const spin = Math.abs(pen.angVel);
    if (speedSq < 1.0 && spin < 0.05) return;

    const desk = this.deskBounds;
    const margin = 2;

    const comOutside =
      pen.pos.x < desk.x - margin ||
      pen.pos.x > desk.x + desk.width + margin ||
      pen.pos.y < desk.y - margin ||
      pen.pos.y > desk.y + desk.height + margin;

    let pointsOutside = 0;
    const testSamples = [-1, -0.5, 0, 0.5, 1];

    for (const t of testSamples) {
      const p = pen.getPointAlongAxis(t);
      if (
        p.x < desk.x ||
        p.x > desk.x + desk.width ||
        p.y < desk.y ||
        p.y > desk.y + desk.height
      ) {
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

      if (this.soundManager) {
        this.soundManager.playPenFalling(pen);
      }
    }
  }

  isAllAtRest() {
    for (const pen of this.pens) {
      if (!pen.isAtRest()) return false;
    }
    for (const obs of this.obstacles) {
      if (obs.isAtRest && !obs.isAtRest()) return false;
    }
    return true;
  }
}
