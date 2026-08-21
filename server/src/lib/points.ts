import type { PoolClient } from 'pg';
import { pool } from '../db.js';

export type PointReason =
  | 'like'
  | 'comment'
  | 'bookmark'
  | 'share'
  | 'submit_idea'
  | 'submit_experience'
  | 'complete_profile'
  | 'complete_course'
  | 'first_canvas';

/** Server-side source of truth; the client can never choose its own amount. */
export const POINT_VALUES: Record<PointReason, number> = {
  like: 5,
  comment: 15,
  bookmark: 5,
  share: 10,
  submit_idea: 50,
  submit_experience: 100,
  complete_profile: 20,
  complete_course: 40,
  first_canvas: 30,
};

interface AwardOptions {
  userId: string;
  reason: PointReason | string;
  reasonFa: string;
  points: number;
  /** When set, the same key is only ever awarded once per user. */
  dedupeKey?: string;
  client?: PoolClient;
}

/**
 * Records a point transaction and keeps `users.points` in step. Returns false
 * when the award was skipped because `dedupeKey` had already been granted.
 */
export async function awardPoints(options: AwardOptions): Promise<boolean> {
  const { userId, reason, reasonFa, points, dedupeKey, client } = options;
  if (!Number.isFinite(points) || points === 0) return false;

  const run = client ?? pool;
  const inserted = await run.query(
    `INSERT INTO point_transactions (user_id, reason, reason_fa, points, dedupe_key)
          VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING
       RETURNING id`,
    [userId, reason, reasonFa, Math.trunc(points), dedupeKey ?? null],
  );

  if (inserted.rowCount === 0) return false;

  await run.query(
    `UPDATE users SET points = GREATEST(0, points + $2), updated_at = now() WHERE id = $1`,
    [userId, Math.trunc(points)],
  );
  return true;
}
