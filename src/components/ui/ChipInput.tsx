import React, { useState, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ChipInputProps {
  label?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  error?: string;
  helperText?: string;
}

export const ChipInput: React.FC<ChipInputProps> = ({
  label,
  tags = [],
  onChange,
  placeholder = 'تگ جدید را بنویسید و Enter یا ویرگول بزنید...',
  maxTags = 8,
  error,
  helperText,
}) => {
  const [inputValue, setInputValue] = useState('');

  const addTag = (tagText: string) => {
    const trimmed = tagText.trim().replace(/^#/, '');
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      setInputValue('');
      return;
    }
    if (tags.length >= maxTags) return;

    onChange([...tags, trimmed]);
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="w-full space-y-1.5 text-start">
      {label && (
        <label className="block text-sm font-medium text-ink-900 select-none">
          {label}
        </label>
      )}
      <div
        className={cn(
          'min-h-[44px] p-2 bg-white border border-ink-200 rounded-md flex flex-wrap items-center gap-1.5 focus-within:border-sky-600 focus-within:ring-2 focus-within:ring-sky-100 transition-colors',
          error ? 'border-pink-600' : ''
        )}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-ink-100 text-ink-900 text-xs rounded-full border border-ink-200 font-medium select-none"
          >
            <span>#{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="p-0.5 hover:bg-ink-200 rounded-full text-ink-500 hover:text-ink-900"
              aria-label={`حذف تگ ${tag}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {tags.length < maxTags && (
          <div className="flex-1 flex items-center min-w-[140px]">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => inputValue && addTag(inputValue)}
              placeholder={tags.length === 0 ? placeholder : 'تگ دیگر...'}
              className="w-full text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none bg-transparent py-1 px-1"
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => addTag(inputValue)}
                className="p-1 text-sky-600 hover:bg-sky-50 rounded"
                aria-label="افزودن تگ"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
      {error ? (
        <p className="text-xs text-pink-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-ink-500">{helperText}</p>
      ) : null}
    </div>
  );
};
