import test from 'node:test';
import assert from 'node:assert/strict';
import { testDatabaseConnection } from '@/lib/db/postgres';

const hasDb = !!process.env.DATABASE_URL;

test('PostgreSQL integration smoke test', { skip: !hasDb }, async () => {
  const result = await testDatabaseConnection();
  if (!result.ok) {
    throw new Error(result.error || 'PostgreSQL connection failed');
  }

  assert.ok(result.data.now);
});
