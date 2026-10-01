import { API_BASE_URL, ApiError, del, get, patch, post, put, request } from './api';
import { formatFileSize, toFaDigits } from '../utils/format';
import {
  SectionSlug,
  ContentBase,
  Course,
  Comment,
  Submission,
  SavedCanvas,
  PointEntry,
  PointTransaction,
  SiteSettings,
  User,
  Category,
  SectionMeta,
  Paginated,
  ContactMessage,
  EventRegistration,
  MediaAsset,
  BlogPost,
} from '../types';
import { SECTION_LIST } from '../config/sections';
import { ACADEMY_CATEGORIES, TOOLBOX_STAGES, JOURNEY_FIELDS } from '../config/categories';

// ==========================================
// 1. AUTH
// ==========================================

export interface OtpRequestResult {
  expiresInSeconds: number;
  resendAfterSeconds: number;
  delivered: boolean;
  /** Only present when the server runs with OTP_DEBUG_RETURN outside production. */
  debugCode?: string;
}

export function requestOtp(phone: string): Promise<OtpRequestResult> {
  return post<OtpRequestResult>('/auth/otp/request', { phone });
}

export function verifyOtp(phone: string, code: string): Promise<{ token: string; user: User }> {
  return post<{ token: string; user: User }>('/auth/otp/verify', { phone, code });
}

// ---- email + password --------------------------------------------------

export function registerWithEmail(
  email: string,
  password: string,
  displayName?: string,
): Promise<{ token: string; user: User }> {
  return post<{ token: string; user: User }>('/auth/register', { email, password, displayName });
}

export function loginWithEmail(
  email: string,
  password: string,
): Promise<{ token: string; user: User }> {
  return post<{ token: string; user: User }>('/auth/login', { email, password });
}

/** Sets or changes the password; `email` attaches an address to a phone account. */
export function setPassword(input: {
  currentPassword?: string;
  newPassword: string;
  email?: string;
}): Promise<User> {
  return post<User>('/auth/password', input);
}

/** Always resolves, whether or not the address has an account. */
export function requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  return post('/auth/password/forgot', { email });
}

export function resetPassword(
  token: string,
  password: string,
): Promise<{ token: string; user: User }> {
  return post<{ token: string; user: User }>('/auth/password/reset', { token, password });
}

export function logout(): Promise<{ success: boolean }> {
  return post<{ success: boolean }>('/auth/logout');
}

export function getMe(): Promise<User> {
  // A signed-out visitor is an expected state here, not a reason to redirect.
  return request<User>('/auth/me', { method: 'GET', redirectOnUnauthorized: false });
}

export function updateProfile(data: Partial<User>): Promise<User> {
  return patch<User>('/auth/me', data as Record<string, unknown>);
}

// ==========================================
// 2. SECTIONS & TAXONOMY
// ==========================================

/** Section metadata and taxonomies are design-time constants, not content. */
export async function getSections(): Promise<SectionMeta[]> {
  return SECTION_LIST;
}

export async function getCategories(section?: SectionSlug): Promise<Category[]> {
  if (section === 'academy' || section === 'library') return ACADEMY_CATEGORIES;
  if (section === 'toolbox') return TOOLBOX_STAGES;
  if (section === 'journey' || section === 'spark') return JOURNEY_FIELDS;
  return [...ACADEMY_CATEGORIES, ...TOOLBOX_STAGES, ...JOURNEY_FIELDS];
}

// ==========================================
// 3. CONTENT
// ==========================================

export interface ContentListParams {
  page?: number;
  pageSize?: number;
  category?: string;
  tags?: string[];
  stage?: string | string[];
  format?: string | string[];
  difficulty?: string;
  status?: string;
  kind?: string;
  field?: string;
  q?: string;
  sort?: 'latest' | 'popular' | 'views';
}

export function getContentList<T extends ContentBase = ContentBase>(
  section: SectionSlug,
  params: ContentListParams = {},
): Promise<Paginated<T>> {
  const { page = 1, pageSize = 12, ...filters } = params;
  return get<Paginated<T>>(`/content/${section}`, { page, pageSize, ...filters });
}

export function getContentDetail<T extends ContentBase>(
  section: SectionSlug,
  slug: string,
): Promise<T> {
  return get<T>(`/content/${section}/${encodeURIComponent(slug)}`);
}

