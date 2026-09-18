import { config as loadDotenv } from 'dotenv';
import crypto from 'node:crypto';

loadDotenv();

/**
 * Configuration problems are collected rather than thrown. A throw here
 * happens at module load, which on a serverless host surfaces as an opaque
 * "function crashed" 500 with no hint as to the cause; collecting them lets
 * the app answer with the actual missing variable names instead.
 */
export const configProblems: string[] = [];

function optional(name: string, fallback = ''): string {
  const value = process.env[name];
  return value === undefined || value === null ? fallback : value.trim();
}

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function bool(name: string, fallback = false): boolean {
  const raw = optional(name).toLowerCase();
  if (!raw) return fallback;
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
}

function list(name: string): string[] {
  return optional(name)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export const NODE_ENV = optional('NODE_ENV', 'development');
export const IS_PRODUCTION = NODE_ENV === 'production';

/**
 * True on a function-per-request host (Vercel, Lambda). Each instance holds
 * its own pool, so a normal pool size would multiply into hundreds of
 * connections and exhaust the database's limit.
 */
export const IS_SERVERLESS = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME,
);

/**
 * The session secret must be explicit in production. In development we derive a
 * stable-per-process random value so nobody accidentally ships a default secret.
 */
function resolveSessionSecret(): string {
  const fromEnv = optional('SESSION_SECRET');
  if (fromEnv) {
    if (fromEnv.length < 32) {
      configProblems.push('SESSION_SECRET باید حداقل ۳۲ کاراکتر باشد.');
    }
    return fromEnv;
  }
  if (IS_PRODUCTION) {
    configProblems.push(
      'SESSION_SECRET تنظیم نشده است. یک رشته تصادفی ۶۴ کاراکتری بسازید و در متغیرهای محیطی قرار دهید.',
    );
  } else {
    // eslint-disable-next-line no-console
    console.warn('[noafar] SESSION_SECRET تنظیم نشده؛ یک کلید موقت برای توسعه ساخته شد.');
  }
  // A placeholder keeps the module loadable; requests are refused while any
  // configuration problem stands, so this value is never actually relied on.
  return crypto.randomBytes(48).toString('hex');
}


/**
 * A Postgres integration does not always write `DATABASE_URL`. Neon's Vercel
 * integration, for instance, injects `POSTGRES_URL` and its unpooled twin, and
 * a project can end up with one name set by hand and another by the
 * integration — pointing at different databases. Preferring an explicit
 * `DATABASE_URL` and recording which name won turns "wrong password" into a
 * question with an answer.
 */
const DATABASE_URL_NAMES = [
  'DATABASE_URL',
  'POSTGRES_URL',
  'DATABASE_URL_UNPOOLED',
  'POSTGRES_URL_NON_POOLING',
] as const;

let DATABASE_URL_SOURCE = '';

function resolveDatabaseUrl(): string {
  for (const name of DATABASE_URL_NAMES) {
    const value = optional(name);
    if (value) {
      DATABASE_URL_SOURCE = name;
      return value;
    }
  }
  if (IS_PRODUCTION) {
    configProblems.push(
      `متغیر محیطی «DATABASE_URL» تنظیم نشده است (نام‌های پذیرفته‌شده: ${DATABASE_URL_NAMES.join('، ')}).`,
    );
  }
  return '';
}


/**
 * Connecting a Blob store usually writes `BLOB_READ_WRITE_TOKEN`, but a
 * project with more than one store, or one connected under a custom prefix,
 * gets a prefixed name instead. Rather than fail silently with uploads off,
 * fall back to any variable that ends in `_READ_WRITE_TOKEN` and carries a
 * blob token, and record which one was used.
 */
let BLOB_TOKEN_SOURCE = '';

function resolveBlobToken(): string {
  const direct = optional('BLOB_READ_WRITE_TOKEN');
  if (direct) {
    BLOB_TOKEN_SOURCE = 'BLOB_READ_WRITE_TOKEN';
    return direct;
  }
  for (const [name, value] of Object.entries(process.env)) {
    if (!name.endsWith('_READ_WRITE_TOKEN')) continue;
    const trimmed = (value ?? '').trim();
    if (trimmed.startsWith('vercel_blob_rw_')) {
      BLOB_TOKEN_SOURCE = name;
      return trimmed;
    }
  }
  return '';
}

