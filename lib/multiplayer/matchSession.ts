import crypto from 'crypto';
import { buildMatchSession, normalizeGameType, type MatchCheckpoint, type MatchParticipant, type MatchSession, type MatchStatus } from './types';

export type MatchLifecycleStatus = MatchStatus;

export interface MatchSessionConfig {
  matchId: string;
  gameType: string;
  ruleVersion: string;
  participants?: MatchParticipant[];
  state?: Record<string, unknown>;
  status?: MatchLifecycleStatus;
  stateVersion?: number;
}

export interface MatchActionRequest {
  actionId: string;
  teamId: string;
  sessionId?: string;
  expectedStateVersion?: number;
  payload?: Record<string, unknown>;
}

export interface MatchStateTransitionResult {
  ok: boolean;
  stateVersion?: number;
  error?: string;
  match?: MatchSession;
  appliedActionId?: string;
}

const VALID_LIFECYCLE_TRANSITIONS: Record<MatchLifecycleStatus, MatchLifecycleStatus[]> = {
  waiting: ['active', 'cancelled', 'abandoned'],
  active: ['completed', 'cancelled', 'abandoned'],
  completed: [],
  cancelled: [],
  abandoned: [],
};

export class MatchSessionController {
  private readonly session: MatchSession;
  private readonly processedActions = new Set<string>();
  private readonly connections = new Map<string, {
    teamId: string;
    sessionId: string;
    connectedAt: string;
    disconnectedAt?: string | null;
    lastSeenAt: string;
    isConnected: boolean;
  }>();

  constructor(config: MatchSessionConfig) {
    const normalizedParticipants = (config.participants ?? []).map((participant, index) => ({
      ...participant,
      seatIndex: participant.seatIndex ?? index,
      status: participant.status ?? 'joined',
      connectedAt: undefined,
      disconnectedAt: participant.disconnectedAt ?? null,
      leftAt: participant.leftAt ?? null,
      connectionIds: participant.connectionIds ?? [],
    }));

    this.session = buildMatchSession({
      matchId: config.matchId,
      gameType: config.gameType,
      ruleVersion: config.ruleVersion,
      participants: normalizedParticipants,
      status: config.status ?? 'waiting',
      stateVersion: config.stateVersion ?? 0,
      state: config.state ?? {},
    });
  }

  getMatch(): MatchSession {
    return { ...this.session, participants: this.session.participants.map((participant) => ({ ...participant })) };
  }

  getStateVersion(): number {
    return this.session.stateVersion;
  }

  getStatus(): MatchLifecycleStatus {
    return this.session.status;
  }

  ensureParticipant(teamId: string) {
    if (!this.session.participants.some((participant) => participant.teamId === teamId)) {
      throw new Error('Team is not a participant in this match.');
    }
  }

  requireAuthorizedParticipant(teamId: string) {
    const participant = this.session.participants.find((item) => item.teamId === teamId);
    if (!participant) {
      throw new Error('Unauthorized participant.');
    }

    if (participant.status === 'left') {
      throw new Error('Participant has left the match.');
    }
  }

  addConnection(sessionId: string, teamId: string) {
    if (!this.session.participants.some((participant) => participant.teamId === teamId)) {
      throw new Error('Cannot attach a connection for a non-member team.');
    }

    const connectionKey = `${sessionId}:${teamId}`;
    const row = this.connections.get(connectionKey) ?? {
      teamId,
      sessionId,
      connectedAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      isConnected: true,
    };

    row.lastSeenAt = new Date().toISOString();
    row.isConnected = true;
    this.connections.set(connectionKey, row);

    const participant = this.session.participants.find((entry) => entry.teamId === teamId);
    if (participant) {
      participant.status = 'joined';
      participant.disconnectedAt = null;
      if (!participant.connectionIds.includes(sessionId)) {
        participant.connectionIds.push(sessionId);
      }
    }

    return { sessionId, teamId, connected: true };
  }

  disconnectConnection(sessionId: string, teamId: string) {
    const key = `${sessionId}:${teamId}`;
    const connection = this.connections.get(key);
    if (!connection) {
      return { ok: false, error: 'No active connection found for this session.' };
    }

    connection.isConnected = false;
    connection.disconnectedAt = new Date().toISOString();
    connection.lastSeenAt = new Date().toISOString();

    const participant = this.session.participants.find((entry) => entry.teamId === teamId);
    if (participant) {
      participant.connectionIds = participant.connectionIds.filter((value) => value !== sessionId);
      if (participant.connectionIds.length === 0) {
        participant.status = 'disconnected';
        participant.disconnectedAt = new Date().toISOString();
      }
    }

    return { ok: true, disconnected: true };
  }

  getConnectedSessionsForTeam(teamId: string) {
    return [...this.connections.values()].filter((entry) => entry.teamId === teamId && entry.isConnected)
      .map((entry) => entry.sessionId);
  }

  setStatus(nextStatus: MatchLifecycleStatus) {
    const current = this.session.status;
    const allowed = VALID_LIFECYCLE_TRANSITIONS[current] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new Error(`Invalid lifecycle transition from ${current} to ${nextStatus}.`);
    }

