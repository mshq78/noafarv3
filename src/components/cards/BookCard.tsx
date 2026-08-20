import React from 'react';
import { Link } from 'react-router-dom';
import { Book as BookIcon, FileText, Headphones, Video, User } from 'lucide-react';
import { Book, LibraryKind } from '../../types';
import { Chip } from '../ui';
import { toFaDigits } from '../../utils/format';

interface BookCardProps {
  book: Book;
}

export const BookCard: React.FC<BookCardProps> = ({ book }) => {
  const kindConfigs: Record<LibraryKind, { label: string; icon: React.ReactNode; color: 'sky' | 'pink' | 'amber' | 'ink' }> = {
    book: { label: 'کتاب', icon: <BookIcon className="w-3.5 h-3.5" />, color: 'sky' },
    booklet: { label: 'کتابچه کاربردی', icon: <BookIcon className="w-3.5 h-3.5" />, color: 'sky' },
    reading: { label: 'خواندنی منتخب', icon: <FileText className="w-3.5 h-3.5" />, color: 'ink' },
    article: { label: 'مقاله پژوهشی', icon: <FileText className="w-3.5 h-3.5" />, color: 'ink' },
    podcast: { label: 'پادکست صوتی', icon: <Headphones className="w-3.5 h-3.5" />, color: 'pink' },
    video: { label: 'فیلم مستند', icon: <Video className="w-3.5 h-3.5" />, color: 'amber' },
  };

  const kindConfig = kindConfigs[book.kind] || kindConfigs.book;

  return (
    <div className="group flex flex-col bg-white rounded-xl border border-ink-200 overflow-hidden shadow-xs hover:shadow-md hover:border-amber-300 transition-all duration-200">
      {/* Cover */}
      <Link
        to={`/library/${book.slug}`}
        className="relative aspect-[3/4] bg-ink-100 overflow-hidden block flex items-center justify-center"
      >
        <img
          src={book.heroImage?.url || '/mock/book-cover.svg'}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-2.5 start-2.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-white/95 backdrop-blur-xs text-ink-800 shadow-2xs">
            {kindConfig.icon}
            <span>{kindConfig.label}</span>
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <Link to={`/library/${book.slug}`}>
            <h3 className="text-sm font-bold text-ink-900 line-clamp-2 group-hover:text-amber-700 transition-colors leading-snug">
              {book.title}
            </h3>
          </Link>

          {/* Authors */}
          {book.authors && book.authors.length > 0 && (
            <p className="text-xs text-ink-600 flex items-center gap-1">
              <User className="w-3 h-3 text-ink-400 shrink-0" />
              <span className="truncate">{book.authors.join('، ')}</span>
            </p>
          )}

          {book.translators && book.translators.length > 0 && (
            <p className="text-[11px] text-ink-400 truncate">
              ترجمه: {book.translators.join('، ')}
            </p>
          )}
        </div>

        {/* Publication info */}
        <div className="flex items-center justify-between pt-2 border-t border-ink-100 text-xs text-ink-400 font-sans">
          <span className="truncate max-w-[120px]">{book.publisher || 'منبع تخصصی'}</span>
          {book.publishedYear && <span>سال {toFaDigits(book.publishedYear)}</span>}
        </div>
      </div>
    </div>
  );
};
