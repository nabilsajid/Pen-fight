
if (typeof CanvasRenderingContext2D !== 'undefined') {
  const origRoundRect = CanvasRenderingContext2D.prototype.roundRect;
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
    try {
      if (origRoundRect) {
        origRoundRect.call(this, x, y, w, h, radii);
        return this;
      }
    } catch(e) {}
    const r = typeof radii === 'number' ? radii : (Array.isArray(radii) ? radii[0] : 0);
    this.rect(x, y, w, h);
    return this;
  };
}

import { Vector2D } from './physics/Vector2D.js';
import { PhysicsEngine } from './physics/PhysicsEngine.js';
import { Pen, PEN_PRESETS } from './models/Pen.js';
import { SoundEffects } from './audio/SoundEffects.js';
import { PenAI } from './ai/PenAI.js';
import { GameUI } from './ui/GameUI.js';

export class PenFightGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.sound = new SoundEffects();
    this.ai = new PenAI('medium');

    this.setupCanvasSize();
    this.updateDeskDimensions();

    this.physics = new PhysicsEngine(this.deskBounds, this.sound);
    this.ui = new GameUI(this.canvas, this);

    this.mode = 'vs_ai';
    this.state = 'AIMING';
    this.currentTurn = 'player1';
    this.scores = { player1: 0, player2: 0, ai: 0 };
    this.tournamentRound = 1;
    this.maxTournamentRounds = 3;

    this.penP1 = null;
    this.penP2 = null;

    this.p1Preset = 'gel_pen';
    this.p2Preset = 'metal_tank';
    this.customPenConfig = {
      name: 'Custom Lab Pen',
      mass: 25,
      length: 130,
      radius: 10,
      comOffsetRatio: 0.0,
      massConcentration: 'uniform',
      bodyColor: '#ff6f00',
      capColor: '#e65100',
      gripColor: '#263238',
      clipColor: '#ffd700'
    };

    // Ensure all modals are closed initially
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.add('hidden'));

    this.hideAllModals();
    this.initMatch();
    this.bindDomControls();

    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  setupCanvasSize() {
    const container = document.getElementById('canvasContainer');
    const rect = container ? container.getBoundingClientRect() : null;
    const w = (rect && rect.width > 100) ? rect.width : window.innerWidth;
    const h = (rect && rect.height > 100) ? rect.height : (window.innerHeight - 56);

    this.canvas.width = Math.max(640, Math.floor(w));
    this.canvas.height = Math.max(480, Math.floor(h));
  }

  updateDeskDimensions() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const deskW = Math.min(940, Math.max(560, w * 0.84));
    const deskH = Math.min(560, Math.max(380, h * 0.80));
    const deskX = (w - deskW) * 0.5;
    const deskY = (h - deskH) * 0.5;

    this.deskBounds = {
      x: deskX,
      y: deskY,
      width: deskW,
      height: deskH
    };

    if (this.physics) {
      this.physics.setDeskBounds(this.deskBounds);
    }
  }

  
  hideAllModals() {
    ['roundEndModal', 'penPickerModal', 'customizerModal'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.setProperty('display', 'none', 'important');
        el.classList.add('hidden');
      }
    });
  }

  initMatch() {
    this.hideAllModals();
    this.physics.clear();
    this.state = 'AIMING';
    this.currentTurn = 'player1';

    // Hide round modal
    const modal = document.getElementById('roundEndModal');
    if (modal) this.hideAllModals();

    const desk = this.deskBounds;
    const midY = desk.y + desk.height * 0.5;

    if (this.mode === 'sandbox') {
      this.penP1 = new Pen(this.p1Preset, this.p1Preset === 'custom' ? this.customPenConfig : {}, 'player1');
      this.penP1.pos.set(desk.x + desk.width * 0.3, midY);
      this.penP1.angle = 0;
      this.penP1.vel.set(0, 0);
      this.penP1.angVel = 0;
      this.penP1.isFalling = false;
      this.penP1.isDead = false;
      this.physics.addPen(this.penP1);

      this.penP2 = new Pen(this.p2Preset, {}, 'player2');
      this.penP2.pos.set(desk.x + desk.width * 0.7, midY);
      this.penP2.angle = Math.PI;
      this.penP2.vel.set(0, 0);
      this.penP2.angVel = 0;
      this.penP2.isFalling = false;
      this.penP2.isDead = false;
      this.physics.addPen(this.penP2);

      this.physics.addObstacle({
        type: 'box',
        x: desk.x + desk.width * 0.48,
        y: desk.y + desk.height * 0.2,
        width: 44,
        height: 80,
        color: '#ffcdd2',
        label: 'ERASER',
        restitution: 0.5
      });
    } else {
      const isAI = this.mode === 'vs_ai' || this.mode === 'tournament';
      const opponentOwner = isAI ? 'ai' : 'player2';

      this.penP1 = new Pen(this.p1Preset, this.p1Preset === 'custom' ? this.customPenConfig : {}, 'player1');
      this.penP1.pos.set(desk.x + desk.width * 0.25, midY);
      this.penP1.angle = 0;
      this.penP1.vel.set(0, 0);
      this.penP1.angVel = 0;
      this.penP1.isFalling = false;
      this.penP1.isDead = false;
      this.physics.addPen(this.penP1);

      let oppPreset = this.p2Preset;
      if (this.mode === 'tournament') {
        if (this.tournamentRound === 1) oppPreset = 'classic_ballpoint';
        else if (this.tournamentRound === 2) oppPreset = 'gel_pen';
        else oppPreset = 'metal_tank';
      }

      this.penP2 = new Pen(oppPreset, {}, opponentOwner);
      this.penP2.pos.set(desk.x + desk.width * 0.75, midY);
      this.penP2.angle = Math.PI;
      this.penP2.vel.set(0, 0);
      this.penP2.angVel = 0;
      this.penP2.isFalling = false;
      this.penP2.isDead = false;
      this.physics.addPen(this.penP2);

      if (this.mode === 'tournament' && this.tournamentRound === 2) {
        this.physics.addObstacle({
          type: 'box',
          x: desk.x + desk.width * 0.48,
          y: desk.y + desk.height * 0.35,
          width: 36,
          height: 65,
          color: '#e1bee7',
          label: 'RUBBER',
          restitution: 0.55
        });
      }
    }

    this.updateHUD();
  }

  getCurrentActivePen() {
    if (this.mode === 'sandbox') return this.penP1;
    if (this.currentTurn === 'player1') return this.penP1;
    if (this.currentTurn === 'player2') return this.penP2;
    if (this.currentTurn === 'ai') return this.penP2;
    return null;
  }

  executeShot(pen, strikePoint, impulse, powerPercent) {
    if (this.state !== 'AIMING') return;
    this.state = 'IN_MOTION';
    this.sound.playStrike(powerPercent);
    pen.applyImpulse(impulse, strikePoint);
    this.ui.addSparkParticles(strikePoint.x, strikePoint.y, 16, '#00e5ff');
  }

  handleAiTurn() {
    if (this.state !== 'AIMING' || this.currentTurn !== 'ai') return;
    const banner = document.getElementById('turnBanner');
    if (banner) {
      banner.innerHTML = '<span class="ai-pulse">?? Opponent Thinking...</span>';
    }
    setTimeout(() => {
      if (this.state !== 'AIMING' || this.currentTurn !== 'ai') return;
      const shot = this.ai.calculateShot(this.penP2, this.penP1, this.deskBounds);
      if (shot) {
        this.executeShot(this.penP2, shot.strikePoint, shot.impulse, shot.powerPercent);
      } else {
        this.switchTurn();
      }
    }, 850);
  }

  checkPhysicsMotionEnd() {
    if (this.state !== 'IN_MOTION') return;

    let roundEnded = false;
    let winner = null;

    if (this.penP1.isDead || (this.penP1.isFalling && this.penP1.fallProgress > 0.6)) {
      roundEnded = true;
      winner = (this.mode === 'vs_ai' || this.mode === 'tournament') ? 'Opponent AI' : 'Player 2';
    } else if (this.penP2.isDead || (this.penP2.isFalling && this.penP2.fallProgress > 0.6)) {
      roundEnded = true;
      winner = 'Player 1';
    }

    if (roundEnded) {
      this.handleRoundEnd(winner);
      return;
    }

    if (this.physics.isAllAtRest()) {
      this.switchTurn();
    }
  }

  switchTurn() {
    this.state = 'AIMING';
    if (this.mode === 'vs_ai' || this.mode === 'tournament') {
      this.currentTurn = this.currentTurn === 'player1' ? 'ai' : 'player1';
    } else if (this.mode === 'pvp_local') {
      this.currentTurn = this.currentTurn === 'player1' ? 'player2' : 'player1';
    } else {
      this.currentTurn = 'player1';
    }
    this.sound.playTurn();
    this.updateHUD();
    if (this.currentTurn === 'ai') {
      this.handleAiTurn();
    }
  }

  handleRoundEnd(winner) {
    this.state = 'ROUND_OVER';
    if (winner === 'Player 1') {
      this.scores.player1++;
      this.sound.playVictory();
    } else if (winner === 'Player 2') {
      this.scores.player2++;
      this.sound.playVictory();
    } else {
      this.scores.ai++;
    }
    this.updateHUD();

    const modal = document.getElementById('roundEndModal');
    const modalTitle = document.getElementById('roundModalTitle');
    const modalSubtitle = document.getElementById('roundModalSubtitle');
    const nextBtn = document.getElementById('nextRoundBtn');

    if (modal && modalTitle && modalSubtitle) {
      if (winner === 'Player 1') {
        modalTitle.textContent = '?? KNOCKOUT VICTORY!';
        modalTitle.className = 'modal-title text-win';
        modalSubtitle.textContent = 'Player 1 sent the opponent pen flying off the wooden desk!';
      } else {
        modalTitle.textContent = '?? KNOCKED OFF!';
        modalTitle.className = 'modal-title text-loss';
        modalSubtitle.textContent = winner + ' swept your pen off the desk!';
      }
      if (this.mode === 'tournament') {
        if (winner === 'Player 1' && this.tournamentRound < this.maxTournamentRounds) {
          nextBtn.textContent = 'Advance to Round ' + (this.tournamentRound + 1) + ' ?';
        } else if (winner === 'Player 1') {
          modalTitle.textContent = '?? DESK CHAMPION!';
          modalSubtitle.textContent = 'You conquered all 3 rounds of the Classroom Pen Fight Championship!';
          nextBtn.textContent = 'Play Again';
        } else {
          nextBtn.textContent = 'Retry Round';
        }
      } else {
        nextBtn.textContent = 'Next Round ?';
      }
      modal.classList.remove('hidden');
      modal.style.setProperty('display', 'flex', 'important');
    }
  }

  nextRound() {
    const modal = document.getElementById('roundEndModal');
    if (modal) modal.classList.add('hidden');

    if (this.mode === 'tournament') {
      const lastWinner = this.penP1.isDead ? 'ai' : 'player1';
      if (lastWinner === 'player1') {
        if (this.tournamentRound < this.maxTournamentRounds) {
          this.tournamentRound++;
        } else {
          this.tournamentRound = 1;
        }
      }
    }
    this.initMatch();
  }

  updateHUD() {
    const scoreP1 = document.getElementById('scoreP1');
    const scoreP2 = document.getElementById('scoreP2');
    const scoreLabelP2 = document.getElementById('scoreLabelP2');
    if (scoreP1) scoreP1.textContent = this.scores.player1;
    if (scoreP2) {
      scoreP2.textContent = (this.mode === 'vs_ai' || this.mode === 'tournament') ? this.scores.ai : this.scores.player2;
    }
    if (scoreLabelP2) {
      scoreLabelP2.textContent = (this.mode === 'vs_ai' || this.mode === 'tournament') ? 'AI BOT' : 'PLAYER 2';
    }
    const banner = document.getElementById('turnBanner');
    if (banner) {
      if (this.state === 'ROUND_OVER') {
        banner.innerHTML = '<span class="banner-highlight">ROUND ENDED</span>';
      } else if (this.currentTurn === 'player1') {
        banner.innerHTML = '<span class="p1-turn">?? Player 1's Turn � Drag & Release to Strike</span>';
      } else if (this.currentTurn === 'player2') {
        banner.innerHTML = '<span class="p2-turn">?? Player 2's Turn � Drag & Release to Strike</span>';
      } else if (this.currentTurn === 'ai') {
        banner.innerHTML = '<span class="ai-pulse">?? Opponent AI Aiming...</span>';
      }
    }
    const p1Card = document.getElementById('hudPenP1');
    const p2Card = document.getElementById('hudPenP2');
    if (p1Card && this.penP1) {
      const preset = PEN_PRESETS[this.penP1.presetId] || this.customPenConfig;
      p1Card.innerHTML = '<div class="hud-pen-name">' + preset.name + '</div><div class="hud-pen-spec">' + (preset.weightCategory || preset.mass + 'g') + ' � ' + (preset.comLabel || 'Custom CoM') + '</div>';
    }
    if (p2Card && this.penP2) {
      const preset = PEN_PRESETS[this.penP2.presetId] || this.customPenConfig;
      p2Card.innerHTML = '<div class="hud-pen-name">' + preset.name + '</div><div class="hud-pen-spec">' + (preset.weightCategory || preset.mass + 'g') + ' � ' + (preset.comLabel || 'Centered') + '</div>';
    }
  }

  bindDomControls() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.mode = btn.dataset.mode;
        this.scores = { player1: 0, player2: 0, ai: 0 };
        this.tournamentRound = 1;
        this.initMatch();
      });
    });

    document.querySelectorAll('.contact-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.contact-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const offset = parseFloat(btn.dataset.offset);
        this.ui.setStrikeOffsetT(offset);
        const contactSlider = document.getElementById('strikeContactSlider');
        if (contactSlider) contactSlider.value = offset;
      });
    });

    const contactSlider = document.getElementById('strikeContactSlider');
    if (contactSlider) {
      contactSlider.addEventListener('input', (e) => {
        this.ui.setStrikeOffsetT(parseFloat(e.target.value));
      });
    }

    const diffSelect = document.getElementById('aiDifficulty');
    if (diffSelect) {
      diffSelect.addEventListener('change', (e) => {
        this.ai.setDifficulty(e.target.value);
      });
    }

    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.initMatch();
      });
    }

    const nextRoundBtn = document.getElementById('nextRoundBtn');
    if (nextRoundBtn) {
      nextRoundBtn.addEventListener('click', () => {
        this.nextRound();
      });
    }

    const soundBtn = document.getElementById('soundBtn');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const isEnabled = this.sound.toggle();
        soundBtn.textContent = isEnabled ? '?? Sound: ON' : '?? Sound: OFF';
      });
    }

    const selectP1Btn = document.getElementById('selectPenP1Btn');
    const selectP2Btn = document.getElementById('selectPenP2Btn');
    const penModal = document.getElementById('penPickerModal');
    const closePickerBtn = document.getElementById('closePickerBtn');
    let currentPickerTarget = 'player1';

    if (selectP1Btn) {
      selectP1Btn.addEventListener('click', () => {
        currentPickerTarget = 'player1';
        this.openPenPicker(currentPickerTarget);
      });
    }
    if (selectP2Btn) {
      selectP2Btn.addEventListener('click', () => {
        currentPickerTarget = 'player2';
        this.openPenPicker(currentPickerTarget);
      });
    }
    if (closePickerBtn && penModal) {
      closePickerBtn.addEventListener('click', () => {
        penModal.style.setProperty('display', 'none', 'important');
        penModal.classList.add('hidden');
      });
    }

    const customizerBtn = document.getElementById('customizerBtn');
    const customizerModal = document.getElementById('customizerModal');
    const closeCustomizerBtn = document.getElementById('closeCustomizerBtn');
    const applyCustomizerBtn = document.getElementById('applyCustomizerBtn');

    if (customizerBtn && customizerModal) {
      customizerBtn.addEventListener('click', () => {
        customizerModal.classList.remove('hidden');
        customizerModal.style.setProperty('display', 'flex', 'important');
      });
    }
    if (closeCustomizerBtn && customizerModal) {
      closeCustomizerBtn.addEventListener('click', () => {
        customizerModal.style.setProperty('display', 'none', 'important');
        customizerModal.classList.add('hidden');
      });
    }
    if (applyCustomizerBtn && customizerModal) {
      applyCustomizerBtn.addEventListener('click', () => {
        this.saveCustomPen();
        customizerModal.classList.add('hidden');
      });
    }

    window.addEventListener('resize', () => {
      this.setupCanvasSize();
      this.updateDeskDimensions();
    });
  }

  openPenPicker(target) {
    const modal = document.getElementById('penPickerModal');
    const grid = document.getElementById('penCardsGrid');
    if (!modal || !grid) return;
    grid.innerHTML = '';
    const currentActivePreset = target === 'player1' ? this.p1Preset : this.p2Preset;
    Object.values(PEN_PRESETS).forEach(p => {
      const card = document.createElement('div');
      card.className = 'pen-card ' + (currentActivePreset === p.id ? 'selected' : '');
      card.innerHTML = '<div class="pen-card-header"><h4>' + p.name + '</h4><span class="pen-badge">' + p.weightCategory + '</span></div>' +
        '<div class="pen-card-tagline">' + p.tagline + '</div>' +
        '<div class="pen-card-preview" style="background: linear-gradient(90deg, ' + p.capColor + ' 25%, ' + p.bodyColor + ' 65%, ' + p.gripColor + ' 85%, #cfd8dc 100%);"></div>' +
        '<div class="pen-card-stats">' +
        '<div class="stat-row"><span>Weight:</span><strong>' + p.mass + 'g</strong></div>' +
        '<div class="stat-row"><span>Balance (CoM):</span><strong>' + p.comLabel + '</strong></div>' +
        '<div class="stat-row"><span>Rebound / Restitution:</span><strong>' + Math.round(p.restitution * 100) + '%</strong></div>' +
        '</div>' +
        '<p class="pen-card-desc">' + p.description + '</p>' +
        '<button class="select-this-pen-btn">' + (currentActivePreset === p.id ? 'Equipped' : 'Equip Pen') + '</button>';
      card.querySelector('.select-this-pen-btn').addEventListener('click', () => {
        if (target === 'player1') {
          this.p1Preset = p.id;
        } else {
          this.p2Preset = p.id;
        }
        modal.classList.add('hidden');
        this.initMatch();
      });
      grid.appendChild(card);
    });
    modal.classList.remove('hidden');
    modal.style.setProperty('display', 'flex', 'important');
  }

  saveCustomPen() {
    const mass = parseFloat(document.getElementById('customMass').value) || 25;
    const length = parseFloat(document.getElementById('customLength').value) || 130;
    const comOffset = parseFloat(document.getElementById('customCom').value) || 0.0;
    const concentration = document.getElementById('customConcentration').value || 'uniform';
    const bodyColor = document.getElementById('customBodyColor').value || '#ff6f00';
    const capColor = document.getElementById('customCapColor').value || '#e65100';
    this.customPenConfig = {
      name: 'Custom Tuned Pen',
      mass,
      length,
      radius: 10,
      comOffsetRatio: comOffset,
      massConcentration: concentration,
      restitution: 0.65,
      friction: 0.985,
      angularFriction: 0.978,
      bodyColor,
      capColor,
      gripColor: '#263238',
      clipColor: '#ffd700',
      weightCategory: 'Custom (' + mass + 'g)',
      comLabel: comOffset > 0.1 ? 'Front-Heavy' : comOffset < -0.1 ? 'Tail-Heavy' : 'Centered'
    };
    this.p1Preset = 'custom';
    this.initMatch();
  }

  loop(timestamp) {
    try {
      const dt = Math.min(0.033, (timestamp - this.lastTime) / 1000 || 0.016);
      this.lastTime = timestamp;
      this.physics.update(dt);
      this.checkPhysicsMotionEnd();
      this.ui.updateParticles(dt);
      this.ui.render(this.deskBounds, this.physics.pens, this.physics.obstacles);
    } catch(err) {
      console.error('Game loop error:', err);
    }
    requestAnimationFrame(this.loop);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.penFight = new PenFightGame();
});
