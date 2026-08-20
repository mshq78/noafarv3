import { useState, useEffect } from 'react';

export function useDraft<T>(draftKey: 'idea' | 'experience', defaultValues: T) {
  const storageKey = `noafar:draft:${draftKey}`;
  const [restored, setRestored] = useState(false);
  const [initialData, setInitialData] = useState<T>(defaultValues);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setInitialData({ ...defaultValues, ...parsed });
          setRestored(true);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, [storageKey]);

  const saveDraft = (data: Partial<T>) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      // Ignore quota errors
    }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(storageKey);
      setRestored(false);
    } catch {
      // Ignore
    }
  };

  return {
    initialData,
    restored,
    saveDraft,
    clearDraft,
  };
}
