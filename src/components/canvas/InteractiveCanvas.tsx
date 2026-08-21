import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Save, Share2, Download, Info, HelpCircle } from 'lucide-react';
import { Tool, SavedCanvas } from '../../types';
import { Button, IconButton } from '../ui';
import { useToast } from '../ui/Toast';
import { getCanvasForTool, saveToolCanvas } from '../../services/endpoints';
import { useAuth } from '../../hooks/useAuth';
import { LoginPromptModal } from '../modals/LoginPromptModal';
import { ShareModal } from '../modals/ShareModal';

interface InteractiveCanvasProps {
  tool: Tool;
  canvasData?: SavedCanvas;
}

/**
 * Every block on the board, in board order. Used for the exported file and to
 * make sure all eight boxes are persisted — previously only the first three
 * were bound to state, so boxes 4–8 were silently discarded on save.
 */
const CANVAS_BLOCKS = [
  { key: 'box-1', label: '۱. مسئله و چالش اصلی' },
  { key: 'box-2', label: '۲. بخش‌بندی ذینفعان' },
  { key: 'box-3', label: '۳. ارزش پیشنهادی منحصربه‌فرد' },
  { key: 'box-4', label: '۴. راه‌حل کلیدی' },
  { key: 'box-5', label: '۵. مسیرهای دسترسی و کانال‌ها' },
  { key: 'box-6', label: '۶. سنجه‌های موفقیت و اثر' },
  { key: 'box-7', label: '۷. ساختار هزینه‌ها' },
  { key: 'box-8', label: '۸. پایداری مالی و جریان درآمدی' },
] as const;

