# Phase 0: Technical Research & Technology Selection

## Context

This project is a **premium browser-based 3D Snakes & Ladders game** built within an existing **Next.js 16 / React 19 / React Three Fiber / Three.js** codebase. A working prototype already exists at `/app/snakes/page.tsx` using R3F + Three.js + Zustand. Decisions must account for this existing investment.

---

## 1. Rendering: WebGL2 vs WebGPU & Engine/Library

### Comparison

| Criterion | Three.js + WebGPURenderer | Babylon.js | PlayCanvas | Raw WebGL/WebGPU |
|---|---|---|---|---|
| Cinematic quality | High (PBR, post-processing, bloom, tone mapping) | Very high (built-in PBR, GI, SSAO) | Good | Unlimited but enormous effort |
| Post-processing | Bloom, SMAA, tone mapping via R3F postprocessing | Built-in pipeline | Built-in | Manual |
| Skeletal animation | AnimationMixer + blending; manual state machine | Built-in animation state machines | Built-in | Manual |
| Mobile perf | Good; tree-shakeable; small footprint | Good but larger bundle (~1 MB+) | Excellent | Best possible but highest effort |
| Ecosystem | Massive; R3F, drei, postprocessing, Rapier bindings | Large; built-in physics, GUI, inspector | Moderate | Minimal |
| React integration | Native via React Three Fiber (R3F v9) | Community wrappers (less mature) | None | None |
| WebGPU support | `WebGPURenderer` with auto WebGL2 fallback (production-ready, 2026) | Full WebGPU support | Full WebGPU support | Native |
| Learning curve | Low (team already uses it) | Medium (new engine) | Medium | Very high |
| Bundle size | ~150 KB (tree-shaken) | ~800 KB–1.2 MB | ~300 KB | Minimal |

### Decision

**Three.js via React Three Fiber** — the existing codebase already uses R3F v9 + Three.js + drei + postprocessing. Switching engines would discard working code and introduce migration risk for zero gameplay benefit. Three.js's `WebGPURenderer` (stable since r160, 2026) provides automatic WebGL2 fallback with a single codebase.

### Fallback strategy

`WebGPURenderer` auto-falls back to WebGL2 backend. No manual code path needed. Feature-detect with `navigator.gpu` only for debug display. If even WebGL2 is missing, show a graceful "unsupported browser" message.

---

## 2. Physics: Dice Simulation

### Comparison

| Approach | Determinism | Visual quality | Complexity | Performance |
|---|---|---|---|---|
| **Rapier3D-deterministic** (precomputed) | Bit-level cross-platform | Physically accurate roll | Medium | Excellent (WASM) |
| Cannon-es (live sim, forced outcome) | Platform-dependent floats | Good | Medium | Good |
| No physics (keyframed animation) | Perfect (data-driven) | Can feel canned | Low | Excellent |
| Full physics engine for all gameplay | Overkill for board game | High | Very high | Heavy |

### Decision

**Hybrid: Rapier3D-deterministic for dice only, precomputed-then-replayed.** The rules engine decides the dice result first. We pre-simulate multiple initial orientations with Rapier's deterministic WASM build until one lands on the target face, then replay that exact simulation for the player. This gives physically convincing rolls that are 100% deterministic and match the game logic. No full physics engine for board/characters — unnecessary for a board game.

### Why not keyframed?

Keyframed dice feels repetitive quickly. With Rapier precomputation we get infinite variety while remaining deterministic.

---

## 3. Animation

### Comparison

| Approach | Skeletal blending | Snake procedural | Timeline/sequencer | Integration |
|---|---|---|---|---|
| Three.js AnimationMixer + custom state machine | Native blending, crossfade | Manual (spline/IK) | Custom sequencer | Direct |
| Theatre.js | Manual | Manual | Excellent visual editor | R3F plugin exists |
| GSAP / Tween.js | No skeletal support | Manual | Good tweening | Lightweight |
| Babylon animation system | Built-in state machines | Manual | Built-in | Requires engine swap |

### Decision

**Three.js AnimationMixer for skeletal animation + custom animation state machine + custom sequencer for cinematics.** Tweening helpers (simple lerp/easing utilities) for camera and procedural animation — no external tween library needed. Snakes use **procedural spline-driven body with IK-style head tracking** (not baked animation), allowing any snake shape and dynamic head-follow. Ladders use **parameterized climb path** adapting to any length.

### Why custom sequencer?

The spec requires skippable, force-completable cinematic sequences with watchdogs. No existing timeline library provides the "force-complete to final state" guarantee. A thin custom sequencer (~200 lines) is more reliable than fighting a library's assumptions.

---

