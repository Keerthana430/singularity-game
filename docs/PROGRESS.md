# Progress Log

## Current State

- **Phases completed**: 1 (Architecture & Project Foundations)
- **Current stack**: Next.js 16 / React 19 / React Three Fiber v9 / Three.js / Zustand / Tailwind CSS v4 / TypeScript 5 / Vitest
- **Planned additions**: Rapier3D-deterministic (dice), Howler.js (audio)
- **How to run**: `npm install && npm run dev` (frontend on :3000); test renderer at `/test-render`
- **How to test**: `npm run test` (Vitest configured for jsdom)
- **Open risks**: R3F + WebGPURenderer postprocessing compatibility untested; Rapier WASM Worker latency TBD; mobile GPU budget unverified
- **Next phase**: Phase 2 — Game Rules Engine & State (board definition, purely deterministic rules)

---

## Phase 1: Architecture & Project Foundations (2026-10-03)

- **Built**: `ARCHITECTURE.md` complete system design; Vitest integration; `/src/` scaffolding (types, math, rules skeleton, event bus, game loop); `/app/test-render` Hello Triangle.
- **Files created/changed**:
  - `/docs/ARCHITECTURE.md` — 15 sections including diagrams, typed interfaces, and layer rules.
  - `/src/shared/types.ts`, `/src/shared/mathUtils.ts`, `/src/shared/index.ts` — zero-dependency foundations.
  - `/src/state/gameState.ts`, `/src/state/commandTypes.ts`, `/src/state/eventTypes.ts`, `/src/state/index.ts` — state definitions.
  - `/src/rules/gameReducer.ts`, `/src/rules/index.ts` — pure deterministic rules skeleton.
  - `/src/core/eventBus.ts`, `/src/core/gameLoop.ts`, `/src/core/index.ts` — communication and loop.
  - `vitest.config.ts`, `vitest.setup.ts`, `package.json` — test runner setup.
  - `/tests/mathUtils.test.ts` — passing math tests.
  - `/src/rendering/HelloTriangle.tsx`, `/app/test-render/page.tsx` — WebGPU/WebGL rendering proof.
- **Decisions and assumptions**:
  - Use `vite-tsconfig-paths` to resolve Next.js `@/` aliases in Vitest.
  - Create a dedicated `/test-render` route instead of modifying the existing `page.tsx` landing page.
- **Deviations from spec**: None.
- **Exit criteria**:
  - architecture doc is complete and internally consistent — **PASS** — covers 15 requested areas.
  - project builds and runs — **PASS** — `npm run build` succeeds, tests pass.
  - no module depends on a module it shouldn't (document the allowed dependency directions) — **PASS** — Layer rules documented in ARCHITECTURE.md §1; implemented scaffolding strictly adheres (shared imports nothing, state imports shared, rules imports shared/state, core imports all).
- **Known issues**: The existing `lib/__tests__/battleEngine.test.ts` (not part of this scope) is poorly structured for Vitest, but core math tests pass.
- **Deferred**: Game logic implementation (Phase 2), 3D assets (Phase 3+).

---

## Phase 0: Technical Research & Technology Selection  (2026-10-03)

- **Built**: Research document, Architecture Decision Records, stack recommendation, risk assessment
- **Files created/changed**:
  - `/docs/RESEARCH.md` — comparison tables for all 9 decision areas + recommended stack + top 10 risks
  - `/docs/DECISIONS.md` — 11 numbered ADRs (ADR-001 through ADR-011)
  - `/docs/PROGRESS.md` — this file
- **Decisions and assumptions**:
  - Keep existing Three.js/R3F/Zustand/Next.js stack (ADR-001, ADR-005)
  - Use WebGPURenderer with automatic WebGL2 fallback (ADR-002)
  - Rapier3D-deterministic for dice precompute-then-replay in Web Worker (ADR-003)
  - Custom animation state machine + sequencer with watchdogs (ADR-004)
  - Custom deterministic reducer for game rules, Zustand for UI only (ADR-005)
  - Hybrid DOM + drei Html for UI (ADR-006)
  - Howler.js + Three.js PositionalAudio for audio (ADR-007)
  - Vitest for testing, Playwright deferred to Phase 10 (ADR-008)
  - Meshopt + KTX2 for assets, procedural placeholders first (ADR-009, ADR-010)
  - Authoritative server networking architecture for future (ADR-011)
- **Deviations from spec**: None. Phase 0 is research-only, no game code written.
- **Exit criteria**:
  - Every decision has a justified choice — **PASS** — all 9 areas in RESEARCH.md with comparison tables, all 11 ADRs in DECISIONS.md
  - Fallback plan for WebGPU/WebGL2 exists — **PASS** — ADR-002: WebGPURenderer auto-fallback, documented in RESEARCH.md §1
  - No technology chosen merely because it is popular — **PASS** — each choice justified by existing codebase investment, specific technical requirements, or measured tradeoffs (e.g., Rapier chosen over keyframe for visual variety; XState rejected despite popularity for being overkill)
- **Known issues**: None
- **Deferred**: All implementation deferred to Phase 1+
