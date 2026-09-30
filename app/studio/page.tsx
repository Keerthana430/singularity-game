'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  RotateCcw,
  Undo2,
  Redo2,
  Dices,
  Save,
  Download,
  Share2,
  Sparkles,
  Camera,
  Check,
  Copy,
  Layers,
  Settings2,
  Sliders,
  Maximize2
} from 'lucide-react';
import { useAvatarStore } from '@/store/avatarStore';
import { AvatarViewer } from '@/components/avatar/AvatarViewer';
import { CategoryTabs } from '@/components/studio/CategoryTabs';
import { CustomizationPanel } from '@/components/studio/CustomizationPanel';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { sound } from '@/lib/audio';
import { PRESET_AVATARS } from '@/data/presets';

export default function StudioPage() {
  const {
    currentAvatar,
    history,
    historyIndex,
    updateAvatar,
    randomizeAvatar,
    resetAvatar,
    saveAvatar,
    undo,
    redo,
    activeCategory,
    updateAccessories,
  } = useAvatarStore();

  const { add: addToast } = useToast();
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [avatarName, setAvatarName] = useState(currentAvatar.name);
  const [isDragOver, setIsDragOver] = useState(false);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const data = JSON.parse(dataStr);
      const { id, category, name } = data;

      if (category === 'hair') updateAvatar({ hair: id });
      else if (category === 'tops') updateAvatar({ top: id });
      else if (category === 'bottoms') updateAvatar({ bottom: id });
      else if (category === 'shoes') updateAvatar({ shoes: id });
      else if (category === 'accessories') {
        const headItems = ['cat-ears', 'bunny-ears', 'bow', 'halo', 'glasses', 'hat', 'cap', 'headphones', 'crown'];
        const faceItems = ['ribbon-choker', 'mask', 'visor'];
        const backItems = ['angel-wings', 'fairy-wings', 'backpack', 'wings', 'jetpack'];
        const shoulderItems = ['shoulder-pads', 'pauldrons'];

        if (headItems.includes(id)) {
          updateAccessories({ head: id });
        } else if (faceItems.includes(id)) {
          updateAccessories({ face: id });
        } else if (backItems.includes(id)) {
          updateAccessories({ back: id });
        } else if (shoulderItems.includes(id)) {
          updateAccessories({ shoulder: id });
        }
      }
      addToast(`Holo-Equipped: ${name || id}!`, 'success');
      sound.playEquip();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNameSave = () => {
    if (avatarName.trim()) {
      updateAvatar({ name: avatarName.trim() });
      addToast(`Renamed avatar to ${avatarName.trim()}`, 'success');
      sound.playClick();
    }
    setIsEditingName(false);
  };

  const handleSave = () => {
    saveAvatar();
    sound.playEquip();
    addToast(`"${currentAvatar.name}" saved to your vault!`, 'success');
  };

  const handleRandomize = () => {
    randomizeAvatar();
    sound.playSweep();
    addToast('Randomized avatar features!', 'info');
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(currentAvatar, null, 2));
    setCopied(true);
    addToast('Avatar configuration copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentAvatar, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${currentAvatar.name.toLowerCase().replace(/\s+/g, '_')}_avatar.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('Avatar JSON downloaded!', 'success');
  };

  const loadPreset = (presetConfig: typeof currentAvatar) => {
    updateAvatar({
      body: presetConfig.body,
      skinTone: presetConfig.skinTone,
      face: presetConfig.face,
      hair: presetConfig.hair,
      hairColor: presetConfig.hairColor,
      top: presetConfig.top,
      topColor: presetConfig.topColor,
      bottom: presetConfig.bottom,
      bottomColor: presetConfig.bottomColor,
      shoes: presetConfig.shoes,
      shoeColor: presetConfig.shoeColor,
      accessories: presetConfig.accessories,
      accessoryColor: presetConfig.accessoryColor,
    });
    setPresetModalOpen(false);
    addToast(`Equipped archetype preset!`, 'success');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#020502] flex flex-col select-none text-white font-sans">
      {/* Background ambient sci-fi glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-[#00FF66]/5 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 right-1/4 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#00FF660a_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* TOP STUDIO TOOLBAR */}
      <header className="relative z-30 h-16 border-b border-[#00FF66]/15 bg-[#020502]/90 backdrop-blur-xl px-4 flex items-center justify-between">
        {/* Left: Back + Avatar Name */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#00FF66]/20 hover:border-[#00FF66]/50 hover:bg-[#00FF66]/10 text-white/70 hover:text-white transition-all text-xs font-semibold uppercase tracking-wider touch-target"
          >
            <ChevronLeft size={16} />
            <span>Exit</span>
          </Link>

          <div className="h-5 w-px bg-white/10 mx-1 hidden sm:block" />

          {/* Name Editor */}
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={avatarName}
                  onChange={(e) => setAvatarName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                  autoFocus
                  className="bg-black/70 border border-[#00FF66]/60 rounded px-2.5 py-1 text-sm font-bold text-white tracking-wide focus:outline-none focus:ring-1 focus:ring-[#00FF66]"
                />
                <button
                  onClick={handleNameSave}
                  className="p-1.5 rounded bg-[#00FF66] hover:bg-[#00FF66]/80 text-black font-bold"
                >
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAvatarName(currentAvatar.name);
                  setIsEditingName(true);
                }}
                className="group flex items-center gap-2 px-2.5 py-1 rounded hover:bg-white/5 transition-all text-left"
              >
                <span className="font-extrabold text-sm tracking-wider uppercase text-white group-hover:text-[#00FF66] transition-colors" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  {currentAvatar.name}
                </span>
                <span className="text-[10px] text-[#00FF66]/50 uppercase tracking-widest font-mono">edit</span>
              </button>
            )}
          </div>
        </div>

        {/* Center: Presets & Quick Actions */}
        <div className="hidden md:flex items-center gap-1 bg-black/60 border border-[#00FF66]/20 rounded-xl px-2 py-1 shadow-[0_0_15px_rgba(0,255,102,0.1)]">
          <button
            onClick={() => setPresetModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#00FF66] hover:bg-[#00FF66]/15 transition-all uppercase tracking-wider"
          >
            <Sparkles size={14} />
            <span>Archetypes</span>
          </button>

          <div className="h-4 w-px bg-white/10 mx-1" />

          <button
            onClick={undo}
            disabled={!canUndo}
            title="Undo"
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all touch-target"
          >
            <Undo2 size={15} />
          </button>

          <button
            onClick={redo}
            disabled={!canRedo}
            title="Redo"
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all touch-target"
          >
            <Redo2 size={15} />
          </button>

          <button
            onClick={handleRandomize}
            title="Randomize Look"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
          >
            <Dices size={15} className="text-amber-400" />
            <span className="hidden lg:inline text-xs uppercase tracking-wider">Random</span>
          </button>

          <button
            onClick={() => setResetModalOpen(true)}
            title="Reset Avatar"
            className="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-white/10 transition-all touch-target"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        {/* Right: Export & Save */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition-all touch-target"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest text-black neon-green-button hover:scale-105 active:scale-95 transition-all touch-target"
          >
            <Save size={14} />
            <span>Save Avatar</span>
          </button>
        </div>
      </header>

      {/* MAIN STUDIO WORKSPACE: 3-column layout */}
      <div className="relative flex-1 min-h-0 flex overflow-hidden">
        {/* LEFT COLUMN: Categories Navigation */}
        <aside className="w-48 border-r border-[#00FF66]/15 bg-[#020502]/90 backdrop-blur-xl z-20 flex flex-col justify-between py-2 hidden sm:flex">
          <div className="overflow-y-auto">
            <div className="px-4 py-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#00FF66]/60">Studio Customizer</p>
            </div>
            <CategoryTabs orientation="vertical" />
          </div>

          <div className="p-3 border-t border-[#00FF66]/15">
            <div className="bg-black/60 border border-[#00FF66]/20 rounded-xl p-2.5 flex flex-col gap-1">
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Build Ver.</span>
              <span className="text-xs text-white/90 font-bold font-mono">SINGULARITY v2.4</span>
              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-[#00FF66] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse shadow-[0_0_8px_#00FF66]" />
                <span className="font-mono">PROCEDURAL RIG ACTIVE</span>
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER COLUMN: 3D Live Viewport with Drag & Drop */}
        <main
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="flex-1 relative h-full flex flex-col overflow-hidden bg-gradient-to-b from-[#030a04] via-[#020502] to-[#000000]"
        >
          {/* Mobile Categories Scrollbar */}
          <div className="sm:hidden w-full border-b border-[#00FF66]/15 bg-[#020502]/85 backdrop-blur px-2 py-2 z-20">
            <CategoryTabs orientation="horizontal" />
          </div>

          {/* 3D Canvas */}
          <div className="relative flex-1 w-full h-full min-h-0">
            <AvatarViewer config={currentAvatar} className="w-full h-full" showControls={true} animate={true} />

            {/* Futuristic Viewport HUD Reticles */}
            <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#00FF66]/40 pointer-events-none" />
            <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#00FF66]/40 pointer-events-none" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[#00FF66]/40 pointer-events-none" />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[#00FF66]/40 pointer-events-none" />

            {/* Holographic Drag-and-Drop Zone Active Overlay */}
            {isDragOver && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-4 z-40 bg-[#00FF66]/15 backdrop-blur-md rounded-3xl border-2 border-dashed border-[#00FF66] shadow-[0_0_50px_rgba(0,255,102,0.45)] flex flex-col items-center justify-center pointer-events-none"
              >
                <div className="w-24 h-24 rounded-full bg-[#00FF66]/25 border-2 border-[#00FF66] flex items-center justify-center text-[#00FF66] mb-4 animate-bounce shadow-[0_0_35px_rgba(0,255,102,0.8)]">
                  <Sparkles size={40} />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-widest text-[#00FF66]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  RELEASE TO EQUIP GEAR
                </h3>
                <p className="text-xs text-white/90 font-mono tracking-wider mt-2 bg-black/60 px-4 py-1.5 rounded-full border border-[#00FF66]/40">
                  PROCEDURAL HOLO-SOCKET ACTIVE
                </p>
              </motion.div>
            )}

            {/* Sci-Fi HUD Viewport Overlay with Live Species & Build Specs */}
            <div className="absolute top-4 left-4 pointer-events-none hidden md:flex flex-col gap-1 text-[11px] font-mono text-white/50 bg-black/60 border border-[#00FF66]/20 backdrop-blur-md p-2.5 rounded-xl shadow-lg">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-ping" />
                <span className="text-[#00FF66] font-bold tracking-wider">LIVE RIG MONITOR</span>
              </div>
              <span className="text-white/80">SPECIES: <span className="text-[#00FF66] font-bold">{(currentAvatar.species || 'HUMAN').toUpperCase()}</span></span>
              <span>BODY: {currentAvatar.body.type.toUpperCase()} ({currentAvatar.body.height.toFixed(2)}x)</span>
              <span>WEAPON: {(currentAvatar.weapon || 'UNARMED').toUpperCase()}</span>
              <span className="text-white/40">RENDER: 60 FPS WEBGL</span>
            </div>

            {/* Quick Archetype Preset Switcher Pill (Bottom Left) */}
            <div className="absolute bottom-4 left-4 hidden lg:flex items-center gap-1.5 bg-black/70 border border-[#00FF66]/20 backdrop-blur-md p-1.5 rounded-xl z-10 shadow-lg">
              <span className="text-[10px] text-white/50 uppercase tracking-wider font-bold px-2">Presets:</span>
              {PRESET_AVATARS.slice(0, 3).map((p) => (
                <button
                  key={p.id}
                  onClick={() => loadPreset(p.avatar)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/5 hover:bg-[#00FF66]/20 text-white/80 hover:text-white transition-all border border-white/5 hover:border-[#00FF66]/40"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </main>

        {/* RIGHT COLUMN: Customization Controls Panel */}
        <aside className="w-80 md:w-96 border-l border-[#00FF66]/15 bg-[#020502]/95 backdrop-blur-2xl z-20 flex flex-col h-full overflow-hidden shadow-2xl">
          <div className="px-5 py-3 border-b border-[#00FF66]/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders size={16} className="text-[#00FF66]" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                {activeCategory} customization
              </h2>
            </div>
            <span className="text-[10px] text-[#00FF66] font-mono uppercase bg-[#00FF66]/15 px-2 py-0.5 rounded border border-[#00FF66]/30">
              Active
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
            <CustomizationPanel />
          </div>
        </aside>
      </div>

      {/* EXPORT MODAL */}
      <Modal open={exportModalOpen} onClose={() => setExportModalOpen(false)} title="Export Avatar Rig" size="md">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-white/70">
            Export your unique avatar build as a lightweight JSON configuration or copy the rig parameters directly.
          </p>

          <div className="p-3 bg-black/80 rounded-xl border border-[#00FF66]/20 font-mono text-xs text-[#00FF66] max-h-48 overflow-y-auto">
            <pre>{JSON.stringify(currentAvatar, null, 2)}</pre>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={handleCopyJson}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition-all"
            >
              {copied ? <Check size={14} className="text-[#00FF66]" /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-black font-black text-xs uppercase tracking-wider transition-all neon-green-button shadow-[0_0_20px_rgba(0,255,102,0.3)]"
            >
              <Download size={14} />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* RESET CONFIRMATION MODAL */}
      <Modal open={resetModalOpen} onClose={() => setResetModalOpen(false)} title="Reset Avatar" size="sm">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-white/70">
            Are you sure you want to revert this avatar to factory baseline defaults? All unsaved custom tweaks will be cleared.
          </p>
          <div className="flex items-center justify-end gap-3 mt-2">
            <button
              onClick={() => setResetModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white/60 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                resetAvatar();
                setResetModalOpen(false);
                addToast('Avatar reset to default base', 'info');
              }}
              className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 text-xs font-bold uppercase tracking-wider transition-all"
            >
              Confirm Reset
            </button>
          </div>
        </div>
      </Modal>

      {/* ARCHETYPE PRESETS MODAL */}
      <Modal open={presetModalOpen} onClose={() => setPresetModalOpen(false)} title="Select Character Archetype" size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {PRESET_AVATARS.map((p) => (
            <div
              key={p.id}
              onClick={() => loadPreset(p.avatar)}
              className="group p-4 rounded-xl border border-white/10 bg-white/5 hover:border-violet-500/50 hover:bg-violet-950/20 cursor-pointer transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors">
                    {p.name}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-violet-400 bg-violet-500/20 px-2 py-0.5 rounded">
                    {p.role}
                  </span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed mb-3">
                  {p.tagline}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] text-white/40">
                <span>Top: {p.avatar.top}</span>
                <span className="text-violet-400 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  Equip Archetype &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
