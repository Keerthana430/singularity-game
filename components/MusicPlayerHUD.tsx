'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { music, sound, MUSIC_TRACKS, type MusicTrackId } from '@/lib/audio';
import {
  Music,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

const TRACK_ORDER: MusicTrackId[] = [
  'cyberpunk',
  'lobby',
  'workshop',
  'colosseum',
  'dungeon',
  'ludo',
  'snakes',
  'contest',
  'sanctuary',
];

const TRACK_COLORS: Record<MusicTrackId, { accent: string; glow: string; bar: string }> = {
  cyberpunk: {
    accent: '#00FF66',
    glow: 'rgba(0,255,102,0.35)',
    bar: 'linear-gradient(90deg, #00FF66, #00B347)',
  },
  lobby: {
    accent: '#22D3EE',
    glow: 'rgba(34,211,238,0.35)',
    bar: 'linear-gradient(90deg, #22D3EE, #0891B2)',
  },
  workshop: {
    accent: '#38BDF8',
    glow: 'rgba(56,189,248,0.35)',
    bar: 'linear-gradient(90deg, #38BDF8, #0284C7)',
  },
  colosseum: {
    accent: '#FF6B35',
    glow: 'rgba(255,107,53,0.35)',
    bar: 'linear-gradient(90deg, #FF6B35, #FF3E00)',
  },
  dungeon: {
    accent: '#A855F7',
    glow: 'rgba(168,85,247,0.35)',
    bar: 'linear-gradient(90deg, #A855F7, #7E22CE)',
  },
  ludo: {
    accent: '#FACC15',
    glow: 'rgba(250,204,21,0.35)',
    bar: 'linear-gradient(90deg, #FACC15, #CA8A04)',
  },
  snakes: {
    accent: '#EC4899',
    glow: 'rgba(236,72,153,0.35)',
    bar: 'linear-gradient(90deg, #EC4899, #BE185D)',
  },
  contest: {
    accent: '#F43F5E',
    glow: 'rgba(244,63,94,0.35)',
    bar: 'linear-gradient(90deg, #F43F5E, #E11D48)',
  },
  sanctuary: {
    accent: '#2DD4BF',
    glow: 'rgba(45,212,191,0.35)',
    bar: 'linear-gradient(90deg, #2DD4BF, #0F766E)',
  },
};

// Animated equalizer bars
function EqBars({ isPlaying, accent }: { isPlaying: boolean; accent: string }) {
  return (
    <div className="flex items-end gap-[2px] h-4 w-6">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="w-[3px] rounded-sm"
          style={{
            background: accent,
            height: isPlaying ? undefined : '4px',
            animation: isPlaying
              ? `eqBar${i + 1} ${0.5 + i * 0.13}s ease-in-out infinite alternate`
              : 'none',
          }}
        />
      ))}
    </div>
  );
}