export const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({ tool, canvasData }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>(canvasData?.notes ?? {});
  const [savedAt, setSavedAt] = useState<string | null>(canvasData?.updatedAt ?? null);
  const isDirtyRef = useRef(false);

  // Reopening a tool restores the visitor's own saved board instead of
  // starting from a blank (previously: hard-coded sample) canvas.
  useEffect(() => {
    if (!isAuthenticated || canvasData) return;
    let cancelled = false;
    getCanvasForTool(tool.id)
      .then((existing) => {
        if (cancelled || !existing) return;
        setNotes(existing.notes ?? {});
        setSavedAt(existing.updatedAt);
      })
      .catch(() => {
        // Nothing saved yet, or the request failed: start from an empty board.
      });
    return () => {
      cancelled = true;
    };
  }, [tool.id, isAuthenticated, canvasData]);

  const setNote = (key: string, value: string) => {
    isDirtyRef.current = true;
    setNotes((prev) => ({ ...prev, [key]: value }));
  };

  const persist = useCallback(async () => {
    const saved = await saveToolCanvas(tool.id, notes, tool.title);
    isDirtyRef.current = false;
    setSavedAt(saved.updatedAt);
  }, [tool.id, tool.title, notes]);

  /**
   * The toolbar promises auto-save, so the board really does save itself:
   * edits are written back a moment after typing stops.
   */
  useEffect(() => {
    if (!isAuthenticated || !isDirtyRef.current) return;
    const timer = window.setTimeout(() => {
      persist().catch(() => {
        // Left dirty on failure; the explicit save button reports the error.
      });
    }, 1_500);
    return () => window.clearTimeout(timer);
  }, [notes, isAuthenticated, persist]);

  const handleSave = async () => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }

    setIsSaving(true);
    try {
      await persist();
      showToast('بوم شما در میز کار ذخیره شد.', 'success');
    } catch {
      showToast('خطا در ذخیره بوم. لطفاً دوباره تلاش کنید.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Produces a real file rather than only a success toast: the filled board is
   * serialised to text and handed to the browser as a download.
   */
  const handleExport = () => {
    const lines: string[] = [];
    CANVAS_BLOCKS.forEach((block) => {
      lines.push(block.label);
      lines.push((notes[block.key] ?? '').trim() || '—');
      lines.push('');
    });

    const blob = new Blob([`${tool.title}\n\n${lines.join('\n')}`], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tool.slug || 'noafar-canvas'}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Revoking immediately can abort the download in some browsers.
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    showToast('خروجی متنی بوم دریافت شد.', 'success');
  };

  return (
    <div className="flex flex-col h-screen bg-ink-100 overflow-hidden select-none">
      {/* Canvas Top Bar */}
      <div className="h-14 bg-white border-b border-ink-200 px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/toolbox/${tool.slug}`)}
            className="p-1.5 hover:bg-ink-100 rounded-md text-ink-600 hover:text-ink-900 transition-colors"
            aria-label="بازگشت به صفحه ابزار"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-ink-900 line-clamp-1">
              میز کار بوم: {tool.title}
            </h2>
            <span className="text-[11px] text-ink-400 font-sans">
              اتاق ابری نوآفر • {savedAt ? 'ذخیره خودکار' : 'ذخیره‌نشده'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <IconButton
            aria-label="راهنمای تکمیل"
            variant="ghost"
            onClick={() => setShowInstructions(!showInstructions)}
            className={showInstructions ? 'bg-sky-50 text-sky-700' : ''}
          >
            <HelpCircle className="w-5 h-5" />
          </IconButton>

          <IconButton
            aria-label="اشتراک‌گذاری"
            variant="secondary"
            onClick={() => setIsShareModalOpen(true)}
          >
            <Share2 className="w-4 h-4" />
          </IconButton>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleExport}
            rightIcon={<Download className="w-3.5 h-3.5" />}
          >
            خروجی PNG
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={handleSave}
            isLoading={isSaving}
            rightIcon={<Save className="w-3.5 h-3.5" />}
          >
            ذخیره در میز کار
          </Button>
        </div>
      </div>

      {/* Main Canvas Workspace + Instructions Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Visual Interactive Canvas Workspace */}
        <div className="flex-1 bg-white p-6 overflow-auto flex items-center justify-center relative">
          {/* Subtle Grid Background */}
          <div
            className="absolute inset-0 bg-[radial-gradient(#d5d7e0_1px,transparent_1px)] [background-size:20px_20px] opacity-60 pointer-events-none"
          />

          {/* Canvas Board Template Container */}
          <div className="w-full max-w-5xl bg-white border-2 border-ink-300 rounded-xl shadow-lg p-6 relative z-10 space-y-6">
            <div className="flex items-center justify-between border-b-2 border-ink-200 pb-3">
              <div>
                <h3 className="text-lg font-black text-ink-900">{tool.title}</h3>
                <p className="text-xs text-ink-500">{tool.summary}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 bg-pink-50 text-pink-700 border border-pink-200 rounded-md font-bold">
                  نسخه تعاملی نوآفر
                </span>
              </div>
            </div>

            {/* Canvas Blocks (e.g. 9-box Lean Canvas layout) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Box 1: مسئله */}
              <div className="p-4 bg-sky-50/50 border border-sky-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-900">۱. مسئله و چالش اصلی</span>
                  <span className="text-[10px] text-sky-600">۳ درد اصلی جامعه</span>
                </div>
                <textarea
                  value={notes['box-1'] || ''}
                  onChange={(e) => setNote('box-1', e.target.value)}
                  placeholder="مهم‌ترین درد یا کمبود جامعه هدف چیست؟"
                  className="w-full h-28 p-2.5 bg-white border border-sky-200 rounded-md text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-sky-300 resize-none leading-relaxed"
                />
              </div>

              {/* Box 2: جامعه هدف */}
              <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900">۲. بخش‌بندی ذینفعان</span>
                  <span className="text-[10px] text-amber-700">مشتریان و مددجویان</span>
                </div>
                <textarea
                  value={notes['box-2'] || ''}
                  onChange={(e) => setNote('box-2', e.target.value)}
                  placeholder="این خدمت دقیقاً برای چه کسانی طراحی می‌شود؟"
                  className="w-full h-28 p-2.5 bg-white border border-amber-200 rounded-md text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none leading-relaxed"
                />
              </div>

              {/* Box 3: ارزش پیشنهادی */}
              <div className="p-4 bg-pink-50/50 border border-pink-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-pink-900">۳. ارزش پیشنهادی منحصربه‌فرد</span>
                  <span className="text-[10px] text-pink-600">پیام شفاف</span>
                </div>
                <textarea
                  value={notes['box-3'] || ''}
                  onChange={(e) => setNote('box-3', e.target.value)}
                  placeholder="چرا راه‌حل شما متمایز و متناسب با فرهنگ بومی است؟"
                  className="w-full h-28 p-2.5 bg-white border border-pink-200 rounded-md text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none leading-relaxed"
                />
              </div>

              {/* Box 4: راه‌حل */}
              <div className="p-4 bg-ink-50 border border-ink-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink-900">۴. راه‌حل کلیدی</span>
                  <span className="text-[10px] text-ink-500">۳ ویژگی اصلی</span>
                </div>
                <textarea
                  value={notes['box-4'] || ''}
                  onChange={(e) => setNote('box-4', e.target.value)}
                  placeholder="محصول یا خدمت شما چگونه مسئله را حل می‌کند؟"
                  className="w-full h-24 p-2.5 bg-white border border-ink-200 rounded-md text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-300 resize-none leading-relaxed"
                />
              </div>

              {/* Box 5: کانال‌های ارتباطی */}
              <div className="p-4 bg-ink-50 border border-ink-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink-900">۵. مسیرهای دسترسی و کانال‌ها</span>
                  <span className="text-[10px] text-ink-500">نحوه رساندن پیام</span>
                </div>
                <textarea
                  value={notes['box-5'] || ''}
                  onChange={(e) => setNote('box-5', e.target.value)}
                  placeholder="مسجد، فضای مجازی، مراجعات حضوری و ..."
                  className="w-full h-24 p-2.5 bg-white border border-ink-200 rounded-md text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-300 resize-none leading-relaxed"
                />
              </div>

              {/* Box 6: سنجه‌های کلیدی (SROI) */}
              <div className="p-4 bg-ink-50 border border-ink-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink-900">۶. سنجه‌های موفقیت و اثر</span>
                  <span className="text-[10px] text-ink-500">شاخص‌های ارزیابی</span>
                </div>
                <textarea
                  value={notes['box-6'] || ''}
                  onChange={(e) => setNote('box-6', e.target.value)}
                  placeholder="چگونه متوجه شویم تغییر پایدار اتفاق افتاده است؟"
                  className="w-full h-24 p-2.5 bg-white border border-ink-200 rounded-md text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-300 resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Bottom 2 Wide Boxes: جریان درآمدی / ساختار هزینه‌ها */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-ink-200">
              <div className="p-4 bg-ink-50/80 border border-ink-200 rounded-lg space-y-1.5">
                <span className="text-xs font-bold text-ink-900">۷. ساختار هزینه‌ها</span>
                <textarea
                  value={notes['box-7'] || ''}
                  onChange={(e) => setNote('box-7', e.target.value)}
                  placeholder="هزینه‌های ثابت و متغیر، دستمزد تسهیلگران و ..."
                  className="w-full h-20 p-2.5 bg-white border border-ink-200 rounded-md text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-300 resize-none leading-relaxed"
                />
              </div>

              <div className="p-4 bg-ink-50/80 border border-ink-200 rounded-lg space-y-1.5">
                <span className="text-xs font-bold text-ink-900">۸. پایداری مالی و جریان درآمدی</span>
                <textarea
                  value={notes['box-8'] || ''}
                  onChange={(e) => setNote('box-8', e.target.value)}
                  placeholder="فروش محصولات، حق عضویت، حمایت‌های مردمی و وقف..."
                  className="w-full h-20 p-2.5 bg-white border border-ink-200 rounded-md text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-300 resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Step-by-Step Instructions Sidebar */}
        {showInstructions && (
          <aside className="w-80 bg-white border-s border-ink-200 p-5 overflow-y-auto shrink-0 space-y-4">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-sky-600" />
                <h4 className="text-sm font-bold text-ink-900">راهنمای گام‌به‌گام</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowInstructions(false)}
                className="text-xs text-ink-400 hover:text-ink-700"
              >
                بستن
              </button>
            </div>

            <div className="space-y-4 text-xs text-ink-600 leading-relaxed">
              <div className="space-y-1">
                <span className="font-bold text-ink-900 block">گام اول: تمرکز بر یک مسئله مشخص</span>
                <p>از پرداختن به چند معضل به صورت همزمان بپرهیزید. یک چالش شفاف و محلی را انتخاب نمایید.</p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-ink-900 block">گام دوم: همدلی عمیق با جامعه هدف</span>
                <p>برای چه کسی ارزش خلق می‌کنید؟ با حداقل ۵ نفر از افراد گفتگو کنید و فرضیات را با واقعیت محک بزنید.</p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-ink-900 block">گام سوم: بازنگری و اشتراک با تیم</span>
                <p>پس از تکمیل، روی گزینه «ذخیره در میز کار» کلیک کرده و با هم‌تیمی‌های خود به اشتراک بگذارید.</p>
              </div>
            </div>
          </aside>
        )}
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={`بوم تعاملی: ${tool.title}`}
      />

      <LoginPromptModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        title="ورود برای ذخیره بوم"
        description="برای ذخیره بوم در میز کار خود و دریافت امتیاز، لطفاً وارد حساب کاربری شوید."
      />
    </div>
  );
};
