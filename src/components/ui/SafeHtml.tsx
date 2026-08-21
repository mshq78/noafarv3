import React, { useMemo } from 'react';
import { sanitizeHtml } from '../../utils/sanitize';

interface SafeHtmlProps {
  html: string | undefined | null;
  className?: string;
  as?: 'div' | 'span' | 'p';
}

/**
 * Renders stored rich text. Always use this instead of a bare
 * `dangerouslySetInnerHTML` so no rendering path can skip sanitisation.
 */
export const SafeHtml: React.FC<SafeHtmlProps> = ({ html, className, as: Tag = 'div' }) => {
  const clean = useMemo(() => sanitizeHtml(html), [html]);
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
};
