import { SectionSlug, SectionMeta } from '../types';

export const SECTIONS: Record<SectionSlug, SectionMeta> = {
  academy: {
    slug: 'academy',
    nameFa: 'آکادمی نوآوری',
    color: 'sky',
    colorFamily: 'sky',
    taglineFa: 'یادگیری و مهارتافزایی',
    treatment: 'solid tint',
    descriptionFa: 'دورهها و ویدیوهای آموزشی برای یادگیری مهارت حل خلاقانه مسئله و نوآوری اجتماعی',
    countLabel: 'آموزش',
    itemCount: 0,
    minHeightClass: 'min-h-[280px]',
    accentColorHex: '#73CFED',
    iconName: 'GraduationCap',
  },
  toolbox: {
    slug: 'toolbox',
    nameFa: 'جعبهابزار نوآوری',
    color: 'amber',
    colorFamily: 'amber',
    taglineFa: 'ابزارها و متدهای کاربردی',
    treatment: 'solid tint',
    descriptionFa: 'مجموعهای از تکنیکها، بومها، بازیها و راهنماهای عملی برای شناخت مسئله، خلق ایده و اجرای راهحلهای نوآورانه',
    countLabel: 'ابزار کاربردی',
    itemCount: 0,
    minHeightClass: 'min-h-[190px]',
    accentColorHex: '#FFCC6D',
    iconName: 'Wrench',
  },
  spark: {
    slug: 'spark',
    nameFa: 'به زودی ...',
    color: 'pink',
    colorFamily: 'pink',
    taglineFa: '',
    treatment: 'dot texture',
    descriptionFa: 'این بخش بهزودی راهاندازی میشود.',
    countLabel: '',
    itemCount: 0,
    minHeightClass: 'min-h-[190px]',
    accentColorHex: '#ED3F86',
    iconName: 'Sparkles',
    comingSoon: true,
  },
  gathering: {
    slug: 'gathering',
    nameFa: 'دورهمی نوآوری',
    color: 'sky',
    colorFamily: 'sky',
    taglineFa: 'رویدادها و کارگاهها',
    treatment: 'dot texture',
    descriptionFa: 'کارگاههای آموزشی حضوری، وبینارهای تخصصی و رویدادهای شبکهسازی با نوآوران و فعالان اجتماعی و فرهنگی',
    countLabel: 'رویداد و دورهمی',
    itemCount: 0,
    minHeightClass: 'min-h-[280px]',
    accentColorHex: '#73CFED',
    iconName: 'Users',
  },
  library: {
    slug: 'library',
    nameFa: 'کتابخانه نوآوری',
    color: 'amber',
    colorFamily: 'amber',
    taglineFa: 'دانشنامه و منابع تخصصی',
    treatment: 'solid tint',
    descriptionFa: 'کتابها، جزوهها، مقالهها و منابع برگزیده برای آشنایی عمیقتر با مفاهیم خلاقیت و نوآوری',
    countLabel: 'منبع و کتاب',
    itemCount: 0,
    minHeightClass: 'min-h-[190px]',
    accentColorHex: '#FFCC6D',
    iconName: 'BookOpen',
  },
  journey: {
    slug: 'journey',
    nameFa: 'تور نوآوری',
    color: 'pink',
    colorFamily: 'pink',
    taglineFa: 'روایت تجربههای نوآوران',
    treatment: 'dot texture',
    descriptionFa: 'روایتهای دست اول از تجربهها، موفقیتها و شکستها و آموختههای نوآوران و گروههایی که برای حل مسائل اجتماعی ایدهای را آزمودهاند',
    countLabel: 'روایت تجربه',
    itemCount: 0,
    minHeightClass: 'min-h-[280px]',
    accentColorHex: '#ED3F86',
    iconName: 'Footprints',
  },
};

export const SECTION_LIST: SectionMeta[] = [
  SECTIONS.academy,
  SECTIONS.toolbox,
  SECTIONS.spark,
  SECTIONS.gathering,
  SECTIONS.library,
  SECTIONS.journey,
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
        badgeBg: 'bg-sky-50 text-sky-700 border border-sky-300',
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
        buttonBg: 'bg-pink-600 hover:bg-pink-700 text-white',
      };
    case 'amber':
      return {
        bgLight: 'bg-amber-50',
        bgSubtle: 'hover:bg-amber-50',
        border: 'border-amber-300',
        text: 'text-amber-700',
        textDark: 'text-amber-800',
        accentHex: '#FFCC6D',
        dotFill: '#FFCC6D',
        badgeBg: 'bg-amber-50 text-amber-800 border border-amber-300',
        buttonBg: 'bg-amber-600 hover:bg-amber-700 text-white',
      };
  }
};
