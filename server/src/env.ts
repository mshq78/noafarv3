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

/**
 * Non-fatal notes about the configuration. Unlike a problem these do not
 * refuse requests; they are reported by `/api/health` so an operator can see
 * which fallback the service fell back to.
 */
export const configWarnings: string[] = [];

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
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY,
);

/**
 * Every variable name a Postgres connection string is accepted under. Vercel's
 * database integrations (Neon among them) name the variable they inject after
 * the product rather than after the app, so a service that only reads
 * `DATABASE_URL` looks unconfigured on a host that has a database attached.
 * The first name that carries a value wins; `DATABASE_URL` stays the one to
 * set by hand.
 */
export const DATABASE_URL_KEYS = [
  'DATABASE_URL',
  'POSTGRES_URL',
  'DATABASE_URL_UNPOOLED',
  'POSTGRES_URL_NON_POOLING',
  'POSTGRES_PRISMA_URL',
  'NEON_DATABASE_URL',
] as const;

/** The names above that are actually present. Reported by `/api/health`. */
export const databaseUrlKeysPresent: string[] = [];

function resolveDatabaseUrl(): string {
  let resolved = '';
  for (const key of DATABASE_URL_KEYS) {
    const value = process.env[key];
    if (!value || !value.trim()) continue;
    databaseUrlKeysPresent.push(key);
    if (!resolved) resolved = value.trim();
  }

  if (resolved) {
    if (databaseUrlKeysPresent[0] !== 'DATABASE_URL') {
      configWarnings.push(
        `DATABASE_URL تنظیم نشده؛ رشتهٔ اتصال از «${databaseUrlKeysPresent[0]}» خوانده شد.`,
      );
    }
    return resolved;
  }

  if (IS_PRODUCTION) {
    configProblems.push(
      'متغیر محیطی «DATABASE_URL» تنظیم نشده است. ' +
        `(نام‌های پذیرفته‌شده: ${DATABASE_URL_KEYS.join('، ')})`,
    );
  }
  return '';
}

/**
 * Managed Postgres (Neon, Supabase, RDS…) refuses a plaintext connection, and
 * `pg` does not turn TLS on by itself. Rather than make every deployment
 * remember `DATABASE_SSL=true`, default it from the connection string: on for
 * anything remote, off for a local database and for an explicit
 * `sslmode=disable`. An explicit `DATABASE_SSL` always wins.
 */
function resolveDatabaseSsl(databaseUrl: string): boolean {
  if (optional('DATABASE_SSL')) return bool('DATABASE_SSL');
  if (!databaseUrl) return false;

  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    return false;
  }

  const sslMode = parsed.searchParams.get('sslmode');
  if (sslMode === 'disable') return false;

  const host = parsed.hostname.toLowerCase();
  const isLocal =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host === '[::1]' ||
    host.endsWith('.local') ||
    host.endsWith('.internal');
  return !isLocal;
}

/**
 * The session secret must be explicit in production. In development we derive a
 * stable-per-process random value so nobody accidentally ships a default secret.
 *
 * When it is missing on a host that does have a database, the secret is derived
 * from the connection string instead of refusing every request: the string
 * already carries a high-entropy password, and the derivation is deterministic,
 * so every instance and every redeploy agree on the same key and sessions keep
 * working. It is a fallback, not the recommendation — rotating the database
 * password signs everyone out — so it is reported as a warning by
 * `/api/health` until a real SESSION_SECRET is set.
 */
function resolveSessionSecret(databaseUrl: string): string {
  const fromEnv = optional('SESSION_SECRET');
  if (fromEnv) {
    if (fromEnv.length < 32) {
      configProblems.push('SESSION_SECRET باید حداقل ۳۲ کاراکتر باشد.');
    }
    return fromEnv;
  }

  if (!IS_PRODUCTION) {
    // eslint-disable-next-line no-console
    console.warn('[noafar] SESSION_SECRET تنظیم نشده؛ یک کلید موقت برای توسعه ساخته شد.');
    return crypto.randomBytes(48).toString('hex');
  }

  if (databaseUrl) {
    configWarnings.push(
      'SESSION_SECRET تنظیم نشده است؛ کلید نشست فعلاً از رشتهٔ اتصال پایگاه‌داده ساخته می‌شود. ' +
        'یک رشتهٔ تصادفی ۶۴ کاراکتری در متغیرهای محیطی قرار دهید تا تغییر رمز پایگاه‌داده کاربران را از حساب خارج نکند.',
    );
    return crypto
      .createHmac('sha256', databaseUrl)
      .update('noafar/session-secret/v1')
      .digest('hex');
  }

  configProblems.push(
    'SESSION_SECRET تنظیم نشده است. یک رشته تصادفی ۶۴ کاراکتری بسازید و در متغیرهای محیطی قرار دهید.',
  );
  // A placeholder keeps the module loadable; requests are refused while any
  // configuration problem stands, so this value is never actually relied on.
  return crypto.randomBytes(48).toString('hex');
}

const DATABASE_URL = resolveDatabaseUrl();

export const env = {
  nodeEnv: NODE_ENV,
  isProduction: IS_PRODUCTION,
  port: num('PORT', 4000),
  host: optional('HOST', '0.0.0.0'),

  databaseUrl: DATABASE_URL,
  databaseSsl: resolveDatabaseSsl(DATABASE_URL),
  databasePoolMax: num('DATABASE_POOL_MAX', IS_SERVERLESS ? 1 : 10),

  sessionSecret: resolveSessionSecret(DATABASE_URL),
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
