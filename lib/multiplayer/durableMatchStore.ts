import crypto from 'node:crypto';
import { withDatabase, type DatabaseResult } from '@/lib/db/postgres';
import { MatchSessionController, type MatchActionRequest } from './matchSession';
import {
  type MatchCheckpoint,
  type MatchParticipant,
  type MatchSession,
  type MatchStatus,
  normalizeGameType,
} from './types';

export interface DurableMatchRecord {
  id: string;
  game_type: string;
  rule_version: string;
  status: MatchStatus;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  updated_at: string;
  state_version: number;
  snapshot_state_version: number;
  active_turn_team_id: string | null;
  winner_team_id: string | null;
  metadata: Record<string, unknown>;
  checkpoint_snapshot: MatchCheckpoint | null;
  checkpoint_created_at: string | null;
}

export interface DurableMatchActionRow {
  id: string;
  match_id: string;
  team_id: string;
  action_id: string;
  action_type: string;
  payload: Record<string, unknown>;
  expected_state_version: number;
  applied_state_version: number | null;
  created_at: string;
  processed_at: string | null;
  status: string;
}

export interface PersistDurableActionParams {
  matchId: string;
  action: {
    actionId: string;
    teamId: string;
    actionType?: string;
    expectedStateVersion?: number;
    payload?: Record<string, unknown>;
  };
  currentState: Record<string, unknown>;
  mutator: (state: Record<string, unknown>, action: MatchActionRequest) => Record<string, unknown>;
  checkpointInterval?: number;
  checkpointToSave?: (nextState: Record<string, unknown>, nextVersion: number, match: DurableMatchRecord) => MatchCheckpoint;
}

export type PersistDurableActionResult =
  | {
      ok: true;
      duplicate: false;
      stateVersion: number;
      appliedActionId: string;
      nextState: Record<string, unknown>;
      checkpointSaved?: boolean;
      checkpoint?: MatchCheckpoint;
    }
  | {
      ok: true;
      duplicate: true;
      stateVersion: number;
      appliedActionId: string;
      appliedStateVersion?: number | null;
      reason: string;
    }
  | {
      ok: false;
      error: string;
      code: 'MATCH_NOT_FOUND' | 'TERMINAL_STATE' | 'STALE_STATE' | 'DUPLICATE_ACTION' | 'MUTATION_FAILED' | 'DB_ERROR';
      currentVersion?: number;
    };

export type DurableActionExecutionResult =
  | {
      ok: true;
      duplicate: boolean;
      stateVersion: number;
      appliedActionId: string;
      match: MatchSession;
      checkpointSaved?: boolean;
    }
  | {
      ok: false;
      error: string;
      code?: string;
      currentVersion?: number;
      match?: MatchSession;
    };

export async function loadDurableMatchMetadata(matchId: string): Promise<
  DatabaseResult<{ match: DurableMatchRecord; participants: MatchParticipant[] }>
> {
  return withDatabase(async (client) => {
    const matchResult = await client.query(
      `
      SELECT id, game_type, rule_version, status, created_at, started_at, ended_at, updated_at,
             state_version, snapshot_state_version, active_turn_team_id, winner_team_id, metadata,
             checkpoint_snapshot, checkpoint_created_at
      FROM matches
      WHERE id = $1
      `,
      [matchId]
    );

    if (!matchResult.rows[0]) {
      throw new Error('Match does not exist.');
    }

    const matchRow = matchResult.rows[0] as DurableMatchRecord;

    const participantsResult = await client.query(
      `
      SELECT team_id, seat_index, status, joined_at, disconnected_at, left_at
      FROM match_participants
      WHERE match_id = $1
      ORDER BY seat_index ASC
      `,
      [matchId]
    );

    const participants: MatchParticipant[] = participantsResult.rows.map((row) => ({
      teamId: row.team_id,
      seatIndex: Number(row.seat_index),
      status: row.status,
      joinedAt: row.joined_at,
      disconnectedAt: row.disconnected_at ?? null,
      leftAt: row.left_at ?? null,
      connectionIds: [],
    }));

    return {
      match: matchRow,
      participants,
    };
  });
}

