import React, { useState } from 'react';
import { RefreshCw, Send, AlertTriangle } from 'lucide-react';
import { Submission } from '../../types';
import { Modal, Input, Textarea, Button } from '../ui';
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

  if (!submission) return null;

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ویرایش و ارسال مجدد برای بازبینی"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Operator Message Callout */}
        {submission.operatorMessage && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg space-y-1 text-start">
            <div className="flex items-center gap-1.5 text-amber-800 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>پیام داور / اپراتور نوآفر:</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed ps-5">
              {submission.operatorMessage}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-start">
          <Input
            label="عنوان اصلاح‌شده"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Textarea
            label="توضیحات و پاسخ به نکات داور"
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-ink-100">
            <Button variant="ghost" onClick={onClose}>
              انصراف
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              rightIcon={<Send className="w-4 h-4" />}
            >
              ارسال مجدد
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
