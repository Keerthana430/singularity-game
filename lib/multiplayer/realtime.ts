import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import { WebSocketServer, type WebSocket } from 'ws';

import { pgPool } from '@/lib/db/postgres';
import { verifySessionFromToken } from '@/lib/auth/teamIdentity';
import { MatchSessionController, type MatchActionRequest } from './matchSession';
import { executeDurableAction, recoverMatchFromDatabase } from './durableMatchStore';
import type { MatchSession as MatchSessionShape } from './types';

export type RealtimeIdentity = {
  id: string;
  teamId: string;
  sessionId: string;
  teamCode?: string;
  displayName?: string;
  role?: string;
  isAdmin?: boolean;
  expiresAt?: number;
};

export type RealtimeAuthResult =
  | { ok: true; identity: RealtimeIdentity }
  | { ok: false, error: string };

export type RealtimeMatchSession = MatchSessionController | MatchSessionShape;

export interface RealtimeActionDecision {
  ok: boolean;
  error?: string;
  code?: string;
  mutator?: (state: Record<string, unknown>, action: MatchActionRequest) => Record<string, unknown>;
  stateVersion?: number;
}

export interface RealtimeServerOptions {
  host?: string;
  port?: number;
  authResolver?: (token: string) => Promise<RealtimeAuthResult> | RealtimeAuthResult;
  matchSessions?: Map<string, RealtimeMatchSession>;
  onMessage?: (message: RealtimeMessage, context: RealtimeContext) => void | Promise<void>;
  onConnection?: (context: RealtimeContext) => void | Promise<void>;
  onDisconnect?: (context: RealtimeContext) => void | Promise<void>;
  onAction?: (
    action: MatchActionRequest,
    context: RealtimeContext,
    match: MatchSessionController
  ) => Promise<RealtimeActionDecision> | RealtimeActionDecision;
}

export type RealtimeMessageType =
  | 'hello'
  | 'subscribe'
  | 'ping'
  | 'pong'
  | 'state-request'
  | 'resync'
  | 'state'
  | 'presence'
  | 'action'
  | 'error';

export interface RealtimeMessage {
  type: RealtimeMessageType;
  messageId?: string;
  matchId?: string;
  payload?: Record<string, unknown>;
}

export interface RealtimeContext {
  teamId: string;
  sessionId: string;
  matchId: string;
  socket: WebSocket;
}

interface ActiveClient {
  teamId: string;
  sessionId: string;
  matchId: string;
  connectedAt: number;
  socket: WebSocket;
}

const MAX_MESSAGE_BYTES = 64 * 1024;
const UNSAFE_ACTION_KEYS = new Set(['teamId', 'playerId', 'role', 'winner', 'score', 'reward', 'turn', 'state']);
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getTokenFromRequest(request: IncomingMessage, fallback?: string) {
  const url = new URL(request.url || '/', 'http://localhost');
  const queryToken = url.searchParams.get('sessionToken') || url.searchParams.get('token');
  const authorization = request.headers.authorization || '';
  const bearer = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  return queryToken || bearer || fallback || null;
}

function isMatchSessionController(value: unknown): value is MatchSessionController {
  return typeof value === 'object' && value !== null && 'getMatch' in value && typeof (value as { getMatch?: unknown }).getMatch === 'function';
}

function getMatchSnapshot(match: RealtimeMatchSession): MatchSessionShape {
  if (isMatchSessionController(match)) {
    return match.getMatch();
  }

  return match;
}

function sanitizeActionPayload(payload: Record<string, unknown> | undefined) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {} as Record<string, unknown>;
  }

  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (UNSAFE_ACTION_KEYS.has(key)) {
      continue;
    }
    next[key] = value;
  }

  return next;
}

