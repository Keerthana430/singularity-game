import { PlayerId, TileNumber, PlayerColor } from '../shared';

export type TurnPhase = 'waiting' | 'rolling' | 'moving' | 'snake-event' | 'ladder-event' | 'dueling' | 'finished';

export interface DuelState {
  attackerId: PlayerId;
  defenderId: PlayerId;
  tile: TileNumber;
}

export interface PlayerState {
  id: PlayerId;
  name: string;
  position: TileNumber;
  color: PlayerColor;
  isAi?: boolean;
}

export interface GameRules {
  exactFinish: boolean;
  extraTurnOnSix: boolean;
  maxPlayers: number;
}

export interface BoardConfig {
  size: number;
  snakes: Record<TileNumber, TileNumber>;
  ladders: Record<TileNumber, TileNumber>;
  rules: GameRules;
}

export interface GameState {
  boardConfig: BoardConfig;
  players: PlayerState[];
  currentPlayerIndex: number;
  turnPhase: TurnPhase;
  lastDiceResult: number | null;
  winner: PlayerId | null;
  turnNumber: number;
  rngState: number;
  commandLog: unknown[]; // To be typed precisely later
  activeDuel?: DuelState;
}
