import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Phone, CheckCircle2, Award } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { isOperatorRole } from '../services/auth';
import { ApiError } from '../services/api';
import { Button, Input } from '../components/ui';
import { TricolorRule } from '../components/brand/TricolorRule';
import { Logo } from '../components/brand/Logo';
import { toFaDigits, toEnDigits } from '../utils/format';

/** Keeps an internal-only, safe redirect target: never an absolute URL. */
function safeReturnTo(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/profile';
  return value;
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get('returnTo'));

  const { isAuthenticated, requestOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendIn, setResendIn] = useState(0);

  // Countdown for the "request a new code" affordance.
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setInterval(() => setResendIn((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  const sendOtp = async () => {
    // Persian digits are normalised so a keyboard switch never blocks login.
    const normalised = toEnDigits(phone).replace(/\D/g, '');
    if (!/^09\d{9}$/.test(normalised)) {
      setError('شماره موبایل باید ۱۱ رقم بوده و با ۰۹ شروع شود (مثال: ۰۹۱۲۳۴۵۶۷۸۹).');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const result = await requestOtp(normalised);
      setPhone(normalised);
      setStep('otp');
      setResendIn(result.resendAfterSeconds || 60);
      if (!result.delivered) {
        setError('ارسال پیامک با مشکل روبه‌رو شد. لطفاً چند لحظه دیگر دوباره تلاش کنید.');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'خطا در ارسال کد تأیید.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    void sendOtp();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = toEnDigits(otp).replace(/\D/g, '');
    if (code.length !== 5) {
      setError('کد تأیید باید ۵ رقم باشد.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const { user } = await verifyOtp(phone, code);
      // The destination follows the role the server assigned, never a value
      // the browser chose for itself.
      navigate(isOperatorRole(user.role) ? '/admin' : returnTo, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'کد وارد شده صحیح نیست.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white border border-ink-200 rounded-2xl p-8 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-ink-900">شما از قبل وارد شده‌اید</h2>
          <p className="text-xs text-ink-500">حساب کاربری فعال شما در پلتفرم نوآفر آماده است.</p>
          <div className="flex gap-2 justify-center pt-2">
            <Link to="/profile">
              <Button variant="primary" size="sm">
                مشاهده میز کار
              </Button>
            </Link>
            <Link to="/">
              <Button variant="secondary" size="sm">
                بازگشت به صفحه اصلی
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-50/50 py-12 px-4 sm:px-6 flex items-center justify-center">
      <div className="max-w-md w-full space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <Logo size="lg" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-ink-900">
            ورود یا عضویت در نوآفر
          </h1>
          <p className="text-xs text-ink-500 max-w-xs mx-auto leading-relaxed">
            دسترسی به بوم‌های تعاملی، دانلود کتب، ثبت تجارب و دریافت امتیازهای کنشگری
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-ink-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 relative overflow-hidden">
          <TricolorRule height={3} />

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4 pt-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-800">
                  شماره تلفن همراه
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                  <Input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    className="ps-10 font-sans"
                    dir="ltr"
                  />
                </div>
                <p className="text-[11px] text-ink-400">
                  کد ورود یکبار مصرف به این شماره پیامک می‌شود.
                </p>
              </div>

              {error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
              >
                دریافت کد تأیید
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-500 font-sans">
                  ارسال شده به {toFaDigits(phone)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setOtp('');
                    setError('');
                  }}
                  className="text-xs text-sky-600 font-bold hover:underline"
                >
                  ویرایش شماره
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-800">
                  کد ۵ رقمی پیامک‌شده
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                  <Input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) => setOtp(toEnDigits(e.target.value).replace(/\D/g, '').slice(0, 5))}
                    placeholder="۱۲۳۴۵"
                    className="ps-10 font-sans text-center tracking-widest text-base"
                    maxLength={5}
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
              >
                ورود به سامانه
              </Button>

              <div className="text-center">
                {resendIn > 0 ? (
                  <span className="text-[11px] text-ink-400 font-sans">
                    دریافت کد جدید تا {toFaDigits(resendIn)} ثانیه دیگر
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => void sendOtp()}
                    className="text-[11px] text-sky-600 font-bold hover:underline"
                  >
                    ارسال دوباره کد تأیید
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Benefits reminder */}
        <div className="bg-white/80 border border-ink-200/80 rounded-xl p-4 text-xs text-ink-600 space-y-2">
          <div className="font-bold text-ink-900 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" />
            <span>مزایای حساب کاربری در نوآفر:</span>
          </div>
          <ul className="space-y-1 text-ink-500 list-disc list-inside">
            <li>ذخیره پروژه‌ها روی بوم‌های تعاملی با خروجی PDF و JSON</li>
            <li>ثبت و همرسانی ایده‌های نوآورانه (+۵۰ امتیاز کنشگری)</li>
            <li>دریافت بازخورد و دیدگاه از شبکه نوآوران اجتماعی کشور</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