function normalizeActionMessage(message: RealtimeMessage, client: ActiveClient): { ok: true; action: MatchActionRequest; matchId: string } | { ok: false; error: string; code?: string } {
  const matchId = message.matchId || client.matchId;
  if (!matchId) {
    return { ok: false, error: 'matchId is required for action submission.' };
  }

  const payload = (message.payload && typeof message.payload === 'object' ? message.payload : {}) as Record<string, unknown>;
  const actionId = typeof payload.actionId === 'string' ? payload.actionId.trim() : '';
  if (!actionId) {
    return { ok: false, error: 'Action message requires a non-empty actionId.', code: 'INVALID_ACTION' };
  }

  const expectedStateVersionCandidate = payload.expectedStateVersion;
  const expectedStateVersion = typeof expectedStateVersionCandidate === 'number' && Number.isFinite(expectedStateVersionCandidate)
    ? expectedStateVersionCandidate
    : undefined;

  const rawActionPayload = payload.payload && typeof payload.payload === 'object' && !Array.isArray(payload.payload)
    ? payload.payload as Record<string, unknown>
    : payload;

  const safeActionPayload = sanitizeActionPayload(rawActionPayload);

  return {
    ok: true,
    matchId,
    action: {
      actionId,
      teamId: client.teamId,
      sessionId: client.sessionId,
      expectedStateVersion,
      payload: safeActionPayload,
    },
  };
}

export class RealtimeServer {
  private readonly host: string;
  private readonly port: number;
  private readonly authResolver: (token: string) => Promise<RealtimeAuthResult> | RealtimeAuthResult;
  private readonly matchSessions: Map<string, RealtimeMatchSession>;
  private readonly clients = new Map<WebSocket, ActiveClient>();
  private readonly onMessage?: RealtimeServerOptions['onMessage'];
  private readonly onConnection?: RealtimeServerOptions['onConnection'];
  private readonly onDisconnect?: RealtimeServerOptions['onDisconnect'];
  private readonly onAction?: RealtimeServerOptions['onAction'];
  private wss: WebSocketServer | null = null;
  private httpServer: ReturnType<typeof import('node:http').createServer> | null = null;

  constructor(options: RealtimeServerOptions = {}) {
    this.host = options.host ?? '127.0.0.1';
    this.port = options.port ?? 0;
    this.authResolver = options.authResolver ?? ((token) => verifySessionFromToken(token));
    this.matchSessions = options.matchSessions ?? new Map();
    this.onMessage = options.onMessage;
    this.onConnection = options.onConnection;
    this.onDisconnect = options.onDisconnect;
    this.onAction = options.onAction;

    this.wss = new WebSocketServer({ noServer: true });
    this.wss.on('connection', (socket, request) => {
      void this.handleConnection(socket, request);
    });
  }

  registerMatch(matchId: string, match: RealtimeMatchSession) {
    this.matchSessions.set(matchId, match);
  }

  unregisterMatch(matchId: string) {
    this.matchSessions.delete(matchId);
    for (const client of [...this.clients.values()]) {
      if (client.matchId === matchId) {
        this.clients.delete(client.socket);
      }
    }
  }

  getClientsForMatch(matchId: string) {
    return [...this.clients.values()].filter((client) => client.matchId === matchId);
  }

