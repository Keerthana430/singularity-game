IMPLEMENT THE COMPLETE DUEL SYSTEM INTO MY EXISTING PROJECT

IMPORTANT:
This is an implementation task, not a redesign task.

You must first inspect the ENTIRE existing project/codebase and understand the current:
- board generation
- tile movement
- player/character objects
- snake and ladder system
- dice/turn system
- collision detection
- animation system
- camera system
- HUD/UI
- game-state management
- AI/player handling
- existing attack/defense functions
- existing particle/effect system

Do NOT throw away the current project and rebuild it from scratch.

The project already contains the game logic, board logic, animations, tile movement, snakes, ladders, and much of the duel-related logic. Your job is to INTEGRATE, COMPLETE, CONNECT, and FIX the duel system inside the existing architecture.

==================================================
1. MAIN GOAL
==================================================

Turn the existing board game into a playable game with a complete DUEL SYSTEM.

A duel must automatically occur when the existing collision rules determine that two opposing players occupy or collide on the same tile and the current game rules require a duel.

The duel should feel like a small real-time combat sequence inside the board game.

The final system must support:

1. Human vs AI
2. Human vs Human / friends mode where supported by the current project
3. Multiple AI difficulty levels
4. Automatic AI turns
5. Real-time duel move selection
6. Attack / heavy attack / dodge / block
7. Damage calculation
8. Counter relationships
9. HP bars
10. Damage popups
11. Attack animations
12. Dodge animations
13. Block animations
14. Hit reactions
15. Knockback
16. Sparks/particles
17. Duel camera framing
18. KO animation
19. Victory animation
20. Loser retreat
21. Winner advance
22. Snake/ladder handling after duel resolution
23. Collision chaining protection
24. Proper turn continuation
25. Complete reset back into normal board gameplay

==================================================
2. DO NOT REDESIGN THE BOARD
==================================================

Do not redesign:
- board
- tile layout
- numbers
- pillar
- snakes
- ladders
- background
- player models
- existing camera style
- existing movement style

The duel should be integrated INTO the current game.

The duel is a gameplay layer, not a replacement for the board game.

==================================================
3. ADD DUEL / GAME MODE SELECTION
==================================================

Create or complete a mode-selection overlay before starting the game.

Modes:

A. PLAY VS AI
B. PLAY WITH FRIENDS / HUMAN PLAYERS

For AI mode provide difficulty selection:

- EASY
- NORMAL
- HARD

Use the existing UI style and visual language of the project.

Do not create a completely different UI.

Add clear buttons.

Example:

PLAY MODE

[ VS AI ]
[ FRIENDS ]

If VS AI:

DIFFICULTY

[ EASY ]
[ NORMAL ]
[ HARD ]

Then allow player count selection using the existing player-count logic.

AI characters should have clear labels such as:

YOU
AI - EASY
AI - NORMAL
AI - HARD

Do not hard-code the player count if the current project already supports dynamic player counts.

Reuse the existing new-game initialization flow.

==================================================
4. DUEL TRIGGER LOGIC
==================================================

Use the CURRENT board collision system.

A duel should trigger when opposing players resolve onto the same tile according to the existing collision rules.

Do NOT trigger repeated duels from the same collision endlessly.

Create a reliable duel state such as:

NORMAL_GAME
MOVING
CHECKING_TILE
DUEL_PENDING
DUEL_ACTIVE
DUEL_RESOLVING
DUEL_VICTORY
RETREATING
ADVANCING
SNAKE_RESOLUTION
LADDER_RESOLUTION
TURN_END

The exact implementation can follow the current architecture, but the state transitions must be explicit and safe.

During DUEL_ACTIVE:
- normal board movement must stop
- dice input must be disabled
- snake/ladder movement must be disabled
- normal turn advancement must pause
- only duel inputs are accepted

==================================================
5. DUEL PLAYERS
==================================================

When a duel starts:

1. Identify attacker/challenger.
2. Identify defender/opponent.
3. Save their original board positions.
4. Store references to both characters.
5. Place them in the duel arena.
6. Face them toward each other.
7. Store their initial duel HP.
8. Initialize duel state.
9. Initialize round number.
10. Initialize move history if the existing system uses it.
11. Start duel camera framing.
12. Display duel UI.

Default HP may be 100 unless the project already has a configurable value.

Do not permanently move their board positions merely because of duel animation.

The duel arena position is temporary.

==================================================
6. PLAYER CONTROLS
==================================================

FINAL PLAYER CONTROLS:

LEFT MOUSE BUTTON:
Normal Attack

RIGHT MOUSE BUTTON:
Heavy Attack

A:
Dodge Left

D:
Dodge Right

SPACE:
Block

Implement these controls directly into the duel state.

