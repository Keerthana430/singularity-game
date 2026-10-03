import { PlayerId, TileNumber } from '../shared';

export type GameEvent =
  | { type: 'DICE_ROLLED'; playerId: PlayerId; value: number }
  | { type: 'PLAYER_MOVE_START'; playerId: PlayerId; from: TileNumber; to: TileNumber }
  | { type: 'PLAYER_MOVED_STEP'; playerId: PlayerId; tile: TileNumber }
  | { type: 'LANDED_ON_SNAKE'; playerId: PlayerId; from: TileNumber; to: TileNumber }
  | { type: 'LANDED_ON_LADDER'; playerId: PlayerId; from: TileNumber; to: TileNumber }
  | { type: 'TURN_ENDED'; nextPlayerId: PlayerId }
  | { type: 'GAME_WON'; playerId: PlayerId }
  | { type: 'OVERSHOOT'; playerId: PlayerId; attempted: TileNumber; stayAt: TileNumber };
