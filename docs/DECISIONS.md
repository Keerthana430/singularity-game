# Architecture Decision Records

## ADR-001: 3D Rendering Engine

- **Context**: The project needs a 3D engine capable of cinematic quality, skeletal animation, post-processing, and mobile performance for a browser-based board game. An existing codebase uses React Three Fiber + Three.js.
- **Options**: (a) Three.js via R3F, (b) Babylon.js, (c) PlayCanvas, (d) Raw WebGL/WebGPU.
- **Decision**: **Three.js via React Three Fiber v9** — retains existing code investment, provides WebGPU with automatic WebGL2 fallback, has the largest ecosystem (drei, postprocessing, Rapier bindings), tree-shakeable for small bundles, and native React integration.
- **Consequences**: Must build our own animation state machine and sequencer (Three.js is a renderer, not a game engine). Post-processing must be validated with WebGPURenderer. Custom shaders require TSL for WebGPU compatibility.

## ADR-002: WebGPU Fallback Strategy

- **Context**: WebGPU is production-ready (W3C CR, March 2026) with broad browser support, but Firefox support is fragmented and older devices lack it.
- **Options**: (a) WebGPU primary with manual WebGL2 fallback code, (b) Three.js `WebGPURenderer` with auto fallback, (c) WebGL2 only.
- **Decision**: **Three.js `WebGPURenderer` with automatic fallback** — the renderer handles backend selection internally. Single codebase, no branching logic. Feature-detect `navigator.gpu` only for debug display.
- **Consequences**: Must avoid legacy `ShaderMaterial`/GLSL — use TSL for custom shaders. Must validate `@react-three/postprocessing` compatibility with WebGPURenderer.

## ADR-003: Physics Engine (Dice)

- **Context**: The game needs a 3D dice roll that looks physically convincing but is 100% deterministic (the result is decided by game rules before animation plays).
- **Options**: (a) Rapier3D-deterministic precompute-then-replay, (b) Cannon-es with forced outcome, (c) Keyframed animation only, (d) Full physics engine for all gameplay.
- **Decision**: **Rapier3D-deterministic (`@dimforge/rapier3d-deterministic`) for dice only, precomputed-then-replayed.** Pre-simulate multiple initial orientations until one lands on the target face, cache, then replay for the player.
- **Consequences**: Adds ~300 KB WASM dependency; must run precomputation in a Web Worker to avoid frame drops. Must use fixed timestep and deterministic initialization. No physics needed for board/characters.

## ADR-004: Animation Architecture

- **Context**: Characters need skeletal animation with blending (idle, walk, climb, react, celebrate). Snakes need procedural body animation. Cinematics must be skippable and force-completable.
- **Options**: (a) Three.js AnimationMixer + custom, (b) Theatre.js, (c) GSAP/Tween.js, (d) Babylon animation system.
- **Decision**: **Three.js AnimationMixer for skeletal + custom animation state machine + custom cinematic sequencer.** Snakes use procedural spline-driven body. Ladders use parameterized climb path.
- **Consequences**: Must implement ~200-line sequencer with watchdog timers and force-complete-to-final-state. No external tween library dependency. More control but more custom code.

## ADR-005: Game State Architecture

- **Context**: Game rules must be deterministic, serializable, and decoupled from rendering. Must support replay and future networked play. Existing project uses Zustand for UI state.
- **Options**: (a) Custom deterministic reducer, (b) Zustand for everything, (c) XState, (d) Redux Toolkit.
- **Decision**: **Custom deterministic reducer for game rules; Zustand for UI/presentation state.** The rules engine is a pure function: `(state, command) → (newState, events[])`. No library dependency for the core game logic.
- **Consequences**: Two state layers (rules engine + Zustand). Rules engine must never import React, Zustand, or browser APIs. Zustand stores subscribe to domain events to update UI. Simple and testable, but no built-in dev tools like XState visualizer.

## ADR-006: UI Architecture

- **Context**: UI must feel native to the neon arcade world, work on mobile, and not obstruct 3D gameplay. Existing codebase uses React DOM overlay with Tailwind.
- **Options**: (a) Pure DOM overlay, (b) In-canvas 3D UI, (c) Hybrid DOM + drei Html for world-space labels.
- **Decision**: **Hybrid: React DOM overlay for menus/HUD/settings + drei `<Html>` for world-space labels (tile numbers, player names).**
- **Consequences**: Accessibility and responsive layout handled by DOM. World-space labels may need occlusion handling. Existing Tailwind-styled HUD pattern continues.

## ADR-007: Audio System

- **Context**: Game needs SFX (dice, footsteps, snake, ladder, UI), music with state-based transitions, spatial audio for 3D elements, and mobile autoplay unlock.
- **Options**: (a) Howler.js, (b) Raw Web Audio API, (c) Tone.js, (d) Three.js Audio only.
- **Decision**: **Howler.js for SFX/music management + Three.js `PositionalAudio` for spatial sources.** Howler handles codec fallback, mobile unlock, volume buses. Three.js spatial audio only where 3D positioning adds value (snakes, dice).
- **Consequences**: ~10 KB dependency. Must integrate Howler's volume controls with game settings UI. Spatial audio limited to a few positioned sources.

## ADR-008: Testing Strategy

