# PROJECT RULEBOOK: 3D Snakes & Ladders (browser game)

These rules apply to every task in this project. Read this file at the start of every session and every phase.

## 1. Sources of truth

| File | Purpose | Who edits |
|---|---|---|
| `/docs/PHASES.md` | Master Context + Phases 0-11 (the spec) | Never edit |
| `/docs/PROGRESS.md` | Running log of work done | Agent, after every phase |
| `/docs/ARCHITECTURE.md` | System design | Agent (created in Phase 1) |
| `/docs/DECISIONS.md` | Numbered technical decisions (context, options, choice, consequences) | Agent |

Re-read the relevant files at the start of each phase. Do not rely on memory.
If a file in `/docs` is missing, create it. If the spec and the code disagree, the spec wins unless a logged decision says otherwise.

## 2. Phase workflow

1. **Read**: Master Context, the current phase in `PHASES.md`, the top "Current State" section and the latest phase entry of `PROGRESS.md`, plus `ARCHITECTURE.md` and `DECISIONS.md`.
2. **Scope**: work only on the current phase. Never start work belonging to a later phase. If something from a later phase is needed, stub it behind an interface and log it.
3. **Build**: follow the code structure rules (section 3) and quality rules (section 4).
4. **Verify (evidence required)**:
   - Run the build, the tests and the linter. Fix failures. Never mark anything PASS without running it.
   - Re-read the phase's requirements and Exit Criteria line by line.
   - For each item record PASS / FAIL / PARTIAL with evidence (file path, test name, command output or measured value).
   - Fix every FAIL/PARTIAL you can, then re-verify. Report what remains.
5. **Record**: update `PROGRESS.md` (format in section 6) and `DECISIONS.md`.
6. **Checkpoint**: make a git commit for the phase (message `phase N: <name>`) and tag it `phase-N`. If git is unavailable, say so.
7. **Stop**: do not begin the next phase until the user says "next phase".
8. **Final response**: a short summary only: what is done, what failed, what is deferred, and any decision that needs the user. No long recaps.

## 3. Code structure rules

- One feature per folder, one clear responsibility per file. No god files.
- **Split by responsibility, not by line count.** A file should have one reason to change.
- Size guidance: aim for ~150-300 lines. Up to ~400 is fine for one cohesive unit. Above 400, split it or justify it in `PROGRESS.md`. Never split a cohesive file only to hit a number.
- Do not create files under ~30 lines unless they are config, types or a folder entry point. Keep small related functions together.
- Create folders only when they hold real code. No empty placeholder folders.
- Each feature folder exposes one public entry (`index.ts`). Other modules import only from that entry, never from its internals.
- Shared helpers go in `/src/shared`. Tunable values go in a per-feature config file (e.g. `ladder.config.ts`). No magic numbers in logic.
- Every file starts with a one-line comment stating its purpose.
- Name files by what they do (`snakeBiteSequence.ts`, `ladderClimbPath.ts`). Never `utils.ts`, `helpers.ts` or `misc.ts`.
- Tests sit next to the code (`*.test.ts`). Cross-module tests go in `/tests`.
- Debug code lives in `/src/debug` and must be fully removable from production builds.
- No dead code or commented-out blocks. Any TODO must be logged in `PROGRESS.md`.

### Layer and dependency rules

Allowed import direction (a layer may import only from layers below it):

```
ui / input
   v
presentation (rendering, board, dice, characters, snake, ladder, movement,
              animation, camera, environment, effects, audio)
   v
state (commands, events, serialization)
   v
rules (pure logic)
   v
shared
```

- `rules` and `state` must never import rendering, animation, camera, audio, UI or browser APIs.
- Presentation reacts to domain events. It never decides or changes game outcomes.
- Features in the presentation layer talk through events or interfaces, not by reaching into each other's internals.
- Enforce this with a lint rule or dependency check where tooling allows.

### Target layout (grow into it; do not scaffold empty folders)

```
/docs
/src
  /core         bootstrap, game loop, event bus, config
  /rules        pure Snakes & Ladders logic
  /state        state, commands, events, serialization, replay
  /rendering    renderer, quality tiers, post-processing, materials, lighting
  /board        3D board, tiles, numbers, tile coordinate mapping
  /dice         dice model, throw choreography, result steering
  /characters   one folder per character (model, identity, animation states)
  /movement     path building, path following, turning, grounding
  /snake        model, body spline, idle, head tracking, bite sequence, descent
  /ladder       model, logic, climb path, climb animation
  /animation    sequencer, state machines, blending, watchdogs
  /camera       rigs, modes/, framing, occlusion, blending
  /environment  arena and decoration
  /effects      one file per effect
  /audio        buses, music, sfx, spatial
  /ui           screens/ (one folder per screen), hud/, components/, theme/
  /input        mouse, keyboard, touch, gamepad
  /assets       registry, loaders, fallbacks, manifests
  /networking   future protocol layer
  /debug        inspectors and overlays
  /shared       math, types, utilities
/tests          integration, e2e, visual regression, fuzz/soak
/public         static assets
```

If a feature does not fit, create a properly named folder and document it in `ARCHITECTURE.md`.

## 4. Quality rules

**Determinism**
- No `Math.random()`, `Date.now()` or `performance.now()` inside `rules` or `state`. Use the seeded RNG and injected time.
- Game outcomes are decided by the rules engine before any animation plays. Animation only presents results.
- Animations are driven by elapsed time (delta), never by frame count.

**Reliability**
- Every animation, sequence and camera transition has a max-duration watchdog and a force-complete-to-final-state path.
- Validate game state every turn. Guard against NaN/undefined transforms.
- Missing or failed assets fall back to placeholders and never block gameplay.
- Log errors with the module name so any bug traces to one file.

**Performance**
- Dispose GPU resources (geometries, materials, textures, render targets) when objects are removed.
- No per-frame allocations in hot paths (reuse vectors/matrices).
- Respect the budgets set in `ARCHITECTURE.md`. Gameplay must be identical across quality tiers.

**Assets**
- Gameplay code depends on asset interfaces/ids, never on a specific model. Placeholders must be swappable without touching logic.

**Dependencies**
- Do not add a library without logging a decision in `DECISIONS.md` (why, alternatives, size/performance impact).

**Ambiguity**
- If a requirement is unclear, make a reasonable assumption, record it in `PROGRESS.md`, and continue. Only stop to ask the user when blocked or when a choice is costly to reverse.

## 5. Before ending any phase, confirm

- Build, tests and lint pass (include the output summary).
- No file over ~400 lines without a logged justification.
- Every feature has its own folder and entry point.
- Dependency directions respect section 3.
- No empty folders, dead code or unlogged TODOs.
- `PROGRESS.md` and `DECISIONS.md` are updated and the phase is committed and tagged.

## 6. PROGRESS.md format

Keep a **"Current State"** section at the top, rewritten after each phase (max ~15 lines):
phases completed, current stack, how to run/test/build, open risks, next phase.

Then append one entry per phase:

```
## Phase N: <name>  (date)
- Built: ...
- Files created/changed: (grouped by folder)
- Decisions and assumptions: ...
- Deviations from spec: ...
- Exit criteria: <item> - PASS/FAIL/PARTIAL - <evidence>
- Known issues: ...
- Deferred: ...
```

Keep entries concise. Do not paste code into the log.
