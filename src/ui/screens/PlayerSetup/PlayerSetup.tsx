// PlayerSetup screen — choose 2-4 players with names and preview colors.
'use client';
import React, { CSSProperties, useState } from 'react';
import { NeonButton, NeonPanel } from '../../components/NeonUI';
import { colors, fonts, radii } from '../../theme/tokens';
import { playerColors } from '../../theme/tokens';

export interface PlayerSetupData {
  playerNames: string[];
}

interface PlayerSetupProps {
  onConfirm: (data: PlayerSetupData) => void;
  onBack: () => void;
}

const DEFAULT_NAMES = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];

export function PlayerSetup({ onConfirm, onBack }: PlayerSetupProps) {
  const [count, setCount] = useState(2);
  const [names, setNames] = useState<string[]>(DEFAULT_NAMES.slice());

  const updateName = (i: number, val: string) => {
    const n = [...names];
    n[i] = val.slice(0, 16);
    setNames(n);
  };

  const handleStart = () => {
    const filled = names.slice(0, count).map((n, i) => n.trim() || DEFAULT_NAMES[i]);
    onConfirm({ playerNames: filled });
  };

  return (
    <div style={overlay}>
      <div style={gridBg} aria-hidden />
      <NeonPanel style={panel} glowColor={colors.neonMagenta}>
        <h2 style={heading}>SELECT PLAYERS</h2>

        {/* Player count stepper */}
        <div style={stepperRow}>
          <span style={stepperLabel}>Number of Players</span>
          <div style={stepperCtrl}>
            <button style={stepBtn} aria-label="Decrease" onClick={() => setCount(c => Math.max(2, c - 1))}>−</button>
            <span style={stepCount}>{count}</span>
            <button style={stepBtn} aria-label="Increase" onClick={() => setCount(c => Math.min(4, c + 1))}>+</button>
          </div>
        </div>

        {/* Player name inputs */}
        <div style={playersGrid}>
          {Array.from({ length: count }, (_, i) => (
            <div key={i} style={playerRow}>
              <span style={{ ...playerSwatch, background: playerColors[i], boxShadow: `0 0 10px ${playerColors[i]}` }} aria-hidden />
              <input
                id={`player-name-${i}`}
                type="text"
                maxLength={16}
                value={names[i]}
                onChange={e => updateName(i, e.target.value)}
                style={{ ...nameInput, borderColor: playerColors[i] }}
                aria-label={`Player ${i + 1} name`}
                placeholder={DEFAULT_NAMES[i]}
              />
            </div>
          ))}
        </div>

        <div style={buttons}>
          <NeonButton id="setup-back" variant="secondary" onClick={onBack}>← Back</NeonButton>
          <NeonButton id="setup-start" variant="primary" onClick={handleStart}>Start Game →</NeonButton>
        </div>
      </NeonPanel>
    </div>
  );
}

/* ── Styles ── */
const overlay: CSSProperties = {
  position: 'fixed', inset: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(3, 4, 14, 0.96)',
  backdropFilter: 'blur(28px)',
  WebkitBackdropFilter: 'blur(28px)',
  zIndex: 99999,
};
const gridBg: CSSProperties = {
  position: 'absolute', inset: 0, opacity: 0.06, pointerEvents: 'none',
  backgroundImage: `linear-gradient(rgba(0,100,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(0,100,255,0.5) 1px,transparent 1px)`,
  backgroundSize: '48px 48px',
};
const panel: CSSProperties = {
  padding: 'clamp(28px, 4vw, 44px)',
  width: 'clamp(320px, 92vw, 480px)',
  background: 'linear-gradient(180deg, rgba(14, 18, 38, 0.98) 0%, rgba(6, 8, 20, 0.99) 100%)',
  border: '1px solid rgba(255, 0, 204, 0.4)',
  borderRadius: '24px',
  boxShadow: '0 0 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(255, 0, 204, 0.25)',
  zIndex: 100000,
};
const heading: CSSProperties = {
  margin: '0 0 28px',
  fontFamily: fonts.heading, fontSize: 'clamp(1.2rem, 4vw, 1.6rem)',
  fontWeight: 900, letterSpacing: '0.2em',
  color: colors.neonMagenta, textShadow: `0 0 16px ${colors.neonMagenta}`,
  textAlign: 'center',
};
const stepperRow: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  marginBottom: 24, padding: '12px 16px',
  background: 'rgba(255,255,255,0.04)', borderRadius: radii.md,
  border: `1px solid ${colors.border}`,
};
const stepperLabel: CSSProperties = {
  fontFamily: fonts.body, fontSize: '0.85rem',
  color: colors.text, letterSpacing: '0.06em',
};
const stepperCtrl: CSSProperties = { display: 'flex', alignItems: 'center', gap: 16 };
const stepBtn: CSSProperties = {
  width: 36, height: 36, borderRadius: '50%',
  background: 'rgba(0,85,255,0.3)', border: `1px solid ${colors.borderNeon}`,
  color: colors.neonCyan, fontSize: '1.2rem', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 0.15s ease',
};
const stepCount: CSSProperties = {
  fontFamily: fonts.heading, fontSize: '1.4rem', fontWeight: 700,
  color: colors.white, minWidth: 24, textAlign: 'center',
};
const playersGrid: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 };
const playerRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12 };
const playerSwatch: CSSProperties = {
  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
};
const nameInput: CSSProperties = {
  flex: 1, padding: '10px 14px',
  background: 'rgba(255,255,255,0.05)', borderRadius: radii.sm,
  border: `1px solid`,
  color: colors.text, fontFamily: fonts.body, fontSize: '0.95rem',
  outline: 'none',
};
const buttons: CSSProperties = { display: 'flex', gap: 12, justifyContent: 'flex-end' };
