'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords,
  Shield,
  Zap,
  Radio,
  Play,
  RotateCcw,
  Trophy,
  Activity,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Award,
  Crown,
  FastForward,
  User,
  Filter
} from 'lucide-react';
import { useAvatarStore } from '@/store/avatarStore';
import { AvatarViewer } from '@/components/avatar/AvatarViewer';
import { useToast } from '@/components/Toast';
import { PRESET_AVATARS } from '@/data/presets';
import { sound } from '@/lib/audio';

interface Combatant {
  id: string;
  name: string;
  archetype: string;
  maxHp: number;
  hp: number;
  power: number;
  defense: number;
  agility: number;
  avatarConfig?: any;
}

interface MatchLog {
  turn: number;
  attacker: string;
  action: string;
  damage: number;
  critical: boolean;
  message: string;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  creator: string;
  archetype: string;
  topGear: string;
  accessory: string;
  wins: number;
  losses: number;
  rating: number;
}

const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'KAGE-07', creator: 'CyberPhantom', archetype: 'Cyber Shinobi', topGear: 'Cyber Plating', accessory: 'Photon Visor', wins: 48, losses: 2, rating: 3820 },
  { rank: 2, name: 'AURA-V', creator: 'ValkyriePrime', archetype: 'Vanguard', topGear: 'Ionized Cuirass', accessory: 'Particle Wings', wins: 42, losses: 5, rating: 3610 },
  { rank: 3, name: 'VEX-TITAN', creator: 'Juggernaut_9', archetype: 'Heavy Assault', topGear: 'Reactive Armor', accessory: 'Plasma Jetpack', wins: 39, losses: 8, rating: 3450 },
  { rank: 4, name: 'PIXEL-BYTE', creator: 'GlitchWeaver', archetype: 'Rogue Infiltrator', topGear: 'Stealth Hoodie', accessory: 'Jammer Headphones', wins: 34, losses: 7, rating: 3290 },
  { rank: 5, name: 'CHRONO-X', creator: 'TimeWarp', archetype: 'Quantum Ranger', topGear: 'Temporal Vest', accessory: 'Tachyon Goggles', wins: 31, losses: 9, rating: 3120 },
  { rank: 6, name: 'NEON-VIPER', creator: 'ToxicHolo', archetype: 'Bio-Mech Striker', topGear: 'Synth Armor', accessory: 'Rebreather Mask', wins: 28, losses: 10, rating: 2980 },
];

const TOURNAMENT_FORMATS = [
  'SINGULARITY 8-MAN INVITATIONAL',
  'CYBER COLOSSEUM GAUNTLET',
  'APEX PHOTON GRAND PRIX',
];

