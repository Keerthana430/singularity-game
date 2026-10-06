import { NextResponse } from 'next/server';
import {
  authenticateTeamCredentials,
  createPersistentSessionForTeam,
  getTokenFromRequest,
  normalizeUsername,
  registerTeamAccount,
  resolveAuthenticatedTeamFromRequest,
  revokeSessionToken,
  sanitizeDisplayName,
  validateTeamImpersonation,
  verifySessionFromToken,
} from '@/lib/auth/teamIdentity';

function buildPublicTeam(identity: {
  teamId: string;
  teamCode?: string;
  teamName?: string;
  username?: string;
  displayName?: string;
}) {
  return {
    teamId: identity.teamId,
    teamCode: identity.teamCode || identity.teamId,
    displayName: identity.displayName || identity.teamName || identity.username || identity.teamId,
    username: identity.username || identity.teamCode || identity.teamId,
    gold: 0,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, username, password, token, displayName, teamId } = body;

    if (action === 'register') {
      if (!username || !password) {
        return NextResponse.json({ success: false, error: 'Username and password are required' }, { status: 400 });
      }

      const safeUsername = normalizeUsername(String(username));
      const safePassword = String(password).trim();
      if (safeUsername.length < 3 || safePassword.length < 6) {
        return NextResponse.json({ success: false, error: 'Username must be at least 3 characters and password at least 6 characters' }, { status: 400 });
      }

      const registration = await registerTeamAccount({
        username: safeUsername,
        password: safePassword,
        teamName: sanitizeDisplayName(String(displayName || safeUsername), safeUsername),
      });

      if (!registration.ok) {
        return NextResponse.json({ success: false, error: registration.error }, { status: registration.error?.includes('already exists') ? 409 : 400 });
      }

      const session = await createPersistentSessionForTeam(registration.teamId, 'team');
      if (!session.ok) {
        return NextResponse.json({ success: false, error: session.error }, { status: 500 });
      }

      const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
      const cookie = `sg_session=${session.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${24 * 60 * 60}${secureFlag}`;
      const response = NextResponse.json({
        success: true,
        team: buildPublicTeam({
          teamId: registration.teamId,
          teamCode: registration.teamCode,
          teamName: registration.teamName,
          username: registration.username,
          displayName: registration.teamName,
        }),
      });
      response.headers.set('Set-Cookie', cookie);
      return response;
    }

    if (action === 'login') {
      if (!username || !password) {
        return NextResponse.json({ success: false, error: 'Username and password are required' }, { status: 400 });
      }

      const account = await authenticateTeamCredentials(String(username), String(password));
      if (!account.ok) {
        return NextResponse.json({ success: false, error: account.error }, { status: 401 });
      }

      const session = await createPersistentSessionForTeam(account.team.id, account.team.role || 'team');
      if (!session.ok) {
        return NextResponse.json({ success: false, error: session.error }, { status: 500 });
      }

      const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
      const cookie = `sg_session=${session.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${24 * 60 * 60}${secureFlag}`;
      const response = NextResponse.json({
        success: true,
        team: buildPublicTeam({
          teamId: account.team.id,
          teamCode: account.team.teamCode,
          teamName: account.team.teamName,
          username: account.team.username,
          displayName: account.team.displayName,
        }),
      });
      response.headers.set('Set-Cookie', cookie);
      return response;
    }

    if (action === 'verify') {
      const providedToken = getTokenFromRequest(request, token);
      if (!providedToken) {
        return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401 });
      }

      const impersonationCheck = await validateTeamImpersonation(String(teamId || ''), providedToken);
      if (!impersonationCheck.ok) {
        return NextResponse.json({ success: false, error: impersonationCheck.error }, { status: 401 });
      }

      const verified = await resolveAuthenticatedTeamFromRequest(request, providedToken);
      if (!verified.ok) {
        return NextResponse.json({ success: false, error: verified.error }, { status: verified.error?.includes('expired') || verified.error?.includes('Invalid') ? 401 : 403 });
      }

      const identity = verified.identity;
      if (!identity) {
        return NextResponse.json({ success: false, error: 'Session identity is missing' }, { status: 401 });
      }

      return NextResponse.json({
        success: true,
        team: buildPublicTeam({
          teamId: identity.teamId,
          teamCode: identity.teamCode,
          teamName: identity.teamName,
          username: identity.username,
          displayName: identity.displayName,
        }),
      });
    }

    if (action === 'logout') {
      const providedToken = getTokenFromRequest(request, token);
      if (providedToken) {
        const revoked = await revokeSessionToken(providedToken);
        if (!revoked.ok && !revoked.error?.includes('invalid')) {
          // Continue with the logout response even when the DB-backed session is already stale.
        }
      }

      const response = NextResponse.json({ success: true, message: 'Logged out' });
      const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
      response.headers.set('Set-Cookie', `sg_session=deleted; Path=/; HttpOnly; Max-Age=0; SameSite=Strict${secureFlag}`);
      return response;
    }

    if (action === 'rename') {
      const providedToken = getTokenFromRequest(request, token);
      if (!providedToken) {
        return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401 });
      }

      const impersonationCheck = await validateTeamImpersonation(String(teamId || ''), providedToken);
      if (!impersonationCheck.ok) {
        return NextResponse.json({ success: false, error: impersonationCheck.error }, { status: 401 });
      }

      const verified = await verifySessionFromToken(providedToken);
      if (!verified.ok || !('identity' in verified)) {
        return NextResponse.json({ success: false, error: verified.error }, { status: 401 });
      }

      if (!displayName || typeof displayName !== 'string' || displayName.trim().length < 2) {
        return NextResponse.json({ success: false, error: 'Display name must be at least 2 characters' }, { status: 400 });
      }

      const safeDisplay = sanitizeDisplayName(displayName, verified.identity.teamName);
      return NextResponse.json({
        success: true,
        message: 'Display name updated',
        team: buildPublicTeam({
          teamId: verified.identity.teamId,
          teamCode: verified.identity.teamCode,
          teamName: verified.identity.teamName,
          username: verified.identity.username,
          displayName: safeDisplay,
        }),
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    users: [],
    note: 'Team metadata is sourced from the PostgreSQL-backed identity layer.',
  });
}
