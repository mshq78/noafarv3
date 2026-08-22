import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import fs from 'node:fs';
import path from 'node:path';
import { env } from './env.js';
import { pool } from './db.js';
import { ensureReady } from './migrate.js';
import { attachUser } from './lib/auth.js';
import { HttpError } from './lib/http.js';
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

/**
 * Some serverless runtimes (Vercel among them) parse the JSON body and hand it
 * over on `req.body`, leaving the stream already consumed. `express.json()`
 * would then wait forever for data that never arrives, so mark such a request
 * as already-read and normalise whatever shape it arrived in.
 */
app.use((req, _res, next) => {
  const raw = req as express.Request & { body?: unknown; _body?: boolean };
  if (raw._body || raw.body === undefined || raw.body === null) return next();

  if (Buffer.isBuffer(raw.body) || typeof raw.body === 'string') {
    const text = raw.body.toString('utf8' as BufferEncoding);
    if (!text.trim()) raw.body = {};
    else if (String(req.headers['content-type'] ?? '').includes('application/json')) {
      try {
        raw.body = JSON.parse(text);
      } catch {
        raw.body = {};
      }
    }
  }

  raw._body = true;
  next();
});

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

/**
 * The schema is applied on the first request of each process. A long-running
 * server has already done it at boot; a serverless instance does it here, on
 * its cold start, guarded so only one instance applies it.
 */
app.use('/api', (_req, _res, next) => {
  ensureReady().then(() => next()).catch(next);
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

export { app };
