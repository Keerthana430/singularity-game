# 22-Phase Character Animation Plan (revised)

Source of truth for motion: the "Character Animation Reference" sheet (22 panels).
Rig: the existing procedural robot (Three.js groups used as bones).
Every number below was checked by rendering the pose on the same rig (side view and 3/4 view) before it went into this document. Where a value is a starting point to tune, it says so.

Follow `AGENTS.md`: one folder/file per feature, finish a phase, verify it, record it in `PROGRESS.md`, then continue.

---

## 0. What I changed in your plan, and why

| # | In your plan | Problem | Fix in this plan |
|---|---|---|---|
| 1 | Rule 2: "`rotation.x` negative = forward/up" for every bone | True only for bones that **hang down** (arms, legs, forearms, shins). For bones that **stand up** (chest, spine, neck, head) the sign is the opposite: positive x = lean/nod **forward** | Section 1.3 gives the sign for every bone |
| 2 | Block: upper arm x = -1.2, lower arm x = -2.5 | Forearm world angle = -1.2 + -2.5 = **-3.7 rad**, which is past vertical. The forearm points up **and backward**, so the glove goes behind the face and through the head. This is the bug you saw. Chest x = -0.3 also leans the body *back* | Forearm total must stay between -2.6 and -3.14. Block = upper -1.1, lower -1.95 (total -3.05), chest **+0.35** |
| 3 | Fighting stance: `LowerLeg.x = -0.5`, `UpperLeg.x = +0.5` | Inverted. In this rig a knee bends with lower leg **positive** and the thigh goes forward with upper leg **negative**. As written the knees bend the wrong way | Lead leg: upper -0.35 / lower +0.50. Rear leg: upper +0.30 / lower +0.60 |
| 4 | Run, accelerate, stagger, ground impact use chest x = -0.3 / -0.5 / -1.0 for "lean forward" | Same sign problem as #1, so the character leans backward | Forward lean is **positive** chest x |
| 5 | Jump: "airborne, extend legs straight" | The sheet shows a tuck at takeoff/apex and an extension only on the way down. Straight legs for the whole jump reads as a stiff hop | Five sub-phases: crouch, takeoff, rise-tuck, apex, fall-reach, landing |
| 6 | Jump physics from the prototype (v = 11.5, g = -28) | Peak height 2.4 units for a 1.8 unit character, 0.8 s in the air. Too floaty for a duel and it breaks the "jump over a low kick" timing | Combat jump: v = 8.2, g = -32 (peak 1.05, air time 0.51 s) |
| 7 | Idle breathing at 1.8 Hz | That is 108 breaths a minute, it looks like shivering | 0.35 to 0.5 Hz, amplitude 0.015 to 0.02 |
| 8 | Phase 13 "Punch follow-through" as its own animation | It is not a standalone clip. It is the recovery half of every punch | Kept as Phase 13 but defined as a shared **layer** applied to phases 9 to 12 and 14 |
| 9 | Phase 17 "Replaced by Matrix Dodge" | A knockdown still has to exist (HP 0, uppercut, sweep). The Matrix dodge belongs to Phase 21 | Phase 17 is a real launch/knockdown. Matrix lean is a dodge variant in Phase 21 |
| 10 | Phase 18: rotate the root group on X | The root pivots at the **feet**, so a tumble swings the body around the floor like a pendulum | Tumble pivots at the **hips** (centre of mass) through a pivot group |
| 11 | Phase 19: hips Y = -0.8, spine crumples forward | Hard-coded Y fights the foot solver, and the sheet shows the figure **thrown back and sliding on its back**, not folding forward | Lies on its back; hip height comes from the solver (section 2.4) |
| 12 | Phase 22: `UpperArm.z = ±3.0`, x = 0 | Close, but the sign must be mirrored per side and straight-up arms look stiff | V-shape: x -2.7, z ±0.5 (sides mirrored), chest slightly back, head up |
| 13 | Nothing about timing between joints | The sheet's "Animation Flow" strip is a **chain**: feet, legs, hips, torso, shoulder, elbow, follow-through, recoil. If all joints move at once it looks robotic | Joint lag table (section 2.6) |
| 14 | No limits on joint ranges | Clipping is fixed one pose at a time | Joint-limit table + an automatic validator (sections 1.5 and 2.8) |
| 15 | No rule for blending between phases | Pops and snaps when switching states | Blend table (section 2.5) and a transition matrix (section 2.2) |

Added phases around yours: **Phase 0 (foundation)** and **Phase 23 (integration and polish)**.

---

## 1. Rig contract (read before touching any phase)

### 1.1 Bones (names as in your code)
`hipsBone` > `spineBone` > `chestBone` > `neckBone` > `headBone`
`chestBone` > `lShoulderBone` / `rShoulderBone` > `lUpperArmBone` / `rUpperArmBone` > `lLowerArmBone` / `rLowerArmBone` > `lHandBone` / `rHandBone`
`hipsBone` > `lUpperLegBone` / `rUpperLegBone` > `lLowerLegBone` / `rLowerLegBone` > `lFootBone` / `rFootBone`

Short names used below: `hips, chest, head, lSh, lUA, lLA, lUL, lLL, lFt` (and `r…`). UA = upper arm, LA = lower arm (forearm), UL = upper leg (thigh), LL = lower leg (shin).

The character faces **+Z**. **L is the lead side** (x < 0, forward in the boxing stance), R is the rear side.

