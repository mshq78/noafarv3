#!/usr/bin/env node
/**
 * Site audit: drives the running app in a real browser and reports bug classes
 * that tests and typechecks do not see.
 *
 *   BASE=http://127.0.0.1:4300 ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/audit/run.mjs
 *
 * Needs Playwright (npm i -D playwright, or PLAYWRIGHT_MODULE=/path/to/playwright)
 * and a seeded database (admin panel → «بارگذاری محتوای نمونه»). With admin
 * credentials it also creates a few items with pathological text (long words,
 * long summaries) and checks that they lay out. Everything it creates is marked
 * `ZZAUDIT` and can be deleted afterwards.
 *
 * Checks: overlap · overflow · clipped text · tiny text · low contrast · tap
 * targets · unnamed controls · unlabeled fields · missing alt · heading order ·
 * duplicate ids · broken internal links · pages that hang or stay silent when
 * the API fails · silent form submits · dead buttons · focus visibility ·
 * layout shift · page weight · oversized images.
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const BASE = (process.env.BASE || 'http://127.0.0.1:4300').replace(/\/$/, '');
const WIDTHS = (process.env.WIDTHS || '360,768,1280').split(',').map(Number);
const ADMIN = { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD };
const only = (process.env.ONLY || '').split(',').filter(Boolean);

const findings = new Map();
function report(check, where, detail, severity = 'warn') {
  const key = `${check}|${detail}`;
  const f = findings.get(key) ?? { check, detail, severity, where: new Set() };
  f.where.add(where);
  findings.set(key, f);
}
const want = (c) => !only.length || only.includes(c);

async function api(path, init) {
  const res = await fetch(BASE + path, init);
  return res.json().catch(() => null);
}

/** Everything that can be read from the DOM in one pass. Runs in the page. */
function inspect({ mobile }) {
  const out = { overlap: [], overflow: [], clipped: [], tiny: [], contrast: [], tap: [], unnamed: [], unlabeled: [], noAlt: [], headings: [], dupIds: [], bigImg: [], hrefs: [], nested: [] };
  const vw = innerWidth;
  const vis = (e) => {
    const c = getComputedStyle(e);
    if (c.visibility === 'hidden' || c.display === 'none' || +c.opacity < 0.05) return false;
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const tag = (e) =>
    e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).slice(0, 3).join('.') : '') + ' «' + (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 24) + '»';
  const ownText = (e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  const inFixed = (e) => { for (let n = e; n && n !== document.body; n = n.parentElement) if (getComputedStyle(n).position === 'fixed') return true; return false; };

  const clip = (e) => {
    const r = e.getBoundingClientRect();
    let L = r.left, T = r.top, R = r.right, B = r.bottom;
    for (let n = e.parentElement; n && n !== document.documentElement; n = n.parentElement) {
      const c = getComputedStyle(n);
      if (c.overflowX !== 'visible' || c.overflowY !== 'visible') {
        const q = n.getBoundingClientRect();
        L = Math.max(L, q.left); R = Math.min(R, q.right); T = Math.max(T, q.top); B = Math.min(B, q.bottom);
      }
    }
    return { left: L, top: T, right: R, bottom: B, width: R - L, height: B - T };
  };

  const all = [...document.querySelectorAll('body *')].filter(vis);

  // --- overlap (siblings of text/controls that sit on one another) ---------
  const items = all.filter((e) => ownText(e) || ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(e.tagName)).slice(0, 1200).map((e) => ({ e, r: clip(e) })).filter((x) => x.r.width > 3 && x.r.height > 3);
  const positioned = (x) => { for (let n = x; n && n !== document.body; n = n.parentElement) if (['absolute', 'fixed', 'sticky'].includes(getComputedStyle(n).position)) return true; return false; };
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], b = items[j];
    if (a.e.contains(b.e) || b.e.contains(a.e)) continue;
    const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
    const h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
    if (w > 3 && h > 3 && w * h > 40 && !positioned(a.e) && !positioned(b.e)) out.overlap.push(`${tag(a.e)} × ${tag(b.e)}`);
  }

  // --- horizontal overflow ---------------------------------------------------
  const sw = document.documentElement.scrollWidth - vw;
  if (sw > 2) out.overflow.push(`document is ${sw}px wider than the screen`);
  for (const e of all) {
    const r = e.getBoundingClientRect();
    if ((r.right > vw + 2 || r.left < -2) && !(e instanceof SVGElement && e.tagName !== "svg") && !inFixed(e) && !e.closest('[class*="overflow-x"],[class*="overflow-hidden"],.scrollbar-none,.custom-scrollbar')) { out.overflow.push(tag(e)); if (out.overflow.length > 4) break; }
  }

  // --- interactive inside interactive (double tab stop, invalid HTML)
  for (const e of document.querySelectorAll('a button, a a, button button, a [role="button"], button a')) { out.nested.push(tag(e)); if (out.nested.length > 6) break; }

  // --- text: clipped, tiny, contrast -----------------------------------------
  const bgOf = (e) => {
    for (let n = e; n; n = n.parentElement) {
      const c = getComputedStyle(n);
      if (c.backgroundImage !== 'none') return null; // gradient or image: unknown
      if (/^(oklab|oklch|color|lab|lch|hwb)\(/.test(c.backgroundColor)) return null; // wide-gamut/translucent colours: unknown
      const m = c.backgroundColor.match(/rgba?\(([^)]+)\)/);
      if (m) { const p = m[1].split(',').map(Number); const a = p[3] ?? 1; if (a > 0.9) return p; if (a > 0.05) return null; /* translucent overlay: unknown */ }
    }
    return [255, 255, 255];
  };
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const seenContrast = new Set();
  for (const e of all) {
    if (!ownText(e)) continue;
    const c = getComputedStyle(e);
    const size = parseFloat(c.fontSize);
    if (size < 11 && e.textContent.trim().length > 1) out.tiny.push(`${size}px ${tag(e)}`);
    if ((c.overflow === 'hidden' || c.overflowX === 'hidden') && e.scrollWidth > e.clientWidth + 2 && c.textOverflow !== 'ellipsis' && !c.webkitLineClamp?.match(/\d/) && c.whiteSpace !== 'normal') out.clipped.push(`${tag(e)} (${e.scrollWidth}>${e.clientWidth})`);
    // contrast against the nearest solid background; skipped over gradients/images
    const bg = bgOf(e);
    const fm = c.color.match(/rgba?\(([^)]+)\)/);
    if (bg && fm && !e.closest('[disabled],[aria-disabled="true"]') && getComputedStyle(e).opacity === '1') {
      const f = fm[1].split(',').map(Number);
      const a = f[3] ?? 1;
      const fg = [0, 1, 2].map((i) => Math.round(f[i] * a + bg[i] * (1 - a)));
      const L1 = lum(fg), L2 = lum(bg);
      const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      const large = size >= 24 || (size >= 18.66 && +c.fontWeight >= 700);
      const need = large ? 3 : 4.5;
      const k = `${fg}|${bg}|${size}`;
      if (ratio < need && !seenContrast.has(k)) { seenContrast.add(k); out.contrast.push(`${ratio.toFixed(2)}:1 (need ${need}) ${tag(e)} rgb(${fg}) on rgb(${bg})`); }
    }
  }

  // --- controls ------------------------------------------------------------
  const interactive = all.filter((e) => e.matches('a[href],button,[role="button"],input:not([type=hidden]),select,textarea,[role="tab"],[role="checkbox"]'));
  const nameOf = (e) => {
    const lab = e.getAttribute('aria-labelledby');
    if (lab) { const t = lab.split(/\s+/).map((id) => document.getElementById(id)?.textContent || '').join(' ').trim(); if (t) return t; }
    return (e.getAttribute('aria-label') || e.innerText || e.textContent || e.getAttribute('title') || e.querySelector('img[alt]')?.getAttribute('alt') || (['submit', 'button'].includes(e.type) ? e.value : '') || '').trim();
  };
  for (const e of interactive) {
    const isField = ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.tagName);
    if (isField) {
      const id = e.id;
      const labelled = e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) || e.closest('label') || e.getAttribute('title');
      if (!labelled) out.unlabeled.push(`${tag(e)}${e.placeholder ? ' placeholder="' + e.placeholder.slice(0, 20) + '"' : ''}`);
    } else if (!nameOf(e)) out.unnamed.push(tag(e));
    if (mobile) {
      const r = e.getBoundingClientRect();
      const inline = e.tagName === 'A' && getComputedStyle(e).display === 'inline';
      if (!inline && Math.min(r.width, r.height) < 32 && !e.closest('[class*="sr-only"]')) out.tap.push(`${Math.round(r.width)}×${Math.round(r.height)} ${tag(e)}`);
    }
    if (e.tagName === 'A') out.hrefs.push(e.getAttribute('href'));
  }
  for (const im of document.images) if (vis(im) && im.getAttribute('alt') === null) out.noAlt.push(im.src.slice(-50));
  for (const im of document.images) if (vis(im) && im.naturalWidth > 1200 && im.naturalWidth > im.clientWidth * 3) out.bigImg.push(`${im.naturalWidth}px shown at ${im.clientWidth}px: ${im.src.slice(-45)}`);

  // --- structure -----------------------------------------------------------
  const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(vis);
  const h1 = hs.filter((h) => h.tagName === 'H1').length;
  if (h1 !== 1) out.headings.push(`${h1} h1 elements`);
  let prev = 0;
  for (const h of hs) { const l = +h.tagName[1]; if (prev && l > prev + 1) out.headings.push(`h${prev} → h${l} skips a level: «${h.textContent.trim().slice(0, 24)}»`); prev = l; }
  const ids = {}; for (const e of document.querySelectorAll('[id]')) ids[e.id] = (ids[e.id] || 0) + 1;
  for (const [id, n] of Object.entries(ids)) if (n > 1) out.dupIds.push(`#${id} ×${n}`);
  const vm = document.querySelector('meta[name=viewport]')?.content || '';
  if (/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(\.0)?\b/.test(vm)) out.overflow.push('viewport blocks pinch-zoom');
  return out;
}

