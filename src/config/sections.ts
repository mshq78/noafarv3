import { SectionSlug, SectionMeta } from '../types';

export const SECTIONS: Record<SectionSlug, SectionMeta> = {
  academy: {
    slug: 'academy',
    nameFa: 'آکادمی نوآوری',
    color: 'sky',
    colorFamily: 'sky',
    taglineFa: 'یادگیری و مهارت‌افزایی',
    treatment: 'solid tint',
    descriptionFa: 'دوره‌ها و ویدیوهای آموزشی کاربردی برای تسلط بر مهارت‌های حل خلاقانه مسائل اجتماعی',
    countLabel: 'آموزش',
    itemCount: 24,
    minHeightClass: 'min-h-[280px]',
    accentColorHex: '#73CFED',
    iconName: 'GraduationCap',
  },
  toolbox: {
    slug: 'toolbox',
    nameFa: 'جعبه ابزار نوآوری',
    color: 'pink',
    colorFamily: 'pink',
    taglineFa: 'بوم‌ها و متدهای کاربردی',
    treatment: 'solid tint',
    descriptionFa: 'بوم‌ها، متدها، بازی‌ها و الگوهای گام‌به‌گام برای طراحی، اعتبارسنجی و اجرای راه‌حل‌ها',
    countLabel: 'ابزار کاربردی',
    itemCount: 38,
    minHeightClass: 'min-h-[190px]',
    accentColorHex: '#ED3F86',
    iconName: 'Wrench',
  },
  library: {
    slug: 'library',
    nameFa: 'کتابخانه نوآوری',
    color: 'amber',
    colorFamily: 'amber',
    taglineFa: 'دانشنامه و کتب تخصصی',
    treatment: 'solid tint',
    descriptionFa: 'مجموعه کتاب‌ها، جزوه‌ها و درسنامه‌های گزینش‌شده پیرامون نوآوری و کارآفرینی اجتماعی',
    countLabel: 'منبع و کتاب',
    itemCount: 19,
    minHeightClass: 'min-h-[190px]',
    accentColorHex: '#FFCC6D',
    iconName: 'BookOpen',
  },
  journey: {
    slug: 'journey',
    nameFa: 'سفر تجربیات',
    color: 'sky',
    colorFamily: 'sky',
    taglineFa: 'روایت تجارب بومی ایران',
    treatment: 'dot texture',
    descriptionFa: 'روایت دست‌اول از تجارب زیسته و تلاش‌های واقعی کنشگران در مواجهه با چالش‌های جامعه',
    countLabel: 'روایت تجربه',
    itemCount: 31,
    minHeightClass: 'min-h-[280px]',
    accentColorHex: '#73CFED',
    iconName: 'Footprints',
  },
  gathering: {
    slug: 'gathering',
    nameFa: 'دورهمی نوآوری',
    color: 'pink',
    colorFamily: 'pink',
    taglineFa: 'رویدادها و کارگاه‌ها',
    treatment: 'dot texture',
    descriptionFa: 'کارگاه‌های حضوری، رویدادهای تخصصی و وبینارهای شبکه‌سازی با نوآوران و متخصصان',
    countLabel: 'رویداد و دورهمی',
    itemCount: 14,
    minHeightClass: 'min-h-[280px]',
    accentColorHex: '#ED3F86',
    iconName: 'Users',
  },
  spark: {
    slug: 'spark',
    nameFa: 'جرقه ایده‌ها',
    color: 'amber',
    colorFamily: 'amber',
    taglineFa: 'بانک ایده‌های مردمی',
    treatment: 'dot texture',
    descriptionFa: 'بانک ایده‌های مردمی و جرقه‌های اولیه برای حل نوآورانه مسائل بومی و شهری',
    countLabel: 'ایده ثبت‌شده',
    itemCount: 52,
    minHeightClass: 'min-h-[190px]',
    accentColorHex: '#FFCC6D',
    iconName: 'Sparkles',
  },
};

export const SECTION_LIST: SectionMeta[] = [
  SECTIONS.academy,
  SECTIONS.toolbox,
  SECTIONS.library,
  SECTIONS.journey,
  SECTIONS.gathering,
  SECTIONS.spark,
];

export const getSectionBySlug = (slug: string): SectionMeta | undefined => {
  return SECTIONS[slug as SectionSlug];
};

export const getSectionThemeClasses = (color: 'sky' | 'pink' | 'amber') => {
  switch (color) {
    case 'sky':
      return {
        bgLight: 'bg-sky-50',
        bgSubtle: 'hover:bg-sky-50',
        border: 'border-sky-300',
        text: 'text-sky-600',
        textDark: 'text-sky-700',
        accentHex: '#73CFED',
        dotFill: '#73CFED',
        badgeBg: 'bg-sky-50 text-sky-600 border border-sky-300',
        buttonBg: 'bg-sky-600 hover:bg-sky-700 text-white',
      };
    case 'pink':
      return {
        bgLight: 'bg-pink-50',
        bgSubtle: 'hover:bg-pink-50',
        border: 'border-pink-300',
        text: 'text-pink-600',
        textDark: 'text-pink-700',
        accentHex: '#ED3F86',
        dotFill: '#ED3F86',
        badgeBg: 'bg-pink-50 text-pink-700 border border-pink-300',
        buttonBg: 'bg-pink-300 hover:bg-pink-600 text-ink-900 hover:text-white',
      };
    case 'amber':
      return {
        bgLight: 'bg-amber-50',
        bgSubtle: 'hover:bg-amber-50',
        border: 'border-amber-300',
        text: 'text-amber-700',
        textDark: 'text-amber-700',
        accentHex: '#FFCC6D',
        dotFill: '#FFCC6D',
        badgeBg: 'bg-amber-50 text-amber-700 border border-amber-300',
        buttonBg: 'bg-amber-300 hover:bg-amber-600 text-ink-900 hover:text-white',
      };
  }
};
