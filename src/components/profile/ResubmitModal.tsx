import React, { useState } from 'react';
import { RefreshCw, Send, AlertTriangle, ArrowRight } from 'lucide-react';
import { Submission } from '../../types';
import { Input, RichTextEditor, Button } from '../ui';
import { resubmitSubmission } from '../../services/endpoints';
import { useToast } from '../ui/Toast';

interface ResubmitModalProps {
  submission: Submission | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResubmitModal: React.FC<ResubmitModalProps> = ({
  submission,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [title, setTitle] = useState(submission?.title || '');
  const [body, setBody] = useState(
    'این بخش بر اساس بازخورد داوران ویرایش شده و راهکار پایداری مالی با مشارکت رانندگان محلی شفاف‌تر تشریح گردید.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (submission) {
      setTitle(submission.title);
    }
  }, [submission]);

  if (!submission || !isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await resubmitSubmission(submission.id, { title, body });
      showToast('مطلب شما با موفقیت بازنویسی و مجدداً ارسال گردید.', 'success');
      onSuccess();
      onClose();
    } catch {
      showToast('خطا در ارسال مجدد', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="bg-white border-b border-ink-200 sticky top-0 z-10 px-4 py-4 flex items-center shadow-sm">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-ink-50 text-ink-600 rounded-full transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-black text-ink-900">ویرایش و ارسال مجدد برای بازبینی</h2>
          </div>
          <Button
            type="button"
            variant="primary"
            isLoading={isSubmitting}
            onClick={handleSubmit}
            rightIcon={<Send className="w-4 h-4" />}
          >
            ارسال مجدد
          </Button>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto w-full px-4 py-8 pb-32">
        <div className="space-y-6">
          {/* Operator Message Callout */}
          {submission.operatorMessage && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-start shadow-2xs">
              <div className="flex items-center gap-1.5 text-amber-800 text-sm font-bold">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>پیام داور / اپراتور نوآفر:</span>
              </div>
              <p className="text-sm text-amber-900 leading-relaxed ps-6">
                {submission.operatorMessage}
              </p>
            </div>
          )}

          <form id="resubmit-form" onSubmit={handleSubmit} className="space-y-6 text-start">
            <Input
              label="عنوان اصلاح‌شده"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-bold"
            />

            <div className="space-y-2">
              <label className="text-sm font-bold text-ink-800">توضیحات و پاسخ به نکات داور</label>
              <RichTextEditor
                value={body}
                onChange={setBody}
                minHeight="300px"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
