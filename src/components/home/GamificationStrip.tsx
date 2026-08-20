import React from 'react';
import { Link } from 'react-router-dom';
import { Award, Lightbulb, Footprints, Layout, CheckCircle, ArrowLeft } from 'lucide-react';
import { POINT_CONFIGS } from '../../config/points';
import { Button } from '../ui';
import { toFaDigits } from '../../utils/format';

export const GamificationStrip: React.FC = () => {
  return (
    <section className="py-12 bg-white border-y border-ink-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-pink-500/10 rounded-2xl p-6 sm:p-8 border border-ink-200">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Title & Info */}
            <div className="space-y-2 text-center lg:text-start max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-amber-800 text-xs font-bold border border-amber-200 shadow-2xs">
                <Award className="w-4 h-4 text-amber-600" />
                <span>باشگاه امتیاز و کنشگری نوآفر</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-ink-900">
                با هر گام در مسیر حل مسئله، امتیاز نوآفری کسب کنید
              </h3>
              <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">
                مشارکت در مباحث، ارسال ایده‌های خلاقانه، ثبت روایت تجربیات محلی و تکمیل دوره‌ها شما را در مسیر ارتقای سطح عضویت پیش می‌برد.
              </p>
            </div>

            {/* Points Pills Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
              <div className="bg-white p-3 rounded-xl border border-ink-200 text-center space-y-1 shadow-2xs">
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <p className="text-xs text-ink-600">ثبت ایده نو</p>
                <p className="text-sm font-black text-amber-700 font-sans">
                  +{toFaDigits(POINT_CONFIGS.submit_idea.points)} امتیاز
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-ink-200 text-center space-y-1 shadow-2xs">
                <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-700 flex items-center justify-center mx-auto">
                  <Footprints className="w-4 h-4" />
                </div>
                <p className="text-xs text-ink-600">ثبت تجربه بومی</p>
                <p className="text-sm font-black text-sky-700 font-sans">
                  +{toFaDigits(POINT_CONFIGS.submit_experience.points)} امتیاز
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-ink-200 text-center space-y-1 shadow-2xs">
                <div className="w-8 h-8 rounded-full bg-pink-50 text-pink-700 flex items-center justify-center mx-auto">
                  <Layout className="w-4 h-4" />
                </div>
                <p className="text-xs text-ink-600">تکمیل بوم آنلاین</p>
                <p className="text-sm font-black text-pink-700 font-sans">
                  +{toFaDigits(POINT_CONFIGS.first_canvas.points)} امتیاز
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-ink-200 text-center space-y-1 shadow-2xs">
                <div className="w-8 h-8 rounded-full bg-ink-100 text-ink-800 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <p className="text-xs text-ink-600">اتمام هر دوره</p>
                <p className="text-sm font-black text-ink-900 font-sans">
                  +{toFaDigits(POINT_CONFIGS.complete_course.points)} امتیاز
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
