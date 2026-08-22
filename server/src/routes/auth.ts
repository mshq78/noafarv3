import { Router } from 'express';
import { z } from 'zod';
import { env } from '../env.js';
import { query, queryOne, transaction } from '../db.js';
import {
  clearSessionCookie,
  createSession,
  generateOtp,
  hashOtp,
  requireAuth,
  revokeSession,
  setSessionCookie,
  verifyOtpHash,
} from '../lib/auth.js';
import { asyncRoute, badRequest, conflict, tooManyRequests, unauthorized } from '../lib/http.js';
import { clientIp, consume, rateLimit } from '../lib/rateLimit.js';
import { mapUser, type UserRow } from '../lib/mappers.js';
import { sanitizePlainText } from '../lib/sanitize.js';
import { sendOtpSms } from '../lib/sms.js';
import { buildPasswordResetMail, sendMail } from '../lib/mailer.js';
import {
  burnPasswordTime,
  checkPasswordStrength,
  generateResetToken,
  hashPassword,
  hashResetToken,
  verifyPassword,
} from '../lib/password.js';
import { awardPoints } from '../lib/points.js';

export const authRouter = Router();

const USER_COLUMNS = `id, phone, email, display_name, national_id, birth_year, city, interests,
                      role, avatar_url, bio, points, profile_complete, is_blocked, joined_at,
                      (password_hash IS NOT NULL) AS has_password`;

/** Lower-cased and trimmed; `''` when the value is not a usable address. */
function normaliseEmail(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const value = input.trim().toLowerCase();
  if (value.length < 5 || value.length > 200) return null;
  // Deliberately permissive: one @, no spaces, a dotted domain.
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(value) ? value : null;
}

/** Accepts Persian/Arabic digits and common separators, normalises to 09xxxxxxxxx. */
function normalisePhone(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const latin = input
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[^\d+]/g, '');

  let digits = latin;
  if (digits.startsWith('+98')) digits = `0${digits.slice(3)}`;
  else if (digits.startsWith('0098')) digits = `0${digits.slice(4)}`;
  else if (digits.startsWith('98') && digits.length === 12) digits = `0${digits.slice(2)}`;
  else if (digits.startsWith('9') && digits.length === 10) digits = `0${digits}`;

  return /^09\d{9}$/.test(digits) ? digits : null;
}

const requestOtpSchema = z.object({ phone: z.string().min(1) });
const verifyOtpSchema = z.object({ phone: z.string().min(1), code: z.string().min(1) });

authRouter.post(
  '/otp/request',
  rateLimit({ name: 'otp-request-ip', limit: 12, windowSeconds: 15 * 60 }),
  asyncRoute(async (req, res) => {
    const parsed = requestOtpSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('شماره تلفن همراه را وارد کنید.');

    const phone = normalisePhone(parsed.data.phone);
    if (!phone) {
      throw badRequest('شماره موبایل باید ۱۱ رقم بوده و با ۰۹ شروع شود (مثال: ۰۹۱۲۳۴۵۶۷۸۹).');
    }

    // Per-phone limit, independent of IP, so one number cannot be flooded.
    const perPhone = await consume(`otp-request-phone:${phone}`, 5, 15 * 60);
    if (!perPhone.allowed) {
      throw tooManyRequests(
        'برای این شماره درخواست‌های زیادی ثبت شده است. لطفاً کمی بعد دوباره تلاش کنید.',
        perPhone.retryAfterSeconds,
      );
    }

    // Honour the resend cooldown instead of issuing a second live code.
    const recent = await queryOne<{ seconds_left: number }>(
      `SELECT CEIL(EXTRACT(EPOCH FROM ($2::interval - (now() - created_at))))::int AS seconds_left
         FROM otp_codes
        WHERE phone = $1 AND consumed_at IS NULL AND created_at > now() - $2::interval
        ORDER BY created_at DESC
        LIMIT 1`,
      [phone, `${env.otpResendCooldownSeconds} seconds`],
    );
    if (recent && recent.seconds_left > 0) {
      throw tooManyRequests(
        `کد قبلی هنوز معتبر است. ${recent.seconds_left} ثانیه دیگر می‌توانید کد جدید بگیرید.`,
        recent.seconds_left,
      );
    }

    const code = generateOtp();
    // Invalidate any earlier live code for this number.
    await query(`UPDATE otp_codes SET consumed_at = now() WHERE phone = $1 AND consumed_at IS NULL`, [
      phone,
    ]);
    await query(
      `INSERT INTO otp_codes (phone, code_hash, expires_at, request_ip)
            VALUES ($1, $2, now() + make_interval(secs => $3), $4)`,
      [phone, hashOtp(phone, code), env.otpTtlSeconds, clientIp(req)],
    );

    const sms = await sendOtpSms(phone, code);

    res.json({
      expiresInSeconds: env.otpTtlSeconds,
      resendAfterSeconds: env.otpResendCooldownSeconds,
      delivered: sms.delivered,
      // Only ever populated when OTP_DEBUG_RETURN=true outside production.
      ...(env.otpDebugReturn ? { debugCode: code } : {}),
    });
  }),
);

