import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Phone, CheckCircle2, Award, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { isOperatorRole } from '../services/auth';
import { ApiError } from '../services/api';
import { requestPasswordReset } from '../services/endpoints';
import { Button, Input } from '../components/ui';
import { TricolorRule } from '../components/brand/TricolorRule';
import { Logo } from '../components/brand/Logo';
import { toFaDigits, toEnDigits } from '../utils/format';
import { cn } from '../utils/cn';

/** Which sign-in method the visitor is using. */
type LoginMethod = 'phone' | 'email';

/** Where the email pane currently is. */
type EmailMode = 'login' | 'register' | 'forgot' | 'reset';

/** Keeps an internal-only, safe redirect target: never an absolute URL. */
function safeReturnTo(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/profile';
  return value;
}

/** Copy for each state of the email pane, so the markup below stays one form. */
const EMAIL_COPY: Record<EmailMode, { submit: string; title?: string; hint?: string }> = {
  login: { submit: 'ورود به حساب کاربری' },
  register: {
    submit: 'ساخت حساب کاربری',
    hint: 'گذرواژه باید حداقل ۸ نویسه باشد.',
  },
  forgot: {
    title: 'بازیابی گذرواژه',
    submit: 'ارسال پیوند بازیابی',
    hint: 'پیوند تعیین گذرواژه تازه به این نشانی فرستاده می‌شود.',
  },
  reset: {
    title: 'تعیین گذرواژه تازه',
    submit: 'ثبت گذرواژه و ورود',
    hint: 'گذرواژه باید حداقل ۸ نویسه باشد.',
  },
};

interface EmailPaneProps {
  mode: EmailMode;
  email: string;
  password: string;
  displayName: string;
  showPassword: boolean;
  isLoading: boolean;
  error: string;
  notice: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onDisplayNameChange: (value: string) => void;
  onToggleShowPassword: () => void;
  onModeChange: (mode: EmailMode) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const EmailPane: React.FC<EmailPaneProps> = ({
  mode,
  email,
  password,
  displayName,
  showPassword,
  isLoading,
  error,
  notice,
  onEmailChange,
  onPasswordChange,
  onDisplayNameChange,
  onToggleShowPassword,
  onModeChange,
  onSubmit,
}) => {
  const copy = EMAIL_COPY[mode];
  const needsEmail = mode !== 'reset';
  const needsPassword = mode !== 'forgot';

  return (
    <form onSubmit={onSubmit} className="space-y-4 pt-4">
      {copy.title && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-ink-800">{copy.title}</span>
          <button
            type="button"
            onClick={() => onModeChange('login')}
            className="text-xs text-sky-600 font-bold hover:underline cursor-pointer"
          >
            بازگشت به ورود
          </button>
        </div>
      )}

      {mode === 'register' && (
        <div className="space-y-1">
          <label className="text-xs font-bold text-ink-800">نام و نام خانوادگی (اختیاری)</label>
          <Input
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(e) => onDisplayNameChange(e.target.value)}
            placeholder="مثال: مریم حسینی"
          />
        </div>
      )}

      {needsEmail && (
        <div className="space-y-1">
          <label className="text-xs font-bold text-ink-800">نشانی رایانامه</label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="example@mail.com"
              className="ps-10 font-sans"
              dir="ltr"
              required
            />
          </div>
        </div>
      )}