### 1.2 Euler order
Three.js default `XYZ` is correct. Read it as: the bone swings on X first, then twists on its own Y, then flares on its own Z. Do not change the order.

### 1.3 Sign table (verified in renders)

| Bone type | rotation.x | rotation.y | rotation.z |
|---|---|---|---|
| **Upper arm** (hangs down) | negative = arm swings **forward/up** (-1.57 = horizontal forward). positive = backward | twist along the bone, rarely needed | **L arm:** negative = out to the side and up, positive = across the body. **R arm: mirrored** (positive = out) |
| **Forearm** | negative = elbow **flexes** (forearm comes up/forward). Never positive | none | none |
| **Thigh** (hangs down) | negative = leg swings **forward**. positive = backward | rarely | L: negative = leg out to the side. R mirrored |
| **Shin** | positive = **knee bends** (foot goes behind). Never negative | none | none |
| **Foot** | see 1.4 | none | none |
| **Chest / spine** (stands up) | **positive = lean forward**, negative = lean back | positive = **L shoulder forward** (the boxing twist). negative = R shoulder forward | positive = top leans toward the L side. Turning toward the character's left leans with **negative** z |
| **Head / neck** | positive = nod/chin down, negative = look up | positive = look toward L | roll |
| **Hips** | positive = pelvis pitches forward | positive = L hip forward (legs follow the hips, so this staggers the feet) | roll |

Forearm world angle = `UA.x + LA.x`. The glove points straight up at -3.14 and forward-up at -2.6.

### 1.4 Foot flattening
To keep a sole flat on the floor: `foot.x = -(UL.x + LL.x)`. Add +0.08 for a slightly toes-up lead foot and +0.45 for a raised rear heel (boxing stance). Never leave foot x at 0 while the leg is bent, otherwise the foot tilts and clips.

### 1.5 Joint limits (clamp every frame, fail the validator if a keyframe breaks them)

| Joint | Min | Max |
|---|---|---|
| UA.x | -3.1 | +1.2 |
| UA.z (L) | -3.0 | +0.6 (R mirrored) |
| LA.x (elbow) | -2.6 | 0 |
| **UA.x + LA.x** | **-3.14** | 0.2 |
| UL.x | -1.6 | +1.0 |
| UL.z (L) | -0.7 | +0.15 (R mirrored) |
| LL.x (knee) | 0 | 2.3 |
| chest.x | -0.9 | +0.8 |
| chest.y | -1.3 | +1.3 |
| head.x | -1.1 | +0.5 |
| head.y | -1.2 | +1.2 |
| hips.x (pitch) | -1.55 | +0.6 |

### 1.6 Joint spheres (the "smooth deformation" on the sheet)
The sheet shows rounded joints with no hard edges. Your limbs are capsules, so add one sphere at each elbow, knee and hip with the same radius as the limb on that joint (about 0.055 to 0.065). This hides the gap when a joint bends and costs 6 meshes per character. Put it in the rig file, not in the animation code.

---

## 2. Animation engine rules (Phase 0)

### 2.1 Pose vector
Store each pose as one flat array of joint angles (about 38 numbers: hips pos x/y/z, hips rot xyz, chest xyz, head xyz, each shoulder, upper arm xyz, forearm x, thighs xyz, shins x, feet x, root yaw, root pitch). Reasons:
- blending any two poses is one loop (`out[i] = a[i] + (b[i] - a[i]) * t`)
- a keyframe lists **only the joints it changes**; the rest inherit from the stance pose, so a move is 30 lines of data, not 300
- the validator can check every pose the same way

### 2.2 State machine and priority

| State | Can be entered from | Can be interrupted by |
|---|---|---|
| `idle`, `stance`, `walk`, `run` (locomotion) | anything | everything below |
| `block` | locomotion | hit (flinch), dodge, release |
| `jump` (crouch, rise, fall, land) | locomotion | air attack, hit |
| `attack` (jab, cross, hook, uppercut, sweep) | locomotion, previous attack (chain window) | hit, dodge-cancel in recovery |
| `airAttack` (flying kick, dive kick) | jump | landing, hit |
| `dodge` | locomotion, attack recovery | nothing during i-frames, hit after them |
| `hit` / `stagger` | anything except i-frames and down | next hit |
| `launched` / `tumble` | hit with launch, HP 0 | landing |
| `down` > `getUp` | landing from launch, sweep | nothing (invulnerable) until up |
| `victory` | opponent KO | rematch |

Rule: **a higher row in damage priority always wins** (hit beats attack, down beats everything). Keep the table in one file (`stateTable`) so the agent never writes ad-hoc `if` chains.

### 2.3 Timing language
Every action has **startup** (anticipation), **active** (the only frames that can hit), **recovery** (cannot act, unless cancel rules say so). Times below are seconds at 60 fps.
Quality bar for each action: anticipation (a visible wind-up), a fast snap with an ease-out, a 1 to 3 frame hold, an overshoot, then a slower ease-in-out return. The easing set to implement: `lin`, `in` (cubic), `out` (cubic), `io` (cubic in-out), `snap` (quintic out).

### 2.4 Foot planting solver (do this once, it fixes most "floating feet" problems)
Do not hard-code hip height. Compute it from the legs every frame:

