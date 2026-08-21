import { SiteSettings } from "../types";
import {
  SectionSlug,
  ContentBase,
  Course,
  CourseLesson,
  Tool,
  Book,
  Experience,
  Idea,
  Event,
  BlogPost,
  Comment,
  Submission,
  SavedCanvas,
  ContactMessage,
  EventRegistration,
  PointTransaction,
  User,
} from '../types';
import { MOCK_COURSES } from '../mocks/courses';
import { MOCK_TOOLS } from '../mocks/tools';
import { MOCK_BOOKS } from '../mocks/books';
import { MOCK_EXPERIENCES } from '../mocks/experiences';
import { MOCK_EVENTS } from '../mocks/events';
import { MOCK_IDEAS } from '../mocks/ideas';
import { MOCK_BLOG_POSTS } from '../mocks/blog';
import {
  MOCK_CURRENT_USER,
  MOCK_SUBMISSIONS,
  MOCK_SAVED_CANVASES,
  MOCK_POINT_ENTRIES,
} from '../mocks/user';

const DB_STORAGE_KEY = 'noafar_live_db_v2';

interface DatabaseSchema {
  settings: SiteSettings;
  courses: Course[];
  tools: Tool[];
  books: Book[];
  experiences: Experience[];
  events: Event[];
  ideas: Idea[];
  blog: BlogPost[];
  submissions: Submission[];
  canvases: SavedCanvas[];
  comments: Record<string, Comment[]>;
  contactMessages: ContactMessage[];
  eventRegistrations: EventRegistration[];
  users: User[];
  user: User;
  pointEntries: PointTransaction[];
}