authRouter.post(
  '/otp/verify',
  rateLimit({ name: 'otp-verify-ip', limit: 20, windowSeconds: 15 * 60 }),
  asyncRoute(async (req, res) => {
    const parsed = verifyOtpSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('شماره تلفن و کد تأیید را وارد کنید.');

    const phone = normalisePhone(parsed.data.phone);
    if (!phone) throw badRequest('شماره موبایل معتبر نیست.');

    const code = parsed.data.code
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
      .replace(/\D/g, '');
    if (!/^\d{5}$/.test(code)) throw badRequest('کد تأیید باید ۵ رقم باشد.');

    const perPhone = await consume(`otp-verify-phone:${phone}`, 10, 15 * 60);
    if (!perPhone.allowed) {
      throw tooManyRequests(
        'تلاش‌های ناموفق زیادی ثبت شده است. لطفاً چند دقیقه دیگر دوباره تلاش کنید.',
        perPhone.retryAfterSeconds,
      );
    }

    const record = await queryOne<{ id: number; code_hash: string; attempts: number }>(
      `SELECT id, code_hash, attempts
         FROM otp_codes
        WHERE phone = $1 AND consumed_at IS NULL AND expires_at > now()
        ORDER BY created_at DESC
        LIMIT 1`,
      [phone],
    );

    if (!record) throw badRequest('کد تأیید منقضی شده است. لطفاً کد تازه‌ای درخواست کنید.');
    if (record.attempts >= env.otpMaxAttempts) {
      await query(`UPDATE otp_codes SET consumed_at = now() WHERE id = $1`, [record.id]);
      throw badRequest('تعداد تلاش‌های مجاز به پایان رسید. لطفاً کد تازه‌ای درخواست کنید.');
    }

    if (!verifyOtpHash(phone, code, record.code_hash)) {
      await query(`UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1`, [record.id]);
      throw unauthorized('کد وارد شده صحیح نیست.');
    }

    await query(`UPDATE otp_codes SET consumed_at = now() WHERE id = $1`, [record.id]);

    // Bootstrap admins are configured out-of-band (env / SQL), never guessable
    // from the client and never derived from the phone entered at login.
    const isBootstrapAdmin = env.bootstrapAdminPhones.includes(phone);

    const user = await transaction(async (client) => {
      const existing = await client.query<UserRow & { is_blocked: boolean }>(
        `SELECT ${USER_COLUMNS} FROM users WHERE phone = $1`,
        [phone],
      );

      if (existing.rows[0]) {
        const row = existing.rows[0];
        if (row.is_blocked) throw unauthorized('دسترسی این حساب کاربری مسدود شده است.');
        if (isBootstrapAdmin && row.role !== 'admin') {
          const promoted = await client.query<UserRow & { is_blocked: boolean }>(
            `UPDATE users SET role = 'admin', updated_at = now()
              WHERE id = $1 RETURNING ${USER_COLUMNS}`,
            [row.id],
          );
          return promoted.rows[0]!;
        }
        return row;
      }

      const created = await client.query<UserRow & { is_blocked: boolean }>(
        `INSERT INTO users (phone, display_name, role)
              VALUES ($1, '', $2)
           RETURNING ${USER_COLUMNS}`,
        [phone, isBootstrapAdmin ? 'admin' : 'member'],
      );
      return created.rows[0]!;
    });

    const session = await createSession(user.id, req);
    setSessionCookie(res, session.token, session.expiresAt);

    res.json({ token: session.token, user: mapUser(user) });
  }),
);

