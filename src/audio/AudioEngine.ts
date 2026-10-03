// AudioEngine — orchestrates Howler.js using the synth sounds.
// Handles bus volume, muting, spatial panning (if needed), and pooling.
import { Howl, Howler } from 'howler';
import { BusName, BUS_DEFAULTS, SfxId, SFX_CONFIG } from './audioConfig';
import { generateAllSounds } from './soundSynth';

export class AudioEngine {
  private static instance: AudioEngine | null = null;

  private isUnlocked = false;
  private isInitialized = false;

  private busVolumes: Record<BusName, number> = {
    master: BUS_DEFAULTS.master.defaultVolume,
    music: BUS_DEFAULTS.music.defaultVolume,
    sfx: BUS_DEFAULTS.sfx.defaultVolume,
    ambience: BUS_DEFAULTS.ambience.defaultVolume,
    ui: BUS_DEFAULTS.ui.defaultVolume,
  };

  private muted: Record<BusName, boolean> = {
    master: false,
    music: false,
    sfx: false,
    ambience: false,
    ui: false,
  };

  private soundCache: Partial<Record<SfxId, Howl>> = {};
  private activeLoops: Set<number> = new Set(); // Track looped sound IDs for cleanup

  private constructor() {
    // Hidden constructor
    this.setupUnlockListeners();
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /** Starts the engine and generates synth sounds. Called on first user interaction. */
  public async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Apply initial master volume
    this.applyMasterVolume();

    // Generate synth sounds
    const blobUrls = await generateAllSounds();

    // Create Howl instances
    for (const [id, url] of Object.entries(blobUrls) as [SfxId, string][]) {
      const config = SFX_CONFIG[id];
      if (!config) continue;

      this.soundCache[id] = new Howl({
        src: [url],
        format: ['wav'],
        volume: this.getEffectiveVolume(id),
        loop: config.loop || false,
        pool: config.maxInstances || 4,
      });
    }
  }

  /* ── Unlock ── */

  private setupUnlockListeners() {
    if (typeof document === 'undefined') return;
    
    const unlock = () => {
      if (this.isUnlocked) return;
      this.isUnlocked = true;
      Howler.autoUnlock = true;
      if (Howler.ctx && Howler.ctx.state !== 'running') {
        void Howler.ctx.resume();
      }
      void this.init();
      // Remove listeners after unlock
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
      document.removeEventListener('touchstart', unlock);
    };

    document.addEventListener('pointerdown', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });
  }

  /* ── Playback ── */

  /**
   * Play a sound effect by ID.
   * @param id The SFX ID to play.
   * @param pan Optional -1 (left) to 1 (right) stereo pan.
   * @returns The Howler playback ID, or null if it failed.
   */
  public play(id: SfxId, pan?: number): number | null {
    if (!this.isUnlocked) return null;
    const howl = this.soundCache[id];
    if (!howl) return null;

    const playId = howl.play();

    // Apply stereo pan if provided (using Howler's stereo plugin)
    if (pan !== undefined && howl.stereo) {
      howl.stereo(pan, playId);
    }

    if (SFX_CONFIG[id].loop) {
      this.activeLoops.add(playId);
    }

    return playId;
  }

  /** Stop a specific playback instance, or all instances of a sound if no ID is provided. */
  public stop(id: SfxId, playId?: number) {
    const howl = this.soundCache[id];
    if (!howl) return;
    
    if (playId !== undefined) {
      howl.stop(playId);
      this.activeLoops.delete(playId);
    } else {
      howl.stop();
      // We can't easily track which IDs belonged to this howl for Set cleanup, 
      // but stopping clears them in Howler anyway.
    }
  }

  /* ── Volume & Mute ── */

  public setBusVolume(bus: BusName, vol: number) {
    this.busVolumes[bus] = Math.max(0, Math.min(1, vol));
    if (bus === 'master') {
      this.applyMasterVolume();
    } else {
      this.recalculateAllVolumes();
    }
  }

  public toggleMute(bus: BusName) {
    this.muted[bus] = !this.muted[bus];
    if (bus === 'master') {
      Howler.mute(this.muted.master);
    } else {
      this.recalculateAllVolumes();
    }
    return this.muted[bus];
  }

  private applyMasterVolume() {
    Howler.volume(this.busVolumes.master);
    Howler.mute(this.muted.master);
  }

  private recalculateAllVolumes() {
    for (const [id, howl] of Object.entries(this.soundCache) as [SfxId, Howl][]) {
      if (howl) howl.volume(this.getEffectiveVolume(id));
    }
  }

  private getEffectiveVolume(id: SfxId): number {
    const config = SFX_CONFIG[id];
    if (!config) return 0;
    
    const busVol = this.muted[config.bus] ? 0 : this.busVolumes[config.bus];
    return config.volume * busVol;
  }
}

// Export a singleton instance getter.
// Do NOT call `getAudioEngine().play()` inside the module scope, only in component lifecycles/callbacks.
export const getAudioEngine = () => AudioEngine.getInstance();