LMB:
- trigger normal attack
- use existing normal attack animation
- use existing attack timing
- use existing hit detection
- use existing damage value if already defined

RMB:
- trigger heavy attack
- slower wind-up
- stronger impact
- use existing heavy attack animation/logic if available

A:
- dodge left
- use existing dodge pose/movement
- temporary invulnerability if that already exists in the combat rules

D:
- dodge right
- same logic as above

SPACE:
- block/guard
- use existing block pose
- use existing block-vs-attack resolution

Do NOT fire attacks every frame when the mouse button is held.

One click = one action.

Prevent duplicate input events.

Prevent actions during another locked animation phase unless the current duel design explicitly allows it.

==================================================
7. DUEL ROUND STRUCTURE
==================================================

A duel consists of sequential combat exchanges.

Suggested sequence:

DUEL START
↓
PLAYER/AI CHOOSES MOVE
↓
OPPONENT CHOOSES MOVE
↓
LOCK BOTH MOVES
↓
PLAY ATTACK / DEFENSE ANIMATIONS
↓
RESOLVE MATCHUP
↓
APPLY DAMAGE / MISS / BLOCK / DODGE
↓
PLAY HIT REACTION
↓
UPDATE HP
↓
SHOW DAMAGE POPUP
↓
SPARK PARTICLES
↓
RESET POSES
↓
CHECK KO
↓
If no KO → next round
↓
If KO → resolve winner

The exact timing should use the existing tween/animation architecture.

==================================================
8. MOVE TYPES
==================================================

The duel must support exactly these combat categories:

NORMAL ATTACK
HEAVY ATTACK
DODGE
BLOCK

Do not invent random additional moves.

Each move must have:
- identifier
- animation
- timing
- damage
- hit/counter relationship
- visual effect
- recovery/reset

Centralize the matchup logic in ONE resolution system rather than scattering conditions across many functions.

Example:

resolveDuelMove(playerMove, enemyMove)

or equivalent according to current code architecture.

==================================================
9. MOVE RESOLUTION / COUNTER SYSTEM
==================================================

Use the existing attack-counter design already present in the project.

The agent must inspect the existing matchup logic before modifying it.

Do NOT randomly invent new matchup rules.

Create one centralized table/function that determines:

- winner of exchange
- loser of exchange
- damage dealt
- damage prevented
- whether dodge succeeds
- whether block reduces damage
- whether both take damage
- animation outcome
- knockback
- hit reaction

All move combinations must be explicitly handled.

At minimum verify:

Attack vs Attack
Attack vs Heavy
Attack vs Dodge
Attack vs Block

Heavy vs Attack
Heavy vs Heavy
Heavy vs Dodge
Heavy vs Block

Dodge vs Attack
Dodge vs Heavy
Dodge vs Dodge
Dodge vs Block

Block vs Attack
Block vs Heavy
Block vs Dodge
Block vs Block

Never leave undefined matchups.

If the existing project already contains the damage-resolution table, preserve its intended logic and fix only incorrect or missing cases.

==================================================
10. DAMAGE SYSTEM
==================================================

Use the existing damage values where available.

Create a centralized damage-resolution system.

Every successful hit must:

1. Apply damage.
2. Clamp HP to valid range.
3. Update HP bar.
4. Show floating damage text.
5. Trigger hit reaction.
6. Trigger knockback.
7. Trigger spark particles.
8. Trigger appropriate sound/effect if already available.
9. Reset the attacker/defender pose properly.

Do not allow damage to be applied more than once for the same attack.

Use attack IDs / round IDs / hit-state guards where required.

==================================================
11. HP SYSTEM
==================================================

Display duel HP for both combatants.

HP starts at the configured duel maximum.

The HP UI should:

- appear during active duel
- remain synchronized with actual state
- update smoothly
- display damage clearly
- disappear when duel ends

Do not keep stale HP values between duels.

Every new duel must reset both combatants correctly.

==================================================
12. ANIMATIONS
==================================================

Reuse the existing animation system wherever possible.

Implement or connect:

- idle fighting stance
- normal attack
- heavy attack
- dodge left
- dodge right
- block
- hit reaction
- knockback
- KO/fall
- victory
- retreat
- winner celebration

Do NOT allow multiple systems to continuously overwrite the same limb rotations or pose transforms.

Separate:
- manual duel pose control
- automatic character animation
- tween-driven temporary offsets

When a duel action completes, restore the correct base pose.

Always clean up tweens and temporary transforms.

==================================================
13. ATTACK ANIMATION TIMING
==================================================

Synchronize:

attack wind-up
→ strike
→ hit-check moment
→ particle effect
→ damage
→ reaction
→ recovery

Damage MUST happen at the intended hit frame/timing, not immediately when the animation starts.

Heavy attack must have a different timing profile from normal attack.