export function getRelatedContent(section: SectionSlug, slug: string): Promise<ContentBase[]> {
  return get<ContentBase[]>(`/content/${section}/${encodeURIComponent(slug)}/related`);
}

// ==========================================
// 4. INTERACTIONS
// ==========================================

export function likeContent(id: string): Promise<{ likeCount: number; isLikedByMe: boolean }> {
  return post(`/content/${encodeURIComponent(id)}/like`);
}

export function unlikeContent(id: string): Promise<{ likeCount: number; isLikedByMe: boolean }> {
  return del(`/content/${encodeURIComponent(id)}/like`);
}

export function bookmarkContent(id: string): Promise<{ isBookmarkedByMe: boolean }> {
  return post(`/content/${encodeURIComponent(id)}/bookmark`);
}

export function unbookmarkContent(id: string): Promise<{ isBookmarkedByMe: boolean }> {
  return del(`/content/${encodeURIComponent(id)}/bookmark`);
}

export function getComments(contentId: string, page = 1): Promise<Paginated<Comment>> {
  return get<Paginated<Comment>>(`/content/${encodeURIComponent(contentId)}/comments`, { page });
}

export function postComment(contentId: string, body: string): Promise<Comment> {
  return post<Comment>(`/content/${encodeURIComponent(contentId)}/comments`, { body });
}

// ==========================================
// 5. COURSES
// ==========================================

export function updateCourseProgress(
  courseId: string,
  percent: number,
  positionSeconds?: number,
  completedLessons?: string[],
): Promise<{ success: boolean; percent: number }> {
  return post(`/courses/${encodeURIComponent(courseId)}/progress`, {
    percent,
    positionSeconds,
    completedLessons,
  });
}

/** Video and syllabus edits go through the content API — operators only. */
export function updateCourseVideo(
  courseId: string,
  videoUrl: string,
  lessonIndex: number | undefined,
  course: Course,
): Promise<Course> {
  if (lessonIndex === undefined || !course.syllabus?.[lessonIndex]) {
    return adminUpdateContent<Course>(courseId, { data: { videoUrl } });
  }
  const syllabus = course.syllabus.map((lesson, index) =>
    index === lessonIndex ? { ...lesson, videoUrl } : lesson,
  );
  return adminUpdateContent<Course>(courseId, { data: { syllabus } });
}

export function addCourseLesson(
  courseId: string,
  course: Course,
  lesson: { title: string; durationMinutes: number; videoUrl?: string; description?: string },
): Promise<Course> {
  const syllabus = [
    ...(course.syllabus ?? []),
    { id: `les-${Date.now().toString(36)}`, ...lesson },
  ];
  return adminUpdateContent<Course>(courseId, {
    data: {
      syllabus,
      lessonsCount: syllabus.length,
      durationMinutes: syllabus.reduce((sum, item) => sum + (item.durationMinutes || 0), 0),
      durationSeconds: syllabus.reduce((sum, item) => sum + (item.durationMinutes || 0), 0) * 60,
    },
  });
}

export function getMyProgress(): Promise<{ courseId: string; percent: number }[]> {
  return get('/me/progress');
}

// ==========================================
// 6. SUBMISSIONS
// ==========================================

export function submitIdea(data: Record<string, unknown>): Promise<Submission> {
  return post<Submission>('/submissions/idea', data);
}

export function submitExperience(data: Record<string, unknown>): Promise<Submission> {
  return post<Submission>('/submissions/experience', data);
}

export function getMySubmissions(kind?: 'idea' | 'experience'): Promise<Paginated<Submission>> {
  return get<Paginated<Submission>>('/submissions/mine', { kind });
}

export function resubmitSubmission(
  id: string,
  data: Record<string, unknown>,
): Promise<Submission> {
  return patch<Submission>(`/submissions/${encodeURIComponent(id)}`, data);
}

// ==========================================
// 7. CANVASES
// ==========================================

export function saveToolCanvas(
  toolId: string,
  notes: Record<string, string>,
  title?: string,
): Promise<SavedCanvas> {
  return post<SavedCanvas>('/me/canvases', { toolId, notes, title });
}

export function getMyCanvases(): Promise<SavedCanvas[]> {
  return get<SavedCanvas[]>('/me/canvases');
}

