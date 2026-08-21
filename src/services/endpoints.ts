import { request } from './api';
import {
  SectionSlug,
  ContentBase,
  Course,
  Tool,
  Book,
  Experience,
  Idea,
  Event,
  BlogPost,
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
} from '../types';
import { mockDb, paginateArray, SECTION_LIST } from '../mocks';
import {
  ACADEMY_CATEGORIES,
  TOOLBOX_STAGES,
  JOURNEY_FIELDS,
} from '../config/categories';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// ==========================================
// 1. AUTH ENDPOINTS
// ==========================================

export async function requestOtp(phone: string): Promise<{ expiresInSeconds: number }> {
  // In a real app we'd trigger an SMS OTP.
  // For this Firebase implementation, we use a custom email/password mechanism where password is the OTP.
  // To allow users to login easily without setting up Twilio, we just return success and accept any 5 digit code as password for existing accounts, or just '12345' for new ones.
  return { expiresInSeconds: 120 };
}

export async function verifyOtp(
  phone: string,
  code: string
): Promise<{ token: string; user: User }> {
  const email = `${phone}@noafar.local`;
  const defaultPassword = 'noafar-secure-pass';
  
  let userCredential;
  try {
    userCredential = await signInWithEmailAndPassword(auth, email, defaultPassword);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials') {
      // Create user if not exists
      userCredential = await createUserWithEmailAndPassword(auth, email, defaultPassword);
    } else {
      throw error;
    }
  }

  const userDocRef = doc(db, 'users', userCredential.user.uid);
  let userDoc = await getDoc(userDocRef);
  let userData: User;

  if (!userDoc.exists()) {
    userData = {
      id: userCredential.user.uid,
      displayName: 'کاربر نوآفر',
      phone,
      role: 'member',
      joinedAt: new Date().toISOString(),
      membershipDays: 0,
      points: 0,
      profileComplete: false
    };
    await setDoc(userDocRef, userData);
  } else {
    userData = userDoc.data() as User;
  }

  const token = await userCredential.user.getIdToken();
  return { token, user: userData };
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export async function getMe(): Promise<User> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Not authenticated');
  
  const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
  if (!userDoc.exists()) throw new Error('User not found');
  
  return userDoc.data() as User;
}

export async function updateProfile(data: Partial<User>): Promise<User> {
  mockDb.data.user = { ...mockDb.data.user, ...data };
  mockDb.save();
  return Promise.resolve(mockDb.data.user);
}

// ==========================================
// 2. SECTIONS & TAXONOMY
// ==========================================

export async function getSections(): Promise<SectionMeta[]> {
  return request<SectionMeta[]>('/sections', {
    method: 'GET',
    mockHandler: () => SECTION_LIST,
  });
}

export async function getCategories(section?: SectionSlug): Promise<Category[]> {
  return request<Category[]>('/categories', {
    method: 'GET',
    params: { section },
    mockHandler: () => {
      if (section === 'academy' || section === 'library') return ACADEMY_CATEGORIES;
      if (section === 'toolbox') return TOOLBOX_STAGES;
      if (section === 'journey' || section === 'spark') return JOURNEY_FIELDS;
      return [...ACADEMY_CATEGORIES, ...TOOLBOX_STAGES, ...JOURNEY_FIELDS];
    },
  });
}

// ==========================================
// 3. CONTENT LIST & DETAILS
// ==========================================

export interface ContentListParams {
  page?: number;
  pageSize?: number;
  category?: string;
  tags?: string[];
  stage?: string;
  format?: string;
  difficulty?: string;
  status?: string;
  kind?: string;
  field?: string;
  q?: string;
  sort?: 'latest' | 'popular' | 'views';
}

