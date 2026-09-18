import { Router } from 'express';
import { z } from 'zod';
import { query, queryOne, queryRows, transaction } from '../db.js';
import { requireAdmin, requireOperator, revokeAllSessionsForUser } from '../lib/auth.js';
import { asyncRoute, badRequest, forbidden, notFound } from '../lib/http.js';
import {
  mapComment,
  mapContactMessage,
  mapContent,
  mapRegistration,
  mapSubmission,
  mapUser,
  type CommentRow,
  type ContentRow,
  type SubmissionRow,
  type UserRow,
} from '../lib/mappers.js';
import { CONTENT_COLUMNS, NO_VIEWER_COLUMNS, isSection, uniqueSlug } from '../lib/content.js';
import {
  sanitizeMultilineText,
  sanitizePlainText,
  sanitizeRichText,
  sanitizeUrl,
} from '../lib/sanitize.js';
import { awardPoints } from '../lib/points.js';
import { PUBLIC_SETTINGS_KEYS } from './misc.js';

export const adminRouter = Router();

// Everything below requires at least operator rights.
adminRouter.use(requireOperator);

const SUBMISSION_COLUMNS = `s.id, s.kind, s.title, s.summary, s.body, s.field_slug, s.field_name_fa,
  s.region, s.organization, s.key_impact_metric, s.extra, s.tags, s.submitter_id, s.status,
  s.operator_message, s.submitted_at, s.created_at,
  u.display_name AS submitter_name, u.phone AS submitter_phone, pc.slug AS published_slug`;
const SUBMISSION_JOINS = `LEFT JOIN users u ON u.id = s.submitter_id
                          LEFT JOIN content pc ON pc.id = s.published_content_id`;

// ================================================================ content ===

adminRouter.get(
  '/content',
  asyncRoute(async (req, res) => {
    const section = typeof req.query.section === 'string' ? req.query.section : '';
    if (section && !isSection(section)) throw badRequest('بخش انتخابی معتبر نیست.');
    const search = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const like = search ? `%${search.replace(/[%_\\]/g, (m) => `\\${m}`)}%` : '';

    const rows = await queryRows<ContentRow>(
      `SELECT ${CONTENT_COLUMNS}, ${NO_VIEWER_COLUMNS}
         FROM content c
        WHERE ($1::text = '' OR c.section = $1)
          AND ($2::text = '' OR c.title ILIKE $2 ESCAPE '\\' OR c.summary ILIKE $2 ESCAPE '\\')
        ORDER BY c.updated_at DESC
        LIMIT 500`,
      [section, like],
    );
    res.json(rows.map(mapContent));
  }),
);

const mediaSchema = z
  .object({
    id: z.string().max(120).optional(),
    type: z.enum(['image', 'video', 'audio', 'pdf', 'document']).optional(),
    url: z.string().max(2_000),
    thumbnailUrl: z.string().max(2_000).optional(),
    fileName: z.string().max(300).optional(),
    fileSizeBytes: z.number().optional(),
    caption: z.string().max(400).optional(),
  })
  .transform((value, ctx) => {
    const url = sanitizeUrl(value.url, { allowData: true });
    if (!url) {
      ctx.addIssue({ code: 'custom', message: 'نشانی فایل معتبر نیست.' });
      return z.NEVER;
    }
    return {
      id: value.id ?? `media-${Date.now().toString(36)}`,
      type: value.type ?? 'image',
      url,
      thumbnailUrl: value.thumbnailUrl ? sanitizeUrl(value.thumbnailUrl, { allowData: true }) : undefined,
      fileName: value.fileName ? sanitizePlainText(value.fileName, 300) : undefined,
      fileSizeBytes: value.fileSizeBytes,
      caption: value.caption ? sanitizePlainText(value.caption, 400) : undefined,
    };
  });

