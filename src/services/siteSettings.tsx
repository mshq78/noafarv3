import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { SiteSettings } from '../types';
import { getSiteSettings } from './endpoints';

/**
 * Site-wide editable copy (hero, footer, contact details).
 *
 * Fetched once for the whole app rather than per component, and refreshable so
 * saving in the admin panel updates the live page without a full reload.
 */
const DEFAULT_SETTINGS: SiteSettings = {
  heroTitle: 'مدرسه کنشگری نوآفر',
  heroSubtitle: 'بستری برای یادگیری، تجربه و خلق ارزش‌های اجتماعی',
  aboutText:
    '<p>نوآفر یک اکوسیستم باز و مشارکتی برای یادگیری روش‌های نوین حل مسائل اجتماعی، ابزارهای طراحی کسب‌وکار اجتماعی و شبکه‌سازی میان کنشگران، محققان و سازمان‌های مردم‌نهاد است.</p>',
  contactEmail: 'info@noafar.ir',
  contactPhone: '۰۲۱-۱۲۳۴۵۶۷۸',
  contactAddress: 'تهران، میدان انقلاب، پلاک ۱',
  footerDescription: 'اولین پلتفرم جامع آموزش و توانمندسازی کنشگران اجتماعی',
  footerCopyright: 'تمام حقوق برای پلتفرم نوآفر محفوظ است.',
};

interface SiteSettingsContextValue {
  settings: SiteSettings;
  refresh: () => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  refresh: async () => {},
});

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  const refresh = useCallback(async () => {
    try {
      const data = await getSiteSettings();
      // Merge over the defaults so an unset field never renders as blank.
      if (data) setSettings((prev) => ({ ...prev, ...data }));
    } catch {
      // Keep the defaults; the site stays readable if settings are unreachable.
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(() => ({ settings, refresh }), [settings, refresh]);
  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
};

/** Read-only access to the current site settings. */
export function useSiteSettings(): SiteSettings {
  return useContext(SiteSettingsContext).settings;
}

/** Refetches settings — call after saving them in the admin panel. */
export function useRefreshSiteSettings(): () => Promise<void> {
  return useContext(SiteSettingsContext).refresh;
}
