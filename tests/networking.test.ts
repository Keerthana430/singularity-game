import { describe, it, expect } from 'vitest';
import { GameState, GameCommand } from '../src/state';
import { gameReducer, createStandardBoard } from '../src/rules';
import { hashState, ServerSyncMessage } from '../src/networking/protocol';

/**
 * Mock Authoritative Server
 */
class MockServer {
  public state: GameState;
  public sequenceNumber = 0;
  private clients: MockClient[] = [];

  constructor(seed: number) {
    this.state = {
      players: [],
      currentPlayerIndex: 0,
      turnPhase: 'waiting',
      boardConfig: createStandardBoard(),
      turnNumber: 1,
      winner: null,
      rngState: seed,
      lastDiceResult: null,
      commandLog: [],
    };
    // Initialize standard state
    const { newState } = gameReducer(this.state, { type: 'START_GAME', playerNames: ['P1', 'P2'] });
    newState.rngState = seed;
    this.state = newState;
  }

  registerClient(client: MockClient) {
    this.clients.push(client);
    // Send full snapshot on join
    client.onSnapshot(this.state, this.sequenceNumber);
  }

  receiveCommand(command: GameCommand) {
    // 1. Authoritatively apply command
    const { newState } = gameReducer(this.state, command);
    this.state = newState;
    this.sequenceNumber++;

    // 2. Broadcast authoritative outcome to all clients
    const syncMsg: ServerSyncMessage = {
      type: 'SERVER_SYNC',
      sequenceNumber: this.sequenceNumber,
      command: command,
      stateHash: hashState(this.state),
    };

    for (const client of this.clients) {
      // Simulate network delay optionally, but synchronous for simple test
      client.onSync(syncMsg);
    }
  }
}

/**
 * Mock Networked Client
 */
class MockClient {
  public state!: GameState;
  public sequenceNumber = 0;
  public outOfSync = false;

  onSnapshot(state: GameState, seq: number) {
    this.state = JSON.parse(JSON.stringify(state));
    this.sequenceNumber = seq;
  }

  onSync(msg: ServerSyncMessage) {
    if (msg.sequenceNumber !== this.sequenceNumber + 1) {
      // Missing a packet! Would need to request snapshot or missed commands.
      this.outOfSync = true;
      return;
    }

    // Apply the command locally
    const { newState } = gameReducer(this.state, msg.command);
    this.state = newState;
    this.sequenceNumber = msg.sequenceNumber;

    // Verify hash matches server authority
    const localHash = hashState(this.state);
    if (localHash !== msg.stateHash) {
      this.outOfSync = true;
    }
  }
}

describe('Multiplayer Synchronization Protocol', () => {
  it('keeps server and two clients in perfect sync over 50 simulated turns', () => {
    const server = new MockServer(999);
    const client1 = new MockClient();
    const client2 = new MockClient();

    server.registerClient(client1);
    server.registerClient(client2);

    expect(hashState(server.state)).toBe(hashState(client1.state));
    expect(hashState(client1.state)).toBe(hashState(client2.state));
    expect(client1.outOfSync).toBe(false);
    expect(client2.outOfSync).toBe(false);

    // Run 50 turns
    for (let i = 0; i < 50; i++) {
      if (server.state.winner) break;

      const currentPlayerId = server.state.players[server.state.currentPlayerIndex].id;
      // In a real app, Client 1 or 2 would send this to server. 
      // We simulate the server receiving it.
      server.receiveCommand({ type: 'ROLL_DICE', playerId: currentPlayerId });

      // After receiving, clients should match server perfectly
      expect(hashState(client1.state)).toBe(hashState(server.state));
      expect(hashState(client2.state)).toBe(hashState(server.state));
      expect(client1.outOfSync).toBe(false);
      expect(client2.outOfSync).toBe(false);
    }

    // Double check we actually advanced
    expect(server.sequenceNumber).toBeGreaterThan(0);
    expect(client1.sequenceNumber).toBe(server.sequenceNumber);
  });
});
