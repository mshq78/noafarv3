import type { IncomingMessage, ServerResponse } from 'node:http';
import { MOCK_COURSES } from '../mocks/courses';
import { MOCK_TOOLS } from '../mocks/tools';
import { MOCK_BOOKS } from '../mocks/books';
import { MOCK_EXPERIENCES } from '../mocks/experiences';
import { MOCK_EVENTS } from '../mocks/events';
import { MOCK_IDEAS } from '../mocks/ideas';
import { MOCK_BLOG_POSTS } from '../mocks/blog';
import { ACADEMY_CATEGORIES, TOOLBOX_STAGES, JOURNEY_FIELDS } from '../config/categories';
import { SECTION_LIST } from '../config/sections';
import { ContentBase, SiteSettings, User } from '../types';

let siteSettings: SiteSettings = {
  heroTitle: 'مدرسه کنشگری نوآفر',
  heroSubtitle: 'بستری برای یادگیری، تجربه و خلق ارزش‌های اجتماعی',
  aboutText:
    '<p>نوآفر یک اکوسیستم باز و مشارکتی برای یادگیری روش‌های نوین حل مسائل اجتماعی، ابزارهای طراحی کسب‌وکار اجتماعی و شبکه‌سازی میان کنشگران، محققان و سازمان‌های مردم‌نهاد است.</p>',
  contactEmail: 'info@noafar.ir',
  contactPhone: '۰۲۱-۱۲۳۴۵۶۷۸',
  contactAddress: 'تهران، میدان انقلاب، پلاک ۱',
  footerDescription: 'اولین پلتفرم جامع آموزش و توانمندسازی کنشگران اجتماعی',
  footerCopyright: 'تمام حقوق برای پلتفرم نوآفر محفوظ است.',
};

let currentUser: User | null = null;
const likesState: Record<string, { count: number; liked: boolean }> = {};
const bookmarksState: Set<string> = new Set();
const userSubmissions: any[] = [];
const savedCanvases: any[] = [];
const eventRegistrations: any[] = [];
const contactMessages: any[] = [];
const commentsState: Record<string, any[]> = {};

// Map section slug to collection
const sectionCollections: Record<string, ContentBase[]> = {
  academy: [...MOCK_COURSES],
  toolbox: [...MOCK_TOOLS],
  library: [...MOCK_BOOKS],
  journey: [...MOCK_EXPERIENCES],
  gathering: [...MOCK_EVENTS],
  spark: [...MOCK_IDEAS],
  blog: [...MOCK_BLOG_POSTS] as unknown as ContentBase[],
};

function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

