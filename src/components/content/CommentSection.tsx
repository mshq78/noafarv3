import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, User, Clock } from 'lucide-react';
import { Comment } from '../../types';
import { getComments, postComment } from '../../services/endpoints';
import { useAuth } from '../../hooks/useAuth';
import { Button, RichTextEditor } from '../ui';
import { SafeHtml } from '../ui/SafeHtml';
import { LoginPromptModal } from '../modals/LoginPromptModal';
import { useToast } from '../ui/Toast';
import { formatTimeAgo } from '../../utils/date';
import { toFaDigits } from '../../utils/format';

interface CommentSectionProps {
  contentId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ contentId }) => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getComments(contentId).then((res) => {
      if (isMounted) {
        setComments(res.items);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [contentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }

    if (!newComment.trim() || newComment.trim() === '<p><br></p>') return;

    setIsSubmitting(true);
    try {
      const added = await postComment(contentId, newComment.trim());
      setComments((prev) => [added, ...prev]);
      setNewComment('');
      showToast('دیدگاه شما با موفقیت ثبت شد و پس از بررسی منتشر خواهد شد.', 'success');
    } catch {
      showToast('خطا در ثبت دیدگاه. لطفاً دوباره تلاش کنید.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pt-8 border-t border-ink-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-sky-600" />
          <h3 className="text-lg font-bold text-ink-900">
            دیدگاه‌ها و گفتگوها ({toFaDigits(comments.length)})
          </h3>
        </div>
      </div>

      {/* Post comment box */}
      <form onSubmit={handleSubmit} className="p-4 bg-ink-50 rounded-xl border border-ink-200 space-y-3">
        {isAuthenticated ? (
          <RichTextEditor
            placeholder="نظر، پرسش یا تجربه خود را درباره این موضوع بنویسید..."
            value={newComment}
            onChange={setNewComment}
            minHeight="140px"
            disabled={isSubmitting}
          />
        ) : (
          <div 
            onClick={() => setIsLoginModalOpen(true)}
            className="w-full min-h-[140px] bg-white border border-ink-200 rounded-2xl flex items-center justify-center cursor-pointer hover:border-sky-300 transition-colors"
          >
            <span className="text-sm text-ink-400">برای ثبت دیدگاه ابتدا وارد حساب کاربری خود شوید...</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-ink-400">
            دیدگاه‌ها پس از بازبینی تیم نوآفر نمایش داده خواهند شد.
          </span>
          <Button
            type="submit"
            size="sm"
            variant="primary"
            isLoading={isSubmitting}
            disabled={!newComment.trim() || newComment.trim() === '<p><br></p>'}
            rightIcon={<Send className="w-3.5 h-3.5" />}
          >
            ارسال دیدگاه
          </Button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-ink-500 py-6 text-center">
            هنوز دیدگاهی ثبت نشده است. شما اولین نفر باشید!
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="p-4 bg-white rounded-lg border border-ink-200 space-y-2 text-start"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-ink-100 text-ink-600 flex items-center justify-center font-bold text-xs">
                    {comment.author && typeof comment.author !== 'string' && comment.author.avatarUrl ? (
                      <img
                        src={comment.author.avatarUrl}
                        alt={typeof comment.author === 'string' ? comment.author : comment.author.displayName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink-900">
                      {comment.author
                        ? typeof comment.author === 'string'
                          ? comment.author
                          : comment.author.displayName || 'کاربر نوآفر'
                        : 'کاربر نوآفر'}
                    </p>
                    <p className="text-[11px] text-ink-400 flex items-center gap-1 font-sans">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeAgo(comment.createdAt)}</span>
                    </p>
                  </div>
                </div>

                {comment.status === 'pending' && (
                  <span className="text-[11px] px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-medium">
                    در انتظار بررسی
                  </span>
                )}
              </div>

              <SafeHtml
                className="text-sm text-ink-700 leading-relaxed ps-10 rich-content"
                html={comment.body}
              />
            </div>
          ))
        )}
      </div>

      <LoginPromptModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        title="ورود برای ثبت دیدگاه"
        description="برای شرکت در گفتگوها و ارسال نظر، لطفاً وارد حساب کاربری خود شوید."
      />
    </div>
  );
};
