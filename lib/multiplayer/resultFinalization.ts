import crypto from 'node:crypto';

import { withDatabase } from '@/lib/db/postgres';

export type MatchFinalizationAuthority = 'server' | 'client';

export interface MatchResultFinalizationContext {
  source: MatchFinalizationAuthority;
  requestId?: string;
  actorTeamId?: string | null;
}

export interface MatchResultCandidate {
  matchId: string;
  winnerTeamId: string | null;
  resultSummary?: Record<string, unknown>;
  scoreSummary?: Record<string, unknown>;
  rewards?: Record<string, unknown>;
  idempotencyKey: string;
  completedAt?: string;
  status?: 'completed';
  serverStateVersion?: number;
}

export interface FinalizeMatchResultRequest {
  result: MatchResultCandidate;
  context: MatchResultFinalizationContext;
  leaderboardUpdate?: boolean;
}

export interface PersistedMatchResultRow {
  id: string;
  match_id: string;
  winner_team_id: string | null;
  result_summary: Record<string, unknown>;
  score_summary: Record<string, unknown>;
  rewards: Record<string, unknown>;
  completed_at: string;
  idempotency_key: string;
}

export interface FinalizedResultRecord {
  id: string;
  matchId: string;
  winnerTeamId: string | null;
  resultSummary: Record<string, unknown>;
  scoreSummary: Record<string, unknown>;
  rewards: Record<string, unknown>;
  completedAt: string;
  idempotencyKey: string;
  duplicate: boolean;
}

export interface MatchRecord {
  id: string;
  status: string;
  winner_team_id: string | null;
  metadata: Record<string, unknown>;
  state_version: number;
}

export interface MatchFinalizationStore {
  readMatch(matchId: string): Promise<MatchRecord | null>;
  readResultByMatchId(matchId: string): Promise<PersistedMatchResultRow | null>;
  readResultByIdempotencyKey(idempotencyKey: string): Promise<PersistedMatchResultRow | null>;
  insertResult(row: PersistedMatchResultRow): Promise<PersistedMatchResultRow>;
  updateMatch(matchId: string, values: Partial<MatchRecord>): Promise<MatchRecord>;
}

export function isAuthoritativeFinalizationContext(context?: MatchResultFinalizationContext) {
  return !!context && context.source === 'server';
}

export function normalizeFinalizationResult(result: MatchResultCandidate): MatchResultCandidate {
  const matchId = String(result.matchId ?? '').trim();
  const idempotencyKey = String(result.idempotencyKey ?? '').trim();

  return {
    ...result,
    matchId,
    idempotencyKey,
    winnerTeamId: result.winnerTeamId ?? null,
    resultSummary: (result.resultSummary ?? {}) as Record<string, unknown>,
    scoreSummary: (result.scoreSummary ?? {}) as Record<string, unknown>,
    rewards: (result.rewards ?? {}) as Record<string, unknown>,
    completedAt: result.completedAt ?? new Date().toISOString(),
    status: result.status ?? 'completed',
    serverStateVersion: typeof result.serverStateVersion === 'number' ? result.serverStateVersion : 0,
  };
}

export function isMatchCompletableStatus(status?: string | null) {
  return status === 'waiting' || status === 'active';
}

export function finalizeMatchResultInStore(store: MatchFinalizationStore, request: FinalizeMatchResultRequest): Promise<
  | { ok: true; result: FinalizedResultRecord }
  | { ok: false; error: string }
