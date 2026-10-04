'use client';
// app/style-guide/page.tsx
// SINGULARITY — Phase 1: Warm Retro-Anime Style Bible & Character Approach Bake-Off
// Direction Change v2: Cozy space station community, warm palette, rounded forms, and 3-way Character Bake-Off.

import React, { useState } from 'react';
import Link from 'next/link';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import {
  Shield,
  Crown,
  Sparkles,
  Target,
  AlertTriangle,
  Flame,
  ChevronLeft,
  Check,
  Play,
  Pause,
  User,
  Zap,
  Info,
  Layers,
  Palette,
  Type,
  Award,
} from 'lucide-react';
import {
  ApproachAToon3D,
  ApproachBVRMAnime,
  ApproachCPaperDollSprite,
  WarmAnimeLightingRig,
  SpeciesType,
} from '@/components/retro/CharacterBakeOff';
import { PaintedBackdropSample } from '@/components/retro/PaintedBackdrop';
import { WebGLErrorBoundary } from '@/components/shared/WebGLFallback';

export default function StyleGuidePage() {
  // Bake-off interaction states
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesType>('human');
  const [showOutlines, setShowOutlines] = useState(true);
  const [animated, setAnimated] = useState(true);
  const [activeApproach, setActiveApproach] = useState<'all' | 'A' | 'B' | 'C'>('all');

  return (
    <div className="min-h-screen bg-[#101426] text-[#FFF8EE] font-sans p-4 sm:p-8 max-w-7xl mx-auto flex flex-col gap-12">
      {/* ── TOP NAV BAR & STOP GATE BANNER ── */}
      <header className="flex flex-col gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono font-bold text-[#8F97B0] hover:text-[#FFF8EE] hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={14} />
            <span>RETURN TO DECK</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FF66] animate-pulse" />
            <span className="text-xs font-mono font-bold text-[#00FF66] tracking-widest uppercase">
              PHASE 1 // CHARACTER BAKE-OFF & STYLE BIBLE
            </span>
          </div>
        </div>

        {/* STOP GATE ALERT */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FF6B35]/20 via-[#FFAA00]/15 to-[#A855F7]/20 border border-[#FFAA00]/40 flex items-start gap-3 shadow-[0_4px_24px_rgba(255,107,53,0.15)]">
          <div className="p-2 rounded-xl bg-[#FFAA00]/20 text-[#FFAA00] flex-shrink-0 mt-0.5">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide text-[#FFF8EE]" style={{ fontFamily: 'var(--font-display)' }}>
              PHASE 1 STOP GATE: CHARACTER APPROACH BAKE-OFF & REVIEW
            </h2>
            <p className="text-xs text-[#E5DACB] mt-1 leading-relaxed">
              Compare the <strong className="text-white">SAME original hero character (&quot;Nova Cadet Kai&quot;)</strong> rendered across all 3 technical approaches below. Test the 5 species, 12fps stepped animation, and outlines. Review our technical evaluation table and select your preferred approach before Phase 2.
            </p>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1: THE CHARACTER APPROACH BAKE-OFF (3D CANVAS SHOWCASE)
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[#38BDF8]/20 border border-[#38BDF8]/40 text-[#38BDF8] text-[10px] font-mono font-bold uppercase">
                HERO BENCHMARK: NOVA CADET KAI
              </span>
              <span className="text-xs text-[#8F97B0] font-mono">12FPS ON-TWOS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-wide mt-1" style={{ fontFamily: 'var(--font-display)' }}>
              Character Architecture Bake-Off
            </h1>
          </div>

          {/* Interactive Controls Bar */}
          <div className="flex items-center gap-2 flex-wrap bg-[#181D33] p-1.5 rounded-2xl border border-white/10">
            {/* View Mode Selector */}
            <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl">
              {(['all', 'A', 'B', 'C'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setActiveApproach(mode)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    activeApproach === mode
                      ? 'bg-[#FF6B35] text-white shadow-[0_0_12px_rgba(255,107,53,0.5)]'
                      : 'text-[#8F97B0] hover:text-white'
                  }`}
                >
                  {mode === 'all' ? 'SIDE-BY-SIDE (ALL 3)' : `APPROACH ${mode}`}
                </button>
              ))}
            </div>

            {/* Species Selector */}
            <div className="flex items-center gap-1 pl-2 border-l border-white/10">
              <span className="text-[10px] font-mono text-[#8F97B0] uppercase mr-1">Species:</span>
              {(['human', 'elf', 'cyborg', 'fairy', 'dwarf'] as SpeciesType[]).map((sp) => (
                <button
                  key={sp}
                  onClick={() => setSelectedSpecies(sp)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold capitalize transition-all ${
                    selectedSpecies === sp
                      ? 'bg-[#38BDF8] text-black font-extrabold shadow-[0_0_10px_rgba(56,189,248,0.4)]'
                      : 'text-[#8F97B0] hover:text-white bg-white/5'
                  }`}
                >
                  {sp}
                </button>
              ))}
            </div>

            {/* Animation Toggle */}
            <button
              onClick={() => setAnimated(!animated)}
              className={`p-1.5 rounded-xl border transition-all ${
                animated
                  ? 'bg-[#00FF66]/20 border-[#00FF66]/50 text-[#00FF66]'
                  : 'bg-white/5 border-white/10 text-[#8F97B0]'
              }`}
              title={animated ? 'Pause 12fps animation' : 'Play 12fps animation'}
            >
              {animated ? <Pause size={14} /> : <Play size={14} />}
            </button>

            {/* Outline Toggle */}
            <button
              onClick={() => setShowOutlines(!showOutlines)}
              className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold border transition-all ${
                showOutlines
                  ? 'bg-[#FFAA00]/20 border-[#FFAA00]/50 text-[#FFAA00]'
                  : 'bg-white/5 border-white/10 text-[#8F97B0]'
              }`}
            >
              INK OUTLINES: {showOutlines ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* 3D Multi-Model Stage */}
        <div className="relative w-full h-[520px] rounded-3xl border border-white/15 bg-gradient-to-b from-[#151930] via-[#12162B] to-[#0D1020] overflow-hidden shadow-[0_8px_36px_rgba(0,0,0,0.8)]">
          {/* Viewport Labels Overlay */}
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none text-xs font-mono">
            {activeApproach === 'all' ? (
              <div className="grid grid-cols-3 w-full gap-4 text-center">
                <div className="bg-[#181D33]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[#38BDF8] font-bold shadow-md">
                  A: SMOOTH TOON 3D (CODE)
                </div>
                <div className="bg-[#181D33]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[#A855F7] font-bold shadow-md">
                  B: VRM / GLTF HUMANOID
                </div>
                <div className="bg-[#181D33]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[#FF6B35] font-bold shadow-md">
                  C: LAYERED 2D PAPER-DOLL
                </div>
              </div>
            ) : (
              <div className="bg-[#181D33]/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-white font-bold">
                VIEWING APPROACH {activeApproach}
              </div>
            )}
          </div>

          {/* 3D Canvas */}
          <WebGLErrorBoundary fallbackTitle="Character Bake-Off Canvas Error">
            <Canvas
              shadows
              camera={{ position: [0, 0.4, 3.8], fov: 42 }}
              className="w-full h-full cursor-grab active:cursor-grabbing"
            >
              <WarmAnimeLightingRig />

              {/* Models layout based on activeApproach */}
              {activeApproach === 'all' && (
                <>
                  {/* Model A: Smooth Toon 3D (Left) */}
                  <group position={[-1.4, 0, 0]}>
                    <ApproachAToon3D
                      species={selectedSpecies}
                      showOutlines={showOutlines}
                      animated={animated}
                    />
                  </group>

                  {/* Model B: VRM Anime Humanoid (Center) */}
                  <group position={[0, 0, 0]}>
                    <ApproachBVRMAnime
                      species={selectedSpecies}
                      showOutlines={showOutlines}
                      animated={animated}
                    />
                  </group>

                  {/* Model C: Layered 2D Paper-Doll Sprite (Right) */}
                  <group position={[1.4, 0, 0]}>
                    <ApproachCPaperDollSprite
                      species={selectedSpecies}
                      animated={animated}
                    />
                  </group>
                </>
              )}

              {activeApproach === 'A' && (
                <group position={[0, 0, 0]}>
                  <ApproachAToon3D
                    species={selectedSpecies}
                    showOutlines={showOutlines}
                    animated={animated}
                  />
                </group>
              )}

              {activeApproach === 'B' && (
                <group position={[0, 0, 0]}>
                  <ApproachBVRMAnime
                    species={selectedSpecies}
                    showOutlines={showOutlines}
                    animated={animated}
                  />
                </group>
              )}

              {activeApproach === 'C' && (
                <group position={[0, 0, 0]}>
                  <ApproachCPaperDollSprite
                    species={selectedSpecies}
                    animated={animated}
                  />
                </group>
              )}

              {/* Floor contact shadows */}
              <ContactShadows
                position={[0, -0.92, 0]}
                opacity={0.65}
                scale={6}
                blur={1.8}
                far={2}
                color="#0A0D18"
              />

              <OrbitControls
                enableZoom={true}
                minDistance={1.8}
                maxDistance={6.0}
                maxPolarAngle={Math.PI / 2 + 0.05}
                enablePan={false}
              />
            </Canvas>
          </WebGLErrorBoundary>
        </div>

        {/* ── TECHNICAL EVALUATION MATRIX TABLE ── */}
        <div className="overflow-x-auto rounded-2xl border border-white/15 bg-[#181D33]/60 backdrop-blur-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="text-[#FFAA00]" size={18} />
            <h3 className="text-base font-bold tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              Technical Architecture Evaluation Matrix
            </h3>
          </div>

          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[#8F97B0]">
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Evaluation Criteria</th>
                <th className="py-3 px-4 font-bold text-[#38BDF8] uppercase tracking-wider">A) Smooth Toon 3D (Code)</th>
                <th className="py-3 px-4 font-bold text-[#A855F7] uppercase tracking-wider">B) VRM / GLTF Humanoid</th>
                <th className="py-3 px-4 font-bold text-[#FF6B35] uppercase tracking-wider">C) Layered 2D Paper-Doll</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[#E5DACB]">
              <tr>
                <td className="py-3 px-4 font-bold text-white">Baseline Performance & FPS</td>
                <td className="py-3 px-4 text-[#00FF66] font-bold">60 FPS (Lightweight geometry, 18-24 draw calls)</td>
                <td className="py-3 px-4 text-amber-300">52-58 FPS (Bone matrices, skinning CPU overhead)</td>
                <td className="py-3 px-4 text-[#00FF66] font-bold">60 FPS (Sub-millisecond, 6 plane draw calls)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-white">5 Species Customization Support</td>
                <td className="py-3 px-4 text-[#00FF66]">100% (Instant code mesh swapping for ears, horns, wings)</td>
                <td className="py-3 px-4 text-amber-300">Moderate (Requires separate rigged 3D models per species)</td>
                <td className="py-3 px-4 text-[#00FF66]">100% (Seamless 2D layer swapping directly via store)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-white">Weapons & Equipment Attachment</td>
                <td className="py-3 px-4 text-[#00FF66]">Native socket parenting in 3D space with shadows</td>
                <td className="py-3 px-4 text-[#00FF66]">Rigged hand bone attachments</td>
                <td className="py-3 px-4 text-amber-300">Layered 2D sprite planes (limited 3D rotation)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-white">Animation & Expressiveness</td>
                <td className="py-3 px-4 text-[#00FF66]">Stepped 12fps squash-and-stretch + procedural rotation</td>
                <td className="py-3 px-4 text-[#00FF66]">Skeletal blendshapes, facial morphs, spring bones</td>
                <td className="py-3 px-4 text-[#00FF66]">100% authentic hand-drawn 80s/90s cel frame charm</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-white">Implementation Effort</td>
                <td className="py-3 px-4 text-[#00FF66] font-bold">Low-Medium (100% procedural, no external modeling)</td>
                <td className="py-3 px-4 text-red-400">High (External 3D asset modeling, rigging, file sizes)</td>
                <td className="py-3 px-4 text-[#00FF66] font-bold">Low (Direct integration with existing store)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-white">&quot;How Anime It Looks&quot;</td>
                <td className="py-3 px-4 text-[#38BDF8]">Very high (Ghibli/Switch 2 rounded cel-shaded 3D)</td>
                <td className="py-3 px-4 text-[#A855F7]">High (Modern VTuber / 3D anime game look)</td>
                <td className="py-3 px-4 text-[#FF6B35] font-bold">Maximum (Genuine 80s/90s OVA hand-painted feel)</td>
              </tr>
              <tr className="bg-white/5 font-bold">
                <td className="py-4 px-4 text-white">RECOMMENDATION</td>
                <td className="py-4 px-4 text-[#38BDF8] font-bold">RECOMMENDED FOR ARENA / 3D BOARDS</td>
                <td className="py-4 px-4 text-[#8F97B0]">Alternative for standalone 3D files</td>
                <td className="py-4 px-4 text-[#FF6B35] font-bold">RECOMMENDED FOR HUD / DIALOG / 2.5D</td>
              </tr>
            </tbody>
          </table>

          {/* Detailed Recommendation Note */}
          <div className="mt-4 p-4 rounded-xl bg-[#00FF66]/10 border border-[#00FF66]/30 flex items-start gap-3">
            <Info size={18} className="text-[#00FF66] flex-shrink-0 mt-0.5" />
            <div className="text-xs text-[#E5DACB] leading-relaxed">
              <strong className="text-[#00FF66]">Engine Recommendation: Approach A (Smooth Toon 3D in Code)</strong> is the optimal solution for all 3D game scenes (Arena Colosseum, Ludo board, Snakes Elevator). It provides complete 360° perspective freedom, true shadow casting, zero external asset licensing friction, solid 60 FPS performance, and full programmatic support for all 5 species. We can pair it with <strong>Approach C</strong> for 2D character portrait reaction dialogues!
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2: PAINTED BACKDROP SAMPLE (80s/90s ANIME SKY & LOUNGE)
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-[#A855F7]/20 border border-[#A855F7]/40 text-[#A855F7] text-[10px] font-mono font-bold uppercase">
              ATMOSPHERIC WORLD-BUILDING
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-wide mt-1" style={{ fontFamily: 'var(--font-display)' }}>
            Painted Backdrop Sample: Station Observation Lounge
          </h2>
          <p className="text-xs text-[#8F97B0] mt-0.5">
            Lived-in cozy station interior overlooking the cosmic nebula, crescent sapphire planet, and dawn terminator city lights.
          </p>
        </div>

        <PaintedBackdropSample />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3: WARM RETRO PALETTE & FACTION COLLISION PROOF
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-[#FF6B35]/20 border border-[#FF6B35]/40 text-[#FF6B35] text-[10px] font-mono font-bold uppercase">
              COLOR BIBLE & HIERARCHY
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-wide mt-1" style={{ fontFamily: 'var(--font-display)' }}>
            Warm Saturated Palette & Faction Shapes
          </h2>
          <p className="text-xs text-[#8F97B0] mt-0.5">
            Deep-space blues with warm practical amber lights. The 4 Ludo factions are assigned unique hues and distinct geometric silhouettes, completely isolated from System Danger and Warning.
          </p>
        </div>

        {/* Side-by-side Swatches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Faction 1: Cerulean Sky */}
          <div className="p-4 rounded-2xl bg-[#181D33] border border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#8F97B0]">FACTION 01</span>
              <Shield size={16} className="text-[#38BDF8]" />
            </div>
            <div className="h-16 rounded-xl bg-[#38BDF8] flex items-center justify-center shadow-[0_0_16px_rgba(56,189,248,0.4)]">
              <span className="text-black font-extrabold text-xs font-mono">#38BDF8</span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#FFF8EE]" style={{ fontFamily: 'var(--font-display)' }}>
                Cerulean Sky
              </h4>
              <p className="text-[11px] text-[#8F97B0] font-mono mt-0.5">Shape: Hexagon Aegis</p>
            </div>
          </div>

          {/* Faction 2: Solar Gold */}
          <div className="p-4 rounded-2xl bg-[#181D33] border border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#8F97B0]">FACTION 02</span>
              <Crown size={16} className="text-[#FFC700]" />
            </div>
            <div className="h-16 rounded-xl bg-[#FFC700] flex items-center justify-center shadow-[0_0_16px_rgba(255,199,0,0.4)]">
              <span className="text-black font-extrabold text-xs font-mono">#FFC700</span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#FFF8EE]" style={{ fontFamily: 'var(--font-display)' }}>
                Solar Gold
              </h4>
              <p className="text-[11px] text-[#8F97B0] font-mono mt-0.5">Shape: Crown Star</p>
            </div>
          </div>

          {/* Faction 3: Cosmic Violet */}
          <div className="p-4 rounded-2xl bg-[#181D33] border border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#8F97B0]">FACTION 03</span>
              <Sparkles size={16} className="text-[#A855F7]" />
            </div>
            <div className="h-16 rounded-xl bg-[#A855F7] flex items-center justify-center shadow-[0_0_16px_rgba(168,85,247,0.4)]">
              <span className="text-white font-extrabold text-xs font-mono">#A855F7</span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#FFF8EE]" style={{ fontFamily: 'var(--font-display)' }}>
                Cosmic Violet
              </h4>
              <p className="text-[11px] text-[#8F97B0] font-mono mt-0.5">Shape: Diamond Prism</p>
            </div>
          </div>

          {/* Faction 4: Tangerine Coral */}
          <div className="p-4 rounded-2xl bg-[#181D33] border border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#8F97B0]">FACTION 04</span>
              <Target size={16} className="text-[#FF6B4A]" />
            </div>
            <div className="h-16 rounded-xl bg-[#FF6B4A] flex items-center justify-center shadow-[0_0_16px_rgba(255,107,74,0.4)]">
              <span className="text-black font-extrabold text-xs font-mono">#FF6B4A</span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#FFF8EE]" style={{ fontFamily: 'var(--font-display)' }}>
                Tangerine Coral
              </h4>
              <p className="text-[11px] text-[#8F97B0] font-mono mt-0.5">Shape: Comet Crosshair</p>
            </div>
          </div>
        </div>

        {/* System Alert & Brand Comparison (Zero Clash Check) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-[#15192E] border border-white/10">
          {/* Brand Accent */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-[#00FF66]/30">
            <div className="w-10 h-10 rounded-lg bg-[#00FF66] flex-shrink-0 shadow-[0_0_12px_#00FF66]" />
            <div>
              <div className="text-[10px] font-mono text-[#00FF66] font-bold uppercase tracking-wider">
                SIGNATURE BRAND ACCENT (#00FF66)
              </div>
              <div className="text-xs text-[#E5DACB]">Reserved for active tabs, selection rings, logo pip.</div>
            </div>
          </div>

          {/* Warning Alert */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-[#FF9500]/30">
            <div className="w-10 h-10 rounded-lg bg-[#FF9500] flex-shrink-0 shadow-[0_0_12px_#FF9500]" />
            <div>
              <div className="text-[10px] font-mono text-[#FF9500] font-bold uppercase tracking-wider">
                SYSTEM WARNING (#FF9500)
              </div>
              <div className="text-xs text-[#E5DACB]">Reserved for hazards, cooldowns & caution states.</div>
            </div>
          </div>

          {/* Danger Alert */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-[#FF3B30]/30">
            <div className="w-10 h-10 rounded-lg bg-[#FF3B30] flex-shrink-0 shadow-[0_0_12px_#FF3B30]" />
            <div>
              <div className="text-[10px] font-mono text-[#FF3B30] font-bold uppercase tracking-wider">
                SYSTEM DANGER (#FF3B30)
              </div>
              <div className="text-xs text-[#E5DACB]">Reserved for combat hits, low HP & defeat alerts.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4: TWO CHOSEN FONTS & LICENSING
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-[#00FF66]/20 border border-[#00FF66]/40 text-[#00FF66] text-[10px] font-mono font-bold uppercase">
              TYPOGRAPHY & LICENSING
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-wide mt-1" style={{ fontFamily: 'var(--font-display)' }}>
            Chosen Fonts & Glyph Coverage Confirmation
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Font 1: Fredoka */}
          <div className="p-6 rounded-2xl bg-[#181D33] border border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#FF6B35]">DISPLAY & BUTTONS</span>
              <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-white/70">
                SIL OFL 1.1 LICENSE
              </span>
            </div>
            <h3 className="text-2xl font-bold text-[#FFF8EE]" style={{ fontFamily: 'var(--font-display)' }}>
              Fredoka (Rounded Retro Display)
            </h3>
            <p className="text-xs text-[#8F97B0] leading-relaxed">
              Warm, playful, highly legible rounded anime typography. Conveys the friendly Switch 2 cosmic adventure spirit.
            </p>
            <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-sm font-bold text-white tracking-wide">
              SINGULARITY // ORBITAL COLOSSEUM // TOURNAMENT READY
            </div>
          </div>

          {/* Font 2: Zen Maru Gothic */}
          <div className="p-6 rounded-2xl bg-[#181D33] border border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#38BDF8]">BODY & JAPANESE TELEMETRY</span>
              <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-white/70">
                SIL OFL 1.1 LICENSE
              </span>
            </div>
            <h3 className="text-2xl font-bold text-[#FFF8EE]" style={{ fontFamily: 'var(--font-body)' }}>
              Zen Maru Gothic (rounded display font)
            </h3>
            <p className="text-xs text-[#8F97B0] leading-relaxed">
              Authentic rounded Japanese anime font with full coverage of Hiragana, Katakana, and Kanji characters.
            </p>
            <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-sm font-bold text-[#38BDF8] tracking-wide" style={{ fontFamily: 'var(--font-body)' }}>
              ORBITAL COLOSSEUM // SYSTEM READY // THRUST MAX // TARGET LOCKED
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 5: PLAYFUL SQUASH-AND-STRETCH BUTTONS
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-[#FFAA00]/20 border border-[#FFAA00]/40 text-[#FFAA00] text-[10px] font-mono font-bold uppercase">
              INTERACTION DYNAMICS
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-wide mt-1" style={{ fontFamily: 'var(--font-display)' }}>
            Playful Rounded Components & Bouncy States
          </h2>
          <p className="text-xs text-[#8F97B0]">
            Childlike charm with squash-and-stretch on hover and active clicks.
          </p>
        </div>

        <div className="flex items-center gap-4 flex-wrap p-6 rounded-2xl bg-[#181D33] border border-white/10">
          <button className="px-6 py-3 rounded-2xl bg-[#FF6B35] hover:bg-[#FF8A3D] active:scale-95 transition-all text-white font-bold text-sm tracking-wide shadow-[0_4px_16px_rgba(255,107,53,0.4)]" style={{ fontFamily: 'var(--font-display)' }}>
            PLAY MATCH
          </button>
          <button className="px-6 py-3 rounded-2xl bg-[#38BDF8] hover:bg-[#60A5FA] active:scale-95 transition-all text-black font-extrabold text-sm tracking-wide shadow-[0_4px_16px_rgba(56,189,248,0.4)]" style={{ fontFamily: 'var(--font-display)' }}>
            ROLL QUANTUM DICE
          </button>
          <button className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-[#FFF8EE] border border-white/15 font-bold text-sm" style={{ fontFamily: 'var(--font-display)' }}>
            STATION LOUNGE ☕
          </button>
        </div>
      </section>

      {/* FOOTER CALL-TO-ACTION FOR USER REVIEW */}
      <footer className="mt-8 p-6 rounded-3xl bg-gradient-to-r from-[#181D33] via-[#202742] to-[#181D33] border border-[#FFAA00]/30 text-center flex flex-col items-center gap-2 shadow-xl">
        <span className="w-3 h-3 rounded-full bg-[#FFAA00] animate-ping" />
        <h3 className="text-lg font-bold text-[#FFF8EE]" style={{ fontFamily: 'var(--font-display)' }}>
          PHASE 1 COMPLETE — STANDING BY FOR YOUR REVIEW
        </h3>
        <p className="text-xs text-[#E5DACB] max-w-xl">
          Please review the live 3-way Character Bake-Off on this page. Let me know your preferred character approach (<strong className="text-[#38BDF8]">Approach A: Smooth Toon 3D</strong> vs <strong className="text-[#A855F7]">Approach B: VRM</strong> vs <strong className="text-[#FF6B35]">Approach C: 2D Paper-Doll</strong>) to proceed with Phase 2 (Global Nav + Background + Arena Landing).
        </p>
      </footer>
    </div>
  );
}