export const env = {
  nodeEnv: NODE_ENV,
  isProduction: IS_PRODUCTION,
  port: num('PORT', 4000),
  host: optional('HOST', '0.0.0.0'),

  databaseUrl: resolveDatabaseUrl(),
  /** Which variable the connection string came from, for diagnostics. */
  databaseUrlSource: DATABASE_URL_SOURCE,
  databaseSsl: bool('DATABASE_SSL', false),
  databasePoolMax: num('DATABASE_POOL_MAX', IS_SERVERLESS ? 1 : 10),

  sessionSecret: resolveSessionSecret(),
  sessionCookieName: optional('SESSION_COOKIE_NAME', 'noafar_session'),
  sessionTtlDays: num('SESSION_TTL_DAYS', 30),

  /** Phones that are promoted to `admin` when they sign in. */
  bootstrapAdminPhones: list('BOOTSTRAP_ADMIN_PHONES'),
  /** Email addresses that are promoted to `admin` when they register or sign in. */
  bootstrapAdminEmails: list('BOOTSTRAP_ADMIN_EMAILS').map((entry) => entry.toLowerCase()),

  otpTtlSeconds: num('OTP_TTL_SECONDS', 120),
  otpMaxAttempts: num('OTP_MAX_ATTEMPTS', 5),
  otpResendCooldownSeconds: num('OTP_RESEND_COOLDOWN_SECONDS', 60),
  /** Development helper: return the OTP in the API response. Never enable in production. */
  otpDebugReturn: bool('OTP_DEBUG_RETURN', false) && !IS_PRODUCTION,

  smsProvider: optional('SMS_PROVIDER', 'console').toLowerCase(),
  smsApiKey: optional('SMS_API_KEY'),
  smsSender: optional('SMS_SENDER'),
  smsTemplate: optional('SMS_TEMPLATE'),

  /** Minimum accepted password length is enforced in lib/password.ts. */
  loginMaxAttempts: num('LOGIN_MAX_ATTEMPTS', 10),
  passwordResetTtlMinutes: num('PASSWORD_RESET_TTL_MINUTES', 60),

  smtpHost: optional('SMTP_HOST'),
  smtpPort: num('SMTP_PORT', 587),
  smtpSecure: optional('SMTP_SECURE') ? bool('SMTP_SECURE') : undefined,
  smtpUser: optional('SMTP_USER'),
  smtpPassword: optional('SMTP_PASSWORD'),
  mailFrom: optional('MAIL_FROM'),
  /** Absolute site URL used to build links inside emails. */
  publicUrl: optional('PUBLIC_URL').replace(/\/$/, ''),

  /**
   * Vercel Blob. When this is set, uploads go straight from the browser to
   * object storage and the local filesystem is not involved at all — which is
   * the only thing that works on a serverless host, where the disk is wiped
   * between invocations and the function body itself is capped at 4.5 MB.
   */
  blobToken: resolveBlobToken(),
  /** Which variable supplied the blob token, for diagnostics. */
  blobTokenSource: BLOB_TOKEN_SOURCE,
  /** Ceiling for an operator's media upload once Blob is in use. */
  blobMediaMaxBytes: num('BLOB_MEDIA_MAX_BYTES', 512 * 1024 * 1024),

  uploadDir: optional('UPLOAD_DIR', IS_SERVERLESS ? '/tmp/noafar-uploads' : 'uploads'),
  /**
   * Set to true only where UPLOAD_DIR really survives a redeploy (a mounted
   * volume). On a serverless host the filesystem is wiped between
   * invocations, so uploads are refused rather than silently lost.
   */
  uploadsPersistent: bool('UPLOADS_PERSISTENT', !IS_SERVERLESS),
  uploadMaxBytes: num('UPLOAD_MAX_BYTES', 8 * 1024 * 1024),
  publicDir: optional('PUBLIC_DIR', 'dist'),

  /** Extra origins allowed to call the API (the SPA is served same-origin by default). */
  corsOrigins: list('CORS_ORIGINS'),
  trustProxy: bool('TRUST_PROXY', IS_PRODUCTION || IS_SERVERLESS),
  seedOnBoot: bool('SEED_ON_BOOT', false),
};

export type Env = typeof env;

if (configProblems.length) {
  // eslint-disable-next-line no-console
  console.error(
    '[noafar] پیکربندی ناقص است:\n' + configProblems.map((item) => `  • ${item}`).join('\n'),
  );
}
