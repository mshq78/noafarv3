import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';
import { Button } from '../components/ui';
import { NoafarMark } from '../components/brand/NoafarMark';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-white px-4 py-16">
      <div className="max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 bg-ink-50 rounded-2xl border border-ink-200">
            <NoafarMark size={50} />
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-4xl font-black text-sky-700 font-sans block">۴۰۴</span>
          <h1 className="text-xl font-bold text-ink-900">
            صفحه مورد نظر شما پیدا نشد
          </h1>
          <p className="text-xs text-ink-500 leading-relaxed">
            نشانی واردشده ممکن است تغییر کرده باشد یا موقتاً در دسترس نباشد.
          </p>
        </div>

        <div className="pt-2 flex justify-center gap-3">
          <Link to="/">
            <Button variant="primary" rightIcon={<Home className="w-4 h-4" />}>
              بازگشت به صفحه اصلی
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
