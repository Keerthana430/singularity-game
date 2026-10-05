# 3D Snakes & Ladders: Phase-by-Phase Prompts

## How to use this

1. Paste the **Master Context** block into the start of a new chat/project (or save it as a project instruction / `CLAUDE.md`).
2. Run the phase prompts **in order**. Do not start the next phase until the current phase's **Exit Criteria** pass.
3. After each phase, ask for the output to be saved into the repo (`/docs/ARCHITECTURE.md`, `/docs/DECISIONS.md`, code, tests). Every later prompt tells the model to read those files first, so they act as the project's memory.
4. If a phase output is weak, reply with "Revise: [specific problem]" rather than moving on.

---

## MASTER CONTEXT (paste once at the start of every session)

```
You are a team made up of a senior WebGL/game-engine architect, 3D gameplay programmer,
technical artist, animation systems engineer, UX engineer, performance engineer and QA engineer.

PROJECT: A premium browser-based 3D game whose underlying rules are classic Snakes & Ladders.
It must feel like a small cinematic 3D game world, not a flat board game with models on top.

NON-NEGOTIABLES
- Visual direction: neon futuristic arcade + cinematic 3D. Neon is used with restraint.
  Readability priority: active player > current event > board numbers > other players/snakes/ladders/dice > decoration.
- 2-4 local players (architecture must allow more later). Each is a small animated 3D character
  (idle, walk/run, turn, stumble/fall, react, celebrate, defeat, optional emote) with a distinct
  color/silhouette/accessory.
- Real 3D dice with physical-looking roll, but the result is DETERMINISTIC and decided by game state
  before the animation; animation must be choreographed to land on that result.
- Characters physically move tile by tile via a reusable path/navigation system (no per-tile hardcoded
  animations, no floating, sinking, snapping or sideways sliding).
- Hybrid intelligent camera: elevated 3/4 view normally, cinematic during events, with collision/
  occlusion avoidance, damping, and gameplay readability always winning over cinematics.
- Animated, living snakes with a multi-phase bite cinematic (detect, tension, prepare, lunge, contact,
  reaction, forced descent, recovery, resume). Short, skippable, and decoupled from game logic.
- Interactive ladders with climbing animation that adapts to any ladder length.
- Strict separation: Rules / State / Rendering / Animation / Camera / Audio / UI / Input / Networking.
  Game rules never depend on animation timing.
- Local multiplayer first; core state must be deterministic and serializable so online play can be added later.
- Performance is a feature: quality tiers, low-end fallback, mobile support, lazy loading, instancing, draw-call budgets.
- Reliability is a feature: no animation/camera deadlocks, no invalid states, watchdogs and recovery everywhere.
- Debug mode (disableable in production), responsive layouts for all aspect ratios, layered audio with separate volumes.
- Do NOT assume any engine/library. Choose deliberately and justify; record every decision in /docs/DECISIONS.md.
- Where something is ambiguous: state your assumption, then continue. Do not over-engineer v1.

WORKING RULES
- Work only on the phase I give you. Do not jump ahead.
- Before writing code, read /docs/ARCHITECTURE.md and /docs/DECISIONS.md if they exist.
- Prefer small, clean modules with clear responsibilities. No monolithic files.
- At the end of each phase, list: what was done, what is deferred, known risks, and the exit-criteria checklist with pass/fail.
```

---

## PHASE 0: Technical Research & Technology Selection

