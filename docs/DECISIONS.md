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

 # #   A D R - 0 1 3 :   T e r r a c e d   B o a r d   L a y o u t   D a t a   M o d e l 
 
 -   * * C o n t e x t * * :   T h e   g a m e   b o a r d   n e e d s   t o   s w i t c h   f r o m   a   s t a t i c   b o u s t r o p h e d o n   m a t h e m a t i c a l   g r i d   t o   a   3 D   t e r r a c e d   s t r u c t u r e   ( l i k e   s t e p s ) .   S n a k e s   a n d   l a d d e r s   n e e d   t o   w r a p   a c r o s s   t h e s e   t e r r a c e s . 
 -   * * O p t i o n s * * :   ( a )   C o m p u t e   p o s i t i o n s   i n   c o m p o n e n t s   o n   t h e   f l y ,   ( b )   C r e a t e   a   c e n t r a l i z e d   \ B o a r d L a y o u t \   d a t a   s t r u c t u r e   c o m p u t e d   o n c e   a t   s t a r t u p . 
 -   * * D e c i s i o n * * :   * * C e n t r a l i z e d   \ B o a r d L a y o u t \   c o m p u t e d   o n c e * * .   T h e   l a y o u t   g e n e r a t o r   e m i t s   t h e   e x a c t   3 D   p o s i t i o n ,   n o r m a l ,   a n d   t e r r a c e   i n d e x   f o r   e v e r y   t i l e .   A l l   c o m p o n e n t s   ( r e n d e r e r ,   c a m e r a ,   p a t h   l o g i c ,   s n a k e s ,   l a d d e r s )   c o n s u m e   t h i s   l a y o u t   d a t a   i n s t e a d   o f   g u e s s i n g   g e o m e t r y . 
 -   * * C o n s e q u e n c e s * * :   D e - c o u p l e s   v i s u a l   b o a r d   g e o m e t r y   f r o m   t h e   r u l e s   e n g i n e   ( w h i c h   o n l y   k n o w s   a b o u t   t i l e   n u m b e r s   1 - 1 0 0 ) .   A l l o w s   c o m p l e x   p r o c e d u r a l   s n a k e s   t h a t   h u g   t h e   g r o u n d   b y   q u e r y i n g   h e i g h t s   b e t w e e n   t i l e s . 
  
 