authRouter.post(
  '/logout',
  asyncRoute(async (req, res) => {
    if (req.user) await revokeSession(req.user.sessionId);
    clearSessionCookie(res);
    res.json({ success: true });
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  asyncRoute(async (req, res) => {
    const row = await queryOne<UserRow>(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [
      req.user!.id,
    ]);
    if (!row) throw unauthorized('حساب کاربری یافت نشد.');
    res.json(mapUser(row));
  }),
);

const profileSchema = z.object({
  displayName: z.string().max(120).optional(),
  bio: z.string().max(4_000).optional(),
  avatarUrl: z.string().max(300).optional(),
  nationalId: z.string().max(20).optional(),
  birthYear: z.string().max(10).optional(),
  city: z.string().max(120).optional(),
  interests: z.array(z.string().max(60)).max(30).optional(),
});

authRouter.patch(
  '/me',
  requireAuth,
  rateLimit({ name: 'profile-update', limit: 40, windowSeconds: 10 * 60 }),
  asyncRoute(async (req, res) => {
    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('اطلاعات ارسالی معتبر نیست.');
    const input = parsed.data;

    const displayName =
      input.displayName === undefined ? undefined : sanitizePlainText(input.displayName, 120);
    const bio = input.bio === undefined ? undefined : sanitizePlainText(input.bio, 1_000);
    const nationalId =
      input.nationalId === undefined
        ? undefined
        : sanitizePlainText(input.nationalId, 20).replace(/\D/g, '');
    const birthYear =
      input.birthYear === undefined
        ? undefined
        : sanitizePlainText(input.birthYear, 10).replace(/\D/g, '');
    const city = input.city === undefined ? undefined : sanitizePlainText(input.city, 120);
    const interests = input.interests?.map((item) => sanitizePlainText(item, 60)).filter(Boolean);

    if (nationalId && nationalId.length !== 10) {
      throw badRequest('کد ملی باید ۱۰ رقم باشد.');
    }
    if (birthYear && (Number(birthYear) < 1300 || Number(birthYear) > 1420)) {
      throw badRequest('سال تولد معتبر نیست.');
    }

    // Only accept an avatar the server itself issued (an /uploads path).
    let avatarUrl: string | null | undefined;
    if (input.avatarUrl !== undefined) {
      const value = input.avatarUrl.trim();
      if (!value) avatarUrl = null;
      else if (value.startsWith('/uploads/') || value.startsWith('/mock/')) avatarUrl = value;
      else throw badRequest('تصویر پروفایل باید ابتدا بارگذاری شود.');
    }

    const updated = await queryOne<UserRow>(
      `UPDATE users
          SET display_name = COALESCE($2, display_name),
              bio          = COALESCE($3, bio),
              national_id  = COALESCE($4, national_id),
              birth_year   = COALESCE($5, birth_year),
              city         = COALESCE($6, city),
              interests    = COALESCE($7::jsonb, interests),
              avatar_url   = CASE WHEN $9::boolean THEN $8 ELSE avatar_url END,
              profile_complete = (COALESCE($2, display_name) <> '' AND COALESCE($6, city) IS NOT NULL),
              updated_at   = now()
        WHERE id = $1
    RETURNING ${USER_COLUMNS}`,
      [
        req.user!.id,
        displayName ?? null,
        bio ?? null,
        nationalId ?? null,
        birthYear ?? null,
        city ?? null,
        interests ? JSON.stringify(interests) : null,
        avatarUrl ?? null,
        avatarUrl !== undefined,
      ],
    );

    if (!updated) throw unauthorized('حساب کاربری یافت نشد.');

    if (updated.profile_complete) {
      await awardPoints({
        userId: updated.id,
        reason: 'complete_profile',
        reasonFa: 'تکمیل اطلاعات حساب کاربری',
        points: 20,
        dedupeKey: 'complete_profile',
      });
    }

    const fresh = await queryOne<UserRow>(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [
      updated.id,
    ]);
    res.json(mapUser(fresh ?? updated));
  }),
);

// ==========================================================================
// EMAIL + PASSWORD
// ==========================================================================

/**
 * Both sign-in and sign-up answer with the same shape as the OTP flow, so the
 * client treats every route to a session identically.
 */
async function issueSession(
  user: UserRow,
  req: Parameters<typeof createSession>[1],
  res: Parameters<typeof setSessionCookie>[0],
): Promise<void> {
  const session = await createSession(user.id, req);
  setSessionCookie(res, session.token, session.expiresAt);
  res.json({ token: session.token, user: mapUser(user) });
}

const registerSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
  displayName: z.string().max(120).optional(),
});