export async function saveMatchCheckpoint(
  matchId: string,
  checkpoint: MatchCheckpoint
): Promise<DatabaseResult<{ matchId: string; snapshotStateVersion: number; checkpointCreatedAt: string }>> {
  return withDatabase(async (client) => {
    const result = await client.query(
      `
      UPDATE matches
      SET checkpoint_snapshot = $2::jsonb,
          snapshot_state_version = $3,
          checkpoint_created_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, state_version, snapshot_state_version, checkpoint_created_at
      `,
      [matchId, JSON.stringify(checkpoint), checkpoint.stateVersion]
    );

    if (!result.rows[0]) {
      throw new Error('Match does not exist.');
    }

    const row = result.rows[0];
    return {
      matchId: row.id,
      snapshotStateVersion: Number(row.snapshot_state_version),
      checkpointCreatedAt: row.checkpoint_created_at,
    };
  });
}

export async function loadCheckpointAndOrderedActions(matchId: string): Promise<
  DatabaseResult<{
    match: DurableMatchRecord;
    participants: MatchParticipant[];
    checkpoint: MatchCheckpoint | null;
    snapshotStateVersion: number;
    actions: DurableMatchActionRow[];
  }>
> {
  return withDatabase(async (client) => {
    const metaRes = await client.query(
      `
      SELECT id, game_type, rule_version, status, created_at, started_at, ended_at, updated_at,
             state_version, snapshot_state_version, active_turn_team_id, winner_team_id, metadata,
             checkpoint_snapshot, checkpoint_created_at
      FROM matches
      WHERE id = $1
      `,
      [matchId]
    );

    if (!metaRes.rows[0]) {
      throw new Error('Match does not exist.');
    }

    const match = metaRes.rows[0] as DurableMatchRecord;
    const snapshotVersion = Number(match.snapshot_state_version ?? 0);

    const participantsResult = await client.query(
      `
      SELECT team_id, seat_index, status, joined_at, disconnected_at, left_at
      FROM match_participants
      WHERE match_id = $1
      ORDER BY seat_index ASC
      `,
      [matchId]
    );

    const participants: MatchParticipant[] = participantsResult.rows.map((row) => ({
      teamId: row.team_id,
      seatIndex: Number(row.seat_index),
      status: row.status,
      joinedAt: row.joined_at,
      disconnectedAt: row.disconnected_at ?? null,
      leftAt: row.left_at ?? null,
      connectionIds: [],
    }));

    const actionsResult = await client.query(
      `
      SELECT id, match_id, team_id, action_id, action_type, payload,
             expected_state_version, applied_state_version, created_at, processed_at, status
      FROM match_actions
      WHERE match_id = $1
        AND applied_state_version > $2
        AND status = 'applied'
      ORDER BY applied_state_version ASC
      `,
      [matchId, snapshotVersion]
    );

    const actions = actionsResult.rows as DurableMatchActionRow[];

    return {
      match,
      participants,
      checkpoint: (match.checkpoint_snapshot as MatchCheckpoint) ?? null,
      snapshotStateVersion: snapshotVersion,
      actions,
    };
  });
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function persistDurableAction(
  params: PersistDurableActionParams
): Promise<PersistDurableActionResult> {
  if (!UUID_REGEX.test(params.matchId)) {
    return {
      ok: false,
      error: 'Match does not exist in database (non-UUID identifier).',
      code: 'MATCH_NOT_FOUND',
    };
  }

  const dbResult = await withDatabase(async (client) => {
    await client.query('BEGIN');

    try {
      const matchQuery = await client.query(
        `
        SELECT id, game_type, rule_version, status, state_version, snapshot_state_version,
               active_turn_team_id, winner_team_id, metadata, checkpoint_snapshot
        FROM matches
        WHERE id = $1
        FOR UPDATE
        `,
        [params.matchId]
      );

      if (!matchQuery.rows[0]) {
        await client.query('ROLLBACK');
        return {
          ok: false as const,
          error: 'Match does not exist.',
          code: 'MATCH_NOT_FOUND' as const,
        };
      }

      const matchRow = matchQuery.rows[0] as DurableMatchRecord;

      if (
        matchRow.status === 'completed' ||
        matchRow.status === 'cancelled' ||
        matchRow.status === 'abandoned'
      ) {
        await client.query('ROLLBACK');
        return {
          ok: false as const,
          error: `Match is already terminal (status: ${matchRow.status}).`,
          code: 'TERMINAL_STATE' as const,
        };
      }

      const existingActionQuery = await client.query(
        `
        SELECT id, action_id, applied_state_version, status
        FROM match_actions
        WHERE match_id = $1 AND action_id = $2
        LIMIT 1
        `,
        [params.matchId, params.action.actionId]
      );

      if (existingActionQuery.rows[0]) {
        const existing = existingActionQuery.rows[0];
        if (existing.status === 'applied') {
          await client.query('COMMIT');
          return {
            ok: true as const,
            duplicate: true as const,
            stateVersion: matchRow.state_version,
            appliedActionId: params.action.actionId,
            appliedStateVersion: existing.applied_state_version,
            reason: 'Duplicate action ID detected (already applied).',
          };
        }

        await client.query('ROLLBACK');
        return {
          ok: false as const,
          error: 'Duplicate action ID detected.',
          code: 'DUPLICATE_ACTION' as const,
        };
      }

      if (
        typeof params.action.expectedStateVersion === 'number' &&
        params.action.expectedStateVersion !== matchRow.state_version
      ) {
        await client.query('ROLLBACK');
        return {
          ok: false as const,
          error: `Stale action: expected stateVersion ${params.action.expectedStateVersion}, server is at ${matchRow.state_version}.`,
          code: 'STALE_STATE' as const,
          currentVersion: matchRow.state_version,
        };
      }

      let nextState: Record<string, unknown>;
      try {
        nextState = params.mutator({ ...params.currentState }, {
          actionId: params.action.actionId,
          teamId: params.action.teamId,
          expectedStateVersion: params.action.expectedStateVersion,
          payload: params.action.payload ?? {},
        });
      } catch (mutatorError) {
        await client.query('ROLLBACK');
        return {
          ok: false as const,
          error: mutatorError instanceof Error ? mutatorError.message : 'Action mutation failed.',
          code: 'MUTATION_FAILED' as const,
        };
      }

      const nextVersion = matchRow.state_version + 1;
      const actionType =
        params.action.actionType ||
        (typeof params.action.payload?.type === 'string' ? params.action.payload.type : 'action');

      await client.query(
        `
        INSERT INTO match_actions (
          id, match_id, team_id, action_id, action_type, payload,
          expected_state_version, applied_state_version, created_at, processed_at, status
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, NOW(), NOW(), 'applied')
        `,
        [
          crypto.randomUUID(),
          params.matchId,
          params.action.teamId,
          params.action.actionId,
          actionType,
          JSON.stringify(params.action.payload ?? {}),
          params.action.expectedStateVersion ?? matchRow.state_version,
          nextVersion,
        ]
      );

      await client.query(
        `
        UPDATE matches
        SET state_version = $2,
            updated_at = NOW()
        WHERE id = $1
        `,
        [params.matchId, nextVersion]
      );

      let savedCheckpoint: MatchCheckpoint | undefined;
      const shouldCheckpoint =
        (params.checkpointInterval && nextVersion % params.checkpointInterval === 0) ||
        !!params.checkpointToSave;

      if (shouldCheckpoint) {
        const cp: MatchCheckpoint = params.checkpointToSave
          ? params.checkpointToSave(nextState, nextVersion, matchRow)
          : {
              matchId: params.matchId,
              gameType: matchRow.game_type,
              ruleVersion: matchRow.rule_version,
              stateVersion: nextVersion,
              status: matchRow.status,
              state: { ...nextState },
              savedAt: new Date().toISOString(),
              metadata: { checkpointReason: 'interval', stateVersion: nextVersion },
            };

        await client.query(
          `
          UPDATE matches
          SET checkpoint_snapshot = $2::jsonb,
              snapshot_state_version = $3,
              checkpoint_created_at = NOW()
          WHERE id = $1
          `,
          [params.matchId, JSON.stringify(cp), nextVersion]
        );
        savedCheckpoint = cp;
      }

      await client.query('COMMIT');

      return {
        ok: true as const,
        duplicate: false as const,
        stateVersion: nextVersion,
        appliedActionId: params.action.actionId,
        nextState,
        checkpointSaved: !!savedCheckpoint,
        checkpoint: savedCheckpoint,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      const message = error instanceof Error ? error.message : 'Database action transaction failed.';

      if (/duplicate key value violates unique constraint/i.test(message)) {
        if (/match_id.*action_id|idx_match_actions_match_id/i.test(message)) {
          const fallback = await client.query(
            `SELECT id, action_id, applied_state_version, status FROM match_actions WHERE match_id = $1 AND action_id = $2`,
            [params.matchId, params.action.actionId]
          );
          if (fallback.rows[0]?.status === 'applied') {
            return {
              ok: true as const,
              duplicate: true as const,
              stateVersion: fallback.rows[0].applied_state_version,
              appliedActionId: params.action.actionId,
              appliedStateVersion: fallback.rows[0].applied_state_version,
              reason: 'Duplicate action ID detected (already applied).',
            };
          }
          return {
            ok: false as const,
            error: 'Duplicate action ID detected.',
            code: 'DUPLICATE_ACTION' as const,
          };
        }
      }

      return {
        ok: false as const,
        error: message,
        code: 'DB_ERROR' as const,
      };
    }
  });

  if (!dbResult.ok) {
    return {
      ok: false,
      error: dbResult.error,
      code: 'DB_ERROR',
    };
  }

  return dbResult.data;
}

export async function executeDurableAction(
  controller: MatchSessionController,
  action: MatchActionRequest & { actionType?: string },
  mutator: (state: Record<string, unknown>, action: MatchActionRequest) => Record<string, unknown>,
  options?: {
    checkpointInterval?: number;
    checkpointToSave?: (nextState: Record<string, unknown>, nextVersion: number, match: DurableMatchRecord) => MatchCheckpoint;
  }
): Promise<DurableActionExecutionResult> {
  const currentMatch = controller.getMatch();
  const matchId = currentMatch.matchId;

  const authValidation = controller.validateParticipantAction(action.teamId, action.sessionId);
  if (!authValidation.ok) {
    return {
      ok: false,
      error: authValidation.error ?? 'Unauthorized participant.',
      code: 'UNAUTHORIZED_ACTION',
      match: currentMatch,
      currentVersion: controller.getStateVersion(),
    };
  }

  const persistResult = await persistDurableAction({
    matchId,
    action,
    currentState: currentMatch.state,
    mutator,
    checkpointInterval: options?.checkpointInterval,
    checkpointToSave: options?.checkpointToSave,
  });

  if (!persistResult.ok) {
    return {
      ok: false,
      error: persistResult.error,
      code: persistResult.code,
      currentVersion: persistResult.currentVersion ?? controller.getStateVersion(),
      match: controller.getMatch(),
    };
  }

  if (persistResult.duplicate) {
    return {
      ok: true,
      duplicate: true,
      stateVersion: controller.getStateVersion(),
      appliedActionId: persistResult.appliedActionId,
      match: controller.getMatch(),
    };
  }

  const updatedMatch = controller.commitDurableTransition(
    action,
    persistResult.nextState,
    persistResult.stateVersion
  );

  if (persistResult.checkpointSaved && persistResult.checkpoint) {
    controller.setCheckpoint(persistResult.checkpoint);
  }

  return {
    ok: true,
    duplicate: false,
    stateVersion: persistResult.stateVersion,
    appliedActionId: persistResult.appliedActionId,
    match: updatedMatch,
    checkpointSaved: persistResult.checkpointSaved,
  };
}

export interface GameStateReplayAdapter {
  getInitialState(match: DurableMatchRecord, participants: MatchParticipant[]): Record<string, unknown>;
  applyAction(
    currentState: Record<string, unknown>,
    action: DurableMatchActionRow,
    match: DurableMatchRecord
  ): Record<string, unknown>;
}

const replayAdapters = new Map<string, GameStateReplayAdapter>();

export function registerGameReplayAdapter(gameType: string, adapter: GameStateReplayAdapter) {
  replayAdapters.set(normalizeGameType(gameType), adapter);
}

export function unregisterGameReplayAdapter(gameType: string) {
  replayAdapters.delete(normalizeGameType(gameType));
}

export function getGameReplayAdapter(gameType: string): GameStateReplayAdapter | undefined {
  return replayAdapters.get(normalizeGameType(gameType));
}

export const defaultReplayAdapter: GameStateReplayAdapter = {
  getInitialState: (match, participants) => ({
    matchId: match.id,
    gameType: match.game_type,
    participants: participants.map((p) => ({
      teamId: p.teamId,
      seatIndex: p.seatIndex,
      status: p.status,
    })),
    ...(match.metadata ?? {}),
  }),
  applyAction: (currentState, action) => ({
    ...currentState,
    lastActionId: action.action_id,
    ...(action.payload ?? {}),
  }),
};

export interface RealtimeServerRegistrationTarget {
  registerMatch: (matchId: string, match: MatchSessionController) => void;
}

export interface RecoverMatchOptions {
  adapter?: GameStateReplayAdapter;
  registerWithServer?: RealtimeServerRegistrationTarget;
}

export type RecoverMatchFailureCode =
  | 'MATCH_NOT_FOUND'
  | 'INVALID_GAME_TYPE'
  | 'UNSUPPORTED_RULE_VERSION'
  | 'CORRUPTED_CHECKPOINT'
  | 'CORRUPTED_ACTION_PAYLOAD'
  | 'ACTION_VERSION_GAP'
  | 'DUPLICATE_ACTION_VERSION'
  | 'ACTION_VERSION_MISMATCH'
  | 'FINAL_VERSION_MISMATCH'
  | 'DB_ERROR';

export type RecoverMatchResult =
  | {
      ok: true;
      controller: MatchSessionController;
      match: MatchSession;
      recoveredVersion: number;
      replayedActionCount: number;
      fromCheckpoint: boolean;
      allProcessedActionIds: string[];
    }
  | {
      ok: false;
      error: string;
      code: RecoverMatchFailureCode;
      matchId: string;
    };

async function recordRecoveryAuditLog(matchId: string, code: string, details: string) {
  try {
    await withDatabase(async (client) => {
      await client.query(
        `
        INSERT INTO audit_log (id, action, target_type, target_id, result, metadata, created_at)
        VALUES (gen_random_uuid(), 'recover_match_failure', 'match', $1, 'failure', $2::jsonb, NOW())
        `,
        [matchId, JSON.stringify({ failureCode: code, details, timestamp: new Date().toISOString() })]
      );
    });
  } catch {
    // Graceful fallback if audit log table or database has issues
  }
}

export async function recoverMatchFromDatabase(
  matchId: string,
  options?: RecoverMatchOptions
): Promise<RecoverMatchResult> {
  if (!UUID_REGEX.test(matchId)) {
    return {
      ok: false,
      error: 'Match does not exist in database (invalid UUID identifier).',
      code: 'MATCH_NOT_FOUND',
      matchId,
    };
  }

  const result = await withDatabase(async (client) => {
    await client.query('BEGIN');

    try {
      // Step 1 & 2: Row-level PostgreSQL serialization lock on the canonical match row
      const matchRes = await client.query(
        `
        SELECT id, game_type, rule_version, status, created_at, started_at, ended_at, updated_at,
               state_version, snapshot_state_version, active_turn_team_id, winner_team_id, metadata,
               checkpoint_snapshot, checkpoint_created_at
        FROM matches
        WHERE id = $1
        FOR UPDATE
        `,
        [matchId]
      );

      if (!matchRes.rows[0]) {
        await client.query('ROLLBACK');
        return {
          ok: false as const,
          error: 'Match does not exist.',
          code: 'MATCH_NOT_FOUND' as const,
          matchId,
        };
      }

      const matchRow = matchRes.rows[0] as DurableMatchRecord;

      // Verify game_type
      if (!matchRow.game_type || typeof matchRow.game_type !== 'string' || !matchRow.game_type.trim()) {
        await client.query('ROLLBACK');
        await recordRecoveryAuditLog(matchId, 'INVALID_GAME_TYPE', 'Missing or empty game_type');
        return {
          ok: false as const,
          error: 'Match has invalid or empty game_type.',
          code: 'INVALID_GAME_TYPE' as const,
          matchId,
        };
      }

      // Verify rule_version
      const supportedRuleVersions = new Set(['v1', 'v1.0', 'default']);
      if (!matchRow.rule_version || !supportedRuleVersions.has(matchRow.rule_version)) {
        await client.query('ROLLBACK');
        await recordRecoveryAuditLog(
          matchId,
          'UNSUPPORTED_RULE_VERSION',
          `Unsupported rule_version: ${matchRow.rule_version}`
        );
        return {
          ok: false as const,
          error: `Unsupported rule version: ${matchRow.rule_version}.`,
          code: 'UNSUPPORTED_RULE_VERSION' as const,
          matchId,
        };
      }

      const targetStateVersion = Number(matchRow.state_version ?? 0);
      const snapshotStateVersion = Number(matchRow.snapshot_state_version ?? 0);

      // Step 3: Load match participants
      const participantsRes = await client.query(
        `
        SELECT team_id, seat_index, status, joined_at, disconnected_at, left_at
        FROM match_participants
        WHERE match_id = $1
        ORDER BY seat_index ASC
        `,
        [matchId]
      );

      const participants: MatchParticipant[] = participantsRes.rows.map((row) => ({
        teamId: row.team_id,
        seatIndex: Number(row.seat_index),
        status: row.status,
        joinedAt: row.joined_at,
        disconnectedAt: row.disconnected_at ?? null,
        leftAt: row.left_at ?? null,
        connectionIds: [],
      }));

      // Step 4 & 5: Load latest checkpoint and determine snapshot_state_version
      let currentState: Record<string, unknown>;
      let currentVersion: number;
      let fromCheckpoint = false;

      const adapter =
        options?.adapter ??
        getGameReplayAdapter(matchRow.game_type) ??
        defaultReplayAdapter;

      if (matchRow.checkpoint_snapshot) {
        let cp = matchRow.checkpoint_snapshot;
        if (typeof cp === 'string') {
          try {
            cp = JSON.parse(cp);
          } catch {
            await client.query('ROLLBACK');
            await recordRecoveryAuditLog(matchId, 'CORRUPTED_CHECKPOINT', 'Checkpoint snapshot is malformed JSON string');
            return {
              ok: false as const,
              error: 'Checkpoint snapshot is malformed JSON.',
              code: 'CORRUPTED_CHECKPOINT' as const,
              matchId,
            };
          }
        }

        const cpVersion = Number(cp.stateVersion ?? -1);

        // Check: checkpoint version ahead of DB match version
        if (cpVersion > targetStateVersion || snapshotStateVersion > targetStateVersion) {
          await client.query('ROLLBACK');
          await recordRecoveryAuditLog(
            matchId,
            'CORRUPTED_CHECKPOINT',
            `Checkpoint version (${cpVersion}) is ahead of match state_version (${targetStateVersion})`
          );
          return {
            ok: false as const,
            error: `Checkpoint stateVersion (${cpVersion}) is ahead of match state_version (${targetStateVersion}).`,
            code: 'CORRUPTED_CHECKPOINT' as const,
            matchId,
          };
        }

        // Check: snapshot_state_version mismatch with checkpoint stateVersion
        if (cpVersion !== snapshotStateVersion) {
          await client.query('ROLLBACK');
          await recordRecoveryAuditLog(
            matchId,
            'CORRUPTED_CHECKPOINT',
            `Checkpoint stateVersion (${cpVersion}) does not match snapshot_state_version (${snapshotStateVersion})`
          );
          return {
            ok: false as const,
            error: `Checkpoint stateVersion (${cpVersion}) does not match snapshot_state_version (${snapshotStateVersion}).`,
            code: 'CORRUPTED_CHECKPOINT' as const,
            matchId,
          };
        }

        if (!cp.state || typeof cp.state !== 'object' || Array.isArray(cp.state)) {
          await client.query('ROLLBACK');
          await recordRecoveryAuditLog(matchId, 'CORRUPTED_CHECKPOINT', 'Checkpoint state is not a valid object');
          return {
            ok: false as const,
            error: 'Checkpoint state is corrupted or not an object.',
            code: 'CORRUPTED_CHECKPOINT' as const,
            matchId,
          };
        }

        currentState = { ...cp.state };
        currentVersion = cpVersion;
        fromCheckpoint = true;
      } else {
        // No checkpoint: snapshot_state_version must be 0
        if (snapshotStateVersion !== 0) {
          await client.query('ROLLBACK');
          await recordRecoveryAuditLog(
            matchId,
            'CORRUPTED_CHECKPOINT',
            `Missing checkpoint snapshot while snapshot_state_version is ${snapshotStateVersion}`
          );
          return {
            ok: false as const,
            error: `Missing checkpoint snapshot while snapshot_state_version is ${snapshotStateVersion}.`,
            code: 'CORRUPTED_CHECKPOINT' as const,
            matchId,
          };
        }

        currentState = adapter.getInitialState(matchRow, participants);
        currentVersion = 0;
        fromCheckpoint = false;
      }

      // Step 6 & 7: Load all match_actions with applied_state_version > snapshot_state_version
      // Order strictly by applied_state_version ASC
      const actionsRes = await client.query(
        `
        SELECT id, match_id, team_id, action_id, action_type, payload,
               expected_state_version, applied_state_version, created_at, processed_at, status
        FROM match_actions
        WHERE match_id = $1
          AND applied_state_version > $2
        ORDER BY applied_state_version ASC
        `,
        [matchId, currentVersion]
      );

      const actions = actionsRes.rows as DurableMatchActionRow[];

      // Check all actions for this match to restore idempotency information
      const allActionsRes = await client.query(
        `
        SELECT id, action_id, applied_state_version, status, payload
        FROM match_actions
        WHERE match_id = $1
        ORDER BY applied_state_version ASC NULLS FIRST
        `,
        [matchId]
      );

      // Collect all processed action IDs for idempotency restoration
      const allProcessedActionIds: string[] = [];
      const seenActionVersions = new Set<number>();

      for (const row of allActionsRes.rows) {
        if (row.status === 'applied' && row.action_id) {
          allProcessedActionIds.push(row.action_id);
          if (row.applied_state_version !== null && row.applied_state_version !== undefined) {
            const ver = Number(row.applied_state_version);
            if (seenActionVersions.has(ver)) {
              await client.query('ROLLBACK');
              await recordRecoveryAuditLog(
                matchId,
                'DUPLICATE_ACTION_VERSION',
                `Duplicate applied_state_version ${ver} detected in match_actions`
              );
              return {
                ok: false as const,
                error: `Duplicate applied_state_version ${ver} detected in match actions.`,
                code: 'DUPLICATE_ACTION_VERSION' as const,
                matchId,
              };
            }
            seenActionVersions.add(ver);
          }
        }
      }

      // If replay is required (targetStateVersion > currentVersion), but no actions found
      if (targetStateVersion > currentVersion && actions.length === 0) {
        await client.query('ROLLBACK');
        await recordRecoveryAuditLog(
          matchId,
          'ACTION_VERSION_GAP',
          `Missing actions for state versions between ${currentVersion} and ${targetStateVersion}`
        );
        return {
          ok: false as const,
          error: `Action sequence gap: match expects version ${targetStateVersion}, but replay has no actions beyond ${currentVersion}.`,
          code: 'ACTION_VERSION_GAP' as const,
          matchId,
        };
      }

      // Step 8 & 9: Verify sequence is contiguous and reconstruct authoritative state deterministically
      for (let i = 0; i < actions.length; i++) {
        const act = actions[i];
        const actVer = act.applied_state_version;

        // Check: status must be applied
        if (act.status !== 'applied') {
          await client.query('ROLLBACK');
          await recordRecoveryAuditLog(
            matchId,
            'CORRUPTED_ACTION_PAYLOAD',
            `Action ${act.action_id} has invalid status ${act.status}`
          );
          return {
            ok: false as const,
            error: `Action ${act.action_id} has invalid non-applied status (${act.status}).`,
            code: 'CORRUPTED_ACTION_PAYLOAD' as const,
            matchId,
          };
        }

        // Check: missing action version
        if (actVer === null || actVer === undefined || !Number.isInteger(Number(actVer))) {
          await client.query('ROLLBACK');
          await recordRecoveryAuditLog(
            matchId,
            'ACTION_VERSION_MISMATCH',
            `Action ${act.action_id} has null or non-integer applied_state_version`
          );
          return {
            ok: false as const,
            error: `Action ${act.action_id} has invalid or missing applied_state_version.`,
            code: 'ACTION_VERSION_MISMATCH' as const,
            matchId,
          };
        }

        const actVerNum = Number(actVer);

        // Check: action version lower than checkpoint version
        if (fromCheckpoint && actVerNum <= snapshotStateVersion) {
          await client.query('ROLLBACK');
          await recordRecoveryAuditLog(
            matchId,
            'ACTION_VERSION_MISMATCH',
            `Action version ${actVerNum} is <= checkpoint snapshot version ${snapshotStateVersion}`
          );
          return {
            ok: false as const,
            error: `Action version ${actVerNum} is lower than or equal to checkpoint version ${snapshotStateVersion}.`,
            code: 'ACTION_VERSION_MISMATCH' as const,
            matchId,
          };
        }

        // Check: duplicate or unexpected sequence gap
        const expectedNext = currentVersion + 1;
        if (actVerNum === currentVersion) {
          await client.query('ROLLBACK');
          await recordRecoveryAuditLog(
            matchId,
            'DUPLICATE_ACTION_VERSION',
            `Duplicate applied_state_version ${actVerNum} for action ${act.action_id}`
          );
          return {
            ok: false as const,
            error: `Duplicate applied_state_version ${actVerNum} detected during replay.`,
            code: 'DUPLICATE_ACTION_VERSION' as const,
            matchId,
          };
        }

        if (actVerNum > expectedNext) {
          await client.query('ROLLBACK');
          await recordRecoveryAuditLog(
            matchId,
            'ACTION_VERSION_GAP',
            `Sequence gap: expected version ${expectedNext}, got ${actVerNum}`
          );
          return {
            ok: false as const,
            error: `Action sequence gap: expected version ${expectedNext}, got ${actVerNum}.`,
            code: 'ACTION_VERSION_GAP' as const,
            matchId,
          };
        }

        if (actVerNum < expectedNext) {
          await client.query('ROLLBACK');
          await recordRecoveryAuditLog(
            matchId,
            'ACTION_VERSION_MISMATCH',
            `Action version mismatch: expected ${expectedNext}, got ${actVerNum}`
          );
          return {
            ok: false as const,
            error: `Action version mismatch: expected ${expectedNext}, got ${actVerNum}.`,
            code: 'ACTION_VERSION_MISMATCH' as const,
            matchId,
          };
        }

        // Check: invalid/malformed action payload
        let payload = act.payload;
        if (typeof payload === 'string') {
          try {
            payload = JSON.parse(payload);
          } catch {
            await client.query('ROLLBACK');
            await recordRecoveryAuditLog(
              matchId,
              'CORRUPTED_ACTION_PAYLOAD',
              `Action ${act.action_id} payload is malformed JSON string`
            );
            return {
              ok: false as const,
              error: `Action ${act.action_id} has malformed JSON payload.`,
              code: 'CORRUPTED_ACTION_PAYLOAD' as const,
              matchId,
            };
          }
        }

        if (!payload || typeof payload !== 'object' || Array.isArray(payload) || (payload as Record<string, unknown>)._corrupt === true) {
          await client.query('ROLLBACK');
          await recordRecoveryAuditLog(
            matchId,
            'CORRUPTED_ACTION_PAYLOAD',
            `Action ${act.action_id} payload is null, array, or marked corrupt`
          );
          return {
            ok: false as const,
            error: `Action ${act.action_id} has invalid or non-object payload.`,
            code: 'CORRUPTED_ACTION_PAYLOAD' as const,
            matchId,
          };
        }

        // Reconstruct authoritative state deterministically
        try {
          currentState = adapter.applyAction(currentState, { ...act, payload }, matchRow);
          currentVersion = expectedNext;
        } catch (adapterErr) {
          const errMsg = adapterErr instanceof Error ? adapterErr.message : 'Replay adapter threw an error';
          await client.query('ROLLBACK');
          await recordRecoveryAuditLog(
            matchId,
            'CORRUPTED_ACTION_PAYLOAD',
            `Adapter failed to apply action ${act.action_id}: ${errMsg}`
          );
          return {
            ok: false as const,
            error: `Failed to replay action ${act.action_id}: ${errMsg}`,
            code: 'CORRUPTED_ACTION_PAYLOAD' as const,
            matchId,
          };
        }
      }

      // Step 10: Verify reconstructed final version equals matches.state_version
      if (currentVersion !== targetStateVersion) {
        await client.query('ROLLBACK');
        await recordRecoveryAuditLog(
          matchId,
          'FINAL_VERSION_MISMATCH',
          `Reconstructed final version ${currentVersion} does not equal match state_version ${targetStateVersion}`
        );
        return {
          ok: false as const,
          error: `Reconstructed final version (${currentVersion}) does not equal match state_version (${targetStateVersion}).`,
          code: 'FINAL_VERSION_MISMATCH' as const,
          matchId,
        };
      }

      // Step 11: Reconstruct MatchSessionController
      const controller = new MatchSessionController({
        matchId: matchRow.id,
        gameType: matchRow.game_type,
        ruleVersion: matchRow.rule_version,
        participants,
        status: matchRow.status,
        stateVersion: currentVersion,
        state: currentState,
      });

      if (matchRow.checkpoint_snapshot) {
        controller.setCheckpoint(matchRow.checkpoint_snapshot as MatchCheckpoint);
      }

      // Step 12: Restore processed action IDs/idempotency information
      controller.restoreProcessedActions(allProcessedActionIds);

      // Step 13: Register recovered session with realtime layer if provided
      if (options?.registerWithServer) {
        options.registerWithServer.registerMatch(matchRow.id, controller);
      }

      await client.query('COMMIT');

      return {
        ok: true as const,
        controller,
        match: controller.getMatch(),
        recoveredVersion: currentVersion,
        replayedActionCount: actions.length,
        fromCheckpoint,
        allProcessedActionIds,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      const msg = err instanceof Error ? err.message : 'Database error during recovery.';
      return {
        ok: false as const,
        error: msg,
        code: 'DB_ERROR' as const,
        matchId,
      };
    }
  });

  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      code: 'DB_ERROR',
      matchId,
    };
  }

  return result.data;
}
