import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import fs from 'node:fs';
import path from 'node:path';
import { env } from './env.js';
import { closePool, pool } from './db.js';
import { migrate } from './migrate.js';
import { attachUser } from './lib/auth.js';
import { HttpError } from './lib/http.js';
import { pruneRateLimits } from './lib/rateLimit.js';
import { authRouter } from './routes/auth.js';
import { contentRouter } from './routes/content.js';
import { submissionsRouter } from './routes/submissions.js';
import { meRouter } from './routes/me.js';
import { miscRouter } from './routes/misc.js';
import { adminRouter } from './routes/admin.js';
import { uploadsRouter, UPLOAD_ROOT } from './routes/uploads.js';

const app = express();

if (env.trustProxy) {
  // Runflare (and any reverse proxy) terminates TLS; without this the secure
  // cookie flag and the client IP used for rate limiting would both be wrong.
  app.set('trust proxy', 1);
}
app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        'default-src': ["'self'"],
        // Vite emits a hashed bundle; no inline scripts are needed.
        'script-src': ["'self'"],
        // Tailwind and the editor set inline styles at runtime.
        'style-src': ["'self'", "'unsafe-inline'"],
        // Editors can reference images hosted elsewhere; images cannot execute,
        // and everything else stays locked to this origin.
        'img-src': ["'self'", 'data:', 'blob:', 'https:'],
        'media-src': ["'self'", 'data:', 'blob:', 'https:'],
        'font-src': ["'self'"],
        'connect-src': ["'self'"],
        // Video lessons may be hosted on Aparat; nothing else may frame in.
        'frame-src': ["'self'", 'https://www.aparat.com', 'https://aparat.com'],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        ...(env.isProduction ? { 'upgrade-insecure-requests': [] } : {}),
      },
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: env.isProduction ? { maxAge: 15_552_000, includeSubDomains: true } : false,
  }),
);

app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser());

// --------------------------------------------------------------- CORS ------
// The SPA is served from this same origin, so CORS stays closed unless extra
// origins are configured explicitly.
if (env.corsOrigins.length) {
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && env.corsOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Noafar-Client');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    }
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });
}

// ---------------------------------------------------------- CSRF guard -----
/**
 * The session lives in a SameSite=Lax cookie, which already blocks cross-site
 * POSTs from a third-party page. This adds a second, independent check: every
 * state-changing request must carry a custom header, which a cross-origin page
 * cannot send without a CORS preflight we do not grant.
 */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
app.use('/api', (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();
  // Bearer callers (scripts, mobile) don't send cookies, so they aren't
  // exposed to CSRF and don't need the header.
  const usesBearer = String(req.headers.authorization ?? '').startsWith('Bearer ');
  if (usesBearer || req.headers['x-noafar-client'] === 'web') return next();

  res.status(403).json({
    message: 'درخواست نامعتبر است. لطفاً صفحه را تازه‌سازی کنید و دوباره تلاش کنید.',
    code: 'csrf',
  });
});

app.use('/api', attachUser);

// ------------------------------------------------------------- routes ------
app.get('/api/health', (_req, res) => {
  pool
    .query('SELECT 1')
    .then(() => res.json({ ok: true, env: env.nodeEnv }))
    .catch(() => res.status(503).json({ ok: false, message: 'اتصال به پایگاه‌داده برقرار نیست.' }));
});

app.use('/api/auth', authRouter);
app.use('/api/content', contentRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/me', meRouter);
app.use('/api/admin', adminRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api', miscRouter);

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'این نشانی در سرویس نوآفر وجود ندارد.', code: 'not_found' });
});

// ------------------------------------------------------- static assets -----
app.use(
  '/uploads',
  express.static(UPLOAD_ROOT, {
    maxAge: '30d',
    index: false,
    // Never let a stored file be interpreted as a script by the browser.
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    },
  }),
);

const publicDir = path.resolve(process.cwd(), env.publicDir);
if (fs.existsSync(publicDir)) {
  app.use(
    express.static(publicDir, {
      index: false,
      // Hashed asset filenames can be cached forever; index.html cannot.
      setHeaders: (res, filePath) => {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }),
  );

  // SPA fallback: every non-API route renders the app shell.
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

// ------------------------------------------------------- error handler -----
app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ): void => {
    if (error instanceof HttpError) {
      res.status(error.status).json({ message: error.message, code: error.code });
      return;
    }

    // Multer surfaces upload problems as plain errors with a `code`.
    const multerCode = (error as { code?: string })?.code;
    if (multerCode === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ message: 'حجم فایل انتخابی بیش از حد مجاز است.', code: 'file_too_large' });
      return;
    }
    if (multerCode === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({ message: 'فایل ارسالی معتبر نیست.', code: 'bad_request' });
      return;
    }
    if (error instanceof Error && error.message.startsWith('نوع فایل')) {
      res.status(415).json({ message: error.message, code: 'unsupported_media_type' });
      return;
    }
    // body-parser reports both malformed and oversized payloads via `type`.
    const parserType = (error as { type?: string })?.type;
    if (parserType === 'entity.too.large') {
      res
        .status(413)
        .json({ message: 'حجم داده ارسالی بیش از حد مجاز است.', code: 'payload_too_large' });
      return;
    }
    if (parserType === 'entity.parse.failed' || (error instanceof SyntaxError && 'body' in error)) {
      res.status(400).json({ message: 'ساختار داده ارسالی معتبر نیست.', code: 'bad_request' });
      return;
    }

    // eslint-disable-next-line no-console
    console.error('[noafar] خطای پیش‌بینی‌نشده:', error);
    // Internal details never reach the client.
    res.status(500).json({ message: 'خطای داخلی سرور. لطفاً بعداً دوباره تلاش کنید.', code: 'server_error' });
  },
);

// --------------------------------------------------------------- boot ------
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
