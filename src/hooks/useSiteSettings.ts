import { useState, useEffect } from 'react';
import { getSiteSettings } from '../services/endpoints';
import { SiteSettings } from '../types';

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>({
    heroTitle: "مدرسه کنشگری نوآفر",
    heroSubtitle: "بستری برای یادگیری، تجربه و خلق ارزش‌های اجتماعی",
    aboutText: "نوآفر، پلتفرمی تخصصی برای توانمندسازی کنشگران اجتماعی است.",
    contactEmail: "info@noafar.ir",
    contactPhone: "۰۲۱-۱۲۳۴۵۶۷۸",
    contactAddress: "تهران، میدان انقلاب، پلاک ۱",
    footerDescription: "اولین پلتفرم جامع آموزش و توانمندسازی کنشگران اجتماعی",
    footerCopyright: "تمام حقوق برای پلتفرم نوآفر محفوظ است.",
  });

  useEffect(() => {
    getSiteSettings().then(data => {
      if (data) {
        setSettings(prev => ({ ...prev, ...data }));
      }
    }).catch(console.error);
  }, []);

  return settings;
};
