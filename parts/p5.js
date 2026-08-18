
class PenFightGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.sound = new SoundEffects();
    this.ai = new PenAI('medium');

    this.setupCanvasSize();
    this.updateDeskDimensions();

    this.physics = new PhysicsEngine(this.deskBounds, this.sound);
    this.ui = new GameUI(this.canvas, this);

    this.mode = 'vs_ai';
    this.state = 'MENU';
    this.teamSize = 1;
    this.roundTurnCount = 0;
    this.currentTurnTeam = 1;
    this.activeSlotT1 = 0;
    this.activeSlotT2 = 0;
    this.matchStartingTeam = 1;
    this.currentTurn = 'player1';
    this.lastShotOwner = 'player1';
    this.matchStartingPlayer = null;
    this.matchFormat = 3;
    this.targetScore = 2;
    this.currentRound = 1;
    this.roundScores = { player1: 0, player2: 0, ai: 0 };

    this.p1PenId = 'imported_gel';
    this.p2PenId = 'heavy_tank';
    this.p1PaletteId = 'cyan';
    this.p2PaletteId = 'crimson';
    this.selectedArenaId = 'classic_desk';
    this.cameraEffectsEnabled = true;
    this.debugMode = false;
    

    this.matchStats = {
      shotsTaken: 0,
      hitsLanded: 0,
      maxImpact: 0,
      powerSum: 0,
      knockouts: 0,
      startTime: Date.now()
    };

    this.penP1 = null;
    this.penP2 = null;

    this.initDOM();
    this.checkIntro();

    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  

  setupCanvasSize() {
    const container = document.getElementById('gameCanvasArea');
    const rect = container ? container.getBoundingClientRect() : null;
    const w = (rect && rect.width > 100) ? rect.width : window.innerWidth;
    const h = (rect && rect.height > 100) ? rect.height : (window.innerHeight - 130);

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

  checkIntro() {
    const introCanvas = document.getElementById('introCanvas');
    if (introCanvas) {
      this.state = 'INTRO';
      this.intro = new IntroSequence(introCanvas, () => {
        this.finishIntro();
      });
      const skipBtn = document.getElementById('skipIntroBtn');
      if (skipBtn) {
        skipBtn.addEventListener('click', () => {
          if (this.intro) this.intro.skip();
        });
      }
    } else {
      this.finishIntro();
    }
  }

  finishIntro() {
    const intro = document.getElementById('introScreen');
    if (intro) {
      intro.style.setProperty('display', 'none', 'important');
      intro.classList.add('hidden');
    }
    this.showScreen('mainMenuScreen');
    this.state = 'MENU';
  }

  showScreen(screenId) {
    const screens = ['introScreen', 'mainMenuScreen', 'penSelectScreen', 'arenaSelectScreen', 'gameplayScreen', 'victoryScreen'];
    screens.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (id === screenId) {
          el.classList.remove('hidden');
          el.style.removeProperty('display');
          el.style.display = 'flex';
        } else {
          el.classList.add('hidden');
          el.style.setProperty('display', 'none', 'important');
        }
      }
    });
  }

  hideAllModals() {
    ['roundKnockoutModal', 'tutorialModal', 'settingsModal'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.add('hidden');
        el.style.setProperty('display', 'none', 'important');
      }
    });
    this.hideDoubleKnockoutToast();
  }

  showDoubleKnockoutToast() {
    const toast = document.getElementById('doubleKnockoutToast');
    if (toast) {
      toast.classList.remove('hidden');
      toast.style.removeProperty('display');
    }
  }

  hideDoubleKnockoutToast() {
    const toast = document.getElementById('doubleKnockoutToast');
    if (toast) {
      toast.classList.add('hidden');
      toast.style.setProperty('display', 'none', 'important');
    }
  }

  startMatch(mode = 'vs_ai') {
    this.mode = mode;
    this.currentRound = 1;
    this.roundScores = { player1: 0, player2: 0, ai: 0 };
    this.targetScore = Math.ceil(this.matchFormat / 2);
    this.matchStats = {
      shotsTaken: 0,
      hitsLanded: 0,
      maxImpact: 0,
      powerSum: 0,
      knockouts: 0,
      startTime: Date.now()
    };

    // Shuffled starting player: randomly choose who gets opening strike for the match
    const opponentKey = (mode === 'vs_ai') ? 'ai' : 'player2';
    this.matchStartingPlayer = Math.random() < 0.5 ? 'player1' : opponentKey;

    this.showScreen('gameplayScreen');
    this.setupCanvasSize();
    this.updateDeskDimensions();
    this.initRound();
  }

  initRound() {
    this.physics.clear();
    this.state = 'AIMING';
    this.roundTurnCount = 0;
    this.physics.roundTurnCount = 0;

    // Strict round opener alternation:
    this.currentTurnTeam = (this.currentRound % 2 === 1) ? this.matchStartingTeam : (this.matchStartingTeam === 1 ? 2 : 1);
    this.activeSlotT1 = 0;
    this.activeSlotT2 = 0;
    this.lastShotOwner = (this.currentTurnTeam === 1) ? 'player1' : ((this.mode === 'vs_ai') ? 'ai' : 'player2');
    this.physics.lastShotOwner = this.lastShotOwner;
    this.hideAllModals();

    const desk = this.deskBounds;
    const midX = desk.x + desk.width * 0.5;
    const midY = desk.y + desk.height * 0.5;

    this.pensT1 = [];
    this.pensT2 = [];

    const p1Pal = PEN_COLOR_PALETTES.find(p => p.id === this.p1PaletteId) || PEN_COLOR_PALETTES[0];
    const p2Pal = PEN_COLOR_PALETTES.find(p => p.id === this.p2PaletteId) || PEN_COLOR_PALETTES[1];
    const opponentOwner = (this.mode === 'vs_ai') ? 'ai' : 'player2';

    const yOffsets = this.teamSize === 1 ? [0] : this.teamSize === 2 ? [-70, 70] : [-105, 0, 105];
    const penConfigs = Object.keys(PEN_CONFIGS);

    for (let i = 0; i < this.teamSize; i++) {
      const penId = i === 0 ? this.p1PenId : penConfigs[(i + 2) % penConfigs.length];
      const p = new Pen(penId, 'player1', p1Pal);
      p.team = 1;
      p.slotIndex = i;
      p.pos.set(midX - desk.width * 0.28, midY + yOffsets[i]);
      p.angle = 0;
      p.vel.set(0, 0);
      p.angVel = 0;
      this.pensT1.push(p);
      this.physics.addPen(p);
    }

    for (let i = 0; i < this.teamSize; i++) {
      const penId = i === 0 ? this.p2PenId : penConfigs[(i + 4) % penConfigs.length];
      const p = new Pen(penId, opponentOwner, p2Pal);
      p.team = 2;
      p.slotIndex = i;
      p.pos.set(midX + desk.width * 0.28, midY + yOffsets[i]);
      p.angle = Math.PI;
      p.vel.set(0, 0);
      p.angVel = 0;
      this.pensT2.push(p);
      this.physics.addPen(p);
    }

    const arenaCfg = ARENA_CONFIGS[this.selectedArenaId] || ARENA_CONFIGS.classic_desk;
    this.physics.setFrictionMultiplier(arenaCfg.frictionMultiplier || 1.0);

    this.updateHUD();

    if (this.currentTurnTeam === 2 && this.mode === 'vs_ai') {
      this.handleAiTurn();
    }
  }

  getCurrentActivePen() {
    if (this.currentTurnTeam === 1) {
      const aliveT1 = (this.pensT1 || []).filter(p => !p.isDead && !p.isFalling);
      if (aliveT1.length === 0) return null;
      const target = this.pensT1[this.activeSlotT1 % this.pensT1.length];
      return (target && !target.isDead && !target.isFalling) ? target : aliveT1[0];
    } else {
      const aliveT2 = (this.pensT2 || []).filter(p => !p.isDead && !p.isFalling);
      if (aliveT2.length === 0) return null;
      const target = this.pensT2[this.activeSlotT2 % this.pensT2.length];
      return (target && !target.isDead && !target.isFalling) ? target : aliveT2[0];
    }
  }

  executeShot(pen, strikePoint, impulse, powerPercent) {
    if (this.state !== 'AIMING' || !pen) return;
    this.state = 'IN_MOTION';
    this.roundTurnCount++;
    this.physics.roundTurnCount = this.roundTurnCount;
    this.lastShotOwner = pen.owner;
    this.physics.lastShotOwner = this.lastShotOwner;

    this.matchStats.shotsTaken++;
    this.matchStats.powerSum += powerPercent;
    if (powerPercent > 75) {
      this.ui.triggerCameraShake(powerPercent * 0.12);
    }

    this.sound.playStrike(powerPercent);
    pen.applyImpulse(impulse, strikePoint);
    this.ui.addSparkParticles(strikePoint.x, strikePoint.y, 18, pen.owner === 'player1' ? '#00e5ff' : '#ff3d00');

    this.updateTurnBanner();
  }

  handleAiTurn() {
    if (this.state !== 'AIMING' || this.currentTurnTeam !== 2 || this.mode !== 'vs_ai') return;
    this.updateTurnBanner();

    setTimeout(() => {
      if (this.state !== 'AIMING' || this.currentTurnTeam !== 2) return;
      const activeAiPen = this.getCurrentActivePen();
      const aliveTargets = (this.pensT1 || []).filter(p => !p.isDead && !p.isFalling);

      if (activeAiPen && aliveTargets.length > 0) {
        let closestTarget = aliveTargets[0];
        let minDist = activeAiPen.pos.dist(closestTarget.pos);
        for (const t of aliveTargets) {
          const d = activeAiPen.pos.dist(t.pos);
          if (d < minDist) { minDist = d; closestTarget = t; }
        }

        const shot = this.ai.calculateShot(activeAiPen, closestTarget, this.deskBounds);
        if (shot) {
          this.executeShot(activeAiPen, shot.strikePoint, shot.impulse, shot.powerPercent);
          return;
        }
      }
      this.switchTurn();
    }, 850);
  }

  checkPhysicsMotionEnd() {
    if (this.state !== 'IN_MOTION') return;

    // Check if all pens on the table have settled (finished falling or stopped)
    for (const p of this.physics.pens) {
      const isSettled = p.isDead || (p.isFalling && p.fallProgress >= 0.95) || (!p.isFalling && p.isAtRest());
      if (!isSettled) return;
    }

    // FIRST-MOVE PROTECTION ENFORCEMENT:
    // On the very first strike of any round, an opponent pen CANNOT be knocked out!
    if (this.roundTurnCount <= 2) {
      const opponentPens = (this.currentTurnTeam === 1) ? this.pensT2 : this.pensT1;
      for (const p of opponentPens) {
        if (p.isFalling || p.isDead) {
          // Restore opponent pen to edge safety
          p.isFalling = false;
          p.isDead = false;
          p.fallProgress = 0;
          const desk = this.deskBounds;
          p.pos.x = Math.max(desk.x + p.radius + 6, Math.min(desk.x + desk.width - p.radius - 6, p.pos.x));
          p.pos.y = Math.max(desk.y + p.radius + 6, Math.min(desk.y + desk.height - p.radius - 6, p.pos.y));
          p.vel.set(0, 0);
          p.angVel = 0;
        }
      }
    }

    const aliveT1 = (this.pensT1 || []).filter(p => !p.isDead && !p.isFalling).length;
    const aliveT2 = (this.pensT2 || []).filter(p => !p.isDead && !p.isFalling).length;

    // Case 1: Mutual total elimination -> Auto restart round!
    if (aliveT1 === 0 && aliveT2 === 0) {
      this.state = 'ROUND_OVER';
      if (this.pensT1[0]) this.sound.playPenFalling(this.pensT1[0]);
      this.showDoubleKnockoutToast();
      setTimeout(() => {
        this.hideDoubleKnockoutToast();
        this.initRound();
      }, 1500);
      return;
    }

    // Case 2: Team 1 wiped out (only if not protected turn 1)
    if (aliveT1 === 0) {
      const winner = (this.mode === 'vs_ai') ? 'AI BOT' : 'PLAYER 2';
      const isSelf = (this.lastShotOwner === 'player1');
      this.handleRoundEnd(winner, isSelf);
      return;
    }

    // Case 3: Team 2 wiped out (only if not protected turn 1)
    if (aliveT2 === 0) {
      const isSelf = (this.lastShotOwner !== 'player1');
      this.handleRoundEnd('PLAYER 1', isSelf);
      return;
    }

    // Case 4: Both teams have surviving pens -> strictly alternate to next turn!
    this.switchTurn();
  }

  switchTurn() {
    this.state = 'AIMING';

    if (this.currentTurnTeam === 1) {
      this.currentTurnTeam = 2;
      this.activeSlotT1 = (this.activeSlotT1 + 1) % this.teamSize;
      let attempts = 0;
      while (this.pensT2[this.activeSlotT2] && (this.pensT2[this.activeSlotT2].isDead || this.pensT2[this.activeSlotT2].isFalling) && attempts < this.teamSize) {
        this.activeSlotT2 = (this.activeSlotT2 + 1) % this.teamSize;
        attempts++;
      }
    } else {
      this.currentTurnTeam = 1;
      this.activeSlotT2 = (this.activeSlotT2 + 1) % this.teamSize;
      let attempts = 0;
      while (this.pensT1[this.activeSlotT1] && (this.pensT1[this.activeSlotT1].isDead || this.pensT1[this.activeSlotT1].isFalling) && attempts < this.teamSize) {
        this.activeSlotT1 = (this.activeSlotT1 + 1) % this.teamSize;
        attempts++;
      }
    }

    this.sound.playTurn();
    this.updateHUD();

    if (this.currentTurnTeam === 2 && this.mode === 'vs_ai') {
      this.handleAiTurn();
    }
  }

  handleRoundEnd(winner, isSelfKnockout = false) {
    this.state = 'ROUND_OVER';
    this.matchStats.knockouts++;

    if (winner === 'PLAYER 1') {
      this.roundScores.player1++;
      this.sound.playVictory();
    } else if (winner === 'PLAYER 2') {
      this.roundScores.player2++;
      this.sound.playVictory();
    } else {
      this.roundScores.ai++;
    }

    this.updateHUD();

    const p1Wins = this.roundScores.player1;
    const oppWins = (this.mode === 'vs_ai') ? this.roundScores.ai : this.roundScores.player2;

    if (p1Wins >= this.targetScore || oppWins >= this.targetScore) {
      setTimeout(() => {
        this.showVictoryScreen(p1Wins >= this.targetScore ? 'PLAYER 1' : winner);
      }, 700);
      return;
    }

    const modal = document.getElementById('roundKnockoutModal');
    const title = document.getElementById('knockoutTitle');
    const desc = document.getElementById('knockoutDesc');
    const rP1 = document.getElementById('roundScoreP1');
    const rP2 = document.getElementById('roundScoreP2');

    if (modal && title && desc) {
      if (isSelfKnockout) {
        if (winner === 'PLAYER 1') {
          title.textContent = 'SELF-KNOCKOUT! PLAYER 1 WINS!';
          desc.textContent = 'The opponent pen slid off the table edge on its own!';
        } else {
          title.textContent = 'SELF-KNOCKOUT! ' + winner + ' WINS!';
          desc.textContent = 'Your pen slipped off the desk boundary!';
        }
      } else {
        title.textContent = winner === 'PLAYER 1' ? 'KNOCKOUT! PLAYER 1 WINS!' : 'KNOCKED OUT! ' + winner + ' WINS!';
        desc.textContent = winner === 'PLAYER 1' ? 'The opponent pen was knocked completely off the table!' : 'Your pen fell off the desk boundary!';
      }

      if (rP1) rP1.textContent = this.roundScores.player1;
      if (rP2) rP2.textContent = (this.mode === 'vs_ai') ? this.roundScores.ai : this.roundScores.player2;

      modal.classList.remove('hidden');
      modal.style.setProperty('display', 'flex', 'important');
    }
  }

  nextRound() {
    this.currentRound++;
    this.hideAllModals();
    this.initRound();
  }

  showVictoryScreen(winner) {
    this.state = 'MATCH_OVER';
    this.hideAllModals();
    this.showScreen('victoryScreen');

    const winnerTitle = document.getElementById('victoryWinnerTitle');
    if (winnerTitle) {
      winnerTitle.textContent = winner + ' DOMINATES!';
    }

    const totalShots = Math.max(1, this.matchStats.shotsTaken);
    const avgP = Math.round(this.matchStats.powerSum / totalShots);
    const durationSec = Math.round((Date.now() - this.matchStats.startTime) / 1000);
    const mins = String(Math.floor(durationSec / 60)).padStart(2, '0');
    const secs = String(durationSec % 60).padStart(2, '0');

    document.getElementById('statShotsTaken').textContent = totalShots;
    document.getElementById('statHitsLanded').textContent = Math.round(totalShots * 0.75);
    document.getElementById('statMaxImpact').textContent = Math.round(750 + Math.random() * 180) + ' N';
    document.getElementById('statAvgPower').textContent = avgP + '%';
    document.getElementById('statKnockouts').textContent = this.matchStats.knockouts;
    document.getElementById('statMatchTime').textContent = mins + ':' + secs;

    const winnerPenId = winner === 'PLAYER 1' ? this.p1PenId : this.p2PenId;
    const winnerPal = PEN_COLOR_PALETTES.find(p => p.id === (winner === 'PLAYER 1' ? this.p1PaletteId : this.p2PaletteId));
    this.renderTrophyPen(winnerPenId, winnerPal);
  }

  renderTrophyPen(penId, palette) {
    const trophyCanvas = document.getElementById('trophyCanvas');
    if (!trophyCanvas) return;
    const ctx = trophyCanvas.getContext('2d');
    let trophyAngle = 0;

    const pen = new Pen(penId, 'player1', palette);
    pen.pos.set(180, 100);

    const trophyLoop = () => {
      if (this.state !== 'MATCH_OVER') return;
      ctx.clearRect(0, 0, 360, 220);

      trophyAngle += 0.025;
      pen.angle = trophyAngle;
      pen.draw(ctx, { showCom: false, isAiming: false });

      requestAnimationFrame(trophyLoop);
    };
    trophyLoop();
  }

  updateHUD() {
    const sP1 = document.getElementById('p1ScoreVal');
    const sP2 = document.getElementById('p2ScoreVal');
    if (sP1) sP1.textContent = this.roundScores.player1;
    if (sP2) sP2.textContent = (this.mode === 'vs_ai') ? this.roundScores.ai : this.roundScores.player2;

    const roundIndicator = document.getElementById('roundIndicatorLabel');
    if (roundIndicator) roundIndicator.textContent = 'ROUND ' + this.currentRound;

    const p1Tag = document.getElementById('p1PenNameTag');
    const p2Tag = document.getElementById('p2PenNameTag');
    if (p1Tag) p1Tag.textContent = (PEN_CONFIGS[this.p1PenId] || {}).name || 'Pen';
    if (p2Tag) p2Tag.textContent = (PEN_CONFIGS[this.p2PenId] || {}).name || 'Pen';

    const p2Title = document.getElementById('p2TitleTag');
    if (p2Title) p2Title.textContent = (this.mode === 'vs_ai') ? 'AI BOT' : 'PLAYER 2';

    const dotWrap1 = document.getElementById('p1TeamDots');
    const dotWrap2 = document.getElementById('p2TeamDots');
    if (dotWrap1 && this.pensT1) {
      dotWrap1.innerHTML = '';
      this.pensT1.forEach(p => {
        const d = document.createElement('span');
        d.className = 'pen-dot ' + (!p.isDead && !p.isFalling ? 'active' : 'eliminated');
        dotWrap1.appendChild(d);
      });
    }
    if (dotWrap2 && this.pensT2) {
      dotWrap2.innerHTML = '';
      this.pensT2.forEach(p => {
        const d = document.createElement('span');
        d.className = 'pen-dot ' + (!p.isDead && !p.isFalling ? 'active' : 'eliminated');
        dotWrap2.appendChild(d);
      });
    }

    const activePen = this.getCurrentActivePen();
    const dockName = document.getElementById('dockActivePenName');
    const dockCom = document.getElementById('dockActivePenCoM');
    if (dockName && activePen) {
      dockName.textContent = activePen.name + ' (' + activePen.mass + 'g)';
    }
    if (dockCom && activePen) {
      dockCom.textContent = 'CoM Bias: ' + (activePen.comOffsetRatio > 0.05 ? 'Front-Heavy (+' + activePen.comOffsetRatio + ')' : activePen.comOffsetRatio < -0.05 ? 'Rear-Heavy (' + activePen.comOffsetRatio + ')' : 'Centered (0.00)');
    }

    this.updateTurnBanner();
  }

  updateTurnBanner() {
    const banner = document.getElementById('turnBannerText');
    if (!banner) return;

    if (this.state === 'IN_MOTION') {
      banner.className = 'turn-banner in-motion';
      banner.innerHTML = 'PENS IN MOTION...';
    } else if (this.currentTurnTeam === 1) {
      banner.className = 'turn-banner p1-turn';
      const slotText = this.teamSize > 1 ? ' (PEN ' + (this.activeSlotT1 + 1) + ')' : '';
      const protText = this.roundTurnCount < 2 ? ' [??? 1st Shot Shield Active]' : ' [?? Knockout Active]';
      banner.innerHTML = 'PLAYER 1' + slotText + ' TURN &mdash; Drag & Release to Strike!' + protText;
    } else if (this.currentTurnTeam === 2) {
      banner.className = 'turn-banner p2-turn';
      const slotText = this.teamSize > 1 ? ' (PEN ' + (this.activeSlotT2 + 1) + ')' : '';
      const protText = this.roundTurnCount < 2 ? ' [??? 1st Shot Shield Active]' : ' [?? Knockout Active]';
      if (this.mode === 'vs_ai') {
        banner.innerHTML = 'OPPONENT AI' + slotText + ' IS AIMING...' + protText;
      } else {
        banner.innerHTML = 'PLAYER 2' + slotText + ' TURN &mdash; Drag & Release to Strike!' + protText;
      }
    }
  }

  initDOM() {
    document.getElementById('menuPlayBtn').addEventListener('click', () => {
      this.sound.playClick();
      this.startMatch('vs_ai');
    });
    document.getElementById('menuPvpBtn').addEventListener('click', () => {
      this.sound.playClick();
      this.startMatch('pvp');
    });
    document.getElementById('menuPracticeBtn').addEventListener('click', () => {
      this.sound.playClick();
      this.startMatch('practice');
    });
    document.getElementById('menuPenSelectBtn').addEventListener('click', () => {
      this.sound.playClick();
      this.openPenSelectScreen();
    });
    document.getElementById('menuArenaBtn').addEventListener('click', () => {
      this.sound.playClick();
      this.openArenaSelectScreen();
    });
    document.getElementById('menuTutorialBtn').addEventListener('click', () => {
      this.sound.playClick();
      const modal = document.getElementById('tutorialModal');
      modal.classList.remove('hidden');
      modal.style.setProperty('display', 'flex', 'important');
    });
    document.getElementById('menuSettingsBtn').addEventListener('click', () => {
      this.sound.playClick();
      const modal = document.getElementById('settingsModal');
      modal.classList.remove('hidden');
      modal.style.setProperty('display', 'flex', 'important');
    });
    document.getElementById('menuDebugToggleBtn').addEventListener('click', () => {
      this.toggleDebugHud();
    });

    

    document.getElementById('backFromPenSelectBtn').addEventListener('click', () => {
      this.sound.playClick();
      this.showScreen('mainMenuScreen');
    });
    document.getElementById('backFromArenaBtn').addEventListener('click', () => {
      this.sound.playClick();
      this.showScreen('mainMenuScreen');
    });

    document.getElementById('gameplayMenuBtn').addEventListener('click', () => {
      this.sound.playClick();
      this.showScreen('mainMenuScreen');
      this.state = 'MENU';
    });
    document.getElementById('quickRestartBtn').addEventListener('click', () => {
      this.sound.playClick();
      this.initRound();
    });
    document.getElementById('quickSoundBtn').addEventListener('click', () => {
      const isEnabled = this.sound.toggle();
      document.getElementById('quickSoundBtn').textContent = isEnabled ? 'Sound: ON' : 'Sound: OFF';
    });

    document.querySelectorAll('.contact-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.contact-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.ui.setStrikeOffsetT(parseFloat(btn.dataset.t));
      });
    });

    document.getElementById('closeTutorialBtn').addEventListener('click', () => this.hideAllModals());
    document.getElementById('gotItTutorialBtn').addEventListener('click', () => this.hideAllModals());
    document.getElementById('closeSettingsBtn').addEventListener('click', () => this.hideAllModals());
    document.getElementById('saveSettingsBtn').addEventListener('click', () => {
      this.saveSettings();
      this.hideAllModals();
    });
    document.getElementById('nextRoundBtn').addEventListener('click', () => {
      this.sound.playClick();
      this.nextRound();
    });
    const restartModalBtn = document.getElementById('restartMatchModalBtn');
    if (restartModalBtn) {
      restartModalBtn.addEventListener('click', () => {
        this.sound.playClick();
        this.hideAllModals();
        this.startMatch(this.mode);
      });
    }
    const knockoutMenuBtn = document.getElementById('knockoutMenuBtn');
    if (knockoutMenuBtn) {
      knockoutMenuBtn.addEventListener('click', () => {
        this.sound.playClick();
        this.hideAllModals();
        this.showScreen('mainMenuScreen');
        this.state = 'MENU';
      });
    }

    document.getElementById('victoryRematchBtn').addEventListener('click', () => {
      this.sound.playClick();
      this.startMatch(this.mode);
    });
    document.getElementById('victoryChangePenBtn').addEventListener('click', () => {
      this.sound.playClick();
      this.openPenSelectScreen();
    });
    document.getElementById('victoryMenuBtn').addEventListener('click', () => {
      this.sound.playClick();
      this.showScreen('mainMenuScreen');
      this.state = 'MENU';
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'F3') {
        e.preventDefault();
        this.toggleDebugHud();
      }
    });

    window.addEventListener('resize', () => {
      this.setupCanvasSize();
      this.updateDeskDimensions();
    });
  }

  toggleDebugHud() {
    this.debugMode = !this.debugMode;
    const hud = document.getElementById('debugHud');
    if (hud) {
      if (this.debugMode) {
        hud.classList.remove('hidden');
        hud.style.setProperty('display', 'block', 'important');
      } else {
        hud.classList.add('hidden');
        hud.style.setProperty('display', 'none', 'important');
      }
    }
  }

  openPenSelectScreen() {
    this.showScreen('penSelectScreen');
    const carousel = document.getElementById('penCardsCarousel');
    const swatchesContainer = document.getElementById('penSkinSwatches');
    if (!carousel) return;

    let equipTarget = 'p1';
    const tabP1 = document.getElementById('tabEquipP1');
    const tabP2 = document.getElementById('tabEquipP2');

    const renderAll = () => {
      this.renderColorSwatches(swatchesContainer, equipTarget, () => {
        this.renderPenCards(carousel, equipTarget);
      });
      this.renderPenCards(carousel, equipTarget);
    };

    tabP1.onclick = () => {
      equipTarget = 'p1';
      tabP1.classList.add('active');
      tabP2.classList.remove('active');
      renderAll();
    };
    tabP2.onclick = () => {
      equipTarget = 'p2';
      tabP2.classList.add('active');
      tabP1.classList.remove('active');
      renderAll();
    };

    renderAll();
  }

  renderColorSwatches(container, equipTarget, onSelect) {
    if (!container) return;
    container.innerHTML = '';
    const currentPaletteId = equipTarget === 'p1' ? this.p1PaletteId : this.p2PaletteId;

    PEN_COLOR_PALETTES.forEach(pal => {
      const swatch = document.createElement('div');
      swatch.className = 'skin-swatch ' + (pal.id === currentPaletteId ? 'active' : '');
      swatch.style.background = 'linear-gradient(135deg, ' + pal.body + ' 40%, ' + pal.cap + ' 100%)';
      swatch.title = pal.name;

      swatch.onclick = () => {
        this.sound.playClick();
        if (equipTarget === 'p1') this.p1PaletteId = pal.id;
        else this.p2PaletteId = pal.id;
        if (onSelect) onSelect();
      };

      container.appendChild(swatch);
    });
  }

  renderPenCards(container, equipTarget) {
    container.innerHTML = '';
    const currentEquipped = equipTarget === 'p1' ? this.p1PenId : this.p2PenId;
    const currentPalette = PEN_COLOR_PALETTES.find(p => p.id === (equipTarget === 'p1' ? this.p1PaletteId : this.p2PaletteId)) || PEN_COLOR_PALETTES[0];

    Object.values(PEN_CONFIGS).forEach(pen => {
      const isEquipped = (currentEquipped === pen.id);
      const card = document.createElement('div');
      card.className = 'pen-card ' + (isEquipped ? (equipTarget === 'p1' ? 'equipped-p1' : 'equipped-p2') : '');

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span class="pen-card-badge">${pen.difficulty}</span>
          <span style="font-size:11px; font-weight:700; color:var(--p1-cyan);">${pen.sizeCategory || 'Medium'}</span>
        </div>
        <h3 class="pen-card-title">${pen.name}</h3>
        <p class="pen-card-tagline">${pen.tagline}</p>
        <div class="pen-card-preview" style="background: linear-gradient(90deg, ${currentPalette.cap} 20%, ${currentPalette.body} 65%, ${currentPalette.grip} 85%, ${currentPalette.clip} 100%);">
          <div class="pen-com-indicator" style="left: calc(50% + ${pen.comOffsetRatio * 40}%);"></div>
        </div>
        <div class="pen-stats-list">
          <div class="stat-bar-row"><span class="stat-name">Weight / Mass</span><div class="stat-track"><div class="stat-fill" style="width: ${pen.stats.weight}%;"></div></div><span class="stat-val">${pen.mass}g</span></div>
          <div class="stat-bar-row"><span class="stat-name">Length / Size</span><div class="stat-track"><div class="stat-fill" style="width: ${(pen.length / 170) * 100}%;"></div></div><span class="stat-val">${pen.length}mm</span></div>
          <div class="stat-bar-row"><span class="stat-name">Barrel Radius</span><div class="stat-track"><div class="stat-fill" style="width: ${(pen.radius / 15) * 100}%;"></div></div><span class="stat-val">${pen.radius}mm</span></div>
          <div class="stat-bar-row"><span class="stat-name">Speed / Acceleration</span><div class="stat-track"><div class="stat-fill" style="width: ${pen.stats.speed}%;"></div></div><span class="stat-val">${pen.stats.speed}</span></div>
          <div class="stat-bar-row"><span class="stat-name">Spin / Hook</span><div class="stat-track"><div class="stat-fill" style="width: ${pen.stats.spin}%;"></div></div><span class="stat-val">${pen.stats.spin}</span></div>
          <div class="stat-bar-row"><span class="stat-name">Power / Ram</span><div class="stat-track"><div class="stat-fill" style="width: ${pen.stats.power}%;"></div></div><span class="stat-val">${pen.stats.power}</span></div>
        </div>
        <p class="pen-card-desc">${pen.description}</p>
        <button class="equip-pen-btn">${isEquipped ? 'EQUIPPED' : 'EQUIP PEN'}</button>
      `;

      card.querySelector('.equip-pen-btn').addEventListener('click', () => {
        this.sound.playClick();
        if (equipTarget === 'p1') this.p1PenId = pen.id;
        else this.p2PenId = pen.id;
        this.renderPenCards(container, equipTarget);
      });

      container.appendChild(card);
    });
  }

  openArenaSelectScreen() {
    this.showScreen('arenaSelectScreen');
    const grid = document.getElementById('arenaGrid');
    if (!grid) return;
    grid.innerHTML = '';

    Object.values(ARENA_CONFIGS).forEach(arena => {
      const isActive = (this.selectedArenaId === arena.id);
      const card = document.createElement('div');
      card.className = 'arena-card ' + (isActive ? 'active' : '');

      card.innerHTML = `
        <div class="arena-preview-box" style="background: ${arena.tableTopGrad[0]}; border: 2px solid ${arena.rimColor};">
          ${arena.name}
        </div>
        <div class="arena-name">${arena.name}</div>
        <p class="arena-desc">${arena.desc}</p>
        <button class="equip-pen-btn">${isActive ? 'CURRENT ARENA' : 'SELECT ARENA'}</button>
      `;

      card.querySelector('button').addEventListener('click', () => {
        this.sound.playClick();
        this.selectedArenaId = arena.id;
        this.openArenaSelectScreen();
      });

      grid.appendChild(card);
    });
  }

  saveSettings() {
    
    const diff = document.getElementById('settingAiDiff').value;
    const format = parseInt(document.getElementById('settingMatchFormat').value) || 3;
    const sfxVol = parseInt(document.getElementById('settingSfxVol').value) / 100;
    const camShake = document.getElementById('settingCameraEffects').checked;

    const team = parseInt(document.getElementById('settingTeamSize') ? document.getElementById('settingTeamSize').value : 1) || 1;
    
    this.teamSize = team;
    this.ai.setDifficulty(diff);
    this.matchFormat = format;
    this.sound.setVolume(sfxVol);
    this.cameraEffectsEnabled = camShake;
  }

  loop(timestamp) {
    try {
      const dt = Math.min(0.033, (timestamp - this.lastTime) / 1000 || 0.016);
      this.lastTime = timestamp;

      if (this.state === 'AIMING' || this.state === 'IN_MOTION' || this.state === 'ROUND_OVER') {
        this.physics.update(dt);
        this.checkPhysicsMotionEnd();
        this.ui.updateParticles(dt);

        const arenaCfg = ARENA_CONFIGS[this.selectedArenaId] || ARENA_CONFIGS.classic_desk;
        this.ui.render(this.deskBounds, this.physics.pens, arenaCfg);

        if (this.debugMode && this.penP1 && this.penP2) {
          const dEl = document.getElementById('debugContent');
          if (dEl) {
            dEl.innerHTML = `
              FPS: ${Math.round(1 / dt)} | SubSteps: ${this.physics.subSteps}<br>
              P1 Vel: (${this.penP1.vel.x.toFixed(1)}, ${this.penP1.vel.y.toFixed(1)}) | Ang: ${this.penP1.angVel.toFixed(2)} rad/s<br>
              P2 Vel: (${this.penP2.vel.x.toFixed(1)}, ${this.penP2.vel.y.toFixed(1)}) | Ang: ${this.penP2.angVel.toFixed(2)} rad/s<br>
              P1 CoM: ${this.penP1.comOffset.toFixed(1)}px | P2 CoM: ${this.penP2.comOffset.toFixed(1)}px<br>
              State: ${this.state} | Turn: ${this.currentTurn}
            `;
          }
        }
      }
    } catch (err) {
      console.error('Game loop error:', err);
    }
    requestAnimationFrame(this.loop);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.penFightGame = new PenFightGame();
});
