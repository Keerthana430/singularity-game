import test from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';

import { createMatchSession } from './matchSession';
import { createRealtimeServer } from './realtime';

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

async function waitForMessage(socket: WebSocket, predicate: (payload: any) => boolean) {
  return new Promise<any>((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off('message', onMessage);
      reject(new Error('Timed out waiting for a match message.'));
    }, 2000);

    const onMessage = (raw: any) => {
      try {
        const parsed = JSON.parse(raw.toString());
        if (predicate(parsed)) {
          clearTimeout(timer);
          socket.off('message', onMessage);
          resolve(parsed);
        }
      } catch {
        // ignore malformed messages while waiting
      }
    };

    socket.on('message', onMessage);
  });
}

test('realtime server authenticates the session and validates match membership before accepting a connection', async () => {
  const match = createMatchSession({
    matchId: 'match-rt-1',
    gameType: 'ludo',
    ruleVersion: 'v1',
    participants: [
      { teamId: 'TEAM-01', seatIndex: 0, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
      { teamId: 'TEAM-02', seatIndex: 1, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
    ],
  });

  const server = createRealtimeServer({
    host: '127.0.0.1',
    port: 0,
    authResolver: async (token) => {
      if (token === 'valid-team-session') {
        return { ok: true, identity: { id: 'session-1', teamId: 'TEAM-01', sessionId: 'session-1', role: 'team' } };
      }

      return { ok: false, error: 'Invalid session token.' };
    },
  });

  server.registerMatch('match-rt-1', match);
  const port = await new Promise<number>((resolve) => {
    const httpServer = require('node:http').createServer();
    httpServer.listen(0, '127.0.0.1', () => {
      const address = httpServer.address();
      const actualPort = typeof address === 'object' && address ? address.port : 0;
      server.registerMatch('match-rt-1', match);
      server['wss']?.on('connection', () => {});
      resolve(actualPort);
    });
  });

  const socket = new WebSocket(`ws://127.0.0.1:${port}/?sessionToken=valid-team-session&matchId=match-rt-1`);
  await waitForSocketOpen(socket);

  const welcome = await waitForMessage(socket, (payload) => payload.type === 'hello');
  assert.equal(welcome.payload.teamId, 'TEAM-01');

  const state = await waitForMessage(socket, (payload) => payload.type === 'state');
  assert.equal(state.matchId, 'match-rt-1');

  socket.close();
  server.close();
});

test('realtime server rejects non-members and malformed payloads', async () => {
  const match = createMatchSession({
    matchId: 'match-rt-2',
    gameType: 'snakes',
    ruleVersion: 'v2',
    participants: [{ teamId: 'TEAM-10', seatIndex: 0, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] }],
  });

  const server = createRealtimeServer({
    host: '127.0.0.1',
    port: 0,
    authResolver: async (token) => {
      if (token === 'team-99-session') {
        return { ok: true, identity: { id: 'session-2', teamId: 'TEAM-99', sessionId: 'session-2', role: 'team' } };
      }
      return { ok: true, identity: { id: 'session-3', teamId: 'TEAM-10', sessionId: 'session-3', role: 'team' } };
    },
  });

  server.registerMatch('match-rt-2', match);
  const port = await new Promise<number>((resolve) => {
    const httpServer = require('node:http').createServer();
    httpServer.listen(0, '127.0.0.1', () => {
      const address = httpServer.address();
      const actualPort = typeof address === 'object' && address ? address.port : 0;
      resolve(actualPort);
    });
  });

  const rejectedSocket = new WebSocket(`ws://127.0.0.1:${port}/?sessionToken=team-99-session&matchId=match-rt-2`);
  const rejection = await waitForMessage(rejectedSocket, (payload) => payload.type === 'error');
  assert.match(String(rejection.payload?.error || ''), /not a participant/i);
  rejectedSocket.close();

  const malformedSocket = new WebSocket(`ws://127.0.0.1:${port}/?sessionToken=team-10-session&matchId=match-rt-2`);
  await waitForSocketOpen(malformedSocket);
  malformedSocket.send('not-json');
  const malformed = await waitForMessage(malformedSocket, (payload) => payload.type === 'error');
  assert.match(String(malformed.payload?.error || ''), /malformed/i);
  malformedSocket.close();

  server.close();
});

test('realtime action path validates the authenticated session and applies valid actions through MatchSession', async () => {
  const match = createMatchSession({
    matchId: 'match-rt-action',
    gameType: 'ludo',
    ruleVersion: 'v1',
    participants: [
      { teamId: 'TEAM-01', seatIndex: 0, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
      { teamId: 'TEAM-02', seatIndex: 1, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
    ],
    state: { turn: 1 },
  });

  const server = createRealtimeServer({
    host: '127.0.0.1',
    port: 0,
    authResolver: async (token) => {
      if (token === 'team-01-valid') {
        return { ok: true, identity: { id: 'session-action-1', teamId: 'TEAM-01', sessionId: 'session-action-1', role: 'team' } };
      }
      return { ok: false, error: 'Invalid session token.' };
    },
    onAction: async (action, _context, session) => ({
      ok: true,
      mutator: (state, incoming) => ({
        ...state,
        turn: Number(state.turn ?? 0) + 1,
        lastActionId: incoming.actionId,
        lastPayload: incoming.payload ?? {},
      }),
    }),
  });

  server.registerMatch('match-rt-action', match);
  const port = await new Promise<number>((resolve) => {
    const httpServer = require('node:http').createServer();
    httpServer.listen(0, '127.0.0.1', () => {
      const address = httpServer.address();
      resolve(typeof address === 'object' && address ? address.port : 0);
    });
  });

  const socket = new WebSocket(`ws://127.0.0.1:${port}/?sessionToken=team-01-valid&matchId=match-rt-action`);
  await waitForSocketOpen(socket);
  const hello = await waitForMessage(socket, (payload) => payload.type === 'hello');
  assert.equal(hello.payload.teamId, 'TEAM-01');

  socket.send(JSON.stringify({
    type: 'action',
    matchId: 'match-rt-action',
    payload: { actionId: 'action-1', expectedStateVersion: 0, payload: { move: 3 } },
  }));

  const stateUpdate = await waitForMessage(socket, (payload) => payload.type === 'state' && payload.payload?.appliedActionId === 'action-1');
  assert.equal(stateUpdate.payload.match.stateVersion, 1);
  assert.equal(match.getStateVersion(), 1);

  socket.close();
  server.close();
});

test('realtime rejects duplicate and stale actions with a resync payload', async () => {
  const match = createMatchSession({
    matchId: 'match-rt-stale',
    gameType: 'snakes',
    ruleVersion: 'v1',
    participants: [
      { teamId: 'TEAM-09', seatIndex: 0, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
      { teamId: 'TEAM-10', seatIndex: 1, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
    ],
    state: { turn: 1 },
  });

  const server = createRealtimeServer({
    host: '127.0.0.1',
    port: 0,
    authResolver: async (token) => {
      if (token === 'team-09-valid') {
        return { ok: true, identity: { id: 'session-stale', teamId: 'TEAM-09', sessionId: 'session-stale', role: 'team' } };
      }
      return { ok: false, error: 'Invalid session token.' };
    },
    onAction: async (action, _context, _session) => ({
      ok: true,
      mutator: (state) => ({ ...state, lastActionId: action.actionId }),
    }),
  });

  server.registerMatch('match-rt-stale', match);
  const port = await new Promise<number>((resolve) => {
    const httpServer = require('node:http').createServer();
    httpServer.listen(0, '127.0.0.1', () => {
      const address = httpServer.address();
      resolve(typeof address === 'object' && address ? address.port : 0);
    });
  });

  const socket = new WebSocket(`ws://127.0.0.1:${port}/?sessionToken=team-09-valid&matchId=match-rt-stale`);
  await waitForSocketOpen(socket);
  await waitForMessage(socket, (payload) => payload.type === 'hello');
  await waitForMessage(socket, (payload) => payload.type === 'state');

  socket.send(JSON.stringify({ type: 'action', matchId: 'match-rt-stale', payload: { actionId: 'dup-1', expectedStateVersion: 0, payload: { move: 4 } } }));
  const first = await waitForMessage(socket, (payload) => payload.type === 'state' && payload.payload?.appliedActionId === 'dup-1');
  assert.equal(first.payload.stateVersion, 1);

  socket.send(JSON.stringify({ type: 'action', matchId: 'match-rt-stale', payload: { actionId: 'dup-1', expectedStateVersion: 0, payload: { move: 5 } } }));
  const duplicate = await waitForMessage(socket, (payload) => payload.type === 'resync' && payload.payload?.code === 'STALE_STATE');
  assert.match(String(duplicate.payload?.error || ''), /duplicate|stale/i);

  socket.send(JSON.stringify({ type: 'action', matchId: 'match-rt-stale', payload: { actionId: 'stale-2', expectedStateVersion: 99, payload: { move: 6 } } }));
  const stale = await waitForMessage(socket, (payload) => payload.type === 'resync' && payload.payload?.resync === true);
  assert.equal(stale.payload.stateVersion, 1);

  socket.close();
  server.close();
});

test('realtime broadcasts authoritative state to all valid match connections and allows resync requests', async () => {
  const match = createMatchSession({
    matchId: 'match-rt-broadcast',
    gameType: 'ludo',
    ruleVersion: 'v1',
    participants: [
      { teamId: 'TEAM-03', seatIndex: 0, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
      { teamId: 'TEAM-04', seatIndex: 1, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] },
    ],
    state: { turn: 1 },
  });

  const server = createRealtimeServer({
    host: '127.0.0.1',
    port: 0,
    authResolver: async (token) => {
      if (token === 'team-03-valid') {
        return { ok: true, identity: { id: 'session-b-1', teamId: 'TEAM-03', sessionId: 'session-b-1', role: 'team' } };
      }
      if (token === 'team-04-valid') {
        return { ok: true, identity: { id: 'session-b-2', teamId: 'TEAM-04', sessionId: 'session-b-2', role: 'team' } };
      }
      return { ok: false, error: 'Invalid session token.' };
    },
    onAction: async (action, _context, _session) => ({
      ok: true,
      mutator: (state) => ({ ...state, turn: Number(state.turn ?? 0) + 1, lastActionId: action.actionId }),
    }),
  });

  server.registerMatch('match-rt-broadcast', match);
  const port = await new Promise<number>((resolve) => {
    const httpServer = require('node:http').createServer();
    httpServer.listen(0, '127.0.0.1', () => {
      const address = httpServer.address();
      resolve(typeof address === 'object' && address ? address.port : 0);
    });
  });

  const team3Socket = new WebSocket(`ws://127.0.0.1:${port}/?sessionToken=team-03-valid&matchId=match-rt-broadcast`);
  const team4Socket = new WebSocket(`ws://127.0.0.1:${port}/?sessionToken=team-04-valid&matchId=match-rt-broadcast`);

  await Promise.all([waitForSocketOpen(team3Socket), waitForSocketOpen(team4Socket)]);
  await Promise.all([
    waitForMessage(team3Socket, (payload) => payload.type === 'hello'),
    waitForMessage(team4Socket, (payload) => payload.type === 'hello'),
  ]);

  team3Socket.send(JSON.stringify({ type: 'action', matchId: 'match-rt-broadcast', payload: { actionId: 'broadcast-1', expectedStateVersion: 0, payload: { move: 2 } } }));

  const team3State = await waitForMessage(team3Socket, (payload) => payload.type === 'state' && payload.payload?.appliedActionId === 'broadcast-1');
  const team4State = await waitForMessage(team4Socket, (payload) => payload.type === 'state' && payload.payload?.appliedActionId === 'broadcast-1');
  assert.equal(team3State.payload.stateVersion, 1);
  assert.equal(team4State.payload.stateVersion, 1);

  team3Socket.send(JSON.stringify({ type: 'state-request', matchId: 'match-rt-broadcast' }));
  const resync = await waitForMessage(team3Socket, (payload) => payload.type === 'resync' && payload.payload?.resync === true);
  assert.equal(resync.payload.match.stateVersion, 1);

  team3Socket.close();
  team4Socket.close();
  server.close();
});

test('realtime rejects invalid sessions, unauthorized actions, malformed payloads, and oversized messages', async () => {
  const match = createMatchSession({
    matchId: 'match-rt-guard',
    gameType: 'ludo',
    ruleVersion: 'v1',
    participants: [{ teamId: 'TEAM-05', seatIndex: 0, status: 'joined', joinedAt: new Date().toISOString(), connectionIds: [] }],
  });

  const server = createRealtimeServer({
    host: '127.0.0.1',
    port: 0,
    authResolver: async (token) => {
      if (token === 'team-05-valid') {
        return { ok: true, identity: { id: 'session-guard', teamId: 'TEAM-05', sessionId: 'session-guard', role: 'team' } };
      }
      if (token === 'team-99-valid') {
        return { ok: true, identity: { id: 'session-guard-2', teamId: 'TEAM-99', sessionId: 'session-guard-2', role: 'team' } };
      }
      return { ok: false, error: 'Invalid session token.' };
    },
    onAction: async () => ({ ok: true, mutator: (state) => ({ ...state }) }),
  });

  server.registerMatch('match-rt-guard', match);
  const port = await new Promise<number>((resolve) => {
    const httpServer = require('node:http').createServer();
    httpServer.listen(0, '127.0.0.1', () => {
      const address = httpServer.address();
      resolve(typeof address === 'object' && address ? address.port : 0);
    });
  });

  const invalidSession = new WebSocket(`ws://127.0.0.1:${port}/?sessionToken=bad-session&matchId=match-rt-guard`);
  const invalidError = await waitForMessage(invalidSession, (payload) => payload.type === 'error');
  assert.match(String(invalidError.payload?.error || ''), /invalid session/i);
  invalidSession.close();

  const unauthorizedSocket = new WebSocket(`ws://127.0.0.1:${port}/?sessionToken=team-99-valid&matchId=match-rt-guard`);
  const unauthorizedError = await waitForMessage(unauthorizedSocket, (payload) => payload.type === 'error');
  assert.match(String(unauthorizedError.payload?.error || ''), /not a participant/i);
  unauthorizedSocket.close();

  const validSocket = new WebSocket(`ws://127.0.0.1:${port}/?sessionToken=team-05-valid&matchId=match-rt-guard`);
  await waitForSocketOpen(validSocket);
  await waitForMessage(validSocket, (payload) => payload.type === 'hello');
  validSocket.send('not-json');
  const malformed = await waitForMessage(validSocket, (payload) => payload.type === 'error' && payload.payload?.code === 'MALFORMED_MESSAGE');
  assert.match(String(malformed.payload?.error || ''), /malformed/i);

  const bigPayload = 'x'.repeat(70 * 1024);
  validSocket.send(JSON.stringify({ type: 'action', matchId: 'match-rt-guard', payload: { actionId: 'oversized', payload: bigPayload } }));
  const oversized = await waitForMessage(validSocket, (payload) => payload.type === 'error' && payload.payload?.code === 'MESSAGE_TOO_LARGE');
  assert.match(String(oversized.payload?.error || ''), /64 KB|Message exceeds/i);

  validSocket.close();
  server.close();
});
