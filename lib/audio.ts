// lib/audio.ts
// Comprehensive Web Audio API Synthesizer & Procedural BGM Engine
// 100% Client-side, 0 External Audio Files, Zero Network Lag, Full Offline Capability

export type MusicTrackId =
  | 'cyberpunk'
  | 'lobby'
  | 'workshop'
  | 'colosseum'
  | 'dungeon'
  | 'ludo'
  | 'snakes'
  | 'contest'
  | 'sanctuary';

export interface MusicTrackInfo {
  id: MusicTrackId;
  title: string;
  genre: string;
  bpm: number;
}

export const MUSIC_TRACKS: Record<MusicTrackId, MusicTrackInfo> = {
  cyberpunk: { id: 'cyberpunk', title: 'Neo Tokyo Pulse', genre: 'Cyberpunk Synthwave', bpm: 120 },
  lobby: { id: 'lobby', title: 'Orbital Lounge', genre: 'Cyber Space Chillhop', bpm: 104 },
  workshop: { id: 'workshop', title: 'Hangar Bay Beats', genre: 'Cyber Lofi Chillhop', bpm: 98 },
  colosseum: { id: 'colosseum', title: 'Colosseum Combat', genre: 'Cyber Combat Pulse', bpm: 126 },
  dungeon: { id: 'dungeon', title: 'Dungeon Ruin', genre: 'Cavernous Echo Drones', bpm: 72 },
  ludo: { id: 'ludo', title: 'Ludo Lounge', genre: 'Mellow Table Chillhop', bpm: 96 },
  snakes: { id: 'snakes', title: 'Cosmic Ascent', genre: 'Retro Arcade Space Arp', bpm: 124 },
  contest: { id: 'contest', title: 'Cyber Runway', genre: 'Electro Disco Glam', bpm: 118 },
  sanctuary: { id: 'sanctuary', title: 'Sanctuary Ambient', genre: 'Neo-Anime Dream Arp', bpm: 84 },
};

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private isMuted: boolean = false;
  private sfxVolume: number = 0.5;
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedMute = localStorage.getItem('singularity_sfx_muted');
      if (savedMute !== null) this.isMuted = savedMute === 'true';
      const savedVol = localStorage.getItem('singularity_sfx_volume');
      if (savedVol !== null) {
        const parsed = parseFloat(savedVol);
        this.sfxVolume = isNaN(parsed) ? 0.5 : Math.max(0, Math.min(1, parsed));
      }
    }
  }

  public getAudioContext(): AudioContext | null {
    this.initCtx();
    return this.ctx;
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(this.isMuted ? 0 : this.sfxVolume, this.ctx.currentTime);
        this.sfxGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private getNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    if (this.noiseBuffer) return this.noiseBuffer;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of white noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== 'undefined') localStorage.setItem('singularity_sfx_muted', String(muted));
    if (this.sfxGain && this.ctx) {
      try {
        this.sfxGain.gain.cancelScheduledValues(0);
        const target = muted ? 0 : this.sfxVolume;
        this.sfxGain.gain.setValueAtTime(target, this.ctx.currentTime);
        this.sfxGain.gain.value = target;
      } catch {}
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (typeof window !== 'undefined') localStorage.setItem('singularity_sfx_volume', String(this.sfxVolume));
    if (this.sfxGain && this.ctx && !this.isMuted) {
      try {
        this.sfxGain.gain.cancelScheduledValues(0);
        this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
        this.sfxGain.gain.value = this.sfxVolume;
      } catch {}
    }
  }

  public getVolume(): number {
    return this.sfxVolume;
  }

  private getDestination(): AudioNode | null {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted || this.sfxVolume <= 0.001) return null;
    return this.sfxGain;
  }

  // ─── UI & NAVIGATION SFX ──────────────────────────────────────────

  playClick() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.04);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }

  playHover() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(1450, now + 0.025);

      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.025);
    } catch {}
  }

  playWhoosh() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.07);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }

  playEquip() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.035;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.16, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(start);
        osc.stop(start + 0.22);
      });
    } catch {}
  }

  playSweep() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.14);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.14);
    } catch {}
  }

  playCoin() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(987.77, now); // B5
      osc1.frequency.setValueAtTime(1318.51, now + 0.07); // E6

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(987.77 * 0.5, now);
      osc2.frequency.setValueAtTime(1318.51 * 0.5, now + 0.07);

      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(dest);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.28);
      osc2.stop(now + 0.28);
    } catch {}
  }

  playGlitch() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + i * 0.02;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300 + Math.random() * 1200, start);
        gain.gain.setValueAtTime(0.09, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.03);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(start);
        osc.stop(start + 0.03);
      }
    } catch {}
  }

  playRandomize() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      const count = 7;
      for (let i = 0; i < count; i++) {
        const start = now + i * 0.03;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(400 + Math.random() * 800, start);
        osc.frequency.exponentialRampToValueAtTime(1200 + Math.random() * 600, start + 0.06);
        gain.gain.setValueAtTime(0.08, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.06);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(start);
        osc.stop(start + 0.06);
      }
      // Final confirmation sparkle
      setTimeout(() => this.playEquip(), 200);
    } catch {}
  }

  playServo() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(320, now + 0.06);
      osc.frequency.linearRampToValueAtTime(160, now + 0.12);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch {}
  }

  // ─── COMBAT & ARENA SFX ──────────────────────────────────────────

  playSlash() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch {}
  }

  playImpact() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.15);

      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }

  playParry() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      const freqs = [1760, 2637, 3520]; // Metallic harmonics
      freqs.forEach((f) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.exponentialRampToValueAtTime(f * 0.95, now + 0.18);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(now);
        osc.stop(now + 0.22);
      });
    } catch {}
  }

  playShieldBlock() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.2);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.24);
    } catch {}
  }

  playLaser() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.1);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {}
  }

  playMagic() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.18);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.26);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch {}
  }

  playOverdrive() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.18);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.45);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch {}
  }

  playCrit() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'square';
      osc1.frequency.setValueAtTime(280, now);
      osc1.frequency.exponentialRampToValueAtTime(60, now + 0.2);

      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(560, now);
      osc2.frequency.exponentialRampToValueAtTime(90, now + 0.2);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(dest);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.25);
      osc2.stop(now + 0.25);
    } catch {}
  }

  playHurt() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch {}
  }

  playCountdownBeep(num: number) {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Higher pitch as countdown gets closer to GO (3: 660Hz, 2: 770Hz, 1: 880Hz)
      const freq = num === 3 ? 660 : num === 2 ? 770 : 880;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch {}
  }

  playEngageHorn() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      const freqs = [440, 554.37, 659.25, 880]; // A major fanfare chord
      freqs.forEach((f) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.linearRampToValueAtTime(f * 1.01, now + 0.45);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(now);
        osc.stop(now + 0.55);
      });
    } catch {}
  }

  playWin() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.08;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(start);
        osc.stop(start + 0.45);
      });
    } catch {}
  }

  playDefeat() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      const notes = [440, 392, 349.23, 293.66]; // A4, G4, F4, D4 descending
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.11;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.16, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(start);
        osc.stop(start + 0.35);
      });
    } catch {}
  }

  // ─── DUNGEON SFX ──────────────────────────────────────────

  playStep() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110 + Math.random() * 40, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.04);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }

  playDodge() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.18);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch {}
  }

  playPotion() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      const freqs = [350, 480, 620, 800];
      freqs.forEach((f, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + i * 0.05;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, start);
        osc.frequency.exponentialRampToValueAtTime(f * 1.25, start + 0.1);

        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(start);
        osc.stop(start + 0.12);
      });
    } catch {}
  }

  playLevelUp() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      const scale = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98]; // C5, E5, G5, C6, E6, G6
      scale.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.06;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(start);
        osc.stop(start + 0.45);
      });
    } catch {}
  }

  playChestOpen() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.09;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.16, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(start);
        osc.stop(start + 0.35);
      });
    } catch {}
  }

  // ─── LUDO & BOARD GAMES SFX ──────────────────────────────────────────

  playDiceRoll() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      const count = 7;
      for (let i = 0; i < count; i++) {
        const start = now + i * 0.042;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220 + Math.random() * 450, start);
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.04);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(start);
        osc.stop(start + 0.04);
      }
      // Final landing thud
      setTimeout(() => {
        this.playImpact();
      }, count * 42);
    } catch {}
  }

  playTokenStep(stepIndex: number = 0) {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Climbs the musical scale with each hop!
      const baseFreq = 440; // A4
      const scaleOffsets = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16];
      const semitone = scaleOffsets[stepIndex % scaleOffsets.length];
      const freq = baseFreq * Math.pow(2, semitone / 12);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.85, now + 0.06);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch {}
  }

  playCapture() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.16);

      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch {}
  }

  playSafeZone() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      const notes = [659.25, 987.77, 1318.51]; // E5, B5, E6
      notes.forEach((f, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + i * 0.04;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, start);

        gain.gain.setValueAtTime(0.14, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(start);
        osc.stop(start + 0.3);
      });
    } catch {}
  }

  playLadderClimb() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      // Fast ascending rocket thruster arp
      const scale = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
      scale.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.04;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.05, start + 0.15);

        gain.gain.setValueAtTime(0.16, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(start);
        osc.stop(start + 0.15);
      });
    } catch {}
  }

  playSnakeSlide() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      // Wobbling cartoon slide whistle down
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.45);

      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch {}
  }

  // ─── CONTEST & RUNWAY SFX ──────────────────────────────────────────

  playFashionVote() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      const notes = [659.25, 830.61, 987.77, 1318.51, 1661.22]; // E major shimmer
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.04;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.02, start + 0.35);

        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(start);
        osc.stop(start + 0.35);
      });
    } catch {}
  }

  playCameraShutter() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;

      // 1. First mechanical click
      const osc1 = this.ctx.createOscillator();
      const g1 = this.ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(1800, now);
      osc1.frequency.exponentialRampToValueAtTime(300, now + 0.02);
      g1.gain.setValueAtTime(0.2, now);
      g1.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      osc1.connect(g1);
      g1.connect(dest);
      osc1.start(now);
      osc1.stop(now + 0.02);

      // 2. Second shutter snap (40ms later)
      const osc2 = this.ctx.createOscillator();
      const g2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1200, now + 0.04);
      osc2.frequency.exponentialRampToValueAtTime(200, now + 0.08);
      g2.gain.setValueAtTime(0.22, now + 0.04);
      g2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc2.connect(g2);
      g2.connect(dest);
      osc2.start(now + 0.04);
      osc2.stop(now + 0.08);

      // 3. Electronic flash charge / sparkle
      const osc3 = this.ctx.createOscillator();
      const g3 = this.ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(3500, now + 0.07);
      osc3.frequency.exponentialRampToValueAtTime(1400, now + 0.22);
      g3.gain.setValueAtTime(0.12, now + 0.07);
      g3.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc3.connect(g3);
      g3.connect(dest);
      osc3.start(now + 0.07);
      osc3.stop(now + 0.22);
    } catch {}
  }

  playCheer() {
    try {
      const dest = this.getDestination();
      if (!this.ctx || !dest) return;
      const now = this.ctx.currentTime;
      // Synthesized crowd clapping / cheering burst
      for (let i = 0; i < 8; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + i * 0.035;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300 + Math.random() * 500, start);
        gain.gain.setValueAtTime(0.08, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.06);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(start);
        osc.stop(start + 0.06);
      }
    } catch {}
  }
}

