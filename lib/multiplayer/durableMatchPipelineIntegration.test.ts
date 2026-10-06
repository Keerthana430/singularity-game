import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { Pool } from 'pg';

import { closePostgresPool } from '@/lib/db/postgres';
import { createMatchSession, MatchSessionController } from './matchSession';
import {
  executeDurableAction,
  loadCheckpointAndOrderedActions,
  loadDurableMatchMetadata,
  persistDurableAction,
  saveMatchCheckpoint,
} from './durableMatchStore';
import type { MatchCheckpoint } from './types';

const connectionString =
  process.env.DATABASE_URL ?? 'postgresql://testuser:testpass@127.0.0.1:5433/singularity_test';
const pool = new Pool({ connectionString });

const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

async function insertTestTeam(client: any, code: string) {
  const teamId = crypto.randomUUID();
  const username = `${code.toLowerCase()}_${uniqueSuffix}`;
  await client.query(
    `
    INSERT INTO teams (id, team_code, team_name, status, role, metadata)
    VALUES ($1, $2, $3, 'active', 'team', $4::jsonb)
    `,
    [teamId, code, code, { source: 'durable-integration-test' }]
  );
  return { teamId, code };
}

async function createDurableMatch(teamIds: string[], gameType: string = 'ludo', ruleVersion: string = 'v1') {
  const client = await pool.connect();
  try {
    const matchId = crypto.randomUUID();
    await client.query(
      `
      INSERT INTO matches (id, game_type, rule_version, status, state_version, snapshot_state_version, metadata, created_at, started_at, updated_at)
      VALUES ($1, $2, $3, 'active', 0, 0, $4::jsonb, NOW(), NOW(), NOW())
      `,
      [matchId, gameType, ruleVersion, { source: 'durable-pipeline-test' }]
    );

    for (const [index, teamId] of teamIds.entries()) {
      await client.query(
        `
        INSERT INTO match_participants (id, match_id, team_id, seat_index, status, joined_at)
        VALUES ($1, $2, $3, $4, 'joined', NOW())
        `,
        [crypto.randomUUID(), matchId, teamId, index]
      );
    }

    return matchId;
  } finally {
    client.release();
  }
}

