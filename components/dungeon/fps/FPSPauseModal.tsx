// components/dungeon/fps/FPSPauseModal.tsx
// FPS Settings & In-Game Pause Screen with Sensitivity, Screen Shake, and FOV controls

import React from 'react';
import { Play, RotateCcw, Volume2, Sliders, X, Eye, ShieldAlert } from 'lucide-react';
import { FPSSettings } from './types';

interface FPSPauseModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: FPSSettings;
  onUpdateSettings: (newSettings: Partial<FPSSettings>) => void;
  onRestart: () => void;
  onAbandon: () => void;
}

export function FPSPauseModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onRestart,
  onAbandon,
}: FPSPauseModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-md font-mono">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-[#00FF66]/30 bg-[#07120C] p-6 shadow-[0_0_60px_rgba(0,255,102,0.18)] text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-[#00FF66]" />
            <h2 className="text-lg font-black uppercase tracking-wider">Tactical Pause</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 p-1.5 text-white/50 hover:border-[#00FF66]/60 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Settings Form */}
        <div className="mt-5 space-y-4 text-xs">
          {/* Mouse Sensitivity */}
          <div>
            <div className="flex justify-between text-white/70 mb-1">
              <span>Mouse Sensitivity</span>
              <span className="text-[#00FF66] font-bold">
                {Math.round(settings.mouseSensitivity * 10000) / 10}
              </span>
            </div>
            <input
              type="range"
              min="0.0008"
              max="0.0050"
              step="0.0002"
              value={settings.mouseSensitivity}
              onChange={(e) => onUpdateSettings({ mouseSensitivity: parseFloat(e.target.value) })}
              className="w-full accent-[#00FF66]"
            />
          </div>

          {/* Field of View */}
          <div>
            <div className="flex justify-between text-white/70 mb-1">
              <span className="flex items-center gap-1">
                <Eye size={12} /> Field of View (FOV)
              </span>
              <span className="text-[#00FF66] font-bold">{settings.fov || 75}°</span>
            </div>
            <input
              type="range"
              min="65"
              max="90"
              step="1"
              value={settings.fov || 75}
              onChange={(e) => onUpdateSettings({ fov: parseInt(e.target.value, 10) })}
              className="w-full accent-[#00FF66]"
            />
          </div>

          {/* Screen Shake Toggle */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-white/70">Screen Shake Feedback</span>
            <button
              onClick={() => onUpdateSettings({ screenShake: !settings.screenShake })}
              className={`rounded-lg border px-3 py-1 font-bold uppercase transition-colors ${
                settings.screenShake
                  ? 'border-[#00FF66] bg-[#00FF66]/20 text-[#00FF66]'
                  : 'border-white/20 bg-black/40 text-white/40'
              }`}
            >
              {settings.screenShake ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          {/* Invert Y Toggle */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-white/70">Invert Y Axis</span>
            <button
              onClick={() => onUpdateSettings({ invertY: !settings.invertY })}
              className={`rounded-lg border px-3 py-1 font-bold uppercase transition-colors ${
                settings.invertY
                  ? 'border-[#00FF66] bg-[#00FF66]/20 text-[#00FF66]'
                  : 'border-white/20 bg-black/40 text-white/40'
              }`}
            >
              {settings.invertY ? 'INVERTED' : 'NORMAL'}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-7 space-y-2 border-t border-white/10 pt-5">
          <button
            onClick={onClose}
            className="w-full neon-green-button py-2.5 rounded-xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2"
          >
            <Play size={14} /> Resume Mission
          </button>
          <button
            onClick={onRestart}
            className="w-full py-2.5 rounded-xl border border-white/15 hover:border-white/40 bg-black/40 font-bold uppercase text-xs flex items-center justify-center gap-2"
          >
            <RotateCcw size={14} /> Restart Descent
          </button>
          <button
            onClick={onAbandon}
            className="w-full py-2.5 rounded-xl border border-rose-500/30 hover:border-rose-500 text-rose-400 bg-rose-500/10 font-bold uppercase text-xs flex items-center justify-center gap-2"
          >
            <ShieldAlert size={14} /> Abandon Run
          </button>
        </div>
      </div>
    </div>
  );
}