> {
  if (!isAuthoritativeFinalizationContext(request.context)) {
    return Promise.resolve({ ok: false, error: 'Result finalization must originate from an authoritative server-side context.' });
  }

  const result = normalizeFinalizationResult(request.result);

  if (!result.matchId) {
    return Promise.resolve({ ok: false, error: 'A matchId is required for finalization.' });
  }

  if (!result.idempotencyKey) {
    return Promise.resolve({ ok: false, error: 'An idempotencyKey is required for finalization.' });
  }

  if (result.status !== 'completed') {
    return Promise.resolve({ ok: false, error: 'Result finalization only accepts a completed match state.' });
  }

  return (async () => {
    const match = await store.readMatch(result.matchId);
    if (!match) {
      return { ok: false, error: 'Match does not exist.' } as const;
    }

    if (!isMatchCompletableStatus(match.status)) {
      const existingByMatch = await store.readResultByMatchId(result.matchId);
      if (existingByMatch) {
        if (existingByMatch.idempotency_key === result.idempotencyKey) {
          return {
            ok: true,
            result: {
              id: existingByMatch.id,
              matchId: existingByMatch.match_id,
              winnerTeamId: existingByMatch.winner_team_id,
              resultSummary: existingByMatch.result_summary,
              scoreSummary: existingByMatch.score_summary,
              rewards: existingByMatch.rewards,
              completedAt: existingByMatch.completed_at,
              idempotencyKey: existingByMatch.idempotency_key,
              duplicate: true,
            },
          } as const;
        }

        return { ok: false, error: 'Conflicting result already finalized for this match.' } as const;
      }

      return { ok: false, error: 'Match completion state is terminal.' } as const;
    }

    const existingByKey = await store.readResultByIdempotencyKey(result.idempotencyKey);
    if (existingByKey) {
      if (existingByKey.match_id !== result.matchId) {
        return { ok: false, error: 'This idempotency key has already been used for a different match.' } as const;
      }

      return {
        ok: true,
        result: {
          id: existingByKey.id,
          matchId: existingByKey.match_id,
          winnerTeamId: existingByKey.winner_team_id,
          resultSummary: existingByKey.result_summary,
          scoreSummary: existingByKey.score_summary,
          rewards: existingByKey.rewards,
          completedAt: existingByKey.completed_at,
          idempotencyKey: existingByKey.idempotency_key,
          duplicate: true,
        },
      } as const;
    }

    const existingByMatch = await store.readResultByMatchId(result.matchId);
    if (existingByMatch) {
      if (existingByMatch.idempotency_key === result.idempotencyKey) {
        return {
          ok: true,
          result: {
            id: existingByMatch.id,
            matchId: existingByMatch.match_id,
            winnerTeamId: existingByMatch.winner_team_id,
            resultSummary: existingByMatch.result_summary,
            scoreSummary: existingByMatch.score_summary,
            rewards: existingByMatch.rewards,
            completedAt: existingByMatch.completed_at,
            idempotencyKey: existingByMatch.idempotency_key,
            duplicate: true,
          },
        } as const;
      }

      return { ok: false, error: 'Same match cannot produce two different final results.' } as const;
    }

    const row: PersistedMatchResultRow = {
      id: crypto.randomUUID(),
      match_id: result.matchId,
      winner_team_id: result.winnerTeamId,
      result_summary: result.resultSummary ?? {},
      score_summary: result.scoreSummary ?? {},
      rewards: result.rewards ?? {},
      completed_at: result.completedAt ?? new Date().toISOString(),
      idempotency_key: result.idempotencyKey,
    };

    const persisted = await store.insertResult(row);

    await store.updateMatch(result.matchId, {
      status: 'completed',
      winner_team_id: result.winnerTeamId,
      metadata: {
        ...(match.metadata ?? {}),
        winnerTeamId: result.winnerTeamId,
        resultSummary: result.resultSummary ?? {},
        scoreSummary: result.scoreSummary ?? {},
        rewards: result.rewards ?? {},
        finalResultId: persisted.id,
        idempotencyKey: result.idempotencyKey,
      },
      state_version: Math.max(match.state_version, result.serverStateVersion ?? match.state_version),
    });

    return {
      ok: true,
      result: {
        id: persisted.id,
        matchId: persisted.match_id,
        winnerTeamId: persisted.winner_team_id,
        resultSummary: persisted.result_summary,
        scoreSummary: persisted.score_summary,
        rewards: persisted.rewards,
        completedAt: persisted.completed_at,
        idempotencyKey: persisted.idempotency_key,
        duplicate: false,
      },
    } as const;
  })();
}

