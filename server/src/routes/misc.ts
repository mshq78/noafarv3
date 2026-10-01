import { Router } from 'express';
import { z } from 'zod';
import { queryOne, queryRows, transaction } from '../db.js';
import { requireAuth } from '../lib/auth.js';
import { asyncRoute, badRequest, conflict, notFound } from '../lib/http.js';
import { clientIp, rateLimit } from '../lib/rateLimit.js';
import { mapContent, mapRegistration, type ContentRow } from '../lib/mappers.js';
import { CONTENT_COLUMNS, NO_VIEWER_COLUMNS, isSection, viewerColumns } from '../lib/content.js';
import { sanitizeMultilineText, sanitizePlainText } from '../lib/sanitize.js';
import { POINT_VALUES, awardPoints } from '../lib/points.js';
import crypto from 'node:crypto';

export const miscRouter = Router();

// --------------------------------------------------------------- search ----

const SEARCHABLE_SECTIONS = ['academy', 'toolbox', 'library', 'journey', 'gathering', 'spark', 'blog'] as const;

miscRouter.get(
  '/search',
  asyncRoute(async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 120) : '';
    const section = typeof req.query.section === 'string' ? req.query.section : '';
    if (section && !isSection(section)) throw badRequest('بخش انتخابی معتبر نیست.');

    const bySection: Record<string, { count: number; items: unknown[] }> = {};
    for (const key of SEARCHABLE_SECTIONS) bySection[key] = { count: 0, items: [] };

    if (!q) {
      res.json({ total: 0, bySection });
      return;
    }

    const like = `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
    const params: unknown[] = [like, section];
    let viewer = NO_VIEWER_COLUMNS;
    if (req.user) {
      params.push(req.user.id);
      viewer = viewerColumns(params.length);
    }

    const rows = await queryRows<ContentRow>(
      `SELECT ${CONTENT_COLUMNS}, ${viewer}
         FROM content c
        WHERE c.status = 'published'
          AND ($2::text = '' OR c.section = $2)
          AND (c.title ILIKE $1 ESCAPE '\\'
            OR c.summary ILIKE $1 ESCAPE '\\'
            OR EXISTS (
                 SELECT 1 FROM jsonb_array_elements(c.tags) AS tag
                  WHERE tag->>'nameFa' ILIKE $1 ESCAPE '\\'))
        ORDER BY c.published_at DESC
        LIMIT 120`,
      params,
    );

    let total = 0;
    for (const row of rows) {
      const bucket = bySection[row.section];
      if (!bucket) continue;
      bucket.items.push(mapContent(row));
      bucket.count += 1;
      total += 1;
    }

    res.json({ total, bySection });
  }),
);

// ----------------------------------------------------------------- blog ----

miscRouter.get(
  '/blog',
  asyncRoute(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(24, Math.max(1, Number(req.query.pageSize) || 12));

    const params: unknown[] = [];
    let viewer = NO_VIEWER_COLUMNS;
    if (req.user) {
      params.push(req.user.id);
      viewer = viewerColumns(params.length);
    }
    params.push(pageSize, (page - 1) * pageSize);

    const rows = await queryRows<ContentRow>(
      `SELECT ${CONTENT_COLUMNS}, ${viewer}
         FROM content c
        WHERE c.section = 'blog' AND c.status = 'published'
        ORDER BY c.published_at DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    res.json(rows.map(mapContent));
  }),
);

miscRouter.get(
  '/blog/:slug',
  asyncRoute(async (req, res) => {
    const params: unknown[] = [req.params.slug];
    let viewer = NO_VIEWER_COLUMNS;
    if (req.user) {
      params.push(req.user.id);
      viewer = viewerColumns(params.length);
    }
    const row = await queryOne<ContentRow>(
      `SELECT ${CONTENT_COLUMNS}, ${viewer}
         FROM content c
        WHERE c.section = 'blog' AND c.slug = $1 AND c.status = 'published'`,
      params,
    );
    if (!row) throw notFound('مطلب بلاگ یافت نشد.');
    res.json(mapContent(row));
  }),
);

