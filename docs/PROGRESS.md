# Progress Log

## Current State

- **Phases completed**: 0 (Technical Research & Technology Selection)
- **Current stack**: Next.js 16 / React 19 / React Three Fiber v9 / Three.js / Zustand / Tailwind CSS v4 / TypeScript 5
- **Planned additions**: Rapier3D-deterministic (dice), Howler.js (audio), Vitest (testing)
- **How to run**: `npm install && npm run dev` (frontend on :3000); backend: `cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8080`
- **How to test**: Not yet configured (Vitest to be added in Phase 1)
- **Open risks**: R3F + WebGPURenderer postprocessing compatibility untested; Rapier WASM Worker latency TBD; mobile GPU budget unverified
- **Next phase**: Phase 1 — Architecture & Project Foundations (system design doc, scaffold `/src/`, hello-triangle renderer boot)

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