const contentSchema = z.object({
  title: z.string().min(2, 'عنوان را وارد کنید').max(300),
  slug: z.string().max(140).optional(),
  summary: z.string().max(2_000).optional(),
  body: z.string().max(200_000).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  publishedAt: z.string().max(60).optional(),
  category: z
    .object({ id: z.string().max(80).optional(), slug: z.string().max(80), nameFa: z.string().max(160) })
    .optional(),
  tags: z.array(z.union([z.string().max(60), z.object({ nameFa: z.string().max(60) })])).max(20).optional(),
  heroImage: mediaSchema.optional(),
  gallery: z.array(mediaSchema).max(30).optional(),
  attachments: z.array(mediaSchema).max(30).optional(),
  author: z.union([z.string().max(160), z.object({ displayName: z.string().max(160) })]).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

/** Section-specific fields we accept into `data`, with their sanitisers. */
const DATA_FIELD_SANITISERS: Record<string, (value: unknown) => unknown> = {
  // academy
  videoUrl: (v) => sanitizeUrl(v),
  posterUrl: (v) => sanitizeUrl(v),
  durationSeconds: (v) => clampNumber(v, 0, 60 * 60 * 60),
  durationMinutes: (v) => clampNumber(v, 0, 60 * 60),
  lessonsCount: (v) => clampNumber(v, 0, 500),
  level: (v) => sanitizePlainText(v, 80),
  duration: (v) => sanitizePlainText(v, 80),
  syllabus: sanitizeSyllabus,
  // toolbox
  stage: sanitizeCategory,
  format: (v) => sanitizePlainText(v, 40),
  difficulty: (v) => sanitizePlainText(v, 40),
  estimatedMinutes: (v) => clampNumber(v, 0, 10_000),
  printablePdfUrl: (v) => sanitizeUrl(v),
  supportsDigitalCanvas: (v) => Boolean(v),
  // library
  kind: (v) => sanitizePlainText(v, 40),
  coverImage: (v) => sanitizeMedia(v),
  pageCount: (v) => clampNumber(v, 0, 10_000),
  downloadUrl: (v) => sanitizeUrl(v),
  // journey / spark
  field: sanitizeCategory,
  year: (v) => clampNumber(v, 1300, 1420),
  startingPoint: (v) => sanitizeRichText(v, 20_000),
  path: (v) => sanitizeRichText(v, 40_000),
  challenges: (v) => sanitizeRichText(v, 20_000),
  outcome: (v) => sanitizeRichText(v, 20_000),
  keyImpactMetric: (v) => sanitizePlainText(v, 300),
  region: (v) => sanitizePlainText(v, 120),
  organization: (v) => sanitizePlainText(v, 160),
  submittedBy: (v) =>
    v && typeof v === 'object'
      ? {
          id: sanitizePlainText((v as Record<string, unknown>).id, 120),
          displayName: sanitizePlainText((v as Record<string, unknown>).displayName, 160),
        }
      : undefined,
  // gathering
  status: (v) => sanitizePlainText(v, 40),
  startsAt: (v) => sanitizePlainText(v, 60),
  endsAt: (v) => sanitizePlainText(v, 60),
  location: (v) => sanitizePlainText(v, 200),
  capacity: (v) => clampNumber(v, 0, 100_000),
  externalRegistrationUrl: (v) => sanitizeUrl(v),
  report: (v) => sanitizeRichText(v, 60_000),
  // blog
  readingMinutes: (v) => clampNumber(v, 0, 600),
};

function clampNumber(value: unknown, min: number, max: number): number | undefined {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.min(Math.max(Math.round(parsed), min), max);
}

function sanitizeCategory(value: unknown): unknown {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as Record<string, unknown>;
  const slug = sanitizePlainText(raw.slug, 80);
  if (!slug) return undefined;
  return { id: sanitizePlainText(raw.id, 80) || `cat-${slug}`, slug, nameFa: sanitizePlainText(raw.nameFa, 160) };
}

function sanitizeMedia(value: unknown): unknown {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as Record<string, unknown>;
  const url = sanitizeUrl(raw.url, { allowData: true });
  if (!url) return undefined;
  return {
    id: sanitizePlainText(raw.id, 120) || `media-${Date.now().toString(36)}`,
    type: sanitizePlainText(raw.type, 20) || 'image',
    url,
    caption: sanitizePlainText(raw.caption, 400) || undefined,
    fileName: sanitizePlainText(raw.fileName, 300) || undefined,
  };
}

function sanitizeSyllabus(value: unknown): unknown {
  if (!Array.isArray(value)) return undefined;
  return value.slice(0, 300).map((entry, index) => {
    const raw = (entry ?? {}) as Record<string, unknown>;
    return {
      id: sanitizePlainText(raw.id, 120) || `les-${index + 1}`,
      title: sanitizePlainText(raw.title, 240) || `درس ${index + 1}`,
      durationMinutes: clampNumber(raw.durationMinutes, 0, 10_000) ?? 10,
      videoUrl: sanitizeUrl(raw.videoUrl) || undefined,
      description: sanitizePlainText(raw.description, 2_000) || undefined,
    };
  });
}

/**
 * Splits an incoming `data` object into the fields to write and the fields to
 * clear. A key the editor sent but that sanitises to nothing — an emptied
 * video URL, a removed capacity — is a deliberate erasure, so it is reported
 * separately: the update merges `set` and then subtracts `clear`, which is the
 * only way to remove a key from a jsonb column that is otherwise merged.
 */
function buildDataPayload(input: Record<string, unknown> | undefined): {
  set: Record<string, unknown>;
  clear: string[];
} {
  const set: Record<string, unknown> = {};
  const clear: string[] = [];
  for (const [key, value] of Object.entries(input ?? {})) {
    const sanitiser = DATA_FIELD_SANITISERS[key];
    if (!sanitiser) continue; // unknown keys are dropped, never stored blindly
    const clean = sanitiser(value);
    if (clean !== undefined && clean !== '' && clean !== null) set[key] = clean;
    else clear.push(key);
  }
  return { set, clear };
}

function normaliseTags(tags: z.infer<typeof contentSchema>['tags']): { id: string; nameFa: string }[] {
  return (tags ?? [])
    .map((tag, index) => {
      const nameFa = sanitizePlainText(typeof tag === 'string' ? tag : tag.nameFa, 60);
      return nameFa ? { id: `t-${index + 1}`, nameFa } : null;
    })
    .filter((tag): tag is { id: string; nameFa: string } => tag !== null);
}

function normaliseAuthor(author: z.infer<typeof contentSchema>['author']): unknown {
  if (author === undefined) return undefined;
  if (typeof author === 'string') return sanitizePlainText(author, 160) || undefined;
  const displayName = sanitizePlainText(author.displayName, 160);
  return displayName ? { displayName } : undefined;
}

function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

adminRouter.post(
  '/content',
  asyncRoute(async (req, res) => {
    const section = (req.body as { section?: unknown }).section;
    if (!isSection(section)) throw badRequest('بخش انتخابی معتبر نیست.');

    const parsed = contentSchema.safeParse((req.body as { content?: unknown }).content ?? req.body);
    if (!parsed.success) {
      throw badRequest(parsed.error.issues[0]?.message ?? 'اطلاعات محتوا کامل نیست.');
    }
    const input = parsed.data;

    const slug = await uniqueSlug(section, input.slug || input.title);
    const row = await queryOne<ContentRow>(
      `INSERT INTO content
              (section, slug, title, summary, body, hero_image, gallery, attachments,
               category, tags, author, data, status, published_at)
            VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb,
                    $9::jsonb, $10::jsonb, $11::jsonb, $12::jsonb, $13, COALESCE($14, now()))
         RETURNING ${CONTENT_COLUMNS.replace(/c\./g, '')}`,
      [
        section,
        slug,
        sanitizePlainText(input.title, 300),
        sanitizePlainText(input.summary ?? '', 2_000),
        sanitizeRichText(input.body ?? '', 200_000),
        input.heroImage ? JSON.stringify(input.heroImage) : null,
        JSON.stringify(input.gallery ?? []),
        JSON.stringify(input.attachments ?? []),
        input.category ? JSON.stringify(sanitizeCategory(input.category)) : null,
        JSON.stringify(normaliseTags(input.tags)),
        JSON.stringify(normaliseAuthor(input.author) ?? null),
        JSON.stringify(buildDataPayload(input.data).set),
        input.status ?? 'published',
        parseDate(input.publishedAt),
      ],
    );

    res.status(201).json(mapContent({ ...row!, is_liked_by_me: false, is_bookmarked_by_me: false }));
  }),
);

adminRouter.patch(
  '/content/:id',
  asyncRoute(async (req, res) => {
    const existing = await queryOne<{ id: string; section: string; slug: string }>(
      `SELECT id, section, slug FROM content WHERE id = $1`,
      [req.params.id],
    );
    if (!existing) throw notFound('محتوای مورد نظر یافت نشد.');

    const parsed = contentSchema.partial({ title: true }).safeParse(req.body);
    if (!parsed.success) {
      throw badRequest(parsed.error.issues[0]?.message ?? 'اطلاعات محتوا معتبر نیست.');
    }
    const input = parsed.data;

    let slug: string | null = null;
    if (input.slug && input.slug !== existing.slug) {
      slug = await uniqueSlug(existing.section, input.slug);
    }

    const dataPayload = buildDataPayload(input.data);

    const row = await queryOne<ContentRow>(
      `UPDATE content
          SET title       = COALESCE($2, title),
              slug        = COALESCE($3, slug),
              summary     = COALESCE($4, summary),
              body        = COALESCE($5, body),
              hero_image  = COALESCE($6::jsonb, hero_image),
              gallery     = COALESCE($7::jsonb, gallery),
              attachments = COALESCE($8::jsonb, attachments),
              category    = COALESCE($9::jsonb, category),
              tags        = COALESCE($10::jsonb, tags),
              author      = COALESCE($11::jsonb, author),
              -- Merge so a partial edit never wipes untouched section fields,
              -- then subtract the keys the editor deliberately emptied —
              -- without the subtraction a field could be changed but never
              -- removed.
              data        = (data || COALESCE($12::jsonb, '{}'::jsonb)) - $15::text[],
              status      = COALESCE($13, status),
              published_at = COALESCE($14, published_at),
              updated_at  = now()
        WHERE id = $1
    RETURNING ${CONTENT_COLUMNS.replace(/c\./g, '')}`,
      [
        existing.id,
        input.title === undefined ? null : sanitizePlainText(input.title, 300),
        slug,
        input.summary === undefined ? null : sanitizePlainText(input.summary, 2_000),
        input.body === undefined ? null : sanitizeRichText(input.body, 200_000),
        input.heroImage ? JSON.stringify(input.heroImage) : null,
        input.gallery ? JSON.stringify(input.gallery) : null,
        input.attachments ? JSON.stringify(input.attachments) : null,
        input.category ? JSON.stringify(sanitizeCategory(input.category)) : null,
        input.tags ? JSON.stringify(normaliseTags(input.tags)) : null,
        input.author === undefined ? null : JSON.stringify(normaliseAuthor(input.author) ?? null),
        input.data ? JSON.stringify(dataPayload.set) : null,
        input.status ?? null,
        parseDate(input.publishedAt),
        input.data ? dataPayload.clear : [],
      ],
    );

    res.json(mapContent({ ...row!, is_liked_by_me: false, is_bookmarked_by_me: false }));
  }),
);

adminRouter.delete(
  '/content/:id',
  asyncRoute(async (req, res) => {
    const result = await query(`DELETE FROM content WHERE id = $1`, [req.params.id]);
    if (result.rowCount === 0) throw notFound('محتوای مورد نظر یافت نشد.');
    res.json({ success: true });
  }),
);

// ============================================================ submissions ===

adminRouter.get(
  '/submissions',
  asyncRoute(async (req, res) => {
    const status = typeof req.query.status === 'string' && req.query.status !== 'all' ? req.query.status : '';
    const rows = await queryRows<SubmissionRow>(
      `SELECT ${SUBMISSION_COLUMNS}
         FROM submissions s ${SUBMISSION_JOINS}
        WHERE ($1::text = '' OR s.status = $1)
        ORDER BY s.submitted_at DESC
        LIMIT 500`,
      [status],
    );
    res.json(rows.map((row) => mapSubmission(row, { includeSubmitterPhone: true })));
  }),
);

const moderationSchema = z.object({ operatorMessage: z.string().max(2_000).optional() });

adminRouter.post(
  '/submissions/:id/approve',
  asyncRoute(async (req, res) => {
    const parsed = moderationSchema.safeParse(req.body ?? {});
    const message =
      sanitizeMultilineText(parsed.success ? parsed.data.operatorMessage : '', 2_000) ||
      'محتوای شما تایید و در سایت منتشر شد.';

    const submissionId = req.params.id;
    const publishedId = await transaction(async (client) => {
      const found = await client.query<SubmissionRow & { published_content_id: string | null }>(
        `SELECT s.*, u.display_name AS submitter_name
           FROM submissions s LEFT JOIN users u ON u.id = s.submitter_id
          WHERE s.id = $1 FOR UPDATE OF s`,
        [submissionId],
      );
      const submission = found.rows[0];
      if (!submission) throw notFound('ارسال مورد نظر یافت نشد.');
      if (submission.published_content_id) {
        await client.query(
          `UPDATE submissions SET status = 'approved', operator_message = $2, updated_at = now()
            WHERE id = $1`,
          [submissionId, message],
        );
        return submission.published_content_id;
      }

      const section = submission.kind === 'idea' ? 'spark' : 'journey';
      const extra = (submission.extra ?? {}) as Record<string, unknown>;
      const data: Record<string, unknown> = {
        ...extra,
        field: {
          id: `f-${submission.field_slug ?? 'general'}`,
          slug: submission.field_slug ?? 'general',
          nameFa: submission.field_name_fa ?? 'عمومی',
        },
        submittedBy: submission.submitter_id
          ? { id: submission.submitter_id, displayName: submission.submitter_name ?? '' }
          : undefined,
      };
      if (submission.kind === 'experience') {
        data.region = submission.region ?? undefined;
        data.organization = submission.organization ?? undefined;
        data.keyImpactMetric = submission.key_impact_metric ?? undefined;
        data.year = extra.year ?? 1403;
      }

      const slugBase = submission.title || `p-${Date.now().toString(36)}`;
      const slugValue = await uniqueSlugInTx(client, section, slugBase);

      // The submitter's uploaded image becomes the published hero image.
      const heroImage = (extra.heroImage as Record<string, unknown> | undefined) ?? null;
      delete data.heroImage;

      const created = await client.query<{ id: string }>(
        `INSERT INTO content (section, slug, title, summary, body, category, tags, data, author, hero_image, status)
              VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb, $10::jsonb, 'published')
           RETURNING id`,
        [
          section,
          slugValue,
          submission.title,
          submission.summary,
          submission.body,
          JSON.stringify({
            id: `f-${submission.field_slug ?? 'general'}`,
            slug: submission.field_slug ?? 'general',
            nameFa: submission.field_name_fa ?? 'عمومی',
          }),
          JSON.stringify(submission.tags ?? []),
          JSON.stringify(data),
          JSON.stringify(
            submission.submitter_id ? { displayName: submission.submitter_name ?? '' } : null,
          ),
          heroImage ? JSON.stringify(heroImage) : null,
        ],
      );

      await client.query(
        `UPDATE submissions
            SET status = 'approved', operator_message = $2,
                published_content_id = $3, updated_at = now()
          WHERE id = $1`,
        [submissionId, message, created.rows[0]!.id],
      );

      return created.rows[0]!.id;
    });

    const saved = await queryOne<SubmissionRow>(
      `SELECT ${SUBMISSION_COLUMNS} FROM submissions s ${SUBMISSION_JOINS} WHERE s.id = $1`,
      [submissionId],
    );
    res.json({ ...mapSubmission(saved!, { includeSubmitterPhone: true }), publishedContentId: publishedId });
  }),
);

async function uniqueSlugInTx(
  client: { query: (text: string, params: unknown[]) => Promise<{ rows: unknown[] }> },
  section: string,
  desired: string,
): Promise<string> {
  const base =
    desired
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^\p{Letter}\p{Number}-]/gu, '')
      .replace(/-{2,}/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 90) || `p-${Date.now().toString(36)}`;

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const clash = await client.query(`SELECT 1 FROM content WHERE section = $1 AND slug = $2`, [
      section,
      candidate,
    ]);
    if (clash.rows.length === 0) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

for (const [path, status, fallback] of [
  ['revision', 'needs_revision', 'لطفاً موارد خواسته‌شده را اصلاح و دوباره ارسال کنید.'],
  ['reject', 'rejected', 'متاسفانه این طرح با معیارهای انتشار نوآفر همخوانی نداشت.'],
] as const) {
  adminRouter.post(
    `/submissions/:id/${path}`,
    asyncRoute(async (req, res) => {
      const parsed = moderationSchema.safeParse(req.body ?? {});
      const message =
        sanitizeMultilineText(parsed.success ? parsed.data.operatorMessage : '', 2_000) || fallback;

      const updated = await queryOne<{ id: string }>(
        `UPDATE submissions SET status = $2, operator_message = $3, updated_at = now()
          WHERE id = $1 RETURNING id`,
        [req.params.id, status, message],
      );
      if (!updated) throw notFound('ارسال مورد نظر یافت نشد.');

      const saved = await queryOne<SubmissionRow>(
        `SELECT ${SUBMISSION_COLUMNS} FROM submissions s ${SUBMISSION_JOINS} WHERE s.id = $1`,
        [req.params.id],
      );
      res.json(mapSubmission(saved!, { includeSubmitterPhone: true }));
    }),
  );
}

// =============================================================== comments ===

adminRouter.get(
  '/comments',
  asyncRoute(async (_req, res) => {
    const rows = await queryRows<CommentRow>(
      `SELECT cm.id, cm.content_id, cm.body, cm.status, cm.created_at, cm.author_id,
              u.display_name AS author_display_name, u.avatar_url AS author_avatar_url,
              c.title AS content_title
         FROM comments cm
    LEFT JOIN users u ON u.id = cm.author_id
         JOIN content c ON c.id = cm.content_id
        ORDER BY cm.created_at DESC
        LIMIT 500`,
    );
    res.json(rows.map(mapComment));
  }),
);

adminRouter.post(
  '/comments/:id/approve',
  asyncRoute(async (req, res) => {
    await transaction(async (client) => {
      const updated = await client.query<{ id: string; author_id: string | null; content_id: string }>(
        `UPDATE comments SET status = 'approved', updated_at = now()
          WHERE id = $1 AND status <> 'approved'
      RETURNING id, author_id, content_id`,
        [req.params.id],
      );
      if (updated.rowCount === 0) return;

      const row = updated.rows[0]!;
      await client.query(
        `UPDATE content SET comment_count = comment_count + 1 WHERE id = $1`,
        [row.content_id],
      );

      // Awarded on the same connection as the approval: a crash between the
      // two would otherwise leave an approved comment whose author never got
      // the points, with nothing to retry from.
      if (row.author_id) {
        await awardPoints({
          userId: row.author_id,
          reason: 'comment',
          reasonFa: 'ثبت دیدگاه معتبر',
          points: 15,
          dedupeKey: `comment:${row.id}`,
          client,
        });
      }
    });
    res.json({ success: true });
  }),
);

adminRouter.delete(
  '/comments/:id',
  asyncRoute(async (req, res) => {
    await transaction(async (client) => {
      const removed = await client.query<{ content_id: string; status: string }>(
        `DELETE FROM comments WHERE id = $1 RETURNING content_id, status`,
        [req.params.id],
      );
      if (removed.rowCount === 0) throw notFound('دیدگاه مورد نظر یافت نشد.');
      if (removed.rows[0]!.status === 'approved') {
        await client.query(
          `UPDATE content SET comment_count = GREATEST(0, comment_count - 1) WHERE id = $1`,
          [removed.rows[0]!.content_id],
        );
      }
    });
    res.json({ success: true });
  }),
);

// ======================================================== contact messages ==

adminRouter.get(
  '/contact-messages',
  asyncRoute(async (_req, res) => {
    const rows = await queryRows<Parameters<typeof mapContactMessage>[0]>(
      `SELECT id, name, phone_or_email, subject, message, status, admin_notes, created_at
         FROM contact_messages ORDER BY created_at DESC LIMIT 500`,
    );
    res.json(rows.map(mapContactMessage));
  }),
);

adminRouter.patch(
  '/contact-messages/:id',
  asyncRoute(async (req, res) => {
    const schema = z.object({
      status: z.enum(['unread', 'read', 'replied']),
      note: z.string().max(4_000).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw badRequest('وضعیت انتخابی معتبر نیست.');

    const updated = await queryOne<{ id: string }>(
      `UPDATE contact_messages
          SET status = $2,
              admin_notes = COALESCE($3, admin_notes),
              updated_at = now()
        WHERE id = $1 RETURNING id`,
      [
        req.params.id,
        parsed.data.status,
        parsed.data.note === undefined ? null : sanitizeMultilineText(parsed.data.note, 4_000),
      ],
    );
    if (!updated) throw notFound('پیام مورد نظر یافت نشد.');
    res.json({ success: true });
  }),
);

adminRouter.delete(
  '/contact-messages/:id',
  asyncRoute(async (req, res) => {
    const result = await query(`DELETE FROM contact_messages WHERE id = $1`, [req.params.id]);
    if (result.rowCount === 0) throw notFound('پیام مورد نظر یافت نشد.');
    res.json({ success: true });
  }),
);

// ==================================================== event registrations ===

adminRouter.get(
  '/event-registrations',
  asyncRoute(async (_req, res) => {
    const rows = await queryRows<Parameters<typeof mapRegistration>[0]>(
      `SELECT r.id, r.event_id, r.user_id, r.ticket_code, r.status, r.registered_at,
              c.title AS event_title, u.display_name AS user_name, u.phone AS user_phone
         FROM event_registrations r
         JOIN content c ON c.id = r.event_id
         JOIN users u ON u.id = r.user_id
        ORDER BY r.registered_at DESC LIMIT 1000`,
    );
    res.json(rows.map(mapRegistration));
  }),
);

// ================================================================== users ===

const USER_COLUMNS = `id, phone, email, display_name, national_id, birth_year, city, interests,
                      role, avatar_url, bio, points, profile_complete, is_blocked, joined_at`;

adminRouter.get(
  '/users',
  asyncRoute(async (_req, res) => {
    const rows = await queryRows<UserRow>(
      `SELECT ${USER_COLUMNS} FROM users ORDER BY created_at DESC LIMIT 1000`,
    );
    res.json(rows.map(mapUser));
  }),
);

/** Only an admin may change roles, and never their own (no self-lockout/escalation). */
adminRouter.patch(
  '/users/:id/role',
  requireAdmin,
  asyncRoute(async (req, res) => {
    const schema = z.object({ role: z.enum(['member', 'operator', 'admin']) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw badRequest('نقش انتخابی معتبر نیست.');
    if (req.params.id === req.user!.id) throw forbidden('تغییر نقش حساب خودتان ممکن نیست.');

    const updated = await queryOne<{ id: string }>(
      `UPDATE users SET role = $2, updated_at = now() WHERE id = $1 RETURNING id`,
      [req.params.id, parsed.data.role],
    );
    if (!updated) throw notFound('کاربر مورد نظر یافت نشد.');

    // Force a fresh login so the new role takes effect immediately everywhere.
    await revokeAllSessionsForUser(req.params.id);
    res.json({ success: true });
  }),
);

adminRouter.post(
  '/users/:id/points',
  requireAdmin,
  asyncRoute(async (req, res) => {
    const schema = z.object({
      points: z.number().int().min(-10_000).max(10_000),
      reasonFa: z.string().min(1).max(300),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw badRequest('مقدار امتیاز یا دلیل آن معتبر نیست.');

    const target = await queryOne<{ id: string }>(`SELECT id FROM users WHERE id = $1`, [req.params.id]);
    if (!target) throw notFound('کاربر مورد نظر یافت نشد.');

    await awardPoints({
      userId: req.params.id,
      reason: 'admin_grant',
      reasonFa: sanitizePlainText(parsed.data.reasonFa, 300),
      points: parsed.data.points,
    });
    res.json({ success: true });
  }),
);

adminRouter.patch(
  '/users/:id/block',
  requireAdmin,
  asyncRoute(async (req, res) => {
    const schema = z.object({ blocked: z.boolean() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw badRequest('درخواست معتبر نیست.');
    if (req.params.id === req.user!.id) throw forbidden('مسدود کردن حساب خودتان ممکن نیست.');

    const updated = await queryOne<{ id: string }>(
      `UPDATE users SET is_blocked = $2, updated_at = now() WHERE id = $1 RETURNING id`,
      [req.params.id, parsed.data.blocked],
    );
    if (!updated) throw notFound('کاربر مورد نظر یافت نشد.');
    if (parsed.data.blocked) await revokeAllSessionsForUser(req.params.id);
    res.json({ success: true });
  }),
);

// =============================================================== settings ===

adminRouter.get(
  '/settings',
  asyncRoute(async (_req, res) => {
    const row = await queryOne<{ data: Record<string, unknown> }>(
      `SELECT data FROM site_settings WHERE id = 1`,
    );
    res.json(row?.data ?? {});
  }),
);

/** Settings whose value is a link, so it is validated as one. */
const URL_SETTINGS = new Set(['logoUrl', 'instagramUrl', 'telegramUrl', 'aparatUrl', 'linkedinUrl']);

adminRouter.put(
  '/settings',
  asyncRoute(async (req, res) => {
    const incoming = (req.body ?? {}) as Record<string, unknown>;
    const clean: Record<string, unknown> = {};
    for (const key of PUBLIC_SETTINGS_KEYS) {
      if (incoming[key] === undefined) continue;
      clean[key] = URL_SETTINGS.has(key)
        ? sanitizeUrl(incoming[key], { allowData: key === 'logoUrl' })
        : sanitizeMultilineText(incoming[key], 4_000);
    }

    const row = await queryOne<{ data: Record<string, unknown> }>(
      `INSERT INTO site_settings (id, data) VALUES (1, $1::jsonb)
       ON CONFLICT (id) DO UPDATE SET data = site_settings.data || $1::jsonb, updated_at = now()
       RETURNING data`,
      [JSON.stringify(clean)],
    );
    res.json(row?.data ?? clean);
  }),
);

// ============================================================== overview ====

adminRouter.get(
  '/stats',
  asyncRoute(async (_req, res) => {
    const row = await queryOne<Record<string, number>>(
      `SELECT
         (SELECT COUNT(*)::int FROM content)                                            AS content_count,
         (SELECT COUNT(*)::int FROM submissions WHERE status = 'pending')               AS pending_submissions,
         (SELECT COUNT(*)::int FROM comments WHERE status = 'pending')                  AS pending_comments,
         (SELECT COUNT(*)::int FROM contact_messages WHERE status = 'unread')           AS unread_messages,
         (SELECT COUNT(*)::int FROM users)                                              AS user_count,
         (SELECT COUNT(*)::int FROM event_registrations WHERE status = 'confirmed')     AS registration_count`,
    );
    res.json({
      contentCount: row?.content_count ?? 0,
      pendingSubmissions: row?.pending_submissions ?? 0,
      pendingComments: row?.pending_comments ?? 0,
      unreadMessages: row?.unread_messages ?? 0,
      userCount: row?.user_count ?? 0,
      registrationCount: row?.registration_count ?? 0,
    });
  }),
);
