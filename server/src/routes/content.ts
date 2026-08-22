import { Router } from 'express';
import { query, queryOne, queryRows, transaction } from '../db.js';
import { asyncRoute, badRequest, notFound } from '../lib/http.js';
import { requireAuth } from '../lib/auth.js';
import { rateLimit } from '../lib/rateLimit.js';
import { mapContent, mapComment, type ContentRow, type CommentRow } from '../lib/mappers.js';
import {
  CONTENT_COLUMNS,
  NO_VIEWER_COLUMNS,
  isSection,
  listContentRows,
  viewerColumns,
} from '../lib/content.js';
import { sanitizeRichText } from '../lib/sanitize.js';

export const contentRouter = Router();

const MAX_PAGE_SIZE = 48;

function toPositiveInt(value: unknown, fallback: number, max = Number.MAX_SAFE_INTEGER): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(Math.floor(parsed), max);
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string' && value) return [value];
  return [];
}

/**
 * Interaction routes are declared before the generic `/:section/:slug` route:
 * their second segment is a literal (`like`/`bookmark`/`comments`), so Express
 * would otherwise resolve `/content/course-1/comments` as a section+slug pair.
 */
// ------------------------------------------------------- like / bookmark ---

contentRouter.post(
  '/:id/like',
  requireAuth,
  rateLimit({ name: 'like', limit: 120, windowSeconds: 10 * 60 }),
  asyncRoute(async (req, res) => {
    res.json(await setLike(req.params.id, req.user!.id, true));
  }),
);

contentRouter.delete(
  '/:id/like',
  requireAuth,
  rateLimit({ name: 'like', limit: 120, windowSeconds: 10 * 60 }),
  asyncRoute(async (req, res) => {
    res.json(await setLike(req.params.id, req.user!.id, false));
  }),
);

async function setLike(contentId: string, userId: string, liked: boolean) {
  return transaction(async (client) => {
    const exists = await client.query(`SELECT 1 FROM content WHERE id = $1`, [contentId]);
    if (exists.rowCount === 0) throw notFound('محتوای مورد نظر یافت نشد.');

    // `like_count` is only adjusted when the row actually changed, so a
    // double-click or a retried request cannot inflate the counter.
    const changed = liked
      ? await client.query(
          `INSERT INTO likes (user_id, content_id) VALUES ($1, $2)
           ON CONFLICT DO NOTHING RETURNING 1`,
          [userId, contentId],
        )
      : await client.query(`DELETE FROM likes WHERE user_id = $1 AND content_id = $2 RETURNING 1`, [
          userId,
          contentId,
        ]);

    if (changed.rowCount) {
      await client.query(
        `UPDATE content SET like_count = GREATEST(0, like_count + $2) WHERE id = $1`,
        [contentId, liked ? 1 : -1],
      );
    }

    const row = await client.query<{ like_count: number }>(
      `SELECT like_count FROM content WHERE id = $1`,
      [contentId],
    );
    return { likeCount: row.rows[0]?.like_count ?? 0, isLikedByMe: liked };
  });
}

contentRouter.post(
  '/:id/bookmark',
  requireAuth,
  rateLimit({ name: 'bookmark', limit: 120, windowSeconds: 10 * 60 }),
  asyncRoute(async (req, res) => {
    const inserted = await query(
      `INSERT INTO bookmarks (user_id, content_id)
       SELECT $1, id FROM content WHERE id = $2
       ON CONFLICT DO NOTHING RETURNING 1`,
      [req.user!.id, req.params.id],
    );
    if (inserted.rowCount === 0) {
      const exists = await queryOne(`SELECT 1 FROM content WHERE id = $1`, [req.params.id]);
      if (!exists) throw notFound('محتوای مورد نظر یافت نشد.');
    }
    res.json({ isBookmarkedByMe: true });
  }),
);

contentRouter.delete(
  '/:id/bookmark',
  requireAuth,
  rateLimit({ name: 'bookmark', limit: 120, windowSeconds: 10 * 60 }),
  asyncRoute(async (req, res) => {
    await query(`DELETE FROM bookmarks WHERE user_id = $1 AND content_id = $2`, [
      req.user!.id,
      req.params.id,
    ]);
    res.json({ isBookmarkedByMe: false });
  }),
);

// ------------------------------------------------------------- comments ----