```
legDrop(UL.x, LL.x, UL.z) = (0.08 + 0.40*cos(hips.x + UL.x) + 0.38*cos(hips.x + UL.x + LL.x) + 0.045) * cos(UL.z)
hipsY = max(legDrop(left), legDrop(right))      // the lower foot defines the floor
```
Effects: bending the knees lowers the hips automatically, a lunging leg never pushes the other foot through the floor, a crouch is just "bend the knees". Blend this solver in/out with a weight (`gAmt`, moves toward 0 in the air and while lying down, 1 on the ground, speed about 22 per second) so there is no pop on take-off or landing.
Straight-legged standing height from this formula is about 0.905, not 0.95. Use the solved value everywhere.

### 2.5 Blending

| Switch | Blend time | Curve |
|---|---|---|
| any to attack | 0.05 s | io |
| attack to locomotion | 0.12 s | io |
| attack to attack (chain) | 0.05 s | io |
| to hit | 0.03 s | io (the hit must feel instant) |
| hit to locomotion | 0.12 s | io |
| to dodge | 0.04 s | io |
| to block / from block | 0.08 / 0.12 s | io |
| locomotion to jump crouch | 0.08 s | io |
| land to locomotion | 0.12 s | io |
| to down / from down | 0.05 s / handled by the get-up keys | none |

On a state switch, copy the **currently displayed pose** (not the last target) into `prev`, then interpolate `prev` to the new target. This is what removes snaps.

### 2.6 Joint lag (kinetic chain, from the "Animation flow" strip on the sheet)
Punches and kicks are **sequenced**, not simultaneous. When sampling a keyframe track, delay each joint group by its lag (seconds) on the way **in**, and use half the lag on the way back:

| Group | Lag in |
|---|---|
| feet / thigh push | 0.00 |
| shin / hips position (weight shift) | 0.015 |
| hips rotation | 0.03 |
| chest / spine rotation | 0.045 |
| shoulder | 0.055 |
| upper arm | 0.06 |
| forearm (elbow extension) | 0.075 |
| head | 0.05, and it **counter-rotates** to keep looking at the target |

Implementation: `sample(keys, t - lag[joint])` per joint, clamped to the track. This single change is what separates "robot arm" from "boxer".

### 2.7 Secondary motion (cheap, always on)
- Head lags the chest by 0.05 s and re-aims at the opponent (`head.y = -(hips.y + chest.y) + lookAt`).
- Shoulder pads follow the upper arm with a 0.04 s lag.
- Idle breathing and guard sway keep running under every state at 30% weight so the character never freezes.

### 2.8 Pose validator (build this in Phase 0, run it after every phase)
A test that, for every move keyframe and for every procedural generator sampled at 60 Hz over its full duration, asserts: all values inside the limit table (1.5); hand-to-chest distance never below 0.27 (so no hand passes through the torso); feet never below the floor after the solver; no value is NaN. A failing pose prints the move, time and joint. This replaces "ask the user to look and see if it clips".

### 2.9 Freeze-frame sheet (how to verify visually)
Add a debug hook: `setPose({state, id, time})` that sets the state, sets the clock to `time`, forces the blend complete, and updates once with dt = 0. Render a contact sheet of the key times listed under each phase, from the side and from a 3/4 view, and attach it to `PROGRESS.md`. Practical notes learned while doing this:
- wait at least 4 animation frames after setting the pose before the screenshot, or you capture the previous pose
- turn off afterimage/ghost effects and particles in the test
- set the ground-blend weight to its target value too, or lying/airborne poses sink into the floor in a frozen frame

### 2.10 Hit rules the animation depends on (so the visuals match the logic)
- A dodge makes the fighter untouchable from 0.03 s to 0.36 s. A dodge that is pressed so that the hit would land in the first 0.14 s of that window (up to 0.17 s) is a **parry** (the attacker staggers, 0.5 s slow-motion).
- A jump clears **low** attacks (sweep) once the feet are above 0.32, and does **not** clear punches.
- Hit-stop: freeze both fighters 0.05 s (jab), 0.07 (cross), 0.09 (hook), 0.12 (uppercut), 0.13 (sweep).

---

## Phase 0 Foundation (do first)
Deliver: pose vector, sampler with easing and per-joint lag, blend system, foot solver, joint limits plus clamp, validator, freeze-frame sheet, joint spheres, `stateTable`.
Done when: the sheet renders the rest pose and the stance pose with feet flat on the floor from both camera angles, and the validator passes on those two poses.

---

## Phase 1 Block / Guard (sheet 21: "Raise arms, Deflect")
**Status in your build:** broken. Fix first.
**Trigger:** hold `E` (alternatives: `Space` is taken by jump, so also `B`, and a block button on touch). **Exit:** release, 0.12 s.

| Joint | Stance | Block | Note |
|---|---|---|---|
| lUA | x -1.0, z +0.30 | x **-1.10**, z **+0.50** | elbow tucked, glove in front of the nose |
| lLA | x -1.95 | x **-1.95** | forearm total = -3.05, vertical |
| rUA | x -0.90, z -0.40 | x **-1.00**, z **-0.50** | |
| rLA | x -2.20 | x **-2.10** | total -3.10 |
| chest | x +0.12 | x **+0.35** | hunch **forward**, protects the ribs |
| head | x +0.12 | x **+0.25** | chin tucked behind the gloves |
| lUL / lLL | -0.35 / +0.50 | -0.45 / +0.75 | lower the stance |
| rUL / rLL | +0.30 / +0.60 | +0.35 / +0.80 | |

