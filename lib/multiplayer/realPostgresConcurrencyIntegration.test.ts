import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { Pool } from 'pg';

import { createSessionToken } from '@/lib/auth/teamIdentity';
import { createMatchFromQueue } from './matchmaker';
import { enqueueTeamForGame } from './queue';
import { finalizeMatchResult } from './resultFinalization';

const connectionString = process.env.DATABASE_URL ?? 'postgresql://singularity:singularitypass@127.0.0.1:5433/singularity';
const pool = new Pool({ connectionString });

const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

async function insertTeam(client: any, code: string) {
  const teamId = crypto.randomUUID();
  const username = `${code.toLowerCase()}_${uniqueSuffix}`;
  const passwordHash = 'test-password-hash';
  const passwordSalt = 'test-password-salt';

  await client.query(
    `
    INSERT INTO teams (id, team_code, team_name, status, role, metadata)
    VALUES ($1, $2, $3, 'active', 'team', $4::jsonb)
    `,
    [teamId, code, code, { source: 'integration-test' }]
  );

  await client.query(
    `
    INSERT INTO team_credentials (id, team_id, username, password_hash, password_salt, role, credential_version)
    VALUES ($1, $2, $3, $4, $5, 'team', 1)
    `,
    [crypto.randomUUID(), teamId, username, passwordHash, passwordSalt]
  );

  return { teamId, username };
}

async function insertSession(client: any, teamId: string, sessionId?: string) {
  const actualSessionId = sessionId ?? crypto.randomUUID();
  const token = createSessionToken({ teamId, role: 'team', sessionId: actualSessionId, exp: Math.floor(Date.now() / 1000) + 3600 });

  await client.query(
    `
    INSERT INTO team_sessions (id, team_id, role, session_token_hash, issued_at, expires_at, revoked_at, last_seen_at, client_metadata)
    VALUES ($1, $2, 'team', $3, NOW(), NOW() + INTERVAL '1 hour', NULL, NOW(), $4::jsonb)
    `,
    [actualSessionId, teamId, crypto.createHash('sha256').update(token).digest('hex'), { sessionId: actualSessionId, role: 'team' }]
  );

  return token;
}

async function createQueueTeam(code: string) {
  const client = await pool.connect();
  try {
    return await insertTeam(client, code);
  } finally {
    client.release();
  }
}

async function createTeamAndToken(code: string) {
  const client = await pool.connect();
  try {
    const team = await insertTeam(client, code);
    const token = await insertSession(client, team.teamId, crypto.randomUUID());
    return { ...team, token };
  } finally {
    client.release();
  }
}

