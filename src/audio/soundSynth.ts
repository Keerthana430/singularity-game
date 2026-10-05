// SoundSynth — generates short PCM audio buffers procedurally using the Web Audio API.
// This avoids needing any audio asset files while still providing realistic sounds.
// All sounds are generated once, cached as Blobs, and handed to Howler as URLs.

type SynthFn = (ctx: AudioContext) => AudioBuffer;

/** Clamp helper — prevents WebAudio clipping. */
const clamp = (v: number, lo = -1, hi = 1) => Math.max(lo, Math.min(hi, v));

function bufferToBlob(buffer: AudioBuffer): string {
  const numCh = buffer.numberOfChannels;
  const length = buffer.length;
  const sampleRate = buffer.sampleRate;
  const byteLength = 44 + length * numCh * 2;
  const arrayBuffer = new ArrayBuffer(byteLength);
  const view = new DataView(arrayBuffer);

  const writeStr = (off: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
  writeStr(0, 'RIFF');
  view.setUint32(4, byteLength - 8, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numCh, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numCh * 2, true);
  view.setUint16(32, numCh * 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, length * numCh * 2, true);

  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numCh; ch++) {
      const s = clamp(buffer.getChannelData(ch)[i]);
      view.setInt16(offset, s < 0 ? s * 32768 : s * 32767, true);
      offset += 2;
    }
  }

  const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

/* ── Synth functions ── */

function synthDiceThrow(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const dur = 0.18;
  const buf = ctx.createBuffer(1, sr * dur, sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const env = Math.exp(-t * 20);
    d[i] = env * (Math.random() * 2 - 1) * 0.9;
  }
  return buf;
}

function synthDiceBounce(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const dur = 0.08;
  const buf = ctx.createBuffer(1, sr * dur, sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const env = Math.exp(-t * 50);
    const freq = 900 + 600 * Math.exp(-t * 30);
    d[i] = env * Math.sin(2 * Math.PI * freq * t) * 0.7;
  }
  return buf;
}

function synthDiceSettle(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const dur = 0.22;
  const buf = ctx.createBuffer(1, sr * dur, sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const env = Math.exp(-t * 12);
    d[i] = env * (Math.random() * 2 - 1) * 0.4;
  }
  return buf;
}

function synthFootstep(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const dur = 0.12;
  const buf = ctx.createBuffer(1, sr * dur, sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    d[i] = Math.exp(-t * 30) * (Math.random() * 2 - 1) * 0.55;
  }
  return buf;
}

function synthHopLand(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const dur = 0.15;
  const buf = ctx.createBuffer(1, sr * dur, sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    d[i] = Math.exp(-t * 25) * (Math.random() * 2 - 1) * 0.7
          + Math.exp(-t * 60) * Math.sin(2 * Math.PI * 200 * t) * 0.4;
  }
  return buf;
}

function synthSnakeHiss(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const dur = 0.7;
  const buf = ctx.createBuffer(1, sr * dur, sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const env = Math.sin(Math.PI * (t / dur)) * 0.7;
    d[i] = env * (Math.random() * 2 - 1);
  }
  return buf;
}

function synthSnakeBite(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const dur = 0.3;
  const buf = ctx.createBuffer(1, sr * dur, sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    d[i] = Math.exp(-t * 8) * (Math.random() * 2 - 1) * 0.9
          + Math.exp(-t * 5) * Math.sin(2 * Math.PI * 80 * t) * 0.5;
  }
  return buf;
}

function synthLadderCreak(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const dur = 0.25;
  const buf = ctx.createBuffer(1, sr * dur, sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const env = Math.exp(-t * 6);
    const freq = 300 + 200 * Math.sin(2 * Math.PI * 6 * t);
    d[i] = env * Math.sin(2 * Math.PI * freq * t) * 0.5;
  }
  return buf;
}

