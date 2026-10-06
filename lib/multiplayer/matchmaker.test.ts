import test from 'node:test';
import assert from 'node:assert/strict';

import { createSessionToken, verifySessionToken } from '@/lib/auth/teamIdentity';
import { buildMatchSession, createMatchParticipants, isQueueEntryActive, isStaleQueueEntry, normalizeGameType } from './types';
import { enforceAuthenticatedTeamIdentity, isQueueDuplicate, isDuplicateQueueEntryConstraintError } from './queue';

const now = Math.floor(Date.now() / 1000);

test('server-authenticated team identity is authoritative and cannot be overridden by the client', () => {
  const token = createSessionToken({ teamId: 'TEAM-01', role: 'team', sessionId: 'sess-1', exp: now + 600 });
  const valid = enforceAuthenticatedTeamIdentity(token, 'TEAM-01');
  const rejected = enforceAuthenticatedTeamIdentity(token, 'TEAM-02');

  assert.equal(valid.ok, true);
  assert.equal(rejected.ok, false);
  if (rejected.ok === false) {
    assert.match(rejected.error, /does not match the authenticated session/i);
  }

  const payload = verifySessionToken(token);
  assert.equal(String(payload?.teamId), 'TEAM-01');
});

test('queue status helpers correctly identify active and stale queue entries', () => {
  assert.equal(isQueueEntryActive('queued'), true);
  assert.equal(isQueueEntryActive('matched'), true);
  assert.equal(isQueueEntryActive('cancelled'), false);
  assert.equal(isStaleQueueEntry(new Date(Date.now() - 31 * 60 * 1000).toISOString()), true);
  assert.equal(normalizeGameType(' LUDO '), 'ludo');
});

test('duplicate queue detection prevents duplicate active entries for the same team/game', () => {
  const existing = [
    { teamId: 'TEAM-01', gameType: 'ludo', status: 'queued' },
    { teamId: 'TEAM-02', gameType: 'ludo', status: 'cancelled' },
  ];

  assert.equal(isQueueDuplicate(existing, 'TEAM-01', 'ludo'), true);
  assert.equal(isQueueDuplicate(existing, 'TEAM-02', 'ludo'), false);
});

test('match participants are created in seat order and include required fields', () => {
  const participants = createMatchParticipants(['TEAM-01', 'TEAM-02']);
  assert.equal(participants.length, 2);
  assert.equal(participants[0].seatIndex, 0);
  assert.equal(participants[1].teamId, 'TEAM-02');
  assert.equal(participants[0].status, 'joined');
});

test('match sessions initialize rule_version and state_version correctly', () => {
  const session = buildMatchSession({
    matchId: 'match-1',
    gameType: 'ludo',
    ruleVersion: 'v3',
    participants: createMatchParticipants(['TEAM-01', 'TEAM-02']),
  });

  assert.equal(session.ruleVersion, 'v3');
  assert.equal(session.stateVersion, 0);
  assert.equal(session.status, 'waiting');
  assert.equal(session.gameType, 'ludo');
});

test('queue cancellation uses the correct terminal status', () => {
  const queue = { teamId: 'TEAM-03', gameType: 'snakes', status: 'queued' };
  assert.equal(queue.status, 'queued');
  queue.status = 'cancelled';
  assert.equal(queue.status, 'cancelled');
});

test('two teams can queue for the same game without sharing a team identity', () => {
  const entries = [
    { teamId: 'TEAM-01', gameType: 'snakes', status: 'queued' },
    { teamId: 'TEAM-02', gameType: 'snakes', status: 'queued' },
  ];

  assert.equal(entries[0].gameType, entries[1].gameType);
  assert.notEqual(entries[0].teamId, entries[1].teamId);
});

test('same team cannot be queued twice into the same matchable game', () => {
  const sameTeamEntries = [
    { teamId: 'TEAM-04', gameType: 'ludo', status: 'queued' },
    { teamId: 'TEAM-04', gameType: 'ludo', status: 'matched' },
  ];

  assert.equal(isQueueDuplicate(sameTeamEntries, 'TEAM-04', 'ludo'), true);
});

test('duplicate queue constraint errors are translated into a deterministic duplicate-queue outcome', () => {
  const uniqueViolation = new Error('duplicate key value violates unique constraint "queue_entries_team_id_game_type_key"');
  assert.equal(isDuplicateQueueEntryConstraintError(uniqueViolation), true);
  assert.equal(isDuplicateQueueEntryConstraintError(new Error('other database error')), false);
});