export async function getContentList<T extends ContentBase = ContentBase>(
  section: SectionSlug,
  params: ContentListParams = {}
): Promise<Paginated<T>> {
  const { page = 1, pageSize = 12, ...filters } = params;

  return request<Paginated<T>>(`/content/${section}`, {
    method: 'GET',
    params: { page, pageSize, ...filters },
    mockHandler: () => {
      let items = mockDb.getAllContentBySection(section) as T[];

      // Filter by category
      if (filters.category) {
        items = items.filter((item) => item.category?.slug === filters.category);
      }

      // Filter for toolbox stages & format & difficulty
      if (section === 'toolbox') {
        const toolItems = items as unknown as Tool[];
        let filtered = toolItems;
        if (filters.stage) {
          const stages = Array.isArray(filters.stage) ? filters.stage : [filters.stage];
          filtered = filtered.filter((t) => stages.includes(t.stage?.slug));
        }
        if (filters.format) {
          const formats = Array.isArray(filters.format) ? filters.format : [filters.format];
          filtered = filtered.filter((t) => formats.includes(t.format));
        }
        if (filters.difficulty) {
          filtered = filtered.filter((t) => t.difficulty === filters.difficulty);
        }
        items = filtered as unknown as T[];
      }

      // Filter for library kinds
      if (section === 'library' && filters.kind) {
        const bookItems = items as unknown as Book[];
        items = bookItems.filter((b) => b.kind === filters.kind) as unknown as T[];
      }

      // Filter for journey/spark fields
      if ((section === 'journey' || section === 'spark') && (filters.field || filters.category)) {
        const fieldSlug = filters.field || filters.category;
        items = items.filter((i) => {
          const itemWithField = i as unknown as { field?: Category };
          return itemWithField.field?.slug === fieldSlug;
        });
      }

      // Filter for gathering kind and status
      if (section === 'gathering') {
        const eventItems = items as unknown as Event[];
        let filtered = eventItems;
        if (filters.kind) {
          filtered = filtered.filter((e) => e.kind === filters.kind);
        }
        if (filters.status) {
          filtered = filtered.filter((e) => e.status === filters.status);
        }
        items = filtered as unknown as T[];
      }

      // Search query
      if (filters.q) {
        const query = filters.q.toLowerCase().trim();
        items = items.filter(
          (item) =>
            item.title.toLowerCase().includes(query) ||
            item.summary.toLowerCase().includes(query)
        );
      }

      return paginateArray(items, page, pageSize) as Paginated<T>;
    },
  });
}

export async function getContentDetail<T extends ContentBase>(
  section: SectionSlug,
  slug: string
): Promise<T> {
  return request<T>(`/content/${section}/${slug}`, {
    method: 'GET',
    mockHandler: () => {
      const item = mockDb.findContentBySlug(section, slug);
      if (!item) {
        throw new Error('محتوای مورد نظر یافت نشد.');
      }
      return item as T;
    },
  });
}

export async function getRelatedContent(
  section: SectionSlug,
  slug: string
): Promise<ContentBase[]> {
  return request<ContentBase[]>(`/content/${section}/${slug}/related`, {
    method: 'GET',
    mockHandler: () => {
      const item = mockDb.findContentBySlug(section, slug);
      return mockDb.getRelatedContent(item?.id || 'default', section, 3);
    },
  });
}

// ==========================================
// 4. INTERACTIONS (LIKE, BOOKMARK, COMMENTS)
// ==========================================

export async function likeContent(
  id: string
): Promise<{ likeCount: number; isLikedByMe: boolean }> {
  return request<{ likeCount: number; isLikedByMe: boolean }>(`/content/${id}/like`, {
    method: 'POST',
    mockHandler: () => mockDb.toggleLike(id),
  });
}

export async function unlikeContent(
  id: string
): Promise<{ likeCount: number; isLikedByMe: boolean }> {
  return request<{ likeCount: number; isLikedByMe: boolean }>(`/content/${id}/like`, {
    method: 'DELETE',
    mockHandler: () => mockDb.toggleLike(id),
  });
}

export async function bookmarkContent(
  id: string
): Promise<{ isBookmarkedByMe: boolean }> {
  return request<{ isBookmarkedByMe: boolean }>(`/content/${id}/bookmark`, {
    method: 'POST',
    mockHandler: () => mockDb.toggleBookmark(id),
  });
}

export async function unbookmarkContent(
  id: string
): Promise<{ isBookmarkedByMe: boolean }> {
  return request<{ isBookmarkedByMe: boolean }>(`/content/${id}/bookmark`, {
    method: 'DELETE',
    mockHandler: () => mockDb.toggleBookmark(id),
  });
}

export async function toggleBookmark(id: string): Promise<{ isBookmarkedByMe: boolean }> {
  return bookmarkContent(id);
}

