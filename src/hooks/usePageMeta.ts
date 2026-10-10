import { useEffect } from 'react';

const SITE = 'نوآفر';

function setMeta(attr: 'name' | 'property', key: string, value: string | null): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (value === null) return;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

/**
 * Gives each page its own tab title, description and share preview. Every page
 * used to share the one title from index.html, so history, bookmarks and a link
 * pasted into a chat all read "نوآفر | پلتفرم نوآوری اجتماعی" regardless of what
 * was open. The previous values are restored when the page unmounts so a page
 * that sets nothing never inherits a stale title.
 */
export function usePageMeta(title: string | undefined, description?: string, image?: string): void {
  useEffect(() => {
    if (!title) return;
    const before = {
      title: document.title,
      description: document.head.querySelector('meta[name="description"]')?.getAttribute('content') ?? null,
      ogTitle: document.head.querySelector('meta[property="og:title"]')?.getAttribute('content') ?? null,
      ogDescription: document.head.querySelector('meta[property="og:description"]')?.getAttribute('content') ?? null,
      ogImage: document.head.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? null,
    };
    const full = `${title} | ${SITE}`;
    const summary = description?.replace(/\s+/g, ' ').trim().slice(0, 200);
    document.title = full;
    setMeta('property', 'og:title', full);
    if (summary) {
      setMeta('name', 'description', summary);
      setMeta('property', 'og:description', summary);
    }
    if (image) setMeta('property', 'og:image', image.startsWith('/') ? window.location.origin + image : image);

    return () => {
      document.title = before.title;
      setMeta('property', 'og:title', before.ogTitle);
      setMeta('name', 'description', before.description);
      setMeta('property', 'og:description', before.ogDescription);
      if (before.ogImage) setMeta('property', 'og:image', before.ogImage);
      else document.head.querySelector('meta[property="og:image"]')?.remove();
    };
  }, [title, description, image]);
}
