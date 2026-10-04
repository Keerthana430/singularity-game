// components/ludo/constants.ts
export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export interface LudoPiece {
  id: number;
  color: PlayerColor;
  step: number; // -1 = Yard/Home Base, 0..51 = Track, 52..56 = Home Column, 57 = Goal
  hasShield?: boolean;
}

export interface LudoPlayer {
  id: PlayerColor;
  name: string;
  isAi: boolean;
  avatar?: any;
  pieces: LudoPiece[];
  colorHex: string;
  accentHex: string;
  bgHex: string;
  rank?: number;
}

export interface CyberTilePowerUp {
  index: number;
  type: 'boost' | 'shield' | 'warp';
  label: string;
  icon: string;
}

export const TRACK_COORDS: [number, number][] = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7],
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14],
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7],
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0],
  [6, 0],
];

export const START_TRACK_INDEX: Record<PlayerColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

export const HOME_COLUMNS: Record<PlayerColor, [number, number][]> = {
  red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
  blue: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
};

export const GOAL_COORD: [number, number] = [7, 7];

export const YARD_PODS: Record<PlayerColor, [number, number][]> = {
  red: [[1.5, 1.5], [1.5, 3.5], [3.5, 1.5], [3.5, 3.5]],
  green: [[1.5, 10.5], [1.5, 12.5], [3.5, 10.5], [3.5, 12.5]],
  yellow: [[10.5, 10.5], [10.5, 12.5], [12.5, 10.5], [12.5, 12.5]],
  blue: [[10.5, 1.5], [10.5, 3.5], [12.5, 1.5], [12.5, 3.5]],
};

export const SAFE_TRACK_INDICES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

export const CYBER_POWERUPS: CyberTilePowerUp[] = [
  { index: 4, type: 'boost', label: 'Overdrive Boost (+2)', icon: '⚡' },
  { index: 17, type: 'shield', label: 'Quantum Shield', icon: '🛡️' },
  { index: 30, type: 'warp', label: 'Cyber Warp (+4)', icon: '🌀' },
  { index: 43, type: 'boost', label: 'Overdrive Boost (+2)', icon: '⚡' },
];