Motion: enter in 0.08 s with a tiny overshoot (arms 5% past, then settle in 0.06 s). While blocking, the character can shuffle at 50% speed.
**Block hit reaction (the "deflect"):** on an incoming hit add for 0.08 s then ease out over 0.12 s: UA.x +0.15 on both arms, chest.x +0.08, hips pushed back by 0.35 units, blue-white spark at the glove. Damage taken 30%.
**Do not:** let `UA.x + LA.x` go below -3.14. That was the bug.
**Sheet check (freeze times):** 0, 0.04, 0.08 (peak), flinch at +0.03 and +0.08. Front and side. No glove behind the head line.

---

## Phase 2 Idle (sheet 1: "Subtle breathing and arm sway")
**Status:** partly built. Refine.
- Breathing: chest scale y `1 + 0.018 * sin(2π * 0.4 t)`, scale x `1 - 0.006 * sin(...)`.
- Hips: sway z `0.008 * sin(2π * 0.25 t)`, vertical bob 0.006 at 0.4 Hz.
- Arms hang relaxed: UA.x `±0.04 * sin(2π * 0.35 t)` in opposite phase, forearm x -0.12, shoulder z breathing `±0.012`.
- Head: tiny roll `0.015 * sin(2π * 0.2 t)` and glance drift.
- Weight shift every 4 to 6 s: hips x offset 0.02 over 0.8 s, one knee relaxes 0.05 rad.
Sheet frames: inhale, neutral, exhale (three frames shown on the reference). Loop must be seamless: all frequencies are multiples of 0.05 Hz and phase 0 at t = 0.

## Phase 3 Fighting Stance (sheet 2: "Bend knees, balanced weight")
**Status:** built, signs wrong in the plan text. Use the verified numbers.

| Joint | Value |
|---|---|
| hips.y | +0.35 (staggers the feet, L foot forward) |
| chest | x +0.12, y +0.20 |
| head | x +0.12, y -0.50 (looks at the opponent through the twist) |
| lUA / lLA | x -1.00, z +0.30 / x -1.95 |
| rUA / rLA | x -0.90, z -0.40 / x -2.20 |
| lUL / lLL / lFt | x -0.35, z -0.06 / +0.50 / -0.15 |
| rUL / rLL / rFt | x +0.30, z +0.06 / +0.60 / -0.45 (heel raised) |

Hip height comes from the solver (about 0.12 lower than straight legs). Bounce: hips Y `±0.012 * sin(2π * 1 Hz)` while idle, plus `0.035 * |sin(step)|` while moving. The old prototype used 0.04 at 12 rad/s, which jitters; use the smaller values.
Enter: opponent within 6 units or after any attack (0.15 s blend). Leave: 2 s without an opponent in range (0.3 s blend to Phase 2).
Facing: turn toward the opponent at 12 rad/s while in stance.
Footwork while moving in stance: lead and rear legs alternate small steps `UL.x ±0.34 * speed01`, shin lifts `max(0, sin) * 0.45`, side steps open/close the stance with UL.z `±0.3 * cos`.

## Phase 4 Walk Cycle (sheet 3: "Heel to toe, natural arm swing")
**Status:** built. Add the heel-to-toe and foot-lock.
Five key frames on the sheet: contact, down, passing, up, contact.
- Phase advance: `phase += (speed / 0.84) * π * dt` (0.84 = stride length from a leg swing of ±0.55 on a 0.8 leg). This ties the feet to the ground speed, no sliding.
- Thigh `UL.x = ±0.55 sin(phase)`. Shin `LL.x = max(0, -sin(phase)) * 0.35` on the swinging leg.
- **Heel-to-toe:** `foot.x = -(UL.x + LL.x) + 0.35 * heelStrike - 0.55 * toeOff`, where heelStrike is 1 when the leg is at maximum forward reach and fades over the next 0.15 of a cycle, and toeOff is 1 at maximum rear reach.
- Hips bob `0.025 * |cos(phase)|` (lowest at contact, highest at passing). Hips sway z `0.03 * sin(phase)`. Chest counter-twist `0.04`. Head stabilised.
- Arms opposite to the legs: UA.x `∓0.45 sin(phase)`, forearm `-0.25 - 0.3 * |swing|`.
Backward walking: same cycle, reversed sign of `moveFwd`, speed 80%.

## Phase 5 Run Cycle (sheet 4: "Forward lean, opposite arm and leg motion")
**Status:** needs its own clip.
Verified peak stride (mirror it for the other half):

| Joint | Value (L leg forward) |
|---|---|
| chest.x | **+0.38** (forward) |
| head.x | -0.20 (keeps eyes up) |
| lUL / lLL | -0.95 / +0.35 (reaching) |
| rUL / rLL | +0.75 / +1.55 (heel kicked up behind) |
| lUA / lLA | **+0.60** / -1.60 (arm back, elbow 90 degrees) |
| rUA / rLA | -1.25 / -1.70 (arm forward) |
| rFt | +0.40 |

- Stride phase advance uses stride 1.4. Add a **flight phase**: for 0.08 s per step both feet are off the floor, hips rise 0.06 (turn the solver weight down to 0.5 during it).
- Run starts at speed above 4 (or while Shift is held): blend walk to run over 0.2 s.
- Counter-twist: chest.y `±0.12` opposite to the hips.

