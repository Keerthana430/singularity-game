import crypto from 'crypto';
import { withDatabase } from '@/lib/db/postgres';

export type TeamIdentityRole = 'team' | 'admin';

export interface TeamAccountRecord {
  id: string;
  teamCode: string;
  teamName: string;
  status: string;
  role: TeamIdentityRole;
  username: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
}

export interface TeamSessionRecord {
  id: string;
  teamId: string;
  role: TeamIdentityRole;
  token: string;
  expiresAt: number;
  sessionId: string;
}

export interface AuthenticatedIdentity {
  id: string;
  teamId: string;
  teamCode: string;
  teamName: string;
  username: string;
  displayName: string;
  role: TeamIdentityRole;
  isAdmin: boolean;
  sessionId: string;
  expiresAt: number;
}

export const TEAM_CODES = Array.from({ length: 50 }, (_, index) => {
  const number = index + 1;
  return `TEAM-${String(number).padStart(2, '0')}`;
});

const SESSION_SECRET = process.env.SESSION_SECRET || 'dev_session_secret_change_me';

function base64url(value: Buffer | string) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=+$/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function hashPassword(password: string, salt: string) {
  return crypto.pbkdf2Sync(password, salt, 100_000, 64, 'sha512').toString('hex');
}

export function createSalt() {
  return crypto.randomBytes(16).toString('hex');
}

