import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, Send, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';
import { Input, Textarea, Select, ChipInput, FileUpload, Button, RichTextEditor } from '../ui';
import { JOURNEY_FIELDS } from '../../config/categories';
import { submitIdea } from '../../services/endpoints';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../ui/Toast';
import { useDraft } from '../../hooks/useDraft';
import { LoginPromptModal } from '../modals/LoginPromptModal';

interface IdeaFormValues {
  title: string;
  fieldSlug: string;
  summary: string;
  body: string;
  tags: string[];
}

const defaultValues: IdeaFormValues = {
  title: '',
  fieldSlug: '',
  summary: '',
  body: '',
  tags: [],
};

export const IdeaSubmissionForm: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { initialData, restored, saveDraft, clearDraft } = useDraft<IdeaFormValues>('idea', defaultValues);

  const [formData, setFormData] = useState<IdeaFormValues>(initialData);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Sync draft whenever restored updates
  React.useEffect(() => {
    if (restored) {
      setFormData(initialData);
    }
  }, [restored, initialData]);

  const handleChange = (key: keyof IdeaFormValues, val: any) => {
    const updated = { ...formData, [key]: val };
    setFormData(updated);
    saveDraft(updated);
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim() || formData.title.length < 5) {
      newErrors.title = 'عنوان ایده باید حداقل ۵ نویسه باشد.';
    }
    if (!formData.fieldSlug) {
      newErrors.fieldSlug = 'لطفاً حوزه موضوعی ایده را انتخاب کنید.';
    }
    if (!formData.summary.trim() || formData.summary.length < 10) {
      newErrors.summary = 'خلاصه ایده باید حداقل ۱۰ نویسه باشد.';
    }
    if (!formData.body.trim() || formData.body.length < 30) {
      newErrors.body = 'شرح تفصیلی ایده باید حداقل ۳۰ نویسه باشد.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await submitIdea({
        title: formData.title,
        fieldSlug: formData.fieldSlug,
        summary: formData.summary,
        body: formData.body,
        tags: formData.tags,
      });

      clearDraft();
      showToast('ایده شما با موفقیت ثبت شد و ۵۰ امتیاز نوآفری دریافت کردید!', 'success');
      navigate('/profile');
    } catch {
      showToast('خطا در ثبت ایده. لطفاً دوباره امتحان کنید.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldOptions = JOURNEY_FIELDS.map((f) => ({
    value: f.slug,
    label: f.nameFa,
  }));

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-ink-200 p-6 sm:p-8 shadow-xs space-y-6">
      <div className="space-y-1 pb-4 border-b border-ink-100">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
            <Lightbulb className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-black text-ink-900">
            ثبت ایده نوآوری اجتماعی در درگاه جرقه
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-ink-500 leading-relaxed">
          ایده‌های نوآورانه شما پس از بررسی توسط منتورهای نوآفر، در این درگاه منتشر شده و به شبکه کنشگران معرفی می‌گردد (+۵۰ امتیاز نوآفری).
        </p>
      </div>

      {restored && (
        <div className="flex items-center justify-between p-3 bg-sky-50 text-sky-800 rounded-lg text-xs font-medium border border-sky-200 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-sky-600 shrink-0" />
            <span>پیش‌نویس ذخیره‌شده قبلی شما به طور خودکار بازیابی شد.</span>
          </div>
          <button
            type="button"
            onClick={clearDraft}
            className="text-pink-600 hover:underline font-bold"
          >
            پاک کردن پیش‌نویس
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="عنوان ایده *"
          placeholder="مثال: انبار اشتراکی ابزارآلات خانگی در مسجد محله..."
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          error={errors.title}
        />

        <Select
          label="حوزه موضوعی مسئله *"
          placeholder="انتخاب حوزه مسئله (از ۱۰ حوزه موضوعی)..."
          options={fieldOptions}
          value={formData.fieldSlug}
          onChange={(e) => handleChange('fieldSlug', e.target.value)}
          error={errors.fieldSlug}
        />

        <Textarea
          label="خلاصه کوتاه ایده (در ۲ الی ۳ جمله) *"
          placeholder="معضل چیست و راهکار نوآورانه شما چه تغییری در زندگی جامعه هدف ایجاد می‌کند؟"
          rows={2}
          value={formData.summary}
          onChange={(e) => handleChange('summary', e.target.value)}
          error={errors.summary}
          showCharCount
        />

        <RichTextEditor
          label="شرح کامل و جزئیات اجرایی ایده (ویرایشگر پیشرفته + امکان درج تصویر و طرح)"
          placeholder="نحوه اجرا، ذینفعان کلیدی، پایداری مالی، نیازمندی‌ها و دلایل نوآورانه بودن را تشریح فرمایید یا طرح‌های گرافیکی را درج کنید..."
          value={formData.body}
          onChange={(html) => handleChange('body', html)}
          error={errors.body}
          minHeight="240px"
          required
        />

        <ChipInput
          label="کلیدواژه‌ها و تگ‌های مرتبط"
          placeholder="تگ بنویسید و Enter بزنید (مثال: محله، اقتصاد_اشتراکی)..."
          tags={formData.tags}
          onChange={(tags) => handleChange('tags', tags)}
        />

        <FileUpload
          label="پیوست فایل تکمیلی یا طرح‌واره (اختیاری)"
          value={file}
          onChange={setFile}
        />

        <div className="pt-4 border-t border-ink-100 flex items-center justify-between">
          <span className="text-xs text-ink-400">
            با ثبت ایده، شما به مالکیت معنوی و اهداف عام‌المنفعه پایبند هستید.
          </span>
          <Button
            type="submit"
            variant="accent"
            size="lg"
            isLoading={isSubmitting}
            rightIcon={<Send className="w-4 h-4" />}
          >
            ارسال ایده برای داوری (+۵۰ امتیاز)
          </Button>
        </div>
      </form>

      <LoginPromptModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        title="ورود به حساب برای ثبت ایده"
        description="برای ارسال ایده و دریافت ۵۰ امتیاز نوآفری، لطفاً وارد حساب کاربری خود شوید."
      />
    </div>
  );
};
