'use client';
// app/ludo/page.tsx
// Cyber Ludo 3D Colosseum — 4-player cybernetic board game using built avatars as pieces,
// standard authentic Ludo rules, cyber power-up tiles, smart AI rivals, animated dice, and global leaderboard.

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dice6,
  Trophy,
  Crown,
  Zap,
  Shield,
  Sparkles,
  RotateCcw,
  ArrowRight,
  Flame,
  Star,
  Users,
  Swords,
  ChevronLeft,
  Volume2,
  Coins,
  History,
  FastForward,
} from 'lucide-react';
import { useAvatarStore } from '@/store/avatarStore';
import { AvatarConfig } from '@/types/avatar';
import { PRESET_AVATARS } from '@/data/presets';
import { sound } from '@/lib/audio';
import { useToast } from '@/components/Toast';

// ─── LUDO TYPES & INTERFACES ───────────────────────────────────────────────

export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export interface LudoPiece {
  id: number; // 0 to 3
  color: PlayerColor;
  step: number; // -1 = Yard/Home Base, 0 to 51 = Track, 52 to 56 = Home Column, 57 = Goal
  hasShield?: boolean;
}

export interface LudoPlayer {
  id: PlayerColor;
  name: string;
  isAi: boolean;
  avatar: AvatarConfig;
  pieces: LudoPiece[];
  colorHex: string;
  accentHex: string;
  bgHex: string;
  rank?: number; // 1, 2, 3, 4
}

export interface CyberTilePowerUp {
  index: number;
  type: 'boost' | 'shield' | 'warp';
  label: string;
  icon: string;
}

// ─── 52-TILE TRACK MAPPING (15x15 GRID: [row, col]) ─────────────────────────

export const TRACK_COORDS: [number, number][] = [
  // Red Arm Outward (0 to 4)
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  // Green Arm Inward (5 to 10)
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  // Top Turn (11)
  [0, 7],
  // Green Arm Outward (12 to 17)
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  // Yellow Arm Inward (18 to 23)
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  // Right Turn (24)
  [7, 14],
  // Yellow Arm Outward (25 to 30)
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  // Blue Arm Inward (31 to 36)
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  // Bottom Turn (37)
  [14, 7],
  // Blue Arm Outward (38 to 43)
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  // Red Arm Inward (44 to 49)
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  // Left Turn (50)
  [7, 0],
  // Final loop connector (51)
  [6, 0],
];

// Start offsets on track
export const START_TRACK_INDEX: Record<PlayerColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

// Home columns (5 tiles each before goal 57)
export const HOME_COLUMNS: Record<PlayerColor, [number, number][]> = {
  red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
  blue: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
};

// Center Goal
export const GOAL_COORD: [number, number] = [7, 7];

// Yard pod positions (4 tokens per yard)
export const YARD_PODS: Record<PlayerColor, [number, number][]> = {
  red: [[1.5, 1.5], [1.5, 3.5], [3.5, 1.5], [3.5, 3.5]],
  green: [[1.5, 10.5], [1.5, 12.5], [3.5, 10.5], [3.5, 12.5]],
  yellow: [[10.5, 10.5], [10.5, 12.5], [12.5, 10.5], [12.5, 12.5]],
  blue: [[10.5, 1.5], [10.5, 3.5], [12.5, 1.5], [12.5, 3.5]],
};

// Safe squares (Stars / Shielded) on track
export const SAFE_TRACK_INDICES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

// Fun Cyber Power-Up Tiles
export const CYBER_POWERUPS: CyberTilePowerUp[] = [
  { index: 4, type: 'boost', label: 'Overdrive Boost (+2)', icon: '⚡' },
  { index: 17, type: 'shield', label: 'Quantum Shield', icon: '🛡️' },
  { index: 30, type: 'warp', label: 'Cyber Warp (+4)', icon: '🌀' },
  { index: 43, type: 'boost', label: 'Overdrive Boost (+2)', icon: '⚡' },
];

