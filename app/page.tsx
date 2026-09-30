'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ChevronRight,
  Dices,
  Layers,
  Swords,
  Shield,
  Zap,
  Cpu,
  Palette,
  Eye,
  ArrowRight,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { useAvatarStore } from '@/store/avatarStore';
import { AvatarViewer } from '@/components/avatar/AvatarViewer';
import { PRESET_AVATARS } from '@/data/presets';
import { useToast } from '@/components/Toast';

export default function HomePage() {
  const { currentAvatar, randomizeAvatar, updateAvatar } = useAvatarStore();
  const { add: addToast } = useToast();
  const [selectedPresetId, setSelectedPresetId] = useState(PRESET_AVATARS[0].id);

  const handleRandomize = () => {
    randomizeAvatar();
    addToast('Randomized hero avatar!', 'info');
  };

  const handleApplyPreset = (preset: typeof PRESET_AVATARS[0]) => {
    setSelectedPresetId(preset.id);
    updateAvatar({
      body: preset.avatar.body,
      skinTone: preset.avatar.skinTone,
      face: preset.avatar.face,
      hair: preset.avatar.hair,
      hairColor: preset.avatar.hairColor,
      top: preset.avatar.top,
      topColor: preset.avatar.topColor,
      bottom: preset.avatar.bottom,
      bottomColor: preset.avatar.bottomColor,
      shoes: preset.avatar.shoes,
      shoeColor: preset.avatar.shoeColor,
      accessories: preset.avatar.accessories,
      accessoryColor: preset.avatar.accessoryColor,
    });
    addToast(`Loaded ${preset.name} archetype!`, 'success');
  };

  return (
    <div className="relative min-h-screen bg-[#020502] text-white selection:bg-[#00FF66] selection:text-black overflow-x-hidden pt-16">
      {/* Dynamic Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[700px] h-[700px] bg-[#00FF66]/10 rounded-full blur-[170px]" />
        <div className="absolute top-1/3 -right-48 w-[650px] h-[650px] bg-[#39FF14]/8 rounded-full blur-[190px]" />
        <div className="absolute -bottom-32 left-1/3 w-[600px] h-[600px] bg-[#00FF66]/8 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ff6608_1px,transparent_1px),linear-gradient(to_bottom,#00ff6608_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* HERO SECTION */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 flex flex-col gap-6"
          >
            {/* Tagline Badge matching image 2 monospaced style */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#00FF66]/40 bg-[#00FF66]/10 backdrop-blur-md w-fit text-xs font-mono font-black text-[#00FF66]">
              <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
              <span>// D3V_UNKNOWN // SYS_01 // ONLINE</span>
            </div>

            {/* Main Headline with Glitch Effect */}
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.05] uppercase" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              <span className="glitch-text text-white" data-text="BREAK THE GRID.">
                BREAK THE GRID.
              </span> <br />
              <span
                className="bg-clip-text text-transparent neon-green-text"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #FFFFFF 0%, #00FF66 60%, #39FF14 100%)',
                }}
              >
                FORGE CYBER RIG
              </span>
            </h1>

            {/* Paragraph Description */}
            <p className="text-base sm:text-lg text-white/80 leading-relaxed max-w-xl font-mono text-xs sm:text-sm">
              &gt; DESIGN WITHOUT RULES. BUILD WITHOUT LIMITS. <br />
              Construct blocky Roblox-styled avatars procedurally in real-time. Tune gear, head studs, printed expression decals, armor & radiant neon dyes.
            </p>

            {/* Action Buttons with Chamfered Angled Cyber Style */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/studio"
                className="cyber-button flex items-center gap-2 px-8 py-4 text-sm font-black uppercase text-black"
              >
                <Layers size={18} />
                <span>&gt; ENTER STUDIO_</span>
                <ChevronRight size={16} />
              </Link>

              <Link
                href="/lobby"
                className="cyber-button-outline flex items-center gap-2 px-7 py-4 text-sm font-bold uppercase text-[#00FF66]"
              >
                <Swords size={18} />
                <span>[ BATTLE ARENA ]</span>
              </Link>

              <button
                onClick={handleRandomize}
                className="flex items-center gap-2 px-4 py-4 border border-[#00FF66]/30 bg-black/60 hover:bg-[#00FF66]/20 text-[#00FF66] font-mono text-xs transition-all"
                title="Randomize Hero"
              >
                <Dices size={18} />
                <span className="hidden sm:inline">[ RANDOMIZE ]</span>
              </button>
            </div>

            {/* Engine Stat Badges matching Image 1 layout */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-[#00FF66]/20 max-w-md">
              <div className="hud-box p-3 bg-black/50 border border-[#00FF66]/20">
                <p className="text-2xl font-black text-[#00FF66] font-mono">85K+</p>
                <p className="text-[10px] text-white/60 uppercase tracking-widest font-mono">// BUILDS</p>
              </div>
              <div className="hud-box p-3 bg-black/50 border border-[#00FF66]/20">
                <p className="text-2xl font-black text-white font-mono">35K+</p>
                <p className="text-[10px] text-white/60 uppercase tracking-widest font-mono">// BATTLES</p>
              </div>
              <div className="hud-box p-3 bg-black/50 border border-[#00FF66]/20">
                <p className="text-2xl font-black text-[#39FF14] font-mono">45K+</p>
                <p className="text-[10px] text-white/60 uppercase tracking-widest font-mono">// PLAYERS</p>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Interactive 3D Avatar Hero Preview with HUD brackets */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-6 relative flex flex-col items-center"
          >
            {/* Sci-Fi Decorative Frame with L-shaped Corners */}
            <div className="hud-box scanlines relative w-full aspect-[4/5] max-h-[620px] glass-panel glass-panel-chamfer p-2 overflow-hidden border border-[#00FF66]/40 shadow-[0_0_40px_rgba(0,255,102,0.15)]">
              {/* Corner status tag matching image 1 "Current 0.52ETH" style */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/90 px-3 py-1.5 border border-[#00FF66]/40 font-mono text-[11px] text-[#00FF66]">
                <span className="w-2 h-2 bg-[#00FF66] animate-ping" />
                <span>CURRENT RIG &bull; {currentAvatar.name.toUpperCase()}</span>
              </div>

              <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5">
                <Link
                  href="/studio"
                  className="cyber-button px-3 py-1.5 text-xs font-black uppercase text-black"
                >
                  <span>CUSTOMIZE &gt;</span>
                </Link>
              </div>

              {/* 3D Canvas */}
              <div className="w-full h-full overflow-hidden bg-gradient-to-b from-[#041006] via-[#020502] to-[#000000]">
                <AvatarViewer config={currentAvatar} className="w-full h-full" showControls={true} animate={true} />
              </div>

              {/* Bottom Quick Preset Bar matching image 2 footer style */}
              <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between bg-black/90 p-2.5 border border-[#00FF66]/30">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar font-mono">
                  {PRESET_AVATARS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset)}
                      className={`px-3 py-1.5 text-xs font-bold uppercase transition-all whitespace-nowrap ${
                        selectedPresetId === preset.id
                          ? 'bg-[#00FF66] text-black font-black'
                          : 'text-white/60 hover:text-white hover:bg-[#00FF66]/10'
                      }`}
                    >
                      [{preset.name}]
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleRandomize}
                  className="p-2 bg-[#00FF66]/10 hover:bg-[#00FF66] text-[#00FF66] hover:text-black border border-[#00FF66]/40 transition-all ml-2 flex-shrink-0"
                  title="Randomize"
                >
                  <Dices size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CORE FEATURES GRID with Monospace Slash Headers */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-[#00FF66]/20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-mono font-black uppercase tracking-widest text-[#00FF66] mb-2">// ENGINE_SPECIFICATIONS //</p>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            INTERFACE IS THE MESSAGE.
          </h2>
          <p className="text-white/70 mt-3 text-xs sm:text-sm font-mono">
            &gt; Built with zero-fail Three.js procedural primitives, chromashift dyes, and real-time turn-based combat telemetry.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="hud-box glass-panel p-6 border border-[#00FF66]/20 flex flex-col gap-4 group hover:border-[#00FF66] transition-all">
            <div className="w-12 h-12 bg-[#00FF66]/10 border border-[#00FF66]/40 flex items-center justify-center text-[#00FF66]">
              <Cpu size={24} />
            </div>
            <h3 className="text-lg font-black uppercase font-mono text-white group-hover:text-[#00FF66] transition-colors">
              // PROCEDURAL_RIG_MESH
            </h3>
            <p className="text-xs font-mono text-white/70 leading-relaxed">
              Roblox top-stud cylinder head, blocky torso, limbs, and printed facial decals sculpted in 3D runtime without asset lag.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="hud-box glass-panel p-6 border border-[#00FF66]/20 flex flex-col gap-4 group hover:border-[#00FF66] transition-all">
            <div className="w-12 h-12 bg-[#00FF66]/10 border border-[#00FF66]/40 flex items-center justify-center text-[#00FF66]">
              <Palette size={24} />
            </div>
            <h3 className="text-lg font-black uppercase font-mono text-white group-hover:text-[#00FF66] transition-colors">
              // NEON_CHROMASHIFT
            </h3>
            <p className="text-xs font-mono text-white/70 leading-relaxed">
              Cyberpunk neon green (`#00FF66`), obsidian black (`#020502`), and radiant emissive RGB color picker system.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="hud-box glass-panel p-6 border border-[#00FF66]/20 flex flex-col gap-4 group hover:border-[#00FF66] transition-all">
            <div className="w-12 h-12 bg-[#00FF66]/10 border border-[#00FF66]/40 flex items-center justify-center text-[#00FF66]">
              <Swords size={24} />
            </div>
            <h3 className="text-lg font-black uppercase font-mono text-white group-hover:text-[#00FF66] transition-colors">
              // ARENA_TOURNAMENT
            </h3>
            <p className="text-xs font-mono text-white/70 leading-relaxed">
              Deploy custom builds into 8-man arcade battle tournaments with dynamic combat logs and live health telemetry.
            </p>
          </div>
        </div>
      </section>

      {/* ARCHETYPE SHOWCASE SECTION matching Image 2 "SELECTED WORK" layout */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-[#00FF66]/20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-widest text-[#00FF66] mb-2">_SELECTED_ARCHETYPES</p>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              SELECT COMBAT LOADOUT
            </h2>
          </div>
          <Link
            href="/studio"
            className="flex items-center gap-2 text-[#00FF66] hover:underline text-xs font-mono font-bold uppercase tracking-wider"
          >
            <span>&gt; OPEN CUSTOMIZER STUDIO_</span>
            <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRESET_AVATARS.map((preset) => (
            <div
              key={preset.id}
              className="hud-box glass-panel p-5 border border-[#00FF66]/20 flex flex-col justify-between group hover:border-[#00FF66] hover:bg-black/80 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3 font-mono">
                  <span className="text-[10px] uppercase text-black bg-[#00FF66] px-2 py-0.5 font-bold">
                    {preset.role}
                  </span>
                  <span className="text-[10px] text-white/50">[SYS_0{preset.id}]</span>
                </div>
                <h4 className="text-xl font-black uppercase font-mono tracking-wider mb-2 text-white group-hover:text-[#00FF66] transition-colors">
                  {preset.name}
                </h4>
                <p className="text-xs font-mono text-white/60 leading-relaxed mb-6">
                  {preset.tagline}
                </p>
              </div>

              <div className="flex flex-col gap-3 font-mono">
                <div className="flex items-center justify-between text-[10px] text-white/50 border-t border-[#00FF66]/20 pt-3">
                  <span>ARMOR: {preset.avatar.top.toUpperCase()}</span>
                  <span>HAIR: {preset.avatar.hair.toUpperCase()}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApplyPreset(preset)}
                    className="flex-1 py-2 px-3 text-xs font-bold uppercase bg-white/5 hover:bg-[#00FF66] text-white hover:text-black border border-[#00FF66]/30 transition-all text-center"
                  >
                    [PREVIEW]
                  </button>
                  <Link
                    href="/studio"
                    onClick={() => handleApplyPreset(preset)}
                    className="p-2 bg-[#00FF66] text-black hover:bg-white transition-all"
                    title="Edit in Studio"
                  >
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER CALL TO ACTION BANNER matching Image 2 "DESIGN IS REBELLION." */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-[#00FF66]/20">
        <div className="hud-box glass-panel p-8 sm:p-12 border border-[#00FF66]/40 relative overflow-hidden text-center flex flex-col items-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,102,0.1),transparent_70%)] pointer-events-none" />
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight mb-4 relative z-10 font-mono text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            DESIGN IS REBELLION.
          </h2>
          <p className="text-white/80 max-w-xl text-xs sm:text-sm mb-8 relative z-10 font-mono">
            &gt; Build your avatar, customize blocky cosmetics, export rig JSON configs, and dominate the battle arena leaderboard.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 relative z-10">
            <Link
              href="/studio"
              className="cyber-button flex items-center gap-2 px-8 py-4 text-sm font-black uppercase text-black"
            >
              <Sparkles size={18} />
              <span>&gt; LAUNCH AVATAR STUDIO_</span>
            </Link>
            <Link
              href="/avatars"
              className="cyber-button-outline flex items-center gap-2 px-6 py-4 text-sm font-bold uppercase text-[#00FF66]"
            >
              <span>[ VIEW SAVED VAULT ]</span>
            </Link>
          </div>
        </div>
      </section>

      {/* SITE FOOTER with Barcode matching Image 2 */}
      <footer className="border-t border-[#00FF66]/20 bg-[#020502] py-8 text-center text-xs font-mono text-white/50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white">
            <span className="font-bold tracking-widest text-[#00FF66]">// SINGULARITY //</span>
            <span>SYS_VERSION: 2.0.26</span>
          </div>
          <div className="flex items-center gap-4 text-white/60">
            <span>[WORK]</span>
            <span>[ABOUT]</span>
            <span>[EXPERIMENTS]</span>
            <span>[CONTACT]</span>
          </div>
          <div className="text-[10px] text-white/40 tracking-[0.3em] font-mono">
            |||||||||||||||||||| D3V_UNKNOWN_2026
          </div>
        </div>
      </footer>
    </div>
  );
}
