import { Vector2D } from '../physics/Vector2D.js';

export class PenAI {
  constructor(difficulty = 'medium') {
    this.difficulty = difficulty; // 'easy', 'medium', 'hard'
  }

  setDifficulty(diff) {
    this.difficulty = diff;
  }

  /**
   * Compute the best shot for the AI pen against target pen
   * Returns: { strikePoint: Vector2D, impulse: Vector2D, powerPercent: number }
   */
  calculateShot(aiPen, playerPen, deskBounds) {
    if (!aiPen || !playerPen || aiPen.isFalling || playerPen.isFalling) return null;

    const aiGeom = aiPen.getGeometricCenter();
    const playerGeom = playerPen.getGeometricCenter();
    const dist = aiGeom.dist(playerGeom);

    // 1. Identify which desk edge is closest to the player (vulnerable edge to push them off)
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

    // 2. Determine target position on player's pen (push towards the cliff edge)
    const targetPoint = Vector2D.sub(playerGeom, Vector2D.mult(knockoffDir, playerPen.radius * 0.5));
    const aimVector = Vector2D.sub(targetPoint, aiGeom).normalize();

    // 3. Select strike point along AI pen body
    // t ranges from -1 (tail) to +1 (tip), 0 = center
    let strikeOffsetT = 0;
    
    if (this.difficulty === 'hard') {
      // If gel pen (front heavy), striking near tail creates strong whip rotation
      if (aiPen.presetId === 'gel_pen' || aiPen.comOffsetRatio > 0.15) {
        strikeOffsetT = -0.75; // Flick the tail to spin front tip into enemy
      } else if (aiPen.presetId === 'fountain_pen' || aiPen.comOffsetRatio < -0.15) {
        strikeOffsetT = 0.7;  // Flick tip to swing heavy tail into enemy
      } else if (dist < 180) {
        strikeOffsetT = 0.0;  // Direct center ram
      } else {
        strikeOffsetT = (Math.random() - 0.5) * 0.4;
      }
    } else if (this.difficulty === 'medium') {
      strikeOffsetT = (Math.random() - 0.5) * 0.6;
    } else {
      // Easy
      strikeOffsetT = (Math.random() - 0.5) * 0.9;
    }

    const strikeWorldPoint = aiPen.getPointAlongAxis(strikeOffsetT);

    // 4. Calculate required power based on distance & pen masses
    const massRatio = playerPen.mass / (aiPen.mass || 20);
    let requiredForce = (dist * 1.8 + 120) * Math.sqrt(massRatio);

    // Self-preservation: check distance from AI to nearest edge in shot direction
    const aiToPlayer = Vector2D.sub(playerGeom, aiGeom);
    let powerPercent = Math.min(100, Math.max(25, (requiredForce / 650) * 100));

    // Difficulty adjustments & human error simulation
    if (this.difficulty === 'easy') {
      const angleErr = (Math.random() - 0.5) * 0.35; // +/- 10 degrees error
      aimVector.rotate(angleErr);
      powerPercent *= (0.7 + Math.random() * 0.5);
    } else if (this.difficulty === 'medium') {
      const angleErr = (Math.random() - 0.5) * 0.12; // +/- 3.5 degrees error
      aimVector.rotate(angleErr);
      powerPercent *= (0.88 + Math.random() * 0.22);
    } else {
      // Hard / Master: High precision
      const angleErr = (Math.random() - 0.5) * 0.04;
      aimVector.rotate(angleErr);
      powerPercent = Math.min(95, Math.max(35, powerPercent * 1.05));
    }

    powerPercent = Math.min(100, Math.max(15, powerPercent));

    // Force magnitude in physics impulse units
    const impulseMag = (powerPercent / 100) * 780;
    const impulse = Vector2D.mult(aimVector, impulseMag);

    return {
      strikePoint: strikeWorldPoint,
      impulse,
      powerPercent,
      aimVector
    };
  }
}
