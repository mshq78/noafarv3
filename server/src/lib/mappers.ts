/**
 * Translates database rows into the exact shapes the React app already
 * consumes (see src/types/index.ts), so the UI needs no reshaping.
 */

export interface ContentRow {
  id: string;
  section: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  hero_image: unknown;
  gallery: unknown;
  attachments: unknown;
  category: unknown;
  tags: unknown;
  author: unknown;
  data: Record<string, unknown> | null;
  status: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  published_at: Date | string;
  is_liked_by_me?: boolean | null;
  is_bookmarked_by_me?: boolean | null;
  my_progress_percent?: number | null;
}

const iso = (value: Date | string | null | undefined): string => {
  if (!value) return '';
  return value instanceof Date ? value.toISOString() : String(value);
};

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

export function mapContent(row: ContentRow): Record<string, unknown> {
  const data = (row.data ?? {}) as Record<string, unknown>;
  const base: Record<string, unknown> = {
    ...data,
    id: row.id,
    slug: row.slug,
    // The React app models blog posts as ordinary content; it keys the section
    // off `sectionSlug`, and blog cards read it from the `blog` route instead.
    sectionSlug: row.section,
    title: row.title,
    summary: row.summary,
    body: row.body,
    heroImage: row.hero_image ?? undefined,
    gallery: asArray(row.gallery),
    attachments: asArray(row.attachments),
    category: row.category ?? undefined,
    tags: asArray(row.tags),
    author: row.author ?? undefined,
    publishedAt: iso(row.published_at),
    viewCount: row.view_count,
    likeCount: row.like_count,
    commentCount: row.comment_count,
    isLikedByMe: Boolean(row.is_liked_by_me),
    isBookmarkedByMe: Boolean(row.is_bookmarked_by_me),
    status: data.status ?? undefined,
  };

  if (row.status !== 'published') base.publishStatus = row.status;
  if (row.my_progress_percent !== undefined && row.my_progress_percent !== null) {
    base.myProgressPercent = row.my_progress_percent;
  }
  // `status` is a real event field in the UI (upcoming/registering/past); for
  // every other section it is meaningless and must not leak the row's state.
  if (row.section !== 'gathering') delete base.status;

  return base;
}

export interface UserRow {
  id: string;
  /** Null for accounts created with an email address instead of a phone. */
  phone: string | null;
  /** Null for accounts created with a phone number instead of an address. */
  email?: string | null;
  display_name: string;
  national_id: string | null;
  birth_year: string | null;
  city: string | null;
  interests: unknown;
  role: string;
  avatar_url: string | null;
  bio: string | null;
  points: number;
  profile_complete: boolean;
  is_blocked?: boolean;
  has_password?: boolean;
  joined_at: Date | string;
}

export function mapUser(row: UserRow): Record<string, unknown> {
  const joinedAt = iso(row.joined_at);
  const joinedTime = joinedAt ? new Date(joinedAt).getTime() : Date.now();
  const membershipDays = Math.max(
    0,
    Math.floor((Date.now() - joinedTime) / (1000 * 60 * 60 * 24)),
  );
  return {
    id: row.id,
    displayName: row.display_name,
    phone: row.phone ?? '',
    email: row.email ?? undefined,
    /** True once a password is set, so the UI can offer "change" vs "create". */
    hasPassword: Boolean(row.has_password),
    nationalId: row.national_id ?? undefined,
    birthYear: row.birth_year ?? undefined,
    city: row.city ?? undefined,
    interests: asArray(row.interests),
    role: row.role,
    avatarUrl: row.avatar_url ?? undefined,
    bio: row.bio ?? undefined,
    joinedAt,
    membershipDays,
    points: row.points,
    profileComplete: row.profile_complete,
    /**
     * Only selected by the admin listing. Without it the panel cannot tell a
     * blocked account from an active one, which made the block action in the
     * API unusable from the UI.
     */
    ...(row.is_blocked === undefined ? {} : { isBlocked: Boolean(row.is_blocked) }),
  };
}

/** Public view of another user (comment authors) — no phone number. */
export function mapPublicAuthor(row: {
  id: string | null;
  display_name: string | null;
  avatar_url: string | null;
}): Record<string, unknown> {
  return {
    id: row.id ?? 'deleted',
    displayName: row.display_name || 'کاربر نوآفر',
    avatarUrl: row.avatar_url ?? undefined,
  };
}

export interface CommentRow {
  id: string;
  content_id: string;
  body: string;
  status: string;
  created_at: Date | string;
  author_id: string | null;
  author_display_name: string | null;
  author_avatar_url: string | null;
  content_title?: string | null;
}

