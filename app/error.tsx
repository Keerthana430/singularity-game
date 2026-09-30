'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('Runtime system exception:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#020502] text-white flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-lg p-8 rounded-2xl bg-black/60 border border-red-500/30 backdrop-blur-xl relative"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/15 border border-red-500/50 mb-6">
          <AlertOctagon size={40} className="text-red-400 animate-pulse" />
        </div>

        <h1
          className="text-4xl sm:text-5xl font-black text-red-400 mb-2"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          SYSTEM CORRUPT
        </h1>
        <h2 className="text-sm font-black uppercase text-white/80 mb-3 font-mono tracking-wider">
          CRITICAL RUNTIME ANOMALY DETECTED
        </h2>
        
        <p className="text-xs font-mono text-white/60 mb-4 leading-relaxed">
          &gt; ERROR: {error.message || 'An unexpected core subsystem failure occurred.'}
        </p>

        {error.digest && (
          <p className="text-[10px] font-mono text-white/40 mb-6 bg-white/5 py-1 px-3 rounded border border-white/10 inline-block">
            DIGEST: {error.digest}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white font-black uppercase text-xs tracking-wider hover:bg-red-400 transition-all rounded"
          >
            <RotateCcw size={14} />
            <span>Reboot Neural Core</span>
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 border border-white/20 text-white/80 font-bold uppercase text-xs tracking-wider hover:text-white hover:border-[#00FF66] transition-all rounded"
          >
            <Home size={14} />
            <span>Return to Base</span>
          </Link>
        </div>

        <p className="text-[10px] font-mono text-white/25 mt-8 tracking-[0.3em]">
          // SINGULARITY_SYS_PANIC //
        </p>
      </motion.div>
    </div>
  );
}
