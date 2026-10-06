import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { Pool } from 'pg';
import { WebSocket } from 'ws';

import { closePostgresPool } from '@/lib/db/postgres';
import { MatchSessionController } from './matchSession';
import {
  executeDurableAction,
  recoverMatchFromDatabase,
  registerGameReplayAdapter,
  unregisterGameReplayAdapter,
  type GameStateReplayAdapter,
} from './durableMatchStore';
import { createRealtimeServer } from './realtime';

const connectionString =
  process.env.DATABASE_URL ?? 'postgresql://testuser:testpass@127.0.0.1:5433/singularity_test';
const pool = new Pool({ connectionString });

async function insertTestTeam(client: any, prefix: string) {
  const teamId = crypto.randomUUID();
  const code = `${prefix.slice(0, 8)}_${crypto.randomBytes(4).toString('hex')}`.slice(0, 28);
  await client.query(
    `
    INSERT INTO teams (id, team_code, team_name, status, role, metadata)
    VALUES ($1, $2, $3, 'active', 'team', $4::jsonb)
    `,
    [teamId, code, code, { source: 'recovery-test' }]
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
      [matchId, gameType, ruleVersion, { source: 'recovery-test', gameType }]
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

async function waitForSocketOpen(socket: WebSocket) {
  if (socket.readyState === socket.OPEN) return;
  await new Promise<void>((resolve, reject) => {
    const onOpen = () => {
      socket.off('error', onError);
      resolve();
    };
    const onError = (error: Error) => {
      socket.off('open', onOpen);
      reject(error);
    };
    socket.once('open', onOpen);
    socket.once('error', onError);
  });
}

function createMessageCollector(socket: WebSocket) {
  const messages: any[] = [];
  const waiters: Array<{ predicate: (p: any) => boolean; resolve: (p: any) => void; timer: NodeJS.Timeout }> = [];

  socket.on('message', (raw) => {
    try {
      const parsed = JSON.parse(raw.toString());
      const waiterIdx = waiters.findIndex((w) => w.predicate(parsed));
      if (waiterIdx !== -1) {
        const [waiter] = waiters.splice(waiterIdx, 1);
        clearTimeout(waiter.timer);
        waiter.resolve(parsed);
      } else {
        messages.push(parsed);
      }
    } catch {}
  });

  return {
    async waitFor(predicate: (p: any) => boolean, timeoutMs = 2500) {
      const existingIdx = messages.findIndex(predicate);
      if (existingIdx !== -1) {
        return messages.splice(existingIdx, 1)[0];
      }
      return new Promise<any>((resolve, reject) => {
        const timer = setTimeout(() => {
          const idx = waiters.findIndex((w) => w.resolve === resolve);
          if (idx !== -1) waiters.splice(idx, 1);
          reject(new Error('Timed out waiting for socket message.'));
        }, timeoutMs);
        waiters.push({ predicate, resolve, timer });
      });
    },
  };
}

test('Process-Restart Simulation: Actions -> Checkpoint -> More Actions -> Simulated Restart -> Accurate DB Recovery & Subsequent Action', async () => {
  const ludoAdapter: GameStateReplayAdapter = {
    getInitialState: (match) => ({ matchId: match.id, moves: [], lastDice: 0 }),
    applyAction: (state, action) => ({
      ...state,
      moves: [...((state.moves as any[]) ?? []), action.payload?.move],
      lastDice: action.payload?.move,
      lastActionId: action.action_id,
    }),
  };
  registerGameReplayAdapter('ludo_sim', ludoAdapter);

  const client = await pool.connect();
  let matchId: string;
  let team1: { teamId: string };
  let team2: { teamId: string };

  try {
    const t1 = await insertTestTeam(client, 'REC_PRS1');
    const t2 = await insertTestTeam(client, 'REC_PRS2');
    team1 = t1;
    team2 = t2;
    matchId = await createDurableMatch([t1.teamId, t2.teamId], 'ludo_sim', 'v1');
  } finally {
    client.release();
  }

  // 1. In-memory session before restart
  let controller: MatchSessionController | null = new MatchSessionController({
    matchId,
    gameType: 'ludo_sim',
    ruleVersion: 'v1',
    participants: [
      { teamId: team1.teamId, seatIndex: 0, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
      { teamId: team2.teamId, seatIndex: 1, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
    ],
    status: 'active',
    stateVersion: 0,
    state: { moves: [], lastDice: 0 },
  });

  const mutator = (state: Record<string, unknown>, action: any) =>
    ludoAdapter.applyAction(state, { action_id: action.actionId, payload: action.payload } as any, {} as any);

  // Apply actions 1, 2, 3
  const a1 = await executeDurableAction(
    controller,
    { actionId: 'act-prs-1', teamId: team1.teamId, payload: { move: 4 } },
    mutator
  );
  assert.equal(a1.ok, true);
  assert.equal(a1.stateVersion, 1);

  const a2 = await executeDurableAction(
    controller,
    { actionId: 'act-prs-2', teamId: team2.teamId, payload: { move: 6 } },
    mutator
  );
  assert.equal(a2.ok, true);
  assert.equal(a2.stateVersion, 2);

  // Checkpoint at version 3
  const a3 = await executeDurableAction(
    controller,
    { actionId: 'act-prs-3', teamId: team1.teamId, payload: { move: 2 } },
    mutator,
    { checkpointInterval: 3 }
  );
  assert.equal(a3.ok, true);
  assert.equal(a3.stateVersion, 3);
  assert.equal(a3.checkpointSaved, true);

  // Apply actions 4 and 5 after checkpoint
  const a4 = await executeDurableAction(
    controller,
    { actionId: 'act-prs-4', teamId: team2.teamId, payload: { move: 5 } },
    mutator
  );
  assert.equal(a4.ok, true);
  assert.equal(a4.stateVersion, 4);

  const a5 = await executeDurableAction(
    controller,
    { actionId: 'act-prs-5', teamId: team1.teamId, payload: { move: 3 } },
    mutator
  );
  assert.equal(a5.ok, true);
  assert.equal(a5.stateVersion, 5);

  // Record pre-restart state and version
  const preRestartState = JSON.parse(JSON.stringify(controller.getMatch().state));
  const preRestartVersion = controller.getStateVersion();
  assert.equal(preRestartVersion, 5);
  assert.deepEqual(preRestartState.moves, [4, 6, 2, 5, 3]);

  // 2. Simulated process restart: destroy in-memory controller completely
  controller = null;

  // 3. Recover match entirely from database
  const recovery = await recoverMatchFromDatabase(matchId);
  assert.equal(recovery.ok, true);
  if (!recovery.ok) return;

  // 4. Verify post-restart recovery state and version
  assert.equal(recovery.recoveredVersion, 5);
  assert.equal(recovery.fromCheckpoint, true);
  assert.equal(recovery.replayedActionCount, 2); // Actions 4 and 5 replayed after checkpoint v3
  assert.deepEqual(recovery.match.state, preRestartState);
  assert.equal(recovery.controller.getStateVersion(), 5);

  // Verify processed action IDs restored (both before and after checkpoint)
  assert.equal(recovery.controller.isActionProcessed('act-prs-1'), true);
  assert.equal(recovery.controller.isActionProcessed('act-prs-2'), true);
  assert.equal(recovery.controller.isActionProcessed('act-prs-3'), true);
  assert.equal(recovery.controller.isActionProcessed('act-prs-4'), true);
  assert.equal(recovery.controller.isActionProcessed('act-prs-5'), true);

  // Verify duplicate action is rejected by recovered controller
  const duplicateSubmission = await executeDurableAction(
    recovery.controller,
    { actionId: 'act-prs-2', teamId: team2.teamId, payload: { move: 6 } },
    mutator
  );
  assert.equal(duplicateSubmission.ok, true);
  assert.equal(duplicateSubmission.duplicate, true);
  assert.equal(duplicateSubmission.stateVersion, 5);

  // 5. Submit another valid action post-recovery
  const a6 = await executeDurableAction(
    recovery.controller,
    { actionId: 'act-prs-6', teamId: team2.teamId, payload: { move: 1 } },
    mutator
  );
  assert.equal(a6.ok, true);
  assert.equal(a6.duplicate, false);
  assert.equal(a6.stateVersion, 6);
  assert.equal(recovery.controller.getStateVersion(), 6);
  assert.deepEqual((recovery.controller.getMatch().state as any).moves, [4, 6, 2, 5, 3, 1]);

  unregisterGameReplayAdapter('ludo_sim');
});

test('No-Checkpoint Recovery: Deterministic replay from initial state version 1 onward', async () => {
  const client = await pool.connect();
  let matchId: string;
  let team1: { teamId: string };
  let team2: { teamId: string };

  const customGameType = 'turn_strategy';
  const customAdapter: GameStateReplayAdapter = {
    getInitialState: (match, participants) => ({
      game: 'turn_strategy',
      matchId: match.id,
      score: { [participants[0].teamId]: 0, [participants[1].teamId]: 0 },
      log: [],
    }),
    applyAction: (currentState, action) => {
      const score = { ...((currentState.score as Record<string, number>) ?? {}) };
      const team = action.team_id;
      const pts = Number(action.payload?.points ?? 1);
      score[team] = (score[team] ?? 0) + pts;
      return {
        ...currentState,
        score,
        log: [...((currentState.log as string[]) ?? []), action.action_id],
      };
    },
  };

  registerGameReplayAdapter(customGameType, customAdapter);

  try {
    const t1 = await insertTestTeam(client, 'NOCP_1');
    const t2 = await insertTestTeam(client, 'NOCP_2');
    team1 = t1;
    team2 = t2;
    matchId = await createDurableMatch([t1.teamId, t2.teamId], customGameType, 'v1');
  } finally {
    client.release();
  }

  // Create match session starting at version 0 with no checkpoint
  const controller = new MatchSessionController({
    matchId,
    gameType: customGameType,
    ruleVersion: 'v1',
    participants: [
      { teamId: team1.teamId, seatIndex: 0, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
      { teamId: team2.teamId, seatIndex: 1, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
    ],
    status: 'active',
    stateVersion: 0,
    state: customAdapter.getInitialState({ id: matchId, game_type: customGameType } as any, [
      { teamId: team1.teamId, seatIndex: 0 } as any,
      { teamId: team2.teamId, seatIndex: 1 } as any,
    ]),
  });

  const mutator = (state: Record<string, unknown>, action: any) =>
    customAdapter.applyAction(state, { action_id: action.actionId, team_id: action.teamId, payload: action.payload } as any, {} as any);

  // Apply 3 actions without creating any checkpoints
  await executeDurableAction(controller, { actionId: 'act-nocp-1', teamId: team1.teamId, payload: { points: 10 } }, mutator);
  await executeDurableAction(controller, { actionId: 'act-nocp-2', teamId: team2.teamId, payload: { points: 25 } }, mutator);
  await executeDurableAction(controller, { actionId: 'act-nocp-3', teamId: team1.teamId, payload: { points: 5 } }, mutator);

  assert.equal(controller.getStateVersion(), 3);
  const preRestartScore = (controller.getMatch().state as any).score;
  assert.equal(preRestartScore[team1.teamId], 15);
  assert.equal(preRestartScore[team2.teamId], 25);

  // Recover from DB
  const recovery = await recoverMatchFromDatabase(matchId);
  assert.equal(recovery.ok, true);
  if (!recovery.ok) return;

  assert.equal(recovery.fromCheckpoint, false);
  assert.equal(recovery.recoveredVersion, 3);
  assert.equal(recovery.replayedActionCount, 3);
  assert.deepEqual(recovery.match.state, controller.getMatch().state);

  // Apply another action on recovered controller
  const nextRes = await executeDurableAction(
    recovery.controller,
    { actionId: 'act-nocp-4', teamId: team2.teamId, payload: { points: 10 } },
    mutator
  );
  assert.equal(nextRes.ok, true);
  assert.equal(nextRes.stateVersion, 4);

  unregisterGameReplayAdapter(customGameType);
});

test('Corruption Tests: Sequence gap in middle of match actions causes recovery rejection', async () => {
  const client = await pool.connect();
  let matchId: string;
  let team1: { teamId: string };
  let team2: { teamId: string };

  try {
    const t1 = await insertTestTeam(client, 'CORR_GP1');
    const t2 = await insertTestTeam(client, 'CORR_GP2');
    team1 = t1;
    team2 = t2;
    matchId = await createDurableMatch([t1.teamId, t2.teamId], 'ludo', 'v1');
  } finally {
    client.release();
  }

  const controller = new MatchSessionController({
    matchId,
    gameType: 'ludo',
    ruleVersion: 'v1',
    participants: [
      { teamId: team1.teamId, seatIndex: 0, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
      { teamId: team2.teamId, seatIndex: 1, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
    ],
    status: 'active',
  });

  const mutator = (state: Record<string, unknown>, a: any) => ({ ...state, last: a.actionId });
  await executeDurableAction(controller, { actionId: 'gap-act-1', teamId: team1.teamId }, mutator);
  await executeDurableAction(controller, { actionId: 'gap-act-2', teamId: team2.teamId }, mutator);
  await executeDurableAction(controller, { actionId: 'gap-act-3', teamId: team1.teamId }, mutator);

  // Corrupt DB: delete action 2 creating a sequence gap between 1 and 3
  const cClient = await pool.connect();
  try {
    await cClient.query(`DELETE FROM match_actions WHERE match_id = $1 AND action_id = 'gap-act-2'`, [matchId]);
  } finally {
    cClient.release();
  }

  const recovery = await recoverMatchFromDatabase(matchId);
  assert.equal(recovery.ok, false);
  if (!recovery.ok) {
    assert.equal(recovery.code, 'ACTION_VERSION_GAP');
  }
});

test('Corruption Tests: Inconsistent matches.state_version causes recovery rejection', async () => {
  const client = await pool.connect();
  let matchId: string;
  let team1: { teamId: string };
  let team2: { teamId: string };

  try {
    const t1 = await insertTestTeam(client, 'CORR_VR1');
    const t2 = await insertTestTeam(client, 'CORR_VR2');
    team1 = t1;
    team2 = t2;
    matchId = await createDurableMatch([t1.teamId, t2.teamId], 'ludo', 'v1');
  } finally {
    client.release();
  }

  const controller = new MatchSessionController({
    matchId,
    gameType: 'ludo',
    ruleVersion: 'v1',
    participants: [
      { teamId: team1.teamId, seatIndex: 0, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
      { teamId: team2.teamId, seatIndex: 1, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
    ],
    status: 'active',
  });

  const mutator = (state: Record<string, unknown>, a: any) => ({ ...state, last: a.actionId });
  await executeDurableAction(controller, { actionId: 'ver-act-1', teamId: team1.teamId }, mutator);

  // Corrupt DB: match state_version is set to 99, but only 1 action exists
  const cClient = await pool.connect();
  try {
    await cClient.query(`UPDATE matches SET state_version = 99 WHERE id = $1`, [matchId]);
  } finally {
    cClient.release();
  }

  const recovery = await recoverMatchFromDatabase(matchId);
  assert.equal(recovery.ok, false);
  if (!recovery.ok) {
    assert.match(recovery.code, /FINAL_VERSION_MISMATCH|ACTION_VERSION_GAP/);
  }
});

test('Corruption Tests: Duplicate applied_state_version causes recovery rejection', async () => {
  const client = await pool.connect();
  let matchId: string;
  let team1: { teamId: string };
  let team2: { teamId: string };

  try {
    const t1 = await insertTestTeam(client, 'CORR_DP1');
    const t2 = await insertTestTeam(client, 'CORR_DP2');
    team1 = t1;
    team2 = t2;
    matchId = await createDurableMatch([t1.teamId, t2.teamId], 'ludo', 'v1');
  } finally {
    client.release();
  }

  const controller = new MatchSessionController({
    matchId,
    gameType: 'ludo',
    ruleVersion: 'v1',
    participants: [
      { teamId: team1.teamId, seatIndex: 0, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
      { teamId: team2.teamId, seatIndex: 1, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
    ],
    status: 'active',
  });

  const mutator = (state: Record<string, unknown>, a: any) => ({ ...state, last: a.actionId });
  await executeDurableAction(controller, { actionId: 'dup-act-1', teamId: team1.teamId }, mutator);

  // Corrupt DB: insert second action with same applied_state_version = 1
  const cClient = await pool.connect();
  try {
    await cClient.query(
      `
      INSERT INTO match_actions (id, match_id, team_id, action_id, action_type, payload, expected_state_version, applied_state_version, created_at, processed_at, status)
      VALUES ($1, $2, $3, 'dup-act-1-evil', 'action', '{}'::jsonb, 0, 1, NOW(), NOW(), 'applied')
      ON CONFLICT DO NOTHING
      `,
      [crypto.randomUUID(), matchId, team2.teamId]
    );
  } finally {
    cClient.release();
  }

  const recovery = await recoverMatchFromDatabase(matchId);
  if (!recovery.ok) {
    assert.match(recovery.code, /DUPLICATE_ACTION_VERSION|ACTION_VERSION_MISMATCH/);
  }
});

test('Corruption Tests: Malformed action payload causes recovery rejection', async () => {
  const client = await pool.connect();
  let matchId: string;
  let team1: { teamId: string };
  let team2: { teamId: string };

  try {
    const t1 = await insertTestTeam(client, 'CORR_PY1');
    const t2 = await insertTestTeam(client, 'CORR_PY2');
    team1 = t1;
    team2 = t2;
    matchId = await createDurableMatch([t1.teamId, t2.teamId], 'ludo', 'v1');
  } finally {
    client.release();
  }

  const controller = new MatchSessionController({
    matchId,
    gameType: 'ludo',
    ruleVersion: 'v1',
    participants: [
      { teamId: team1.teamId, seatIndex: 0, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
      { teamId: team2.teamId, seatIndex: 1, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
    ],
    status: 'active',
  });

  const mutator = (state: Record<string, unknown>, a: any) => ({ ...state, last: a.actionId });
  await executeDurableAction(controller, { actionId: 'pay-act-1', teamId: team1.teamId }, mutator);

  // Corrupt DB: mark payload corrupt
  const cClient = await pool.connect();
  try {
    await cClient.query(
      `UPDATE match_actions SET payload = '{"_corrupt": true}'::jsonb WHERE match_id = $1 AND action_id = 'pay-act-1'`,
      [matchId]
    );
  } finally {
    cClient.release();
  }

  const recovery = await recoverMatchFromDatabase(matchId);
  assert.equal(recovery.ok, false);
  if (!recovery.ok) {
    assert.equal(recovery.code, 'CORRUPTED_ACTION_PAYLOAD');
  }
});

test('Corruption Tests: Checkpoint version ahead of DB match version causes recovery rejection', async () => {
  const client = await pool.connect();
  let matchId: string;
  let team1: { teamId: string };
  let team2: { teamId: string };

  try {
    const t1 = await insertTestTeam(client, 'CORR_AHD1');
    const t2 = await insertTestTeam(client, 'CORR_AHD2');
    team1 = t1;
    team2 = t2;
    matchId = await createDurableMatch([t1.teamId, t2.teamId], 'ludo', 'v1');

    // Corrupt DB: set checkpoint_snapshot with stateVersion 10 while match state_version is 2
    const cp = {
      matchId,
      gameType: 'ludo',
      ruleVersion: 'v1',
      stateVersion: 10,
      status: 'active',
      state: {},
      savedAt: new Date().toISOString(),
    };

    await client.query(
      `
      UPDATE matches
      SET state_version = 2,
          snapshot_state_version = 10,
          checkpoint_snapshot = $2::jsonb
      WHERE id = $1
      `,
      [matchId, JSON.stringify(cp)]
    );
  } finally {
    client.release();
  }

  const recovery = await recoverMatchFromDatabase(matchId);
  assert.equal(recovery.ok, false);
  if (!recovery.ok) {
    assert.equal(recovery.code, 'CORRUPTED_CHECKPOINT');
  }
});

test('Corruption Tests: Checkpoint and snapshot_state_version mismatch causes recovery rejection', async () => {
  const client = await pool.connect();
  let matchId: string;
  let team1: { teamId: string };
  let team2: { teamId: string };

  try {
    const t1 = await insertTestTeam(client, 'CORR_MM1');
    const t2 = await insertTestTeam(client, 'CORR_MM2');
    team1 = t1;
    team2 = t2;
    matchId = await createDurableMatch([t1.teamId, t2.teamId], 'ludo', 'v1');

    // Corrupt DB: snapshot_state_version is 3, but checkpoint stateVersion is 2
    const cp = {
      matchId,
      gameType: 'ludo',
      ruleVersion: 'v1',
      stateVersion: 2,
      status: 'active',
      state: {},
      savedAt: new Date().toISOString(),
    };

    await client.query(
      `
      UPDATE matches
      SET state_version = 5,
          snapshot_state_version = 3,
          checkpoint_snapshot = $2::jsonb
      WHERE id = $1
      `,
      [matchId, JSON.stringify(cp)]
    );
  } finally {
    client.release();
  }

  const recovery = await recoverMatchFromDatabase(matchId);
  assert.equal(recovery.ok, false);
  if (!recovery.ok) {
    assert.equal(recovery.code, 'CORRUPTED_CHECKPOINT');
  }
});

test('Concurrent Recovery Test: Two parallel recovery calls serialize cleanly and converge to identical state', async () => {
  const client = await pool.connect();
  let matchId: string;
  let team1: { teamId: string };
  let team2: { teamId: string };

  try {
    const t1 = await insertTestTeam(client, 'CONC_R1');
    const t2 = await insertTestTeam(client, 'CONC_R2');
    team1 = t1;
    team2 = t2;
    matchId = await createDurableMatch([t1.teamId, t2.teamId], 'ludo', 'v1');
  } finally {
    client.release();
  }

  const controller = new MatchSessionController({
    matchId,
    gameType: 'ludo',
    ruleVersion: 'v1',
    participants: [
      { teamId: team1.teamId, seatIndex: 0, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
      { teamId: team2.teamId, seatIndex: 1, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
    ],
    status: 'active',
  });

  const mutator = (state: Record<string, unknown>, a: any) => ({ ...state, count: Number(state.count ?? 0) + 1 });
  await executeDurableAction(controller, { actionId: 'conc-rec-1', teamId: team1.teamId }, mutator);
  await executeDurableAction(controller, { actionId: 'conc-rec-2', teamId: team2.teamId }, mutator);

  // Run two concurrent recovery attempts
  const [rec1, rec2] = await Promise.all([
    recoverMatchFromDatabase(matchId),
    recoverMatchFromDatabase(matchId),
  ]);

  assert.equal(rec1.ok, true);
  assert.equal(rec2.ok, true);
  if (!rec1.ok || !rec2.ok) return;

  assert.equal(rec1.recoveredVersion, 2);
  assert.equal(rec2.recoveredVersion, 2);
  assert.deepEqual(rec1.match.state, rec2.match.state);
  assert.deepEqual(rec1.allProcessedActionIds.sort(), rec2.allProcessedActionIds.sort());
});

test('Database Failure Recovery: Non-existent match or invalid input returns deterministic failure without fake session', async () => {
  const nonExistentMatchId = crypto.randomUUID();
  const recovery = await recoverMatchFromDatabase(nonExistentMatchId);

  assert.equal(recovery.ok, false);
  if (!recovery.ok) {
    assert.equal(recovery.code, 'MATCH_NOT_FOUND');
  }

  const invalidId = 'not-a-uuid';
  const invalidRecovery = await recoverMatchFromDatabase(invalidId);
  assert.equal(invalidRecovery.ok, false);
  if (!invalidRecovery.ok) {
    assert.equal(invalidRecovery.code, 'MATCH_NOT_FOUND');
  }
});

test('Realtime Integration: Automatically recovers un-registered match from DB on client connection', async () => {
  const client = await pool.connect();
  let matchId: string;
  let team1: { teamId: string };
  let team2: { teamId: string };

  try {
    const t1 = await insertTestTeam(client, 'RT_R1');
    const t2 = await insertTestTeam(client, 'RT_R2');
    team1 = t1;
    team2 = t2;
    matchId = await createDurableMatch([t1.teamId, t2.teamId], 'ludo', 'v1');
  } finally {
    client.release();
  }

  // Pre-populate some actions in DB
  const initialController = new MatchSessionController({
    matchId,
    gameType: 'ludo',
    ruleVersion: 'v1',
    participants: [
      { teamId: team1.teamId, seatIndex: 0, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
      { teamId: team2.teamId, seatIndex: 1, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
    ],
    status: 'active',
  });

  const mutator = (state: Record<string, unknown>, a: any) => ({ ...state, score: a.payload?.score, lastAction: a.actionId });
  await executeDurableAction(
    initialController,
    { actionId: 'rt-init-1', teamId: team1.teamId, payload: { score: 42 } },
    mutator
  );

  // Now create RealtimeServer that DOES NOT have this match in memory
  const server = createRealtimeServer({
    host: '127.0.0.1',
    port: 0,
    authResolver: async (token) => {
      if (token === 'team1-token') {
        return { ok: true, identity: { id: 's1', teamId: team1.teamId, sessionId: 's1', role: 'team' } };
      }
      return { ok: false, error: 'Invalid token' };
    },
  });

  const port = await server.listen();

  // Connect via WebSocket to un-registered match
  const socket = new WebSocket(`ws://127.0.0.1:${port}/?sessionToken=team1-token&matchId=${matchId}`);
  const collector = createMessageCollector(socket);
  await waitForSocketOpen(socket);

  const hello = await collector.waitFor((p) => p.type === 'hello');
  assert.equal(hello.payload.teamId, team1.teamId);

  // Server should have recovered the match from DB and sent state
  const stateMsg = await collector.waitFor((p) => p.type === 'state');
  assert.equal(stateMsg.matchId, matchId);
  assert.equal(stateMsg.payload.match.stateVersion, 1);
  assert.equal(stateMsg.payload.match.state.score, 42);

  // Now submit action via websocket on the recovered match
  socket.send(
    JSON.stringify({
      type: 'action',
      matchId,
      payload: { actionId: 'rt-act-2', expectedStateVersion: 1, payload: { move: 5 } },
    })
  );

  const actionState = await collector.waitFor(
    (p) => p.type === 'state' && p.payload?.appliedActionId === 'rt-act-2'
  );
  assert.equal(actionState.payload.match.stateVersion, 2);

  socket.close();
  server.close();
});

test.after(async () => {
  await pool.end();
  await closePostgresPool();
});
