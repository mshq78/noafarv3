import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed bottom-6 start-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                role="status"
                className={cn(
                  'pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-lg shadow-lg border text-sm font-medium transition-all',
                  'animate-in slide-in-from-bottom-5 fade-in duration-200',
                  toast.type === 'success' && 'bg-white text-ink-900 border-sky-300 shadow-sky-900/5',
                  toast.type === 'error' && 'bg-white text-ink-900 border-pink-300 shadow-pink-900/5',
                  toast.type === 'info' && 'bg-white text-ink-900 border-ink-200 shadow-ink-900/5'
                )}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {toast.type === 'success' && (
                    <CheckCircle2 className="w-5 h-5 text-sky-600 shrink-0" />
                  )}
                  {toast.type === 'error' && (
                    <AlertCircle className="w-5 h-5 text-pink-600 shrink-0" />
                  )}
                  {toast.type === 'info' && (
                    <Info className="w-5 h-5 text-ink-500 shrink-0" />
                  )}
                  <p className="truncate text-ink-800">{toast.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="text-ink-400 hover:text-ink-700 p-1 rounded transition-colors"
                  aria-label="بستن اعلان"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
