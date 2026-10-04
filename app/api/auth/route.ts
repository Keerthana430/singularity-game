import { NextResponse } from 'next/server';
import crypto from 'crypto';

// ─── Pre-defined Team Credentials ─────────────────────────────────────────────
// Admin distributes these to each team. Teams can change their display name
// after login, but their login ID remains fixed.

export interface TeamAccount {
  teamId: string;       // Immutable login identifier
  username: string;     // Login username
  password: string;     // Login password
  displayName: string;  // Changeable team display name
}

// In-memory team registry (in production, this would be a database)
const TEAM_ACCOUNTS: TeamAccount[] = [
  { teamId: 'team-alpha',   username: 'alpha',   password: 'singularity2026A', displayName: 'Team Alpha' },
  { teamId: 'team-bravo',   username: 'bravo',   password: 'singularity2026B', displayName: 'Team Bravo' },
  { teamId: 'team-charlie', username: 'charlie', password: 'singularity2026C', displayName: 'Team Charlie' },
  { teamId: 'team-delta',   username: 'delta',   password: 'singularity2026D', displayName: 'Team Delta' },
  { teamId: 'team-echo',    username: 'echo',    password: 'singularity2026E', displayName: 'Team Echo' },
  { teamId: 'team-foxtrot', username: 'foxtrot', password: 'singularity2026F', displayName: 'Team Foxtrot' },
  { teamId: 'team-golf',    username: 'golf',    password: 'singularity2026G', displayName: 'Team Golf' },
  { teamId: 'team-hotel',   username: 'hotel',   password: 'singularity2026H', displayName: 'Team Hotel' },
  { teamId: 'team-india',   username: 'india',   password: 'singularity2026I', displayName: 'Team India' },
  { teamId: 'team-juliet',  username: 'juliet',  password: 'singularity2026J', displayName: 'Team Juliet' },
];

// Use a signed HMAC-based token (JWT-like) stored in an HttpOnly cookie.
// This is a lightweight replacement until a real session store / DB is used.
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev_session_secret_change_me';

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function sign(payload: Record<string, any>) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = { ...payload };
  const encoded = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(body))}`;
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64');
  // base64 -> base64url
  const sigUrl = signature.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${encoded}.${sigUrl}`;
}

function verify(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const encoded = `${header}.${body}`;
    const expected = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    if (expected !== sig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64').toString());
    return payload;
  } catch (e) {
    return null;
  }
}

// POST /api/auth — Login
export async function POST(request: Request) {
  try {
    const { action, username, password, token, displayName } = await request.json();

    // ─── LOGIN ────────────────────────────────────────────────────
    if (action === 'login') {
      if (!username || !password) {
        return NextResponse.json(
          { success: false, error: 'Username and password are required' },
          { status: 400 }
        );
      }

      const safeUser = String(username).trim().toLowerCase();
      const safePwd = String(password).trim();

      // NOTE: TEAM_ACCOUNTS currently stores plaintext passwords for demo/dev.
      // In production migrate these to hashed passwords in a secure DB and remove
      // the plaintext entries from source control.
      const team = TEAM_ACCOUNTS.find((t) => t.username.toLowerCase() === safeUser && t.password === safePwd);

      if (!team) {
        return NextResponse.json(
          { success: false, error: 'Invalid team credentials. Contact the organizer.' },
          { status: 401 }
        );
      }

      // Issue signed token (valid 24 hours) and set as HttpOnly cookie.
      const expiresIn = 24 * 60 * 60; // seconds
      const payload = { teamId: team.teamId, exp: Math.floor(Date.now() / 1000) + expiresIn };
      const jwt = sign(payload);

      const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
      const cookie = `sg_session=${jwt}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${expiresIn}${secureFlag}`;

      const res = NextResponse.json({
        success: true,
        team: {
          teamId: team.teamId,
          displayName: team.displayName,
          username: team.username,
        },
      });
      res.headers.set('Set-Cookie', cookie);
      return res;
    }

    // ─── VERIFY SESSION ───────────────────────────────────────────
    if (action === 'verify') {
      // Check cookie first
      const cookieHeader = request.headers.get('cookie') || '';
      const cookieMatch = cookieHeader.match(/(?:^|; )sg_session=([^;]+)/);
      const providedToken = cookieMatch ? cookieMatch[1] : token;

      if (!providedToken) {
        return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401 });
      }

      const payload = verify(providedToken);
      if (!payload || (payload.exp && payload.exp < Math.floor(Date.now() / 1000))) {
        return NextResponse.json({ success: false, error: 'Session expired' }, { status: 401 });
      }

      const team = TEAM_ACCOUNTS.find((t) => t.teamId === payload.teamId);
      if (!team) {
        return NextResponse.json({ success: false, error: 'Team not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        team: {
          teamId: team.teamId,
          displayName: team.displayName,
          username: team.username,
        },
      });
    }

    // ─── CHANGE TEAM NAME ─────────────────────────────────────────
    if (action === 'rename') {
      // Read token from cookie if present
      const cookieHeader = request.headers.get('cookie') || '';
      const cookieMatch = cookieHeader.match(/(?:^|; )sg_session=([^;]+)/);
      const providedToken = cookieMatch ? cookieMatch[1] : token;

      const payload = providedToken ? verify(providedToken) : null;
      if (!payload || (payload.exp && payload.exp < Math.floor(Date.now() / 1000))) {
        return NextResponse.json({ success: false, error: 'Session expired' }, { status: 401 });
      }

      if (!displayName || typeof displayName !== 'string' || displayName.trim().length < 2) {
        return NextResponse.json(
          { success: false, error: 'Team name must be at least 2 characters' },
          { status: 400 }
        );
      }

      const safeName = displayName.replace(/<[^>]*>/g, '').trim().slice(0, 30);
      const team = TEAM_ACCOUNTS.find((t) => t.teamId === payload.teamId);
      if (!team) {
        return NextResponse.json({ success: false, error: 'Team not found' }, { status: 404 });
      }

      // Check if name is already taken by another team
      const nameTaken = TEAM_ACCOUNTS.some(
        (t) => t.teamId !== payload.teamId && t.displayName.toLowerCase() === safeName.toLowerCase()
      );
      if (nameTaken) {
        return NextResponse.json(
          { success: false, error: 'That team name is already taken' },
          { status: 409 }
        );
      }

      team.displayName = safeName;

      return NextResponse.json({
        success: true,
        message: 'Team name updated',
        team: {
          teamId: team.teamId,
          displayName: team.displayName,
          username: team.username,
        },
      });
    }

    // ─── LOGOUT ───────────────────────────────────────────────────
    if (action === 'logout') {
      // Clear cookie
      const res = NextResponse.json({ success: true, message: 'Logged out' });
      // Overwrite cookie with expired value
      const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
      res.headers.set('Set-Cookie', `sg_session=deleted; Path=/; HttpOnly; Max-Age=0; SameSite=Strict${secureFlag}`);
      return res;
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

// GET /api/auth — Get list of all teams (public info only, no passwords)
export async function GET() {
  return NextResponse.json({
    success: true,
    teams: TEAM_ACCOUNTS.map((t) => ({
      teamId: t.teamId,
      displayName: t.displayName,
    })),
  });
}
