import test from 'node:test';
import assert from 'node:assert/strict';

import { createMatchSession } from './matchSession';
import { createMatchParticipants } from './types';

const baseParticipants = createMatchParticipants(['TEAM-01', 'TEAM-02']);

test('MatchSession creation', () => {
  const session = createMatchSession({
    matchId: 'match-1',
    gameType: 'ludo',
    ruleVersion: 'v1',
    participants: baseParticipants,
  });

  const match = session.getMatch();
  assert.equal(match.matchId, 'match-1');
  assert.equal(match.gameType, 'ludo');
  assert.equal(match.ruleVersion, 'v1');
  assert.equal(match.stateVersion, 0);
  assert.equal(match.status, 'waiting');
  assert.equal(match.participants.length, 2);
});

test('Participant membership is tracked and unauthorized participants are rejected', () => {
  const session = createMatchSession({
    matchId: 'match-2',
    gameType: 'snakes',
    ruleVersion: 'v1',
    participants: baseParticipants,
  });

  assert.doesNotThrow(() => session.ensureParticipant('TEAM-01'));
  assert.throws(() => session.ensureParticipant('TEAM-99'), /not a participant/i);

  const auth = session.validateParticipantAction('TEAM-01');
  assert.equal(auth.ok, true);
  const unauthorized = session.validateParticipantAction('TEAM-99');
  assert.equal(unauthorized.ok, false);
  if (!unauthorized.ok) {
    assert.equal(typeof unauthorized.error, 'string');
    assert.match(String(unauthorized.error), /unauthorized participant/i);
  }
});

test('Valid lifecycle transitions are allowed', () => {
  const session = createMatchSession({ matchId: 'match-3', gameType: 'ludo', ruleVersion: 'v1', participants: baseParticipants });
  session.setStatus('active');
  assert.equal(session.getStatus(), 'active');
  session.setStatus('completed');
  assert.equal(session.getStatus(), 'completed');
});

test('Invalid lifecycle transitions are rejected', () => {
  const session = createMatchSession({ matchId: 'match-4', gameType: 'ludo', ruleVersion: 'v1', participants: baseParticipants, status: 'active' });
  assert.throws(() => session.setStatus('waiting'), /Invalid lifecycle transition/i);
  assert.throws(() => session.setStatus('active'), /Invalid lifecycle transition/i);
});

test('State version increments and stale actions are rejected', () => {
  const session = createMatchSession({ matchId: 'match-5', gameType: 'ludo', ruleVersion: 'v1', participants: baseParticipants, state: { turn: 1 } });

  const stale = session.validateExpectedState(999, 'action-1');
  assert.equal(stale.ok, false);
  if (!stale.ok) {
    assert.equal(typeof stale.error, 'string');
    assert.match(String(stale.error), /expected stateVersion 999/i);
  }

  const accepted = session.validateExpectedState(0, 'action-1');
  assert.equal(accepted.ok, true);

  const result = session.applyAction({ actionId: 'action-1', teamId: 'TEAM-01', expectedStateVersion: 0, payload: { move: 3 } }, (_state, action) => ({
    ..._state,
    turn: 2,
    lastAction: action.actionId,
  }));

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.stateVersion, 1);
  }
});

test('Duplicate action IDs are rejected', () => {
  const session = createMatchSession({ matchId: 'match-6', gameType: 'ludo', ruleVersion: 'v1', participants: baseParticipants });

  const first = session.registerAction({ actionId: 'duplicate-1', teamId: 'TEAM-01' });
  assert.equal(first.ok, true);

  const second = session.registerAction({ actionId: 'duplicate-1', teamId: 'TEAM-01' });
  assert.equal(second.ok, false);
  if (!second.ok) {
    assert.equal(typeof second.error, 'string');
    assert.match(String(second.error), /Duplicate action ID/i);
  }
});

test('Multiple simultaneous connections for the same team are supported', () => {
  const session = createMatchSession({ matchId: 'match-7', gameType: 'ludo', ruleVersion: 'v1', participants: baseParticipants });

  session.addConnection('session-A', 'TEAM-01');
  session.addConnection('session-B', 'TEAM-01');

  const connected = session.getConnectedSessionsForTeam('TEAM-01');
  assert.deepEqual(connected.sort(), ['session-A', 'session-B']);
  assert.equal(session.getMatch().participants[0].connectionIds.length, 2);
});

test('Disconnect and reconnect logic preserves team membership', () => {
  const session = createMatchSession({ matchId: 'match-8', gameType: 'ludo', ruleVersion: 'v1', participants: baseParticipants });
  session.addConnection('session-C', 'TEAM-02');
  session.disconnectConnection('session-C', 'TEAM-02');

  const participant = session.getMatch().participants.find((entry) => entry.teamId === 'TEAM-02');
  assert.equal(participant?.status, 'disconnected');
  assert.equal(participant?.connectionIds.length, 0);

  session.addConnection('session-D', 'TEAM-02');
  const reconnected = session.getMatch().participants.find((entry) => entry.teamId === 'TEAM-02');
  assert.equal(reconnected?.status, 'joined');
});

test('Resynchronization restores from checkpoint state', () => {
  const session = createMatchSession({ matchId: 'match-9', gameType: 'ludo', ruleVersion: 'v1', participants: baseParticipants, state: { turn: 1 } });
  session.applyStateMutation((state) => ({ ...state, turn: 2 }));

  const checkpoint = session.createCheckpoint();
  const restored = createMatchSession({ matchId: 'match-9', gameType: 'ludo', ruleVersion: 'v1', participants: baseParticipants });
  restored.restoreFromCheckpoint(checkpoint);

  assert.equal(restored.getStateVersion(), 1);
  assert.deepEqual(restored.getMatch().state, { turn: 2 });
});

test('Match completion and cancellation are terminal but valid', () => {
  const activeSession = createMatchSession({ matchId: 'match-10', gameType: 'ludo', ruleVersion: 'v1', participants: baseParticipants, status: 'active' });
  const completeResult = activeSession.completeMatch('TEAM-01', { winner: 'TEAM-01' });
  assert.equal(completeResult.ok, true);
  if (completeResult.ok) {
    assert.equal(activeSession.getStatus(), 'completed');
  }

  const cancelledSession = createMatchSession({ matchId: 'match-11', gameType: 'ludo', ruleVersion: 'v1', participants: baseParticipants, status: 'waiting' });
  const cancelResult = cancelledSession.cancelMatch('admin-maintenance');
  assert.equal(cancelResult.ok, true);
  if (cancelResult.ok) {
    assert.equal(cancelledSession.getStatus(), 'cancelled');
  }
});

test('Controlled checkpoint persistence boundary is exposed and safe', () => {
  const session = createMatchSession({ matchId: 'match-12', gameType: 'ludo', ruleVersion: 'v1', participants: baseParticipants, state: { board: ['a'] } });
  session.applyStateMutation((state) => ({ ...state, board: ['a', 'b'] }));

  const checkpoint = session.createCheckpoint();
  assert.equal(checkpoint.stateVersion, 1);
  assert.equal(checkpoint.matchId, 'match-12');
  assert.equal(checkpoint.gameType, 'ludo');
});
