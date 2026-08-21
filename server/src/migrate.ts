import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

/**
 * Applies the schema. Every statement is idempotent (`IF NOT EXISTS`), so this
 * is safe to run on every boot and on every deploy.
 */
export async function migrate(): Promise<void> {
  const sql = readSchema();
  const client = await pool.connect();
  try {
    await client.query(sql);
    // Ensure the settings singleton exists so PATCHes never hit an empty table.
    await client.query(
      `INSERT INTO site_settings (id, data) VALUES (1, '{}'::jsonb) ON CONFLICT (id) DO NOTHING`,
    );
  } finally {
    client.release();
  }
}

function readSchema(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.join(here, 'schema.sql'),
    path.join(here, '..', 'schema.sql'),
    path.join(process.cwd(), 'server', 'src', 'schema.sql'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return fs.readFileSync(candidate, 'utf8');
  }
  throw new Error('[noafar] فایل schema.sql پیدا نشد.');
}
