import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Upload,
  AlignRight,
  AlignCenter,
  AlignLeft,
  AlignJustify,
  Minus,
  Undo,
  Redo,
  Eye,
  Code2,
  Sparkles,
  Maximize2,
  Minimize2,
  HelpCircle,
  X,
  Plus,
  Check,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';
import { toFaDigits } from '../../utils/format';
import { SafeHtml } from './SafeHtml';
import { uploadMedia } from '../../services/endpoints';

export interface RichTextEditorProps {
  label?: string;
  value: string;
  onChange: (htmlValue: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  allowImageUpload?: boolean;
  required?: boolean;
  className?: string;
}

// Curated high quality social innovation stock photos for quick insertion
const SOCIAL_INNOVATION_STOCK_IMAGES = [
  {
    title: 'کارگاه تفکر طراحی و ایده پردازی',
    url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80',
    category: 'آموزش و کارگاه',
  },
  {
    title: 'جلسه هم‌افزایی جامعه محلی و نوآوران',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
    category: 'مشارکت و تعاون',
  },
  {
    title: 'صنایع دستی و توانمندسازی معیشت پایدار',
    url: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=800&auto=format&fit=crop&q=80',
    category: 'اشتغال و معیشت',
  },
  {
    title: 'کاشت نهال و احیای محیط‌زیست بومی',
    url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80',
    category: 'محیط‌زیست',
  },
  {
    title: 'کلاس درس و آموزش کودکان در مناطق محروم',
    url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=80',
    category: 'تعلیم و تربیت',
  },
  {
    title: 'برنامه‌ریزی استراتژیک روی بوم مدل کسب‌وکار',
    url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
    category: 'ابزارها و بوم‌ها',
  },
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  label,
  value,
  onChange,
  placeholder = 'متن خود را اینجا تایپ کنید یا از جعبه‌ابزار بالا استفاده نمایید...',
  minHeight = '220px',
  maxHeight = '500px',
  error,
  helperText,
  disabled = false,
  allowImageUpload = true,
  required = false,
  className,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'html' | 'preview'>('visual');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageCaptionInput, setImageCaptionInput] = useState('');
  const [linkUrlInput, setLinkUrlInput] = useState('');
  const [linkTextInput, setLinkTextInput] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [activeTabInImageModal, setActiveTabInImageModal] = useState<'upload' | 'url' | 'stock'>('upload');

  // Internal state tracking
  const [internalHtml, setInternalHtml] = useState(value || '');
  /**
   * The last HTML this component wrote out. The editable surface is an
   * uncontrolled DOM node: React must never re-render its children, or the
   * browser rebuilds the node on every keystroke and the caret snaps back to
   * the start — which typed text out in reverse.
   */
  const lastEmittedHtml = useRef(value || '');

  // Seed the editor once, on mount.
  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = value || '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Adopt an external change to `value` (a draft restored, a form reset), but
   * never echo back the HTML this editor just emitted.
   */
  useEffect(() => {
    const incoming = value || '';
    if (incoming === lastEmittedHtml.current) return;
    lastEmittedHtml.current = incoming;
    setInternalHtml(incoming);
    if (editorRef.current && editorRef.current.innerHTML !== incoming) {
      editorRef.current.innerHTML = incoming;
    }
  }, [value]);

