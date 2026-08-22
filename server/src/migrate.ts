import { pool } from './db.js';
import { SCHEMA_SQL } from './schema.js';

/**
 * A fixed key for `pg_advisory_lock`, so that when several instances boot at
 * once — the normal case on a serverless host — only one applies the schema
 * and the others wait rather than deadlocking against each other's DDL.
 */
const MIGRATION_LOCK_KEY = 833_120_777;

/**
 * Applies the schema. Every statement is idempotent (`IF NOT EXISTS`, guarded
 * `ALTER`), so this is safe to run on every boot and on every deploy.
 */
export async function migrate(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [MIGRATION_LOCK_KEY]);
    try {
      await client.query(SCHEMA_SQL);
      // Ensure the settings singleton exists so PATCHes never hit an empty table.
      await client.query(
        `INSERT INTO site_settings (id, data) VALUES (1, '{}'::jsonb) ON CONFLICT (id) DO NOTHING`,
      );
    } finally {
      await client.query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK_KEY]);
    }
  } finally {
    client.release();
  }
}

/**
 * Runs the migration at most once per process. Serverless entry points call
 * this on every request; after the first it is a resolved promise.
 */
let readyPromise: Promise<void> | null = null;

export function ensureReady(): Promise<void> {
  if (!readyPromise) {
    readyPromise = migrate().catch((error) => {
      // Let the next request retry rather than wedging the instance forever.
      readyPromise = null;
      throw error;
    });
  }
  return readyPromise;
}
