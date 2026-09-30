'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#020502] text-white flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute -top-32 right-1/4 w-[500px] h-[500px] bg-red-500/8 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#00FF66]/6 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/40 mb-6">
          <AlertTriangle size={36} className="text-red-400" />
        </div>

        <h1
          className="text-6xl font-black text-red-400 mb-2"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          404
        </h1>
        <h2 className="text-lg font-black uppercase text-white mb-2 font-mono tracking-wider">
          SECTOR NOT FOUND
        </h2>
        <p className="text-xs font-mono text-white/50 mb-8 leading-relaxed">
          &gt; ERROR: The requested coordinate does not exist in this dimension.
          <br />
          &gt; The grid you're looking for may have been deleted, moved, or never existed.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 bg-[#00FF66] text-black font-black uppercase text-xs tracking-wider hover:bg-white transition-all"
          >
            <Home size={14} />
            <span>Return to Base</span>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-6 py-3 border border-white/20 text-white/70 font-bold uppercase text-xs tracking-wider hover:text-white hover:border-white/40 transition-all"
          >
            <ArrowLeft size={14} />
            <span>Go Back</span>
          </button>
        </div>

        <p className="text-[10px] font-mono text-white/20 mt-10 tracking-[0.3em]">
          // SINGULARITY_ERR_404 //
        </p>
      </motion.div>
    </div>
  );
}