export default function LobbyPage() {
  const { currentAvatar } = useAvatarStore();
  const { add: addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'tournament' | 'leaderboard'>('tournament');
  const [tournamentFormat, setTournamentFormat] = useState(TOURNAMENT_FORMATS[0]);
  const [tournamentStage, setTournamentStage] = useState<'idle' | 'quarter' | 'semi' | 'final' | 'champion'>('idle');

  // Combatant state for live battle
  const playerStats: Combatant = {
    id: 'player',
    name: currentAvatar.name,
    archetype: currentAvatar.body.type.toUpperCase() + ' CLASS',
    maxHp: 1000 + (currentAvatar.body.type === 'broad' ? 250 : currentAvatar.body.type === 'regular' ? 100 : 0),
    hp: 1000 + (currentAvatar.body.type === 'broad' ? 250 : currentAvatar.body.type === 'regular' ? 100 : 0),
    power: Math.round(75 + (currentAvatar.top === 'armor' ? 25 : 10)),
    defense: Math.round(50 + (currentAvatar.body.type === 'broad' ? 30 : 15)),
    agility: Math.round(currentAvatar.body.type === 'slim' ? 40 : 25),
    avatarConfig: currentAvatar,
  };

  const [playerFighter, setPlayerFighter] = useState<Combatant>(playerStats);
  const [opponentFighter, setOpponentFighter] = useState<Combatant | null>(null);
  const [battleLogs, setBattleLogs] = useState<MatchLog[]>([]);
  const [isFighting, setIsFighting] = useState(false);
  const [currentRoundNumber, setCurrentRoundNumber] = useState(1);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(INITIAL_LEADERBOARD);

  // Setup opponent based on stage
  const startStageBattle = (stage: 'quarter' | 'semi' | 'final') => {
    let rivalPreset = PRESET_AVATARS[0];
    if (stage === 'quarter') rivalPreset = PRESET_AVATARS[3]; // PIXEL-BYTE
    if (stage === 'semi') rivalPreset = PRESET_AVATARS[1]; // AURA-V
    if (stage === 'final') rivalPreset = PRESET_AVATARS[0]; // KAGE-07

    const opponent: Combatant = {
      id: rivalPreset.id,
      name: rivalPreset.name,
      archetype: rivalPreset.role,
      maxHp: stage === 'quarter' ? 900 : stage === 'semi' ? 1100 : 1300,
      hp: stage === 'quarter' ? 900 : stage === 'semi' ? 1100 : 1300,
      power: stage === 'quarter' ? 70 : stage === 'semi' ? 88 : 105,
      defense: stage === 'quarter' ? 40 : stage === 'semi' ? 55 : 70,
      agility: stage === 'quarter' ? 25 : stage === 'semi' ? 35 : 45,
      avatarConfig: rivalPreset.avatar,
    };

    setOpponentFighter(opponent);
    setPlayerFighter({ ...playerStats, hp: playerStats.maxHp });
    setBattleLogs([
      {
        turn: 0,
        attacker: 'SYSTEM',
        action: 'ARENA INITIALIZED',
        damage: 0,
        critical: false,
        message: `Deployment confirmed for ${stage.toUpperCase()} FINALS!`,
      },
    ]);
    setTournamentStage(stage);
    setCurrentRoundNumber(1);
  };

  const handleStartTournament = () => {
    const randomFmt = TOURNAMENT_FORMATS[Math.floor(Math.random() * TOURNAMENT_FORMATS.length)];
    setTournamentFormat(randomFmt);
    addToast(`Generated tournament: ${randomFmt}`, 'info');
    startStageBattle('quarter');
  };

  const executeCombatTurn = () => {
    if (!opponentFighter || opponentFighter.hp <= 0 || playerFighter.hp <= 0) return;
    sound.playImpact();

    // 1. Player attacks Opponent
    const playerCrit = Math.random() < (playerFighter.agility / 100);
    const playerBaseDmg = Math.max(30, playerFighter.power * 2 - opponentFighter.defense);
    const playerDmg = Math.round(playerCrit ? playerBaseDmg * 1.75 : playerBaseDmg);
    const newOppHp = Math.max(0, opponentFighter.hp - playerDmg);

    const playerActionMsg = playerCrit
      ? `CRITICAL STRIKE! ${playerFighter.name} unleashes Overcharge for ${playerDmg} DMG!`
      : `${playerFighter.name} strikes with Photon Beam for ${playerDmg} DMG!`;

    const turnLogs: MatchLog[] = [
      ...battleLogs,
      {
        turn: currentRoundNumber,
        attacker: playerFighter.name,
        action: playerCrit ? 'CRITICAL OVERDRIVE' : 'ATTACK',
        damage: playerDmg,
        critical: playerCrit,
        message: playerActionMsg,
      },
    ];

    if (newOppHp <= 0) {
      turnLogs.push({
        turn: currentRoundNumber,
        attacker: 'ARENA',
        action: 'KNOCKOUT',
        damage: 0,
        critical: false,
        message: `${opponentFighter.name} HAS BEEN ELIMINATED!`,
      });
      setOpponentFighter({ ...opponentFighter, hp: 0 });
      setBattleLogs(turnLogs);

      // Handle advancement
      setTimeout(() => {
        if (tournamentStage === 'quarter') {
          addToast('Quarter-Final Victory! Advancing to Semi-Finals!', 'success');
          startStageBattle('semi');
        } else if (tournamentStage === 'semi') {
          addToast('Semi-Final Victory! Advancing to Grand Finals!', 'success');
          startStageBattle('final');
        } else if (tournamentStage === 'final') {
          setTournamentStage('champion');
          addToast(`🏆 CHAMPION! ${playerFighter.name} won the ${tournamentFormat}!`, 'success');
          // Add to leaderboard
          setLeaderboard((prev) => [
            {
              rank: 1,
              name: playerFighter.name,
              creator: 'YOU',
              archetype: playerFighter.archetype,
              topGear: currentAvatar.top,
              accessory: currentAvatar.accessories.face || 'Cyber Rig',
              wins: 3,
              losses: 0,
              rating: 4000,
            },
            ...prev.map((e) => ({ ...e, rank: e.rank + 1 })),
          ]);
        }
      }, 1200);
      return;
    }

    // 2. Opponent attacks Player
    const oppCrit = Math.random() < (opponentFighter.agility / 100);
    const oppBaseDmg = Math.max(25, opponentFighter.power * 2 - playerFighter.defense);
    const oppDmg = Math.round(oppCrit ? oppBaseDmg * 1.6 : oppBaseDmg);
    const newPlayerHp = Math.max(0, playerFighter.hp - oppDmg);

    const oppActionMsg = oppCrit
      ? `CRITICAL COUNTER! ${opponentFighter.name} hits back for ${oppDmg} DMG!`
      : `${opponentFighter.name} executes Counter Attack for ${oppDmg} DMG.`;

    turnLogs.push({
      turn: currentRoundNumber,
      attacker: opponentFighter.name,
      action: oppCrit ? 'CRITICAL COUNTER' : 'COUNTER',
      damage: oppDmg,
      critical: oppCrit,
      message: oppActionMsg,
    });

    if (newPlayerHp <= 0) {
      turnLogs.push({
        turn: currentRoundNumber,
        attacker: 'ARENA',
        action: 'DEFEAT',
        damage: 0,
        critical: false,
        message: `${playerFighter.name} was defeated. Better luck next tournament!`,
      });
      addToast('Tournament eliminated! Refit your build in the Studio.', 'error');
    }

    setPlayerFighter({ ...playerFighter, hp: newPlayerHp });
    setOpponentFighter({ ...opponentFighter, hp: newOppHp });
    setBattleLogs(turnLogs);
    setCurrentRoundNumber((r) => r + 1);
  };

  // Auto-simulate whole match
  const handleAutoSimulate = () => {
    let interval = setInterval(() => {
      setOpponentFighter((currOpp) => {
        if (!currOpp || currOpp.hp <= 0) {
          clearInterval(interval);
          return currOpp;
        }
        executeCombatTurn();
        return currOpp;
      });
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#020502] text-white pt-20 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
      {/* Header with Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#00FF66]/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FF66] animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#00FF66] font-mono">
              ARENA PROTOCOL &bull; PROCEDURAL COMBAT ENGINE
            </p>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            BATTLE ARENA & LEADERBOARD
          </h1>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-[#041006] p-1.5 rounded-xl border border-[#00FF66]/30">
          <button
            onClick={() => setActiveTab('tournament')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'tournament'
                ? 'bg-[#00FF66] text-black shadow-[0_0_12px_rgba(0,255,102,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Swords size={15} />
            <span>Tournament Arena</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-[#00FF66] text-black shadow-[0_0_12px_rgba(0,255,102,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Trophy size={15} />
            <span>Top Builds Leaderboard</span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: TOURNAMENT ARENA & SIMULATION                         */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'tournament' && (
        <div className="flex flex-col gap-6">
          {/* Tournament Control Banner */}
          <div className="glass-panel p-5 rounded-2xl border border-[#00FF66]/25 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#00FF66]/20 border border-[#00FF66]/40 flex items-center justify-center text-[#00FF66]">
                <Trophy size={24} />
              </div>
              <div>
                <span className="text-[10px] text-[#00FF66] font-bold font-mono tracking-widest uppercase">
                  ACTIVE TOURNAMENT
                </span>
                <h3 className="text-xl font-black uppercase text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  {tournamentFormat}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {tournamentStage === 'idle' ? (
                <button
                  onClick={handleStartTournament}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs text-black neon-green-button hover:scale-105 active:scale-95 transition-all"
                >
                  <Play size={16} />
                  <span>Deploy Build to Tournament</span>
                </button>
              ) : tournamentStage === 'champion' ? (
                <button
                  onClick={handleStartTournament}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs text-black neon-green-button hover:scale-105 transition-all"
                >
                  <Crown size={16} />
                  <span>Start New Tournament</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={executeCombatTurn}
                    disabled={playerFighter.hp <= 0 || (opponentFighter ? opponentFighter.hp <= 0 : true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black uppercase tracking-wider text-xs text-black neon-green-button disabled:opacity-40 transition-all"
                  >
                    <Zap size={15} />
                    <span>Simulate Next Turn</span>
                  </button>
                  <button
                    onClick={handleAutoSimulate}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#00FF66]/40 bg-[#00FF66]/10 text-[#00FF66] hover:bg-[#00FF66]/20 text-xs font-black uppercase tracking-wider transition-all"
                  >
                    <FastForward size={15} />
                    <span>Auto-Fight</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tournament Stage Indicator */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'quarter', label: '1. Quarter-Finals' },
              { id: 'semi', label: '2. Semi-Finals' },
              { id: 'final', label: '3. Grand Final' },
              { id: 'champion', label: '4. Champion Pod' },
            ].map((st) => {
              const active = tournamentStage === st.id;
              return (
                <div
                  key={st.id}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    active
                      ? 'border-[#00FF66] bg-[#00FF66]/15 text-[#00FF66] font-bold shadow-[0_0_15px_rgba(0,255,102,0.3)]'
                      : 'border-white/10 bg-black/40 text-white/40'
                  }`}
                >
                  <span className="text-xs uppercase font-mono tracking-wider">{st.label}</span>
                </div>
              );
            })}
          </div>

          {/* Live Battle Simulation Canvas & Fighter HUD */}
          {tournamentStage !== 'idle' && opponentFighter && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Player Combatant Card */}
              <div className="lg:col-span-4 glass-panel p-5 rounded-2xl border border-[#00FF66]/40 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#00FF66] font-mono font-bold uppercase">YOUR DEPLOYED RIG</span>
                    <h3 className="text-lg font-black uppercase text-white">{playerFighter.name}</h3>
                  </div>
                  <span className="text-xs text-white/50 font-mono">PLAYER 1</span>
                </div>

                {/* HP Bar */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-white/60">INTEGRITY</span>
                    <span className="text-[#00FF66] font-black">{playerFighter.hp} / {playerFighter.maxHp} HP</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-black/80 border border-white/10 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#00FF66] to-[#39FF14]"
                      style={{ width: `${(playerFighter.hp / playerFighter.maxHp) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* 3D Model View */}
                <div className="w-full h-64 rounded-xl overflow-hidden bg-black/70 border border-[#00FF66]/20">
                  <AvatarViewer config={playerFighter.avatarConfig} className="w-full h-full" showControls={false} animate={true} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-2 border-t border-white/10">
                  <div>
                    <span className="text-white/40 text-[10px]">PWR</span>
                    <p className="font-bold text-white">{playerFighter.power}</p>
                  </div>
                  <div>
                    <span className="text-white/40 text-[10px]">DEF</span>
                    <p className="font-bold text-white">{playerFighter.defense}</p>
                  </div>
                  <div>
                    <span className="text-white/40 text-[10px]">AGI</span>
                    <p className="font-bold text-[#00FF66]">{playerFighter.agility}</p>
                  </div>
                </div>
              </div>

              {/* Center: Live Action Telemetry Log */}
              <div className="lg:col-span-4 glass-panel p-5 rounded-2xl border border-white/15 flex flex-col justify-between h-[470px]">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                    <div className="flex items-center gap-2">
                      <Activity size={16} className="text-[#00FF66] animate-pulse" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">
                        Combat Telemetry &bull; Round {currentRoundNumber}
                      </h4>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1 no-scrollbar font-mono text-xs">
                    {battleLogs.slice(-6).map((log, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border leading-relaxed ${
                          log.attacker === playerFighter.name
                            ? 'bg-[#00FF66]/10 border-[#00FF66]/30 text-white'
                            : log.attacker === 'SYSTEM' || log.attacker === 'ARENA'
                            ? 'bg-white/5 border-white/10 text-[#00FF66] font-bold text-center'
                            : 'bg-red-950/20 border-red-500/30 text-white/90'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1 text-[10px] text-white/40">
                          <span>{log.attacker}</span>
                          <span className={log.critical ? 'text-[#00FF66] font-black' : ''}>{log.action}</span>
                        </div>
                        <p>{log.message}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 text-center text-[10px] text-white/40 font-mono">
                  PRESS NEXT TURN TO RESOLVE ROUND
                </div>
              </div>

              {/* Right: Opponent Combatant Card */}
              <div className="lg:col-span-4 glass-panel p-5 rounded-2xl border border-white/15 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-red-400 font-mono font-bold uppercase">ARENA CHALLENGER</span>
                    <h3 className="text-lg font-black uppercase text-white">{opponentFighter.name}</h3>
                  </div>
                  <span className="text-xs text-white/50 font-mono">CPU</span>
                </div>

                {/* HP Bar */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-white/60">INTEGRITY</span>
                    <span className="text-red-400 font-black">{opponentFighter.hp} / {opponentFighter.maxHp} HP</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-black/80 border border-white/10 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-red-500 to-amber-500"
                      style={{ width: `${(opponentFighter.hp / opponentFighter.maxHp) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* 3D Model View */}
                <div className="w-full h-64 rounded-xl overflow-hidden bg-black/70 border border-red-500/20">
                  <AvatarViewer config={opponentFighter.avatarConfig} className="w-full h-full" showControls={false} animate={true} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-2 border-t border-white/10">
                  <div>
                    <span className="text-white/40 text-[10px]">PWR</span>
                    <p className="font-bold text-white">{opponentFighter.power}</p>
                  </div>
                  <div>
                    <span className="text-white/40 text-[10px]">DEF</span>
                    <p className="font-bold text-white">{opponentFighter.defense}</p>
                  </div>
                  <div>
                    <span className="text-white/40 text-[10px]">AGI</span>
                    <p className="font-bold text-red-400">{opponentFighter.agility}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Idle Deployment Stage Preview */}
          {tournamentStage === 'idle' && (
            <div className="glass-panel p-8 rounded-3xl border border-[#00FF66]/20 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1 flex flex-col gap-4">
                <span className="text-xs font-bold uppercase tracking-widest text-[#00FF66] font-mono">
                  READY FOR DEPLOYMENT
                </span>
                <h2 className="text-3xl sm:text-4xl font-black uppercase text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  {currentAvatar.name}
                </h2>
                <p className="text-sm text-white/70 leading-relaxed max-w-lg">
                  Deploy your procedural build into competitive tournament matchmaking. Your combat telemetry scales directly from your body build and equipped cyber cosmetics.
                </p>

                <div className="grid grid-cols-3 gap-4 max-w-md pt-4 border-t border-white/10">
                  <div>
                    <span className="text-[10px] text-white/40 uppercase font-mono">Build HP</span>
                    <p className="text-lg font-bold font-mono text-white">{playerStats.maxHp}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 uppercase font-mono">Base Power</span>
                    <p className="text-lg font-bold font-mono text-[#00FF66]">{playerStats.power}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 uppercase font-mono">Armor Rating</span>
                    <p className="text-lg font-bold font-mono text-cyan-400">{playerStats.defense}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleStartTournament}
                    className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-black uppercase tracking-widest text-xs text-black neon-green-button hover:scale-105 transition-all shadow-xl"
                  >
                    <Play size={16} />
                    <span>Enter Random Tournament</span>
                  </button>
                </div>
              </div>

              <div className="w-full md:w-96 h-80 rounded-2xl overflow-hidden bg-black/60 border border-[#00FF66]/30">
                <AvatarViewer config={currentAvatar} className="w-full h-full" showControls={false} animate={true} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: CLEAN, NEAT LEADERBOARD                                */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'leaderboard' && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#00FF66] font-mono">GLOBAL RANKINGS</p>
              <h2 className="text-2xl font-black uppercase text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                TOP AVATAR BUILDS
              </h2>
            </div>
            <span className="text-xs font-mono text-white/40">SEASON 1 STANDINGS</span>
          </div>

          {/* Clean, Neat Cards Grid without any clutter */}
          <div className="flex flex-col gap-3">
            {leaderboard.map((entry) => (
              <div
                key={entry.rank}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  entry.rank === 1
                    ? 'border-[#00FF66] bg-[#00FF66]/10 shadow-[0_0_20px_rgba(0,255,102,0.25)]'
                    : entry.rank === 2
                    ? 'border-white/30 bg-white/5'
                    : entry.rank === 3
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : 'border-white/10 bg-[#041006]/50 hover:border-white/20'
                }`}
              >
                {/* Left: Rank & Name */}
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-black font-mono text-sm ${
                      entry.rank === 1
                        ? 'bg-[#00FF66] text-black font-extrabold shadow-[0_0_15px_rgba(0,255,102,0.5)]'
                        : entry.rank === 2
                        ? 'bg-slate-300 text-black font-bold'
                        : entry.rank === 3
                        ? 'bg-amber-500 text-black font-bold'
                        : 'bg-white/10 text-white/70'
                    }`}
                  >
                    #{entry.rank}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black uppercase text-white tracking-wider">
                        {entry.name}
                      </h4>
                      {entry.rank === 1 && <Crown size={16} className="text-[#00FF66]" />}
                    </div>
                    <p className="text-xs text-white/50 font-mono">
                      By {entry.creator} &bull; <span className="text-[#00FF66]">{entry.archetype}</span>
                    </p>
                  </div>
                </div>

                {/* Center: Build gear tags */}
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="bg-black/60 px-2.5 py-1 rounded border border-white/10 text-white/70">
                    {entry.topGear}
                  </span>
                  <span className="bg-black/60 px-2.5 py-1 rounded border border-white/10 text-white/70">
                    {entry.accessory}
                  </span>
                </div>

                {/* Right: Record & Rating */}
                <div className="flex items-center justify-between sm:justify-end gap-6 font-mono text-sm">
                  <div className="text-right">
                    <span className="text-[10px] text-white/40 uppercase block">Record</span>
                    <span className="text-white font-bold">{entry.wins}W - {entry.losses}L</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-[#00FF66] uppercase block font-bold">Rating</span>
                    <span className="text-[#00FF66] font-black text-base">{entry.rating}</span>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab('tournament');
                      startStageBattle('final');
                      addToast(`Challenging #1 Ranked ${entry.name}!`, 'info');
                    }}
                    className="px-3.5 py-1.5 rounded-lg border border-[#00FF66]/40 hover:bg-[#00FF66] hover:text-black text-xs font-bold uppercase tracking-wider text-[#00FF66] transition-all"
                  >
                    Challenge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
