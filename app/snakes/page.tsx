'use client';
// app/snakes/page.tsx
// IMMERSIVE 3D Snakes & Ladders — Full-viewport game arena with floating HUD overlays
// Cyberpunk esports dashboard aesthetic: 3D canvas IS the page, all UI floats on top

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dice6,
  Trophy,
  Sparkles,
  RotateCcw,
  Coins,
  Camera,
  Crown,
  Zap,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useAvatarStore } from '@/store/avatarStore';
import { PRESET_AVATARS } from '@/data/presets';
import { sound } from '@/lib/audio';
import { useToast } from '@/components/Toast';
import { Snakes3DView } from '@/components/snakes/Snakes3DView';
import {
  LADDERS,
  SNAKES,
  MOUNTAIN_TILES,
  ActiveSnakesMovement,
} from '@/components/snakes/Snakes3DCanvas';

export default function SnakesAndLaddersPage() {
  const currentAvatar = useAvatarStore((s) => s.currentAvatar);
  const addCoins = useAvatarStore((s) => s.addCoins);
  const { add: addToast } = useToast();

  const [gameSpeed, setGameSpeed] = useState<'1x' | '2x' | 'instant'>('1x');
  const [cameraMode, setCameraMode] = useState<'action' | 'summit' | 'overview'>('action');
  const [winner, setWinner] = useState<'player' | 'computer' | null>(null);
  const [logOpen, setLogOpen] = useState(false);

  const [playerTile, setPlayerTile] = useState(1);
  const [computerTile, setComputerTile] = useState(1);
  const [matchSeconds, setMatchSeconds] = useState(185);

  useEffect(() => {
    if (winner) return;
    const interval = setInterval(() => setMatchSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [winner]);

  const formattedTimer = `${String(Math.floor(matchSeconds / 60)).padStart(2, '0')}:${String(matchSeconds % 60).padStart(2, '0')}`;

  const [currentTurn, setCurrentTurn] = useState<'player' | 'computer'>('player');
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [canRoll, setCanRoll] = useState(true);
  const [activeMovement, setActiveMovement] = useState<ActiveSnakesMovement | null>(null);

  const [matchLogs, setMatchLogs] = useState<string[]>([
    'System online. Roll to begin ascent.',
  ]);

  const computerAvatar = PRESET_AVATARS[1]?.avatar || currentAvatar;

  const logAction = (msg: string) => {
    setMatchLogs((prev) => [msg, ...prev.slice(0, 20)]);
  };

  // ─── ROLL DICE ────────────────────────────────────────────────────────────
  const handleRollDice = () => {
    if (!canRoll || isRolling || winner || activeMovement) return;
    sound.playDiceRoll();
    setIsRolling(true);
    setCanRoll(false);

    setTimeout(() => {
      const roll = Math.floor(Math.random() * 6) + 1;
      setDiceRoll(roll);
      setIsRolling(false);
      const actorName = currentTurn === 'player' ? (currentAvatar.name || 'You') : 'AI';
      logAction(`🎲 ${actorName} → ${roll}`);
      moveClimber(currentTurn, roll);
    }, 450);
  };

  // ─── 60 FPS WAYPOINT HOPPING ──────────────────────────────────────────────
  const moveClimber = (turn: 'player' | 'computer', roll: number) => {
    const startTile = turn === 'player' ? playerTile : computerTile;
    const targetTile = Math.min(40, startTile + roll);
    if (startTile === targetTile) { advanceTurn(); return; }

    const waypoints: [number, number, number][] = [];
    for (let t = startTile; t <= targetTile; t++) {
      const coord = MOUNTAIN_TILES[t - 1];
      waypoints.push([coord.pos[0], coord.pos[1] + 0.12, coord.pos[2]]);
    }

    const speedMultiplier = gameSpeed === 'instant' ? 3.0 : gameSpeed === '2x' ? 1.8 : 1.0;

    setActiveMovement({
      climber: turn,
      waypoints,
      speed: speedMultiplier,
      type: 'hop',
      onComplete: () => {
        setActiveMovement(null);
        if (turn === 'player') setPlayerTile(targetTile);
        else setComputerTile(targetTile);
        onClimberLanded(turn, targetTile);
      },
    });
  };

  // ─── LANDING RESOLUTION ───────────────────────────────────────────────────
  const onClimberLanded = (turn: 'player' | 'computer', landedTile: number) => {
    const name = turn === 'player' ? (currentAvatar.name || 'You') : 'AI';

    if (landedTile === 40) {
      sound.playWin();
      setWinner(turn);
      if (turn === 'player') {
        addCoins(500);
        addToast('🏆 Summit conquered! +500 Coins', 'success');
      }
      logAction(`👑 ${name} reached the summit!`);
      return;
    }

    if (LADDERS[landedTile]) {
      const topTile = LADDERS[landedTile];
      sound.playLadderClimb();
      addToast(`🪜 Ladder! #${landedTile} → #${topTile}`, 'success');
      logAction(`🪜 ${name} #${landedTile}→#${topTile}`);

      const p0 = MOUNTAIN_TILES[landedTile - 1].pos;
      const p1 = MOUNTAIN_TILES[topTile - 1].pos;
      setActiveMovement({
        climber: turn,
        waypoints: [[p0[0], p0[1] + 0.12, p0[2]], [p1[0], p1[1] + 0.12, p1[2]]],
        speed: gameSpeed === 'instant' ? 2.8 : gameSpeed === '2x' ? 1.7 : 0.9,
        type: 'ladder',
        onComplete: () => {
          setActiveMovement(null);
          if (turn === 'player') setPlayerTile(topTile);
          else setComputerTile(topTile);
          if (topTile === 40) onClimberLanded(turn, 40);
          else setTimeout(advanceTurn, 300);
        },
      });
      return;
    }

    if (SNAKES[landedTile]) {
      const tailTile = SNAKES[landedTile];
      sound.playSnakeSlide();
      addToast(`🐍 Snake! #${landedTile} → #${tailTile}`, 'error');
      logAction(`🐍 ${name} #${landedTile}→#${tailTile}`);

      const pHead = MOUNTAIN_TILES[landedTile - 1].pos;
      const pTail = MOUNTAIN_TILES[tailTile - 1].pos;
      const pMid: [number, number, number] = [
        (pHead[0] + pTail[0]) / 2 + 0.5,
        (pHead[1] + pTail[1]) / 2 + 0.25,
        (pHead[2] + pTail[2]) / 2 + 0.4,
      ];
      setActiveMovement({
        climber: turn,
        waypoints: [[pHead[0], pHead[1] + 0.12, pHead[2]], pMid, [pTail[0], pTail[1] + 0.12, pTail[2]]],
        speed: gameSpeed === 'instant' ? 2.8 : gameSpeed === '2x' ? 1.7 : 0.9,
        type: 'snake',
        onComplete: () => {
          setActiveMovement(null);
          if (turn === 'player') setPlayerTile(tailTile);
          else setComputerTile(tailTile);
          setTimeout(advanceTurn, 300);
        },
      });
      return;
    }

    setTimeout(advanceTurn, 250);
  };

  const advanceTurn = () => {
    if (winner) return;
    setCurrentTurn((prev) => (prev === 'player' ? 'computer' : 'player'));
    setCanRoll(true);
    setDiceRoll(null);
  };

  useEffect(() => {
    if (winner) return;
    if (currentTurn === 'computer' && canRoll && !isRolling && !activeMovement) {
      const aiDelay = gameSpeed === 'instant' ? 120 : gameSpeed === '2x' ? 350 : 650;
      const timer = setTimeout(handleRollDice, aiDelay);
      return () => clearTimeout(timer);
    }
  }, [currentTurn, canRoll, isRolling, activeMovement, winner, gameSpeed]);

  const handleResetGame = () => {
    sound.playEquip();
    setPlayerTile(1);
    setComputerTile(1);
    setCurrentTurn('player');
    setDiceRoll(null);
    setWinner(null);
    setCanRoll(true);
    setActiveMovement(null);
    setMatchLogs(['System reset. Roll to begin.']);
  };

  const isPlayerTurn = currentTurn === 'player';
  const canPlayerRoll = canRoll && !isRolling && !winner && !activeMovement && isPlayerTurn;

  return (
    <div className="bg-[#020502] h-[calc(100dvh-4rem)] w-full overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════════
          FULL-VIEWPORT GAME ARENA
          3D canvas fills the entire screen, all UI is floating HUD
          ═══════════════════════════════════════════════════════════════ */}
      <div className="game-viewport">

        {/* ── THE 3D CANVAS (FILLS ENTIRE VIEWPORT) ── */}
        <div className="absolute inset-0 z-0">
          <Snakes3DView
            playerAvatar={currentAvatar}
            computerAvatar={computerAvatar}
            playerTile={playerTile}
            computerTile={computerTile}
            currentTurn={currentTurn}
            diceRoll={diceRoll}
            isRolling={isRolling}
            canRoll={canPlayerRoll}
            winner={winner}
            cameraMode={cameraMode}
            activeMovement={activeMovement}
            onRollDice={handleRollDice}
          />
        </div>

        {/* ══════════════════════════════════════════════════════════
            FLOATING HUD OVERLAYS (CYBER MOUNTAIN ASCENT CONSOLE)
            ══════════════════════════════════════════════════════════ */}

        {/* ─── TOP CONSOLE HUD STRIP ─── */}
        <div className="absolute top-3 left-4 right-4 z-20 flex items-start justify-between pointer-events-none">
          {/* Top-Left: Explorer Tag & Elevation Telemetry */}
          <div className="pointer-events-auto flex flex-col gap-1.5 px-4 py-2.5 rounded-2xl bg-black/75 backdrop-blur-md border border-white/10 shadow-[0_4px_25px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor] ${
                  isPlayerTurn ? 'bg-[#00FF66] text-[#00FF66] animate-pulse' : 'bg-red-500 text-red-500'
                }`}
              />
              <span
                className="text-sm sm:text-base font-black uppercase tracking-wider text-white"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                {currentAvatar.name || 'KAGE-07'}
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/30 uppercase font-bold">
                EXPLORER
              </span>
            </div>

            {/* Altitude & Platform Metric */}
            <div className="flex items-center gap-3 font-mono text-xs">
              <div className="flex items-center gap-1 text-cyan-400 font-bold">
                <span className="text-[10px] text-white/40">ALT:</span>
                <span>{playerTile * 125}M</span>
              </div>
              <span className="text-white/20">&bull;</span>
              <div className="flex items-center gap-1 text-[#00FF66] font-bold">
                <span className="text-[10px] text-white/40">TIER:</span>
                <span>{playerTile} / 40</span>
              </div>
            </div>
          </div>

          {/* Top-Center: Cyber Mountain Ascent Expedition Status */}
          <div className="pointer-events-auto flex flex-col items-center">
            <div className="px-5 py-2 rounded-2xl bg-black/80 backdrop-blur-md border border-[#00FF66]/30 shadow-[0_0_25px_rgba(0,255,102,0.15)] flex items-center gap-2.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-ping" />
              <span
                className="text-sm sm:text-base font-black tracking-[0.2em] text-[#00FF66] uppercase"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                CYBER MOUNTAIN ASCENT
              </span>
              {activeMovement && (
                <span className="text-[9px] text-[#00FF66] bg-[#00FF66]/20 px-2 py-0.5 rounded-full border border-[#00FF66]/40 animate-pulse font-mono">
                  CLIMBING
                </span>
              )}
            </div>
            <span className="text-[9px] font-mono uppercase tracking-widest text-white/50 mt-1">
              {activeMovement
                ? 'EXPLORER SCALING PLATFORMS...'
                : isPlayerTurn
                ? 'YOUR TURN // ROLL QUANTUM DIE'
                : 'RIVAL EXPLORER ADVANCING...'}
            </span>
          </div>

          {/* Top-Right: Match Timer + Camera Modes & Controls */}
          <div className="pointer-events-auto flex items-center gap-2 font-mono">
            {/* Live Clock Timer */}
            <div className="px-3.5 py-2 rounded-2xl bg-black/80 backdrop-blur-md border border-cyan-500/30 text-cyan-400 font-bold text-xs sm:text-sm shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="tracking-widest">{formattedTimer}</span>
            </div>

            {/* Camera Presets (Follow / Tower / Peak) */}
            <div className="flex items-center gap-0.5 bg-black/80 backdrop-blur-md p-1 rounded-2xl border border-white/10">
              {([
                { key: 'action' as const, label: 'FOLLOW' },
                { key: 'overview' as const, label: 'TOWER' },
                { key: 'summit' as const, label: 'PEAK' },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setCameraMode(key)}
                  className={`px-2.5 py-1 rounded-xl text-[9px] font-bold uppercase transition-all ${
                    cameraMode === key
                      ? 'bg-[#00FF66] text-black shadow-[0_0_8px_rgba(0,255,102,0.4)]'
                      : 'text-white/40 hover:text-white'
                  }`}
                  title={`${label} view`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Speed toggle */}
            <button
              onClick={() => setGameSpeed(gameSpeed === '1x' ? '2x' : gameSpeed === '2x' ? 'instant' : '1x')}
              className="px-2.5 py-2 rounded-2xl bg-black/80 backdrop-blur-md border border-white/10 text-[9px] font-bold text-white/60 hover:text-white uppercase transition-all"
              title="Speed Multiplier"
            >
              {gameSpeed}
            </button>

            {/* Reset button */}
            <button
              onClick={handleResetGame}
              className="p-2 rounded-2xl bg-black/80 backdrop-blur-md border border-white/10 text-white/40 hover:text-red-400 transition-all"
              title="Reset Ascent"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>

        {/* ─── CENTER-BOTTOM ACTION CONSOLE: [ ROLL ] ─── */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3 w-full max-w-lg px-4 pointer-events-none">
          {/* Dual-Explorer Ascent Progress Bar */}
          <div className="pointer-events-auto w-full px-5 py-2 rounded-2xl bg-black/80 backdrop-blur-md border border-white/10 shadow-[0_4px_25px_rgba(0,0,0,0.8)] flex items-center justify-between gap-4 font-mono text-xs">
            {/* Player Progress */}
            <div className="flex items-center gap-2 flex-1">
              <span className="w-2 h-2 rounded-full bg-[#00FF66] shadow-[0_0_6px_#00FF66]" />
              <span className="text-[10px] text-white/70 font-bold uppercase truncate max-w-[80px]">
                {currentAvatar.name || 'You'}
              </span>
              <div className="flex-1 hud-progress-bar">
                <div
                  className="hud-progress-fill bg-gradient-to-r from-emerald-500 to-[#00FF66]"
                  style={{ width: `${(playerTile / 40) * 100}%` }}
                />
              </div>
              <span className="text-[11px] font-black text-[#00FF66]">{playerTile}</span>
            </div>

            <div className="w-px h-4 bg-white/10" />

            {/* Rival Progress */}
            <div className="flex items-center gap-2 flex-1">
              <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_#EF4444]" />
              <span className="text-[10px] text-white/70 font-bold uppercase truncate max-w-[80px]">
                Rival
              </span>
              <div className="flex-1 hud-progress-bar">
                <div
                  className="hud-progress-fill bg-gradient-to-r from-red-600 to-amber-500"
                  style={{ width: `${(computerTile / 40) * 100}%` }}
                />
              </div>
              <span className="text-[11px] font-black text-red-400">{computerTile}</span>
            </div>

            <span className="text-[9px] text-white/30 uppercase">/40</span>
          </div>

          {/* Centered Roll Button & Quantum Die */}
          <div className="pointer-events-auto flex items-center gap-3">
            {/* 3D Quantum Die Display */}
            <motion.div
              animate={isRolling ? { rotate: [0, 90, 180, 360], scale: [1, 1.25, 0.9, 1] } : {}}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 bg-black/80 backdrop-blur-md shadow-[0_0_25px_rgba(0,0,0,0.8)] cursor-pointer transition-all ${
                isPlayerTurn ? 'border-[#00FF66] shadow-[0_0_20px_rgba(0,255,102,0.3)]' : 'border-red-500/50'
              }`}
              onClick={() => canPlayerRoll && handleRollDice()}
            >
              {diceRoll ? (
                <span
                  className="text-3xl font-black font-mono drop-shadow-[0_0_8px_currentColor]"
                  style={{ color: isPlayerTurn ? '#00FF66' : '#F87171' }}
                >
                  {diceRoll}
                </span>
              ) : (
                <Dice6 size={28} className="text-white/40" />
              )}
            </motion.div>

            {/* Big Centered [ ROLL ] Button */}
            {isPlayerTurn ? (
              <button
                id="snakes-roll-dice-btn"
                onClick={handleRollDice}
                disabled={!canPlayerRoll}
                className="hud-action-btn px-12 py-4 text-sm sm:text-base font-black uppercase tracking-[0.25em] flex items-center gap-3 shadow-[0_0_35px_rgba(0,255,102,0.45)] hover:shadow-[0_0_60px_rgba(0,255,102,0.8)] hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100"
              >
                <Sparkles size={16} />
                <span>{isRolling ? 'ROLLING...' : 'ROLL'}</span>
              </button>
            ) : (
              <div className="px-8 py-3.5 rounded-2xl bg-black/80 backdrop-blur-md border border-white/10 text-xs font-mono text-white/60 flex items-center gap-2.5 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="uppercase tracking-wider">
                  RIVAL EXPLORER ADVANCING...
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ─── BOTTOM-LEFT: Subtle Collapsible Telemetry Log ─── */}
        <div className="absolute bottom-4 left-4 z-20 transition-all pointer-events-auto" style={{ width: logOpen ? '260px' : 'auto' }}>
          <button
            onClick={() => setLogOpen(!logOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-white/50 hover:text-white text-left transition-all"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse" />
            <span className="text-[9px] font-mono uppercase tracking-widest flex-1">Log</span>
            {logOpen ? <ChevronDown size={11} className="text-white/40" /> : <ChevronUp size={11} className="text-white/40" />}
          </button>
          {logOpen && (
            <div className="mt-1 px-3 py-2 rounded-xl bg-black/90 backdrop-blur-md border border-white/10 max-h-24 overflow-y-auto no-scrollbar font-mono text-[9px] flex flex-col gap-1">
              {matchLogs.slice(0, 5).map((log, i) => (
                <p key={i} className="text-white/50 leading-snug py-0.5 border-b border-white/5 truncate">
                  {log}
                </p>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════
          VICTORY MODAL
          ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {winner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl bg-[#050A05] border border-[#00FF66]/40 p-8 shadow-[0_0_80px_rgba(0,255,102,0.25)] text-center flex flex-col items-center font-mono"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#00FF66]/15 border border-[#00FF66]/40 flex items-center justify-center mb-4">
                <Trophy size={32} className="text-[#00FF66]" />
              </div>

              <h2 className="text-2xl font-black uppercase text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                {winner === 'player' ? 'Summit Conquered' : 'AI Wins'}
              </h2>

              <p className="text-xs text-white/50 mt-2 max-w-xs">
                {winner === 'player'
                  ? 'All 40 platforms scaled. +500 Coins.'
                  : 'Rival AI reached the peak first.'}
              </p>

              {winner === 'player' && (
                <div className="mt-4 px-4 py-2 rounded-xl bg-[#00FF66]/10 border border-[#00FF66]/30 text-[#00FF66] text-xs font-bold flex items-center gap-2">
                  <Coins size={14} />
                  <span>+500 COINS</span>
                </div>
              )}

              <div className="flex gap-3 w-full mt-6">
                <button
                  onClick={handleResetGame}
                  className="hud-action-btn flex-1 py-3 text-xs uppercase tracking-wider"
                >
                  Play Again
                </button>
                <Link
                  href="/lobby"
                  className="py-3 px-5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center"
                >
                  Hub
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
