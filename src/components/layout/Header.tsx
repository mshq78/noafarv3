import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  User,
  LogOut,
  Award,
  Menu,
  X,
  PlusCircle,
  Bookmark,
  LayoutDashboard,
  Sparkles,
  Shield,
} from 'lucide-react';
import { Logo } from '../brand/Logo';
import { SECTION_LIST } from '../../config/sections';
import { useAuth } from '../../hooks/useAuth';
import { Button, IconButton } from '../ui';
import { toFaDigits } from '../../utils/format';
import { cn } from '../../utils/cn';

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-ink-200/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Right side: Logo & Primary Navigation */}
        <div className="flex items-center gap-8">
          <Logo size="md" />

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {SECTION_LIST.map((sec) => {
              if (sec.comingSoon) {
                return (
                  <span
                    key={sec.slug}
                    aria-disabled="true"
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-ink-400 select-none cursor-not-allowed opacity-60"
                  >
                    {sec.nameFa}
                  </span>
                );
              }
              const active = isActive(`/${sec.slug}`);
              return (
                <Link
                  key={sec.slug}
                  to={`/${sec.slug}`}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-all select-none',
                    active
                      ? 'bg-sky-50 text-sky-700 font-black'
                      : 'text-ink-600 hover:text-ink-900 hover:bg-ink-50'
                  )}
                >
                  {sec.nameFa}
                </Link>
              );
            })}
            <Link
              to="/blog"
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all select-none',
                isActive('/blog')
                  ? 'bg-sky-50 text-sky-700 font-black'
                  : 'text-ink-600 hover:text-ink-900 hover:bg-ink-50'
              )}
            >
              بلاگ
            </Link>
          </nav>
        </div>

        {/* Left side: Search + Points/User CTA + Mobile menu */}
        <div className="flex items-center gap-2.5">
          {/* Quick Search Button */}
          <Link to="/search">
            <IconButton
              aria-label="جستجو در نوآفر"
              variant="secondary"
              size="sm"
              className="text-ink-600"
            >
              <Search className="w-4 h-4" />
            </IconButton>
          </Link>

          {/* If Authenticated: Points Pill & User Menu */}
          {isAuthenticated && user ? (
            <div className="relative">
              <div className="flex items-center gap-2">
                {/* Points Pill */}
                <Link
                  to="/profile"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200/80 rounded-full text-xs font-bold font-sans shadow-2xs hover:bg-amber-100 transition-colors"
                >
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>{toFaDigits(user.points)} امتیاز</span>
                </Link>

                {/* Profile Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 pe-2.5 bg-ink-50 hover:bg-ink-100 border border-ink-200 rounded-full transition-colors cursor-pointer select-none"
                  aria-label="منوی حساب کاربری"
                >
                  <div className="w-7 h-7 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.displayName || 'کاربر'}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      (user.displayName || 'ک').charAt(0)
                    )}
                  </div>
                  <span className="text-xs font-bold text-ink-800 hidden md:inline truncate max-w-[100px]">
                    {user.displayName || 'حساب کاربری'}
                  </span>
                </button>
              </div>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute end-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] bg-white rounded-xl shadow-xl border border-ink-200 py-1.5 z-40 animate-in fade-in duration-150">
                    <div className="px-4 py-2.5 border-b border-ink-100">
                      <p className="text-xs font-bold text-ink-900 truncate">
                        {user.displayName || 'کاربر نوآفر'}
                      </p>
                      <p className="text-[11px] text-ink-400 font-sans mt-0.5">
                        {toFaDigits(user.phone)}
                      </p>
                    </div>

                    <div className="py-1">
                      {(user.role === 'admin' || user.role === 'operator') && (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-sky-700 bg-sky-50/70 hover:bg-sky-100/70 border-b border-sky-100/60"
                        >
                          <Shield className="w-4 h-4 text-sky-600" />
                          <span>پنل مدیریت سایت</span>
                        </Link>
                      )}
                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-ink-700 hover:bg-ink-50 hover:text-ink-900"
                      >
                        <LayoutDashboard className="w-4 h-4 text-sky-600" />
                        <span>میز کار و ارسال‌ها</span>
                      </Link>
                      <Link
                        to="/profile?tab=bookmarks"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-ink-700 hover:bg-ink-50 hover:text-ink-900"
                      >
                        <Bookmark className="w-4 h-4 text-sky-600" />
                        <span>نشان‌های ذخیره‌شده</span>
                      </Link>
                      <Link
                        to="/spark/submit"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-ink-700 hover:bg-ink-50 hover:text-ink-900"
                      >
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span>ثبت ایده نو (+۵۰ امتیاز)</span>
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-ink-100">
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-pink-600 hover:bg-pink-50 text-start cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>خروج از حساب کاربری</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link to="/login">
              <Button size="sm" variant="primary" rightIcon={<User className="w-3.5 h-3.5" />}>
                ورود / عضویت
              </Button>
            </Link>
          )}

          {/* Mobile Hamburger Toggle */}
          <IconButton
            aria-label="باز کردن منو"
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden text-ink-700"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </IconButton>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-ink-100 bg-white px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2">
            {SECTION_LIST.map((sec) => {
              if (sec.comingSoon) {
                return (
                  <div
                    key={sec.slug}
                    aria-disabled="true"
                    className="p-2.5 rounded-lg text-xs font-bold border border-ink-200/70 bg-ink-50/50 text-ink-400 select-none cursor-not-allowed flex items-center justify-between opacity-60"
                  >
                    <span>{sec.nameFa}</span>
                    <span className="text-[10px] font-medium text-ink-400 bg-ink-100 px-1.5 py-0.5 rounded">
                      به‌زودی
                    </span>
                  </div>
                );
              }
              return (
                <Link
                  key={sec.slug}
                  to={`/${sec.slug}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'p-2.5 rounded-lg text-xs font-bold border transition-colors flex items-center justify-between',
                    isActive(`/${sec.slug}`)
                      ? 'bg-sky-50 text-sky-700 border-sky-200'
                      : 'bg-ink-50 text-ink-700 border-ink-100'
                  )}
                >
                  <span>{sec.nameFa}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-ink-100">
            {(user?.role === 'admin' || user?.role === 'operator') && (
              <Link
                to="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full p-2 text-center text-xs font-bold text-sky-800 bg-sky-100/80 rounded-lg flex items-center justify-center gap-1.5"
              >
                <Shield className="w-4 h-4" />
                <span>ورود به پنل مدیریت سایت</span>
              </Link>
            )}
            <Link
              to="/blog"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex-1 p-2 text-center text-xs font-bold text-ink-700 bg-ink-50 rounded-lg"
            >
              بلاگ و مقالات
            </Link>
            <Link
              to="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex-1 p-2 text-center text-xs font-bold text-ink-700 bg-ink-50 rounded-lg"
            >
              درباره نوآفر
            </Link>
            <Link
              to="/contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex-1 p-2 text-center text-xs font-bold text-ink-700 bg-ink-50 rounded-lg"
            >
              ارتباط با ما
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
