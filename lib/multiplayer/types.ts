export type QueueStatus = 'queued' | 'matched' | 'cancelled' | 'stale';
export type MatchStatus = 'waiting' | 'active' | 'completed' | 'cancelled' | 'abandoned';
export type MatchParticipantStatus = 'joined' | 'disconnected' | 'left';

export interface QueueEntryRecord {
  id: string;
  teamId: string;
  gameType: string;
  status: QueueStatus;
  createdAt: string;
  matchedAt?: string | null;
  matchId?: string | null;
  queueMetadata?: Record<string, unknown>;
}

export interface MatchConnectionRecord {
  sessionId: string;
  teamId: string;
  connectedAt: string;
  disconnectedAt?: string | null;
  lastSeenAt: string;
  isConnected: boolean;
}

export interface MatchParticipant {
  teamId: string;
  seatIndex: number;
  status: MatchParticipantStatus;
  joinedAt: string;
  disconnectedAt?: string | null;
  leftAt?: string | null;
  connectionIds: string[];
}

export interface MatchCheckpoint {
  matchId: string;
  gameType: string;
  ruleVersion: string;
  stateVersion: number;
  status: MatchStatus;
  state: Record<string, unknown>;
  savedAt: string;
  metadata?: Record<string, unknown>;
}

export interface MatchSession {
  matchId: string;
  gameType: string;
  ruleVersion: string;
  stateVersion: number;
  status: MatchStatus;
  participants: MatchParticipant[];
  createdAt: string;
  updatedAt: string;
  state: Record<string, unknown>;
  checkpoint?: MatchCheckpoint;
}

export interface MatchCreationResult {
  ok: true;
  match: MatchSession;
  queueEntries: Array<{ queueEntryId: string; teamId: string; gameType: string }>;
}

export function normalizeGameType(gameType: string) {
  return String(gameType || '').trim().toLowerCase();
}

export function isQueueEntryActive(status?: string | null) {
  return status === 'queued' || status === 'matched';
}

export function isStaleQueueEntry(createdAt: string | Date, staleAfterMs: number = 30 * 60 * 1000) {
  const createdAtMs = new Date(createdAt).getTime();
  return Number.isFinite(createdAtMs) && Date.now() - createdAtMs > staleAfterMs;
}

export function buildMatchSession(input: {
  matchId: string;
  gameType: string;
  ruleVersion: string;
  participants?: MatchParticipant[];
  status?: MatchStatus;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  stateVersion?: number;
  state?: Record<string, unknown>;
  checkpoint?: MatchCheckpoint;
}): MatchSession {
  const now = new Date().toISOString();
  return {
    matchId: input.matchId,
    gameType: normalizeGameType(input.gameType),
    ruleVersion: input.ruleVersion,
    stateVersion: input.stateVersion ?? 0,
    status: input.status ?? 'waiting',
    participants: input.participants ?? [],
    createdAt: new Date(input.createdAt ?? now).toISOString(),
    updatedAt: new Date(input.updatedAt ?? now).toISOString(),
    state: input.state ?? {},
    checkpoint: input.checkpoint,
  };
}

export function createMatchParticipants(teamIds: string[]) {
  return teamIds.map((teamId, index) => ({
    teamId,
    seatIndex: index,
    status: 'joined' as const,
    joinedAt: new Date().toISOString(),
    disconnectedAt: null,
    leftAt: null,
    connectionIds: [],
  }));
}
