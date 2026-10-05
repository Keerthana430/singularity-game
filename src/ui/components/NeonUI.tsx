// Reusable UI primitives — NeonButton, NeonPanel, EventCaption.
import React, { CSSProperties, ButtonHTMLAttributes, ReactNode } from 'react';
import { colors, fonts, radii, shadows, transitions } from '../theme/tokens';

/* ── NeonButton ── */
interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  fullWidth?: boolean;
}

const variantStyles: Record<NonNullable<NeonButtonProps['variant']>, CSSProperties> = {
  primary:   { background: 'linear-gradient(135deg, #003399 0%, #0055ff 100%)', boxShadow: shadows.neonBlue },
  secondary: { background: 'linear-gradient(135deg, #1a0033 0%, #440099 100%)', boxShadow: shadows.neonMagenta },
  danger:    { background: 'linear-gradient(135deg, #330011 0%, #880033 100%)', boxShadow: '0 0 12px #ff2244' },
};

export function NeonButton({ variant = 'primary', fullWidth, children, style, disabled, ...rest }: NeonButtonProps) {
  const base: CSSProperties = {
    fontFamily: fonts.heading,
    fontSize: '0.9rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: colors.white,
    border: `1px solid rgba(255,255,255,0.15)`,
    borderRadius: radii.sm,
    padding: '12px 28px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: transitions.fast,
    width: fullWidth ? '100%' : undefined,
    opacity: disabled ? 0.4 : 1,
    userSelect: 'none',
    ...variantStyles[variant],
    ...style,
  };
  return (
    <button 
      {...rest} 
      disabled={disabled} 
      style={base}
      onMouseEnter={e => { 
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.25)'; 
          import('../../audio').then(m => m.getAudioEngine().play('ui_hover'));
        }
      }}
      onMouseLeave={e => { 
        (e.currentTarget as HTMLButtonElement).style.filter = ''; 
      }}
      onClick={e => {
        if (!disabled) {
          import('../../audio').then(m => m.getAudioEngine().play('ui_click'));
          if (rest.onClick) rest.onClick(e);
        }
      }}
    >
      {children}
    </button>
  );
}

/* ── NeonPanel ── */
interface NeonPanelProps { children: ReactNode; style?: CSSProperties; glowColor?: string; }

export function NeonPanel({ children, style, glowColor = colors.borderNeon }: NeonPanelProps) {
  return (
    <div style={{
      background: colors.bgPanel,
      border: `1px solid ${glowColor}`,
      borderRadius: radii.lg,
      boxShadow: `0 0 18px ${glowColor}55, ${shadows.panel}`,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ── EventCaption ── */
interface EventCaptionProps { text: string; color?: string; }

export function EventCaption({ text, color = colors.neonYellow }: EventCaptionProps) {
  return (
    <div style={{
      fontFamily: fonts.heading,
      fontSize: 'clamp(1rem, 4vw, 1.6rem)',
      fontWeight: 900,
      color,
      textShadow: `0 0 12px ${color}, 0 0 24px ${color}88`,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      textAlign: 'center',
      animation: 'neonPulse 0.5s ease-in-out 3',
      pointerEvents: 'none',
    }}>
      {text}
    </div>
  );
}
