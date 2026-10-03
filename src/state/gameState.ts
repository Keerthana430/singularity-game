import { PlayerId, TileNumber, PlayerColor } from '../shared';

export type TurnPhase = 'waiting' | 'rolling' | 'moving' | 'snake-event' | 'ladder-event' | 'finished';

export interface PlayerState {
  id: PlayerId;
  name: string;
  position: TileNumber;
  color: PlayerColor;
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
  commandLog: any[]; // To be typed precisely later
}