Dodges should temporarily alter the character position/pose without permanently corrupting the board position.

==================================================
14. BLOCK
==================================================

When SPACE is pressed:

Enter block state.

The block system must connect to the existing matchup-resolution table.

Do not make blocking automatically invincible unless that is already part of the current rules.

Use the existing block-vs-attack / block-vs-heavy logic.

Block animation must reset after the exchange.

==================================================
15. DODGE
==================================================

A = Dodge Left
D = Dodge Right

Dodge must:

- play correct pose
- move character laterally
- use correct direction vector
- prevent unintended permanent world displacement
- reset position afterward
- interact correctly with attack hit detection
- work for both human player and AI

Prevent multiple dodge triggers while already dodging.

==================================================
16. AI SYSTEM
==================================================

AI must automatically participate in duels.

Do not require human input for AI players.

AI should:

1. detect duel start
2. select a move
3. wait for correct action timing
4. execute animation
5. resolve matchup
6. continue until KO
7. return to board game

AI difficulty:

EASY:
- simple/random decisions
- slow reaction
- limited prediction
- higher probability of suboptimal moves

NORMAL:
- semi-aware decisions
- moderate counter logic
- some prediction
- reasonable reaction timing

HARD:
- strongest decision-making
- better prediction of player tendencies
- improved counter selection
- faster reaction
- lower probability of random mistakes

Do not make HARD impossible.

The goal is increasing intelligence, not cheating.

Do not give AI hidden damage bonuses unless already specified by the current design.

==================================================
17. AI AUTOMATIC TURN SYSTEM
==================================================

When it becomes an AI-controlled player's turn:

Automatically:

- trigger its turn
- roll dice using the existing dice system
- move the character
- resolve tile landing
- trigger duel if necessary
- perform duel moves automatically
- resolve winner
- continue snake/ladder logic
- end turn properly

Never wait for human input during an AI turn.

Prevent simultaneous AI and human turns.

==================================================
18. TURN SYSTEM
==================================================

Integrate duel resolution into the existing turn loop.

Normal turn:

START TURN
→ ROLL DICE
→ MOVE
→ CHECK TILE
→ CHECK COLLISION
→ IF DUEL → ENTER DUEL
→ RESOLVE DUEL
→ RESOLVE LOSER RETREAT
→ RESOLVE WINNER ADVANCE
→ RESOLVE SNAKE/LADDER
→ CHECK NEW COLLISIONS
→ END TURN

Do not skip the existing tile resolution system.

==================================================
19. DUEL WINNER / LOSER POSITIONING
==================================================

After a duel:

LOSER:
- must retreat according to the existing retreat rules
- find the next valid/open tile when required
- do not occupy an invalid or already-blocked position
- trigger correct animation

WINNER:
- should receive the existing advance/leap movement if the current design calls for it
- use the existing winning-leap arc
- land on a valid tile
- trigger relevant tile effects afterward

Do not permanently use duel-arena coordinates as board coordinates.

==================================================
20. TILE COLLISION RESOLUTION
==================================================

After a duel, carefully resolve board positions.

If multiple players occupy the same location:

- determine valid positions
- resolve retreat
- resolve advance
- check for another collision
- prevent endless recursion

Use guarded collision resolution.

Example concept:

resolveTileState()
→ detect collision
→ duel
→ reposition
→ re-check
→ stop when stable

Use a maximum recursion/chain guard or state token.

Never allow:

duel → retreat → collision → duel → retreat → collision

to run infinitely.

==================================================
21. SNAKE AND LADDER INTERACTION
==================================================

Use the existing snake/ladder rules already implemented.

After duel-related repositioning:

1. Determine final valid tile.
2. Check snake endpoint.
3. Check ladder endpoint.
4. Apply existing snake/ladder movement rules.
5. After that movement, check for new collision if required.
6. Prevent duplicate triggering of the same snake/ladder event.

If existing game rules specify that snakes/ladders should NOT trigger immediately after a retreat, preserve that behavior.

Do not invent a new snake/ladder rule.

==================================================
22. SNAKE DEFEAT / REACTION
==================================================

If one of the duel participants is the snake-related player/character handled specially by the current system:

Use the existing snake flinch/recoil behavior.

On losing:
- flinch
- recoil
- play defeat reaction
- retreat/reset according to the existing logic

On winning:
- victory/taunt reaction where already designed

Do not redesign snake visuals.

==================================================
23. DUEL CAMERA
==================================================

When duel starts:

- transition camera to the duel framing already established by the project
- clearly show both fighters
- keep relevant UI visible
- optionally show duel title/caption
- avoid clipping fighters

During duel:
- follow combat action appropriately
- use existing camera logic where available

After duel:
- smoothly return to board camera
- restore normal camera tracking