```
PHASE 0: TECHNICAL RESEARCH AND TECHNOLOGY SELECTION. Do not write game code yet.

Research current, reliable documentation and compare realistic options for each decision below.
For each: list options, strengths, weaknesses, performance, integration complexity, browser/mobile
compatibility, maintainability, and why the winner fits THIS game.

Decisions to make:
1. Rendering: WebGL2 vs WebGPU (with fallback strategy) and which engine/library
   (e.g. Three.js, Babylon.js, PlayCanvas, raw) judged on cinematic quality, post-processing,
   skeletal animation, mobile performance, ecosystem and learning curve.
2. Physics: needed at all? Compare options for dice only vs. full engine. Consider a
   "precomputed/simulated-then-replayed deterministic dice" approach vs. live physics with forced outcome.
3. Animation: engine-native vs. third-party tweening/timeline libs; skeletal animation blending;
   procedural animation for snakes (spline/IK/verlet) vs. baked.
4. State management: custom deterministic state machine/reducer vs. libraries (XState, Redux-like, etc.).
5. UI: DOM overlay vs. in-canvas (3D) UI vs. hybrid; framework choice or none. Must feel native to the game
   and work on mobile.
6. Audio: Web Audio API directly vs. Howler/Tone etc.; spatial audio approach.
7. Build tooling: Vite/other, TypeScript, asset pipeline (glTF, Draco/Meshopt, KTX2/Basis), testing tools.
8. Asset sourcing: custom modeled vs. procedural vs. libraries vs. placeholder-first with swappable assets.
9. Networking (for later): candidate approaches only, not implementation.

Deliverables (write to the repo):
- /docs/RESEARCH.md: comparison tables and sources.
- /docs/DECISIONS.md: numbered Architecture Decision Records (context, options, decision, consequences).
- A 1-page recommended stack summary.
- A list of the top 10 technical risks discovered during research.

Exit criteria: every decision has a justified choice; fallback plan for WebGPU/WebGL2 exists;
no technology chosen merely because it is popular.
```

---

## PHASE 1: Architecture & Project Foundations

```
PHASE 1: COMPLETE SYSTEM ARCHITECTURE. Read /docs/RESEARCH.md and /docs/DECISIONS.md first.

Produce /docs/ARCHITECTURE.md covering, with diagrams (Mermaid is fine) and module interfaces:
1. System architecture and how modules communicate (event bus / command-queue / observer: pick and justify).
2. Scene architecture (scene graph layout, layers, object ownership, lifecycle, disposal).
3. Game-state architecture: pure deterministic rules engine; state shape; commands -> events;
   seeded RNG; turn state machine; how snake/ladder resolution works as DATA (final tile known
   instantly; animation is a presentation of the result).
4. Rendering architecture: pipeline, materials, lighting approach, post-processing chain,
   quality tiers.
5. Animation architecture: timelines/sequencer, state machines, blending, root motion policy,
   cinematic sequence format that can be played/shortened/skipped and always completes.
6. Camera architecture: rigs, modes (gameplay/dice/movement/snake/ladder/victory), blending,
   obstruction detection, framing solver, safe-area awareness for UI.
7. Snake/ladder interaction architecture (spline paths, head/tail anchors, bite choreography,
   ladder climb parameterization by length).
8. Asset pipeline and registry (swappable assets via interfaces/ids; loading, fallbacks, error handling).
9. UI architecture, Audio architecture, Input architecture (mouse/keyboard/touch/gamepad).
10. Performance strategy and budgets (draw calls, triangles, texture memory, frame time per tier).
11. Error-prevention design: watchdog timers, animation completion guarantees, state validation,
    recovery paths.
12. Debug tooling design.
13. Testing strategy and deployment architecture.
14. Future online multiplayer architecture (authoritative server, command sync, determinism,
    anti-cheat, latency vs. animation).
15. Final folder/project structure.

Then SCAFFOLD the repo: build tooling, TypeScript config, lint/format, folder structure,
empty modules with typed interfaces, a CI-ready test runner, and a "hello triangle" that proves the
renderer boots on desktop and mobile.

Exit criteria: architecture doc is complete and internally consistent; project builds and runs;
no module depends on a module it shouldn't (document the allowed dependency directions).
```

---

## PHASE 2: Game Rules & State Engine (no graphics)

```
PHASE 2: DETERMINISTIC RULES ENGINE. No rendering code in this phase.

Read /docs/ARCHITECTURE.md. Implement the pure game-logic core:
- Board definition as data (size, snake/ladder map, validation: no chains, no snake head on tile 100,
  no overlapping starts, etc.). Support future board variants.
- Seeded RNG and dice results derived from state+seed.
- Player state, turn state machine, commands (RollDice, ConfirmEvent, Skip, Pause, Restart...),
  and emitted domain events (DiceRolled, MovedStep, LandedOnSnake, LandedOnLadder, TurnEnded, GameWon...).
- Rules: exact-roll-to-win vs. overshoot-stays (make it a configurable rule, state the default),
  optional extra turn on 6 as a configurable rule (default off).
- Serialization/deserialization of full state; replay of a command log reproduces identical state.
- Guards against: double roll, wrong-player action, duplicate turn, invalid position, finished game input.

Tests (must be written and passing): every dice value from every tile, all snake heads, all ladder
bases, final-tile and overshoot behaviour, multi-player turn rotation, replay determinism, invalid
command rejection, property/fuzz test that plays thousands of random games without reaching an invalid state.

Exit criteria: 100% of rule tests pass; a CLI/test harness can simulate a full game headlessly;
the module imports nothing from rendering/animation/UI.
```

