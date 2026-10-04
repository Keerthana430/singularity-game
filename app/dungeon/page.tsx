'use client';
// app/dungeon/page.tsx
// DUNGEON HUNTER // LABYRINTH ESCAPE
// Complete Monster Hunting & Tile Labyrinth Adventure
// References: Caveboy Escape (Menu & Stone Tiles) + Monster Roster + Cute Pet Companions

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  X,
  Swords,
  Shield,
  Zap,
  Flame,
  Heart,
  Sparkles,
  Trophy,
  RotateCcw,
  Volume2,
  VolumeX,
  Play,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Key,
  DoorOpen,
  Package,
  BookOpen,
  Info,
  Crown,
  Coins,
  Star,
} from 'lucide-react';
import { useAvatarStore } from '@/store/avatarStore';
import { PET_COMPANIONS, PetCompanion } from '@/data/pets';
import { DUNGEON_MONSTERS, DungeonMonster } from '@/data/monsters';
import { sound } from '@/lib/audio';
import { useToast } from '@/components/Toast';

// ── Tile & Dungeon Grid Definitions ──────────────────────────────────────────
export type TileType = 'start' | 'empty' | 'monster' | 'chest' | 'shrine' | 'key' | 'exit';

export interface DungeonTile {
  x: number;
  y: number;
  type: TileType;
  visited: boolean;
  monsterId?: string;
  cleared?: boolean;
}

