import { NextResponse } from 'next/server';
import { getTokenFromRequest, validateTeamImpersonation, verifySessionFromToken } from '@/lib/auth/teamIdentity';
import { cancelQueueEntry, cleanupStaleQueueEntries, enqueueTeamForGame } from '@/lib/multiplayer/queue';
import { createMatchFromQueue, isValidRuleVersion } from '@/lib/multiplayer/matchmaker';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, gameType, ruleVersion, teamId, queueMetadata } = body;
    const sessionToken = getTokenFromRequest(request, body?.token || body?.sessionToken);

    if (!sessionToken) {
      return NextResponse.json({ success: false, error: 'No authenticated session token provided.' }, { status: 401 });
    }

    const impersonationCheck = await validateTeamImpersonation(teamId, sessionToken);
    if (!impersonationCheck.ok) {
      return NextResponse.json({ success: false, error: impersonationCheck.error }, { status: 401 });
    }

    const verified = await verifySessionFromToken(sessionToken);
    if (!verified.ok) {
      return NextResponse.json({ success: false, error: verified.error }, { status: 401 });
    }

    const sessionIdentity = verified.identity;
    if (sessionIdentity.role === 'admin') {
      return NextResponse.json({ success: false, error: 'Admin sessions cannot join team queue matchmaking.' }, { status: 403 });
    }

    if (action === 'join-queue') {
      const result = await enqueueTeamForGame({
        sessionToken,
        gameType: String(gameType || ''),
        queueMetadata: queueMetadata ?? {},
      });

      if (!result.ok) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, queueEntry: result.queueEntry, duplicate: Boolean(result.duplicate) });
    }

    if (action === 'cancel-queue') {
      const result = await cancelQueueEntry({ sessionToken, gameType: String(gameType || '') });
      if (!result.ok) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, queueEntry: result.queueEntry });
    }

    if (action === 'matchmake') {
      if (!gameType || !isValidRuleVersion(String(ruleVersion || ''))) {
        return NextResponse.json({ success: false, error: 'A valid gameType and ruleVersion are required.' }, { status: 400 });
      }

      const result = await createMatchFromQueue({
        gameType: String(gameType),
        ruleVersion: String(ruleVersion),
      });

      if (!result.ok) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, result });
    }

    if (action === 'cleanup-stale') {
      const result = await cleanupStaleQueueEntries(String(gameType || ''));
      if (!result.ok) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, staleEntries: result.staleEntries });
    }

    return NextResponse.json({ success: false, error: 'Unsupported multiplayer action.' }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: 'Server error while processing multiplayer action.' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    endpoint: '/api/multiplayer',
    actions: ['join-queue', 'cancel-queue', 'matchmake', 'cleanup-stale'],
  });
}