      {needsPassword && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-ink-800">
              {mode === 'login' ? 'گذرواژه' : 'گذرواژه تازه'}
            </label>
            {mode === 'login' && (
              <button
                type="button"
                onClick={() => onModeChange('forgot')}
                className="text-[11px] text-sky-600 font-bold hover:underline cursor-pointer"
              >
                گذرواژه را فراموش کرده‌اید؟
              </button>
            )}
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <Input
              type={showPassword ? 'text' : 'password'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="••••••••"
              className="ps-10 pe-10 font-sans"
              dir="ltr"
              required
            />
            <button
              type="button"
              onClick={onToggleShowPassword}
              className="absolute end-3 top-1/2 -translate-y-1/2 p-1 text-ink-400 hover:text-ink-700 cursor-pointer"
              aria-label={showPassword ? 'پنهان کردن گذرواژه' : 'نمایش گذرواژه'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {copy.hint && <p className="text-[11px] text-ink-400">{copy.hint}</p>}
        </div>
      )}

      {mode === 'forgot' && copy.hint && <p className="text-[11px] text-ink-400">{copy.hint}</p>}

      {notice && (
        <div className="p-2.5 bg-sky-50 border border-sky-200 text-sky-800 text-xs rounded-lg leading-relaxed">
          {notice}
        </div>
      )}

      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
        {copy.submit}
      </Button>

      {(mode === 'login' || mode === 'register') && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => onModeChange(mode === 'login' ? 'register' : 'login')}
            className="text-[11px] text-ink-500 hover:text-sky-700 cursor-pointer"
          >
            {mode === 'login' ? (
              <>
                حساب کاربری ندارید؟{' '}
                <span className="text-sky-600 font-bold">ثبت‌نام کنید</span>
              </>
            ) : (
              <>
                قبلاً ثبت‌نام کرده‌اید؟{' '}
                <span className="text-sky-600 font-bold">وارد شوید</span>
              </>
            )}
          </button>
        </div>
      )}
    </form>
  );
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get('returnTo'));

  const {
    isAuthenticated,
    requestOtp,
    verifyOtp,
    loginWithEmail,
    registerWithEmail,
    resetPassword,
  } = useAuth();

  // A reset link lands here as /login?reset=<token>, which opens that pane.
  const resetToken = searchParams.get('reset') ?? '';

  const [method, setMethod] = useState<LoginMethod>(resetToken ? 'email' : 'phone');
  const [emailMode, setEmailMode] = useState<EmailMode>(resetToken ? 'reset' : 'login');

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [resendIn, setResendIn] = useState(0);

  // Email pane
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const goToEmailMode = (next: EmailMode) => {
    setEmailMode(next);
    setError('');
    setNotice('');
    setPassword('');
  };

  const switchMethod = (next: LoginMethod) => {
    setMethod(next);
    setError('');
    setNotice('');
  };

  /** Sends the visitor on once the server has told us who they are. */
  const afterSignIn = (user: { role: string }) => {
    navigate(isOperatorRole(user.role as never) ? '/admin' : returnTo, { replace: true });
  };

  const submitEmailForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setIsLoading(true);
    try {
      if (emailMode === 'login') {
        const { user } = await loginWithEmail(email.trim(), password);
        afterSignIn(user);
      } else if (emailMode === 'register') {
        const { user } = await registerWithEmail(email.trim(), password, displayName.trim());
        afterSignIn(user);
      } else if (emailMode === 'forgot') {
        const result = await requestPasswordReset(email.trim());
        setNotice(result.message);
      } else {
        const { user } = await resetPassword(resetToken, password);
        afterSignIn(user);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'انجام این کار ممکن نشد. دوباره تلاش کنید.');
    } finally {
      setIsLoading(false);
    }
  };

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

          {/* Sign-in method switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-ink-50 border border-ink-200 rounded-xl mt-4">
            {(
              [
                { id: 'phone', label: 'شماره موبایل', icon: Phone },
                { id: 'email', label: 'رایانامه و گذرواژه', icon: Mail },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => switchMethod(option.id)}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer',
                  method === option.id
                    ? 'bg-white text-sky-700 shadow-2xs border border-ink-200'
                    : 'text-ink-500 hover:text-ink-800',
                )}
              >
                <option.icon className="w-3.5 h-3.5" />
                <span>{option.label}</span>
              </button>
            ))}
          </div>

          {method === 'email' ? (
            <EmailPane
              mode={emailMode}
              email={email}
              password={password}
              displayName={displayName}
              showPassword={showPassword}
              isLoading={isLoading}
              error={error}
              notice={notice}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onDisplayNameChange={setDisplayName}
              onToggleShowPassword={() => setShowPassword((value) => !value)}
              onModeChange={goToEmailMode}
              onSubmit={submitEmailForm}
            />
          ) : step === 'phone' ? (
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