    this.session.status = nextStatus;
    this.session.updatedAt = new Date().toISOString();
  }

  applyStateMutation(mutator: (state: Record<string, unknown>) => Record<string, unknown>) {
    const nextState = mutator({ ...this.session.state });
    this.session.state = nextState;
    this.session.stateVersion += 1;
    this.session.updatedAt = new Date().toISOString();
    return this.session.stateVersion;
  }

  createCheckpoint() {
    const checkpoint: MatchCheckpoint = {
      matchId: this.session.matchId,
      gameType: this.session.gameType,
      ruleVersion: this.session.ruleVersion,
      stateVersion: this.session.stateVersion,
      status: this.session.status,
      state: { ...this.session.state },
      savedAt: new Date().toISOString(),
      metadata: { participants: this.session.participants.map((participant) => ({ teamId: participant.teamId, seatIndex: participant.seatIndex, status: participant.status })) },
    };

    this.session.checkpoint = checkpoint;
    return checkpoint;
  }

  restoreFromCheckpoint(checkpoint: MatchCheckpoint) {
    this.session.gameType = normalizeGameType(checkpoint.gameType);
    this.session.ruleVersion = checkpoint.ruleVersion;
    this.session.stateVersion = checkpoint.stateVersion;
    this.session.status = checkpoint.status;
    this.session.state = { ...checkpoint.state };
    this.session.checkpoint = checkpoint;
    this.session.updatedAt = new Date().toISOString();
    return this.session;
  }

  setCheckpoint(checkpoint: MatchCheckpoint) {
    this.session.checkpoint = checkpoint;
    return this.session;
  }

  commitDurableTransition(
    action: MatchActionRequest,
    nextState: Record<string, unknown>,
    newVersion: number
  ) {
    this.processedActions.add(action.actionId);
    this.session.state = nextState;
    this.session.stateVersion = newVersion;
    this.session.updatedAt = new Date().toISOString();
    return this.getMatch();
  }

  restoreProcessedActions(actionIds: string[]) {
    for (const actionId of actionIds) {
      if (typeof actionId === 'string' && actionId.trim()) {
        this.processedActions.add(actionId.trim());
      }
    }
  }

  isActionProcessed(actionId: string): boolean {
    return this.processedActions.has(actionId);
  }

  getProcessedActionIds(): string[] {
    return Array.from(this.processedActions);
  }

  validateExpectedState(expectedStateVersion: number | undefined, actionId: string) {
    if (actionId && this.processedActions.has(actionId)) {
      return { ok: false, error: 'Duplicate action ID detected.' };
    }

    if (typeof expectedStateVersion === 'number' && expectedStateVersion !== this.session.stateVersion) {
      return { ok: false, error: `Stale action: expected stateVersion ${expectedStateVersion}, server is at ${this.session.stateVersion}.` };
    }

    return { ok: true };
  }

  registerAction(action: MatchActionRequest) {
    const validation = this.validateExpectedState(action.expectedStateVersion, action.actionId);
    if (!validation.ok) {
      return { ok: false, error: validation.error };
    }

    this.processedActions.add(action.actionId);
    return { ok: true, actionId: action.actionId };
  }

  applyAction(action: MatchActionRequest, mutator: (state: Record<string, unknown>, action: MatchActionRequest) => Record<string, unknown>) {
    const teamValidation = this.validateParticipantAction(action.teamId, action.sessionId);
    if (!teamValidation.ok) {
      return { ok: false, error: teamValidation.error };
    }

    const actionRegistration = this.registerAction(action);
    if (!actionRegistration.ok) {
      return { ok: false, error: actionRegistration.error };
    }

    const nextState = mutator({ ...this.session.state }, action);
    this.session.state = nextState;
    this.session.stateVersion += 1;
    this.session.updatedAt = new Date().toISOString();

    return {
      ok: true,
      stateVersion: this.session.stateVersion,
      appliedActionId: action.actionId,
      match: this.getMatch(),
    } satisfies MatchStateTransitionResult;
  }

  validateParticipantAction(teamId: string, sessionId?: string) {
    if (!this.session.participants.some((participant) => participant.teamId === teamId)) {
      return { ok: false, error: 'Unauthorized participant.' };
    }

    if (sessionId) {
      const hasMatchingConnection = [...this.connections.values()].some(
        (connection) => connection.teamId === teamId && connection.sessionId === sessionId && connection.isConnected
      );

      if (!hasMatchingConnection) {
        return { ok: false, error: 'Session is not connected to this match.' };
      }
    }

    return { ok: true };
  }

  completeMatch(winnerTeamId?: string, metadata?: Record<string, unknown>) {
    if (this.session.status === 'completed' || this.session.status === 'cancelled' || this.session.status === 'abandoned') {
      return { ok: false, error: 'Match is already terminal.' };
    }

    this.session.status = 'completed';
    this.session.state = {
      ...(this.session.state ?? {}),
      winnerTeamId: winnerTeamId ?? null,
      resultMetadata: metadata ?? {},
    };
    this.session.stateVersion += 1;
    this.session.updatedAt = new Date().toISOString();
    return { ok: true, stateVersion: this.session.stateVersion, match: this.getMatch() };
  }

  cancelMatch(reason?: string) {
    if (this.session.status === 'completed' || this.session.status === 'cancelled' || this.session.status === 'abandoned') {
      return { ok: false, error: 'Match is already terminal.' };
    }

    this.session.status = 'cancelled';
    this.session.state = {
      ...(this.session.state ?? {}),
      cancellationReason: reason ?? 'cancelled-by-admin',
    };
    this.session.stateVersion += 1;
    this.session.updatedAt = new Date().toISOString();
    return { ok: true, stateVersion: this.session.stateVersion, match: this.getMatch() };
  }

  generateActionId() {
    return crypto.randomUUID();
  }
}

export function createMatchSession(config: MatchSessionConfig) {
  return new MatchSessionController(config);
}
