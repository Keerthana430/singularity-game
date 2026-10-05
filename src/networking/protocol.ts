import { GameCommand, GameState } from '../state';
import { serializeState } from '../state/serialization';

// Simple deterministic string hashing (DJB2)
export function hashState(state: GameState): string {
  const str = serializeState(state);
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
  }
  return hash.toString(16);
}

export interface ClientCommandMessage {
  type: 'CLIENT_COMMAND';
  clientId: string;
  command: GameCommand;
}

export interface ServerSyncMessage {
  type: 'SERVER_SYNC';
  sequenceNumber: number;
  command: GameCommand;
  stateHash: string; // Deterministic hash of the game state AFTER this command was applied on the server
}

export interface StateSnapshotMessage {
  type: 'STATE_SNAPSHOT';
  sequenceNumber: number;
  state: GameState;
}

export type NetworkProtocolMessage = 
  | ClientCommandMessage
  | ServerSyncMessage
  | StateSnapshotMessage;
