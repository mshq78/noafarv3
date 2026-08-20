import { Category } from '../types';

// Academy categories (single-select filter: دسته‌بندی موضوعی)
export const ACADEMY_CATEGORIES: Category[] = [
  { id: 'acad-1', slug: 'problem-discovery', nameFa: 'شناخت مسئله', sectionSlug: 'academy' },
  { id: 'acad-2', slug: 'ideation-creativity', nameFa: 'ایده‌پردازی و خلاقیت', sectionSlug: 'academy' },
  { id: 'acad-3', slug: 'design-thinking', nameFa: 'تفکر طراحی', sectionSlug: 'academy' },
  { id: 'acad-4', slug: 'social-innovation-entrepreneurship', nameFa: 'نوآوری و کارآفرینی اجتماعی', sectionSlug: 'academy' },
];

// Toolbox process stages (مرحله - multi-select)
export const TOOLBOX_STAGES: Category[] = [
  { id: 'stage-1', slug: 'problem-definition', nameFa: 'شناخت و تعریف مسئله', sectionSlug: 'toolbox' },
  { id: 'stage-2', slug: 'audience-research', nameFa: 'مخاطب‌شناسی', sectionSlug: 'toolbox' },
  { id: 'stage-3', slug: 'ideation', nameFa: 'ایده‌پردازی و خلاقیت', sectionSlug: 'toolbox' },
  { id: 'stage-4', slug: 'prototyping-validation', nameFa: 'نمونه‌سازی و اعتبارسنجی ایده', sectionSlug: 'toolbox' },
  { id: 'stage-5', slug: 'implementation', nameFa: 'اجرای ایده', sectionSlug: 'toolbox' },
];

// Toolbox formats (قالب - multi-select)
export const TOOLBOX_FORMATS = [
  { id: 'canvas', nameFa: 'بوم' },
  { id: 'game', nameFa: 'بازی' },
  { id: 'scenario', nameFa: 'سناریو' },
  { id: 'digital', nameFa: 'نسخه دیجیتال' },
  { id: 'file', nameFa: 'فایل' },
] as const;

// Library kinds (نوع)
export const LIBRARY_KINDS = [
  { id: 'book', nameFa: 'کتاب' },
  { id: 'booklet', nameFa: 'جزوه' },
  { id: 'reading', nameFa: 'خواندنی' },
] as const;

// Journey field categories (حوزه کاری) & Spark fields
export const JOURNEY_FIELDS: Category[] = [
  { id: 'field-1', slug: 'employment-livelihood', nameFa: 'اشتغال و معیشت', sectionSlug: 'journey' },
  { id: 'field-2', slug: 'health-sanitation', nameFa: 'سلامت و بهداشت', sectionSlug: 'journey' },
  { id: 'field-3', slug: 'family-lifestyle', nameFa: 'خانواده و سبک زندگی', sectionSlug: 'journey' },
  { id: 'field-4', slug: 'education-training', nameFa: 'تعلیم و تربیت', sectionSlug: 'journey' },
  { id: 'field-5', slug: 'environment', nameFa: 'محیط‌زیست', sectionSlug: 'journey' },
  { id: 'field-6', slug: 'local-governance-policy', nameFa: 'حکمرانی محلی و سیاست‌گذاری', sectionSlug: 'journey' },
  { id: 'field-7', slug: 'media-digital-space', nameFa: 'رسانه و فضای دیجیتال', sectionSlug: 'journey' },
  { id: 'field-8', slug: 'recreation-social-vitality', nameFa: 'تفریح و سرگرمی و نشاط اجتماعی', sectionSlug: 'journey' },
  { id: 'field-9', slug: 'culture-rituals', nameFa: 'فرهنگ و آئین‌ها', sectionSlug: 'journey' },
  { id: 'field-10', slug: 'art-creative-industries', nameFa: 'هنر و صنایع خلاق', sectionSlug: 'journey' },
];

// Gathering kinds & statuses
export const GATHERING_KINDS = [
  { id: 'workshop', nameFa: 'کارگاه حضوری' },
  { id: 'webinar', nameFa: 'وبینار آنلاین' },
] as const;

export const GATHERING_STATUSES = [
  { id: 'registering', nameFa: 'در حال ثبت‌نام' },
  { id: 'past', nameFa: 'برگزار شده' },
] as const;

// Difficulty definitions
export const DIFFICULTY_LABELS: Record<'easy' | 'medium' | 'hard', { label: string; dots: number }> = {
  easy: { label: 'آسان', dots: 1 },
  medium: { label: 'متوسط', dots: 2 },
  hard: { label: 'دشوار', dots: 3 },
};
