import { queryOne, queryRows } from '../db.js';
import { mapContent, type ContentRow } from './mappers.js';

export const SECTIONS = [
  'academy',
  'toolbox',
  'library',
  'journey',
  'gathering',
  'spark',
  'blog',
] as const;

export type Section = (typeof SECTIONS)[number];

export function isSection(value: unknown): value is Section {
  return typeof value === 'string' && (SECTIONS as readonly string[]).includes(value);
}

/**
 * What the public may see: published, and whose publication time has come.
 * A row can be `published` with a `published_at` in the future — that is how a
 * scheduled item is stored — and it stays out of every public query until the
 * clock catches up, with no job needed to flip a flag. Anything that lists or
 * opens content for visitors must use this; only staff previews skip it.
 */
export const PUBLIC_CONTENT_SQL = `c.status = 'published' AND c.published_at <= now()`;

export const CONTENT_COLUMNS = `c.id, c.section, c.slug, c.title, c.summary, c.body,
  c.hero_image, c.gallery, c.attachments, c.category, c.tags, c.author, c.data,
  c.status, c.view_count, c.like_count, c.comment_count, c.published_at`;

/** Adds per-viewer flags (liked/bookmarked/progress) without a second query. */
const VIEWER_COLUMNS = `
  EXISTS (SELECT 1 FROM likes l     WHERE l.content_id = c.id AND l.user_id = $VIEWER) AS is_liked_by_me,
  EXISTS (SELECT 1 FROM bookmarks b WHERE b.content_id = c.id AND b.user_id = $VIEWER) AS is_bookmarked_by_me,
  (SELECT p.percent FROM course_progress p WHERE p.course_id = c.id AND p.user_id = $VIEWER) AS my_progress_percent`;

export function viewerColumns(paramIndex: number): string {
  return VIEWER_COLUMNS.replace(/\$VIEWER/g, `$${paramIndex}`);
}

export const NO_VIEWER_COLUMNS = `false AS is_liked_by_me, false AS is_bookmarked_by_me,
  NULL::int AS my_progress_percent`;

export async function findContentBySlug(
  section: Section,
  slug: string,
  viewerId: string | null,
  includeUnpublished = false,
): Promise<Record<string, unknown> | null> {
  const params: unknown[] = [section, slug];
  let viewer = NO_VIEWER_COLUMNS;
  if (viewerId) {
    params.push(viewerId);
    viewer = viewerColumns(params.length);
  }

  const row = await queryOne<ContentRow>(
    `SELECT ${CONTENT_COLUMNS}, ${viewer}
       FROM content c
      WHERE c.section = $1 AND c.slug = $2
        ${includeUnpublished ? '' : `AND ${PUBLIC_CONTENT_SQL}`}`,
    params,
  );
  return row ? mapContent(row) : null;
}

export async function findContentById(
  id: string,
  viewerId: string | null,
): Promise<Record<string, unknown> | null> {
  const params: unknown[] = [id];
  let viewer = NO_VIEWER_COLUMNS;
  if (viewerId) {
    params.push(viewerId);
    viewer = viewerColumns(params.length);
  }
  const row = await queryOne<ContentRow>(
    `SELECT ${CONTENT_COLUMNS}, ${viewer} FROM content c WHERE c.id = $1`,
    params,
  );
  return row ? mapContent(row) : null;
}

export async function listContentRows(
  where: string,
  params: unknown[],
  viewerId: string | null,
  order: string,
  limit: number,
  offset: number,
): Promise<Record<string, unknown>[]> {
  const allParams = [...params];
  let viewer = NO_VIEWER_COLUMNS;
  if (viewerId) {
    allParams.push(viewerId);
    viewer = viewerColumns(allParams.length);
  }
  allParams.push(limit, offset);

  const rows = await queryRows<ContentRow>(
    `SELECT ${CONTENT_COLUMNS}, ${viewer}
       FROM content c
      WHERE ${where}
      ORDER BY ${order}
      LIMIT $${allParams.length - 1} OFFSET $${allParams.length}`,
    allParams,
  );
  return rows.map(mapContent);
}

/** Builds a slug that is unique within its section. */
export async function uniqueSlug(section: string, desired: string): Promise<string> {
  const base =
    desired
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      // Keep Persian/Arabic letters — the platform's content is Persian.
      .replace(/[^\p{Letter}\p{Number}-]/gu, '')
      .replace(/-{2,}/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 90) || `item-${Date.now().toString(36)}`;

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const clash = await queryOne<{ id: string }>(
      `SELECT id FROM content WHERE section = $1 AND slug = $2`,
      [section, candidate],
    );
    if (!clash) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}
