'use client';
// app/ludo/page.tsx
// Cyber Ludo 3D Colosseum — Signature Green & Black Singularity Theme
// Butter-smooth 60+ FPS waypoint hopping animation (useFrame driven, 0 intermediate React re-renders),
// procedural 3D avatars, dynamic combat clashes, power-ups, and interactive 3D quantum dice.

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dice6,
  Trophy,
  Zap,
  Sparkles,
  RotateCcw,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Coins,
  Camera,
  Compass,
  Trees,
} from 'lucide-react';
import { useAvatarStore } from '@/store/avatarStore';
import { AvatarConfig } from '@/types/avatar';
import { PRESET_AVATARS } from '@/data/presets';
import { sound } from '@/lib/audio';
import { useToast } from '@/components/Toast';
import { Ludo3DView } from '@/components/ludo/Ludo3DView';
import {
  CombatClash,
  FloatingText3D,
  CameraPreset,
  ActiveMovement,
  gridToWorld,
  PLATFORM_Y,
} from '@/components/ludo/Ludo3DColosseum';

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
  rank?: number;
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

export const START_TRACK_INDEX: Record<PlayerColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

export const HOME_COLUMNS: Record<PlayerColor, [number, number][]> = {
  red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
  blue: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
};

export const GOAL_COORD: [number, number] = [7, 7];

export const YARD_PODS: Record<PlayerColor, [number, number][]> = {
  red: [[1.5, 1.5], [1.5, 3.5], [3.5, 1.5], [3.5, 3.5]],
  green: [[1.5, 10.5], [1.5, 12.5], [3.5, 10.5], [3.5, 12.5]],
  yellow: [[10.5, 10.5], [10.5, 12.5], [12.5, 10.5], [12.5, 12.5]],
  blue: [[10.5, 1.5], [10.5, 3.5], [12.5, 1.5], [12.5, 3.5]],
};

