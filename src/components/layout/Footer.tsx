import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Heart, Send, Shield } from 'lucide-react';
import { Logo } from '../brand/Logo';
import { TricolorRule } from '../brand/TricolorRule';
import { SECTION_LIST } from '../../config/sections';
import { useAuth } from '../../hooks/useAuth';
import { useSiteSettings } from '../../hooks/useSiteSettings';

export const Footer: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && (user?.role === 'admin' || user?.role === 'operator');
  const settings = useSiteSettings();
  return (
    <footer className="bg-ink-900 text-ink-300 text-xs border-t border-ink-800">
      {/* Top Tricolor Brand Rule */}
      <TricolorRule />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {/* Column 1: Brand & Mission */}
          <div className="space-y-4">
            <Logo size="md" invert className="text-white" />
            <p className="text-xs text-ink-400 leading-relaxed">
              {settings.footerDescription}
            </p>
            <div className="flex items-center gap-3 pt-2 text-ink-400">
              <a
                href="https://t.me/noafar_ir"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-ink-800 hover:bg-sky-600 hover:text-white rounded-lg transition-colors"
                aria-label="کانال تلگرام نوآفر"
              >
                <Send className="w-4 h-4" />
              </a>
              <a
                href={`mailto:${settings.contactEmail ?? ''}`}
                className="p-2 bg-ink-800 hover:bg-sky-600 hover:text-white rounded-lg transition-colors"
                aria-label="ایمیل نوآفر"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: The 6 Sections */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wider">
              درگاه‌های نوآفر
            </h4>
            <ul className="space-y-2">
              {SECTION_LIST.map((sec) => (
                <li key={sec.slug}>
                  {sec.comingSoon ? (
                    <div className="text-ink-500 cursor-not-allowed select-none flex items-center justify-between opacity-60">
                      <span>{sec.nameFa}</span>
                      <span className="text-[10px] text-ink-500 bg-ink-800 px-1.5 py-0.5 rounded">به زودی</span>
                    </div>
                  ) : (
                    <Link
                      to={`/${sec.slug}`}
                      className="hover:text-white transition-colors flex items-center justify-between"
                    >
                      <span>{sec.nameFa}</span>
                      <span className="text-[10px] text-ink-500 font-sans">{sec.slug}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Quick Links & Resources */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wider">
              بخش‌های تکمیلی
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/blog" className="hover:text-white transition-colors">
                  بلاگ و یادداشت‌های تخصصی
                </Link>
              </li>
              <li>
                <Link to="/spark/submit" className="hover:text-white transition-colors">
                  ثبت ایده نوآوری اجتماعی
                </Link>
              </li>
              <li>
                <Link to="/journey/submit" className="hover:text-white transition-colors">
                  ثبت روایت تجربه میدانی
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  درباره پلتفرم نوآفر
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  تماس و همکاری سازمانی
                </Link>
              </li>
              {isAdmin && (
                <li>
                  <Link to="/admin" className="text-sky-400 hover:text-sky-300 transition-colors font-bold flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" />
                    <span>پنل مدیریت و راهبری</span>
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Column 4: Contact & Office */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wider">
              ارتباط با دبیرخانه
            </h4>
            <div className="space-y-2.5 text-xs text-ink-400">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>{settings.contactAddress}</span>
              </p>
              <p className="flex items-center gap-2 font-sans">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span dir="ltr">{settings.contactPhone}</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-pink-400 shrink-0" />
                <span>{settings.contactEmail}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="mt-12 pt-8 border-t border-ink-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-ink-500 text-[11px]">
          <p>{settings.footerCopyright}</p>
          <p className="flex items-center gap-1">
            <span>توسعه‌یافته با</span>
            <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
            <span>برای ایران و آینده جامعه</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
