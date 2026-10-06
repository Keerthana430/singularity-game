import crypto from 'crypto';
import { withDatabase } from '@/lib/db/postgres';
import { buildMatchSession, createMatchParticipants, normalizeGameType, type MatchSession } from './types';

export interface CreateMatchFromQueueRequest {
  gameType: string;
  ruleVersion: string;
  maxPlayers?: number;
  metadata?: Record<string, unknown>;
}

export async function createMatchFromQueue(request: CreateMatchFromQueueRequest) {
  const gameType = normalizeGameType(request.gameType);
  if (!gameType) {
    return { ok: false as const, error: 'A valid game type is required.' };
  }

  const maxPlayers = request.maxPlayers ?? 2;
  const ruleVersion = String(request.ruleVersion || 'v1');

  const result = await withDatabase(async (client) => {
    await client.query('BEGIN');

    try {
      const lockResult = await client.query(
        `SELECT pg_try_advisory_xact_lock(hashtext('matchmaker:' || $1)) AS locked`,
        [gameType]
      );

      if (!lockResult.rows[0]?.locked) {
        await client.query('COMMIT');
        return { ok: true as const, created: false, reason: 'Concurrent matchmaking worker in progress.' };
      }

      const candidateRows = await client.query(
        `
        SELECT id, team_id, game_type, status, created_at, matched_at, match_id
        FROM queue_entries
        WHERE game_type = $1 AND status = 'queued'
        ORDER BY created_at ASC
        LIMIT $2
        FOR UPDATE
        `,
        [gameType, maxPlayers]
      );

      const teamIds = [...new Set(candidateRows.rows.map((row) => row.team_id))];
      if (teamIds.length < 2) {
        await client.query('COMMIT');
        return { ok: true as const, created: false, reason: 'Not enough teams queued.' };
      }

      const activeMatches = await client.query(
        `
        SELECT DISTINCT mp.team_id
        FROM match_participants mp
        INNER JOIN matches m ON m.id = mp.match_id
        WHERE mp.team_id = ANY($1)
          AND m.status IN ('waiting', 'active')
        `,
        [teamIds]
      );

      const activeTeamIds = new Set(activeMatches.rows.map((row) => row.team_id));
      const eligibleTeams = teamIds.filter((teamId) => !activeTeamIds.has(teamId));
      if (eligibleTeams.length < 2) {
        await client.query('COMMIT');
        return { ok: true as const, created: false, reason: 'Queued teams are already represented in an active match.' };
      }

      const selectedTeamIds = eligibleTeams.slice(0, maxPlayers);
      const matchId = crypto.randomUUID();
      const matchRecord = await client.query(
        `
        INSERT INTO matches (id, game_type, rule_version, status, state_version, created_at, started_at, updated_at, metadata)
        VALUES ($1, $2, $3, 'waiting', 0, NOW(), NOW(), NOW(), $4::jsonb)
        RETURNING id, game_type, rule_version, state_version, status, created_at, updated_at
        `,
        [matchId, gameType, ruleVersion, { source: 'queue_matchmaker', createdBy: 'shared-matchmaker' }]
      );

      const matchRow = matchRecord.rows[0];
      const participants = createMatchParticipants(selectedTeamIds);

      for (const participant of participants) {
        await client.query(
          `
          INSERT INTO match_participants (match_id, team_id, seat_index, status, joined_at)
          VALUES ($1, $2, $3, 'joined', NOW())
          ON CONFLICT (match_id, team_id) DO NOTHING
          `,
          [matchId, participant.teamId, participant.seatIndex]
        );
      }

      const queueIds = candidateRows.rows
        .filter((row) => selectedTeamIds.includes(row.team_id))
        .map((row) => row.id);

      if (queueIds.length > 0) {
        await client.query(
          `
          UPDATE queue_entries
          SET status = 'matched', matched_at = NOW(), match_id = $1
          WHERE id = ANY($2)
          `,
          [matchId, queueIds]
        );
      }

      const matchSession: MatchSession = buildMatchSession({
        matchId: matchRow.id,
        gameType: matchRow.game_type,
        ruleVersion: matchRow.rule_version,
        participants: participants.map((participant) => ({
          teamId: participant.teamId,
          seatIndex: participant.seatIndex,
          status: 'joined',
          joinedAt: participant.joinedAt,
          disconnectedAt: null,
          leftAt: null,
          connectionIds: [],
        })),
        status: matchRow.status,
        createdAt: matchRow.created_at,
        updatedAt: matchRow.updated_at,
      });

      await client.query('COMMIT');
      return {
        ok: true as const,
        created: true,
        match: matchSession,
        queueEntries: queueIds.map((queueId) => ({ queueEntryId: queueId, teamId: '', gameType })),
      };
    } catch (error) {
      await client.query('ROLLBACK');
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : 'Match creation failed.',
      };
    }
  });

  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }

  return result.data;
}

export function isValidRuleVersion(ruleVersion: string) {
  return typeof ruleVersion === 'string' && ruleVersion.trim().length > 0;
}
