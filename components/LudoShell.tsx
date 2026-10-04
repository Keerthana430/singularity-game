use client;
// components/LudoShell.tsx — client-only shell for Ludo page
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

export default function LudoShell() {
  const currentAvatar = useAvatarStore((s) => s.currentAvatar);
  const addCoins = useAvatarStore((s) => s.addCoins);
  const { add: addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'board' | 'leaderboard' | 'rules'>('board');
  const [gameSpeed, setGameSpeed] = useState<'1x' | '2x' | 'instant'>('1x');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('isometric');
  const [winner, setWinner] = useState<any | null>(null);

  const [currentTurn, setCurrentTurn] = useState<'red' | 'green' | 'yellow' | 'blue'>('red');
  const [turnCount, setTurnCount] = useState<number>(3);
  const [matchSeconds, setMatchSeconds] = useState<number>(261);
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [canRoll, setCanRoll] = useState(true);
  const [selectablePieces, setSelectablePieces] = useState<number[]>([]);
  const [matchLogs, setMatchLogs] = useState<string[]>(['Welcome to Singularity Ludo 3D Colosseum! Roll a 6 to deploy your avatar onto the track.']);
  const [logOpen, setLogOpen] = useState(false);

  useEffect(() => {
    if (winner) return;
    const interval = setInterval(() => setMatchSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [winner]);

  const formattedTimer = useMemo(() => {
    const mins = Math.floor(matchSeconds / 60);
    const secs = matchSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [matchSeconds]);

  // Placeholder layout; main gameplay is in Ludo3DView
  return (
    <div className="min-h-screen bg-[#020502] text-white">
      <header className="p-4 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-sm uppercase">Exit</Link>
          <div className="font-mono">{formattedTimer}</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-12 gap-6">
        <section className="col-span-9 bg-gradient-to-b from-[#041006] to-[#000000] rounded-lg p-4">
          <Ludo3DView
            players={[] as any}
            onClash={() => {}}
            cameraPreset={cameraPreset}
            onWinner={(w: any) => setWinner(w)}
          />
        </section>
        <aside className="col-span-3 space-y-4">
          <div className="p-4 bg-black/30 rounded">Controls and HUD (placeholder)</div>
          <div className="p-4 bg-black/20 rounded">Leaderboard</div>
        </aside>
      </main>
    </div>
  );
}
