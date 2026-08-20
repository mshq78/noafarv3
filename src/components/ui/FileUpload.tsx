import React, { useRef, useState } from 'react';
import { UploadCloud, File, X, Check } from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatFileSize } from '../../utils/format';

interface FileUploadProps {
  label?: string;
  accept?: string;
  maxSizeBytes?: number;
  value?: File | string | null;
  onChange: (file: File | null) => void;
  error?: string;
  helperText?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  accept = 'image/*,.pdf,.doc,.docx',
  value,
  onChange,
  error,
  helperText = 'فرمت‌های مجاز: تصاویر، PDF یا اسناد Word (حداکثر ۱۰ مگابایت)',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    onChange(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full space-y-1.5 text-start">
      {label && (
        <label className="block text-sm font-medium text-ink-900 select-none">
          {label}
        </label>
      )}

      {value ? (
        <div className="flex items-center justify-between p-3.5 bg-ink-50 border border-ink-200 rounded-lg">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-md shrink-0">
              <File className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-ink-900 truncate">
                {value instanceof File ? value.name : 'فایل بارگذاری شده'}
              </p>
              {value instanceof File && (
                <p className="text-xs text-ink-500">
                  {formatFileSize(value.size)}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="p-1.5 text-ink-400 hover:text-pink-600 rounded-md hover:bg-pink-50 transition-colors"
            aria-label="حذف فایل"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed border-ink-200 rounded-lg p-6 text-center cursor-pointer transition-all',
            'hover:border-sky-600 hover:bg-sky-50/50 flex flex-col items-center justify-center gap-2',
            isDragging ? 'border-sky-600 bg-sky-50' : 'bg-white',
            error ? 'border-pink-600' : ''
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />
          <div className="p-3 bg-ink-50 text-ink-500 rounded-full">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-ink-900">
              کلیک برای انتخاب فایل یا کشیدن و رها کردن در این بخش
            </p>
            <p className="text-xs text-ink-400">{helperText}</p>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-pink-600 font-medium">{error}</p>}
    </div>
  );
};
