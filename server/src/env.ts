import { config as loadDotenv } from 'dotenv';
import crypto from 'node:crypto';

loadDotenv();

function required(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(
      `[noafar] متغیر محیطی «${name}» تنظیم نشده است. برای اجرای سرور این مقدار الزامی است.`,
    );
  }
  return value.trim();
}

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
 * The session secret must be explicit in production. In development we derive a
 * stable-per-process random value so nobody accidentally ships a default secret.
 */
function resolveSessionSecret(): string {
  const fromEnv = optional('SESSION_SECRET');
  if (fromEnv) {
    if (fromEnv.length < 32) {
      throw new Error('[noafar] SESSION_SECRET باید حداقل ۳۲ کاراکتر باشد.');
    }
    return fromEnv;
  }
  if (IS_PRODUCTION) {
    throw new Error(
      '[noafar] SESSION_SECRET در محیط production الزامی است. یک رشته تصادفی ۶۴ کاراکتری تولید کنید.',
    );
  }
  // eslint-disable-next-line no-console
  console.warn('[noafar] SESSION_SECRET تنظیم نشده؛ یک کلید موقت برای توسعه ساخته شد.');
  return crypto.randomBytes(48).toString('hex');
}

export const env = {
  nodeEnv: NODE_ENV,
  isProduction: IS_PRODUCTION,
  port: num('PORT', 4000),
  host: optional('HOST', '0.0.0.0'),

  databaseUrl: IS_PRODUCTION ? required('DATABASE_URL') : optional('DATABASE_URL'),
  databaseSsl: bool('DATABASE_SSL', false),
  databasePoolMax: num('DATABASE_POOL_MAX', 10),

  sessionSecret: resolveSessionSecret(),
  sessionCookieName: optional('SESSION_COOKIE_NAME', 'noafar_session'),
  sessionTtlDays: num('SESSION_TTL_DAYS', 30),

  /** Phones that are promoted to `admin` the first time they sign in. */
  bootstrapAdminPhones: list('BOOTSTRAP_ADMIN_PHONES'),

  otpTtlSeconds: num('OTP_TTL_SECONDS', 120),
  otpMaxAttempts: num('OTP_MAX_ATTEMPTS', 5),
  otpResendCooldownSeconds: num('OTP_RESEND_COOLDOWN_SECONDS', 60),
  /** Development helper: return the OTP in the API response. Never enable in production. */
  otpDebugReturn: bool('OTP_DEBUG_RETURN', false) && !IS_PRODUCTION,

  smsProvider: optional('SMS_PROVIDER', 'console').toLowerCase(),
  smsApiKey: optional('SMS_API_KEY'),
  smsSender: optional('SMS_SENDER'),
  smsTemplate: optional('SMS_TEMPLATE'),

  uploadDir: optional('UPLOAD_DIR', 'uploads'),
  uploadMaxBytes: num('UPLOAD_MAX_BYTES', 8 * 1024 * 1024),
  publicDir: optional('PUBLIC_DIR', 'dist'),

  /** Extra origins allowed to call the API (the SPA is served same-origin by default). */
  corsOrigins: list('CORS_ORIGINS'),
  trustProxy: bool('TRUST_PROXY', IS_PRODUCTION),
  seedOnBoot: bool('SEED_ON_BOOT', false),
};

export type Env = typeof env;
