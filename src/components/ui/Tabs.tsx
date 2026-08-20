import React from 'react';
import { cn } from '../../utils/cn';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  variant?: 'underline' | 'pills';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
  variant = 'underline',
}) => {
  if (variant === 'pills') {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 p-1 bg-ink-100/80 rounded-lg overflow-x-auto scrollbar-none',
          className
        )}
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all select-none cursor-pointer',
                isActive
                  ? 'bg-white text-ink-900 shadow-xs font-bold'
                  : 'text-ink-600 hover:text-ink-900 hover:bg-white/50'
              )}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-full text-xs font-sans font-bold',
                    isActive ? 'bg-ink-100 text-ink-900' : 'bg-ink-200 text-ink-600'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-6 border-b border-ink-200 overflow-x-auto scrollbar-none',
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 py-3.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors select-none cursor-pointer',
              isActive
                ? 'border-sky-600 text-sky-700 font-bold'
                : 'border-transparent text-ink-600 hover:text-ink-900 hover:border-ink-300'
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-sans font-bold',
                  isActive ? 'bg-sky-50 text-sky-700' : 'bg-ink-100 text-ink-600'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