- **Context**: Need fast unit tests for deterministic rules, integration tests for rules→presentation, and E2E tests for full gameplay.
- **Options**: (a) Vitest, (b) Jest, (c) Mocha/Chai, (d) Node test runner.
- **Decision**: **Vitest for unit/integration tests; Playwright for E2E (added in Phase 10).** Vitest is fast, TypeScript-native, and works with the existing build tooling.
- **Consequences**: Must configure Vitest alongside Next.js. E2E testing deferred to Phase 10.

## ADR-009: Asset Pipeline

- **Context**: Game will use glTF 2.0 models. Need compression for web delivery and fast GPU decode.
- **Options**: (a) Meshopt + KTX2, (b) Draco + KTX2, (c) No compression, (d) Custom binary format.
- **Decision**: **Meshopt for geometry compression + KTX2 (UASTC/ETC1S) for texture compression, via gltf-transform CLI.** Meshopt decodes faster than Draco, has a smaller decoder, and handles animation.
- **Consequences**: Must install gltf-transform and KTX-Software when real assets arrive. Placeholder phase uses procedural geometry (no compression needed).

## ADR-010: Asset Sourcing Strategy

- **Context**: Need 3D characters, board, snakes, ladders, dice, environment. Quality matters but shipping matters more.
- **Options**: (a) Procedural placeholders first, (b) Premade CC0 assets, (c) Custom modeled, (d) AI-generated.
- **Decision**: **Procedural placeholder-first with typed asset-registry interfaces.** All gameplay code depends on asset IDs and interfaces, never on specific models. Placeholders are Three.js primitives. Real assets swapped in later without touching logic.
- **Consequences**: Visual quality is placeholder-tier until real assets arrive. But gameplay, animation, and camera systems can be fully developed and tested. Existing pattern from the codebase continues.

## ADR-011: Networking Architecture (Future)

- **Context**: Local multiplayer first, but architecture must support future online play. Rules engine must be deterministic and command-driven.
- **Options**: (a) Authoritative server + command sync, (b) Peer-to-peer, (c) Lockstep.
- **Decision**: **Authoritative server model with command-sequence-number protocol (architecture only, no implementation until Phase 11).** Server validates commands, broadcasts events. Clients replay with animation.
- **Consequences**: Rules engine must remain pure and serializable from Phase 2 onward. Command log must be replayable. Transport layer stubbed behind an interface.

## ADR-012: Deterministic PRNG Algorithm

- **Context**: Game engine needs a deterministic random number generator for dice rolling that is serializable and fast.
- **Options**: (a) Math.random() (b) Linear Congruential Generator (LCG) (c) Mulberry32 (d) Mersenne Twister.
- **Decision**: **Mulberry32**. It is fast, has better distribution than LCG, and the state can be represented as a single 32-bit integer, making it trivial to serialize in the `GameState`.
- **Consequences**: We cannot rely on standard `Math.random()`. The random seed state must be carried in the `GameState` and explicitly mutated/advanced during the `gameReducer` when rolls happen.

## ADR-013: Terraced Board Layout Data Model

- **Context**: The game board needs to switch from a static boustrophedon mathematical grid to a 3D terraced structure (like steps). Snakes and ladders need to wrap across these terraces.
- **Options**: (a) Compute positions in components on the fly, (b) Create a centralized `BoardLayout` data structure computed once at startup.
- **Decision**: **Centralized `BoardLayout` computed once**. The layout generator emits the exact 3D position, normal, and terrace index for every tile. All components (renderer, camera, path logic, snakes, ladders) consume this layout data instead of guessing geometry.
- **Consequences**: De-couples visual board geometry from the rules engine (which only knows about tile numbers 1-100). Allows complex procedural snakes that hug the ground by querying heights between tiles.

## ADR-014: Duel System Architecture

- **Context**: When two players land on the same tile, they must engage in a rock-paper-scissors style combat duel to determine who stays and who is retreated backwards on the board.
- **Options**: (a) Create a separate HTML page/scene for duels, (b) Create an entirely new separate module `duel-system.js` and inject it dynamically, (c) Integrate duel logic inline with the main IIFE in `snake-and-ladder.html`.
- **Decision**: **Integrate duel logic inline with the main IIFE in `snake-and-ladder.html`**. 
- **Consequences**: Allows the duel logic direct access to the existing Three.js globals (`cam`, `tween`, `Snd`, etc.) without complex bridging architectures. Instead of unloading the board, players are teleported to a fixed Duel Arena at an offset position `(-40, 20, -40)` and the camera snaps there for the duration of the duel. This is efficient, avoids reload flickering, and preserves board state perfectly. The main game loop `turn()` is paused via an `await` promise barrier until the duel resolves.
## ADR-015: Removal of Duel System
**Context:** The duel system (ADR-014) added complexity that was not desired by the user. They requested its complete removal.
**Decision:** Remove all duel-related UI, game state, keyboard listeners, combat variables, and logic loop from the game. 
**Consequences:** Players now overlap/coexist peacefully when landing on the same tile, returning to the standard Snakes & Ladders behavior. ADR-014 is revoked.

## Decision 10: Combat Health & Stamina System (Zustand)
**Context:** Need to manage health and stamina for multiple combat entities (Player and AI opponent dummy) to prepare for full AI combat.
**Options:**
1. Keep local hp state in ProceduralCharacter and rely on prop callbacks for HUD.
2. Use a centralized global store (zustand) holding an entities map.
**Choice:** Option 2 (Centralized Store).
**Consequences:** Easier to render HUDs outside the 3D scene (Canvas) without prop drilling or performance issues.
