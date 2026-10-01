import type { Request, RequestHandler } from 'express';
import { query, queryOne } from '../db.js';
import { tooManyRequests } from './http.js';

/**
 * Best-effort client identity for rate limiting.
 *
 * `X-Forwarded-For` is only believed when the service actually runs behind a
 * proxy. Anyone can set that header, so reading it on a directly-exposed host
 * would let a caller pick a fresh rate-limit bucket per request and walk past
 * every limit in this file. Where a proxy is configured, Express has already
 * parsed the header into `req.ip` using the trust setting, so that is what we
 * use rather than parsing it a second time.
 */
export function clientIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

interface Consumed {
  allowed: boolean;
  retryAfterSeconds: number;
}

/**
 * Atomically increments a persisted counter for `bucket`. Persisting in
 * Postgres (rather than process memory) keeps limits correct across restarts
 * and across multiple app instances behind a load balancer.
 */
export async function consume(
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<Consumed> {
  const row = await queryOne<{ hits: number; retry_after: number }>(
    `INSERT INTO rate_limits (bucket, hits, window_ends)
          VALUES ($1, 1, now() + make_interval(secs => $2))
     ON CONFLICT (bucket) DO UPDATE
            SET hits = CASE WHEN rate_limits.window_ends < now() THEN 1
                            ELSE rate_limits.hits + 1 END,
                window_ends = CASE WHEN rate_limits.window_ends < now()
                                   THEN now() + make_interval(secs => $2)
                                   ELSE rate_limits.window_ends END
      RETURNING hits,
                GREATEST(1, CEIL(EXTRACT(EPOCH FROM (window_ends - now()))))::int AS retry_after`,
    [bucket, windowSeconds],
  );

  const hits = row?.hits ?? 1;
  return { allowed: hits <= limit, retryAfterSeconds: row?.retry_after ?? windowSeconds };
}

interface LimiterOptions {
  name: string;
  limit: number;
  windowSeconds: number;
  /** Defaults to the client IP; override to key on phone, user id, etc. */
  key?: (req: Request) => string;
  message?: string;
}

export function rateLimit(options: LimiterOptions): RequestHandler {
  const { name, limit, windowSeconds, key = clientIp } = options;
  const message =
    options.message ?? 'تعداد درخواست‌های شما بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.';

  return (req, res, next) => {
    consume(`${name}:${key(req)}`, limit, windowSeconds)
      .then(({ allowed, retryAfterSeconds }) => {
        if (allowed) return next();
        res.setHeader('Retry-After', String(retryAfterSeconds));
        next(tooManyRequests(message, retryAfterSeconds));
      })
      .catch(next);
  };
}

/** Drops expired counters so the table cannot grow without bound. */
export async function pruneRateLimits(): Promise<void> {
  await query(`DELETE FROM rate_limits WHERE window_ends < now() - interval '1 hour'`);
}