export function createSessionToken(payload: Record<string, unknown>) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=+$/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string): Record<string, unknown> | null {
  if (!token || typeof token !== 'string') return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const expected = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64')
      .replace(/=+$/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    if (expected !== signature) return null;

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Record<string, unknown>;
    if (typeof decoded.exp === 'number' && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: Request, tokenOverride?: string) {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookieMatch = cookieHeader.match(/(?:^|; )sg_session=([^;]+)/);
  return cookieMatch ? cookieMatch[1] : tokenOverride || null;
}

export function normalizeUsername(value: string) {
  return String(value || '').trim().toLowerCase();
}

export function sanitizeDisplayName(value: string, fallback: string) {
  const safe = String(value || '')
    .replace(/<script\b[^>]*>.*?<\/script>/gi, ' ')
    .replace(/<\/?[a-z0-9]+(?:\s[^>]*)?>/gi, ' ')
    .replace(/&lt;|&gt;|&amp;|&quot;|&#39;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 30);

  return safe || fallback;
}

export function getDefaultTeamCredentials(code: string) {
  const configured = process.env.TEAM_DEFAULT_PASSWORD || process.env.TEAM_PROVISION_PASSWORD || 'SingularityTeam';
  const username = code.toLowerCase();
  const password = configured;

  return {
    username,
    password,
    teamName: code,
  };
}

export async function ensureProvisionedTeamAccounts() {
  if (!process.env.DATABASE_URL) {
    return {
      success: false,
      created: 0,
      skipped: 0,
      error: 'DATABASE_URL is not configured.',
    };
  }

  const created: string[] = [];
  const skipped: string[] = [];

  for (const code of TEAM_CODES) {
    const credentials = getDefaultTeamCredentials(code);
    const result = await withDatabase(async (client) => {
      const teamRow = await client.query(
        `
        INSERT INTO teams (team_code, team_name, status, role, metadata)
        VALUES ($1, $2, 'active', 'team', $3::jsonb)
        ON CONFLICT (team_code) DO NOTHING
        RETURNING id, team_code
        `,
        [code, credentials.teamName, { source: 'provisioned', teamType: 'team' }]
      );

      const teamId = teamRow.rows[0]?.id;
      if (!teamId) {
        const existing = await client.query('SELECT id FROM teams WHERE team_code = $1', [code]);
        if (existing.rows[0]) {
          return { created: false, teamId: existing.rows[0].id, code };
        }
        return { created: false, teamId: null, code };
      }

      const salt = createSalt();
      const passwordHash = hashPassword(credentials.password, salt);

      await client.query(
        `
        INSERT INTO team_credentials (team_id, username, password_hash, password_salt, credential_version, role)
        VALUES ($1, $2, $3, $4, 1, 'team')
        ON CONFLICT (username) DO UPDATE SET
          team_id = EXCLUDED.team_id,
          password_hash = EXCLUDED.password_hash,
          password_salt = EXCLUDED.password_salt,
          credential_version = team_credentials.credential_version + 1,
          updated_at = NOW()
        `,
        [teamId, credentials.username, passwordHash, salt]
      );

      return { created: true, teamId, code };
    });

    if (!result.ok) {
      return {
        success: false,
        created: 0,
        skipped: 0,
        error: result.error,
      };
    }

    if (result.data.created) {
      created.push(code);
    } else {
      skipped.push(code);
    }
  }

  return {
    success: true,
    created: created.length,
    skipped: skipped.length,
    createdCodes: created,
    skippedCodes: skipped,
  };
}

export async function registerTeamAccount(input: {
  username: string;
  password: string;
  teamName?: string;
  code?: string;
}): Promise<
  | { ok: true; teamId: string; teamCode: string; username: string; teamName: string }
  | { ok: false; error: string }
> {
  const username = normalizeUsername(input.username);
  const password = String(input.password || '').trim();
  const teamCode = String(input.code || '').trim() || `TEAM-${Date.now().toString(36).slice(-6).toUpperCase()}`;

  if (!username || username.length < 3 || password.length < 6) {
    return { ok: false, error: 'Username must be at least 3 characters and password at least 6 characters.' };
  }

  const result = await withDatabase(async (client) => {
    const existing = await client.query(
      'SELECT id FROM teams WHERE team_code = $1 OR id IN (SELECT team_id FROM team_credentials WHERE username = $2)',
      [teamCode, username]
    );

    if (existing.rows[0]) {
      return { ok: false, error: 'Team or username already exists.' as const };
    }

    const teamInsert = await client.query(
      `
      INSERT INTO teams (team_code, team_name, status, role, metadata)
      VALUES ($1, $2, 'active', 'team', $3::jsonb)
      RETURNING id, team_code, team_name
      `,
      [teamCode, input.teamName || teamCode, { source: 'manual-register', role: 'team' }]
    );

    const team = teamInsert.rows[0];
    const salt = createSalt();
    const passwordHash = hashPassword(password, salt);

    const credentialInsert = await client.query(
      `
      INSERT INTO team_credentials (team_id, username, password_hash, password_salt, credential_version, role)
      VALUES ($1, $2, $3, $4, 1, 'team')
      RETURNING team_id, username
      `,
      [team.id, username, passwordHash, salt]
    );

    return {
      ok: true as const,
      teamId: team.id,
      teamCode,
      username: credentialInsert.rows[0]?.username || username,
      teamName: team.team_name,
    };
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  if (!result.data.ok) {
    return { ok: false, error: result.data.error };
  }

  return {
    ok: true,
    teamId: result.data.teamId || '',
    teamCode: result.data.teamCode || '',
    username: result.data.username || '',
    teamName: result.data.teamName || '',
  };
}

export async function authenticateTeamCredentials(
  username: string,
  password: string
): Promise<
  | { ok: true; team: TeamAccountRecord }
  | { ok: false; error: string }
> {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername || !password) {
    return { ok: false, error: 'Missing username or password.' };
  }

  const result = await withDatabase(async (client) => {
    const accountRow = await client.query(
      `
      SELECT c.team_id, c.username, c.password_hash, c.password_salt, c.role,
             t.id AS team_id_raw, t.team_code, t.team_name, t.status, t.role AS team_role,
             t.created_at, t.updated_at, t.last_login_at
      FROM team_credentials c
      INNER JOIN teams t ON t.id = c.team_id
      WHERE LOWER(c.username) = LOWER($1)
      LIMIT 1
      `,
      [normalizedUsername]
    );

    if (!accountRow.rows[0]) {
      return { ok: false, error: 'Invalid username or password.' } as const;
    }

    const account = accountRow.rows[0];
    const computedHash = hashPassword(String(password), account.password_salt);
    if (computedHash !== account.password_hash) {
      return { ok: false, error: 'Invalid username or password.' } as const;
    }

    return {
      ok: true as const,
      team: {
        id: account.team_id_raw,
        teamCode: account.team_code,
        teamName: account.team_name,
        status: account.status,
        role: (account.team_role || account.role || 'team') as TeamIdentityRole,
        username: account.username,
        displayName: account.team_name,
        createdAt: account.created_at,
        updatedAt: account.updated_at,
        lastLoginAt: account.last_login_at,
      },
    };
  });

  return result.ok ? result.data : { ok: false, error: result.error };
}

export async function createPersistentSessionForTeam(
  teamId: string,
  role: TeamIdentityRole = 'team'
): Promise<
  | { ok: true; token: string; sessionId: string; expiresAt: number; teamId: string; role: TeamIdentityRole }
  | { ok: false, error: string }
> {
  const sessionId = crypto.randomUUID();
  const expiresAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
  const token = createSessionToken({ teamId, role, sessionId, exp: expiresAt });

  const result = await withDatabase(async (client) => {
    const insertResult = await client.query(
      `
      INSERT INTO team_sessions (id, team_id, session_token_hash, role, issued_at, expires_at, revoked_at, last_seen_at, client_metadata)
      VALUES ($1, $2, $3, $4, NOW(), NOW() + INTERVAL '24 hours', NULL, NOW(), $5::jsonb)
      RETURNING id, team_id, role, expires_at
      `,
      [sessionId, teamId, crypto.createHash('sha256').update(token).digest('hex'), role, { sessionId, role }]
    );

    const row = insertResult.rows[0];
    return {
      ok: true as const,
      token,
      sessionId: row?.id || sessionId,
      expiresAt: row ? new Date(row.expires_at).getTime() / 1000 : expiresAt,
      teamId,
      role,
    };
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return result.data;
}

export async function verifySessionFromToken(token: string): Promise<{ ok: true; identity: AuthenticatedIdentity } | { ok: false; error: string } | { ok: false; error: string; expired: true }> {
  const payload = verifySessionToken(token);
  if (!payload) {
    return { ok: false, error: 'Invalid or expired session token.', expired: true };
  }

  const teamId = String(payload.teamId || payload.id || '');
  const sessionId = String(payload.sessionId || '');
  const role = (payload.role as TeamIdentityRole) || 'team';
  const expiresAt = Number(payload.exp || 0) * 1000;

  if (!teamId || !sessionId || !expiresAt) {
    return { ok: false, error: 'Session payload is incomplete.' };
  }

  const result = await withDatabase(async (client) => {
    const sessionRow = await client.query(
      `
      SELECT s.id, s.team_id, s.role, s.expires_at, s.revoked_at,
             t.team_code, t.team_name, t.status, t.role AS team_role,
             c.username
      FROM team_sessions s
      INNER JOIN teams t ON t.id = s.team_id
      LEFT JOIN team_credentials c ON c.team_id = t.id
      WHERE s.id = $1 AND s.team_id = $2 AND s.role = $3
      LIMIT 1
      `,
      [sessionId, teamId, role]
    );

    if (!sessionRow.rows[0]) {
      return { ok: false, error: 'Session does not exist or no longer matches this team.' } as const;
    }

    const session = sessionRow.rows[0];
    if (session.revoked_at || new Date(session.expires_at).getTime() <= Date.now()) {
      return { ok: false, error: 'Session has expired or been revoked.', expired: true } as const;
    }

    const identity: AuthenticatedIdentity = {
      id: session.id,
      teamId: session.team_id,
      teamCode: session.team_code,
      teamName: session.team_name,
      username: session.username || session.team_code,
      displayName: session.team_name,
      role: (session.role || session.team_role || 'team') as TeamIdentityRole,
      isAdmin: (session.role || session.team_role) === 'admin',
      sessionId: session.id,
      expiresAt: new Date(session.expires_at).getTime(),
    };

    return { ok: true as const, identity };
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return result.data;
}

export async function revokeSessionToken(token: string) {
  if (!token) {
    return { ok: false, error: 'No session token supplied.' };
  }

  const payload = verifySessionToken(token);
  if (!payload) {
    return { ok: false, error: 'Session token is invalid.' };
  }

  const sessionId = String(payload.sessionId || '');
  const teamId = String(payload.teamId || '');
  if (!sessionId || !teamId) {
    return { ok: false, error: 'Session payload is incomplete.' };
  }

  const result = await withDatabase(async (client) => {
    await client.query(
      'UPDATE team_sessions SET revoked_at = NOW(), expires_at = NOW() WHERE id = $1 AND team_id = $2',
      [sessionId, teamId]
    );
    return { ok: true as const };
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return result.data;
}

export async function authenticateAdmin(username: string, password: string) {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername || !password) {
    return { ok: false, error: 'Missing admin username or password.' };
  }

  const result = await withDatabase(async (client) => {
    const adminRow = await client.query(
      `
      SELECT id, username, password_hash, password_salt, role, status, created_at, updated_at
      FROM platform_admins
      WHERE LOWER(username) = LOWER($1)
      LIMIT 1
      `,
      [normalizedUsername]
    );

    if (!adminRow.rows[0]) {
      return { ok: false, error: 'Admin credentials are invalid.' } as const;
    }

    const admin = adminRow.rows[0];
    const computedHash = hashPassword(String(password), admin.password_salt);
    if (computedHash !== admin.password_hash) {
      return { ok: false, error: 'Admin credentials are invalid.' } as const;
    }

    return {
      ok: true as const,
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
        status: admin.status,
        createdAt: admin.created_at,
        updatedAt: admin.updated_at,
      },
    };
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return result.data;
}

export async function createAdminSession(adminId: string) {
  const sessionId = crypto.randomUUID();
  const expiresAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
  const token = createSessionToken({ teamId: adminId, role: 'admin', sessionId, exp: expiresAt });

  const result = await withDatabase(async (client) => {
    const insertResult = await client.query(
      `
      INSERT INTO team_sessions (id, team_id, session_token_hash, role, issued_at, expires_at, revoked_at, last_seen_at, client_metadata)
      VALUES ($1, $2, $3, 'admin', NOW(), NOW() + INTERVAL '24 hours', NULL, NOW(), $4::jsonb)
      RETURNING id, team_id, role, expires_at
      `,
      [sessionId, adminId, crypto.createHash('sha256').update(token).digest('hex'), { sessionId, role: 'admin' }]
    );

    const row = insertResult.rows[0];
    return { ok: true as const, token, sessionId: row?.id || sessionId, expiresAt: row ? new Date(row.expires_at).getTime() / 1000 : expiresAt, role: 'admin' };
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return result.data;
}

export async function validateTeamImpersonation(candidateTeamId: string | undefined, sessionToken: string | undefined) {
  if (!sessionToken) {
    return { ok: false, error: 'No active session.' };
  }

  const tokenInfo = verifySessionToken(sessionToken);
  if (!tokenInfo) {
    return { ok: false, error: 'Session token is invalid.' };
  }

  const actualTeamId = String(tokenInfo.teamId || '');
  if (candidateTeamId && candidateTeamId !== actualTeamId) {
    return { ok: false, error: 'Client provided team identity does not match the authenticated session.' };
  }

  return { ok: true, teamId: actualTeamId };
}

export async function resolveAuthenticatedTeamFromRequest(request: Request, providedToken?: string) {
  const token = getTokenFromRequest(request, providedToken) || undefined;
  if (!token) {
    return { ok: false, error: 'No session token provided.' };
  }

  const verification = await verifySessionFromToken(token);
  if (!verification.ok) {
    return { ok: false, error: verification.error };
  }

  return { ok: true, identity: verification.identity };
}