export async function handleMockApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
) {
  const urlString = req.url || '';
  if (!urlString.startsWith('/api') && !urlString.startsWith('/uploads')) {
    return next();
  }

  const parsedUrl = new URL(urlString, 'http://localhost:3000');
  const pathname = parsedUrl.pathname;
  const method = (req.method || 'GET').toUpperCase();
  const searchParams = parsedUrl.searchParams;

  // 1. Health check
  if (pathname === '/api/health') {
    return sendJson(res, 200, { ok: true, env: 'development', mode: 'mock' });
  }

  // 2. Settings
  if (pathname === '/api/settings') {
    if (method === 'GET') {
      return sendJson(res, 200, siteSettings);
    }
    if (method === 'PUT' || method === 'PATCH') {
      const body = await readBody(req);
      siteSettings = { ...siteSettings, ...body };
      return sendJson(res, 200, siteSettings);
    }
  }

  // 3. Auth
  if (pathname === '/api/auth/me') {
    if (method === 'GET') {
      if (!currentUser) {
        return sendJson(res, 401, { message: 'احراز هویت نشده‌اید', code: 'unauthorized' });
      }
      return sendJson(res, 200, currentUser);
    }
    if (method === 'PATCH') {
      const body = await readBody(req);
      if (currentUser) {
        currentUser = { ...currentUser, ...body };
      }
      return sendJson(res, 200, currentUser);
    }
  }

  if (pathname === '/api/auth/otp/request') {
    return sendJson(res, 200, {
      expiresInSeconds: 120,
      resendAfterSeconds: 60,
      delivered: true,
      debugCode: '12345',
    });
  }

  if (pathname === '/api/auth/otp/verify') {
    const body = await readBody(req);
    currentUser = {
      id: 'usr-dev-1',
      phone: body.phone || '09120000000',
      displayName: 'کنشگر نوآفر',
      role: 'admin',
      points: 210,
      joinedAt: new Date().toISOString(),
      membershipDays: 45,
      profileComplete: true,
    };
    return sendJson(res, 200, { token: 'mock-jwt-token', user: currentUser });
  }

  if (pathname === '/api/auth/login' || pathname === '/api/auth/register') {
    const body = await readBody(req);
    currentUser = {
      id: 'usr-dev-admin',
      phone: '09120000000',
      email: body.email || 'admin@noafar.ir',
      displayName: body.displayName || 'مدیر نوآفر',
      role: 'admin',
      points: 350,
      joinedAt: new Date().toISOString(),
      membershipDays: 120,
      profileComplete: true,
    };
    return sendJson(res, 200, { token: 'mock-jwt-token', user: currentUser });
  }

  if (pathname === '/api/auth/logout') {
    currentUser = null;
    return sendJson(res, 200, { success: true });
  }

  if (pathname === '/api/auth/password/forgot' || pathname === '/api/auth/password/reset') {
    return sendJson(res, 200, { success: true, message: 'عملیات با موفقیت انجام شد.' });
  }

  // 4. Categories & Sections
  if (pathname === '/api/categories') {
    const section = searchParams.get('section');
    if (section === 'academy' || section === 'library') {
      return sendJson(res, 200, ACADEMY_CATEGORIES);
    }
    if (section === 'toolbox') {
      return sendJson(res, 200, TOOLBOX_STAGES);
    }
    if (section === 'journey' || section === 'spark') {
      return sendJson(res, 200, JOURNEY_FIELDS);
    }
    return sendJson(res, 200, [...ACADEMY_CATEGORIES, ...TOOLBOX_STAGES, ...JOURNEY_FIELDS]);
  }

  if (pathname === '/api/sections') {
    return sendJson(res, 200, SECTION_LIST);
  }

  // 5. Blog
  if (pathname === '/api/blog') {
    return sendJson(res, 200, MOCK_BLOG_POSTS);
  }
  if (pathname.startsWith('/api/blog/')) {
    const slug = decodeURIComponent(pathname.replace('/api/blog/', ''));
    const post = MOCK_BLOG_POSTS.find((p) => p.slug === slug || p.id === slug);
    if (!post) {
      return sendJson(res, 404, { message: 'مقاله مورد نظر یافت نشد.' });
    }
    return sendJson(res, 200, post);
  }

  // 6. Search
  if (pathname === '/api/search') {
    const q = (searchParams.get('q') || '').toLowerCase().trim();
    const sectionFilter = searchParams.get('section');

    const searchCollection = (items: ContentBase[]) => {
      if (!q) return items;
      return items.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.summary?.toLowerCase().includes(q) ||
          item.category?.nameFa?.toLowerCase().includes(q) ||
          item.category?.slug?.toLowerCase().includes(q),
      );
    };

    const bySection: Record<string, { count: number; items: ContentBase[] }> = {};
    let total = 0;

    for (const [secKey, collection] of Object.entries(sectionCollections)) {
      if (!sectionFilter || sectionFilter === secKey) {
        const matched = searchCollection(collection);
        bySection[secKey] = { count: matched.length, items: matched };
        total += matched.length;
      }
    }

    return sendJson(res, 200, { total, bySection });
  }

  // 7. Likes & Bookmarks & Comments
  const likeMatch = pathname.match(/^\/api\/content\/([^/]+)\/like$/);
  if (likeMatch) {
    const id = decodeURIComponent(likeMatch[1]);
    const current = likesState[id] || { count: 18, liked: false };
    if (method === 'POST') {
      likesState[id] = { count: current.liked ? current.count : current.count + 1, liked: true };
      return sendJson(res, 200, { likeCount: likesState[id].count, isLikedByMe: true });
    }
    if (method === 'DELETE') {
      likesState[id] = { count: current.liked ? current.count - 1 : current.count, liked: false };
      return sendJson(res, 200, { likeCount: likesState[id].count, isLikedByMe: false });
    }
  }

  const bookmarkMatch = pathname.match(/^\/api\/content\/([^/]+)\/bookmark$/);
  if (bookmarkMatch) {
    const id = decodeURIComponent(bookmarkMatch[1]);
    if (method === 'POST') {
      bookmarksState.add(id);
      return sendJson(res, 200, { isBookmarkedByMe: true });
    }
    if (method === 'DELETE') {
      bookmarksState.delete(id);
      return sendJson(res, 200, { isBookmarkedByMe: false });
    }
  }

  const commentsMatch = pathname.match(/^\/api\/content\/([^/]+)\/comments$/);
  if (commentsMatch) {
    const id = decodeURIComponent(commentsMatch[1]);
    if (!commentsState[id]) {
      commentsState[id] = [
        {
          id: `cmt-${id}-1`,
          contentId: id,
          authorName: 'سارا رضایی',
          authorRole: 'کنشگر حوزه آموزش',
          body: 'محتوای بسیار کاربردی و ارزشمندی بود؛ به خصوص راهنمای گام‌به‌گام آن برای تیم‌های محلی بسیار راه‌گشاست.',
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          status: 'approved',
        },
      ];
    }

    if (method === 'GET') {
      const items = commentsState[id];
      return sendJson(res, 200, {
        items,
        total: items.length,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      });
    }

    if (method === 'POST') {
      const body = await readBody(req);
      const newComment = {
        id: `cmt-${Date.now().toString(36)}`,
        contentId: id,
        authorName: currentUser?.displayName || 'کاربر مهمان',
        authorRole: 'عضو نوآفر',
        body: body.body || '',
        createdAt: new Date().toISOString(),
        status: 'approved',
      };
      commentsState[id].unshift(newComment);
      return sendJson(res, 200, newComment);
    }
  }

  // 8. Content list, detail, and related
  // Check /api/content/:section/:slug/related
  const relatedMatch = pathname.match(/^\/api\/content\/([^/]+)\/([^/]+)\/related$/);
  if (relatedMatch) {
    const section = relatedMatch[1];
    const slug = decodeURIComponent(relatedMatch[2]);
    const collection = sectionCollections[section] || [];
    const related = collection.filter((i) => i.slug !== slug).slice(0, 3);
    return sendJson(res, 200, related);
  }

  // Check /api/content/:section/:slug
  const detailMatch = pathname.match(/^\/api\/content\/([^/]+)\/([^/]+)$/);
  if (detailMatch) {
    const section = detailMatch[1];
    const slug = decodeURIComponent(detailMatch[2]);
    const collection = sectionCollections[section] || [];
    const item = collection.find((i) => i.slug === slug || i.id === slug);
    if (!item) {
      return sendJson(res, 404, { message: 'محتوای مورد نظر یافت نشد.' });
    }
    return sendJson(res, 200, item);
  }

  // Check /api/content/:section
  const listMatch = pathname.match(/^\/api\/content\/([^/]+)$/);
  if (listMatch) {
    const section = listMatch[1];
    let items = sectionCollections[section] || [];

    const category = searchParams.get('category');
    const q = (searchParams.get('q') || searchParams.get('search') || '').toLowerCase().trim();
    const stage = searchParams.get('stage');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') || '12', 10));

    if (category) {
      items = items.filter(
        (i) =>
          i.category?.slug === category ||
          i.category?.id === category ||
          i.category?.nameFa === category,
      );
    }
    if (stage) {
      items = items.filter((i: any) => i.stage === stage);
    }
    if (q) {
      items = items.filter(
        (i) =>
          i.title?.toLowerCase().includes(q) ||
          i.summary?.toLowerCase().includes(q) ||
          i.category?.nameFa?.toLowerCase().includes(q) ||
          i.category?.slug?.toLowerCase().includes(q),
      );
    }

    const total = items.length;
    const startIndex = (page - 1) * pageSize;
    const pagedItems = items.slice(startIndex, startIndex + pageSize);

    return sendJson(res, 200, {
      items: pagedItems,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    });
  }

  // 9. Submissions
  if (pathname === '/api/submissions/idea' || pathname === '/api/submissions/experience') {
    const body = await readBody(req);
    const sub = {
      id: `sub-${Date.now().toString(36)}`,
      kind: pathname.includes('idea') ? 'idea' : 'experience',
      status: 'pending',
      title: body.title || '',
      data: body,
      createdAt: new Date().toISOString(),
    };
    userSubmissions.push(sub);
    return sendJson(res, 200, sub);
  }

  if (pathname === '/api/submissions/mine') {
    return sendJson(res, 200, {
      items: userSubmissions,
      total: userSubmissions.length,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    });
  }

  // 10. Me routes
  if (pathname === '/api/me/progress') {
    return sendJson(res, 200, [
      { courseId: 'course-1', percent: 60 },
      { courseId: 'course-2', percent: 100 },
    ]);
  }

  if (pathname === '/api/me/points') {
    return sendJson(res, 200, {
      total: currentUser?.points || 210,
      entries: [
        { id: 'pt-1', amount: 50, description: 'عضویت در پلتفرم نوآفر', createdAt: new Date().toISOString() },
        { id: 'pt-2', amount: 40, description: 'اتمام دوره تفکر طراحی', createdAt: new Date().toISOString() },
        { id: 'pt-3', amount: 120, description: 'ثبت تجربه بومی محله', createdAt: new Date().toISOString() },
      ],
    });
  }

  if (pathname === '/api/me/bookmarks') {
    const all = Object.values(sectionCollections).flat();
    const bookmarked = all.filter((item) => bookmarksState.has(item.id));
    return sendJson(res, 200, {
      items: bookmarked.length ? bookmarked : all.slice(0, 3),
      total: bookmarked.length || 3,
      page: 1,
      pageSize: 12,
      totalPages: 1,
    });
  }

  if (pathname === '/api/me/canvases') {
    if (method === 'GET') {
      return sendJson(res, 200, savedCanvases);
    }
    if (method === 'POST') {
      const body = await readBody(req);
      const newCanvas = {
        id: `canv-${Date.now().toString(36)}`,
        toolId: body.toolId,
        title: body.title || 'بوم ذخیره‌شده',
        notes: body.notes || {},
        updatedAt: new Date().toISOString(),
      };
      savedCanvases.push(newCanvas);
      return sendJson(res, 200, newCanvas);
    }
  }

  if (pathname.startsWith('/api/me/canvases/')) {
    const id = pathname.replace('/api/me/canvases/', '');
    const idx = savedCanvases.findIndex((c) => c.id === id);
    if (idx >= 0) savedCanvases.splice(idx, 1);
    return sendJson(res, 200, { success: true });
  }

  if (pathname === '/api/me/events') {
    return sendJson(res, 200, eventRegistrations);
  }

  // 11. Courses progress
  const courseProgMatch = pathname.match(/^\/api\/courses\/([^/]+)\/progress$/);
  if (courseProgMatch) {
    const body = await readBody(req);
    return sendJson(res, 200, { success: true, percent: body.percent ?? 100 });
  }

  // 12. Event registration
  const eventRegMatch = pathname.match(/^\/api\/events\/([^/]+)\/register$/);
  if (eventRegMatch) {
    const eventId = eventRegMatch[1];
    const reg = {
      id: `reg-${Date.now().toString(36)}`,
      eventId,
      ticketCode: `NF-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };
    eventRegistrations.push(reg);
    return sendJson(res, 200, reg);
  }

  // 13. Contact
  if (pathname === '/api/contact') {
    const body = await readBody(req);
    contactMessages.push(body);
    return sendJson(res, 200, { success: true, id: `msg-${Date.now()}` });
  }

  // 14. Admin routes
  if (pathname.startsWith('/api/admin/content')) {
    const all = Object.values(sectionCollections).flat();
    return sendJson(res, 200, all);
  }

  // 15. Uploads mock
  if (pathname.startsWith('/uploads') || pathname.startsWith('/api/uploads')) {
    return sendJson(res, 200, {
      id: `med-${Date.now().toString(36)}`,
      type: 'image',
      url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80',
      filename: 'uploaded-media.jpg',
      bytes: 102400,
      createdAt: new Date().toISOString(),
    });
  }

  // Default fallback for any unhandled /api route
  return sendJson(res, 200, { ok: true, data: [] });
}
