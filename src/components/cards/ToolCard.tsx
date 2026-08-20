import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Layout, FileText, BookOpen, ArrowLeft } from 'lucide-react';
import { Tool, ToolFormat } from '../../types';
import { DifficultyDots, Chip } from '../ui';
import { formatMinutes } from '../../utils/format';

interface ToolCardProps {
  tool: Tool;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const formatConfigs: Record<ToolFormat, { label: string; icon: React.ReactNode; color: 'sky' | 'pink' | 'amber' | 'ink' }> = {
    canvas: { label: 'بوم تعاملی', icon: <Layout className="w-3.5 h-3.5" />, color: 'sky' },
    game: { label: 'بازی و شبیه‌سازی', icon: <BookOpen className="w-3.5 h-3.5" />, color: 'sky' },
    scenario: { label: 'سناریو و نمونه موردی', icon: <FileText className="w-3.5 h-3.5" />, color: 'amber' },
    digital: { label: 'ابزار دیجیتال', icon: <Layout className="w-3.5 h-3.5" />, color: 'sky' },
    file: { label: 'فایل دانلودی', icon: <FileText className="w-3.5 h-3.5" />, color: 'pink' },
    worksheet: { label: 'کاربرگ تمرینی', icon: <FileText className="w-3.5 h-3.5" />, color: 'pink' },
    guide: { label: 'راهنمای گام‌به‌گام', icon: <BookOpen className="w-3.5 h-3.5" />, color: 'amber' },
  };

  const formatConfig = formatConfigs[tool.format] || formatConfigs.canvas;

  return (
    <div className="group flex flex-col bg-white rounded-xl border border-ink-200 overflow-hidden shadow-xs hover:shadow-md hover:border-pink-300 transition-all duration-200">
      {/* Cover / Visual Banner */}
      <Link
        to={`/toolbox/${tool.slug}`}
        className="relative aspect-[16/9] bg-gradient-to-br from-ink-50 to-pink-50/40 p-4 flex flex-col justify-between overflow-hidden block border-b border-ink-100"
      >
        <div className="flex items-center justify-between w-full">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-white/95 backdrop-blur-xs text-ink-800 shadow-2xs">
            {formatConfig.icon}
            <span>{formatConfig.label}</span>
          </span>
          {tool.stage && (
            <Chip size="sm" variant="pink" className="bg-white/90">
              {tool.stage.nameFa}
            </Chip>
          )}
        </div>

        {/* Preview image */}
        <div className="flex items-center justify-center py-2">
          <img
            src={tool.previewSvgUrl || '/mock/canvas-preview.svg'}
            alt={tool.title}
            className="h-20 w-auto object-contain drop-shadow-xs group-hover:scale-105 transition-transform duration-200"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-ink-500 font-sans">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>زمان تقریبی: {formatMinutes(tool.estimatedMinutes)}</span>
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          <Link to={`/toolbox/${tool.slug}`}>
            <h3 className="text-base font-bold text-ink-900 line-clamp-2 group-hover:text-pink-600 transition-colors leading-snug">
              {tool.title}
            </h3>
          </Link>
          <p className="text-xs text-ink-500 line-clamp-2 leading-relaxed">
            {tool.summary}
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-ink-100">
          <DifficultyDots difficulty={tool.difficulty} />
          <Link
            to={`/toolbox/${tool.slug}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-pink-600 hover:text-pink-700 transition-colors"
          >
            <span>استفاده از ابزار</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
