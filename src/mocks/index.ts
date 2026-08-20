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
  Paginated,
} from '../types';
import { MOCK_COURSES } from './courses';
import { MOCK_TOOLS } from './tools';
import { MOCK_BOOKS } from './books';
import { MOCK_EXPERIENCES } from './experiences';
import { MOCK_EVENTS } from './events';
import { MOCK_IDEAS } from './ideas';
import { MOCK_BLOG_POSTS } from './blog';
import {
  MOCK_CURRENT_USER,
  MOCK_SUBMISSIONS,
  MOCK_SAVED_CANVASES,
  MOCK_POINT_ENTRIES,
} from './user';
import { SECTION_LIST } from '../config/sections';

// In-memory state holding mutable records (saved to localStorage when in mock mode)
class MockDatabase {
  courses: Course[] = [...MOCK_COURSES];
  tools: Tool[] = [...MOCK_TOOLS];
  books: Book[] = [...MOCK_BOOKS];
  experiences: Experience[] = [...MOCK_EXPERIENCES];
  events: Event[] = [...MOCK_EVENTS];
  ideas: Idea[] = [...MOCK_IDEAS];
  blog: BlogPost[] = [...MOCK_BLOG_POSTS];
  submissions: Submission[] = [...MOCK_SUBMISSIONS];
  canvases: SavedCanvas[] = [...MOCK_SAVED_CANVASES];
  user = { ...MOCK_CURRENT_USER };
  pointEntries = [...MOCK_POINT_ENTRIES];
  comments: Record<string, Comment[]> = {
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

  getAllContentBySection(section: SectionSlug): ContentBase[] {
    switch (section) {
      case 'academy':
        return this.courses;
      case 'toolbox':
        return this.tools;
      case 'library':
        return this.books;
      case 'journey':
        return this.experiences;
      case 'gathering':
        return this.events;
      case 'spark':
        return this.ideas;
      default:
        return [];
    }
  }

  getAllItemsCombined(): ContentBase[] {
    return [
      ...this.courses,
      ...this.tools,
      ...this.books,
      ...this.experiences,
      ...this.events,
      ...this.ideas,
    ];
  }

  findContentBySlug(section: SectionSlug, slug: string): ContentBase | undefined {
    const list = this.getAllContentBySection(section);
    return list.find((item) => item.slug === slug);
  }

  findContentById(id: string): ContentBase | undefined {
    return this.getAllItemsCombined().find((item) => item.id === id) ||
           this.blog.find((item) => item.id === id);
  }

  getRelatedContent(currentId: string, _section: SectionSlug, count = 3): ContentBase[] {
    // Return 3 items drawn from cross sections, not only current one
    const all = this.getAllItemsCombined().filter((item) => item.id !== currentId);
    // Deterministic selection based on id
    const seed = currentId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const related: ContentBase[] = [];
    for (let i = 0; i < count && i < all.length; i++) {
      const idx = (seed + i * 7) % all.length;
      related.push(all[idx]);
    }
    return related;
  }

  toggleLike(id: string): { likeCount: number; isLikedByMe: boolean } {
    const item = this.findContentById(id);
    if (!item) return { likeCount: 0, isLikedByMe: false };
    item.isLikedByMe = !item.isLikedByMe;
    item.likeCount += item.isLikedByMe ? 1 : -1;
    return { likeCount: item.likeCount, isLikedByMe: item.isLikedByMe };
  }

  toggleBookmark(id: string): { isBookmarkedByMe: boolean } {
    const item = this.findContentById(id);
    if (!item) return { isBookmarkedByMe: false };
    item.isBookmarkedByMe = !item.isBookmarkedByMe;
    return { isBookmarkedByMe: item.isBookmarkedByMe };
  }

  addComment(contentId: string, body: string, authorName = 'محمدرضا علوی'): Comment {
    const newComment: Comment = {
      id: `comm-${Date.now()}`,
      contentId,
      author: {
        id: this.user.id,
        displayName: authorName,
        avatarUrl: this.user.avatarUrl,
      },
      body,
      createdAt: new Date().toISOString(),
      status: 'pending', // New comments enter as 'pending' (در انتظار بررسی)
    };
    if (!this.comments[contentId]) {
      this.comments[contentId] = [];
    }
    this.comments[contentId].unshift(newComment);
    const item = this.findContentById(contentId);
    if (item) {
      item.commentCount += 1;
    }
    return newComment;
  }

  getComments(contentId: string, currentUserId?: string): Comment[] {
    const list = this.comments[contentId] || [];
    // Only author sees their own pending comments; others see approved
    return list.filter((c) => c.status === 'approved' || (currentUserId && c.author.id === currentUserId));
  }

  updateCourseProgress(courseId: string, percent: number): void {
    const course = this.courses.find((c) => c.id === courseId);
    if (course) {
      course.myProgressPercent = Math.min(Math.max(percent, 0), 100);
    }
  }

  addIdeaSubmission(title: string, _fieldSlug: string, _body: string): Submission {
    const sub: Submission = {
      id: `sub-idea-${Date.now()}`,
      kind: 'idea',
      title,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    this.submissions.unshift(sub);
    return sub;
  }

  addExperienceSubmission(title: string, _fieldSlug: string): Submission {
    const sub: Submission = {
      id: `sub-exp-${Date.now()}`,
      kind: 'experience',
      title,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    this.submissions.unshift(sub);
    return sub;
  }
}

export const mockDb = new MockDatabase();

export function paginateArray<T>(items: T[], page = 1, pageSize = 12): Paginated<T> {
  const startIndex = (page - 1) * pageSize;
  const pageItems = items.slice(startIndex, startIndex + pageSize);
  const total = items.length;
  return {
    items: pageItems,
    total,
    page,
    pageSize,
    hasMore: startIndex + pageSize < total,
  };
}

export {
  MOCK_COURSES,
  MOCK_TOOLS,
  MOCK_BOOKS,
  MOCK_EXPERIENCES,
  MOCK_EVENTS,
  MOCK_IDEAS,
  MOCK_BLOG_POSTS,
  MOCK_CURRENT_USER,
  MOCK_SUBMISSIONS,
  MOCK_SAVED_CANVASES,
  MOCK_POINT_ENTRIES,
  SECTION_LIST,
};