const SKIP_CLICK = /خروج|حذف|delete|logout|ثبت‌نام|ارسال|انتشار|ذخیره|تأیید|رد |بلاک|مسدود|بارگذاری محتوای نمونه|پاک/i;

async function main() {
  const browser = await chromium.launch();
  const sections = ['academy', 'toolbox', 'library', 'journey', 'gathering'];
  const first = {};
  for (const s of sections) first[s] = (await api(`/api/content/${s}?pageSize=1`))?.items?.[0]?.slug;
  const blog = await api('/api/blog');
  const blogSlug = (blog?.items || blog || [])[0]?.slug;

  // Pathological content, so the layout is tried on text real editors will write.
  const longSlugs = [];
  if (ADMIN.email && ADMIN.password) {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto(BASE + '/');
    const st = await p.evaluate(async (a) => (await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Noafar-Client': 'web' }, body: JSON.stringify(a) })).status, ADMIN);
    if (st === 200) {
      const word = 'ZZAUDIT' + 'بسیارطولانیبدونفاصله'.repeat(8);
      const sentence = 'این یک خلاصهٔ بسیار طولانی است که باید در کارت‌ها و صفحهٔ جزئیات بدون سرریز نمایش داده شود. '.repeat(7);
      for (const s of ['academy', 'toolbox', 'library', 'journey', 'gathering', 'blog']) {
        const r = await ctx.request.post(BASE + '/api/admin/content', { headers: { 'X-Noafar-Client': 'web' }, data: { section: s, content: { title: word, summary: sentence.slice(0, 1900), body: `<p>${word}</p><h2>${word}</h2><ul><li>${word}</li></ul>`, tags: Array.from({ length: 12 }, (_, i) => 'برچسب‌طولانی' + i), author: 'ZZAUDIT ' + word.slice(0, 80) } } });
        const j = await r.json().catch(() => null);
        if (j?.slug) longSlugs.push(s === 'blog' ? `/blog/${encodeURIComponent(j.slug)}` : `/${s}/${encodeURIComponent(j.slug)}`);
      }
    }
    await ctx.close();
  }

  const pages = ['/', '/academy', '/toolbox', '/library', '/journey', '/gathering', '/blog', '/about', '/contact', '/login', '/search?q=%DA%A9%D8%AA%D8%A7%D8%A8', '/search?q=zzzqqq', '/academy?q=zzzqqq', '/nope-404',
    ...Object.entries(first).filter(([, v]) => v).map(([k, v]) => `/${k}/${encodeURIComponent(v)}`),
    ...(blogSlug ? [`/blog/${encodeURIComponent(blogSlug)}`] : []), ...longSlugs];
  const authedPages = ['/profile', '/journey/submit', '/admin'];
  const seenLinks = new Set();
  const perf = [];

  async function visit(ctx, url, width, label) {
    const page = await ctx.newPage();
    await page.addInitScript(() => { window.__cls = 0; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); } catch {} });
    let bytes = 0, reqs = 0; const consoleErrs = [];
    page.on('response', async (r) => { try { reqs++; const l = r.headers()['content-length']; bytes += l ? +l : 0; } catch {} });
    page.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|net::|Failed to load resource/.test(m.text())) consoleErrs.push(m.text().slice(0, 120)); });
    page.on('pageerror', (e) => consoleErrs.push('uncaught: ' + e.message.slice(0, 120)));
    await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(700);
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 450) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); } scrollTo(0, 0); });
    await page.waitForTimeout(500);
    const where = `${label}${url.slice(0, 48)}@${width}`;
    const r = await page.evaluate(inspect, { mobile: width <= 768 });
    const add = (c, list, sev) => { if (want(c)) for (const d of [...new Set(list)].slice(0, 8)) report(c, where, d, sev); };
    add('overlap', r.overlap, 'bug'); add('overflow', r.overflow, 'bug'); add('clipped-text', r.clipped, 'bug'); add('tiny-text', r.tiny, 'warn');
    add('contrast', r.contrast, 'a11y'); add('tap-target', r.tap, 'a11y'); add('unnamed-control', r.unnamed, 'a11y'); add('nested-interactive', r.nested, 'a11y'); add('unlabeled-field', r.unlabeled, 'a11y');
    add('missing-alt', r.noAlt, 'a11y'); add('heading-order', r.headings, 'a11y'); add('duplicate-id', r.dupIds, 'bug'); add('oversized-image', r.bigImg, 'perf');
    add('console-error', consoleErrs, 'bug');
    const cls = await page.evaluate(() => window.__cls || 0);
    if (want('layout-shift') && cls > 0.1) report('layout-shift', where, `CLS ${cls.toFixed(2)} (good < 0.1)`, 'perf');
    perf.push({ where, kb: Math.round(bytes / 1024), reqs });
    if (width === WIDTHS[WIDTHS.length - 1]) r.hrefs.forEach((h) => h && h.startsWith('/') && !h.startsWith('//') && seenLinks.add(h.split('#')[0].replace(/\/$/, '') || '/'));
    return page;
  }

  for (const width of WIDTHS) {
    const anon = await browser.newContext({ viewport: { width, height: 800 }, locale: 'fa-IR' });
    for (const u of pages) await (await visit(anon, u, width, 'anon ')).close();
    await anon.close();
    if (ADMIN.email) {
      const ctx = await browser.newContext({ viewport: { width, height: 800 }, locale: 'fa-IR' });
      const p0 = await ctx.newPage(); await p0.goto(BASE + '/');
      await p0.evaluate(async (a) => { await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Noafar-Client': 'web' }, body: JSON.stringify(a) }); }, ADMIN); await p0.close();
      for (const u of authedPages) await (await visit(ctx, u, width, 'admin ')).close();
      await ctx.close();
    }
  }

  // --- broken internal links ---------------------------------------------------
  if (want('broken-link')) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'fa-IR' });
    for (const href of [...seenLinks].slice(0, 80)) {
      const p = await ctx.newPage();
      await p.goto(BASE + href, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
      const t = await p.title();
      if (/صفحه پیدا نشد/.test(t)) report('broken-link', 'links', `${href} → 404 page`, 'bug');
      await p.close();
    }
    await ctx.close();
  }

  // --- what the visitor sees when the API fails ---------------------------------------
  if (want('api-failure')) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, locale: 'fa-IR' });
    for (const u of ['/', '/academy', `/academy/${first.academy}`, '/blog', '/search?q=%DA%A9%D8%AA%D8%A7%D8%A8', '/gathering']) {
      const p = await ctx.newPage();
      await p.route('**/api/**', (r) => r.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"خطای آزمایشی","code":"server_error"}' }));
      await p.goto(BASE + u, { waitUntil: 'load' }).catch(() => {});
      await p.waitForTimeout(3500);
      const s = await p.evaluate(() => ({ pulse: document.querySelectorAll('.animate-pulse').length, text: (document.querySelector('main')?.innerText || document.body.innerText).replace(/\s+/g, ' ').trim(), alert: !!document.querySelector('[role=alert]') }));
      const msg = /خطا|ناموفق|مشکل|دوباره|در دسترس|یافت نشد|پیدا نشد/.test(s.text);
      if (s.pulse > 0) report('api-failure', u, 'loading skeleton never goes away when the API fails', 'bug');
      else if (!msg && !s.alert && s.text.length < 400) report('api-failure', u, 'page is blank or silent when the API fails (no message, no retry)', 'bug');
      await p.close();
    }
    await ctx.close();
  }

  // --- forms: does an empty submit answer? -------------------------------------------
  if (want('silent-form')) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'fa-IR' });
    for (const u of ['/login', '/contact']) {
      const p = await ctx.newPage(); await p.goto(BASE + u, { waitUntil: 'networkidle' });
      const btn = p.locator('form button[type=submit]').first();
      if (await btn.count()) {
        const before = await p.evaluate(() => document.body.innerText.length + document.querySelectorAll('[role=alert],.text-pink-600,.text-rose-600,:invalid').length);
        await btn.click({ timeout: 3000 }).catch(() => {}); await p.waitForTimeout(900);
        const after = await p.evaluate(() => document.body.innerText.length + document.querySelectorAll('[role=alert],.text-pink-600,.text-rose-600,:invalid').length);
        if (before === after) report('silent-form', u, 'submitting an empty form shows nothing', 'bug');
      }
      await p.close();
    }
    await ctx.close();
  }

  // --- buttons that do nothing -----------------------------------------------------------
  if (want('dead-button')) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'fa-IR' });
    for (const u of ['/', '/academy', `/academy/${first.academy}`, `/library/${first.library}`, `/gathering/${first.gathering}`, '/search?q=%DA%A9%D8%AA%D8%A7%D8%A8', '/login']) {
      const p = await ctx.newPage();
      await p.goto(BASE + u, { waitUntil: 'networkidle' }).catch(() => {});
      const count = await p.locator('button:visible:not([disabled])').count();
      for (let i = 0; i < Math.min(count, 25); i++) {
        await p.goto(BASE + u, { waitUntil: 'networkidle' }).catch(() => {});
        const b = p.locator('button:visible:not([disabled])').nth(i);
        const label = ((await b.innerText().catch(() => '')) || (await b.getAttribute('aria-label').catch(() => '')) || (await b.getAttribute('title').catch(() => '')) || '').trim().slice(0, 30);
        if (SKIP_CLICK.test(label)) continue;
        await p.evaluate(() => { window.__mut = 0; window.__mo?.disconnect(); window.__mo = new MutationObserver((m) => { window.__mut += m.length; }); window.__mo.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true }); });
        let net = 0; const onReq = () => net++; p.on('request', onReq);
        const url0 = p.url();
        await b.click({ timeout: 2000 }).catch(() => {}); await p.waitForTimeout(500);
        p.off('request', onReq);
        const changed = await p.evaluate(() => window.__mut);
        if (!changed && !net && p.url() === url0) report('dead-button', u, `clicking «${label || '(no label)'}» changes nothing`, 'warn');
      }
      await p.close();
    }
    await ctx.close();
  }

  // --- keyboard: can you see where you are? ----------------------------------------------
  if (want('focus-visible')) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'fa-IR' });
    for (const u of ['/', '/academy', '/login']) {
      const p = await ctx.newPage(); await p.goto(BASE + u, { waitUntil: 'networkidle' });
      for (let i = 0; i < 30; i++) {
        await p.keyboard.press('Tab');
        await p.waitForTimeout(260); // let transitions settle before reading styles
        const f = await p.evaluate(() => {
          const e = document.activeElement; if (!e || e === document.body) return null;
          const c = getComputedStyle(e); const r = e.getBoundingClientRect();
          const ring = (c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0) || (c.boxShadow && c.boxShadow !== 'none');
          return { ring, name: e.tagName.toLowerCase() + ' «' + (e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 20) + '»', off: r.bottom < 0 || r.top > innerHeight + 5 && false };
        });
        if (f && !f.ring) report('focus-visible', u, `no visible focus indicator on ${f.name}`, 'a11y');
      }
      await p.close();
    }
    await ctx.close();
  }

  await browser.close();

  // --- output ------------------------------------------------------------------------------
  const order = { bug: 0, a11y: 1, perf: 2, warn: 3 };
  const rows = [...findings.values()].sort((a, b) => order[a.severity] - order[b.severity] || a.check.localeCompare(b.check));
  const by = {};
  for (const f of rows) (by[f.check] ||= []).push(f);
  for (const [check, list] of Object.entries(by)) {
    console.log(`\n■ ${check}  (${list.length}) [${list[0].severity}]`);
    for (const f of list.slice(0, 12)) console.log(`   - ${f.detail}\n       on ${[...f.where].slice(0, 3).join(', ')}${f.where.size > 3 ? ` +${f.where.size - 3} more` : ''}`);
    if (list.length > 12) console.log(`   … ${list.length - 12} more`);
  }
  const heavy = perf.filter((p) => p.kb > 1500).sort((a, b) => b.kb - a.kb).slice(0, 5);
  if (heavy.length) { console.log('\n■ page-weight [perf]'); heavy.forEach((h) => console.log(`   - ${h.kb} KB / ${h.reqs} requests: ${h.where}`)); }
  console.log(`\n${rows.length} distinct findings.`);
}

main().catch((e) => { console.error(e); process.exit(2); });
