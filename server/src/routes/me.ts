import { Router } from 'express';
import { z } from 'zod';
import { query, queryOne, queryRows, transaction } from '../db.js';
import { requireAuth } from '../lib/auth.js';
import { asyncRoute, badRequest, notFound } from '../lib/http.js';
import { rateLimit } from '../lib/rateLimit.js';
import {
  mapCanvas,
  mapContent,
  mapPointTransaction,
  mapRegistration,
  type ContentRow,
} from '../lib/mappers.js';
import { CONTENT_COLUMNS, isSection } from '../lib/content.js';
import { sanitizePlainText } from '../lib/sanitize.js';
import { awardPoints } from '../lib/points.js';

export const meRouter = Router();
meRouter.use(requireAuth);

// ------------------------------------------------------------ bookmarks ----

meRouter.get(
  '/bookmarks',
  asyncRoute(async (req, res) => {
    const section = typeof req.query.section === 'string' ? req.query.section : '';
    if (section && !isSection(section)) throw badRequest('بخش انتخابی معتبر نیست.');

    const rows = await queryRows<ContentRow>(
      `SELECT ${CONTENT_COLUMNS},
              true AS is_bookmarked_by_me,
              EXISTS (SELECT 1 FROM likes l WHERE l.content_id = c.id AND l.user_id = $1) AS is_liked_by_me,
              NULL::int AS my_progress_percent
         FROM bookmarks b
         JOIN content c ON c.id = b.content_id
        WHERE b.user_id = $1
          AND ($2::text = '' OR c.section = $2)
          AND c.status = 'published'
        ORDER BY b.created_at DESC
        LIMIT 200`,
      [req.user!.id, section],
    );

    const items = rows.map(mapContent);
    res.json({ items, total: items.length, page: 1, pageSize: items.length, hasMore: false });
  }),
);

// --------------------------------------------------------------- points ----

meRouter.get(
  '/points',
  asyncRoute(async (req, res) => {
    const [user, entries] = await Promise.all([
      queryOne<{ points: number }>(`SELECT points FROM users WHERE id = $1`, [req.user!.id]),
      queryRows<{
        id: string;
        reason: string;
        reason_fa: string;
        points: number;
        created_at: Date;
      }>(
        `SELECT id, reason, reason_fa, points, created_at
           FROM point_transactions
          WHERE user_id = $1
          ORDER BY created_at DESC
          LIMIT 200`,
        [req.user!.id],
      ),
    ]);
    res.json({ total: user?.points ?? 0, entries: entries.map(mapPointTransaction) });
  }),
);

// ------------------------------------------------------------- canvases ----

const canvasSchema = z.object({
  toolId: z.string().min(1).max(120),
  title: z.string().max(200).optional(),
  notes: z.record(z.string(), z.string().max(5_000)).optional(),
});

meRouter.get(
  '/canvases',
  asyncRoute(async (req, res) => {
    const rows = await queryRows<Parameters<typeof mapCanvas>[0]>(
      `SELECT id, tool_id, tool_slug, tool_title, title, notes, updated_at
         FROM saved_canvases
        WHERE user_id = $1
        ORDER BY updated_at DESC
        LIMIT 200`,
      [req.user!.id],
    );
    res.json(rows.map(mapCanvas));
  }),
);

