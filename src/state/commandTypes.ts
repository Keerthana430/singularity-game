import { PlayerId } from '../shared';

export type GameCommand =
  | { type: 'ROLL_DICE'; playerId: PlayerId }
  | { type: 'RESTART_GAME' }
  | { type: 'SKIP_ANIMATION' }
  | { type: 'START_GAME'; playerNames: string[] };
