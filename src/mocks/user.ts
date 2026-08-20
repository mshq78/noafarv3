import { User, Submission, SavedCanvas, PointEntry } from '../types';

export const MOCK_CURRENT_USER: User = {
  id: 'user-me',
  displayName: 'محمدرضا علوی',
  phone: '09123456789',
  role: 'member',
  avatarUrl: '/mock/avatar.svg',
  joinedAt: '2023-08-15T10:00:00Z',
  membershipDays: 194, // ۱۹۴ روز با نوآفر
  points: 375,
  profileComplete: true,
};

export const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-1',
    kind: 'idea',
    title: 'انبار اشتراکی ابزارآلات خانگی در مسجد محل',
    status: 'approved',
    submittedAt: '2024-01-15T10:30:00Z',
    publishedSlug: 'digital-neighborhood-tool-sharing-shed',
  },
  {
    id: 'sub-2',
    kind: 'experience',
    title: 'تاسیس تعاونی محلی پخت نان سنتی در محله هرندی',
    status: 'pending',
    submittedAt: '2024-02-12T14:00:00Z',
  },
  {
    id: 'sub-3',
    kind: 'idea',
    title: 'سامانه نوبت‌دهی محلی خودروهای مسافربر روستایی',
    status: 'needs_revision',
    operatorMessage: 'ایده بسیار ارزشمندی است. لطفاً بخش مربوط به پایداری مالی و چگونگی جلب اعتماد رانندگان محلی را با جزئیات بیشتری بازنویسی و مجدداً ارسال فرمایید.',
    submittedAt: '2024-02-05T09:15:00Z',
  },
];

export const MOCK_SAVED_CANVASES: SavedCanvas[] = [
  {
    id: 'canvas-1',
    toolId: 'tool-1',
    toolTitle: 'بوم مدل کسب‌وکار اجتماعی (Social Lean Canvas)',
    provider: 'excalidraw',
    externalCanvasId: 'excal-canvas-01',
    embedUrl: 'https://excalidraw.com/#room=noafar-sample-1',
    thumbnailUrl: '/mock/canvas-preview.svg',
    updatedAt: '2024-02-16T12:00:00Z',
    shareUrl: 'https://noafar.com/toolbox/social-lean-canvas/canvas/canvas-1',
  },
  {
    id: 'canvas-2',
    toolId: 'tool-2',
    toolTitle: 'نقشه همدلی با ذینفعان و جامعه هدف (Empathy Map)',
    provider: 'excalidraw',
    externalCanvasId: 'excal-canvas-02',
    embedUrl: 'https://excalidraw.com/#room=noafar-sample-2',
    thumbnailUrl: '/mock/canvas-preview.svg',
    updatedAt: '2024-02-10T15:30:00Z',
    shareUrl: 'https://noafar.com/toolbox/empathy-map-canvas/canvas/canvas-2',
  },
];

export const MOCK_POINT_ENTRIES: PointEntry[] = [
  { id: 'pt-1', reason: 'complete_profile', points: 20, createdAt: '2023-08-15T10:35:00Z' },
  { id: 'pt-2', reason: 'submit_idea', points: 50, createdAt: '2024-01-15T10:30:00Z' },
  { id: 'pt-3', reason: 'submit_experience', points: 100, createdAt: '2024-02-12T14:00:00Z' },
  { id: 'pt-4', reason: 'first_canvas', points: 30, createdAt: '2024-02-10T15:30:00Z' },
  { id: 'pt-5', reason: 'complete_course', points: 40, createdAt: '2024-01-20T18:00:00Z' },
  { id: 'pt-6', reason: 'comment', points: 15, createdAt: '2024-02-01T12:00:00Z' },
  { id: 'pt-7', reason: 'comment', points: 15, createdAt: '2024-02-14T09:30:00Z' },
  { id: 'pt-8', reason: 'share', points: 10, createdAt: '2024-02-15T11:00:00Z' },
  { id: 'pt-9', reason: 'like', points: 5, createdAt: '2024-02-16T14:00:00Z' },
];
