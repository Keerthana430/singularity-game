'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Heart,
  Wind,
  Layers,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Coins as CoinsIcon,
  Clock,
  Timer,
} from 'lucide-react';
import { useAvatarStore } from '@/store/avatarStore';
import { useAuthStore } from '@/store/authStore';
import { AvatarConfig } from '@/types/avatar';
import { Arena3DView } from '@/components/arena/Arena3DView';
import { VersusScreen } from '@/components/arena/VersusScreen';
import { CombatAction, BiomeType } from '@/components/arena/Arena3DCanvas';
import { calculateAvatarStats } from '@/lib/statsCalculator';
import { useToast } from '@/components/Toast';
import { PRESET_AVATARS } from '@/data/presets';
import { sound, music } from '@/lib/audio';
import { getSpeciesAttacks, getAttackByType, type SpeciesAttack } from '@/data/speciesAttacks';
import { BattleResultModal, type VictoryEmote } from '@/components/arena/BattleResultModal';
import { RoundCountdownOverlay } from '@/components/arena/RoundCountdownOverlay';
import { useGameSettingsStore } from '@/store/gameSettingsStore';
import { GameSettingsButton, GameSettingsModal } from '@/components/shared/GameSettingsModal';

interface Combatant {
  id: string;
  name: string;
  archetype: string;
  maxHp: number;
  hp: number;
  power: number;
  defense: number;
  agility: number;
  magic: number;
  criticalRate: number;
  evasionRate: number;
  avatarConfig: AvatarConfig;
  shieldActive?: boolean;
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

interface FloatingText {
  id: number;
  text: string;
  target: 'player' | 'opponent';
  isCrit?: boolean;
  color?: string;
}

const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'KAGE-07', creator: 'CyberPhantom', archetype: 'Shadow Operative', topGear: 'Cyber Plating', accessory: 'Photon Visor', wins: 48, losses: 2, rating: 3820 },
  { rank: 2, name: 'AURA-V', creator: 'ValkyriePrime', archetype: 'Vanguard Striker', topGear: 'Ionized Cuirass', accessory: 'Particle Wings', wins: 42, losses: 5, rating: 3610 },
  { rank: 3, name: 'VEX-TITAN', creator: 'Juggernaut_9', archetype: 'Iron Bastion', topGear: 'Reactive Armor', accessory: 'Plasma Jetpack', wins: 39, losses: 8, rating: 3450 },
  { rank: 4, name: 'PIXEL-BYTE', creator: 'GlitchWeaver', archetype: 'Shadow Operative', topGear: 'Stealth Hoodie', accessory: 'Jammer Headphones', wins: 34, losses: 7, rating: 3290 },
  { rank: 5, name: 'CHRONO-X', creator: 'TimeWarp', archetype: 'Plasma Arcanist', topGear: 'Temporal Vest', accessory: 'Tachyon Goggles', wins: 31, losses: 9, rating: 3120 },
  { rank: 6, name: 'NEON-VIPER', creator: 'ToxicHolo', archetype: 'Bio-Mech Striker', topGear: 'Synth Armor', accessory: 'Rebreather Mask', wins: 28, losses: 10, rating: 2980 },
];

const TOURNAMENT_FORMATS = [
  'SINGULARITY 8-MAN INVITATIONAL',
  'CYBER COLOSSEUM GAUNTLET',
  'APEX PHOTON GRAND PRIX',
];