## 4. State Management

### Comparison

| Library | Determinism | Serialization | Complexity | Existing usage |
|---|---|---|---|---|
| **Custom reducer/command pattern** | Perfect (pure functions) | Trivial (plain objects) | Low | None yet |
| Zustand | High (if disciplined) | Manual | Very low | Already in project |
| XState | Absolute (formal FSM) | Built-in | Medium-high | None |
| Redux Toolkit | High (enforced) | Middleware | Medium | None |

### Decision

**Custom deterministic reducer with command/event pattern for game rules; Zustand for UI/presentation state.** The rules engine is a pure function: `(state, command) → (newState, events[])`. This is simpler, more testable, and more serializable than any library. Zustand remains for React UI state (menus, settings, avatar selection) since it's already in the project. The two layers never cross: rules never import Zustand; Zustand stores subscribe to domain events.

### Why not XState?

XState adds ~40 KB and a learning curve for a state machine that is naturally expressed as a simple reducer + turn enum. The game has ~6 states (waiting, rolling, moving, snake-event, ladder-event, game-over). A formal statechart is overkill.

---

## 5. UI Architecture

### Comparison

| Approach | Feel | Mobile | Integration | Effort |
|---|---|---|---|---|
| **DOM overlay (React + CSS)** | Native-responsive, accessible | Excellent | Direct (Next.js pages) | Low |
| In-canvas 3D UI (drei Html) | Immersive but accessibility nightmare | Poor | Complex | High |
| Hybrid (DOM primary, drei Html for world-space labels) | Best of both | Good | Moderate | Medium |

### Decision

**Hybrid: DOM overlay for all menus/HUD/settings + drei `<Html>` for world-space labels (tile numbers, player names).** This matches the existing codebase pattern. DOM gives us accessibility, responsive layout, touch targets, and Tailwind styling. World-space HTML (already used) provides in-scene context without 3D text rendering costs.

---

## 6. Audio

### Comparison

| Tool | Spatial audio | Mobile unlock | Complexity | Size |
|---|---|---|---|---|
| **Howler.js** | Built-in plugin | Automatic | Very low | ~10 KB |
| Web Audio API (raw) | Native PannerNode | Manual | High | 0 KB |
| Tone.js | Via Web Audio | Manual | Medium | ~150 KB |
| Three.js Audio | Uses Web Audio API | Manual | Medium | 0 KB (part of Three) |

### Decision

**Howler.js for SFX and music; Three.js `PositionalAudio` for spatial sources (snakes, dice).** Howler handles codec fallback, mobile autoplay unlock, sprite sheets, and bus-like volume control with minimal code. Three.js spatial audio is used only where 3D positioning adds value (snake hiss near the snake, dice impact near the die). The existing `/lib/audio.ts` already has a simple sound interface that can be extended.

### Why not raw Web Audio?

Howler saves ~200 lines of boilerplate for codec detection, unlock gestures, and volume management. The 10 KB cost is negligible.

---

## 7. Build Tooling

### Current stack (keep)

| Tool | Purpose | Already in project |
|---|---|---|
| **Next.js 16** | Framework, routing, SSR, API routes | Yes |
| **Vite** (via Next.js) | Bundling (Next.js uses Turbopack/Webpack internally) | Implicit |
| **TypeScript 5** | Type safety | Yes |
| **ESLint 9** | Linting | Yes |
| **Tailwind CSS v4** | Styling | Yes |

### Additions needed

| Tool | Purpose | Decision |
|---|---|---|
| **Vitest** | Unit/integration testing (fast, Vite-native) | Add |
| **Playwright** | E2E testing | Add (Phase 10) |
| **gltf-transform** | Asset optimization CLI | Add when assets arrive |
| **KTX2 / Meshopt** | Texture & geometry compression | Add when assets arrive |

### Decision

**Keep existing Next.js + TypeScript stack. Add Vitest for testing.** No framework change. The game code lives under `/src/` (new) as a self-contained module imported by Next.js pages. This separates game engine code from Next.js app code.

---

## 8. Asset Sourcing

### Comparison

| Approach | Quality | Speed | Swappability | Cost |
|---|---|---|---|---|
| **Procedural placeholders first** | Low (geometric shapes) | Fastest | Perfect (by design) | Free |
| Premade assets (Kenney, Quaternius CC0) | Medium (low-poly) | Fast | Good | Free |
| Custom modeled | High | Very slow | Good | Expensive |
| AI-generated | Variable | Medium | Variable | Low |

### Decision

