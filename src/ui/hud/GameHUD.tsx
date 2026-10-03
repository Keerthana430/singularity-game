// GameHUD — in-game overlay: turn indicator, dice result, event captions, player tile positions.
'use client';
import React, { CSSProperties, useEffect, useState } from 'react';
import { EventCaption } from '../components/NeonUI';
import { colors, fonts, radii, shadows, playerColors } from '../theme/tokens';
import { TurnPhase, PlayerState } from '../../state/gameState';
import { PlayerId } from '../../shared';
import { eventBus } from '../../core/eventBus';

interface GameHUDProps {
  players: PlayerState[];
  currentPlayerIndex: number;
  turnPhase: TurnPhase;
  lastDiceResult: number | null;
  winner: PlayerId | null;
  onRoll: () => void;
}

const PHASE_LABELS: Record<TurnPhase, string> = {
  'waiting':      'Roll the dice',
  'rolling':      'Rolling…',
  'moving':       'Moving…',
  'snake-event':  '🐍 Snake!',
  'ladder-event': '🪜 Ladder!',
  'finished':     '🏆 Game Over',
};

const CAPTION_EVENTS: Partial<Record<TurnPhase, string>> = {
  'snake-event':  '⚠ SNAKE!',
  'ladder-event': '✦ LADDER!',
};

const CAPTION_COLORS: Partial<Record<TurnPhase, string>> = {
  'snake-event':  colors.neonRed,
  'ladder-event': colors.neonGreen,
};

