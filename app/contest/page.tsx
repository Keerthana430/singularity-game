'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Crown,
  Trophy,
  Sparkles,
  Send,
  Star,
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
  Award,
  CheckCircle2,
  AlertTriangle,
  LogIn,
  Edit3,
  Check,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { useAvatarStore } from '@/store/avatarStore';
import { useAuthStore } from '@/store/authStore';
import { useContestStore, ContestEntry } from '@/store/contestStore';
import { CyberRunwayView } from '@/components/contest/CyberRunwayView';
import { AvatarViewer } from '@/components/avatar/AvatarViewer';
import { sound } from '@/lib/audio';
import { useToast } from '@/components/Toast';

type ContestTab = 'runway' | 'submit' | 'leaderboard';

// Helper to calculate high-fashion Style Score
function computeStyleScore(entry: ContestEntry): number {
  const cfg = entry.avatarConfig;
  let score = 92;
  if (cfg.accessories?.head) score += 4;
  if (cfg.accessories?.back) score += 5;
  if (cfg.accessories?.face) score += 3;
  if (cfg.accessories?.shoulder) score += 3;
  if (cfg.hairColor?.toUpperCase().includes('FF')) score += 3;
  score += Math.min(25, Math.floor(entry.likes / 6));
  return score;
}

// Floating Heart Particle for Screen Burst
interface HeartParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
}

