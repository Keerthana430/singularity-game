'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Backpack, CircleDot, Coins, Crosshair, Heart,
  Map, Pause, Play, RotateCcw, Shield, Sparkles, Swords, Target, Trophy, Wand2, Zap,
} from 'lucide-react';
import { useAvatarStore } from '@/store/avatarStore';
import { calculateAvatarStats } from '@/lib/statsCalculator';
import { sound } from '@/lib/audio';
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

function initialPlayer(base: ReturnType<typeof calculateAvatarStats>): PlayerState {
  return {
    hp: base.maxHp, maxHp: base.maxHp, attack: base.power, defense: base.defense, crit: base.criticalRate,
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
  const keysRef = useRef<Set<string>>(new Set());
  const floatId = useRef(0);

  const floorData = FLOORS[floor];
  const addLog = useCallback((message: string) => setLog((items) => [message, ...items].slice(0, 8)), []);
  const addFloat = useCallback((value: string, x: number, y: number, color: string) => {
    const id = ++floatId.current;
    setFloating((items) => [...items, { id, value, x, y, color }]);
    window.setTimeout(() => setFloating((items) => items.filter((item) => item.id !== id)), 800);
  }, []);

  const startRun = useCallback(() => {
    const nextRooms = makeRoomMap(0, Date.now());
    setFloor(0); setRoomIndex(0); setRooms(nextRooms); setPlayer(initialPlayer(baseStats)); setEnemies([]);
    setPosition({ x: 20, y: 50 }); setMode('map'); setLoot(null); setEnding(null); setRunStartedAt(Date.now());
    setLog(['Run initialized. Choose a path into the Forgotten Entrance.']);
    sound.playEquip();
  }, [baseStats]);

  const openRoom = useCallback((room: RoomNode, index: number) => {
    if (room.visited && room.cleared) return;
    setRoomIndex(index);
    setRooms((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, visited: true } : item));
    if (room.type === 'combat' || room.type === 'elite' || room.type === 'boss') {
      setEnemies(spawnEnemies(floor, room)); setPosition({ x: 20, y: 50 }); setSelectedEnemy(null); setMode('combat');
      addLog(room.type === 'boss' ? `${floorData.boss} enters the arena.` : `${room.label} chamber: hostiles are closing in.`);
      sound.playImpact();
    } else if (room.type === 'treasure') {
      const prize = rollLoot(floor, false); setLoot(prize); setMode('reward'); addLog('A sealed cache opens with a mechanical sigh.');
    } else if (room.type === 'healing') {
      setPlayer((state) => ({ ...state, hp: Math.min(state.maxHp, state.hp + Math.round(state.maxHp * 0.35)), stamina: state.maxStamina }));
      setRooms((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, cleared: true } : item));
      addLog('The repair cradle restores 35% HP and all stamina.');
    } else if (room.type === 'shop') {
      setMode('shop'); addLog('The merchant watches your hands, not your face.');
    } else {
      setMode('event'); addLog('A voice asks what you are willing to lose.');
    }
  }, [addLog, floor, floorData.boss]);

  const completeRoom = useCallback(() => {
    const room = rooms[roomIndex];
    if (!room) return;
    const prize = room.type === 'boss' ? null : rollLoot(floor, room.type === 'elite');
    setRooms((items) => items.map((item, index) => index === roomIndex ? { ...item, cleared: true } : item));
    setPlayer((state) => {
      const xpGain = room.type === 'boss' ? 180 + floor * 40 : 55 + floor * 22;
      const nextXp = state.xp + xpGain;
      const nextLevel = state.level + (nextXp >= xpForLevel(state.level) ? 1 : 0);
      if (nextLevel > state.level) setLevelChoices(['+15% Attack', '+20 Maximum HP', '+10% Critical Chance']);
      return { ...state, xp: nextXp >= xpForLevel(state.level) ? nextXp - xpForLevel(state.level) : nextXp, level: nextLevel, gold: state.gold + 25 + floor * 12, roomsCleared: state.roomsCleared + 1, kills: state.kills + (room.type === 'combat' || room.type === 'elite' || room.type === 'boss' ? enemies.length : 0) };
    });
    if (room.type === 'boss') {
      if (floor === FLOORS.length - 1) { setMode('victory'); addLog('The Dungeon Core is silent. It is waiting for your answer.'); }
      else { setMode('reward'); setLoot(null); addLog(`Floor ${floor + 1} cleared. The descent continues.`); }
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
    addLog(`${item.name} equipped: ${item.description}`); setLoot(null);
  }, [addLog]);

  const chooseLevelUpgrade = useCallback((choice: string) => {
    setPlayer((state) => choice.includes('Attack') ? { ...state, attack: Math.round(state.attack * 1.15) } : choice.includes('Critical') ? { ...state, crit: state.crit + 10 } : { ...state, maxHp: state.maxHp + 20, hp: state.hp + 20 });
    setLevelChoices([]); addLog(`Level upgrade selected: ${choice}.`);
  }, [addLog]);

  const descend = useCallback(() => {
    const nextFloor = floor + 1;
    setFloor(nextFloor); setRoomIndex(0); setRooms(makeRoomMap(nextFloor, Date.now())); setMode('map'); setLoot(null); setPlayer((state) => ({ ...state, hp: Math.min(state.maxHp, state.hp + Math.round(state.maxHp * 0.12)), stamina: state.maxStamina }));
    addLog(`Descending to Floor ${nextFloor + 1}: ${FLOORS[nextFloor].name}.`);
  }, [addLog, floor]);

  const dealDamage = useCallback((type: 'basic' | 'heavy' | 'special' | 'ultimate') => {
    if (mode !== 'combat' || isPaused || enemies.length === 0 || cooldowns[type] > 0) return;
    const data = { basic: { cost: 0, damage: 1, radius: 14, cd: 3, label: 'Basic attack' }, heavy: { cost: 20, damage: 1.7, radius: 16, cd: 8, label: 'Heavy attack' }, special: { cost: 30, damage: 1.45, radius: 24, cd: 12, label: 'Arc pulse' }, ultimate: { cost: 70, damage: 3.1, radius: 28, cd: 22, label: 'Overdrive' } }[type];
    if (player.stamina < data.cost) { addLog('Not enough stamina.'); return; }
    const target = enemies.filter((enemy) => enemy.hp > 0).sort((a, b) => Math.hypot(a.position.x - position.x, a.position.y - position.y) - Math.hypot(b.position.x - position.x, b.position.y - position.y))[0];
    if (!target) return;
    const distance = Math.hypot(target.position.x - position.x, target.position.y - position.y);
    if (distance > data.radius) { addLog('Move closer to bring the target into range.'); return; }
    const crit = Math.random() * 100 < player.crit;
    const damage = Math.max(1, Math.round((player.attack * data.damage - target.defense * 0.45) * (crit ? 1.7 : 1)));
    const hitEnemies = type === 'special' || type === 'ultimate' ? enemies.map((enemy) => {
      const d = Math.hypot(enemy.position.x - position.x, enemy.position.y - position.y);
      return d <= data.radius + 8 ? { ...enemy, hp: enemy.hp - Math.round(damage * (enemy.id === target.id ? 1 : 0.55)), stunned: type === 'ultimate' ? 1 : enemy.stunned } : enemy;
    }) : enemies.map((enemy) => enemy.id === target.id ? { ...enemy, hp: enemy.hp - damage, stunned: type === 'heavy' ? 1 : enemy.stunned } : enemy);
    setEnemies(hitEnemies); setCooldowns((state) => ({ ...state, [type]: data.cd })); setPlayer((state) => ({ ...state, stamina: state.stamina - data.cost }));
    addFloat(`${crit ? 'CRIT ' : ''}-${damage}`, target.position.x, target.position.y, crit ? '#fbbf24' : 'var(--brand)'); addLog(`${data.label} hit ${target.name} for ${damage}.`); sound.playImpact();
    if (hitEnemies.every((enemy) => enemy.hp <= 0)) { setTimeout(completeRoom, 260); }
  }, [addFloat, addLog, completeRoom, cooldowns, enemies, isPaused, mode, player, position]);

  const dodge = useCallback(() => {
    if (mode !== 'combat' || cooldowns.dodge > 0 || player.stamina < 18) return;
    setPosition((point) => ({ x: Math.min(92, point.x + 12), y: point.y })); setPlayer((state) => ({ ...state, stamina: state.stamina - 18 })); setCooldowns((state) => ({ ...state, dodge: 10 })); addLog('Dodge roll: damage ignored for a brief window.');
  }, [cooldowns.dodge, mode, player.stamina, addLog]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => { keysRef.current.add(event.key.toLowerCase()); if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(event.key.toLowerCase())) event.preventDefault(); };
    const up = (event: KeyboardEvent) => keysRef.current.delete(event.key.toLowerCase());
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  useEffect(() => {
    if (mode !== 'combat' || isPaused) return;
    const timer = window.setInterval(() => {
      setPosition((point) => {
        const keys = keysRef.current; const speed = 2.6;
        return { x: Math.max(8, Math.min(92, point.x + ((keys.has('d') || keys.has('arrowright') ? speed : 0) - (keys.has('a') || keys.has('arrowleft') ? speed : 0)))), y: Math.max(14, Math.min(86, point.y + ((keys.has('s') || keys.has('arrowdown') ? speed : 0) - (keys.has('w') || keys.has('arrowup') ? speed : 0)))) };
      });
      setCooldowns((state) => Object.fromEntries(Object.entries(state).map(([key, value]) => [key, Math.max(0, value - 1)])) as typeof state);
      setPlayer((state) => ({ ...state, stamina: Math.min(state.maxStamina, state.stamina + 1) }));
      setEnemies((items) => items.map((enemy) => {
        if (enemy.hp <= 0 || enemy.stunned > 0) return { ...enemy, stunned: Math.max(0, enemy.stunned - 1) };
        const dx = position.x - enemy.position.x; const dy = position.y - enemy.position.y; const distance = Math.hypot(dx, dy) || 1;
        const wantsDistance = enemy.archetype === 'ranged' || enemy.archetype === 'mage' || enemy.archetype === 'support';
        const shouldMove = wantsDistance ? distance < enemy.range : distance > enemy.range;
        const nextPosition = shouldMove ? { x: enemy.position.x + (dx / distance) * enemy.speed * 5 * (wantsDistance ? -1 : 1), y: enemy.position.y + (dy / distance) * enemy.speed * 5 * (wantsDistance ? -1 : 1) } : enemy.position;
        if (distance <= enemy.range && enemy.cooldown <= 0) {
          if (enemy.archetype === 'support') return { ...enemy, position: nextPosition, cooldown: 18 };
          const incoming = Math.max(2, enemy.attack - (player.defense + player.defenseBonus) * 0.22);
          setPlayer((state) => { const hp = Math.max(0, state.hp - Math.round(incoming)); if (hp <= 0) setTimeout(() => setMode('dead'), 0); return { ...state, hp }; });
          addFloat(`-${Math.round(incoming)}`, position.x, position.y, '#fb7185');
          return { ...enemy, position: nextPosition, cooldown: enemy.archetype === 'boss' && enemy.phase > 1 ? 10 : 18 };
        }
        const phase = enemy.archetype === 'boss' && enemy.hp < enemy.maxHp * 0.66 ? 2 : enemy.archetype === 'boss' && enemy.hp < enemy.maxHp * 0.33 ? 3 : enemy.phase;
        return { ...enemy, position: nextPosition, cooldown: Math.max(0, enemy.cooldown - 1), phase };
      }));
    }, 140);
    return () => window.clearInterval(timer);
  }, [addFloat, isPaused, mode, player.defense, player.defenseBonus, position]);

  const usePotion = () => { if (player.potions <= 0 || player.hp >= player.maxHp) return; setPlayer((state) => ({ ...state, hp: Math.min(state.maxHp, state.hp + Math.round(state.maxHp * 0.35)), potions: state.potions - 1 })); addLog('Health Potion restored 35% HP.'); };
  const room = rooms[roomIndex];
  const boss = enemies.find((enemy) => enemy.archetype === 'boss');
  const runtimeSeconds = runStartedAt ? Math.floor((Date.now() - runStartedAt) / 1000) : 0;

  return (
    <main className="min-h-screen bg-[#020502] text-white pb-8">
      <header className="sticky top-0 z-40 h-16 border-b border-[#00FF66]/20 bg-[#020502]/95 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4"><Link href="/" className="text-white/60 hover:text-[#00FF66] flex items-center gap-1 text-xs font-mono uppercase"><ArrowLeft size={14} /> Base</Link><div className="h-5 w-px bg-white/10" /><span className="font-black tracking-[0.18em] text-sm uppercase text-[#00FF66]">Dungeon // Descent Protocol</span></div>
        <div className="flex items-center gap-4 text-[11px] font-mono uppercase text-white/55"><span className="hidden sm:flex items-center gap-1"><Map size={13} /> Floor {floor + 1}/{FLOORS.length}</span><span className="flex items-center gap-1 text-amber-300"><Coins size={13} /> {player.gold}</span><button onClick={() => setIsPaused((value) => !value)} className="p-2 rounded-lg border border-white/10 hover:border-[#00FF66]/50" aria-label={isPaused ? 'Resume run' : 'Pause run'}>{isPaused ? <Play size={14} /> : <Pause size={14} />}</button></div>
      </header>

      {mode === 'title' && <section className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-5 py-12"><div className="w-full max-w-5xl grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center"><div><p className="text-[#00FF66] text-xs font-mono tracking-[0.35em] uppercase mb-4">A living dungeon adventure</p><h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tight leading-[0.92]">The dungeon<br /><span className="text-[#00FF66]">remembers</span></h1><p className="mt-6 max-w-xl text-white/55 leading-relaxed">Move through a procedural ruin, fight adaptive enemies, shape your build with relics, and decide what happens to the Core at the end of the descent.</p><div className="mt-8 flex flex-wrap gap-3"><button onClick={startRun} className="neon-green-button px-6 py-3 rounded-xl font-black uppercase tracking-widest text-sm flex items-center gap-2"><Play size={16} /> Start New Run</button><Link href="/studio" className="px-6 py-3 rounded-xl border border-white/15 hover:border-[#00FF66]/50 font-black uppercase tracking-widest text-sm">Tune Avatar</Link></div><div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px] font-mono uppercase text-white/45"><span className="p-3 rounded-xl border border-white/10">6 Floors</span><span className="p-3 rounded-xl border border-white/10">7 Room Types</span><span className="p-3 rounded-xl border border-white/10">Multi-phase Bosses</span><span className="p-3 rounded-xl border border-white/10">3 Endings</span></div></div><div className="relative rounded-3xl border border-[#00FF66]/20 bg-[#07120c] p-8 min-h-[360px] overflow-hidden"><div className="absolute inset-0 opacity-30 bg-[radial-gradient(#00FF6640_1px,transparent_1px)] [background-size:22px_22px]" /><div className="relative h-full flex flex-col justify-between"><div className="flex justify-between text-[10px] font-mono uppercase text-white/45"><span>Live dungeon signal</span><span className="text-[#00FF66]">Online</span></div><div className="flex-1 flex items-center justify-center"><div className="w-44 h-44 rounded-full border border-[#00FF66]/50 shadow-[0_0_80px_rgba(0,255,102,0.18)] flex items-center justify-center"><div className="w-20 h-20 rounded-full border-2 border-[#00FF66] animate-pulse flex items-center justify-center"><CircleDot className="text-[#00FF66]" /></div></div></div><div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono uppercase"><span className="rounded-lg bg-black/30 border border-white/10 p-2">Fight</span><span className="rounded-lg bg-black/30 border border-white/10 p-2">Adapt</span><span className="rounded-lg bg-black/30 border border-white/10 p-2">Descend</span></div></div></div></div></section>}

      {mode !== 'title' && mode !== 'victory' && mode !== 'dead' && <div className="max-w-7xl mx-auto px-4 sm:px-8 py-5"><div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4"><div><p className="text-[10px] font-mono tracking-[0.25em] uppercase" style={{ color: floorData.color }}>Floor {floor + 1} // {floorData.name}</p><h1 className="text-2xl sm:text-3xl font-black uppercase mt-1">{floorData.subtitle}</h1></div><div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-[10px] font-mono uppercase"><StatChip label="Level" value={`${player.level}`} /><StatChip label="XP" value={`${player.xp}/${xpForLevel(player.level)}`} /><StatChip label="Kills" value={`${player.kills}`} /><StatChip label="Cleared" value={`${player.roomsCleared}`} /><StatChip label="Soul Shards" value={`${player.soulShards}`} /><StatChip label="Run Time" value={`${Math.floor(runtimeSeconds / 60)}:${String(runtimeSeconds % 60).padStart(2, '0')}`} /></div></div></div>}

      {mode === 'map' && <section className="max-w-7xl mx-auto px-4 sm:px-8 grid lg:grid-cols-[1fr_300px] gap-5"><div className="rounded-2xl border border-white/10 bg-black/25 p-5"><div className="flex items-center justify-between mb-5"><div><h2 className="text-lg font-black uppercase">Choose your route</h2><p className="text-xs text-white/45 mt-1">Rooms reveal themselves only when you commit.</p></div><span className="text-[10px] font-mono text-[#00FF66] uppercase">Node {roomIndex + 1} of {rooms.length}</span></div><div className="grid grid-cols-2 md:grid-cols-3 gap-3">{rooms.map((node, index) => <button key={node.id} disabled={node.cleared} onClick={() => openRoom(node, index)} className={`text-left min-h-[150px] p-4 rounded-2xl border transition-all ${node.cleared ? 'border-[#00FF66]/20 bg-[#00FF66]/5 opacity-60' : node.visited ? 'border-[#00FF66]/40 bg-[#00FF66]/10' : 'border-white/10 bg-white/[0.03] hover:border-[#00FF66]/60 hover:-translate-y-0.5'}`}><div className="flex items-center justify-between"><span className="w-9 h-9 rounded-xl border border-current flex items-center justify-center" style={{ color: node.cleared ? 'var(--brand)' : floorData.color }}>{ROOM_ICON[node.type]}</span><span className="text-[10px] font-mono text-white/35">{node.cleared ? 'CLEARED' : node.visited ? 'OPEN' : 'UNKNOWN'}</span></div><h3 className="mt-5 font-black uppercase tracking-wide">{node.label}</h3><p className="text-xs text-white/45 mt-1 leading-relaxed">{node.description}</p></button>)}</div></div><aside className="rounded-2xl border border-white/10 bg-black/25 p-5"><h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#00FF66]">Run loadout</h2><div className="mt-4 space-y-3"><Bar label="HP" value={player.hp} max={player.maxHp} color="#fb7185" /><Bar label="Stamina" value={player.stamina} max={player.maxStamina} color="#38bdf8" /><Bar label="XP" value={player.xp} max={xpForLevel(player.level)} color="#a78bfa" /></div><div className="mt-5 grid grid-cols-2 gap-2 text-xs"><MiniStat label="Attack" value={`${player.attack}`} /><MiniStat label="Defense" value={`${player.defense}`} /><MiniStat label="Crit" value={`${player.crit}%`} /><MiniStat label="Potions" value={`${player.potions}`} /></div><div className="mt-5 border-t border-white/10 pt-4"><p className="text-[10px] font-mono uppercase text-white/40">Relics</p><p className="mt-2 text-xs text-white/65">{player.relics.length ? player.relics.join(' · ') : 'No relics yet. Treasure rooms alter your build.'}</p></div></aside></section>}

      {mode === 'combat' && <section className="max-w-7xl mx-auto px-4 sm:px-8 grid xl:grid-cols-[1fr_320px] gap-5"><div className="rounded-2xl border border-[#00FF66]/20 bg-[#050b08] overflow-hidden"><div className="p-4 border-b border-white/10 flex items-center justify-between"><div><p className="text-[10px] font-mono uppercase tracking-widest text-[#00FF66]">Live combat room</p><h2 className="font-black uppercase mt-1">{room?.label} Chamber</h2></div><div className="flex items-center gap-2"><button onClick={usePotion} className="px-3 py-2 rounded-lg border border-white/15 text-[10px] font-black uppercase hover:border-[#00FF66]/60 flex items-center gap-1"><Heart size={13} /> Potion {player.potions}</button><button onClick={dodge} className="px-3 py-2 rounded-lg border border-white/15 text-[10px] font-black uppercase hover:border-[#00FF66]/60">Dodge {cooldowns.dodge || 'Ready'}</button></div></div><div className="relative h-[460px] sm:h-[560px] overflow-hidden bg-[radial-gradient(ellipse_at_center,#12321e_0%,#050b08_58%,#020502_100%)]" style={{ backgroundImage: 'linear-gradient(rgba(0,255,102,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,102,0.06) 1px, transparent 1px)', backgroundSize: '42px 42px' }}><div className="absolute inset-5 rounded-2xl border border-[#00FF66]/15" /><div className="absolute left-[14%] top-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-[#00FF66] bg-[#00FF66]/20 shadow-[0_0_30px_rgba(0,255,102,0.45)] flex items-center justify-center" style={{ left: `${position.x}%`, top: `${position.y}%`, transform: 'translate(-50%, -50%)' }}><Crosshair size={27} className="text-[#00FF66]" /></div>{enemies.filter((enemy) => enemy.hp > 0).map((enemy) => <button key={enemy.id} onClick={() => setSelectedEnemy(enemy.id)} className={`absolute -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center transition-transform ${selectedEnemy === enemy.id ? 'scale-110 ring-4 ring-white/25' : ''} ${enemy.archetype === 'boss' ? 'w-32 h-32' : ''}`} style={{ left: `${enemy.position.x}%`, top: `${enemy.position.y}%`, borderColor: enemy.color, background: `${enemy.color}22`, boxShadow: `0 0 24px ${enemy.color}55` }}><span className="text-[9px] font-black uppercase text-center px-1">{enemy.name}</span><span className="text-[9px] font-mono text-white/70 mt-1">{enemy.hp}/{enemy.maxHp}</span><span className="absolute -top-2 -right-2 px-1 rounded bg-black border border-white/20 text-[8px] uppercase">{enemy.archetype}</span></button>)}{floating.map((item) => <span key={item.id} className="absolute z-20 font-black text-lg animate-bounce pointer-events-none" style={{ left: `${item.x}%`, top: `${item.y}%`, color: item.color }}>{item.value}</span>)}<div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-mono uppercase text-white/35">WASD / Arrow keys to move · click an enemy to target</div>{boss && <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[min(540px,80%)]"><div className="flex items-center justify-between text-[10px] font-mono uppercase mb-1"><span className="text-rose-300">{boss.name}</span><span>Phase {boss.phase}</span></div><div className="h-2 rounded-full bg-black/70 border border-rose-400/40 overflow-hidden"><div className="h-full bg-rose-400 transition-all" style={{ width: meter(boss.hp, boss.maxHp) }} /></div></div>}</div><div className="p-4 border-t border-white/10 grid grid-cols-4 gap-2"><AbilityButton label="Basic" hint="Free" icon={<Swords size={15} />} ready={!cooldowns.basic} onClick={() => dealDamage('basic')} /><AbilityButton label="Heavy" hint="20 STA" icon={<Shield size={15} />} ready={!cooldowns.heavy} onClick={() => dealDamage('heavy')} /><AbilityButton label="Arc Pulse" hint="30 STA" icon={<Wand2 size={15} />} ready={!cooldowns.special} onClick={() => dealDamage('special')} /><AbilityButton label="Overdrive" hint="70 STA" icon={<Zap size={15} />} ready={!cooldowns.ultimate} onClick={() => dealDamage('ultimate')} /></div></div><aside className="space-y-5"><div className="rounded-2xl border border-white/10 bg-black/25 p-5"><h2 className="text-xs font-black uppercase tracking-widest text-[#00FF66]">Combat telemetry</h2><div className="mt-4 space-y-3"><Bar label="HP" value={player.hp} max={player.maxHp} color="#fb7185" /><Bar label="Stamina" value={player.stamina} max={player.maxStamina} color="#38bdf8" /></div><div className="mt-5 grid grid-cols-2 gap-2"><MiniStat label="Attack" value={`${player.attack}`} /><MiniStat label="Defense" value={`${player.defense}`} /><MiniStat label="Critical" value={`${player.crit}%`} /><MiniStat label="Enemies" value={`${enemies.filter((item) => item.hp > 0).length}`} /></div></div><div className="rounded-2xl border border-white/10 bg-black/25 p-5"><h2 className="text-xs font-black uppercase tracking-widest text-[#00FF66]">Battle log</h2><div className="mt-3 space-y-2 max-h-64 overflow-auto">{log.map((entry, index) => <p key={`${entry}-${index}`} className="text-xs text-white/55 border-l-2 border-[#00FF66]/30 pl-3">{entry}</p>)}</div></div></aside></section>}

      {mode === 'reward' && <section className="max-w-2xl mx-auto px-4 sm:px-8 py-12"><div className="rounded-3xl border border-[#00FF66]/25 bg-[#07120c] p-8 text-center"><div className="w-16 h-16 mx-auto rounded-2xl border border-[#00FF66]/50 flex items-center justify-center text-[#00FF66]"><Trophy size={30} /></div><p className="mt-5 text-[10px] font-mono tracking-[0.3em] uppercase text-[#00FF66]">Room cleared</p><h1 className="mt-2 text-3xl font-black uppercase">The path opens</h1>{loot ? <div className="mt-6 rounded-2xl border border-amber-300/30 bg-amber-300/5 p-5 text-left"><div className="flex items-center justify-between"><span className="text-[10px] font-mono uppercase text-amber-300">{loot.rarity} {loot.kind}</span><Sparkles size={16} className="text-amber-300" /></div><h2 className="mt-3 text-xl font-black uppercase">{loot.name}</h2><p className="mt-2 text-sm text-white/55">{loot.description}</p><div className="mt-4 text-xs font-mono text-[#00FF66]">{loot.attack ? `+${loot.attack} attack ` : ''}{loot.defense ? `+${loot.defense} defense ` : ''}{loot.maxHp ? `+${loot.maxHp} max HP` : ''}</div><button onClick={() => applyLoot(loot)} className="mt-5 w-full neon-green-button py-3 rounded-xl font-black uppercase tracking-widest text-sm">Equip Loot</button></div> : <p className="mt-6 text-white/55">The boss left no loot. It left a key.</p>}<div className="mt-6 flex gap-3"><button onClick={() => { setMode('map'); setLoot(null); }} className="flex-1 py-3 rounded-xl border border-white/15 font-black uppercase text-xs">Return to Map</button>{room?.type === 'boss' && floor < FLOORS.length - 1 && <button onClick={descend} className="flex-1 neon-green-button py-3 rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2">Descend <ArrowRight size={14} /></button>}</div></div></section>}

      {mode === 'shop' && <ChoiceCard title="The Strange Merchant" icon={<Coins size={28} />} copy="Buy one advantage before the next room. The price is honest; the dungeon is not."><div className="grid sm:grid-cols-3 gap-3"><ShopItem label="Repair Kit" price={35} disabled={player.gold < 35} onClick={() => { setPlayer((state) => ({ ...state, gold: state.gold - 35, hp: Math.min(state.maxHp, state.hp + Math.round(state.maxHp * 0.3)) })); addLog('Repair Kit restored 30% HP.'); setMode('map'); }} /><ShopItem label="Weapon Mod" price={60} disabled={player.gold < 60} onClick={() => { setPlayer((state) => ({ ...state, gold: state.gold - 60, attack: state.attack + 14, weaponBonus: state.weaponBonus + 14 })); addLog('Weapon Mod increased attack by 14.'); setMode('map'); }} /><ShopItem label="Revive Token" price={90} disabled={player.gold < 90} onClick={() => { setPlayer((state) => ({ ...state, gold: state.gold - 90, soulShards: state.soulShards + 1 })); addLog('Revive Token stored as a Soul Shard.'); setMode('map'); }} /></div></ChoiceCard>}

      {mode === 'event' && <ChoiceCard title="The Dungeon Speaks" icon={<Sparkles size={28} />} copy="A prisoner, a merchant, and a blood-warm altar occupy the same impossible room."><div className="grid sm:grid-cols-3 gap-3"><ShopItem label="Free the Prisoner" price={0} onClick={() => { setPlayer((state) => ({ ...state, soulShards: state.soulShards + 1, xp: state.xp + 50 })); addLog('The prisoner gives you a Soul Shard and a memory fragment.'); setMode('map'); }} /><ShopItem label="Sacrifice 30% HP" price={0} onClick={() => { setPlayer((state) => ({ ...state, hp: Math.max(1, Math.round(state.hp * 0.7)), attack: state.attack + 22 })); addLog('The altar grants power and takes blood.'); setMode('map'); }} /><ShopItem label="Walk Away" price={0} onClick={() => { addLog('You refuse the bargain. The dungeon notices.'); setMode('map'); }} /></div></ChoiceCard>}

      {levelChoices.length > 0 && <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-5"><div className="max-w-lg w-full rounded-3xl border border-[#00FF66]/40 bg-[#07120c] p-7"><p className="text-center text-xs font-mono tracking-[0.3em] uppercase text-[#00FF66]">Level {player.level} reached</p><h2 className="text-center text-3xl font-black uppercase mt-2">Choose an upgrade</h2><div className="mt-6 space-y-3">{levelChoices.map((choice) => <button key={choice} onClick={() => chooseLevelUpgrade(choice)} className="w-full p-4 rounded-xl border border-white/10 hover:border-[#00FF66]/70 bg-white/[0.03] text-left font-black uppercase text-sm">{choice}<span className="block text-xs text-white/45 font-normal mt-1">This choice shapes the rest of the run.</span></button>)}</div></div></div>}

      {mode === 'dead' && <EndScreen title="You Died" icon={<RotateCcw size={30} />} copy={`The dungeon reached Floor ${floor + 1}. You defeated ${player.kills} enemies and cleared ${player.roomsCleared} rooms.`} primary="Start New Run" onPrimary={startRun} />}
      {mode === 'victory' && <EndScreen title="The Core Is Yours" icon={<Trophy size={30} />} copy="The living dungeon offers three futures. Choose what your past becomes." primary="Destroy the Core" onPrimary={() => setEnding('The cycle ends in fire.')} secondary="Become the Core" onSecondary={() => setEnding('You take the throne beneath the world.')} third="Free the Core" onThird={() => setEnding('The dungeon wakes, and finally lets everyone go.')} ending={ending} onRestart={startRun} />}
    </main>
  );
}

function StatChip({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-center"><span className="block text-white/35">{label}</span><span className="block mt-0.5 text-white">{value}</span></div>; }
function MiniStat({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2"><span className="block text-[10px] uppercase text-white/35">{label}</span><span className="block mt-1 font-black">{value}</span></div>; }
function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) { return <div><div className="flex justify-between text-[10px] font-mono uppercase text-white/45"><span>{label}</span><span>{Math.round(value)}/{Math.round(max)}</span></div><div className="mt-1 h-2 rounded-full bg-black/60 overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: meter(value, max), background: color }} /></div></div>; }
function AbilityButton({ label, hint, icon, ready, onClick }: { label: string; hint: string; icon: React.ReactNode; ready: boolean; onClick: () => void }) { return <button onClick={onClick} disabled={!ready} className={`p-3 rounded-xl border text-left transition-all ${ready ? 'border-[#00FF66]/30 hover:border-[#00FF66] hover:bg-[#00FF66]/10' : 'border-white/5 opacity-40'}`}><span className="flex items-center gap-2 text-xs font-black uppercase">{icon}{label}</span><span className="block mt-1 text-[10px] font-mono text-white/40 uppercase">{ready ? hint : `Cooldown ${hint}`}</span></button>; }
function ChoiceCard({ title, icon, copy, children }: { title: string; icon: React.ReactNode; copy: string; children: React.ReactNode }) { return <section className="max-w-3xl mx-auto px-4 sm:px-8 py-12"><div className="rounded-3xl border border-[#00FF66]/25 bg-[#07120c] p-8"><div className="w-16 h-16 rounded-2xl border border-[#00FF66]/50 flex items-center justify-center text-[#00FF66]">{icon}</div><h1 className="mt-6 text-3xl font-black uppercase">{title}</h1><p className="mt-2 text-white/55">{copy}</p><div className="mt-7">{children}</div></div></section>; }
function ShopItem({ label, price, disabled = false, onClick }: { label: string; price: number; disabled?: boolean; onClick: () => void }) { return <button disabled={disabled} onClick={onClick} className={`p-4 rounded-xl border text-left ${disabled ? 'opacity-40 border-white/10' : 'border-white/10 hover:border-[#00FF66]/60'}`}><span className="block text-xs font-black uppercase">{label}</span><span className="mt-2 block text-[10px] font-mono text-amber-300">{price ? `${price} GOLD` : 'FREE'}</span></button>; }
function EndScreen({ title, icon, copy, primary, onPrimary, secondary, onSecondary, third, onThird, ending, onRestart }: { title: string; icon: React.ReactNode; copy: string; primary: string; onPrimary: () => void; secondary?: string; onSecondary?: () => void; third?: string; onThird?: () => void; ending?: string | null; onRestart?: () => void }) { return <section className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-5"><div className="max-w-xl w-full text-center rounded-3xl border border-[#00FF66]/25 bg-[#07120c] p-8"><div className="w-16 h-16 mx-auto rounded-full border border-[#00FF66]/50 flex items-center justify-center text-[#00FF66]">{icon}</div><h1 className="mt-6 text-4xl font-black uppercase">{title}</h1><p className="mt-3 text-white/55 leading-relaxed">{ending || copy}</p>{ending ? <button onClick={onRestart} className="mt-7 neon-green-button px-6 py-3 rounded-xl font-black uppercase text-sm">Play Again</button> : <div className="mt-7 space-y-3"><button onClick={onPrimary} className="w-full neon-green-button px-5 py-3 rounded-xl font-black uppercase text-sm">{primary}</button>{secondary && <button onClick={onSecondary} className="w-full px-5 py-3 rounded-xl border border-white/15 hover:border-[#00FF66]/60 font-black uppercase text-sm">{secondary}</button>}{third && <button onClick={onThird} className="w-full px-5 py-3 rounded-xl border border-amber-300/30 text-amber-200 hover:border-amber-200 font-black uppercase text-sm">{third}</button>}</div>}</div></section>; }