authRouter.post(
  '/register',
  rateLimit({
    name: 'register-ip',
    limit: 10,
    windowSeconds: 60 * 60,
    message: 'تعداد ثبت‌نام‌ها از این دستگاه بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.',
  }),
  asyncRoute(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('نشانی رایانامه و گذرواژه را وارد کنید.');

    const email = normaliseEmail(parsed.data.email);
    if (!email) throw badRequest('نشانی رایانامه معتبر نیست.');

    const strength = checkPasswordStrength(parsed.data.password, email);
    if (!strength.ok) throw badRequest(strength.message!);

    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM users WHERE lower(email) = $1`,
      [email],
    );
    if (existing) {
      throw conflict('این نشانی رایانامه قبلاً ثبت شده است. وارد شوید یا گذرواژه را بازیابی کنید.');
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const displayName = sanitizePlainText(parsed.data.displayName ?? '', 120);

    // Bootstrap admins are configured out-of-band, never chosen by the client.
    const role = env.bootstrapAdminEmails.includes(email) ? 'admin' : 'member';

    let created: UserRow | null;
    try {
      created = await queryOne<UserRow>(
        `INSERT INTO users (email, password_hash, display_name, role)
              VALUES ($1, $2, $3, $4)
           RETURNING ${USER_COLUMNS}`,
        [email, passwordHash, displayName, role],
      );
    } catch (error) {
      // The unique index is the real guard against two simultaneous sign-ups.
      if ((error as { code?: string })?.code === '23505') {
        throw conflict('این نشانی رایانامه قبلاً ثبت شده است.');
      }
      throw error;
    }

    await issueSession(created!, req, res);
  }),
);

const loginSchema = z.object({ email: z.string().min(1), password: z.string().min(1) });

authRouter.post(
  '/login',
  rateLimit({
    name: 'login-ip',
    limit: 30,
    windowSeconds: 15 * 60,
    message: 'تلاش‌های ورود از این دستگاه بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.',
  }),
  asyncRoute(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('نشانی رایانامه و گذرواژه را وارد کنید.');

    const email = normaliseEmail(parsed.data.email);
    // One message for every failure below, so a wrong password cannot be told
    // apart from an address that has no account.
    const rejection = unauthorized('نشانی رایانامه یا گذرواژه درست نیست.');

    if (!email) {
      await burnPasswordTime(parsed.data.password);
      throw rejection;
    }

    // A second limit keyed on the address, so one account cannot be ground
    // through from many IPs.
    const perEmail = await consume(`login-email:${email}`, env.loginMaxAttempts, 15 * 60);
    if (!perEmail.allowed) {
      throw tooManyRequests(
        'تلاش‌های ناموفق زیادی برای این حساب ثبت شده است. چند دقیقه دیگر دوباره تلاش کنید.',
        perEmail.retryAfterSeconds,
      );
    }

    const row = await queryOne<UserRow & { password_hash: string | null; is_blocked: boolean }>(
      `SELECT ${USER_COLUMNS}, password_hash FROM users WHERE lower(email) = $1`,
      [email],
    );

    if (!row || !row.password_hash) {
      await burnPasswordTime(parsed.data.password);
      throw rejection;
    }
    if (!(await verifyPassword(parsed.data.password, row.password_hash))) throw rejection;
    if (row.is_blocked) throw unauthorized('دسترسی این حساب کاربری مسدود شده است.');

    // An address added to the bootstrap list after signing up is promoted here.
    let user: UserRow = row;
    if (env.bootstrapAdminEmails.includes(email) && row.role !== 'admin') {
      user =
        (await queryOne<UserRow>(
          `UPDATE users SET role = 'admin', updated_at = now()
            WHERE id = $1 RETURNING ${USER_COLUMNS}`,
          [row.id],
        )) ?? row;
    }

    await issueSession(user, req, res);
  }),
);

// -------------------------------------------------- set / change password ---

const setPasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(1),
  email: z.string().optional(),
});

/**
 * Lets a signed-in visitor attach an address and password to an account they
 * created with a phone number, or change an existing password.
 */
authRouter.post(
  '/password',
  requireAuth,
  rateLimit({
    name: 'set-password',
    limit: 12,
    windowSeconds: 60 * 60,
    key: (req) => req.user?.id ?? 'anon',
  }),
  asyncRoute(async (req, res) => {
    const parsed = setPasswordSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('گذرواژه تازه را وارد کنید.');

    const current = await queryOne<UserRow & { password_hash: string | null }>(
      `SELECT ${USER_COLUMNS}, password_hash FROM users WHERE id = $1`,
      [req.user!.id],
    );
    if (!current) throw unauthorized('حساب کاربری یافت نشد.');

    // Changing an existing password requires proving you know it.
    if (current.password_hash) {
      if (!parsed.data.currentPassword) throw badRequest('گذرواژه فعلی را وارد کنید.');
      if (!(await verifyPassword(parsed.data.currentPassword, current.password_hash))) {
        throw unauthorized('گذرواژه فعلی درست نیست.');
      }
    }

    let email = current.email ?? null;
    if (parsed.data.email !== undefined) {
      const candidate = normaliseEmail(parsed.data.email);
      if (!candidate) throw badRequest('نشانی رایانامه معتبر نیست.');
      if (candidate !== current.email) {
        const clash = await queryOne<{ id: string }>(
          `SELECT id FROM users WHERE lower(email) = $1 AND id <> $2`,
          [candidate, current.id],
        );
        if (clash) throw conflict('این نشانی رایانامه برای حساب دیگری ثبت شده است.');
      }
      email = candidate;
    }

    if (!email) throw badRequest('برای تعیین گذرواژه، ابتدا نشانی رایانامه خود را وارد کنید.');

    const strength = checkPasswordStrength(parsed.data.newPassword, email);
    if (!strength.ok) throw badRequest(strength.message!);

    const passwordHash = await hashPassword(parsed.data.newPassword);
    const updated = await queryOne<UserRow>(
      `UPDATE users SET email = $2, password_hash = $3, updated_at = now()
        WHERE id = $1 RETURNING ${USER_COLUMNS}`,
      [current.id, email, passwordHash],
    );

    // Every other session is dropped: a password change is how someone
    // recovers an account they think is compromised.
    await query(
      `UPDATE sessions SET revoked_at = now()
        WHERE user_id = $1 AND id <> $2 AND revoked_at IS NULL`,
      [current.id, req.user!.sessionId],
    );

    res.json(mapUser(updated!));
  }),
);

// ------------------------------------------------------- password reset -----

authRouter.post(
  '/password/forgot',
  rateLimit({
    name: 'forgot-ip',
    limit: 10,
    windowSeconds: 60 * 60,
    message: 'درخواست‌های بازیابی از این دستگاه بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.',
  }),
  asyncRoute(async (req, res) => {
    const email = normaliseEmail((req.body as { email?: unknown })?.email);

    // Always the same answer, so this endpoint cannot be used to discover
    // which addresses have accounts.
    const acknowledge = () =>
      res.json({
        success: true,
        message: 'اگر این نشانی در نوآفر ثبت شده باشد، پیوند بازیابی برای شما ارسال می‌شود.',
      });

    if (!email) {
      acknowledge();
      return;
    }

    const perEmail = await consume(`forgot-email:${email}`, 5, 60 * 60);
    if (!perEmail.allowed) {
      acknowledge();
      return;
    }

    const user = await queryOne<{ id: string; email: string | null; is_blocked: boolean }>(
      `SELECT id, email, is_blocked FROM users WHERE lower(email) = $1`,
      [email],
    );
    if (!user || user.is_blocked) {
      acknowledge();
      return;
    }

    const token = generateResetToken();
    await query(
      `UPDATE password_resets SET consumed_at = now()
        WHERE user_id = $1 AND consumed_at IS NULL`,
      [user.id],
    );
    await query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at, request_ip)
            VALUES ($1, $2, now() + make_interval(mins => $3), $4)`,
      [user.id, hashResetToken(token), env.passwordResetTtlMinutes, clientIp(req)],
    );

    const origin = env.publicUrl || `${req.protocol}://${req.get('host') ?? ''}`;
    const resetUrl = `${origin}/login?reset=${encodeURIComponent(token)}`;
    const { text, html } = buildPasswordResetMail(resetUrl, env.passwordResetTtlMinutes);
    await sendMail({ to: user.email!, subject: 'بازیابی گذرواژه نوآفر', text, html });

    acknowledge();
  }),
);

