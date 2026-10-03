// Design tokens for the neon arcade UI theme — all UI components import from here.
export const colors = {
  bg:          '#050510',
  bgPanel:     'rgba(8, 8, 24, 0.92)',
  bgPanelHover:'rgba(12, 12, 36, 0.95)',
  border:      '#1a1a4a',
  borderNeon:  '#0055ff',
  neonBlue:    '#00aaff',
  neonCyan:    '#00ffee',
  neonMagenta: '#ff00cc',
  neonGreen:   '#00ff88',
  neonRed:     '#ff2244',
  neonYellow:  '#ffdd00',
  text:        '#e0e8ff',
  textMuted:   '#6070a0',
  textDim:     '#303050',
  white:       '#ffffff',
} as const;

export const fonts = {
  heading: "'Orbitron', 'Segoe UI', monospace",
  body:    "'Rajdhani', 'Segoe UI', sans-serif",
  mono:    "'Share Tech Mono', monospace",
} as const;

export const radii = {
  sm:  '4px',
  md:  '8px',
  lg:  '12px',
  pill:'999px',
} as const;

export const shadows = {
  neonBlue:    '0 0 12px #0055ff, 0 0 24px rgba(0,85,255,0.4)',
  neonCyan:    '0 0 12px #00ffee, 0 0 24px rgba(0,255,238,0.3)',
  neonMagenta: '0 0 12px #ff00cc, 0 0 24px rgba(255,0,204,0.3)',
  panel:       '0 8px 32px rgba(0,0,0,0.7)',
} as const;

export const transitions = {
  fast:   'all 0.15s ease',
  normal: 'all 0.25s ease',
  slow:   'all 0.4s ease',
} as const;

// Ordered player identity palette (color per player slot)
export const playerColors = ['#ff4488', '#00ccff', '#44ff88', '#ffaa00'] as const;
export type PlayerColorTuple = typeof playerColors;
