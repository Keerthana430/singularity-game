import test from 'node:test';
import assert from 'node:assert/strict';
import { testDatabaseConnection, closePostgresPool } from '@/lib/db/postgres';

const hasDb = !!process.env.DATABASE_URL;

test('PostgreSQL integration smoke test', { skip: !hasDb }, async () => {
  const result = await testDatabaseConnection();
  if (!result.ok) {
    throw new Error(result.error || 'PostgreSQL connection failed');
  }

  assert.ok(result.data.now);
});

test.after(async () => {
  await closePostgresPool();
});