export async function finalizeMatchResult(request: FinalizeMatchResultRequest) {
  if (!isAuthoritativeFinalizationContext(request.context)) {
    return { ok: false, error: 'Result finalization must originate from an authoritative server-side context.' } as const;
  }

  const result = normalizeFinalizationResult(request.result);
  const finalizationStatus = await withDatabase(async (client) => {
    await client.query('BEGIN');

    try {
      const matchQuery = await client.query(
        `
        SELECT id, status, winner_team_id, metadata, state_version
        FROM matches
        WHERE id = $1
        FOR UPDATE
        `,
        [result.matchId]
      );

      if (!matchQuery.rows[0]) {
        await client.query('ROLLBACK');
        return { ok: false, error: 'Match does not exist.' } as const;
      }

      const match = matchQuery.rows[0] as MatchRecord;
      if (!isMatchCompletableStatus(match.status)) {
        const existingResultQuery = await client.query(
          `SELECT * FROM match_results WHERE match_id = $1 LIMIT 1`,
          [result.matchId]
        );

        if (existingResultQuery.rows[0]) {
          const existing = existingResultQuery.rows[0] as PersistedMatchResultRow;
          if (existing.idempotency_key === result.idempotencyKey) {
            await client.query('COMMIT');
            return {
              ok: true,
              result: {
                id: existing.id,
                matchId: existing.match_id,
                winnerTeamId: existing.winner_team_id,
                resultSummary: existing.result_summary,
                scoreSummary: existing.score_summary,
                rewards: existing.rewards,
                completedAt: existing.completed_at,
                idempotencyKey: existing.idempotency_key,
                duplicate: true,
              },
            } as const;
          }

          await client.query('ROLLBACK');
          return { ok: false, error: 'Conflicting result already finalized for this match.' } as const;
        }

        await client.query('ROLLBACK');
        return { ok: false, error: 'Match completion state is terminal.' } as const;
      }

      const existingKeyQuery = await client.query(
        `SELECT * FROM match_results WHERE idempotency_key = $1 LIMIT 1`,
        [result.idempotencyKey]
      );

      if (existingKeyQuery.rows[0]) {
        const existing = existingKeyQuery.rows[0] as PersistedMatchResultRow;
        if (existing.match_id !== result.matchId) {
          await client.query('ROLLBACK');
          return { ok: false, error: 'This idempotency key has already been used for a different match.' } as const;
        }

        await client.query('COMMIT');
        return {
          ok: true,
          result: {
            id: existing.id,
            matchId: existing.match_id,
            winnerTeamId: existing.winner_team_id,
            resultSummary: existing.result_summary,
            scoreSummary: existing.score_summary,
            rewards: existing.rewards,
            completedAt: existing.completed_at,
            idempotencyKey: existing.idempotency_key,
            duplicate: true,
          },
        } as const;
      }

      const existingMatchResult = await client.query(
        `SELECT * FROM match_results WHERE match_id = $1 LIMIT 1`,
        [result.matchId]
      );

      if (existingMatchResult.rows[0]) {
        const existing = existingMatchResult.rows[0] as PersistedMatchResultRow;
        if (existing.idempotency_key === result.idempotencyKey) {
          await client.query('COMMIT');
          return {
            ok: true,
            result: {
              id: existing.id,
              matchId: existing.match_id,
              winnerTeamId: existing.winner_team_id,
              resultSummary: existing.result_summary,
              scoreSummary: existing.score_summary,
              rewards: existing.rewards,
              completedAt: existing.completed_at,
              idempotencyKey: existing.idempotency_key,
              duplicate: true,
            },
          } as const;
        }

        await client.query('ROLLBACK');
        return { ok: false, error: 'Same match cannot produce two different final results.' } as const;
      }

      const insertResult = await client.query(
        `
        INSERT INTO match_results (match_id, winner_team_id, result_summary, score_summary, rewards, completed_at, idempotency_key)
        VALUES ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, NOW(), $6)
        RETURNING id, match_id, winner_team_id, result_summary, score_summary, rewards, completed_at, idempotency_key
        `,
        [
          result.matchId,
          result.winnerTeamId,
          JSON.stringify(result.resultSummary ?? {}),
          JSON.stringify(result.scoreSummary ?? {}),
          JSON.stringify(result.rewards ?? {}),
          result.idempotencyKey,
        ]
      );

      const saved = insertResult.rows[0] as PersistedMatchResultRow;

      await client.query(
        `
        UPDATE matches
        SET status = 'completed',
            ended_at = NOW(),
            winner_team_id = $2,
            updated_at = NOW(),
            metadata = COALESCE(metadata, '{}'::jsonb) || $3::jsonb
        WHERE id = $1
        RETURNING id, status, winner_team_id, metadata, state_version
        `,
        [
          result.matchId,
          result.winnerTeamId,
          JSON.stringify({
            winnerTeamId: result.winnerTeamId,
            resultSummary: result.resultSummary ?? {},
            scoreSummary: result.scoreSummary ?? {},
            rewards: result.rewards ?? {},
            finalResultId: saved.id,
            idempotencyKey: result.idempotencyKey,
          }),
        ]
      );

      await client.query('COMMIT');

      return {
        ok: true,
        result: {
          id: saved.id,
          matchId: saved.match_id,
          winnerTeamId: saved.winner_team_id,
          resultSummary: saved.result_summary,
          scoreSummary: saved.score_summary,
          rewards: saved.rewards,
          completedAt: saved.completed_at,
          idempotencyKey: saved.idempotency_key,
          duplicate: false,
        },
      } as const;
    } catch (error) {
      await client.query('ROLLBACK');
      const message = error instanceof Error ? error.message : 'Result finalization failed.';

      if (/duplicate key value violates unique constraint/i.test(message)) {
        const fallBackQuery = await client.query(
          `SELECT * FROM match_results WHERE match_id = $1 OR idempotency_key = $2 LIMIT 1`,
          [result.matchId, result.idempotencyKey]
        );

        if (fallBackQuery.rows[0]) {
          const existing = fallBackQuery.rows[0] as PersistedMatchResultRow;
          if (existing.match_id === result.matchId && existing.idempotency_key === result.idempotencyKey) {
            return {
              ok: true,
              result: {
                id: existing.id,
                matchId: existing.match_id,
                winnerTeamId: existing.winner_team_id,
                resultSummary: existing.result_summary,
                scoreSummary: existing.score_summary,
                rewards: existing.rewards,
                completedAt: existing.completed_at,
                idempotencyKey: existing.idempotency_key,
                duplicate: true,
              },
            } as const;
          }

          return { ok: false, error: 'Conflicting result already finalized for this match.' } as const;
        }
      }

      return { ok: false, error: message } as const;
    }
  });

  return finalizationStatus;
}

export function getLeaderboardFinalizationSemantics() {
  return {
    enabled: false,
    warning: 'No persisted leaderboard mutation path is currently defined in the shared multiplayer architecture; leaderboard updates are intentionally skipped.',
  } as const;
}
