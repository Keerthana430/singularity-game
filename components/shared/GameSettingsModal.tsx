'use client';
// components/shared/GameSettingsModal.tsx
// Universal Graphics, Accessibility & Audio Settings Drawer/Modal

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  X,
  Volume2,
  VolumeX,
  Activity,
  Sparkles,
  Zap,
  Sliders,
  RotateCcw,
  Check,
  Shield,
  Eye,
} from 'lucide-react';
import { useGameSettingsStore, FxQuality } from '@/store/gameSettingsStore';
import { sound } from '@/lib/audio';

export function GameSettingsModal() {
  const {
    screenShake,
    fxQuality,
    reducedMotion,
    bloomEnabled,
    hitStopEnabled,
    particlesEnabled,
    sfxVolume,
    musicVolume,
    isMuted,
    settingsModalOpen,
    setScreenShake,
    setFxQuality,
    setReducedMotion,
    setBloomEnabled,
    setHitStopEnabled,
    setParticlesEnabled,
    setSfxVolume,
    setMusicVolume,
    toggleMute,
    setSettingsModalOpen,
    resetDefaults,
  } = useGameSettingsStore();

  // Close on Escape key
  useEffect(() => {
    if (!settingsModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSettingsModalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [settingsModalOpen, setSettingsModalOpen]);

  return (
    <AnimatePresence>
      {settingsModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-lg rounded-3xl bg-[#090D14]/95 border border-cyan-500/30 p-6 sm:p-7 shadow-[0_0_60px_rgba(6,182,212,0.25)] text-white font-mono flex flex-col gap-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  <Sliders size={20} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                    Game Experience & FX
                  </h2>
                  <p className="text-[11px] text-white/50">
                    Graphics Quality & Accessibility Controls
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  sound.playClick();
                  setSettingsModalOpen(false);
                }}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quality Preset Tier */}
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase text-white/70 font-bold flex items-center gap-2">
                <Sparkles size={13} className="text-cyan-400" />
                <span>Graphics Quality Tier</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['ultra', 'high', 'balanced', 'performance'] as FxQuality[]).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => {
                      sound.playClick();
                      setFxQuality(tier);
                    }}
                    className={`py-2 px-2 rounded-xl text-[10px] font-black uppercase transition-all flex flex-col items-center gap-1 border ${
                      fxQuality === tier
                        ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/25'
                    }`}
                  >
                    <span>{tier}</span>
                    <span className="text-[8px] opacity-75">
                      {tier === 'ultra' ? '60 FPS+' : tier === 'high' ? 'Balanced' : tier === 'balanced' ? 'Save GPU' : 'Max FPS'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic FX Toggles */}
            <div className="flex flex-col gap-3">
              <label className="text-xs uppercase text-white/70 font-bold flex items-center gap-2">
                <Activity size={13} className="text-[#00FF66]" />
                <span>Motion & Gameplay Feedback</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Screen Shake */}
                <button
                  onClick={() => {
                    sound.playClick();
                    setScreenShake(!screenShake);
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    screenShake
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                      : 'bg-white/5 border-white/10 text-white/40'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase">Screen Shake</span>
                    <span className="text-[9px] opacity-70">Impact & explosion trauma</span>
                  </div>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${screenShake ? 'bg-emerald-500 text-black border-emerald-400' : 'border-white/20'}`}>
                    {screenShake && <Check size={12} strokeWidth={3} />}
                  </div>
                </button>

                {/* Hit-Stop Impact Freeze */}
                <button
                  onClick={() => {
                    sound.playClick();
                    setHitStopEnabled(!hitStopEnabled);
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    hitStopEnabled
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                      : 'bg-white/5 border-white/10 text-white/40'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase">Impact Hit-Stop</span>
                    <span className="text-[9px] opacity-70">60ms critical freeze frame</span>
                  </div>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${hitStopEnabled ? 'bg-amber-500 text-black border-amber-400' : 'border-white/20'}`}>
                    {hitStopEnabled && <Check size={12} strokeWidth={3} />}
                  </div>
                </button>

                {/* Post-Processing Bloom */}
                <button
                  onClick={() => {
                    sound.playClick();
                    setBloomEnabled(!bloomEnabled);
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    bloomEnabled
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400'
                      : 'bg-white/5 border-white/10 text-white/40'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase">Neon Bloom FX</span>
                    <span className="text-[9px] opacity-70">Volumetric glow & lasers</span>
                  </div>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${bloomEnabled ? 'bg-cyan-500 text-black border-cyan-400' : 'border-white/20'}`}>
                    {bloomEnabled && <Check size={12} strokeWidth={3} />}
                  </div>
                </button>

                {/* Reduced Motion Accessibility */}
                <button
                  onClick={() => {
                    sound.playClick();
                    setReducedMotion(!reducedMotion);
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    reducedMotion
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                      : 'bg-white/5 border-white/10 text-white/40'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase">Reduced Motion</span>
                    <span className="text-[9px] opacity-70">Softer transitions & no shake</span>
                  </div>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${reducedMotion ? 'bg-purple-500 text-white border-purple-400' : 'border-white/20'}`}>
                    {reducedMotion && <Check size={12} strokeWidth={3} />}
                  </div>
                </button>
              </div>
            </div>

            {/* Audio Volume Mixer */}
            <div className="flex flex-col gap-3 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase text-white/70 font-bold flex items-center gap-2">
                  <Volume2 size={13} className="text-cyan-400" />
                  <span>Synthesizer Audio Volumes</span>
                </label>
                <button
                  onClick={() => {
                    sound.playClick();
                    toggleMute();
                  }}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5 border transition-all ${
                    isMuted
                      ? 'bg-red-500/20 border-red-500/40 text-red-400'
                      : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                  <span>{isMuted ? 'UNMUTE ALL' : 'MUTE ALL'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* SFX Volume */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[11px] text-white/60 font-bold">
                    <span>SFX EFFECTS</span>
                    <span>{Math.round(sfxVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={sfxVolume}
                    disabled={isMuted}
                    onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Music Volume */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[11px] text-white/60 font-bold">
                    <span>PROCEDURAL BGM</span>
                    <span>{Math.round(musicVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={musicVolume}
                    disabled={isMuted}
                    onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                    className="w-full accent-[#00FF66] h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <button
                onClick={() => {
                  sound.playClick();
                  resetDefaults();
                }}
                className="text-[10px] text-white/40 hover:text-white flex items-center gap-1.5 transition-colors uppercase font-bold"
              >
                <RotateCcw size={12} />
                <span>Reset Defaults</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setSettingsModalOpen(false);
                }}
                className="px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
              >
                Apply & Save
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Floating Quick Settings HUD Button ────────────────────────────────────
export function GameSettingsButton({ className = '' }: { className?: string }) {
  const { setSettingsModalOpen } = useGameSettingsStore();

  return (
    <button
      onClick={() => {
        sound.playClick();
        setSettingsModalOpen(true);
      }}
      className={`p-2.5 rounded-2xl bg-black/80 backdrop-blur-md border border-white/15 text-white/60 hover:text-cyan-400 hover:border-cyan-400/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center ${className}`}
      title="Open Visual FX & Accessibility Settings"
    >
      <Sliders size={15} />
    </button>
  );
}