---

## PHASE 3: Prototype: Board, Camera, Dice, Movement, Basic Snake & Ladder

```
PHASE 3: VISUAL PROTOTYPE. Read /docs/ARCHITECTURE.md and the rules engine API.

Build, using placeholder/procedural assets behind the asset-registry interfaces:
1. 3D board: thickness, bevels, tile separation, readable numbers (test legibility under lighting/glow),
   data-driven from the board definition, boustrophedon tile coordinate mapping with tile-center
   positions and surface height.
2. One player pawn/character placeholder.
3. Basic gameplay camera (elevated 3/4 view) with damping and follow.
4. Dice: 3D die with a deterministic result. Implement the chosen approach (e.g. simulate with physics
   offline/at roll time using a seeded setup, then replay/steer so the visible top face matches the
   rules-engine result). Include anticipation, throw, bounce, settle, and result reveal.
5. Reusable path-following movement system: tile sequence -> smooth path, facing direction,
   corner turning, grounded on board surface, no snapping.
6. Basic snake (static or simple spline) and basic ladder; landing on them triggers the correct final
   position from the rules engine (no fancy animation yet; a smooth placeholder move is fine).
7. A thin integration layer that listens to domain events and drives presentation (rules never wait on it).

Exit criteria: you can roll, the dice visibly lands on the logic result 1000/1000 times in an automated
test; the pawn walks tile by tile along the serpentine path with correct turning; snakes/ladders send
the player to the right tile; no module violates the dependency rules; runs at target FPS on desktop and a mid-range phone.
```

---

## PHASE 4: Animation: Characters, Snake Cinematic, Ladder Climb

```
PHASE 4: ANIMATION SYSTEMS. Read /docs/ARCHITECTURE.md.

Implement:
1. Character animation state machine with blending: idle, walk/run (speed-synced to movement to
   prevent foot sliding), turn, hop, stumble/fall, react, celebrate, defeat, optional emote. Define the
   root-motion policy. Provide a character asset contract so models can be swapped.
2. Living snake: idle breathing/body motion, head tracking toward active player, tongue/face animation,
   procedural spline-driven body (works for any head-to-tail layout).
3. Snake bite cinematic as a data-driven sequence with the phases: detect, tension, prepare, lunge,
   contact, player reaction, forced-descent along the snake body/path to the tail tile, recovery, resume.
   Support modes: full, shortened, skipped (after first view or by input). Final state always
   comes from the rules engine; skipping must land everything in the exact same end state.
4. Ladder climb: orient to ladder, climb along a parameterized path with hands/feet placement
   approximated (IK or timed cycle), transition onto upper tile; works for any ladder length.
5. Sequencer with completion guarantees: every sequence has a max duration watchdog and a
   "force-complete to final state" path.
6. Sound/camera hook points (events/markers in timelines) for later phases.

Exit criteria: no foot sliding at various speeds, no animation pops or T-poses, snake cinematic runs
full/short/skip and ends in identical state, ladders of lengths from shortest to longest all look correct,
interrupting or force-completing any sequence never leaves a stuck state (automated test).
```

---

## PHASE 5: Camera Intelligence

