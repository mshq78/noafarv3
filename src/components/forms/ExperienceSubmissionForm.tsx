import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Footprints, Send, RotateCcw, MapPin, TrendingUp } from 'lucide-react';
import { Input, Textarea, Select, ChipInput, FileUpload, Button, RichTextEditor } from '../ui';
import { JOURNEY_FIELDS } from '../../config/categories';
import { submitExperience, uploadSubmissionImage } from '../../services/endpoints';
import { ApiError } from '../../services/api';
import { JOURNEY_FIELDS as JOURNEY_FIELD_LIST } from '../../config/categories';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../ui/Toast';
import { useDraft } from '../../hooks/useDraft';
import { LoginPromptModal } from '../modals/LoginPromptModal';

interface ExperienceFormValues {
  title: string;
  fieldSlug: string;
  region: string;
  organization: string;
  keyImpactMetric: string;
  summary: string;
  body: string;
  tags: string[];
}

const defaultValues: ExperienceFormValues = {
  title: '',
  fieldSlug: '',
  region: '',
  organization: '',
  keyImpactMetric: '',
  summary: '',
  body: '',
  tags: [],
};

export const ExperienceSubmissionForm: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { initialData, restored, saveDraft, clearDraft } = useDraft<ExperienceFormValues>('experience', defaultValues);

  const [formData, setFormData] = useState<ExperienceFormValues>(initialData);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  React.useEffect(() => {
    if (restored) {
      setFormData(initialData);
    }
  }, [restored, initialData]);

  const handleChange = (key: keyof ExperienceFormValues, val: any) => {
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
      newErrors.title = 'عنوان تجربه باید حداقل ۵ نویسه باشد.';
    }
    if (!formData.fieldSlug) {
      newErrors.fieldSlug = 'لطفاً حوزه موضوعی را انتخاب کنید.';
    }
    if (!formData.region.trim()) {
      newErrors.region = 'لطفاً منطقه، استان یا شهر محل اجرا را مشخص نمایید.';
    }
    if (!formData.keyImpactMetric.trim()) {
      newErrors.keyImpactMetric = 'لطفاً مهم‌ترین سنجه دستاورد/اثر اجتماعی را ذکر کنید.';
    }
    if (!formData.summary.trim() || formData.summary.length < 10) {
      newErrors.summary = 'خلاصه تجربه باید حداقل ۱۰ نویسه باشد.';
    }
    if (!formData.body.trim() || formData.body.length < 40) {
      newErrors.body = 'شرح تفصیلی روایت باید حداقل ۴۰ نویسه باشد.';
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
      // The chosen image used to be collected and then thrown away; it is now
      // uploaded and attached to the submission.
      let heroImageUrl: string | undefined;
      if (file) {
        heroImageUrl = (await uploadSubmissionImage(file)).url;
      }

      await submitExperience({
        ...formData,
        heroImageUrl,
        fieldNameFa: JOURNEY_FIELD_LIST.find((f) => f.slug === formData.fieldSlug)?.nameFa,
      });
      clearDraft();
      showToast('روایت تجربه شما با موفقیت ثبت شد و ۱۰۰ امتیاز نوآفری دریافت کردید!', 'success');
      navigate('/profile');
    } catch (error) {
      showToast(
        error instanceof ApiError ? error.message : 'خطا در ثبت تجربه. لطفاً دوباره تلاش فرمایید.',
        'error',
      );
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
          <div className="p-2 bg-sky-50 text-sky-700 rounded-lg">
            <Footprints className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-black text-ink-900">
            ثبت روایت تجربه میدانی در درگاه تور نوآوری
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-ink-500 leading-relaxed">
          روایت تجارب موفق و شکست‌های آموزنده در اجرای طرح‌های بومی، الهام‌بخش صدها کنشگر دیگر در سراسر کشور خواهد بود (+۱۰۰ امتیاز نوآفری).
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
          label="عنوان طرح یا ابتکار عمل *"
          placeholder="مثال: احیای صنعت بومی قالی‌بافی با مدل تعاونی زنان روستایی..."
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          error={errors.title}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="حوزه موضوعی *"
            placeholder="انتخاب حوزه..."
            options={fieldOptions}
            value={formData.fieldSlug}
            onChange={(e) => handleChange('fieldSlug', e.target.value)}
            error={errors.fieldSlug}
          />

          <Input
            label="منطقه و موقعیت جغرافیایی *"
            placeholder="مثال: استان خراسان جنوبی، قائنات"
            value={formData.region}
            onChange={(e) => handleChange('region', e.target.value)}
            error={errors.region}
            startIcon={<MapPin className="w-4 h-4" />}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="نام تشکل / هسته جهادی / موسسه (اختیاری)"
            placeholder="مثال: کانون فرهنگی امام رضا (ع)"
            value={formData.organization}
            onChange={(e) => handleChange('organization', e.target.value)}
          />

          <Input
            label="مهم‌ترین سنجه اثر و دستاورد *"
            placeholder="مثال: اشتغال‌زایی مستقیم برای ۳۵ زن سرپرست خانوار"
            value={formData.keyImpactMetric}
            onChange={(e) => handleChange('keyImpactMetric', e.target.value)}
            error={errors.keyImpactMetric}
            startIcon={<TrendingUp className="w-4 h-4 text-amber-600" />}
          />
        </div>

        <Textarea
          label="خلاصه کوتاه روایت *"
          placeholder="شرح کوتاه نقطه شروع، چالش‌های اصلی و راهکار اجراشده..."
          rows={2}
          value={formData.summary}
          onChange={(e) => handleChange('summary', e.target.value)}
          error={errors.summary}
          showCharCount
        />

        <RichTextEditor
          label="شرح کامل تجربه، درس‌آموخته‌ها و شکست‌ها (ویرایشگر پیشرفته + آپلود تصویر)"
          placeholder="چگونه آغاز کردید؟ چه موانعی سر راه بود؟ چه تصمیماتی باعث پیشرفت شد؟ می‌توانید تصاویر میدانی را نیز مستقیماً داخل متن جایگذاری کنید..."
          value={formData.body}
          onChange={(html) => handleChange('body', html)}
          error={errors.body}
          minHeight="260px"
          required
        />

        <ChipInput
          label="کلیدواژه‌ها و تگ‌ها"
          placeholder="تگ بنویسید و Enter بزنید..."
          tags={formData.tags}
          onChange={(tags) => handleChange('tags', tags)}
        />

        <FileUpload
          label="تصاویر میدانی یا مستندات طرح (اختیاری)"
          value={file}
          onChange={setFile}
        />

        <div className="pt-4 border-t border-ink-100 flex items-center justify-between">
          <span className="text-xs text-ink-400">
            تجارب پس از راستی‌آزمایی و ویرایش نگارشی با نام شما منتشر خواهند شد.
          </span>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            rightIcon={<Send className="w-4 h-4" />}
          >
            ارسال روایت تجربه (+۱۰۰ امتیاز)
          </Button>
        </div>
      </form>

      <LoginPromptModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        title="ورود به حساب برای ثبت تجربه"
        description="برای ارسال روایت میدانی و دریافت ۱۰۰ امتیاز نوآفری، لطفاً وارد حساب کاربری خود شوید."
      />
    </div>
  );
};