  // Returning to the visual tab re-mounts the editable node, so repaint it.
  useEffect(() => {
    if (viewMode !== 'visual' || !editorRef.current) return;
    if (editorRef.current.innerHTML !== internalHtml) {
      editorRef.current.innerHTML = internalHtml;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  // Execute standard document command
  const execCommand = useCallback((command: string, arg?: string) => {
    if (disabled || viewMode !== 'visual') return;
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    handleEditorInput();
  }, [disabled, viewMode]);

  // Handle content changes
  const handleEditorInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    lastEmittedHtml.current = html;
    setInternalHtml(html);
    onChange(html);
  };

  /**
   * Uploads the image and inserts the returned URL. Data URLs are only used as
   * a fallback for small files (a visitor writing a comment has no upload
   * rights), so a picture never bloats the stored document by megabytes.
   */
  const INLINE_IMAGE_LIMIT = 400 * 1024;

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('لطفاً یک فایل تصویری معتبر انتخاب کنید.');
      return;
    }

    setUploadError('');
    setIsUploadingImage(true);
    try {
      const asset = await uploadMedia(file);
      insertImageToEditor(asset.url, file.name);
      setIsImageModalOpen(false);
      return;
    } catch {
      // Falls through to the inline fallback below.
    } finally {
      setIsUploadingImage(false);
    }

    if (file.size > INLINE_IMAGE_LIMIT) {
      setUploadError('حجم تصویر بیش از حد مجاز است. لطفاً تصویر کوچک‌تری انتخاب کنید.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      insertImageToEditor(String(e.target?.result ?? ''), file.name);
      setIsImageModalOpen(false);
    };
    reader.onerror = () => setUploadError('خواندن فایل تصویر ناموفق بود.');
    reader.readAsDataURL(file);
  };

  /** Escapes text before it is spliced into an HTML string. */
  const escapeHtml = (input: string): string =>
    input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  /** Only http(s), site-relative and inline image URLs may be inserted. */
  const safeUrl = (input: string, allowData = false): string => {
    const value = input.trim();
    if (!value) return '';
    if (value.startsWith('/') && !value.startsWith('//')) return value;
    if (allowData && /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(value)) return value;
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : '';
    } catch {
      return '';
    }
  };

  // Direct insert HTML for images
  const insertImageToEditor = (src: string, altText?: string) => {
    const url = safeUrl(src, true);
    if (!url) {
      setUploadError('نشانی تصویر معتبر نیست.');
      return;
    }

    editorRef.current?.focus();
    const caption = escapeHtml(altText || imageCaptionInput || 'تصویر محتوا');
    const imageHtml = `
      <figure class="my-4 text-center select-none inline-block max-w-full">
        <img src="${escapeHtml(url)}" alt="${caption}" class="rounded-xl shadow-md max-h-[380px] w-auto mx-auto object-cover border border-slate-200" />
        ${caption ? `<figcaption class="text-xs text-slate-500 mt-1.5 font-medium">${caption}</figcaption>` : ''}
      </figure>
      <p><br></p>
    `;
    document.execCommand('insertHTML', false, imageHtml);
    handleEditorInput();
    setImageUrlInput('');
    setImageCaptionInput('');
    setUploadError('');
  };

  // Insert Link
  const handleInsertLink = (e: React.FormEvent) => {
    e.preventDefault();
    const url = safeUrl(linkUrlInput);
    if (!url) {
      setUploadError('نشانی پیوند باید با http:// یا https:// شروع شود.');
      return;
    }

    editorRef.current?.focus();
    const text = escapeHtml(linkTextInput.trim() || url);
    const linkHtml = `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer nofollow" class="text-sky-600 font-bold underline hover:text-sky-800">${text}</a>`;
    document.execCommand('insertHTML', false, linkHtml);
    handleEditorInput();
    setLinkUrlInput('');
    setLinkTextInput('');
    setUploadError('');
    setIsLinkModalOpen(false);
  };