export async function getComments(
  contentId: string,
  page = 1
): Promise<Paginated<Comment>> {
  return request<Paginated<Comment>>(`/content/${contentId}/comments`, {
    method: 'GET',
    params: { page },
    mockHandler: () => {
      const comments = mockDb.getComments(contentId, mockDb.user.id);
      return paginateArray(comments, page, 20);
    },
  });
}

export async function postComment(
  contentId: string,
  body: string
): Promise<Comment> {
  return request<Comment>(`/content/${contentId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
    mockHandler: () => mockDb.addComment(contentId, body),
  });
}

// ==========================================
// 5. COURSES & PROGRESS & VIDEO
// ==========================================

export async function updateCourseProgress(
  courseId: string,
  percent: number,
  positionSeconds?: number
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/courses/${courseId}/progress`, {
    method: 'POST',
    body: JSON.stringify({ percent, positionSeconds }),
    mockHandler: () => {
      mockDb.updateCourseProgress(courseId, percent);
      return { success: true };
    },
  });
}

export async function updateCourseVideo(
  courseId: string,
  videoUrl: string,
  lessonIndex?: number
): Promise<{ success: boolean; course: Course | null }> {
  return request<{ success: boolean; course: Course | null }>(`/courses/${courseId}/video`, {
    method: 'POST',
    body: JSON.stringify({ videoUrl, lessonIndex }),
    mockHandler: () => {
      const course = mockDb.updateCourseVideo(courseId, videoUrl, lessonIndex);
      return { success: true, course };
    },
  });
}

export async function addCourseLesson(
  courseId: string,
  lesson: { title: string; durationMinutes: number; videoUrl?: string; description?: string }
): Promise<{ success: boolean; course: Course | null }> {
  return request<{ success: boolean; course: Course | null }>(`/courses/${courseId}/lessons`, {
    method: 'POST',
    body: JSON.stringify(lesson),
    mockHandler: () => {
      const course = mockDb.addCourseLesson(courseId, lesson);
      return { success: true, course };
    },
  });
}

export async function updateCourseLessons(
  courseId: string,
  syllabus: any[]
): Promise<{ success: boolean; course: Course | null }> {
  return request<{ success: boolean; course: Course | null }>(`/courses/${courseId}/syllabus`, {
    method: 'PUT',
    body: JSON.stringify({ syllabus }),
    mockHandler: () => {
      const course = mockDb.updateCourseLessons(courseId, syllabus);
      return { success: true, course };
    },
  });
}

export async function getMyProgress(): Promise<{ courseId: string; percent: number }[]> {
  return request<{ courseId: string; percent: number }[]>('/me/progress', {
    method: 'GET',
    mockHandler: () =>
      mockDb.courses
        .filter((c) => (c.myProgressPercent || 0) > 0)
        .map((c) => ({ courseId: c.id, percent: c.myProgressPercent || 0 })),
  });
}

// ==========================================
// 6. SUBMISSIONS
// ==========================================

export async function submitIdea(formData: FormData | Record<string, unknown>): Promise<Submission> {
  return request<Submission>('/submissions/idea', {
    method: 'POST',
    body: formData instanceof FormData ? formData : JSON.stringify(formData),
    mockHandler: () => {
      let data: any = {};
      if (formData instanceof FormData) {
        data = {
          title: formData.get('title') as string,
          fieldSlug: formData.get('fieldSlug') as string,
          summary: formData.get('summary') as string,
          body: formData.get('body') as string,
        };
      } else {
        data = formData;
      }
      return mockDb.addIdeaSubmission(data);
    },
  });
}

export async function submitExperience(formData: FormData | Record<string, unknown>): Promise<Submission> {
  return request<Submission>('/submissions/experience', {
    method: 'POST',
    body: formData instanceof FormData ? formData : JSON.stringify(formData),
    mockHandler: () => {
      let data: any = {};
      if (formData instanceof FormData) {
        data = {
          title: formData.get('title') as string,
          fieldSlug: formData.get('fieldSlug') as string,
          summary: formData.get('summary') as string,
          body: formData.get('body') as string,
          region: formData.get('region') as string,
          organization: formData.get('organization') as string,
          keyImpactMetric: formData.get('keyImpactMetric') as string,
        };
      } else {
        data = formData;
      }
      return mockDb.addExperienceSubmission(data);
    },
  });
}