export function MusicPlayerHUD() {
  const pathname = usePathname();
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackId, setTrackId] = useState<MusicTrackId>('cyberpunk');
  const [musicVol, setMusicVol] = useState(0.28);
  const [sfxVol, setSfxVol] = useState(0.5);
  const [sfxMuted, setSfxMuted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const userInteractedRef = useRef(false);

  // Subscribe to music engine state
  useEffect(() => {
    const unsub = music.subscribe((state) => {
      setIsPlaying(state.isPlaying);
      setTrackId(state.track);
      setMusicVol(state.volume);
    });
    setSfxMuted(sound.getMuted());
    setSfxVol(sound.getVolume());
    return unsub;
  }, []);

  // First interaction unlock: in modern browsers audio must resume upon a user gesture
  useEffect(() => {
    const unlockAudio = () => {
      if (userInteractedRef.current) return;
      userInteractedRef.current = true;
      sound.getAudioContext();
      // If user hasn't explicitly disabled music, auto-start upon first interaction
      const savedMute = localStorage.getItem('singularity_music_muted');
      if (savedMute !== 'true' && !music.getIsPlaying()) {
        music.start();
      }
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };

    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // Route-based dynamic theme switching (General music in home, lobby, studio, games)
  useEffect(() => {
    let targetTrack: MusicTrackId = 'cyberpunk';
    if (pathname === '/') targetTrack = 'cyberpunk';
    else if (pathname.startsWith('/lobby')) targetTrack = 'lobby';
    else if (pathname.startsWith('/arena')) targetTrack = 'colosseum';
    else if (pathname.startsWith('/studio')) targetTrack = 'workshop';
    else if (pathname.startsWith('/dungeon')) targetTrack = 'dungeon';
    else if (pathname.startsWith('/ludo')) targetTrack = 'ludo';
    else if (pathname.startsWith('/snakes')) targetTrack = 'snakes';
    else if (pathname.startsWith('/contest')) targetTrack = 'contest';
    else targetTrack = 'cyberpunk';

    music.setTrack(targetTrack);

    // Auto-play general music if not explicitly disabled by user
    const savedMute = localStorage.getItem('singularity_music_muted');
    if (savedMute !== 'true' && !music.getIsPlaying()) {
      music.start(targetTrack);
    }
  }, [pathname]);

  const handleToggle = useCallback(() => {
    sound.playClick();
    if (isPlaying) {
      localStorage.setItem('singularity_music_muted', 'true');
      music.stop();
    } else {
      localStorage.removeItem('singularity_music_muted');
      music.start();
    }
  }, [isPlaying]);

  const handleNextTrack = useCallback(() => {
    const idx = TRACK_ORDER.indexOf(trackId);
    const next = TRACK_ORDER[(idx + 1) % TRACK_ORDER.length];
    sound.playHover();
    music.setTrack(next);
    if (!isPlaying) music.start(next);
  }, [trackId, isPlaying]);

  const handleToggleSfx = useCallback(() => {
    const newMuted = !sfxMuted;
    sound.setMuted(newMuted);
    setSfxMuted(newMuted);
    if (!newMuted) sound.playClick();
  }, [sfxMuted]);

  const handleExpandToggle = useCallback(() => {
    if (!sfxMuted) sound.playHover();
    setExpanded((e) => !e);
  }, [sfxMuted]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setMusicVol(val);
    music.setVolume(val);
  }, []);

  const handleSfxVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSfxVol(val);
    sound.setVolume(val);
  }, []);

  const colors = TRACK_COLORS[trackId] || TRACK_COLORS.cyberpunk;
  const track = MUSIC_TRACKS[trackId] || MUSIC_TRACKS.cyberpunk;

  return (
    <>
      <style>{`
        @keyframes eqBar1 { from { height: 3px } to { height: 14px } }
        @keyframes eqBar2 { from { height: 6px } to { height: 11px } }
        @keyframes eqBar3 { from { height: 10px } to { height: 5px } }
        @keyframes eqBar4 { from { height: 4px } to { height: 14px } }
        @keyframes hudPulse {
          0%, 100% { box-shadow: 0 0 12px var(--hud-glow), 0 4px 24px rgba(0,0,0,0.6) }
          50% { box-shadow: 0 0 24px var(--hud-glow), 0 4px 28px rgba(0,0,0,0.7) }
        }
        input[type=range].hud-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 9999px;
          outline: none;
          cursor: pointer;
        }
        input[type=range].hud-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--thumb-color, #00FF66);
          border: 2px solid #0d1612;
          box-shadow: 0 0 10px var(--thumb-color, #00FF66);
          cursor: grab;
          transition: transform 0.1s;
        }
        input[type=range].hud-slider::-webkit-slider-thumb:active {
          cursor: grabbing;
          transform: scale(1.25);
        }
        input[type=range].hud-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--thumb-color, #00FF66);
          border: 2px solid #0d1612;
          box-shadow: 0 0 10px var(--thumb-color, #00FF66);
          cursor: grab;
        }
      `}</style>

      <motion.div
        className="fixed bottom-4 right-4 z-[200] select-none"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 0.5 }}
        style={{ '--hud-glow': colors.glow } as React.CSSProperties}
      >
        {/* Expanded track selector panel */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="mb-2 rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(10,18,12,0.95)',
                backdropFilter: 'blur(24px)',
                border: `1px solid ${colors.accent}44`,
                boxShadow: `0 0 24px ${colors.glow}, 0 8px 32px rgba(0,0,0,0.8)`,
                width: 260,
              }}
            >
              <div className="p-3 space-y-1 max-h-[280px] overflow-y-auto">
                <div className="flex items-center justify-between px-1 mb-2">
                  <p className="text-[10px] font-mono uppercase tracking-widest opacity-50">
                    Select Soundtrack
                  </p>
                  <span className="text-[9px] font-mono" style={{ color: colors.accent }}>
                    {track.bpm} BPM
                  </span>
                </div>

                {TRACK_ORDER.map((tid) => {
                  const t = MUSIC_TRACKS[tid];
                  const tc = TRACK_COLORS[tid];
                  const active = tid === trackId;
                  return (
                    <button
                      key={tid}
                      onClick={() => {
                        sound.playClick();
                        music.setTrack(tid);
                        if (!isPlaying) music.start(tid);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all"
                      style={{
                        background: active ? `${tc.accent}18` : 'transparent',
                        border: active ? `1px solid ${tc.accent}55` : '1px solid transparent',
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          background: tc.accent,
                          boxShadow: active ? `0 0 8px ${tc.accent}` : 'none',
                        }}
                      />
                      <div className="text-left flex-1 min-w-0">
                        <div
                          className="text-xs font-semibold leading-tight truncate"
                          style={{ color: active ? tc.accent : '#FFF8EE' }}
                        >
                          {t.title}
                        </div>
                        <div className="text-[9px] opacity-40 font-mono truncate">{t.genre}</div>
                      </div>
                      {active && <EqBars isPlaying={isPlaying} accent={tc.accent} />}
                    </button>
                  );
                })}
              </div>

              <div
                className="px-3 pb-3 space-y-2.5 border-t"
                style={{ borderColor: `${colors.accent}22` }}
              >
                {/* Music Volume slider */}
                <div className="pt-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[9px] font-mono uppercase tracking-widest opacity-40">
                      Music Volume
                    </span>
                    <span
                      className="text-[9px] font-mono font-bold"
                      style={{ color: colors.accent }}
                    >
                      {Math.round(musicVol * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={musicVol}
                    onChange={handleVolumeChange}
                    className="hud-slider"
                    aria-label="Music Volume"
                    style={{
                      '--thumb-color': colors.accent,
                      background: `linear-gradient(to right, ${colors.accent} ${musicVol * 100}%, rgba(255,255,255,0.12) ${musicVol * 100}%)`,
                    } as React.CSSProperties}
                  />
                  {/* Preset quick buttons */}
                  <div className="flex items-center justify-between gap-1 mt-1.5">
                    {[0.25, 0.5, 0.75, 1.0].map((val) => (
                      <button
                        key={val}
                        onClick={() => {
                          setMusicVol(val);
                          music.setVolume(val);
                        }}
                        className={`flex-1 py-0.5 rounded text-[8px] font-mono transition-all ${
                          Math.abs(musicVol - val) < 0.05
                            ? 'bg-white/20 text-white font-bold'
                            : 'bg-white/5 text-white/40 hover:text-white/80 hover:bg-white/10'
                        }`}
                      >
                        {Math.round(val * 100)}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* SFX Volume slider & toggle */}
                <div className="pt-1.5 border-t border-white/5">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[9px] font-mono uppercase tracking-widest opacity-40">
                      SFX Volume
                    </span>
                    <span
                      className="text-[9px] font-mono font-bold"
                      style={{ color: sfxMuted ? '#ff6666' : colors.accent }}
                    >
                      {sfxMuted ? 'MUTED' : `${Math.round(sfxVol * 100)}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={sfxMuted ? 0 : sfxVol}
                    disabled={sfxMuted}
                    onChange={handleSfxVolumeChange}
                    className="hud-slider"
                    aria-label="SFX Volume"
                    style={{
                      '--thumb-color': sfxMuted ? '#888' : colors.accent,
                      background: sfxMuted
                        ? 'rgba(255,255,255,0.06)'
                        : `linear-gradient(to right, ${colors.accent} ${sfxVol * 100}%, rgba(255,255,255,0.12) ${sfxVol * 100}%)`,
                      opacity: sfxMuted ? 0.4 : 1,
                    } as React.CSSProperties}
                  />

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[9px] font-mono uppercase tracking-widest opacity-40">
                      SFX State
                    </span>
                    <button
                      onClick={handleToggleSfx}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-mono font-bold transition-all active:scale-95"
                      style={{
                        background: sfxMuted ? '#ff444422' : `${colors.accent}22`,
                        color: sfxMuted ? '#ff6666' : colors.accent,
                        border: `1px solid ${sfxMuted ? '#ff444444' : colors.accent + '44'}`,
                      }}
                    >
                      {sfxMuted ? (
                        <><VolumeX size={10} /> SFX MUTED</>
                      ) : (
                        <><Volume2 size={10} /> SFX ACTIVE</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compact pill */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-2xl"
          style={{
            background: 'rgba(10,18,12,0.92)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${colors.accent}44`,
            animation: isPlaying ? 'hudPulse 2.8s ease-in-out infinite' : 'none',
            boxShadow: `0 0 16px ${colors.glow}, 0 4px 20px rgba(0,0,0,0.6)`,
          }}
        >
          <button
            onClick={handleExpandToggle}
            className="flex items-center gap-2 text-left"
            title="Click to view tracks & sound settings"
          >
            <div className="flex items-center" style={{ color: colors.accent }}>
              {isPlaying ? (
                <EqBars isPlaying accent={colors.accent} />
              ) : (
                <Music size={14} style={{ opacity: 0.6 }} />
              )}
            </div>

            <div className="flex flex-col leading-none max-w-[105px]">
              <span
                className="text-[10px] font-semibold truncate"
                style={{ color: colors.accent }}
              >
                {track.title}
              </span>
              <span className="text-[8px] font-mono opacity-35 truncate">{track.genre}</span>
            </div>
          </button>

          <button
            onClick={handleToggle}
            aria-label={isPlaying ? 'Pause music' : 'Play music'}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-sm"
            style={{
              background: isPlaying ? `${colors.accent}22` : colors.accent,
              color: isPlaying ? colors.accent : '#0a120c',
              border: `1px solid ${colors.accent}`,
            }}
          >
            {isPlaying ? <Pause size={10} /> : <Play size={10} className="ml-0.5" />}
          </button>

          <button
            onClick={handleNextTrack}
            aria-label="Next track"
            title="Next soundtrack"
            className="opacity-50 hover:opacity-100 transition-opacity p-1"
            style={{ color: colors.accent }}
          >
            <SkipForward size={13} />
          </button>

          <button
            onClick={handleExpandToggle}
            aria-label={expanded ? 'Collapse soundtrack menu' : 'Expand soundtrack menu'}
            className="opacity-40 hover:opacity-90 transition-opacity p-0.5"
            style={{ color: colors.accent }}
          >
            {expanded ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>
        </div>
      </motion.div>
    </>
  );
}
