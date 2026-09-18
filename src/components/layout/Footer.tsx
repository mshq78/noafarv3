import React from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Phone,
  MapPin,
  Heart,
  Send,
  Shield,
  Instagram,
  PlayCircle,
  Linkedin,
} from 'lucide-react';
import { Logo } from '../brand/Logo';
import { TricolorRule } from '../brand/TricolorRule';
import { SECTION_LIST } from '../../config/sections';
import { useAuth } from '../../hooks/useAuth';
import { useSiteSettings } from '../../hooks/useSiteSettings';

interface SocialItem {
  key: string;
  url?: string;
  label: string;
  icon: React.ReactNode;
}

export const Footer: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && (user?.role === 'admin' || user?.role === 'operator');
  const settings = useSiteSettings();

  const socialItems: SocialItem[] = [
    {
      key: 'instagram',
      url: settings.instagramUrl?.trim(),
      label: 'اینستاگرام نوآفر',
      icon: <Instagram className="w-4 h-4" />,
    },
    {
      key: 'telegram',
      url: settings.telegramUrl?.trim(),
      label: 'کانال تلگرام نوآفر',
      icon: <Send className="w-4 h-4" />,
    },
    {
      key: 'aparat',
      url: settings.aparatUrl?.trim(),
      label: 'کانال آپارات نوآفر',
      icon: <PlayCircle className="w-4 h-4" />,
    },
    {
      key: 'linkedin',
      url: settings.linkedinUrl?.trim(),
      label: 'صفحه لینکدین نوآفر',
      icon: <Linkedin className="w-4 h-4" />,
    },
    {
      key: 'email',
      url: settings.contactEmail?.trim() ? `mailto:${settings.contactEmail.trim()}` : '',
      label: 'ارسال ایمیل به نوآفر',
      icon: <Mail className="w-4 h-4" />,
    },
  ];

  const validSocialLinks = socialItems.filter(
    (item): item is SocialItem & { url: string } =>
      Boolean(item.url && item.url !== '' && item.url !== '#' && item.url !== 'mailto:')
  );

  return (
    <footer className="bg-white text-ink-600 text-xs border-t border-ink-200">
      {/* Top Tricolor Brand Rule */}
      <TricolorRule />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {/* Column 1: Brand & Mission */}
          <div className="space-y-4">
            <Logo size="md" />
            <p className="text-xs text-ink-500 leading-relaxed">
              {settings.footerDescription}
            </p>
            {validSocialLinks.length > 0 && (
              <div className="flex items-center gap-2 pt-2 text-ink-600">
                {validSocialLinks.map((item) => (
                  <a
                    key={item.key}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-ink-100 hover:bg-ink-200 text-ink-600 hover:text-ink-900 rounded-lg transition-colors"
                    aria-label={item.label}
                  >
                    {item.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: The 6 Sections */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-ink-900 tracking-wider">
              درگاه‌های نوآفر
            </h4>
            <ul className="space-y-2">
              {SECTION_LIST.map((sec) => (
                <li key={sec.slug}>
                  {sec.comingSoon ? (
                    <div className="text-ink-400 cursor-not-allowed select-none flex items-center justify-between opacity-60">
                      <span>{sec.nameFa}</span>
                      <span className="text-[10px] text-ink-500 bg-ink-100 px-1.5 py-0.5 rounded">به زودی</span>
                    </div>
                  ) : (
                    <Link
                      to={`/${sec.slug}`}
                      className="text-ink-600 hover:text-ink-900 transition-colors flex items-center justify-between"
                    >
                      <span>{sec.nameFa}</span>
                      <span className="text-[10px] text-ink-400 font-sans">{sec.slug}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Quick Links & Resources */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-ink-900 tracking-wider">
              بخش‌های تکمیلی
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/blog" className="text-ink-600 hover:text-ink-900 transition-colors">
                  بلاگ و یادداشت‌های تخصصی
                </Link>
              </li>
              <li>
                <Link to="/spark/submit" className="text-ink-600 hover:text-ink-900 transition-colors">
                  ثبت ایده نوآوری اجتماعی
                </Link>
              </li>
              <li>
                <Link to="/journey/submit" className="text-ink-600 hover:text-ink-900 transition-colors">
                  ثبت روایت تجربه میدانی
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-ink-600 hover:text-ink-900 transition-colors">
                  درباره پلتفرم نوآفر
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-ink-600 hover:text-ink-900 transition-colors">
                  تماس و همکاری سازمانی
                </Link>
              </li>
              {isAdmin && (
                <li>
                  <Link to="/admin" className="text-sky-700 hover:text-sky-900 transition-colors font-bold flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" />
                    <span>پنل مدیریت و راهبری</span>
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Column 4: Contact & Office */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-ink-900 tracking-wider">
              ارتباط با دبیرخانه
            </h4>
            <div className="space-y-2.5 text-xs text-ink-600">
              {settings.contactAddress && (
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <span>{settings.contactAddress}</span>
                </p>
              )}
              {settings.contactPhone && (
                <p className="flex items-center gap-2 font-sans">
                  <Phone className="w-4 h-4 text-amber-600 shrink-0" />
                  <span dir="ltr">{settings.contactPhone}</span>
                </p>
              )}
              {settings.contactEmail && (
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-pink-600 shrink-0" />
                  <span>{settings.contactEmail}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="mt-12 pt-8 border-t border-ink-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-ink-500 text-[11px]">
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

