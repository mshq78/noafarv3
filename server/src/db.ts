import pg from 'pg';
import { env } from './env.js';

const { Pool, types } = pg;

// Return NUMERIC as a JS number instead of a string — every numeric column in
// this schema is a small counter, so precision loss is not a concern.
types.setTypeParser(1700, (value) => (value === null ? null : Number(value)));
// Keep BIGINT (int8) as a number as well; ids that use it are sequence counters.
types.setTypeParser(20, (value) => (value === null ? null : Number(value)));

export const pool = new Pool({
  connectionString: env.databaseUrl || undefined,
  max: env.databasePoolMax,
  ssl: env.databaseSsl ? { rejectUnauthorized: false } : undefined,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('[noafar][db] خطای غیرمنتظره در اتصال استخر پایگاه‌داده:', err.message);
});

export type QueryParam = unknown;

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: QueryParam[] = [],
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params as never[]);
}

export async function queryRows<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: QueryParam[] = [],
): Promise<T[]> {
  const result = await query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: QueryParam[] = [],
): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows[0] ?? null;
}

/** Runs `fn` inside a transaction, rolling back on any thrown error. */
export async function transaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // The connection is already broken; the pool will discard it.
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
}