export const SAFE_TRACK_INDICES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

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
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('isometric');
  const [winner, setWinner] = useState<LudoPlayer | null>(null);

  // Turn management & Console HUD tracking
  const [currentTurn, setCurrentTurn] = useState<PlayerColor>('red');
  const [turnCount, setTurnCount] = useState<number>(3);
  const [matchSeconds, setMatchSeconds] = useState<number>(261); // Starts at 04:21 for rich initial state
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [canRoll, setCanRoll] = useState(true);
  const [selectablePieces, setSelectablePieces] = useState<number[]>([]);
  const [matchLogs, setMatchLogs] = useState<string[]>([
    'Welcome to Singularity Ludo 3D Colosseum! Roll a 6 to deploy your avatar onto the track.',
  ]);
  const [logOpen, setLogOpen] = useState(false);

  // Live Console Match Timer
  useEffect(() => {
    if (winner) return;
    const interval = setInterval(() => {
      setMatchSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [winner]);

  const formattedTimer = useMemo(() => {
    const mins = Math.floor(matchSeconds / 60);
    const secs = matchSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [matchSeconds]);

  // Butter-smooth 60fps movement state
  const [activeMovement, setActiveMovement] = useState<ActiveMovement | null>(null);
  const [consecutiveSixes, setConsecutiveSixes] = useState<number>(0);
  const [activePowerUpBanner, setActivePowerUpBanner] = useState<{
    type: 'boost' | 'shield' | 'warp';
    text: string;
    color: string;
  } | null>(null);

  // 3D Combat clash & floating text state
  const [activeClash, setActiveClash] = useState<CombatClash | null>(null);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText3D[]>([]);

  // 4 Player Crews (Space Station Lounge Factions)
  const [players, setPlayers] = useState<LudoPlayer[]>([
    {
      id: 'red',
      name: currentAvatar.name || 'Astraea Cadet',
      isAi: false,
      avatar: currentAvatar,
      colorHex: '#0099FF', // Astraea Vanguard (Cerulean Hexagon 🛡️)
      accentHex: '#38BDF8',
      bgHex: 'rgba(0, 153, 255, 0.18)',
      pieces: [
        { id: 0, color: 'red', step: -1 },
        { id: 1, color: 'red', step: -1 },
        { id: 2, color: 'red', step: -1 },
        { id: 3, color: 'red', step: -1 },
      ],
    },
    {
      id: 'green',
      name: 'Hyperion Corsair',
      isAi: true,
      avatar: PRESET_AVATARS[1]?.avatar || currentAvatar,
      colorHex: '#FF6633', // Hyperion Corsair (Tangerine Crosshair 🎯)
      accentHex: '#FF8A3D',
      bgHex: 'rgba(255, 102, 51, 0.18)',
      pieces: [
        { id: 0, color: 'green', step: -1 },
        { id: 1, color: 'green', step: -1 },
        { id: 2, color: 'green', step: -1 },
        { id: 3, color: 'green', step: -1 },
      ],
    },
    {
      id: 'yellow',
      name: 'Solar Nova',
      isAi: true,
      avatar: PRESET_AVATARS[3]?.avatar || currentAvatar,
      colorHex: '#FFC700', // Solar Nova (Solar Crown 👑 - True Yellow-Gold)
      accentHex: '#FFE580',
      bgHex: 'rgba(255, 199, 0, 0.18)',
      pieces: [
        { id: 0, color: 'yellow', step: -1 },
        { id: 1, color: 'yellow', step: -1 },
        { id: 2, color: 'yellow', step: -1 },
        { id: 3, color: 'yellow', step: -1 },
      ],
    },
    {
      id: 'blue',
      name: 'Void Syndicate',
      isAi: true,
      avatar: PRESET_AVATARS[2]?.avatar || currentAvatar,
      colorHex: '#9D4EDD', // Void Syndicate (Violet Diamond 💎)
      accentHex: '#C084FC',
      bgHex: 'rgba(157, 78, 221, 0.18)',
      pieces: [
        { id: 0, color: 'blue', step: -1 },
        { id: 1, color: 'blue', step: -1 },
        { id: 2, color: 'blue', step: -1 },
        { id: 3, color: 'blue', step: -1 },
      ],
    },
  ]);

  const activePlayer = useMemo(() => players.find((p) => p.id === currentTurn)!, [players, currentTurn]);

  const turnDelay = gameSpeed === 'instant' ? 80 : gameSpeed === '2x' ? 300 : 550;

  const logAction = (msg: string) => {
    setMatchLogs((prev) => [msg, ...prev.slice(0, 30)]);
  };

  const addFloatingText = (text: string, position: [number, number, number], color: string) => {
    const id = Date.now() + Math.random();
    setFloatingTexts((prev) => [...prev, { id, text, position, color }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
    }, 2200);
  };

  const getPieceCoordinates = (color: PlayerColor, step: number): [number, number] => {
    if (step === -1) return [0, 0];
    if (step >= 57) return GOAL_COORD;
    if (step >= 52) {
      const colIdx = step - 52;
      return HOME_COLUMNS[color][colIdx] || GOAL_COORD;
    }
    const trackIdx = (START_TRACK_INDEX[color] + step) % 52;
    return TRACK_COORDS[trackIdx];
  };

  const getPieceWorldPosition = (color: PlayerColor, step: number, pieceId: number): [number, number, number] => {
    if (step === -1) {
      const pod = YARD_PODS[color][pieceId] || [2, 2];
      return gridToWorld(pod[0], pod[1], PLATFORM_Y + 0.1);
    }
    const [r, c] = getPieceCoordinates(color, step);
    return gridToWorld(r, c, PLATFORM_Y + 0.08);
  };

  // ─── DICE ROLLING ────────────────────────────────────────────────────────
  const handleRollDice = () => {
    if (!canRoll || isRolling || winner || activeMovement) return;

    sound.playDiceRoll();
    setIsRolling(true);
    setCanRoll(false);
    setSelectablePieces([]);

    setTimeout(() => {
      const roll = Math.floor(Math.random() * 6) + 1;
      setDiceRoll(roll);
      setIsRolling(false);

      logAction(`🎲 ${activePlayer.name} rolled a ${roll}!`);

      if (roll === 6) {
        const nextSixes = consecutiveSixes + 1;
        if (nextSixes >= 3) {
          logAction(`⚠️ 3 consecutive sixes! Turn forfeited per official rules.`);
          addToast('⚠️ Three 6s in a row! Turn forfeited.', 'info');
          setConsecutiveSixes(0);
          setTimeout(() => advanceToNextPlayer(false), turnDelay);
          return;
        }
        setConsecutiveSixes(nextSixes);
      } else {
        setConsecutiveSixes(0);
      }

      const valid = getValidMoves(activePlayer, roll);

      if (valid.length === 0) {
        logAction(`${activePlayer.name} has no valid moves. Passing turn.`);
        setTimeout(() => {
          advanceToNextPlayer(roll === 6);
        }, turnDelay);
      } else if (!activePlayer.isAi && valid.length === 1 && valid[0].step === -1 && roll === 6) {
        movePiece(activePlayer.id, valid[0].id, roll);
      } else if (activePlayer.isAi) {
        setTimeout(() => {
          const chosenPiece = chooseAiMove(activePlayer, valid, roll);
          movePiece(activePlayer.id, chosenPiece.id, roll);
        }, turnDelay * 0.4);
      } else {
        setSelectablePieces(valid.map((p) => p.id));
      }
    }, 450);
  };

  const getValidMoves = (player: LudoPlayer, roll: number): LudoPiece[] => {
    return player.pieces.filter((p) => {
      if (p.step === 57) return false;
      if (p.step === -1) return roll === 6;
      if (p.step + roll > 57) return false;
      return true;
    });
  };

  const chooseAiMove = (aiPlayer: LudoPlayer, valid: LudoPiece[], roll: number): LudoPiece => {
    // 1. Capture enemy piece
    for (const piece of valid) {
      if (piece.step !== -1) {
        const targetStep = piece.step + roll;
        if (targetStep < 52) {
          const targetTrackIdx = (START_TRACK_INDEX[aiPlayer.id] + targetStep) % 52;
          if (!SAFE_TRACK_INDICES.has(targetTrackIdx)) {
            for (const other of players) {
              if (other.id !== aiPlayer.id) {
                const oppOnTile = other.pieces.some(
                  (op) => op.step >= 0 && op.step < 52 && (START_TRACK_INDEX[other.id] + op.step) % 52 === targetTrackIdx
                );
                if (oppOnTile) return piece;
              }
            }
          }
        }
      }
    }

    // 2. Goal
    const goalMover = valid.find((p) => p.step + roll === 57);
    if (goalMover) return goalMover;

    // 3. Deploy
    if (roll === 6) {
      const baseDeployer = valid.find((p) => p.step === -1);
      if (baseDeployer) return baseDeployer;
    }

    // 4. Safe Star
    for (const piece of valid) {
      if (piece.step !== -1) {
        const targetStep = piece.step + roll;
        if (targetStep < 52) {
          const targetTrackIdx = (START_TRACK_INDEX[aiPlayer.id] + targetStep) % 52;
          if (SAFE_TRACK_INDICES.has(targetTrackIdx)) return piece;
        }
      }
    }

    return valid.sort((a, b) => b.step - a.step)[0];
  };

  // ─── BUTTER-SMOOTH 60 FPS MOVEMENT (ZERO LAG) ─────────────────────────────
  const movePiece = (color: PlayerColor, pieceId: number, roll: number) => {
    setSelectablePieces([]);

    const player = players.find((p) => p.id === color)!;
    const piece = player.pieces.find((p) => p.id === pieceId)!;
    const startStep = piece.step;

    // Generate intermediate waypoint positions
    const waypoints: [number, number, number][] = [];
    waypoints.push(getPieceWorldPosition(color, startStep, pieceId));

    if (startStep === -1) {
      // Deploy straight to tile 0
      waypoints.push(getPieceWorldPosition(color, 0, pieceId));
    } else {
      for (let s = 1; s <= roll; s++) {
        const nextS = Math.min(57, startStep + s);
        waypoints.push(getPieceWorldPosition(color, nextS, pieceId));
      }
    }

    const speedMultiplier = gameSpeed === 'instant' ? 4.0 : gameSpeed === '2x' ? 2.0 : 1.0;

    // Trigger smooth useFrame motion in 3D canvas (0 React re-renders during motion!)
    setActiveMovement({
      color,
      pieceId,
      waypoints,
      speed: speedMultiplier,
      onComplete: () => {
        setActiveMovement(null);
        const finalStep = startStep === -1 ? 0 : Math.min(57, startStep + roll);

        // Update single React state once upon completion
        setPlayers((prev) =>
          prev.map((pl) =>
            pl.id === color
              ? {
                  ...pl,
                  pieces: pl.pieces.map((pc) => (pc.id === pieceId ? { ...pc, step: finalStep } : pc)),
                }
              : pl
          )
        );

        onPieceFinishedMoving(color, pieceId, roll, finalStep);
      },
    });
  };

  // ─── LANDING RESOLUTION: POWERUPS & COMBAT ────────────────────────────────
  const onPieceFinishedMoving = (
    color: PlayerColor,
    pieceId: number,
    roll: number,
    finalStep: number
  ) => {
    const movedPlayer = players.find((p) => p.id === color)!;
    const [r, c] = getPieceCoordinates(color, finalStep);
    const worldPos = gridToWorld(r, c, PLATFORM_Y);

    // 1. Check Power-Ups on landing
    if (finalStep >= 0 && finalStep < 52) {
      const trackIdx = (START_TRACK_INDEX[color] + finalStep) % 52;
      const powerup = CYBER_POWERUPS.find((pu) => pu.index === trackIdx);

      if (powerup) {
        sound.playEquip();
        if (powerup.type === 'boost') {
          setActivePowerUpBanner({
            type: 'boost',
            text: `⚡ OVERDRIVE BOOST! +2 EXTRA TILES`,
            color: '#00FF66',
          });
          addToast(`⚡ ${movedPlayer.name} triggered Overdrive! +2 Step Boost!`, 'success');
          addFloatingText('⚡ +2 OVERDRIVE!', [worldPos[0], worldPos[1] + 1.2, worldPos[2]], '#00FF66');
          const nextStep = Math.min(57, finalStep + 2);

          // Staged secondary animation: Pawn visibly hops the 2 bonus tiles!
          const bonusWaypoints: [number, number, number][] = [
            getPieceWorldPosition(color, finalStep, pieceId),
            getPieceWorldPosition(color, finalStep + 1, pieceId),
            getPieceWorldPosition(color, nextStep, pieceId),
          ];

          setTimeout(() => {
            setActiveMovement({
              color,
              pieceId,
              waypoints: bonusWaypoints,
              speed: 1.8,
              onComplete: () => {
                setActiveMovement(null);
                setActivePowerUpBanner(null);
                setPlayers((prev) =>
                  prev.map((pl) =>
                    pl.id === color
                      ? {
                          ...pl,
                          pieces: pl.pieces.map((pc) => (pc.id === pieceId ? { ...pc, step: nextStep } : pc)),
                        }
                      : pl
                  )
                );
                checkCombatAfterLanding(color, pieceId, roll, nextStep);
              },
            });
          }, 350);
          return;
        } else if (powerup.type === 'shield') {
          setActivePowerUpBanner({
            type: 'shield',
            text: `🛡️ QUANTUM SHIELD EQUIPPED! PROTECTED FROM KNOCKOUT`,
            color: '#38BDF8',
          });
          setTimeout(() => setActivePowerUpBanner(null), 2000);
          setPlayers((prev) =>
            prev.map((pl) =>
              pl.id === color
                ? {
                    ...pl,
                    pieces: pl.pieces.map((pc) => (pc.id === pieceId ? { ...pc, hasShield: true } : pc)),
                  }
                : pl
            )
          );
          addToast(`🛡️ ${movedPlayer.name} gained a Quantum Shield!`, 'info');
          addFloatingText('🛡️ SHIELD EQUIPPED!', [worldPos[0], worldPos[1] + 1.2, worldPos[2]], '#38BDF8');
        } else if (powerup.type === 'warp') {
          setActivePowerUpBanner({
            type: 'warp',
            text: `🌀 QUANTUM WARP! +4 EXTRA TILES`,
            color: '#C084FC',
          });
          addToast(`🌀 ${movedPlayer.name} triggered Cyber Warp! +4 Warp!`, 'success');
          addFloatingText('🌀 +4 WARP!', [worldPos[0], worldPos[1] + 1.2, worldPos[2]], '#C084FC');
          const nextStep = Math.min(57, finalStep + 4);

          // Staged secondary animation: Pawn visibly hops the 4 warp tiles!
          const bonusWaypoints: [number, number, number][] = [];
          for (let s = 0; s <= 4; s++) {
            bonusWaypoints.push(getPieceWorldPosition(color, Math.min(57, finalStep + s), pieceId));
          }

          setTimeout(() => {
            setActiveMovement({
              color,
              pieceId,
              waypoints: bonusWaypoints,
              speed: 2.2,
              onComplete: () => {
                setActiveMovement(null);
                setActivePowerUpBanner(null);
                setPlayers((prev) =>
                  prev.map((pl) =>
                    pl.id === color
                      ? {
                          ...pl,
                          pieces: pl.pieces.map((pc) => (pc.id === pieceId ? { ...pc, step: nextStep } : pc)),
                        }
                      : pl
                  )
                );
                checkCombatAfterLanding(color, pieceId, roll, nextStep);
              },
            });
          }, 350);
          return;
        }
      }
    }

    checkCombatAfterLanding(color, pieceId, roll, finalStep);
  };

  // ─── 3D COMBAT CLASH RESOLUTION ───────────────────────────────────────────
  const checkCombatAfterLanding = (
    color: PlayerColor,
    pieceId: number,
    roll: number,
    targetStep: number
  ) => {
    const movedPlayer = players.find((p) => p.id === color)!;

    if (targetStep >= 0 && targetStep < 52) {
      const movedTrackIdx = (START_TRACK_INDEX[color] + targetStep) % 52;

      if (!SAFE_TRACK_INDICES.has(movedTrackIdx)) {
        let contestedDefender: { player: LudoPlayer; piece: LudoPiece } | null = null;

        for (const pl of players) {
          if (pl.id !== color) {
            const oppPiece = pl.pieces.find(
              (pc) => pc.step >= 0 && pc.step < 52 && (START_TRACK_INDEX[pl.id] + pc.step) % 52 === movedTrackIdx
            );
            if (oppPiece) {
              contestedDefender = { player: pl, piece: oppPiece };
              break;
            }
          }
        }

        if (contestedDefender) {
          const { player: defPlayer, piece: defPiece } = contestedDefender;
          const [r, c] = TRACK_COORDS[movedTrackIdx];
          const clashPos = gridToWorld(r, c, PLATFORM_Y);

          // Shield block
          if (defPiece.hasShield) {
            sound.playSlash();
            setActiveClash({
              id: `${Date.now()}`,
              attackerColor: color,
              attackerPieceId: pieceId,
              defenderColor: defPlayer.id,
              defenderPieceId: defPiece.id,
              position: clashPos,
              outcome: 'shield_defend',
              stage: 'clash',
            });

            addFloatingText('🛡️ SHIELD BLOCKED!', [clashPos[0], clashPos[1] + 1.2, clashPos[2]], '#38BDF8');
            addToast(`🛡️ ${defPlayer.name}'s Quantum Shield absorbed the strike!`, 'info');
            logAction(`🛡️ ${defPlayer.name}'s shield repelled ${movedPlayer.name}'s attack!`);

            setTimeout(() => {
              sound.playEquip();
              setPlayers((prev) =>
                prev.map((pl) =>
                  pl.id === defPlayer.id
                    ? {
                        ...pl,
                        pieces: pl.pieces.map((pc) =>
                          pc.id === defPiece.id ? { ...pc, hasShield: false } : pc
                        ),
                      }
                    : pl
                )
              );
            }, 500);

            setTimeout(() => {
              setActiveClash(null);
              advanceToNextPlayer(roll === 6);
            }, 1100);

            return;
          }

          // Direct Knockout Capture
          sound.playSlash();
          setActiveClash({
            id: `${Date.now()}`,
            attackerColor: color,
            attackerPieceId: pieceId,
            defenderColor: defPlayer.id,
            defenderPieceId: defPiece.id,
            position: clashPos,
            outcome: 'capture',
            stage: 'clash',
          });

          setTimeout(() => {
            sound.playImpact();
            setActiveClash((prev) => (prev ? { ...prev, stage: 'resolve' } : null));
            addFloatingText('💥 KNOCKOUT CAPTURE!', [clashPos[0], clashPos[1] + 1.2, clashPos[2]], '#EF4444');
            addToast(`💥 ${movedPlayer.name} CAPTURED ${defPlayer.name}'s avatar!`, 'error');
            logAction(`💥 ${movedPlayer.name} captured ${defPlayer.name}'s piece in 3D combat!`);

            setPlayers((prev) =>
              prev.map((pl) => {
                if (pl.id !== defPlayer.id) return pl;
                return {
                  ...pl,
                  pieces: pl.pieces.map((pc) => (pc.id === defPiece.id ? { ...pc, step: -1 } : pc)),
                };
              })
            );
          }, 550);

          setTimeout(() => {
            setActiveClash(null);
            sound.playEquip();
            logAction(`⚡ Bonus turn granted to ${movedPlayer.name}!`);
            advanceToNextPlayer(true);
          }, 1300);

          return;
        }
      }
    }

    // Check Goal
    if (targetStep === 57) {
      sound.playWin();
      addFloatingText('🌟 GOAL REACHED!', [0, 1.8, 0], '#00FF66');
      logAction(`🌟 ${movedPlayer.name} reached the Singularity Nexus!`);
    }

    // Check Match Win
    const allFinished = movedPlayer.pieces.every(
      (p) => p.step === 57 || (p.id === pieceId && targetStep === 57)
    );

    if (allFinished && !winner) {
      sound.playWin();
      setWinner(movedPlayer);
      if (movedPlayer.id === 'red') {
        addCoins(500);
        addToast('🏆 1ST PLACE CHAMPION! +500 Cyber Coins earned!', 'success');
      } else {
        addToast(`${movedPlayer.name} completed all 4 tokens and claimed 1st Place!`, 'info');
      }
      return;
    }

    const grantBonusTurn = roll === 6;
    if (grantBonusTurn) {
      sound.playEquip();
      logAction(`⚡ ${movedPlayer.name} rolled a 6! Granted extra roll.`);
    }

    advanceToNextPlayer(grantBonusTurn);
  };

  const advanceToNextPlayer = (bonusTurn: boolean) => {
    if (winner) return;

    if (!bonusTurn) {
      const order: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
      const nextIdx = (order.indexOf(currentTurn) + 1) % 4;
      if (nextIdx === 0) {
        setTurnCount((prev) => prev + 1);
      }
      setCurrentTurn(order[nextIdx]);
    }

    setCanRoll(true);
    setDiceRoll(null);
  };

  // AI Turn trigger
  useEffect(() => {
    if (winner) return;
    if (activePlayer.isAi && canRoll && !isRolling && !activeClash && !activeMovement) {
      const timer = setTimeout(() => {
        handleRollDice();
      }, turnDelay);
      return () => clearTimeout(timer);
    }
  }, [currentTurn, canRoll, isRolling, winner, activeClash, activeMovement]);

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
    setTurnCount(1);
    setMatchSeconds(0);
    setDiceRoll(null);
    setWinner(null);
    setCanRoll(true);
    setSelectablePieces([]);
    setActiveClash(null);
    setActiveMovement(null);
    setFloatingTexts([]);
    setMatchLogs(['New match initialized on 3D Singularity Platform. Roll a 6 to deploy.']);
  };

  return (
    <div className="bg-[#020502] h-[calc(100dvh-4rem)] w-full overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════════
          FULL-VIEWPORT GAME ARENA
          3D colosseum fills the entire screen, all UI is floating HUD
          ═══════════════════════════════════════════════════════════════ */}
      <div className="game-viewport">

        {/* ── THE 3D CANVAS (FILLS ENTIRE VIEWPORT) ── */}
        <div className="absolute inset-0 z-0">
          <Ludo3DView
            players={players}
            currentTurn={currentTurn}
            diceRoll={diceRoll}
            isRolling={isRolling}
            canRoll={canRoll}
            selectablePieces={selectablePieces}
            winner={winner}
            cameraPreset={cameraPreset}
            activeClash={activeClash}
            floatingTexts={floatingTexts}
            activeMovement={activeMovement}
            onRollDice={handleRollDice}
            onSelectPiece={(pieceId) => {
              if (diceRoll !== null) {
                movePiece(currentTurn, pieceId, diceRoll);
              }
            }}
          />
        </div>

        {/* ══════════════════════════════════════════════════════════
            FLOATING HUD OVERLAYS (CONSOLE GAME STYLE)
            ══════════════════════════════════════════════════════════ */}

        {/* ─── TOP CONSOLE HUD STRIP ─── */}
        <AnimatePresence>
          {activePowerUpBanner && (
            <motion.div
              initial={{ scale: 0.85, y: -20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-6 py-2.5 rounded-2xl bg-black/90 backdrop-blur-xl border font-mono font-black text-xs sm:text-sm uppercase tracking-widest flex items-center gap-2.5 pointer-events-none"
              style={{
                borderColor: activePowerUpBanner.color,
                color: activePowerUpBanner.color,
                boxShadow: `0 0 35px ${activePowerUpBanner.color}70`,
              }}
            >
              <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: activePowerUpBanner.color }} />
              <span>{activePowerUpBanner.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute top-3 left-4 right-4 z-20 flex items-start justify-between pointer-events-none">
          {/* Top-Left: Player Tag & Health Bar */}
          <div className="pointer-events-auto flex flex-col gap-1.5 px-4 py-2.5 rounded-2xl bg-[#181D33]/90 backdrop-blur-xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor] animate-pulse"
                style={{ backgroundColor: activePlayer.colorHex, color: activePlayer.colorHex }}
              />
              <span
                className="text-sm sm:text-base font-bold tracking-wide text-[#FFF8EE]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {currentAvatar.name || activePlayer.name || 'CADET KAI'}
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#00FF66]/15 text-[#00FF66] border border-[#00FF66]/30 uppercase font-bold">
                [{currentAvatar.classRole || 'OPERATIVE'}]
              </span>
            </div>

            {/* Stepped HP Gauge */}
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-[10px] font-bold text-white/50 tracking-wider">HP</span>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 10 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="w-2.5 sm:w-3 h-2.5 rounded-[2px] bg-gradient-to-t from-emerald-500 to-[#00FF66] shadow-[0_0_5px_rgba(0,255,102,0.4)]"
                  />
                ))}
              </div>
              <span className="text-[10px] font-bold text-[#00FF66] ml-1">900/900</span>
            </div>
          </div>

          {/* Top-Center: Lounge Telemetry & Turn Status */}
          <div className="pointer-events-auto flex flex-col items-center">
            <div className="px-5 py-2 rounded-2xl bg-[#181D33]/90 backdrop-blur-xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.8)] flex items-center gap-2.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-ping" />
              <span
                className="text-sm sm:text-base font-bold tracking-widest text-[#FFF8EE] uppercase"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                TURN {String(turnCount).padStart(2, '0')}
              </span>
              <span className="w-1 h-3 bg-white/20" />
              <span
                className="text-xs font-bold font-mono tracking-wider uppercase"
                style={{ color: activePlayer.colorHex }}
              >
                {activePlayer.id === 'red' ? '🛡️ ASTRAEA' : activePlayer.id === 'green' ? '🎯 HYPERION' : activePlayer.id === 'yellow' ? '👑 SOLAR' : '💎 VOID'}
              </span>
              {activeMovement && (
                <span className="text-[9px] text-[#00FF66] bg-[#00FF66]/20 px-2 py-0.5 rounded-full border border-[#00FF66]/40 animate-pulse font-mono">
                  MOVING
                </span>
              )}
              {activeClash && (
                <span className="text-[9px] text-red-400 bg-red-500/20 px-2 py-0.5 rounded-full border border-red-500/40 animate-pulse font-mono">
                  ⚔️ CLASH
                </span>
              )}
            </div>
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#8F97B0] mt-1">
              {activePlayer.isAi ? `${activePlayer.name.toUpperCase()} PONDERING MOVE...` : 'STATION LOUNGE // ROLL LOUNGE DIE'}
            </span>
          </div>

          {/* Top-Right: Match Timer & Camera Controls */}
          <div className="pointer-events-auto flex items-center gap-2 font-mono">
            {/* Live Clock Timer */}
            <div className="px-3.5 py-2 rounded-2xl bg-[#181D33]/90 backdrop-blur-xl border border-white/15 text-[#38BDF8] font-bold text-xs sm:text-sm shadow-lg flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-pulse" />
              <span className="tracking-widest">{formattedTimer}</span>
            </div>

            {/* Camera Presets */}
            <div className="flex items-center gap-0.5 bg-[#181D33]/90 backdrop-blur-xl p-1 rounded-2xl border border-white/15">
              {([
                { key: 'isometric' as CameraPreset, label: '3D' },
                { key: 'topdown' as CameraPreset, label: 'TOP' },
                { key: 'action' as CameraPreset, label: 'ACT' },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setCameraPreset(key)}
                  className={`px-2.5 py-1 rounded-xl text-[9px] font-bold uppercase transition-all ${
                    cameraPreset === key
                      ? 'bg-[#00FF66] text-[#101426] shadow-[0_0_10px_rgba(0,255,102,0.4)]'
                      : 'text-white/40 hover:text-white'
                  }`}
                  title={`${label} camera view`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Speed toggle */}
            <button
              onClick={() => setGameSpeed(gameSpeed === '1x' ? '2x' : gameSpeed === '2x' ? 'instant' : '1x')}
              className="px-2.5 py-2 rounded-2xl bg-[#181D33]/90 backdrop-blur-xl border border-white/15 text-[9px] font-bold text-white/70 hover:text-white uppercase transition-all"
              title="Speed Multiplier"
            >
              {gameSpeed}
            </button>

            {/* Reset button */}
            <button
              onClick={handleResetMatch}
              className="p-2 rounded-2xl bg-[#181D33]/90 backdrop-blur-xl border border-white/15 text-white/50 hover:text-[#FF3B30] transition-all"
              title="Reset Match"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>

        {/* ─── 4 FACTION BASES (OVERLAYING THE 4 QUADRANTS) ─── */}
        {/* Top-Left: ASTRAEA VANGUARD (🛡️ Cerulean Hexagon #0099FF) */}
        <div className="absolute top-24 left-4 z-10 pointer-events-none">
          <div className={`px-3 py-1.5 rounded-2xl bg-[#181D33]/90 backdrop-blur-xl border transition-all flex items-center gap-2.5 ${
            currentTurn === 'red' ? 'border-[#0099FF] shadow-[0_0_18px_rgba(0,153,255,0.45)]' : 'border-white/10'
          }`}>
            <span className="text-base" title="Astraea Vanguard">🛡️</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-bold uppercase text-[#FFF8EE] truncate max-w-[110px]">
                {players[0].name}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                {players[0].pieces.map((pc) => (
                  <span
                    key={pc.id}
                    className={`w-1.5 h-1.5 rounded-full ${
                      pc.step === 57 ? 'bg-[#FFC700] shadow-[0_0_4px_#FFC700]' : pc.step >= 0 ? 'bg-[#0099FF]' : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>
            </div>
            {currentTurn === 'red' && (
              <span className="text-[8px] font-mono font-bold text-[#00FF66] bg-[#00FF66]/20 px-1.5 py-0.5 rounded-full uppercase animate-pulse border border-[#00FF66]/40">
                ACTIVE
              </span>
            )}
          </div>
        </div>

        {/* Top-Right: HYPERION CORSAIR (🎯 Tangerine Crosshair #FF6633) */}
        <div className="absolute top-24 right-4 z-10 pointer-events-none">
          <div className={`px-3 py-1.5 rounded-2xl bg-[#181D33]/90 backdrop-blur-xl border transition-all flex items-center gap-2.5 ${
            currentTurn === 'green' ? 'border-[#FF6633] shadow-[0_0_18px_rgba(255,102,51,0.45)]' : 'border-white/10'
          }`}>
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-mono font-bold uppercase text-[#FFF8EE] truncate max-w-[110px]">
                {players[1].name}
              </span>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                {players[1].pieces.map((pc) => (
                  <span
                    key={pc.id}
                    className={`w-1.5 h-1.5 rounded-full ${
                      pc.step === 57 ? 'bg-[#FFC700] shadow-[0_0_4px_#FFC700]' : pc.step >= 0 ? 'bg-[#FF6633]' : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>
            </div>
            <span className="text-base" title="Hyperion Corsair">🎯</span>
            {currentTurn === 'green' && (
              <span className="text-[8px] font-mono font-bold text-[#00FF66] bg-[#00FF66]/20 px-1.5 py-0.5 rounded-full uppercase animate-pulse border border-[#00FF66]/40">
                ACTIVE
              </span>
            )}
          </div>
        </div>

        {/* Bottom-Left: VOID SYNDICATE (💎 Violet Diamond #9D4EDD) */}
        <div className="absolute bottom-28 left-4 z-10 pointer-events-none">
          <div className={`px-3 py-1.5 rounded-2xl bg-[#181D33]/90 backdrop-blur-xl border transition-all flex items-center gap-2.5 ${
            currentTurn === 'blue' ? 'border-[#9D4EDD] shadow-[0_0_18px_rgba(157,78,221,0.45)]' : 'border-white/10'
          }`}>
            <span className="text-base" title="Void Syndicate">💎</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-bold uppercase text-[#FFF8EE] truncate max-w-[110px]">
                {players[3].name}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                {players[3].pieces.map((pc) => (
                  <span
                    key={pc.id}
                    className={`w-1.5 h-1.5 rounded-full ${
                      pc.step === 57 ? 'bg-[#FFC700] shadow-[0_0_4px_#FFC700]' : pc.step >= 0 ? 'bg-[#9D4EDD]' : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>
            </div>
            {currentTurn === 'blue' && (
              <span className="text-[8px] font-mono font-bold text-[#00FF66] bg-[#00FF66]/20 px-1.5 py-0.5 rounded-full uppercase animate-pulse border border-[#00FF66]/40">
                ACTIVE
              </span>
            )}
          </div>
        </div>

        {/* Bottom-Right: SOLAR NOVA (👑 Solar Crown #FFC700) */}
        <div className="absolute bottom-28 right-4 z-10 pointer-events-none">
          <div className={`px-3 py-1.5 rounded-2xl bg-[#181D33]/90 backdrop-blur-xl border transition-all flex items-center gap-2.5 ${
            currentTurn === 'yellow' ? 'border-[#FFC700] shadow-[0_0_18px_rgba(255,199,0,0.45)]' : 'border-white/10'
          }`}>
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-mono font-bold uppercase text-[#FFF8EE] truncate max-w-[110px]">
                {players[2].name}
              </span>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                {players[2].pieces.map((pc) => (
                  <span
                    key={pc.id}
                    className={`w-1.5 h-1.5 rounded-full ${
                      pc.step === 57 ? 'bg-[#FFC700] shadow-[0_0_4px_#FFC700]' : pc.step >= 0 ? 'bg-[#FFC700]' : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>
            </div>
            <span className="text-base" title="Solar Nova">👑</span>
            {currentTurn === 'yellow' && (
              <span className="text-[8px] font-mono font-bold text-[#00FF66] bg-[#00FF66]/20 px-1.5 py-0.5 rounded-full uppercase animate-pulse border border-[#00FF66]/40">
                ACTIVE
              </span>
            )}
          </div>
        </div>

        {/* ─── CENTER-BOTTOM CONSOLE ACTION AREA: [ ROLL ] ─── */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3 w-full max-w-lg px-4 pointer-events-none">
          {/* Piece selection when dice rolled and choices available */}
          <AnimatePresence>
            {selectablePieces.length > 0 && !activePlayer.isAi && !activeMovement && (
              <motion.div
                initial={{ y: 20, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 15, opacity: 0, scale: 0.95 }}
                className="pointer-events-auto flex items-center gap-2 p-2 rounded-2xl bg-[#181D33]/95 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.85)]"
              >
                <Zap size={15} className="text-[#00FF66] animate-pulse ml-2" />
                <span className="text-[10px] font-mono text-[#8F97B0] uppercase tracking-wider mr-1">
                  ADVANCE:
                </span>
                {selectablePieces.map((pId) => {
                  const pc = activePlayer.pieces.find((p) => p.id === pId)!;
                  return (
                    <button
                      key={pId}
                      onClick={() => {
                        if (diceRoll !== null) movePiece(activePlayer.id, pId, diceRoll);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#00FF66] hover:bg-[#33FF85] text-[#101426] font-bold text-xs uppercase tracking-wider shadow-[0_2px_12px_rgba(0,255,102,0.4)] hover:scale-105 active:scale-95 transition-all"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {pc.step === -1 ? `DEPLOY #${pId + 1}` : `PAWN #${pId + 1} (+${diceRoll})`}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Centered Roll Button Console */}
          <div className="pointer-events-auto flex items-center gap-3">
            {/* 3D Dice Display Container */}
            <motion.div
              animate={isRolling ? { rotate: [0, 90, 180, 360], scale: [1, 1.25, 0.9, 1] } : {}}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center border-2 bg-[#181D33]/90 backdrop-blur-xl shadow-2xl cursor-pointer"
              style={{
                borderColor: activePlayer.colorHex,
                boxShadow: `0 0 20px ${activePlayer.colorHex}40`,
              }}
              onClick={() => {
                if (canRoll && !isRolling && !activePlayer.isAi && !winner && !activeMovement) {
                  handleRollDice();
                }
              }}
            >
              {diceRoll ? (
                <span
                  className="text-3xl font-black font-mono drop-shadow-[0_0_8px_currentColor]"
                  style={{ color: activePlayer.colorHex }}
                >
                  {diceRoll}
                </span>
              ) : (
                <Dice6 size={28} className="text-white/40" />
              )}
            </motion.div>

            {/* Tactile [ ROLL LOUNGE DIE ] Button */}
            {!activePlayer.isAi ? (
              <button
                onClick={handleRollDice}
                disabled={!canRoll || isRolling || !!winner || !!activeMovement}
                className="px-10 sm:px-12 py-3.5 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FF8A3D] hover:from-[#FF8A3D] hover:to-[#FFAA00] text-white font-bold text-xs sm:text-sm tracking-[0.20em] uppercase flex items-center gap-2.5 shadow-[0_4px_28px_rgba(255,107,53,0.5)] hover:shadow-[0_6px_36px_rgba(255,107,53,0.7)] transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <Sparkles size={16} />
                <span>{isRolling ? 'ROLLING...' : 'ROLL DIE'}</span>
              </button>
            ) : (
              <div className="px-8 py-3.5 rounded-2xl bg-[#181D33]/90 backdrop-blur-xl border border-white/15 text-xs font-mono text-white/70 flex items-center gap-2.5 shadow-lg">
                <span
                  className="w-2 h-2 rounded-full animate-ping"
                  style={{ backgroundColor: activePlayer.colorHex }}
                />
                <span className="uppercase tracking-wider">
                  {activePlayer.name} PONDERING MOVE...
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
                {winner.id === 'red' ? 'Victory!' : `${winner.name} Wins`}
              </h2>

              <p className="text-xs text-white/50 mt-2 max-w-xs">
                {winner.id === 'red'
                  ? 'All 4 avatars reached the Nexus. +500 Coins.'
                  : `${winner.name} finished first.`}
              </p>

              {winner.id === 'red' && (
                <div className="mt-4 px-4 py-2 rounded-xl bg-[#00FF66]/10 border border-[#00FF66]/30 text-[#00FF66] text-xs font-bold flex items-center gap-2">
                  <Coins size={14} />
                  <span>+500 COINS</span>
                </div>
              )}

              <div className="flex gap-3 w-full mt-6">
                <button
                  onClick={handleResetMatch}
                  className="hud-action-btn flex-1 py-3 text-xs uppercase tracking-wider"
                >
                  Rematch
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
