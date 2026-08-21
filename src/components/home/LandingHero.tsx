import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, Sparkles, Compass, Users } from 'lucide-react';
import { Button } from '../ui';
import { NoafarMark } from '../brand/NoafarMark';
import { TricolorRule } from '../brand/TricolorRule';
import { DotPattern } from '../brand/DotPattern';
import { useAuth } from '../../hooks/useAuth';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { motion } from 'framer-motion';

export const LandingHero: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  const settings = useSiteSettings();
  const handleScrollToSections = () => {
    const el = document.getElementById('six-sections-grid');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden bg-white border-b border-ink-100">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/70 lg:to-white/40 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1600&auto=format&fit=crop&q=80" 
          alt="همکاری اجتماعی و تیمی" 
          className="w-full h-full object-cover opacity-60"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 py-16 sm:py-24 lg:py-32 grid lg:grid-cols-2 gap-12 items-center">
        {/* Text Content */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="space-y-6 text-start"
        >
          <div className="inline-flex p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-sky-100 ring-4 ring-white/50 mb-2">
            <NoafarMark size={48} />
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-ink-900 leading-tight tracking-tight whitespace-pre-line">{settings.heroTitle}</h1>
          <p className="text-base sm:text-lg text-ink-700 leading-relaxed font-medium whitespace-pre-line">{settings.heroSubtitle}</p>

          <div className="max-w-xs py-2">
            <TricolorRule height={4} />
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
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
              <Link to="/profile" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="secondary"
                  rightIcon={<Users className="w-4 h-4 text-sky-600" />}
                  className="w-full sm:w-auto bg-white/80 backdrop-blur hover:bg-white"
                >
                  میز کار کاربری ({user?.displayName})
                </Button>
              </Link>
            ) : (
              <Link to="/login" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="accent"
                  rightIcon={<Sparkles className="w-4 h-4" />}
                  className="w-full sm:w-auto"
                >
                  پیوستن به خانواده نوآفر
                </Button>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Visual Stats / Image Showcase */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="relative lg:h-[500px] flex items-center justify-center"
        >
          <div className="grid grid-cols-2 gap-4 w-full">
            <motion.div whileHover={{ y: -5 }} className="space-y-4 pt-12">
              <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-sky-100 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 end-0 w-24 h-24 bg-sky-100 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-sky-200 transition-colors" />
                <span className="text-xs text-sky-600 font-bold block mb-1 relative z-10">دوره‌های تخصصی</span>
                <span className="text-3xl font-black text-sky-900 font-sans relative z-10 block">۳۴</span>
                <span className="text-xs text-ink-500 block mt-1 relative z-10">دوره و کارگاه آموزشی</span>
              </div>
              <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-pink-100 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 end-0 w-24 h-24 bg-pink-100 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-pink-200 transition-colors" />
                <span className="text-xs text-pink-600 font-bold block mb-1 relative z-10">بوم‌ها و کاربرگ‌ها</span>
                <span className="text-3xl font-black text-pink-900 font-sans relative z-10 block">۲۸</span>
                <span className="text-xs text-ink-500 block mt-1 relative z-10">ابزار تعاملی حل مسئله</span>
              </div>
            </motion.div>
            
            <motion.div whileHover={{ y: -5 }} className="space-y-4">
              <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-amber-100 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 end-0 w-24 h-24 bg-amber-100 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-amber-200 transition-colors" />
                <span className="text-xs text-amber-600 font-bold block mb-1 relative z-10">تجارب بومی</span>
                <span className="text-3xl font-black text-amber-900 font-sans relative z-10 block">۴۲</span>
                <span className="text-xs text-ink-500 block mt-1 relative z-10">روایت میدانی موفق</span>
              </div>
              <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-emerald-100 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 end-0 w-24 h-24 bg-emerald-100 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-emerald-200 transition-colors" />
                <span className="text-xs text-emerald-600 font-bold block mb-1 relative z-10">منابع و کتب</span>
                <span className="text-3xl font-black text-emerald-900 font-sans relative z-10 block">۱۵۰+</span>
                <span className="text-xs text-ink-500 block mt-1 relative z-10">منبع غنی برای مطالعه</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
