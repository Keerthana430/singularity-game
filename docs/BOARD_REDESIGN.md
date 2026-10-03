# PHASE 3B: Terraced 3D Board Redesign (corrective phase)

This phase replaces the flat board from Phase 3. Follow `AGENTS.md` for workflow, structure and verification rules.
Do not start any later phase. Log this as "Phase 3B" in `/docs/PROGRESS.md`.

Reference images (view them before starting):
- `/docs/reference/current-problems.png`: what we have now (wrong).
- `/docs/reference/terraced-board-reference.png`: the structural target.
Use the reference for STRUCTURE ONLY (terraced elevation, ground-hugging snakes, leaning ladders, tall winding path).
Do not copy its art, characters, UI or assets. Everything must be original.

---

## 1. What is wrong with the current build

From the screenshot:
1. The board is one flat slab. There is no elevation, so it reads as a 2D grid with 3D tiles, not a 3D world.
2. Snakes are thick red tubes arcing high through the air. They cover tile numbers (e.g. 60-64, 92-100), cross each other, and look like pipes, not snakes.
3. The red snake color is the same as the red player pawn, so they are confusable.
4. Ladders are thin sticks lying flat on the board. They do not lean between two levels because there are no levels.
5. The camera is low and shallow, so rows overlap and numbers at the back are squashed and hard to read.
6. Snake/ladder paths ignore the board surface. They are free-floating splines, not routed over the terrain.
7. There is no environment around the board.

## 2. Target design

### 2.1 Terraced board
- The board is a stepped structure that rises toward tile 100. Each tile is a thick, beveled block with a visible top surface and visible side faces (platform walls).
- Tiles are grouped into terraces. Default: a new terrace every 2 rows (5 levels), step height about 0.6 tile units. Both values live in a config file.
- The numbering stays serpentine (1 at the start, 100 at the top).
- Between terraces, the path has a visible step or stair so movement up the board looks physical.
- Numbers are decals on the top face of each tile: high contrast, outlined, oriented for the main camera, never hidden by glow.

### 2.2 Layout is data, not a formula
- Introduce a `BoardLayout` data model: for each tile number, a 3D center position, surface height, size, and the facing direction toward the next tile. Mark tiles where the height changes ("step tiles").
- A generator builds the default terraced serpentine layout. The model must also accept a hand-authored layout (same data shape) so future boards can wind and branch freely.
- Everything else (movement, camera, snakes, ladders, characters) reads positions from `BoardLayout`. Nothing computes tile positions on its own.
- The rules engine must NOT know about layout. It only knows tile numbers.

### 2.3 Ladders
- One procedural ladder generator: input is start point and end point, output is two rails and evenly spaced rungs. No per-ladder hand modeling.
- The foot rests on the base tile surface at its edge. The top rests against the upper tile edge or wall.
- Length comes from the geometry. Allowed lean angle: roughly 55-80 degrees (config). Ladders lean along open edges and cliff faces. They never cross the number face of a tile.
- Expose the climb path (a polyline along the rails) for the future climb animation.

### 2.4 Snakes
- Slim, ground-conforming bodies. Body radius about 0.12-0.18 of a tile (config). No tall arcs in the air.
- A route solver builds the snake's centerline from head tile to tail tile by sampling surface heights along a smooth path, so the body lies on tiles and cliff faces. Only the head and the first part of the neck lift off the surface.
- Routing rules: smooth S-curves, a maximum curvature, no self-intersection, prefer tile edges and gaps over tile centers so numbers stay readable.
- Snake body colors must differ from every player color and from the board (suggest a palette separate from player colors, set in config).
- Keep the head as a distinct, readable shape (eyes, optional tongue) so the head tile is obvious. Idle animation is planned for Phase 4; only prepare anchors (head position, head direction, tail position) now.
- Expose the descent path (the route polyline) for the future bite cinematic.

### 2.5 Placement validator
Run it at load and in tests. It rejects or reports:
- snake and ladder paths that cross each other in projection
- a snake head and tail on the same tile or adjacent tiles
- ladders outside the allowed angle or length range
- snakes shorter or longer than allowed
- start/end tiles shared between two snakes/ladders
- any route that comes within a minimum distance of another route's endpoint
The default snake/ladder set is data and may be adapted to fit the geometry (keep roughly the classic count). Log any change in `DECISIONS.md`.

### 2.6 Camera
- Higher elevated 3/4 view (about 35-45 degrees elevation, 30-45 degrees yaw, configurable), not the current shallow angle.
- Frames the whole board at game start, then follows the active player, including vertical panning up the terraces.
- Must work for a tall board in portrait on phones.
- Keep the camera simple in this phase. Cinematic modes remain in Phase 5.

### 2.7 Movement over elevation
- The path follower reads `BoardLayout`. It keeps the character grounded on each tile's surface height, turns at corners using the facing direction, and plays a step-up (small hop arc) on step tiles.
- No floating, sinking or snapping.

### 2.8 Visual language
- Default theme follows the Master Context (neon futuristic arcade, restrained). Platform sides dark and material-rich, thin emissive edge accents, dark surroundings with a simple environment shape, not an empty void.
- Theme values (colors, materials) live in a theme config so another theme (for example jungle) could be swapped in later. Do NOT build a second theme now.
- Dice roll area: a flat, clearly visible tray or platform at the front of the board, so the dice never clip into terraces.

---

## 3. Tasks (in order)

A. `BoardLayout` model, terraced serpentine generator, validation, unit tests.
B. Tile meshes with thickness, sides, step pieces, number decals. Tile numbers readable from the main camera.
C. Camera: higher 3/4 view, full-board framing, vertical follow.
D. Ladder generator and meshes, climb path exposure.
E. Snake route solver and meshes, anchors (head, tail, path), new color palette.
F. Placement validator, then a default snake/ladder data set that passes it.
G. Movement updated for elevation (step tiles, grounding).
H. Verification with screenshots.

Keep every file within the structure rules in `AGENTS.md`. Suggested homes: `/src/board/layout`, `/src/board/tiles`, `/src/ladder`, `/src/snake/route`, `/src/movement`, `/src/camera`.

## 4. Exit criteria (all must be evidenced)

1. The board visibly has multiple elevation levels. A screenshot from the default camera shows terraces and side faces.
2. All 100 numbers are readable in a screenshot from the default camera on desktop size and on phone portrait size.
3. No snake covers more than about 25% of any number (measure in the layout test or by screenshot check) and no snake route crosses another route.
4. Every ladder touches the base tile surface at one end and the upper tile at the other (test: foot and top within tolerance), and its angle is within the allowed range.
5. Every snake route starts at the head tile and ends at the tail tile, stays on or just above the surface (test with sampled height), and has no self-intersection.
6. The placement validator passes on the default data and fails on deliberately broken test data.
7. A pawn walks tiles 1 to 100 without floating, sinking or snapping, including every step tile (automated test checks grounding at sampled points).
8. Snake colors do not match any player color.
9. The rules engine imports nothing from layout, rendering or camera (dependency check).
10. Build, tests and lint pass. `PROGRESS.md` and `DECISIONS.md` are updated, and the work is committed and tagged `phase-3b`.

For screenshot-based items, capture the screenshots with the browser tooling if available, save them under `/docs/screenshots/phase-3b/`, and cite the file names as evidence. If you cannot capture screenshots, say so and provide the equivalent automated checks.

## 5. Final response

Short summary only: what changed, which exit criteria pass or fail, and any decision that needs the user.