Do not permanently change the board camera.

==================================================
24. PARTICLE SYSTEM
==================================================

Reuse the existing spark particle system.

Sparks should appear on successful impact.

Use the shared spark generator already planned/implemented.

Do not create dozens of separate particle systems.

Clean up particles properly.

Prevent particle accumulation.

If existing culling causes moving particles to disappear incorrectly, fix the bounds/culling issue using the existing scene architecture.

==================================================
25. HUD / DUEL INTERFACE
==================================================

Create/connect the duel panel.

Display:

PLAYER NAME
HP BAR

VS

OPPONENT NAME
HP BAR

Control guide:

LMB  ATTACK
RMB  HEAVY ATTACK
A/D  DODGE
SPACE  BLOCK

During move selection:
- show the controls clearly
- prevent unrelated board UI from interfering

During animation:
- optionally hide/disable move-selection controls until the next valid action

When duel finishes:
- hide duel panel cleanly

==================================================
26. DEBUGGING / TEST MODE
==================================================

Preserve or add debug hooks for deterministic testing.

The project should be able to simulate:

- specific player move
- specific AI move
- specific matchup
- fixed HP
- forced duel
- forced tile collision
- forced snake/ladder event

This is necessary to verify every matchup without playing an entire board game manually.

==================================================
27. REQUIRED TEST MATRIX
==================================================

Before declaring the implementation complete, test:

NORMAL ATTACK:
- vs attack
- vs heavy
- vs dodge
- vs block

HEAVY ATTACK:
- vs attack
- vs heavy
- vs dodge
- vs block

DODGE:
- vs attack
- vs heavy
- vs dodge
- vs block

BLOCK:
- vs attack
- vs heavy
- vs dodge
- vs block

Then test:

- human vs easy AI
- human vs normal AI
- human vs hard AI
- human vs human where supported
- AI vs AI where supported
- multiple players
- duel triggering on collision
- winner positioning
- loser retreat
- snake trigger after movement
- ladder trigger after movement
- repeated collision prevention
- turn continuation
- camera restoration
- HP reset
- animation reset
- particle cleanup
- UI cleanup

==================================================
28. IMPORTANT BUG PREVENTION
==================================================

Guard against:

- duplicate click listeners
- repeated attacks from held mouse buttons
- multiple damage applications
- duplicate duel triggers
- recursive collision loops
- stale duel state
- stale HP
- stuck animations
- stuck block state
- stuck dodge state
- camera never returning
- AI waiting forever
- turn loop deadlocks
- snake/ladder triggering twice
- players remaining in duel arena
- board coordinates being overwritten by duel coordinates
- tweens continuing after duel ends
- multiple AI turns running simultaneously

==================================================
29. CODE QUALITY
==================================================

Do not scatter duel conditions randomly throughout the project.

Create or reuse clean centralized systems where appropriate:

DuelManager
CombatResolver
DuelInputController
AIController
DuelUI
DuelAnimationController
CollisionResolver
TurnManager

Only create these if they fit the existing architecture. Do not blindly create duplicate managers if equivalent systems already exist.

Prefer extending current functions rather than duplicating them.

==================================================
30. VERY IMPORTANT IMPLEMENTATION RULE
==================================================

The logic described above is based on the duel/combat logic already developed in this project.

Therefore:

FIRST inspect the current implementation.

SECOND identify what is already implemented.

THIRD reuse existing systems.

FOURTH connect missing pieces.

FIFTH fix bugs and inconsistent states.

DO NOT replace working systems just because a cleaner architecture is possible.

==================================================
31. FINAL ACCEPTANCE CRITERIA
==================================================

The implementation is complete only when I can:

1. Start the game.
2. Choose VS AI or Friends.
3. Choose player count.
4. Choose AI difficulty when applicable.
5. Start the board game normally.
6. Roll dice normally.
7. Move normally.
8. Trigger a duel naturally through collision.
9. See a duel camera transition.
10. See both HP bars.
11. Use:

LMB = Attack
RMB = Heavy Attack
A = Dodge Left
D = Dodge Right
SPACE = Block

12. See correct combat animation.
13. See correct damage resolution.
14. See sparks and damage numbers.
15. See knockback/hit reactions.
16. See KO.
17. See victory reaction.
18. See loser retreat.
19. See winner advance.
20. See snake/ladder resolution where appropriate.
21. Return to normal board gameplay.
22. Continue to the next turn.
23. Repeat without the game breaking.

MOST IMPORTANT:
Do not just create UI buttons or placeholder functions.

The duel must be ACTUALLY CONNECTED to the existing game loop.

Do not give me a plan only.

Implement the feature directly in the existing project, integrate it with the current architecture, test the complete flow, and fix all runtime errors introduced by the implementation.