```
PHASE 5: INTELLIGENT CAMERA SYSTEM. Read /docs/ARCHITECTURE.md.

Implement the hybrid camera:
- Modes: gameplay (3/4 elevated), dice-roll framing, movement follow with predictive framing,
  snake-event cinematic, ladder-event cinematic, victory sequence, intro sequence.
- Smooth blending between modes with easing; no shake or needless motion; hysteresis to avoid jitter.
- Framing solver ensuring active character + target area stay in view and respect UI safe areas
  per aspect ratio (16:9, 16:10, ultrawide, tablet, portrait, landscape mobile).
- Collision/occlusion avoidance: no clipping through board, snakes, characters or environment;
  line-of-sight checks to the active character with smooth push-in/orbit adjustments;
  min/max distance constraints; recovery if the camera ever ends up inside geometry or yields NaN.
- Camera watchdog: if a cinematic overruns or fails, blend back to gameplay camera.
- Optional user controls (limited orbit/zoom within bounds) that never break gameplay readability.

Tests: automated camera sweep across all tiles/events/aspect ratios asserting visibility of the active
character, no penetration, no NaN, and bounded camera acceleration.

Exit criteria: all event cameras are readable and smooth; no obstruction in sweep tests;
portrait mobile has a distinct, usable framing.
```

---

## PHASE 6: Visual Polish: Environment, Lighting, Materials, FX

```
PHASE 6: VISUAL DIRECTION AND POLISH. Read /docs/ARCHITECTURE.md.

Deliver the neon futuristic arcade + cinematic look with restraint:
1. Environment: a believable futuristic arena/arcade chamber/tabletop arena around the board
   (not an empty void), with animated but low-priority decoration.
2. Lighting and materials: consistent palette and material language; emissive accents on board edges
   and key elements; controlled glow; subtle fog/volumetrics; reflections where budget allows.
3. Post-processing chain (bloom, tone mapping, color grading, subtle vignette/AA) with per-tier toggles.
4. Particles/FX: dice impact, footsteps/hop dust, snake strike, ladder sparkle, fall impact, victory
   celebration; strict particle budgets.
5. Player visual identity: color + accessory + silhouette distinct even when stacked on adjacent tiles;
   tile-sharing placement rules (offset positions when multiple players occupy a tile).
6. Readability audit: board numbers legible at all camera angles and sizes, under bloom and particles;
   visual hierarchy followed (active player > event > board > others > decoration).

Exit criteria: screenshot review at multiple angles/resolutions shows numbers always legible and the
active player always stands out; neon never overwhelms gameplay; coherent style across all assets.
```

---

## PHASE 7: UI/UX, Game Flow, Responsive Layout

```
PHASE 7: UI AND FULL GAME FLOW. Read /docs/ARCHITECTURE.md.

Implement the complete flow: Main Menu -> Player Count -> Character Selection -> Setup -> Intro
camera sequence -> Turn -> Roll -> Result -> Movement -> Snake/Ladder event -> State update -> Next
player -> ... -> Victory -> Celebration -> Replay/Main Menu. Every transition intentional, no abrupt scene changes.

UI requirements:
- Menus, player/character selection, settings (audio, quality, camera, accessibility), pause,
  restart, exit confirmation, HUD (turn indicator, dice action, dice result, player positions), victory screen.
- A visual language that belongs to the game (matching the neon arcade world), not default HTML.
- Clear turn ownership and result communication; event captions for snake/ladder moments.
- Input: mouse, keyboard, touch, gamepad optional; prevent double-tap/double-roll; large touch targets.
- Responsive layouts designed per form factor (desktop, tablet, portrait and landscape phone), safe-area
  insets, orientation change handling, accessibility (contrast, reduced motion, remappable/tap alternatives).

Exit criteria: a full 2-4 player game is playable start to finish on desktop and phone; UI never obscures
critical gameplay; rapid input spam can't create duplicate turns or invalid states.
```

---

## PHASE 8: Audio

```
PHASE 8: AUDIO. Read /docs/ARCHITECTURE.md.

Implement the audio system: bus structure (master, music, sfx, ambience, UI) with separate volume
controls and mute; autoplay-policy-safe unlock; music with state-based layers/transitions; SFX for
dice (throw/bounce/settle), footsteps (surface-aware, synced to animation markers), snake (idle,
hiss, lunge, bite), ladder, UI, fall, victory; ambience; spatial audio only where it improves the 3D
scene (snakes, dice, active character); voice/sound limiting and pooling; graceful behavior if audio
fails to load or the tab loses focus.

Exit criteria: all key events have synchronized audio feedback, volumes persist, no audio glitches on
tab switch/resume, mobile unlock works.
```

---

## PHASE 9: Performance & Quality Tiers