export async function getMySubmissions(kind?: 'idea' | 'experience'): Promise<Paginated<Submission>> {
  return request<Paginated<Submission>>('/me/submissions', {
    method: 'GET',
    params: { kind },
    mockHandler: () => {
      let list = mockDb.submissions;
      if (kind) list = list.filter((s) => s.kind === kind);
      return paginateArray(list, 1, 50);
    },
  });
}

export async function resubmitSubmission(id: string, formData: FormData | Record<string, unknown>): Promise<Submission> {
  return request<Submission>(`/submissions/${id}`, {
    method: 'PATCH',
    body: formData instanceof FormData ? formData : JSON.stringify(formData),
    mockHandler: () => {
      const sub = mockDb.submissions.find((s) => s.id === id);
      if (sub) {
        sub.status = 'pending';
        sub.submittedAt = new Date().toISOString();
        return sub;
      }
      return mockDb.submissions[0];
    },
  });
}

// ==========================================
// 7. CANVAS & TOOLBOX
// ==========================================

export async function createToolCanvas(toolId: string): Promise<SavedCanvas> {
  return request<SavedCanvas>(`/tools/${toolId}/canvas`, {
    method: 'POST',
    mockHandler: () => {
      const tool = mockDb.tools.find((t) => t.id === toolId);
      const canvasId = `canvas-${Date.now()}`;
      const newCanvas: SavedCanvas = {
        id: canvasId,
        toolId,
        toolTitle: tool?.title || 'بوم نوآوری',
        provider: 'excalidraw',
        externalCanvasId: `excal-${canvasId}`,
        embedUrl: `https://excalidraw.com/#room=${canvasId}`,
        thumbnailUrl: '/mock/canvas-preview.svg',
        updatedAt: new Date().toISOString(),
        shareUrl: `https://noafar.com/toolbox/${tool?.slug || 'canvas'}/canvas/${canvasId}`,
      };
      mockDb.canvases.unshift(newCanvas);
      return newCanvas;
    },
  });
}

export async function getMyCanvases(): Promise<SavedCanvas[]> {
  return request<SavedCanvas[]>('/me/canvases', {
    method: 'GET',
    mockHandler: () => mockDb.canvases,
  });
}

