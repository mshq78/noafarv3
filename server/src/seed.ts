/**
 * Seeds the catalogue from the design-time sample content in src/mocks.
 * Run once after the first deploy (`npm run db:seed`); the admin panel is the
 * source of truth from then on.
 */
import { pool } from './db.js';
import { migrate } from './migrate.js';
import { MOCK_COURSES } from '../../src/mocks/courses.js';
import { TOOLBOX_ITEMS } from '../../src/data/tools.js';
import { JOURNEY_ITEMS } from '../../src/data/journey.js';
import { LIBRARY_ITEMS } from '../../src/data/library.js';
import { MOCK_BOOKS } from '../../src/mocks/books.js';
import { MOCK_EXPERIENCES } from '../../src/mocks/experiences.js';
import { MOCK_EVENTS } from '../../src/mocks/events.js';
import { MOCK_IDEAS } from '../../src/mocks/ideas.js';
import { MOCK_BLOG_POSTS } from '../../src/mocks/blog.js';

/**
 * Empty or sample placeholder video URLs are dropped at seed time — the
 * player then shows its "no video uploaded yet" state until a real file is
 * attached from the admin panel. Google's public demo clips are matched too:
 * the sample data used to point at them, and a reintroduced copy would look
 * like real course material.
 */
const PLACEHOLDER_VIDEO = /commondatastorage\.googleapis\.com|sample-videos\.com/i;

function cleanVideoUrl(url: unknown): string | undefined {
  if (typeof url !== 'string' || !url.trim()) return undefined;
  return PLACEHOLDER_VIDEO.test(url) ? undefined : url;
}

const BASE_KEYS = new Set([
  'id', 'slug', 'sectionSlug', 'title', 'summary', 'body', 'heroImage', 'gallery',
  'attachments', 'category', 'tags', 'publishedAt', 'author', 'likeCount',
  'commentCount', 'viewCount', 'isLikedByMe', 'isBookmarkedByMe', 'myProgressPercent',
]);

interface SeedItem {
  id: string;
  slug: string;
  sectionSlug?: string;
  title: string;
  summary?: string;
  body?: string;
  heroImage?: unknown;
  gallery?: unknown[];
  attachments?: unknown[];
  category?: unknown;
  tags?: unknown[];
  author?: unknown;
  publishedAt?: string;
  likeCount?: number;
  commentCount?: number;
  viewCount?: number;
  [key: string]: unknown;
}

function extractData(item: SeedItem): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(item)) {
    if (BASE_KEYS.has(key) || value === undefined) continue;
    data[key] = value;
  }

  if (typeof data.videoUrl === 'string') {
    const cleaned = cleanVideoUrl(data.videoUrl);
    if (cleaned) data.videoUrl = cleaned;
    else delete data.videoUrl;
  }
  if (Array.isArray(data.syllabus)) {
    data.syllabus = (data.syllabus as Record<string, unknown>[]).map((lesson) => {
      const cleaned = cleanVideoUrl(lesson.videoUrl);
      return cleaned ? { ...lesson, videoUrl: cleaned } : { ...lesson, videoUrl: undefined };
    });
  }
  return data;
}

async function insertSection(section: string, items: SeedItem[]): Promise<number> {
  let inserted = 0;
  for (const item of items) {
    const result = await pool.query(
      `INSERT INTO content
              (id, section, slug, title, summary, body, hero_image, gallery, attachments,
               category, tags, author, data, status, view_count, like_count, comment_count, published_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb,
                    $10::jsonb, $11::jsonb, $12::jsonb, $13::jsonb, 'published', $14, $15, $16,
                    COALESCE($17::timestamptz, now()))
       ON CONFLICT (section, slug) DO NOTHING`,
      [
        item.id,
        section,
        item.slug,
        item.title,
        item.summary ?? '',
        item.body ?? '',
        item.heroImage ? JSON.stringify(item.heroImage) : null,
        JSON.stringify(item.gallery ?? []),
        JSON.stringify(item.attachments ?? []),
        item.category ? JSON.stringify(item.category) : null,
        JSON.stringify(item.tags ?? []),
        item.author ? JSON.stringify(item.author) : null,
        JSON.stringify(extractData(item)),
        item.viewCount ?? 0,
        item.likeCount ?? 0,
        // Comment counters start at zero: real comments are created by users.
        0,
        item.publishedAt ?? null,
      ],
    );
    inserted += result.rowCount ?? 0;
  }
  return inserted;
}