meRouter.get(
  '/canvases/:id',
  asyncRoute(async (req, res) => {
    const row = await queryOne<Parameters<typeof mapCanvas>[0]>(
      `SELECT id, tool_id, tool_slug, tool_title, title, notes, updated_at
         FROM saved_canvases WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user!.id],
    );
    if (!row) throw notFound('بوم مورد نظر یافت نشد.');
    res.json(mapCanvas(row));
  }),
);

/**
 * Creates or updates the viewer's canvas for a tool. One canvas per
 * (user, tool) keeps "ادامه تکمیل بوم" pointing at real saved work instead of
 * piling up empty duplicates.
 */
meRouter.post(
  '/canvases',
  rateLimit({
    name: 'canvas-save',
    limit: 120,
    windowSeconds: 10 * 60,
    key: (req) => req.user?.id ?? 'anon',
  }),
  asyncRoute(async (req, res) => {
    const parsed = canvasSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('اطلاعات بوم معتبر نیست.');
    const { toolId, title, notes } = parsed.data;

    const tool = await queryOne<{ id: string; slug: string; title: string }>(
      `SELECT id, slug, title FROM content WHERE id = $1 AND section = 'toolbox'`,
      [toolId],
    );
    if (!tool) throw notFound('ابزار مورد نظر یافت نشد.');

    const cleanNotes: Record<string, string> = {};
    for (const [key, value] of Object.entries(notes ?? {})) {
      if (Object.keys(cleanNotes).length >= 40) break;
      cleanNotes[sanitizePlainText(key, 60)] = sanitizePlainText(value, 5_000);
    }

    const saved = await transaction(async (client) => {
      const existing = await client.query<{ id: string }>(
        `SELECT id FROM saved_canvases WHERE user_id = $1 AND tool_id = $2`,
        [req.user!.id, tool.id],
      );

      if (existing.rows[0]) {
        const updated = await client.query<Parameters<typeof mapCanvas>[0]>(
          `UPDATE saved_canvases
              SET title = $3, notes = $4::jsonb, updated_at = now()
            WHERE id = $1 AND user_id = $2
        RETURNING id, tool_id, tool_slug, tool_title, title, notes, updated_at`,
          [
            existing.rows[0].id,
            req.user!.id,
            sanitizePlainText(title ?? tool.title, 200),
            JSON.stringify(cleanNotes),
          ],
        );
        return updated.rows[0]!;
      }

      const inserted = await client.query<Parameters<typeof mapCanvas>[0]>(
        `INSERT INTO saved_canvases (user_id, tool_id, tool_slug, tool_title, title, notes)
              VALUES ($1, $2, $3, $4, $5, $6::jsonb)
           RETURNING id, tool_id, tool_slug, tool_title, title, notes, updated_at`,
        [
          req.user!.id,
          tool.id,
          tool.slug,
          tool.title,
          sanitizePlainText(title ?? tool.title, 200),
          JSON.stringify(cleanNotes),
        ],
      );
      return inserted.rows[0]!;
    });

    // Awarded once per member, not once per tool: keyed on the tool it paid
    // out again for every tool in the box, which is a few hundred points for
    // opening and saving each canvas once.
    await awardPoints({
      userId: req.user!.id,
      reason: 'first_canvas',
      reasonFa: `تکمیل و ذخیره اولین بوم دیجیتال («${tool.title}»)`,
      points: 30,
      dedupeKey: 'first_canvas',
    });

    res.status(201).json(mapCanvas(saved));
  }),
);

meRouter.delete(
  '/canvases/:id',
  asyncRoute(async (req, res) => {
    const result = await query(`DELETE FROM saved_canvases WHERE id = $1 AND user_id = $2`, [
      req.params.id,
      req.user!.id,
    ]);
    if (result.rowCount === 0) throw notFound('بوم مورد نظر یافت نشد.');
    res.json({ success: true });
  }),
);

// -------------------------------------------------------------- courses ----

meRouter.get(
  '/progress',
  asyncRoute(async (req, res) => {
    const rows = await queryRows<{ course_id: string; percent: number }>(
      `SELECT course_id, percent FROM course_progress WHERE user_id = $1`,
      [req.user!.id],
    );
    res.json(rows.map((row) => ({ courseId: row.course_id, percent: row.percent })));
  }),
);

// --------------------------------------------------------------- events ----

meRouter.get(
  '/events',
  asyncRoute(async (req, res) => {
    const rows = await queryRows<Parameters<typeof mapRegistration>[0]>(
      `SELECT r.id, r.event_id, r.user_id, r.ticket_code, r.status, r.registered_at,
              c.title AS event_title, u.display_name AS user_name, u.phone AS user_phone
         FROM event_registrations r
         JOIN content c ON c.id = r.event_id
         JOIN users u ON u.id = r.user_id
        WHERE r.user_id = $1
        ORDER BY r.registered_at DESC`,
      [req.user!.id],
    );
    res.json(rows.map(mapRegistration));
  }),
);
