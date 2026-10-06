import test from 'node:test';
import assert from 'node:assert/strict';

import { finalizeMatchResultInStore, type MatchFinalizationStore, type MatchRecord, type PersistedMatchResultRow } from './resultFinalization';

function createStore(initialStatus: string = 'waiting') {
  const matches = new Map<string, MatchRecord>();
  const resultByMatch = new Map<string, PersistedMatchResultRow>();
  const resultByKey = new Map<string, PersistedMatchResultRow>();

  const store: MatchFinalizationStore = {
    async readMatch(matchId: string) {
      return matches.get(matchId) ?? null;
    },
    async readResultByMatchId(matchId: string) {
      return resultByMatch.get(matchId) ?? null;
    },
    async readResultByIdempotencyKey(idempotencyKey: string) {
      return resultByKey.get(idempotencyKey) ?? null;
    },
    async insertResult(row: PersistedMatchResultRow) {
      matches.set(row.match_id, {
        id: row.match_id,
        status: 'completed',
        winner_team_id: row.winner_team_id,
        metadata: {},
        state_version: 1,
      });
      resultByMatch.set(row.match_id, row);
      resultByKey.set(row.idempotency_key, row);
      return row;
    },
    async updateMatch(matchId: string, values: Partial<MatchRecord>) {
      const existing = matches.get(matchId) ?? {
        id: matchId,
        status: initialStatus,
        winner_team_id: null,
        metadata: {},
        state_version: 0,
      };

      const next: MatchRecord = {
        ...existing,
        ...values,
        metadata: {
          ...(existing.metadata ?? {}),
          ...(values.metadata ?? {}),
        },
        state_version: values.state_version ?? existing.state_version,
      };

      matches.set(matchId, next);
      return next;
    },
  };

  const matchId = 'match-1';
  matches.set(matchId, {
    id: matchId,
    status: initialStatus,
    winner_team_id: null,
    metadata: {},
    state_version: 0,
  });

  return { store, matchId };
}

const baseRequest = {
  result: {
    matchId: 'match-1',
    winnerTeamId: 'TEAM-01',
    resultSummary: { winner: 'TEAM-01' },
    scoreSummary: { 'TEAM-01': 10, 'TEAM-02': 4 },
    rewards: { 'TEAM-01': { coins: 25 } },
    idempotencyKey: 'match-1-finalized',
    status: 'completed' as const,
    serverStateVersion: 4,
  },
  context: { source: 'server' as const },
};

test('first finalization succeeds and records terminal completion', async () => {
  const { store, matchId } = createStore('waiting');
  const response = await finalizeMatchResultInStore(store, {
    ...baseRequest,
    result: { ...baseRequest.result, matchId },
  });

  assert.equal(response.ok, true);
  if (response.ok) {
    assert.equal(response.result.matchId, matchId);
    assert.equal(response.result.winnerTeamId, 'TEAM-01');
    assert.equal(response.result.duplicate, false);
  }

  const match = await store.readMatch(matchId);
  assert.equal(match?.status, 'completed');
  assert.equal(match?.winner_team_id, 'TEAM-01');
});

test('identical retry is idempotent and returns the existing result', async () => {
  const { store, matchId } = createStore('waiting');
  const first = await finalizeMatchResultInStore(store, {
    ...baseRequest,
    result: { ...baseRequest.result, matchId },
  });

  assert.equal(first.ok, true);
  const second = await finalizeMatchResultInStore(store, {
    ...baseRequest,
    result: { ...baseRequest.result, matchId },
  });

  assert.equal(second.ok, true);
  if (second.ok) {
    assert.equal(second.result.duplicate, true);
    assert.equal(second.result.idempotencyKey, baseRequest.result.idempotencyKey);
  }
});

test('conflicting retry is rejected and cannot overwrite an existing result', async () => {
  const { store, matchId } = createStore('waiting');
  const first = await finalizeMatchResultInStore(store, {
    ...baseRequest,
    result: { ...baseRequest.result, matchId, winnerTeamId: 'TEAM-01', idempotencyKey: 'match-1-finalized-a' },
  });

  assert.equal(first.ok, true);

  const second = await finalizeMatchResultInStore(store, {
    ...baseRequest,
    result: { ...baseRequest.result, matchId, winnerTeamId: 'TEAM-02', idempotencyKey: 'match-1-finalized-b' },
  });

  assert.equal(second.ok, false);
  if (!second.ok) {
    assert.match(second.error, /same match cannot produce two different final results|conflicting result already finalized/i);
  }
});

test('same match cannot produce two results', async () => {
  const { store, matchId } = createStore('waiting');
  const one = await finalizeMatchResultInStore(store, {
    ...baseRequest,
    result: { ...baseRequest.result, matchId, idempotencyKey: 'result-1' },
  });
  const two = await finalizeMatchResultInStore(store, {
    ...baseRequest,
    result: { ...baseRequest.result, matchId, winnerTeamId: 'TEAM-02', idempotencyKey: 'result-2' },
  });

  assert.equal(one.ok, true);
  assert.equal(two.ok, false);
  const existingResults = await store.readResultByMatchId(matchId);
  assert.ok(existingResults);
  assert.equal(existingResults?.idempotency_key, 'result-1');
});

test('result finalization cannot be performed from an unauthorized or non-authoritative context', async () => {
  const { store, matchId } = createStore('waiting');
  const response = await finalizeMatchResultInStore(store, {
    ...baseRequest,
    context: { source: 'client' },
    result: { ...baseRequest.result, matchId },
  });

  assert.equal(response.ok, false);
  if (!response.ok) {
    assert.match(response.error, /authoritative server-side context/i);
  }
});

test('match completion state is terminal and later finalization attempts are rejected', async () => {
  const { store, matchId } = createStore('completed');
  const response = await finalizeMatchResultInStore(store, {
    ...baseRequest,
    result: { ...baseRequest.result, matchId },
  });

  assert.equal(response.ok, false);
  if (!response.ok) {
    assert.match(response.error, /terminal|already finalized/i);
  }
});