function getInitialDatabase(): DatabaseSchema {
  const initialUser: User = {
    ...MOCK_CURRENT_USER,
    role: 'member', // Default initial user is a regular member
  };

  const initialOtherUsers: User[] = [
    initialUser,
    {
      id: 'u-admin-root',
      displayName: 'مدیر ارشد سامانه نوآفر',
      phone: '09000000000',
      role: 'admin',
      points: 1500,
      avatarUrl: '/mock/avatar.svg',
      bio: 'راهبر ارشد پلتفرم نوآوری اجتماعی نوآفر',
      joinedAt: '2023-01-01T00:00:00Z',
      membershipDays: 450,
      profileComplete: true,
    },
    {
      id: 'u-comm-1',
      displayName: 'زهرا موسوی',
      phone: '09123456789',
      role: 'member',
      points: 250,
      avatarUrl: '/mock/avatar.svg',
      bio: 'پژوهشگر ارشد توسعه محلی و اقتصاد تعاون',
      joinedAt: '2023-10-12T00:00:00Z',
      membershipDays: 280,
      profileComplete: true,
    },
    {
      id: 'u-comm-2',
      displayName: 'امید رستمی',
      phone: '09351234567',
      role: 'member',
      points: 420,
      avatarUrl: '/mock/avatar.svg',
      bio: 'تسهیلگر نوآوری آموزشی در مدارس محروم',
      joinedAt: '2023-11-05T00:00:00Z',
      membershipDays: 250,
      profileComplete: true,
    },
    {
      id: 'u-comm-3',
      displayName: 'مهدی کشاورز',
      phone: '09187654321',
      role: 'member',
      points: 610,
      avatarUrl: '/mock/avatar.svg',
      bio: 'فعال احیای زنجیره تامین زعفران و پسته بومی',
      joinedAt: '2023-09-20T00:00:00Z',
      membershipDays: 320,
      profileComplete: true,
    },
  ];

  const initialComments: Record<string, Comment[]> = {
    'course-1': [
      {
        id: 'c-1',
        contentId: 'course-1',
        author: { id: 'u-comm-1', displayName: 'زهرا موسوی', avatarUrl: '/mock/avatar.svg' },
        body: 'بسیار دوره کاربردی و دقیقی بود، به خصوص بخش مربوط به نقشه همدلی و تفکیک دردها از نیازها.',
        createdAt: '2024-02-16T14:30:00Z',
        status: 'approved',
      },
      {
        id: 'c-2',
        contentId: 'course-1',
        author: { id: 'u-comm-2', displayName: 'امید رستمی', avatarUrl: '/mock/avatar.svg' },
        body: 'آیا برای مدارس هم امکان بومی‌سازی این فایل‌های کارگاهی وجود دارد؟',
        createdAt: '2024-02-17T09:15:00Z',
        status: 'approved',
      },
    ],
    'tool-1': [
      {
        id: 'c-3',
        contentId: 'tool-1',
        author: { id: 'u-comm-3', displayName: 'مهدی کشاورز', avatarUrl: '/mock/avatar.svg' },
        body: 'ما در تعاونی روستایی خودمان از این بوم استفاده کردیم و تکلیف جریان‌های درآمدی کاملاً شفاف شد.',
        createdAt: '2024-02-12T11:00:00Z',
        status: 'approved',
      },
    ],
  };

  const initialContactMessages: ContactMessage[] = [
    {
      id: 'contact-1',
      name: 'دکتر علی کاظمی',
      phoneOrEmail: '09121112233',
      subject: 'همکاری دانشگاهی و رویداد',
      message: 'با سلام، از دانشگاه صنعتی شریف تمایل داریم کارگاه مشترک طراحی کسب‌وکار اجتماعی را در اردیبهشت ماه برگزار کنیم.',
      createdAt: new Date(Date.now() - 3600 * 24 * 2 * 1000).toISOString(),
      status: 'unread',
    },
    {
      id: 'contact-2',
      name: 'مریم سلیمانی',
      phoneOrEmail: 'maryam.s@gmail.com',
      subject: 'همکاری در تولید محتوا',
      message: 'سلام و احترام، بسته درسنامه‌های ترجمه شده استنفورد در حوزه اثرسنجی اجتماعی را آماده کرده‌ام که جهت ارزیابی خدمتتان ارسال کنم.',
      createdAt: new Date(Date.now() - 3600 * 24 * 5 * 1000).toISOString(),
      status: 'read',
    },
  ];

  const initialEventRegistrations: EventRegistration[] = [
    {
      id: 'reg-1',
      eventId: 'event-1',
      eventTitle: 'کارگاه بوم‌مدل کسب‌وکار اجتماعی',
      userId: 'u-me-1',
      userName: 'محمدرضا علوی',
      userPhone: '09121234567',
      registeredAt: new Date(Date.now() - 3600 * 24 * 3 * 1000).toISOString(),
      ticketCode: 'NOAFAR-EV-9021',
      status: 'confirmed',
    },
  ];

  return {
    courses: [...MOCK_COURSES],
    tools: [...MOCK_TOOLS],
    books: [...MOCK_BOOKS],
    experiences: [...MOCK_EXPERIENCES],
    events: [...MOCK_EVENTS],
    ideas: [...MOCK_IDEAS],
    blog: [...MOCK_BLOG_POSTS],
    submissions: [...MOCK_SUBMISSIONS],
    canvases: [...MOCK_SAVED_CANVASES],
    comments: initialComments,
    contactMessages: initialContactMessages,
    eventRegistrations: initialEventRegistrations,
    users: initialOtherUsers,
    user: initialUser,
    pointEntries: [...MOCK_POINT_ENTRIES],
    settings: {
      heroTitle: "مدرسه کنشگری نوآفر",
      heroSubtitle: "بستری برای یادگیری، تجربه و خلق ارزش‌های اجتماعی",
      aboutText: "نوآفر، پلتفرمی تخصصی برای توانمندسازی کنشگران اجتماعی است.",
      contactEmail: "info@noafar.ir",
      contactPhone: "۰۲۱-۱۲۳۴۵۶۷۸",
      contactAddress: "تهران، میدان انقلاب، پلاک ۱",
      footerDescription: "اولین پلتفرم جامع آموزش و توانمندسازی کنشگران اجتماعی",
      footerCopyright: "تمام حقوق برای پلتفرم نوآفر محفوظ است.",
    },
  };
}

