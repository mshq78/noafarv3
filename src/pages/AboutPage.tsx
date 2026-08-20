import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  BookOpen,
  Wrench,
  Users,
  Compass,
  Award,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { DotPattern } from '../components/brand/DotPattern';
import { TricolorRule } from '../components/brand/TricolorRule';
import { Button } from '../components/ui';
import { SECTION_LIST } from '../config/sections';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-ink-50/50 py-16 sm:py-24 border-b border-ink-200">
        <DotPattern
          width={220}
          height={220}
          rows={6}
          cols={6}
          dotColor="#0077b6"
          className="opacity-20 end-4 top-4"
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 text-sky-800 border border-sky-200 rounded-full text-xs font-bold font-sans">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>پلتفرم ملی نوآوری و کارآفرینی اجتماعی</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-ink-900 leading-tight">
            درباره پلتفرم «نوآفر»
          </h1>

          <p className="text-sm sm:text-base text-ink-600 leading-relaxed max-w-2xl mx-auto">
            نوآفر یک اکوسیستم باز و مشارکتی برای یادگیری روش‌های نوین حل مسائل اجتماعی، ابزارهای طراحی کسب‌وکار اجتماعی و شبکه‌سازی میان کنشگران، محققان و سازمان‌های مردم‌نهاد است.
          </p>

          <TricolorRule height={4} className="max-w-xs mx-auto" />
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl border border-ink-200 bg-white shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-black">
              ۱
            </div>
            <h3 className="text-lg font-bold text-ink-900">ترویج و دانش‌افزایی</h3>
            <p className="text-xs text-ink-500 leading-relaxed">
              ارائه رایگان دوره‌ها، مقالات، درس‌گفتارها و ترجمه آخرین منابع معتبر بین‌المللی نوآوری اجتماعی به زبان فارسی روان و کاربردی.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-ink-200 bg-white shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-black">
              ۲
            </div>
            <h3 className="text-lg font-bold text-ink-900">ابزارسازی و بوم‌های بومی</h3>
            <p className="text-xs text-ink-500 leading-relaxed">
              توسعه بوم‌های تعاملی استاندارد (مانند بوم کسب‌وکار اجتماعی، بوم نظریه تغییر و بوم همدلی) قابل کار آنلاین با خروجی برداری.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-ink-200 bg-white shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
              ۳
            </div>
            <h3 className="text-lg font-bold text-ink-900">هم‌افزایی و جامعه‌سازی</h3>
            <p className="text-xs text-ink-500 leading-relaxed">
              ایجاد بستری برای ثبت تجارب تلخ و شیرین میدانی کارآفرینان اجتماعی و دریافت بازخورد سازنده از اعضای جامعه نوآفر.
            </p>
          </div>
        </div>

        {/* 6 Portals overview */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-ink-900">درگاه‌های ۶گانه نوآفر</h2>
            <p className="text-xs text-ink-500">هر درگاه پاسخگوی نیازی از چرخه حیات نوآوری اجتماعی است</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SECTION_LIST.map((sec) => (
              <Link
                key={sec.slug}
                to={`/${sec.slug}`}
                className="p-5 rounded-xl border border-ink-200 hover:border-sky-500 bg-white hover:shadow-xs transition-all flex flex-col justify-between gap-3 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-ink-900 group-hover:text-sky-700 transition-colors">
                      {sec.nameFa}
                    </span>
                    <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-ink-100 text-ink-600">
                      {sec.slug}
                    </span>
                  </div>
                  <p className="text-xs text-ink-500 leading-relaxed">
                    {sec.taglineFa || sec.descriptionFa}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-sky-600 group-hover:translate-x-[-4px] transition-transform">
                  <span>مشاهده منابع</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="bg-ink-50 rounded-2xl p-8 sm:p-12 border border-ink-200 space-y-6">
          <h2 className="text-xl font-bold text-ink-900 text-center">اصول و ارزش‌های حاکم بر نوآفر</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-ink-700">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <span><strong>دسترسی آزاد و همگانی:</strong> محتواهای پایه و ابزارهای کاربردی همواره رایگان می‌مانند.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <span><strong>مبتنی بر بوم ایران:</strong> تلفیق نظریه‌های جهانی با بافت فرهنگی و اجتماعی استان‌ها و مناطق مختلف.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <span><strong>شفافیت و همرسانی خطاها:</strong> ارزش قائل شدن برای شکست‌های آموزشی به اندازه موفقیت‌ها.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <span><strong>کنشگری مسئولانه:</strong> حفظ کرامت جوامع محلی و سنجش واقعی اثرات اجتماعی پروژه‌ها.</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4 pt-4">
          <h3 className="text-xl font-bold text-ink-900">شما هم عضوی از شبکه نوآفر باشید</h3>
          <p className="text-xs text-ink-500 max-w-md mx-auto">
            تجربه یا ایده خود را ثبت کنید و به جریان تحول اجتماعی کشور بپیوندید.
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/spark/submit">
              <Button variant="primary" size="md">
                ثبت ایده نوآوری اجتماعی
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="secondary" size="md">
                ارتباط با دبیرخانه
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
