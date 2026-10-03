'use client';
// app/style-guide/page.tsx
// SINGULARITY — Retro-Anime Visual Identity Style Bible
// Interactive showcase of cel-shading, outlines, typography, faction swatches, and quality tiers.

import React, { useState } from 'react';
import Link from 'next/link';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import {
  Shield,
  Crown,
  Sparkles,
  Target,
  AlertTriangle,
  Flame,
  Zap,
  Eye,
  Cpu,
  Layers,
  Check,
  ChevronLeft,
  Sun,
  Moon,
} from 'lucide-react';
import { ToonTestModel } from '@/components/retro/ToonTestModel';
import { AnimeLightingRig, AnimeLightingPreset } from '@/components/retro/ToonShading';
import {
  RetroPanel,
  CRTDisplay,
  HoloButton,
  StatDisplay,
  CyberTypography,
} from '@/components/retro/RetroComponents';
import { WebGLErrorBoundary } from '@/components/shared/WebGLFallback';

export default function StyleGuidePage() {
  // 3D Test Model Interactive Controls
  const [lightingPreset, setLightingPreset] = useState<AnimeLightingPreset>('arena');
  const [toonSteps, setToonSteps] = useState<2 | 3 | 4>(3);
  const [showOutlines, setShowOutlines] = useState(true);
  const [outlineThickness, setOutlineThickness] = useState(0.035);
  const [armorColor, setArmorColor] = useState('#1E293B');
  const [accentColor, setAccentColor] = useState('#00FF66');
  const [qualityTier, setQualityTier] = useState<'high' | 'medium' | 'low'>('high');

  return (
    <div className="min-h-screen bg-[#0A0D0B] text-[#F0F4F1] font-mono p-4 sm:p-8 max-w-7xl mx-auto flex flex-col gap-10">
      {/* ── HEADER NAVIGATION & BANNER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/"
              className="text-xs text-white/50 hover:text-[#00FF66] flex items-center gap-1 transition-colors"
            >
              <ChevronLeft size={14} />
              <span>LAUNCHER</span>
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-xs text-[#00FF66] font-bold uppercase tracking-widest">
              PHASE 1 // STYLE BIBLE
            </span>
          </div>
          <CyberTypography
            title="RETRO-ANIME DIRECTION"
            subTitle="Alternative 1990s Sci-Fi Future Visual Identity Specification"
            japanese="実験的ビジュアル仕様書"
            badge="SYS-REV-01"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-lg bg-black/60 border border-[#00FF66]/30 text-xs text-[#00FF66] font-bold flex items-center gap-2 shadow-[0_0_12px_rgba(0,255,102,0.2)]">
            <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-ping" />
            <span>BRANCH: retro-anime-direction</span>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: INTERACTIVE 3D TOON MODEL TEST LAB ── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#00FF66] font-bold uppercase tracking-widest block font-mono">
              // 3D CEL-SHADING & OUTLINE TEST LAB
            </span>
            <h3
              className="text-lg sm:text-xl font-black uppercase text-white tracking-wider"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              TOON SHADING BENCHMARK MODEL
            </h3>
          </div>
          <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10 text-xs">
            {(['high', 'medium', 'low'] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setQualityTier(tier)}
                className={`px-3 py-1 rounded-lg uppercase text-[10px] font-bold transition-all ${
                  qualityTier === tier
                    ? 'bg-[#00FF66] text-black shadow-[0_0_10px_#00FF66]'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {tier} TIER
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: 3D WebGL Canvas Viewport */}
          <div className="lg:col-span-2 h-[480px] rounded-2xl border border-white/15 bg-[#050906] overflow-hidden relative shadow-[0_0_40px_rgba(0,0,0,0.9)]">
            {/* Viewport Telemetry Overlay */}
            <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none text-[10px] font-mono">
              <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 pointer-events-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse" />
                <span className="text-white/80 font-bold uppercase">MeshToonMaterial + Outlines</span>
              </div>
              <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-white/50 pointer-events-auto">
                <span>LIGHTING: {lightingPreset.toUpperCase()}</span>
                <span>•</span>
                <span>{toonSteps}-TONE STEPS</span>
              </div>
            </div>

            <WebGLErrorBoundary fallbackTitle="StyleGuideToonViewer">
              <Canvas
                shadows={qualityTier !== 'low'}
                dpr={qualityTier === 'high' ? [1, 2] : qualityTier === 'medium' ? 1.5 : 1}
                camera={{ position: [0, 1.2, 3.8], fov: 42 }}
                className="w-full h-full"
              >
                {/* Dedicated Anime 3-Point + Colored Rim Lighting Rig */}
                <AnimeLightingRig
                  preset={lightingPreset}
                  rimIntensity={qualityTier === 'low' ? 1.8 : 2.8}
                  keyIntensity={2.8}
                />

                {/* Benchmark Cel-Shaded Anime Model */}
                <ToonTestModel
                  outlineThickness={outlineThickness}
                  toonSteps={toonSteps}
                  armorColor={armorColor}
                  accentColor={accentColor}
                  showOutlines={showOutlines && qualityTier !== 'low'}
                />

                {/* Soft Contact Shadow beneath pedestal */}
                {qualityTier !== 'low' && (
                  <ContactShadows
                    position={[0, -1.25, 0]}
                    opacity={0.65}
                    scale={5}
                    blur={1.5}
                    far={3}
                  />
                )}

                {/* Controlled Anime Post-Processing */}
                {qualityTier === 'high' && (
                  <EffectComposer multisampling={4}>
                    <Bloom
                      luminanceThreshold={0.85}
                      luminanceSmoothing={0.2}
                      intensity={0.4}
                    />
                  </EffectComposer>
                )}

                <OrbitControls
                  enablePan={false}
                  minDistance={2.0}
                  maxDistance={8.0}
                  maxPolarAngle={Math.PI / 2 + 0.1}
                />
              </Canvas>
            </WebGLErrorBoundary>

            {/* Instruction tooltip */}
            <div className="absolute bottom-3 left-4 z-10 text-[10px] font-mono text-white/40 pointer-events-none">
              <span>DRAG TO ORBIT • SCROLL TO ZOOM</span>
            </div>
          </div>

          {/* Right: Live Tuning Controls for Toon Shading */}
          <RetroPanel title="TOON SHADING CONTROLS" tag="PARAM // TUNE" variant="default" className="flex flex-col gap-4">
            {/* 1. Lighting Rig Preset */}
            <div>
              <label className="text-[10px] text-white/50 uppercase tracking-widest block mb-1.5 font-bold">
                Anime Lighting Preset
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['arena', 'tabletop', 'mountain', 'runway'] as AnimeLightingPreset[]).map((pr) => (
                  <button
                    key={pr}
                    onClick={() => setLightingPreset(pr)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-between ${
                      lightingPreset === pr
                        ? 'bg-[#00FF66] text-black shadow-[0_0_12px_rgba(0,255,102,0.4)]'
                        : 'bg-white/5 hover:bg-white/10 text-white/70'
                    }`}
                  >
                    <span>{pr}</span>
                    {lightingPreset === pr && <Check size={12} />}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Discrete Cel Shading Bands (Steps) */}
            <div>
              <label className="text-[10px] text-white/50 uppercase tracking-widest block mb-1.5 font-bold">
                Stepped Cel Bands (GradientMap)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([2, 3, 4] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setToonSteps(st)}
                    className={`py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                      toonSteps === st
                        ? 'bg-[#00E5FF] text-black shadow-[0_0_12px_rgba(0,229,255,0.4)]'
                        : 'bg-white/5 hover:bg-white/10 text-white/70'
                    }`}
                  >
                    {st}-Tone
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Ink Outline Controls */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] text-white/50 uppercase tracking-widest font-bold">
                  Ink Outlines (Drei &lt;Outlines&gt;)
                </label>
                <button
                  onClick={() => setShowOutlines(!showOutlines)}
                  className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                    showOutlines ? 'bg-[#00FF66]/20 text-[#00FF66]' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {showOutlines ? 'Active' : 'Muted'}
                </button>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.08"
                step="0.005"
                value={outlineThickness}
                onChange={(e) => setOutlineThickness(parseFloat(e.target.value))}
                className="w-full accent-[#00FF66]"
                disabled={!showOutlines}
              />
              <div className="flex justify-between text-[9px] text-white/40 font-mono mt-0.5">
                <span>Hairline (0.01)</span>
                <span>Width: {outlineThickness}</span>
                <span>Bold Anime (0.08)</span>
              </div>
            </div>

            {/* 4. Swatch Palette Tester */}
            <div>
              <label className="text-[10px] text-white/50 uppercase tracking-widest block mb-1.5 font-bold">
                Armor Chassis Tone
              </label>
              <div className="flex items-center gap-2">
                {[
                  { label: 'Slate', hex: '#1E293B' },
                  { label: 'Charcoal', hex: '#0F1713' },
                  { label: 'Mecha White', hex: '#E2E8F0' },
                  { label: 'Cobalt', hex: '#1E3A8A' },
                  { label: 'Crimson', hex: '#881337' },
                ].map((sw) => (
                  <button
                    key={sw.hex}
                    onClick={() => setArmorColor(sw.hex)}
                    style={{ backgroundColor: sw.hex }}
                    className={`w-7 h-7 rounded-lg border-2 transition-transform ${
                      armorColor === sw.hex ? 'border-[#00FF66] scale-110 shadow-lg' : 'border-white/20'
                    }`}
                    title={sw.label}
                  />
                ))}
              </div>
            </div>

            {/* 5. Energy Core Color */}
            <div>
              <label className="text-[10px] text-white/50 uppercase tracking-widest block mb-1.5 font-bold">
                Singularity Core Accent
              </label>
              <div className="flex items-center gap-2">
                {[
                  { label: 'Brand Green', hex: '#00FF66' },
                  { label: 'Cyan', hex: '#00E5FF' },
                  { label: 'Gold', hex: '#FFD600' },
                  { label: 'Magenta', hex: '#D946EF' },
                  { label: 'Violet', hex: '#8B5CF6' },
                ].map((sw) => (
                  <button
                    key={sw.hex}
                    onClick={() => setAccentColor(sw.hex)}
                    style={{ backgroundColor: sw.hex }}
                    className={`w-7 h-7 rounded-lg border-2 transition-transform ${
                      accentColor === sw.hex ? 'border-white scale-110 shadow-lg' : 'border-white/20'
                    }`}
                    title={sw.label}
                  />
                ))}
              </div>
            </div>
          </RetroPanel>
        </div>
      </div>

      {/* ── SECTION 2: FACTION COLOR-BLIND & SYSTEM COMPARISON ── */}
      <div className="flex flex-col gap-4">
        <div>
          <span className="text-[10px] text-[#00FF66] font-bold uppercase tracking-widest block font-mono">
            // PALETTE VALIDATION & COLLISION CHECK
          </span>
          <h3
            className="text-lg sm:text-xl font-black uppercase text-white tracking-wider"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            FACTION PALETTES VS SYSTEM ALERTS
          </h3>
          <p className="text-xs text-white/60 mt-1 max-w-3xl">
            Direct side-by-side verification: Four distinct Ludo factions (each with a unique geometric shape/icon)
            checked against system Brand Green, Warning Amber, and Danger Vermillion to guarantee zero visual collisions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Faction 1: Cobalt Vanguard */}
          <RetroPanel variant="default" className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#2962FF] font-mono">FACTION #01</span>
              <Shield size={18} className="text-[#2962FF]" />
            </div>
            <div className="h-10 rounded-lg bg-[#2962FF] flex items-center justify-center font-black text-white text-xs shadow-[0_0_15px_rgba(41,98,255,0.4)]">
              #2962FF
            </div>
            <h4 className="text-sm font-black uppercase text-white">COBALT VANGUARD</h4>
            <span className="text-[10px] font-mono text-white/50">Silhouette: Hexagon Aegis Shield 🛡️</span>
            <span className="text-[9px] font-mono text-[#2962FF] bg-[#2962FF]/10 px-2 py-0.5 rounded border border-[#2962FF]/30 w-fit">
              Ultramarine Blue
            </span>
          </RetroPanel>

          {/* Faction 2: Solar Aureolin */}
          <RetroPanel variant="default" className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#FFD600] font-mono">FACTION #02</span>
              <Crown size={18} className="text-[#FFD600]" />
            </div>
            <div className="h-10 rounded-lg bg-[#FFD600] flex items-center justify-center font-black text-black text-xs shadow-[0_0_15px_rgba(255,214,0,0.4)]">
              #FFD600
            </div>
            <h4 className="text-sm font-black uppercase text-white">SOLAR AUREOLIN</h4>
            <span className="text-[10px] font-mono text-white/50">Silhouette: Triangle Solar Crown 👑</span>
            <span className="text-[9px] font-mono text-[#FFD600] bg-[#FFD600]/10 px-2 py-0.5 rounded border border-[#FFD600]/30 w-fit">
              Yellow-Gold (Distinct from Amber)
            </span>
          </RetroPanel>

          {/* Faction 3: Astral Void */}
          <RetroPanel variant="default" className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#8B5CF6] font-mono">FACTION #03</span>
              <Sparkles size={18} className="text-[#8B5CF6]" />
            </div>
            <div className="h-10 rounded-lg bg-[#8B5CF6] flex items-center justify-center font-black text-white text-xs shadow-[0_0_15px_rgba(139,92,246,0.4)]">
              #8B5CF6
            </div>
            <h4 className="text-sm font-black uppercase text-white">ASTRAL VOID</h4>
            <span className="text-[10px] font-mono text-white/50">Silhouette: Diamond Quantum Prism 💎</span>
            <span className="text-[9px] font-mono text-[#8B5CF6] bg-[#8B5CF6]/10 px-2 py-0.5 rounded border border-[#8B5CF6]/30 w-fit">
              Deep Neon Violet
            </span>
          </RetroPanel>

          {/* Faction 4: Crimson Nova */}
          <RetroPanel variant="default" className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#F43F5E] font-mono">FACTION #04</span>
              <Target size={18} className="text-[#F43F5E]" />
            </div>
            <div className="h-10 rounded-lg bg-[#F43F5E] flex items-center justify-center font-black text-white text-xs shadow-[0_0_15px_rgba(244,63,94,0.4)]">
              #F43F5E
            </div>
            <h4 className="text-sm font-black uppercase text-white">CRIMSON NOVA</h4>
            <span className="text-[10px] font-mono text-white/50">Silhouette: Target Crosshair 🎯</span>
            <span className="text-[9px] font-mono text-[#F43F5E] bg-[#F43F5E]/10 px-2 py-0.5 rounded border border-[#F43F5E]/30 w-fit">
              Coral Berry (Non-Vermillion)
            </span>
          </RetroPanel>
        </div>

        {/* System Reference Colors Row (The Strict Boundary Checks) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl border border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00FF66] flex-shrink-0 shadow-[0_0_12px_#00FF66]" />
            <div>
              <span className="text-xs font-black uppercase text-[#00FF66] block">BRAND SYSTEM GREEN (#00FF66)</span>
              <span className="text-[10px] text-white/50">Active states, nav indicator, primary CTA</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FF9900] flex-shrink-0 shadow-[0_0_12px_#FF9900]" />
            <div>
              <span className="text-xs font-black uppercase text-[#FF9900] block">WARNING AMBER (#FF9900)</span>
              <span className="text-[10px] text-white/50">Reserved exclusively for cautions & cooldowns</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FF2233] flex-shrink-0 shadow-[0_0_12px_#FF2233]" />
            <div>
              <span className="text-xs font-black uppercase text-[#FF2233] block">DANGER VERMILLION (#FF2233)</span>
              <span className="text-[10px] text-white/50">Reserved exclusively for damage, hits, elimination</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: TYPOGRAPHY HIERARCHY & JAPANESE GLYPH VERIFICATION ── */}
      <div className="flex flex-col gap-4">
        <div>
          <span className="text-[10px] text-[#00FF66] font-bold uppercase tracking-widest block font-mono">
            // TYPOGRAPHY SPECIFICATION (SIL OFL 1.1)
          </span>
          <h3
            className="text-lg sm:text-xl font-black uppercase text-white tracking-wider"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            TYPE SCALE & JAPANESE TELEMETRY
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RetroPanel title="DISPLAY & MONOSPACE SCALE" tag="OFL 1.1" variant="default" className="flex flex-col gap-4">
            <div>
              <span className="text-[10px] text-white/40 block">Display Hero (Orbitron 900)</span>
              <h1 className="text-3xl sm:text-4xl font-black uppercase text-white tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
                SINGULARITY 08
              </h1>
            </div>

            <div>
              <span className="text-[10px] text-white/40 block">Section Header H2 (Orbitron 700)</span>
              <h2 className="text-xl font-bold uppercase text-white" style={{ fontFamily: 'var(--font-display)' }}>
                COLOSSEUM COMBAT PROTOCOL
              </h2>
            </div>

            <div>
              <span className="text-[10px] text-white/40 block">Technical Monospace (JetBrains Mono)</span>
              <p className="text-xs text-white/80 font-mono">
                ARMOR_INTEGRITY: 850/900 HP &bull; COOLDOWN: 2T &bull; BUFFER: OK
              </p>
            </div>
          </RetroPanel>

          <RetroPanel title="JAPANESE TECHNICAL LABELS" tag="Noto Sans JP" variant="default" className="flex flex-col gap-3">
            <p className="text-xs text-white/60">
              Verified military/sci-fi Japanese status glyphs used in machine annotations:
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="font-bold text-white font-jp">システム稼働</span>
                <span className="text-[10px] text-[#00FF66]">System Online</span>
              </div>
              <div className="p-2 rounded bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="font-bold text-white font-jp">戦闘準備完了</span>
                <span className="text-[10px] text-[#00FF66]">Combat Ready</span>
              </div>
              <div className="p-2 rounded bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="font-bold text-white font-jp">防護隔壁展開</span>
                <span className="text-[10px] text-cyan-400">Barrier Shield</span>
              </div>
              <div className="p-2 rounded bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="font-bold text-white font-jp">臨界過負荷</span>
                <span className="text-[10px] text-amber-400">Overdrive</span>
              </div>
              <div className="p-2 rounded bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="font-bold text-white font-jp">緊急修復中</span>
                <span className="text-[10px] text-rose-400">Medbay Regen</span>
              </div>
              <div className="p-2 rounded bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="font-bold text-white font-jp">標的捕捉</span>
                <span className="text-[10px] text-violet-400">Target Lock</span>
              </div>
            </div>
          </RetroPanel>
        </div>
      </div>

      {/* ── SECTION 4: REUSABLE HARDWARE COMPONENTS SHOWCASE ── */}
      <div className="flex flex-col gap-4">
        <div>
          <span className="text-[10px] text-[#00FF66] font-bold uppercase tracking-widest block font-mono">
            // COMPONENT SPECIFICATION
          </span>
          <h3
            className="text-lg sm:text-xl font-black uppercase text-white tracking-wider"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            TACTILE MACHINE CONTROLS & GAUGES
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Button States */}
          <RetroPanel title="HOLO BUTTON SUITE" tag="TACTILE" variant="default" className="flex flex-col gap-3">
            <HoloButton variant="primary" size="md">
              Primary System Action
            </HoloButton>
            <HoloButton variant="cyan" size="md">
              Tactical Analysis
            </HoloButton>
            <HoloButton variant="gold" size="md">
              Victory Claim
            </HoloButton>
            <HoloButton variant="danger" size="md">
              Emergency Override
            </HoloButton>
            <HoloButton variant="secondary" size="md" disabled>
              Locked Protocol (Disabled)
            </HoloButton>
          </RetroPanel>

          {/* CRT Data Screen */}
          <CRTDisplay statusLabel="DIAGNOSTICS" className="h-full flex flex-col justify-between">
            <div className="flex flex-col gap-2 font-mono text-xs">
              <p className="text-[#00FF66] leading-snug">
                &gt; INITIATING RETRO-ANIME GRAPHICS PIPELINE...
              </p>
              <p className="text-white/70 leading-snug">
                &gt; STEPPED GRADIENT MAP: 3-TONE LOADED.
              </p>
              <p className="text-white/70 leading-snug">
                &gt; INK CONTOUR OUTLINES: ACTIVE (0.035).
              </p>
              <p className="text-cyan-300 leading-snug">
                &gt; RIM ILLUMINATION: BACKLIGHT SYNCHRONIZED.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40">
              <span>STATUS: NOMINAL</span>
              <span className="text-[#00FF66]">READY FOR PHASE 2</span>
            </div>
          </CRTDisplay>

          {/* Telemetry Stat Gauges */}
          <RetroPanel title="TELEMETRY GAUGES" tag="METRICS" variant="brand" className="flex flex-col gap-4">
            <StatDisplay label="CHASSIS INTEGRITY (HP)" value={850} max={900} color="#00FF66" unit=" HP" />
            <StatDisplay label="OVERDRIVE ENERGY" value={78} max={100} color="#FFD600" unit="%" />
            <StatDisplay label="TACTICAL SHIELD BARRIER" value={92} max={100} color="#00E5FF" unit="%" />
            <StatDisplay label="SYSTEM CORE THERMAL" value={34} max={100} color="#F43F5E" unit="°C" />
          </RetroPanel>
        </div>
      </div>
    </div>
  );
}