const DEFAULT_SETTINGS = {
  heroTitle: 'مرکز نوآوری نوآفر',
  heroSubtitle: 'بستری برای یادگیری، تجربه و خلق ارزش‌های اجتماعی',
  aboutText:
    '<p>نوآفر یک اکوسیستم باز و مشارکتی برای یادگیری روش‌های نوین حل مسائل اجتماعی، ابزارهای طراحی کسب‌وکار اجتماعی و شبکه‌سازی میان کنشگران، محققان و سازمان‌های مردم‌نهاد است.</p>',
  contactEmail: 'info@noafar.ir',
  contactPhone: '۰۲۱-۱۲۳۴۵۶۷۸',
  contactAddress: 'تهران، میدان انقلاب، پلاک ۱',
  footerDescription: 'اولین پلتفرم جامع آموزش و توانمندسازی کنشگران اجتماعی',
  footerCopyright: 'تمام حقوق برای پلتفرم نوآفر محفوظ است.',
};

export interface SeedCounts {
  academy: number;
  toolbox: number;
  library: number;
  journey: number;
  gathering: number;
  spark: number;
  blog: number;
}

export async function seed({ onlyIfEmpty = false } = {}): Promise<SeedCounts | null> {
  if (onlyIfEmpty) {
    const existing = await pool.query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM content`);
    if ((existing.rows[0]?.count ?? 0) > 0) {
      // eslint-disable-next-line no-console
      console.info('[noafar][seed] محتوا از قبل موجود است؛ از seed صرف‌نظر شد.');
      return null;
    }
  }

  const counts = {
    academy: await insertSection('academy', MOCK_COURSES as unknown as SeedItem[]),
    toolbox: await insertSection('toolbox', TOOLBOX_ITEMS as unknown as SeedItem[]),
    library: await insertSection('library', [...LIBRARY_ITEMS, ...MOCK_BOOKS] as unknown as SeedItem[]),
    journey: await insertSection('journey', [...JOURNEY_ITEMS, ...MOCK_EXPERIENCES] as unknown as SeedItem[]),
    gathering: await insertSection('gathering', MOCK_EVENTS as unknown as SeedItem[]),
    spark: await insertSection('spark', MOCK_IDEAS as unknown as SeedItem[]),
    blog: await insertSection('blog', MOCK_BLOG_POSTS as unknown as SeedItem[]),
  };

  await pool.query(
    `INSERT INTO site_settings (id, data) VALUES (1, $1::jsonb)
     ON CONFLICT (id) DO UPDATE SET data = $1::jsonb || site_settings.data`,
    [JSON.stringify(DEFAULT_SETTINGS)],
  );

  // eslint-disable-next-line no-console
  console.info('[noafar][seed] محتوای اولیه ثبت شد:', counts);
  return counts;
}

/**
 * Loads only the client-supplied content (toolbox tools, journey stories and library booklets).
 * `replaceToolbox` then removes the remaining toolbox rows, i.e. the design-time
 * samples. New rows go in first so the toolbox is never empty, and nothing is
 * deleted unless `confirm` is set — without it the call only reports counts.
 */
export async function seedClientContent(
  { replaceToolbox = false, confirm = false } = {},
): Promise<void> {
  const log = (message: string, extra?: unknown) =>
    // eslint-disable-next-line no-console
    console.info(`[noafar][seed] ${message}`, extra ?? '');

  const stale = await pool.query<{ id: string; slug: string }>(
    `SELECT id, slug FROM content WHERE section = 'toolbox' AND id NOT LIKE 'tool-nf-%' ORDER BY id`,
  );
  log(`ابزارهای قدیمی/نمونه در پایگاه‌داده: ${stale.rowCount ?? 0}`);

  if (!confirm) {
    log('اجرای آزمایشی: چیزی نوشته یا حذف نشد. برای اجرای واقعی --yes اضافه کنید.');
    return;
  }

  const counts = {
    toolbox: await insertSection('toolbox', TOOLBOX_ITEMS as unknown as SeedItem[]),
    journey: await insertSection('journey', JOURNEY_ITEMS as unknown as SeedItem[]),
    library: await insertSection('library', LIBRARY_ITEMS as unknown as SeedItem[]),
  };
  log('محتوای مشتری ثبت شد:', counts);

  if (replaceToolbox) {
    const removed = await pool.query(
      `DELETE FROM content WHERE section = 'toolbox' AND id NOT LIKE 'tool-nf-%'`,
    );
    log(`ابزارهای نمونهٔ حذف‌شده: ${removed.rowCount ?? 0}`);
  }
}

// Allow `node dist-server/seed.js` as a one-off command.
//   node dist-server/seed.js                          full sample seed
//   node dist-server/seed.js --client [--replace-toolbox] [--yes]
const invokedDirectly = process.argv[1]?.includes('seed');
if (invokedDirectly) {
  const args = new Set(process.argv.slice(2));
  migrate()
    .then(async () => {
      if (args.has('--client')) {
        await seedClientContent({ replaceToolbox: args.has('--replace-toolbox'), confirm: args.has('--yes') });
      } else {
        await seed();
      }
    })
    .then(() => pool.end())
    .then(() => process.exit(0))
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error('[noafar][seed] ناموفق:', error);
      process.exit(1);
    });
}
