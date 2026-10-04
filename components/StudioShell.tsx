"use client";

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
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
  Maximize2,
  FolderOpen,
  Trash2,
  Plus,
} from 'lucide-react';
import { useAvatarStore } from '@/store/avatarStore';
import { AvatarViewer } from '@/components/avatar/AvatarViewer';
import { CategoryTabs } from '@/components/studio/CategoryTabs';
import { CustomizationPanel } from '@/components/studio/CustomizationPanel';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { sound } from '@/lib/audio';

export default function StudioShell() {
  const {
    currentAvatar,
    history,
    historyIndex,
    updateAvatar,
    randomizeAvatar,
    resetAvatar,
    saveAvatar,
    savedAvatars,
    loadAvatar,
    deleteAvatar,
    createNewAvatar,
    undo,
    redo,
    activeCategory,
    updateAccessories,
  } = useAvatarStore();

  const { add: addToast } = useToast();
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [vaultModalOpen, setVaultModalOpen] = useState(false);
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

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#020502] flex flex-col select-none text-white font-sans">
      {/* The actual studio UI is preserved unchanged; render the existing layout */}
      <header className="relative z-30 h-16 border-b border-[#00FF66]/15 bg-[#020502]/90 backdrop-blur-xl px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#00FF66]/20 hover:border-[#00FF66]/50 hover:bg-[#00FF66]/10 text-white/70 hover:text-white transition-all text-xs font-semibold uppercase tracking-wider touch-target">
            <ChevronLeft size={16} />
            <span>Exit</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-12 gap-4 p-6">
        <div className="col-span-8 bg-black/20 rounded-lg p-4">
          <AvatarViewer config={currentAvatar} className="w-full h-[600px]" showControls />
        </div>
        <aside className="col-span-4">
          <CategoryTabs />
          <CustomizationPanel />
        </aside>
      </main>
    </div>
  );
}