  async listen() {
    if (!this.wss) {
      throw new Error('Realtime server has been closed.');
    }

    if (this.httpServer) {
      return this.port;
    }

    const http = await import('node:http');
    const server = http.createServer();
    this.httpServer = server;

    server.on('upgrade', (request: IncomingMessage, socket: Duplex, head: Buffer) => {
      this.wss!.handleUpgrade(request, socket, head, (socketInstance) => {
        this.wss!.emit('connection', socketInstance, request);
      });
    });

    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(this.port, this.host, () => {
        server.off('error', reject);
        resolve();
      });
    });

    const address = server.address();
    return typeof address === 'object' && address ? address.port : this.port;
  }

  close() {
    this.wss?.close();
    this.wss = null;
    if (this.httpServer) {
      this.httpServer.close();
      this.httpServer = null;
    }
    for (const client of this.clients.values()) {
      client.socket.close();
    }
    this.clients.clear();
  }

  sendToClient(socket: WebSocket, message: RealtimeMessage) {
    if (socket.readyState !== socket.OPEN) return;
    socket.send(JSON.stringify(message));
  }

  sendToMatch(matchId: string, message: RealtimeMessage, excludeSocket?: WebSocket) {
    for (const client of this.getClientsForMatch(matchId)) {
      if (client.socket !== excludeSocket && client.socket.readyState === client.socket.OPEN) {
        client.socket.send(JSON.stringify(message));
      }
    }
  }

  sendState(matchId: string, targetSocket?: WebSocket) {
    const match = this.matchSessions.get(matchId);
    const snapshot = match ? getMatchSnapshot(match) : null;
    const message: RealtimeMessage = {
      type: 'state',
      matchId,
      payload: {
        match: snapshot,
        receivedAt: new Date().toISOString(),
      },
    };

    if (targetSocket) {
      this.sendToClient(targetSocket, message);
    } else {
      this.sendToMatch(matchId, message);
    }
  }

  private async handleConnection(socket: WebSocket, request: IncomingMessage) {
    const token = getTokenFromRequest(request);
    if (!token) {
      this.sendToClient(socket, { type: 'error', payload: { error: 'Missing session token.' } });
      socket.close();
      return;
    }

    const auth = await this.authResolver(token);
    if (!auth.ok) {
      this.sendToClient(socket, { type: 'error', payload: { error: auth.error } });
      socket.close();
      return;
    }

    const url = new URL(request.url || '/', 'http://localhost');
    const matchId = url.searchParams.get('matchId') || '';
    if (!matchId) {
      this.sendToClient(socket, { type: 'error', payload: { error: 'matchId is required.' } });
      socket.close();
      return;
    }

    let match = this.matchSessions.get(matchId);
    if (!match && pgPool && UUID_REGEX.test(matchId)) {
      const recovery = await recoverMatchFromDatabase(matchId);
      if (recovery.ok) {
        this.registerMatch(matchId, recovery.controller);
        match = recovery.controller;
      } else {
        const errorCode = recovery.code === 'MATCH_NOT_FOUND' ? 'MATCH_NOT_FOUND' : 'MATCH_RECOVERY_FAILED';
        const errorMsg = recovery.code === 'MATCH_NOT_FOUND' ? 'Match does not exist.' : `Match recovery failed: ${recovery.error}`;
        this.sendToClient(socket, { type: 'error', payload: { error: errorMsg, code: errorCode } });
        socket.close();
        return;
      }
    }

    if (match) {
      const snapshot = getMatchSnapshot(match);
      const isMember = snapshot.participants.some((participant) => participant.teamId === auth.identity.teamId);
      if (!isMember) {
        this.sendToClient(socket, { type: 'error', payload: { error: 'Team is not a participant in this match.' } });
        socket.close();
        return;
      }

      if (isMatchSessionController(match)) {
        match.addConnection(auth.identity.sessionId, auth.identity.teamId);
      }
    }

    const activeClient: ActiveClient = {
      socket,
      teamId: auth.identity.teamId,
      sessionId: auth.identity.sessionId,
      matchId,
      connectedAt: Date.now(),
    };

    this.clients.set(socket, activeClient);

    this.sendToClient(socket, {
      type: 'hello',
      payload: {
        ok: true,
        teamId: auth.identity.teamId,
        sessionId: auth.identity.sessionId,
        matchId,
      },
    });

    this.sendState(matchId, socket);

    const context: RealtimeContext = {
      teamId: auth.identity.teamId,
      sessionId: auth.identity.sessionId,
      matchId,
      socket,
    };

    await this.onConnection?.(context);

    socket.on('message', (raw) => {
      void this.handleSocketMessage(socket, raw);
    });

    socket.on('close', () => {
      const client = this.clients.get(socket);
      this.clients.delete(socket);
      if (client) {
        const match = this.matchSessions.get(client.matchId);
        if (match && isMatchSessionController(match)) {
          match.disconnectConnection(client.sessionId, client.teamId);
        }
      }
      void this.onDisconnect?.({
        teamId: activeClient.teamId,
        sessionId: activeClient.sessionId,
        matchId: activeClient.matchId,
        socket,
      });
    });
  }

  private async handleSocketMessage(socket: WebSocket, raw: WebSocket.RawData) {
    let rawBytes: Buffer;

    if (Buffer.isBuffer(raw)) {
      rawBytes = raw;
    } else if (typeof raw === 'string') {
      rawBytes = Buffer.from(raw);
    } else if (raw instanceof ArrayBuffer) {
      rawBytes = Buffer.from(new Uint8Array(raw));
    } else if (Array.isArray(raw)) {
      rawBytes = Buffer.concat(raw.map((part) => {
        if (Buffer.isBuffer(part)) return part;
        if (typeof part === 'string') return Buffer.from(part);
        if (typeof (part as ArrayBufferLike).byteLength === 'number') return Buffer.from(part as unknown as ArrayBufferLike);
        return Buffer.from(String(part));
      }));
    } else {
      rawBytes = Buffer.from(raw as unknown as ArrayBufferLike);
    }
    if (rawBytes.length > MAX_MESSAGE_BYTES) {
      this.sendToClient(socket, { type: 'error', payload: { error: 'Message exceeds the 64 KB size limit.', code: 'MESSAGE_TOO_LARGE' } });
      return;
    }

    let message: RealtimeMessage;

    try {
      const parsed = JSON.parse(rawBytes.toString()) as RealtimeMessage;
      if (!parsed || typeof parsed.type !== 'string') {
        throw new Error('Message must include a type string.');
      }
      message = parsed;
    } catch {
      this.sendToClient(socket, { type: 'error', payload: { error: 'Malformed JSON message.', code: 'MALFORMED_MESSAGE' } });
      return;
    }

    const client = this.clients.get(socket);
    if (!client) {
      this.sendToClient(socket, { type: 'error', payload: { error: 'Connection session is not active.', code: 'SESSION_INACTIVE' } });
      return;
    }

    if (message.type === 'ping') {
      this.sendToClient(socket, { type: 'pong', messageId: message.messageId });
      return;
    }

    if (message.type === 'subscribe') {
      const requestedMatchId = String(message.matchId || client.matchId || '');
      if (!requestedMatchId) {
        this.sendToClient(socket, { type: 'error', payload: { error: 'matchId is required for subscription.' } });
        return;
      }

      let match = this.matchSessions.get(requestedMatchId);
      if (!match && pgPool && UUID_REGEX.test(requestedMatchId)) {
        const recovery = await recoverMatchFromDatabase(requestedMatchId);
        if (recovery.ok) {
          this.registerMatch(requestedMatchId, recovery.controller);
          match = recovery.controller;
        } else {
          const errorCode = recovery.code === 'MATCH_NOT_FOUND' ? 'MATCH_NOT_FOUND' : 'MATCH_RECOVERY_FAILED';
          const errorMsg = recovery.code === 'MATCH_NOT_FOUND' ? 'Match does not exist.' : `Match recovery failed: ${recovery.error}`;
          this.sendToClient(socket, { type: 'error', payload: { error: errorMsg, code: errorCode } });
          return;
        }
      }

      const snapshot = match ? getMatchSnapshot(match) : null;
      const isMember = snapshot ? snapshot.participants.some((participant) => participant.teamId === client.teamId) : true;

      if (!isMember) {
        this.sendToClient(socket, { type: 'error', payload: { error: 'Team is not a participant in this match.' } });
        return;
      }

      client.matchId = requestedMatchId;
      this.sendState(requestedMatchId, socket);
      return;
    }

    if (message.type === 'state-request' || message.type === 'resync') {
      const matchId = message.matchId || client.matchId;
      if (!matchId) {
        this.sendToClient(socket, { type: 'error', payload: { error: 'matchId is required.' } });
        return;
      }
      if (message.matchId && message.matchId !== client.matchId) {
        this.sendToClient(socket, { type: 'error', payload: { error: 'matchId does not match the current session subscription.', code: 'MATCH_ID_MISMATCH' } });
        return;
      }
      let match = this.matchSessions.get(matchId);
      if (!match && pgPool && UUID_REGEX.test(matchId)) {
        const recovery = await recoverMatchFromDatabase(matchId);
        if (recovery.ok) {
          this.registerMatch(matchId, recovery.controller);
          match = recovery.controller;
        }
      }
      if (match) {
        const snapshot = getMatchSnapshot(match);
        const isMember = snapshot.participants.some((participant) => participant.teamId === client.teamId);
        if (!isMember) {
          this.sendToClient(socket, { type: 'error', payload: { error: 'Team is not a participant in this match.' } });
          return;
        }
      }
      this.sendToClient(socket, {
        type: 'resync',
        matchId,
        payload: {
          match: match ? getMatchSnapshot(match) : null,
          stateVersion: match ? getMatchSnapshot(match).stateVersion : 0,
          resync: true,
          receivedAt: new Date().toISOString(),
        },
      });
      return;
    }

    if (message.type === 'presence') {
      this.sendToMatch(client.matchId, {
        type: 'presence',
        matchId: client.matchId,
        payload: {
          teamId: client.teamId,
          sessionId: client.sessionId,
          connectedAt: new Date(client.connectedAt).toISOString(),
        },
      }, socket);
      return;
    }

    if (message.type === 'action') {
      let match = this.matchSessions.get(client.matchId);
      if (!match && pgPool && UUID_REGEX.test(client.matchId)) {
        const recovery = await recoverMatchFromDatabase(client.matchId);
        if (recovery.ok) {
          this.registerMatch(client.matchId, recovery.controller);
          match = recovery.controller;
        }
      }
      if (!match || !isMatchSessionController(match)) {
        this.sendToClient(socket, { type: 'error', payload: { error: 'No authoritative match session is available for this action.', code: 'MATCH_NOT_FOUND' } });
        return;
      }

      const normalized = normalizeActionMessage(message, client);
      if (!normalized.ok) {
        this.sendToClient(socket, { type: 'error', payload: { error: normalized.error, code: normalized.code ?? 'INVALID_ACTION' } });
        return;
      }

      const actionValidation = match.validateParticipantAction(client.teamId, client.sessionId);
      if (!actionValidation.ok) {
        this.sendToClient(socket, { type: 'error', payload: { error: actionValidation.error, code: 'UNAUTHORIZED_ACTION' } });
        return;
      }

      const context: RealtimeContext = {
        teamId: client.teamId,
        sessionId: client.sessionId,
        matchId: normalized.matchId,
        socket,
      };

      const actionResolution = await this.onAction?.(normalized.action, context, match);
      if (actionResolution && !actionResolution.ok) {
        this.sendToClient(socket, {
          type: 'resync',
          matchId: normalized.matchId,
          payload: {
            error: actionResolution.error ?? 'Action rejected.',
            code: actionResolution.code ?? 'ACTION_REJECTED',
            match: getMatchSnapshot(match),
            stateVersion: match.getStateVersion(),
            resync: true,
          },
        });
        return;
      }

      const mutator = actionResolution?.mutator ?? ((state, action) => ({ ...state, lastActionId: action.actionId, ...(action.payload ?? {}) }));
      let result: {
        ok: boolean;
        error?: string;
        code?: string;
        stateVersion?: number;
        appliedActionId?: string;
        match?: MatchSessionShape;
      };

      if (pgPool) {
        const durableResult = await executeDurableAction(match, normalized.action, mutator);
        if (durableResult.ok) {
          result = {
            ok: true,
            stateVersion: durableResult.stateVersion,
            appliedActionId: durableResult.appliedActionId,
            match: durableResult.match,
          };
        } else if (durableResult.code === 'MATCH_NOT_FOUND') {
          const memResult = match.applyAction(normalized.action, mutator);
          result = {
            ok: memResult.ok,
            error: memResult.error,
            code: memResult.ok ? undefined : 'STALE_STATE',
            stateVersion: memResult.stateVersion,
            appliedActionId: memResult.appliedActionId,
            match: memResult.match,
          };
        } else {
          result = {
            ok: false,
            error: durableResult.error,
            code: durableResult.code ?? 'STALE_STATE',
            stateVersion: durableResult.currentVersion ?? match.getStateVersion(),
            match: getMatchSnapshot(match),
          };
        }
      } else {
        const memResult = match.applyAction(normalized.action, mutator);
        result = {
          ok: memResult.ok,
          error: memResult.error,
          code: memResult.ok ? undefined : 'STALE_STATE',
          stateVersion: memResult.stateVersion,
          appliedActionId: memResult.appliedActionId,
          match: memResult.match,
        };
      }

      if (!result.ok) {
        this.sendToClient(socket, {
          type: 'resync',
          matchId: normalized.matchId,
          payload: {
            error: result.error ?? 'Action rejected.',
            code: result.code ?? 'STALE_STATE',
            match: getMatchSnapshot(match),
            stateVersion: match.getStateVersion(),
            resync: true,
          },
        });
        return;
      }

      this.sendToMatch(normalized.matchId, {
        type: 'state',
        matchId: normalized.matchId,
        payload: {
          match: result.match,
          stateVersion: result.stateVersion,
          appliedActionId: result.appliedActionId,
          receivedAt: new Date().toISOString(),
        },
      });
      return;
    }

    const context: RealtimeContext = {
      teamId: client.teamId,
      sessionId: client.sessionId,
      matchId: client.matchId,
      socket,
    };

    await this.onMessage?.(message, context);
  }
}

export function createRealtimeServer(options: RealtimeServerOptions = {}) {
  return new RealtimeServer(options);
}