test('Action persistence: accepted action creates exactly one match_actions row and advances matches.state_version', async () => {
  const client = await pool.connect();
  let teamA: { teamId: string };
  let teamB: { teamId: string };
  try {
    teamA = await insertTestTeam(client, `AP-${uniqueSuffix}-A`);
    teamB = await insertTestTeam(client, `AP-${uniqueSuffix}-B`);
  } finally {
    client.release();
  }

  const matchId = await createDurableMatch([teamA.teamId, teamB.teamId], 'ludo');
  const controller = createMatchSession({
    matchId,
    gameType: 'ludo',
    ruleVersion: 'v1',
    participants: [
      { teamId: teamA.teamId, seatIndex: 0, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
      { teamId: teamB.teamId, seatIndex: 1, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
    ],
    state: { turn: 1, board: [] },
  });

  const result = await executeDurableAction(
    controller,
    {
      actionId: `action-p1-${uniqueSuffix}`,
      teamId: teamA.teamId,
      expectedStateVersion: 0,
      payload: { move: 4 },
    },
    (state, action) => ({
      ...state,
      turn: 2,
      lastMove: action.payload?.move,
    })
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.stateVersion, 1);
  assert.equal(result.appliedActionId, `action-p1-${uniqueSuffix}`);
  assert.equal(controller.getStateVersion(), 1);
  assert.equal(controller.getMatch().state.lastMove, 4);

  const verifyClient = await pool.connect();
  try {
    const matchRow = await verifyClient.query(
      `SELECT state_version, status FROM matches WHERE id = $1`,
      [matchId]
    );
    assert.equal(matchRow.rows[0].state_version, 1);

    const actionRows = await verifyClient.query(
      `SELECT id, action_id, applied_state_version, status, payload FROM match_actions WHERE match_id = $1`,
      [matchId]
    );
    assert.equal(actionRows.rowCount, 1);
    assert.equal(actionRows.rows[0].action_id, `action-p1-${uniqueSuffix}`);
    assert.equal(actionRows.rows[0].applied_state_version, 1);
    assert.equal(actionRows.rows[0].status, 'applied');
    assert.equal(actionRows.rows[0].payload.move, 4);
  } finally {
    verifyClient.release();
  }
});

test('Stale action: stale expected version is rejected without committing action row or advancing state_version', async () => {
  const client = await pool.connect();
  let teamA: { teamId: string };
  let teamB: { teamId: string };
  try {
    teamA = await insertTestTeam(client, `SA-${uniqueSuffix}-A`);
    teamB = await insertTestTeam(client, `SA-${uniqueSuffix}-B`);
  } finally {
    client.release();
  }

  const matchId = await createDurableMatch([teamA.teamId, teamB.teamId], 'ludo');
  const controller = createMatchSession({
    matchId,
    gameType: 'ludo',
    ruleVersion: 'v1',
    participants: [
      { teamId: teamA.teamId, seatIndex: 0, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
      { teamId: teamB.teamId, seatIndex: 1, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
    ],
    state: { turn: 1 },
  });

  // Apply valid action 1 to advance version to 1
  const first = await executeDurableAction(
    controller,
    { actionId: `action-sa1-${uniqueSuffix}`, teamId: teamA.teamId, expectedStateVersion: 0, payload: { step: 1 } },
    (state) => ({ ...state, step: 1 })
  );
  assert.equal(first.ok, true);
  assert.equal(controller.getStateVersion(), 1);

  // Attempt stale action expecting version 0 when server is at version 1
  const stale = await executeDurableAction(
    controller,
    { actionId: `action-stale-${uniqueSuffix}`, teamId: teamB.teamId, expectedStateVersion: 0, payload: { step: 2 } },
    (state) => ({ ...state, step: 2 })
  );

  assert.equal(stale.ok, false);
  if (stale.ok) return;
  assert.equal(stale.code, 'STALE_STATE');
  assert.equal(controller.getStateVersion(), 1);

  // Attempt another stale action with a future/bogus version (e.g. 99)
  const bogus = await executeDurableAction(
    controller,
    { actionId: `action-bogus-${uniqueSuffix}`, teamId: teamB.teamId, expectedStateVersion: 99, payload: { step: 3 } },
    (state) => ({ ...state, step: 3 })
  );
  assert.equal(bogus.ok, false);

  const verifyClient = await pool.connect();
  try {
    const matchRow = await verifyClient.query(`SELECT state_version FROM matches WHERE id = $1`, [matchId]);
    assert.equal(matchRow.rows[0].state_version, 1);

    const staleActions = await verifyClient.query(
      `SELECT COUNT(*) AS count FROM match_actions WHERE match_id = $1 AND action_id IN ($2, $3)`,
      [matchId, `action-stale-${uniqueSuffix}`, `action-bogus-${uniqueSuffix}`]
    );
    assert.equal(Number(staleActions.rows[0].count), 0);
  } finally {
    verifyClient.release();
  }
});

test('Idempotency: duplicate action_id cannot mutate twice and concurrent duplicate attempts converge', async () => {
  const client = await pool.connect();
  let teamA: { teamId: string };
  let teamB: { teamId: string };
  try {
    teamA = await insertTestTeam(client, `ID-${uniqueSuffix}-A`);
    teamB = await insertTestTeam(client, `ID-${uniqueSuffix}-B`);
  } finally {
    client.release();
  }

  const matchId = await createDurableMatch([teamA.teamId, teamB.teamId], 'snakes');
  const controller = createMatchSession({
    matchId,
    gameType: 'snakes',
    ruleVersion: 'v1',
    participants: [
      { teamId: teamA.teamId, seatIndex: 0, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
      { teamId: teamB.teamId, seatIndex: 1, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
    ],
    state: { score: 10 },
  });

  const dupActionId = `dup-action-${uniqueSuffix}`;

  // First execution succeeds
  const first = await executeDurableAction(
    controller,
    { actionId: dupActionId, teamId: teamA.teamId, expectedStateVersion: 0, payload: { add: 5 } },
    (state) => ({ ...state, score: Number(state.score) + 5 })
  );
  assert.equal(first.ok, true);
  assert.equal(first.stateVersion, 1);

  // Sequential duplicate retry
  const retry = await executeDurableAction(
    controller,
    { actionId: dupActionId, teamId: teamA.teamId, expectedStateVersion: 1, payload: { add: 5 } },
    (state) => ({ ...state, score: Number(state.score) + 5 })
  );
  assert.equal(retry.ok, true);
  assert.equal(retry.duplicate, true);
  assert.equal(retry.stateVersion, 1);

  // Concurrent duplicate attempts
  const concurrentDupId = `concurrent-dup-${uniqueSuffix}`;
  const [res1, res2] = await Promise.all([
    executeDurableAction(
      controller,
      { actionId: concurrentDupId, teamId: teamB.teamId, expectedStateVersion: 1, payload: { add: 10 } },
      (state) => ({ ...state, score: Number(state.score) + 10 })
    ),
    executeDurableAction(
      controller,
      { actionId: concurrentDupId, teamId: teamB.teamId, expectedStateVersion: 1, payload: { add: 10 } },
      (state) => ({ ...state, score: Number(state.score) + 10 })
    ),
  ]);

  const successes = [res1, res2].filter((r) => r.ok && !r.duplicate);
  const duplicates = [res1, res2].filter((r) => r.ok && r.duplicate);
  assert.equal(successes.length, 1);
  assert.equal(duplicates.length, 1);
  assert.equal(controller.getStateVersion(), 2);

  const verifyClient = await pool.connect();
  try {
    const matchRow = await verifyClient.query(`SELECT state_version FROM matches WHERE id = $1`, [matchId]);
    assert.equal(matchRow.rows[0].state_version, 2);

    const dupRows = await verifyClient.query(
      `SELECT COUNT(*) AS count FROM match_actions WHERE match_id = $1 AND action_id = $2`,
      [matchId, concurrentDupId]
    );
    assert.equal(Number(dupRows.rows[0].count), 1);
  } finally {
    verifyClient.release();
  }
});

test('Concurrent actions: two different actions against the same match serialize correctly without lost updates', async () => {
  const client = await pool.connect();
  let teamA: { teamId: string };
  let teamB: { teamId: string };
  try {
    teamA = await insertTestTeam(client, `CA-${uniqueSuffix}-A`);
    teamB = await insertTestTeam(client, `CA-${uniqueSuffix}-B`);
  } finally {
    client.release();
  }

  const matchId = await createDurableMatch([teamA.teamId, teamB.teamId], 'ludo');
  const controller = createMatchSession({
    matchId,
    gameType: 'ludo',
    ruleVersion: 'v1',
    participants: [
      { teamId: teamA.teamId, seatIndex: 0, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
      { teamId: teamB.teamId, seatIndex: 1, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
    ],
    state: { counter: 0 },
  });

  // Both actions compete with expectedStateVersion: 0
  const actionAId = `concurrent-A-${uniqueSuffix}`;
  const actionBId = `concurrent-B-${uniqueSuffix}`;

  const [resA, resB] = await Promise.all([
    executeDurableAction(
      controller,
      { actionId: actionAId, teamId: teamA.teamId, expectedStateVersion: 0, payload: { inc: 1 } },
      (state) => ({ ...state, counter: Number(state.counter) + 1 })
    ),
    executeDurableAction(
      controller,
      { actionId: actionBId, teamId: teamB.teamId, expectedStateVersion: 0, payload: { inc: 1 } },
      (state) => ({ ...state, counter: Number(state.counter) + 1 })
    ),
  ]);

  // One must win and advance to stateVersion 1; the other must be serialized and rejected as stale
  const passed = [resA, resB].filter((r) => r.ok && !r.duplicate);
  const stale = [resA, resB].filter((r) => !r.ok && r.code === 'STALE_STATE');
  assert.equal(passed.length, 1);
  assert.equal(stale.length, 1);
  assert.equal(controller.getStateVersion(), 1);

  // Now submit next action with updated expectedStateVersion: 1
  const loserActionId = passed[0] === resA ? actionBId : actionAId;
  const loserTeamId = passed[0] === resA ? teamB.teamId : teamA.teamId;

  const retryWithCurrentVersion = await executeDurableAction(
    controller,
    { actionId: loserActionId, teamId: loserTeamId, expectedStateVersion: 1, payload: { inc: 1 } },
    (state) => ({ ...state, counter: Number(state.counter) + 1 })
  );
  assert.equal(retryWithCurrentVersion.ok, true);
  assert.equal(retryWithCurrentVersion.stateVersion, 2);
  assert.equal(controller.getStateVersion(), 2);

  const verifyClient = await pool.connect();
  try {
    const matchRow = await verifyClient.query(`SELECT state_version FROM matches WHERE id = $1`, [matchId]);
    assert.equal(matchRow.rows[0].state_version, 2);

    const actionRows = await verifyClient.query(
      `SELECT applied_state_version, action_id FROM match_actions WHERE match_id = $1 ORDER BY applied_state_version ASC`,
      [matchId]
    );
    assert.equal(actionRows.rowCount, 2);
    assert.equal(actionRows.rows[0].applied_state_version, 1);
    assert.equal(actionRows.rows[1].applied_state_version, 2);
    // Distinct applied versions - no duplicate applied_state_version
    assert.notEqual(actionRows.rows[0].action_id, actionRows.rows[1].action_id);
  } finally {
    verifyClient.release();
  }
});

test('Checkpoint persistence: checkpoint persists correctly and subsequent actions are identified as replay-after-checkpoint', async () => {
  const client = await pool.connect();
  let teamA: { teamId: string };
  let teamB: { teamId: string };
  try {
    teamA = await insertTestTeam(client, `CP-${uniqueSuffix}-A`);
    teamB = await insertTestTeam(client, `CP-${uniqueSuffix}-B`);
  } finally {
    client.release();
  }

  const matchId = await createDurableMatch([teamA.teamId, teamB.teamId], 'ludo');
  const controller = createMatchSession({
    matchId,
    gameType: 'ludo',
    ruleVersion: 'v1',
    participants: [
      { teamId: teamA.teamId, seatIndex: 0, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
      { teamId: teamB.teamId, seatIndex: 1, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
    ],
    state: { stage: 'start' },
  });

  // Action 1
  await executeDurableAction(
    controller,
    { actionId: `cp-act-1-${uniqueSuffix}`, teamId: teamA.teamId, expectedStateVersion: 0, payload: { step: 1 } },
    (state) => ({ ...state, step: 1 })
  );

  // Action 2
  await executeDurableAction(
    controller,
    { actionId: `cp-act-2-${uniqueSuffix}`, teamId: teamB.teamId, expectedStateVersion: 1, payload: { step: 2 } },
    (state) => ({ ...state, step: 2 })
  );

  assert.equal(controller.getStateVersion(), 2);

  // Persist a checkpoint at stateVersion = 2
  const checkpoint: MatchCheckpoint = {
    matchId,
    gameType: 'ludo',
    ruleVersion: 'v1',
    stateVersion: 2,
    status: 'active',
    state: { ...controller.getMatch().state, checkpointed: true },
    savedAt: new Date().toISOString(),
    metadata: { note: 'mid-game checkpoint' },
  };

  const cpSaveResult = await saveMatchCheckpoint(matchId, checkpoint);
  assert.equal(cpSaveResult.ok, true);
  if (!cpSaveResult.ok) return;
  assert.equal(cpSaveResult.data.snapshotStateVersion, 2);

  // Action 3 (after checkpoint)
  const act3 = await executeDurableAction(
    controller,
    { actionId: `cp-act-3-${uniqueSuffix}`, teamId: teamA.teamId, expectedStateVersion: 2, payload: { step: 3 } },
    (state) => ({ ...state, step: 3 })
  );
  assert.equal(act3.ok, true);
  assert.equal(act3.stateVersion, 3);

  // Load checkpoint + ordered actions
  const loaded = await loadCheckpointAndOrderedActions(matchId);
  assert.equal(loaded.ok, true);
  if (!loaded.ok) return;

  assert.equal(loaded.data.snapshotStateVersion, 2);
  assert.ok(loaded.data.checkpoint);
  assert.equal(loaded.data.checkpoint?.stateVersion, 2);
  assert.equal(loaded.data.checkpoint?.state.checkpointed, true);

  // The ordered actions returned for replay must ONLY contain actions after checkpoint (version > 2)
  assert.equal(loaded.data.actions.length, 1);
  assert.equal(loaded.data.actions[0].action_id, `cp-act-3-${uniqueSuffix}`);
  assert.equal(loaded.data.actions[0].applied_state_version, 3);
});

test('DB failure / rollback: failure leaves in-memory state, PostgreSQL state_version, and match_actions untouched', async () => {
  const client = await pool.connect();
  let teamA: { teamId: string };
  let teamB: { teamId: string };
  try {
    teamA = await insertTestTeam(client, `RB-${uniqueSuffix}-A`);
    teamB = await insertTestTeam(client, `RB-${uniqueSuffix}-B`);
  } finally {
    client.release();
  }

  const matchId = await createDurableMatch([teamA.teamId, teamB.teamId], 'ludo');
  const controller = createMatchSession({
    matchId,
    gameType: 'ludo',
    ruleVersion: 'v1',
    participants: [
      { teamId: teamA.teamId, seatIndex: 0, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
      { teamId: teamB.teamId, seatIndex: 1, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
    ],
    state: { safeVal: 42 },
  });

  // Mutator throws an exception
  const failedResult = await executeDurableAction(
    controller,
    { actionId: `throw-action-${uniqueSuffix}`, teamId: teamA.teamId, expectedStateVersion: 0, payload: {} },
    () => {
      throw new Error('Simulated game rule validation crash');
    }
  );

  assert.equal(failedResult.ok, false);
  assert.equal(controller.getStateVersion(), 0);
  assert.equal(controller.getMatch().state.safeVal, 42);

  // Call on non-existent matchId in database
  const invalidMatchResult = await persistDurableAction({
    matchId: crypto.randomUUID(),
    action: { actionId: `ghost-${uniqueSuffix}`, teamId: teamA.teamId, expectedStateVersion: 0 },
    currentState: {},
    mutator: (s) => s,
  });
  assert.equal(invalidMatchResult.ok, false);
  assert.equal(invalidMatchResult.code, 'MATCH_NOT_FOUND');

  // Verify DB state is pristine
  const verifyClient = await pool.connect();
  try {
    const matchRow = await verifyClient.query(`SELECT state_version FROM matches WHERE id = $1`, [matchId]);
    assert.equal(matchRow.rows[0].state_version, 0);

    const actionRows = await verifyClient.query(`SELECT COUNT(*) AS count FROM match_actions WHERE match_id = $1`, [matchId]);
    assert.equal(Number(actionRows.rows[0].count), 0);
  } finally {
    verifyClient.release();
  }
});

test.after(async () => {
  await pool.end();
  await closePostgresPool();
});
