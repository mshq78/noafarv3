import { Router } from 'express';
import { z } from 'zod';
import { queryOne, queryRows } from '../db.js';
import { requireAuth } from '../lib/auth.js';
import { asyncRoute, badRequest, forbidden, notFound } from '../lib/http.js';
import { rateLimit } from '../lib/rateLimit.js';
import { mapSubmission, type SubmissionRow } from '../lib/mappers.js';
import { sanitizePlainText, sanitizeRichText } from '../lib/sanitize.js';
import { awardPoints } from '../lib/points.js';

export const submissionsRouter = Router();

const SUBMISSION_COLUMNS = `s.id, s.kind, s.title, s.summary, s.body, s.field_slug, s.field_name_fa,
  s.region, s.organization, s.key_impact_metric, s.extra, s.tags, s.submitter_id, s.status,
  s.operator_message, s.submitted_at, s.created_at,
  u.display_name AS submitter_name, u.phone AS submitter_phone,
  pc.slug AS published_slug`;

const SUBMISSION_JOINS = `LEFT JOIN users u ON u.id = s.submitter_id
                          LEFT JOIN content pc ON pc.id = s.published_content_id`;

const tagsSchema = z
  .union([z.array(z.string()), z.string()])
  .optional()
  .transform((value) => {
    if (!value) return [] as string[];
    const list = Array.isArray(value) ? value : value.split(',');
    return list.map((tag) => sanitizePlainText(tag, 40)).filter(Boolean).slice(0, 12);
  });

const baseSchema = {
  title: z.string().min(5, 'عنوان باید حداقل ۵ نویسه باشد').max(200),
  fieldSlug: z.string().min(1, 'لطفاً دسته‌بندی موضوعی را انتخاب کنید').max(80),
  fieldNameFa: z.string().max(120).optional(),
  summary: z.string().max(1_200).optional(),
  body: z.string().min(1, 'متن اصلی را وارد کنید').max(60_000),
  tags: tagsSchema,
  /** An `/uploads/...` path the server itself issued. */
  heroImageUrl: z.string().max(500).optional(),
};

/** Only accepts a path this server produced, never an arbitrary URL. */
function toHeroImage(url: string | undefined): Record<string, unknown> | null {
  if (!url || !url.startsWith('/uploads/')) return null;
  return { id: `hero-${Date.now().toString(36)}`, type: 'image', url };
}

const ideaSchema = z.object(baseSchema);

const experienceSchema = z.object({
  ...baseSchema,
  region: z.string().max(120).optional(),
  organization: z.string().max(160).optional(),
  keyImpactMetric: z.string().max(300).optional(),
  year: z.union([z.number(), z.string()]).optional(),
  startingPoint: z.string().max(20_000).optional(),
  path: z.string().max(40_000).optional(),
  challenges: z.string().max(20_000).optional(),
  outcome: z.string().max(20_000).optional(),
});

const submitLimiter = rateLimit({
  name: 'submission',
  limit: 8,
  windowSeconds: 60 * 60,
  key: (req) => req.user?.id ?? 'anon',
  message: 'در یک ساعت گذشته ارسال‌های زیادی ثبت کرده‌اید. لطفاً بعداً دوباره تلاش کنید.',
});

async function loadSubmission(id: string): Promise<SubmissionRow | null> {
  return queryOne<SubmissionRow>(
    `SELECT ${SUBMISSION_COLUMNS} FROM submissions s ${SUBMISSION_JOINS} WHERE s.id = $1`,
    [id],
  );
}

submissionsRouter.post(
  '/idea',
  requireAuth,
  submitLimiter,
  asyncRoute(async (req, res) => {
    const parsed = ideaSchema.safeParse(req.body);
    if (!parsed.success) {
      throw badRequest(parsed.error.issues[0]?.message ?? 'اطلاعات ارسالی کامل نیست.');
    }
    const input = parsed.data;

    const body = sanitizeRichText(input.body, 60_000);
    if (body.replace(/<[^>]*>/g, '').trim().length < 100) {
      throw badRequest('متن ایده باید حداقل شامل ۱۰۰ نویسه توضیح باشد.');
    }

    const heroImage = toHeroImage(input.heroImageUrl);
    const row = await queryOne<{ id: string }>(
      `INSERT INTO submissions (kind, title, summary, body, field_slug, field_name_fa, tags, extra, submitter_id)
            VALUES ('idea', $1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8)
         RETURNING id`,
      [
        sanitizePlainText(input.title, 200),
        sanitizePlainText(input.summary ?? '', 600),
        body,
        sanitizePlainText(input.fieldSlug, 80),
        sanitizePlainText(input.fieldNameFa ?? '', 120) || null,
        JSON.stringify(input.tags),
        JSON.stringify(heroImage ? { heroImage } : {}),
        req.user!.id,
      ],
    );

    await awardPoints({
      userId: req.user!.id,
      reason: 'submit_idea',
      reasonFa: 'ثبت ایده نوآورانه در درگاه جرقه',
      points: 50,
      dedupeKey: `submit_idea:${row!.id}`,
    });

    const saved = await loadSubmission(row!.id);
    res.status(201).json(mapSubmission(saved!));
  }),
);