export function getCanvasForTool(toolId: string): Promise<SavedCanvas | null> {
  return getMyCanvases().then(
    (canvases) => canvases.find((canvas) => canvas.toolId === toolId) ?? null,
  );
}

export function deleteMyCanvas(id: string): Promise<{ success: boolean }> {
  return del(`/me/canvases/${encodeURIComponent(id)}`);
}

export const deleteSavedCanvas = deleteMyCanvas;

// ==========================================
// 8. PROFILE
// ==========================================

export function getMyBookmarks(section?: SectionSlug): Promise<Paginated<ContentBase>> {
  return get<Paginated<ContentBase>>('/me/bookmarks', { section });
}

export function getMyPoints(): Promise<{ total: number; entries: PointEntry[] }> {
  return get('/me/points');
}

export async function getMyPointTransactions(): Promise<PointTransaction[]> {
  const result = await getMyPoints();
  return result.entries;
}

// ==========================================
// 9. SEARCH, BLOG, CONTACT
// ==========================================

export interface GroupedSearchResults {
  total: number;
  bySection: Record<SectionSlug | 'blog', { count: number; items: ContentBase[] }>;
}

export function searchContent(
  q: string,
  section?: SectionSlug | 'blog',
): Promise<GroupedSearchResults> {
  return get<GroupedSearchResults>('/search', { q, section });
}

export async function searchAll(q: string, section?: SectionSlug): Promise<ContentBase[]> {
  const result = await searchContent(q, section);
  if (section) return result.bySection[section]?.items ?? [];
  return Object.values(result.bySection).flatMap((bucket) => bucket.items);
}

export function getBlogPosts(page = 1): Promise<BlogPost[]> {
  return get<BlogPost[]>('/blog', { page });
}

export function getBlogPostDetail(slug: string): Promise<BlogPost> {
  return get<BlogPost>(`/blog/${encodeURIComponent(slug)}`);
}

export function submitContact(data: {
  name: string;
  phone: string;
  subject?: string;
  message: string;
}): Promise<{ success: boolean; id: string }> {
  return post('/contact', data);
}

// ==========================================
// 10. EVENTS
// ==========================================

export function registerForEvent(eventId: string): Promise<EventRegistration> {
  return post<EventRegistration>(`/events/${encodeURIComponent(eventId)}/register`);
}

export function getMyEventRegistrations(): Promise<EventRegistration[]> {
  return get<EventRegistration[]>('/me/events');
}

// ==========================================
// 11. UPLOADS
// ==========================================

export interface UploadConfig {
  mode: 'blob' | 'disk' | 'disabled';
  maxBytes: { avatar: number; submission: number; media: number };
  /** Names only. Present when uploads are off and a look-alike variable exists. */
  candidateTokenVars?: string[];
}

let uploadConfig: Promise<UploadConfig> | null = null;

/**
 * Asked once per page load, but only a successful answer is remembered. It used
 * to turn any failure into `mode: 'disk'` and cache that: on a serverless host
 * the disk route cannot work, so one failed request at page load made every
 * later upload fail with a misleading error until the tab was refreshed. A
 * failure now surfaces with the server's own message and the next upload asks
 * again.
 *
 * On a serverless host files go straight from the browser to object storage,
 * because the function body is capped well below the size of a lesson video and
 * its disk does not survive the request; a self-hosted server still takes the
 * multipart POST.
 */
export function getUploadConfig(): Promise<UploadConfig> {
  if (!uploadConfig) {
    uploadConfig = get<UploadConfig>('/uploads/config', undefined, { redirectOnUnauthorized: false }).catch(
      (error: unknown) => {
        uploadConfig = null;
        throw error;
      },
    );
  }
  return uploadConfig;
}

function mediaTypeOf(file: File): MediaAsset['type'] {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type === 'application/pdf') return 'pdf';
  return 'document';
}

/** Keeps the stored name readable without letting it steer the storage path. */
function safeName(name: string): string {
  return name.replace(/[^\p{Letter}\p{Number}._-]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 120) || 'file';
}

/**
 * How long an upload may go without making progress before it is given up on.
 *
 * The Blob client retries a failed request ten times with exponential backoff
 * (1s, 2s, 4s … 512s, each stretched by up to 2x), so a request that cannot
 * connect keeps the caller waiting for between roughly 17 and 34 minutes. To
 * the person watching the spinner that is "forever". An abort signal alone does
 * not help: the client only looks at it when the next attempt starts, which can
 * be minutes away. So the wait itself is raced against this timer.
 */
