import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TEAM_CODES,
  createSalt,
  createSessionToken,
  getDefaultTeamCredentials,
  hashPassword,
  normalizeUsername,
  sanitizeDisplayName,
  validateTeamImpersonation,
  verifySessionToken,
} from './teamIdentity';

test('TEAM_CODES contains exactly 50 team identities in order', () => {
  assert.equal(TEAM_CODES.length, 50);
  assert.deepEqual(TEAM_CODES[0], 'TEAM-01');
  assert.deepEqual(TEAM_CODES[49], 'TEAM-50');
  assert.equal(new Set(TEAM_CODES).size, TEAM_CODES.length);
});

test('Team credentials are normalized and retain no plaintext leak in the logic', () => {
  const creds = getDefaultTeamCredentials('TEAM-01');
  assert.equal(creds.username, 'team-01');
  assert.equal(creds.teamName, 'TEAM-01');
  assert.notEqual(creds.password, '');
  assert.equal(typeof creds.password, 'string');
});

test('Password hashing is salted and not reversible from plaintext', () => {
  const saltA = createSalt();
  const saltB = createSalt();
  const hashA = hashPassword('StrongPassword123', saltA);
  const hashB = hashPassword('StrongPassword123', saltB);

  assert.notEqual(hashA, 'StrongPassword123');
  assert.notEqual(hashA, hashB);
  assert.equal(hashA, hashPassword('StrongPassword123', saltA));
});

test('Session tokens round-trip and expire correctly', () => {
  const now = Math.floor(Date.now() / 1000);
  const token = createSessionToken({ teamId: 'team-123', role: 'team', sessionId: 'sess-abc', exp: now + 60 });
  const payload = verifySessionToken(token);

  assert.ok(payload);
  assert.equal(String(payload?.teamId), 'team-123');
  assert.equal(String(payload?.role), 'team');

  const expiredToken = createSessionToken({ teamId: 'team-123', role: 'team', sessionId: 'sess-expired', exp: now - 60 });
  const expiredPayload = verifySessionToken(expiredToken);
  assert.equal(expiredPayload, null);
});

test('Team identity validation rejects impersonation attempts', async () => {
  const validToken = createSessionToken({ teamId: 'TEAM-01', role: 'team', sessionId: 'session-1', exp: Math.floor(Date.now() / 1000) + 600 });

  const sameTeam = await validateTeamImpersonation('TEAM-01', validToken);
  assert.equal(sameTeam.ok, true);
  assert.equal(sameTeam.teamId, 'TEAM-01');

  const wrongTeam = await validateTeamImpersonation('TEAM-02', validToken);
  assert.equal(wrongTeam.ok, false);
  if (wrongTeam.ok === false) {
    assert.match(wrongTeam.error || '', /does not match the authenticated session/i);
  }
});

test('Username normalization and display sanitization keep identity safe', () => {
  assert.equal(normalizeUsername(' Team-01 '), 'team-01');
  assert.equal(sanitizeDisplayName('<script>bad</script> Team 01', 'fallback'), 'Team 01');
  assert.equal(sanitizeDisplayName('   ', 'fallback'), 'fallback');
});
