// Original generative dark chiptune score: minor arpeggio, sub pulse, pad, kick and noise hats.
// No audio downloads, samples, copyrighted songs, or autoplay. A user gesture starts Web Audio.
export class AudioManager {
  constructor(save) {
    this.save = save;
    this.music = save.data.music;
    this.sfx = save.data.sound;
    this.ctx = null;
    this.step = 0;
    this.next = 0;
    this.last = {};
    this.intensity = 0;
    this.suspended = false;
    this.interval = null;
    this.boss = false;
  }
  async unlock() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.music ? 0.23 : 0;
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.24;
      this.sfxGain.connect(this.master);
      let n = this.ctx.sampleRate;
      this.noise = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      let a = this.noise.getChannelData(0);
      for (let i = 0; i < n; i++) a[i] = Math.random() * 2 - 1;
      this.next = this.ctx.currentTime;
      this.interval = setInterval(() => this.schedule(), 80);
    }
    if (this.ctx.state === "suspended") await this.ctx.resume();
  }
  setBoss(active) {
    if (this.boss === active) return;
    this.boss = active;
    this.step = 0;
    if (this.ctx) this.next = this.ctx.currentTime;
  }
  setMusic(on) {
    this.music = on;
    this.save.data.music = on;
    this.save.write();
    if (this.ctx)
      this.musicGain.gain.setTargetAtTime(
        on ? 0.23 : 0,
        this.ctx.currentTime,
        0.12,
      );
  }
  setSound(on) {
    this.sfx = on;
    this.save.data.sound = on;
    this.save.write();
  }
  tone(freq, type, time, duration, volume, dest, slide = 0) {
    let o = this.ctx.createOscillator(),
      g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, time);
    if (slide)
      o.frequency.exponentialRampToValueAtTime(
        Math.max(20, slide),
        time + duration,
      );
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), time + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    o.connect(g);
    g.connect(dest);
    o.start(time);
    o.stop(time + duration + 0.02);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }
  hiss(time, duration, volume, dest) {
    let b = this.ctx.createBufferSource(),
      g = this.ctx.createGain(),
      filter = this.ctx.createBiquadFilter();
    b.buffer = this.noise;
    filter.type = "highpass";
    filter.frequency.value = 5000;
    b.connect(filter);
    filter.connect(g);
    g.connect(dest);
    g.gain.setValueAtTime(volume, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    b.start(time);
    b.stop(time + duration);
    b.onended = () => {
      b.disconnect();
      filter.disconnect();
      g.disconnect();
    };
  }
  schedule() {
    if (!this.ctx || this.ctx.state !== "running") return;
    if (this.suspended || !this.music) {
      this.next = this.ctx.currentTime;
      return;
    }
    if (this.next < this.ctx.currentTime) this.next = this.ctx.currentTime;
    while (this.next < this.ctx.currentTime + 0.2) {
      let s = this.step % 32,
        bar = Math.floor(this.step / 32) % 4,
        root = (this.boss ? [38, 38, 41, 37] : [45, 41, 48, 43])[bar],
        hz = (n) => 440 * 2 ** ((n - 69) / 12),
        arp = this.boss
          ? [0, 1, 7, 12, 13, 7, 1, 7]
          : [0, 7, 12, 15, 12, 7, 3, 7];
      if (s % 4 === 0)
        this.tone(hz(root), "triangle", this.next, 0.38, 0.6, this.musicGain);
      if (s % 2 === 0)
        this.tone(
          hz(root + 12 + arp[((s / 2) | 0) % 8]),
          "square",
          this.next,
          0.15,
          0.1 + this.intensity * 0.06,
          this.musicGain,
        );
      if (s % (this.boss ? 4 : 8) === 0)
        this.tone(120, "sine", this.next, 0.15, 0.8, this.musicGain, 34);
      if (s % 4 === 2) this.hiss(this.next, 0.055, 0.09, this.musicGain);
      if (s === 0) {
        this.tone(hz(root + 12), "sine", this.next, 3.2, 0.12, this.musicGain);
        this.tone(hz(root + 19), "sine", this.next, 3.2, 0.07, this.musicGain);
      }
      if (this.intensity > 0.5 && s % 4 === 1)
        this.hiss(this.next, 0.025, 0.05, this.musicGain);
      this.step++;
      this.next += 60 / (this.boss ? 142 : 106) / 4;
    }
  }
  effect(type) {
    if (!this.ctx || !this.sfx || this.ctx.state !== "running") return;
    let t = this.ctx.currentTime;
    if (
      t - (this.last[type] ?? -10) <
      ({ gem: 0.09, shot: 0.08, explosion: 0.18 }[type] || 0.07)
    )
      return;
    this.last[type] = t;
    const d = this.sfxGain;
    if (type === "shot") {
      this.tone(170, "square", t, 0.045, 0.12, d, 60);
    } else if (type === "gem" || type === "coin") {
      this.tone(type === "gem" ? 960 : 1250, "sine", t, 0.075, 0.12, d, 1500);
    } else if (type === "hurt") {
      this.tone(100, "sawtooth", t, 0.18, 0.4, d, 35);
    } else if (type === "explosion") {
      this.hiss(t, 0.3, 0.6, d);
      this.tone(90, "sawtooth", t, 0.35, 0.5, d, 20);
    } else if (type === "lightning") {
      this.hiss(t, 0.22, 0.35, d);
      this.tone(330, "sawtooth", t, 0.15, 0.2, d, 70);
    } else if (type === "boss") {
      [0, 0.16, 0.32].forEach((v, i) =>
        this.tone(110 - i * 15, "sawtooth", t + v, 0.3, 0.4, d),
      );
    } else if (type === "chest" || type === "level") {
      [0, 4, 7, 12].forEach((n, i) =>
        this.tone(440 * 2 ** (n / 12), "triangle", t + i * 0.09, 0.25, 0.25, d),
      );
    } else {
      this.tone(230, "triangle", t, 0.12, 0.18, d, 60);
    }
  }
}