const resetSchema = z.object({ token: z.string().min(10), password: z.string().min(1) });

authRouter.post(
  '/password/reset',
  rateLimit({
    name: 'reset-ip',
    limit: 20,
    windowSeconds: 60 * 60,
  }),
  asyncRoute(async (req, res) => {
    const parsed = resetSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('پیوند بازیابی یا گذرواژه تازه معتبر نیست.');

    const record = await queryOne<{ id: number; user_id: string }>(
      `SELECT id, user_id FROM password_resets
        WHERE token_hash = $1 AND consumed_at IS NULL AND expires_at > now()`,
      [hashResetToken(parsed.data.token)],
    );
    if (!record) {
      throw badRequest('پیوند بازیابی نامعتبر یا منقضی شده است. دوباره درخواست دهید.');
    }

    const user = await queryOne<UserRow>(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [
      record.user_id,
    ]);
    if (!user) throw badRequest('حساب کاربری یافت نشد.');

    const strength = checkPasswordStrength(parsed.data.password, user.email ?? undefined);
    if (!strength.ok) throw badRequest(strength.message!);

    const passwordHash = await hashPassword(parsed.data.password);
    await transaction(async (client) => {
      // Marking the token consumed inside the transaction makes it single-use
      // even if the same link is opened twice at once.
      const claimed = await client.query(
        `UPDATE password_resets SET consumed_at = now()
          WHERE id = $1 AND consumed_at IS NULL RETURNING id`,
        [record.id],
      );
      if (claimed.rowCount === 0) throw badRequest('این پیوند قبلاً استفاده شده است.');

      await client.query(
        `UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1`,
        [record.user_id, passwordHash],
      );
      // Whoever held the old password is signed out everywhere.
      await client.query(
        `UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`,
        [record.user_id],
      );
    });

    const fresh = await queryOne<UserRow>(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [
      record.user_id,
    ]);
    await issueSession(fresh!, req, res);
  }),
);