// ─── PROCEDURAL BGM ENGINE ──────────────────────────────────────────

type MusicSubscriber = (state: { isPlaying: boolean; track: MusicTrackId; volume: number }) => void;

class ProceduralMusicEngine {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private currentTrack: MusicTrackId = 'cyberpunk';
  private isPlaying: boolean = false;
  private volume: number = 0.28;
  private timer: number | null = null;
  private beat: number = 0;
  private subscribers: Set<MusicSubscriber> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      const savedVol = localStorage.getItem('singularity_music_volume');
      if (savedVol !== null) {
        const parsed = parseFloat(savedVol);
        this.volume = isNaN(parsed) ? 0.28 : Math.max(0, Math.min(1, parsed));
      }
      const savedTrack = localStorage.getItem('singularity_music_track') as MusicTrackId;
      if (savedTrack && MUSIC_TRACKS[savedTrack]) this.currentTrack = savedTrack;
    }
  }

  public subscribe(cb: MusicSubscriber): () => void {
    this.subscribers.add(cb);
    cb({ isPlaying: this.isPlaying, track: this.currentTrack, volume: this.volume });
    return () => this.subscribers.delete(cb);
  }

  private notify() {
    this.subscribers.forEach((cb) => cb({ isPlaying: this.isPlaying, track: this.currentTrack, volume: this.volume }));
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.musicGain = this.ctx.createGain();
        this.filter = this.ctx.createBiquadFilter();

        this.filter.type = 'lowpass';
        this.filter.frequency.setValueAtTime(1600, this.ctx.currentTime);

        this.musicGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.filter.connect(this.musicGain);
        this.musicGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.musicGain && this.ctx) {
      try {
        this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.musicGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      } catch {}
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (typeof window !== 'undefined') localStorage.setItem('singularity_music_volume', String(this.volume));
    if (this.musicGain && this.ctx) {
      try {
        this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.musicGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      } catch {}
    }
    this.notify();
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentTrack(): MusicTrackId {
    return this.currentTrack;
  }

  public playTrack(trackId: MusicTrackId) {
    if (!MUSIC_TRACKS[trackId]) return;
    this.currentTrack = trackId;
    if (typeof window !== 'undefined') {
      localStorage.setItem('singularity_music_track', trackId);
      localStorage.removeItem('singularity_music_muted');
    }
    this.initCtx();
    if (!this.ctx) return;

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.isPlaying = true;
    this.beat = 0;

    const track = MUSIC_TRACKS[this.currentTrack];
    const intervalMs = Math.round((60 / track.bpm) * 500);

    this.timer = window.setInterval(() => {
      this.playStep();
    }, intervalMs);

    // Immediately trigger step so new track audio starts without any delay
    this.playStep();
    this.notify();
  }

  public setTrack(trackId: MusicTrackId) {
    if (!MUSIC_TRACKS[trackId]) return;
    if (this.currentTrack === trackId && this.timer && this.isPlaying) return;
    this.currentTrack = trackId;
    if (typeof window !== 'undefined') localStorage.setItem('singularity_music_track', trackId);
    if (this.isPlaying) {
      this.beat = 0;
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      const track = MUSIC_TRACKS[this.currentTrack];
      const intervalMs = Math.round((60 / track.bpm) * 500);
      this.timer = window.setInterval(() => {
        this.playStep();
      }, intervalMs);
      this.playStep();
    }
    this.notify();
  }

  public toggle() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
  }

  public start(trackId?: MusicTrackId) {
    if (trackId && MUSIC_TRACKS[trackId]) {
      this.currentTrack = trackId;
    }
    this.initCtx();
    if (!this.ctx) return;

    if (this.isPlaying) {
      if (trackId) {
        this.setTrack(trackId);
      }
      return;
    }

    this.isPlaying = true;
    this.beat = 0;

    const track = MUSIC_TRACKS[this.currentTrack];
    const intervalMs = Math.round((60 / track.bpm) * 500); // 8th note steps

    if (this.timer) clearInterval(this.timer);
    this.timer = window.setInterval(() => {
      this.playStep();
    }, intervalMs);

    this.playStep();
    this.notify();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.notify();
  }

  private playTone(freq: number, type: OscillatorType, duration: number, gainVal: number, detune = 0) {
    if (!this.ctx || !this.filter || this.volume <= 0.001) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (detune) osc.detune.setValueAtTime(detune, now);

      const peakGain = Math.max(0, gainVal * this.volume);
      if (peakGain <= 0.0001) return;

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peakGain, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.filter);

      osc.start(now);
      osc.stop(now + duration);
    } catch {}
  }

  private playStep() {
    if (!this.ctx || this.volume <= 0.001) return;
    const b = this.beat % 32;

    switch (this.currentTrack) {
      case 'cyberpunk': {
        // Neo Tokyo Pulse 120 BPM - Driving cyberpunk Darksynth (Am / F / C / G)
        const bassLine = [110.0, 110.0, 110.0, 130.81, 87.31, 87.31, 130.81, 98.0];
        const arpScale = [440.0, 523.25, 659.25, 783.99, 880.0, 1046.5];

        // 16th style driving bass
        const bass = bassLine[Math.floor(b / 4) % bassLine.length];
        this.playTone(bass, 'sawtooth', 0.18, 0.22);

        // Sub kick on beat 1 & 3 of bar (b % 4 === 0)
        if (b % 4 === 0) {
          this.playTone(60, 'triangle', 0.22, 0.35);
        }

        // Cyber arp flutter
        const arp = arpScale[(b * 3) % arpScale.length];
        this.playTone(arp, 'triangle', 0.16, 0.09, b % 2 === 0 ? 5 : -5);

        // Snappy synth snare on backbeats (b % 8 === 4)
        if (b % 8 === 4) {
          this.playTone(240, 'square', 0.12, 0.15);
        }
        break;
      }

      case 'lobby': {
        // Orbital Lounge 104 BPM - Sci-Fi Cyber Lounge Chillhop (Fmaj7 -> Em7 -> Dm7 -> Cmaj7)
        const chords = [
          [349.23, 440.0, 523.25, 659.25], // Fmaj7
          [329.63, 392.0, 493.88, 587.33], // Em7
          [293.66, 349.23, 440.0, 523.25], // Dm7
          [261.63, 329.63, 392.0, 493.88], // Cmaj7
        ];
        const chord = chords[Math.floor(b / 8) % chords.length];

        // Smooth Rhodes chord pad
        if (b % 4 === 0) {
          chord.forEach((freq) => {
            this.playTone(freq, 'triangle', 0.5, 0.08);
          });
          // Deep sub bass note
          this.playTone(chord[0] * 0.5, 'sine', 0.6, 0.28);
        }

        // Sub kick on beat 1
        if (b % 8 === 0) {
          this.playTone(55, 'triangle', 0.2, 0.3);
        }

        // Mellow orbital bell arp
        if (b % 2 === 1) {
          const note = chord[(b + 1) % chord.length] * 2;
          this.playTone(note, 'sine', 0.25, 0.04);
        }
        break;
      }

      case 'workshop': {
        // Hangar Bay Beats 98 BPM - Cyber Lofi Chillhop (Dm9 -> G13 -> Cmaj9 -> Am9)
        const chords = [
          [293.66, 349.23, 440.0, 523.25, 659.25], // Dm9
          [196.0, 246.94, 293.66, 392.0, 440.0],   // G13
          [261.63, 329.63, 392.0, 493.88, 587.33], // Cmaj9
          [220.0, 261.63, 329.63, 392.0, 493.88],  // Am9
        ];
        const chord = chords[Math.floor(b / 8) % chords.length];

        // Mellow electric piano chords on downbeats
        if (b % 4 === 0) {
          chord.forEach((freq) => {
            this.playTone(freq, 'triangle', 0.55, 0.08);
          });
          // Warm sine bass
          this.playTone(chord[0] * 0.5, 'sine', 0.45, 0.25);
        } else if (b % 2 === 1) {
          // Offbeat syncopated gentle tap
          this.playTone(chord[2] * 2, 'sine', 0.1, 0.03);
        }
        break;
      }

      case 'colosseum': {
        // Cyber Combat 126 BPM Driving Pulse (Dm / Bb / C / A)
        const bassLine = [146.83, 146.83, 146.83, 174.61, 116.54, 116.54, 130.81, 220.0];
        const lead = [587.33, 659.25, 698.46, 880.0, 783.99, 659.25, 587.33, 523.25];

        // 16th note synth pulse
        const bass = bassLine[Math.floor(b / 4) % bassLine.length];
        this.playTone(bass, 'sawtooth', 0.16, 0.18);

        // Sub kick thud on 4s
        if (b % 4 === 0) {
          this.playTone(65, 'triangle', 0.2, 0.3);
        }

        // Heroic synth lead
        if (b % 2 === 0) {
          const leadNote = lead[Math.floor(b / 2) % lead.length];
          this.playTone(leadNote, 'square', 0.22, 0.09, -4);
        }
        break;
      }

      case 'dungeon': {
        // Mysterious Eerie Cavern Drones & Crystal Bells 72 BPM
        const root = 146.83; // D3
        const bellNotes = [587.33, 698.46, 880.0, 1046.5, 1174.66]; // D5, F5, A5, C6, D6

        // Deep drone
        if (b % 8 === 0) {
          this.playTone(root * 0.5, 'sine', 2.8, 0.26);
          this.playTone(root * 1.5, 'triangle', 2.2, 0.12, 8);
        }

        // Random crystal resonance
        if (b % 3 === 0 && Math.random() > 0.3) {
          const bell = bellNotes[Math.floor(Math.random() * bellNotes.length)];
          this.playTone(bell, 'sine', 1.4, 0.12);
        }
        break;
      }

      case 'ludo': {
        // Cozy Lounge Chill-Hop Groove (Dm7 -> G7 -> Cmaj7)
        const chords = [
          [293.66, 349.23, 440.0, 523.25], // Dm7
          [196.0, 246.94, 293.66, 349.23], // G7
          [261.63, 329.63, 392.0, 493.88], // Cmaj7
          [220.0, 261.63, 329.63, 392.0],  // Am7
        ];
        const chord = chords[Math.floor(b / 8) % chords.length];

        // Rhodes-style electric piano chord pulse
        if (b % 4 === 0) {
          chord.forEach((freq) => {
            this.playTone(freq, 'triangle', 0.45, 0.09);
          });
          // Walking bass note
          this.playTone(chord[0] * 0.5, 'sine', 0.4, 0.22);
        } else if (b % 2 === 1) {
          // Off-beat mellow tap
          this.playTone(chord[2] * 2, 'sine', 0.12, 0.04);
        }
        break;
      }

      case 'snakes': {
        // Cosmic Ascent 124 BPM - Retro Arcade Space Adventure
        const melodyScale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99]; // C Pentatonic + steps
        const bassNotes = [130.81, 130.81, 174.61, 174.61, 196.0, 196.0, 164.81, 164.81]; // C3, F3, G3, E3

        // Bouncy 8-bit bassline
        const bass = bassNotes[Math.floor(b / 4) % bassNotes.length];
        this.playTone(bass, 'square', 0.14, 0.15);

        // Climbing cosmic arpeggio
        const noteIdx = (b * 2) % melodyScale.length;
        this.playTone(melodyScale[noteIdx], 'triangle', 0.2, 0.11);

        // Star chime burst on 4s
        if (b % 4 === 2) {
          this.playTone(melodyScale[(noteIdx + 4) % melodyScale.length] * 1.5, 'sine', 0.3, 0.07);
        }
        break;
      }

      case 'contest': {
        // Cyber Runway Glam 118 BPM - French Electro Disco (Em7 / Dmaj7 / Cmaj7 / Bm7)
        const discoBass = [82.41, 164.81, 82.41, 164.81, 73.42, 146.83, 73.42, 146.83]; // Octave jumping bass
        const glitter = [1318.51, 1479.98, 1661.22, 1975.53]; // E6 glitter bells

        // Four on the floor kick
        if (b % 4 === 0) {
          this.playTone(70, 'triangle', 0.2, 0.35);
        }

        // Funky octave bassline
        const bass = discoBass[Math.floor(b / 2) % discoBass.length];
        this.playTone(bass, 'sawtooth', 0.12, 0.2);

        // Runway glamour chords
        if (b % 4 === 2) {
          this.playTone(659.25, 'triangle', 0.35, 0.12);
          this.playTone(987.77, 'sine', 0.35, 0.1);
        }

        // High shimmer sparkle
        if (b % 8 === 6) {
          const glit = glitter[Math.floor(Math.random() * glitter.length)];
          this.playTone(glit, 'sine', 0.4, 0.08);
        }
        break;
      }

      case 'sanctuary': {
        // Pentatonic Dream Arp 84 BPM (Cmaj7 / Am9)
        const arpScale = [261.63, 329.63, 392.0, 493.88, 523.25, 659.25, 783.99, 987.77];
        const bassNotes = [130.81, 130.81, 110.0, 110.0, 174.61, 174.61, 196.0, 196.0]; // C3, A2, F3, G3

        // Bass on quarter notes
        if (b % 4 === 0) {
          const bass = bassNotes[Math.floor(b / 4) % bassNotes.length];
          this.playTone(bass, 'sine', 0.8, 0.22);
        }

        // Ambient Kalimba / Glass Arp
        const noteIdx = (b * 3 + (b % 2)) % arpScale.length;
        if (b % 2 === 0 || b % 5 === 0) {
          this.playTone(arpScale[noteIdx], 'triangle', 0.45, 0.14);
        }

        // Soft sub-shimmer
        if (b % 8 === 0) {
          this.playTone(arpScale[(noteIdx + 4) % arpScale.length], 'sine', 1.2, 0.08, 5);
        }
        break;
      }
    }

    this.beat++;
  }
}

export const sound = new SoundSynthesizer();
export const music = new ProceduralMusicEngine();
