/**
 * Entry point for a long-running host (Runflare, Docker, `npm start`).
 * Serverless deployments use `api/[...path].ts`, which imports the same app.
 */
import { env } from './env.js';
import { closePool, pool } from './db.js';
import { migrate } from './migrate.js';
import { pruneRateLimits } from './lib/rateLimit.js';
import { app } from './app.js';

async function start(): Promise<void> {
  await migrate();

  if (env.seedOnBoot) {
    const { seed } = await import('./seed.js');
    await seed({ onlyIfEmpty: true });
  }

  const server = app.listen(env.port, env.host, () => {
    // eslint-disable-next-line no-console
    console.info(`[noafar] سرویس روی http://${env.host}:${env.port} در حالت ${env.nodeEnv} بالا آمد.`);
  });

  // Housekeeping: expired OTPs, sessions and rate-limit buckets.
  const cleanup = setInterval(
    () => {
      Promise.all([
        pool.query(`DELETE FROM otp_codes WHERE expires_at < now() - interval '1 day'`),
        pool.query(`DELETE FROM sessions WHERE expires_at < now() - interval '7 days'`),
        pool.query(`DELETE FROM password_resets WHERE expires_at < now() - interval '7 days'`),
        pruneRateLimits(),
      ]).catch((error) => {
        // eslint-disable-next-line no-console
        console.error('[noafar] پاک‌سازی دوره‌ای ناموفق بود:', error);
      });
    },
    60 * 60 * 1000,
  );
  cleanup.unref();

  const shutdown = (signal: string) => {
    // eslint-disable-next-line no-console
    console.info(`[noafar] دریافت ${signal}؛ در حال خاموش‌سازی…`);
    clearInterval(cleanup);
    server.close(() => {
      closePool().finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[noafar] راه‌اندازی سرویس ناموفق بود:', error);
  process.exit(1);
});

export { app };