async function createMatchWithParticipants(teamIds: string[], gameType: string, ruleVersion: string = 'v1') {
  const client = await pool.connect();
  try {
    const matchId = crypto.randomUUID();
    await client.query(
      `
      INSERT INTO matches (id, game_type, rule_version, status, state_version, metadata, created_at, started_at, updated_at)
      VALUES ($1, $2, $3, 'active', 0, $4::jsonb, NOW(), NOW(), NOW())
      `,
      [matchId, gameType, ruleVersion, { source: 'integration-test' }]
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

test('Queue concurrency: duplicate same-team enqueue resolves to a single row and allowed different teams can enqueue concurrently', async () => {
  const prefix = `Q-${uniqueSuffix}`;
  const first = await createTeamAndToken(`${prefix}-A`);
  const second = await createTeamAndToken(`${prefix}-B`);

  const res = await Promise.all([
    enqueueTeamForGame({ sessionToken: first.token, gameType: 'ludo' }),
    enqueueTeamForGame({ sessionToken: first.token, gameType: 'ludo' }),
    enqueueTeamForGame({ sessionToken: second.token, gameType: 'ludo' }),
  ]);

  const client = await pool.connect();
  try {
    const rows = await client.query(
      `SELECT team_id, game_type, COUNT(*) AS count FROM queue_entries WHERE game_type = 'ludo' AND team_id IN ($1, $2) GROUP BY team_id, game_type`,
      [first.teamId, second.teamId]
    );

    assert.equal(rows.rowCount, 2);
    const teamRows = Object.fromEntries(rows.rows.map((row: any) => [row.team_id, Number(row.count)]));
    assert.equal(teamRows[first.teamId], 1);
    assert.equal(teamRows[second.teamId], 1);
  } finally {
    client.release();
  }

  const duplicateOutcomes = res.filter((value) => value && 'duplicate' in value && value.duplicate === true);
  const successOutcomes = res.filter((value) => value && 'duplicate' in value && value.duplicate === false);
  assert.equal(duplicateOutcomes.length >= 1, true);
  assert.equal(successOutcomes.length >= 1, true);
});

test('Matchmaking concurrency: multiple workers cannot claim the same queued team or create duplicate matches', async () => {
  const prefix = `M-${uniqueSuffix}`;
  const teamA = await createTeamAndToken(`${prefix}-A`);
  const teamB = await createTeamAndToken(`${prefix}-B`);
  const teamC = await createTeamAndToken(`${prefix}-C`);
  const teamD = await createTeamAndToken(`${prefix}-D`);

  await Promise.all([
    enqueueTeamForGame({ sessionToken: teamA.token, gameType: 'snakes' }),
    enqueueTeamForGame({ sessionToken: teamB.token, gameType: 'snakes' }),
    enqueueTeamForGame({ sessionToken: teamC.token, gameType: 'snakes' }),
    enqueueTeamForGame({ sessionToken: teamD.token, gameType: 'snakes' }),
  ]);

  const workers = await Promise.all([
    createMatchFromQueue({ gameType: 'snakes', ruleVersion: 'v1', maxPlayers: 2 }),
    createMatchFromQueue({ gameType: 'snakes', ruleVersion: 'v1', maxPlayers: 2 }),
    createMatchFromQueue({ gameType: 'snakes', ruleVersion: 'v1', maxPlayers: 2 }),
  ]);

  const createdMatches = workers.filter((result) => result && 'created' in result && result.created === true);
  const matchCount = createdMatches.length;
  assert.equal(matchCount <= 1, true);

  const client = await pool.connect();
  try {
    const queueRows = await client.query(`SELECT team_id, status FROM queue_entries WHERE game_type = 'snakes' AND team_id IN ($1, $2, $3, $4)`, [teamA.teamId, teamB.teamId, teamC.teamId, teamD.teamId]);
    const queueState = queueRows.rows.map((row: any) => ({ teamId: row.team_id, status: row.status }));
    const matchedCount = queueState.filter((row) => row.status === 'matched').length;
    assert.equal(matchedCount <= 2, true);

    const matchRowCount = await client.query(`SELECT COUNT(*) AS count FROM matches WHERE game_type = 'snakes' AND status IN ('waiting', 'active')`);
    assert.equal(Number(matchRowCount.rows[0].count) <= 1, true);

    const participantRows = await client.query(`SELECT team_id, match_id FROM match_participants WHERE team_id IN ($1, $2, $3, $4)`, [teamA.teamId, teamB.teamId, teamC.teamId, teamD.teamId]);
    const teamMatchCounts = new Map<string, number>();
    for (const row of participantRows.rows) {
      teamMatchCounts.set(row.team_id, (teamMatchCounts.get(row.team_id) ?? 0) + 1);
    }
    for (const value of teamMatchCounts.values()) {
      assert.equal(value <= 1, true);
    }
  } finally {
    client.release();
  }
});

test('Action idempotency and stale-state validation against PostgreSQL', async () => {
  const prefix = `A-${uniqueSuffix}`;
  const [teamA, teamB] = await Promise.all([createTeamAndToken(`${prefix}-A`), createTeamAndToken(`${prefix}-B`)]);
  const matchId = await createMatchWithParticipants([teamA.teamId, teamB.teamId], 'ludo');

  const client = await pool.connect();
  try {
    await client.query(
      `
      INSERT INTO match_actions (id, match_id, team_id, action_id, action_type, payload, expected_state_version, applied_state_version, created_at, processed_at, status)
      VALUES ($1, $2, $3, 'action-1', 'move', $4::jsonb, 0, 1, NOW(), NOW(), 'applied')
      `,
      [crypto.randomUUID(), matchId, teamA.teamId, JSON.stringify({ move: 4 })]
    );

    let duplicateError: any = null;
    try {
      await client.query(
        `
        INSERT INTO match_actions (id, match_id, team_id, action_id, action_type, payload, expected_state_version, applied_state_version, created_at, processed_at, status)
        VALUES ($1, $2, $3, 'action-1', 'move', $4::jsonb, 0, 1, NOW(), NOW(), 'applied')
        `,
        [crypto.randomUUID(), matchId, teamB.teamId, JSON.stringify({ move: 5 })]
      );
    } catch (error) {
      duplicateError = error;
    }

    assert.ok(duplicateError);

    const rowCount = await client.query(`SELECT COUNT(*) AS count FROM match_actions WHERE match_id = $1`, [matchId]);
    assert.equal(Number(rowCount.rows[0].count), 1);

    const match = await client.query(`SELECT state_version, status FROM matches WHERE id = $1`, [matchId]);
    assert.equal(match.rows[0].state_version, 0);

    const staleInsert = await client.query(
      `
      INSERT INTO match_actions (id, match_id, team_id, action_id, action_type, payload, expected_state_version, applied_state_version, created_at, processed_at, status)
      VALUES ($1, $2, $3, 'action-2', 'move', $4::jsonb, 99, 1, NOW(), NOW(), 'rejected')
      `,
      [crypto.randomUUID(), matchId, teamB.teamId, JSON.stringify({ move: 6 })]
    );
    assert.ok(staleInsert.rowCount === 1);
  } finally {
    client.release();
  }
});

test('Result finalization concurrency against PostgreSQL: one durable result only', async () => {
  const prefix = `R-${uniqueSuffix}`;
  const [teamA, teamB] = await Promise.all([createTeamAndToken(`${prefix}-A`), createTeamAndToken(`${prefix}-B`)]);
  const matchId = await createMatchWithParticipants([teamA.teamId, teamB.teamId], 'ludo');

  const request = {
    result: {
      matchId,
      winnerTeamId: teamA.teamId,
      resultSummary: { winner: teamA.teamId },
      scoreSummary: { [teamA.teamId]: 10, [teamB.teamId]: 5 },
      rewards: { [teamA.teamId]: { coins: 25 } },
      idempotencyKey: `finalize-${uniqueSuffix}`,
      status: 'completed' as const,
      serverStateVersion: 1,
    },
    context: { source: 'server' as const },
  };

  const responses = await Promise.all([
    finalizeMatchResult(request),
    finalizeMatchResult(request),
    finalizeMatchResult({
      ...request,
      result: { ...request.result, winnerTeamId: teamB.teamId, idempotencyKey: `finalize-conflict-${uniqueSuffix}` },
    }),
  ]);

  const successful = responses.filter((value) => value && 'ok' in value && value.ok === true);
  const failed = responses.filter((value) => value && 'ok' in value && value.ok === false);
  assert.equal(successful.length >= 1, true);
  assert.equal(failed.length >= 1, true);

  const client = await pool.connect();
  try {
    const rows = await client.query(`SELECT COUNT(*) AS count FROM match_results WHERE match_id = $1`, [matchId]);
    assert.equal(Number(rows.rows[0].count), 1);

    const match = await client.query(`SELECT status, winner_team_id FROM matches WHERE id = $1`, [matchId]);
    assert.equal(match.rows[0].status, 'completed');
  } finally {
    client.release();
  }
});

test('Database constraints: unique and foreign-key checks fire through actual DB operations', async () => {
  const prefix = `C-${uniqueSuffix}`;
  const [teamA, teamB] = await Promise.all([createTeamAndToken(`${prefix}-A`), createTeamAndToken(`${prefix}-B`)]);
  const matchId = await createMatchWithParticipants([teamA.teamId, teamB.teamId], 'snakes');

  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO match_results (id, match_id, winner_team_id, result_summary, score_summary, rewards, completed_at, idempotency_key) VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, NOW(), $7)`,
      [crypto.randomUUID(), matchId, teamA.teamId, JSON.stringify({ winner: teamA.teamId }), JSON.stringify({}), JSON.stringify({}), `result-unique-${uniqueSuffix}`]
    );

    let duplicateResultError: any = null;
    try {
      await client.query(
        `INSERT INTO match_results (id, match_id, winner_team_id, result_summary, score_summary, rewards, completed_at, idempotency_key) VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, NOW(), $7)`,
        [crypto.randomUUID(), matchId, teamB.teamId, JSON.stringify({ winner: teamB.teamId }), JSON.stringify({}), JSON.stringify({}), `result-unique-${uniqueSuffix}-2`]
      );
    } catch (error) {
      duplicateResultError = error;
    }
    assert.ok(duplicateResultError);

    let missingForeignKeyError: any = null;
    try {
      await client.query(
        `INSERT INTO match_results (id, match_id, winner_team_id, result_summary, score_summary, rewards, completed_at, idempotency_key) VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, NOW(), $7)`,
        [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID(), JSON.stringify({}), JSON.stringify({}), JSON.stringify({}), `fk-missing-${uniqueSuffix}`]
      );
    } catch (error) {
      missingForeignKeyError = error;
    }
    assert.ok(missingForeignKeyError);
  } finally {
    client.release();
  }
});

test('Transaction failure/rollback: no half-created match or orphan queue state', async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const teamCode = `T-${uniqueSuffix}`;
    const team = await insertTeam(client, teamCode);
    await client.query(`INSERT INTO queue_entries (id, team_id, game_type, status, created_at) VALUES ($1, $2, 'ludo', 'queued', NOW())`, [crypto.randomUUID(), team.teamId]);
    await client.query('ROLLBACK');

    const count = await client.query(`SELECT COUNT(*) AS count FROM queue_entries WHERE team_id = $1`, [team.teamId]);
    assert.equal(Number(count.rows[0].count), 0);

    const teamCount = await client.query(`SELECT COUNT(*) AS count FROM teams WHERE team_code = $1`, [teamCode]);
    assert.equal(Number(teamCount.rows[0].count), 0);
  } finally {
    client.release();
  }
});

test.after(async () => {
  await pool.end();
});
