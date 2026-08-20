import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Sparkles } from 'lucide-react';
import { Modal, Button } from '../ui';
import { TricolorRule } from '../brand/TricolorRule';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export const LoginPromptModal: React.FC<LoginPromptModalProps> = ({
  isOpen,
  onClose,
  title = 'برای این اقدام ابتدا وارد شوید',
  description = 'برای لایک کردن، ذخیره در نشان‌ها، ثبت نظر یا ارسال ایده و تجربه، نیاز به عضویت در نوآفر دارید.',
}) => {
  const navigate = useNavigate();

  const handleGoToLogin = () => {
    onClose();
    const returnTo = window.location.pathname + window.location.search;
    navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="text-center space-y-4 py-2">
        <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
          <Sparkles className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-ink-900">{title}</h3>
          <p className="text-xs text-ink-500 leading-relaxed max-w-xs mx-auto">
            {description}
          </p>
        </div>

        <TricolorRule />

        <div className="flex flex-col gap-2 pt-2">
          <Button
            variant="primary"
            onClick={handleGoToLogin}
            className="w-full"
            rightIcon={<LogIn className="w-4 h-4" />}
          >
            ورود با شماره موبایل (سریع و آسان)
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full text-xs text-ink-500">
            شاید بعداً
          </Button>
        </div>
      </div>
    </Modal>
  );
};
