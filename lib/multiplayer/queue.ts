import { withDatabase } from '@/lib/db/postgres';
import { verifySessionToken } from '@/lib/auth/teamIdentity';
import { isQueueEntryActive, normalizeGameType, type QueueEntryRecord } from './types';

export interface QueueRequest {
  sessionToken: string;
  gameType: string;
  queueMetadata?: Record<string, unknown>;
}

export function isDuplicateQueueEntryConstraintError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /duplicate key value violates unique constraint/i.test(message)
    && /queue_entries.*team_id.*game_type|team_id.*game_type.*queue_entries|queue_entries_team_id_game_type_key/i.test(message);
}

function normalizeQueueEntryRow(row: any): QueueEntryRecord {
  return {
    id: row.id,
    teamId: row.team_id,
    gameType: row.game_type,
    status: row.status,
    createdAt: row.created_at,
    matchedAt: row.matched_at ?? null,
    matchId: row.match_id ?? null,
    queueMetadata: row.queue_metadata ?? {},
  };
}

export function enforceAuthenticatedTeamIdentity(sessionToken: string, candidateTeamId?: string) {
  const payload = verifySessionToken(sessionToken);
  if (!payload) {
    return { ok: false as const, error: 'Invalid or expired session token.' };
  }

  const actualTeamId = String(payload.teamId || '');
  if (!actualTeamId) {
    return { ok: false as const, error: 'Session payload does not include a valid team identity.' };
  }

  if (candidateTeamId && candidateTeamId !== actualTeamId) {
    return { ok: false as const, error: 'Client provided team identity does not match the authenticated session.' };
  }

  return { ok: true as const, teamId: actualTeamId };
}

export function isQueueDuplicate(existingEntries: Array<{ teamId: string; gameType: string; status?: string }>, teamId: string, gameType: string) {
  return existingEntries.some(
    (entry) => entry.teamId === teamId && normalizeGameType(entry.gameType) === normalizeGameType(gameType) && isQueueEntryActive(entry.status)
  );
}

export async function enqueueTeamForGame(request: QueueRequest) {
  const auth = enforceAuthenticatedTeamIdentity(request.sessionToken);
  if (!auth.ok) {
    return { ok: false as const, error: auth.error };
  }

  const gameType = normalizeGameType(request.gameType);
  if (!gameType) {
    return { ok: false as const, error: 'A valid game type is required.' };
  }

  const result = await withDatabase(async (client) => {
    await client.query('BEGIN');

    try {
      const existing = await client.query(
        `
        SELECT id, team_id, game_type, status, created_at, matched_at, match_id, queue_metadata
        FROM queue_entries
        WHERE team_id = $1 AND game_type = $2 AND status IN ('queued', 'matched')
        FOR UPDATE
        `,
        [auth.teamId, gameType]
      );

      if (existing.rows[0]) {
        const row = normalizeQueueEntryRow(existing.rows[0]);
        await client.query('COMMIT');
        return {
          ok: true as const,
          queueEntry: row,
          duplicate: true,
        };
      }

      try {
        const insertResult = await client.query(
          `
          INSERT INTO queue_entries (team_id, game_type, status, created_at, matched_at, match_id, queue_metadata)
          VALUES ($1, $2, 'queued', NOW(), NULL, NULL, $3::jsonb)
          RETURNING id, team_id, game_type, status, created_at, matched_at, match_id, queue_metadata
          `,
          [auth.teamId, gameType, request.queueMetadata ?? {}]
        );

        const row = normalizeQueueEntryRow(insertResult.rows[0]);
        await client.query('COMMIT');

        return {
          ok: true as const,
          queueEntry: row,
          duplicate: false,
        };
      } catch (insertError) {
        if (!isDuplicateQueueEntryConstraintError(insertError)) {
          throw insertError;
        }

        await client.query('ROLLBACK');
        await client.query('BEGIN');

        const duplicateRow = await client.query(
          `
          SELECT id, team_id, game_type, status, created_at, matched_at, match_id, queue_metadata
          FROM queue_entries
          WHERE team_id = $1 AND game_type = $2 AND status IN ('queued', 'matched')
          FOR UPDATE
          `,
          [auth.teamId, gameType]
        );

        await client.query('COMMIT');

        if (!duplicateRow.rows[0]) {
          return {
            ok: false as const,
            error: 'Queue entry could not be confirmed after a duplicate enqueue race.',
          };
        }

        return {
          ok: true as const,
          queueEntry: normalizeQueueEntryRow(duplicateRow.rows[0]),
          duplicate: true,
        };
      }
    } catch (error) {
      await client.query('ROLLBACK');
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : 'Queue creation failed.',
      };
    }
  });

  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }

  return result.data;
}

export async function cancelQueueEntry(request: { sessionToken: string; gameType: string }) {
  const auth = enforceAuthenticatedTeamIdentity(request.sessionToken);
  if (!auth.ok) {
    return { ok: false as const, error: auth.error };
  }

  const gameType = normalizeGameType(request.gameType);
  if (!gameType) {
    return { ok: false as const, error: 'A valid game type is required.' };
  }

  const result = await withDatabase(async (client) => {
    const row = await client.query(
      `
      UPDATE queue_entries
      SET status = 'cancelled', matched_at = NOW()
      WHERE team_id = $1 AND game_type = $2 AND status IN ('queued', 'matched')
      RETURNING id, team_id, game_type, status, created_at, matched_at, match_id, queue_metadata
      `,
      [auth.teamId, gameType]
    );

    if (!row.rows[0]) {
      return { ok: false as const, error: 'No active queue entry found for this team in the requested game.' };
    }

    return { ok: true as const, queueEntry: normalizeQueueEntryRow(row.rows[0]) };
  });

  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }

  return result.data;
}

export async function cleanupStaleQueueEntries(gameType?: string) {
  const result = await withDatabase(async (client) => {
    const rows = await client.query(
      `
      UPDATE queue_entries
      SET status = 'stale'
      WHERE status = 'queued'
        AND created_at < NOW() - INTERVAL '30 minutes'
        AND ($1::text IS NULL OR game_type = $1)
      RETURNING id, team_id, game_type, status, created_at, match_id, queue_metadata
      `,
      [gameType ? normalizeGameType(gameType) : null]
    );

    return { ok: true as const, staleEntries: rows.rows.map(normalizeQueueEntryRow) };
  });

  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }

  return result.data;
}
