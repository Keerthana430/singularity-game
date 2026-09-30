'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Crown,
  Trophy,
  Sparkles,
  Send,
  Star,
  ThumbsUp,
  Users,
  Layers,
  ChevronRight,
  Eye,
  Award,
  Flame,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  LogIn,
  Edit3,
  Check,
} from 'lucide-react';
import { useAvatarStore } from '@/store/avatarStore';
import { useAuthStore } from '@/store/authStore';
import { useContestStore, ContestEntry } from '@/store/contestStore';
import { AvatarViewer } from '@/components/avatar/AvatarViewer';
import { useToast } from '@/components/Toast';

type ContestTab = 'gallery' | 'submit' | 'leaderboard';

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

  const [activeTab, setActiveTab] = useState<ContestTab>('gallery');
  const [taglineInput, setTaglineInput] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<ContestEntry | null>(null);
  const [sortBy, setSortBy] = useState<'likes' | 'newest'>('likes');
  const [isRenamingTeam, setIsRenamingTeam] = useState(false);
  const [renameInput, setRenameInput] = useState(team?.displayName || '');

  const leaderboard = useMemo(() => getLeaderboard(), [entries]);

  const sortedEntries = useMemo(() => {
    const sorted = [...entries];
    if (sortBy === 'likes') sorted.sort((a, b) => b.likes - a.likes);
    else sorted.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    return sorted;
  }, [entries, sortBy]);

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
    addToast(`🌟 ${currentAvatar.name} entered the Beauty Contest!`, 'success');
    setActiveTab('gallery');
  };

  const handleVote = (entry: ContestEntry) => {
    if (!isLoggedIn || !team) {
      addToast('Log in with your team credentials to vote!', 'error');
      return;
    }
    if (hasVoted) {
      addToast('You already cast your vote!', 'error');
      return;
    }
    if (entry.id === myEntryId) {
      addToast("Can't vote for your own build!", 'error');
      return;
    }
    // Use team displayName for the vote
    if (!myTeamName) setTeamName(team.displayName);
    const success = voteForEntry(entry.id);
    if (success) {
      addToast(`💖 Voted for ${entry.name}! Good taste.`, 'success');
    }
  };

  const handleRenameTeam = async () => {
    if (!renameInput.trim() || renameInput.trim().length < 2) {
      addToast('Team name must be at least 2 characters', 'error');
      return;
    }
    const success = await renameTeam(renameInput.trim());
    if (success) {
      addToast('✅ Team name updated!', 'success');
      setIsRenamingTeam(false);
    }
  };

  const topThree = leaderboard.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#020502] text-white pt-20 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 right-1/4 w-[600px] h-[600px] bg-[#FF69B4]/8 rounded-full blur-[180px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[#FFD700]/6 rounded-full blur-[160px]" />
        <div className="absolute top-1/2 -right-32 w-[400px] h-[400px] bg-[#00FF66]/6 rounded-full blur-[140px]" />
      </div>

      {/* Header */}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#FF69B4]/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#FF69B4] animate-pulse" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#FF69B4] font-mono">
              AVATAR BEAUTY CONTEST • VOTE YOUR FAVORITE
            </p>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-black uppercase tracking-tight"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #FF69B4 0%, #FFD700 50%, #00FF66 100%)' }}>
              BEAUTY CONTEST
            </span>
          </h1>
          {/* Team auth status */}
          {isLoggedIn && team ? (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
              <span className="text-[10px] font-mono text-[#00FF66] font-bold uppercase">Logged in as {team.displayName}</span>
              <button
                onClick={() => { setRenameInput(team.displayName); setIsRenamingTeam(true); }}
                className="text-white/30 hover:text-[#FF69B4] transition-colors"
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
              <span>Log in to submit &amp; vote →</span>
            </Link>
          )}
        </div>

        {/* Rename Team Modal */}
        {isRenamingTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setIsRenamingTeam(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel p-6 rounded-2xl border border-[#FF69B4]/30 max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-black uppercase text-white mb-3" style={{ fontFamily: "'Orbitron', sans-serif" }}>Change Team Name</h3>
              <input
                type="text"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                placeholder="New team name"
                maxLength={30}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-sm font-bold text-white placeholder:text-white/20 focus:border-[#FF69B4]/60 focus:outline-none focus:ring-1 focus:ring-[#FF69B4]/30 transition-all font-mono mb-3"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleRenameTeam}
                  className="flex-1 py-2.5 rounded-xl bg-[#FF69B4] text-black font-black uppercase text-xs tracking-wider flex items-center justify-center gap-1.5"
                >
                  <Check size={14} />
                  Save
                </button>
                <button
                  onClick={() => setIsRenamingTeam(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/20 text-white/60 text-xs font-bold uppercase"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-[#041006] p-1 rounded-xl border border-[#FF69B4]/20">
          {([
            { id: 'gallery' as ContestTab, label: 'Gallery', icon: Eye },
            { id: 'submit' as ContestTab, label: 'Submit Build', icon: Send },
            { id: 'leaderboard' as ContestTab, label: 'Rankings', icon: Trophy },
          ]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === id
                  ? 'bg-[#FF69B4] text-black shadow-[0_0_10px_rgba(255,105,180,0.3)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* GALLERY TAB                                                */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'gallery' && (
        <div className="relative flex flex-col gap-6">
          {/* Top 3 Podium */}
          {topThree.length >= 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
              {[topThree[1], topThree[0], topThree[2]].map((entry, i) => {
                const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
                const borderColor = rank === 1 ? 'border-[#FFD700]' : rank === 2 ? 'border-slate-400' : 'border-amber-600';
                const glowColor = rank === 1 ? 'shadow-[0_0_30px_rgba(255,215,0,0.3)]' : '';
                const height = rank === 1 ? 'h-64' : 'h-52';
                const badgeColor = rank === 1 ? 'bg-[#FFD700] text-black' : rank === 2 ? 'bg-slate-400 text-black' : 'bg-amber-600 text-white';

                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`glass-panel rounded-2xl border ${borderColor} ${glowColor} overflow-hidden flex flex-col ${rank === 1 ? 'sm:-mt-4' : ''}`}
                  >
                    <div className={`relative w-full ${height} bg-gradient-to-b from-black/40 to-black/80`}>
                      <AvatarViewer config={entry.avatarConfig} className="w-full h-full" showControls={false} animate={true} />
                      <div className={`absolute top-3 left-3 ${badgeColor} px-2.5 py-1 rounded-lg text-xs font-black font-mono flex items-center gap-1`}>
                        {rank === 1 ? <Crown size={12} /> : <Award size={12} />}
                        #{rank}
                      </div>
                    </div>
                    <div className="p-4 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-wider text-white">{entry.name}</h3>
                        <div className="flex items-center gap-1 text-[#FF69B4]">
                          <Heart size={13} fill="currentColor" />
                          <span className="text-xs font-black font-mono">{entry.likes}</span>
                        </div>
                      </div>
                      <p className="text-[10px] font-mono text-white/50">By {entry.teamName}</p>
                      <p className="text-xs text-white/60 line-clamp-2 font-mono">{entry.tagline}</p>
                      <button
                        onClick={() => handleVote(entry)}
                        disabled={hasVoted || entry.id === myEntryId}
                        className={`w-full mt-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                          votedForId === entry.id
                            ? 'bg-[#FF69B4] text-white border border-[#FF69B4]'
                            : hasVoted || entry.id === myEntryId
                            ? 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                            : 'border border-[#FF69B4]/40 bg-[#FF69B4]/10 text-[#FF69B4] hover:bg-[#FF69B4] hover:text-white'
                        }`}
                      >
                        {votedForId === entry.id ? (
                          <>
                            <CheckCircle2 size={13} />
                            <span>Voted!</span>
                          </>
                        ) : (
                          <>
                            <ThumbsUp size={13} />
                            <span>Vote</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Sort Controls */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black uppercase text-white tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              ALL ENTRIES
            </h2>
            <div className="flex items-center gap-2 text-xs font-mono">
              <button
                onClick={() => setSortBy('likes')}
                className={`px-3 py-1 rounded-lg border transition-all ${
                  sortBy === 'likes' ? 'bg-[#FF69B4] text-black border-[#FF69B4]' : 'border-white/10 text-white/50 hover:text-white'
                }`}
              >
                ♥ Most Liked
              </button>
              <button
                onClick={() => setSortBy('newest')}
                className={`px-3 py-1 rounded-lg border transition-all ${
                  sortBy === 'newest' ? 'bg-[#FF69B4] text-black border-[#FF69B4]' : 'border-white/10 text-white/50 hover:text-white'
                }`}
              >
                ★ Newest
              </button>
            </div>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedEntries.map((entry, idx) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`glass-panel rounded-2xl border overflow-hidden group hover:border-[#FF69B4]/60 transition-all ${
                  entry.id === myEntryId ? 'border-[#00FF66]/60 ring-1 ring-[#00FF66]/30' : 'border-white/10'
                }`}
              >
                {/* Avatar Preview */}
                <div className="relative w-full h-56 bg-gradient-to-b from-black/20 to-black/60 overflow-hidden">
                  <AvatarViewer config={entry.avatarConfig} className="w-full h-full" showControls={false} animate={true} />

                  {/* Rank Badge */}
                  <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/20 text-xs font-mono font-bold text-white/80 flex items-center gap-1.5">
                    {sortedEntries.indexOf(entry) < 3 ? (
                      <Crown size={11} className="text-[#FFD700]" />
                    ) : (
                      <Star size={11} className="text-white/40" />
                    )}
                    #{sortedEntries.indexOf(entry) + 1}
                  </div>

                  {/* Your Entry Badge */}
                  {entry.id === myEntryId && (
                    <div className="absolute top-3 right-3 bg-[#00FF66] text-black px-2 py-0.5 rounded text-[10px] font-black uppercase">
                      YOUR BUILD
                    </div>
                  )}

                  {/* Like Count Overlay */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/80 backdrop-blur-sm px-2.5 py-1.5 rounded-xl border border-[#FF69B4]/30">
                    <Heart size={13} className="text-[#FF69B4]" fill={votedForId === entry.id ? '#FF69B4' : 'none'} />
                    <span className="text-sm font-black font-mono text-white">{entry.likes}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-wider text-white group-hover:text-[#FF69B4] transition-colors">
                      {entry.name}
                    </h3>
                    <span className="text-[10px] font-mono text-[#FF69B4] bg-[#FF69B4]/10 px-2 py-0.5 rounded border border-[#FF69B4]/20">
                      {entry.teamName}
                    </span>
                  </div>

                  <p className="text-xs font-mono text-white/50 leading-relaxed line-clamp-2">
                    {entry.tagline}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-white/30 pt-1 border-t border-white/5">
                    <span>
                      {new Date(entry.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span>{entry.likedBy.length} voters</span>
                  </div>

                  {/* Vote Button */}
                  <button
                    onClick={() => handleVote(entry)}
                    disabled={hasVoted || entry.id === myEntryId}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      votedForId === entry.id
                        ? 'bg-[#FF69B4] text-white border border-[#FF69B4] shadow-[0_0_15px_rgba(255,105,180,0.4)]'
                        : hasVoted || entry.id === myEntryId
                        ? 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                        : 'border border-[#FF69B4]/40 bg-[#FF69B4]/10 text-[#FF69B4] hover:bg-[#FF69B4] hover:text-white hover:shadow-[0_0_15px_rgba(255,105,180,0.3)]'
                    }`}
                  >
                    {votedForId === entry.id ? (
                      <>
                        <CheckCircle2 size={14} />
                        <span>You Voted for This!</span>
                      </>
                    ) : entry.id === myEntryId ? (
                      <>
                        <span>Your Entry</span>
                      </>
                    ) : hasVoted ? (
                      <>
                        <span>Vote Cast</span>
                      </>
                    ) : (
                      <>
                        <Heart size={14} />
                        <span>Vote for This Build</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SUBMIT TAB                                                 */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'submit' && (
        <div className="relative flex flex-col gap-6 max-w-4xl mx-auto">
          <div className="glass-panel rounded-3xl border border-[#FF69B4]/20 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {/* Left: Avatar Preview */}
              <div className="relative bg-gradient-to-b from-black/30 to-black/70 h-[400px] md:h-auto">
                <AvatarViewer config={currentAvatar} className="w-full h-full" showControls={true} animate={true} />
                <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-[#FF69B4]/40 text-xs font-mono text-[#FF69B4] font-bold uppercase flex items-center gap-2">
                  <Sparkles size={12} />
                  CONTEST PREVIEW
                </div>
              </div>

              {/* Right: Form */}
              <div className="p-6 md:p-8 flex flex-col gap-5">
                <div>
                  <h2 className="text-xl font-black uppercase text-white mb-1" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    ENTER THE CONTEST
                  </h2>
                  <p className="text-xs font-mono text-white/50">
                    Submit your current avatar build. Each team can enter one build and cast one vote.
                  </p>
                </div>

                {!isLoggedIn ? (
                  /* Login Required Prompt */
                  <div className="flex flex-col items-center gap-4 py-10">
                    <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center">
                      <LogIn size={28} className="text-amber-400" />
                    </div>
                    <h3 className="text-lg font-black uppercase text-amber-400">LOGIN REQUIRED</h3>
                    <p className="text-xs font-mono text-white/50 text-center max-w-xs">
                      You must be logged in with your team credentials to submit a build or vote.
                    </p>
                    <Link
                      href="/login"
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-black uppercase tracking-wider text-xs text-black bg-[#00FF66] hover:bg-white transition-all"
                    >
                      <LogIn size={14} />
                      <span>Login to Your Team</span>
                    </Link>
                  </div>
                ) : hasSubmitted ? (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div className="w-16 h-16 rounded-full bg-[#00FF66]/20 border border-[#00FF66]/60 flex items-center justify-center">
                      <CheckCircle2 size={32} className="text-[#00FF66]" />
                    </div>
                    <h3 className="text-lg font-black uppercase text-[#00FF66]">BUILD SUBMITTED!</h3>
                    <p className="text-xs font-mono text-white/50 text-center">
                      Your build is live in the gallery. Head to the Gallery tab to see how it's doing!
                    </p>
                    {!hasVoted && (
                      <div className="glass-panel p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs font-mono text-amber-300 flex items-center gap-2">
                        <AlertTriangle size={14} />
                        <span>Don't forget to vote for your favorite build!</span>
                      </div>
                    )}
                    <button
                      onClick={() => setActiveTab('gallery')}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-black uppercase tracking-wider text-xs text-black bg-[#FF69B4] hover:bg-[#FF85C2] transition-all"
                    >
                      <Eye size={14} />
                      <span>View Gallery</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Avatar Name */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Avatar Name</label>
                      <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white">
                        {currentAvatar.name}
                      </div>
                      <span className="text-[10px] font-mono text-white/30 mt-0.5">
                        Change avatar name in the Studio
                      </span>
                    </div>

                    {/* Team Name (from auth) */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                        Your Team
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-[#00FF66]/5 border border-[#00FF66]/20 text-sm font-bold text-[#00FF66] flex items-center justify-between">
                        <span>{team?.displayName}</span>
                        <button
                          onClick={() => { setRenameInput(team?.displayName || ''); setIsRenamingTeam(true); }}
                          className="text-white/30 hover:text-[#FF69B4] transition-colors"
                          title="Change team name"
                        >
                          <Edit3 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Tagline */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                        Tagline / Description
                      </label>
                      <textarea
                        value={taglineInput}
                        onChange={(e) => setTaglineInput(e.target.value)}
                        placeholder="Describe your avatar's look and vibe..."
                        maxLength={120}
                        rows={2}
                        className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-[#FF69B4]/60 focus:outline-none focus:ring-1 focus:ring-[#FF69B4]/30 transition-all resize-none"
                      />
                      <span className="text-[10px] font-mono text-white/30 text-right">{taglineInput.length}/120</span>
                    </div>

                    {/* Customize Link */}
                    <Link
                      href="/studio"
                      className="flex items-center gap-2 text-xs font-mono font-bold text-[#00FF66] hover:text-white transition-colors uppercase tracking-wider"
                    >
                      <Layers size={13} />
                      <span>Customize Build in Studio First →</span>
                    </Link>

                    {/* Submit Button */}
                    <button
                      onClick={handleSubmit}
                      className="w-full py-3.5 rounded-xl font-black uppercase tracking-widest text-sm text-white bg-gradient-to-r from-[#FF69B4] to-[#FFD700] hover:from-[#FF85C2] hover:to-[#FFE44D] transition-all shadow-[0_0_25px_rgba(255,105,180,0.3)] hover:shadow-[0_0_35px_rgba(255,105,180,0.5)] flex items-center justify-center gap-2"
                    >
                      <Sparkles size={16} />
                      <span>Submit to Beauty Contest</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Rules Card */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <h3 className="text-sm font-black uppercase text-white mb-3 flex items-center gap-2">
              <Star size={14} className="text-[#FFD700]" />
              CONTEST RULES
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono text-white/60">
              <div className="flex items-start gap-2">
                <span className="text-[#FF69B4] font-bold">01.</span>
                <span>Each team can submit <strong className="text-white">one build</strong> to the beauty contest.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#FF69B4] font-bold">02.</span>
                <span>Each team gets <strong className="text-white">one vote</strong> — choose wisely. You <strong className="text-white">cannot</strong> vote for your own build.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#FF69B4] font-bold">03.</span>
                <span>The build with the <strong className="text-white">most likes</strong> wins the <strong className="text-[#FFD700]">Beauty Crown</strong> and tops the leaderboard!</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* LEADERBOARD TAB                                            */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'leaderboard' && (
        <div className="relative flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#FF69B4] font-mono">BEAUTY CONTEST RANKINGS</p>
              <h2 className="text-2xl font-black uppercase text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #FF69B4, #FFD700)' }}>
                  MOST BEAUTIFUL BUILDS
                </span>
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-white/40">
              <Heart size={12} className="text-[#FF69B4]" />
              <span>{entries.reduce((sum, e) => sum + e.likes, 0)} Total Votes</span>
            </div>
          </div>

          {/* Podium Visual */}
          {topThree.length >= 3 && (
            <div className="grid grid-cols-3 gap-3 items-end">
              {/* 2nd Place */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-slate-400/20 to-transparent border border-slate-400/40 overflow-hidden">
                  <AvatarViewer config={topThree[1].avatarConfig} className="w-full h-full" showControls={false} animate={true} />
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto rounded-full bg-slate-400 text-black font-black text-sm flex items-center justify-center">#2</div>
                  <p className="text-xs font-black uppercase mt-1 text-white">{topThree[1].name}</p>
                  <p className="text-[10px] font-mono text-[#FF69B4]">♥ {topThree[1].likes}</p>
                </div>
                <div className="w-full h-16 bg-slate-400/10 border border-slate-400/30 rounded-t-xl" />
              </div>

              {/* 1st Place */}
              <div className="flex flex-col items-center gap-2">
                <Crown size={24} className="text-[#FFD700] animate-pulse" />
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-b from-[#FFD700]/20 to-transparent border-2 border-[#FFD700]/60 overflow-hidden shadow-[0_0_25px_rgba(255,215,0,0.25)]">
                  <AvatarViewer config={topThree[0].avatarConfig} className="w-full h-full" showControls={false} animate={true} />
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 mx-auto rounded-full bg-[#FFD700] text-black font-black text-base flex items-center justify-center shadow-[0_0_15px_rgba(255,215,0,0.5)]">#1</div>
                  <p className="text-sm font-black uppercase mt-1 text-[#FFD700]">{topThree[0].name}</p>
                  <p className="text-xs font-mono text-[#FF69B4] font-bold">♥ {topThree[0].likes}</p>
                </div>
                <div className="w-full h-24 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-t-xl" />
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-amber-600/20 to-transparent border border-amber-600/40 overflow-hidden">
                  <AvatarViewer config={topThree[2].avatarConfig} className="w-full h-full" showControls={false} animate={true} />
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto rounded-full bg-amber-600 text-white font-black text-sm flex items-center justify-center">#3</div>
                  <p className="text-xs font-black uppercase mt-1 text-white">{topThree[2].name}</p>
                  <p className="text-[10px] font-mono text-[#FF69B4]">♥ {topThree[2].likes}</p>
                </div>
                <div className="w-full h-12 bg-amber-600/10 border border-amber-600/30 rounded-t-xl" />
              </div>
            </div>
          )}

          {/* Full Rankings List */}
          <div className="flex flex-col gap-3">
            {leaderboard.map((entry, idx) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  idx === 0
                    ? 'border-[#FFD700] bg-[#FFD700]/8 shadow-[0_0_20px_rgba(255,215,0,0.2)]'
                    : idx === 1
                    ? 'border-slate-400/40 bg-slate-400/5'
                    : idx === 2
                    ? 'border-amber-600/40 bg-amber-600/5'
                    : 'border-white/10 bg-[#041006]/50 hover:border-[#FF69B4]/30'
                }`}
              >
                {/* Left: Rank & Name */}
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-black font-mono text-sm ${
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
                      <h4 className="text-base font-black uppercase text-white tracking-wider">{entry.name}</h4>
                      {idx === 0 && <Crown size={16} className="text-[#FFD700]" />}
                    </div>
                    <p className="text-xs text-white/50 font-mono">
                      By <span className="text-[#FF69B4]">{entry.teamName}</span>
                    </p>
                  </div>
                </div>

                {/* Center: Tagline */}
                <p className="text-xs font-mono text-white/40 max-w-xs line-clamp-1">{entry.tagline}</p>

                {/* Right: Likes */}
                <div className="flex items-center gap-4 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Heart size={15} className="text-[#FF69B4]" fill={votedForId === entry.id ? '#FF69B4' : 'none'} />
                    <span className="text-lg font-black text-white">{entry.likes}</span>
                    <span className="text-[10px] text-white/40 uppercase">likes</span>
                  </div>
                  {entry.id === myEntryId && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-[#00FF66] text-black font-black uppercase">You</span>
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
