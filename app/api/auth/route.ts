import { NextResponse } from 'next/server';

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

// Simple session tokens (in production, use JWT or proper session management)
const activeSessions = new Map<string, { teamId: string; expiresAt: number }>();

function generateToken(): string {
  return `sg_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
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

      const team = TEAM_ACCOUNTS.find(
        (t) => t.username.toLowerCase() === safeUser && t.password === safePwd
      );

      if (!team) {
        return NextResponse.json(
          { success: false, error: 'Invalid team credentials. Contact the organizer.' },
          { status: 401 }
        );
      }

      // Revoke any existing sessions for this team
      for (const [tok, session] of activeSessions.entries()) {
        if (session.teamId === team.teamId) {
          activeSessions.delete(tok);
        }
      }

      // Create new session (24-hour expiry)
      const sessionToken = generateToken();
      activeSessions.set(sessionToken, {
        teamId: team.teamId,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      });

      return NextResponse.json({
        success: true,
        token: sessionToken,
        team: {
          teamId: team.teamId,
          displayName: team.displayName,
          username: team.username,
        },
      });
    }

    // ─── VERIFY SESSION ───────────────────────────────────────────
    if (action === 'verify') {
      if (!token) {
        return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401 });
      }

      const session = activeSessions.get(token);
      if (!session || session.expiresAt < Date.now()) {
        if (session) activeSessions.delete(token);
        return NextResponse.json({ success: false, error: 'Session expired' }, { status: 401 });
      }

      const team = TEAM_ACCOUNTS.find((t) => t.teamId === session.teamId);
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
      if (!token) {
        return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
      }

      const session = activeSessions.get(token);
      if (!session || session.expiresAt < Date.now()) {
        if (session) activeSessions.delete(token);
        return NextResponse.json({ success: false, error: 'Session expired' }, { status: 401 });
      }

      if (!displayName || typeof displayName !== 'string' || displayName.trim().length < 2) {
        return NextResponse.json(
          { success: false, error: 'Team name must be at least 2 characters' },
          { status: 400 }
        );
      }

      const safeName = displayName.replace(/<[^>]*>/g, '').trim().slice(0, 30);
      const team = TEAM_ACCOUNTS.find((t) => t.teamId === session.teamId);
      if (!team) {
        return NextResponse.json({ success: false, error: 'Team not found' }, { status: 404 });
      }

      // Check if name is already taken by another team
      const nameTaken = TEAM_ACCOUNTS.some(
        (t) => t.teamId !== session.teamId && t.displayName.toLowerCase() === safeName.toLowerCase()
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
      if (token) {
        activeSessions.delete(token);
      }
      return NextResponse.json({ success: true, message: 'Logged out' });
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
