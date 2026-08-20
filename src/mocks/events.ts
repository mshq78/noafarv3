import { Event } from '../types';

export const MOCK_EVENTS: Event[] = [
  // 4 upcoming / registering events
  {
    id: 'event-1',
    slug: 'social-design-sprint-workshop-tehran',
    sectionSlug: 'gathering',
    kind: 'workshop',
    status: 'registering',
    title: 'کارگاه حضوری دوی سرعت طراحی اجتماعی (Social Design Sprint)',
    summary: '۳ روز کار فشرده تیمی برای رسیدن از یک چالش محلی به یک نمونه اولیه قابل آزمایش میدانی.',
    body: `
      <h2>درباره این رویداد</h2>
      <p>در این کارگاه ۳ روزه، تیم‌های متشکل از طراحان، فعالان فرهنگی و پژوهشگران اجتماعی گرد هم می‌آیند تا با هدایت مربیان باتجربه، متدولوژی Design Sprint را روی مسائل واقعی اجرا کنند.</p>
      
      <h2>سرفصل‌های کارگاه:</h2>
      <ul>
        <li>روز اول: درک مسئله و انتخاب هدف اصلی</li>
        <li>روز دوم: ایده‌پردازی و طراحی سناریوی راه‌حل</li>
        <li>روز سوم: ساخت پروتوتایپ سریع و آزمون با ۵ مخاطب واقعی</li>
      </ul>
      
      <h2>اطلاعات برگزاری</h2>
      <p><strong>زمان:</strong> پنج‌شنبه و جمعه ۱۰ و ۱۱ اسفند ۱۴۰۲ - ساعت ۹ تا ۱۸</p>
      <p><strong>مکان:</strong> تهران، میدان انقلاب، خانه خلاق و نوآوری نوآفر</p>
    `,
    heroImage: { id: 'img-ev1', type: 'image', url: '/mock/event-cover.svg' },
    gallery: [],
    attachments: [],
    startsAt: '2024-03-01T09:00:00Z',
    endsAt: '2024-03-02T18:00:00Z',
    location: 'تهران، میدان انقلاب، خانه خلاق نوآفر',
    externalRegistrationUrl: 'https://evand.com/events/social-design-sprint-noafar',
    tags: [
      { id: 't-ev1', slug: 'design-sprint', nameFa: 'دیزاین اسپرینت' },
      { id: 't-ev2', slug: 'workshop', nameFa: 'کارگاه حضوری' },
    ],
    publishedAt: '2024-02-10T10:00:00Z',
    likeCount: 145,
    commentCount: 16,
    viewCount: 1890,
    isLikedByMe: false,
    isBookmarkedByMe: true,
  },
  {
    id: 'event-2',
    slug: 'social-finance-webinar-crowdfunding',
    sectionSlug: 'gathering',
    kind: 'webinar',
    status: 'registering',
    title: 'وبینار تخصصی تامین مالی جمعی (Crowdfunding) برای طرح‌های مردم‌نهاد',
    summary: 'اصول طراحی کمپین‌های تامین مالی جمعی، شفافیت مالی و اعتمادسازی در میان خیرین خرد.',
    body: `
      <h2>سرفصل‌های وبینار آنلاین</h2>
      <p>چگونه بدون وابستگی به نهادهای دولتی، سرمایه اولیه اجرای طرح‌های عام‌المنفعه را با مشارکت صدها شهروند تامین کنیم.</p>
    `,
    heroImage: { id: 'img-ev2', type: 'image', url: '/mock/event-cover.svg' },
    gallery: [],
    attachments: [],
    startsAt: '2024-03-05T17:00:00Z',
    endsAt: '2024-03-05T19:30:00Z',
    location: 'آنلاین (اتاق وبینار اسکای‌روم)',
    externalRegistrationUrl: 'https://evand.com/events/social-crowdfunding-webinar',
    tags: [{ id: 't-ev3', slug: 'crowdfunding', nameFa: 'تامین مالی جمعی' }],
    publishedAt: '2024-02-12T14:00:00Z',
    likeCount: 198,
    commentCount: 24,
    viewCount: 2300,
    isLikedByMe: false,
    isBookmarkedByMe: false,
  },
  {
    id: 'event-3',
    slug: 'rural-tourism-entrepreneurship-gathering',
    sectionSlug: 'gathering',
    kind: 'workshop',
    status: 'registering',
    title: 'دورهمی نوآوران بوم‌گردی و توانمندسازی جوامع محلی شمال کشور',
    summary: 'نشست انتقال تجربه فعالان اقامتگاه‌های بوم‌گردی پیرامون حفظ فرهنگ بومی و توزیع عادلانه درآمد.',
    body: `<p>گفتگوی تخصصی در مورد چالش‌های توسعه گردشگری پایدار بدون تخریب بافت فرهنگی روستاها.</p>`,
    heroImage: { id: 'img-ev3', type: 'image', url: '/mock/event-cover.svg' },
    gallery: [],
    attachments: [],
    startsAt: '2024-03-12T10:00:00Z',
    endsAt: '2024-03-12T16:00:00Z',
    location: 'مازندران، تنکابن، بوم‌گردی یوج',
    externalRegistrationUrl: 'https://evand.com/events/ecotourism-noafar-gathering',
    tags: [{ id: 't-ev4', slug: 'ecotourism', nameFa: 'بوم‌گردی' }],
    publishedAt: '2024-02-15T11:00:00Z',
    likeCount: 110,
    commentCount: 12,
    viewCount: 1420,
    isLikedByMe: false,
    isBookmarkedByMe: false,
  },
  {
    id: 'event-4',
    slug: 'social-impact-measurement-bootcamp',
    sectionSlug: 'gathering',
    kind: 'webinar',
    status: 'registering',
    title: 'بوت‌کمپ مجازی فرموله‌سازی شاخص‌های SROI و سنجش اثرات طرح‌های تربیتی',
    summary: 'کارگاه عملی تدوین شاخص‌های ارزیابی کیفی و کمی برای کانون‌های فرهنگی مساجد و مدارس.',
    body: `<p>تمرین عملی محاسبه بازگشت اجتماعی سرمایه در پروژه‌های فرهنگی و تربیتی.</p>`,
    heroImage: { id: 'img-ev4', type: 'image', url: '/mock/event-cover.svg' },
    gallery: [],
    attachments: [],
    startsAt: '2024-03-18T16:00:00Z',
    endsAt: '2024-03-18T20:00:00Z',
    location: 'آنلاین (اسکای‌روم)',
    externalRegistrationUrl: 'https://evand.com/events/sroi-virtual-bootcamp',
    tags: [{ id: 't-ev5', slug: 'sroi', nameFa: 'سنجش اثر' }],
    publishedAt: '2024-02-18T09:00:00Z',
    likeCount: 165,
    commentCount: 19,
    viewCount: 1950,
    isLikedByMe: false,
    isBookmarkedByMe: false,
  },

  // 4 past events with reports
  {
    id: 'event-5',
    slug: 'first-national-gathering-social-activists',
    sectionSlug: 'gathering',
    kind: 'workshop',
    status: 'past',
    title: 'نخستین گردهمایی ملی فعالان و مربیان نوآوری اجتماعی ایران',
    summary: 'گزارش گردهمایی ۲۰۰ نفر از مربیان، معلمان و تسهیلگران ۲۴ استان کشور در دانشگاه تهران.',
    body: `<p>این رویداد با هدف شبکه‌سازی و تدوین نقشه راه نوآوری اجتماعی بومی برگزار گردید.</p>`,
    report: `
      <h2>گزارش رویداد برگزار شده</h2>
      <p>در تاریخ ۱۲ دی ماه ۱۴۰۲، نخستین گردهمایی سراسری فعالان نوآوری اجتماعی با حضور بیش از ۲۰۰ کنشگر از سراسر ایران در تالار فردوسی دانشگاه تهران برگزار شد.</p>
      
      <h2>دستاوردهای کلیدی گردهمایی:</h2>
      <ul>
        <li>ارائه ۱۲ تجربه برتر حل مسئله در مناطق محروم توسط خود اهالی</li>
        <li>تشکیل ۸ کارگروه تخصصی در حوزه‌های آموزش، معیشت و محیط‌زیست</li>
        <li>امضای میثاق‌نامه شبکه ملی تسهیلگران محلی</li>
      </ul>
      
      <blockquote>«این گردهمایی نشان داد که سرمایه اصلی نوآوری در ایران، پیوند میان جوانان دغدغه‌مند و خرد محلی پیشکسوتان است.»</blockquote>
    `,
    heroImage: { id: 'img-ev5', type: 'image', url: '/mock/event-cover.svg' },
    gallery: [
      { id: 'g-ev1', type: 'image', url: '/mock/event-cover.svg', caption: 'عکس دسته جمعی شرکت‌کنندگان' },
    ],
    attachments: [
      {
        id: 'att-rep1',
        type: 'pdf',
        url: '/mock/sample.pdf',
        fileName: 'گزارش_جامع_گردهمایی_ملی_نوآوران.pdf',
        fileSizeBytes: 4200000,
      },
    ],
    startsAt: '2024-01-02T08:30:00Z',
    endsAt: '2024-01-02T17:30:00Z',
    location: 'تهران، دانشکده علوم اجتماعی دانشگاه تهران',
    tags: [{ id: 't-ev6', slug: 'national-gathering', nameFa: 'گردهمایی ملی' }],
    publishedAt: '2024-01-05T10:00:00Z',
    likeCount: 380,
    commentCount: 48,
    viewCount: 4500,
    isLikedByMe: true,
    isBookmarkedByMe: false,
  },
  {
    id: 'event-6',
    slug: 'gamification-in-cultural-education-webinar-report',
    sectionSlug: 'gathering',
    kind: 'webinar',
    status: 'past',
    title: 'وبینار بازیسازی (Gamification) در آموزش و فعالیت‌های اردویی نوجوانان',
    summary: 'گزارش و ویدیوی ضبط‌شده وبینار آشنایی با مکانیک‌های بازی در افزایش انگیزه یادگیری.',
    body: `<p>بررسی نحوه تبدیل مفاهیم سنگین درسی و اخلاقی به سناریوهای بازی‌وار جذاب.</p>`,
    report: `
      <h2>خلاصه مباحث مطرح‌شده در وبینار</h2>
      <p>بیش از ۴۵۰ معلم و مربی تربیتی در این وبینار با اصول ۸ گانه اکشن‌پلن بازیسازی آشنا شدند. ویدیوی کامل این رویداد در بخش آکادمی نوآفر بارگذاری شده است.</p>
    `,
    heroImage: { id: 'img-ev6', type: 'image', url: '/mock/event-cover.svg' },
    gallery: [],
    attachments: [],
    startsAt: '2024-01-18T16:00:00Z',
    endsAt: '2024-01-18T18:30:00Z',
    location: 'آنلاین',
    tags: [{ id: 't-ev7', slug: 'gamification', nameFa: 'گیمیفیکیشن' }],
    publishedAt: '2024-01-20T12:00:00Z',
    likeCount: 215,
    commentCount: 22,
    viewCount: 2800,
    isLikedByMe: false,
    isBookmarkedByMe: false,
  },
  {
    id: 'event-7',
    slug: 'systemic-facilitation-intensive-school-report',
    sectionSlug: 'gathering',
    kind: 'workshop',
    status: 'past',
    title: 'مدرسه تابستانه تسهیلگری سیستمی و حل تعارضات در تشکل‌های مردمی',
    summary: 'گزارش دوره ۴ روزه کارگاهی در مشهد مقدس با حضور ۴۰ نفر از مدیران تشکل‌های فرهنگی.',
    body: `<p>آموزش مهارت‌های حل اختلاف، رهبری خادم و تصمیم‌گیری مشارکتی در تشکل‌های مردم‌نهاد.</p>`,
    report: `
      <h2>دستاوردها و بازخوردهای دوره</h2>
      <p>شرکت‌کنندگان در طول ۴ روز به صورت شبیه‌سازی‌شده با پیچیده‌ترین بحران‌های درون‌سازمانی و چالش‌های تعارض منافع مواجه شدند و راهکارهای گفتگومحور را تمرین کردند.</p>
    `,
    heroImage: { id: 'img-ev7', type: 'image', url: '/mock/event-cover.svg' },
    gallery: [],
    attachments: [],
    startsAt: '2023-09-10T09:00:00Z',
    endsAt: '2023-09-14T18:00:00Z',
    location: 'مشهد مقدس، مرکز نوآوری رسانه',
    tags: [{ id: 't-ev8', slug: 'facilitation', nameFa: 'تسهیلگری' }],
    publishedAt: '2023-09-18T14:00:00Z',
    likeCount: 290,
    commentCount: 33,
    viewCount: 3600,
    isLikedByMe: false,
    isBookmarkedByMe: false,
  },
  {
    id: 'event-8',
    slug: 'water-crisis-social-solutions-symposium',
    sectionSlug: 'gathering',
    kind: 'workshop',
    status: 'past',
    title: 'هم‌اندیشی ملی راه‌حل‌های اجتماعی بحران آب در فلات مرکزی ایران',
    summary: 'گزارش نشست اصفهان پیرامون نقش حکمرانی مشارکتی و دانش بومی در احیای حوضه زاینده‌رود.',
    body: `<p>گفتگوی نخبگان دانشگاهی با کشاورزان شرق و غرب اصفهان برای رسیدن به فهم مشترک.</p>`,
    report: `
      <h2>بیانیه پایانی نشست هم‌اندیشی آب</h2>
      <p>در این نشست ۲ روزه تاکید شد که بحران آب پیش از آنکه یک معضل مهندسی باشد، یک بحران اعتماد، عدالت در تخصیص و حکمرانی مشارکتی است.</p>
    `,
    heroImage: { id: 'img-ev8', type: 'image', url: '/mock/event-cover.svg' },
    gallery: [],
    attachments: [],
    startsAt: '2023-11-25T09:30:00Z',
    endsAt: '2023-11-26T17:00:00Z',
    location: 'اصفهان، اتاق بازرگانی',
    tags: [{ id: 't-ev9', slug: 'water-crisis', nameFa: 'بحران آب' }],
    publishedAt: '2023-11-28T16:00:00Z',
    likeCount: 340,
    commentCount: 41,
    viewCount: 4100,
    isLikedByMe: false,
    isBookmarkedByMe: false,
  },
];
