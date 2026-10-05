'use client';
// components/arena/RoundCountdownOverlay.tsx
// Cinematic 3... 2... 1... ENGAGE! Round Entrance Countdown Sequence.

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sound } from '@/lib/audio';

interface RoundCountdownOverlayProps {
  roundNumber: number;
  stageName: string;
  playerName: string;
  opponentName: string;
  onComplete: () => void;
}

export function RoundCountdownOverlay({
  roundNumber,
  stageName,
  playerName,
  opponentName,
  onComplete,
}: RoundCountdownOverlayProps) {
  const [step, setStep] = useState<'intro' | '3' | '2' | '1' | 'fight'>('intro');

  useEffect(() => {
    sound.playSweep();

    const t1 = setTimeout(() => {
      setStep('3');
      sound.playCountdownBeep(3);
    }, 900);

    const t2 = setTimeout(() => {
      setStep('2');
      sound.playCountdownBeep(2);
    }, 1700);

    const t3 = setTimeout(() => {
      setStep('1');
      sound.playCountdownBeep(1);
    }, 2500);

    const t4 = setTimeout(() => {
      setStep('fight');
      sound.playEngageHorn();
      sound.playImpact();
    }, 3300);

    const t5 = setTimeout(() => {
      onComplete();
    }, 4100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [onComplete]);

  return (
    <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center pointer-events-none select-none overflow-hidden">
      {/* Dynamic Background Scanning Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00FF66]/15 via-transparent to-transparent pointer-events-none" />

      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center text-center p-6"
          >
            <span className="px-3.5 py-1 rounded-full bg-[#00FF66]/20 border border-[#00FF66] text-[#00FF66] font-mono text-xs font-bold uppercase tracking-widest mb-3">
              {stageName}
            </span>
            <div className="flex items-center gap-4 text-3xl sm:text-4xl font-black uppercase text-white drop-shadow-lg">
              <span className="text-[#00FF66]">{playerName}</span>
              <span className="text-white/30 text-lg">VS</span>
              <span className="text-rose-400">{opponentName}</span>
            </div>
            <span className="text-xs font-mono text-white/50 tracking-widest mt-2 uppercase">
              SYNCHRONIZING NEURAL ARENA LINK...
            </span>
          </motion.div>
        )}

        {(step === '3' || step === '2' || step === '1') && (
          <motion.div
            key={step}
            initial={{ scale: 2.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'backOut' }}
            className="flex flex-col items-center justify-center"
          >
            <div className="w-32 h-32 rounded-full border-4 border-[#00FF66]/60 flex items-center justify-center bg-black/60 shadow-[0_0_50px_rgba(0,255,102,0.4)]">
              <span className="text-7xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-b from-white to-[#00FF66] drop-shadow-[0_0_20px_#00FF66]">
                {step}
              </span>
            </div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#00FF66] font-bold mt-4">
              READY FOR COMBAT
            </span>
          </motion.div>
        )}

        {step === 'fight' && (
          <motion.div
            key="fight"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [1.2, 1], opacity: 1 }}
            exit={{ scale: 1.4, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center"
          >
            <h1 className="text-6xl sm:text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-[#00FF66] drop-shadow-[0_0_35px_rgba(255,255,255,0.8)]">
              ENGAGE!
            </h1>
            <span className="text-xs font-mono uppercase tracking-widest text-white/70 font-bold mt-2">
              ROUND {roundNumber} // COMMENCE COMBAT
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