## Phase 6 Accelerate / Decelerate (sheet 5: "Build speed", "Slow down")
**Status:** new.
- Lean target from acceleration along the movement direction: `chest.x = 0.12 + 0.5 * clamp(accel / maxAccel, -1, 1)`, smoothed with a 0.12 s time constant. Accelerating: **positive** chest x, hips pushed forward (0.12), rear leg driving (UL.x +0.85, shin +0.9, foot -0.9), arms low and back (UA.x +0.2 to +0.3). Verified pose: chest +0.6, head -0.35.
- Decelerating: chest x **-0.18**, head +0.1, both feet reaching forward (lUL -0.75, rUL -0.40) with toes up (foot.x +0.6), arms spread for balance (UA.z ±0.5), hips pulled back 0.06. Hold for 0.15 s and ease out over 0.25 s.
- Stopping from a run adds one small hop-back step (0.1 s).

## Phase 7 Turn / Direction change (sheet 6: "Lean into turn, shift weight")
**Status:** new.
- `turnRate` = shortest angle difference to the target heading, per second.
- Lean into the turn: `chest.z = -clamp(turnRate * 0.12, -0.35, 0.35)` (negative for a turn toward +x, the character's left), `hips.z = chest.z * 0.35`. Head leads: `head.y` aims at the new heading 0.08 s before the body gets there.
- Inside foot pivots: inside thigh z `±0.1`, outside arm swings out (UA.z `±0.3`).
- 180 degree turns when stopped: three-step turn, 0.25 s, weight on the inside foot.
Verified lean pose: chest.z -0.28, hips.z -0.10, head.z +0.20.

## Phase 8 Jump (sheet 7: Crouch, Takeoff, Airborne, Apex, Landing)
**Status:** needs real joint logic.
Constants (combat): `JUMP_V = 8.2`, `GRAVITY = -32`, hang-time bonus at the apex (gravity x 0.7 while |vy| < 2).

| Sub-phase | Time | Pose (verified) |
|---|---|---|
| Crouch (compress) | 0.12 s before launch | chest.x +0.60, thighs -0.95 / -0.80, shins +1.90 / +1.80, feet -0.9, arms swung back (UA.x +0.55, z ±0.2, forearm -0.5). Hips drop through the solver |
| Takeoff (extend) | 0.08 s | legs straight (0.05 / 0.1), feet toes down (+0.5), arms **up** (UA.x -2.4, z ±0.35), chest.x -0.05 |
| Airborne, rising | until vy < 3 | tuck: thighs -1.2 / -0.8, shins +1.6 / +1.7, arms out (UA.x -1.2, z ∓0.5, forearm -1.2) |
| Apex (hang) | about 0.1 s | relaxed spread: arms out wide (UA.z ∓1.2), legs half-tucked (-0.5 / +0.1, shins 0.9 / 0.8) |
| Falling | until contact | reach: thighs -0.35 / +0.15, shins 0.2 / 0.25, arms forward-down |
| Landing (smooth) | 0.16 s squash then 0.12 s recover | chest.x +0.45, thighs -0.85 / -0.70, shins 1.7 / 1.6, arms forward (UA.x -0.7, z ∓0.5). Dust ring, land sound scaled by fall speed |

Blend the whole set from `vy`: `fall = smoothstep(-1, 5, -vy)` goes 0 (rising) to 1 (falling).
Jump is allowed from locomotion only, not during attack or hit. Buffer the press for 0.18 s.
Jump clears low attacks (see 2.10).

---

## Punches (Phases 9 to 12). Shared rules
- Each punch is a track of keyframes (table per punch) sampled with the **joint lag** from 2.6.
- Weight transfer: the hips move forward `+0.10 to +0.16` on the strike key and the planted foot pushes (rear heel up, `rFt -1.0`).
- Lunge: the root moves forward during the strike window (distances below) but stops at 0.9 units from the opponent.
- Chain: the next punch is accepted from the **chain** time. The sequence is Jab, Cross, Hook. A heavy press during a light chain becomes the Uppercut finisher.
- Dodge-cancel: allowed after the active window ends + 0.03 s.
- Hit test only inside the active window, once per move, from the opponent's real position and height (not from glove geometry, which is too jittery).

## Phase 9 Light Jab (sheet 8: "Quick extension, return")
Lead hand (L). Duration 0.38 s. Active 0.10 to 0.17. Chain from 0.20. Reach 1.6. Lunge 0.32 over 0.06 to 0.16. Damage 5, knockback 0.35, stun 0.30, hit-stop 0.05.

| Key (s) | Easing | Changes from stance |
|---|---|---|
| 0.00 | | stance |
| 0.06 | io | lUA.x -0.75, lLA.x -2.35 (glove pulled back), chest.y 0.00, chest.x 0.20, hips.z -0.03, rUL.x +0.38, head.x 0.16 |
| 0.12 | snap | lUA.x **-1.52**, z +0.04, lLA.x **-0.06** (fully extended), chest.y **+0.62**, chest.x 0.18, hips.z +0.10, lUL.x -0.62, lLL.x 0.35, rUL.x 0.18, rLL.x 0.50, head.x 0.06, head.y -0.72 |
| 0.19 | lin | hold, lLA.x -0.14 (the arm starts to give) |
| 0.30 | io | lUA.x -0.95, lLA.x -2.15, chest.y 0.30, hips.z 0.03 |
| 0.38 | io | stance |

The jab must read as a *snap*: wind-up 0.06, strike 0.06, hold 0.07, return 0.19. Never make the return as fast as the strike.

## Phase 10 Cross Punch (sheet 9: "Hip rotation, full extension")
Rear hand (R). Duration 0.50 s. Active 0.16 to 0.23. Chain 0.27. Reach 1.65. Lunge 0.40 over 0.10 to 0.21. Damage 7, knockback 0.6, stun 0.34, hit-stop 0.07.

| Key (s) | Easing | Changes |
|---|---|---|
| 0.09 | io | **hips.y +0.65** (loads the hip), chest.y -0.05, chest.x 0.20, rUA -0.60 (z -0.30), rLA -2.45, rUL +0.38, rLL +0.75, lUA -1.10 (z +0.40), head.x 0.16 |
| 0.17 | snap | **hips.y -0.30**, **chest.y -0.50**, chest.x 0.24, rUA **-1.52**, rLA **-0.05**, lUA -1.30 (z +0.55), lLA -2.40 (lead glove guards the chin), rUL +0.12, rLL +0.95, **rFt -1.0** (heel up, pivot), lUL -0.52, lLL +0.60, hips.z +0.15, head.y +0.25 |
| 0.26 | lin | hold |
| 0.40 | io | hips.y +0.10, chest.y 0, rUA -1.00, rLA -2.10 |
| 0.50 | io | stance |

The hip turns first (0.09 to 0.17 is mostly hips), the shoulder follows 0.04 later: that is the "hip rotation" caption on the sheet.

## Phase 11 Hook (sheet 10: "Torso rotation, elbow lead")
Lead hand (L), arm held in a rigid **L shape** and swung by the torso. Duration 0.58 s. Active 0.20 to 0.28. Chain 0.36. Reach 1.45. Damage 9, knockback 1.0, stun 0.46, hit-stop 0.09, camera shake 0.45.

| Key (s) | Easing | Changes |
|---|---|---|
| 0.13 | io | chest.y **-0.45** (wound back), hips.y +0.60, chest.x 0.22, **lUA.z -1.40** (elbow lifted to shoulder height), lUA.x -0.15, **lLA.x -1.70** (forearm bent about 90 degrees), lUL.x -0.40, rUL.x +0.28, rUA -1.00 (z -0.30), rLA -2.30, head.x 0.20 |
| 0.23 | snap | chest.y **+1.15** (swings through), hips.y -0.10, arm angles unchanged (the torso carries the arm), hips.z +0.12, lUL -0.52 / lLL 0.60, rUL 0.15 / rLL 0.90, rFt -1.0, head.y **-1.00** (head stays on target) |
| 0.31 | lin | hold |
| 0.46 | io | chest.y 0.50, hips.y 0.30, lUA.x -0.80, z +0.10, lLA.x -2.20 |
| 0.58 | io | stance |

Key point: **do not rotate the arm at the shoulder during the strike**. The elbow leads because the chest rotates 1.6 rad around the arm. In a side view it looks like an extended arm, from the front it is a clear hook.

## Phase 12 Uppercut (sheet 11: "Lift from legs, rotate torso")
Rear hand (R). Duration 0.70 s. Active 0.22 to 0.31. Chain 0.44. Reach 1.4. Launches the opponent (vy 4.4). Damage 13, knockback 1.15, stun 0.60, hit-stop 0.12, camera shake 0.6.

| Key (s) | Easing | Changes |
|---|---|---|
| 0.14 | io | **dip:** lUL.x -0.75, lLL +1.25, rUL +0.10, rLL +1.10 (hips sink through the solver), chest.x 0.40, chest.y -0.45, hips.y +0.55, rUA -0.10 (z -0.20), rLA -2.10 (glove low by the hip), lUA -1.30, lLA -2.30, head.x 0.25 |
| 0.23 | snap | **explode:** legs extend (lUL -0.40, lLL 0.55, rUL 0.0, rLL 0.30), **rFt -1.1** (up on the toe), hips.z +0.16, chest.x **-0.12** (torso arches up), chest.y **-0.70**, hips.y -0.30, rUA **-1.15**, rLA **-2.00** (forearm vertical, glove at chin height and rising), head.x -0.05 |
| 0.33 | lin | hold |
| 0.50 | io | chest.x 0.15, chest.y -0.10, rUA -1.00, rLA -2.10 |
| 0.70 | io | stance |

The power comes from the legs: the sheet caption says "lift from legs". Make the knee extension finish **before** the arm reaches its peak (lag table does this).

## Phase 13 Punch Follow-Through layer (sheet 12: "Extend, rotate, recoil")
**Status:** reworked as a layer shared by phases 9 to 12 and 14.
Four parts after the strike key:
1. **Hit-stop** (when the hit lands): freeze 0.05 to 0.12 s; add a 0.02 jitter to the victim.
2. **Overshoot:** for 0.04 s the forearm extends a further 0.08 rad and the chest keeps rotating 0.05 rad.
3. **Recoil in reverse order:** glove first, then elbow, shoulder, torso, hips (half the lag from 2.6). Duration 0.18 to 0.30 s depending on the move.
4. **Path rule (no clipping):** the forearm may only flex below -1.5 once the upper arm is back at x ≤ -0.9. Keep the elbow outside the ribs: lUA.z stays ≥ +0.15 on the way back (R mirrored). Verify with the validator's hand-to-chest distance.
Whiffed attack: same recoil but 30% longer and the body over-rotates by 0.08 rad (recovery is the price of missing).

---

## Phase 14 Jump Attack (sheet 13: "Launch, strike, land")
**Status:** built. Verify against this.
- **Flying kick** (punch button in the air): duration 0.50, active 0.06 to 0.36 (the whole airtime), reach 1.7, damage 8, knockback 0.9. Forward velocity 0.8 units over 0.03 to 0.25. Pose at 0.08: chest.x **-0.35** (lean back), rUL -1.45, rLL +0.12, rFt -0.40 (leg out straight), lUL -0.90, lLL 1.60 (tucked), arms out (lUA.x -0.4, z -0.9, rUA.x -0.2, z +0.9), head.x -0.10.
- **Dive kick** (heavy in the air): sets vy to -11, active 0.05 to 0.5, damage 11, knockdown. Pose: chest.x -0.55, rUL -0.85 / rLL 0.05, lUL -0.30 / lLL 1.00, arms out wide. The body falls at about 45 degrees.
- Landing: flying kick 0.14 s recovery, dive kick 0.28 s (it is punishable), dust ring and shake on contact with the floor.
- Only one air attack per jump.
Sheet: launch (jump pose), strike (extended leg), land (squash), three frames.

## Phase 15 Hit Reaction / Hurt (sheet 14: "Recoil, head snap")
**Status:** built. Make it **depend on the attack type** and on the direction.
Envelope: `env = smoothstep(0, 0.045, t) * (1 - smoothstep(0.28, 1, t / stun))` (instant snap in, slow ease out). Add a shake `sin(t * 55) * 0.04 * env` on chest.z and head.z.

| Attack | Pose added (x env) | Knockback | Stun |
|---|---|---|---|
| Jab | head.x -0.55, chest.x -0.30, hips.z -0.05, arms +0.25 | 0.35 | 0.30 |
| Cross | head.x -0.75, chest.x -0.55, chest.y ±0.35, arms +0.55 and out (z ∓0.5), thighs +0.30 / -0.25, shin +0.30 | 0.6 | 0.34 |
| Hook | **head.y ±1.15, head.z ±0.45** (the head snaps sideways), chest.y ±0.80, chest.z ±0.30, arms out and back, lead thigh out | 1.0 | 0.46 |
| Uppercut | head.x -1.05, chest.x -0.80, hips.x -0.20, arms flung up (UA.x -1.2, z ∓0.9), legs trail | 1.15 + launch | 0.60 |

Side sign: the head turns toward the direction the fist travelled. Knockback is a velocity impulse `distance * 6.5` with `exp(-6.5 t)` friction, so the distance is exactly what the table says. Flash the body red for 0.14 s, spark and ring at the contact point, floating damage number.

## Phase 16 Heavy Stagger (sheet 15: "Loss of balance")
Used after a parry, a blocked heavy, or a heavy hit that does not knock down. Duration 0.85 s.
Verified pose (x env):
- Arms thrown wide to catch balance: UA.x -0.30, **z ∓1.50**, forearm -0.50 (your plan had UA.x +1.0; arms go **out and up**, not behind)
- chest.x **-0.45**, head.x -0.30, hips.z -0.08, shins +0.45 / +0.35, thigh L +0.30
- chest.y wobble `sin(t * 14) * 0.12`
- Slides back 2.2 units with friction.
Recovers with a small hop to stance in the last 0.15 s.

## Phase 17 Knockdown / Launch (sheet 16: "Thrown back, in air")
Triggers: uppercut, dive kick, sweep kick, HP reaches 0, any hit on an airborne fighter.
- **Launch (uppercut):** vy 4.4, backward velocity. Pose while airborne: hips.x -0.35 to -0.85 as vy falls, chest.x -0.70, head.x -0.90, arms thrown up (UA.x -2.0, z ∓0.8, forearm +0.5), thighs +0.5 to 0, shins 0.8 / 0.9.
- **Sweep knockdown:** the legs are taken out: hips lift 0.28 and pitch -0.35 for the first 0.3 s of the fall (feet up), then lands on the back.
- **KO:** same as launch with vy 7 and knockback 3, slow-motion 0.22 for 1.3 s, camera shake 1.0, and then it stays down.
- Untouchable while launched (prevents infinite juggles).

## Phase 18 Airborne Tumble (sheet 17: "Rotate, control, land")
Only for KO or large launches (air time above 0.5 s).
- **Pivot at the hips**: add a `tumblePivot` group that contains the whole body, with the pivot at hip height. Rotating the root around the feet is what makes it look like a pendulum.
- Rotation: `pitch = -2π * ease_io(clamp(t / (airTime * 0.8), 0, 1))` for a backflip (one rotation). Tuck the arms and legs while rotating (arms to chest, thighs -1.2, shins 1.7).
- **Control**: in the last 25% of the air time, spread arms (UA.z ∓1.0) and extend legs to prepare the landing.
- Landing: if pitch is within 0.5 rad of a multiple of 2π, land in a crouch (Phase 8 landing) with a slide; otherwise go to Phase 19.

## Phase 19 Ground Impact (sheet 18: "Hit, slide, stop")
- Falls on the **back**: hips.x pitches to **-1.45** over 0.30 s with an `in` curve (accelerating), a 0.05 bounce at contact (0.16 s), chest.x -0.12, head.x +0.25 (head hits the floor), arms flung out (UA z ∓1.0), legs slightly bent apart (thighs -0.25 / -0.10, shins 0.25 / 0.35, thigh z ∓0.12).
- Hip height is not hard-coded: set the ground-blend weight to 0 and use hips Y offset -0.77 relative to the base so the pelvis rests at 0.18.
- Slide: velocity decays `exp(-5.5 t)`, dust particles and a floor ring at the impact, thud sound scaled by impact speed, shake 0.4.
- Lie time: 0.6 s (0.75 for sweep), infinite on KO.
Sheet frames: contact (0.15), mid-fall, lying (0.6). Verified in render.

## Phase 20 Get Up Recovery (sheet 19: "Push, rise, reset")
Duration 0.60 s after the lie time. Invulnerable during it and for 0.4 s after.
1. **Push (0 to 0.25):** roll to the side and plant the hands: hips.x -1.45 to -0.15, chest.x curls to +0.55, hips offset up from -0.77 to -0.34.
2. **Kneel (0.25 to 0.45) verified pose:** hips.x -0.15, hips Y -0.34, chest.x 0.55, chest.y 0.2, thighs -1.0 / -0.1, shins 2.2 / 2.0, feet -0.2 / -0.5, arms low (UA.x -0.7 / -0.5, forearms -1.2).
3. **Rise (0.45 to 0.60):** ease-in-out to the stance pose, and turn the head to the opponent first.
Never skip the kneel: standing straight up from lying looks like a puppet.

## Phase 21 Dodge Left / Right (sheet 20: "Fast lateral movement")
**Status:** Matrix backward dodge is built. Add the lateral dodge, keep the Matrix lean as a variant.
Timing: duration 0.52 s, **untouchable 0.03 to 0.36**, parry window 0.03 to 0.17, cooldown 0.85 s, travel 1.7 units over 0.32 s with velocity `3 * dist / T * (1 - u)^2` (fast start, soft stop), afterimage every 0.055 s for the first 0.3 s.
Direction from input: backward key = backstep, A or D = that side, no direction = alternate sides. Keep it inside the ring (flip the side if it would leave the arena).

| Variant | Pose at peak (env = smoothstep(0, 0.1, t) * (1 - smoothstep(0.3, 0.52, t))) |
|---|---|
| **Side step** (left or right, s = ±1) | chest.z `-s * 0.60`, hips.z `-s * 0.20`, head.z `+s * 0.40` (head stays upright), chest.x +0.22, chest.y `-s * 0.25`, both thighs z `s * 0.50`, shins +0.5 and thighs -0.25 at the dip, hips dip 0.10, hands tight (UA.x -0.15) |
| **Backstep** | chest.x -0.45, head.x -0.20, hips.z -0.12, thighs +0.35, shins +0.30 / +0.20, arms back +0.30 |
| **Matrix lean** (optional, only when no travel is possible) | hips.x -0.6, chest.x -0.9, knees bent, arms out, 0.5 s |

Parry: if the incoming hit lands inside 0.03 to 0.17, show PARRY, ring flash, attacker goes to Heavy Stagger (Phase 16), the defender gets a counter bonus (x1.5 damage for 1.6 s) and the game runs at 0.28 speed for 0.5 s.

---

## Phase 22 Victory Pose (sheet 22: "Celebrate, pose")
- Arms up in a V: UA.x **-2.7**, UA.z **±0.5** (mirrored per side), forearm -0.4 to -0.7 pumping, chest.x -0.15, head.x -0.2 (looking up), hips.y 0, thighs near neutral.
- Little hop: `hipsY += 0.05 * |sin(5 t)|`, forearm pump `-0.4 - 0.3 * |sin(5 t)|`, loops until rematch.
- Start 1.7 s after KO, blend 0.2 s. Camera slowly orbits for 3 s.
- Optional fist-pump variant: one arm straight up, the other on the hip.

---

## Phase 23 Integration and polish (after all 22)
1. Run the validator over everything and fix any value out of range.
2. Connect all states through the transition table in 2.2; every row must have a test.
3. Frame-data table in `moves.config` (startup, active, recovery, damage, knockback, stun, hit-stop, shake) so balance changes never touch animation code.
4. Audio and effects hooks per phase: whoosh at active start minus 0.03, impact on hit, dodge swish, parry ring, land thud, KO.
5. Performance: no per-frame allocation in the pose code (reuse the arrays), one geometry per limb shape, shadows from one light.
6. Camera: auto-frame both fighters, middle-mouse or arrow keys to orbit, FOV punch on heavy hits (+4 to +8 degrees decaying in 0.15 s).
7. Final contact sheets for every phase in `/docs/screenshots/animation/`.

## Controls to wire (as you asked)
- **Left click / J / F:** light punch (Jab, Cross, Hook chain)
- **Right click / K / G:** heavy (Uppercut after a punch, otherwise low Sweep Kick; in the air: Dive Kick)
- **Space / L:** jump
- **Q / Shift / H:** dodge or parry
- **E / B (hold):** block
- **W A S D:** move. Camera: middle mouse drag or arrow keys (right click is now an attack)

## Suggested order of work (each step ends with the validator and a contact sheet)
0 Foundation, 1 Block, 3 Stance, 2 Idle, 4 Walk, 8 Jump, 9 Jab, 10 Cross, 11 Hook, 13 Follow-through layer, 12 Uppercut, 21 Dodge, 15 Hit reaction, 16 Stagger, 17 Knockdown, 19 Ground impact, 20 Get up, 18 Tumble, 14 Jump attack, 5 Run, 6 Accel/decel, 7 Turn, 22 Victory, 23 Polish.
This order gets a playable fight (stance, punches, dodge, hit, knockdown, get up) by the 16th item and leaves the exploration-only motions for the end.
