import React, { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';
import { Modal, Button } from '../ui';
import { useToast } from '../ui/Toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  title,
  url = typeof window !== 'undefined' ? window.location.href : '',
}) => {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    showToast('پیوند با موفقیت در حافظه کپی شد', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="اشتراک‌گذاری مطلب" maxWidth="sm">
      <div className="space-y-4 py-1">
        <p className="text-xs text-ink-600 line-clamp-2 leading-relaxed">
          {title}
        </p>

        <div className="flex items-center gap-2 p-2 bg-ink-50 border border-ink-200 rounded-lg">
          <input
            type="text"
            readOnly
            value={url}
            className="w-full bg-transparent text-xs text-ink-800 font-mono focus:outline-none truncate text-left"
            dir="ltr"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="p-2 bg-white border border-ink-200 rounded-md text-ink-700 hover:text-sky-600 hover:border-sky-300 transition-colors shrink-0 cursor-pointer"
            aria-label="کپی لینک"
          >
            {copied ? (
              <Check className="w-4 h-4 text-sky-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2">
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 bg-ink-50 hover:bg-sky-50 text-ink-700 hover:text-sky-700 border border-ink-200 rounded-lg text-xs font-medium text-center transition-colors block"
          >
            تلگرام
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 bg-ink-50 hover:bg-sky-50 text-ink-700 hover:text-sky-700 border border-ink-200 rounded-lg text-xs font-medium text-center transition-colors block"
          >
            واتس‌اپ
          </a>
          <a
            href={`https://eitaa.com/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 bg-ink-50 hover:bg-sky-50 text-ink-700 hover:text-sky-700 border border-ink-200 rounded-lg text-xs font-medium text-center transition-colors block"
          >
            ایتا
          </a>
        </div>

        <Button variant="secondary" onClick={onClose} className="w-full mt-2">
          بستن
        </Button>
      </div>
    </Modal>
  );
};
