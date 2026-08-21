import { del, get, patch, post, put, request } from './api';
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

async function upload(endpoint: string, file: File): Promise<MediaAsset> {
  const formData = new FormData();
  formData.append('file', file);
  return request<MediaAsset>(endpoint, { method: 'POST', body: formData });
}

export function uploadAvatar(file: File): Promise<MediaAsset> {
  return upload('/uploads/avatar', file);
}

export function uploadMedia(file: File): Promise<MediaAsset> {
  return upload('/uploads/media', file);
}

/** Image attached by a member to their own idea/experience submission. */
export function uploadSubmissionImage(file: File): Promise<MediaAsset> {
  return upload('/uploads/submission', file);
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
