import { Pool, PoolClient } from 'pg';

export type DatabaseResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const connectionString = process.env.DATABASE_URL;

export const pgPool = connectionString
  ? new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      ssl:
        process.env.NODE_ENV === 'production' && process.env.DATABASE_SSL === 'true'
          ? { rejectUnauthorized: false }
          : undefined,
    })
  : null;

export async function withDatabase<T>(handler: (client: PoolClient) => Promise<T>): Promise<DatabaseResult<T>> {
  if (!pgPool) {
    return { ok: false, error: 'DATABASE_URL is not configured.' };
  }

  const client = await pgPool.connect();

  try {
    const data = await handler(client);
    return { ok: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    return { ok: false, error: message };
  } finally {
    client.release();
  }
}

export async function testDatabaseConnection(): Promise<DatabaseResult<{ now: string }>> {
  const result = await withDatabase(async (client) => {
    const res = await client.query('SELECT NOW() as now');
    return res.rows[0] as { now: string };
  });

  return result;
}

export async function closePostgresPool(): Promise<void> {
  if (pgPool) {
    await pgPool.end();
  }
}
