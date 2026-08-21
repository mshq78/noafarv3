import React, { useState, useEffect } from 'react';
import { getSiteSettings, updateSiteSettings } from '../../services/endpoints';
import { SiteSettings } from '../../types';
import { Button, Input, RichTextEditor, FileUpload } from '../ui';
import { useToast } from '../ui/Toast';

export const SiteSettingsManager: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    getSiteSettings().then(data => {
      setSettings(data);
      setIsLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSaving(true);
    try {
      await updateSiteSettings(settings);
      showToast('تنظیمات سایت با موفقیت ذخیره شد.', 'success');
      // For immediate effect across the site without react context for now:
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      showToast('خطا در ذخیره تنظیمات.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) return <div className="p-8 text-center text-ink-500 text-sm">در حال بارگذاری تنظیمات...</div>;

  return (
    <div className="bg-white p-6 rounded-xl border border-ink-200 shadow-2xs space-y-6">
      <div>
        <h3 className="text-xl font-black text-ink-900">تنظیمات پایه و محتوای ثابت سامانه</h3>
        <p className="text-sm text-ink-500 mt-1">از این بخش می‌توانید محتواهای استاتیک مثل هدر، فوتر، درباره ما و اطلاعات تماس را مدیریت کنید.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Branding & Logo */}
        <div className="space-y-4">
          <h4 className="text-base font-bold text-sky-800 border-b border-sky-100 pb-2">هویت بصری و برندینگ</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-ink-800">لوگوی سایت</label>
              <FileUpload
                value={settings.logoUrl}
                onChange={(file) => {
                  if (!file) {
                    setSettings({...settings, logoUrl: ""});
                    return;
                  }
                  if (typeof file === "string") {
                    setSettings({...settings, logoUrl: file});
                  } else {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      setSettings({...settings, logoUrl: evt.target?.result});
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                accept="image/*"
                maxSizeMB={2}
                label="آپلود لوگوی جدید"
              />
              {settings.logoUrl && (
                <div className="mt-2 p-4 bg-ink-50 rounded-lg flex items-center justify-center border border-ink-100">
                  <img src={settings.logoUrl} alt="Logo" className="max-h-16 object-contain" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hero Banner Section */}
        <div className="space-y-4">
          <h4 className="text-base font-bold text-sky-800 border-b border-sky-100 pb-2">متون صفحه اصلی (Hero)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="عنوان اصلی سایت" 
              value={settings.heroTitle || ''} 
              onChange={e => setSettings({...settings, heroTitle: e.target.value})} 
            />
            <Input 
              label="زیرعنوان (شعار)" 
              value={settings.heroSubtitle || ''} 
              onChange={e => setSettings({...settings, heroSubtitle: e.target.value})} 
            />
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <h4 className="text-base font-bold text-sky-800 border-b border-sky-100 pb-2">اطلاعات تماس</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input 
              label="شماره تماس" 
              value={settings.contactPhone || ''} 
              onChange={e => setSettings({...settings, contactPhone: e.target.value})} 
              dir="ltr"
            />
            <Input 
              label="ایمیل" 
              value={settings.contactEmail || ''} 
              onChange={e => setSettings({...settings, contactEmail: e.target.value})} 
              dir="ltr"
            />
            <Input 
              label="آدرس پستی" 
              value={settings.contactAddress || ''} 
              onChange={e => setSettings({...settings, contactAddress: e.target.value})} 
            />
          </div>
        </div>

        {/* Footer Info */}
        <div className="space-y-4">
          <h4 className="text-base font-bold text-sky-800 border-b border-sky-100 pb-2">پاورقی (فوتر)</h4>
          <div className="space-y-4">
            <Input 
              label="توضیحات کوتاه فوتر" 
              value={settings.footerDescription || ''} 
              onChange={e => setSettings({...settings, footerDescription: e.target.value})} 
            />
            <Input 
              label="متن کپی‌رایت" 
              value={settings.footerCopyright || ''} 
              onChange={e => setSettings({...settings, footerCopyright: e.target.value})} 
            />
          </div>
        </div>

        {/* About Page */}
        <div className="space-y-4">
          <h4 className="text-base font-bold text-sky-800 border-b border-sky-100 pb-2">صفحه درباره ما</h4>
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink-800">متن تفصیلی درباره نوآفر</label>
            <RichTextEditor 
              value={settings.aboutText || ''} 
              onChange={val => setSettings({...settings, aboutText: val})} 
            />
          </div>
        </div>

        <div className="pt-4 border-t border-ink-100 flex justify-end">
          <Button type="submit" variant="primary" size="lg" isLoading={isSaving}>
            ذخیره و اعمال تنظیمات
          </Button>
        </div>
      </form>
    </div>
  );
};
