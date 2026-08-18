import { Vector2D } from './Vector2D.js';

/**
 * RigidBody - 2D Capsule/Polygon Rigid Body with Eccentric Center of Mass
 */
export class RigidBody {
  constructor(options = {}) {
    // Physical geometry
    this.length = options.length || 130;       // Total length in px
    this.radius = options.radius || 10;        // Cylinder radius (half-thickness) in px
    this.mass = options.mass || 20;            // Mass in grams / physics units
    
    // Mass distribution
    // comOffsetRatio: -0.4 (extreme tail-heavy) to +0.4 (extreme tip-heavy), 0 = centered
    this.comOffsetRatio = options.comOffsetRatio || 0; 
    // massConcentration: 'center' (low inertia), 'uniform', 'edges' (high inertia)
    this.massConcentration = options.massConcentration || 'uniform';
    
    // State variables
    this.pos = options.pos ? options.pos.copy() : new Vector2D(0, 0); // Position of Center of Mass (CoM)
    this.vel = options.vel ? options.vel.copy() : new Vector2D(0, 0); // Linear velocity of CoM
    this.angle = options.angle || 0;                                  // Heading angle in radians
    this.angVel = options.angVel || 0;                                // Angular velocity (rad/s)
    
    // Surface physics properties
    this.restitution = options.restitution !== undefined ? options.restitution : 0.65; // Bounciness
    this.friction = options.friction !== undefined ? options.friction : 0.985;        // Linear desk friction factor
    this.angularFriction = options.angularFriction !== undefined ? options.angularFriction : 0.978; // Spin damping factor
    this.gripFriction = options.gripFriction !== undefined ? options.gripFriction : 0.35; // Friction between pens upon collision
    
    // Status
    this.isFalling = false;
    this.fallProgress = 0; // 0 to 1 as it tips and drops off desk
    this.fallSpeed = 0;
    this.fallAngleX = 0;
    this.fallAngleY = 0;
    this.isDead = false;
    this.isSleeping = false;
    
    // Calculate moment of inertia
    this.updateInertia();
  }

  updateInertia() {
    const L = this.length;
    const R = this.radius;
    const M = this.mass;
    
    // CoM physical distance offset from geometric center along axis
    this.comOffset = this.comOffsetRatio * (L * 0.45);
    
    // Base inertia around geometric center based on concentration
    let baseInertia;
    if (this.massConcentration === 'center') {
      baseInertia = (1 / 18) * M * (L * L) + 0.5 * M * (R * R);
    } else if (this.massConcentration === 'edges') {
      baseInertia = (1 / 6) * M * (L * L) + 0.5 * M * (R * R);
    } else {
      // Uniform cylinder
      baseInertia = (1 / 12) * M * (L * L + 3 * R * R);
    }
    
    // Parallel axis theorem: I_cm = I_geom + M * (d_com)^2
    this.inertia = baseInertia + M * (this.comOffset * this.comOffset);
    this.invMass = this.mass > 0 ? 1 / this.mass : 0;
    this.invInertia = this.inertia > 0 ? 1 / this.inertia : 0;
  }

  // Unit vector pointing from tail towards tip
  getAxis() {
    return Vector2D.fromAngle(this.angle);
  }

  // Unit vector perpendicular to pen axis (pointing rightwards relative to heading)
  getNormal() {
    return this.getAxis().perp();
  }

  // Center of Geometry position
  getGeometricCenter() {
    const axis = this.getAxis();
    // pos is CoM. GeomCenter = CoM - comOffset * axis
    return Vector2D.sub(this.pos, Vector2D.mult(axis, this.comOffset));
  }

  // Tip endpoint (Center of tip hemisphere)
  getTipPos() {
    const axis = this.getAxis();
    const halfL = this.length * 0.5 - this.radius;
    const geom = this.getGeometricCenter();
    return Vector2D.add(geom, Vector2D.mult(axis, halfL));
  }

  // Tail endpoint (Center of tail hemisphere)
  getTailPos() {
    const axis = this.getAxis();
    const halfL = this.length * 0.5 - this.radius;
    const geom = this.getGeometricCenter();
    return Vector2D.sub(geom, Vector2D.mult(axis, halfL));
  }

  // Get point on pen axis corresponding to normalized position t [-1 (tail) to +1 (tip)]
  getPointAlongAxis(t) {
    const axis = this.getAxis();
    const geom = this.getGeometricCenter();
    const halfL = this.length * 0.5;
    return Vector2D.add(geom, Vector2D.mult(axis, t * halfL));
  }

  // Velocity at a specific world point on the rigid body
  getVelocityAtPoint(worldPoint) {
    // r = worldPoint - CoM
    const rx = worldPoint.x - this.pos.x;
    const ry = worldPoint.y - this.pos.y;
    // v_rot = omega x r = (-omega * ry, omega * rx)
    return new Vector2D(
      this.vel.x - this.angVel * ry,
      this.vel.y + this.angVel * rx
    );
  }

  // Apply an impulse force vector J at world point P
  applyImpulse(impulse, worldPoint) {
    if (this.isFalling || this.isDead) return;
    
    // Linear velocity change: delta_v = J / M
    this.vel.add(Vector2D.mult(impulse, this.invMass));
    
    // Angular velocity change: delta_omega = (r x J) / I
    const rx = worldPoint.x - this.pos.x;
    const ry = worldPoint.y - this.pos.y;
    const torque = rx * impulse.y - ry * impulse.x;
    this.angVel += torque * this.invInertia;
    
    this.isSleeping = false;
  }

  // Update physics for a single time step dt
  integrate(dt, frictionMultiplier = 1.0) {
    if (this.isDead) return;

    if (this.isFalling) {
      this.fallProgress += dt * 2.2;
      this.fallSpeed += 980 * dt;
      this.pos.y += this.fallSpeed * dt * 0.4;
      this.angVel *= 0.99;
      this.angle += this.angVel * dt * 1.5;
      
      if (this.fallProgress >= 1.0) {
        this.isDead = true;
      }
      return;
    }

    // Integrate position & angle
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.angle += this.angVel * dt;

    // Apply surface desk friction (exponential decay per frame)
    const linFric = Math.pow(this.friction, dt * 60 * frictionMultiplier);
    const angFric = Math.pow(this.angularFriction, dt * 60 * frictionMultiplier);
    
    this.vel.mult(linFric);
    this.angVel *= angFric;

    // Static friction cutoff
    const speedSq = this.vel.magSq();
    const angSpeed = Math.abs(this.angVel);

    if (speedSq < 0.25 && angSpeed < 0.04) {
      this.vel.set(0, 0);
      this.angVel = 0;
      this.isSleeping = true;
    } else {
      this.isSleeping = false;
    }
  }

  // Check if pen is at rest
  isAtRest() {
    return (
      this.isFalling ||
      this.isDead ||
      (this.vel.magSq() < 0.4 && Math.abs(this.angVel) < 0.05)
    );
  }

  // Get four boundary corners of the oriented bounding box
  getCorners() {
    const axis = this.getAxis();
    const norm = this.getNormal();
    const halfL = this.length * 0.5;
    const R = this.radius;
    const geom = this.getGeometricCenter();

    const forward = Vector2D.mult(axis, halfL);
    const side = Vector2D.mult(norm, R);

    return [
      Vector2D.add(geom, forward).add(side),     // Tip Right
      Vector2D.add(geom, forward).sub(side),     // Tip Left
      Vector2D.sub(geom, forward).sub(side),     // Tail Left
      Vector2D.sub(geom, forward).add(side)      // Tail Right
    ];
  }
}