  // Drag & drop file support directly on editor container
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && allowImageUpload) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (disabled || !allowImageUpload) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      void handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Paste handler to allow pasting images directly from clipboard
  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled || !allowImageUpload) return;
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          void handleFileUpload(file);
          break;
        }
      }
    }
  };

  // Calculate metrics
  const cleanText = (internalHtml || '').replace(/<[^>]*>?/gm, '').trim();
  const wordCount = cleanText ? cleanText.split(/\s+/).length : 0;
  const charCount = cleanText.length;

  return (
    <div
      className={cn(
        'w-full space-y-1.5 text-start transition-all',
        isFullscreen && 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-4 sm:p-8 flex flex-col justify-center items-center',
        className
      )}
    >
      {label && !isFullscreen && (
        <div className="flex items-center justify-between">
          <label className="block text-xs sm:text-sm font-bold text-ink-900 select-none">
            {label} {required && <span className="text-rose-600">*</span>}
          </label>
          <span className="text-[11px] text-ink-400 font-sans">
            {toFaDigits(wordCount)} کلمه | {toFaDigits(charCount)} نویسه
          </span>
        </div>
      )}

      {/* Editor Main Card */}
      <div
        className={cn(
          'w-full bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col',
          error ? 'border-rose-400 ring-2 ring-rose-100' : 'border-ink-200 shadow-2xs hover:border-sky-300',
          disabled && 'opacity-60 bg-ink-50 pointer-events-none',
          isFullscreen && 'h-[92vh] max-w-5xl shadow-2xl border-ink-300'
        )}
      >
        {/* Top Control Bar / Toolbar */}
        <div className="bg-ink-50/80 border-b border-ink-200/90 p-2 flex flex-wrap items-center justify-between gap-1 select-none">
          {/* Main Formatting Actions */}
          <div className="flex flex-wrap items-center gap-0.5">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-ink-200/60 p-0.5 rounded-lg me-1.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setViewMode('visual')}
                className={cn(
                  'px-2 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1',
                  viewMode === 'visual' ? 'bg-white text-sky-800 shadow-xs' : 'text-ink-600 hover:text-ink-900'
                )}
                title="ویرایشگر بصری (WYSIWYG)"
              >
                <span>بصری</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('html')}
                className={cn(
                  'px-2 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1',
                  viewMode === 'html' ? 'bg-white text-sky-800 shadow-xs' : 'text-ink-600 hover:text-ink-900'
                )}
                title="کد HTML خام"
              >
                <Code2 className="w-3 h-3" />
                <span>HTML</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={cn(
                  'px-2 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1',
                  viewMode === 'preview' ? 'bg-white text-sky-800 shadow-xs' : 'text-ink-600 hover:text-ink-900'
                )}
                title="پیش‌نمایش نهایی"
              >
                <Eye className="w-3 h-3" />
                <span>پیش‌نمایش</span>
              </button>
            </div>

            {viewMode === 'visual' && (
              <>
                <div className="h-4 w-px bg-ink-200 mx-1" />

                {/* Headings */}
                <button
                  type="button"
                  onClick={() => execCommand('formatBlock', '<h1>')}
                  className="p-1.5 text-ink-700 hover:bg-ink-200 hover:text-sky-800 rounded-lg transition-colors cursor-pointer"
                  title="تیتر بزرگ (H1)"
                >
                  <Heading1 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => execCommand('formatBlock', '<h2>')}
                  className="p-1.5 text-ink-700 hover:bg-ink-200 hover:text-sky-800 rounded-lg transition-colors cursor-pointer"
                  title="سرتیتر متوسط (H2)"
                >
                  <Heading2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => execCommand('formatBlock', '<h3>')}
                  className="p-1.5 text-ink-700 hover:bg-ink-200 hover:text-sky-800 rounded-lg transition-colors cursor-pointer"
                  title="تیتر فرعی (H3)"
                >
                  <Heading3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => execCommand('formatBlock', '<p>')}
                  className="px-1.5 py-1 text-xs font-bold text-ink-700 hover:bg-ink-200 hover:text-sky-800 rounded-lg transition-colors cursor-pointer"
                  title="متن پاراگراف عادی"
                >
                  P
                </button>

                <div className="h-4 w-px bg-ink-200 mx-1" />

                {/* Inline Styles */}
                <button
                  type="button"
                  onClick={() => execCommand('bold')}
                  className="p-1.5 text-ink-700 hover:bg-ink-200 hover:text-sky-800 rounded-lg transition-colors cursor-pointer"
                  title="پررنگ (Bold - Ctrl+B)"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => execCommand('italic')}
                  className="p-1.5 text-ink-700 hover:bg-ink-200 hover:text-sky-800 rounded-lg transition-colors cursor-pointer"
                  title="ایتالیک / مورب (Ctrl+I)"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => execCommand('underline')}
                  className="p-1.5 text-ink-700 hover:bg-ink-200 hover:text-sky-800 rounded-lg transition-colors cursor-pointer"
                  title="زیرخط (Ctrl+U)"
                >
                  <Underline className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => execCommand('strikeThrough')}
                  className="p-1.5 text-ink-700 hover:bg-ink-200 hover:text-sky-800 rounded-lg transition-colors cursor-pointer"
                  title="خط خورده"
                >
                  <Strikethrough className="w-4 h-4" />
                </button>

                <div className="h-4 w-px bg-ink-200 mx-1" />

                {/* Lists & Quotes */}
                <button
                  type="button"
                  onClick={() => execCommand('insertUnorderedList')}
                  className="p-1.5 text-ink-700 hover:bg-ink-200 hover:text-sky-800 rounded-lg transition-colors cursor-pointer"
                  title="لیست نشانه‌دار (گلوله‌ای)"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => execCommand('insertOrderedList')}
                  className="p-1.5 text-ink-700 hover:bg-ink-200 hover:text-sky-800 rounded-lg transition-colors cursor-pointer"
                  title="لیست شماره‌دار عددی"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => execCommand('formatBlock', '<blockquote>')}
                  className="p-1.5 text-ink-700 hover:bg-ink-200 hover:text-sky-800 rounded-lg transition-colors cursor-pointer"
                  title="نقل‌قول و برجسته‌سازی (Quote)"
                >
                  <Quote className="w-4 h-4" />
                </button>

                <div className="h-4 w-px bg-ink-200 mx-1" />

                {/* Alignments */}
                <button
                  type="button"
                  onClick={() => execCommand('justifyRight')}
                  className="p-1.5 text-ink-700 hover:bg-ink-200 hover:text-sky-800 rounded-lg transition-colors cursor-pointer"
                  title="راست‌چین"
                >
                  <AlignRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => execCommand('justifyCenter')}
                  className="p-1.5 text-ink-700 hover:bg-ink-200 hover:text-sky-800 rounded-lg transition-colors cursor-pointer"
                  title="وسط‌چین"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => execCommand('justifyLeft')}
                  className="p-1.5 text-ink-700 hover:bg-ink-200 hover:text-sky-800 rounded-lg transition-colors cursor-pointer"
                  title="چپ‌چین"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => execCommand('justifyFull')}
                  className="p-1.5 text-ink-700 hover:bg-ink-200 hover:text-sky-800 rounded-lg transition-colors cursor-pointer"
                  title="هم‌تراز (Justify)"
                >
                  <AlignJustify className="w-4 h-4" />
                </button>

                <div className="h-4 w-px bg-ink-200 mx-1" />

                {/* Links */}
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(true)}
                  className="p-1.5 text-ink-700 hover:bg-ink-200 hover:text-sky-800 rounded-lg transition-colors cursor-pointer"
                  title="درج پیوند / لینک اینترنتی"
                >
                  <LinkIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => execCommand('unlink')}
                  className="p-1.5 text-ink-700 hover:bg-ink-200 hover:text-sky-800 rounded-lg transition-colors cursor-pointer"
                  title="حذف پیوند"
                >
                  <Unlink className="w-4 h-4" />
                </button>

                {/* Media & Images Upload */}
                {allowImageUpload && (
                  <button
                    type="button"
                    onClick={() => setIsImageModalOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-900 border border-sky-200/80 rounded-lg transition-all font-bold text-xs cursor-pointer shadow-2xs"
                    title="بارگذاری و درج تصویر از دستگاه یا آدرس اینترنتی"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>درج تصویر</span>
                  </button>
                )}

                {/* Divider Line */}
                <button
                  type="button"
                  onClick={() => execCommand('insertHorizontalRule')}
                  className="p-1.5 text-ink-700 hover:bg-ink-200 hover:text-sky-800 rounded-lg transition-colors cursor-pointer"
                  title="خط جداکننده افقی"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Undo / Redo / Fullscreen */}
          <div className="flex items-center gap-1">
            {viewMode === 'visual' && (
              <>
                <button
                  type="button"
                  onClick={() => execCommand('undo')}
                  className="p-1.5 text-ink-600 hover:bg-ink-200 hover:text-ink-900 rounded-lg transition-colors cursor-pointer"
                  title="واگرد (Undo)"
                >
                  <Undo className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => execCommand('redo')}
                  className="p-1.5 text-ink-600 hover:bg-ink-200 hover:text-ink-900 rounded-lg transition-colors cursor-pointer"
                  title="از نو (Redo)"
                >
                  <Redo className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-ink-600 hover:bg-ink-200 hover:text-ink-900 rounded-lg transition-colors cursor-pointer"
              title={isFullscreen ? 'خروج از حالت تمام‌صفحه' : 'ویرایش تمام‌صفحه'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Editor Body Area */}
        <div
          className={cn(
            'relative flex-1 overflow-y-auto p-4 transition-colors',
            isDraggingOver && 'bg-sky-50/70 ring-2 ring-inset ring-sky-400'
          )}
          style={{ minHeight, maxHeight: isFullscreen ? '100%' : maxHeight }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Drag Overlay Notice */}
          {isDraggingOver && (
            <div className="absolute inset-0 bg-sky-50/90 backdrop-blur-xs flex flex-col items-center justify-center pointer-events-none z-20 gap-2 text-sky-800">
              <Upload className="w-10 h-10 animate-bounce text-sky-600" />
              <span className="font-bold text-sm">تصویر را برای بارگذاری و درج در متن رها کنید</span>
            </div>
          )}

          {/* Visual WYSIWYG Editable Canvas */}
          {viewMode === 'visual' && (
            <div
              ref={editorRef}
              contentEditable={!disabled}
              onInput={handleEditorInput}
              onBlur={handleEditorInput}
              onPaste={handlePaste}
              // Content is written imperatively (see the effects above) so React
              // never re-renders this node while the user is typing in it.
              suppressContentEditableWarning
              className="outline-none min-h-[160px] text-ink-900 text-sm leading-relaxed prose prose-sm max-w-none focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-ink-300 empty:before:pointer-events-none"
              data-placeholder={placeholder}
              dir="auto"
            />
          )}

          {/* Raw HTML Code Mode */}
          {viewMode === 'html' && (
            <textarea
              value={internalHtml}
              onChange={(e) => {
                lastEmittedHtml.current = e.target.value;
                setInternalHtml(e.target.value);
                onChange(e.target.value);
              }}
              dir="ltr"
              className="w-full h-full min-h-[180px] p-2 bg-ink-900 text-emerald-300 font-mono text-xs rounded-xl focus:outline-none resize-none"
              placeholder="<!-- کدهای HTML خود را اینجا بنویسید -->"
            />
          )}

          {/* Live Preview Mode */}
          {viewMode === 'preview' && (
            <div className="p-2">
              <div className="text-[11px] font-bold text-ink-400 mb-2 border-b border-ink-100 pb-1">
                پیش‌نمایش رندر شده در سایت:
              </div>
              {internalHtml ? (
                <SafeHtml
                  className="prose prose-sm max-w-none text-ink-900 text-sm leading-relaxed"
                  html={internalHtml}
                />
              ) : (
                <p className="text-ink-400 italic text-sm">متنی برای نمایش وجود ندارد.</p>
              )}
            </div>
          )}
        </div>

        {/* Bottom Status & Quick Image Drag hint */}
        <div className="px-3 py-2 bg-ink-50/60 border-t border-ink-100 text-[11px] text-ink-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>پشتیبانی کامل از بارگذاری تصویر، کشیدن و رها کردن (Drag & Drop) و کپی/پیست تصاویر</span>
          </div>
          <div className="flex items-center gap-3 font-sans">
            <span>{toFaDigits(wordCount)} کلمه</span>
            <span>{toFaDigits(charCount)} نویسه</span>
          </div>
        </div>
      </div>

      {helperText && !error && <p className="text-xs text-ink-500">{helperText}</p>}
      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

      {/* ================================================================= */}
      {/* MODAL: IMAGE UPLOADER & STOCK SELECTOR                            */}
      {/* ================================================================= */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-ink-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-start">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-50 text-sky-700 rounded-xl">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-ink-900">بارگذاری و درج تصویر در متن</h3>
                  <p className="text-[11px] text-ink-500">انتخاب از سیستم، نشانی اینترنتی یا تصاویر آماده نوآوری اجتماعی</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="p-1 text-ink-400 hover:text-ink-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Selector */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-ink-100/80 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTabInImageModal('upload')}
                className={cn(
                  'py-2 px-2 rounded-lg text-center transition-all cursor-pointer',
                  activeTabInImageModal === 'upload' ? 'bg-white text-sky-800 shadow-xs' : 'text-ink-600 hover:text-ink-900'
                )}
              >
                آپلود از کامپیوتر
              </button>
              <button
                type="button"
                onClick={() => setActiveTabInImageModal('url')}
                className={cn(
                  'py-2 px-2 rounded-lg text-center transition-all cursor-pointer',
                  activeTabInImageModal === 'url' ? 'bg-white text-sky-800 shadow-xs' : 'text-ink-600 hover:text-ink-900'
                )}
              >
                لینک اینترنتی
              </button>
              <button
                type="button"
                onClick={() => setActiveTabInImageModal('stock')}
                className={cn(
                  'py-2 px-2 rounded-lg text-center transition-all cursor-pointer',
                  activeTabInImageModal === 'stock' ? 'bg-white text-sky-800 shadow-xs' : 'text-ink-600 hover:text-ink-900'
                )}
              >
                گالری آماده نوآوری
              </button>
            </div>

            {/* TAB 1: UPLOAD FROM DEVICE */}
            {activeTabInImageModal === 'upload' && (
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      void handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
                <div
                  onClick={() => {
                    if (!isUploadingImage) fileInputRef.current?.click();
                  }}
                  className={cn(
                    'border-2 border-dashed border-sky-300 bg-sky-50/40 p-8 rounded-2xl text-center transition-all flex flex-col items-center justify-center gap-3',
                    isUploadingImage
                      ? 'opacity-60 cursor-wait'
                      : 'hover:border-sky-500 hover:bg-sky-50 cursor-pointer',
                  )}
                >
                  <div className="w-14 h-14 bg-sky-100 text-sky-700 rounded-2xl flex items-center justify-center shadow-xs">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-ink-900 block">
                      {isUploadingImage ? 'در حال بارگذاری تصویر…' : 'کلیک کنید یا فایل تصویر را اینجا بکشید'}
                    </span>
                    <span className="text-xs text-ink-400 mt-1 block">فرمت‌های JPG، PNG، WEBP و GIF</span>
                  </div>
                </div>

                {uploadError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                    {uploadError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink-800">توضیح یا زیرنویس تصویر (اختیاری):</label>
                  <input
                    type="text"
                    value={imageCaptionInput}
                    onChange={(e) => setImageCaptionInput(e.target.value)}
                    placeholder="مثال: عکس یادگاری شرکت‌کنندگان در کارگاه"
                    className="w-full h-9 px-3 border border-ink-200 rounded-xl text-xs text-ink-900 focus:outline-none focus:border-sky-600"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: IMAGE URL */}
            {activeTabInImageModal === 'url' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink-800">نشانی اینترنتی تصویر (Image URL):</label>
                  <input
                    type="url"
                    dir="ltr"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full h-9 px-3 border border-ink-200 rounded-xl text-xs text-ink-900 focus:outline-none focus:border-sky-600 font-sans"
                  />
                  {uploadError && (
                    <p className="text-[11px] text-rose-600 pt-1">{uploadError}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink-800">توضیح یا زیرنویس تصویر:</label>
                  <input
                    type="text"
                    value={imageCaptionInput}
                    onChange={(e) => setImageCaptionInput(e.target.value)}
                    placeholder="توضیح مختصر..."
                    className="w-full h-9 px-3 border border-ink-200 rounded-xl text-xs text-ink-900 focus:outline-none focus:border-sky-600"
                  />
                </div>

                {imageUrlInput && (
                  <div className="p-2 border border-ink-200 rounded-xl bg-ink-50 text-center">
                    <img
                      src={imageUrlInput}
                      alt="پیش‌نمایش"
                      className="max-h-36 mx-auto rounded-lg object-cover"
                      onError={() => {}}
                    />
                  </div>
                )}

                <Button
                  type="button"
                  variant="primary"
                  className="w-full"
                  disabled={!imageUrlInput.trim()}
                  onClick={() => {
                    insertImageToEditor(imageUrlInput, imageCaptionInput);
                    setIsImageModalOpen(false);
                  }}
                  rightIcon={<Check className="w-4 h-4" />}
                >
                  درج تصویر در متن
                </Button>
              </div>
            )}

            {/* TAB 3: STOCK SOCIAL INNOVATION PHOTOS */}
            {activeTabInImageModal === 'stock' && (
              <div className="space-y-3">
                <span className="text-xs text-ink-500 block">
                  یک تصویر با کیفیت و موضوعی را با یک کلیک انتخاب نمایید:
                </span>
                <div className="grid grid-cols-2 gap-2.5 max-h-64 overflow-y-auto p-1 custom-scrollbar">
                  {SOCIAL_INNOVATION_STOCK_IMAGES.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        insertImageToEditor(img.url, img.title);
                        setIsImageModalOpen(false);
                      }}
                      className="group relative rounded-xl overflow-hidden border border-ink-200 hover:border-sky-500 cursor-pointer shadow-2xs hover:shadow-md transition-all aspect-4/3"
                    >
                      <img src={img.url} alt={img.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2 flex flex-col justify-end text-white">
                        <span className="text-[10px] px-1.5 py-0.5 bg-sky-600/90 rounded text-white self-start font-medium mb-1">
                          {img.category}
                        </span>
                        <span className="text-xs font-bold leading-tight line-clamp-2">{img.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: INSERT LINK                                                */}
      {/* ================================================================= */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleInsertLink}
            className="bg-white border border-ink-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-start"
          >
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-50 text-sky-700 rounded-xl">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-ink-900">درج پیوند (Link)</h3>
                  <p className="text-[11px] text-ink-500">افزودن لینک به صفحات داخلی یا وب‌سایت‌های دیگر</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="p-1 text-ink-400 hover:text-ink-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-ink-800">نشانی اینترنتی (URL):</label>
              <input
                type="url"
                required
                dir="ltr"
                value={linkUrlInput}
                onChange={(e) => setLinkUrlInput(e.target.value)}
                placeholder="https://example.com یا /toolbox/canvas-guide"
                className="w-full h-9 px-3 border border-ink-200 rounded-xl text-xs text-ink-900 focus:outline-none focus:border-sky-600 font-sans"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-ink-800">متن نمایشی پیوند:</label>
              <input
                type="text"
                value={linkTextInput}
                onChange={(e) => setLinkTextInput(e.target.value)}
                placeholder="مثال: مشاهده راهنمای بوم"
                className="w-full h-9 px-3 border border-ink-200 rounded-xl text-xs text-ink-900 focus:outline-none focus:border-sky-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-ink-100">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsLinkModalOpen(false)}>
                انصراف
              </Button>
              <Button type="submit" variant="primary" size="sm" rightIcon={<Plus className="w-3.5 h-3.5" />}>
                درج پیوند
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
