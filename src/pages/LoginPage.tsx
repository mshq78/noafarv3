import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Sparkles, Phone, ShieldCheck, ArrowRight, Award, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button, Input } from '../components/ui';
import { TricolorRule } from '../components/brand/TricolorRule';
import { Logo } from '../components/brand/Logo';
import { MOCK_CURRENT_USER } from '../mocks';
import { toFaDigits } from '../utils/format';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/profile';
  const { login, isAuthenticated } = useAuth();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('09123456789');
  const [otp, setOtp] = useState('12345');
  const [displayName, setDisplayName] = useState('علی محمدی');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('شماره تلفن همراه را به درستی وارد کنید.');
      return;
    }
    setError('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
    }, 400);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      setError('کد تأیید پیامک‌شده را وارد کنید.');
      return;
    }
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const user = {
        ...MOCK_CURRENT_USER,
        displayName: displayName || MOCK_CURRENT_USER.displayName,
        phone: phone,
      };
      login('token_' + Date.now(), user);
      navigate(returnTo);
    }, 400);
  };

  const handleQuickDemoLogin = () => {
    login('token_demo_' + Date.now(), MOCK_CURRENT_USER);
    navigate(returnTo);
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
            <form onSubmit={handleSendOtp} className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-800">
                  شماره تلفن همراه
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                  <Input
                    type="tel"
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

              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-800">
                  نام و نام خانوادگی
                </label>
                <Input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="مثال: علی محمدی"
                />
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
            <form onSubmit={handleVerifyOtp} className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-500 font-sans">
                  ارسال شده به {toFaDigits(phone)}
                </span>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
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
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="۱۲۳۴۵"
                    className="ps-10 font-sans text-center tracking-widest text-base"
                    maxLength={5}
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-ink-400">
                  (در محیط آزمایشی، هر کدی مانند ۱۲۳۴۵ پذیرفته است)
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
                ورود به سامانه
              </Button>
            </form>
          )}

          {/* Quick Demo Login Option */}
          <div className="pt-4 border-t border-ink-100 text-center space-y-2">
            <span className="text-[11px] text-ink-400">ورود آزمایشی با یک کلیک:</span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleQuickDemoLogin}
              className="w-full bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100"
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-sky-600" />}
            >
              ورود سریع با اکانت پیش‌فرض دمو
            </Button>
          </div>
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
