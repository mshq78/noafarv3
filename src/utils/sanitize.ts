import DOMPurify from 'dompurify';

/**
 * Second line of defence for rich text. The API already sanitises everything
 * on write; this re-sanitises on render so content that predates the server
 * rules — or arrives from anywhere else — still cannot execute.
 */
const RICH_TEXT_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'hr', 'div', 'span',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'sub', 'sup', 'mark',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a', 'img', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  ],
  ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'src', 'alt', 'width', 'height', 'style', 'dir', 'align'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'link', 'meta'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'formaction'],
} as const;

let hookInstalled = false;

function ensureLinkHardening(): void {
  if (hookInstalled || typeof window === 'undefined') return;
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && node.hasAttribute('href')) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer nofollow');
    }
  });
  hookInstalled = true;
}

/** Returns HTML that is safe to hand to `dangerouslySetInnerHTML`. */
export function sanitizeHtml(html: string | undefined | null): string {
  if (!html) return '';
  ensureLinkHardening();
  return DOMPurify.sanitize(html, RICH_TEXT_CONFIG as unknown as Record<string, unknown>);
}

/** Plain-text preview of rich content (card summaries, meta descriptions). */
export function htmlToPlainText(html: string | undefined | null, maxLength = 300): string {
  if (!html) return '';
  const stripped = DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  const text = stripped.replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}