export default function ContestPage() {
  const { currentAvatar } = useAvatarStore();
  const { isLoggedIn, team, renameTeam } = useAuthStore();
  const {
    entries,
    myTeamName,
    hasSubmitted,
    hasVoted,
    votedForId,
    myEntryId,
    setTeamName,
    submitEntry,
    voteForEntry,
    getLeaderboard,
  } = useContestStore();
  const { add: addToast } = useToast();

  const [activeTab, setActiveTab] = useState<ContestTab>('runway');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [taglineInput, setTaglineInput] = useState('');
  const [sortBy, setSortBy] = useState<'likes' | 'newest'>('likes');
  const [isRenamingTeam, setIsRenamingTeam] = useState(false);
  const [renameInput, setRenameInput] = useState(team?.displayName || '');
  const [isHeroHovered, setIsHeroHovered] = useState(false);
  const [votePulseTrigger, setVotePulseTrigger] = useState(0);
  const [heartParticles, setHeartParticles] = useState<HeartParticle[]>([]);
  const [cameraOrbit, setCameraOrbit] = useState(true);

  const leaderboard = useMemo(() => getLeaderboard(), [entries]);

  const sortedEntries = useMemo(() => {
    const sorted = [...entries];
    if (sortBy === 'likes') sorted.sort((a, b) => b.likes - a.likes);
    else sorted.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    return sorted;
  }, [entries, sortBy]);

  // Keep selected index in bounds
  const activeEntry = sortedEntries[Math.min(selectedIdx, sortedEntries.length - 1)] || sortedEntries[0];

  const handlePrevModel = () => {
    sound.playClick();
    setSelectedIdx((prev) => (prev > 0 ? prev - 1 : sortedEntries.length - 1));
  };

  const handleNextModel = () => {
    sound.playClick();
    setSelectedIdx((prev) => (prev < sortedEntries.length - 1 ? prev + 1 : 0));
  };

  // ─── HIGH-FASHION VOTE INTERACTION ──────────────────────────────────────────
  const handleVote = (entry: ContestEntry, event?: React.MouseEvent) => {
    if (!isLoggedIn || !team) {
      addToast('Log in with your team credentials to vote!', 'error');
      return;
    }
    if (entry.id === myEntryId) {
      addToast("Can't vote for your own build!", 'error');
      return;
    }
    if (votedForId === entry.id) {
      addToast(`You are already voting for ${entry.name}!`, 'info');
      return;
    }

    if (!myTeamName) setTeamName(team.displayName);
    const wasSwitching = Boolean(votedForId);
    const success = voteForEntry(entry.id);

    if (success) {
      // 1. Play high-fashion sparkling vote synthesizer chime and crowd cheer
      sound.playFashionVote();
      setTimeout(() => sound.playCheer(), 220);

      // 2. Trigger 3D energy pulse shockwave on the runway
      setVotePulseTrigger(Date.now());

      // 3. Trigger 2D screen heart burst animation
      const clickX = event ? event.clientX : window.innerWidth / 2;
      const clickY = event ? event.clientY : window.innerHeight / 2;

      const particles: HeartParticle[] = Array.from({ length: 16 }).map((_, i) => ({
        id: Date.now() + i,
        x: clickX + (Math.random() - 0.5) * 80,
        y: clickY + (Math.random() - 0.5) * 40,
        size: 16 + Math.random() * 20,
        rotation: (Math.random() - 0.5) * 60,
      }));
      setHeartParticles((prev) => [...prev, ...particles]);

      setTimeout(() => {
        setHeartParticles((prev) => prev.filter((p) => !particles.includes(p)));
      }, 1500);

      // 4. Feedback toast confirming single vote transfer rule
      if (wasSwitching) {
        addToast(`Vote transferred to ${entry.name}! (Previous vote removed)`, 'success');
      } else {
        addToast(`Voted for ${entry.name}! (+1 Vote)`, 'success');
      }
    }
  };

  const handleSubmit = () => {
    if (!isLoggedIn || !team) {
      addToast('You must be logged in to submit a build!', 'error');
      return;
    }
    if (hasSubmitted) {
      addToast('You already submitted a build!', 'error');
      return;
    }
    setTeamName(team.displayName);
    submitEntry(currentAvatar, taglineInput.trim());
    addToast(`${currentAvatar.name} entered Cyberpunk Fashion Week!`, 'success');
    setActiveTab('runway');
  };

  const handleRenameTeam = async () => {
    if (!renameInput.trim() || renameInput.trim().length < 2) {
      addToast('Team name must be at least 2 characters', 'error');
      return;
    }
    const success = await renameTeam(renameInput.trim());
    if (success) {
      addToast('Team name updated!', 'success');
      setIsRenamingTeam(false);
    }
  };

  const topThree = leaderboard.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#020502] text-white pt-16 pb-20 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-x-hidden">
      {/* ── Dynamic Cyberpunk Fashion Atmosphere ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 right-1/4 w-[600px] h-[600px] bg-[#FF007F]/10 rounded-full blur-[180px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[#00FF66]/8 rounded-full blur-[160px]" />
        <div className="absolute top-1/2 -right-32 w-[400px] h-[400px] bg-[#FF007F]/6 rounded-full blur-[140px]" />
      </div>

      {/* ── Screen-wide Floating Heart Particles (Vote Reaction) ── */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {heartParticles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                opacity: 1,
                scale: 0.2,
                x: particle.x,
                y: particle.y,
                rotate: particle.rotation,
              }}
              animate={{
                opacity: [1, 1, 0],
                scale: [0.2, 1.4, 0.9],
                y: particle.y - 180 - Math.random() * 80,
                x: particle.x + (Math.random() - 0.5) * 120,
                rotate: particle.rotation + (Math.random() - 0.5) * 90,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="absolute text-[#FF007F] drop-shadow-[0_0_15px_#FF007F] flex items-center justify-center"
            >
              <Heart size={particle.size} className="fill-current text-[#FF007F]" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          FASHION WEEK TOP CONSOLE HEADER
          ═══════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#FF007F]/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF007F] animate-ping" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#FF007F] font-mono">
              CYBERPUNK FASHION WEEK // NEO-TOKYO 2088 RUNWAY
            </p>
          </div>
          <h1
            className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight flex items-center gap-3"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, #FF007F 0%, #FF5C93 40%, #00FF66 100%)',
              }}
            >
              BEAUTY CONTEST
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FF007F]/20 text-[#FF007F] border border-[#FF007F]/40 font-mono tracking-wider font-bold">
              1 VOTE / TEAM
            </span>
          </h1>

          {/* Team auth status */}
          {isLoggedIn && team ? (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
              <span className="text-[10px] font-mono text-[#00FF66] font-bold uppercase">
                Logged in as {team.displayName}
              </span>
              <button
                onClick={() => {
                  setRenameInput(team.displayName);
                  setIsRenamingTeam(true);
                }}
                className="text-white/30 hover:text-[#FF007F] transition-colors"
                title="Change team name"
              >
                <Edit3 size={11} />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 mt-2 text-[10px] font-mono text-amber-400 font-bold uppercase hover:text-white transition-colors"
            >
              <LogIn size={11} />
              <span>Log in to submit look &amp; cast vote →</span>
            </Link>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-[#04080A] p-1.5 rounded-2xl border border-[#FF007F]/25 shadow-[0_0_20px_rgba(255,0,127,0.15)] font-mono">
          {([
            { id: 'runway' as ContestTab, label: 'Runway', icon: Eye },
            { id: 'submit' as ContestTab, label: 'Submit Look', icon: Send },
            { id: 'leaderboard' as ContestTab, label: 'Leaderboard', icon: Trophy },
          ]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                sound.playClick();
                setActiveTab(id);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === id
                  ? 'bg-gradient-to-r from-[#FF007F] to-[#FF5C93] text-white shadow-[0_0_15px_rgba(255,0,127,0.5)]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Rename Team Modal ── */}
      {isRenamingTeam && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
          onClick={() => setIsRenamingTeam(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-3xl bg-black/90 border border-[#FF007F]/40 shadow-[0_0_40px_rgba(255,0,127,0.3)] max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className="text-sm font-black uppercase text-white mb-3"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              Change Team Name
            </h3>
            <input
              type="text"
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              placeholder="New team name"
              maxLength={30}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-sm font-bold text-white placeholder:text-white/20 focus:border-[#FF007F]/60 focus:outline-none focus:ring-1 focus:ring-[#FF007F]/30 transition-all font-mono mb-3"
              autoFocus
            />
            <div className="flex gap-2 font-mono">
              <button
                onClick={handleRenameTeam}
                className="flex-1 py-2.5 rounded-xl bg-[#FF007F] text-white font-black uppercase text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_15px_#FF007F]"
              >
                <Check size={14} />
                Save
              </button>
              <button
                onClick={() => setIsRenamingTeam(false)}
                className="px-4 py-2.5 rounded-xl border border-white/20 text-white/60 text-xs font-bold uppercase hover:text-white"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 1: CYBERPUNK FASHION WEEK RUNWAY SHOWCASE
          ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'runway' && activeEntry && (
        <div className="relative z-10 flex flex-col gap-8">
          {/* ── 1. MAIN HOLOGRAPHIC RUNWAY STAGE (THE HERO SHOWCASE) ── */}
          <div className="relative w-full rounded-3xl border border-[#FF007F]/30 bg-black/60 backdrop-blur-md overflow-hidden shadow-[0_10px_50px_rgba(0,0,0,0.9)]">
            {/* Top Runway Telemetry Strip */}
            <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none font-mono">
              {/* Left: Active Look Telemetry */}
              <div className="pointer-events-auto px-4 py-2 rounded-2xl bg-black/85 backdrop-blur-md border border-white/10 shadow-lg flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF007F] animate-pulse shadow-[0_0_8px_#FF007F]" />
                <div>
                  <span
                    className="text-sm font-black uppercase tracking-wider text-white"
                    style={{ fontFamily: "'Orbitron', sans-serif" }}
                  >
                    {activeEntry.name}
                  </span>
                  <span className="text-[10px] text-[#FF007F] ml-2 font-bold">
                    BY {activeEntry.teamName}
                  </span>
                </div>
              </div>

              {/* Center: Fashion Week Title */}
              <div className="hidden sm:flex pointer-events-auto items-center gap-2 px-4 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-[#FF007F]/30 text-[10px] uppercase font-bold tracking-widest text-[#FF007F]">
                <Sparkles size={12} />
                <span>HOLOGRAPHIC CATWALK</span>
                <span className="text-white/30">•</span>
                <span className="text-[#00FF66]">
                  LOOK {selectedIdx + 1} OF {sortedEntries.length}
                </span>
              </div>

              {/* Right: Controls & Auto-Orbit */}
              <div className="pointer-events-auto flex items-center gap-2">
                <button
                  onClick={() => setCameraOrbit((o) => !o)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${
                    cameraOrbit
                      ? 'bg-[#FF007F]/20 text-[#FF007F] border border-[#FF007F]/40'
                      : 'bg-black/80 text-white/50 border border-white/10'
                  }`}
                  title="Toggle slow fashion camera orbit"
                >
                  <RotateCcw size={11} className={cameraOrbit ? 'animate-spin' : ''} />
                  <span>{cameraOrbit ? 'ORBIT ON' : 'ORBIT OFF'}</span>
                </button>
              </div>
            </div>

            {/* ── 3D HOLOGRAPHIC RUNWAY CANVAS ── */}
            <div
              className="relative w-full h-[520px] sm:h-[600px] md:h-[640px]"
              onMouseEnter={() => setIsHeroHovered(true)}
              onMouseLeave={() => setIsHeroHovered(false)}
            >
              <CyberRunwayView
                avatar={activeEntry.avatarConfig}
                name={activeEntry.name}
                teamName={activeEntry.teamName}
                likes={activeEntry.likes}
                styleScore={computeStyleScore(activeEntry)}
                isHovered={isHeroHovered}
                isVoted={votedForId === activeEntry.id}
                votePulse={votePulseTrigger}
                onVote={() => handleVote(activeEntry)}
                onHoverChange={setIsHeroHovered}
                cameraOrbit={cameraOrbit}
              />
            </div>

            {/* Bottom Runway Controls Bar */}
            <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none font-mono">
              {/* Prev Model Button */}
              <button
                onClick={handlePrevModel}
                className="pointer-events-auto px-4 py-2.5 rounded-2xl bg-black/85 backdrop-blur-md border border-white/15 text-white/80 hover:text-white hover:border-[#FF007F] hover:bg-[#FF007F]/10 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 shadow-lg"
              >
                <ChevronLeft size={16} />
                <span>PREV LOOK</span>
              </button>

              {/* Primary Glowing Vote Button */}
              <div className="pointer-events-auto flex items-center gap-3">
                <button
                  onClick={(e) => handleVote(activeEntry, e)}
                  disabled={activeEntry.id === myEntryId}
                  className={`px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs sm:text-sm font-mono flex items-center gap-2.5 transition-all active:scale-95 shadow-[0_0_30px_rgba(255,0,127,0.4)] ${
                    votedForId === activeEntry.id
                      ? 'bg-[#FF007F] text-white border-2 border-white shadow-[0_0_25px_#FF007F]'
                      : activeEntry.id === myEntryId
                      ? 'bg-white/10 text-white/30 border border-white/10 cursor-not-allowed'
                      : votedForId
                      ? 'bg-gradient-to-r from-[#FF007F] to-[#FF5C93] text-white hover:brightness-110 border border-[#FF007F]/60'
                      : 'bg-gradient-to-r from-[#FF007F] to-[#FF5C93] text-white hover:brightness-110 border border-[#FF007F]/60'
                  }`}
                >
                  <Heart
                    size={16}
                    fill={votedForId === activeEntry.id ? 'white' : 'none'}
                    className={votedForId === activeEntry.id ? 'animate-pulse' : ''}
                  />
                  <span>
                    {votedForId === activeEntry.id
                      ? 'VOTED (YOUR TEAM PICK)'
                      : activeEntry.id === myEntryId
                      ? 'YOUR OWN LOOK'
                      : votedForId
                      ? 'SWITCH VOTE TO THIS LOOK'
                      : 'VOTE FOR THIS LOOK'}
                  </span>
                </button>
              </div>

              {/* Next Model Button */}
              <button
                onClick={handleNextModel}
                className="pointer-events-auto px-4 py-2.5 rounded-2xl bg-black/85 backdrop-blur-md border border-white/15 text-white/80 hover:text-white hover:border-[#FF007F] hover:bg-[#FF007F]/10 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 shadow-lg"
              >
                <span>NEXT LOOK</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              2. THE RUNWAY COLLECTION (HIGH-FASHION LOOKBOOK CARDS)
              ═══════════════════════════════════════════════════════════ */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <h2
                  className="text-lg sm:text-xl font-black uppercase text-white tracking-wider flex items-center gap-2"
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
                >
                  <span>RUNWAY COLLECTION</span>
                  <span className="text-xs font-mono text-[#FF007F] px-2 py-0.5 rounded bg-[#FF007F]/10 border border-[#FF007F]/20">
                    {sortedEntries.length} LOOKS
                  </span>
                </h2>
                <p className="text-xs font-mono text-white/40">
                  Hover to intensify spotlight &amp; rotate model • Click any look to project onto main catwalk
                </p>
              </div>

              {/* Sort Switcher */}
              <div className="flex items-center gap-2 font-mono text-xs">
                <button
                  onClick={() => setSortBy('likes')}
                  className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                    sortBy === 'likes'
                      ? 'bg-[#FF007F] text-white border-[#FF007F] shadow-[0_0_12px_#FF007F]'
                      : 'border-white/10 text-white/50 hover:text-white'
                  }`}
                >
                  <Heart size={13} className="fill-current" />
                  <span>Most Liked</span>
                </button>
                <button
                  onClick={() => setSortBy('newest')}
                  className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                    sortBy === 'newest'
                      ? 'bg-[#FF007F] text-white border-[#FF007F] shadow-[0_0_12px_#FF007F]'
                      : 'border-white/10 text-white/50 hover:text-white'
                  }`}
                >
                  <Sparkles size={13} />
                  <span>Newest Looks</span>
                </button>
              </div>
            </div>

            {/* High-Fashion Look Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {sortedEntries.map((entry, idx) => {
                const isSelected = activeEntry.id === entry.id;
                const isVoted = votedForId === entry.id;
                const styleScore = computeStyleScore(entry);

                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    onClick={() => {
                      sound.playClick();
                      setSelectedIdx(idx);
                    }}
                    className={`relative rounded-3xl overflow-hidden border transition-all duration-300 group cursor-pointer ${
                      isSelected
                        ? 'border-[#FF007F] ring-2 ring-[#FF007F]/50 shadow-[0_0_30px_rgba(255,0,127,0.35)] bg-black/80'
                        : isVoted
                        ? 'border-[#FF007F]/60 bg-black/70 shadow-[0_0_20px_rgba(255,0,127,0.2)]'
                        : 'border-white/10 hover:border-[#FF007F]/60 bg-black/50 hover:bg-black/80'
                    }`}
                  >
                    {/* 3D Model Stage Preview */}
                    <div className="relative w-full h-64 bg-gradient-to-b from-[#0B0410] to-[#030608] overflow-hidden">
                      {/* Live 3D Avatar Runway Scene */}
                      <AvatarViewer
                        config={entry.avatarConfig}
                        className="w-full h-full"
                        showControls={false}
                        animate={true}
                      />

                      {/* Rank Indicator Badge */}
                      <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/20 text-xs font-mono font-bold text-white flex items-center gap-1.5 shadow-md">
                        {idx < 3 ? (
                          <Crown size={12} className="text-[#FFD700]" />
                        ) : (
                          <Star size={12} className="text-white/40" />
                        )}
                        <span>#{idx + 1}</span>
                      </div>

                      {/* Main Runway Indicator */}
                      {isSelected && (
                        <div className="absolute top-3 right-3 bg-[#FF007F] text-white px-2.5 py-1 rounded-xl text-[9px] font-black uppercase font-mono shadow-[0_0_12px_#FF007F] animate-pulse">
                          ON RUNWAY
                        </div>
                      )}

                      {/* Your Build Badge */}
                      {entry.id === myEntryId && !isSelected && (
                        <div className="absolute top-3 right-3 bg-[#00FF66] text-black px-2.5 py-1 rounded-xl text-[9px] font-black uppercase font-mono font-bold">
                          YOUR BUILD
                        </div>
                      )}

                      {/* Floating Style Score Card on Hover (Matching Diagram) */}
                      <div className="absolute inset-x-3 bottom-3 p-2.5 rounded-2xl bg-black/85 backdrop-blur-md border border-[#FF007F]/40 shadow-xl opacity-90 group-hover:opacity-100 group-hover:border-[#FF007F] transition-all font-mono">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-white/50 uppercase">STYLE SCORE</span>
                          <span className="font-black text-[#00FF66]">{styleScore} / 120</span>
                        </div>
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="font-black uppercase tracking-wider text-white truncate max-w-[120px]">
                            {entry.name}
                          </span>
                          <span className="font-black text-[#FF007F] flex items-center gap-1">
                            <Heart size={11} className="fill-current text-[#FF007F]" />
                            <span>{entry.likes}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Details */}
                    <div className="p-4 flex flex-col gap-2.5 font-mono">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-white/50">BY {entry.teamName}</span>
                        <span className="text-white/30 text-[10px]">
                          {entry.likedBy.length} VOTERS
                        </span>
                      </div>

                      <p className="text-xs text-white/60 line-clamp-1 italic">
                        &ldquo;{entry.tagline}&rdquo;
                      </p>

                      {/* Quick Vote CTA */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVote(entry, e);
                        }}
                        disabled={entry.id === myEntryId}
                        className={`w-full mt-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider font-mono flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                          isVoted
                            ? 'bg-[#FF007F] text-white shadow-[0_0_15px_#FF007F]'
                            : entry.id === myEntryId
                            ? 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                            : votedForId
                            ? 'bg-[#FF007F]/10 border border-[#FF007F]/40 text-[#FF007F] hover:bg-[#FF007F] hover:text-white'
                            : 'bg-gradient-to-r from-[#FF007F]/20 to-[#FF5C93]/20 border border-[#FF007F]/50 text-white hover:bg-[#FF007F]'
                        }`}
                      >
                        <Heart size={13} fill={isVoted ? 'white' : 'none'} />
                        <span>
                          {isVoted
                            ? 'ACTIVE VOTE'
                            : entry.id === myEntryId
                            ? 'YOUR ENTRY'
                            : votedForId
                            ? 'TRANSFER VOTE'
                            : 'VOTE'}
                        </span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 2: SUBMIT YOUR LOOK TO FASHION WEEK
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'submit' && (
        <div className="relative z-10 flex flex-col gap-6 max-w-4xl mx-auto">
          <div className="p-6 sm:p-8 rounded-3xl bg-black/70 backdrop-blur-md border border-[#FF007F]/30 overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Left: Avatar Preview on Runway */}
              <div className="relative h-[380px] rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-b from-[#0F0416] to-[#020502]">
                <AvatarViewer
                  config={currentAvatar}
                  className="w-full h-full"
                  showControls={true}
                  animate={true}
                />
                <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#FF007F]/40 text-xs font-mono text-[#FF007F] font-bold uppercase flex items-center gap-2">
                  <Sparkles size={12} />
                  <span>CONTEST PREVIEW</span>
                </div>
              </div>

              {/* Right: Form Details */}
              <div className="flex flex-col gap-5">
                <div>
                  <h2
                    className="text-xl sm:text-2xl font-black uppercase text-white mb-1"
                    style={{ fontFamily: "'Orbitron', sans-serif" }}
                  >
                    ENTER FASHION WEEK
                  </h2>
                  <p className="text-xs font-mono text-white/50">
                    Submit your current custom avatar build. Each team can enter one look and cast exactly one vote.
                  </p>
                </div>

                {!isLoggedIn ? (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center">
                      <LogIn size={28} className="text-amber-400" />
                    </div>
                    <h3 className="text-base font-black uppercase text-amber-400 font-mono">
                      LOGIN REQUIRED
                    </h3>
                    <p className="text-xs font-mono text-white/50 text-center max-w-xs">
                      You must be logged in with your team credentials to enter your build or vote.
                    </p>
                    <Link
                      href="/login"
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-black uppercase tracking-wider text-xs text-black bg-[#00FF66] hover:bg-white transition-all font-mono"
                    >
                      <LogIn size={14} />
                      <span>Login to Your Team</span>
                    </Link>
                  </div>
                ) : hasSubmitted ? (
                  <div className="flex flex-col items-center gap-4 py-6 font-mono">
                    <div className="w-16 h-16 rounded-full bg-[#00FF66]/20 border border-[#00FF66]/60 flex items-center justify-center">
                      <CheckCircle2 size={32} className="text-[#00FF66]" />
                    </div>
                    <h3 className="text-base font-black uppercase text-[#00FF66]">
                      LOOK SUBMITTED!
                    </h3>
                    <p className="text-xs text-white/50 text-center">
                      Your look is live on the Cyberpunk Fashion Week runway. Head over to the Runway tab to see your model!
                    </p>
                    <button
                      onClick={() => setActiveTab('runway')}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-black uppercase tracking-wider text-xs text-white bg-[#FF007F] hover:bg-[#FF5C93] transition-all shadow-[0_0_15px_#FF007F]"
                    >
                      <Eye size={14} />
                      <span>View on Runway</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Avatar Name */}
                    <div className="flex flex-col gap-1 font-mono">
                      <label className="text-[10px] text-white/40 uppercase tracking-widest">
                        Avatar Name
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white">
                        {currentAvatar.name}
                      </div>
                    </div>

                    {/* Team Name */}
                    <div className="flex flex-col gap-1 font-mono">
                      <label className="text-[10px] text-white/40 uppercase tracking-widest">
                        Your Team
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-[#00FF66]/5 border border-[#00FF66]/20 text-sm font-bold text-[#00FF66] flex items-center justify-between">
                        <span>{team?.displayName}</span>
                        <button
                          onClick={() => {
                            setRenameInput(team?.displayName || '');
                            setIsRenamingTeam(true);
                          }}
                          className="text-white/30 hover:text-[#FF007F] transition-colors"
                          title="Change team name"
                        >
                          <Edit3 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Tagline */}
                    <div className="flex flex-col gap-1 font-mono">
                      <label className="text-[10px] text-white/40 uppercase tracking-widest">
                        Fashion Vibe / Description
                      </label>
                      <textarea
                        value={taglineInput}
                        onChange={(e) => setTaglineInput(e.target.value)}
                        placeholder="Describe your haute couture cyberpunk look..."
                        maxLength={120}
                        rows={2}
                        className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-[#FF007F]/60 focus:outline-none focus:ring-1 focus:ring-[#FF007F]/30 transition-all resize-none"
                      />
                      <span className="text-[10px] text-white/30 text-right">
                        {taglineInput.length}/120
                      </span>
                    </div>

                    {/* Submit CTA */}
                    <button
                      onClick={handleSubmit}
                      className="w-full py-3.5 rounded-2xl font-black uppercase tracking-widest text-sm text-white bg-gradient-to-r from-[#FF007F] to-[#FF5C93] hover:brightness-110 transition-all shadow-[0_0_25px_rgba(255,0,127,0.4)] flex items-center justify-center gap-2 font-mono"
                    >
                      <Sparkles size={16} />
                      <span>Submit to Fashion Week</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 3: BEAUTY CONTEST LEADERBOARD
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'leaderboard' && (
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#FF007F] font-mono">
                RUNWAY STANDINGS
              </p>
              <h2
                className="text-2xl font-black uppercase text-white"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, #FF007F, #00FF66)' }}
                >
                  MOST BEAUTIFUL LOOKS
                </span>
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-white/40">
              <Heart size={14} className="text-[#FF007F]" />
              <span>{entries.reduce((sum, e) => sum + e.likes, 0)} Total Votes Cast</span>
            </div>
          </div>

          {/* Top 3 Podium */}
          {topThree.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 items-end mb-4">
              {/* 2nd Place */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-b from-slate-400/20 to-transparent border border-slate-400/40 overflow-hidden shadow-md">
                  <AvatarViewer
                    config={topThree[1].avatarConfig}
                    className="w-full h-full"
                    showControls={false}
                    animate={true}
                  />
                </div>
                <div className="text-center font-mono">
                  <div className="w-8 h-8 mx-auto rounded-full bg-slate-400 text-black font-black text-sm flex items-center justify-center">
                    #2
                  </div>
                  <p className="text-xs font-black uppercase mt-1 text-white truncate max-w-[100px]">
                    {topThree[1].name}
                  </p>
                  <p className="text-[10px] text-[#FF007F] flex items-center justify-center gap-1">
                    <Heart size={10} className="fill-current" />
                    <span>{topThree[1].likes}</span>
                  </p>
                </div>
                <div className="w-full h-16 bg-slate-400/10 border border-slate-400/30 rounded-t-2xl" />
              </div>

              {/* 1st Place */}
              <div className="flex flex-col items-center gap-2">
                <Crown size={28} className="text-[#FFD700] animate-bounce" />
                <div className="w-28 h-28 rounded-3xl bg-gradient-to-b from-[#FFD700]/25 to-transparent border-2 border-[#FFD700] overflow-hidden shadow-[0_0_35px_rgba(255,215,0,0.35)]">
                  <AvatarViewer
                    config={topThree[0].avatarConfig}
                    className="w-full h-full"
                    showControls={false}
                    animate={true}
                  />
                </div>
                <div className="text-center font-mono">
                  <div className="w-10 h-10 mx-auto rounded-full bg-[#FFD700] text-black font-black text-base flex items-center justify-center shadow-[0_0_15px_rgba(255,215,0,0.6)]">
                    #1
                  </div>
                  <p className="text-sm font-black uppercase mt-1 text-[#FFD700] truncate max-w-[120px]">
                    {topThree[0].name}
                  </p>
                  <p className="text-xs text-[#FF007F] font-bold flex items-center justify-center gap-1">
                    <Heart size={12} className="fill-current" />
                    <span>{topThree[0].likes}</span>
                  </p>
                </div>
                <div className="w-full h-24 bg-[#FFD700]/10 border border-[#FFD700]/40 rounded-t-2xl" />
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-b from-amber-600/20 to-transparent border border-amber-600/40 overflow-hidden shadow-md">
                  <AvatarViewer
                    config={topThree[2].avatarConfig}
                    className="w-full h-full"
                    showControls={false}
                    animate={true}
                  />
                </div>
                <div className="text-center font-mono">
                  <div className="w-8 h-8 mx-auto rounded-full bg-amber-600 text-white font-black text-sm flex items-center justify-center">
                    #3
                  </div>
                  <p className="text-xs font-black uppercase mt-1 text-white truncate max-w-[100px]">
                    {topThree[2].name}
                  </p>
                  <p className="text-[10px] text-[#FF007F] flex items-center justify-center gap-1">
                    <Heart size={10} className="fill-current" />
                    <span>{topThree[2].likes}</span>
                  </p>
                </div>
                <div className="w-full h-12 bg-amber-600/10 border border-amber-600/30 rounded-t-2xl" />
              </div>
            </div>
          )}

          {/* Full Leaderboard List */}
          <div className="flex flex-col gap-3 font-mono">
            {leaderboard.map((entry, idx) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  idx === 0
                    ? 'border-[#FFD700] bg-[#FFD700]/10 shadow-[0_0_25px_rgba(255,215,0,0.2)]'
                    : idx === 1
                    ? 'border-slate-400/40 bg-slate-400/5'
                    : idx === 2
                    ? 'border-amber-600/40 bg-amber-600/5'
                    : 'border-white/10 bg-black/40 hover:border-[#FF007F]/40'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                      idx === 0
                        ? 'bg-[#FFD700] text-black shadow-[0_0_15px_rgba(255,215,0,0.5)]'
                        : idx === 1
                        ? 'bg-slate-400 text-black'
                        : idx === 2
                        ? 'bg-amber-600 text-white'
                        : 'bg-white/10 text-white/70'
                    }`}
                  >
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black uppercase text-white tracking-wider">
                        {entry.name}
                      </h4>
                      {idx === 0 && <Crown size={16} className="text-[#FFD700]" />}
                    </div>
                    <p className="text-xs text-white/50">
                      By <span className="text-[#FF007F] font-bold">{entry.teamName}</span>
                    </p>
                  </div>
                </div>

                <p className="text-xs text-white/40 max-w-xs line-clamp-1 italic">
                  &ldquo;{entry.tagline}&rdquo;
                </p>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Heart
                      size={15}
                      className="text-[#FF007F]"
                      fill={votedForId === entry.id ? '#FF007F' : 'none'}
                    />
                    <span className="text-lg font-black text-white">{entry.likes}</span>
                    <span className="text-[10px] text-white/40 uppercase">votes</span>
                  </div>
                  {entry.id === myEntryId && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-[#00FF66] text-black font-black uppercase">
                      You
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
