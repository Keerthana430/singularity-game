// Victory screen — shown when GAME_WON fires, offers replay and main menu.
'use client';
import React, { CSSProperties, useEffect, useState } from 'react';
import { NeonButton, NeonPanel, EventCaption } from '../../components/NeonUI';
import { colors, fonts, radii } from '../../theme/tokens';
import { playerColors } from '../../theme/tokens';

interface VictoryScreenProps {
  winnerName: string;
  winnerIndex: number;
  players: Array<{ name: string; position: number }>;
  turnNumber: number;
  onReplay: () => void;
  onMainMenu: () => void;
}

export function VictoryScreen({ winnerName, winnerIndex, players, turnNumber, onReplay, onMainMenu }: VictoryScreenProps) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 200); return () => clearTimeout(t); }, []);

  const color = playerColors[winnerIndex] ?? colors.neonYellow;

  return (
    <div style={{ ...overlay, opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease' }}>
      <div style={gridBg} aria-hidden />

      <NeonPanel style={panel} glowColor={color}>
        {/* Crown / winner */}
        <div style={{ fontSize: 72, textAlign: 'center', lineHeight: 1 }} role="img" aria-label="Trophy">🏆</div>

        <EventCaption text="Victory!" color={color} />

        <p style={{ ...winnerText, color }}>
          {winnerName}
        </p>
        <p style={subText}>won in {turnNumber} turns</p>

        {/* Score table */}
        <div style={table}>
          {players.map((p, i) => (
            <div key={i} style={{ ...tableRow, borderColor: playerColors[i] ?? colors.border }}>
              <span style={{ ...dot, background: playerColors[i] ?? '#888' }} aria-hidden />
              <span style={pName}>{p.name}</span>
              <span style={pPos}>Tile {p.position}</span>
            </div>
          ))}
        </div>

        <div style={buttons}>
          <NeonButton id="victory-main-menu" variant="secondary" onClick={onMainMenu}>Main Menu</NeonButton>
          <NeonButton id="victory-replay" variant="primary" onClick={onReplay}>Play Again</NeonButton>
        </div>
      </NeonPanel>
    </div>
  );
}

/* ── Styles ── */
const overlay: CSSProperties = {
  position: 'fixed', inset: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(5,5,16,0.88)', backdropFilter: 'blur(8px)',
  zIndex: 200,
};
const gridBg: CSSProperties = {
  position: 'absolute', inset: 0, opacity: 0.05, pointerEvents: 'none',
  backgroundImage: `linear-gradient(rgba(0,100,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(0,100,255,0.5) 1px,transparent 1px)`,
  backgroundSize: '48px 48px',
};
const panel: CSSProperties = {
  padding: 'clamp(28px, 4vw, 52px)',
  width: 'clamp(300px, 90vw, 460px)',
  textAlign: 'center',
};
const winnerText: CSSProperties = {
  fontFamily: fonts.heading, fontSize: 'clamp(1.4rem, 5vw, 2rem)',
  fontWeight: 900, letterSpacing: '0.12em',
  margin: '8px 0 4px',
};
const subText: CSSProperties = {
  fontFamily: fonts.body, fontSize: '0.85rem',
  color: colors.textMuted, marginBottom: 24,
};
const table: CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 8,
  margin: '0 0 28px', textAlign: 'left',
};
const tableRow: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '8px 12px', borderRadius: radii.sm,
  border: '1px solid', background: 'rgba(255,255,255,0.03)',
};
const dot: CSSProperties = { width: 12, height: 12, borderRadius: '50%', flexShrink: 0 };
const pName: CSSProperties = { flex: 1, fontFamily: fonts.body, color: colors.text, fontSize: '0.9rem' };
const pPos: CSSProperties = { fontFamily: fonts.mono, color: colors.textMuted, fontSize: '0.8rem' };
const buttons: CSSProperties = { display: 'flex', gap: 12, justifyContent: 'center' };
