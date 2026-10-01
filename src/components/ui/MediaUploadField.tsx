import React, { useEffect, useRef, useState } from 'react';
import { UploadCloud, FileText, X, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatFileSize } from '../../utils/format';
import { uploadMedia, uploadErrorMessage } from '../../services/endpoints';
import type { MediaAsset } from '../../types';

export interface MediaUploadFieldProps {
  label?: string;
  /** What the field takes. Decides the type check, the preview and the wording. */
  kind: 'image' | 'pdf';
  /** The stored file, or null when there is none. */
  value: Pick<MediaAsset, 'url' | 'fileName' | 'fileSizeBytes'> | null;
  /** Called with the uploaded asset, or null when the file is removed. */
  onChange: (asset: MediaAsset | null) => void;
  helperText?: string;
  disabled?: boolean;
  className?: string;
  /** Lets the form refuse to save while a file is still on its way up. */
  onBusyChange?: (busy: boolean) => void;
}

const COPY = {
  image: {
    accept: 'image/*',
    prompt: 'کلیک برای انتخاب تصویر یا کشیدن و رها کردن در این بخش',
    wrongType: 'لطفاً یک فایل تصویری معتبر انتخاب کنید.',
    busy: 'در حال بارگذاری تصویر…',
  },
  pdf: {
    accept: 'application/pdf,.pdf',
    prompt: 'کلیک برای انتخاب فایل PDF یا کشیدن و رها کردن در این بخش',
    wrongType: 'لطفاً فقط فایل PDF انتخاب کنید.',
    busy: 'در حال بارگذاری فایل…',
  },
} as const;

function matchesKind(file: File, kind: 'image' | 'pdf'): boolean {
  if (kind === 'image') return file.type.startsWith('image/');
  // Some systems hand over an empty type for a PDF, so the extension counts too.
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

/**
 * A file field that uploads on selection and holds the resulting URL.
 *
 * It exists because the form's image field used to read the picture into a
 * base64 string and put that in the request body — which a serverless host
 * rejects above ~4.5 MB and the API above 1 MB — and because an upload with no
 * visible progress and no visible failure looks exactly like a button that
 * does nothing. Here the wait and every failure are always on screen, and the
 * stored value is a short URL.
 */
export const MediaUploadField: React.FC<MediaUploadFieldProps> = ({
  label,
  kind,
  value,
  onChange,
  helperText,
  disabled = false,
  className,
  onBusyChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const copy = COPY[kind];

  // Closing the form mid-upload unmounts this field before `finally` can run.
  useEffect(() => () => onBusyChange?.(false), []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFile = async (file: File) => {
    if (!matchesKind(file, kind)) {
      setError(copy.wrongType);
      return;
    }
    setError('');
    setIsUploading(true);
    onBusyChange?.(true);
    try {
      onChange(await uploadMedia(file));
    } catch (uploadError) {
      // uploadMedia has already logged the raw error; this is the sentence.
      setError(uploadErrorMessage(uploadError));
    } finally {
      setIsUploading(false);
      onBusyChange?.(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const pick = () => {
    if (!disabled && !isUploading) inputRef.current?.click();
  };

  return (
    <div className={cn('w-full space-y-1.5 text-start', className)}>
      {label && <label className="block text-sm font-medium text-ink-900 select-none">{label}</label>}

      <input
        ref={inputRef}
        type="file"
        accept={copy.accept}
        className="hidden"
        disabled={disabled || isUploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      {isUploading ? (
        <div
          role="status"
          className="flex items-center gap-3 p-3.5 bg-sky-50 border border-sky-200 rounded-lg text-sm text-sky-800"
        >
          <Loader2 className="w-5 h-5 animate-spin shrink-0" />
          <span>{copy.busy}</span>
        </div>
      ) : value ? (
        <div className="flex items-center justify-between gap-3 p-3 bg-ink-50 border border-ink-200 rounded-lg">
          <div className="flex items-center gap-3 overflow-hidden">
            {kind === 'image' ? (
              <img
                src={value.url}
                alt=""
                className="w-14 h-14 rounded-md object-cover bg-ink-100 shrink-0"
              />
            ) : (
              <div className="p-2.5 bg-pink-50 text-pink-600 rounded-md shrink-0">
                <FileText className="w-5 h-5" />
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-ink-900 truncate" dir="auto">
                {value.fileName || (kind === 'pdf' ? 'فایل PDF بارگذاری‌شده' : 'تصویر بارگذاری‌شده')}
              </p>
              {value.fileSizeBytes ? (
                <p className="text-xs text-ink-500">{formatFileSize(value.fileSizeBytes)}</p>
              ) : null}
              <a
                href={value.url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-xs text-sky-700 hover:underline"
              >
                مشاهده <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          {!disabled && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={pick}
                className="p-1.5 text-ink-500 hover:text-sky-700 rounded-md hover:bg-sky-50 transition-colors"
                aria-label="تعویض فایل"
                title="تعویض فایل"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  onChange(null);
                }}
                className="p-1.5 text-ink-400 hover:text-pink-600 rounded-md hover:bg-pink-50 transition-colors"
                aria-label="حذف فایل"
                title="حذف فایل"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={pick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              pick();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file && !disabled) void handleFile(file);
          }}
          className={cn(
            'border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all',
            'flex flex-col items-center justify-center gap-2 hover:border-sky-600 hover:bg-sky-50/50',
            isDragging ? 'border-sky-600 bg-sky-50' : 'border-ink-200 bg-white',
            error && 'border-pink-600',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        >
          <div className="p-3 bg-ink-50 text-ink-500 rounded-full">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-ink-900">{copy.prompt}</p>
          {helperText && <p className="text-xs text-ink-400">{helperText}</p>}
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-pink-600 font-medium break-words">
          {error}
        </p>
      )}
    </div>
  );
};
