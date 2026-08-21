import sanitizeHtmlLib from 'sanitize-html';

/**
 * Allow-list for rich text produced by the in-app editor. Anything not listed
 * here (script/style/iframe/event handlers/javascript: URLs) is stripped, so
 * stored content can never execute in another visitor's browser.
 */
const RICH_TEXT_OPTIONS: sanitizeHtmlLib.IOptions = {
  allowedTags: [
    'p', 'br', 'hr', 'div', 'span',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'sub', 'sup', 'mark',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a', 'img', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    '*': ['style', 'dir', 'align'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https', 'data'] },
  allowedSchemesAppliedToAttributes: ['href', 'src'],
  allowProtocolRelative: false,
  allowedStyles: {
    '*': {
      'text-align': [/^(right|left|center|justify)$/],
      'font-weight': [/^(normal|bold|[1-9]00)$/],
      'font-style': [/^(normal|italic)$/],
      'text-decoration': [/^(none|underline|line-through)$/],
      color: [/^#[0-9a-fA-F]{3,8}$/, /^rgba?\(([\d\s.,%]+)\)$/],
      'background-color': [/^#[0-9a-fA-F]{3,8}$/, /^rgba?\(([\d\s.,%]+)\)$/],
    },
  },
  transformTags: {
    // Every outbound link opens safely: no window.opener handle, no referrer.
    a: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, rel: 'noopener noreferrer nofollow', target: '_blank' },
    }),
  },
  // `data:` images are capped so a comment cannot be used to store megabytes.
  exclusiveFilter: (frame) =>
    frame.tag === 'img' &&
    typeof frame.attribs.src === 'string' &&
    frame.attribs.src.startsWith('data:') &&
    frame.attribs.src.length > 512 * 1024,
};

/** Sanitizes editor HTML, preserving formatting but removing anything active. */
export function sanitizeRichText(input: unknown, maxLength = 60_000): string {
  if (typeof input !== 'string' || !input.trim()) return '';
  const clipped = input.length > maxLength ? input.slice(0, maxLength) : input;
  return sanitizeHtmlLib(clipped, RICH_TEXT_OPTIONS).trim();
}

/** Strips every tag; use for titles, summaries and other plain-text fields. */
export function sanitizePlainText(input: unknown, maxLength = 2_000): string {
  if (typeof input !== 'string') return '';
  const stripped = sanitizeHtmlLib(input, { allowedTags: [], allowedAttributes: {} });
  return stripped.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

/** Like `sanitizePlainText` but keeps newlines (contact messages, notes). */
export function sanitizeMultilineText(input: unknown, maxLength = 8_000): string {
  if (typeof input !== 'string') return '';
  const stripped = sanitizeHtmlLib(input, { allowedTags: [], allowedAttributes: {} });
  return stripped.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, maxLength);
}

const SAFE_URL_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/**
 * Returns the URL when it is safe to place in `href`/`src`, otherwise ''.
 * Site-relative paths (`/uploads/...`) are always allowed.
 */
export function sanitizeUrl(input: unknown, { allowData = false } = {}): string {
  if (typeof input !== 'string') return '';
  const value = input.trim();
  if (!value) return '';
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  if (allowData && /^data:(image\/(png|jpe?g|gif|webp|svg\+xml));base64,/i.test(value)) {
    return value;
  }
  try {
    const parsed = new URL(value);
    return SAFE_URL_SCHEMES.has(parsed.protocol) ? parsed.toString() : '';
  } catch {
    return '';
  }
}
