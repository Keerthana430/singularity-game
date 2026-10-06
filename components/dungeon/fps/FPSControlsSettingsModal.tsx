// components/dungeon/fps/FPSControlsSettingsModal.tsx
// Professional, High-End AAA Operative Controls & System Calibration Modal
// Features tactile keycap styling, categorized keybindings, and fully configurable mouse/FOV/audio tuning

import React, { useState } from 'react';
import {
  Keyboard,
  Sliders,
  Volume2,
  X,
  Crosshair,
  Shield,
  Eye,
  RotateCcw,
  Check,
  MousePointer,
  Sparkles,
  Zap,
} from 'lucide-react';
import { sound, music } from '@/lib/audio';
import { FPSSettings } from './types';

interface FPSControlsSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: FPSSettings;
  onUpdateSettings: (newSettings: Partial<FPSSettings>) => void;
}

type ModalTab = 'controls' | 'tuning' | 'audio';

export function FPSControlsSettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}: FPSControlsSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('controls');
  const [reticleColor, setReticleColor] = useState<string>('#00FF66');

  if (!isOpen) return null;

  const handleResetDefaults = () => {
    sound.playClick();
    onUpdateSettings({
      mouseSensitivity: 0.0022,
      fov: 75,
      screenShake: true,
      invertY: false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-6 backdrop-blur-xl font-mono select-none">
      <div className="relative flex flex-col h-[85vh] max-h-[720px] w-full max-w-3xl rounded-3xl border border-[#00FF66]/30 bg-[#050e08]/95 p-6 sm:p-8 text-white shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Decorative Corner Accents */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#00FF66] pointer-events-none" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#00FF66] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#00FF66] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#00FF66] pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border border-[#00FF66]/30 bg-[#00FF66]/10 text-[#00FF66] shadow-[0_0_15px_rgba(0,255,102,0.2)]">
              <Keyboard size={20} />
            </div>
            <div>
              <span className="text-[10px] font-black tracking-[0.25em] uppercase text-[#00FF66] block">
                SYSTEM CALIBRATION // OPERATIVE INTERFACE
              </span>
              <h2 className="text-xl font-black uppercase text-white tracking-wide">
                CONTROLS & SETTINGS
              </h2>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="rounded-xl border border-white/10 p-2 text-white/50 hover:border-[#00FF66]/60 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 pt-4 pb-4 border-b border-white/10">
          {[
            { key: 'controls' as ModalTab, label: 'KEYBINDINGS & COMBAT', icon: Keyboard },
            { key: 'tuning' as ModalTab, label: 'SENSITIVITY & TUNING', icon: Sliders },
            { key: 'audio' as ModalTab, label: 'AUDIO & RETICLE', icon: Volume2 },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => {
                sound.playClick();
                setActiveTab(key);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === key
                  ? 'bg-[#00FF66] text-black shadow-[0_0_20px_rgba(0,255,102,0.4)]'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.05] border border-white/5'
              }`}
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto py-5 space-y-5 pr-2">
          {/* ─── TAB 1: KEYBINDINGS & COMBAT ──────────────────────────────── */}
          {activeTab === 'controls' && (
            <div className="space-y-5">
              {/* Locomotion */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#00FF66] block">
                  LOCOMOTION & EVASION
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-white/70">Movement & Tactical Strafing</span>
                    <div className="flex items-center gap-1.5">
                      {['W', 'A', 'S', 'D'].map((k) => (
                        <kbd
                          key={k}
                          className="px-2.5 py-1 rounded-lg bg-[#0e2417] border border-[#00FF66]/30 text-[#00FF66] font-mono font-bold text-xs shadow-inner"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-white/70">Sprint / Tactical Dash (Stamina)</span>
                    <kbd className="px-3 py-1 rounded-lg bg-[#0e2417] border border-[#00FF66]/30 text-[#00FF66] font-mono font-bold text-xs">
                      SHIFT
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-white/70">Jump / Obstacle Evade</span>
                    <kbd className="px-4 py-1 rounded-lg bg-[#0e2417] border border-[#00FF66]/30 text-[#00FF66] font-mono font-bold text-xs">
                      SPACE
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Combat & Weaponry */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 block">
                  COMBAT & WEAPONRY
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-white/70">Primary Weapon Fire</span>
                    <span className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-white font-bold text-xs">
                      LEFT CLICK
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex flex-col">
                      <span className="text-white/70">3.5x Precision Optical Scope</span>
                      <span className="text-[10px] text-cyan-300 font-sans">
                        Pinpoint spread + high magnification zoom
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <kbd className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-400/30 text-cyan-300 font-mono font-bold text-xs">
                        Q
                      </kbd>
                      <span className="text-white/40 text-[10px]">or</span>
                      <span className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-400/30 text-cyan-300 font-bold text-xs">
                        RIGHT CLICK
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-white/70">Tactical Reload Magazine</span>
                    <kbd className="px-3 py-1 rounded-lg bg-[#0e2417] border border-[#00FF66]/30 text-[#00FF66] font-mono font-bold text-xs">
                      R
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-white/70">Select Hotbar Slot (1 to 5)</span>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <kbd
                          key={s}
                          className="px-2 py-0.5 rounded-lg bg-white/10 border border-white/20 text-white font-mono font-bold text-xs"
                        >
                          {s}
                        </kbd>
                      ))}
                      <span className="text-white/40 text-[10px] ml-1">or WHEEL</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tactical & Survival */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                  SCAVENGE & EXTRACTION
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex flex-col">
                      <span className="text-white/70">Pick Up Loot / Hold to Channel Extraction</span>
                      <span className="text-[10px] text-amber-300/80 font-sans">
                        Press [E] to collect drop, or hold 2.5s inside extraction circle
                      </span>
                    </div>
                    <kbd className="px-3 py-1 rounded-lg bg-amber-950/60 border border-amber-400/30 text-amber-300 font-mono font-bold text-xs">
                      E
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex flex-col">
                      <span className="text-white/70">5-Second Vital Auto-Refill</span>
                      <span className="text-[10px] text-white/50 font-sans">
                        Avoid damage for 5s: HP refills at 45/s, then Shield regenerates to full
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] uppercase">
                      AUTOMATIC PASSIVE
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-white/70">Tactical Pause & Calibration</span>
                    <kbd className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/20 text-white font-mono font-bold text-xs">
                      ESC
                    </kbd>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 2: CONFIGURABLE SENSITIVITY & TUNING ─────────────────── */}
          {activeTab === 'tuning' && (
            <div className="space-y-5">
              {/* Mouse Sensitivity */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white flex items-center gap-2">
                    <MousePointer size={14} className="text-[#00FF66]" /> Mouse Aim Sensitivity
                  </span>
                  <span className="text-[#00FF66] font-mono font-bold text-sm">
                    {(settings.mouseSensitivity * 1000).toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0008"
                  max="0.0050"
                  step="0.0002"
                  value={settings.mouseSensitivity}
                  onChange={(e) =>
                    onUpdateSettings({ mouseSensitivity: parseFloat(e.target.value) })
                  }
                  className="w-full accent-[#00FF66] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-white/40">
                  <span>Slow (0.8)</span>
                  <span>Default (2.2)</span>
                  <span>Fast (5.0)</span>
                </div>

                {/* Preset Sensitivity Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  {[
                    { label: 'LOW (1.2)', val: 0.0012 },
                    { label: 'BALANCED (2.2)', val: 0.0022 },
                    { label: 'HIGH (3.4)', val: 0.0034 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() => {
                        sound.playClick();
                        onUpdateSettings({ mouseSensitivity: p.val });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        Math.abs(settings.mouseSensitivity - p.val) < 0.0003
                          ? 'bg-[#00FF66]/20 border border-[#00FF66] text-[#00FF66]'
                          : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field of View (FOV) */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Eye size={14} className="text-cyan-400" /> Field of View (FOV)
                  </span>
                  <span className="text-cyan-300 font-mono font-bold text-sm">
                    {settings.fov || 75}°
                  </span>
                </div>
                <input
                  type="range"
                  min="65"
                  max="90"
                  step="1"
                  value={settings.fov || 75}
                  onChange={(e) => onUpdateSettings({ fov: parseInt(e.target.value, 10) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-white/40">
                  <span>Narrow (65°)</span>
                  <span>Tactical (75°)</span>
                  <span>Wide Angle (90°)</span>
                </div>
              </div>

              {/* Screen Shake & Invert Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">Impact Screen Shake</span>
                    <span className="text-[10px] text-white/50">Recoil & hit feedback</span>
                  </div>
                  <button
                    onClick={() => {
                      sound.playClick();
                      onUpdateSettings({ screenShake: !settings.screenShake });
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer ${
                      settings.screenShake
                        ? 'bg-[#00FF66]/20 border border-[#00FF66] text-[#00FF66]'
                        : 'bg-black/50 border border-white/20 text-white/40'
                    }`}
                  >
                    {settings.screenShake ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">Invert Vertical Look</span>
                    <span className="text-[10px] text-white/50">Invert Y-Axis mouse pitch</span>
                  </div>
                  <button
                    onClick={() => {
                      sound.playClick();
                      onUpdateSettings({ invertY: !settings.invertY });
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer ${
                      settings.invertY
                        ? 'bg-[#00FF66]/20 border border-[#00FF66] text-[#00FF66]'
                        : 'bg-black/50 border border-white/20 text-white/40'
                    }`}
                  >
                    {settings.invertY ? 'INVERTED' : 'NORMAL'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 3: AUDIO & HUD RETICLE ───────────────────────────────── */}
          {activeTab === 'audio' && (
            <div className="space-y-5">
              {/* Audio Volume Sliders */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#00FF66] block">
                  AUDIO CHANNELS
                </span>

                <div>
                  <div className="flex justify-between items-center text-xs text-white/70 mb-1">
                    <span>Sound Effects (SFX & Firearms)</span>
                    <span className="text-[#00FF66] font-bold">100%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    defaultValue="1"
                    onChange={(e) => sound.setVolume(parseFloat(e.target.value))}
                    className="w-full accent-[#00FF66] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs text-white/70 mb-1">
                    <span>Ambient Dungeon Music</span>
                    <span className="text-cyan-300 font-bold">75%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    defaultValue="0.75"
                    onChange={(e) => music.setVolume(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Reticle Color Calibration */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                  HUD CROSSHAIR COLOR CALIBRATION
                </span>
                <p className="text-xs text-white/60 font-sans">
                  Select your combat reticle hue for maximum visibility across dark ruin corridors:
                </p>

                <div className="flex items-center gap-3 pt-2">
                  {[
                    { color: '#00FF66', name: 'Emerald Cyber' },
                    { color: '#38BDF8', name: 'Azure Beam' },
                    { color: '#F59E0B', name: 'Solar Amber' },
                    { color: '#F43F5E', name: 'Crimson Laser' },
                  ].map((r) => (
                    <button
                      key={r.color}
                      onClick={() => {
                        sound.playClick();
                        setReticleColor(r.color);
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        reticleColor === r.color
                          ? 'border-white bg-white/10 text-white shadow-lg'
                          : 'border-white/10 bg-black/40 text-white/50 hover:text-white'
                      }`}
                    >
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: r.color }}
                      />
                      <span>{r.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-white/10 pt-4 flex items-center justify-between">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/15 bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/10 text-xs font-bold transition-colors cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>RESET DEFAULTS</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00FF66] to-[#00CC55] text-black font-black text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(0,255,102,0.5)] transition-all cursor-pointer"
          >
            <Check size={14} />
            <span>SAVE & APPLY</span>
          </button>
        </div>
      </div>
    </div>
  );
}