contentRouter.get(
  '/:id/comments',
  asyncRoute(async (req, res) => {
    const page = toPositiveInt(req.query.page, 1, 1_000);
    const pageSize = 20;
    const viewerId = req.user?.id ?? null;
    const isOperator = req.user?.role === 'admin' || req.user?.role === 'operator';

    // Everyone sees approved comments; an author additionally sees their own
    // pending one so the "awaiting review" state is visible to them.
    const visibility = isOperator
      ? `TRUE`
      : viewerId
        ? `(cm.status = 'approved' OR cm.author_id = $2)`
        : `cm.status = 'approved'`;
    const params: unknown[] = [req.params.id];
    if (!isOperator && viewerId) params.push(viewerId);

    const rows = await queryRows<CommentRow>(
      `SELECT cm.id, cm.content_id, cm.body, cm.status, cm.created_at,
              cm.author_id, u.display_name AS author_display_name, u.avatar_url AS author_avatar_url
         FROM comments cm
    LEFT JOIN users u ON u.id = cm.author_id
        WHERE cm.content_id = $1 AND ${visibility}
        ORDER BY cm.created_at DESC
        LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
      params,
    );

    const totalRow = await queryOne<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM comments cm WHERE cm.content_id = $1 AND ${visibility}`,
      params,
    );
    const total = totalRow?.total ?? 0;

    res.json({
      items: rows.map(mapComment),
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    });
  }),
);

contentRouter.post(
  '/:id/comments',
  requireAuth,
  rateLimit({
    name: 'comment',
    limit: 10,
    windowSeconds: 10 * 60,
    key: (req) => req.user?.id ?? 'anon',
    message: 'در بازه کوتاه دیدگاه‌های زیادی ثبت کرده‌اید. کمی بعد دوباره تلاش کنید.',
  }),
  asyncRoute(async (req, res) => {
    const body = sanitizeRichText((req.body as { body?: unknown })?.body, 8_000);
    const plain = body.replace(/<[^>]*>/g, '').trim();
    if (plain.length < 2) throw badRequest('متن دیدگاه نمی‌تواند خالی باشد.');
    if (plain.length > 3_000) throw badRequest('متن دیدگاه بیش از حد طولانی است.');

    const created = await transaction(async (client) => {
      const target = await client.query(`SELECT 1 FROM content WHERE id = $1`, [req.params.id]);
      if (target.rowCount === 0) throw notFound('محتوای مورد نظر یافت نشد.');

      const inserted = await client.query<{ id: string; created_at: Date }>(
        `INSERT INTO comments (content_id, author_id, body, status)
              VALUES ($1, $2, $3, 'pending')
           RETURNING id, created_at`,
        [req.params.id, req.user!.id, body],
      );
      return inserted.rows[0]!;
    });

    // Points land once the comment is approved, not on submission.
    res.status(201).json({
      id: created.id,
      contentId: req.params.id,
      author: { id: req.user!.id, displayName: req.user!.displayName || 'کاربر نوآفر' },
      body,
      createdAt: created.created_at.toISOString(),
      status: 'pending',
    });
  }),
);

// ------------------------------------------------------------- listing -----