export default function LudoPage() {
  const currentAvatar = useAvatarStore((s) => s.currentAvatar);
  const addCoins = useAvatarStore((s) => s.addCoins);
  const { add: addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'board' | 'leaderboard' | 'rules'>('board');
  const [gameSpeed, setGameSpeed] = useState<'1x' | '2x' | 'instant'>('1x');
  const [matchStarted, setMatchStarted] = useState(false);
  const [winner, setWinner] = useState<LudoPlayer | null>(null);

  // Turn management
  const [currentTurn, setCurrentTurn] = useState<PlayerColor>('red');
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [canRoll, setCanRoll] = useState(true);
  const [selectablePieces, setSelectablePieces] = useState<number[]>([]);
  const [matchLogs, setMatchLogs] = useState<string[]>([
    'Welcome to Cyber Ludo Colosseum! Roll a 6 to deploy your avatar.',
  ]);

  // Player definitions
  const [players, setPlayers] = useState<LudoPlayer[]>([
    {
      id: 'red',
      name: currentAvatar.name || 'You',
      isAi: false,
      avatar: currentAvatar,
      colorHex: '#EF4444',
      accentHex: '#F87171',
      bgHex: 'rgba(239, 68, 68, 0.15)',
      pieces: [
        { id: 0, color: 'red', step: -1 },
        { id: 1, color: 'red', step: -1 },
        { id: 2, color: 'red', step: -1 },
        { id: 3, color: 'red', step: -1 },
      ],
    },
    {
      id: 'green',
      name: 'Sylph Ranger',
      isAi: true,
      avatar: PRESET_AVATARS[1]?.avatar || currentAvatar,
      colorHex: '#10B981',
      accentHex: '#34D399',
      bgHex: 'rgba(16, 185, 129, 0.15)',
      pieces: [
        { id: 0, color: 'green', step: -1 },
        { id: 1, color: 'green', step: -1 },
        { id: 2, color: 'green', step: -1 },
        { id: 3, color: 'green', step: -1 },
      ],
    },
    {
      id: 'yellow',
      name: 'Runic Golem',
      isAi: true,
      avatar: PRESET_AVATARS[3]?.avatar || currentAvatar,
      colorHex: '#F59E0B',
      accentHex: '#FBBF24',
      bgHex: 'rgba(245, 158, 11, 0.15)',
      pieces: [
        { id: 0, color: 'yellow', step: -1 },
        { id: 1, color: 'yellow', step: -1 },
        { id: 2, color: 'yellow', step: -1 },
        { id: 3, color: 'yellow', step: -1 },
      ],
    },
    {
      id: 'blue',
      name: 'Astral Sprite',
      isAi: true,
      avatar: PRESET_AVATARS[2]?.avatar || currentAvatar,
      colorHex: '#06B6D4',
      accentHex: '#38BDF8',
      bgHex: 'rgba(6, 182, 212, 0.15)',
      pieces: [
        { id: 0, color: 'blue', step: -1 },
        { id: 1, color: 'blue', step: -1 },
        { id: 2, color: 'blue', step: -1 },
        { id: 3, color: 'blue', step: -1 },
      ],
    },
  ]);

  const activePlayer = useMemo(() => players.find((p) => p.id === currentTurn)!, [players, currentTurn]);

  // Speed multiplier delay
  const stepDelay = gameSpeed === 'instant' ? 50 : gameSpeed === '2x' ? 250 : 500;

  // ─── HELPER: CONVERT PIECE STEP TO GRID COORDINATES [ROW, COL] ─────────────
  const getPieceCoordinates = (color: PlayerColor, step: number): [number, number] => {
    if (step === -1) return [0, 0]; // Handled by yard pods
    if (step >= 57) return GOAL_COORD; // Center Home
    if (step >= 52) {
      // In home column (52 = 0, 56 = 4)
      const colIdx = step - 52;
      return HOME_COLUMNS[color][colIdx] || GOAL_COORD;
    }
    // On regular 52-tile track
    const trackIdx = (START_TRACK_INDEX[color] + step) % 52;
    return TRACK_COORDS[trackIdx];
  };

  // ─── DICE ROLLING LOGIC ──────────────────────────────────────────────────
  const handleRollDice = () => {
    if (!canRoll || isRolling || winner) return;

    sound.playDiceRoll();
    setIsRolling(true);
    setCanRoll(false);
    setSelectablePieces([]);

    setTimeout(() => {
      const roll = Math.floor(Math.random() * 6) + 1;
      setDiceRoll(roll);
      setIsRolling(false);

      logAction(`${activePlayer.name} rolled a ${roll}!`);

      // Determine valid moves for current player
      const valid = getValidMoves(activePlayer, roll);

      if (valid.length === 0) {
        logAction(`${activePlayer.name} has no valid moves. Passing turn.`);
        setTimeout(() => {
          advanceToNextPlayer(roll === 6);
        }, stepDelay * 1.5);
      } else if (!activePlayer.isAi && valid.length === 1 && valid[0].step === -1 && roll === 6) {
        // Auto-deploy for human if single piece in base
        movePiece(activePlayer.id, valid[0].id, roll);
      } else if (activePlayer.isAi) {
        // AI chooses best move
        setTimeout(() => {
          const chosenPiece = chooseAiMove(activePlayer, valid, roll);
          movePiece(activePlayer.id, chosenPiece.id, roll);
        }, stepDelay);
      } else {
        // Human player must tap one of the valid pieces
        setSelectablePieces(valid.map((p) => p.id));
      }
    }, 450);
  };

  // ─── VALIDATE MOVE OPTIONS ───────────────────────────────────────────────
  const getValidMoves = (player: LudoPlayer, roll: number): LudoPiece[] => {
    return player.pieces.filter((p) => {
      if (p.step === 57) return false; // Already finished
      if (p.step === -1) return roll === 6; // Needs 6 to enter
      // Check if roll exceeds 57
      if (p.step + roll > 57) return false; // Must land with exact roll
      return true;
    });
  };

  // ─── AI HEURISTIC DECISION ENGINE ─────────────────────────────────────────
  const chooseAiMove = (aiPlayer: LudoPlayer, valid: LudoPiece[], roll: number): LudoPiece => {
    // 1. Prioritize capturing an opponent piece!
    for (const piece of valid) {
      if (piece.step !== -1) {
        const targetStep = piece.step + roll;
        if (targetStep < 52) {
          const targetTrackIdx = (START_TRACK_INDEX[aiPlayer.id] + targetStep) % 52;
          if (!SAFE_TRACK_INDICES.has(targetTrackIdx)) {
            // Check if opponent is on that tile
            for (const other of players) {
              if (other.id !== aiPlayer.id) {
                const oppOnTile = other.pieces.some(
                  (op) => op.step >= 0 && op.step < 52 && (START_TRACK_INDEX[other.id] + op.step) % 52 === targetTrackIdx
                );
                if (oppOnTile) return piece; // Instant capture move!
              }
            }
          }
        }
      }
    }

    // 2. Prioritize entering Goal (57)
    const goalMover = valid.find((p) => p.step + roll === 57);
    if (goalMover) return goalMover;

    // 3. Prioritize deploying from base on 6
    if (roll === 6) {
      const baseDeployer = valid.find((p) => p.step === -1);
      if (baseDeployer) return baseDeployer;
    }

    // 4. Prioritize stepping onto a safe Star
    for (const piece of valid) {
      if (piece.step !== -1) {
        const targetStep = piece.step + roll;
        if (targetStep < 52) {
          const targetTrackIdx = (START_TRACK_INDEX[aiPlayer.id] + targetStep) % 52;
          if (SAFE_TRACK_INDICES.has(targetTrackIdx)) return piece;
        }
      }
    }

    // 5. Default: advance furthest piece
    return valid.sort((a, b) => b.step - a.step)[0];
  };

  // ─── EXECUTE PIECE MOVEMENT ──────────────────────────────────────────────
  const movePiece = (color: PlayerColor, pieceId: number, roll: number) => {
    setSelectablePieces([]);
    sound.playClick();

    setPlayers((prev) => {
      return prev.map((pl) => {
        if (pl.id !== color) return pl;

        const updatedPieces = pl.pieces.map((pc) => {
          if (pc.id !== pieceId) return pc;

          let nextStep = pc.step === -1 ? 0 : pc.step + roll;

          // Check Cyber Power-Up on landing (if on outer track)
          if (nextStep >= 0 && nextStep < 52) {
            const trackIdx = (START_TRACK_INDEX[color] + nextStep) % 52;
            const powerup = CYBER_POWERUPS.find((pu) => pu.index === trackIdx);
            if (powerup) {
              sound.playEquip();
              if (powerup.type === 'boost') {
                nextStep = Math.min(57, nextStep + 2);
                addToast(`⚡ ${pl.name} landed on Overdrive Tile! +2 Step Boost!`, 'success');
              } else if (powerup.type === 'shield') {
                pc.hasShield = true;
                addToast(`🛡️ ${pl.name} gained a Quantum Shield!`, 'info');
              } else if (powerup.type === 'warp') {
                nextStep = Math.min(57, nextStep + 4);
                addToast(`🌀 ${pl.name} triggered a Cyber Warp Portal! +4 Warp!`, 'success');
              }
            }
          }

          return { ...pc, step: nextStep };
        });

        return { ...pl, pieces: updatedPieces };
      });
    });

    // Check for Capture & Extra Roll
    setTimeout(() => {
      checkCaptureAndTurnOutcome(color, pieceId, roll);
    }, stepDelay);
  };

  // ─── CAPTURE RESOLUTION & EXTRA TURN HANDLING ─────────────────────────────
  const checkCaptureAndTurnOutcome = (color: PlayerColor, pieceId: number, roll: number) => {
    const movedPlayer = players.find((p) => p.id === color)!;
    const movedPiece = movedPlayer.pieces.find((p) => p.id === pieceId)!;

    let capturedOpponent = false;

    // Only capture if on the regular 52-tile track and NOT on a safe star
    if (movedPiece.step >= 0 && movedPiece.step < 52) {
      const movedTrackIdx = (START_TRACK_INDEX[color] + movedPiece.step) % 52;

      if (!SAFE_TRACK_INDICES.has(movedTrackIdx)) {
        setPlayers((prev) =>
          prev.map((pl) => {
            if (pl.id === color) return pl;

            const updatedPieces = pl.pieces.map((pc) => {
              if (pc.step >= 0 && pc.step < 52) {
                const pcTrackIdx = (START_TRACK_INDEX[pl.id] + pc.step) % 52;
                if (pcTrackIdx === movedTrackIdx) {
                  // Check shield
                  if (pc.hasShield) {
                    addToast(`🛡️ ${pl.name}'s Quantum Shield absorbed the capture!`, 'info');
                    return { ...pc, hasShield: false };
                  }
                  // Captured! Send back to yard
                  capturedOpponent = true;
                  sound.playImpact();
                  addToast(`💥 ${movedPlayer.name} CAPTURED ${pl.name}'s token!`, 'error');
                  logAction(`💥 ${movedPlayer.name} captured ${pl.name}'s piece and returned it to base!`);
                  return { ...pc, step: -1 };
                }
              }
              return pc;
            });

            return { ...pl, pieces: updatedPieces };
          })
        );
      }
    }

    // Check for Player Win (All 4 pieces at 57)
    const hasWon = movedPlayer.pieces.every((p) => p.step === 57 || (p.id === pieceId && movedPiece.step === 57));
    if (hasWon && !winner) {
      sound.playWin();
      setWinner(movedPlayer);
      if (movedPlayer.id === 'red') {
        addCoins(500);
        addToast('🏆 1ST PLACE CHAMPION! +500 Cyber Coins earned in Cyber Ludo!', 'success');
      } else {
        addToast(`${movedPlayer.name} completed all 4 tokens and claimed 1st Place!`, 'info');
      }
      return;
    }

    // Grant bonus turn if rolled a 6 OR if captured an enemy piece!
    const grantBonusTurn = roll === 6 || capturedOpponent;
    if (grantBonusTurn) {
      sound.playEquip();
      logAction(`⚡ Bonus turn granted to ${movedPlayer.name}!`);
    }

    advanceToNextPlayer(grantBonusTurn);
  };

  // ─── ADVANCE TO NEXT PLAYER ──────────────────────────────────────────────
  const advanceToNextPlayer = (bonusTurn: boolean) => {
    if (winner) return;

    if (!bonusTurn) {
      const order: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
      const nextIdx = (order.indexOf(currentTurn) + 1) % 4;
      setCurrentTurn(order[nextIdx]);
    }

    setCanRoll(true);
    setDiceRoll(null);
  };

  // AI Turn trigger
  useEffect(() => {
    if (winner) return;
    if (activePlayer.isAi && canRoll && !isRolling) {
      const timer = setTimeout(() => {
        handleRollDice();
      }, stepDelay);
      return () => clearTimeout(timer);
    }
  }, [currentTurn, canRoll, isRolling, winner]);

  const logAction = (msg: string) => {
    setMatchLogs((prev) => [msg, ...prev.slice(0, 30)]);
  };

  // Reset match
  const handleResetMatch = () => {
    sound.playEquip();
    setPlayers((prev) =>
      prev.map((pl) => ({
        ...pl,
        pieces: pl.pieces.map((pc) => ({ ...pc, step: -1, hasShield: false })),
      }))
    );
    setCurrentTurn('red');
    setDiceRoll(null);
    setWinner(null);
    setCanRoll(true);
    setSelectablePieces([]);
    setMatchLogs(['New match initialized. Roll a 6 to deploy your avatar.']);
  };

  return (
    <div className="min-h-screen bg-[#040608] text-white pt-20 pb-16 px-4 sm:px-6 lg:px-8 font-sans">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* TOP HEADER & NAVIGATION                                       */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/lobby"
              className="p-1.5 rounded-lg border border-white/10 hover:border-[#00FF66]/40 text-white/50 hover:text-white transition-all"
            >
              <ChevronLeft size={16} />
            </Link>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#00FF66] font-bold px-2 py-0.5 rounded bg-[#00FF66]/10 border border-[#00FF66]/30">
              CYBER COLOSSEUM BOARD // REAL-TIME
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">
            Cyber Ludo Arena
          </h1>
          <p className="text-xs text-white/50 font-mono">
            4-Player Holographic Ludo with your custom avatars as battle pieces.
          </p>
        </div>

        {/* Tab & Controls Bar */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-white/5 p-1 border border-white/10 text-xs font-mono font-bold">
            <button
              onClick={() => setActiveTab('board')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'board' ? 'bg-[#00FF66] text-black shadow-[0_0_12px_#00FF66]' : 'text-white/60 hover:text-white'
              }`}
            >
              Board Arena
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'leaderboard' ? 'bg-[#00FF66] text-black shadow-[0_0_12px_#00FF66]' : 'text-white/60 hover:text-white'
              }`}
            >
              Leaderboard
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'rules' ? 'bg-[#00FF66] text-black shadow-[0_0_12px_#00FF66]' : 'text-white/60 hover:text-white'
              }`}
            >
              Cyber Rules
            </button>
          </div>

          <button
            onClick={handleResetMatch}
            className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 text-white/60 hover:text-white transition-all"
            title="Reset Board"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: LIVE LUDO 15x15 BOARD                                  */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'board' && (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT 8 COLS: 15x15 NEON CYBER BOARD */}
          <div className="lg:col-span-8 flex flex-col items-center">
            {/* Active Turn Banner */}
            <div
              className="w-full max-w-lg mb-3 px-4 py-2.5 rounded-2xl border flex items-center justify-between shadow-lg"
              style={{
                borderColor: activePlayer.colorHex,
                backgroundColor: activePlayer.bgHex,
              }}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3.5 h-3.5 rounded-full animate-ping"
                  style={{ backgroundColor: activePlayer.colorHex }}
                />
                <div>
                  <span className="text-[10px] font-mono uppercase text-white/50">Current Turn</span>
                  <p className="text-sm font-black uppercase text-white tracking-wide">
                    {activePlayer.name} {!activePlayer.isAi && '(YOU)'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-white/60">Speed:</span>
                {(['1x', '2x', 'instant'] as const).map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setGameSpeed(spd)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition-all ${
                      gameSpeed === spd ? 'bg-white text-black' : 'bg-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    {spd}
                  </button>
                ))}
              </div>
            </div>

            {/* 15x15 Grid Board Container */}
            <div className="relative w-full max-w-lg aspect-square bg-[#080d0a] border-2 border-white/20 rounded-3xl p-2 sm:p-3 shadow-[0_0_40px_rgba(0,0,0,0.9)] overflow-hidden">
              {/* Inner Cross-Grid Construction */}
              <div className="grid grid-cols-15 grid-rows-15 w-full h-full gap-0.5 sm:gap-1">
                {/* 15x15 Cells Rendering */}
                {Array.from({ length: 15 }).map((_, r) =>
                  Array.from({ length: 15 }).map((_, c) => {
                    const isRedYard = r < 6 && c < 6;
                    const isGreenYard = r < 6 && c >= 9;
                    const isYellowYard = r >= 9 && c >= 9;
                    const isBlueYard = r >= 9 && c < 6;
                    const isGoal = r >= 6 && r <= 8 && c >= 6 && c <= 8;

                    // Check Home Columns
                    const isRedHomeCol = r === 7 && c >= 1 && c <= 5;
                    const isGreenHomeCol = c === 7 && r >= 1 && r <= 5;
                    const isYellowHomeCol = r === 7 && c >= 9 && c <= 13;
                    const isBlueHomeCol = c === 7 && r >= 9 && r <= 13;

                    // Track Matching
                    const trackIdx = TRACK_COORDS.findIndex(([trR, trC]) => trR === r && trC === c);
                    const isTrack = trackIdx !== -1;
                    const isSafeStar = trackIdx !== -1 && SAFE_TRACK_INDICES.has(trackIdx);
                    const powerup = trackIdx !== -1 ? CYBER_POWERUPS.find((pu) => pu.index === trackIdx) : null;

                    // Track Pieces on this cell
                    const piecesHere = players.flatMap((pl) =>
                      pl.pieces
                        .filter((pc) => {
                          if (pc.step === -1) return false;
                          const [pcR, pcC] = getPieceCoordinates(pl.id, pc.step);
                          return pcR === r && pcC === c;
                        })
                        .map((pc) => ({ piece: pc, player: pl }))
                    );

                    return (
                      <div
                        key={`${r}-${c}`}
                        className={`relative rounded-sm sm:rounded-md flex items-center justify-center transition-all ${
                          isRedYard
                            ? 'bg-red-950/20 border border-red-500/10'
                            : isGreenYard
                            ? 'bg-emerald-950/20 border border-emerald-500/10'
                            : isYellowYard
                            ? 'bg-amber-950/20 border border-amber-500/10'
                            : isBlueYard
                            ? 'bg-cyan-950/20 border border-cyan-500/10'
                            : isGoal
                            ? 'bg-gradient-to-br from-red-500/30 via-yellow-400/30 to-[#00FF66]/30 border border-white/20'
                            : isRedHomeCol
                            ? 'bg-red-500/30 border border-red-500/50'
                            : isGreenHomeCol
                            ? 'bg-emerald-500/30 border border-emerald-500/50'
                            : isYellowHomeCol
                            ? 'bg-amber-500/30 border border-amber-500/50'
                            : isBlueHomeCol
                            ? 'bg-cyan-500/30 border border-cyan-500/50'
                            : isTrack
                            ? 'bg-white/5 border border-white/10 hover:border-white/20'
                            : 'bg-transparent'
                        }`}
                      >
                        {/* Safe Star Icon */}
                        {isSafeStar && (
                          <Star size={10} className="text-amber-400 fill-amber-400/80 drop-shadow" />
                        )}

                        {/* Cyber Powerup Icon */}
                        {powerup && (
                          <span className="text-[9px] drop-shadow animate-pulse" title={powerup.label}>
                            {powerup.icon}
                          </span>
                        )}

                        {/* Goal Trophy in center */}
                        {r === 7 && c === 7 && (
                          <Crown size={18} className="text-amber-300 drop-shadow-[0_0_10px_#F59E0B]" />
                        )}

                        {/* Render Tokens on this Cell */}
                        {piecesHere.map(({ piece, player }) => {
                          const isSelectable =
                            activePlayer.id === player.id &&
                            selectablePieces.includes(piece.id) &&
                            !activePlayer.isAi;

                          return (
                            <button
                              key={`${player.id}-${piece.id}`}
                              onClick={() => {
                                if (isSelectable && diceRoll !== null) {
                                  movePiece(player.id, piece.id, diceRoll);
                                }
                              }}
                              disabled={!isSelectable}
                              className={`absolute w-4 h-4 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-mono font-bold text-[9px] border-2 shadow-md transition-all ${
                                isSelectable
                                  ? 'scale-125 z-30 cursor-pointer animate-bounce border-white'
                                  : 'z-10'
                              }`}
                              style={{
                                backgroundColor: player.colorHex,
                                borderColor: isSelectable ? '#FFFFFF' : player.accentHex,
                                boxShadow: `0 0 10px ${player.colorHex}`,
                              }}
                              title={`${player.name}'s token #${piece.id + 1}`}
                            >
                              <span className="text-[8px] text-white select-none">
                                {player.id === 'red' ? '👤' : player.id[0].toUpperCase()}
                              </span>
                              {piece.hasShield && (
                                <span className="absolute -top-1 -right-1 text-[8px]">🛡️</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </div>

              {/* 4 YARD PODS (TOKENS WAITING IN BASE) */}
              {(['red', 'green', 'yellow', 'blue'] as PlayerColor[]).map((col) => {
                const p = players.find((pl) => pl.id === col)!;
                const pods = YARD_PODS[col];

                return (
                  <React.Fragment key={col}>
                    {p.pieces
                      .filter((pc) => pc.step === -1)
                      .map((pc, idx) => {
                        const pod = pods[pc.id];
                        const isSelectable =
                          activePlayer.id === col &&
                          selectablePieces.includes(pc.id) &&
                          !activePlayer.isAi;

                        return (
                          <div
                            key={`base-${col}-${pc.id}`}
                            className="absolute w-7 h-7 sm:w-9 sm:h-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed flex items-center justify-center pointer-events-none"
                            style={{
                              top: `${(pod[0] / 14) * 100}%`,
                              left: `${(pod[1] / 14) * 100}%`,
                              borderColor: p.accentHex,
                              backgroundColor: 'rgba(0,0,0,0.5)',
                            }}
                          >
                            <button
                              onClick={() => {
                                if (isSelectable && diceRoll !== null) {
                                  movePiece(col, pc.id, diceRoll);
                                }
                              }}
                              disabled={!isSelectable}
                              className={`pointer-events-auto w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs border-2 shadow-lg transition-all ${
                                isSelectable
                                  ? 'scale-125 z-30 cursor-pointer animate-bounce border-white'
                                  : 'z-10'
                              }`}
                              style={{
                                backgroundColor: p.colorHex,
                                borderColor: isSelectable ? '#FFFFFF' : p.accentHex,
                                boxShadow: `0 0 12px ${p.colorHex}`,
                              }}
                              title={`${p.name} Token in Base (Roll 6 to deploy)`}
                            >
                              <span className="text-[10px] text-white">
                                {col === 'red' ? '👤' : col[0].toUpperCase()}
                              </span>
                            </button>
                          </div>
                        );
                      })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* RIGHT 4 COLS: INTERACTIVE CYBER DICE & STATUS */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Interactive Holographic Dice Station */}
            <div className="p-5 rounded-3xl bg-black/60 border border-white/15 flex flex-col items-center text-center shadow-xl">
              <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest mb-3">
                Quantum Grav-Dice
              </span>

              {/* 3D Dice Display Box */}
              <motion.div
                animate={isRolling ? { rotate: [0, 90, 180, 270, 360], scale: [1, 1.15, 0.9, 1] } : {}}
                transition={{ duration: 0.45, ease: 'easeInOut' }}
                className="w-24 h-24 rounded-2xl border-2 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                style={{
                  backgroundColor: activePlayer.bgHex,
                  borderColor: activePlayer.colorHex,
                }}
              >
                {diceRoll ? (
                  <span
                    className="text-5xl font-black font-mono text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                    style={{ color: activePlayer.colorHex }}
                  >
                    {diceRoll}
                  </span>
                ) : (
                  <Dice6 size={48} className="text-white/40" />
                )}
              </motion.div>

              {/* Roll Button for Human Player */}
              {!activePlayer.isAi && (
                <button
                  onClick={handleRollDice}
                  disabled={!canRoll || isRolling || !!winner}
                  className={`w-full py-3 rounded-2xl font-black font-mono uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all ${
                    canRoll && !isRolling && !winner
                      ? 'bg-[#00FF66] hover:bg-emerald-300 text-black shadow-[0_0_20px_rgba(0,255,102,0.4)] hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-white/10 text-white/40 cursor-not-allowed'
                  }`}
                >
                  <Sparkles size={14} />
                  <span>{isRolling ? 'CALCULATING ROLL...' : 'ROLL QUANTUM DIE'}</span>
                </button>
              )}

              {activePlayer.isAi && (
                <div className="py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white/60 animate-pulse">
                  🤖 {activePlayer.name} analyzing board...
                </div>
              )}
            </div>

            {/* 4 Competitors Progress Panel */}
            <div className="p-4 rounded-3xl bg-black/60 border border-white/15 flex flex-col gap-2.5">
              <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest mb-1">
                Colosseum Competitors (4)
              </span>

              {players.map((pl) => {
                const finishedCount = pl.pieces.filter((pc) => pc.step === 57).length;
                const inPlayCount = pl.pieces.filter((pc) => pc.step >= 0 && pc.step < 57).length;
                const inBaseCount = pl.pieces.filter((pc) => pc.step === -1).length;

                return (
                  <div
                    key={pl.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                      currentTurn === pl.id
                        ? 'border-white/40 bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: pl.colorHex }}
                      />
                      <div>
                        <span className="text-xs font-bold text-white block leading-tight">
                          {pl.name} {!pl.isAi && '(YOU)'}
                        </span>
                        <span className="text-[9px] font-mono text-white/40">
                          {finishedCount}/4 Goals • {inPlayCount} Active
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {pl.pieces.map((pc) => (
                        <span
                          key={pc.id}
                          className={`w-2 h-2 rounded-full ${
                            pc.step === 57
                              ? 'bg-amber-400 shadow-[0_0_6px_#F59E0B]'
                              : pc.step >= 0
                              ? 'bg-white'
                              : 'bg-white/20'
                          }`}
                          title={`Piece #${pc.id + 1}: ${pc.step === 57 ? 'Goal' : pc.step === -1 ? 'Base' : `Step ${pc.step}`}`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Combat Log Feed */}
            <div className="p-4 rounded-3xl bg-black/60 border border-white/15 flex flex-col gap-2">
              <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">
                Arena Match Telemetry
              </span>
              <div className="h-36 overflow-y-auto font-mono text-[10px] text-white/70 space-y-1.5 pr-1">
                {matchLogs.map((log, i) => (
                  <p key={i} className="leading-tight border-b border-white/5 pb-1">
                    {log}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: CYBER LUDO GLOBAL LEADERBOARD                          */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'leaderboard' && (
        <div className="max-w-4xl mx-auto p-6 rounded-3xl bg-black/60 border border-white/15 shadow-2xl">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-xl font-black uppercase text-white">Ludo Apex Grand Prix</h2>
              <p className="text-xs font-mono text-white/50">Top board tacticians ranked by total cyber wins</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs">
              <Trophy size={14} />
              <span>Season 1 Live</span>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { rank: 1, name: 'KAGE-07', role: 'Cyber Shinobi', wins: 48, rate: '78%', reward: '25,000🪙' },
              { rank: 2, name: 'AURA-V', role: 'Valkyrie Vanguard', wins: 41, rate: '71%', reward: '15,000🪙' },
              { rank: 3, name: currentAvatar.name || 'Your Avatar', role: 'Human Vanguard', wins: 29, rate: '64%', reward: '10,000🪙' },
              { rank: 4, name: 'SYLPH-X', role: 'Wind Archer', wins: 22, rate: '58%', reward: '5,000🪙' },
              { rank: 5, name: 'RUNIC-G', role: 'Forge Golem', wins: 18, rate: '51%', reward: '2,500🪙' },
            ].map((entry) => (
              <div
                key={entry.rank}
                className={`p-3.5 rounded-2xl border flex items-center justify-between font-mono text-xs ${
                  entry.name === (currentAvatar.name || 'Your Avatar')
                    ? 'border-[#00FF66]/50 bg-[#00FF66]/10 text-white shadow-[0_0_15px_rgba(0,255,102,0.2)]'
                    : 'border-white/10 bg-white/5 text-white/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 font-black text-sm ${entry.rank === 1 ? 'text-amber-400' : 'text-white/40'}`}>
                    #{entry.rank}
                  </span>
                  <div>
                    <span className="font-bold text-white uppercase block">{entry.name}</span>
                    <span className="text-[10px] text-white/40">{entry.role}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="font-bold text-[#00FF66]">{entry.wins} WINS</span>
                    <span className="text-[10px] text-white/40 block">{entry.rate} WINRATE</span>
                  </div>
                  <span className="text-amber-300 font-bold">{entry.reward}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 3: CYBER RULES & POWER-UPS GUIDE                          */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'rules' && (
        <div className="max-w-4xl mx-auto p-6 rounded-3xl bg-black/60 border border-white/15 space-y-6">
          <div>
            <h2 className="text-xl font-black uppercase text-white mb-1">Cyber Ludo Manual & Protocol</h2>
            <p className="text-xs font-mono text-white/50">Master standard Ludo rules with cybernetic twists</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
              <span className="text-xl">🎲</span>
              <h3 className="text-sm font-bold text-white uppercase">Roll a 6 to Deploy</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Avatars start safely locked in their base yard. You must roll a 6 on the quantum die to deploy them onto your track entrance. Rolling a 6 also awards an instant bonus roll!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
              <span className="text-xl">💥</span>
              <h3 className="text-sm font-bold text-white uppercase">Capture & Bonus Turns</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Landing on an opponent's avatar on non-safe tiles captures it, returning it to their home base and granting you a free bonus turn!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
              <span className="text-xl">⭐</span>
              <h3 className="text-sm font-bold text-white uppercase">Safe Star Havens</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Tiles marked with Stars and Starters are quantum-shielded sanctuaries where pieces cannot be captured.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#00FF66]/10 border border-[#00FF66]/30">
            <h3 className="text-sm font-bold text-[#00FF66] uppercase mb-2 flex items-center gap-1.5">
              <Zap size={14} />
              <span>Cyber Power-Up Tiles</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <div>
                  <span className="font-bold text-white block">Overdrive Boost</span>
                  <span className="text-white/50">Grants +2 step sprint</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🛡️</span>
                <div>
                  <span className="font-bold text-white block">Quantum Shield</span>
                  <span className="text-white/50">Protects from 1 capture</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🌀</span>
                <div>
                  <span className="font-bold text-white block">Warp Portal</span>
                  <span className="text-white/50">Shortcuts +4 tiles forward</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* VICTORY CELEBRATION MODAL                                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {winner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-300">
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md rounded-3xl bg-[#080d0a] border border-white/20 p-6 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.9)] text-center flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.5)] mb-4">
                <Trophy size={42} className="text-amber-300 drop-shadow-[0_0_15px_#F59E0B]" />
              </div>

              <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest font-bold">
                CYBER LUDO TOURNAMENT COMPLETE
              </span>

              <h2 className="text-3xl font-black uppercase text-white mt-1">
                {winner.id === 'red' ? 'YOU WON 1ST PLACE!' : `${winner.name} WINS!`}
              </h2>

              <p className="text-xs text-white/60 mt-1 max-w-xs">
                {winner.id === 'red'
                  ? 'All 4 of your cyber avatars safely reached the Singularity Nexus! +500 Coins awarded.'
                  : `${winner.name} maneuvered all 4 tokens to the goal before other competitors.`}
              </p>

              {winner.id === 'red' && (
                <div className="my-5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-amber-300 font-mono font-bold text-sm">
                  <Coins size={16} />
                  <span>REWARD: +500 CYBER COINS</span>
                </div>
              )}

              <div className="flex gap-3 w-full mt-4">
                <button
                  onClick={handleResetMatch}
                  className="flex-1 py-3 rounded-2xl bg-[#00FF66] text-black font-black uppercase tracking-wider text-xs shadow-[0_0_20px_rgba(0,255,102,0.4)] transition-all hover:scale-[1.02]"
                >
                  Play Rematch
                </button>
                <Link
                  href="/lobby"
                  className="py-3 px-5 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-wider text-xs transition-all"
                >
                  Return to Hub
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