export default function DungeonPage() {
  const currentAvatar = useAvatarStore((s) => s.currentAvatar);
  const coins = useAvatarStore((s) => s.coins);
  const addCoins = useAvatarStore((s) => s.addCoins);
  const { add: addToast } = useToast();

  // ── Game Screen State ──────────────────────────────────────────────────────
  const [gameState, setGameState] = useState<'menu' | 'exploring' | 'battle' | 'victory' | 'gameover'>('menu');
  const [gameMode, setGameMode] = useState<'expedition' | 'survival'>('expedition');

  // ── Modals ─────────────────────────────────────────────────────────────────
  const [petModalOpen, setPetModalOpen] = useState(false);
  const [codexModalOpen, setCodexModalOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<PetCompanion>(PET_COMPANIONS[0]); // Pyra default

  // ── Dungeon Run Stats ──────────────────────────────────────────────────────
  const [floor, setFloor] = useState(1);
  const [maxFloorReached, setMaxFloorReached] = useState(1);
  const [stars, setStars] = useState(6);
  const [hasKey, setHasKey] = useState(false);
  const [potions, setPotions] = useState(3);
  const [goldEarned, setGoldEarned] = useState(0);
  const [monstersDefeated, setMonstersDefeated] = useState(0);

  // ── Player Combat Stats (incorporates Avatar + Pet Bonus) ───────────────────
  const baseHp = currentAvatar.species === 'dwarf' ? 1250 : currentAvatar.species === 'ogre' ? 1400 : 1000;
  const petHpBoost = selectedPet.statKey === 'hp' ? baseHp * selectedPet.boostValue : 0;
  const maxHp = Math.round(baseHp + petHpBoost);

  const [playerHp, setPlayerHp] = useState(maxHp);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });

  // ── Combat State ───────────────────────────────────────────────────────────
  const [activeMonster, setActiveMonster] = useState<DungeonMonster | null>(null);
  const [monsterCurrentHp, setMonsterCurrentHp] = useState(100);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [floatingDamage, setFloatingDamage] = useState<{ text: string; color: string; id: number }[]>([]);
  const [isGuarding, setIsGuarding] = useState(false);
  const [petReaction, setPetReaction] = useState<string>('❤️');

  // ── Grid Dimensions (4x4 stone labyrinth) ──────────────────────────────────
  const GRID_SIZE = 4;
  const [grid, setGrid] = useState<DungeonTile[][]>([]);

  // Calculate damage popup helper
  const addFloatingText = (text: string, color = '#00FF66') => {
    const id = Date.now() + Math.random();
    setFloatingDamage((prev) => [...prev, { text, color, id }]);
    setTimeout(() => {
      setFloatingDamage((prev) => prev.filter((item) => item.id !== id));
    }, 1200);
  };

  // ── Initialize Dungeon Floor ───────────────────────────────────────────────
  const generateFloor = (floorNum: number) => {
    const newGrid: DungeonTile[][] = [];

    // Monster pool for this floor
    const floorMonsters = DUNGEON_MONSTERS.filter((m) => {
      if (floorNum === 1) return m.tier === 'common';
      if (floorNum <= 3) return m.tier === 'common' || m.id === 'gargoyle' || m.id === 'mischief-goblin';
      if (floorNum === 4) return m.tier === 'elite' || m.id === 'cave-ogre';
      return true; // Floor 5+ has boss
    });

    for (let y = 0; y < GRID_SIZE; y++) {
      const row: DungeonTile[] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        row.push({
          x,
          y,
          type: 'empty',
          visited: false,
        });
      }
      newGrid.push(row);
    }

    // Start Tile
    newGrid[0][0] = { x: 0, y: 0, type: 'start', visited: true };

    // Exit Tile
    newGrid[GRID_SIZE - 1][GRID_SIZE - 1] = { x: GRID_SIZE - 1, y: GRID_SIZE - 1, type: 'exit', visited: false };

    // Boss Key Tile (Must pick up key to unlock exit)
    const keyCoords = { x: 0, y: GRID_SIZE - 1 };
    newGrid[keyCoords.y][keyCoords.x] = { x: keyCoords.x, y: keyCoords.y, type: 'key', visited: false };

    // Distribute Monsters, Chests, and Shrines
    const availableCells: { x: number; y: number }[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if ((x === 0 && y === 0) || (x === GRID_SIZE - 1 && y === GRID_SIZE - 1) || (x === keyCoords.x && y === keyCoords.y)) {
          continue;
        }
        availableCells.push({ x, y });
      }
    }

    // Shuffle cells
    availableCells.sort(() => Math.random() - 0.5);

    // Place 1 Shrine (+HP)
    if (availableCells.length > 0) {
      const shrineCell = availableCells.pop()!;
      newGrid[shrineCell.y][shrineCell.x] = { x: shrineCell.x, y: shrineCell.y, type: 'shrine', visited: false };
    }

    // Place 2 Chests
    for (let i = 0; i < 2 && availableCells.length > 0; i++) {
      const chestCell = availableCells.pop()!;
      newGrid[chestCell.y][chestCell.x] = { x: chestCell.x, y: chestCell.y, type: 'chest', visited: false };
    }

    // Place Monsters in remaining cells
    while (availableCells.length > 0) {
      const monsterCell = availableCells.pop()!;
      const randomMonster = floorMonsters[Math.floor(Math.random() * floorMonsters.length)];
      newGrid[monsterCell.y][monsterCell.x] = {
        x: monsterCell.x,
        y: monsterCell.y,
        type: 'monster',
        monsterId: randomMonster.id,
        visited: false,
      };
    }

    setGrid(newGrid);
    setPlayerPos({ x: 0, y: 0 });
    setHasKey(false);
  };

  // ── Start Expedition ───────────────────────────────────────────────────────
  const startExpedition = (mode: 'expedition' | 'survival') => {
    setGameMode(mode);
    setFloor(1);
    setPlayerHp(maxHp);
    setPotions(3);
    setGoldEarned(0);
    setMonstersDefeated(0);
    generateFloor(1);
    setGameState('exploring');
    sound.playEquip();
    addToast(`Embarking on ${mode === 'expedition' ? 'Floor 1 Expedition' : 'Endless Survival'} with ${selectedPet.name}!`, 'info');
  };

  // ── Tile Movement ──────────────────────────────────────────────────────────
  const movePlayer = (targetX: number, targetY: number) => {
    if (gameState !== 'exploring') return;

    // Check bounds
    if (targetX < 0 || targetX >= GRID_SIZE || targetY < 0 || targetY >= GRID_SIZE) return;

    // Check adjacency (cardinal directions only)
    const dx = Math.abs(targetX - playerPos.x);
    const dy = Math.abs(targetY - playerPos.y);
    if (dx + dy !== 1) return;

    sound.playClick();
    setPlayerPos({ x: targetX, y: targetY });

    // Reveal tile
    const targetTile = grid[targetY][targetX];
    setGrid((prev) => {
      const updated = prev.map((row) => row.map((cell) => ({ ...cell })));
      updated[targetY][targetX].visited = true;
      return updated;
    });

    // Handle Tile Interactions
    if (targetTile.type === 'key' && !targetTile.cleared) {
      setHasKey(true);
      targetTile.cleared = true;
      sound.playWin();
      addFloatingText('🗝️ Boss Key Acquired!', '#FCD34D');
      addToast('Acquired the Ancient Catacomb Key! The Exit Portal is now unlocked!', 'success');
      setPetReaction('🎉');
    } else if (targetTile.type === 'chest' && !targetTile.cleared) {
      targetTile.cleared = true;
      const goldGain = Math.round(50 + Math.random() * 80 + (selectedPet.statKey === 'gold' ? 30 : 0));
      setGoldEarned((g) => g + goldGain);
      addCoins(goldGain);
      sound.playDiceRoll();
      addFloatingText(`+${goldGain}🪙 Gold Found!`, '#FCD34D');
      setPetReaction('🍪');
    } else if (targetTile.type === 'shrine' && !targetTile.cleared) {
      targetTile.cleared = true;
      const healAmount = Math.round(maxHp * 0.4);
      setPlayerHp((h) => Math.min(maxHp, h + healAmount));
      sound.playFashionVote();
      addFloatingText(`+${healAmount} HP Restored!`, '#00FF66');
      setPetReaction('✨');
    } else if (targetTile.type === 'exit') {
      if (hasKey) {
        // Advance to next floor
        sound.playWin();
        const nextF = floor + 1;
        setFloor(nextF);
        if (nextF > maxFloorReached) setMaxFloorReached(nextF);
        addToast(`Floor ${floor} cleared! Descending to Floor ${nextF}...`, 'success');
        generateFloor(nextF);
      } else {
        addToast('The Portal is locked! Hunt down the Golden Key first!', 'info');
      }
    } else if (targetTile.type === 'monster' && !targetTile.cleared && targetTile.monsterId) {
      // Trigger Monster Encounter!
      const monsterTemplate = DUNGEON_MONSTERS.find((m) => m.id === targetTile.monsterId) || DUNGEON_MONSTERS[0];
      // Clone monster with floor scaling
      const scaledMonster: DungeonMonster = {
        ...monsterTemplate,
        hp: Math.round(monsterTemplate.hp * (1 + (floor - 1) * 0.25)),
        maxHp: Math.round(monsterTemplate.hp * (1 + (floor - 1) * 0.25)),
        atk: Math.round(monsterTemplate.atk * (1 + (floor - 1) * 0.2)),
      };
      setActiveMonster(scaledMonster);
      setMonsterCurrentHp(scaledMonster.hp);
      setCombatLog([`Encountered ${scaledMonster.name}! Prepare for battle!`]);
      setIsPlayerTurn(true);
      setIsGuarding(false);
      setGameState('battle');
      sound.playSweep();
      setPetReaction('🔥');
    }
  };

  // Keyboard navigation listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'exploring') return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') movePlayer(playerPos.x, playerPos.y - 1);
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') movePlayer(playerPos.x, playerPos.y + 1);
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') movePlayer(playerPos.x - 1, playerPos.y);
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') movePlayer(playerPos.x + 1, playerPos.y);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerPos, gameState, grid]);

  // ── Combat Action: Player Strike ───────────────────────────────────────────
  const handlePlayerAttack = () => {
    if (!isPlayerTurn || !activeMonster) return;

    sound.playSlash();
    setIsPlayerTurn(false);

    // Calculate Damage
    const baseAtk = 45;
    const petAtkBoost = selectedPet.statKey === 'atk' ? baseAtk * selectedPet.boostValue : 0;
    const isCrit = Math.random() < 0.25 + (selectedPet.statKey === 'crit' ? selectedPet.boostValue : 0);
    const rawDmg = (baseAtk + petAtkBoost + Math.random() * 20) * (isCrit ? 1.8 : 1.0);
    const damage = Math.max(15, Math.round(rawDmg - activeMonster.def * 0.3));

    const newMonsterHp = Math.max(0, monsterCurrentHp - damage);
    setMonsterCurrentHp(newMonsterHp);
    addFloatingText(`-${damage}${isCrit ? ' CRIT!' : ''}`, isCrit ? '#FCD34D' : '#00FF66');

    setCombatLog((prev) => [
      `You struck ${activeMonster.name} for ${damage} damage!${isCrit ? ' (CRITICAL HIT!)' : ''}`,
      ...prev.slice(0, 4),
    ]);

    // Check Monster Defeat
    if (newMonsterHp <= 0) {
      setTimeout(() => {
        handleMonsterDefeated();
      }, 700);
      return;
    }

    // Monster Counter-attack after 700ms
    setTimeout(() => {
      handleMonsterTurn();
    }, 800);
  };

  // ── Combat Action: Player Guard / Parry ─────────────────────────────────────
  const handlePlayerGuard = () => {
    if (!isPlayerTurn || !activeMonster) return;

    setIsGuarding(true);
    setIsPlayerTurn(false);
    sound.playClick();
    addFloatingText('SHIELD GUARD!', '#38BDF8');

    setCombatLog((prev) => [
      `You raise your guard! Incoming monster damage will be reduced by 70%!`,
      ...prev.slice(0, 4),
    ]);

    setTimeout(() => {
      handleMonsterTurn();
    }, 700);
  };

  // ── Combat Action: Skill Burst ─────────────────────────────────────────────
  const handlePlayerSkill = () => {
    if (!isPlayerTurn || !activeMonster) return;

    sound.playFashionVote();
    setIsPlayerTurn(false);

    const baseMagic = 75;
    const petMagicBoost = selectedPet.statKey === 'magic' ? baseMagic * selectedPet.boostValue : 0;
    const damage = Math.round((baseMagic + petMagicBoost + Math.random() * 25) * 1.5);

    const newMonsterHp = Math.max(0, monsterCurrentHp - damage);
    setMonsterCurrentHp(newMonsterHp);
    addFloatingText(`-${damage} BURST!`, '#A855F7');

    setCombatLog((prev) => [
      `You unleashed a signature Hero Burst on ${activeMonster.name} for ${damage} damage!`,
      ...prev.slice(0, 4),
    ]);

    if (newMonsterHp <= 0) {
      setTimeout(() => {
        handleMonsterDefeated();
      }, 700);
      return;
    }

    setTimeout(() => {
      handleMonsterTurn();
    }, 800);
  };

  // ── Combat Action: Potion ──────────────────────────────────────────────────
  const handleDrinkPotion = () => {
    if (!isPlayerTurn || potions <= 0) return;

    sound.playFashionVote();
    setPotions((p) => p - 1);
    const healAmount = Math.round(maxHp * 0.35);
    setPlayerHp((h) => Math.min(maxHp, h + healAmount));
    addFloatingText(`+${healAmount} HP!`, '#00FF66');

    setCombatLog((prev) => [
      `You drank a Vitality Flask and restored ${healAmount} HP!`,
      ...prev.slice(0, 4),
    ]);
  };

  // ── Monster Turn ───────────────────────────────────────────────────────────
  const handleMonsterTurn = () => {
    if (!activeMonster) return;

    sound.playImpact();

    let rawDmg = activeMonster.atk + Math.random() * 10;
    if (isGuarding) {
      rawDmg *= 0.3; // 70% damage reduction
    }

    // Pet evasion boost
    const evaded = Math.random() < (selectedPet.statKey === 'evasion' ? 0.20 : 0.08);
    if (evaded) {
      addFloatingText('EVADED!', '#67E8F9');
      setCombatLog((prev) => [
        `Thanks to ${selectedPet.name}'s aura, you agilely dodged ${activeMonster.name}'s ${activeMonster.attackName}!`,
        ...prev.slice(0, 4),
      ]);
      setIsGuarding(false);
      setIsPlayerTurn(true);
      return;
    }

    const damageTaken = Math.max(8, Math.round(rawDmg));
    const nextPlayerHp = Math.max(0, playerHp - damageTaken);
    setPlayerHp(nextPlayerHp);
    addFloatingText(`-${damageTaken}`, '#EF4444');

    setCombatLog((prev) => [
      `${activeMonster.name} used ${activeMonster.attackName} dealing ${damageTaken} damage!`,
      ...prev.slice(0, 4),
    ]);

    setIsGuarding(false);

    if (nextPlayerHp <= 0) {
      // Defeat!
      setTimeout(() => {
        setGameState('gameover');
        sound.playImpact();
      }, 600);
    } else {
      setIsPlayerTurn(true);
    }
  };

  // ── Monster Defeated ───────────────────────────────────────────────────────
  const handleMonsterDefeated = () => {
    if (!activeMonster) return;

    sound.playWin();
    const goldDrop = Math.round(activeMonster.goldBounty * (selectedPet.statKey === 'gold' ? 1.25 : 1.0));
    setGoldEarned((g) => g + goldDrop);
    addCoins(goldDrop);
    setStars((s) => s + activeMonster.starBounty);
    setMonstersDefeated((m) => m + 1);

    addToast(`Defeated ${activeMonster.name}! Found +${goldDrop}🪙 Gold!`, 'success');
    setPetReaction('🎉');

    // Mark current grid tile as cleared
    setGrid((prev) => {
      const updated = prev.map((row) => row.map((cell) => ({ ...cell })));
      if (updated[playerPos.y] && updated[playerPos.y][playerPos.x]) {
        updated[playerPos.y][playerPos.x].cleared = true;
      }
      return updated;
    });

    // Check if Floor 5 Boss defeated -> Grand Victory!
    if (floor >= 5 && activeMonster.tier === 'boss') {
      setGameState('victory');
    } else {
      setGameState('exploring');
    }
  };

  return (
    <div className="relative min-h-screen rpg-wood-container flex flex-col select-none text-[#E2F5EC] font-sans overflow-x-hidden">
      {/* ═════════════════════════════════════════════════════════════ */}
      {/* SCREEN 1: TITLE & HUB MENU (REF IMAGE 1: CAVEBOY ESCAPE)     */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {gameState === 'menu' && (
        <div className="relative flex-1 flex flex-col items-center justify-between p-4 sm:p-6 max-w-lg mx-auto w-full my-auto">
          {/* Top Bar with Return Link */}
          <div className="w-full flex items-center justify-between mb-2">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0D1C15]/90 border border-[#1E3E2F] text-xs font-bold text-[#E2F5EC] hover:border-[#00FF66] transition-all shadow-md"
            >
              <ChevronLeft size={16} />
              <span>Lobby</span>
            </Link>

            {/* Gold balance pill */}
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0D1C15]/90 border border-[#1E3E2F] text-xs font-mono font-bold text-[#FCD34D] shadow-md">
              <span>🪙</span>
              <span>{coins.toLocaleString()}</span>
            </div>
          </div>

          {/* Chunky Carved Stone Logo (Caveboy Escape inspired) */}
          <motion.div
            initial={{ scale: 0.9, y: -10 }}
            animate={{ scale: 1, y: 0 }}
            className="flex flex-col items-center text-center my-4 relative"
          >
            {/* Cute bouncing mascot perched on logo (from Image 1 & 3) */}
            <motion.div
              animate={{ y: [-4, 4, -4] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
              className="text-4xl -mb-3 z-10 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
            >
              {selectedPet.emoji}
            </motion.div>

            {/* Chunky Stone Block Logo */}
            <div className="px-6 py-3 rounded-2xl bg-gradient-to-b from-[#18382A] to-[#0A1A12] border-3 border-[#1E3D2F] shadow-[0_8px_25px_rgba(0,0,0,0.7)] flex flex-col items-center">
              <span className="text-[10px] font-mono font-black tracking-widest text-[#00FF66] uppercase">
                ANCIENT LABYRINTH
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-wider text-[#F0FDF4] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                DUNGEON HUNTER
              </h1>
              <span className="text-xs font-bold text-[#6EE7B7] tracking-widest uppercase mt-0.5">
                ESCAPE &bull; MONSTER HUNT
              </span>
            </div>
          </motion.div>

          {/* Current Pet Companion Highlight Pill */}
          <div
            onClick={() => setPetModalOpen(true)}
            className="w-full rpg-leather-panel p-3 flex items-center justify-between mb-4 border border-[#1E3E2F] hover:border-[#00FF66] cursor-pointer transition-all shadow-md group"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#142A1E] border border-[#00FF66]/40 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                {selectedPet.emoji}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-[#F0FDF4] flex items-center gap-1.5">
                  <span>{selectedPet.name}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#00FF66]/20 text-[#00FF66]">
                    PET
                  </span>
                </span>
                <span className="text-[10px] text-[#00FF66] font-semibold">{selectedPet.statBoostDesc}</span>
              </div>
            </div>

            <button className="text-xs font-bold text-[#7E9F90] group-hover:text-[#00FF66] flex items-center gap-1">
              <span>Change</span>
              <span>&gt;</span>
            </button>
          </div>

          {/* Chunky Stone Block Navigation Buttons (Matching Caveboy Escape Layout) */}
          <div className="flex flex-col gap-3 w-full mb-6">
            {/* Button 1: PLAY EXPEDITION */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => startExpedition('expedition')}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-b from-[#1C3E2F] to-[#0D2218] border-2 border-[#00FF66] text-[#00FF66] font-black text-lg uppercase tracking-wider shadow-[0_6px_20px_rgba(0,255,102,0.25)] flex items-center justify-center gap-2 hover:bg-[#00FF66] hover:text-[#05140C] transition-all"
            >
              <Swords size={20} />
              <span>PLAY EXPEDITION</span>
            </motion.button>

            {/* Button 2: SURVIVAL RUSH (6/999 ⭐) */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => startExpedition('survival')}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-b from-[#182C22] to-[#0A1610] border-2 border-[#1E3E2F] text-[#FDE68A] font-black text-base uppercase tracking-wider shadow-md flex items-center justify-between hover:border-[#F59E0B] transition-all"
            >
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-[#F59E0B]" />
                <span>SURVIVAL RUSH</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-mono font-bold bg-black/40 px-2.5 py-1 rounded-full text-[#FCD34D] border border-[#F59E0B]/30">
                <span>{stars} / 999</span>
                <Star size={12} fill="#FCD34D" />
              </div>
            </motion.button>

            {/* Button 3: PET COMPANION ROSTER */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setPetModalOpen(true)}
              className="w-full py-3 px-6 rounded-2xl bg-gradient-to-b from-[#14261D] to-[#09140E] border border-[#1E3E2F] text-[#E2F5EC] font-bold text-sm uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 hover:border-[#67E8F9] transition-all"
            >
              <span>🐾</span>
              <span>SELECT PET COMPANION</span>
            </motion.button>

            {/* Button 4: MONSTER CODEX */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCodexModalOpen(true)}
              className="w-full py-2.5 px-6 rounded-2xl bg-[#091510] border border-[#162E23] text-[#7E9F90] font-bold text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 hover:text-white transition-all"
            >
              <BookOpen size={14} />
              <span>MONSTER CODEX (10 MONSTERS)</span>
            </motion.button>
          </div>

          {/* Chunky Stone Icon Bar (Ref Image 1 Bottom Icons) */}
          <div className="flex items-center justify-center gap-3 w-full">
            {/* Share / Restart */}
            <button
              onClick={() => addToast('Dungeon Hunter seed shared!', 'info')}
              className="w-12 h-12 rounded-xl bg-[#0D1F17] border-2 border-[#1E3E2F] flex items-center justify-center text-lg text-[#7E9F90] hover:text-[#00FF66] hover:border-[#00FF66] transition-all shadow-md"
            >
              🔄
            </button>

            {/* Trophy */}
            <button
              onClick={() => addToast(`Current Best: Floor ${maxFloorReached} Cleared!`, 'info')}
              className="w-12 h-12 rounded-xl bg-[#0D1F17] border-2 border-[#1E3E2F] flex items-center justify-center text-lg text-[#FCD34D] hover:scale-105 transition-all shadow-md"
            >
              🏆
            </button>

            {/* Leaderboard */}
            <button
              onClick={() => addToast('Leaderboard synced with Hall of Valor!', 'info')}
              className="w-12 h-12 rounded-xl bg-[#0D1F17] border-2 border-[#1E3E2F] flex items-center justify-center text-lg text-[#38BDF8] hover:scale-105 transition-all shadow-md"
            >
              📊
            </button>

            {/* Settings */}
            <Link
              href="/studio"
              className="w-12 h-12 rounded-xl bg-[#0D1F17] border-2 border-[#1E3E2F] flex items-center justify-center text-lg text-[#A855F7] hover:scale-105 transition-all shadow-md"
              title="Equip Studio Gear"
            >
              ⚙️
            </Link>

            {/* Cute Creature Icon */}
            <button
              onClick={() => setPetModalOpen(true)}
              className="w-12 h-12 rounded-xl bg-[#0D1F17] border-2 border-[#1E3E2F] flex items-center justify-center text-lg text-[#00FF66] hover:scale-105 transition-all shadow-md"
              title="Cute Pets"
            >
              🐙
            </button>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* SCREEN 2: DUNGEON GRID LABYRINTH EXPLORATION                 */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {gameState === 'exploring' && (
        <div className="relative flex-1 flex flex-col items-center justify-between p-3 sm:p-5 max-w-lg mx-auto w-full">
          {/* Top Floor HUD */}
          <div className="w-full flex items-center justify-between mb-3 bg-[#0D1C15]/95 border border-[#1E3E2F] p-3 rounded-2xl shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#00FF66] bg-[#00FF66]/15 px-2.5 py-1 rounded-full border border-[#00FF66]/30">
                {gameMode === 'expedition' ? `B${floor}F` : 'SURVIVAL'}
              </span>
              <span className="text-xs font-black text-[#F0FDF4] uppercase">
                {floor >= 5 ? 'Lich Throne' : floor >= 3 ? 'Overgrown Crypt' : 'Ancient Catacomb'}
              </span>
            </div>

            {/* Key, Potions, Gold */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${hasKey ? 'bg-[#FCD34D]/20 border-[#FCD34D] text-[#FCD34D]' : 'bg-black/30 border-white/10 text-white/40'}`}>
                <Key size={12} />
                <span>{hasKey ? 'KEY' : 'NO KEY'}</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00FF66]/15 border border-[#00FF66]/40 text-[#00FF66]">
                <span>🧪</span>
                <span>{potions}</span>
              </div>
              <div className="flex items-center gap-1 text-[#FCD34D]">
                <span>🪙</span>
                <span>{goldEarned}</span>
              </div>
            </div>
          </div>

          {/* Health Bar with Numeric Info */}
          <div className="w-full bg-[#0B1712] border border-[#1E3E2F] p-2.5 rounded-xl mb-4 shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
              <span className="text-[#8CA79B] flex items-center gap-1">
                <Heart size={12} className="text-rose-400" />
                <span>{currentAvatar.name}</span>
              </span>
              <span className="text-[#00FF66]">{playerHp} / {maxHp} HP</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-black/60 overflow-hidden border border-[#1E3E2F]">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-[#00FF66] transition-all duration-300"
                style={{ width: `${Math.max(0, (playerHp / maxHp) * 100)}%` }}
              />
            </div>
          </div>

          {/* The 4x4 Chunky Stone Board */}
          <div className="relative p-3 rounded-3xl bg-[#0A1611] border-3 border-[#1E3D2F] shadow-[0_12px_35px_rgba(0,0,0,0.8)] mb-4">
            <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
              {grid.map((row, y) =>
                row.map((cell, x) => {
                  const isPlayerHere = playerPos.x === x && playerPos.y === y;
                  const isAdjacent = Math.abs(x - playerPos.x) + Math.abs(y - playerPos.y) === 1;

                  return (
                    <motion.button
                      key={`${x}-${y}`}
                      whileHover={isAdjacent ? { scale: 1.05 } : {}}
                      whileTap={isAdjacent ? { scale: 0.95 } : {}}
                      onClick={() => movePlayer(x, y)}
                      disabled={!isAdjacent && !isPlayerHere}
                      className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl flex flex-col items-center justify-center relative transition-all border-2 ${
                        isPlayerHere
                          ? 'bg-[#153426] border-[#00FF66] shadow-[0_0_18px_rgba(0,255,102,0.4)] z-20'
                          : cell.visited
                          ? 'bg-[#0E2018] border-[#1E3E2F]'
                          : isAdjacent
                          ? 'bg-[#0D1C15] border-[#2A523E] hover:border-[#00FF66]/60 cursor-pointer shadow-sm'
                          : 'bg-[#08120D] border-[#14261D] opacity-75'
                      }`}
                    >
                      {/* Player Avatar & Companion on the tile */}
                      {isPlayerHere ? (
                        <div className="relative flex items-center justify-center">
                          {/* Player Head Icon */}
                          <div className="w-8 h-8 rounded-full bg-[#00FF66] text-black font-black flex items-center justify-center text-xs shadow-md">
                            {currentAvatar.name.slice(0, 1).toUpperCase()}
                          </div>
                          {/* Cute Pet bouncing next to player */}
                          <motion.div
                            animate={{ y: [-2, 2, -2] }}
                            transition={{ repeat: Infinity, duration: 1.6 }}
                            className="absolute -top-3 -right-3 text-lg filter drop-shadow"
                          >
                            {selectedPet.emoji}
                          </motion.div>
                          {/* Pet reaction bubble */}
                          <div className="absolute -top-5 left-0 text-[10px] bg-black/80 px-1 rounded-full border border-[#00FF66]/40">
                            {petReaction}
                          </div>
                        </div>
                      ) : cell.visited || isAdjacent ? (
                        <>
                          {/* Tile Contents */}
                          {cell.type === 'start' && <span className="text-xl">🚪</span>}
                          {cell.type === 'key' && !cell.cleared && (
                            <span className="text-2xl animate-bounce">🗝️</span>
                          )}
                          {cell.type === 'chest' && !cell.cleared && (
                            <span className="text-2xl animate-pulse">📦</span>
                          )}
                          {cell.type === 'shrine' && !cell.cleared && (
                            <span className="text-2xl">🧪</span>
                          )}
                          {cell.type === 'exit' && (
                            <span className={`text-2xl ${hasKey ? 'text-[#00FF66] animate-pulse' : 'opacity-40'}`}>
                              🌀
                            </span>
                          )}
                          {cell.type === 'monster' && !cell.cleared && cell.monsterId && (
                            <div className="flex flex-col items-center">
                              <span className="text-2xl">
                                {DUNGEON_MONSTERS.find((m) => m.id === cell.monsterId)?.emoji || '👾'}
                              </span>
                              <span className="text-[8px] font-bold text-rose-400 leading-tight">
                                LV.{floor}
                              </span>
                            </div>
                          )}
                          {cell.cleared && (
                            <span className="text-xs text-[#00FF66]/40">✓</span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-[#1E3E2F] font-mono">?</span>
                      )}
                    </motion.button>
                  );
                })
              )}
            </div>
          </div>

          {/* On-Screen Tactical Stone D-Pad for Mobile & Desktop Navigation */}
          <div className="w-full flex items-center justify-between px-4 py-2 bg-[#091510] border border-[#162E23] rounded-2xl">
            {/* Companion message on left */}
            <div className="flex items-center gap-2 max-w-[170px]">
              <span className="text-2xl">{selectedPet.emoji}</span>
              <span className="text-[10px] text-[#A7F3D0] italic leading-tight">
                &ldquo;{selectedPet.cheerMessage.slice(0, 38)}...&rdquo;
              </span>
            </div>

            {/* Tactical D-Pad */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => movePlayer(playerPos.x, playerPos.y - 1)}
                className="w-10 h-10 rounded-xl bg-[#0D2218] border-2 border-[#1E3E2F] hover:border-[#00FF66] flex items-center justify-center text-[#E2F5EC]"
              >
                <ArrowUp size={16} />
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => movePlayer(playerPos.x - 1, playerPos.y)}
                  className="w-10 h-10 rounded-xl bg-[#0D2218] border-2 border-[#1E3E2F] hover:border-[#00FF66] flex items-center justify-center text-[#E2F5EC]"
                >
                  <ArrowLeft size={16} />
                </button>
                <button
                  onClick={() => movePlayer(playerPos.x, playerPos.y + 1)}
                  className="w-10 h-10 rounded-xl bg-[#0D2218] border-2 border-[#1E3E2F] hover:border-[#00FF66] flex items-center justify-center text-[#E2F5EC]"
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  onClick={() => movePlayer(playerPos.x + 1, playerPos.y)}
                  className="w-10 h-10 rounded-xl bg-[#0D2218] border-2 border-[#1E3E2F] hover:border-[#00FF66] flex items-center justify-center text-[#E2F5EC]"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            {/* Quick Potion */}
            <button
              onClick={handleDrinkPotion}
              disabled={potions <= 0}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-0.5 ${
                potions > 0
                  ? 'bg-[#10241A] border-[#00FF66] text-[#00FF66] hover:scale-105 shadow-md'
                  : 'bg-black/30 border-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              <span className="text-xl">🧪</span>
              <span className="text-[9px] font-bold">Use ({potions})</span>
            </button>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* SCREEN 3: TACTICAL MONSTER ENCOUNTER COMBAT ARENA             */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {gameState === 'battle' && activeMonster && (
        <div className="relative flex-1 flex flex-col items-center justify-between p-4 max-w-lg mx-auto w-full my-auto">
          {/* Top Encounter Banner */}
          <div className="w-full flex items-center justify-between bg-[#0D1C15] border border-[#1E3E2F] p-3 rounded-2xl shadow-md mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚔️</span>
              <div className="flex flex-col text-left">
                <span className="text-xs font-black text-[#F0FDF4] uppercase">
                  {activeMonster.name} Encounter
                </span>
                <span className="text-[10px] text-[#A7F3D0]">Floor {floor} Dungeon Hunt</span>
              </div>
            </div>

            <div className="text-xs font-mono font-bold text-[#FCD34D] bg-[#2A200F] px-2.5 py-1 rounded-full border border-[#D97706]/40">
              +{activeMonster.goldBounty}🪙 Bounty
            </div>
          </div>

          {/* Active Battle Arena View */}
          <div className="relative w-full rpg-leather-panel p-5 flex flex-col items-center justify-between border-2 border-[#1E3D2F] shadow-2xl overflow-hidden my-auto min-h-[360px]">
            {/* Floating Damage Text */}
            <AnimatePresence>
              {floatingDamage.map((dmg) => (
                <motion.div
                  key={dmg.id}
                  initial={{ opacity: 1, y: 0, scale: 0.8 }}
                  animate={{ opacity: 0, y: -45, scale: 1.4 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.0 }}
                  className="absolute z-40 text-xl font-black font-mono pointer-events-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]"
                  style={{ color: dmg.color }}
                >
                  {dmg.text}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Monster Unit (Top) */}
            <div className="flex flex-col items-center w-full">
              <div className="flex items-center justify-between w-full max-w-xs mb-1 text-xs font-mono font-bold">
                <span className="text-rose-400">{activeMonster.name}</span>
                <span className="text-white/80">{monsterCurrentHp} / {activeMonster.maxHp} HP</span>
              </div>
              {/* Monster HP bar */}
              <div className="w-full max-w-xs h-2.5 rounded-full bg-black/60 overflow-hidden border border-[#1E3E2F] mb-3">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-amber-500 transition-all duration-300"
                  style={{ width: `${Math.max(0, (monsterCurrentHp / activeMonster.maxHp) * 100)}%` }}
                />
              </div>

              {/* Monster Sprite / Illustration Card (from Image 2) */}
              <motion.div
                animate={isPlayerTurn ? { y: [-3, 3, -3] } : { scale: [1, 1.15, 1], x: [-4, 4, 0] }}
                transition={{ duration: 0.6 }}
                className="w-28 h-28 rounded-3xl bg-[#091510] border-2 border-[#1E3E2F] flex flex-col items-center justify-center shadow-lg relative"
              >
                <span className="text-6xl">{activeMonster.emoji}</span>
                <div className="absolute -bottom-2 bg-[#1C0F0B] border border-rose-500/50 px-2 py-0.2 rounded-full text-[9px] font-bold text-rose-300">
                  {activeMonster.tier.toUpperCase()}
                </div>
              </motion.div>
            </div>

            {/* Middle Combat Log Box */}
            <div className="w-full bg-[#070E0B]/90 border border-[#12241C] p-2 rounded-xl text-center text-[11px] font-mono text-[#A7F3D0] my-3 min-h-[38px] flex items-center justify-center">
              {combatLog[0] || 'Select an action to strike!'}
            </div>

            {/* Player Unit & Pet (Bottom) */}
            <div className="flex items-center justify-between w-full px-4">
              <div className="flex items-center gap-3">
                {/* Player Avatar */}
                <div className="relative w-14 h-14 rounded-2xl bg-[#10241A] border-2 border-[#00FF66] flex items-center justify-center text-xl font-black text-[#00FF66] shadow-md">
                  {currentAvatar.name.slice(0, 1).toUpperCase()}
                  {/* Equipped Pet bouncing alongside */}
                  <motion.div
                    animate={{ y: [-3, 3, -3] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute -top-3 -right-3 text-2xl filter drop-shadow"
                  >
                    {selectedPet.emoji}
                  </motion.div>
                </div>

                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{currentAvatar.name}</span>
                    <span className="text-[9px] font-mono text-[#00FF66] bg-[#00FF66]/15 px-1.5 py-0.2 rounded">
                      LV.{floor}
                    </span>
                  </span>
                  <span className="text-xs font-mono text-[#00FF66]">{playerHp} / {maxHp} HP</span>
                </div>
              </div>

              {/* Status pill */}
              <div className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-[#0D2218] border border-[#1E3E2F] text-[#67E8F9]">
                {isGuarding ? 'SHIELD UP 🛡️' : `${selectedPet.name} BUFF ✨`}
              </div>
            </div>
          </div>

          {/* Action Choice Buttons (Turn based / Active battle) */}
          <div className="w-full grid grid-cols-4 gap-2 mt-3">
            {/* Strike */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handlePlayerAttack}
              disabled={!isPlayerTurn}
              className={`py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex flex-col items-center justify-center gap-1 shadow-md border ${
                isPlayerTurn
                  ? 'bg-gradient-to-b from-[#1C3E2F] to-[#0D2218] border-[#00FF66] text-[#00FF66] hover:bg-[#00FF66] hover:text-black'
                  : 'bg-black/40 border-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              <Swords size={16} />
              <span>STRIKE</span>
            </motion.button>

            {/* Parry Guard */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handlePlayerGuard}
              disabled={!isPlayerTurn}
              className={`py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex flex-col items-center justify-center gap-1 shadow-md border ${
                isPlayerTurn
                  ? 'bg-gradient-to-b from-[#102738] to-[#0A1822] border-[#38BDF8] text-[#38BDF8] hover:bg-[#38BDF8] hover:text-black'
                  : 'bg-black/40 border-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              <Shield size={16} />
              <span>PARRY</span>
            </motion.button>

            {/* Skill Burst */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handlePlayerSkill}
              disabled={!isPlayerTurn}
              className={`py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex flex-col items-center justify-center gap-1 shadow-md border ${
                isPlayerTurn
                  ? 'bg-gradient-to-b from-[#231233] to-[#12091A] border-[#A855F7] text-[#C084FC] hover:bg-[#A855F7] hover:text-white'
                  : 'bg-black/40 border-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              <Zap size={16} />
              <span>BURST</span>
            </motion.button>

            {/* Heal Potion */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleDrinkPotion}
              disabled={!isPlayerTurn || potions <= 0}
              className={`py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex flex-col items-center justify-center gap-1 shadow-md border ${
                isPlayerTurn && potions > 0
                  ? 'bg-[#0D2218] border-[#00FF66] text-[#00FF66] hover:scale-105'
                  : 'bg-black/40 border-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              <span>🧪</span>
              <span>POTION ({potions})</span>
            </motion.button>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* SCREEN 4: VICTORY & GRAND REWARD SCREEN                      */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {gameState === 'victory' && (
        <div className="relative flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full my-auto text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full rpg-leather-panel p-6 border-2 border-[#00FF66] shadow-[0_0_50px_rgba(0,255,102,0.3)] flex flex-col items-center"
          >
            <div className="text-5xl mb-2 animate-bounce">🏆</div>
            <h2 className="text-2xl font-black text-[#00FF66] uppercase tracking-wider">
              DUNGEON CONQUERED!
            </h2>
            <p className="text-xs text-[#A7F3D0] mt-1 mb-4">
              You and {selectedPet.name} vanquished the Wraith Reaper and liberated the Catacombs!
            </p>

            <div className="w-full bg-[#08130E] border border-[#1E3E2F] p-3.5 rounded-xl mb-4 text-xs font-mono space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#8CA79B]">Floor Reached:</span>
                <span className="font-bold text-white">Floor {floor} (Catacomb Heart)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8CA79B]">Monsters Hunted:</span>
                <span className="font-bold text-[#67E8F9]">{monstersDefeated} Foes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8CA79B]">Gold Bounties Won:</span>
                <span className="font-bold text-[#FCD34D]">+{goldEarned}🪙 Coins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8CA79B]">Survival Stars Earned:</span>
                <span className="font-bold text-[#00FF66]">+{stars} ⭐</span>
              </div>
            </div>

            <button
              onClick={() => setGameState('menu')}
              className="rpg-auto-equip-btn w-full py-3.5 text-xs font-black uppercase tracking-wider"
            >
              Claim Rewards & Return
            </button>
          </motion.div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* SCREEN 5: GAME OVER / RETRY                                  */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {gameState === 'gameover' && (
        <div className="relative flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full my-auto text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full rpg-leather-panel p-6 border-2 border-rose-600/70 shadow-2xl flex flex-col items-center"
          >
            <div className="text-5xl mb-2">💀</div>
            <h2 className="text-2xl font-black text-rose-400 uppercase tracking-wider">
              YOU FELL IN BATTLE
            </h2>
            <p className="text-xs text-[#A7F3D0] mt-1 mb-4">
              {selectedPet.name} safely brought you back to the entrance camp.
            </p>

            <div className="w-full bg-[#08130E] border border-[#1E3E2F] p-3 rounded-xl mb-4 text-xs font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-[#8CA79B]">Expedition Gold Salvaged:</span>
                <span className="font-bold text-[#FCD34D]">+{goldEarned}🪙 Coins</span>
              </div>
            </div>

            <button
              onClick={() => setGameState('menu')}
              className="w-full py-3 rounded-full bg-gradient-to-b from-[#1C3E2F] to-[#0D2218] border border-[#00FF66] text-[#00FF66] font-bold text-xs uppercase tracking-wider hover:bg-[#00FF66] hover:text-black transition-all"
            >
              Return to Camp
            </button>
          </motion.div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: CUTE PET COMPANION ROSTER (REF IMAGE 3)             */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {petModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-lg rpg-leather-panel border-2 border-[#00FF66] p-4 sm:p-5 flex flex-col max-h-[85vh] overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#1E3E2F] mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🐾</span>
                  <div className="flex flex-col text-left">
                    <h3 className="text-sm font-black uppercase text-[#F0FDF4]">
                      Choose Your Pet Companion
                    </h3>
                    <p className="text-[10px] text-[#A7F3D0]">
                      Small stat boost + cute dungeon companionship!
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setPetModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-black/40 flex items-center justify-center text-[#7E9F90] hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* 3x3 Grid of the 9 Cute Pets (From Reference Image 3) */}
              <div className="grid grid-cols-3 gap-2.5 overflow-y-auto pr-1 no-scrollbar flex-1">
                {PET_COMPANIONS.map((pet) => {
                  const isSelected = selectedPet.id === pet.id;
                  return (
                    <button
                      key={pet.id}
                      onClick={() => {
                        setSelectedPet(pet);
                        sound.playClick();
                        addToast(`Equipped ${pet.name} as your companion! (${pet.statBoostDesc})`, 'success');
                      }}
                      className={`p-2.5 rounded-2xl border text-center flex flex-col items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-[#153426] border-[#00FF66] shadow-[0_0_15px_rgba(0,255,102,0.35)] scale-102'
                          : 'bg-[#0A1611] border-[#1E3E2F] hover:border-[#00FF66]/50'
                      }`}
                    >
                      <span className="text-3xl sm:text-4xl my-1">{pet.emoji}</span>
                      <span className="text-xs font-bold text-[#F0FDF4] truncate w-full">{pet.name}</span>
                      <span className="text-[9px] font-mono text-[#00FF66] font-semibold mt-0.5 leading-tight">
                        {pet.statBoostDesc}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Pet Description Preview */}
              <div className="mt-3 pt-3 border-t border-[#1E3E2F] flex items-center justify-between">
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-[#F0FDF4]">{selectedPet.name} &bull; {selectedPet.title}</span>
                  <span className="text-[10px] text-[#A7F3D0] italic">{selectedPet.tagline}</span>
                </div>
                <button
                  onClick={() => setPetModalOpen(false)}
                  className="px-4 py-1.5 rounded-full bg-[#00FF66] text-black font-black text-xs uppercase tracking-wider hover:bg-white transition-all shadow-md"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: MONSTER CODEX (REF IMAGE 2)                         */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {codexModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-lg rpg-leather-panel border-2 border-[#1E3E2F] p-4 sm:p-5 flex flex-col max-h-[85vh] overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#1E3E2F] mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📖</span>
                  <div className="flex flex-col text-left">
                    <h3 className="text-sm font-black uppercase text-[#F0FDF4]">
                      Dungeon Monster Codex
                    </h3>
                    <p className="text-[10px] text-[#A7F3D0]">
                      The 10 subterranean beasts lurking in the catacombs
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setCodexModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-black/40 flex items-center justify-center text-[#7E9F90] hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Monster List (from Image 2) */}
              <div className="flex flex-col gap-2 overflow-y-auto pr-1 no-scrollbar flex-1">
                {DUNGEON_MONSTERS.map((monster) => (
                  <div
                    key={monster.id}
                    className="p-2.5 rounded-xl bg-[#091510] border border-[#162E23] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0F2218] border border-[#1E3E2F] flex items-center justify-center text-2xl">
                        {monster.emoji}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-[#F0FDF4] flex items-center gap-1.5">
                          <span>{monster.name}</span>
                          <span className={`text-[8px] font-mono px-1 rounded ${monster.tier === 'boss' ? 'bg-purple-500/20 text-purple-300' : monster.tier === 'elite' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                            {monster.tier.toUpperCase()}
                          </span>
                        </span>
                        <span className="text-[10px] text-[#8CA79B] line-clamp-1">{monster.lore}</span>
                      </div>
                    </div>

                    <div className="flex flex-col text-right font-mono text-[10px] shrink-0">
                      <span className="text-rose-400 font-bold">{monster.atk} ATK</span>
                      <span className="text-[#FCD34D]">+{monster.goldBounty}🪙</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
