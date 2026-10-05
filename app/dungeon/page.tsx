'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Backpack, BookOpen, Coins, Crosshair, Heart, Keyboard,
  Map, MousePointer2, Pause, Play, RotateCcw, Shield, Sparkles, Swords, Target, Trophy, Wand2, X, Zap,
} from 'lucide-react';
import { useAvatarStore } from '@/store/avatarStore';
import { calculateAvatarStats } from '@/lib/statsCalculator';
import { sound, music } from '@/lib/audio';
import { DungeonWorld, dungeonLookYaw } from '@/components/dungeon/DungeonWorld';
import {
  EnemyDefinition, FLOORS, getBossDefinition, getEnemyDefinition,
  LootItem, makeRoomMap, RoomNode, RoomType, rollLoot, xpForLevel,
} from '@/lib/dungeonGame';

type GameMode = 'title' | 'map' | 'combat' | 'reward' | 'shop' | 'event' | 'victory' | 'dead';
type Position = { x: number; y: number };
type DungeonEnemy = EnemyDefinition & { id: string; hp: number; position: Position; cooldown: number; phase: number; stunned: number };
type PlayerState = {
  hp: number; maxHp: number; attack: number; defense: number; crit: number; level: number; xp: number;
  gold: number; soulShards: number; stamina: number; maxStamina: number; potions: number;
  weaponBonus: number; defenseBonus: number; relics: string[]; roomsCleared: number; kills: number;
};
type FloatingNumber = { id: number; x: number; y: number; value: string; color: string };

const ROOM_ICON: Record<RoomType, React.ReactNode> = {
  combat: <Swords size={15} />, elite: <Target size={15} />, treasure: <Backpack size={15} />,
  shop: <Coins size={15} />, healing: <Heart size={15} />, event: <Sparkles size={15} />, boss: <SkullIcon />,
};

function SkullIcon() { return <span className="text-xs font-black">BOSS</span>; }

function initialPlayer(base?: ReturnType<typeof calculateAvatarStats>): PlayerState {
  const hp = base?.maxHp || 1000;
  return {
    hp, maxHp: hp, attack: base?.power || 60, defense: base?.defense || 40, crit: base?.criticalRate || 15,
    level: 1, xp: 0, gold: 80, soulShards: 0, stamina: 100, maxStamina: 100, potions: 2,
    weaponBonus: 0, defenseBonus: 0, relics: [], roomsCleared: 0, kills: 0,
  };
}

function spawnEnemies(floor: number, room: RoomNode): DungeonEnemy[] {
  if (room.type === 'boss') {
    const boss = getBossDefinition(floor);
    return [{ ...boss, id: 'boss', hp: boss.maxHp, position: { x: 78, y: 46 }, cooldown: 0, phase: 1, stunned: 0 }];
  }
  const names = FLOORS[floor].enemies;
  const count = room.type === 'elite' ? 1 : 2 + Math.min(2, floor % 3);
  return Array.from({ length: count }, (_, index) => {
    const name = names[(index + floor + (room.type === 'elite' ? 1 : 0)) % names.length];
    const definition = getEnemyDefinition(name, floor, room.type === 'elite');
    return { ...definition, id: `${name}-${index}`, hp: definition.maxHp, position: { x: 66 + index * 9, y: 28 + (index % 3) * 24 }, cooldown: index * 12, phase: 1, stunned: 0 };
  });
}

function meter(value: number, max: number) { return `${Math.max(0, Math.min(100, (value / max) * 100))}%`; }

