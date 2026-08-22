import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Catches render-time crashes so a single broken component shows a recovery
 * card instead of leaving the visitor on a blank white page.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('[noafar] خطای غیرمنتظره در رابط کاربری:', error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-center">
        <div className="max-w-md space-y-4">
          <h2 className="text-xl font-black text-ink-900">مشکلی در نمایش این صفحه پیش آمد</h2>
          <p className="text-xs text-ink-500 leading-relaxed">
            لطفاً صفحه را دوباره بارگذاری کنید. اگر مشکل ادامه داشت، از طریق صفحه ارتباط با ما
            به دبیرخانه نوآفر اطلاع دهید.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            بارگذاری دوباره صفحه
          </button>
        </div>
      </div>
    );
  }
}
