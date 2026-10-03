# Multiplayer Architecture & Readiness

## Overview
The Singularity 3D game core was built from Phase 1 to be fully decoupled from presentation. The state and rules reside in `src/rules/gameReducer.ts`, a pure deterministic function that accepts `GameState` and `GameCommand` to output a new `GameState` and an array of `GameEvent`s. 

Because of this strict purity, the client is **100% multiplayer-ready** using an Authoritative Server model.

## Authoritative Server Model
1. **Server Authority**: The server hosts the "true" `GameState`. Clients do not directly mutate their game states.
2. **Command Dispatch**: When a player clicks "Roll Dice", a `GameCommand` (e.g., `ROLL_DICE`) is sent over WebSockets to the server.
3. **Server Execution**: The server passes the command into `gameReducer()`. It increments a `sequenceNumber`.
4. **Broadcast Sync**: The server broadcasts a `SERVER_SYNC` payload containing the command, the new sequence number, and a DJB2 state hash to all connected clients.
5. **Client Application**: Clients receive `SERVER_SYNC`, run `gameReducer()` on their local state, and compare their local DJB2 hash to the server's hash.

## Anti-Cheat
- **Server-Side RNG**: The random seed is stored in the `GameState`. `gameReducer()` uses `createSeededRng` to produce deterministic results. A hacked client cannot "roll a 6" because the server computes the dice roll entirely based on the shared seed state.
- **Validation**: If a client sends a command for another player's turn, `gameReducer()` simply ignores it (returns the same state).

## Reconnect and Rejoin
If a client disconnects or falls out of sync (i.e. `localHash !== serverHash`), they drop their local state and request a `STATE_SNAPSHOT` from the server. The server sends the entire serialized JSON string of the current `GameState`, allowing the client to instantly resume.

## Handling Latency and Desync
Animations take time (up to 5+ seconds for a ladder climb). To handle desync:
- **Presentation Layer Separation**: The `turnPhase` inside `GameState` controls rules logic (e.g., wait for next roll), but the 3D presentation relies on the `eventBus`. 
- **Late Clients / Fast-Forward**: If a client joins late, they receive the final `GameState` snapshot and skip the animations entirely. 
- **Command Queuing**: If commands arrive while a client is animating, they are queued and applied sequentially after the animation resolves.

## Required Codebase Changes for Online Play
1. **WebSocket Client**: Replace `useGameStore` local dispatcher with a `ws.send()` wrapper.
2. **WebSocket Server**: Spin up a Node.js process that holds the `GameState` instances per room and relays commands.
3. **Lobby UI**: Add matchmaking or room code UI.
4. **Local Prediction (Optional)**: If instant response is desired, the client can visually roll the dice before the server replies, though it's safer for tabletop board games to wait for the server's sync broadcast to begin the roll animation.