const UPLOAD_IDLE_TIMEOUT_MS = 30_000;

function uploadTimeoutError(idleMs: number): ApiError {
  return new ApiError(
    `بارگذاری فایل بیش از ${toFaDigits(Math.round(idleMs / 1000))} ثانیه پیشرفتی نداشت و متوقف شد. ` +
      'اتصال اینترنت (و فیلترشکن یا افزونهٔ مسدودکننده) را بررسی کنید و دوباره تلاش کنید.',
    0,
    'upload_timeout',
  );
}

/**
 * Runs `run` and rejects if `touch` is not called again within `idleMs`. On
 * timeout the signal is aborted too, so the work stops retrying in the
 * background instead of finishing a minute later behind a closed dialog.
 */
function withIdleTimeout<T>(
  idleMs: number,
  run: (signal: AbortSignal, touch: () => void) => Promise<T>,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let settled = false;

    const finish = (settle: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      settle();
    };
    const arm = () => {
      if (settled) return;
      clearTimeout(timer);
      timer = setTimeout(
        () =>
          finish(() => {
            controller.abort();
            reject(uploadTimeoutError(idleMs));
          }),
        idleMs,
      );
    };

    arm();
    Promise.resolve()
      .then(() => run(controller.signal, arm))
      .then(
        (value) => finish(() => resolve(value)),
        (error: unknown) => finish(() => reject(error)),
      );
  });
}

/**
 * Turns whatever an upload threw into the one error the UI shows. The Blob
 * client reports failures as plain `Error`s whose only identity is their text,
 * so they are matched by message.
 */
function toUploadError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  const message = error instanceof Error ? error.message : String(error ?? '');
  const make = (text: string, code: string) => new ApiError(text, 0, code, error);

  if (/network request (failed|timed out)|failed to fetch|networkerror|load failed/i.test(message)) {
    return make(
      'ارتباط با فضای ذخیره‌سازی برقرار نشد. اتصال اینترنت و فیلترشکن یا افزونهٔ مسدودکننده را بررسی کنید.',
      'upload_network',
    );
  }
  if (/access denied/i.test(message)) {
    return make(
      'فضای ذخیره‌سازی مجوز بارگذاری را نپذیرفت. اگر توکن Blob را تازه تنظیم کرده‌اید، باید یک استقرار جدید (Redeploy) انجام شود.',
      'upload_denied',
    );
  }
  if (/file is too large/i.test(message)) return make('حجم فایل بیش از حد مجاز است.', 'file_too_large');
  if (/content type/i.test(message)) return make('نوع این فایل برای بارگذاری مجاز نیست.', 'unsupported_media_type');
  if (/token has expired/i.test(message)) {
    return make('مجوز بارگذاری منقضی شد؛ دوباره تلاش کنید.', 'upload_token_expired');
  }
  if (/store (does not exist|has been suspended)/i.test(message)) {
    return make('فضای ذخیره‌سازی (Blob) پروژه وجود ندارد یا معلق شده است.', 'upload_store');
  }
  if (/not available|service_unavailable/i.test(message)) {
    return make('سرویس ذخیره‌سازی موقتاً در دسترس نیست؛ کمی بعد دوباره تلاش کنید.', 'upload_unavailable');
  }
  if (/aborted/i.test(message)) return make('بارگذاری لغو شد.', 'upload_aborted');
  return make('بارگذاری فایل ناموفق بود. دوباره تلاش کنید.', 'upload_failed');
}

/** The text to show for a failed upload, whatever was thrown. */
export function uploadErrorMessage(error: unknown): string {
  return toUploadError(error).message;
}

/**
 * The Blob client discards our server's reason when it refuses the token
 * request — a 401, 403 or 429 all become "Failed to retrieve the client token".
 * Asking the route again, ourselves, recovers the real answer.
 */
async function explainTokenRefusal(folder: string, file: File, original: unknown): Promise<ApiError> {
  try {
    await request('/uploads/blob', {
      method: 'POST',
      body: {
        type: 'blob.generate-client-token',
        payload: { pathname: `${folder}/${safeName(file.name)}`, clientPayload: null, multipart: false },
      },
      redirectOnUnauthorized: false,
    });
  } catch (error) {
    return toUploadError(error);
  }
  // The route accepts the same request now, so the first refusal was transient.
  return new ApiError('دریافت مجوز بارگذاری ناموفق بود؛ دوباره تلاش کنید.', 0, 'upload_token', original);
}