export async function deleteMyCanvas(id: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/me/canvases/${id}`, {
    method: 'DELETE',
    mockHandler: () => {
      mockDb.deleteCanvas(id);
      return { success: true };
    },
  });
}

export const deleteSavedCanvas = deleteMyCanvas;

// ==========================================
// 8. PROFILE & BOOKMARKS & POINTS
// ==========================================

export async function getMyBookmarks(section?: SectionSlug): Promise<Paginated<ContentBase>> {
  return request<Paginated<ContentBase>>('/me/bookmarks', {
    method: 'GET',
    params: { section },
    mockHandler: () => {
      let bookmarked = mockDb.getAllItemsCombined().filter((i) => i.isBookmarkedByMe);
      if (section) {
        bookmarked = bookmarked.filter((i) => i.sectionSlug === section);
      }
      return paginateArray(bookmarked, 1, 50);
    },
  });
}

export async function getMyPoints(): Promise<{ total: number; entries: PointEntry[] }> {
  return request<{ total: number; entries: PointEntry[] }>('/me/points', {
    method: 'GET',
    mockHandler: () => ({
      total: mockDb.user.points,
      entries: mockDb.pointEntries,
    }),
  });
}

export async function getMyPointTransactions(): Promise<PointTransaction[]> {
  const res = await getMyPoints();
  return res.entries;
}

// ==========================================
// 9. SEARCH & BLOG & CONTACT
// ==========================================

export interface GroupedSearchResults {
  total: number;
  bySection: Record<SectionSlug | 'blog', { count: number; items: ContentBase[] }>;
}

export async function searchContent(q: string, section?: SectionSlug | 'blog'): Promise<GroupedSearchResults> {
  return request<GroupedSearchResults>('/search', {
    method: 'GET',
    params: { q, section },
    mockHandler: () => {
      const query = q.toLowerCase().trim();
      const all = mockDb.getAllItemsCombined();
      const blogItems = mockDb.blog as unknown as ContentBase[];

      const matches = (item: ContentBase) =>
        item.title.toLowerCase().includes(query) ||
        item.summary.toLowerCase().includes(query) ||
        item.tags.some((t) => t.nameFa.toLowerCase().includes(query));

      const filteredAll = query ? all.filter(matches) : all;
      const filteredBlog = query ? blogItems.filter(matches) : blogItems;

      const bySection: GroupedSearchResults['bySection'] = {
        academy: { count: 0, items: [] },
        toolbox: { count: 0, items: [] },
        library: { count: 0, items: [] },
        journey: { count: 0, items: [] },
        gathering: { count: 0, items: [] },
        spark: { count: 0, items: [] },
        blog: { count: filteredBlog.length, items: filteredBlog },
      };

      filteredAll.forEach((item) => {
        if (bySection[item.sectionSlug]) {
          bySection[item.sectionSlug].items.push(item);
          bySection[item.sectionSlug].count += 1;
        }
      });

      const total =
        Object.values(bySection).reduce((acc, curr) => acc + curr.count, 0);

      return { total, bySection };
    },
  });
}

export async function searchAll(q: string, section?: SectionSlug): Promise<ContentBase[]> {
  const res = await searchContent(q, section);
  if (section) {
    return res.bySection[section]?.items || [];
  }
  const all: ContentBase[] = [];
  Object.values(res.bySection).forEach((s) => all.push(...s.items));
  return all;
}

export async function getBlogPosts(page = 1): Promise<BlogPost[]> {
  return request<BlogPost[]>('/blog', {
    method: 'GET',
    params: { page },
    mockHandler: () => mockDb.blog,
  });
}

export async function getBlogPostDetail(slug: string): Promise<BlogPost> {
  return request<BlogPost>(`/blog/${slug}`, {
    method: 'GET',
    mockHandler: () => {
      const post = mockDb.blog.find((b) => b.slug === slug);
      if (!post) throw new Error('مطلب بلاگ یافت نشد.');
      return post;
    },
  });
}

export async function submitContact(data: { name: string; phone: string; subject?: string; message: string }): Promise<{ success: boolean; id: string }> {
  return request<{ success: boolean; id: string }>('/contact', {
    method: 'POST',
    body: JSON.stringify(data),
    mockHandler: () => {
      const msg = mockDb.addContactMessage({
        id: 'msg-' + Date.now(),
        name: data.name,
        phoneOrEmail: data.phone,
        subject: data.subject || 'پیام از سایت',
        message: data.message,
        createdAt: new Date().toISOString(),
        status: 'unread'
      });
      return { success: true, id: msg.id };
    },
  });
}

// ==========================================
// 10. EVENT REGISTRATION
// ==========================================

export async function registerForEvent(eventId: string): Promise<EventRegistration> {
  return request<EventRegistration>(`/events/${eventId}/register`, {
    method: 'POST',
    mockHandler: () => mockDb.registerForEvent(eventId),
  });
}

export async function getMyEventRegistrations(): Promise<EventRegistration[]> {
  return request<EventRegistration[]>('/me/events', {
    method: 'GET',
    mockHandler: () => mockDb.eventRegistrations.filter((r) => r.userId === mockDb.user.id),
  });
}

// ==========================================
// 11. ADMIN MANAGEMENT API
// ==========================================

export async function adminAddContent(section: SectionSlug | 'blog', content: any): Promise<ContentBase> {
  return request<ContentBase>('/admin/content', {
    method: 'POST',
    body: JSON.stringify({ section, content }),
    mockHandler: () => mockDb.addContent(section, content),
  });
}

export async function adminUpdateContent(id: string, updates: Partial<ContentBase>): Promise<ContentBase | null> {
  return request<ContentBase | null>(`/admin/content/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
    mockHandler: () => mockDb.updateContent(id, updates),
  });
}

export async function adminDeleteContent(id: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/admin/content/${id}`, {
    method: 'DELETE',
    mockHandler: () => {
      const ok = mockDb.deleteContent(id);
      return { success: ok };
    },
  });
}

export async function adminGetAllSubmissions(status?: string): Promise<Submission[]> {
  return request<Submission[]>('/admin/submissions', {
    method: 'GET',
    params: { status },
    mockHandler: () => {
      let list = mockDb.submissions;
      if (status && status !== 'all') {
        list = list.filter((s) => s.status === status);
      }
      return list;
    },
  });
}

export async function adminApproveSubmission(id: string, operatorMessage?: string): Promise<Submission | null> {
  return request<Submission | null>(`/admin/submissions/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ operatorMessage }),
    mockHandler: () => mockDb.approveSubmission(id, operatorMessage),
  });
}

