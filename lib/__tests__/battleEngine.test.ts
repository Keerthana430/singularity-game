// lib/__tests__/battleEngine.test.ts
// Unit tests verifying determinism, edge cases, and scoring for simulateBattle

import { simulateBattle, calculateBattleScore, createSeededRng } from '../battleEngine';
import { createDefaultAvatar } from '../../data/defaults';
import { PRESET_AVATARS } from '../../data/presets';

function runTests() {
  console.log('🧪 RUNNING SIMULATE BATTLE ENGINE TEST SUITE...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  const avatarA = createDefaultAvatar();
  avatarA.name = 'TEST-ALPHA';
  avatarA.species = 'human';
  avatarA.weapon = 'katana-cyber';

  const avatarB = PRESET_AVATARS[0].avatar;
  avatarB.name = 'TEST-OMEGA';
  avatarB.species = 'dwarf';
  avatarB.weapon = 'heavy-hammer';

  // ─── TEST 1: DETERMINISM ───
  const seed = 987654;
  const result1 = simulateBattle(avatarA, avatarB, seed);
  const result2 = simulateBattle(avatarA, avatarB, seed);

  assert(
    result1.winnerId === result2.winnerId,
    'Determinism: Same seed produces identical winner'
  );
  assert(
    result1.totalTurns === result2.totalTurns,
    'Determinism: Same seed produces identical turn count'
  );
  assert(
    result1.events.length === result2.events.length,
    'Determinism: Same seed produces identical event count'
  );
  assert(
    result1.avatarAFinalHp === result2.avatarAFinalHp && result1.avatarBFinalHp === result2.avatarBFinalHp,
    'Determinism: Final HP values match to the single integer'
  );

  // ─── TEST 2: SEED VARIANCE ───
  const resultDiffSeed = simulateBattle(avatarA, avatarB, 1111);
  assert(
    result1.events[0]?.damage !== resultDiffSeed.events[0]?.damage || result1.events.length !== resultDiffSeed.events.length || result1.avatarAFinalHp !== resultDiffSeed.avatarAFinalHp,
    'Seed Variance: Different seeds produce distinct RNG rolls'
  );

  // ─── TEST 3: WINNER LOGIC & COMBAT TERMINATION ───
  const winnerHp = result1.winnerId === 'avatarA' ? result1.avatarAFinalHp : result1.avatarBFinalHp;
  const loserHp = result1.winnerId === 'avatarA' ? result1.avatarBFinalHp : result1.avatarAFinalHp;
  assert(
    winnerHp > 0 && loserHp === 0,
    'Winner Logic: Loser HP is reduced to 0 and Winner survives'
  );

  // ─── TEST 4: SCORING FORMULA ───
  const testScoreWin = calculateBattleScore(true, 500, 1000, 5, 2);
  // Expected: 1000 (win) + round(0.5 * 500 = 250) + (15 - 5) * 40 (= 400) + 2 * 50 (= 100) = 1750
  assert(
    testScoreWin === 1750,
    `Scoring Formula: Expected 1750, received ${testScoreWin}`
  );

  const testScoreLoss = calculateBattleScore(false, 0, 1000, 12, 0);
  // Expected: 200 (loss) + 0 + (15 - 12) * 40 (= 120) + 0 = 320
  assert(
    testScoreLoss === 320,
    `Scoring Formula: Loss score accurately computed (320)`
  );

  // ─── TEST 5: PRNG DISTRIBUTION ───
  const rng = createSeededRng(42);
  const sample1 = rng();
  const sample2 = rng();
  assert(
    sample1 >= 0 && sample1 < 1 && sample2 >= 0 && sample2 < 1 && sample1 !== sample2,
    'Mulberry32 PRNG: Generates bounded floating point values in [0, 1)'
  );

  console.log(`\nTEST RESULTS: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) process.exit(1);
}

runTests();
