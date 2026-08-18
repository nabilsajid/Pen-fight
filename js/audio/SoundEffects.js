/**
 * SoundEffects - Procedural Web Audio API Sound Synthesizer
 */
export class SoundEffects {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.masterGain = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.65, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  resume() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  // Play crisp pen flick / strike sound
  playStrike(intensity = 50) {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    const normalizedIntensity = Math.min(1, Math.max(0.1, intensity / 100));

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280 + normalizedIntensity * 320, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.08);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.Q.setValueAtTime(3.0, t);

    gain.gain.setValueAtTime(0.8 * normalizedIntensity, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  // Pen-to-Pen collision clack with pitch governed by pen masses
  playPenCollision(penA, penB, intensity = 40) {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const avgMass = ((penA ? penA.mass : 20) + (penB ? penB.mass : 20)) * 0.5;
    
    // Heavier pens produce lower deeper resonance; lighter pens produce higher clack
    const baseFreq = Math.max(160, 950 - avgMass * 14);
    const volume = Math.min(0.9, Math.max(0.15, intensity / 120));

    // Impact click
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();

    osc1.type = penA && penA.presetId === 'metal_tank' ? 'sawtooth' : 'sine';
    osc1.frequency.setValueAtTime(baseFreq * 1.5, t);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, t + 0.06);

    gain1.gain.setValueAtTime(volume * 0.7, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.065);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(t);
    osc1.stop(t + 0.07);

    // Body resonance noise burst
    const bufferSize = this.ctx.sampleRate * 0.04;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(baseFreq * 1.2, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(volume * 0.5, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(t);
  }

  // Eraser or soft obstacle impact
  playEraserHit(intensity = 30) {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.08);

    const vol = Math.min(0.6, Math.max(0.1, intensity / 100));
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  playObstacleHit(intensity = 30) {
    this.playEraserHit(intensity);
  }

  // Pen falling off the desk edge
  playPenFalling(pen) {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    // Whistle drop sound
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.55);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.6);

    // Floor thud after drop
    setTimeout(() => {
      if (!this.enabled || !this.ctx) return;
      const t2 = this.ctx.currentTime;
      const thudOsc = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();

      thudOsc.type = 'triangle';
      thudOsc.frequency.setValueAtTime(95, t2);
      thudOsc.frequency.exponentialRampToValueAtTime(30, t2 + 0.18);

      thudGain.gain.setValueAtTime(0.7, t2);
      thudGain.gain.exponentialRampToValueAtTime(0.001, t2 + 0.2);

      thudOsc.connect(thudGain);
      thudGain.connect(this.masterGain);
      thudOsc.start(t2);
      thudOsc.stop(t2 + 0.22);
    }, 450);
  }

  // Victory fanfare
  playVictory() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const notes = [261.63, 329.63, 392.0, 523.25]; // C, E, G, High C
    const t = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteStart = t + idx * 0.11;
      const noteDur = idx === notes.length - 1 ? 0.45 : 0.18;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteStart);

      gain.gain.setValueAtTime(0.4, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDur);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(noteStart);
      osc.stop(noteStart + noteDur + 0.02);
    });
  }

  // Turn notification sound
  playTurn() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, t); // D5
    osc.frequency.setValueAtTime(880.0, t + 0.06); // A5

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.18);
  }
}
