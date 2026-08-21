import React from 'react';
import { Award, Lightbulb, Footprints, Layout, CheckCircle } from 'lucide-react';
import { POINT_CONFIGS } from '../../config/points';
import { toFaDigits } from '../../utils/format';
import { motion } from 'framer-motion';

export const GamificationStrip: React.FC = () => {
  const pointsData = [
    { label: 'ثبت ایده نو', value: POINT_CONFIGS.submit_idea.points, icon: <Lightbulb className="w-5 h-5" />, color: 'amber' },
    { label: 'ثبت تجربه بومی', value: POINT_CONFIGS.submit_experience.points, icon: <Footprints className="w-5 h-5" />, color: 'sky' },
    { label: 'تکمیل بوم آنلاین', value: POINT_CONFIGS.first_canvas.points, icon: <Layout className="w-5 h-5" />, color: 'pink' },
    { label: 'اتمام هر دوره', value: POINT_CONFIGS.complete_course.points, icon: <CheckCircle className="w-5 h-5" />, color: 'emerald' },
  ];

  return (
    <section className="py-12 bg-white border-y border-ink-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-pink-500/10 rounded-3xl p-6 sm:p-8 lg:p-10 border border-ink-200"
        >
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
            {/* Title & Info */}
            <div className="space-y-4 text-center lg:text-start max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-amber-800 text-xs font-bold border border-amber-200 shadow-2xs">
                <Award className="w-4 h-4 text-amber-600" />
                <span>باشگاه امتیاز و کنشگری نوآفر</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-ink-900 leading-tight">
                با هر گام در مسیر حل مسئله، امتیاز نوآفری کسب کنید
              </h3>
              <p className="text-sm sm:text-base text-ink-600 leading-relaxed font-medium">
                مشارکت در مباحث، ارسال ایده‌های خلاقانه، ثبت روایت تجربیات محلی و تکمیل دوره‌ها شما را در مسیر ارتقای سطح عضویت پیش می‌برد.
              </p>
            </div>

            {/* Points Pills Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
              {pointsData.map((item, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ y: -5 }}
                  className="bg-white p-4 rounded-2xl border border-ink-200 text-center space-y-2 shadow-2xs hover:shadow-md transition-shadow"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto bg-${item.color}-50 text-${item.color}-600`}>
                    {item.icon}
                  </div>
                  <p className="text-xs font-bold text-ink-600 mt-2">{item.label}</p>
                  <p className={`text-base font-black text-${item.color}-700 font-sans`}>
                    +{toFaDigits(item.value)}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