submissionsRouter.post(
  '/experience',
  requireAuth,
  submitLimiter,
  asyncRoute(async (req, res) => {
    const parsed = experienceSchema.safeParse(req.body);
    if (!parsed.success) {
      throw badRequest(parsed.error.issues[0]?.message ?? 'اطلاعات ارسالی کامل نیست.');
    }
    const input = parsed.data;

    const body = sanitizeRichText(input.body, 60_000);
    if (body.replace(/<[^>]*>/g, '').trim().length < 50) {
      throw badRequest('متن روایت تجربه بیش از حد کوتاه است.');
    }

    const yearNumber = Number(input.year);
    const heroImage = toHeroImage(input.heroImageUrl);
    const extra: Record<string, unknown> = {
      ...(heroImage ? { heroImage } : {}),
      year: Number.isFinite(yearNumber) && yearNumber >= 1300 && yearNumber <= 1420 ? yearNumber : undefined,
      startingPoint: sanitizeRichText(input.startingPoint, 20_000) || undefined,
      path: sanitizeRichText(input.path, 40_000) || undefined,
      challenges: sanitizeRichText(input.challenges, 20_000) || undefined,
      outcome: sanitizeRichText(input.outcome, 20_000) || undefined,
    };

    const row = await queryOne<{ id: string }>(
      `INSERT INTO submissions
              (kind, title, summary, body, field_slug, field_name_fa, region, organization,
               key_impact_metric, tags, extra, submitter_id)
            VALUES ('experience', $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11)
         RETURNING id`,
      [
        sanitizePlainText(input.title, 200),
        sanitizePlainText(input.summary ?? '', 600),
        body,
        sanitizePlainText(input.fieldSlug, 80),
        sanitizePlainText(input.fieldNameFa ?? '', 120) || null,
        sanitizePlainText(input.region ?? '', 120) || null,
        sanitizePlainText(input.organization ?? '', 160) || null,
        sanitizePlainText(input.keyImpactMetric ?? '', 300) || null,
        JSON.stringify(input.tags),
        JSON.stringify(extra),
        req.user!.id,
      ],
    );

    await awardPoints({
      userId: req.user!.id,
      reason: 'submit_experience',
      reasonFa: 'ثبت روایت تجربه میدانی در درگاه سفر',
      points: 100,
      dedupeKey: `submit_experience:${row!.id}`,
    });

    const saved = await loadSubmission(row!.id);
    res.status(201).json(mapSubmission(saved!));
  }),
);

/** Author edits a submission the reviewers sent back. */
submissionsRouter.patch(
  '/:id',
  requireAuth,
  submitLimiter,
  asyncRoute(async (req, res) => {
    const existing = await queryOne<{ submitter_id: string | null; status: string; kind: string }>(
      `SELECT submitter_id, status, kind FROM submissions WHERE id = $1`,
      [req.params.id],
    );
    if (!existing) throw notFound('ارسال مورد نظر یافت نشد.');
    if (existing.submitter_id !== req.user!.id) {
      throw forbidden('فقط ارسال‌کننده می‌تواند این مطلب را ویرایش کند.');
    }
    if (existing.status !== 'needs_revision' && existing.status !== 'pending') {
      throw badRequest('این ارسال در وضعیتی نیست که قابل ویرایش باشد.');
    }

    const input = req.body as Record<string, unknown>;
    const title = input.title === undefined ? null : sanitizePlainText(input.title, 200);
    const summary = input.summary === undefined ? null : sanitizePlainText(input.summary, 600);
    const body = input.body === undefined ? null : sanitizeRichText(input.body, 60_000);

    if (title !== null && title.length < 5) throw badRequest('عنوان باید حداقل ۵ نویسه باشد.');

    await queryOne(
      `UPDATE submissions
          SET title   = COALESCE($2, title),
              summary = COALESCE($3, summary),
              body    = COALESCE($4, body),
              status  = 'pending',
              operator_message = NULL,
              submitted_at = now(),
              updated_at = now()
        WHERE id = $1`,
      [req.params.id, title, summary, body],
    );

    const saved = await loadSubmission(req.params.id);
    res.json(mapSubmission(saved!));
  }),
);

submissionsRouter.get(
  '/mine',
  requireAuth,
  asyncRoute(async (req, res) => {
    const kind = req.query.kind === 'idea' || req.query.kind === 'experience' ? req.query.kind : null;
    const rows = await queryRows<SubmissionRow>(
      `SELECT ${SUBMISSION_COLUMNS}
         FROM submissions s ${SUBMISSION_JOINS}
        WHERE s.submitter_id = $1 AND ($2::text IS NULL OR s.kind = $2)
        ORDER BY s.submitted_at DESC
        LIMIT 200`,
      [req.user!.id, kind],
    );
    const items = rows.map((row) => mapSubmission(row));
    res.json({ items, total: items.length, page: 1, pageSize: items.length, hasMore: false });
  }),
);

export { SUBMISSION_COLUMNS, SUBMISSION_JOINS, loadSubmission };