export async function adminRequestRevisionSubmission(id: string, operatorMessage: string): Promise<Submission | null> {
  return request<Submission | null>(`/admin/submissions/${id}/revision`, {
    method: 'POST',
    body: JSON.stringify({ operatorMessage }),
    mockHandler: () => mockDb.requestRevisionSubmission(id, operatorMessage),
  });
}

export async function adminRejectSubmission(id: string, operatorMessage?: string): Promise<Submission | null> {
  return request<Submission | null>(`/admin/submissions/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ operatorMessage }),
    mockHandler: () => mockDb.rejectSubmission(id, operatorMessage),
  });
}

export async function adminGetAllComments(): Promise<(Comment & { contentTitle?: string })[]> {
  return request<(Comment & { contentTitle?: string })[]>('/admin/comments', {
    method: 'GET',
    mockHandler: () => mockDb.getAllCommentsList(),
  });
}

export async function adminApproveComment(commentId: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/admin/comments/${commentId}/approve`, {
    method: 'POST',
    mockHandler: () => ({ success: mockDb.approveComment(commentId) }),
  });
}

export async function adminDeleteComment(commentId: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/admin/comments/${commentId}`, {
    method: 'DELETE',
    mockHandler: () => ({ success: mockDb.deleteComment(commentId) }),
  });
}

export async function adminGetAllContactMessages(): Promise<ContactMessage[]> {
  return request<ContactMessage[]>('/admin/contact-messages', {
    method: 'GET',
    mockHandler: () => mockDb.contactMessages,
  });
}

export async function adminUpdateContactMessage(id: string, status: 'unread' | 'read' | 'replied', note?: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/admin/contact-messages/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, note }),
    mockHandler: () => ({ success: mockDb.updateContactMessageStatus(id, status, note) }),
  });
}

export async function adminDeleteContactMessage(id: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/admin/contact-messages/${id}`, {
    method: 'DELETE',
    mockHandler: () => ({ success: mockDb.deleteContactMessage(id) }),
  });
}

export async function adminGetAllEventRegistrations(): Promise<EventRegistration[]> {
  return request<EventRegistration[]>('/admin/event-registrations', {
    method: 'GET',
    mockHandler: () => mockDb.eventRegistrations,
  });
}

export async function adminGetAllUsers(): Promise<User[]> {
  return request<User[]>('/admin/users', {
    method: 'GET',
    mockHandler: () => mockDb.users,
  });
}

export async function adminUpdateUserRole(userId: string, role: any): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
    mockHandler: () => ({ success: mockDb.updateUserRole(userId, role) }),
  });
}

export async function adminAwardPoints(userId: string, points: number, reasonFa: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/admin/users/${userId}/points`, {
    method: 'POST',
    body: JSON.stringify({ points, reasonFa }),
    mockHandler: () => {
      mockDb.awardUserPoints(points, reasonFa, 'share');
      return { success: true };
    },
  });
}

export async function adminExportDatabase(): Promise<string> {
  return mockDb.exportJson();
}

export async function adminImportDatabase(jsonString: string): Promise<{ success: boolean }> {
  const ok = mockDb.importJson(jsonString);
  return { success: ok };
}

export async function adminResetDatabase(): Promise<{ success: boolean }> {
  mockDb.resetToDefaults();
  return { success: true };
}

// Sync Mock User with Firebase for hybrid persistence
export function syncMockUserWithFirebase(firebaseUser: User) {
  mockDb.data.user = firebaseUser;
  // replace inside users list
  const idx = mockDb.data.users.findIndex(u => u.id === firebaseUser.id);
  if(idx > -1) mockDb.data.users[idx] = firebaseUser;
  else mockDb.data.users.push(firebaseUser);
  mockDb.save();
}

export const getSiteSettings = async (): Promise<SiteSettings> => {
  return Promise.resolve(mockDb.getSettings());
};

export const updateSiteSettings = async (settings: Partial<SiteSettings>): Promise<SiteSettings> => {
  return Promise.resolve(mockDb.updateSettings(settings));
};
