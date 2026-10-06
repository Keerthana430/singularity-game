import { verifySessionFromToken } from '@/lib/auth/teamIdentity';
import { createRealtimeServer } from './realtime';

export function createStandaloneRealtimeServer() {
  const port = Number(process.env.REALTIME_PORT || 8081);

  return createRealtimeServer({
    host: process.env.REALTIME_HOST || '0.0.0.0',
    port,
    authResolver: async (token) => {
      const result = await verifySessionFromToken(token);
      if (!result.ok) {
        return { ok: false, error: result.error };
      }

      return {
        ok: true,
        identity: {
          id: result.identity.id,
          teamId: result.identity.teamId,
          sessionId: result.identity.sessionId,
          teamCode: result.identity.teamCode,
          displayName: result.identity.displayName,
          role: result.identity.role,
          isAdmin: result.identity.isAdmin,
          expiresAt: result.identity.expiresAt,
        },
      };
    },
    matchSessions: new Map(),
  });
}

if (require.main === module) {
  const server = createStandaloneRealtimeServer();

  void server.listen().then((port) => {
    console.log(`[realtime] listening on ws://0.0.0.0:${port}`);
  }).catch((error: unknown) => {
    console.error('[realtime] failed to start', error);
    process.exit(1);
  });
}