export function GameHUD({ players, currentPlayerIndex, turnPhase, lastDiceResult, winner, onRoll }: GameHUDProps) {
  const [captionText, setCaptionText] = useState<string | null>(null);

  // Show event captions briefly
  useEffect(() => {
    const caption = CAPTION_EVENTS[turnPhase];
    if (caption) {
      setCaptionText(caption);
      const t = setTimeout(() => setCaptionText(null), 2200);
      return () => clearTimeout(t);
    }
  }, [turnPhase]);

  if (winner) return null; // Victory screen handles its own display

  const active = players[currentPlayerIndex];
  const activeColor = playerColors[currentPlayerIndex] ?? colors.neonBlue;
  const canRoll = turnPhase === 'waiting';

  return (
    <>
      {/* ── Top-left: Turn indicator ── */}
      <div style={topLeft} aria-live="polite" aria-atomic="true">
        <div style={{ ...turnBadge, borderColor: activeColor, boxShadow: `0 0 12px ${activeColor}88` }}>
          <span style={{ ...playerDot, background: activeColor }} />
          <div>
            <div style={turnLabel}>TURN</div>
            <div style={{ ...turnName, color: activeColor }}>{active?.name ?? '—'}</div>
          </div>
        </div>
        <div style={phaseTag}>{PHASE_LABELS[turnPhase]}</div>
      </div>

      {/* ── Top-right: Dice result ── */}
      {lastDiceResult !== null && (
        <div style={topRight} aria-label={`Dice result: ${lastDiceResult}`}>
          <div style={diceBox}>
            <span style={dicePip}>⚄</span>
            <span style={diceValue}>{lastDiceResult}</span>
          </div>
        </div>
      )}

      {/* ── Center: Event caption ── */}
      {captionText && (
        <div style={captionWrapper} aria-live="assertive" aria-atomic="true">
          <EventCaption text={captionText} color={CAPTION_COLORS[turnPhase] ?? colors.neonYellow} />
        </div>
      )}

      {/* ── Bottom-center: Roll button ── */}
      <div style={bottomCenter}>
        <button
          id="hud-roll-button"
          onClick={onRoll}
          disabled={!canRoll}
          aria-label={canRoll ? `Roll dice for ${active?.name}` : 'Wait for animation'}
          style={{
            ...rollBtn,
            background: canRoll
              ? `radial-gradient(circle, ${activeColor} 0%, ${activeColor}88 100%)`
              : 'rgba(255,255,255,0.05)',
            boxShadow: canRoll ? `0 0 24px ${activeColor}, 0 0 48px ${activeColor}66` : 'none',
            cursor: canRoll ? 'pointer' : 'not-allowed',
            opacity: canRoll ? 1 : 0.35,
            transform: canRoll ? 'scale(1)' : 'scale(0.95)',
          }}
        >
          🎲
        </button>
        <div style={rollHint}>{canRoll ? 'TAP TO ROLL' : PHASE_LABELS[turnPhase].toUpperCase()}</div>
      </div>

      {/* ── Bottom-left: Player positions ── */}
      <div style={bottomLeft}>
        {players.map((p, i) => (
          <div
            key={p.id}
            style={{
              ...posRow,
              opacity: i === currentPlayerIndex ? 1 : 0.55,
              borderColor: playerColors[i] ?? colors.border,
            }}
            aria-label={`${p.name}: tile ${p.position}`}
          >
            <span style={{ ...posDot, background: playerColors[i] ?? '#888' }} />
            <span style={posName}>{p.name}</span>
            <span style={posTile}>{p.position}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Styles ── */
const topLeft: CSSProperties = {
  position: 'fixed', top: 20, left: 20,
  display: 'flex', flexDirection: 'column', gap: 8, zIndex: 50,
};
const turnBadge: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
  background: 'rgba(8,8,24,0.88)', backdropFilter: 'blur(12px)',
  border: '1px solid', borderRadius: radii.md,
};
const playerDot: CSSProperties = { width: 14, height: 14, borderRadius: '50%', flexShrink: 0 };
const turnLabel: CSSProperties = {
  fontFamily: fonts.body, fontSize: '0.65rem', letterSpacing: '0.2em',
  color: colors.textMuted, textTransform: 'uppercase',
};
const turnName: CSSProperties = {
  fontFamily: fonts.heading, fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.06em',
};
const phaseTag: CSSProperties = {
  fontFamily: fonts.mono, fontSize: '0.7rem', letterSpacing: '0.15em',
  color: colors.textMuted, paddingLeft: 4,
};
const topRight: CSSProperties = {
  position: 'fixed', top: 20, right: 20, zIndex: 50,
};
const diceBox: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px',
  background: 'rgba(8,8,24,0.88)', backdropFilter: 'blur(12px)',
  border: `1px solid ${colors.neonYellow}66`, borderRadius: radii.md,
  boxShadow: `0 0 12px ${colors.neonYellow}44`,
};
const dicePip: CSSProperties = { fontSize: '1.4rem' };
const diceValue: CSSProperties = {
  fontFamily: fonts.heading, fontSize: '1.8rem', fontWeight: 900,
  color: colors.neonYellow, textShadow: `0 0 12px ${colors.neonYellow}`,
};
const captionWrapper: CSSProperties = {
  position: 'fixed', top: '30%', left: 0, right: 0,
  display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 60,
};
const bottomCenter: CSSProperties = {
  position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 50,
};
const rollBtn: CSSProperties = {
  width: 80, height: 80, borderRadius: '50%',
  border: 'none', fontSize: '2rem',
  transition: 'all 0.2s ease',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const rollHint: CSSProperties = {
  fontFamily: fonts.heading, fontSize: '0.6rem', letterSpacing: '0.25em',
  color: colors.textMuted,
};
const bottomLeft: CSSProperties = {
  position: 'fixed', bottom: 20, left: 20,
  display: 'flex', flexDirection: 'column', gap: 4, zIndex: 50,
};
const posRow: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px',
  background: 'rgba(8,8,24,0.7)', backdropFilter: 'blur(8px)',
  border: '1px solid', borderRadius: radii.sm,
  transition: 'opacity 0.2s ease',
};
const posDot: CSSProperties = { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 };
const posName: CSSProperties = { fontFamily: fonts.body, fontSize: '0.75rem', color: colors.text, flex: 1 };
const posTile: CSSProperties = { fontFamily: fonts.mono, fontSize: '0.75rem', color: colors.textMuted, minWidth: 28, textAlign: 'right' };
