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
import { asyncRoute, badRequest, tooManyRequests, unauthorized } from '../lib/http.js';
import { clientIp, consume, rateLimit } from '../lib/rateLimit.js';
import { mapUser, type UserRow } from '../lib/mappers.js';
import { sanitizePlainText } from '../lib/sanitize.js';
import { sendOtpSms } from '../lib/sms.js';
import { awardPoints } from '../lib/points.js';

export const authRouter = Router();

const USER_COLUMNS = `id, phone, display_name, national_id, birth_year, city, interests,
                      role, avatar_url, bio, points, profile_complete, is_blocked, joined_at`;

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
