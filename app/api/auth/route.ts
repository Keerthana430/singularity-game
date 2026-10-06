import { NextResponse } from 'next/server';
import crypto from 'crypto';

// ─── Account Management ────────────────────────────────────────────────
export interface AccountRecord {
  id: string;
  username: string;
  passwordHash: string;
  passwordSalt: string;
  displayName: string;
  gold: number;
  createdAt: string;
  updatedAt: string;
}

const USER_ACCOUNTS = new Map<string, AccountRecord>();
const SESSION_TOKENS = new Map<string, { userId: string; expiresAt: number }>();
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev_session_secret_change_me';
const STARTING_GOLD = 1000;

// ─── Token Utilities ─────────────────────────────────────────────────
function base64url(input: Buffer | string) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function sign(payload: Record<string, any>) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encoded = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
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
  } catch {
    return null;
  }
}

// ─── Password Utilities ───────────────────────────────────────────────
function hashPassword(password: string, salt: string) {
  return crypto.pbkdf2Sync(password, salt, 100_000, 64, 'sha512').toString('hex');
}

// ─── Account Utilities ────────────────────────────────────────────────
function sanitizeName(value: string, fallback: string) {
  const safe = value
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 30);
  return safe || fallback;
}

function publicAccount(account: AccountRecord) {
  return {
    teamId: account.id,
    displayName: account.displayName,
    username: account.username,
    gold: account.gold,
  };
}

function getAccountByUsername(username: string) {
  const key = username.trim().toLowerCase();
  return [...USER_ACCOUNTS.values()].find((account) => account.username.toLowerCase() === key) ?? null;
}

// ─── Session Utilities ─────────────────────────────────────────────────
function getTokenFromRequest(request: Request, token?: string) {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookieMatch = cookieHeader.match(/(?:^|; )sg_session=([^;]+)/);
  return cookieMatch ? cookieMatch[1] : token;
}

function createSession(userId: string) {
  const expiresIn = 24 * 60 * 60;
  const payload = { userId, exp: Math.floor(Date.now() / 1000) + expiresIn };
  const token = sign(payload);
  SESSION_TOKENS.set(token, { userId, expiresAt: payload.exp * 1000 });
  return token;
}

// ─── API Routes ───────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, username, password, token, displayName } = body;

    // ─── REGISTER ────────────────────────────────────────────────────
    if (action === 'register') {
      if (!username || !password) {
        return NextResponse.json({ success: false, error: 'Username and password are required' }, { status: 400 });
      }

      const safeUsername = String(username).trim();
      const safePassword = String(password).trim();

      if (safeUsername.length < 3 || safePassword.length < 6) {
        return NextResponse.json({ success: false, error: 'Username must be at least 3 characters and password at least 6 characters' }, { status: 400 });
      }

      const existing = getAccountByUsername(safeUsername);
      if (existing) {
        return NextResponse.json({ success: false, error: 'That username is already taken' }, { status: 409 });
      }

      const salt = crypto.randomBytes(16).toString('hex');
      const account: AccountRecord = {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        username: safeUsername,
        passwordHash: hashPassword(safePassword, salt),
        passwordSalt: salt,
        displayName: sanitizeName(String(displayName || safeUsername), safeUsername),
        gold: STARTING_GOLD,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      USER_ACCOUNTS.set(account.id, account);
      const sessionToken = createSession(account.id);
      const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
      const cookie = `sg_session=${sessionToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${24 * 60 * 60}${secureFlag}`;

      const res = NextResponse.json({ success: true, team: publicAccount(account) });
      res.headers.set('Set-Cookie', cookie);
      return res;
    }

    // ─── LOGIN ────────────────────────────────────────────────────
    if (action === 'login') {
      if (!username || !password) {
        return NextResponse.json({ success: false, error: 'Username and password are required' }, { status: 400 });
      }

      const safeUsername = String(username).trim();
      const safePassword = String(password).trim();
      const account = getAccountByUsername(safeUsername);
      if (!account) {
        return NextResponse.json({ success: false, error: 'Invalid username or password' }, { status: 401 });
      }

      const providedHash = hashPassword(safePassword, account.passwordSalt);
      if (providedHash !== account.passwordHash) {
        return NextResponse.json({ success: false, error: 'Invalid username or password' }, { status: 401 });
      }

      const sessionToken = createSession(account.id);
      const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
      const cookie = `sg_session=${sessionToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${24 * 60 * 60}${secureFlag}`;

      const res = NextResponse.json({ success: true, team: publicAccount(account) });
      res.headers.set('Set-Cookie', cookie);
      return res;
    }

    // ─── VERIFY SESSION ───────────────────────────────────────────
    if (action === 'verify') {
      const providedToken = getTokenFromRequest(request, token); 
      if (!providedToken) {
        return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401 });
      }

      const payload = verify(providedToken);
      if (!payload || (payload.exp && payload.exp < Math.floor(Date.now() / 1000))) {
        return NextResponse.json({ success: false, error: 'Session expired' }, { status: 401 });
      }

      const account = USER_ACCOUNTS.get(payload.userId || payload.teamId);
      if (!account) {
        return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, team: publicAccount(account) });
    }

    // ─── CHANGE DISPLAY NAME ─────────────────────────────────────────
    if (action === 'rename') {
      const providedToken = getTokenFromRequest(request, token);
      const payload = providedToken ? verify(providedToken) : null;
      if (!payload || (payload.exp && payload.exp < Math.floor(Date.now() / 1000))) {
        return NextResponse.json({ success: false, error: 'Session expired' }, { status: 401 });
      }

      if (!displayName || typeof displayName !== 'string' || displayName.trim().length < 2) {
        return NextResponse.json({ success: false, error: 'Display name must be at least 2 characters' }, { status: 400 });
      }

      const account = USER_ACCOUNTS.get(payload.userId || payload.teamId);
      if (!account) {
        return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
      }

      const candidateName = sanitizeName(displayName, account.username);
      const duplicate = [...USER_ACCOUNTS.values()].some(
        (person) => person.id !== account.id && person.displayName.toLowerCase() === candidateName.toLowerCase()
      );
      if (duplicate) {
        return NextResponse.json({ success: false, error: 'That display name is already taken' }, { status: 409 });
      }

      account.displayName = candidateName;
      account.updatedAt = new Date().toISOString();
      return NextResponse.json({ success: true, message: 'Display name updated', team: publicAccount(account) });
    }

    // ─── LOGOUT ───────────────────────────────────────────────────
    if (action === 'logout') {
      const res = NextResponse.json({ success: true, message: 'Logged out' });
      const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
      res.headers.set('Set-Cookie', `sg_session=deleted; Path=/; HttpOnly; Max-Age=0; SameSite=Strict${secureFlag}`);
      return res;
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// GET /api/auth — Get list of all teams (public info only, no passwords)
export async function GET() {
  return NextResponse.json({
    success: true,
    users: [...USER_ACCOUNTS.values()].map((account) => ({
      id: account.id,
      username: account.username,
      displayName: account.displayName,
      gold: account.gold,
    })),
  });
}
