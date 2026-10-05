'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Swords, Shield, Trophy, RotateCcw, Dices, Sparkles, Zap, Heart, Flame } from 'lucide-react';
import { useAvatarStore } from '@/store/avatarStore';
import { AvatarViewer } from '@/components/avatar/AvatarViewer';
import { PRESET_AVATARS } from '@/data/presets';
import { calculateAvatarStats } from '@/lib/statsCalculator';
import { sound } from '@/lib/audio';
import { useToast } from '@/components/Toast';

type ActionType = 'idle' | 'attack' | 'hit' | 'defend' | 'victory';

export function InteractiveHeroStage() {
  const { currentAvatar, updateAvatar, randomizeAvatar } = useAvatarStore();
  const { add: addToast } = useToast();
  const [currentAction, setCurrentAction] = useState<ActionType>('idle');
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Compute live stats for current avatar
  const stats = useMemo(() => calculateAvatarStats(currentAvatar), [currentAvatar]);

  // Card 3D tilt tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    // Subtle rotation limits (-7deg to +7deg)
    const rotateX = ((centerY - y) / centerY) * 6;
    const rotateY = ((x - centerX) / centerX) * 6;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const handleAction = (action: ActionType) => {
    setCurrentAction(action);
    if (action === 'attack') {
      sound.playSlash();
      setTimeout(() => sound.playImpact(), 80);
      addToast('Hero executed Strike action!', 'info');
    } else if (action === 'victory') {
      sound.playWin();
      addToast('Victory pose unlocked!', 'success');
    } else if (action === 'defend') {
      sound.playShieldBlock();
      addToast('Defensive stance active', 'info');
    } else {
      sound.playClick();
    }

    // Auto reset to idle after 1.8s if attack or victory
    if (action !== 'idle') {
      setTimeout(() => {
        setCurrentAction('idle');
      }, 2000);
    }
  };

  const handleSelectPreset = (presetId: string) => {
    const preset = PRESET_AVATARS.find((p) => p.id === presetId);
    if (preset) {
      updateAvatar(preset.avatar);
      sound.playEquip();
      addToast(`Equipped ${preset.name} (${preset.role})`, 'success');
    }
  };

  const handleRandomHero = () => {
    randomizeAvatar();
    sound.playRandomize();
    addToast('Randomized hero equipment and palette!', 'info');
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="w-full flex flex-col items-center transition-transform duration-200 ease-out"
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
      }}
    >
      {/* Main 3D Hero Window */}
      <div className="relative w-full aspect-[4/5] max-h-[580px] rounded-3xl p-3.5 overflow-hidden border-2 border-[#8C6239] bg-gradient-to-b from-[#18291F] via-[#101F16] to-[#0A140E] shadow-[0_16px_55px_rgba(0,0,0,0.85)] group">
        {/* Dynamic Glowing Border Shimmer */}
        <div className="absolute inset-0 rounded-3xl border border-[#00FF66]/25 pointer-events-none" />

        {/* Top Left Status Tag */}
        <div className="absolute top-5 left-5 z-20 flex items-center gap-2 bg-[#2B1B12]/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#8C6239] text-xs font-bold text-[#FDE68A] shadow-lg">
          <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse shadow-[0_0_8px_#00FF66]" />
          <span>RIG: {currentAvatar.name.toUpperCase()}</span>
          <span className="text-[10px] text-white/40 uppercase font-mono">[{stats.className}]</span>
        </div>

        {/* Top Right Customize Button */}
        <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
          <Link
            href="/studio"
            onClick={() => sound.playClick()}
            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#00FF66] to-[#00CC52] text-black text-xs font-black uppercase tracking-wider hover:brightness-110 transition-all shadow-[0_0_15px_rgba(0,255,102,0.4)] flex items-center gap-1.5"
          >
            <span>OUTFIT STUDIO &gt;</span>
          </Link>
        </div>

        {/* 3D Canvas Viewport */}
        <div className="w-full h-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#14231B] via-[#0E1A14] to-[#0A120E] relative">
          <AvatarViewer
            config={currentAvatar}
            className="w-full h-full"
            showControls={true}
            animate={true}
            action={currentAction}
          />

          {/* Interactive Floating Action Pose Bar Over Canvas */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#00FF66]/30 shadow-xl">
            <span className="text-[9px] font-mono uppercase text-[#00FF66] font-bold pr-1">POSE:</span>
            <button
              onClick={() => handleAction('attack')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all ${
                currentAction === 'attack'
                  ? 'bg-[#EF4444] text-white shadow-[0_0_12px_#EF4444]'
                  : 'bg-white/10 hover:bg-[#EF4444]/30 text-white/80'
              }`}
              title="Trigger Weapon Attack Animation"
            >
              <Swords size={12} />
              <span>Strike</span>
            </button>

            <button
              onClick={() => handleAction('defend')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all ${
                currentAction === 'defend'
                  ? 'bg-[#38BDF8] text-black shadow-[0_0_12px_#38BDF8]'
                  : 'bg-white/10 hover:bg-[#38BDF8]/30 text-white/80'
              }`}
              title="Trigger Shield Stance"
            >
              <Shield size={12} />
              <span>Defend</span>
            </button>

            <button
              onClick={() => handleAction('victory')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all ${
                currentAction === 'victory'
                  ? 'bg-[#F59E0B] text-black shadow-[0_0_12px_#F59E0B]'
                  : 'bg-white/10 hover:bg-[#F59E0B]/30 text-white/80'
              }`}
              title="Trigger Victory Cheer"
            >
              <Trophy size={12} />
              <span>Cheer</span>
            </button>

            <button
              onClick={() => handleAction('idle')}
              className={`px-2 py-1 rounded-full text-[10px] font-mono uppercase text-white/50 hover:text-white transition-all ${
                currentAction === 'idle' ? 'text-[#00FF66] font-bold' : ''
              }`}
              title="Reset to Idle Float"
            >
              <RotateCcw size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Hero Quick-Select Switcher & Live Stats HUD */}
      <div className="w-full mt-4 space-y-3">
        {/* Preset Archetype Chips */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase text-[#00FF66] font-bold tracking-widest pl-1">
              ARCHETYPES:
            </span>
            {PRESET_AVATARS.slice(0, 3).map((preset) => {
              const isActive = currentAvatar.name.toLowerCase() === preset.name.toLowerCase();
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase transition-all flex items-center gap-1.5 border ${
                    isActive
                      ? 'bg-[#00FF66] text-[#05120B] border-[#33FF88] shadow-[0_0_12px_rgba(0,255,102,0.4)]'
                      : 'bg-[#18261E]/80 border-white/10 text-white/70 hover:border-[#00FF66]/50 hover:text-white'
                  }`}
                >
                  <Sparkles size={11} className={isActive ? 'text-[#05120B]' : 'text-[#00FF66]'} />
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleRandomHero}
            className="px-3 py-1.5 rounded-full text-xs font-bold uppercase bg-[#D97706]/20 border border-[#F59E0B]/40 text-[#F59E0B] hover:bg-[#D97706]/40 transition-all flex items-center gap-1.5 shrink-0"
            title="Randomize Hero Gear & Colors"
          >
            <Dices size={13} />
            <span>Randomize</span>
          </button>
        </div>

        {/* Live Combat Telemetry HUD Matrix */}
        <div className="p-3.5 rounded-2xl border border-[#00FF66]/20 bg-[#0C1A12]/90 backdrop-blur-md grid grid-cols-4 gap-2 text-center shadow-lg">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-[10px] font-mono uppercase text-white/50">
              <Flame size={11} className="text-[#EF4444]" />
              <span>ATK</span>
            </div>
            <span className="text-sm font-black text-white mt-0.5">{stats.power}</span>
            <div className="w-full h-1 bg-black/50 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#EF4444] to-[#F59E0B] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (stats.power / 280) * 100)}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-[10px] font-mono uppercase text-white/50">
              <Shield size={11} className="text-[#38BDF8]" />
              <span>DEF</span>
            </div>
            <span className="text-sm font-black text-white mt-0.5">{stats.defense}</span>
            <div className="w-full h-1 bg-black/50 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#38BDF8] to-[#00FF66] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (stats.defense / 250) * 100)}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-[10px] font-mono uppercase text-white/50">
              <Zap size={11} className="text-[#FBBF24]" />
              <span>SPD</span>
            </div>
            <span className="text-sm font-black text-white mt-0.5">{stats.agility}</span>
            <div className="w-full h-1 bg-black/50 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (stats.agility / 180) * 100)}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-[10px] font-mono uppercase text-white/50">
              <Heart size={11} className="text-[#34D399]" />
              <span>HP</span>
            </div>
            <span className="text-sm font-black text-white mt-0.5">{stats.maxHp}</span>
            <div className="w-full h-1 bg-black/50 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#34D399] to-[#00FF66] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (stats.maxHp / 950) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
