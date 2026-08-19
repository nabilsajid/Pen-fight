class PenFightGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.sound = new SoundEffects();
    this.ai = new PenAI('medium');

    this.setupCanvasSize();
    this.updateDeskDimensions();

    this.physics = new PhysicsEngine(this.deskBounds, this.sound);
    this.ui = new GameUI(this.canvas, this);
    this.network = new NetworkManager(this);

    this.mode = 'vs_ai'; // 'vs_ai', 'pvp', 'practice', 'online_host', 'online_guest'
    this.state = 'MENU';
    this.teamSize = 1;
    this.roundTurnCount = 0;
    this.currentTurnTeam = 1;
    this.activeSlotT1 = 0;
    this.activeSlotT2 = 0;
    this.matchStartingTeam = 1;
    this.lastShotOwner = 'player1';

    // Player Names
    this.p1Name = localStorage.getItem('penfight_p1_name') || 'Player 1';
    this.p2Name = localStorage.getItem('penfight_p2_name') || 'Player 2';

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

    this.pensT1 = [];
    this.pensT2 = [];

    this.initDOM();
    this.checkIntro();

    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  isLocalPlayerTurn() {
    if (this.mode === 'online_host') {
      return this.currentTurnTeam === 1;
    }
    if (this.mode === 'online_guest') {
      return this.currentTurnTeam === 2;
    }
    if (this.mode === 'vs_ai') {
      return this.currentTurnTeam === 1;
    }
    return true; // pvp local / practice
  }

  isOnlineMultiplayer() {
    return this.mode === 'online_host' || this.mode === 'online_guest';
  }

  setupCanvasSize() {
    const container = document.getElementById('gameCanvasArea');
    const rect = container ? container.getBoundingClientRect() : null;
    const w = (rect && rect.width > 50) ? rect.width : window.innerWidth;
    const h = (rect && rect.height > 50) ? rect.height : (window.innerHeight - 120);

    if (this.canvas) {
      this.canvas.width = Math.max(360, Math.floor(w));
      this.canvas.height = Math.max(360, Math.floor(h));
    }
  }

  updateDeskDimensions() {
    if (!this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;

    let deskW, deskH;
    if (w < 600) {
      // Mobile Phone
      if (h > w) {
        deskW = Math.min(w * 0.92, 540);
        deskH = Math.min(h * 0.72, 460);
      } else {
        deskW = Math.min(w * 0.86, 780);
        deskH = Math.min(h * 0.78, 440);
      }
    } else if (w <= 1024) {
      // Tablet / iPad
      deskW = Math.min(w * 0.88, 860);
      deskH = Math.min(h * 0.78, 520);
    } else {
      // Desktop / Laptop
      deskW = Math.min(940, Math.max(560, w * 0.84));
      deskH = Math.min(560, Math.max(380, h * 0.80));
    }

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
    ['roundKnockoutModal', 'tutorialModal', 'settingsModal', 'multiplayerModal'].forEach(id => {
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

    this.matchStartingTeam = Math.random() < 0.5 ? 1 : 2;

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

    if (!this.matchStartingTeam) this.matchStartingTeam = 1;
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

  executeShot(pen, strikePoint, impulse, powerPercent, isRemote = false) {
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

    // Broadcast shot packet to opponent if local
    if (!isRemote && this.isOnlineMultiplayer()) {
      const desk = this.deskBounds;
      this.network.send({
        type: 'SHOT_FIRED',
        team: pen.team,
        slotIndex: pen.slotIndex || 0,
        aimAngle: impulse.heading(),
        powerPercent: powerPercent,
        strikeOffsetT: this.ui.strikeOffsetT,
        relPos: {
          x: (pen.pos.x - desk.x) / desk.width,
          y: (pen.pos.y - desk.y) / desk.height
        },
        penAngle: pen.angle
      });
    }

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

    // Only host decides turn settlement in online multiplayer
    if (this.mode === 'online_guest') return;

    for (const p of this.physics.pens) {
      const isSettled = p.isDead || (p.isFalling && p.fallProgress >= 0.95) || (!p.isFalling && p.isAtRest());
      if (!isSettled) return;
    }

    // Individual 2-shot shield protection
    if (this.roundTurnCount <= 2) {
      const opponentPens = (this.currentTurnTeam === 1) ? this.pensT2 : this.pensT1;
      for (const p of opponentPens) {
        if (p.isFalling || p.isDead) {
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

    if (aliveT1 === 0 && aliveT2 === 0) {
      this.state = 'ROUND_OVER';
      if (this.pensT1[0]) this.sound.playPenFalling(this.pensT1[0]);
      this.showDoubleKnockoutToast();
      if (this.mode === 'online_host') {
        this.network.send({ type: 'DOUBLE_KNOCKOUT' });
      }
      setTimeout(() => {
        this.hideDoubleKnockoutToast();
        this.initRound();
      }, 1500);
      return;
    }

    if (aliveT1 === 0) {
      const winnerName = (this.mode === 'vs_ai') ? 'AI BOT' : this.p2Name;
      const isSelf = (this.lastShotOwner === 'player1');
      if (this.mode === 'online_host') {
        this.network.send({ type: 'ROUND_OVER', winnerName: this.p2Name, winningTeam: 2, isSelf: isSelf });
      }
      this.handleRoundEnd(winnerName, 2, isSelf);
      return;
    }

    if (aliveT2 === 0) {
      const winnerName = this.p1Name;
      const isSelf = (this.lastShotOwner !== 'player1');
      if (this.mode === 'online_host') {
        this.network.send({ type: 'ROUND_OVER', winnerName: this.p1Name, winningTeam: 1, isSelf: isSelf });
      }
      this.handleRoundEnd(winnerName, 1, isSelf);
      return;
    }

    // Switch turn
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

    // If host in online multiplayer, broadcast new turn state & authoritative pen positions
    if (this.mode === 'online_host') {
      const desk = this.deskBounds;
      const penSync = [];
      this.pensT1.forEach((p, idx) => penSync.push({
        team: 1,
        slotIndex: idx,
        relX: (p.pos.x - desk.x) / desk.width,
        relY: (p.pos.y - desk.y) / desk.height,
        angle: p.angle,
        isDead: p.isDead,
        isFalling: p.isFalling
      }));
      this.pensT2.forEach((p, idx) => penSync.push({
        team: 2,
        slotIndex: idx,
        relX: (p.pos.x - desk.x) / desk.width,
        relY: (p.pos.y - desk.y) / desk.height,
        angle: p.angle,
        isDead: p.isDead,
        isFalling: p.isFalling
      }));
      this.network.send({
        type: 'TURN_SWITCH',
        currentTurnTeam: this.currentTurnTeam,
        activeSlotT1: this.activeSlotT1,
        activeSlotT2: this.activeSlotT2,
        roundTurnCount: this.roundTurnCount,
        roundScores: this.roundScores,
        pens: penSync
      });
    }

    if (this.currentTurnTeam === 2 && this.mode === 'vs_ai') {
      this.handleAiTurn();
    }
  }

  handleRoundEnd(winnerName, winningTeam, isSelfKnockout = false) {
    this.state = 'ROUND_OVER';
    this.matchStats.knockouts++;

    if (winningTeam === 1) {
      this.roundScores.player1++;
    } else {
      if (this.mode === 'vs_ai') this.roundScores.ai++;
      else this.roundScores.player2++;
    }

    // Audio: Play Victory if local player won, Defeat if local player lost
    const isLocalWinner = (this.mode === 'online_host' && winningTeam === 1) ||
                          (this.mode === 'online_guest' && winningTeam === 2) ||
                          (this.mode === 'vs_ai' && winningTeam === 1) ||
                          (this.mode === 'pvp' || this.mode === 'practice');

    if (isLocalWinner) {
      this.sound.playVictory();
    } else {
      this.sound.playDefeat();
    }

    this.updateHUD();

    const p1Wins = this.roundScores.player1;
    const oppWins = (this.mode === 'vs_ai') ? this.roundScores.ai : this.roundScores.player2;

    if (p1Wins >= this.targetScore || oppWins >= this.targetScore) {
      setTimeout(() => {
        this.showVictoryScreen(p1Wins >= this.targetScore ? this.p1Name : winnerName, p1Wins >= this.targetScore ? 1 : 2);
      }, 700);
      return;
    }

    const modal = document.getElementById('roundKnockoutModal');
    const title = document.getElementById('knockoutTitle');
    const desc = document.getElementById('knockoutDesc');
    const rP1 = document.getElementById('roundScoreP1');
    const rP2 = document.getElementById('roundScoreP2');

    if (modal && title && desc) {
      const dispName = winnerName.toUpperCase();
      if (isSelfKnockout) {
        title.textContent = 'SELF-KNOCKOUT! ' + dispName + ' WINS!';
        desc.textContent = 'A pen slid off the desk boundary on its own!';
      } else {
        title.textContent = 'KNOCKOUT! ' + dispName + ' WINS!';
        desc.textContent = 'All opponent team pens were knocked completely off the desk!';
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
    if (this.mode === 'online_host') {
      this.network.send({ type: 'NEXT_ROUND' });
    }
    this.initRound();
  }

  showVictoryScreen(winnerName, winningTeam) {
    this.state = 'MATCH_OVER';
    this.hideAllModals();
    this.showScreen('victoryScreen');

    const isLocalWinner = (this.mode === 'online_host' && winningTeam === 1) ||
                          (this.mode === 'online_guest' && winningTeam === 2) ||
                          (this.mode === 'vs_ai' && winningTeam === 1) ||
                          (this.mode === 'pvp' || this.mode === 'practice');

    if (isLocalWinner) {
      this.sound.playVictory();
    } else {
      this.sound.playDefeat();
    }

    const winnerTitle = document.getElementById('victoryWinnerTitle');
    if (winnerTitle) {
      winnerTitle.textContent = winnerName.toUpperCase() + ' DOMINATES!';
    }

    const totalShots = Math.max(1, this.matchStats.shotsTaken);
    const avgP = Math.round(this.matchStats.powerSum / totalShots);
    const durationSec = Math.round((Date.now() - this.matchStats.startTime) / 1000);
    const mins = String(Math.floor(durationSec / 60)).padStart(2, '0');
    const secs = String(durationSec % 60).padStart(2, '0');

    const sShots = document.getElementById('statShotsTaken');
    const sHits = document.getElementById('statHitsLanded');
    const sImpact = document.getElementById('statMaxImpact');
    const sAvgP = document.getElementById('statAvgPower');
    const sKo = document.getElementById('statKnockouts');
    const sTime = document.getElementById('statMatchTime');

    if (sShots) sShots.textContent = totalShots;
    if (sHits) sHits.textContent = Math.round(totalShots * 0.75);
    if (sImpact) sImpact.textContent = Math.round(750 + Math.random() * 180) + ' N';
    if (sAvgP) sAvgP.textContent = avgP + '%';
    if (sKo) sKo.textContent = this.matchStats.knockouts;
    if (sTime) sTime.textContent = mins + ':' + secs;

    const winnerPenId = (winningTeam === 1) ? this.p1PenId : this.p2PenId;
    const winnerPal = PEN_COLOR_PALETTES.find(p => p.id === (winningTeam === 1 ? this.p1PaletteId : this.p2PaletteId));
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

    const formatBadge = document.getElementById('matchFormatLabel');
    if (formatBadge) {
      formatBadge.textContent = this.teamSize === 1 ? '1v1 DUEL' : this.teamSize === 2 ? '2v2 TAG TEAM' : '3v3 SQUAD BRAWL';
    }

    const p1Tag = document.getElementById('p1PenNameTag');
    const p2Tag = document.getElementById('p2PenNameTag');
    if (p1Tag) p1Tag.textContent = (PEN_CONFIGS[this.p1PenId] || {}).name || 'Pen';
    if (p2Tag) p2Tag.textContent = (PEN_CONFIGS[this.p2PenId] || {}).name || 'Pen';

    const p1Title = document.getElementById('p1TitleTag');
    if (p1Title) {
      p1Title.textContent = this.p1Name.toUpperCase() + ' ✏️';
    }

    const p2Title = document.getElementById('p2TitleTag');
    if (p2Title) {
      if (this.mode === 'vs_ai') p2Title.textContent = 'AI SQUAD';
      else if (this.mode === 'online_host') p2Title.textContent = this.p2Name.toUpperCase() + ' (GUEST)';
      else if (this.mode === 'online_guest') p2Title.textContent = 'YOU (' + this.p2Name.toUpperCase() + ')';
      else p2Title.textContent = this.p2Name.toUpperCase() + ' ✏️';
    }

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

    const p1Disp = this.p1Name.toUpperCase();
    const p2Disp = (this.mode === 'vs_ai') ? 'AI SQUAD' : this.p2Name.toUpperCase();

    if (this.state === 'IN_MOTION') {
      banner.className = 'turn-banner in-motion';
      banner.innerHTML = 'PENS IN MOTION...';
    } else if (this.currentTurnTeam === 1) {
      banner.className = 'turn-banner p1-turn';
      const slotText = this.teamSize > 1 ? ' (PEN ' + (this.activeSlotT1 + 1) + ')' : '';
      const protText = this.roundTurnCount < 2 ? ' [🛡️ 1st Shot Shield Active]' : ' [⚔️ Knockout Active]';
      if (this.mode === 'online_guest') {
        banner.innerHTML = p1Disp + slotText + ' (OPPONENT) IS AIMING...' + protText;
      } else {
        banner.innerHTML = p1Disp + slotText + ' &mdash; Drag & Release to Strike!' + protText;
      }
    } else if (this.currentTurnTeam === 2) {
      banner.className = 'turn-banner p2-turn';
      const slotText = this.teamSize > 1 ? ' (PEN ' + (this.activeSlotT2 + 1) + ')' : '';
      const protText = this.roundTurnCount < 2 ? ' [🛡️ 1st Shot Shield Active]' : ' [⚔️ Knockout Active]';
      if (this.mode === 'vs_ai') {
        banner.innerHTML = 'OPPONENT AI' + slotText + ' IS AIMING...' + protText;
      } else if (this.mode === 'online_host') {
        banner.innerHTML = p2Disp + slotText + ' (OPPONENT) IS AIMING...' + protText;
      } else {
        banner.innerHTML = p2Disp + slotText + ' &mdash; Drag & Release to Strike!' + protText;
      }
    }
  }

  openMultiplayerModal() {
    this.hideAllModals();
    const modal = document.getElementById('multiplayerModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.style.setProperty('display', 'flex', 'important');
    }
    const nickInput = document.getElementById('mpPlayerNameInput');
    if (nickInput) {
      nickInput.value = this.p1Name;
    }
    this.switchMultiplayerTab('host');
  }

  switchMultiplayerTab(tab) {
    const tabHost = document.getElementById('tabHostRoom');
    const tabJoin = document.getElementById('tabJoinRoom');
    const panelHost = document.getElementById('mpHostPanel');
    const panelJoin = document.getElementById('mpJoinPanel');

    if (tab === 'host') {
      if (tabHost) tabHost.classList.add('active');
      if (tabJoin) tabJoin.classList.remove('active');
      if (panelHost) {
        panelHost.classList.remove('hidden');
        panelHost.style.removeProperty('display');
      }
      if (panelJoin) {
        panelJoin.classList.add('hidden');
        panelJoin.style.setProperty('display', 'none', 'important');
      }
      this.startHostingRoom();
    } else {
      if (tabJoin) tabJoin.classList.add('active');
      if (tabHost) tabHost.classList.remove('active');
      if (panelJoin) {
        panelJoin.classList.remove('hidden');
        panelJoin.style.removeProperty('display');
      }
      if (panelHost) {
        panelHost.classList.add('hidden');
        panelHost.style.setProperty('display', 'none', 'important');
      }
      this.network.cleanup();
      const input = document.getElementById('joinRoomCodeInput');
      if (input) setTimeout(() => input.focus(), 100);
    }
  }

  startHostingRoom() {
    const codeEl = document.getElementById('hostRoomCodeVal');
    const statusText = document.getElementById('hostStatusText');
    if (codeEl) codeEl.textContent = 'CONNECTING...';
    if (statusText) statusText.textContent = 'Opening room channel...';

    const nickInput = document.getElementById('mpPlayerNameInput');
    if (nickInput && nickInput.value.trim()) {
      this.p1Name = nickInput.value.trim().substring(0, 16);
      localStorage.setItem('penfight_p1_name', this.p1Name);
    }

    this.network.initHost(
      (roomCode) => {
        if (codeEl) codeEl.textContent = roomCode;
        if (statusText) statusText.textContent = 'Waiting for Player 2 to join...';
      },
      (data) => {
        this.handleRemoteData(data);
      },
      (err) => {
        const msg = (err && err.message) ? err.message : (typeof err === 'string' ? err : 'Reconnecting...');
        if (statusText) statusText.textContent = msg;
      }
    );
  }

  joinExistingRoom(roomCode) {
    const statusBadge = document.getElementById('joinStatusBadge');
    const statusText = document.getElementById('joinStatusText');
    let clean = (roomCode || '').trim().toUpperCase();
    if (!clean.startsWith('PEN-')) {
      clean = 'PEN-' + clean.replace(/[^A-Z0-9]/g, '');
    }

    const nickInput = document.getElementById('mpPlayerNameInput');
    if (nickInput && nickInput.value.trim()) {
      this.p2Name = nickInput.value.trim().substring(0, 16);
      localStorage.setItem('penfight_p2_name', this.p2Name);
    }

    if (statusBadge) {
      statusBadge.classList.remove('hidden');
      statusBadge.style.removeProperty('display');
    }
    if (statusText) statusText.textContent = 'Connecting to ' + clean + '...';

    this.network.joinRoom(
      clean,
      (role) => {
        if (statusText) statusText.textContent = 'Joined room! Waiting for match start...';
        this.sound.playVictory();
      },
      (data) => {
        this.handleRemoteData(data);
      },
      (err) => {
        const msg = (err && err.message) ? err.message : (typeof err === 'string' ? err : 'Could not find room. Please check the code.');
        if (statusBadge) statusBadge.classList.remove('hidden');
        if (statusText) statusText.textContent = msg;
      }
    );
  }

  startOnlineMatch(role = 'online_host') {
    this.mode = role;
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

    this.showScreen('gameplayScreen');
    this.setupCanvasSize();
    this.updateDeskDimensions();
    this.initRound();
  }

  handleRemoteData(msg) {
    if (!msg || !msg.type) return;

    if (msg.type === 'GUEST_JOINED') {
      if (this.mode === 'online_host' && this.state !== 'MENU') return;

      if (msg.guestPenId) this.p2PenId = msg.guestPenId;
      if (msg.guestPaletteId) this.p2PaletteId = msg.guestPaletteId;
      if (msg.guestName) this.p2Name = msg.guestName;

      this.sound.playVictory();
      this.matchStartingTeam = Math.random() < 0.5 ? 1 : 2;

      this.network.send({
        type: 'START_MATCH',
        hostPenId: this.p1PenId,
        hostPaletteId: this.p1PaletteId,
        hostName: this.p1Name,
        arenaId: this.selectedArenaId,
        matchFormat: this.matchFormat,
        teamSize: this.teamSize,
        matchStartingTeam: this.matchStartingTeam
      });

      this.hideAllModals();
      this.startOnlineMatch('online_host');
      return;
    }

    if (msg.type === 'START_MATCH') {
      if (this.mode === 'online_guest' && this.state !== 'MENU') return;

      this.p1PenId = msg.hostPenId || this.p1PenId;
      this.p1PaletteId = msg.hostPaletteId || this.p1PaletteId;
      if (msg.hostName) this.p1Name = msg.hostName;

      this.selectedArenaId = msg.arenaId || this.selectedArenaId;
      this.matchFormat = msg.matchFormat || 3;
      this.teamSize = msg.teamSize || 1;
      this.matchStartingTeam = msg.matchStartingTeam || 1;

      this.hideAllModals();
      this.startOnlineMatch('online_guest');
      return;
    }

    if (msg.type === 'SHOT_FIRED') {
      const penList = msg.team === 1 ? this.pensT1 : this.pensT2;
      const targetPen = (penList && penList[msg.slotIndex]) ? penList[msg.slotIndex] : (penList ? penList[0] : null);
      if (targetPen) {
        // Align relative desk coordinates
        const desk = this.deskBounds;
        if (msg.relPos) {
          targetPen.pos.x = desk.x + msg.relPos.x * desk.width;
          targetPen.pos.y = desk.y + msg.relPos.y * desk.height;
        }
        if (msg.penAngle !== undefined) {
          targetPen.angle = msg.penAngle;
        }

        const strikePoint = targetPen.getPointAlongAxis(msg.strikeOffsetT !== undefined ? msg.strikeOffsetT : 0);
        const impulse = Vector2D.fromAngle(msg.aimAngle).mult((msg.powerPercent / 100) * targetPen.mass * 1350);

        this.executeShot(targetPen, strikePoint, impulse, msg.powerPercent, true);
      }
      return;
    }

    if (msg.type === 'TURN_SWITCH') {
      const desk = this.deskBounds;
      this.state = 'AIMING';
      this.currentTurnTeam = msg.currentTurnTeam;
      this.activeSlotT1 = msg.activeSlotT1 || 0;
      this.activeSlotT2 = msg.activeSlotT2 || 0;
      this.roundTurnCount = msg.roundTurnCount;
      this.physics.roundTurnCount = msg.roundTurnCount;

      if (msg.roundScores) {
        this.roundScores.player1 = msg.roundScores.player1;
        this.roundScores.player2 = msg.roundScores.player2;
      }
      if (msg.pens && Array.isArray(msg.pens)) {
        msg.pens.forEach(pData => {
          const list = pData.team === 1 ? this.pensT1 : this.pensT2;
          const p = list ? list[pData.slotIndex || 0] : null;
          if (p) {
            p.pos.x = desk.x + pData.relX * desk.width;
            p.pos.y = desk.y + pData.relY * desk.height;
            p.angle = pData.angle;
            p.vel.set(0, 0);
            p.angVel = 0;
            p.isDead = pData.isDead;
            p.isFalling = pData.isFalling;
          }
        });
      }
      this.sound.playTurn();
      this.updateHUD();
      return;
    }

    if (msg.type === 'ROUND_OVER') {
      this.handleRoundEnd(msg.winnerName, msg.winningTeam, msg.isSelf);
      return;
    }

    if (msg.type === 'DOUBLE_KNOCKOUT') {
      this.state = 'ROUND_OVER';
      if (this.pensT1[0]) this.sound.playPenFalling(this.pensT1[0]);
      this.showDoubleKnockoutToast();
      setTimeout(() => {
        this.hideDoubleKnockoutToast();
        this.initRound();
      }, 1500);
      return;
    }

    if (msg.type === 'NEXT_ROUND') {
      this.nextRound();
      return;
    }

    if (msg.type === 'REMATCH') {
      this.startOnlineMatch(this.mode);
      return;
    }
  }

  handlePeerDisconnect() {
    if (this.isOnlineMultiplayer()) {
      alert('Opponent left or disconnected.');
      this.showScreen('mainMenuScreen');
      this.state = 'MENU';
      this.network.cleanup();
    }
  }

  initDOM() {
    const bindBtn = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', fn);
    };

    // Quick Click-to-Edit Player Names on HUD
    const p1TitleTag = document.getElementById('p1TitleTag');
    if (p1TitleTag) {
      p1TitleTag.style.cursor = 'pointer';
      p1TitleTag.title = 'Click to edit your name';
      p1TitleTag.addEventListener('click', () => {
        const val = prompt('Enter Player 1 Name:', this.p1Name);
        if (val && val.trim()) {
          this.p1Name = val.trim().substring(0, 16);
          localStorage.setItem('penfight_p1_name', this.p1Name);
          this.updateHUD();
        }
      });
    }

    const p2TitleTag = document.getElementById('p2TitleTag');
    if (p2TitleTag) {
      p2TitleTag.style.cursor = 'pointer';
      p2TitleTag.title = 'Click to edit Player 2 name';
      p2TitleTag.addEventListener('click', () => {
        if (this.mode === 'vs_ai') return;
        const val = prompt('Enter Player 2 Name:', this.p2Name);
        if (val && val.trim()) {
          this.p2Name = val.trim().substring(0, 16);
          localStorage.setItem('penfight_p2_name', this.p2Name);
          this.updateHUD();
        }
      });
    }

    bindBtn('menuOnlineBtn', () => {
      this.sound.playClick();
      this.openMultiplayerModal();
    });

    bindBtn('tabHostRoom', () => {
      this.sound.playClick();
      this.switchMultiplayerTab('host');
    });

    bindBtn('tabJoinRoom', () => {
      this.sound.playClick();
      this.switchMultiplayerTab('join');
    });

    bindBtn('closeMultiplayerBtn', () => {
      this.sound.playClick();
      this.hideAllModals();
      this.network.cleanup();
    });

    bindBtn('copyRoomCodeBtn', () => {
      const code = this.network.roomCode || '';
      if (code) {
        navigator.clipboard.writeText(code);
        const btn = document.getElementById('copyRoomCodeBtn');
        if (btn) btn.textContent = 'COPIED!';
        setTimeout(() => { if (btn) btn.textContent = 'COPY CODE'; }, 1800);
      }
    });

    bindBtn('copyInviteLinkBtn', () => {
      const code = this.network.roomCode || '';
      if (code) {
        const link = window.location.origin + window.location.pathname + '?room=' + code;
        navigator.clipboard.writeText(link);
        const btn = document.getElementById('copyInviteLinkBtn');
        if (btn) btn.innerHTML = '<span>LINK COPIED!</span>';
        setTimeout(() => {
          if (btn) btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg><span>COPY INVITE LINK</span>';
        }, 1800);
      }
    });

    const submitJoin = () => {
      this.sound.playClick();
      const input = document.getElementById('joinRoomCodeInput');
      const val = input ? input.value : '';
      this.joinExistingRoom(val);
    };

    bindBtn('joinRoomSubmitBtn', submitJoin);

    const joinInput = document.getElementById('joinRoomCodeInput');
    if (joinInput) {
      joinInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitJoin();
        }
      });
      joinInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
      });
    }

    bindBtn('menuPlayBtn', () => {
      this.sound.playClick();
      this.startMatch('vs_ai');
    });
    bindBtn('menuPvpBtn', () => {
      this.sound.playClick();
      this.startMatch('pvp');
    });
    bindBtn('menuPracticeBtn', () => {
      this.sound.playClick();
      this.startMatch('practice');
    });
    bindBtn('menuPenSelectBtn', () => {
      this.sound.playClick();
      this.openPenSelectScreen();
    });
    bindBtn('menuArenaBtn', () => {
      this.sound.playClick();
      this.openArenaSelectScreen();
    });
    bindBtn('menuTutorialBtn', () => {
      this.sound.playClick();
      const modal = document.getElementById('tutorialModal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.style.setProperty('display', 'flex', 'important');
      }
    });
    bindBtn('menuSettingsBtn', () => {
      this.sound.playClick();
      const modal = document.getElementById('settingsModal');
      if (modal) {
        const p1In = document.getElementById('settingP1Name');
        const p2In = document.getElementById('settingP2Name');
        if (p1In) p1In.value = this.p1Name;
        if (p2In) p2In.value = this.p2Name;

        modal.classList.remove('hidden');
        modal.style.setProperty('display', 'flex', 'important');
      }
    });
    bindBtn('menuDebugToggleBtn', () => {
      this.toggleDebugHud();
    });

    bindBtn('backFromPenSelectBtn', () => {
      this.sound.playClick();
      this.showScreen('mainMenuScreen');
    });
    bindBtn('backFromArenaBtn', () => {
      this.sound.playClick();
      this.showScreen('mainMenuScreen');
    });

    bindBtn('gameplayMenuBtn', () => {
      this.sound.playClick();
      this.showScreen('mainMenuScreen');
      this.state = 'MENU';
      if (this.isOnlineMultiplayer()) this.network.cleanup();
    });
    bindBtn('quickRestartBtn', () => {
      this.sound.playClick();
      this.initRound();
    });
    bindBtn('quickSoundBtn', () => {
      const isEnabled = this.sound.toggle();
      const sBtn = document.getElementById('quickSoundBtn');
      if (sBtn) sBtn.textContent = isEnabled ? 'Sound: ON' : 'Sound: OFF';
    });

    document.querySelectorAll('.contact-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.contact-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.ui.setStrikeOffsetT(parseFloat(btn.dataset.t));
      });
    });

    bindBtn('closeTutorialBtn', () => this.hideAllModals());
    bindBtn('gotItTutorialBtn', () => this.hideAllModals());
    bindBtn('closeSettingsBtn', () => this.hideAllModals());
    bindBtn('saveSettingsBtn', () => {
      this.saveSettings();
      this.hideAllModals();
    });
    bindBtn('nextRoundBtn', () => {
      this.sound.playClick();
      this.nextRound();
    });
    bindBtn('restartMatchModalBtn', () => {
      this.sound.playClick();
      this.hideAllModals();
      if (this.mode === 'online_host') this.network.send({ type: 'REMATCH' });
      this.startMatch(this.mode);
    });
    bindBtn('knockoutMenuBtn', () => {
      this.sound.playClick();
      this.hideAllModals();
      this.showScreen('mainMenuScreen');
      this.state = 'MENU';
      if (this.isOnlineMultiplayer()) this.network.cleanup();
    });

    bindBtn('victoryRematchBtn', () => {
      this.sound.playClick();
      if (this.mode === 'online_host') this.network.send({ type: 'REMATCH' });
      this.startMatch(this.mode);
    });
    bindBtn('victoryChangePenBtn', () => {
      this.sound.playClick();
      this.openPenSelectScreen();
    });
    bindBtn('victoryMenuBtn', () => {
      this.sound.playClick();
      this.showScreen('mainMenuScreen');
      this.state = 'MENU';
      if (this.isOnlineMultiplayer()) this.network.cleanup();
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

    if (tabP1) {
      tabP1.onclick = () => {
        equipTarget = 'p1';
        tabP1.classList.add('active');
        if (tabP2) tabP2.classList.remove('active');
        renderAll();
      };
    }
    if (tabP2) {
      tabP2.onclick = () => {
        equipTarget = 'p2';
        tabP2.classList.add('active');
        if (tabP1) tabP1.classList.remove('active');
        renderAll();
      };
    }

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
    if (!container) return;
    container.innerHTML = '';
    const currentEquipped = equipTarget === 'p1' ? this.p1PenId : this.p2PenId;
    const currentPalette = PEN_COLOR_PALETTES.find(p => p.id === (equipTarget === 'p1' ? this.p1PaletteId : this.p2PaletteId)) || PEN_COLOR_PALETTES[0];

    Object.values(PEN_CONFIGS).forEach(pen => {
      const isEquipped = (currentEquipped === pen.id);
      const card = document.createElement('div');
      card.className = 'pen-card ' + (isEquipped ? (equipTarget === 'p1' ? 'equipped-p1' : 'equipped-p2') : '');

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span class="pen-card-badge">\${pen.difficulty}</span>
          <span style="font-size:11px; font-weight:700; color:var(--p1-cyan);">\${pen.sizeCategory || 'Medium'}</span>
        </div>
        <h3 class="pen-card-title">\${pen.name}</h3>
        <p class="pen-card-tagline">\${pen.tagline}</p>
        <div class="pen-card-preview" style="background: linear-gradient(90deg, \${currentPalette.cap} 20%, \${currentPalette.body} 65%, \${currentPalette.grip} 85%, \${currentPalette.clip} 100%);">
          <div class="pen-com-indicator" style="left: calc(50% + \${pen.comOffsetRatio * 40}%);"></div>
        </div>
        <div class="pen-stats-list">
          <div class="stat-bar-row"><span class="stat-name">Weight / Mass</span><div class="stat-track"><div class="stat-fill" style="width: \${pen.stats.weight}%;"></div></div><span class="stat-val">\${pen.mass}g</span></div>
          <div class="stat-bar-row"><span class="stat-name">Length / Size</span><div class="stat-track"><div class="stat-fill" style="width: \${(pen.length / 170) * 100}%;"></div></div><span class="stat-val">\${pen.length}mm</span></div>
          <div class="stat-bar-row"><span class="stat-name">Barrel Radius</span><div class="stat-track"><div class="stat-fill" style="width: \${(pen.radius / 15) * 100}%;"></div></div><span class="stat-val">\${pen.radius}mm</span></div>
          <div class="stat-bar-row"><span class="stat-name">Speed / Acceleration</span><div class="stat-track"><div class="stat-fill" style="width: \${pen.stats.speed}%;"></div></div><span class="stat-val">\${pen.stats.speed}</span></div>
          <div class="stat-bar-row"><span class="stat-name">Spin / Hook</span><div class="stat-track"><div class="stat-fill" style="width: \${pen.stats.spin}%;"></div></div><span class="stat-val">\${pen.stats.spin}</span></div>
          <div class="stat-bar-row"><span class="stat-name">Power / Ram</span><div class="stat-track"><div class="stat-fill" style="width: \${pen.stats.power}%;"></div></div><span class="stat-val">\${pen.stats.power}</span></div>
        </div>
        <p class="pen-card-desc">\${pen.description}</p>
        <button class="equip-pen-btn">\${isEquipped ? 'EQUIPPED' : 'EQUIP PEN'}</button>
      `;

      const btn = card.querySelector('.equip-pen-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          this.sound.playClick();
          if (equipTarget === 'p1') this.p1PenId = pen.id;
          else this.p2PenId = pen.id;
          this.renderPenCards(container, equipTarget);
        });
      }

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
        <div class="arena-preview-box" style="background: \${arena.tableTopGrad[0]}; border: 2px solid \${arena.rimColor};">
          \${arena.name}
        </div>
        <div class="arena-name">\${arena.name}</div>
        <p class="arena-desc">\${arena.desc}</p>
        <button class="equip-pen-btn">\${isActive ? 'CURRENT ARENA' : 'SELECT ARENA'}</button>
      `;

      const btn = card.querySelector('button');
      if (btn) {
        btn.addEventListener('click', () => {
          this.sound.playClick();
          this.selectedArenaId = arena.id;
          this.openArenaSelectScreen();
        });
      }

      grid.appendChild(card);
    });
  }

  saveSettings() {
    const diffEl = document.getElementById('settingAiDiff');
    const formatEl = document.getElementById('settingMatchFormat');
    const sfxEl = document.getElementById('settingSfxVol');
    const camEl = document.getElementById('settingCameraEffects');
    const teamEl = document.getElementById('settingTeamSize');
    const p1In = document.getElementById('settingP1Name');
    const p2In = document.getElementById('settingP2Name');

    if (diffEl) this.ai.setDifficulty(diffEl.value);
    if (formatEl) this.matchFormat = parseInt(formatEl.value) || 3;
    if (sfxEl) this.sound.setVolume(parseInt(sfxEl.value) / 100);
    if (camEl) this.cameraEffectsEnabled = camEl.checked;
    if (teamEl) this.teamSize = parseInt(teamEl.value) || 1;

    if (p1In && p1In.value.trim()) {
      this.p1Name = p1In.value.trim().substring(0, 16);
      localStorage.setItem('penfight_p1_name', this.p1Name);
    }
    if (p2In && p2In.value.trim()) {
      this.p2Name = p2In.value.trim().substring(0, 16);
      localStorage.setItem('penfight_p2_name', this.p2Name);
    }
    this.updateHUD();
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

        if (this.debugMode) {
          const dEl = document.getElementById('debugContent');
          if (dEl) {
            dEl.innerHTML = `
              FPS: \${Math.round(1 / dt)} | SubSteps: \${this.physics.subSteps}<br>
              Pens Active: \${this.physics.pens.length} | Team Size: \${this.teamSize}v\${this.teamSize}<br>
              Turn Team: \${this.currentTurnTeam} | Turn Count: \${this.roundTurnCount}<br>
              1st Strike Shield: \${this.roundTurnCount <= 2 ? 'ACTIVE' : 'OFF'}<br>
              Mode: \${this.mode} | State: \${this.state}
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

  // Check URL parameter for auto-join
  try {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setTimeout(() => {
        const game = window.penFightGame;
        if (game) {
          game.openMultiplayerModal();
          game.switchMultiplayerTab('join');
          const input = document.getElementById('joinRoomCodeInput');
          if (input) input.value = roomParam;
          game.joinExistingRoom(roomParam);
        }
      }, 500);
    }
  } catch(e) {}
});
