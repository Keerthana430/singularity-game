# Character Prototype — Motion Phases

> **Location:** `public/character-prototype/`  
> **Architecture:** Standalone HTML + Three.js (CDN), Mixamo GLB models  
> **Controls:** WASD movement, Mouse combat, Spacebar block  
> **Style:** Low-poly stylized humanoid (can layer anime/cel-shading later)

Each phase below is a self-contained milestone. Work proceeds to the next phase **only after user approval**.

---

## Phase 1 — Idle Breathing Stance
**Goal:** Load a rigged 3D humanoid model into a lit scene with a looping idle/breathing animation.

- Set up `character-prototype/index.html` with Three.js scene, camera, renderer, lighting.
- Load a Mixamo-rigged GLB character model.
- Play a looping "idle" animation using `THREE.AnimationMixer`.
- Orbit camera so the user can inspect the character from all angles.
- Atmospheric arena floor + rim lighting.

**Exit criteria:** Character stands in a scene, breathing/shifting weight, user can orbit the camera.

---

## Phase 2 — Walking / Running
**Goal:** WASD movement with smooth walk/run blend.

- WASD input: W forward, S backward, A strafe-left, D strafe-right.
- Blend from idle → walk → run based on movement speed.
- Character mesh rotates to face movement direction.
- Camera follows the character (third-person).
- Smooth acceleration/deceleration (no instant start/stop).

**Exit criteria:** Character walks/runs around the arena smoothly with WASD. Camera follows.

---

## Phase 3 — Jump
**Goal:** Spacebar triggers a jump arc with animation.

- Spacebar launches a vertical arc (gravity-based parabola, not linear).
- Play a jump animation during ascent, a landing animation on descent.
- Prevent double-jump (grounded check).
- Movement is still possible mid-air (air control).

**Exit criteria:** Character jumps smoothly, lands cleanly, no floating or snapping.

> **Note:** Once combat phases begin, Spacebar will be reassigned to Block. Jump may move to a different key or be removed for the duel context.

---

## Phase 4 — Light Punch (Left Mouse Click)
**Goal:** Left-click triggers a fast jab animation.

- Play a quick punch animation on left-click.
- Animation has three phases: wind-up → strike → recovery.
- Cannot interrupt mid-animation (commitment window).
- Visual: fist/arm extends, snaps back.
- Spawn a small impact particle burst at the fist position during the strike frame.

**Exit criteria:** Left-click plays a snappy punch with particle effect. Character returns to idle after.

---

## Phase 5 — Heavy Strike (Right Mouse Click)
**Goal:** Right-click triggers a slow, powerful attack animation.

- Play a heavy swing/overhead strike on right-click.
- Longer wind-up (telegraphed), bigger follow-through.
- Larger, more dramatic particle burst on the strike frame.
- Camera shake on impact (subtle screen rumble).
- Longer recovery window than light punch.

**Exit criteria:** Right-click plays a visibly heavier, slower attack with camera shake and particles.

---

## Phase 6 — Block / Guard (Spacebar)
**Goal:** Hold spacebar to enter a blocking stance.

- Spacebar (hold) transitions to a blocking pose.
- Release returns to idle.
- Visual shield/guard effect (subtle glow or barrier around arms).
- Block animation blends smoothly from any state.

**Exit criteria:** Holding spacebar shows a clear defensive stance with visual feedback.

---

## Phase 7 — Dodge Left / Dodge Right (A / D during combat)
**Goal:** Quick sidestep evasion.

- When not moving (combat stance), A = dodge-roll left, D = dodge-roll right.
- Fast lateral displacement with a roll/sidestep animation.
- Brief invincibility window during the dodge.
- Short cooldown to prevent dodge-spam.

**Exit criteria:** A/D trigger clean sidestep animations with visible lateral movement.

---

## Phase 8 — Hit Reaction / Stagger
**Goal:** Character reacts physically when "hit".

- Trigger a stagger animation (head snaps back, torso twists, stumble).
- Slight knockback displacement in 3D space.
- Can be triggered manually via a debug key for testing (e.g., press H).
- Red flash or damage overlay on the character briefly.

**Exit criteria:** Pressing H plays a convincing hit-reaction with knockback.

---

## Phase 9 — Kick Attack
**Goal:** Add a secondary melee attack (kick).

- Mapped to a new input (e.g., middle-mouse or E key).
- Different animation from punch — sweeping leg motion.
- Own particle effect and timing.
- Distinct from light punch in speed, range, and recovery.

**Exit criteria:** New kick attack plays cleanly, distinct from the punch.

---

## Phase 10 — Death / Knockout Fall
**Goal:** Dramatic defeat animation.

- Triggered via debug key (e.g., press K).
- Character falls backward or slumps to the ground.
- Slow-motion effect during the fall (time scale reduction).
- Particle burst + screen flash on knockout.
- Character stays on the ground (no loop back to idle).

**Exit criteria:** Pressing K plays a dramatic, one-shot knockout animation.

---

## Future: Second Character + Duel Integration
After all 10 phases are approved:
1. Duplicate the character system for a second fighter.
2. Implement the rock-paper-scissors combat resolution (Quick beats Heavy, Block stops Quick, Heavy breaks Block, Dodge evades all).
3. Add HP bars, damage numbers, and win/lose conditions.
4. Integrate the complete duel system back into the main game.
