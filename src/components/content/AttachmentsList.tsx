import React from 'react';
import { Download, FileText, FileSpreadsheet, Paperclip } from 'lucide-react';
import { MediaAsset } from '../../types';
import { formatFileSize } from '../../utils/format';

interface AttachmentsListProps {
  attachments: MediaAsset[];
  title?: string;
}

export const AttachmentsList: React.FC<AttachmentsListProps> = ({
  attachments,
  title = 'فایل‌ها و کاربرگ‌های ضمیمه',
}) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="p-5 bg-ink-50 rounded-xl border border-ink-200 space-y-3">
      <div className="flex items-center gap-2">
        <Paperclip className="w-4 h-4 text-sky-600" />
        <h4 className="text-sm font-bold text-ink-900">{title}</h4>
      </div>

      <div className="space-y-2">
        {attachments.map((att) => (
          <a
            key={att.id}
            href={att.url}
            download={att.fileName || 'download'}
            className="flex items-center justify-between p-3 bg-white rounded-lg border border-ink-200 hover:border-sky-300 hover:shadow-xs transition-all group"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2 bg-sky-50 text-sky-600 rounded-md shrink-0">
                {att.type === 'pdf' ? (
                  <FileText className="w-4 h-4" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4" />
                )}
              </div>
              <div className="overflow-hidden text-start">
                <p className="text-xs font-bold text-ink-900 truncate group-hover:text-sky-700">
                  {att.fileName || 'فایل ضمیمه'}
                </p>
                {att.fileSizeBytes && (
                  <p className="text-[11px] text-ink-400 font-sans">
                    {formatFileSize(att.fileSizeBytes)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-sky-600 group-hover:text-sky-700 shrink-0 pe-1">
              <span>دریافت فایل</span>
              <Download className="w-3.5 h-3.5" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