```
PHASE 9: PERFORMANCE. Read /docs/ARCHITECTURE.md performance budgets.

- Profile CPU/GPU on desktop, mid-range and low-end mobile; record baselines.
- Implement/finish: automatic device capability detection and dynamic quality scaling (high/medium/low),
  instancing, draw-call reduction, LOD, frustum culling, shadow strategy, shader/post-processing
  simplification, particle caps, texture compression (KTX2), geometry compression (Meshopt/Draco),
  lazy loading/streaming of non-critical assets, fast first load with a progress experience.
- Memory: disposal of GPU resources, no leaks over long sessions (run a 60-minute soak test).
- Gameplay must remain identical across tiers.

Deliverable: /docs/PERFORMANCE.md with before/after metrics, budgets and remaining risks.
Exit criteria: target FPS met per tier; initial load time target met; no memory growth in the soak test.
```

---

## PHASE 10: Reliability, Debug Tools & Full QA

```
PHASE 10: RELIABILITY AND TESTING. Read /docs/ARCHITECTURE.md.

1. Debug mode (stripped/disabled in production): state inspector, tile coordinates, player positions,
   camera pos/target, collision/occlusion visualization, snake/ladder paths, animation states,
   FPS/draw calls/memory, asset load status, error log.
2. Hardening: watchdogs for all sequences and camera transitions, state validation each turn, NaN/undefined
   transform guards, missing/failed asset fallbacks, error boundaries, auto-recovery to last valid state.
3. Test suite: unit (rules), integration (rules -> presentation), end-to-end (Playwright or similar) full
   games, visual regression screenshots, fuzz/soak tests, interrupted animation tests.
4. Explicit edge cases: max roll, exact snake head, exact ladder base, final tile / overshoot, multiple
   players on adjacent/same tiles, movement during camera transitions, rapid consecutive events,
   resize/orientation change mid-event, tab switch, pause/restart mid-animation, slow device,
   missing assets, very long sessions.

Deliverable: /docs/QA_REPORT.md mapping each acceptance criterion (gameplay, 3D, animation, camera,
performance, reliability, UX) to evidence (test name or recorded result).
Exit criteria: no known deadlocks, stuck turns or invalid states; all acceptance criteria evidenced.
```

---

## PHASE 11: Multiplayer Readiness & Production Build

```
PHASE 11: MULTIPLAYER READINESS AND PRODUCTION RELEASE. Read /docs/ARCHITECTURE.md.

A. Multiplayer readiness (do NOT build a full online mode unless asked):
   - Verify the rules engine is deterministic, serializable and command-driven; add a transport-agnostic
     "command + sequence number + state hash" protocol layer and a mock networked-session harness
     (two clients + authoritative host in-process) to prove sync works.
   - Document: authoritative server model, anti-cheat (server-side RNG, validation), reconnect/rejoin,
     handling latency/desync with presentation (animations follow authoritative events; late clients
     fast-forward), and what would change in the codebase.
B. Production build:
   - Bundle splitting, asset hashing/caching headers, CDN strategy, compression, PWA/offline optional,
     error reporting/telemetry hooks, feature flags, strip debug.
   - Browser/device compatibility matrix and fallbacks (WebGPU -> WebGL2 -> graceful message).
   - Deployment pipeline (CI: lint, test, build, preview deploy) and a release checklist.

Deliverables: /docs/MULTIPLAYER.md, /docs/DEPLOYMENT.md, production build, release checklist.
Exit criteria: mock networked session stays in sync across fuzzed play; production build passes the
compatibility matrix and performance budgets.
```

---

## Optional Phase 12: Future Features (only if wanted)

```
PHASE 12: OPTIONAL FEATURES. Evaluate, then implement only what improves the game.

For each candidate (unlockable characters, cosmetics/victory celebrations, alternate boards, progression,
achievements, optional power-ups, special events, customizable environments): state the player value, the
risk to clarity/rules purity, implementation cost, and a keep/skip/defer recommendation. Implement only the
approved ones, behind feature flags, without altering the classic rule set by default.
```

---

## Quick reference: per-phase "continue" prompt

Paste this at the start of any new session mid-project:

```
Resume the 3D Snakes & Ladders project. Read /docs/ARCHITECTURE.md, /docs/DECISIONS.md and the latest
phase report, summarize the current state in 10 lines, list open risks, then await my phase prompt.
```
