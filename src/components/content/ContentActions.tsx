import React, { useState } from 'react';
import { Heart, Bookmark, Share2 } from 'lucide-react';
import { ContentBase } from '../../types';
import { useInteractions } from '../../hooks/useInteractions';
import { LoginPromptModal } from '../modals/LoginPromptModal';
import { ShareModal } from '../modals/ShareModal';
import { toFaDigits } from '../../utils/format';
import { cn } from '../../utils/cn';

interface ContentActionsProps {
  content: ContentBase;
  className?: string;
}

export const ContentActions: React.FC<ContentActionsProps> = ({ content: initialContent, className }) => {
  const {
    isLiked,
    likeCount,
    isBookmarked,
    toggleLike,
    toggleBookmark,
    isLoginModalOpen,
    setIsLoginModalOpen,
  } = useInteractions(initialContent);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: initialContent.title,
          text: initialContent.summary,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback to modal if share aborted or denied
      }
    }
    setIsShareModalOpen(true);
  };

  return (
    <>
      <div className={cn('flex items-center gap-2', className)}>
        {/* Like Button */}
        <button
          type="button"
          onClick={toggleLike}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all select-none cursor-pointer',
            isLiked
              ? 'bg-pink-50 border-pink-300 text-pink-700 shadow-2xs'
              : 'bg-white border-ink-200 text-ink-600 hover:border-pink-200 hover:text-pink-600'
          )}
          aria-label={isLiked ? 'پسندیده شده' : 'پسندیدن'}
        >
          <Heart
            className={cn(
              'w-4 h-4 transition-transform',
              isLiked ? 'fill-pink-600 text-pink-600 scale-110' : ''
            )}
          />
          <span className="font-sans">{toFaDigits(likeCount)}</span>
        </button>

        {/* Bookmark Button */}
        <button
          type="button"
          onClick={toggleBookmark}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all select-none cursor-pointer',
            isBookmarked
              ? 'bg-sky-50 border-sky-300 text-sky-700 shadow-2xs'
              : 'bg-white border-ink-200 text-ink-600 hover:border-sky-200 hover:text-sky-600'
          )}
          aria-label={isBookmarked ? 'نشان شده' : 'افزودن به نشان‌ها'}
        >
          <Bookmark
            className={cn(
              'w-4 h-4 transition-transform',
              isBookmarked ? 'fill-sky-600 text-sky-600' : ''
            )}
          />
          <span>{isBookmarked ? 'نشان شده' : 'نشان'}</span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ink-200 bg-white text-ink-600 hover:text-ink-900 hover:border-ink-300 text-xs font-bold transition-all select-none cursor-pointer"
          aria-label="اشتراک‌گذاری"
        >
          <Share2 className="w-4 h-4" />
          <span>اشتراک</span>
        </button>
      </div>

      <LoginPromptModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={initialContent.title}
      />
    </>
  );
};
