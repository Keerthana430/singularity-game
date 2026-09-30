'use client';

import React, { useState, useEffect } from 'react';
import { Monitor, X, Check } from 'lucide-react';

export function DeviceNoticeBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    const hasDismissed = sessionStorage.getItem('singularity_mobile_notice_dismissed');
    if (hasDismissed) return;

    // Strict mobile detection: Must have mobile user agent AND touch capability AND small screen width
    const userAgent = (navigator.userAgent || navigator.vendor || '').toLowerCase();
    const isMobileUA = /android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const hasTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 1);
    const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 768;

    // Only trigger if actually on a real mobile phone, never on desktop PCs
    if (isMobileUA && hasTouch && isSmallScreen) {
      const timer = setTimeout(() => setShowBanner(true), 150);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('singularity_mobile_notice_dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-[#050B07]/95 border-2 border-[#00FF66]/50 rounded-2xl p-4 shadow-[0_0_30px_rgba(0,255,102,0.25)] backdrop-blur-xl text-white">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00FF66]/15 border border-[#00FF66]/40 flex items-center justify-center flex-shrink-0 text-[#00FF66]">
            <Monitor size={18} className="animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00FF66]">
                DEVICE RECOMMENDATION
              </span>
              <button
                onClick={handleDismiss}
                className="text-white/40 hover:text-white transition-colors p-1"
                aria-label="Dismiss notice"
              >
                <X size={15} />
              </button>
            </div>

            <h4 className="text-sm font-black uppercase text-white tracking-wide mt-0.5" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              Better on PC / Desktop
            </h4>

            <p className="text-xs text-white/70 mt-1 leading-relaxed">
              For high-fidelity 3D graphics, smooth real-time battle animations, and fluid customization controls, <strong className="text-white font-semibold">please utilize your PC or desktop browser</strong>.
            </p>

            <div className="mt-3 flex items-center justify-end">
              <button
                onClick={handleDismiss}
                className="py-1.5 px-4 rounded-lg bg-[#00FF66] text-black text-[11px] font-black uppercase tracking-wider hover:bg-[#39FF14] transition-all shadow-[0_0_10px_rgba(0,255,102,0.3)] flex items-center gap-1.5"
              >
                <Check size={13} />
                <span>Got It</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
