import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

interface AccordionItem {
  id: string;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  defaultOpenId?: string;
  allowMultiple?: boolean;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  defaultOpenId,
  allowMultiple = false,
  className,
}) => {
  const [openIds, setOpenIds] = useState<string[]>(
    defaultOpenId ? [defaultOpenId] : []
  );

  const toggle = (id: string) => {
    if (allowMultiple) {
      setOpenIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    } else {
      setOpenIds((prev) => (prev.includes(id) ? [] : [id]));
    }
  };

  return (
    <div className={cn('divide-y divide-ink-200 border border-ink-200 rounded-lg overflow-hidden bg-white', className)}>
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        return (
          <div key={item.id} className="transition-colors">
            <button
              type="button"
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between p-4 text-start hover:bg-ink-50 transition-colors select-none cursor-pointer"
            >
              <div className="space-y-0.5 pe-4">
                <span className="text-sm font-bold text-ink-900 block">
                  {item.title}
                </span>
                {item.subtitle && (
                  <span className="text-xs text-ink-500 block">
                    {item.subtitle}
                  </span>
                )}
              </div>
              <ChevronDown
                className={cn(
                  'w-5 h-5 text-ink-400 shrink-0 transition-transform duration-200',
                  isOpen ? 'rotate-180 text-sky-600' : ''
                )}
              />
            </button>
            {isOpen && (
              <div className="p-4 pt-0 border-t border-ink-100 bg-ink-50/40 text-sm text-ink-700 leading-relaxed animate-in slide-in-from-top-1 duration-150">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
