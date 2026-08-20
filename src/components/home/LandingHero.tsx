import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, Sparkles, Compass, Users } from 'lucide-react';
import { Button } from '../ui';
import { NoafarMark } from '../brand/NoafarMark';
import { TricolorRule } from '../brand/TricolorRule';
import { DotPattern } from '../brand/DotPattern';
import { useAuth } from '../../hooks/useAuth';

export const LandingHero: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  const handleScrollToSections = () => {
    const el = document.getElementById('six-sections-grid');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/40 via-white to-white py-16 sm:py-24 border-b border-ink-100">
      {/* Background brand dots texture */}
      <DotPattern
        width={320}
        height={320}
        rows={8}
        cols={8}
        dotColor="#0077b6"
        className="opacity-25 end-0 -top-12"
      />
      <DotPattern
        width={240}
        height={240}
        rows={6}
        cols={6}
        dotColor="#e07a5f"
        className="opacity-20 start-4 -bottom-10"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 text-center space-y-6">
        {/* Brand Mark with subtle glow */}
        <div className="flex justify-center mb-2">
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-sky-100 ring-4 ring-sky-50/80">
            <NoafarMark size={54} />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-3 max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-black text-ink-900 leading-tight tracking-tight">
            توانمندسازی کنشگران <span className="text-sky-700">نوآوری</span> و{' '}
            <span className="text-pink-600">کسب‌وکار اجتماعی</span> در ایران
          </h1>
          <p className="text-base sm:text-lg text-ink-600 leading-relaxed max-w-2xl mx-auto">
            جامع‌ترین بستر یادگیری مهارتی، جعبه‌ابزار بوم‌های حل مسئله، کتابخانه تخصصی، روایت تجربیات بومی، گردهمایی‌ها و ایده‌پردازی برای خلق تغییر اجتماعی پایدار.
          </p>
        </div>

        {/* Tricolor brand divider */}
        <div className="max-w-xs mx-auto py-2">
          <TricolorRule height={3} />
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            size="lg"
            variant="primary"
            onClick={handleScrollToSections}
            rightIcon={<ArrowDown className="w-4 h-4" />}
            className="w-full sm:w-auto shadow-md"
          >
            کاوش در ۶ درگاه نوآفر
          </Button>

          {isAuthenticated ? (
            <Link to="/profile">
              <Button
                size="lg"
                variant="secondary"
                rightIcon={<Users className="w-4 h-4 text-sky-600" />}
                className="w-full sm:w-auto"
              >
                میز کار کاربری ({user?.displayName})
              </Button>
            </Link>
          ) : (
            <Link to="/login">
              <Button
                size="lg"
                variant="accent"
                rightIcon={<Sparkles className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                ورود و پیوستن به خانواده نوآفر
              </Button>
            </Link>
          )}
        </div>

        {/* Key Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-10 max-w-3xl mx-auto text-start">
          <div className="p-3.5 bg-white rounded-xl border border-ink-200 shadow-2xs">
            <span className="text-xs text-ink-400 block mb-0.5">دوره‌های تخصصی</span>
            <span className="text-lg font-black text-sky-700 font-sans">۳۴ دوره و کارگاه</span>
          </div>
          <div className="p-3.5 bg-white rounded-xl border border-ink-200 shadow-2xs">
            <span className="text-xs text-ink-400 block mb-0.5">بوم‌ها و کاربرگ‌ها</span>
            <span className="text-lg font-black text-pink-600 font-sans">۲۸ ابزار تعاملی</span>
          </div>
          <div className="p-3.5 bg-white rounded-xl border border-ink-200 shadow-2xs">
            <span className="text-xs text-ink-400 block mb-0.5">روایت‌های بومی ایران</span>
            <span className="text-lg font-black text-amber-700 font-sans">۴۲ تجربه میدانی</span>
          </div>
          <div className="p-3.5 bg-white rounded-xl border border-ink-200 shadow-2xs">
            <span className="text-xs text-ink-400 block mb-0.5">منابع و کتب معتبر</span>
            <span className="text-lg font-black text-ink-800 font-sans">۱۵۰+ منبع غنی</span>
          </div>
        </div>
      </div>
    </section>
  );
};