function synthLadderSparkle(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const dur = 0.35;
  const buf = ctx.createBuffer(1, sr * dur, sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const env = Math.exp(-t * 10);
    d[i] = env * (
      Math.sin(2 * Math.PI * 2000 * t) * 0.3 +
      Math.sin(2 * Math.PI * 3200 * t) * 0.2 +
      Math.sin(2 * Math.PI * 4800 * t) * 0.15
    );
  }
  return buf;
}

function synthFallImpact(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const dur = 0.4;
  const buf = ctx.createBuffer(1, sr * dur, sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    d[i] = Math.exp(-t * 8) * (Math.random() * 2 - 1) * 0.95
          + Math.exp(-t * 4) * Math.sin(2 * Math.PI * 60 * t) * 0.6;
  }
  return buf;
}

function synthVictoryFanfare(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const dur = 1.5;
  const buf = ctx.createBuffer(1, sr * dur, sr);
  const d = buf.getChannelData(0);
  const notes = [523, 659, 784, 1046]; // C5 E5 G5 C6
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const noteIdx = Math.min(Math.floor(t / (dur / notes.length)), notes.length - 1);
    const localT = t - noteIdx * (dur / notes.length);
    const env = Math.exp(-localT * 3);
    d[i] = env * (
      Math.sin(2 * Math.PI * notes[noteIdx] * t) * 0.5 +
      Math.sin(2 * Math.PI * notes[noteIdx] * 2 * t) * 0.2
    );
  }
  return buf;
}

function synthUiClick(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const dur = 0.06;
  const buf = ctx.createBuffer(1, sr * dur, sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    d[i] = Math.exp(-t * 80) * Math.sin(2 * Math.PI * 1200 * t) * 0.6;
  }
  return buf;
}

function synthUiHover(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const dur = 0.04;
  const buf = ctx.createBuffer(1, sr * dur, sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    d[i] = Math.exp(-t * 120) * Math.sin(2 * Math.PI * 800 * t) * 0.3;
  }
  return buf;
}

function synthAmbienceLoop(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const dur = 8;
  const buf = ctx.createBuffer(1, sr * dur, sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    d[i] =
      Math.sin(2 * Math.PI * 60 * t) * 0.05 +
      Math.sin(2 * Math.PI * 120 * t) * 0.03 +
      (Math.random() * 2 - 1) * 0.018;
  }
  return buf;
}

/* ── Registry ── */
import { SfxId } from './audioConfig';

const SYNTH_MAP: Record<SfxId, SynthFn> = {
  dice_throw:      synthDiceThrow,
  dice_bounce:     synthDiceBounce,
  dice_settle:     synthDiceSettle,
  footstep:        synthFootstep,
  hop_land:        synthHopLand,
  snake_hiss:      synthSnakeHiss,
  snake_bite:      synthSnakeBite,
  ladder_creak:    synthLadderCreak,
  ladder_sparkle:  synthLadderSparkle,
  fall_impact:     synthFallImpact,
  victory_fanfare: synthVictoryFanfare,
  ui_click:        synthUiClick,
  ui_hover:        synthUiHover,
  ambience_loop:   synthAmbienceLoop,
};

/** Generate and cache all sounds as blob URLs. Returns a map from SfxId -> blob URL. */
export function generateAllSounds(): Promise<Partial<Record<SfxId, string>>> {
  return new Promise((resolve) => {
    // Must be triggered from a user-gesture context or an already-unlocked AudioContext
    let ctx: AudioContext;
    try {
      ctx = new AudioContext({ sampleRate: 44100 });
    } catch {
      resolve({});
      return;
    }

    const result: Partial<Record<SfxId, string>> = {};
    for (const [id, fn] of Object.entries(SYNTH_MAP) as [SfxId, SynthFn][]) {
      try {
        const buf = fn(ctx);
        result[id] = bufferToBlob(buf);
      } catch {
        // Silently skip failed sounds — audio is non-blocking
      }
    }
    void ctx.close();
    resolve(result);
  });
}
