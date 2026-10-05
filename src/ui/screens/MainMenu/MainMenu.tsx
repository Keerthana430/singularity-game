// MainMenu screen — entry point of the game flow.
'use client';
import React, { CSSProperties } from 'react';
import { NeonButton, NeonPanel } from '../../components/NeonUI';
import { colors, fonts, shadows } from '../../theme/tokens';

interface MainMenuProps {
  onStart: () => void;
}

export function MainMenu({ onStart }: MainMenuProps) {
  return (
    <div style={overlay}>
      {/* Background grid lines for cyber effect */}
      <div style={gridBg} aria-hidden />

      <NeonPanel style={panel} glowColor={colors.neonCyan}>
        {/* Game logo / title */}
        <div style={logoWrap}>
          <h1 style={logoTop} aria-label="Snakes and Ladders">SNAKES</h1>
          <div style={logoDivider} />
          <h1 style={logoBottom}>&amp; LADDERS</h1>
          <p style={logoSub}>3D ARCADE EDITION</p>
        </div>

        <div style={buttonGroup}>
          <NeonButton
            id="main-menu-play"
            variant="primary"
            fullWidth
            onClick={onStart}
            style={{ fontSize: '1.1rem', padding: '16px' }}
          >
            ▶ &nbsp; Play 100-Tile Matrix
          </NeonButton>

          <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '8px' }}>
            <a
              href="/snakes"
              style={{ textDecoration: 'none', flex: 1 }}
            >
              <NeonButton
                variant="secondary"
                fullWidth
                style={{ fontSize: '0.82rem', padding: '10px 14px' }}
              >
                ⌂ 40-Tier Ascent
              </NeonButton>
            </a>
            <a
              href="/character-prototype/index.html"
              style={{ textDecoration: 'none', flex: 1 }}
            >
              <NeonButton
                variant="danger"
                fullWidth
                style={{ fontSize: '0.82rem', padding: '10px 14px' }}
              >
                ⚔ Combat Dojo
              </NeonButton>
            </a>
          </div>
        </div>

        <p style={version}>v0.7.0 – Phase 7 Arcade</p>
      </NeonPanel>
    </div>
  );
}

/* ── Styles ── */
const overlay: CSSProperties = {
  position: 'fixed', inset: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'radial-gradient(ellipse at 50% 40%, #0a0a2a 0%, #050510 100%)',
  zIndex: 100,
};

const gridBg: CSSProperties = {
  position: 'absolute', inset: 0, opacity: 0.08,
  backgroundImage: `
    linear-gradient(rgba(0,100,255,0.5) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,100,255,0.5) 1px, transparent 1px)
  `,
  backgroundSize: '48px 48px',
  pointerEvents: 'none',
};

const panel: CSSProperties = {
  position: 'relative',
  padding: 'clamp(32px, 5vw, 64px)',
  width: 'clamp(300px, 90vw, 420px)',
  textAlign: 'center',
};

const logoWrap: CSSProperties = { marginBottom: 40 };

const logoTop: CSSProperties = {
  margin: 0,
  fontFamily: fonts.heading,
  fontSize: 'clamp(2rem, 8vw, 3.5rem)',
  fontWeight: 900,
  letterSpacing: '0.15em',
  color: colors.neonRed,
  textShadow: `0 0 20px ${colors.neonRed}, 0 0 40px ${colors.neonRed}88`,
};

const logoDivider: CSSProperties = {
  height: 2, margin: '10px auto',
  background: `linear-gradient(90deg, transparent, ${colors.neonCyan}, transparent)`,
  boxShadow: shadows.neonCyan,
};

const logoBottom: CSSProperties = {
  margin: 0,
  fontFamily: fonts.heading,
  fontSize: 'clamp(1.6rem, 6vw, 2.8rem)',
  fontWeight: 900,
  letterSpacing: '0.12em',
  color: colors.neonCyan,
  textShadow: `0 0 20px ${colors.neonCyan}, 0 0 40px ${colors.neonCyan}88`,
};

const logoSub: CSSProperties = {
  marginTop: 8,
  fontFamily: fonts.body,
  fontSize: '0.75rem',
  letterSpacing: '0.3em',
  color: colors.textMuted,
};

const buttonGroup: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12 };

const version: CSSProperties = {
  marginTop: 32, fontFamily: fonts.mono,
  fontSize: '0.65rem', color: colors.textDim, letterSpacing: '0.2em',
};
