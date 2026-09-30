'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  User,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  Check
} from 'lucide-react';
import { useAvatarStore } from '@/store/avatarStore';
import { AvatarViewer } from '@/components/avatar/AvatarViewer';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/Modal';
import { AvatarConfig } from '@/types/avatar';
import { PRESET_AVATARS } from '@/data/presets';

export default function AvatarsVaultPage() {
  const {
    currentAvatar,
    savedAvatars,
    saveAvatar,
    loadAvatar,
    deleteAvatar,
    createNewAvatar,
    updateAvatar,
  } = useAvatarStore();

  const { add: addToast } = useToast();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Combine default presets if user has no saved avatars yet so the vault is rich and full of options
  const displayAvatars = savedAvatars.length > 0 ? savedAvatars : PRESET_AVATARS.map((p) => p.avatar);

  const handleEquip = (avatar: AvatarConfig) => {
    updateAvatar(avatar);
    addToast(`Equipped "${avatar.name}" as active avatar!`, 'success');
  };

  const handleDuplicate = (avatar: AvatarConfig) => {
    const duplicated: AvatarConfig = {
      ...avatar,
      id: Math.random().toString(36).slice(2),
      name: `${avatar.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    useAvatarStore.setState((s) => ({
      savedAvatars: [...s.savedAvatars, duplicated],
    }));
    addToast(`Duplicated "${avatar.name}"!`, 'success');
  };

  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      deleteAvatar(deleteTargetId);
      addToast('Avatar removed from vault', 'info');
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#070912] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-400" />
            <p className="text-xs font-bold uppercase tracking-widest text-violet-400">Character Vault</p>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">My Avatars</h1>
          <p className="text-sm text-white/50 mt-1">Manage your custom builds, loadouts, and archetypes.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              saveAvatar();
              addToast(`Saved current look "${currentAvatar.name}"!`, 'success');
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-white transition-all"
          >
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Save Current Look</span>
          </button>

          <Link
            href="/studio"
            onClick={() => createNewAvatar()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-violet-500/25 hover:scale-105 active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, #7C5CFF, #22D3EE)' }}
          >
            <Plus size={16} />
            <span>Create New</span>
          </Link>
        </div>
      </div>

      {/* Grid of Avatars */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Active avatar highlighted card */}
        <div className="glass-panel p-5 rounded-2xl border-2 border-violet-500/60 bg-gradient-to-b from-violet-950/20 to-black/40 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-3 right-3 z-10">
            <span className="text-[10px] font-black uppercase tracking-widest bg-violet-500 text-white px-2.5 py-1 rounded-full shadow-lg shadow-violet-500/40">
              Active Avatar
            </span>
          </div>

          <div>
            <div className="w-full h-56 rounded-xl overflow-hidden bg-black/60 border border-white/10 mb-4">
              <AvatarViewer config={currentAvatar} className="w-full h-full" showControls={false} animate={true} />
            </div>

            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold uppercase tracking-wider text-white">{currentAvatar.name}</h3>
              <span className="text-xs text-violet-300 font-mono">TYPE: {currentAvatar.body.type}</span>
            </div>

            <div className="flex flex-wrap gap-2 text-[11px] text-white/50 mb-4">
              <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">Top: {currentAvatar.top}</span>
              <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">Hair: {currentAvatar.hair}</span>
              <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">Bottom: {currentAvatar.bottom}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-white/10">
            <Link
              href="/studio"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold uppercase tracking-wider transition-all"
            >
              <Edit3 size={14} />
              <span>Modify In Studio</span>
            </Link>
          </div>
        </div>

        {/* Other Avatars in Vault */}
        {displayAvatars
          .filter((a) => a.id !== currentAvatar.id)
          .map((avatar) => (
            <div
              key={avatar.id}
              className="glass-panel p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-full h-56 rounded-xl overflow-hidden bg-black/40 border border-white/5 mb-4 group-hover:border-white/15 transition-all">
                  <AvatarViewer config={avatar} className="w-full h-full" showControls={false} animate={false} />
                </div>

                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold uppercase tracking-wider text-white group-hover:text-violet-300 transition-colors">
                    {avatar.name}
                  </h3>
                  <span className="text-xs text-white/40 font-mono">TYPE: {avatar.body.type}</span>
                </div>

                <div className="flex flex-wrap gap-2 text-[11px] text-white/40 mb-4">
                  <span className="bg-white/5 px-2 py-0.5 rounded">Top: {avatar.top}</span>
                  <span className="bg-white/5 px-2 py-0.5 rounded">Hair: {avatar.hair}</span>
                  <span className="bg-white/5 px-2 py-0.5 rounded">Shoes: {avatar.shoes}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                <button
                  onClick={() => handleEquip(avatar)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider transition-all"
                >
                  <Check size={14} />
                  <span>Equip</span>
                </button>

                <button
                  onClick={() => handleDuplicate(avatar)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                  title="Duplicate Avatar"
                >
                  <Copy size={14} />
                </button>

                <button
                  onClick={() => setDeleteTargetId(avatar.id)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all"
                  title="Delete Avatar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteTargetId} onClose={() => setDeleteTargetId(null)} title="Delete Avatar" size="sm">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-white/70">
            Are you sure you want to permanently delete this avatar from your vault?
          </p>
          <div className="flex items-center justify-end gap-3 mt-2">
            <button
              onClick={() => setDeleteTargetId(null)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white/60 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 text-xs font-bold uppercase tracking-wider transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