async function uploadToBlob(folder: string, file: File): Promise<MediaAsset> {
  try {
    const { upload: blobUpload } = await import('@vercel/blob/client');
    const result = await withIdleTimeout(UPLOAD_IDLE_TIMEOUT_MS, (signal, touch) =>
      blobUpload(`${folder}/${safeName(file.name)}`, file, {
        access: 'public',
        handleUploadUrl: `${API_BASE_URL}/uploads/blob`,
        // The upload route is state-changing, so it needs the same header every
        // other mutating request carries or the CSRF guard turns it away.
        headers: { 'X-Noafar-Client': 'web' },
        abortSignal: signal,
        // Every progress tick proves the transfer is alive and restarts the clock.
        onUploadProgress: touch,
      }),
    );
    return {
      id: result.pathname,
      type: mediaTypeOf(file),
      url: result.url,
      fileName: file.name.slice(0, 200),
      fileSizeBytes: file.size,
    };
  } catch (error) {
    if (error instanceof Error && /retrieve the client token/i.test(error.message)) {
      throw await explainTokenRefusal(folder, file, error);
    }
    throw error;
  }
}

async function uploadToDisk(endpoint: string, file: File): Promise<MediaAsset> {
  const formData = new FormData();
  formData.append('file', file);
  // A plain POST reports no progress, so allow a floor plus time for the bytes.
  const budgetMs = 60_000 + Math.ceil(file.size / 65_536) * 1_000;
  return withIdleTimeout(budgetMs, (signal) =>
    request<MediaAsset>(endpoint, { method: 'POST', body: formData, signal }),
  );
}

const UPLOADS_DISABLED_TEXT =
  'بارگذاری فایل روی این میزبان فعال نیست. فضای ذخیره‌سازی (Vercel Blob) به پروژه وصل نشده یا توکن آن ' +
  '(BLOB_READ_WRITE_TOKEN) پس از تنظیم هنوز در یک استقرار جدید (Redeploy) اعمال نشده است.';

const SIZE_LIMIT_OF: Record<'avatars' | 'submissions' | 'media', keyof UploadConfig['maxBytes']> = {
  avatars: 'avatar',
  submissions: 'submission',
  media: 'media',
};

async function upload(
  endpoint: string,
  folder: 'avatars' | 'submissions' | 'media',
  file: File,
): Promise<MediaAsset> {
  try {
    if (file.size === 0) throw new ApiError('فایل انتخاب‌شده خالی است.', 0, 'empty_file');

    const config = await getUploadConfig();
    if (config.mode === 'disabled') throw new ApiError(UPLOADS_DISABLED_TEXT, 503, 'uploads_disabled');

    const max = config.maxBytes?.[SIZE_LIMIT_OF[folder]];
    if (max && file.size > max) {
      throw new ApiError(
        `حجم فایل (${formatFileSize(file.size)}) بیش از حد مجاز (${formatFileSize(max)}) است.`,
        413,
        'file_too_large',
      );
    }

    return config.mode === 'blob' ? await uploadToBlob(folder, file) : await uploadToDisk(endpoint, file);
  } catch (error) {
    // The raw error is what a developer needs; the person sees the sentence.
    // eslint-disable-next-line no-console
    console.error(`[noafar][upload:${folder}] «${file.name}» (${file.size} B, ${file.type || '?'})`, error);
    throw toUploadError(error);
  }
}

export function uploadAvatar(file: File): Promise<MediaAsset> {
  return upload('/uploads/avatar', 'avatars', file);
}

export function uploadMedia(file: File): Promise<MediaAsset> {
  return upload('/uploads/media', 'media', file);
}

/** Image attached by a member to their own idea/experience submission. */
export function uploadSubmissionImage(file: File): Promise<MediaAsset> {
  return upload('/uploads/submission', 'submissions', file);
}

// ==========================================
// 12. ADMIN
// ==========================================

export function adminGetContent(section?: SectionSlug | 'blog', q?: string): Promise<ContentBase[]> {
  return get<ContentBase[]>('/admin/content', { section, q });
}