class PersistentLiveDatabase {
  public data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      const stored = localStorage.getItem(DB_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate essential arrays
        if (parsed.courses && parsed.tools && parsed.books && parsed.submissions) {
          return parsed;
        }
      }
    } catch {
      // Ignore
    }
    const fresh = getInitialDatabase();
    this.save(fresh);
    return fresh;
  }

  public save(dataToSave?: DatabaseSchema): void {
    const toSave = dataToSave || this.data;
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(toSave));
      window.dispatchEvent(new CustomEvent('noafar:db:update'));
    } catch {
      // Ignore storage quota errors
    }
  }

  // Generic getter
  public getData(): DatabaseSchema {
    return this.data;
  }

  // Get current active user
  get user(): User {
    return this.data.user;
  }

  set user(u: User) {
    this.data.user = u;
    const idx = this.data.users.findIndex((item) => item.id === u.id);
    if (idx !== -1) {
      this.data.users[idx] = u;
    } else {
      this.data.users.push(u);
    }
    this.save();
  }

  get courses(): Course[] {
    return this.data.courses;
  }
  get tools(): Tool[] {
    return this.data.tools;
  }
  get books(): Book[] {
    return this.data.books;
  }
  get experiences(): Experience[] {
    return this.data.experiences;
  }
  get events(): Event[] {
    return this.data.events;
  }
  get ideas(): Idea[] {
    return this.data.ideas;
  }
  get blog(): BlogPost[] {
    return this.data.blog;
  }
  get submissions(): Submission[] {
    return this.data.submissions;
  }
  get canvases(): SavedCanvas[] {
    return this.data.canvases;
  }
  get comments(): Record<string, Comment[]> {
    return this.data.comments;
  }
  get contactMessages(): ContactMessage[] {
    return this.data.contactMessages;
  }
  get eventRegistrations(): EventRegistration[] {
    return this.data.eventRegistrations;
  }
  get users(): User[] {
    return this.data.users;
  }
  get pointEntries(): PointTransaction[] {
    return this.data.pointEntries;
  }

  // ----------------------------------------------------
  // CONTENT QUERY & MUTATIONS
  // ----------------------------------------------------

  getAllContentBySection(section: SectionSlug): ContentBase[] {
    switch (section) {
      case 'academy':
        return this.data.courses;
      case 'toolbox':
        return this.data.tools;
      case 'library':
        return this.data.books;
      case 'journey':
        return this.data.experiences;
      case 'gathering':
        return this.data.events;
      case 'spark':
        return this.data.ideas;
      default:
        return [];
    }
  }

  getAllItemsCombined(): ContentBase[] {
    return [
      ...this.data.courses,
      ...this.data.tools,
      ...this.data.books,
      ...this.data.experiences,
      ...this.data.events,
      ...this.data.ideas,
    ];
  }

  findContentBySlug(section: SectionSlug, slug: string): ContentBase | undefined {
    const list = this.getAllContentBySection(section);
    return list.find((item) => item.slug === slug);
  }

  findContentById(id: string): ContentBase | undefined {
    return (
      this.getAllItemsCombined().find((item) => item.id === id) ||
      this.data.blog.find((item) => item.id === id)
    );
  }

  getRelatedContent(currentId: string, _section: SectionSlug, count = 3): ContentBase[] {
    const all = this.getAllItemsCombined().filter((item) => item.id !== currentId);
    if (all.length === 0) return [];
    const seed = currentId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const related: ContentBase[] = [];
    for (let i = 0; i < count && i < all.length; i++) {
      const idx = (seed + i * 7) % all.length;
      related.push(all[idx]);
    }
    return related;
  }

  // Add / Create Content (Admin or System)
  addContent(section: SectionSlug | 'blog', content: any): ContentBase {
    const newContent = {
      id: content.id || `content-${Date.now()}`,
      sectionSlug: section === 'blog' ? 'academy' : section,
      title: content.title,
      slug: content.slug || `item-${Date.now()}`,
      summary: content.summary || '',
      body: content.body || '',
      category: content.category,
      tags: content.tags || [],
      likeCount: content.likeCount || 0,
      commentCount: content.commentCount || 0,
      isLikedByMe: false,
      isBookmarkedByMe: false,
      publishedAt: content.publishedAt || new Date().toISOString(),
      ...content,
    };

    if (section === 'academy') this.data.courses.unshift(newContent as Course);
    else if (section === 'toolbox') this.data.tools.unshift(newContent as Tool);
    else if (section === 'library') this.data.books.unshift(newContent as Book);
    else if (section === 'journey') this.data.experiences.unshift(newContent as Experience);
    else if (section === 'gathering') this.data.events.unshift(newContent as Event);
    else if (section === 'spark') this.data.ideas.unshift(newContent as Idea);
    else if (section === 'blog') this.data.blog.unshift(newContent as BlogPost);

    this.save();
    return newContent;
  }

  // Update Content
  updateContent(id: string, updates: Partial<ContentBase>): ContentBase | null {
    const target = this.findContentById(id);
    if (!target) return null;
    Object.assign(target, updates);
    this.save();
    return target;
  }

  // Delete Content
  deleteContent(id: string): boolean {
    this.data.courses = this.data.courses.filter((c) => c.id !== id);
    this.data.tools = this.data.tools.filter((t) => t.id !== id);
    this.data.books = this.data.books.filter((b) => b.id !== id);
    this.data.experiences = this.data.experiences.filter((e) => e.id !== id);
    this.data.events = this.data.events.filter((ev) => ev.id !== id);
    this.data.ideas = this.data.ideas.filter((i) => i.id !== id);
    this.data.blog = this.data.blog.filter((bl) => bl.id !== id);
    this.save();
    return true;
  }

  // ----------------------------------------------------
  // INTERACTIONS: LIKES & BOOKMARKS
  // ----------------------------------------------------

  toggleLike(id: string): { likeCount: number; isLikedByMe: boolean } {
    const item = this.findContentById(id);
    if (!item) return { likeCount: 0, isLikedByMe: false };
    item.isLikedByMe = !item.isLikedByMe;
    item.likeCount = Math.max(0, item.likeCount + (item.isLikedByMe ? 1 : -1));
    this.save();
    return { likeCount: item.likeCount, isLikedByMe: item.isLikedByMe };
  }

  toggleBookmark(id: string): { isBookmarkedByMe: boolean } {
    const item = this.findContentById(id);
    if (!item) return { isBookmarkedByMe: false };
    item.isBookmarkedByMe = !item.isBookmarkedByMe;
    this.save();
    return { isBookmarkedByMe: item.isBookmarkedByMe };
  }

  // ----------------------------------------------------
  // COMMENTS MODERATION
  // ----------------------------------------------------

  addComment(contentId: string, body: string, authorName = this.data.user.displayName): Comment {
    const newComment: Comment = {
      id: `comm-${Date.now()}`,
      contentId,
      author: {
        id: this.data.user.id,
        displayName: authorName || 'کاربر نوآفر',
        avatarUrl: this.data.user.avatarUrl,
      },
      body,
      createdAt: new Date().toISOString(),
      status: 'pending', // Requires approval
    };

    if (!this.data.comments[contentId]) {
      this.data.comments[contentId] = [];
    }
    this.data.comments[contentId].unshift(newComment);

    const item = this.findContentById(contentId);
    if (item) {
      item.commentCount = (item.commentCount || 0) + 1;
    }

    this.save();
    return newComment;
  }

  getComments(contentId: string, currentUserId?: string): Comment[] {
    const list = this.data.comments[contentId] || [];
    return list.filter((c) => c.status === 'approved' || (currentUserId && c.author.id === currentUserId));
  }

  getAllCommentsList(): (Comment & { contentTitle?: string })[] {
    const all: (Comment & { contentTitle?: string })[] = [];
    Object.entries(this.data.comments).forEach(([contentId, list]) => {
      const content = this.findContentById(contentId);
      list.forEach((comm) => {
        all.push({
          ...comm,
          contentTitle: content?.title || contentId,
        });
      });
    });
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  approveComment(commentId: string): boolean {
    for (const list of Object.values(this.data.comments)) {
      const target = list.find((c) => c.id === commentId);
      if (target) {
        target.status = 'approved';
        this.save();
        return true;
      }
    }
    return false;
  }

  deleteComment(commentId: string): boolean {
    for (const [contentId, list] of Object.entries(this.data.comments)) {
      const idx = list.findIndex((c) => c.id === commentId);
      if (idx !== -1) {
        list.splice(idx, 1);
        const item = this.findContentById(contentId);
        if (item) item.commentCount = Math.max(0, (item.commentCount || 1) - 1);
        this.save();
        return true;
      }
    }
    return false;
  }

  // ----------------------------------------------------
  // SUBMISSIONS (IDEAS & EXPERIENCES)
  // ----------------------------------------------------

  addIdeaSubmission(data: {
    title: string;
    fieldSlug: string;
    summary: string;
    body: string;
    tags?: string[];
  }): Submission {
    const subId = `sub-idea-${Date.now()}`;
    const sub: Submission = {
      id: subId,
      kind: 'idea',
      title: data.title,
      fieldSlug: data.fieldSlug,
      summary: data.summary,
      body: data.body,
      tags: data.tags || [],
      submitterId: this.data.user.id,
      submitterName: this.data.user.displayName,
      submitterPhone: this.data.user.phone,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.data.submissions.unshift(sub);
    this.awardUserPoints(50, 'ثبت ایده نوآورانه در درگاه جرقه', 'submit_idea');
    this.save();
    return sub;
  }

  addExperienceSubmission(data: {
    title: string;
    fieldSlug: string;
    region?: string;
    organization?: string;
    keyImpactMetric?: string;
    summary: string;
    body: string;
    tags?: string[];
  }): Submission {
    const subId = `sub-exp-${Date.now()}`;
    const sub: Submission = {
      id: subId,
      kind: 'experience',
      title: data.title,
      fieldSlug: data.fieldSlug,
      region: data.region,
      organization: data.organization,
      keyImpactMetric: data.keyImpactMetric,
      summary: data.summary,
      body: data.body,
      tags: data.tags || [],
      submitterId: this.data.user.id,
      submitterName: this.data.user.displayName,
      submitterPhone: this.data.user.phone,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.data.submissions.unshift(sub);
    this.awardUserPoints(100, 'ثبت روایت تجربه میدانی در درگاه سفر', 'submit_experience');
    this.save();
    return sub;
  }

  approveSubmission(submissionId: string, operatorMessage?: string): Submission | null {
    const sub = this.data.submissions.find((s) => s.id === submissionId);
    if (!sub) return null;

    sub.status = 'approved';
    sub.operatorMessage = operatorMessage || 'محتوای شما تایید و در سایت منتشر شد.';
    const slug = `p-${Date.now().toString(36)}`;
    sub.publishedSlug = slug;

    // Convert proposal to live catalog content
    if (sub.kind === 'idea') {
      const newIdea: Idea = {
        id: `spark-${Date.now()}`,
        sectionSlug: 'spark',
        slug,
        title: sub.title,
        summary: sub.summary || '',
        body: sub.body || '',
        gallery: [],
        attachments: [],
        viewCount: 1,
        field: {
          id: `f-${sub.fieldSlug || 'general'}`,
          slug: sub.fieldSlug || 'general',
          nameFa: sub.fieldNameFa || 'عمومی و محلی',
        },
        tags: (sub.tags || []).map((t, idx) => ({ id: `t-${idx}`, nameFa: t })),
        likeCount: 1,
        commentCount: 0,
        isLikedByMe: false,
        isBookmarkedByMe: false,
        publishedAt: new Date().toISOString(),
        submittedBy: {
          id: sub.submitterId || this.data.user.id,
          displayName: sub.submitterName || this.data.user.displayName,
        },
      };
      this.data.ideas.unshift(newIdea);
    } else {
      const newExp: Experience = {
        id: `exp-${Date.now()}`,
        sectionSlug: 'journey',
        slug,
        title: sub.title,
        summary: sub.summary || '',
        body: sub.body || '',
        gallery: [],
        attachments: [],
        viewCount: 1,
        year: 1403,
        field: {
          id: `f-${sub.fieldSlug || 'general'}`,
          slug: sub.fieldSlug || 'general',
          nameFa: sub.fieldNameFa || 'عمومی',
        },
        startingPoint: 'آغاز طرح میدانی',
        path: sub.body || '',
        challenges: 'موانع بومی و مالی',
        outcome: sub.keyImpactMetric || 'تحقق اهداف اجتماعی',
        keyImpactMetric: sub.keyImpactMetric,
        region: sub.region,
        tags: (sub.tags || []).map((t, idx) => ({ id: `t-${idx}`, nameFa: t })),
        likeCount: 1,
        commentCount: 0,
        isLikedByMe: false,
        isBookmarkedByMe: false,
        publishedAt: new Date().toISOString(),
        heroImage: { id: 'img-new-exp', type: 'image', url: '/mock/journey-cover.svg' },
        submittedBy: {
          id: sub.submitterId || this.data.user.id,
          displayName: sub.submitterName || this.data.user.displayName,
        },
      };
      this.data.experiences.unshift(newExp);
    }

    this.save();
    return sub;
  }

  requestRevisionSubmission(submissionId: string, operatorMessage: string): Submission | null {
    const sub = this.data.submissions.find((s) => s.id === submissionId);
    if (!sub) return null;
    sub.status = 'needs_revision';
    sub.operatorMessage = operatorMessage;
    this.save();
    return sub;
  }

  rejectSubmission(submissionId: string, operatorMessage?: string): Submission | null {
    const sub = this.data.submissions.find((s) => s.id === submissionId);
    if (!sub) return null;
    sub.status = 'rejected';
    sub.operatorMessage = operatorMessage || 'متاسفانه این طرح با معیارهای انتشار نوآفر همخوانی نداشت.';
    this.save();
    return sub;
  }
  addContactMessage(msg: import('../types').ContactMessage): import('../types').ContactMessage {
    this.data.contactMessages.unshift(msg);
    this.save();
    return msg;
  }

  updateContactMessageStatus(id: string, status: 'unread' | 'read' | 'replied', adminNotes?: string): boolean {
    const msg = this.data.contactMessages.find((m) => m.id === id);
    if (!msg) return false;
    msg.status = status;
    if (adminNotes !== undefined) msg.adminNotes = adminNotes;
    this.save();
    return true;
  }

  deleteContactMessage(id: string): boolean {
    this.data.contactMessages = this.data.contactMessages.filter((m) => m.id !== id);
    this.save();
    return true;
  }

  // ----------------------------------------------------
  // EVENT REGISTRATIONS
  // ----------------------------------------------------

  registerForEvent(eventId: string, user = this.data.user): EventRegistration {
    const event = this.data.events.find((e) => e.id === eventId);
    const existing = this.data.eventRegistrations.find(
      (r) => r.eventId === eventId && r.userId === user.id && r.status === 'confirmed'
    );
    if (existing) return existing;

    const registration: EventRegistration = {
      id: `reg-${Date.now()}`,
      eventId,
      eventTitle: event?.title || 'کارگاه نوآفر',
      userId: user.id,
      userName: user.displayName,
      userPhone: user.phone,
      registeredAt: new Date().toISOString(),
      ticketCode: `NOAFAR-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'confirmed',
    };

    this.data.eventRegistrations.unshift(registration);
    this.awardUserPoints(30, `ثبت‌نام در رویداد «${event?.title || 'نوآفر'}»`, 'share');
    this.save();
    return registration;
  }

  // ----------------------------------------------------
  // TOOL CANVASES
  // ----------------------------------------------------

  createOrUpdateCanvas(toolId: string, notes?: Record<string, string>, title?: string): SavedCanvas {
    const tool = this.data.tools.find((t) => t.id === toolId);
    const canvasId = `canvas-${Date.now()}`;
    const newCanvas: SavedCanvas = {
      id: canvasId,
      toolId,
      toolTitle: tool?.title || 'بوم نوآوری',
      toolSlug: tool?.slug || 'canvas',
      title: title || tool?.title || 'بوم نوآوری اجتماعی',
      notes: notes || {},
      provider: 'noafar-interactive',
      externalCanvasId: `room-${canvasId}`,
      embedUrl: `/toolbox/${tool?.slug || 'canvas'}/canvas`,
      thumbnailUrl: '/mock/canvas-preview.svg',
      updatedAt: new Date().toISOString(),
      shareUrl: `https://noafar.com/toolbox/${tool?.slug || 'canvas'}/canvas/${canvasId}`,
    };

    this.data.canvases.unshift(newCanvas);
    this.awardUserPoints(30, `تکمیل و ذخیره بوم «${tool?.title || 'نوآفر'}»`, 'first_canvas');
    this.save();
    return newCanvas;
  }

  deleteCanvas(id: string): boolean {
    this.data.canvases = this.data.canvases.filter((c) => c.id !== id);
    this.save();
    return true;
  }

  // ----------------------------------------------------
  // COURSE PROGRESS & VIDEO LESSONS
  // ----------------------------------------------------

  updateCourseProgress(courseId: string, percent: number): void {
    const course = this.data.courses.find((c) => c.id === courseId);
    if (course) {
      const prev = course.myProgressPercent || 0;
      course.myProgressPercent = Math.min(Math.max(percent, 0), 100);
      if (course.myProgressPercent === 100 && prev < 100) {
        this.awardUserPoints(150, `اتمام موفقیت‌آمیز دوره «${course.title}»`, 'complete_course');
      }
      this.save();
    }
  }

  updateCourseVideo(courseId: string, videoUrl: string, lessonIndex?: number): Course | null {
    const course = this.data.courses.find((c) => c.id === courseId);
    if (!course) return null;
    if (lessonIndex !== undefined && course.syllabus && course.syllabus[lessonIndex]) {
      course.syllabus[lessonIndex].videoUrl = videoUrl;
    } else {
      course.videoUrl = videoUrl;
      if (course.syllabus && course.syllabus.length > 0 && !course.syllabus[0].videoUrl) {
        course.syllabus[0].videoUrl = videoUrl;
      }
    }
    this.save();
    return course;
  }

  addCourseLesson(courseId: string, lesson: { title: string; durationMinutes: number; videoUrl?: string; description?: string }): Course | null {
    const course = this.data.courses.find((c) => c.id === courseId);
    if (!course) return null;
    if (!course.syllabus) course.syllabus = [];
    const newLesson: CourseLesson = {
      id: `les-${courseId}-${Date.now()}`,
      title: lesson.title,
      durationMinutes: lesson.durationMinutes || 10,
      videoUrl: lesson.videoUrl || course.videoUrl,
      description: lesson.description || '',
    };
    course.syllabus.push(newLesson);
    course.lessonsCount = course.syllabus.length;
    course.durationMinutes = course.syllabus.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
    course.durationSeconds = course.durationMinutes * 60;
    this.save();
    return course;
  }

  updateCourseLessons(courseId: string, syllabus: CourseLesson[]): Course | null {
    const course = this.data.courses.find((c) => c.id === courseId);
    if (!course) return null;
    course.syllabus = syllabus;
    course.lessonsCount = syllabus.length;
    course.durationMinutes = syllabus.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
    course.durationSeconds = course.durationMinutes * 60;
    this.save();
    return course;
  }

  // ----------------------------------------------------
  // USERS & POINTS
  // ----------------------------------------------------

  awardUserPoints(points: number, reasonFa: string, reasonType: any = 'share'): void {
    this.data.user.points += points;
    const tx: PointTransaction = {
      id: `pt-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      reason: reasonType,
      reasonFa,
      points,
      createdAt: new Date().toISOString(),
    };
    this.data.pointEntries.unshift(tx);
    this.save();
  }

  updateUserRole(userId: string, role: 'admin' | 'user' | 'facilitator' | 'reviewer'): boolean {
    if (this.data.user.id === userId) {
      this.data.user.role = role;
    }
    const u = this.data.users.find((item) => item.id === userId);
    if (u) {
      u.role = role;
      this.save();
      return true;
    }
    return false;
  }

  updateProfile(updates: Partial<User>): User {
    Object.assign(this.data.user, updates);
    const idx = this.data.users.findIndex((u) => u.id === this.data.user.id);
    if (idx !== -1) {
      Object.assign(this.data.users[idx], updates);
    }
    this.save();
    return this.data.user;
  }

  // ----------------------------------------------------
  // BACKUP & RESTORE
  // ----------------------------------------------------

  exportJson(): string {
    return JSON.stringify(this.data, null, 2);
  }

  importJson(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.courses && parsed.tools && parsed.books) {
        this.data = parsed;
        this.save();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  resetToDefaults(): void {
    localStorage.removeItem(DB_STORAGE_KEY);
    this.data = getInitialDatabase();
    this.save();
  }

  // SETTINGS
  getSettings(): SiteSettings {
    return this.data.settings || {
      heroTitle: "مدرسه کنشگری نوآفر",
      heroSubtitle: "بستری برای یادگیری، تجربه و خلق ارزش‌های اجتماعی",
      aboutText: "نوآفر، پلتفرمی تخصصی برای توانمندسازی کنشگران اجتماعی است.",
      contactEmail: "info@noafar.ir",
      contactPhone: "۰۲۱-۱۲۳۴۵۶۷۸",
      contactAddress: "تهران، میدان انقلاب، پلاک ۱",
      footerDescription: "اولین پلتفرم جامع آموزش و توانمندسازی کنشگران اجتماعی",
      footerCopyright: "تمام حقوق برای پلتفرم نوآفر محفوظ است.",
    };
  }
  updateSettings(newSettings: Partial<SiteSettings>): SiteSettings {
    this.data.settings = { ...this.getSettings(), ...newSettings };
    this.save();
    return this.data.settings;
  }
}
export const liveDb = new PersistentLiveDatabase();

