import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle2, Sparkles, Building2 } from 'lucide-react';
import { Button, Input, Textarea, RichTextEditor } from '../components/ui';
import { TricolorRule } from '../components/brand/TricolorRule';
import { DotPattern } from '../components/brand/DotPattern';
import { submitContact } from '../services/endpoints';
import { useToast } from '../components/ui/Toast';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { ApiError } from '../services/api';

export const ContactPage: React.FC = () => {
  const { showToast } = useToast();
  const settings = useSiteSettings();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [subject, setSubject] = useState('همکاری در تولید محتوا');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validated before the request so the visitor sees the problem inline.
    const trimmedContact = contact.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmedContact);
    const digits = trimmedContact
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
      .replace(/\D/g, '');
    if (name.trim().length < 2) {
      setError('نام و نام خانوادگی را وارد کنید.');
      return;
    }
    if (!isEmail && !/^09\d{9}$/.test(digits)) {
      setError('یک شماره موبایل معتبر (۰۹...) یا نشانی رایانامه وارد کنید.');
      return;
    }
    if (message.replace(/<[^>]*>/g, '').trim().length < 10) {
      setError('متن پیام باید حداقل ۱۰ نویسه باشد.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      await submitContact({
        name: name.trim(),
        phone: isEmail ? trimmedContact : digits,
        subject,
        message,
      });
      setIsSubmitted(true);
      showToast('پیام شما با موفقیت در دبیرخانه ثبت شد.', 'success');
    } catch (err) {
      const messageText =
        err instanceof ApiError ? err.message : 'خطا در ارسال پیام. لطفاً دوباره امتحان کنید.';
      setError(messageText);
      showToast(messageText, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-50/40 py-12 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Header */}
        <div className="relative bg-white rounded-2xl p-6 sm:p-10 border border-ink-200 shadow-2xs overflow-hidden">
          <DotPattern
            color="#0077b6"
            className="opacity-25 end-0 top-0"
          />

          <div className="max-w-2xl space-y-2 relative z-10">
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
              همراهی و گفت‌وگو
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-ink-900">
              ارتباط با دبیرخانه نوآفر
            </h1>
            <p className="text-xs sm:text-sm text-ink-500 leading-relaxed">
              پیشنهادات، همکاری‌های نهادی، ارسال منابع علمی یا درخواست برگزاری کارگاه‌های مشترک در دانشگاه‌ها و سازمان‌ها.
            </p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Info Side */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-ink-200 space-y-6 shadow-2xs">
              <h3 className="text-base font-bold text-ink-900">اطلاعات تماس مستقیم</h3>
              <TricolorRule height={3} />

              <div className="space-y-4 text-xs text-ink-600">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-sky-50 text-sky-700 rounded-lg shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-ink-900 mb-0.5">نشانی دبیرخانه:</strong>
                    <span>{settings.contactAddress}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-50 text-amber-700 rounded-lg shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-ink-900 mb-0.5">تلفن پشتیبانی:</strong>
                    <span dir="ltr" className="font-sans">{settings.contactPhone}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-pink-50 text-pink-700 rounded-lg shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-ink-900 mb-0.5">رایانامه رسمی:</strong>
                    <a
                      href={`mailto:${settings.contactEmail ?? ''}`}
                      className="font-sans hover:text-sky-700 transition-colors"
                    >
                      {settings.contactEmail}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-6 text-xs text-sky-900 space-y-2">
              <h4 className="font-bold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-700" />
                <span>پاسخگویی سریع</span>
              </h4>
              <p className="text-sky-800 leading-relaxed">
                پیام‌های ارسالی از طریق این فرم در روزهای کاری ظرف حداکثر ۲۴ ساعت کاری بررسی و پاسخ داده خواهند شد.
              </p>
            </div>
          </div>

          {/* Form Side */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-ink-200 shadow-2xs">
              {isSubmitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-ink-900">پیام شما با موفقیت ثبت شد</h3>
                  <p className="text-xs text-ink-500 max-w-sm mx-auto leading-relaxed">
                    سپاس از همراهی شما. همکاران دبیرخانه نوآفر پیام شما را بررسی کرده و در اسرع وقت پاسخ خواهند داد.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setIsSubmitted(false);
                      setMessage('');
                      setError('');
                    }}
                  >
                    ارسال پیام دیگر
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="text-base font-bold text-ink-900">فرم ارسال پیام به دبیرخانه</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-ink-800">نام و نام خانوادگی</label>
                      <Input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="مثال: مریم حسینی"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-ink-800">رایانامه یا شماره تماس</label>
                      <Input
                        required
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        placeholder="example@mail.com یا ۰۹۱۲..."
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-ink-800">موضوع پیام</label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-ink-200 rounded-xl text-xs text-ink-900 focus:outline-none focus:border-sky-600"
                    >
                      <option value="همکاری در تولید محتوا">همکاری در تولید محتوا و ترجمه منابع</option>
                      <option value="ارسال تجربه یا بوم">ارسال تجربه میدانی یا ابزار نوآوری</option>
                      <option value="همکاری دانشگاهی و رویداد">برگزاری مشترک رویداد و کارگاه</option>
                      <option value="انتقاد یا پیشنهاد">انتقاد، پیشنهاد و گزارش فنی</option>
                      <option value="سایر">سایر موارد</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-ink-800">متن پیام و جزئیات (ویرایشگر پیشرفته با قابلیت درج تصویر/سند)</label>
                    <RichTextEditor
                      value={message}
                      onChange={setMessage}
                      placeholder="متن پیام، جزئیات درخواست یا ایده همکاری خود را بنویسید..."
                      minHeight="180px"
                      required
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
                    size="md"
                    isLoading={isLoading}
                    rightIcon={<Send className="w-4 h-4" />}
                    className="w-full sm:w-auto"
                  >
                    ارسال پیام به دبیرخانه
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