export default function DungeonPage() {
  const { currentAvatar } = useAvatarStore();
  const baseStats = useMemo(() => calculateAvatarStats(currentAvatar), [currentAvatar]);
  const [mode, setMode] = useState<GameMode>('title');
  const [floor, setFloor] = useState(0);
  const [roomIndex, setRoomIndex] = useState(0);
  const [rooms, setRooms] = useState<RoomNode[]>([]);
  const [player, setPlayer] = useState<PlayerState>(() => initialPlayer(baseStats));
  const [enemies, setEnemies] = useState<DungeonEnemy[]>([]);
  const [position, setPosition] = useState<Position>({ x: 20, y: 50 });
  const [selectedEnemy, setSelectedEnemy] = useState<string | null>(null);
  const [cooldowns, setCooldowns] = useState({ basic: 0, heavy: 0, special: 0, ultimate: 0, dodge: 0 });
  const [log, setLog] = useState<string[]>(['The dungeon is waiting.']);
  const [loot, setLoot] = useState<LootItem | null>(null);
  const [levelChoices, setLevelChoices] = useState<string[]>([]);
  const [floating, setFloating] = useState<FloatingNumber[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [runStartedAt, setRunStartedAt] = useState(0);
  const [ending, setEnding] = useState<string | null>(null);
  const [attackPulse, setAttackPulse] = useState(0);
  const [playerHitPulse, setPlayerHitPulse] = useState(0);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const keysRef = useRef<Set<string>>(new Set());
  const positionRef = useRef<Position>({ x: 20, y: 50 });
  const velocityRef = useRef<Position>({ x: 0, y: 0 });
  const invulnerableUntilRef = useRef(0);
  const floatId = useRef(0);

  const floorData = FLOORS[floor];
  const addLog = useCallback((message: string) => setLog((items) => [message, ...items].slice(0, 8)), []);
  const addFloat = useCallback((value: string, x: number, y: number, color: string) => {
    const id = ++floatId.current;
    setFloating((items) => [...items, { id, value, x, y, color }]);
    window.setTimeout(() => setFloating((items) => items.filter((item) => item.id !== id)), 800);
  }, []);

  const openRoom = useCallback((room: RoomNode, index: number) => {
    if (room.visited && room.cleared) return;
    setRoomIndex(index);
    setRooms((items) => items.map((item, itemIndex) => itemIndex === index || itemIndex === index + 1 ? { ...item, visited: itemIndex === index ? true : item.visited, discovered: true } : item));
    if (room.type === 'combat' || room.type === 'elite' || room.type === 'boss') {
      positionRef.current = { x: 20, y: 50 }; velocityRef.current = { x: 0, y: 0 }; setEnemies(spawnEnemies(floor, room)); setPosition(positionRef.current); setSelectedEnemy(null); setMode('combat');
      addLog(room.type === 'boss' ? `${floorData.boss} enters the arena.` : `${room.label} chamber: hostiles are closing in.`);
      sound.playWhoosh();
      setTimeout(() => sound.playImpact(), 80);
    } else if (room.type === 'treasure') {
      const prize = rollLoot(floor, false); setLoot(prize); setMode('reward'); addLog('A sealed cache opens with a mechanical sigh.');
      sound.playChestOpen();
    } else if (room.type === 'healing') {
      setPlayer((state) => ({ ...state, hp: Math.min(state.maxHp, state.hp + Math.round(state.maxHp * 0.35)), stamina: state.maxStamina }));
      setRooms((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, cleared: true } : item));
      addLog('The repair cradle restores 35% HP and all stamina.');
      sound.playPotion();
    } else if (room.type === 'shop') {
      setMode('shop'); addLog('The merchant watches your hands, not your face.');
      sound.playCoin();
    } else {
      setMode('event'); addLog('A voice asks what you are willing to lose.');
      sound.playMagic();
    }
  }, [addLog, floor, floorData.boss]);

  const startRun = useCallback((directEnter = false) => {
    try {
      const nextRooms = makeRoomMap(0, Date.now());
      setFloor(0); setRoomIndex(0); setRooms(nextRooms); setPlayer(initialPlayer(baseStats)); setEnemies([]);
      positionRef.current = { x: 20, y: 50 }; velocityRef.current = { x: 0, y: 0 }; setPosition(positionRef.current);
      setLoot(null); setEnding(null); setRunStartedAt(Date.now()); setTutorialOpen(false);
      setLog(['Run initialized. Choose a path into the Forgotten Entrance.']);
      try {
        sound.playEquip();
        music.setTrack('dungeon');
        if (!music.getIsPlaying()) music.start('dungeon');
      } catch (e) {
        console.warn('Audio start error:', e);
      }
      if (directEnter) {
        openRoom(nextRooms[0], 0);
      } else {
        setMode('map');
      }
    } catch (err) {
      console.error('Failed to start run:', err);
    }
  }, [baseStats, openRoom]);

  const completeRoom = useCallback(() => {
    const room = rooms[roomIndex];
    if (!room) return;
    const prize = room.type === 'boss' ? null : rollLoot(floor, room.type === 'elite');
    setRooms((items) => items.map((item, index) => index === roomIndex ? { ...item, cleared: true } : item));
    setPlayer((state) => {
      const xpGain = room.type === 'boss' ? 180 + floor * 40 : 55 + floor * 22;
      const nextXp = state.xp + xpGain;
      const nextLevel = state.level + (nextXp >= xpForLevel(state.level) ? 1 : 0);
      if (nextLevel > state.level) {
        setLevelChoices(['+15% Attack', '+20 Maximum HP', '+10% Critical Chance']);
        sound.playLevelUp();
      } else {
        sound.playWin();
      }
      return { ...state, xp: nextXp >= xpForLevel(state.level) ? nextXp - xpForLevel(state.level) : nextXp, level: nextLevel, gold: state.gold + 25 + floor * 12, roomsCleared: state.roomsCleared + 1, kills: state.kills + (room.type === 'combat' || room.type === 'elite' || room.type === 'boss' ? enemies.length : 0) };
    });
    if (room.type === 'boss') {
      if (floor === FLOORS.length - 1) { setMode('victory'); addLog('The Dungeon Core is silent. It is waiting for your answer.'); sound.playWin(); }
      else { setMode('reward'); setLoot(null); addLog(`Floor ${floor + 1} cleared. The descent continues.`); sound.playWin(); }
    } else { setLoot(prize); setMode('reward'); }
  }, [addLog, enemies.length, floor, roomIndex, rooms]);

  const applyLoot = useCallback((item: LootItem | null) => {
    if (!item) return;
    setPlayer((state) => ({
      ...state, attack: state.attack + (item.attack || 0), weaponBonus: state.weaponBonus + (item.attack || 0),
      defense: state.defense + (item.defense || 0), defenseBonus: state.defenseBonus + (item.defense || 0),
      maxHp: state.maxHp + (item.maxHp || 0), hp: state.hp + (item.maxHp || 0), crit: state.crit + (item.crit || 0),
      potions: state.potions + (item.kind === 'potion' ? 1 : 0), relics: item.kind === 'relic' ? [...state.relics, item.id] : state.relics,
    }));
    sound.playEquip();
    addLog(`${item.name} equipped: ${item.description}`); setLoot(null);
  }, [addLog]);

  const chooseLevelUpgrade = useCallback((choice: string) => {
    setPlayer((state) => choice.includes('Attack') ? { ...state, attack: Math.round(state.attack * 1.15) } : choice.includes('Critical') ? { ...state, crit: state.crit + 10 } : { ...state, maxHp: state.maxHp + 20, hp: state.hp + 20 });
    setLevelChoices([]); addLog(`Level upgrade selected: ${choice}.`);
    sound.playEquip();
  }, [addLog]);

  const descend = useCallback(() => {
    const nextFloor = floor + 1;
    setFloor(nextFloor); setRoomIndex(0); setRooms(makeRoomMap(nextFloor, Date.now())); setMode('map'); setLoot(null); setPlayer((state) => ({ ...state, hp: Math.min(state.maxHp, state.hp + Math.round(state.maxHp * 0.12)), stamina: state.maxStamina }));
    addLog(`Descending to Floor ${nextFloor + 1}: ${FLOORS[nextFloor].name}.`);
    sound.playSweep();
  }, [addLog, floor]);

  const dealDamage = useCallback((type: 'basic' | 'heavy' | 'special' | 'ultimate') => {
    if (mode !== 'combat' || isPaused || enemies.length === 0 || cooldowns[type] > 0) return;
    const data = { basic: { cost: 0, damage: 1, radius: 14, cd: 3, label: 'Basic attack' }, heavy: { cost: 20, damage: 1.7, radius: 16, cd: 8, label: 'Heavy attack' }, special: { cost: 30, damage: 1.45, radius: 24, cd: 12, label: 'Arc pulse' }, ultimate: { cost: 70, damage: 3.1, radius: 28, cd: 22, label: 'Overdrive' } }[type];
    if (player.stamina < data.cost) { addLog('Not enough stamina.'); return; }
    const target = enemies.find((enemy) => enemy.id === selectedEnemy && enemy.hp > 0) || enemies.filter((enemy) => enemy.hp > 0).sort((a, b) => Math.hypot(a.position.x - position.x, a.position.y - position.y) - Math.hypot(b.position.x - position.x, b.position.y - position.y))[0];
    if (!target) return;
    const distance = Math.hypot(target.position.x - position.x, target.position.y - position.y);
    if (distance > data.radius) { addLog('Move closer to bring the target into range.'); return; }
    setAttackPulse((value) => value + 1);
    const crit = Math.random() * 100 < player.crit;
    const damage = Math.max(1, Math.round((player.attack * data.damage - target.defense * 0.45) * (crit ? 1.75 : 1)));
    const hitEnemies = type === 'special' || type === 'ultimate' ? enemies.map((enemy) => {
      const d = Math.hypot(enemy.position.x - position.x, enemy.position.y - position.y);
      if (d <= data.radius + 8) {
        const kx = enemy.position.x - position.x;
        const ky = enemy.position.y - position.y;
        const klen = Math.hypot(kx, ky) || 1;
        const pushDist = type === 'ultimate' ? 8 : 4;
        return {
          ...enemy,
          hp: enemy.hp - Math.round(damage * (enemy.id === target.id ? 1 : 0.55)),
          stunned: type === 'ultimate' ? 1 : enemy.stunned,
          position: {
            x: Math.max(14, Math.min(86, enemy.position.x + (kx / klen) * pushDist)),
            y: Math.max(16, Math.min(84, enemy.position.y + (ky / klen) * pushDist)),
          },
        };
      }
      return enemy;
    }) : enemies.map((enemy) => {
      if (enemy.id === target.id) {
        const kx = enemy.position.x - position.x;
        const ky = enemy.position.y - position.y;
        const klen = Math.hypot(kx, ky) || 1;
        const pushDist = type === 'heavy' ? 7 : 3;
        return {
          ...enemy,
          hp: enemy.hp - damage,
          stunned: type === 'heavy' ? 1 : enemy.stunned,
          position: {
            x: Math.max(14, Math.min(86, enemy.position.x + (kx / klen) * pushDist)),
            y: Math.max(16, Math.min(84, enemy.position.y + (ky / klen) * pushDist)),
          },
        };
      }
      return enemy;
    });
    setEnemies(hitEnemies); setCooldowns((state) => ({ ...state, [type]: data.cd })); setPlayer((state) => ({ ...state, stamina: state.stamina - data.cost }));
    addFloat(`${crit ? 'CRIT ' : ''}-${damage}`, target.position.x, target.position.y, crit ? '#fbbf24' : 'var(--brand)'); addLog(`${data.label} hit ${target.name} for ${damage}.`);

    // Specific attack sounds
    if (crit) {
      sound.playCrit();
    } else if (type === 'basic') {
      sound.playSlash();
    } else if (type === 'heavy') {
      sound.playSlash();
      setTimeout(() => sound.playImpact(), 70);
    } else if (type === 'special') {
      sound.playMagic();
    } else if (type === 'ultimate') {
      sound.playOverdrive();
    }

    if (hitEnemies.every((enemy) => enemy.hp <= 0)) { setTimeout(completeRoom, 260); }
  }, [addFloat, addLog, completeRoom, cooldowns, enemies, isPaused, mode, player, position, selectedEnemy]);

  const dodge = useCallback(() => {
    if (mode !== 'combat' || cooldowns.dodge > 0 || player.stamina < 18) return;
    const keys = keysRef.current;
    const strafe = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
    const forward = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
    const length = Math.hypot(strafe, forward) || 1;
    const yaw = dungeonLookYaw.current;
    const direction = { x: (Math.sin(yaw) * forward + Math.cos(yaw) * strafe) / length, y: (-Math.cos(yaw) * forward + Math.sin(yaw) * strafe) / length };
    const next = { x: Math.max(14, Math.min(86, positionRef.current.x + direction.x * 13)), y: Math.max(16, Math.min(84, positionRef.current.y + direction.y * 13)) };
    positionRef.current = next; velocityRef.current = { x: direction.x * 8, y: direction.y * 8 }; invulnerableUntilRef.current = performance.now() + 620;
    setPosition(next); setPlayer((state) => ({ ...state, stamina: state.stamina - 18 })); setCooldowns((state) => ({ ...state, dodge: 10 })); addLog('Dodge roll: evasive movement active.');
    sound.playDodge();
  }, [cooldowns.dodge, mode, player.stamina, addLog]);

  useEffect(() => {
    const movementCodes = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
    const down = (event: KeyboardEvent) => { if (!movementCodes.has(event.code)) return; keysRef.current.add(event.code); event.preventDefault(); };
    const up = (event: KeyboardEvent) => keysRef.current.delete(event.code);
    const clear = () => keysRef.current.clear();
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clear); document.addEventListener('visibilitychange', clear);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear); document.removeEventListener('visibilitychange', clear); };
  }, []);

  useEffect(() => {
    const attackKeys: Record<string, 'basic' | 'heavy' | 'special' | 'ultimate'> = {
      '1': 'basic', '2': 'heavy', '3': 'special', '4': 'ultimate',
      'KeyJ': 'basic', 'KeyK': 'heavy', 'KeyL': 'special',
    };
    const triggerAttack = (event: KeyboardEvent) => {
      if ((event.code === 'ShiftLeft' || event.code === 'ShiftRight' || event.code === 'Space') && mode === 'combat' && !isPaused) {
        event.preventDefault();
        dodge();
        return;
      }
      if (event.key === 'Tab' && mode === 'combat') {
        event.preventDefault();
        const alive = enemies.filter((e) => e.hp > 0);
        if (alive.length > 0) {
          const currentIdx = alive.findIndex((e) => e.id === selectedEnemy);
          const next = alive[(currentIdx + 1) % alive.length];
          setSelectedEnemy(next.id);
          sound.playClick();
        }
        return;
      }
      const attack = attackKeys[event.code] || attackKeys[event.key];
      if (!attack || mode !== 'combat' || isPaused) return;
      event.preventDefault();
      dealDamage(attack);
    };
    window.addEventListener('keydown', triggerAttack);
    return () => window.removeEventListener('keydown', triggerAttack);
  }, [dealDamage, dodge, enemies, isPaused, mode, selectedEnemy]);

  useEffect(() => {
    if (mode !== 'combat' || isPaused) return;
    let frame = 0;
    let lastTime = performance.now();
    const move = (time: number) => {
      const delta = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;
      const keys = keysRef.current;
      const strafe = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
      const forward = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
      const inputLength = Math.hypot(strafe, forward) || 1;
      const yaw = dungeonLookYaw.current;
      const inputX = (Math.sin(yaw) * forward + Math.cos(yaw) * strafe) / inputLength;
      const inputY = (-Math.cos(yaw) * forward + Math.sin(yaw) * strafe) / inputLength;
      const targetVelocity = { x: inputX * 20, y: inputY * 20 };
      const smoothing = 1 - Math.exp(-delta * 14);
      velocityRef.current.x += (targetVelocity.x - velocityRef.current.x) * smoothing;
      velocityRef.current.y += (targetVelocity.y - velocityRef.current.y) * smoothing;
      if (!inputX && !inputY) {
        const brake = Math.exp(-delta * 10);
        velocityRef.current.x *= brake;
        velocityRef.current.y *= brake;
      }
      const next = { x: Math.max(14, Math.min(86, positionRef.current.x + velocityRef.current.x * delta)), y: Math.max(16, Math.min(84, positionRef.current.y + velocityRef.current.y * delta)) };
      positionRef.current = next;
      if (Math.abs(velocityRef.current.x) + Math.abs(velocityRef.current.y) > 0.02) setPosition(next);
      frame = requestAnimationFrame(move);
    };
    frame = requestAnimationFrame(move);
    return () => cancelAnimationFrame(frame);
  }, [isPaused, mode]);

  useEffect(() => {
    if (mode !== 'combat' || isPaused) return;
    const timer = window.setInterval(() => {
      const currentPosition = positionRef.current;
      setCooldowns((state) => Object.fromEntries(Object.entries(state).map(([key, value]) => [key, Math.max(0, value - 1)])) as typeof state);
      setPlayer((state) => ({ ...state, stamina: Math.min(state.maxStamina, state.stamina + 1) }));
      setEnemies((items) => items.map((enemy) => {
        if (enemy.hp <= 0 || enemy.stunned > 0) return { ...enemy, stunned: Math.max(0, enemy.stunned - 1) };
        const dx = currentPosition.x - enemy.position.x;
        const dy = currentPosition.y - enemy.position.y;
        const distance = Math.hypot(dx, dy) || 1;
        const isRanged = enemy.archetype === 'ranged' || enemy.archetype === 'mage' || enemy.archetype === 'support';

        // Enhanced AI Movement & Kiting
        let shouldMove = false;
        let directionMultiplier = 1;
        if (isRanged) {
          if (distance > enemy.range) {
            shouldMove = true;
            directionMultiplier = 1; // Advance into range
          } else if (distance < 14) {
            shouldMove = true;
            directionMultiplier = -1; // Kite away from close combat
          }
        } else {
          // Melee / tank / assassin / boss:
          if (distance > enemy.range - 1) {
            shouldMove = true;
            directionMultiplier = 1;
          }
        }

        const moveAmount = enemy.speed * 5;
        const nextPosition = shouldMove
          ? {
              x: Math.max(14, Math.min(86, enemy.position.x + (dx / distance) * moveAmount * directionMultiplier)),
              y: Math.max(16, Math.min(84, enemy.position.y + (dy / distance) * moveAmount * directionMultiplier)),
            }
          : enemy.position;

        if (distance <= enemy.range && enemy.cooldown <= 0) {
          if (enemy.archetype === 'support' || performance.now() < invulnerableUntilRef.current) {
            return { ...enemy, position: nextPosition, cooldown: 12 };
          }
          const incoming = Math.max(2, enemy.attack - (player.defense + player.defenseBonus) * 0.22);
          setPlayerHitPulse((value) => value + 1);
          sound.playHurt();
          setPlayer((state) => {
            const hp = Math.max(0, state.hp - Math.round(incoming));
            if (hp <= 0) {
              sound.playDefeat();
              setTimeout(() => setMode('dead'), 0);
            }
            return { ...state, hp };
          });
          addFloat(`-${Math.round(incoming)}`, currentPosition.x, currentPosition.y, '#fb7185');
          const bossCooldown = enemy.phase === 3 ? 8 : enemy.phase === 2 ? 11 : 16;
          return {
            ...enemy,
            position: nextPosition,
            cooldown: enemy.archetype === 'boss' ? bossCooldown : 18,
          };
        }

        // Fixed Boss Phase Transition (Phase 3 is now properly reachable below 33% HP)
        const phase = enemy.archetype === 'boss'
          ? (enemy.hp < enemy.maxHp * 0.33 ? 3 : enemy.hp < enemy.maxHp * 0.66 ? 2 : 1)
          : enemy.phase;

        return { ...enemy, position: nextPosition, cooldown: Math.max(0, enemy.cooldown - 1), phase };
      }));
    }, 100);
    return () => window.clearInterval(timer);
  }, [addFloat, isPaused, mode, player.defense, player.defenseBonus]);

  const usePotion = () => {
    if (player.potions <= 0 || player.hp >= player.maxHp) return;
    sound.playPotion();
    setPlayer((state) => ({ ...state, hp: Math.min(state.maxHp, state.hp + Math.round(state.maxHp * 0.35)), potions: state.potions - 1 }));
    addLog('Health Potion restored 35% HP.');
  };
  const room = rooms[roomIndex];
  const boss = enemies.find((enemy) => enemy.archetype === 'boss');
  const runtimeSeconds = runStartedAt ? Math.floor((Date.now() - runStartedAt) / 1000) : 0;

  return (
    <div className="min-h-screen bg-[#020502] text-white pb-8">
      <header className="sticky top-0 z-40 h-16 border-b border-[#00FF66]/20 bg-[#020502]/95 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4"><Link href="/" className="text-white/60 hover:text-[#00FF66] flex items-center gap-1 text-xs font-mono uppercase"><ArrowLeft size={14} /> Base</Link><div className="h-5 w-px bg-white/10" /><span className="font-black tracking-[0.18em] text-sm uppercase text-[#00FF66]">Dungeon // Descent Protocol</span></div>
        <div className="flex items-center gap-4 text-[11px] font-mono uppercase text-white/55"><button onClick={() => setTutorialOpen(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-[#00FF66]/50 text-white/70 hover:text-[#00FF66] transition-colors"><BookOpen size={13} className="text-[#00FF66]" /> Field Manual</button><span className="hidden sm:flex items-center gap-1"><Map size={13} /> Floor {floor + 1}/{FLOORS.length}</span><span className="flex items-center gap-1 text-amber-300"><Coins size={13} /> {player.gold}</span><button onClick={() => setIsPaused((value) => !value)} className="p-2 rounded-lg border border-white/10 hover:border-[#00FF66]/50" aria-label={isPaused ? 'Resume run' : 'Pause run'}>{isPaused ? <Play size={14} /> : <Pause size={14} />}</button></div>
      </header>

      {tutorialOpen && <DungeonTutorial onClose={() => setTutorialOpen(false)} />}

      {mode === 'map' && <DungeonRouteMap floor={floor} floorData={floorData} rooms={rooms} roomIndex={roomIndex} onOpenRoom={openRoom} />}

      {mode === 'title' && <section className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-5 py-12"><div className="w-full max-w-6xl grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-center"><div><div className="inline-flex items-center gap-2 rounded-full border border-[#00FF66]/30 bg-[#00FF66]/[0.06] px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.25em] text-[#00FF66]"><span className="h-1.5 w-1.5 rounded-full bg-[#00FF66] shadow-[0_0_10px_#00FF66]" />Descent Protocol // Floor Zero</div><h1 className="mt-6 text-5xl sm:text-7xl font-black uppercase tracking-tight leading-[0.9]">Enter the<br /><span className="text-[#00FF66]">living ruin</span></h1><p className="mt-6 max-w-xl text-white/60 leading-relaxed">A shifting underground complex is waiting beneath the station. Choose a route, breach each chamber, and descend toward the Core before the dungeon learns your pattern.</p><div className="mt-8 flex flex-wrap gap-3"><button id="begin-descent-button" type="button" onClick={() => startRun(false)} className="neon-green-button px-6 py-3 rounded-xl font-black uppercase tracking-widest text-sm flex items-center gap-2 cursor-pointer relative z-20 shadow-[0_0_25px_rgba(0,255,102,0.4)] hover:scale-105 active:scale-95 transition-all"><Play size={16} /> Begin Descent</button><button id="direct-chamber-entry-btn" type="button" onClick={() => startRun(true)} className="px-6 py-3 rounded-xl border border-[#00FF66]/50 bg-[#00FF66]/10 hover:bg-[#00FF66]/20 text-[#00FF66] font-black uppercase tracking-widest text-sm flex items-center gap-2 cursor-pointer relative z-20 transition-all hover:scale-105"><Swords size={16} /> Enter Chamber 1</button><Link href="/studio" className="px-6 py-3 rounded-xl border border-white/15 hover:border-[#00FF66]/50 font-black uppercase tracking-widest text-sm flex items-center">Tune Avatar</Link></div><div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex items-center justify-between text-[9px] font-mono uppercase text-white/40"><span>Operative loadout</span><span className="text-[#00FF66]">Ready</span></div><div className="mt-3 flex items-center gap-3"><div className="h-11 w-11 rounded-xl border border-[#00FF66]/35 bg-gradient-to-br from-[#00FF66]/30 to-[#A855F7]/25 flex items-center justify-center"><Shield size={19} className="text-[#00FF66]" /></div><div><p className="font-black uppercase">{currentAvatar.name}</p><p className="text-[10px] font-mono uppercase text-white/40">{currentAvatar.classRole || 'Operative'} // combat ready</p></div><div className="ml-auto text-right text-[10px] font-mono text-white/45"><span className="block text-[#00FF66]">6 FLOORS</span><span>ONE CORE</span></div></div></div></div><div className="relative min-h-[500px] overflow-hidden rounded-[2rem] border border-[#00FF66]/25 bg-[#050B0A] shadow-[0_0_70px_rgba(0,255,102,0.10)]"><div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,102,0.13),transparent_52%)]" /><div className="absolute inset-0 opacity-25 bg-[radial-gradient(#00FF6640_1px,transparent_1px)] [background-size:22px_22px]" /><div className="absolute left-6 right-6 top-5 z-10 flex items-center justify-between text-[9px] font-mono uppercase tracking-widest text-white/45"><span className="flex items-center gap-2"><Map size={12} className="text-[#00FF66]" /> Entry chamber // live scan</span><span className="text-[#00FF66]">Signal stable</span></div><div className="absolute inset-x-14 top-24 bottom-24 [perspective:700px]"><div className="absolute inset-0 border-x border-[#00FF66]/20 bg-gradient-to-b from-[#0A1711]/20 to-[#00FF66]/[0.03] [transform:rotateX(5deg)]" /><div className="absolute left-1/2 top-8 h-36 w-52 -translate-x-1/2 border-2 border-[#00FF66]/55 bg-[#020502] shadow-[0_0_35px_rgba(0,255,102,0.25)]"><div className="absolute inset-5 border border-[#00FF66]/35" /><div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#00FF66] shadow-[0_0_22px_#00FF66] animate-pulse" /></div><div className="absolute bottom-0 left-1/2 h-64 w-full -translate-x-1/2 origin-bottom bg-[linear-gradient(90deg,transparent_0%,rgba(0,255,102,0.08)_50%,transparent_100%)] [clip-path:polygon(38%_0,62%_0,100%_100%,0_100%)]" /><div className="absolute bottom-0 left-1/2 h-64 w-px -translate-x-1/2 bg-[#00FF66]/45 shadow-[0_0_12px_#00FF66]" /><div className="absolute bottom-0 left-[18%] h-64 w-px origin-bottom rotate-[18deg] bg-[#00FF66]/35" /><div className="absolute bottom-0 right-[18%] h-64 w-px origin-bottom -rotate-[18deg] bg-[#00FF66]/35" /><div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#00FF66] shadow-[0_0_12px_#00FF66]" /><span className="h-2 w-2 rounded-full bg-[#00FF66]/60" /><span className="h-2 w-2 rounded-full bg-white/20" /><span className="ml-2 text-[9px] font-mono uppercase text-white/45">Route mapped 01 / 06</span></div></div><div className="absolute bottom-5 left-6 right-6 z-10 grid grid-cols-3 gap-2 text-center text-[9px] font-mono uppercase"><button id="card-breach-btn" type="button" onClick={() => startRun(false)} className="rounded-lg border border-[#00FF66]/30 bg-[#00FF66]/10 p-2 text-[#00FF66] hover:bg-[#00FF66]/25 transition-colors font-bold cursor-pointer">Breach</button><span className="rounded-lg border border-white/10 bg-black/30 p-2 text-white/55">Hunt</span><span className="rounded-lg border border-white/10 bg-black/30 p-2 text-white/55">Descend</span></div></div></div></section>}

      {mode !== 'title' && mode !== 'victory' && mode !== 'dead' && <div className="max-w-7xl mx-auto px-4 sm:px-8 py-5"><div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4"><div><p className="text-[10px] font-mono tracking-[0.25em] uppercase" style={{ color: floorData.color }}>Floor {floor + 1} // {floorData.name}</p><h1 className="text-2xl sm:text-3xl font-black uppercase mt-1">{floorData.subtitle}</h1></div><div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-[10px] font-mono uppercase"><StatChip label="Level" value={`${player.level}`} /><StatChip label="XP" value={`${player.xp}/${xpForLevel(player.level)}`} /><StatChip label="Kills" value={`${player.kills}`} /><StatChip label="Cleared" value={`${player.roomsCleared}`} /><StatChip label="Soul Shards" value={`${player.soulShards}`} /><StatChip label="Run Time" value={`${Math.floor(runtimeSeconds / 60)}:${String(runtimeSeconds % 60).padStart(2, '0')}`} /></div></div></div>}

      {mode === 'combat' && <section className="max-w-7xl mx-auto px-4 sm:px-8 grid xl:grid-cols-[1fr_320px] gap-5"><div className="rounded-2xl border border-[#00FF66]/20 bg-[#050b08] overflow-hidden"><div className="p-4 border-b border-white/10 flex items-center justify-between"><div><p className="text-[10px] font-mono uppercase tracking-widest text-[#00FF66]">Live combat room</p><h2 className="font-black uppercase mt-1">{room?.label} Chamber</h2></div><div className="flex items-center gap-2"><button onClick={usePotion} className="px-3 py-2 rounded-lg border border-white/15 text-[10px] font-black uppercase hover:border-[#00FF66]/60 flex items-center gap-1"><Heart size={13} /> Potion {player.potions}</button><button onClick={dodge} className="px-3 py-2 rounded-lg border border-white/15 text-[10px] font-black uppercase hover:border-[#00FF66]/60">Dodge {cooldowns.dodge || 'Ready'}</button></div></div><div className="relative h-[460px] sm:h-[560px] overflow-hidden bg-[#020502]"><div className="absolute inset-0 z-0"><DungeonWorld floor={floor} playerConfig={currentAvatar} playerPosition={position} enemies={enemies} selectedEnemy={selectedEnemy} attackPulse={attackPulse} playerHitPulse={playerHitPulse} onSelectEnemy={setSelectedEnemy} onAttackTrigger={(isHeavy) => dealDamage(isHeavy ? 'heavy' : 'basic')} /></div><div className="absolute inset-5 rounded-2xl border border-[#00FF66]/15 pointer-events-none" />{floating.map((item) => <span key={item.id} className="absolute z-20 font-black text-lg animate-bounce pointer-events-none" style={{ left: `${item.x}%`, top: `${item.y}%`, color: item.color }}>{item.value}</span>)}<div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-mono uppercase text-white/70 bg-black/85 px-4 py-1.5 rounded-full border border-[#00FF66]/30 shadow-lg pointer-events-none flex items-center gap-2"><span>WASD Move</span><span className="text-white/30">&bull;</span><span className="text-[#00FF66] font-bold">L-Click / J: Attack</span><span className="text-white/30">&bull;</span><span className="text-cyan-400 font-bold">R-Click / K: Heavy</span><span className="text-white/30">&bull;</span><span>Space / Shift: Dodge</span></div>{boss && <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[min(540px,80%)]"><div className="flex items-center justify-between text-[10px] font-mono uppercase mb-1"><span className="text-rose-300 font-bold">{boss.name}</span><span className="text-amber-300 font-bold">Phase {boss.phase}/3</span></div><div className="h-2 rounded-full bg-black/70 border border-rose-400/40 overflow-hidden"><div className="h-full bg-rose-400 transition-all" style={{ width: meter(boss.hp, boss.maxHp) }} /></div></div>}</div><div className="p-4 border-t border-white/10 grid grid-cols-4 gap-2"><AbilityButton label="Basic" hint="Free" icon={<Swords size={15} />} ready={!cooldowns.basic} onClick={() => dealDamage('basic')} /><AbilityButton label="Heavy" hint="20 STA" icon={<Shield size={15} />} ready={!cooldowns.heavy} onClick={() => dealDamage('heavy')} /><AbilityButton label="Arc Pulse" hint="30 STA" icon={<Wand2 size={15} />} ready={!cooldowns.special} onClick={() => dealDamage('special')} /><AbilityButton label="Overdrive" hint="70 STA" icon={<Zap size={15} />} ready={!cooldowns.ultimate} onClick={() => dealDamage('ultimate')} /></div></div><aside className="space-y-5"><div className="rounded-2xl border border-white/10 bg-black/25 p-5"><h2 className="text-xs font-black uppercase tracking-widest text-[#00FF66]">Combat telemetry</h2><div className="mt-4 space-y-3"><Bar label="HP" value={player.hp} max={player.maxHp} color="#fb7185" /><Bar label="Stamina" value={player.stamina} max={player.maxStamina} /></div><div className="mt-5 grid grid-cols-2 gap-2"><MiniStat label="Attack" value={`${player.attack}`} /><MiniStat label="Defense" value={`${player.defense}`} /><MiniStat label="Critical" value={`${player.crit}%`} /><MiniStat label="Enemies" value={`${enemies.filter((item) => item.hp > 0).length}`} /></div></div><div className="rounded-2xl border border-white/10 bg-black/25 p-5"><h2 className="text-xs font-black uppercase tracking-widest text-[#00FF66]">Battle log</h2><div className="mt-3 space-y-2 max-h-64 overflow-auto">{log.map((entry, index) => <p key={`${entry}-${index}`} className="text-xs text-white/55 border-l-2 border-[#00FF66]/30 pl-3">{entry}</p>)}</div></div></aside></section>}

      {mode === 'reward' && <section className="max-w-2xl mx-auto px-4 sm:px-8 py-12"><div className="rounded-3xl border border-[#00FF66]/25 bg-[#07120c] p-8 text-center"><div className="w-16 h-16 mx-auto rounded-2xl border border-[#00FF66]/50 flex items-center justify-center text-[#00FF66]"><Trophy size={30} /></div><p className="mt-5 text-[10px] font-mono tracking-[0.3em] uppercase text-[#00FF66]">Room cleared</p><h1 className="mt-2 text-3xl font-black uppercase">The path opens</h1>{loot ? <div className="mt-6 rounded-2xl border border-amber-300/30 bg-amber-300/5 p-5 text-left"><div className="flex items-center justify-between"><span className="text-[10px] font-mono uppercase text-amber-300">{loot.rarity} {loot.kind}</span><Sparkles size={16} className="text-amber-300" /></div><h2 className="mt-3 text-xl font-black uppercase">{loot.name}</h2><p className="mt-2 text-sm text-white/55">{loot.description}</p><div className="mt-4 text-xs font-mono text-[#00FF66]">{loot.attack ? `+${loot.attack} attack ` : ''}{loot.defense ? `+${loot.defense} defense ` : ''}{loot.maxHp ? `+${loot.maxHp} max HP` : ''}</div><button onClick={() => applyLoot(loot)} className="mt-5 w-full neon-green-button py-3 rounded-xl font-black uppercase tracking-widest text-sm">Equip Loot</button></div> : <p className="mt-6 text-white/55">The boss left no loot. It left a key.</p>}<div className="mt-6 flex gap-3"><button onClick={() => { setMode('map'); setLoot(null); }} className="flex-1 py-3 rounded-xl border border-white/15 font-black uppercase text-xs">Return to Map</button>{room?.type === 'boss' && floor < FLOORS.length - 1 && <button onClick={descend} className="flex-1 neon-green-button py-3 rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2">Descend <ArrowRight size={14} /></button>}</div></div></section>}

      {mode === 'shop' && <ChoiceCard title="The Strange Merchant" icon={<Coins size={28} />} copy="Buy one advantage before the next room. The price is honest; the dungeon is not."><div className="grid sm:grid-cols-3 gap-3"><ShopItem label="Repair Kit" price={35} disabled={player.gold < 35} onClick={() => { setPlayer((state) => ({ ...state, gold: state.gold - 35, hp: Math.min(state.maxHp, state.hp + Math.round(state.maxHp * 0.3)) })); addLog('Repair Kit restored 30% HP.'); setMode('map'); }} /><ShopItem label="Weapon Mod" price={60} disabled={player.gold < 60} onClick={() => { setPlayer((state) => ({ ...state, gold: state.gold - 60, attack: state.attack + 14, weaponBonus: state.weaponBonus + 14 })); addLog('Weapon Mod increased attack by 14.'); setMode('map'); }} /><ShopItem label="Revive Token" price={90} disabled={player.gold < 90} onClick={() => { setPlayer((state) => ({ ...state, gold: state.gold - 90, soulShards: state.soulShards + 1 })); addLog('Revive Token stored as a Soul Shard.'); setMode('map'); }} /></div></ChoiceCard>}

      {mode === 'event' && <ChoiceCard title="The Dungeon Speaks" icon={<Sparkles size={28} />} copy="A prisoner, a merchant, and a blood-warm altar occupy the same impossible room."><div className="grid sm:grid-cols-3 gap-3"><ShopItem label="Free the Prisoner" price={0} onClick={() => { setPlayer((state) => ({ ...state, soulShards: state.soulShards + 1, xp: state.xp + 50 })); addLog('The prisoner gives you a Soul Shard and a memory fragment.'); setMode('map'); }} /><ShopItem label="Sacrifice 30% HP" price={0} onClick={() => { setPlayer((state) => ({ ...state, hp: Math.max(1, Math.round(state.hp * 0.7)), attack: state.attack + 22 })); addLog('The altar grants power and takes blood.'); setMode('map'); }} /><ShopItem label="Walk Away" price={0} onClick={() => { addLog('You refuse the bargain. The dungeon notices.'); setMode('map'); }} /></div></ChoiceCard>}

      {levelChoices.length > 0 && <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-5"><div className="max-w-lg w-full rounded-3xl border border-[#00FF66]/40 bg-[#07120c] p-7"><p className="text-center text-xs font-mono tracking-[0.3em] uppercase text-[#00FF66]">Level {player.level} reached</p><h2 className="text-center text-3xl font-black uppercase mt-2">Choose an upgrade</h2><div className="mt-6 space-y-3">{levelChoices.map((choice) => <button key={choice} onClick={() => chooseLevelUpgrade(choice)} className="w-full p-4 rounded-xl border border-white/10 hover:border-[#00FF66]/70 bg-white/[0.03] text-left font-black uppercase text-sm">{choice}<span className="block text-xs text-white/45 font-normal mt-1">This choice shapes the rest of the run.</span></button>)}</div></div></div>}

      {mode === 'dead' && <EndScreen title="You Died" icon={<RotateCcw size={30} />} copy={`The dungeon reached Floor ${floor + 1}. You defeated ${player.kills} enemies and cleared ${player.roomsCleared} rooms.`} primary="Start New Run" onPrimary={startRun} />}
      {mode === 'victory' && <EndScreen title="The Core Is Yours" icon={<Trophy size={30} />} copy="The living dungeon offers three futures. Choose what your past becomes." primary="Destroy the Core" onPrimary={() => setEnding('The cycle ends in fire.')} secondary="Become the Core" onSecondary={() => setEnding('You take the throne beneath the world.')} third="Free the Core" onThird={() => setEnding('The dungeon wakes, and finally lets everyone go.')} ending={ending} onRestart={startRun} />}
    </div>
  );
}

function DungeonTutorial({ onClose }: { onClose: () => void }) {
  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#020502]/80 px-4 py-8 backdrop-blur-md"><div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-[#00FF66]/30 bg-[#07120C] shadow-[0_0_70px_rgba(0,255,102,0.18)]"><div className="flex items-start justify-between border-b border-white/10 p-6"><div><p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#00FF66]">Field manual // first deployment</p><h2 className="mt-2 text-2xl font-black uppercase">How to survive the descent</h2><p className="mt-1 text-sm text-white/50">Capture the viewport and move through each chamber before choosing your next route.</p></div><button onClick={onClose} className="rounded-lg border border-white/10 p-2 text-white/50 hover:border-[#00FF66]/50 hover:text-[#00FF66]" aria-label="Close tutorial"><X size={17} /></button></div><div className="grid gap-3 p-6 sm:grid-cols-2"><div className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex items-center gap-3"><Keyboard size={18} className="text-[#00FF66]" /><h3 className="font-black uppercase">Move</h3></div><p className="mt-2 text-xs leading-relaxed text-white/55"><span className="font-mono text-white">W A S D</span> or arrow keys move through the corridor. Movement accelerates smoothly and stops with braking.</p></div><div className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex items-center gap-3"><MousePointer2 size={18} className="text-[#00FF66]" /><h3 className="font-black uppercase">Look and target</h3></div><p className="mt-2 text-xs leading-relaxed text-white/55">Click the 3D viewport to capture the mouse, move the mouse to look around, then click a visible monster to lock your target.</p></div><div className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex items-center gap-3"><Swords size={18} className="text-[#00FF66]" /><h3 className="font-black uppercase">Attack</h3></div><p className="mt-2 text-xs leading-relaxed text-white/55">Press <span className="font-mono text-white">1–4</span> for Basic, Heavy, Arc Pulse, and Overdrive. You can attack while moving.</p></div><div className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex items-center gap-3"><Shield size={18} className="text-[#00FF66]" /><h3 className="font-black uppercase">Dodge</h3></div><p className="mt-2 text-xs leading-relaxed text-white/55">Press <span className="font-mono text-white">Shift</span> or use the Dodge button to roll in your current direction and briefly ignore hits.</p></div><div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:col-span-2"><div className="flex items-center gap-3"><BookOpen size={18} className="text-[#00FF66]" /><h3 className="font-black uppercase">Explore the map</h3></div><p className="mt-2 text-xs leading-relaxed text-white/55">The route map reveals new chambers as you clear rooms. Return to the map after combat, then choose an open node to descend deeper.</p></div></div><div className="flex justify-end border-t border-white/10 p-5"><button onClick={onClose} className="neon-green-button rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-widest">Enter the dungeon</button></div></div></div>;
}

function DungeonRouteMap({ floor, floorData, rooms, roomIndex, onOpenRoom }: { floor: number; floorData: typeof FLOORS[number]; rooms: RoomNode[]; roomIndex: number; onOpenRoom: (room: RoomNode, index: number) => void }) {
  const discovered = rooms.filter((room) => room.discovered).length;
  const activeRoomIndex = rooms.findIndex((room, idx) => (idx === roomIndex && !room.cleared) || (room.discovered && !room.cleared));
  const activeRoom = activeRoomIndex !== -1 ? rooms[activeRoomIndex] : rooms[roomIndex];
  return <section className="relative z-50 min-h-[calc(100vh-4rem)] overflow-hidden px-4 py-7 sm:px-8"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_10%,rgba(0,255,102,0.10),transparent_45%)]" /><div className="relative mx-auto max-w-7xl"><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-mono uppercase tracking-[0.3em]" style={{ color: floorData.color }}>Floor {floor + 1} // {floorData.name}</p><h1 className="mt-1 text-3xl font-black uppercase tracking-tight">Choose your descent route</h1><p className="mt-1 text-sm text-white/45">The dungeon reveals only the chambers you have earned.</p></div><div className="flex items-center gap-2 text-[10px] font-mono uppercase"><span className="rounded-full border border-[#00FF66]/30 bg-[#00FF66]/[0.06] px-3 py-2 text-[#00FF66]">{discovered}/{rooms.length} Chambers Scanned</span><span className="rounded-full border border-white/10 bg-black/30 px-3 py-2 text-white/45">Node {roomIndex + 1}</span></div></div><div className="grid gap-5 xl:grid-cols-[1fr_300px]"><div className="relative min-h-[560px] overflow-hidden rounded-3xl border border-[#00FF66]/25 bg-[#050B0A] shadow-[0_0_45px_rgba(0,255,102,0.08)]"><div className="absolute inset-0 opacity-20 bg-[radial-gradient(#00FF6640_1px,transparent_1px)] [background-size:24px_24px]" /><div className="absolute inset-x-10 top-10 bottom-10 rounded-[2rem] border border-white/[0.06] bg-gradient-to-b from-[#0B1711]/70 to-black/20" /><div className="absolute left-8 top-7 flex items-center gap-2 text-[9px] font-mono uppercase tracking-widest text-white/35"><Map size={12} className="text-[#00FF66]" /> Live route topology</div><svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M18 25 L50 25 L82 25 M18 25 L18 65 L50 65 L82 65 M50 25 L50 65" fill="none" stroke="rgba(0,255,102,0.25)" strokeWidth="0.55" strokeDasharray="1.2 1.4" /></svg>{rooms.map((room, index) => { const revealed = room.discovered; const active = index === roomIndex; const cleared = room.cleared; return <button key={room.id} disabled={!revealed || cleared} onClick={() => onOpenRoom(room, index)} className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all ${revealed ? 'cursor-pointer' : 'cursor-not-allowed'} ${active ? 'scale-110' : 'hover:scale-105'}`} style={{ left: `${18 + room.x * 32}%`, top: `${25 + room.y * 40}%` }} aria-label={revealed ? `${room.label} chamber` : 'Undiscovered chamber'}><span className={`flex h-16 w-16 flex-col items-center justify-center rounded-2xl border-2 text-center shadow-lg ${revealed ? cleared ? 'border-white/20 bg-white/[0.05] text-white/35' : active ? 'border-[#00FF66] bg-[#00FF66]/20 text-[#00FF66] shadow-[0_0_28px_rgba(0,255,102,0.35)]' : room.type === 'boss' ? 'border-rose-400/60 bg-rose-400/10 text-rose-300' : 'border-white/20 bg-[#09130E] text-white/75' : 'border-white/10 bg-black/70 text-white/20 blur-[1px]'}`}>{revealed ? ROOM_ICON[room.type] : <span className="text-lg">?</span>}<span className="mt-1 text-[8px] font-mono uppercase">{revealed ? room.label : 'Unknown'}</span></span>{active && <span className="mt-2 block text-[8px] font-mono uppercase tracking-widest text-[#00FF66]">Current position</span>}</button>; })}<div className="absolute bottom-7 left-8 right-8 flex flex-wrap gap-2 text-[9px] font-mono uppercase text-white/40"><span className="rounded-lg border border-[#00FF66]/20 bg-[#00FF66]/[0.05] px-2 py-1 text-[#00FF66]">Open route</span><span className="rounded-lg border border-white/10 bg-black/30 px-2 py-1">Unknown chamber</span><span className="rounded-lg border border-rose-400/30 bg-rose-400/[0.05] px-2 py-1 text-rose-300">Boss signal</span></div></div><aside className="rounded-3xl border border-white/10 bg-[#07120C]/80 p-5 flex flex-col justify-between"><div className="flex items-center justify-between"><span className="text-[10px] font-mono uppercase tracking-widest text-[#00FF66]">Descent briefing</span><Target size={15} className="text-[#00FF66]" /></div><div><h2 className="mt-4 text-xl font-black uppercase">The path is alive</h2><p className="mt-1.5 text-sm leading-relaxed text-white/50">Every chamber changes the next route. Clear a room to expose what waits beyond it.</p><div className="mt-5 space-y-2">{[['01', 'Breach', 'Enter the revealed chamber'], ['02', 'Adapt', 'Use loot and level choices'], ['03', 'Descend', 'Find the boss gate']].map(([step, title, copy]) => <div key={step} className="flex gap-3 rounded-xl border border-white/10 bg-black/20 p-2.5"><span className="font-mono text-xs text-[#00FF66]">{step}</span><div><p className="text-xs font-black uppercase">{title}</p><p className="mt-0.5 text-[10px] text-white/40">{copy}</p></div></div>)}</div></div><div className="mt-5 space-y-3"><div className="rounded-xl border border-amber-300/20 bg-amber-300/[0.04] p-3"><p className="text-[9px] font-mono uppercase text-amber-300">Next signal</p><p className="mt-1 text-sm font-black uppercase">{activeRoom && !activeRoom.cleared ? `${activeRoom.label} chamber ready` : 'Boss gate'}</p></div>{activeRoom && !activeRoom.cleared && <button onClick={() => onOpenRoom(activeRoom, activeRoomIndex !== -1 ? activeRoomIndex : roomIndex)} className="w-full neon-green-button py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,102,0.3)] hover:scale-[1.02] transition-transform"><Swords size={16} /> Enter Active Chamber</button>}</div></aside></div></div></section>;
}

function StatChip({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-center"><span className="block text-white/35">{label}</span><span className="block mt-0.5 text-white">{value}</span></div>; }
function MiniStat({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2"><span className="block text-[10px] uppercase text-white/35">{label}</span><span className="block mt-1 font-black">{value}</span></div>; }
function Bar({ label, value, max, color = '#38bdf8' }: { label: string; value: number; max: number; color?: string }) { return <div><div className="flex justify-between text-[10px] font-mono uppercase text-white/45"><span>{label}</span><span>{Math.round(value)}/{Math.round(max)}</span></div><div className="mt-1 h-2 rounded-full bg-black/60 overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: meter(value, max), background: color }} /></div></div>; }
function AbilityButton({ label, hint, icon, ready, onClick }: { label: string; hint: string; icon: React.ReactNode; ready: boolean; onClick: () => void }) { const hotkey = { Basic: '1', Heavy: '2', 'Arc Pulse': '3', Overdrive: '4' }[label]; return <button onClick={onClick} disabled={!ready} className={`p-3 rounded-xl border text-left transition-all ${ready ? 'border-[#00FF66]/30 hover:border-[#00FF66] hover:bg-[#00FF66]/10' : 'border-white/5 opacity-40'}`}><span className="flex items-center gap-2 text-xs font-black uppercase"><span className="text-[#00FF66] font-mono">{hotkey}</span>{icon}{label}</span><span className="block mt-1 text-[10px] font-mono text-white/40 uppercase">{ready ? hint : `Cooldown ${hint}`}</span></button>; }
function ChoiceCard({ title, icon, copy, children }: { title: string; icon: React.ReactNode; copy: string; children: React.ReactNode }) { return <section className="max-w-3xl mx-auto px-4 sm:px-8 py-12"><div className="rounded-3xl border border-[#00FF66]/25 bg-[#07120c] p-8"><div className="w-16 h-16 rounded-2xl border border-[#00FF66]/50 flex items-center justify-center text-[#00FF66]">{icon}</div><h1 className="mt-6 text-3xl font-black uppercase">{title}</h1><p className="mt-2 text-white/55">{copy}</p><div className="mt-7">{children}</div></div></section>; }
function ShopItem({ label, price, disabled = false, onClick }: { label: string; price: number; disabled?: boolean; onClick: () => void }) { return <button disabled={disabled} onClick={onClick} className={`p-4 rounded-xl border text-left ${disabled ? 'opacity-40 border-white/10' : 'border-white/10 hover:border-[#00FF66]/60'}`}><span className="block text-xs font-black uppercase">{label}</span><span className="mt-2 block text-[10px] font-mono text-amber-300">{price ? `${price} GOLD` : 'FREE'}</span></button>; }
function EndScreen({ title, icon, copy, primary, onPrimary, secondary, onSecondary, third, onThird, ending, onRestart }: { title: string; icon: React.ReactNode; copy: string; primary: string; onPrimary: () => void; secondary?: string; onSecondary?: () => void; third?: string; onThird?: () => void; ending?: string | null; onRestart?: () => void }) { return <section className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-5"><div className="max-w-xl w-full text-center rounded-3xl border border-[#00FF66]/25 bg-[#07120c] p-8"><div className="w-16 h-16 mx-auto rounded-full border border-[#00FF66]/50 flex items-center justify-center text-[#00FF66]">{icon}</div><h1 className="mt-6 text-4xl font-black uppercase">{title}</h1><p className="mt-3 text-white/55 leading-relaxed">{ending || copy}</p>{ending ? <button onClick={onRestart} className="mt-7 neon-green-button px-6 py-3 rounded-xl font-black uppercase text-sm">Play Again</button> : <div className="mt-7 space-y-3"><button onClick={onPrimary} className="w-full neon-green-button px-5 py-3 rounded-xl font-black uppercase text-sm">{primary}</button>{secondary && <button onClick={onSecondary} className="w-full px-5 py-3 rounded-xl border border-white/15 hover:border-[#00FF66]/60 font-black uppercase text-sm">{secondary}</button>}{third && <button onClick={onThird} className="w-full px-5 py-3 rounded-xl border border-amber-300/30 text-amber-200 hover:border-amber-200 font-black uppercase text-sm">{third}</button>}</div>}</div></section>; }