**Procedural placeholder-first with asset-registry interfaces.** All gameplay code depends on asset IDs and typed interfaces, never on specific models. Placeholders are built from Three.js primitives (boxes, cylinders, spheres) — the existing codebase already does this. Real assets (glTF) are swapped in later without touching game logic. CC0 assets from Kenney/Quaternius can supplement where useful.

---

## 9. Networking (Future — Architecture Only)

### Candidate approaches

| Approach | Latency | Complexity | Anti-cheat |
|---|---|---|---|
| **Authoritative server + command sync** | Medium | Medium | Strong |
| Peer-to-peer with host authority | Low | High | Weak |
| Lockstep deterministic | Low | Medium | Strong |

### Decision (architecture only, no implementation)

**Authoritative server model with command-sequence-number protocol.** The deterministic rules engine enables this: clients send commands, the server validates and applies them, broadcasts resulting events. The presentation layer replays events with animation. Late-joining clients fast-forward through the command log. This matches the spec's requirement and is the most robust approach for a turn-based game.

---

## Recommended Stack Summary

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js 16 + React 19 | Already in project; SSR, routing, API routes |
| **3D Renderer** | Three.js + React Three Fiber v9 | Already in project; WebGPU with auto WebGL2 fallback |
| **Physics (dice)** | Rapier3D-deterministic (WASM) | Cross-platform determinism; precompute-then-replay |
| **Animation** | Three.js AnimationMixer + custom state machine + custom sequencer | Skeletal blending + force-completable cinematics |
| **Procedural animation** | Custom spline/IK (snakes, ladders) | Dynamic body shapes, head tracking |
| **Game state** | Custom deterministic reducer (command → event) | Pure, serializable, testable, replay-ready |
| **UI state** | Zustand | Already in project; lightweight |
| **UI rendering** | React DOM overlay + drei Html | Accessible, responsive, existing pattern |
| **Styling** | Tailwind CSS v4 | Already in project |
| **Audio** | Howler.js + Three.js PositionalAudio | Simple SFX/music + spatial where needed |
| **Testing** | Vitest (unit/integration) + Playwright (E2E, later) | Fast, modern, TypeScript-native |
| **Asset format** | glTF 2.0 + Meshopt + KTX2 | Industry standard; fast decode |
| **Asset pipeline** | gltf-transform CLI | Automated compression/optimization |
| **TypeScript** | v5 (strict) | Already in project |
| **Linting** | ESLint 9 | Already in project |

---

## Top 10 Technical Risks

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | **Dice pre-simulation latency** — Rapier precomputation may take >16ms, causing frame drops during dice roll | High | Run precomputation in a Web Worker; cache multiple pre-simulated rolls at idle time |
| 2 | **Animation deadlocks** — snake/ladder cinematics stall and block the turn | High | Watchdog timers on every sequence; force-complete path always available |
| 3 | **Mobile GPU budget** — post-processing + animated snakes + particles exceed low-end mobile budgets | High | Quality tiers with aggressive fallbacks; particle caps; LOD; early profiling |
| 4 | **Camera occlusion** — 3D mountain board causes frequent camera-through-geometry issues | Medium | Collision/occlusion avoidance with raycasting; min-distance constraints; recovery path |
| 5 | **Skeletal animation pops** — blending between walk/idle/climb states causes T-poses or snapping | Medium | Strict crossfade durations; fallback poses; animation state machine guarantees |
| 6 | **Bundle size growth** — Rapier WASM + Howler + Three.js + React push initial load beyond 2s | Medium | Code-split Rapier to dice module; lazy-load audio; tree-shake Three.js |
| 7 | **Snake procedural body** — spline-driven snake body looks unnatural or clips through board | Medium | Iterative tuning with debug visualization; constraint-based body solver |
| 8 | **R3F + WebGPURenderer** — potential edge-case incompatibilities with existing postprocessing/drei helpers | Medium | Test early in Phase 1; keep WebGLRenderer as explicit fallback option |
| 9 | **Determinism across browsers** — JS floating-point inconsistencies break replay | Low | All game logic uses integer math where possible; Rapier-deterministic for physics |
| 10 | **Next.js SSR conflicts** — Three.js / Rapier WASM modules fail during server-side rendering | Low | Dynamic imports with `next/dynamic` and `ssr: false`; already solved in existing code |

---

## Sources

- Three.js WebGPURenderer: https://threejs.org/docs/, r160+ release notes
- React Three Fiber v9: https://docs.pmnd.rs/react-three-fiber
- Rapier3D deterministic: https://rapier.rs/docs/
- Howler.js: https://howlerjs.com/
- glTF ecosystem: https://gltf-transform.dev/
- WebGPU W3C status: W3C Candidate Recommendation (March 2026)
- Browser support: caniuse.com, MDN Web Docs
