export type SectionSlug = 'academy' | 'toolbox' | 'library' | 'journey' | 'gathering' | 'spark';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'needs_revision';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'beginner' | 'intermediate' | 'advanced';
export type UserRole = 'guest' | 'member' | 'operator' | 'admin';

export interface Category {
  id: string;
  slug: string;
  nameFa: string;
  sectionSlug: SectionSlug;
}

export interface Tag {
  id: string;
  slug: string;
  nameFa: string;
}

export interface MediaAsset {
  id: string;
  type: 'image' | 'video' | 'audio' | 'pdf' | 'document';
  url: string;
  thumbnailUrl?: string;
  fileName?: string;
  fileSizeBytes?: number;
  caption?: string;
}

export interface User {
  id: string;
  displayName: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
  bio?: string;
  joinedAt: string;          // ISO
  membershipDays: number;    // کسوت نوآفری
  points: number;
  profileComplete: boolean;
}

export interface ContentBase {
  id: string;
  slug: string;
  sectionSlug: SectionSlug;
  title: string;
  summary: string;           // 2–3 sentences
  body: string;              // rich HTML
  heroImage?: MediaAsset;
  gallery: MediaAsset[];
  attachments: MediaAsset[];
  category?: Category;
  tags: Tag[];
  publishedAt: string;
  author?: Pick<User, 'id' | 'displayName' | 'avatarUrl'> | string;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  isLikedByMe: boolean;
  isBookmarkedByMe: boolean;
}

export interface CourseLesson {
  id: string;
  title: string;
  durationMinutes: number;
}

export interface Course extends ContentBase {
  sectionSlug: 'academy';
  videoUrl: string;
  posterUrl?: string;
  durationSeconds: number;
  durationMinutes?: number;
  lessonsCount?: number;
  syllabus?: CourseLesson[];
  myProgressPercent?: number;   // 0–100, only when authenticated
}

export type ToolFormat = 'canvas' | 'game' | 'scenario' | 'digital' | 'file' | 'worksheet' | 'guide';

export interface Tool extends ContentBase {
  sectionSlug: 'toolbox';
  stage: Category;                            // process stage
  format: ToolFormat;
  difficulty: Difficulty;
  estimatedMinutes: number;
  printablePdfUrl?: string;
  supportsDigitalCanvas: boolean;
}

export type LibraryKind = 'book' | 'booklet' | 'reading' | 'article' | 'podcast' | 'video';

export interface Book extends ContentBase {
  sectionSlug: 'library';
  kind: LibraryKind;
  coverImage: MediaAsset;
  author?: string;
  pageCount?: number;
  downloadUrl?: string;
}

export interface Experience extends ContentBase {
  sectionSlug: 'journey';
  year: number;                 // Jalali year — year only, never a month
  field: Category;
  startingPoint: string;
  path: string;
  challenges: string;
  outcome: string;
  keyImpactMetric?: string;
  region?: string;
  submittedBy?: Pick<User, 'id' | 'displayName'>;
}

export interface Idea extends ContentBase {
  sectionSlug: 'spark';
  field: Category;
  submittedBy?: Pick<User, 'id' | 'displayName'>;
}

export interface Event extends ContentBase {
  sectionSlug: 'gathering';
  kind: 'workshop' | 'webinar';
  status: 'upcoming' | 'registering' | 'past';
  startsAt: string;
  endsAt?: string;
  location?: string;
  capacity?: number;
  registrationStatus?: 'upcoming' | 'registering' | 'past';
  externalRegistrationUrl?: string;
  report?: string;              // rich HTML, present when status === 'past'
}

export interface BlogPost extends ContentBase {
  readingMinutes: number;
}

export interface Comment {
  id: string;
  contentId: string;
  author: Pick<User, 'id' | 'displayName' | 'avatarUrl'>;
  body: string;
  createdAt: string;
  status: SubmissionStatus;
}

export interface Submission {
  id: string;
  kind: 'idea' | 'experience';
  title: string;
  summary?: string;
  sectionSlug?: string;
  slug?: string;
  body?: string;
  status: SubmissionStatus;
  operatorMessage?: string;
  submittedAt: string;
  createdAt?: string;
  publishedSlug?: string;
}

export interface SavedCanvas {
  id: string;
  toolId: string;
  toolTitle: string;
  toolSlug?: string;
  title?: string;
  provider: string;
  externalCanvasId: string;
  embedUrl: string;
  thumbnailUrl?: string;
  updatedAt: string;
  shareUrl: string;
}

export interface PointEntry {
  id: string;
  reason: 'like' | 'comment' | 'bookmark' | 'share' | 'submit_idea'
        | 'submit_experience' | 'complete_profile' | 'complete_course' | 'first_canvas';
  reasonFa?: string;
  points: number;
  createdAt: string;
}

export type PointTransaction = PointEntry;

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface SectionMeta {
  slug: SectionSlug;
  nameFa: string;
  color: 'sky' | 'pink' | 'amber';
  colorFamily?: 'sky' | 'pink' | 'amber';
  taglineFa?: string;
  treatment: 'solid tint' | 'dot texture';
  descriptionFa: string;
  countLabel: string;
  itemCount: number;
  minHeightClass: string;
  accentColorHex: string;
  iconName?: string;
}