contentRouter.get(
  '/:section',
  asyncRoute(async (req, res) => {
    const { section } = req.params;
    if (!isSection(section)) throw notFound('این بخش وجود ندارد.');

    const page = toPositiveInt(req.query.page, 1, 5_000);
    const pageSize = toPositiveInt(req.query.pageSize, 12, MAX_PAGE_SIZE);
    const viewerId = req.user?.id ?? null;

    const conditions = [`c.section = $1`, `c.status = 'published'`];
    const params: unknown[] = [section];

    const pushParam = (value: unknown): string => {
      params.push(value);
      return `$${params.length}`;
    };

    const category = typeof req.query.category === 'string' ? req.query.category : '';
    if (category) {
      // Journey and Spark expose their taxonomy as `field` rather than
      // `category`, and the list UI sends it through the `category` param.
      const matchesField = section === 'journey' || section === 'spark';
      const placeholder = pushParam(category);
      conditions.push(
        matchesField
          ? `(c.category->>'slug' = ${placeholder} OR c.data->'field'->>'slug' = ${placeholder})`
          : `c.category->>'slug' = ${placeholder}`,
      );
    }

    // Section-specific facets live in the JSONB `data` column.
    const stages = asStringArray(req.query.stage);
    if (section === 'toolbox' && stages.length) {
      conditions.push(`c.data->'stage'->>'slug' = ANY(${pushParam(stages)}::text[])`);
    }
    const formats = asStringArray(req.query.format);
    if (section === 'toolbox' && formats.length) {
      conditions.push(`c.data->>'format' = ANY(${pushParam(formats)}::text[])`);
    }
    if (section === 'toolbox' && typeof req.query.difficulty === 'string' && req.query.difficulty) {
      conditions.push(`c.data->>'difficulty' = ${pushParam(req.query.difficulty)}`);
    }
    if (section === 'library' && typeof req.query.kind === 'string' && req.query.kind) {
      conditions.push(`c.data->>'kind' = ${pushParam(req.query.kind)}`);
    }
    if (section === 'gathering') {
      if (typeof req.query.kind === 'string' && req.query.kind) {
        conditions.push(`c.data->>'kind' = ${pushParam(req.query.kind)}`);
      }
      if (typeof req.query.status === 'string' && req.query.status) {
        conditions.push(`c.data->>'status' = ${pushParam(req.query.status)}`);
      }
    }
    if (section === 'journey' || section === 'spark') {
      const field = typeof req.query.field === 'string' ? req.query.field : '';
      if (field) conditions.push(`c.data->'field'->>'slug' = ${pushParam(field)}`);
    }

    const search = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (search) {
      const like = `%${search.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
      conditions.push(
        `(c.title ILIKE ${pushParam(like)} ESCAPE '\\' OR c.summary ILIKE $${params.length} ESCAPE '\\')`,
      );
    }

    const where = conditions.join(' AND ');
    const sort = typeof req.query.sort === 'string' ? req.query.sort : 'latest';
    const order =
      sort === 'popular'
        ? 'c.like_count DESC, c.published_at DESC'
        : sort === 'views'
          ? 'c.view_count DESC, c.published_at DESC'
          : 'c.published_at DESC, c.created_at DESC';

    const [items, totalRow] = await Promise.all([
      listContentRows(where, params, viewerId, order, pageSize, (page - 1) * pageSize),
      queryOne<{ total: number }>(
        `SELECT COUNT(*)::int AS total FROM content c WHERE ${where}`,
        params,
      ),
    ]);

    const total = totalRow?.total ?? 0;
    res.json({ items, total, page, pageSize, hasMore: page * pageSize < total });
  }),
);

// -------------------------------------------------------------- detail -----

contentRouter.get(
  '/:section/:slug',
  asyncRoute(async (req, res) => {
    const { section, slug } = req.params;
    if (!isSection(section)) throw notFound('محتوای مورد نظر یافت نشد.');

    const viewerId = req.user?.id ?? null;
    const params: unknown[] = [section, slug];
    let viewer = NO_VIEWER_COLUMNS;
    if (viewerId) {
      params.push(viewerId);
      viewer = viewerColumns(params.length);
    }

    const row = await queryOne<ContentRow>(
      `SELECT ${CONTENT_COLUMNS}, ${viewer}
         FROM content c
        WHERE c.section = $1 AND c.slug = $2 AND c.status = 'published'`,
      params,
    );
    if (!row) throw notFound('محتوای مورد نظر یافت نشد.');

    // Fire-and-forget view counter; a failure here must not break the page.
    query(`UPDATE content SET view_count = view_count + 1 WHERE id = $1`, [row.id]).catch(() => {});

    res.json(mapContent(row));
  }),
);

contentRouter.get(
  '/:section/:slug/related',
  asyncRoute(async (req, res) => {
    const { section, slug } = req.params;
    if (!isSection(section)) throw notFound('محتوای مورد نظر یافت نشد.');

    const current = await queryOne<{ id: string; category: { slug?: string } | null }>(
      `SELECT id, category FROM content WHERE section = $1 AND slug = $2`,
      [section, slug],
    );
    if (!current) {
      res.json([]);
      return;
    }

    // Prefer siblings in the same category, then fall back to the newest.
    const items = await listContentRows(
      `c.status = 'published' AND c.id <> $1 AND c.section <> 'blog'`,
      [current.id, current.category?.slug ?? null],
      req.user?.id ?? null,
      `(c.category->>'slug' IS NOT DISTINCT FROM $2) DESC, c.published_at DESC`,
      3,
      0,
    );
    res.json(items);
  }),
);
