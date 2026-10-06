# Multiplayer Readiness Architecture

This document proves the technical feasibility of scaling "3D Snakes & Ladders" from local multiplayer to a fully online networked experience, fulfilling Phase 11 of the master project plan.

## The Challenge
Browser-based 3D games with physics (like the Rapier-powered dice) and procedural animation present significant challenges for multiplayer synchronization. If we rely on clients to calculate physics, desynchronization is guaranteed.

## The Solution: Deterministic State & Command Queue

To support multiplayer, the game's architecture strictly separates the **State Engine** (rules, logic) from the **Presentation Layer** (3D rendering, animation).

### 1. Authoritative Server Model
- **No Client Physics for Logic:** The Rapier physics engine on the client is purely cosmetic. The server rolls the dice using a seeded RNG and sends the *result* to all clients. The clients' physics engines then use steering forces to ensure the physical dice always land on the server-mandated result.
- **Command Queue:** Clients do not directly mutate state. They send `COMMANDS` to the server (e.g., `Command.ROLL_DICE`, `Command.END_TURN`). The server validates the command against the current state and broadcasts a `DOMAIN EVENT` (e.g., `Event.DICE_ROLLED { value: 4 }`).

### 2. State Serialization
Because our board, player positions, and turn data are modeled as pure serializable JSON (using Zustand), the server can dump the entire game state at any moment and send it to a reconnecting client.
```typescript
interface GameState {
  players: Record<string, PlayerState>;
  turnIndex: number;
  boardConfig: string; // "classic"
  seed: number;
}
```

### 3. Latency Compensation & Animation Fast-Forwarding
What happens if player 2 rolls the dice, but player 1's client lags and receives the event 2 seconds late?
- The animation system uses GSAP timelines with deterministic durations.
- If a client detects that it is "behind" the server state, it will scale the `timeScale()` of the GSAP animations so the 3D character sprints rapidly across the board to catch up to their true position, preserving immersion without breaking logic.

### 4. Anti-Cheat
- The server generates all random numbers.
- Movement validation is trivial since movement is strictly constrained by the board logic.
- "Speed hacks" do not work because the client's animation speed has no effect on the server's rules engine.

## Implementation Steps (Future Phase)
1. Set up a WebSockets server (e.g., Colyseus or Socket.io) in Node.js.
2. Move the core Zustand reducer logic into a shared `common/` folder imported by both client and server.
3. Replace local `dispatch` calls with WebSocket `emit` calls.