export function adminAddContent(
  section: SectionSlug | 'blog',
  content: Record<string, unknown>,
): Promise<ContentBase> {
  return post<ContentBase>('/admin/content', { section, content });
}

export function adminUpdateContent<T = ContentBase>(
  id: string,
  updates: Record<string, unknown>,
): Promise<T> {
  return patch<T>(`/admin/content/${encodeURIComponent(id)}`, updates);
}

export function adminDeleteContent(id: string): Promise<{ success: boolean }> {
  return del(`/admin/content/${encodeURIComponent(id)}`);
}

export function adminGetAllSubmissions(status?: string): Promise<Submission[]> {
  return get<Submission[]>('/admin/submissions', { status });
}

export function adminApproveSubmission(id: string, operatorMessage?: string): Promise<Submission> {
  return post<Submission>(`/admin/submissions/${encodeURIComponent(id)}/approve`, { operatorMessage });
}

export function adminRequestRevisionSubmission(
  id: string,
  operatorMessage: string,
): Promise<Submission> {
  return post<Submission>(`/admin/submissions/${encodeURIComponent(id)}/revision`, { operatorMessage });
}

export function adminRejectSubmission(id: string, operatorMessage?: string): Promise<Submission> {
  return post<Submission>(`/admin/submissions/${encodeURIComponent(id)}/reject`, { operatorMessage });
}

export function adminGetAllComments(): Promise<(Comment & { contentTitle?: string })[]> {
  return get<(Comment & { contentTitle?: string })[]>('/admin/comments');
}

export function adminApproveComment(commentId: string): Promise<{ success: boolean }> {
  return post(`/admin/comments/${encodeURIComponent(commentId)}/approve`);
}

export function adminDeleteComment(commentId: string): Promise<{ success: boolean }> {
  return del(`/admin/comments/${encodeURIComponent(commentId)}`);
}

export function adminGetAllContactMessages(): Promise<ContactMessage[]> {
  return get<ContactMessage[]>('/admin/contact-messages');
}

export function adminUpdateContactMessage(
  id: string,
  status: 'unread' | 'read' | 'replied',
  note?: string,
): Promise<{ success: boolean }> {
  return patch(`/admin/contact-messages/${encodeURIComponent(id)}`, { status, note });
}

export function adminDeleteContactMessage(id: string): Promise<{ success: boolean }> {
  return del(`/admin/contact-messages/${encodeURIComponent(id)}`);
}

export function adminGetAllEventRegistrations(): Promise<EventRegistration[]> {
  return get<EventRegistration[]>('/admin/event-registrations');
}

export function adminGetAllUsers(): Promise<User[]> {
  return get<User[]>('/admin/users');
}

export function adminUpdateUserRole(
  userId: string,
  role: 'member' | 'operator' | 'admin',
): Promise<{ success: boolean }> {
  return patch(`/admin/users/${encodeURIComponent(userId)}/role`, { role });
}

export function adminSetUserBlocked(
  userId: string,
  blocked: boolean,
): Promise<{ success: boolean }> {
  return patch(`/admin/users/${encodeURIComponent(userId)}/block`, { blocked });
}

export function adminAwardPoints(
  userId: string,
  points: number,
  reasonFa: string,
): Promise<{ success: boolean }> {
  return post(`/admin/users/${encodeURIComponent(userId)}/points`, { points, reasonFa });
}

export interface AdminStats {
  contentCount: number;
  pendingSubmissions: number;
  pendingComments: number;
  unreadMessages: number;
  userCount: number;
  registrationCount: number;
}

export interface SeedResult {
  success: boolean;
  skipped: boolean;
  total?: number;
  counts?: Record<string, number>;
  message: string;
}

/** Loads the sample catalogue. Safe to repeat: existing content is untouched. */
export function adminSeedContent(onlyIfEmpty = false): Promise<SeedResult> {
  return post<SeedResult>('/admin/seed', { onlyIfEmpty });
}

export function adminGetStats(): Promise<AdminStats> {
  return get<AdminStats>('/admin/stats');
}

// ==========================================
// 13. SITE SETTINGS
// ==========================================

export function getSiteSettings(): Promise<SiteSettings> {
  return get<SiteSettings>('/settings');
}

export function updateSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
  return put<SiteSettings>('/admin/settings', settings as Record<string, unknown>);
}
