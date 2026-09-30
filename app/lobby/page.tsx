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
  Coins as CoinsIcon,
  Clock,
  Timer,
} from 'lucide-react';
import { useAvatarStore } from '@/store/avatarStore';
import { useAuthStore } from '@/store/authStore';
import { AvatarConfig } from '@/types/avatar';
import { Arena3DView } from '@/components/arena/Arena3DView';
import { VersusScreen } from '@/components/arena/VersusScreen';
import { CombatAction } from '@/components/arena/Arena3DCanvas';
import { calculateAvatarStats } from '@/lib/statsCalculator';
import { useToast } from '@/components/Toast';
import { PRESET_AVATARS } from '@/data/presets';
import { sound } from '@/lib/audio';
import { getSpeciesAttacks, getAttackByType, type SpeciesAttack } from '@/data/speciesAttacks';

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
  const [overdriveEnergy, setOverdriveEnergy] = useState(30); // 0 to 100%
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [showCutscene, setShowCutscene] = useState(false);
  const [showVersusScreen, setShowVersusScreen] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
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

    // Launch dramatic VS screen first
    setShowVersusScreen(true);
    sound.playEquip();
  };

  const handleStartTournament = () => {
    // Block if still healing
    if (healTimeLeft > 0) {
      addToast(`⏳ Avatar still healing! ${healTimeLeft}s remaining. Use Instant Stimpack to skip.`, 'error');
      return;
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
        addToast('🪙 Quarter-Final Victory! +150 Cyber Coins earned! Advancing to Semi-Finals!', 'success');
        startStageBattle('semi');
      } else if (tournamentStage === 'semi') {
        addCoins(300);
        addToast('🪙 Semi-Final Victory! +300 Cyber Coins earned! Advancing to Grand Finals!', 'success');
        startStageBattle('final');
      } else if (tournamentStage === 'final') {
        setTournamentStage('champion');
        addCoins(650);
        addToast(`🏆 CHAMPION! +650 Cyber Coins earned! Won the ${tournamentFormat}!`, 'success');

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
    }, 1400);
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
      return;
    }

    // Reset combat actions to idle
    setTimeout(() => {
      setPlayerAction('idle');
      setOpponentAction('idle');
      setActiveFx(null);
      setIsTurnAnimating(false);
    }, 400);
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
        const effectEmoji = currentAttack.statusEffect === 'burn' ? '🔥' : currentAttack.statusEffect === 'poison' ? '☠️' : currentAttack.statusEffect === 'freeze' ? '❄️' : '⚡';
        setOpponentBurnTurns(currentAttack.statusDuration || 2);
        addFloatingText(`${effectEmoji} ${effectName}!`, 'opponent', false, currentAttack.vfxAccent);
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
        const effectEmoji = currentAttack.statusEffect === 'bleed' ? '🩸' : currentAttack.statusEffect === 'stun' ? '💫' : currentAttack.statusEffect === 'freeze' ? '❄️' : '⚡';
        setOpponentBurnTurns(currentAttack.statusDuration || 2);
        addFloatingText(`${effectEmoji} ${effectName}!`, 'opponent', false, currentAttack.vfxAccent);
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
        addFloatingText(`💥 ${effectName}!`, 'opponent', true, currentAttack.vfxSpark);
      }
    }

    setIsTurnAnimating(true);
    setPlayerAction('attack');
    setActiveFx(fxType);
    setFxSource('player');

    // Impact after 350ms
    setTimeout(() => {
      sound.playImpact();
      setOpponentAction('hit');
      if (isCrit) triggerShake();

      // Check Opponent Evasion
      const opponentEvaded = Math.random() * 100 < opponentFighter.evasionRate;
      const finalDmg = opponentEvaded ? 0 : baseDmg;

      if (opponentEvaded) {
        addFloatingText('EVADED!', 'opponent', false, '#FCD34D');
      } else {
        addFloatingText(isCrit ? `-${finalDmg} CRIT!` : `-${finalDmg}`, 'opponent', isCrit);
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
      addFloatingText(`🔥 -${burnDmg} BURN`, 'opponent', false, '#F97316');

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
      addFloatingText('⚡ CHARGING OVERDRIVE', 'opponent', false, '#FCD34D');
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

    // AI Offensive Attack
    const isAiUltimate = aiMove === 'ultimate';
    const isMagicMove = aiMove === 'magic' || isAiUltimate;
    const oppFx: 'slash' | 'magic' | 'ultimate' = isAiUltimate ? 'ultimate' : isMagicMove ? 'magic' : 'slash';

    setPlayerAction('idle');
    setOpponentAction('attack');
    setActiveFx(oppFx);
    setFxSource('opponent');
    sound.playSlash();

    setTimeout(() => {
      sound.playImpact();
      setPlayerAction(playerWasShielding ? 'defend' : 'hit');

      // Check Player Evasion
      const playerEvaded = Math.random() * 100 < playerFighter.evasionRate;
      let isOppCrit = Math.random() * 100 < opponentFighter.criticalRate;

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
        addFloatingText('DODGED!', 'player', false, '#34D399');
      } else {
        if (isOppCrit) triggerShake();
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
          addFloatingText(`⚡ PARRY REFLECT -${parryReflectDmg}`, 'opponent', true, '#38BDF8');
        }, 200);
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
    addToast('⚡ Instant Nanite Stimpack! Healing cooldown bypassed.', 'success');
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
    <div className={`min-h-screen bg-[#020502] text-white pt-20 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans ${screenShake ? 'animate-bounce' : ''}`}>
      {/* Header with Navigation Tabs & Wallet */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#00FF66]/15">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#00FF66] font-mono">
              ARENA PROTOCOL &bull; 3D COLOSSEUM COMBAT
            </p>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            BATTLE ARENA & LEADERBOARD
          </h1>
        </div>

        {/* Right side: Cyber Coins Wallet & Tab Buttons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold shadow-[0_0_12px_rgba(245,158,11,0.15)]">
            <CoinsIcon size={15} className="text-amber-400 animate-pulse" />
            <span>{coins} COINS</span>
          </div>

          <div className="flex items-center gap-1 bg-[#041006] p-1 rounded-xl border border-[#00FF66]/20">
            <button
              onClick={() => setActiveTab('tournament')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'tournament'
                  ? 'bg-[#00FF66] text-black shadow-[0_0_10px_rgba(0,255,102,0.3)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Swords size={14} />
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
              <Trophy size={14} />
              <span>Leaderboard</span>
            </button>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: 3D TOURNAMENT ARENA                                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'tournament' && (
        <div className="flex flex-col gap-4">
          {/* Streamlined Tournament Bar */}
          <div className="glass-panel px-4 py-3 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#00FF66]/15 border border-[#00FF66]/30 flex items-center justify-center text-[#00FF66]">
                <Trophy size={18} />
              </div>
              <div>
                <span className="text-[10px] text-[#00FF66] font-bold font-mono tracking-widest uppercase">
                  ACTIVE TOURNAMENT
                </span>
                <h3 className="text-base font-black uppercase text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  {tournamentFormat}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {tournamentStage === 'idle' ? (
                <button
                  onClick={handleStartTournament}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl font-black uppercase tracking-wider text-xs text-black neon-green-button hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,255,102,0.35)]"
                >
                  <Play size={15} />
                  <span>Enter Arena</span>
                </button>
              ) : tournamentStage === 'champion' ? (
                <button
                  onClick={handleStartTournament}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl font-black uppercase tracking-wider text-xs text-black neon-green-button hover:scale-105 transition-all"
                >
                  <Crown size={15} />
                  <span>New Tournament</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAutoFight}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#00FF66]/30 bg-[#00FF66]/10 text-[#00FF66] hover:bg-[#00FF66]/20 text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    <FastForward size={14} />
                    <span>Auto-Fight</span>
                  </button>
                  <button
                    onClick={() => setTournamentStage('idle')}
                    className="p-1.5 rounded-lg border border-white/10 hover:border-red-400/40 text-white/50 hover:text-red-400 transition-all"
                    title="Forfeit Match"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Clean Horizontal Stepper Progress */}
          <div className="flex items-center justify-between gap-1 px-2 py-1">
            {[
              { id: 'quarter', label: 'Quarter-Finals' },
              { id: 'semi', label: 'Semi-Finals' },
              { id: 'final', label: 'Grand Finals' },
              { id: 'champion', label: 'Champion' },
            ].map((st, i) => {
              const active = tournamentStage === st.id;
              return (
                <React.Fragment key={st.id}>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        active
                          ? 'bg-[#00FF66] shadow-[0_0_8px_#00FF66]'
                          : 'bg-white/20'
                      }`}
                    />
                    <span
                      className={`text-xs font-mono uppercase tracking-wider ${
                        active ? 'text-[#00FF66] font-bold' : 'text-white/40'
                      }`}
                    >
                      {st.label}
                    </span>
                  </div>
                  {i < 3 && <div className="flex-1 h-px bg-white/10 mx-2 hidden sm:block" />}
                </React.Fragment>
              );
            })}
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* LIVE 3D ARENA VIEWPORT & FIGHT SYSTEM                         */}
          {/* ───────────────────────────────────────────────────────────── */}
          {tournamentStage !== 'idle' && opponentFighter && (
            <div className="flex flex-col gap-4">
              {/* Unified Fighting-Game Style Health HUD */}
              <div className="glass-panel p-3 rounded-2xl border border-white/10 flex items-center justify-between gap-4">
                {/* Left: Player Fighter */}
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black uppercase tracking-wider text-white">
                      {playerFighter.name}{' '}
                      <span className="text-[#00FF66] text-[10px] font-mono font-normal">
                        ({currentAvatar.species || 'Human'})
                      </span>
                    </span>
                    <span className="font-mono font-bold text-[#00FF66]">
                      {playerFighter.hp} / {playerFighter.maxHp} HP
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-black/80 border border-white/10 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#00FF66] to-[#39FF14]"
                      initial={false}
                      animate={{ width: `${Math.max(0, (playerFighter.hp / playerFighter.maxHp) * 100)}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  {/* Slim Overdrive Bar */}
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-400">
                    <span>OVERDRIVE:</span>
                    <div className="flex-1 h-1 rounded-full bg-black overflow-hidden border border-white/10">
                      <div
                        className="h-full bg-amber-400 transition-all"
                        style={{ width: `${overdriveEnergy}%` }}
                      />
                    </div>
                    <span>{overdriveEnergy}%</span>
                  </div>

                  {/* Active Player Status Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    {playerParryActive && (
                      <span className="px-1.5 py-0.5 rounded bg-sky-500/20 border border-sky-400 text-sky-300 text-[9px] font-mono font-bold animate-pulse">
                        🛡️ {shieldAttack.name.toUpperCase()} ACTIVE
                      </span>
                    )}
                    {playerBurnTurns > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-orange-500/20 border border-orange-400 text-orange-300 text-[9px] font-mono font-bold">
                        🔥 BURN ({playerBurnTurns}T)
                      </span>
                    )}
                  </div>
                </div>

                {/* Center: VS Badge & Round */}
                <div className="flex flex-col items-center justify-center px-2">
                  <div className="w-8 h-8 rounded-full bg-black/80 border border-white/20 flex items-center justify-center text-xs font-black font-mono text-white/80">
                    VS
                  </div>
                  <span className="text-[10px] font-mono text-white/40 mt-1 uppercase">
                    RND {currentRoundNumber}
                  </span>
                </div>

                {/* Right: Opponent Fighter */}
                <div className="flex-1 flex flex-col gap-1 text-right">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-red-400">
                      {opponentFighter.hp} / {opponentFighter.maxHp} HP
                    </span>
                    <span className="font-black uppercase tracking-wider text-white">
                      <span className="text-red-400 text-[10px] font-mono font-normal mr-1">
                        ({opponentFighter.archetype})
                      </span>
                      {opponentFighter.name}
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-black/80 border border-white/10 overflow-hidden flex justify-end">
                    <motion.div
                      className="h-full bg-gradient-to-l from-red-500 to-amber-500"
                      initial={false}
                      animate={{ width: `${Math.max(0, (opponentFighter.hp / opponentFighter.maxHp) * 100)}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-1.5 mt-0.5">
                    {opponentBurnTurns > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-orange-500/20 border border-orange-400 text-orange-300 text-[9px] font-mono font-bold">
                        🔥 BURN ({opponentBurnTurns}T)
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-white/40">
                      PWR: {opponentFighter.power} | DEF: {opponentFighter.defense}
                    </span>
                  </div>
                </div>
              </div>

              {/* Unified 3D Colosseum Arena Viewport */}
              <div className="relative w-full rounded-2xl overflow-hidden border border-white/15 shadow-2xl">
                <Arena3DView
                  playerConfig={playerFighter.avatarConfig}
                  opponentConfig={opponentFighter.avatarConfig}
                  playerAction={playerAction}
                  opponentAction={opponentAction}
                  biome={currentBiome}
                  roundKey={battleRoundKey}
                  activeFx={activeFx}
                  fxSource={fxSource}
                  floatingCombatText={floatingTexts}
                />

                {/* Floating Damage & Combat Numbers Overlay */}
                <div className="absolute inset-0 pointer-events-none flex justify-between px-16 sm:px-24 items-center">
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

                {/* Cinematic Round Cutscene Overlay */}
                <AnimatePresence>
                  {showCutscene && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none"
                    >
                      <motion.div
                        initial={{ scale: 0.8, y: -20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 1.05, opacity: 0 }}
                        className="flex flex-col items-center gap-2"
                      >
                        <span className="px-3 py-1 rounded-full bg-[#00FF66]/20 border border-[#00FF66] text-[#00FF66] font-mono text-xs font-bold uppercase tracking-wider">
                          ROUND {currentRoundNumber} ENGAGE
                        </span>
                        <div className="flex items-center gap-3 text-2xl font-black uppercase text-white mt-1">
                          <span className="text-[#00FF66]">{playerFighter.name}</span>
                          <span className="text-white/40 text-sm">VS</span>
                          <span className="text-red-400">{opponentFighter.name}</span>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Species-Specific 4-Move Combat Deck */}
              <div className="glass-panel p-3.5 rounded-2xl border border-white/10 flex flex-col gap-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-xs">
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-[#00FF66]" />
                    <span className="font-black uppercase tracking-wider text-white">
                      {speciesAttackSet.speciesName} Combat Arts
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-white/50">
                    {isTurnAnimating ? 'Resolving Combat Turn...' : 'Ready for Command'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Move 1: Species Strike */}
                  <button
                    onClick={() => handlePlayerMove('strike')}
                    disabled={isTurnAnimating || playerFighter.hp <= 0 || opponentFighter.hp <= 0}
                    className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-left transition-all group disabled:opacity-40"
                    style={{ borderColor: `${strikeAttack.vfxColor}30` }}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-black uppercase text-white" style={{ color: strikeAttack.vfxColor }}>
                        {strikeAttack.name}
                      </span>
                      <Swords size={14} style={{ color: strikeAttack.vfxColor }} />
                    </div>
                    <span className="text-[10px] font-mono block" style={{ color: strikeAttack.vfxAccent }}>
                      {strikeAttack.scalingStat === 'magic' ? playerFighter.magic : playerFighter.power} {strikeAttack.scalingStat.toUpperCase()} &bull; {strikeAttack.statusEffect ? `${Math.round(strikeAttack.statusChance * 100)}% ${strikeAttack.statusEffect}` : `+${strikeAttack.overdriveGain} AP`}
                    </span>
                  </button>

                  {/* Move 2: Species Magic */}
                  <button
                    onClick={() => handlePlayerMove('magic')}
                    disabled={isTurnAnimating || magicCooldown > 0 || playerFighter.hp <= 0 || opponentFighter.hp <= 0}
                    className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-left transition-all group disabled:opacity-40"
                    style={{ borderColor: `${magicAttack.vfxColor}30` }}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-black uppercase text-white" style={{ color: magicAttack.vfxColor }}>
                        {magicAttack.name}
                      </span>
                      <span className={`text-[9px] font-mono font-bold px-1 rounded ${magicCooldown > 0 ? 'bg-white/10 text-white/40' : ''}`} style={magicCooldown <= 0 ? { backgroundColor: `${magicAttack.vfxColor}20`, color: magicAttack.vfxColor } : undefined}>
                        {magicCooldown > 0 ? `${magicCooldown}T CD` : 'READY'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono block" style={{ color: magicAttack.vfxAccent }}>
                      {magicAttack.scalingStat === 'magic' ? playerFighter.magic : playerFighter.power} {magicAttack.scalingStat.toUpperCase()} &bull; {Math.round(magicAttack.statusChance * 100)}% {magicAttack.statusEffect}
                    </span>
                  </button>

                  {/* Move 3: Species Shield */}
                  <button
                    onClick={() => handlePlayerMove('shield')}
                    disabled={isTurnAnimating || shieldCooldown > 0 || playerFighter.hp <= 0 || opponentFighter.hp <= 0}
                    className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-left transition-all group disabled:opacity-40"
                    style={{ borderColor: `${shieldAttack.vfxColor}30` }}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-black uppercase text-white" style={{ color: shieldAttack.vfxColor }}>
                        {shieldAttack.name}
                      </span>
                      <span className={`text-[9px] font-mono font-bold px-1 rounded ${shieldCooldown > 0 ? 'bg-white/10 text-white/40' : ''}`} style={shieldCooldown <= 0 ? { backgroundColor: `${shieldAttack.vfxColor}20`, color: shieldAttack.vfxColor } : undefined}>
                        {shieldCooldown > 0 ? `${shieldCooldown}T CD` : 'READY'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono block" style={{ color: shieldAttack.vfxAccent }}>
                      -{Math.round((shieldAttack.shieldReduction || 0.7) * 100)}% Dmg + {Math.round((shieldAttack.reflectPercent || 0.4) * 100)}% Parry
                    </span>
                  </button>

                  {/* Move 4: Species Ultimate */}
                  <button
                    onClick={() => handlePlayerMove('ultimate')}
                    disabled={isTurnAnimating || overdriveEnergy < 100 || playerFighter.hp <= 0 || opponentFighter.hp <= 0}
                    className={`p-2.5 rounded-xl border text-left transition-all group disabled:opacity-30 ${
                      overdriveEnergy >= 100
                        ? 'border-amber-400 bg-amber-500/20 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse'
                        : 'border-white/10 bg-white/5 text-white/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-black uppercase text-white" style={overdriveEnergy >= 100 ? { color: ultimateAttack.vfxColor } : undefined}>
                        {ultimateAttack.name}
                      </span>
                      <Flame size={14} className={overdriveEnergy >= 100 ? 'text-amber-400' : 'text-white/40'} />
                    </div>
                    <span className="text-[10px] font-mono text-amber-300 block">
                      {overdriveEnergy >= 100 ? '★ UNLEASH ★' : `${overdriveEnergy}% / 100%`}
                    </span>
                  </button>
                </div>
              </div>

              {/* Compact Combat Telemetry Log */}
              <div className="glass-panel p-3 rounded-2xl border border-white/10 max-h-36 overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-[#00FF66] uppercase font-bold">
                    COMBAT LOG TELEMETRY
                  </span>
                  <span className="text-[10px] font-mono text-white/40">LATEST ACTIONS</span>
                </div>
                <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto font-mono text-xs no-scrollbar">
                  {battleLogs.slice(-4).map((log, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-lg border text-xs leading-relaxed ${
                        log.attacker === playerFighter.name
                          ? 'bg-[#00FF66]/10 border-[#00FF66]/30 text-white'
                          : log.attacker.includes('REFEREE')
                          ? 'bg-white/5 border-white/15 text-[#00FF66] font-bold text-center'
                          : 'bg-red-950/20 border-red-500/30 text-white/90'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-white/40 mb-0.5">
                        <span>{log.attacker}</span>
                        <span className={log.critical ? 'text-[#00FF66] font-black' : ''}>{log.action}</span>
                      </div>
                      <p>{log.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Idle Deployment Stage Preview */}
          {tournamentStage === 'idle' && (
            <div className="glass-panel p-8 rounded-3xl border border-[#00FF66]/20 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1 flex flex-col gap-4">
                <span className="text-xs font-bold uppercase tracking-widest text-[#00FF66] font-mono">
                  READY FOR ARENA DEPLOYMENT
                </span>
                <h2 className="text-3xl sm:text-4xl font-black uppercase text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  {currentAvatar.name}
                </h2>
                <p className="text-sm text-white/70 leading-relaxed max-w-lg">
                  Deploy your procedural build into competitive tournament matchmaking. Your combat telemetry scales directly from your chosen species, class role, weapon, and cute outfits.
                </p>

                <div className="grid grid-cols-4 gap-3 max-w-lg pt-4 border-t border-white/10">
                  <div>
                    <span className="text-[10px] text-white/40 uppercase font-mono">Max HP</span>
                    <p className="text-lg font-bold font-mono text-emerald-400">{calculatedPlayerStats.maxHp}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 uppercase font-mono">Power</span>
                    <p className="text-lg font-bold font-mono text-rose-400">{calculatedPlayerStats.power}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 uppercase font-mono">Agility</span>
                    <p className="text-lg font-bold font-mono text-amber-400">{calculatedPlayerStats.agility}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 uppercase font-mono">Magic</span>
                    <p className="text-lg font-bold font-mono text-violet-400">{calculatedPlayerStats.magic}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleStartTournament}
                    className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-black uppercase tracking-widest text-xs text-black neon-green-button hover:scale-105 transition-all shadow-[0_0_25px_rgba(0,255,102,0.4)]"
                  >
                    <Play size={16} />
                    <span>Enter Tournament Arena</span>
                  </button>
                </div>
              </div>

              <div className="w-full md:w-96 h-80 rounded-2xl overflow-hidden bg-black/60 border border-[#00FF66]/30">
                <Arena3DView
                  playerConfig={currentAvatar}
                  opponentConfig={PRESET_AVATARS[0].avatar}
                  playerAction="idle"
                  opponentAction="idle"
                  biome={currentBiome}
                  roundKey={battleRoundKey}
                  className="w-full h-full"
                />
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
              setShowCutscene(true);
              setTimeout(() => {
                setShowCutscene(false);
              }, 1600);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