export function mapComment(row: CommentRow): Record<string, unknown> {
  return {
    id: row.id,
    contentId: row.content_id,
    author: mapPublicAuthor({
      id: row.author_id,
      display_name: row.author_display_name,
      avatar_url: row.author_avatar_url,
    }),
    body: row.body,
    createdAt: iso(row.created_at),
    status: row.status,
    ...(row.content_title !== undefined ? { contentTitle: row.content_title } : {}),
  };
}

export interface SubmissionRow {
  id: string;
  kind: string;
  title: string;
  summary: string;
  body: string;
  field_slug: string | null;
  field_name_fa: string | null;
  region: string | null;
  organization: string | null;
  key_impact_metric: string | null;
  extra: Record<string, unknown> | null;
  tags: unknown;
  submitter_id: string | null;
  status: string;
  operator_message: string | null;
  submitted_at: Date | string;
  created_at: Date | string;
  submitter_name?: string | null;
  submitter_phone?: string | null;
  published_slug?: string | null;
}

export function mapSubmission(
  row: SubmissionRow,
  { includeSubmitterPhone = false } = {},
): Record<string, unknown> {
  return {
    ...(row.extra ?? {}),
    id: row.id,
    kind: row.kind,
    title: row.title,
    summary: row.summary,
    body: row.body,
    sectionSlug: row.kind === 'idea' ? 'spark' : 'journey',
    fieldSlug: row.field_slug ?? undefined,
    fieldNameFa: row.field_name_fa ?? undefined,
    region: row.region ?? undefined,
    organization: row.organization ?? undefined,
    keyImpactMetric: row.key_impact_metric ?? undefined,
    tags: asArray(row.tags),
    submitterId: row.submitter_id ?? undefined,
    submitterName: row.submitter_name ?? undefined,
    ...(includeSubmitterPhone ? { submitterPhone: row.submitter_phone ?? undefined } : {}),
    status: row.status,
    operatorMessage: row.operator_message ?? undefined,
    submittedAt: iso(row.submitted_at),
    createdAt: iso(row.created_at),
    publishedSlug: row.published_slug ?? undefined,
  };
}

export function mapCanvas(row: {
  id: string;
  tool_id: string | null;
  tool_slug: string | null;
  tool_title: string;
  title: string;
  notes: unknown;
  updated_at: Date | string;
}): Record<string, unknown> {
  return {
    id: row.id,
    toolId: row.tool_id ?? '',
    toolSlug: row.tool_slug ?? undefined,
    toolTitle: row.tool_title,
    title: row.title || row.tool_title,
    notes: (row.notes as Record<string, string>) ?? {},
    provider: 'noafar-interactive',
    externalCanvasId: row.id,
    embedUrl: `/toolbox/${row.tool_slug ?? ''}/canvas`,
    thumbnailUrl: '/mock/canvas-preview.svg',
    updatedAt: iso(row.updated_at),
    shareUrl: `/toolbox/${row.tool_slug ?? ''}/canvas?canvas=${row.id}`,
  };
}

export function mapRegistration(row: {
  id: string;
  event_id: string;
  user_id: string;
  ticket_code: string;
  status: string;
  registered_at: Date | string;
  event_title?: string | null;
  user_name?: string | null;
  user_phone?: string | null;
}): Record<string, unknown> {
  return {
    id: row.id,
    eventId: row.event_id,
    eventTitle: row.event_title ?? '',
    userId: row.user_id,
    userName: row.user_name ?? '',
    userPhone: row.user_phone ?? '',
    registeredAt: iso(row.registered_at),
    ticketCode: row.ticket_code,
    status: row.status,
  };
}

export function mapContactMessage(
  row: {
    id: string;
    name: string;
    phone_or_email: string;
    subject: string;
    message: string;
    status: string;
    admin_notes: string | null;
    created_at: Date | string;
  },
): Record<string, unknown> {
  return {
    id: row.id,
    name: row.name,
    phoneOrEmail: row.phone_or_email,
    subject: row.subject,
    message: row.message,
    status: row.status,
    adminNotes: row.admin_notes ?? undefined,
    createdAt: iso(row.created_at),
  };
}

export function mapPointTransaction(row: {
  id: string;
  reason: string;
  reason_fa: string;
  points: number;
  created_at: Date | string;
}): Record<string, unknown> {
  return {
    id: row.id,
    reason: row.reason,
    reasonFa: row.reason_fa,
    points: row.points,
    createdAt: iso(row.created_at),
  };
}
