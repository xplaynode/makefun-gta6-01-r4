// WebAudio sound: procedural SFX plus a 3-station in-game radio. No audio files.
export class SoundEngine {
  constructor() { this.ctx = null; this.station = 0; this.radioTimer = null; this.engineOsc = null; }
  ensure() {
    if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { this.ctx = null; } }
    return this.ctx;
  }
  blip(freq, dur, type = 'square', gain = 0.08, slide = 0) {
    const ctx = this.ensure(); if (!ctx) return;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), ctx.currentTime + dur);
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + dur);
  }
  noise(dur, gain = 0.12) {
    const ctx = this.ensure(); if (!ctx) return;
    const len = Math.floor(ctx.sampleRate * dur); const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const g = ctx.createGain(); g.gain.value = gain;
    src.connect(g).connect(ctx.destination); src.start();
  }
  shot(kind) { if (kind === 'cazadora') { this.noise(0.22, 0.25); this.blip(90, 0.18, 'sawtooth', 0.15, -40); } else if (kind === 'brasa9') { this.noise(0.09, 0.16); this.blip(220, 0.07, 'square', 0.08, -120); } else this.blip(140, 0.08, 'square', 0.07, -60); }
  explosion() { this.noise(0.7, 0.35); this.blip(55, 0.6, 'sine', 0.3, -25); }
  pickup() { this.blip(660, 0.09, 'sine', 0.1); setTimeout(() => this.blip(990, 0.12, 'sine', 0.1), 70); }
  ui() { this.blip(440, 0.05, 'sine', 0.06); }
  siren() { this.blip(720, 0.3, 'triangle', 0.05, 260); }
  engine(speed) { if (this.ensure() && Math.random() < 0.12) this.blip(50 + Math.abs(speed) * 0.35, 0.08, 'sawtooth', 0.03); }
  cycleRadio() {
    this.station = (this.station + 1) % 4; // 0 = off, 1..3 = stations
    if (this.radioTimer) { clearInterval(this.radioTimer); this.radioTimer = null; }
    if (this.station === 0 || !this.ensure()) return;
    const patterns = [
      null,
      [220, 277, 330, 277, 196, 247, 294, 247],           // synthwave arpeggio
      [0, 196, 0, 196, 220, 0, 165, 196],                 // latin percussion pulse (0 = drum noise)
      [174, 0, 220, 0, 196, 0, 165, 0],                   // lo-fi drift
    ];
    const notes = patterns[this.station]; let i = 0;
    this.radioTimer = setInterval(() => {
      const n = notes[i++ % notes.length];
      if (n === 0) this.noise(0.06, 0.05); else this.blip(n, 0.22, this.station === 3 ? 'sine' : 'triangle', 0.045);
    }, 240);
    return ['Off', 'Onda Synthwave', 'Radio Brasa Latina', 'Lo-Fi Marea'][this.station];
  }
  radioName() { return ['Off', 'Onda Synthwave', 'Radio Brasa Latina', 'Lo-Fi Marea'][this.station]; }
}
