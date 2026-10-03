'use client';
// components/retro/RetroComponents.tsx
// Reusable Retro-Anime UI Component Library for SINGULARITY.
// Features mechanical angular panels, CRT displays, tactile holo-buttons, and anime telemetry.

import React from 'react';
import { motion } from 'framer-motion';
import { sound } from '@/lib/audio';
import { LucideIcon } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════
   1. RETRO PANEL: Angular Mechanical Chassis with JIS/MIL-STD Tags
   ═══════════════════════════════════════════════════════════════════ */
export interface RetroPanelProps {
  children: React.ReactNode;
  title?: string;
  tag?: string;
  japaneseTag?: string;
  variant?: 'default' | 'brand' | 'danger' | 'crt';
  className?: string;
}

export function RetroPanel({
  children,
  title,
  tag,
  japaneseTag,
  variant = 'default',
  className = '',
}: RetroPanelProps) {
  const borderColors = {
    default: 'border-white/15 bg-[#0D1310]/85',
    brand: 'border-[#00FF66]/40 bg-[#07170E]/85 shadow-[0_0_20px_rgba(0,255,102,0.12)]',
    danger: 'border-[#FF2233]/40 bg-[#170709]/85 shadow-[0_0_20px_rgba(255,34,51,0.12)]',
    crt: 'border-cyan-500/30 bg-[#040806]/95 shadow-[inset_0_0_25px_rgba(0,0,0,0.8)]',
  };

  return (
    <div
      className={`relative rounded-xl border p-4 backdrop-blur-md transition-all ${borderColors[variant]} ${className}`}
      style={{
        clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
      }}
    >
      {/* Hairline Technical Corner Accents */}
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white/40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white/40 pointer-events-none" />

      {/* Header telemetry strip */}
      {(title || tag || japaneseTag) && (
        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse" />
            {title && (
              <span className="text-xs font-black uppercase tracking-wider text-white" style={{ fontFamily: 'var(--font-display)' }}>
                {title}
              </span>
            )}
            {japaneseTag && (
              <span className="text-[10px] text-white/40 font-jp" style={{ fontFamily: 'var(--font-jp)' }}>
                {japaneseTag}
              </span>
            )}
          </div>
          {tag && (
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/60 tracking-widest">
              {tag}
            </span>
          )}
        </div>
      )}

      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   2. CRT DISPLAY: Scanlines, Screen Vignette & Phosphor Glow
   ═══════════════════════════════════════════════════════════════════ */
export function CRTDisplay({
  children,
  className = '',
  statusLabel = 'ONLINE',
}: {
  children: React.ReactNode;
  className?: string;
  statusLabel?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-xl border border-white/10 bg-[#050906] p-3 shadow-[inset_0_0_30px_rgba(0,0,0,0.85)] ${className}`}>
      {/* Horizontal subtle scanline overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-30"
        style={{
          background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.45) 50%)',
          backgroundSize: '100% 4px',
        }}
      />
      {/* Top Telemetry Header */}
      <div className="relative z-20 flex items-center justify-between text-[10px] font-mono text-white/40 pb-2 border-b border-white/5">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] shadow-[0_0_6px_#00FF66]" />
          <span className="text-[#00FF66] font-bold tracking-widest uppercase">CRT-MONITOR // {statusLabel}</span>
        </div>
        <span className="tracking-widest">REC ● 60FPS</span>
      </div>
      <div className="relative z-20 pt-2">{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   3. HOLO BUTTON: Chunky Tactile Arcade Button with Micro-Press
   ═══════════════════════════════════════════════════════════════════ */
export interface HoloButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'cyan' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  loading?: boolean;
}

export function HoloButton({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  disabled,
  onClick,
  className = '',
  ...rest
}: HoloButtonProps) {
  const variantStyles = {
    primary:
      'bg-[#00FF66] text-black hover:bg-[#39FF14] shadow-[0_0_18px_rgba(0,255,102,0.4)] border-transparent font-black',
    secondary:
      'bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border-white/15 hover:border-white/30 font-bold',
    danger:
      'bg-[#FF2233] text-white hover:bg-[#FF3344] shadow-[0_0_18px_rgba(255,34,51,0.4)] border-transparent font-black',
    cyan:
      'bg-[#00E5FF] text-black hover:bg-cyan-300 shadow-[0_0_18px_rgba(0,229,255,0.4)] border-transparent font-black',
    gold:
      'bg-[#FFD600] text-black hover:bg-yellow-300 shadow-[0_0_18px_rgba(255,214,0,0.4)] border-transparent font-black',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-xs sm:text-sm',
    lg: 'px-8 py-3.5 text-sm sm:text-base tracking-[0.2em]',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1.0 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1.0 : 0.96 }}
      onClick={(e) => {
        sound.playClick();
        if (onClick) onClick(e);
      }}
      disabled={disabled || loading}
      className={`relative inline-flex items-center justify-center gap-2 rounded-lg border font-mono uppercase tracking-wider transition-colors disabled:opacity-40 disabled:pointer-events-none select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...(rest as any)}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        Icon && <Icon size={size === 'lg' ? 16 : 14} />
      )}
      <span>{children}</span>
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   4. STAT DISPLAY: Segmented Anime Telemetry Readout
   ═══════════════════════════════════════════════════════════════════ */
export function StatDisplay({
  label,
  value,
  max = 100,
  color = '#00FF66',
  unit = '',
}: {
  label: string;
  value: number;
  max?: number;
  color?: string;
  unit?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="flex flex-col gap-1 font-mono">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-white/50 uppercase tracking-widest font-bold">{label}</span>
        <span className="font-bold" style={{ color }}>
          {value}
          {unit}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-black/60 overflow-hidden border border-white/10">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   5. CYBER TYPOGRAPHY: Header with Japanese Telemetry Annotation
   ═══════════════════════════════════════════════════════════════════ */
export function CyberTypography({
  title,
  subTitle,
  japanese,
  badge,
}: {
  title: string;
  subTitle?: string;
  japanese?: string;
  badge?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {badge && (
          <span className="px-1.5 py-0.5 rounded bg-[#00FF66]/15 border border-[#00FF66]/40 text-[#00FF66] font-mono text-[9px] uppercase font-bold tracking-widest">
            {badge}
          </span>
        )}
        {japanese && (
          <span className="text-[10px] text-white/40 tracking-widest font-jp" style={{ fontFamily: 'var(--font-jp)' }}>
            // {japanese}
          </span>
        )}
      </div>
      <h2
        className="text-xl sm:text-2xl lg:text-3xl font-black uppercase text-white tracking-wider"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h2>
      {subTitle && <p className="text-xs text-white/60 font-mono">{subTitle}</p>}
    </div>
  );
}
