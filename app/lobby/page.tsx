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
} from 'lucide-react';
import { useAvatarStore } from '@/store/avatarStore';
import { Arena3DView } from '@/components/arena/Arena3DView';
import { VersusScreen } from '@/components/arena/VersusScreen';
import { CombatAction } from '@/components/arena/Arena3DCanvas';
import { calculateAvatarStats } from '@/lib/statsCalculator';
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
  magic: number;
  criticalRate: number;
  evasionRate: number;
  avatarConfig: any;
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
  const { currentAvatar, coins, addCoins, spendCoins } = useAvatarStore();
  const { add: addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'tournament' | 'leaderboard'>('tournament');
  const [tournamentFormat, setTournamentFormat] = useState(TOURNAMENT_FORMATS[0]);
  const [tournamentStage, setTournamentStage] = useState<'idle' | 'quarter' | 'semi' | 'final' | 'champion'>('idle');

  // Compute live RPG stats for player build
  const calculatedPlayerStats = calculateAvatarStats(currentAvatar);

  const [playerFighter, setPlayerFighter] = useState<Combatant>({
    id: 'player',
    name: currentAvatar.name,
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

  // 3D Battle Arena Animation States
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

  // Dynamic Damage-Dependent Healing Engine
  const damageSustained = Math.max(0, playerFighter.maxHp - playerFighter.hp);
  const isFairy = currentAvatar.species?.toLowerCase() === 'fairy';

  // Dynamic formula: Base 3.0s + (Damage Sustained / 100) * 1.2s. Fairies heal 40% faster.
  const calculateRecoveryTime = (damage: number) => {
    if (damage <= 0) return 0;
    const baseTime = 3.0 + (damage / 100) * 1.2;
    const finalTime = isFairy ? baseTime * 0.6 : baseTime;
    return Math.max(2.5, Math.round(finalTime * 10) / 10);
  };

  const [inCombatHealingRemaining, setInCombatHealingRemaining] = useState<number | null>(null);
  const [medbayTimeRemaining, setMedbayTimeRemaining] = useState<number>(0);
  const [isMedbayRegenerating, setIsMedbayRegenerating] = useState(false);

  // Fetch backend leaderboard
  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch('/api/leaderboard');
        const json = await res.json();
        if (json.success && json.data) {
          const apiLeaderboard: LeaderboardEntry[] = json.data.map((item: any) => ({
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
      name: currentAvatar.name,
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

    setTournamentStage(stage);
    setCurrentRoundNumber(1);
    setOverdriveEnergy(30);
    setPlayerAction('idle');
    setOpponentAction('idle');
    setActiveFx(null);

    // Launch dramatic VS screen first
    setShowVersusScreen(true);
    sound.playEquip();
  };

  const handleStartTournament = () => {
    const randomFmt = TOURNAMENT_FORMATS[Math.floor(Math.random() * TOURNAMENT_FORMATS.length)];
    setTournamentFormat(randomFmt);
    addToast(`Entering: ${randomFmt}`, 'info');
    startStageBattle('quarter');
  };

  // Execute interactive player choice
  const handlePlayerMove = (moveType: 'strike' | 'magic' | 'shield' | 'healing' | 'ultimate') => {
    if (isTurnAnimating || !opponentFighter || opponentFighter.hp <= 0 || playerFighter.hp <= 0) return;

    setIsTurnAnimating(true);

    // ─────────────────────────────────────────────────────────────
    // STEP 1: PLAYER ACTION
    // ─────────────────────────────────────────────────────────────
    if (moveType === 'shield') {
      // Defensive Barrier
      sound.playEquip();
      setPlayerAction('defend');
      setActiveFx('shield');
      setFxSource('player');

      const shieldHeal = Math.min(playerFighter.maxHp - playerFighter.hp, 80);
      const newPlayerHp = playerFighter.hp + shieldHeal;
      setPlayerFighter((prev) => ({ ...prev, hp: newPlayerHp, shieldActive: true }));
      addFloatingText(`+${shieldHeal} SHIELD`, 'player', false, '#38BDF8');

      const shieldLog: MatchLog = {
        turn: currentRoundNumber,
        attacker: playerFighter.name,
        action: 'AEGIS NANO-SHIELD',
        damage: 0,
        critical: false,
        message: `${playerFighter.name} deployed Aegis Nano-Shield! Gained barrier and 65% damage reduction.`,
      };
      setBattleLogs((prev) => [...prev, shieldLog]);
      setOverdriveEnergy((prev) => Math.min(100, prev + 20));

      // Opponent counters after 700ms
      setTimeout(() => {
        resolveOpponentTurn(true);
      }, 700);
      return;
    }

    if (moveType === 'healing') {
      const curSustained = playerFighter.maxHp - playerFighter.hp;
      if (curSustained <= 0) {
        addToast('Avatar chassis integrity is at 100%! No damage sustained.', 'info');
        setIsTurnAnimating(false);
        return;
      }

      // Dynamic healing duration directly dependent on damage sustained:
      // Base 3.0s + 1.2s per 100 damage (Fairies heal 40% faster!)
      const healTimeSec = calculateRecoveryTime(curSustained);
      setInCombatHealingRemaining(healTimeSec);
      setPlayerAction('healing');
      setActiveFx('healing');
      setFxSource('player');
      sound.playSweep();

      addToast(`Engaging Nanite Bio-Repair (${healTimeSec.toFixed(1)}s recovery duration based on ${curSustained} sustained damage)...`, 'info');

      const totalHeal = Math.min(curSustained, Math.round(curSustained * 0.75 + playerFighter.maxHp * 0.12));
      let remaining = healTimeSec;
      const step = 0.5;

      const healInterval = setInterval(() => {
        remaining = Math.max(0, remaining - step);
        setInCombatHealingRemaining(Math.round(remaining * 10) / 10);

        const tickHeal = Math.max(15, Math.round(totalHeal / (healTimeSec / step)));
        setPlayerFighter((prev) => ({
          ...prev,
          hp: Math.min(prev.maxHp, prev.hp + tickHeal),
        }));
        addFloatingText(`+${tickHeal} REPAIR`, 'player', false, '#10B981');

        if (remaining <= 0) {
          clearInterval(healInterval);
          setInCombatHealingRemaining(null);
          setPlayerAction('idle');
          setActiveFx(null);
          sound.playEquip();

          setBattleLogs((prev) => [
            ...prev,
            {
              turn: currentRoundNumber,
              attacker: playerFighter.name,
              action: 'NANITE BIO-REPAIR',
              damage: 0,
              critical: false,
              message: `${playerFighter.name} sustained ${curSustained} DMG and completed ${healTimeSec.toFixed(1)}s Nanite Repair, regenerating ${totalHeal} HP!`,
            },
          ]);

          setTimeout(() => {
            resolveOpponentTurn(false);
          }, 600);
        }
      }, 500);
      return;
    }

    // Offensive Move (strike, magic, ultimate)
    let baseDmg = 0;
    let isCrit = false;
    let actionLabel = 'ATTACK';
    let fxType: 'slash' | 'magic' | 'ultimate' = 'slash';

    if (moveType === 'strike') {
      sound.playSlash();
      fxType = 'slash';
      actionLabel = 'PHOTON STRIKE';
      isCrit = Math.random() * 100 < playerFighter.criticalRate;
      const raw = playerFighter.power * 2.2 - opponentFighter.defense * 0.7;
      baseDmg = Math.max(35, Math.round(isCrit ? raw * 1.6 : raw));
    } else if (moveType === 'magic') {
      sound.playSweep();
      fxType = 'magic';
      actionLabel = 'ELEMENTAL BLAST';
      isCrit = Math.random() * 100 < (playerFighter.criticalRate + 8);
      const raw = playerFighter.magic * 2.4 - opponentFighter.defense * 0.5;
      baseDmg = Math.max(45, Math.round(isCrit ? raw * 1.55 : raw));
    } else if (moveType === 'ultimate') {
      sound.playImpact();
      fxType = 'ultimate';
      actionLabel = 'SINGULARITY OVERDRIVE';
      isCrit = true;
      triggerShake();
      const raw = (playerFighter.power + playerFighter.magic) * 1.8;
      baseDmg = Math.max(90, Math.round(raw));
      setOverdriveEnergy(0);
    }

    // Trigger Attacker Animation
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

      if (moveType !== 'ultimate') {
        setOverdriveEnergy((prev) => Math.min(100, prev + 25));
      }

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

  // STEP 2: OPPONENT AI COUNTER-MOVE
  const resolveOpponentTurn = (playerWasShielding: boolean) => {
    if (!opponentFighter || opponentFighter.hp <= 0) {
      setIsTurnAnimating(false);
      return;
    }

    setPlayerAction('idle');
    setOpponentAction('attack');
    sound.playSlash();

    const isMagicMove = Math.random() > 0.5;
    const oppFx: 'slash' | 'magic' = isMagicMove ? 'magic' : 'slash';
    setActiveFx(oppFx);
    setFxSource('opponent');

    setTimeout(() => {
      sound.playImpact();
      setPlayerAction(playerWasShielding ? 'defend' : 'hit');

      // Check Player Evasion
      const playerEvaded = Math.random() * 100 < playerFighter.evasionRate;
      const isOppCrit = Math.random() * 100 < opponentFighter.criticalRate;

      let oppBase = (isMagicMove ? opponentFighter.magic : opponentFighter.power) * 2.0 - playerFighter.defense * 0.7;
      let oppDmg = Math.max(25, Math.round(isOppCrit ? oppBase * 1.5 : oppBase));

      if (playerWasShielding) {
        oppDmg = Math.round(oppDmg * 0.35); // 65% reduction!
      }

      if (playerEvaded) {
        oppDmg = 0;
        addFloatingText('DODGED!', 'player', false, '#34D399');
      } else {
        if (isOppCrit) triggerShake();
        addFloatingText(
          playerWasShielding ? `BLOCKED -${oppDmg}` : isOppCrit ? `-${oppDmg} CRIT!` : `-${oppDmg}`,
          'player',
          isOppCrit
        );
      }

      const newPlayerHp = Math.max(0, playerFighter.hp - oppDmg);
      setPlayerFighter((prev) => ({ ...prev, hp: newPlayerHp, shieldActive: false }));

      const counterLog: MatchLog = {
        turn: currentRoundNumber,
        attacker: opponentFighter.name,
        action: isMagicMove ? 'ARCANE SURGE' : 'COUNTER STRIKE',
        damage: oppDmg,
        critical: isOppCrit,
        message: playerEvaded
          ? `${playerFighter.name} agilely evaded ${opponentFighter.name}'s counterattack!`
          : playerWasShielding
          ? `Nano-Shield absorbed the impact! ${opponentFighter.name} struck for only ${oppDmg} mitigated damage.`
          : isOppCrit
          ? `CRITICAL COUNTER! ${opponentFighter.name} smashed for ${oppDmg} heavy damage!`
          : `${opponentFighter.name} retaliated with ${isMagicMove ? 'Arcane Surge' : 'Counter Strike'} for ${oppDmg} DMG.`,
      };

      setBattleLogs((prev) => [...prev, counterLog]);
      setCurrentRoundNumber((r) => r + 1);

      // Check Player Defeat
      if (newPlayerHp <= 0) {
        setPlayerAction('hit');
        setOpponentAction('victory');
        setBattleLogs((prev) => [
          ...prev,
          {
            turn: currentRoundNumber,
            attacker: 'ARENA REFEREE',
            action: 'DEFEAT',
            damage: 0,
            critical: false,
            message: `${playerFighter.name} was knocked out! Refit your avatar build in the Studio.`,
          },
        ]);
        addToast('Tournament eliminated! Refit your build in the Studio.', 'error');
        setIsTurnAnimating(false);
        return;
      }

      // Reset to idle
      setTimeout(() => {
        setPlayerAction('idle');
        setOpponentAction('idle');
        setActiveFx(null);
        setIsTurnAnimating(false);
      }, 400);
    }, 380);
  };

  // STEP 3: MATCH VICTORY & COIN REWARDS
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

  // Medbay Healing Protocol Handlers
  const handleStartMedbayRest = () => {
    if (damageSustained <= 0) {
      addToast('Avatar HP is already at 100% capacity!', 'info');
      return;
    }
    const recoverySec = calculateRecoveryTime(damageSustained);
    setMedbayTimeRemaining(recoverySec);
    setIsMedbayRegenerating(true);
    sound.playSweep();
    addToast(`Avatar entered Cyber Medbay. Regeneration time: ${recoverySec.toFixed(1)}s`, 'info');
  };

  const handleInstantMedbayRepair = () => {
    if (damageSustained <= 0) {
      addToast('Avatar is already fully repaired!', 'info');
      return;
    }
    if (coins < 25) {
      addToast('Insufficient Cyber Coins! Requires 25 Coins for Instant Nanite Stimpack.', 'error');
      return;
    }
    spendCoins(25);
    setPlayerFighter((prev) => ({ ...prev, hp: prev.maxHp }));
    setMedbayTimeRemaining(0);
    setIsMedbayRegenerating(false);
    sound.playEquip();
    addToast('⚡ Instant Nanite Stimpack injected! 100% HP restored instantly.', 'success');
  };

  // Medbay Live Timer Effect
  useEffect(() => {
    if (!isMedbayRegenerating || medbayTimeRemaining <= 0) return;
    const interval = setInterval(() => {
      setMedbayTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsMedbayRegenerating(false);
          setPlayerFighter((pf) => ({ ...pf, hp: pf.maxHp }));
          sound.playWin();
          addToast('💚 Medbay Regeneration Complete! Avatar 100% restored.', 'success');
          return 0;
        }
        setPlayerFighter((pf) => ({
          ...pf,
          hp: Math.min(pf.maxHp, pf.hp + Math.ceil(pf.maxHp / 8)),
        }));
        return Math.round((prev - 1) * 10) / 10;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isMedbayRegenerating, medbayTimeRemaining]);

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
                  <div className="text-[10px] font-mono text-white/40">
                    PWR: {opponentFighter.power} | DEF: {opponentFighter.defense}
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

              {/* Decluttered 5-Move Combat Deck */}
              <div className="glass-panel p-3.5 rounded-2xl border border-white/10 flex flex-col gap-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-xs">
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-[#00FF66]" />
                    <span className="font-black uppercase tracking-wider text-white">
                      Select Action
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-white/50">
                    {inCombatHealingRemaining !== null
                      ? `⏳ Nanite Repairing: ${inCombatHealingRemaining.toFixed(1)}s remaining...`
                      : isTurnAnimating
                      ? 'Resolving Combat Turn...'
                      : 'Ready for Command'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {/* Move 1: Weapon Strike */}
                  <button
                    onClick={() => handlePlayerMove('strike')}
                    disabled={isTurnAnimating || playerFighter.hp <= 0 || opponentFighter.hp <= 0}
                    className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:border-[#00FF66] hover:bg-[#00FF66]/10 text-left transition-all group disabled:opacity-40"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-black uppercase text-white group-hover:text-[#00FF66]">
                        Strike
                      </span>
                      <Swords size={14} className="text-[#00FF66]" />
                    </div>
                    <span className="text-[10px] font-mono text-[#00FF66] block">
                      {playerFighter.power} ATK &bull; 100% Hit
                    </span>
                  </button>

                  {/* Move 2: Magic Blast */}
                  <button
                    onClick={() => handlePlayerMove('magic')}
                    disabled={isTurnAnimating || playerFighter.hp <= 0 || opponentFighter.hp <= 0}
                    className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:border-violet-400 hover:bg-violet-600/10 text-left transition-all group disabled:opacity-40"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-black uppercase text-white group-hover:text-violet-300">
                        Blast
                      </span>
                      <Sparkles size={14} className="text-violet-400" />
                    </div>
                    <span className="text-[10px] font-mono text-violet-300 block">
                      {playerFighter.magic} MAG &bull; +8% Crit
                    </span>
                  </button>

                  {/* Move 3: Shield Guard */}
                  <button
                    onClick={() => handlePlayerMove('shield')}
                    disabled={isTurnAnimating || playerFighter.hp <= 0 || opponentFighter.hp <= 0}
                    className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:border-sky-400 hover:bg-sky-600/10 text-left transition-all group disabled:opacity-40"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-black uppercase text-white group-hover:text-sky-300">
                        Shield
                      </span>
                      <Shield size={14} className="text-sky-400" />
                    </div>
                    <span className="text-[10px] font-mono text-sky-300 block">
                      -65% Next Hit +80 HP
                    </span>
                  </button>

                  {/* Move 4: Nanite Bio-Repair (Damage Dependent Healing) */}
                  <button
                    onClick={() => handlePlayerMove('healing')}
                    disabled={isTurnAnimating || playerFighter.hp >= playerFighter.maxHp || opponentFighter.hp <= 0}
                    className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:border-emerald-400 hover:bg-emerald-600/10 text-left transition-all group disabled:opacity-40"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-black uppercase text-white group-hover:text-emerald-300">
                        Bio-Repair
                      </span>
                      <Heart size={14} className="text-emerald-400" />
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 block">
                      {damageSustained > 0
                        ? `Heal (~${calculateRecoveryTime(damageSustained).toFixed(1)}s)`
                        : 'Full HP (100%)'}
                    </span>
                  </button>

                  {/* Move 5: Singularity Overdrive */}
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
                      <span className="text-xs font-black uppercase text-white group-hover:text-amber-300">
                        Ultimate
                      </span>
                      <Flame size={14} className={overdriveEnergy >= 100 ? 'text-amber-400' : 'text-white/40'} />
                    </div>
                    <span className="text-[10px] font-mono text-amber-300 block">
                      {overdriveEnergy >= 100 ? '★ UNLEASH ★' : `${overdriveEnergy}% / 100%`}
                    </span>
                  </button>
                </div>
              </div>

              {/* Clean Medbay Recovery Hub (Displayed when damaged) */}
              {damageSustained > 0 && (
                <div className="glass-panel px-4 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <Heart size={16} className="text-emerald-400 animate-pulse" />
                    <div>
                      <span className="text-white font-bold">
                        Chassis Integrity: {playerFighter.hp}/{playerFighter.maxHp} HP{' '}
                        <span className="text-rose-400 font-mono">(-{damageSustained} DMG)</span>
                      </span>
                      <p className="text-[10px] font-mono text-white/50">
                        Required Medbay Regeneration Time: {calculateRecoveryTime(damageSustained).toFixed(1)}s
                        {isFairy && ' (Fairy Passive: -40% recovery time)'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleStartMedbayRest}
                      disabled={isMedbayRegenerating}
                      className="px-3 py-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[11px] font-mono uppercase transition-all"
                    >
                      {isMedbayRegenerating ? `Regen (${medbayTimeRemaining}s)` : 'Rest in Medbay'}
                    </button>
                    <button
                      onClick={handleInstantMedbayRepair}
                      className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-bold uppercase transition-all flex items-center gap-1"
                    >
                      <span>⚡ Instant Stimpack</span>
                      <span className="text-[10px] font-mono">(25 🪙)</span>
                    </button>
                  </div>
                </div>
              )}

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