export default function LobbyPage() {
  const { currentAvatar, coins, addCoins, spendCoins, recordBattleEnd, getRemainingHealTime, isHealing, instantHeal } = useAvatarStore();
  const { team } = useAuthStore();
  const activeCombatantName = team?.displayName || currentAvatar.name;
  const { add: addToast } = useToast();

  // Species-specific attack set
  const speciesAttackSet = getSpeciesAttacks(currentAvatar.species);
  const strikeAttack = getAttackByType(currentAvatar.species, 'strike');
  const magicAttack = getAttackByType(currentAvatar.species, 'magic');
  const shieldAttack = getAttackByType(currentAvatar.species, 'shield');
  const ultimateAttack = getAttackByType(currentAvatar.species, 'ultimate');

  // Post-battle healing timer
  const [healTimeLeft, setHealTimeLeft] = useState(0);
  const avatarIsHealing = isHealing();

  const [activeTab, setActiveTab] = useState<'tournament' | 'leaderboard'>('tournament');
  const [tournamentFormat, setTournamentFormat] = useState(TOURNAMENT_FORMATS[0]);
  const [tournamentStage, setTournamentStage] = useState<'idle' | 'quarter' | 'semi' | 'final' | 'champion'>('idle');

  // Compute live RPG stats for player build
  const calculatedPlayerStats = calculateAvatarStats(currentAvatar);

  const [playerFighter, setPlayerFighter] = useState<Combatant>({
    id: 'player',
    name: activeCombatantName,
    archetype: calculatedPlayerStats.className,
    maxHp: calculatedPlayerStats.maxHp,
    hp: calculatedPlayerStats.maxHp,
    power: calculatedPlayerStats.power,
    defense: calculatedPlayerStats.defense,
    agility: calculatedPlayerStats.agility,
    magic: calculatedPlayerStats.magic,
    criticalRate: calculatedPlayerStats.criticalRate,
    evasionRate: calculatedPlayerStats.evasionRate,
    avatarConfig: currentAvatar,
  });

  const [opponentFighter, setOpponentFighter] = useState<Combatant | null>(null);
  const [battleLogs, setBattleLogs] = useState<MatchLog[]>([]);
  const [currentRoundNumber, setCurrentRoundNumber] = useState(1);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(INITIAL_LEADERBOARD);

  // 3D Battle Arena Animation States & Biomes
  const [currentBiome, setCurrentBiome] = useState<'grassland' | 'volcano' | 'mystic'>('grassland');
  const [battleRoundKey, setBattleRoundKey] = useState<number>(Date.now());
  const [playerAction, setPlayerAction] = useState<CombatAction>('idle');
  const [opponentAction, setOpponentAction] = useState<CombatAction>('idle');
  const [activeFx, setActiveFx] = useState<'slash' | 'magic' | 'shield' | 'ultimate' | 'healing' | null>(null);
  const [fxSource, setFxSource] = useState<'player' | 'opponent'>('player');
  const [isTurnAnimating, setIsTurnAnimating] = useState(false);
  const [currentAttackId, setCurrentAttackId] = useState<string | undefined>(undefined);
  const [attackVfxColor, setAttackVfxColor] = useState<string | undefined>(undefined);
  const [attackVfxAccent, setAttackVfxAccent] = useState<string | undefined>(undefined);
  const [attackVfxSpark, setAttackVfxSpark] = useState<string | undefined>(undefined);
  const [isAttackCrit, setIsAttackCrit] = useState<boolean>(false);
  const [isAttackDodge, setIsAttackDodge] = useState<boolean>(false);
  const [battleOutcome, setBattleOutcome] = useState<'stage-victory' | 'tournament-champion' | 'defeat' | null>(null);
  const [isRoundCountingDown, setIsRoundCountingDown] = useState(false);
  const [coinsEarnedInMatch, setCoinsEarnedInMatch] = useState(0);
  const [totalDamageDealtInMatch, setTotalDamageDealtInMatch] = useState(0);
  const [overdriveEnergy, setOverdriveEnergy] = useState(30); // 0 to 100%
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [showCutscene, setShowCutscene] = useState(false);
  const [showVersusScreen, setShowVersusScreen] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [playerDamageFlash, setPlayerDamageFlash] = useState(false);
  const [battleLogOpen, setBattleLogOpen] = useState(false);
  const autoFightIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isFairy = currentAvatar.species?.toLowerCase() === 'fairy';

  // Post-battle healing timer tick
  useEffect(() => {
    const tick = setInterval(() => {
      setHealTimeLeft(getRemainingHealTime());
    }, 1000);
    setHealTimeLeft(getRemainingHealTime());
    return () => clearInterval(tick);
  }, [getRemainingHealTime]);

  // Strategic Combat Balancing & Cooldown Engine (Bio-Repair REMOVED)
  const [magicCooldown, setMagicCooldown] = useState(0);
  const [shieldCooldown, setShieldCooldown] = useState(0);
  const [playerParryActive, setPlayerParryActive] = useState(false);

  // Dynamic Status Effects
  const [playerBurnTurns, setPlayerBurnTurns] = useState(0);
  const [opponentBurnTurns, setOpponentBurnTurns] = useState(0);

  // Strategic AI Opponent
  const [opponentHealsRemaining, setOpponentHealsRemaining] = useState(1);
  const [opponentEnergy, setOpponentEnergy] = useState(20);

  // Dynamic soundtrack: general lounge music in lobby, high-octane battle music in combat
  useEffect(() => {
    if (tournamentStage === 'idle') {
      music.setTrack('lobby');
      const savedMute = localStorage.getItem('singularity_music_muted');
      if (savedMute !== 'true' && !music.getIsPlaying()) {
        music.start('lobby');
      }
    } else {
      music.setTrack('colosseum');
      const savedMute = localStorage.getItem('singularity_music_muted');
      if (savedMute !== 'true' && !music.getIsPlaying()) {
        music.start('colosseum');
      }
    }
  }, [tournamentStage]);

  // Fetch backend leaderboard
  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch('/api/leaderboard');
        const json = await res.json();
        if (json.success && json.data) {
          interface RawLeaderboardItem {
            rank: number;
            name: string;
            classRole?: string;
            victories: number;
            losses: number;
            rating: number;
          }
          const apiLeaderboard: LeaderboardEntry[] = json.data.map((item: RawLeaderboardItem) => ({
            rank: item.rank,
            name: item.name,
            creator: item.name === currentAvatar.name ? 'YOU' : 'CyberSystem',
            archetype: item.classRole || 'Cyber Fighter',
            topGear: 'Cyber Plating',
            accessory: 'Photon Visor',
            wins: item.victories,
            losses: item.losses,
            rating: item.rating,
          }));
          setLeaderboard(apiLeaderboard);
        }
      } catch (err) {
        console.warn('Using local leaderboard fallback', err);
      }
    }
    fetchLeaderboard();
  }, [currentAvatar.name]);

  const addFloatingText = (text: string, target: 'player' | 'opponent', isCrit = false, color?: string) => {
    const id = Date.now() + Math.random();
    setFloatingTexts((prev) => [...prev, { id, text, target, isCrit, color }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
    }, 1200);
  };

  const triggerShake = () => {
    if (!useGameSettingsStore.getState().screenShake) return;
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 450);
  };

  // Setup opponent based on stage
  const startStageBattle = (stage: 'quarter' | 'semi' | 'final') => {
    let rivalPreset = PRESET_AVATARS[0];
    if (stage === 'quarter') rivalPreset = PRESET_AVATARS[3]; // PIXEL-BYTE
    if (stage === 'semi') rivalPreset = PRESET_AVATARS[1]; // AURA-V
    if (stage === 'final') rivalPreset = PRESET_AVATARS[0]; // KAGE-07

    const opponentStats = calculateAvatarStats(rivalPreset.avatar);
    const opponent: Combatant = {
      id: rivalPreset.id,
      name: rivalPreset.name,
      archetype: rivalPreset.role,
      maxHp: stage === 'quarter' ? 950 : stage === 'semi' ? 1200 : 1450,
      hp: stage === 'quarter' ? 950 : stage === 'semi' ? 1200 : 1450,
      power: stage === 'quarter' ? 68 : stage === 'semi' ? 88 : 110,
      defense: stage === 'quarter' ? 42 : stage === 'semi' ? 56 : 72,
      agility: stage === 'quarter' ? 30 : stage === 'semi' ? 42 : 55,
      magic: stage === 'quarter' ? 40 : stage === 'semi' ? 65 : 85,
      criticalRate: 18,
      evasionRate: 12,
      avatarConfig: rivalPreset.avatar,
    };

    setOpponentFighter(opponent);
    const freshPlayerStats = calculateAvatarStats(currentAvatar);
    setPlayerFighter({
      id: 'player',
      name: activeCombatantName,
      archetype: freshPlayerStats.className,
      maxHp: freshPlayerStats.maxHp,
      hp: freshPlayerStats.maxHp,
      power: freshPlayerStats.power,
      defense: freshPlayerStats.defense,
      agility: freshPlayerStats.agility,
      magic: freshPlayerStats.magic,
      criticalRate: freshPlayerStats.criticalRate,
      evasionRate: freshPlayerStats.evasionRate,
      avatarConfig: currentAvatar,
      shieldActive: false,
    });

    setBattleLogs([
      {
        turn: 0,
        attacker: 'ARENA REFEREE',
        action: 'COLOSSEUM READY',
        damage: 0,
        critical: false,
        message: `Deployment confirmed for ${stage.toUpperCase()} FINALS! Face ${opponent.name}.`,
      },
    ]);

    const biomes: ('grassland' | 'volcano' | 'mystic')[] = ['grassland', 'volcano', 'mystic'];
    const nextBiome = biomes[Math.floor(Math.random() * biomes.length)];
    setCurrentBiome(nextBiome);
    setBattleRoundKey(Date.now());

    setTournamentStage(stage);
    setCurrentRoundNumber(1);
    setOverdriveEnergy(30);
    setPlayerAction('idle');
    setOpponentAction('idle');
    setActiveFx(null);

    // Reset Tactical Combat Mechanics (Bio-Repair removed)
    setMagicCooldown(0);
    setShieldCooldown(0);
    setPlayerParryActive(false);
    setPlayerBurnTurns(0);
    setOpponentBurnTurns(0);
    setOpponentHealsRemaining(1);
    setOpponentEnergy(20);
    setBattleOutcome(null);

    // Launch dramatic VS screen first
    setShowVersusScreen(true);
    sound.playEquip();
  };

  const handleStartTournament = () => {
    // If avatar is currently in healing phase:
    if (healTimeLeft > 0) {
      if (coins >= 50) {
        spendCoins(50);
        instantHeal();
        setPlayerFighter((prev) => ({ ...prev, hp: prev.maxHp }));
        sound.playEquip();
        addToast('Nanite Stimpack applied! Avatar restored for tournament.', 'success');
      } else {
        addToast(`Avatar is regenerating in Medbay (${healTimeLeft}s left). Need 50 coins to bypass.`, 'info');
        setTournamentStage('idle');
        return;
      }
    }
    const randomFmt = TOURNAMENT_FORMATS[Math.floor(Math.random() * TOURNAMENT_FORMATS.length)];
    setTournamentFormat(randomFmt);
    addToast(`Entering: ${randomFmt}`, 'info');
    startStageBattle('quarter');
  };

  // ─────────────────────────────────────────────────────────────
  // STEP 3: MATCH VICTORY & COIN REWARDS (Declared early for access)
  // ─────────────────────────────────────────────────────────────
  const handleMatchVictory = () => {
    sound.playWin();
    setOpponentAction('hit');
    setPlayerAction('victory');
    setActiveFx(null);

    const dmgDealt = opponentFighter ? opponentFighter.maxHp : 300;
    setTotalDamageDealtInMatch((prev) => prev + dmgDealt);

    setBattleLogs((prev) => [
      ...prev,
      {
        turn: currentRoundNumber,
        attacker: 'ARENA REFEREE',
        action: 'KNOCKOUT',
        damage: 0,
        critical: false,
        message: `VICTORY! ${playerFighter.name} decisively knocked out ${opponentFighter?.name}!`,
      },
    ]);

    setTimeout(() => {
      if (tournamentStage === 'quarter') {
        addCoins(150);
        setCoinsEarnedInMatch(150);
        setBattleOutcome('stage-victory');
      } else if (tournamentStage === 'semi') {
        addCoins(300);
        setCoinsEarnedInMatch(300);
        setBattleOutcome('stage-victory');
      } else if (tournamentStage === 'final') {
        setTournamentStage('champion');
        addCoins(650);
        setCoinsEarnedInMatch(650);
        setBattleOutcome('tournament-champion');

        // Record post-battle healing timer on champion victory (minor damage sustained)
        recordBattleEnd(0.15, isFairy);

        // Sync victory to Backend API
        fetch('/api/leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: playerFighter.name,
            isVictory: true,
            classRole: playerFighter.archetype,
          }),
        }).catch((err) => console.warn('Leaderboard sync error', err));

        // Update leaderboard state
        setLeaderboard((prev) => [
          {
            rank: 1,
            name: playerFighter.name,
            creator: 'YOU',
            archetype: playerFighter.archetype,
            topGear: currentAvatar.top,
            accessory: currentAvatar.accessories.face || currentAvatar.accessories.head || 'Cyber Rig',
            wins: 3,
            losses: 0,
            rating: 4000,
          },
          ...prev.map((e) => ({ ...e, rank: e.rank + 1 })),
        ]);
      }
      setIsTurnAnimating(false);
    }, 1200);
  };

  // End of Round Cleanup & Turn Decrements
  const endRoundCleanUp = (newPlayerHp?: number) => {
    const pCurrentHp = newPlayerHp !== undefined ? newPlayerHp : playerFighter.hp;
    setCurrentRoundNumber((r) => r + 1);

    // Cooldown decrements (Bio-Repair removed)
    setMagicCooldown((c) => Math.max(0, c - 1));
    setShieldCooldown((c) => Math.max(0, c - 1));
    setPlayerParryActive(false);

    // Check Defeat
    if (pCurrentHp <= 0) {
      sound.playImpact();
      setPlayerAction('hit');
      setOpponentAction('victory');
      fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: playerFighter.name,
          isVictory: false,
          classRole: playerFighter.archetype,
        }),
      }).catch((err) => console.warn('Leaderboard sync error', err));

      // Record post-battle healing timer on defeat
      const defeatDmgPct = 1.0; // Full damage on defeat
      recordBattleEnd(defeatDmgPct, isFairy);

      setBattleLogs((prev) => [
        ...prev,
        {
          turn: currentRoundNumber,
          attacker: 'ARENA REFEREE',
          action: 'DEFEAT',
          damage: 0,
          critical: false,
          message: `${playerFighter.name} was eliminated! Avatar needs healing before next battle.`,
        },
      ]);
      addToast('Tournament eliminated! Refit your build in the Studio.', 'error');
      setIsTurnAnimating(false);
      setTimeout(() => {
        setBattleOutcome('defeat');
      }, 1200);
      return;
    }

    // Reset combat actions to idle
    setTimeout(() => {
      setPlayerAction('idle');
      setOpponentAction('idle');
      setActiveFx(null);
      setCurrentAttackId(undefined);
      setIsAttackCrit(false);
      setIsAttackDodge(false);
      setIsTurnAnimating(false);
    }, 450);
  };

  // Execute interactive player choice — SPECIES-SPECIFIC ATTACKS
  const handlePlayerMove = (moveType: 'strike' | 'magic' | 'shield' | 'ultimate') => {
    if (isTurnAnimating || !opponentFighter || opponentFighter.hp <= 0 || playerFighter.hp <= 0) return;

    // Get the species-specific attack data for this move
    const currentAttack = getAttackByType(currentAvatar.species, moveType);

    // ─────────────────────────────────────────────────────────────
    // SHIELD: Species-Specific Barrier
    // ─────────────────────────────────────────────────────────────
    if (moveType === 'shield') {
      if (shieldCooldown > 0) {
        addToast(`${currentAttack.name} cooling down (${shieldCooldown} turns remaining)!`, 'info');
        return;
      }
      setIsTurnAnimating(true);
      sound.playEquip();
      setPlayerAction('defend');
      setActiveFx('shield');
      setFxSource('player');
      setShieldCooldown(currentAttack.cooldown);
      setPlayerParryActive(true);

      const barrierHeal = currentAttack.barrierHealPercent || 0.05;
      const barrierAmt = Math.min(playerFighter.maxHp - playerFighter.hp, Math.round(playerFighter.maxHp * barrierHeal));
      const newPlayerHp = playerFighter.hp + barrierAmt;
      setPlayerFighter((prev) => ({ ...prev, hp: newPlayerHp, shieldActive: true }));
      if (barrierAmt > 0) addFloatingText(`+${barrierAmt} BARRIER`, 'player', false, currentAttack.vfxColor);

      const shieldLog: MatchLog = {
        turn: currentRoundNumber,
        attacker: playerFighter.name,
        action: currentAttack.name.toUpperCase(),
        damage: 0,
        critical: false,
        message: `${playerFighter.name} raised ${currentAttack.name}! ${Math.round((currentAttack.shieldReduction || 0.7) * 100)}% damage reduction + ${Math.round((currentAttack.reflectPercent || 0.4) * 100)}% reflective parry active.`,
      };
      setBattleLogs((prev) => [...prev, shieldLog]);
      setOverdriveEnergy((prev) => Math.min(100, prev + currentAttack.overdriveGain));

      setTimeout(() => {
        resolveOpponentTurn(true, currentAttack);
      }, 700);
      return;
    }

    // ─────────────────────────────────────────────────────────────
    // OFFENSIVE MOVES — Species-Specific (Strike, Magic, Ultimate)
    // ─────────────────────────────────────────────────────────────
    let baseDmg = 0;
    let isCrit = false;
    const actionLabel = currentAttack.name.toUpperCase();
    let fxType: 'slash' | 'magic' | 'ultimate' = 'slash';

    if (moveType === 'magic') {
      if (magicCooldown > 0) {
        addToast(`${currentAttack.name} cooling down (${magicCooldown} turns remaining)!`, 'info');
        return;
      }
      setMagicCooldown(currentAttack.cooldown);
      sound.playSweep();
      fxType = 'magic';
      isCrit = Math.random() * 100 < (playerFighter.criticalRate + 8);
      const spread = 0.88 + Math.random() * 0.24;
      const scalingStat = currentAttack.scalingStat === 'magic' ? playerFighter.magic : playerFighter.power;
      const raw = (scalingStat * currentAttack.damageMultiplier - opponentFighter.defense * currentAttack.armorPen) * spread;
      baseDmg = Math.max(45, Math.round(isCrit ? raw * 1.6 : raw));
      setOverdriveEnergy((prev) => Math.min(100, prev + currentAttack.overdriveGain));

      // Status effect chance
      if (currentAttack.statusChance > 0 && Math.random() < currentAttack.statusChance) {
        const effectName = (currentAttack.statusEffect || 'burn').toUpperCase();
        setOpponentBurnTurns(currentAttack.statusDuration || 2);
        addFloatingText(`[${effectName}]!`, 'opponent', false, currentAttack.vfxAccent);
      }
    } else if (moveType === 'strike') {
      sound.playSlash();
      fxType = 'slash';
      isCrit = Math.random() * 100 < playerFighter.criticalRate;
      const spread = 0.88 + Math.random() * 0.24;
      const scalingStat = currentAttack.scalingStat === 'magic' ? playerFighter.magic : playerFighter.power;
      const raw = (scalingStat * currentAttack.damageMultiplier - opponentFighter.defense * currentAttack.armorPen) * spread;
      baseDmg = Math.max(35, Math.round(isCrit ? raw * 1.6 : raw));
      setOverdriveEnergy((prev) => Math.min(100, prev + currentAttack.overdriveGain));

      // Status effect chance for strikes
      if (currentAttack.statusChance > 0 && Math.random() < currentAttack.statusChance) {
        const effectName = (currentAttack.statusEffect || 'bleed').toUpperCase();
        setOpponentBurnTurns(currentAttack.statusDuration || 2);
        addFloatingText(`[${effectName}]!`, 'opponent', false, currentAttack.vfxAccent);
      }
    } else if (moveType === 'ultimate') {
      if (overdriveEnergy < 100) return;
      sound.playImpact();
      fxType = 'ultimate';
      isCrit = true;
      triggerShake();
      const raw = (playerFighter.power + playerFighter.magic) * (currentAttack.damageMultiplier / 2);
      baseDmg = Math.max(100, Math.round(raw));
      setOverdriveEnergy(0);

      // Ultimate always applies status
      if (currentAttack.statusEffect) {
        const effectName = currentAttack.statusEffect.toUpperCase();
        setOpponentBurnTurns(currentAttack.statusDuration || 2);
        addFloatingText(`[${effectName}]!`, 'opponent', true, currentAttack.vfxSpark);
      }
    }

    setIsTurnAnimating(true);
    setPlayerAction('attack');
    setActiveFx(fxType);
    setFxSource('player');
    setCurrentAttackId(currentAttack.id);
    setAttackVfxColor(currentAttack.vfxColor);
    setAttackVfxAccent(currentAttack.vfxAccent);
    setAttackVfxSpark(currentAttack.vfxSpark);
    setIsAttackCrit(isCrit);
    setIsAttackDodge(false);

    // Impact after 350ms
    setTimeout(() => {
      // Check Opponent Evasion
      const opponentEvaded = Math.random() * 100 < opponentFighter.evasionRate;
      const finalDmg = opponentEvaded ? 0 : baseDmg;

      if (opponentEvaded) {
        sound.playSweep();
        setOpponentAction('dodge');
        setIsAttackDodge(true);
        addFloatingText('[EVADED!]', 'opponent', false, '#38BDF8');
      } else {
        sound.playImpact();
        if (isCrit) {
          setOpponentAction('crit-hit');
          triggerShake();
          addFloatingText(`-${finalDmg} CRIT!`, 'opponent', true, currentAttack.vfxSpark);
        } else {
          setOpponentAction('hit');
          addFloatingText(`-${finalDmg}`, 'opponent', false, currentAttack.vfxColor);
        }
      }

      const newOppHp = Math.max(0, opponentFighter.hp - finalDmg);
      setOpponentFighter((prev) => (prev ? { ...prev, hp: newOppHp } : null));

      const logMsg = opponentEvaded
        ? `${opponentFighter.name} swift-stepped and completely EVADED ${actionLabel}!`
        : isCrit
        ? `CRITICAL SMASH! ${playerFighter.name} unleashed ${actionLabel} for ${finalDmg} DAMAGE!`
        : `${playerFighter.name} landed ${actionLabel} dealing ${finalDmg} damage.`;

      setBattleLogs((prev) => [
        ...prev,
        {
          turn: currentRoundNumber,
          attacker: playerFighter.name,
          action: actionLabel,
          damage: finalDmg,
          critical: isCrit,
          message: logMsg,
        },
      ]);

      // Check Knockout
      if (newOppHp <= 0) {
        handleMatchVictory();
        return;
      }

      // If opponent survives, execute opponent's counter turn
      setTimeout(() => {
        resolveOpponentTurn(false);
      }, 700);
    }, 380);
  };

  // ─────────────────────────────────────────────────────────────
  // STEP 2: OPPONENT AI COUNTER-MOVE (Smart Tactical AI)
  // ─────────────────────────────────────────────────────────────
  const resolveOpponentTurn = (playerWasShielding: boolean, activeShieldAttack?: SpeciesAttack) => {
    if (!opponentFighter || opponentFighter.hp <= 0) {
      setIsTurnAnimating(false);
      return;
    }

    // Process Opponent Burn Damage at start of turn
    if (opponentBurnTurns > 0) {
      const burnDmg = 35;
      const oppHpAfterBurn = Math.max(0, opponentFighter.hp - burnDmg);
      setOpponentBurnTurns((t) => t - 1);
      setOpponentFighter((prev) => (prev ? { ...prev, hp: oppHpAfterBurn } : null));
      addFloatingText(`-${burnDmg} BURN`, 'opponent', false, '#F97316');

      if (oppHpAfterBurn <= 0) {
        handleMatchVictory();
        return;
      }
    }

    // Tactical AI Decision
    const aiHpRatio = opponentFighter.hp / opponentFighter.maxHp;
    let aiMove: 'heal' | 'charge' | 'ultimate' | 'strike' | 'magic' = 'strike';

    if (aiHpRatio < 0.30 && opponentHealsRemaining > 0) {
      aiMove = 'heal';
    } else if (opponentEnergy >= 100) {
      aiMove = 'ultimate';
    } else if (playerWasShielding) {
      aiMove = Math.random() < 0.6 ? 'charge' : 'magic';
    } else {
      aiMove = Math.random() < 0.45 ? 'magic' : 'strike';
    }

    if (aiMove === 'heal') {
      setOpponentHealsRemaining((h) => h - 1);
      setOpponentAction('healing');
      setActiveFx('healing');
      setFxSource('opponent');
      const aiHeal = Math.round(opponentFighter.maxHp * 0.30);
      setOpponentFighter((prev) => prev ? { ...prev, hp: Math.min(prev.maxHp, prev.hp + aiHeal) } : null);
      addFloatingText(`+${aiHeal} AI REPAIR`, 'opponent', false, '#10B981');
      setBattleLogs((prev) => [
        ...prev,
        {
          turn: currentRoundNumber,
          attacker: opponentFighter.name,
          action: 'EMERGENCY NANO-RECOVERY',
          damage: 0,
          critical: false,
          message: `${opponentFighter.name} initialized Emergency Nanite Recovery, regenerating +${aiHeal} HP!`,
        },
      ]);
      endRoundCleanUp();
      return;
    }

    if (aiMove === 'charge') {
      setOpponentEnergy((e) => Math.min(100, e + 35));
      setOpponentAction('defend');
      addFloatingText('[OVERDRIVE CHARGING]', 'opponent', false, '#FCD34D');
      setBattleLogs((prev) => [
        ...prev,
        {
          turn: currentRoundNumber,
          attacker: opponentFighter.name,
          action: 'TACTICAL FOCUS',
          damage: 0,
          critical: false,
          message: `${opponentFighter.name} read ${playerFighter.name}'s shield barrier, safely charging Overdrive energy (+35%) instead of attacking.`,
        },
      ]);
      endRoundCleanUp();
      return;
    }

    // AI Offensive Attack with species-specific attack data
    const isAiUltimate = aiMove === 'ultimate';
    const isMagicMove = aiMove === 'magic' || isAiUltimate;
    const oppAttack = getAttackByType(opponentFighter.avatarConfig.species, aiMove);
    const oppFx: 'slash' | 'magic' | 'ultimate' = isAiUltimate ? 'ultimate' : isMagicMove ? 'magic' : 'slash';

    setPlayerAction('idle');
    setOpponentAction('attack');
    setActiveFx(oppFx);
    setFxSource('opponent');
    setCurrentAttackId(oppAttack.id);
    setAttackVfxColor(oppAttack.vfxColor);
    setAttackVfxAccent(oppAttack.vfxAccent);
    setAttackVfxSpark(oppAttack.vfxSpark);
    setIsAttackDodge(false);
    sound.playSlash();

    setTimeout(() => {
      // Check Player Evasion
      const playerEvaded = Math.random() * 100 < playerFighter.evasionRate;
      let isOppCrit = Math.random() * 100 < opponentFighter.criticalRate;
      setIsAttackCrit(isOppCrit);

      if (playerEvaded) {
        sound.playSweep();
        setPlayerAction('dodge');
        setIsAttackDodge(true);
      } else {
        sound.playImpact();
        if (isOppCrit) {
          setPlayerAction('crit-hit');
          triggerShake();
        } else {
          setPlayerAction(playerWasShielding ? 'defend' : 'hit');
        }
      }

      // Calculate Damage with spread
      const spread = 0.88 + Math.random() * 0.24;
      let oppBase = ((isMagicMove ? opponentFighter.magic : opponentFighter.power) * 2.0 - playerFighter.defense * 0.65) * spread;
      if (isAiUltimate) oppBase *= 1.4;

      let oppDmg = Math.max(25, Math.round(isOppCrit ? oppBase * 1.6 : oppBase));

      // Shield Mitigation & PARRY REFLECT — uses species-specific shield stats
      let parryReflectDmg = 0;
      if (playerWasShielding) {
        const shieldReduce = activeShieldAttack?.shieldReduction || 0.7;
        const reflectPct = activeShieldAttack?.reflectPercent || 0.4;
        parryReflectDmg = Math.round(oppDmg * reflectPct);
        oppDmg = Math.round(oppDmg * (1 - shieldReduce));
      }

      if (playerEvaded) {
        oppDmg = 0;
        addFloatingText('[EVADED!]', 'player', false, '#38BDF8');
      } else {
        if (playerWasShielding) {
          addFloatingText(`PARRY BLOCKED -${oppDmg}`, 'player', false, activeShieldAttack?.vfxColor || '#38BDF8');
        } else {
          addFloatingText(isOppCrit ? `-${oppDmg} CRIT!` : `-${oppDmg}`, 'player', isOppCrit);
        }
      }

      // Execute Reflective Parry Damage to Opponent if active!
      if (playerWasShielding && parryReflectDmg > 0 && !playerEvaded) {
        setTimeout(() => {
          setOpponentFighter((prev) => prev ? { ...prev, hp: Math.max(0, prev.hp - parryReflectDmg) } : null);
          addFloatingText(`[REFLECT] -${parryReflectDmg}`, 'opponent', true, '#38BDF8');
        }, 200);
      }

      if (oppDmg > 0 && !playerEvaded) {
        setPlayerDamageFlash(true);
        setScreenShake(true);
        setTimeout(() => {
          setPlayerDamageFlash(false);
          setScreenShake(false);
        }, 450);
      }

      const newPlayerHp = Math.max(0, playerFighter.hp - oppDmg);
      setPlayerFighter((prev) => ({ ...prev, hp: newPlayerHp, shieldActive: false }));

      // Logs
      const counterLog: MatchLog = {
        turn: currentRoundNumber,
        attacker: opponentFighter.name,
        action: isAiUltimate ? 'BOSS OVERDRIVE' : isMagicMove ? 'ARCANE SURGE' : 'COUNTER STRIKE',
        damage: oppDmg,
        critical: isOppCrit,
        message: playerEvaded
          ? `${playerFighter.name} agilely evaded ${opponentFighter.name}'s counterattack!`
          : playerWasShielding
          ? `Shield absorbed impact (-${oppDmg}) and counter-parried ${parryReflectDmg} reflective damage back!`
          : `${opponentFighter.name} struck for ${oppDmg} damage.`,
      };

      setBattleLogs((prev) => [...prev, counterLog]);
      endRoundCleanUp(newPlayerHp);
    }, 400);
  };


  // Post-Battle Instant Heal Handler
  const handleInstantHealPurchase = () => {
    if (healTimeLeft <= 0) {
      addToast('Avatar is already fully healed!', 'info');
      return;
    }
    spendCoins(50);
    instantHeal();
    setPlayerFighter((prev) => ({ ...prev, hp: prev.maxHp }));
    sound.playEquip();
    addToast('Instant Nanite Stimpack! Healing cooldown bypassed.', 'success');
  };

  // Auto-fight continuous simulation
  const handleAutoFight = () => {
    if (autoFightIntervalRef.current) {
      clearInterval(autoFightIntervalRef.current);
      autoFightIntervalRef.current = null;
      addToast('Auto-Fight paused.', 'info');
      return;
    }

    addToast('Auto-Combat activated! AI executing combat moves.', 'success');
    autoFightIntervalRef.current = setInterval(() => {
      setOpponentFighter((opp) => {
        if (!opp || opp.hp <= 0) {
          if (autoFightIntervalRef.current) clearInterval(autoFightIntervalRef.current);
          autoFightIntervalRef.current = null;
          return opp;
        }
        // Choose best tactical move
        if (overdriveEnergy >= 100) {
          handlePlayerMove('ultimate');
        } else if (opp.hp < 150) {
          handlePlayerMove('strike');
        } else {
          handlePlayerMove(Math.random() > 0.4 ? 'magic' : 'strike');
        }
        return opp;
      });
    }, 1100);
  };

  return (
    <div className="h-[calc(100dvh-4rem)] w-full overflow-hidden flex flex-col pt-3 pb-3 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans bg-transparent text-white">
      {/* Header with Navigation Tabs & Wallet */}
      <div className="flex-shrink-0 flex items-center justify-between gap-3 mb-2 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
          <h1 className="text-sm sm:text-base font-black uppercase tracking-wider text-white font-mono">
            BATTLE ARENA <span className="text-[#00FF66] hidden sm:inline">// 3D COLOSSEUM</span>
          </h1>
        </div>

        {/* Right side: Medbay, Cyber Coins Wallet & Tab Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {healTimeLeft > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 font-mono text-[11px]">
              <Heart size={12} className="text-red-400 animate-pulse shrink-0" />
              <span>MEDBAY: {healTimeLeft}s</span>
              <button
                onClick={handleInstantHealPurchase}
                className="px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-500/40 text-[9px] font-bold transition-all ml-0.5"
                title="Use Stimpack (50 Coins)"
              >
                50 COINS
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold shadow-[0_0_12px_rgba(245,158,11,0.15)]">
            <CoinsIcon size={14} className="text-amber-400 animate-pulse" />
            <span>{coins} COINS</span>
          </div>

          <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('tournament')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'tournament'
                  ? 'bg-[#00FF66] text-black shadow-[0_0_10px_rgba(0,255,102,0.3)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Swords size={13} />
              <span>3D Arena</span>
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-[#00FF66] text-black shadow-[0_0_10px_rgba(0,255,102,0.3)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Trophy size={13} />
              <span>Leaderboard</span>
            </button>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: 3D TOURNAMENT ARENA                                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'tournament' && (
        <div className="flex-1 min-h-0 flex flex-col relative w-full">
          {/* Visual Esports Tournament Progression Nodes (Active match stages only) */}
          {tournamentStage !== 'idle' && (
            <div className="flex-shrink-0 relative glass-panel p-2 sm:p-2.5 rounded-xl border border-white/10 overflow-hidden mb-2">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#00FF66]/15 border border-[#00FF66]/30 flex items-center justify-center text-[#00FF66] shadow-[0_0_12px_rgba(0,255,102,0.2)]">
                    <Trophy size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse" />
                      <span className="text-[9px] text-[#00FF66] font-bold font-mono tracking-widest uppercase">
                        SINGULARITY 8-MAN INVITATIONAL
                      </span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-black uppercase text-white tracking-wide" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                      {tournamentFormat}
                    </h3>
                  </div>
                </div>

                {/* Tournament Progression Glowing Nodes */}
                <div className="flex items-center gap-1 sm:gap-2 py-1 px-2.5 rounded-lg bg-black/60 border border-white/10">
                  {[
                    { id: 'quarter', label: 'Quarter', icon: Swords },
                    { id: 'semi', label: 'Semi', icon: Zap },
                    { id: 'final', label: 'Finals', icon: Shield },
                    { id: 'champion', label: 'Champion', icon: Crown },
                  ].map((st, i) => {
                    const isCurrent = tournamentStage === st.id;
                    const isPassed =
                      (st.id === 'quarter' && ['semi', 'final', 'champion'].includes(tournamentStage)) ||
                      (st.id === 'semi' && ['final', 'champion'].includes(tournamentStage)) ||
                      (st.id === 'final' && tournamentStage === 'champion');
                    const Icon = st.icon;

                    return (
                      <React.Fragment key={st.id}>
                        <div className="flex items-center gap-1">
                          <div
                            className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                              isCurrent
                                ? 'bg-[#00FF66] text-black font-black shadow-[0_0_12px_#00FF66] ring-1 ring-[#00FF66]/50'
                                : isPassed
                                ? 'bg-[#00FF66]/20 border border-[#00FF66]/50 text-[#00FF66]'
                                : 'bg-white/5 border border-white/10 text-white/40'
                            }`}
                          >
                            <Icon size={11} />
                          </div>
                          <span
                            className={`text-[9px] font-mono uppercase tracking-wider hidden md:inline ${
                              isCurrent
                                ? 'text-[#00FF66] font-bold'
                                : isPassed
                                ? 'text-white/80'
                                : 'text-white/30'
                            }`}
                          >
                            {st.label}
                          </span>
                        </div>
                        {i < 3 && (
                          <div
                            className={`w-2.5 sm:w-4 h-0.5 transition-all ${
                              isPassed || isCurrent
                                ? 'bg-gradient-to-r from-[#00FF66] to-[#00FF66]/60 shadow-[0_0_6px_#00FF66]'
                                : 'bg-white/10'
                            }`}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Tournament Stage Controls */}
                <div className="flex items-center gap-2">
                  {tournamentStage === 'champion' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleStartTournament}
                        className="hud-action-btn flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase"
                      >
                        <Crown size={12} />
                        <span>New Tournament</span>
                      </button>
                      <button
                        onClick={() => setTournamentStage('idle')}
                        className="px-2.5 py-1.5 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-mono uppercase transition-all flex items-center gap-1"
                        title="Return to Base"
                      >
                        <RotateCcw size={12} />
                        <span className="hidden sm:inline">Base</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAutoFight}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#00FF66]/30 bg-[#00FF66]/10 text-[#00FF66] hover:bg-[#00FF66]/20 text-[10px] font-bold uppercase tracking-wider transition-all"
                      >
                        <FastForward size={12} />
                        <span>Auto</span>
                      </button>
                      <button
                        onClick={() => setTournamentStage('idle')}
                        className="p-1.5 rounded-lg border border-white/10 hover:border-red-400/40 text-white/50 hover:text-red-400 transition-all"
                        title="Exit to Base"
                      >
                        <RotateCcw size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* LIVE 3D ARENA VIEWPORT & FIGHT SYSTEM (FULL IMMERSION)        */}
          {/* ───────────────────────────────────────────────────────────── */}
          {tournamentStage !== 'idle' && opponentFighter && (
            <div className="relative flex-1 min-h-0 w-full rounded-2xl overflow-hidden border border-[#00FF66]/30 shadow-2xl bg-[#020502]">

              {/* Red damage vignette overlay when damaged */}
              <div
                className={`absolute inset-0 pointer-events-none z-20 transition-opacity duration-300 ${
                  playerDamageFlash ? 'opacity-100 bg-red-600/30' : 'opacity-0'
                }`}
              />

              {/* Low HP Critical Heartbeat Warning Vignette */}
              {playerFighter.hp > 0 && playerFighter.hp / playerFighter.maxHp <= 0.25 && (
                <div className="absolute inset-0 pointer-events-none z-20 animate-pulse border-4 border-red-500/70 shadow-[inset_0_0_80px_rgba(239,68,68,0.5)]" />
              )}

              {/* 3D ARENA VIEWPORT (FILLS THE ENTIRE CONTAINER) */}
              <div className="absolute inset-0 z-0">
                <Arena3DView
                  playerConfig={playerFighter.avatarConfig}
                  opponentConfig={opponentFighter.avatarConfig}
                  playerAction={playerAction}
                  opponentAction={opponentAction}
                  biome={currentBiome}
                  roundKey={battleRoundKey}
                  activeFx={activeFx}
                  fxSource={fxSource}
                  attackId={currentAttackId}
                  vfxColor={attackVfxColor}
                  vfxAccent={attackVfxAccent}
                  vfxSpark={attackVfxSpark}
                  isCrit={isAttackCrit}
                  isDodge={isAttackDodge}
                  overdriveActive={overdriveEnergy >= 100}
                  bloomEnabled={useGameSettingsStore.getState().bloomEnabled}
                  floatingCombatText={floatingTexts}
                  className="w-full h-full"
                />
              </div>

              {/* Floating Damage & Combat Numbers Overlay */}
              <div className="absolute inset-0 pointer-events-none z-20 flex justify-between px-16 sm:px-24 items-center">
                {/* Left Player Floating Text */}
                <div className="relative flex flex-col items-center">
                  {floatingTexts
                    .filter((f) => f.target === 'player')
                    .map((f) => (
                      <motion.div
                        key={f.id}
                        initial={{ opacity: 1, y: 0, scale: 0.8 }}
                        animate={{ opacity: 0, y: -65, scale: 1.4 }}
                        transition={{ duration: 1.1, ease: 'easeOut' }}
                        className={`font-black font-mono text-xl sm:text-2xl drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] ${
                          f.color ? '' : f.isCrit ? 'text-amber-300' : 'text-red-400'
                        }`}
                        style={{ color: f.color }}
                      >
                        {f.text}
                      </motion.div>
                    ))}
                </div>

                {/* Right Opponent Floating Text */}
                <div className="relative flex flex-col items-center">
                  {floatingTexts
                    .filter((f) => f.target === 'opponent')
                    .map((f) => (
                      <motion.div
                        key={f.id}
                        initial={{ opacity: 1, y: 0, scale: 0.8 }}
                        animate={{ opacity: 0, y: -65, scale: 1.4 }}
                        transition={{ duration: 1.1, ease: 'easeOut' }}
                        className={`font-black font-mono text-xl sm:text-2xl drop-shadow-[0_0_12px_rgba(0,255,102,0.8)] ${
                          f.color ? '' : f.isCrit ? 'text-amber-300' : 'text-[#00FF66]'
                        }`}
                        style={{ color: f.color }}
                      >
                        {f.text}
                      </motion.div>
                    ))}
                </div>
              </div>

              {/* 3... 2... 1... ENGAGE Countdown */}
              {isRoundCountingDown && opponentFighter && (
                <div className="relative z-30">
                  <RoundCountdownOverlay
                    roundNumber={currentRoundNumber}
                    stageName={`${tournamentFormat} // ${tournamentStage.toUpperCase()} FINALS`}
                    playerName={playerFighter.name}
                    opponentName={opponentFighter.name}
                    onComplete={() => setIsRoundCountingDown(false)}
                  />
                </div>
              )}

              {/* ─── FLOATING TOP-CENTER: Match State Header ─── */}
              <div className="hud-float top-3 left-1/2 -translate-x-1/2 px-4 py-2 flex items-center gap-3 font-mono text-xs z-20">
                <span className="font-bold text-[#00FF66] uppercase">{playerFighter.name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66]" />
                <span className="font-black text-white/50">VS</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="font-bold text-red-400 uppercase">{opponentFighter.name}</span>
                <span className="text-white/20">|</span>
                <span className="text-white/60 font-bold">RND {currentRoundNumber}</span>
                <span className="text-white/20">|</span>
                <GameSettingsButton className="p-1 rounded-lg border-0 bg-transparent text-white/40 hover:text-cyan-400" />
              </div>

              {/* ─── FLOATING TOP-LEFT: Player Combat HUD ─── */}
              <div className="hud-float top-3 left-3 p-3.5 w-64 sm:w-72 flex flex-col gap-2 z-20">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black uppercase text-white truncate max-w-[140px]">
                    {playerFighter.name}
                  </span>
                  <span className="font-mono font-bold text-[#00FF66]">
                    {playerFighter.hp} / {playerFighter.maxHp} HP
                  </span>
                </div>

                {/* HP Bar */}
                <div className="hud-progress-bar">
                  <motion.div
                    className="hud-progress-fill bg-gradient-to-r from-[#00FF66] to-[#39FF14]"
                    initial={false}
                    animate={{ width: `${Math.max(0, (playerFighter.hp / playerFighter.maxHp) * 100)}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                {/* Overdrive Bar */}
                <div className="flex items-center gap-2 text-[10px] font-mono text-amber-400">
                  <Flame size={12} className={overdriveEnergy >= 100 ? 'animate-pulse text-amber-300' : 'text-white/40'} />
                  <span>OVERDRIVE</span>
                  <div className="flex-1 h-1.5 rounded-full bg-black/60 overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300"
                      style={{ width: `${overdriveEnergy}%` }}
                    />
                  </div>
                  <span>{overdriveEnergy}%</span>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-1">
                  {playerParryActive && (
                    <span className="px-1.5 py-0.5 rounded bg-sky-500/20 border border-sky-400 text-sky-300 text-[9px] font-mono font-bold animate-pulse">
                      PARRY ACTIVE
                    </span>
                  )}
                  {playerBurnTurns > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-orange-500/20 border border-orange-400 text-orange-300 text-[9px] font-mono font-bold">
                      [BURN] ({playerBurnTurns}T)
                    </span>
                  )}
                </div>
              </div>

              {/* ─── FLOATING TOP-RIGHT: Opponent Combat HUD ─── */}
              <div className="hud-float top-3 right-3 p-3.5 w-64 sm:w-72 flex flex-col gap-2 z-20">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-red-400">
                    {opponentFighter.hp} / {opponentFighter.maxHp} HP
                  </span>
                  <span className="font-black uppercase text-white truncate max-w-[140px] text-right">
                    {opponentFighter.name}
                  </span>
                </div>

                {/* Opponent HP Bar */}
                <div className="hud-progress-bar">
                  <motion.div
                    className="hud-progress-fill bg-gradient-to-l from-red-500 to-amber-500 ml-auto"
                    initial={false}
                    animate={{ width: `${Math.max(0, (opponentFighter.hp / opponentFighter.maxHp) * 100)}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-white/50">
                  <span>PWR: {opponentFighter.power} | DEF: {opponentFighter.defense}</span>
                  <span className="text-red-400 font-bold uppercase">[{opponentFighter.archetype}]</span>
                </div>

                {opponentBurnTurns > 0 && (
                  <div className="flex justify-end">
                    <span className="px-1.5 py-0.5 rounded bg-orange-500/20 border border-orange-400 text-orange-300 text-[9px] font-mono font-bold">
                      [BURN] ({opponentBurnTurns}T)
                    </span>
                  </div>
                )}
              </div>

              {/* ─── FLOATING BOTTOM-LEFT: Collapsible Telemetry Log ─── */}
              <div className="hud-float bottom-4 left-3 z-20 transition-all" style={{ width: battleLogOpen ? '280px' : 'auto' }}>
                <button
                  onClick={() => setBattleLogOpen(!battleLogOpen)}
                  className="flex items-center gap-2 px-3 py-2 text-left w-full"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse" />
                  <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest flex-1">
                    Telemetry Log
                  </span>
                  {battleLogOpen ? <ChevronDown size={12} className="text-white/30" /> : <ChevronUp size={12} className="text-white/30" />}
                </button>
                {battleLogOpen && (
                  <div className="px-3 pb-3 max-h-32 overflow-y-auto no-scrollbar font-mono text-[10px] flex flex-col gap-1">
                    {battleLogs.slice(-5).map((log, idx) => (
                      <p
                        key={idx}
                        className={`leading-snug py-1 border-b border-white/5 ${
                          log.attacker === playerFighter.name ? 'text-[#00FF66]' : 'text-red-300'
                        }`}
                      >
                        <span className="font-bold">[{log.attacker}]</span> {log.message}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* ─── FLOATING BOTTOM: Action Deck or Match Resolution Deck ─── */}
              {(tournamentStage === 'champion' || opponentFighter.hp <= 0) ? (
                <div className="hud-float bottom-4 left-1/2 -translate-x-1/2 p-3 sm:p-4 w-[92%] sm:w-[620px] z-20 flex flex-col items-center gap-3 bg-black/90 border border-[#00FF66]/40 backdrop-blur-xl rounded-2xl shadow-[0_0_30px_rgba(0,255,102,0.25)]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-ping" />
                    <span className="text-xs font-mono font-black text-[#00FF66] uppercase tracking-widest">
                      {tournamentStage === 'champion' ? 'TOURNAMENT CHAMPION // VICTORY' : 'STAGE KNOCKOUT // ROUND WON'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2.5 w-full">
                    {tournamentStage === 'champion' ? (
                      <button
                        onClick={handleStartTournament}
                        className="hud-action-btn px-5 py-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,102,0.4)]"
                      >
                        <Crown size={14} />
                        <span>Defend Title (New Tournament)</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (tournamentStage === 'quarter') startStageBattle('semi');
                          else if (tournamentStage === 'semi') startStageBattle('final');
                        }}
                        className="hud-action-btn px-5 py-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,102,0.4)]"
                      >
                        <Swords size={14} />
                        <span>Advance to Next Round</span>
                      </button>
                    )}

                    {healTimeLeft > 0 && (
                      <button
                        onClick={handleInstantHealPurchase}
                        className="px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                      >
                        <Zap size={13} className="text-amber-400 animate-pulse" />
                        <span>Stimpack ({healTimeLeft}s • 50 COINS)</span>
                      </button>
                    )}

                    <button
                      onClick={() => setTournamentStage('idle')}
                      className="px-4 py-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                    >
                      <RotateCcw size={13} />
                      <span>Return to Base</span>
                    </button>
                  </div>
                </div>
              ) : playerFighter.hp <= 0 ? (
                <div className="hud-float bottom-4 left-1/2 -translate-x-1/2 p-3 sm:p-4 w-[92%] sm:w-[540px] z-20 flex flex-col items-center gap-3 bg-black/90 border border-red-500/40 backdrop-blur-xl rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.25)]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span className="text-xs font-mono font-black text-red-400 uppercase tracking-widest">
                      AVATAR DEFEATED // EXTRACTION REQUIRED
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2.5 w-full">
                    {healTimeLeft > 0 && (
                      <button
                        onClick={handleInstantHealPurchase}
                        className="px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                      >
                        <Zap size={13} className="text-amber-400 animate-pulse" />
                        <span>Instant Nanite Stimpack (50 COINS)</span>
                      </button>
                    )}
                    <button
                      onClick={() => setTournamentStage('idle')}
                      className="hud-action-btn px-5 py-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,102,0.4)]"
                    >
                      <RotateCcw size={14} />
                      <span>Return to Base</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Standard 4-Move Ability Action Deck */
                <div className="hud-float bottom-4 left-1/2 -translate-x-1/2 p-2 sm:p-3 w-[92%] sm:w-[680px] z-20">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* Move 1: Strike */}
                    <button
                      onClick={() => handlePlayerMove('strike')}
                      disabled={isTurnAnimating || playerFighter.hp <= 0 || opponentFighter.hp <= 0}
                      className="p-2 sm:p-2.5 rounded-xl border border-white/10 bg-black/60 hover:bg-white/10 text-left transition-all group disabled:opacity-40"
                      style={{ borderColor: `${strikeAttack.vfxColor}40` }}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-black uppercase" style={{ color: strikeAttack.vfxColor }}>
                          {strikeAttack.name}
                        </span>
                        <Swords size={13} style={{ color: strikeAttack.vfxColor }} />
                      </div>
                      <span className="text-[9px] font-mono text-white/50 block truncate">
                        {strikeAttack.scalingStat.toUpperCase()} &bull; +{strikeAttack.overdriveGain} AP
                      </span>
                    </button>

                    {/* Move 2: Magic */}
                    <button
                      onClick={() => handlePlayerMove('magic')}
                      disabled={isTurnAnimating || magicCooldown > 0 || playerFighter.hp <= 0 || opponentFighter.hp <= 0}
                      className="p-2 sm:p-2.5 rounded-xl border border-white/10 bg-black/60 hover:bg-white/10 text-left transition-all group disabled:opacity-40"
                      style={{ borderColor: `${magicAttack.vfxColor}40` }}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-black uppercase" style={{ color: magicAttack.vfxColor }}>
                          {magicAttack.name}
                        </span>
                        <span className={`text-[8px] font-mono font-bold px-1 rounded ${magicCooldown > 0 ? 'bg-white/10 text-white/40' : 'bg-violet-500/20 text-violet-300'}`}>
                          {magicCooldown > 0 ? `${magicCooldown}T CD` : 'READY'}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-white/50 block truncate">
                        {magicAttack.scalingStat.toUpperCase()} &bull; {Math.round(magicAttack.statusChance * 100)}% {magicAttack.statusEffect}
                      </span>
                    </button>

                    {/* Move 3: Shield */}
                    <button
                      onClick={() => handlePlayerMove('shield')}
                      disabled={isTurnAnimating || shieldCooldown > 0 || playerFighter.hp <= 0 || opponentFighter.hp <= 0}
                      className="p-2 sm:p-2.5 rounded-xl border border-white/10 bg-black/60 hover:bg-white/10 text-left transition-all group disabled:opacity-40"
                      style={{ borderColor: `${shieldAttack.vfxColor}40` }}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-black uppercase" style={{ color: shieldAttack.vfxColor }}>
                          {shieldAttack.name}
                        </span>
                        <span className={`text-[8px] font-mono font-bold px-1 rounded ${shieldCooldown > 0 ? 'bg-white/10 text-white/40' : 'bg-sky-500/20 text-sky-300'}`}>
                          {shieldCooldown > 0 ? `${shieldCooldown}T CD` : 'READY'}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-white/50 block truncate">
                        Parry Reflect &bull; Shield
                      </span>
                    </button>

                    {/* Move 4: Ultimate */}
                    <button
                      onClick={() => handlePlayerMove('ultimate')}
                      disabled={isTurnAnimating || overdriveEnergy < 100 || playerFighter.hp <= 0 || opponentFighter.hp <= 0}
                      className={`p-2 sm:p-2.5 rounded-xl border text-left transition-all group disabled:opacity-30 ${
                        overdriveEnergy >= 100
                          ? 'border-amber-400 bg-amber-500/25 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse'
                          : 'border-white/10 bg-black/60 text-white/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-black uppercase" style={overdriveEnergy >= 100 ? { color: ultimateAttack.vfxColor } : undefined}>
                          {ultimateAttack.name}
                        </span>
                        <Flame size={13} className={overdriveEnergy >= 100 ? 'text-amber-400' : 'text-white/40'} />
                      </div>
                      <span className="text-[9px] font-mono text-amber-300 block truncate">
                        {overdriveEnergy >= 100 ? 'UNLEASH OVERDRIVE' : `${overdriveEnergy}% / 100%`}
                      </span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* ───────────────────────────────────────────────────────────── */}
          {/* IDLE HERO ARENA: ORBITAL COLOSSEUM VERTICAL SLICE             */}
          {/* ───────────────────────────────────────────────────────────── */}
          {tournamentStage === 'idle' && (
            <div className="relative flex-1 min-h-0 w-full rounded-3xl overflow-hidden border border-white/15 shadow-[0_12px_48px_rgba(0,0,0,0.85)] bg-gradient-to-b from-[#141830] via-[#101426] to-[#0D1020]">
              {/* 3D ARENA VIEWPORT (HERO AVATAR IN ORBITAL COLOSSEUM WITH PLANET BELOW) */}
              <div className="absolute inset-0 z-0">
                <Arena3DView
                  playerConfig={currentAvatar}
                  opponentConfig={PRESET_AVATARS[0].avatar}
                  playerAction="idle"
                  opponentAction="idle"
                  biome={currentBiome}
                  roundKey={battleRoundKey}
                  className="w-full h-full"
                />
                {/* Subtle Cinematic Vignette */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#101426]/90 via-transparent to-[#101426]/50" />
              </div>

              {/* TOP HUD BROADCAST OVERLAY */}
              <div className="absolute top-3.5 left-4 right-4 z-10 flex items-center justify-between pointer-events-none flex-wrap gap-2">
                {/* Left: Station Deck Badge + Biome selector */}
                <div className="flex items-center gap-2 pointer-events-auto">
                  <div className="px-3.5 py-1.5 rounded-full bg-[#181D33]/90 backdrop-blur-md border border-[#FF9E3B]/40 text-xs font-mono text-[#FFF8EE] font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(255,158,59,0.25)]">
                    <span className="w-2 h-2 rounded-full bg-[#FF9E3B] animate-pulse" />
                    <span>ORBITAL COLOSSEUM // DOCK 01</span>
                  </div>

                  <div className="hidden sm:flex items-center gap-1 bg-[#181D33]/90 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 text-[10px] font-mono">
                    {(['grassland', 'volcano', 'mystic'] as BiomeType[]).map((b) => (
                      <button
                        key={b}
                        onClick={() => setCurrentBiome(b)}
                        className={`px-2.5 py-0.5 rounded-full uppercase transition-all ${
                          currentBiome === b
                            ? 'bg-[#38BDF8] text-black font-extrabold shadow-[0_0_10px_#38BDF8]'
                            : 'text-white/60 hover:text-white'
                        }`}
                      >
                        {b === 'grassland' ? 'Verdant' : b === 'volcano' ? 'Caldera' : 'Twilight'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Center: Broadcast Title Card */}
                <div className="hidden md:inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#181D33]/90 backdrop-blur-md border border-[#FFC700]/30 shadow-[0_0_20px_rgba(255,199,0,0.15)] pointer-events-auto">
                  <span className="w-2 h-2 rounded-full bg-[#FF6B35] animate-ping" />
                  <span
                    className="text-xs font-bold text-[#FFF8EE] tracking-wider uppercase"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    SINGULARITY 8-MAN INVITATIONAL
                  </span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#FF6B35]/20 text-[#FF8A3D] border border-[#FF6B35]/40 uppercase font-black">
                    LIVE
                  </span>
                </div>

                {/* Right: Hangar Tuning Quicklink */}
                <div className="pointer-events-auto">
                  <Link
                    href="/studio"
                    className="px-3.5 py-1.5 rounded-full bg-[#181D33]/90 backdrop-blur-md border border-white/15 hover:border-[#38BDF8] text-xs font-mono text-[#FFF8EE] hover:text-[#38BDF8] uppercase transition-all flex items-center gap-1.5 shadow-lg group"
                  >
                    <Layers size={13} className="text-[#38BDF8] group-hover:rotate-45 transition-transform" />
                    <span>TUNING HANGAR</span>
                  </Link>
                </div>
              </div>

              {/* BOTTOM HUD FLOATING CONTROLS & REAL STORE STATS */}
              <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col items-center gap-2.5 pointer-events-none">
                {/* 1. Pilot & Avatar Name Pill */}
                <div className="px-5 py-2 rounded-2xl bg-[#181D33]/90 backdrop-blur-xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.85)] flex items-center gap-3 pointer-events-auto">
                  <span
                    className="text-base sm:text-lg font-bold text-[#FFF8EE] tracking-wide"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {currentAvatar.name}
                  </span>
                  <span className="w-1 h-3.5 bg-white/20" />
                  <span className="text-xs font-mono font-bold text-[#38BDF8] tracking-wider uppercase">
                    [{((currentAvatar.classRole || calculatedPlayerStats.className || 'OPERATIVE') as string).toUpperCase()}]
                  </span>
                  <span className="text-white/30 text-xs">&bull;</span>
                  <span className="text-xs font-mono text-[#FF9E3B] uppercase font-bold">
                    {currentAvatar.species || 'Human'}
                  </span>
                  <span className="text-white/30 text-xs">&bull;</span>
                  <div className="flex items-center gap-1 text-xs font-mono text-[#FFC700] font-bold">
                    <CoinsIcon size={12} className="text-[#FFC700]" />
                    <span>{coins} COINS</span>
                  </div>
                </div>

                {/* 2. Sleek Compact Stats Strip with Warm Color Coding */}
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 px-5 sm:px-8 py-2 rounded-2xl bg-[#181D33]/90 border border-white/15 backdrop-blur-xl shadow-2xl pointer-events-auto">
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <span className="text-[#8F97B0] font-bold uppercase">HP</span>
                    <span className="font-black text-[#34D399] font-mono">{calculatedPlayerStats.maxHp}</span>
                  </div>
                  <div className="w-px h-3.5 bg-white/10 hidden sm:block" />
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <span className="text-[#8F97B0] font-bold uppercase">PWR</span>
                    <span className="font-black text-[#FF6584] font-mono">{calculatedPlayerStats.power}</span>
                  </div>
                  <div className="w-px h-3.5 bg-white/10 hidden sm:block" />
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <span className="text-[#8F97B0] font-bold uppercase">AGI</span>
                    <span className="font-black text-[#FFC700] font-mono">{calculatedPlayerStats.agility}</span>
                  </div>
                  <div className="w-px h-3.5 bg-white/10 hidden sm:block" />
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <span className="text-[#8F97B0] font-bold uppercase">MAG</span>
                    <span className="font-black text-[#A855F7] font-mono">{calculatedPlayerStats.magic}</span>
                  </div>
                  <div className="w-px h-3.5 bg-white/10 hidden sm:block" />
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <span className="text-[#8F97B0] font-bold uppercase">DEF</span>
                    <span className="font-black text-[#38BDF8] font-mono">{calculatedPlayerStats.defense}</span>
                  </div>
                </div>

                {/* 3. Single Major CTA Button with Playful Squash-and-Stretch */}
                <div className="pointer-events-auto pt-1">
                  <button
                    id="enter-colosseum-btn"
                    onClick={handleStartTournament}
                    className="px-10 sm:px-12 py-3 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FF8A3D] hover:from-[#FF8A3D] hover:to-[#FFAA00] text-white font-bold text-xs sm:text-sm tracking-[0.20em] uppercase flex items-center gap-2.5 shadow-[0_4px_28px_rgba(255,107,53,0.5)] hover:shadow-[0_6px_36px_rgba(255,107,53,0.7)] transition-all hover:scale-105 active:scale-95"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    <Play size={16} fill="currentColor" />
                    <span>ENTER ORBITAL COLOSSEUM</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: CLEAN, NEAT LEADERBOARD                                */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'leaderboard' && (
        <div className="flex-1 min-h-0 flex flex-col gap-3 py-1">
          <div className="flex-shrink-0 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#00FF66] font-mono">GLOBAL RANKINGS</p>
              <h2 className="text-xl sm:text-2xl font-black uppercase text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                TOP AVATAR BUILDS
              </h2>
            </div>
            <span className="text-xs font-mono text-white/40">SEASON 1 STANDINGS</span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col gap-2.5 pr-1">
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

      {/* FULL-SCREEN FIGHTER VS MATCHUP SCREEN */}
      <AnimatePresence>
        {showVersusScreen && opponentFighter && (
          <VersusScreen
            playerConfig={playerFighter.avatarConfig}
            opponentConfig={opponentFighter.avatarConfig}
            playerName={playerFighter.name}
            opponentName={opponentFighter.name}
            opponentRole={opponentFighter.archetype}
            stageTitle={`${tournamentFormat} // ${tournamentStage.toUpperCase()} FINALS`}
            onProceed={() => {
              setShowVersusScreen(false);
              setIsRoundCountingDown(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* COMPREHENSIVE BATTLE OUTCOME MODAL (VICTORY, CHAMPION & DEFEAT) */}
      <BattleResultModal
        outcome={battleOutcome}
        stageTitle={`${tournamentFormat} // ${tournamentStage.toUpperCase()}`}
        nextStageTitle={tournamentStage === 'quarter' ? 'Semi-Finals' : tournamentStage === 'semi' ? 'Grand Finals' : undefined}
        coinsEarned={coinsEarnedInMatch}
        playerName={playerFighter.name}
        opponentName={opponentFighter?.name || 'Rival Fighter'}
        turnsTaken={currentRoundNumber}
        damageDealt={totalDamageDealtInMatch}
        healTimeLeft={healTimeLeft}
        onNextStage={() => {
          setBattleOutcome(null);
          if (tournamentStage === 'quarter') {
            startStageBattle('semi');
          } else if (tournamentStage === 'semi') {
            startStageBattle('final');
          }
        }}
        onInstantHeal={handleInstantHealPurchase}
        onReturnToBase={() => {
          setBattleOutcome(null);
          setTournamentStage('idle');
        }}
        onNewTournament={() => {
          setBattleOutcome(null);
          handleStartTournament();
        }}
        onTriggerEmote={(emote: VictoryEmote) => {
          setPlayerAction('victory');
          addFloatingText(`${emote.icon} ${emote.label.toUpperCase()}!`, 'player', true, emote.fxColor);
        }}
      />

      {/* Global Experience & Accessibility Settings Modal */}
      <GameSettingsModal />
    </div>
  );
}