// -------------------------------------------------------------- contact ----

const contactSchema = z.object({
  name: z.string().min(2, 'نام باید حداقل ۲ نویسه باشد').max(120),
  phone: z.string().min(3, 'راه ارتباطی را وارد کنید').max(160),
  subject: z.string().max(160).optional(),
  message: z.string().min(10, 'پیام باید حداقل ۱۰ نویسه باشد').max(8_000),
});

miscRouter.post(
  '/contact',
  rateLimit({
    name: 'contact',
    limit: 5,
    windowSeconds: 60 * 60,
    message: 'در یک ساعت گذشته پیام‌های زیادی ارسال شده است. لطفاً بعداً دوباره تلاش کنید.',
  }),
  asyncRoute(async (req, res) => {
    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) {
      throw badRequest(parsed.error.issues[0]?.message ?? 'اطلاعات فرم کامل نیست.');
    }

    const contact = sanitizePlainText(parsed.data.phone, 160);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact);
    const digits = contact.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776)).replace(/\D/g, '');
    if (!isEmail && !/^09\d{9}$/.test(digits)) {
      throw badRequest('لطفاً یک شماره موبایل معتبر (۰۹...) یا نشانی رایانامه وارد کنید.');
    }

    // Stored as plain text: this content is rendered in the admin panel and
    // must never be able to carry markup.
    const row = await queryOne<{ id: string }>(
      `INSERT INTO contact_messages (name, phone_or_email, subject, message, request_ip)
            VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
      [
        sanitizePlainText(parsed.data.name, 120),
        isEmail ? contact : digits,
        sanitizePlainText(parsed.data.subject ?? 'پیام از سایت', 160),
        sanitizeMultilineText(parsed.data.message, 8_000),
        clientIp(req),
      ],
    );

    res.status(201).json({ success: true, id: row!.id });
  }),
);

// --------------------------------------------------------------- events ----

miscRouter.post(
  '/events/:id/register',
  requireAuth,
  rateLimit({
    name: 'event-register',
    limit: 20,
    windowSeconds: 60 * 60,
    key: (req) => req.user?.id ?? 'anon',
  }),
  asyncRoute(async (req, res) => {
    const registration = await transaction(async (client) => {
      const event = await client.query<{ id: string; title: string; data: Record<string, unknown> }>(
        `SELECT id, title, data FROM content
          WHERE id = $1 AND section = 'gathering' AND status = 'published'
          FOR UPDATE`,
        [req.params.id],
      );
      const row = event.rows[0];
      if (!row) throw notFound('رویداد مورد نظر یافت نشد.');
      if (row.data?.status === 'past') throw conflict('این رویداد برگزار شده است.');

      const existing = await client.query<Parameters<typeof mapRegistration>[0]>(
        `SELECT r.id, r.event_id, r.user_id, r.ticket_code, r.status, r.registered_at
           FROM event_registrations r
          WHERE r.event_id = $1 AND r.user_id = $2 AND r.status = 'confirmed'`,
        [row.id, req.user!.id],
      );
      if (existing.rows[0]) return { row: existing.rows[0], created: false, title: row.title };

      const capacity = Number(row.data?.capacity);
      if (Number.isFinite(capacity) && capacity > 0) {
        const taken = await client.query<{ count: number }>(
          `SELECT COUNT(*)::int AS count FROM event_registrations
            WHERE event_id = $1 AND status = 'confirmed'`,
          [row.id],
        );
        if ((taken.rows[0]?.count ?? 0) >= capacity) {
          throw conflict('ظرفیت این رویداد تکمیل شده است.');
        }
      }

      const ticket = `NOAFAR-${crypto.randomInt(1_000, 10_000)}-${crypto
        .randomBytes(2)
        .toString('hex')
        .toUpperCase()}`;

      const inserted = await client.query<Parameters<typeof mapRegistration>[0]>(
        `INSERT INTO event_registrations (event_id, user_id, ticket_code)
              VALUES ($1, $2, $3)
           RETURNING id, event_id, user_id, ticket_code, status, registered_at`,
        [row.id, req.user!.id, ticket],
      );
      return { row: inserted.rows[0]!, created: true, title: row.title };
    });

    if (registration.created) {
      await awardPoints({
        userId: req.user!.id,
        reason: 'event_register',
        reasonFa: `ثبت‌نام در رویداد «${registration.title}»`,
        points: POINT_VALUES.event_register,
        dedupeKey: `event:${req.params.id}`,
      });
    }

    const me = await queryOne<{ display_name: string; phone: string }>(
      `SELECT display_name, phone FROM users WHERE id = $1`,
      [req.user!.id],
    );

    res.status(registration.created ? 201 : 200).json(
      mapRegistration({
        ...registration.row,
        event_title: registration.title,
        user_name: me?.display_name ?? '',
        user_phone: me?.phone ?? '',
      }),
    );
  }),
);

// ------------------------------------------------------------- settings ----

export const PUBLIC_SETTINGS_KEYS = [
  'logoUrl',
  'heroTitle',
  'heroSubtitle',
  'aboutText',
  'contactEmail',
  'contactPhone',
  'contactAddress',
  'footerDescription',
  'footerCopyright',
  // Social profiles shown in the footer; each is optional and the footer
  // renders only the ones that carry a value.
  'instagramUrl',
  'telegramUrl',
  'aparatUrl',
  'linkedinUrl',
] as const;

miscRouter.get(
  '/settings',
  asyncRoute(async (_req, res) => {
    const row = await queryOne<{ data: Record<string, unknown> }>(
      `SELECT data FROM site_settings WHERE id = 1`,
    );
    const data = row?.data ?? {};
    const result: Record<string, unknown> = {};
    for (const key of PUBLIC_SETTINGS_KEYS) {
      if (data[key] !== undefined) result[key] = data[key];
    }
    res.json(result);
  }),
);

// --------------------------------------------------------------- courses ---

const progressSchema = z.object({
  percent: z.number().min(0).max(100),
  positionSeconds: z.number().min(0).max(60 * 60 * 24).optional(),
  completedLessons: z.array(z.string().max(120)).max(500).optional(),
});

miscRouter.post(
  '/courses/:id/progress',
  requireAuth,
  rateLimit({
    name: 'course-progress',
    limit: 240,
    windowSeconds: 10 * 60,
    key: (req) => req.user?.id ?? 'anon',
  }),
  asyncRoute(async (req, res) => {
    const parsed = progressSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('اطلاعات پیشرفت دوره معتبر نیست.');

    const course = await queryOne<{ id: string; title: string }>(
      `SELECT id, title FROM content WHERE id = $1 AND section = 'academy'`,
      [req.params.id],
    );
    if (!course) throw notFound('دوره مورد نظر یافت نشد.');

    const percent = Math.round(parsed.data.percent);
    const saved = await queryOne<{ percent: number; completed_at: Date | null }>(
      `INSERT INTO course_progress (user_id, course_id, percent, position_seconds, completed_lessons, completed_at)
            VALUES ($1, $2, $3, $4, $5::jsonb, CASE WHEN $3 >= 100 THEN now() ELSE NULL END)
       ON CONFLICT (user_id, course_id) DO UPDATE
              SET percent = GREATEST(course_progress.percent, EXCLUDED.percent),
                  position_seconds = EXCLUDED.position_seconds,
                  completed_lessons = EXCLUDED.completed_lessons,
                  completed_at = COALESCE(course_progress.completed_at, EXCLUDED.completed_at),
                  updated_at = now()
        RETURNING percent, completed_at`,
      [
        req.user!.id,
        course.id,
        percent,
        Math.round(parsed.data.positionSeconds ?? 0),
        JSON.stringify(parsed.data.completedLessons ?? []),
      ],
    );

    if (saved && saved.percent >= 100) {
      await awardPoints({
        userId: req.user!.id,
        reason: 'complete_course',
        reasonFa: `اتمام موفقیت‌آمیز دوره «${course.title}»`,
        points: 40,
        dedupeKey: `course:${course.id}`,
      });
    }

    res.json({ success: true, percent: saved?.percent ?? percent });
  }),
);
