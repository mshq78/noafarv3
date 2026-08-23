/**
 * NOAFAR API CLIENT
 * Single entry point for every network request.
 *
 * The session lives in an httpOnly cookie issued by the API, so no token is
 * ever stored in JavaScript-readable storage: an XSS bug cannot walk off with
 * the user's session. Every mutating request carries `X-Noafar-Client`, a
 * header a cross-origin page cannot set without a preflight we do not grant.
 */

const env = (import.meta as unknown as { env?: Record<string, string> }).env ?? {};

/** Same-origin by default: in production the API serves the SPA itself. */
export const API_BASE_URL = (env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, unknown>;
  body?: BodyInit | Record<string, unknown> | unknown[] | null;
  /** Set to false to keep a 401 from redirecting to the login page. */
  redirectOnUnauthorized?: boolean;
}

export class ApiError extends Error {
  status: number;
  code: string;
  data?: unknown;

  constructor(message: string, status: number, code = 'error', data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function buildUrl(endpoint: string, params?: Record<string, unknown>): string {
  const path = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const url = new URL(path, window.location.origin);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item !== undefined && item !== null && item !== '') {
            url.searchParams.append(key, String(item));
          }
        });
      } else {
        url.searchParams.append(key, String(value));
      }
    }
  }
  return url.toString();
}

function redirectToLogin(): void {
  const currentPath = window.location.pathname + window.location.search;
  if (window.location.pathname.startsWith('/login')) return;
  window.location.href = `/login?returnTo=${encodeURIComponent(currentPath)}`;
}

export async function request<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  const { params, body, redirectOnUnauthorized = true, ...init } = options;
  const method = (init.method ?? 'GET').toUpperCase();

  const headers = new Headers(init.headers);
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  let payload: BodyInit | null | undefined;
  if (body === undefined || body === null) {
    payload = body as null | undefined;
  } else if (isFormData || typeof body === 'string' || body instanceof Blob) {
    payload = body as BodyInit;
  } else {
    payload = JSON.stringify(body);
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  }

  if (!SAFE_METHODS.has(method)) headers.set('X-Noafar-Client', 'web');

  let response: Response;
  try {
    response = await fetch(buildUrl(endpoint, params), {
      ...init,
      method,
      headers,
      body: payload,
      // Sends the httpOnly session cookie on same-origin requests.
      credentials: 'include',
    });
  } catch (error) {
    throw new ApiError('خطا در برقراری ارتباط با سرور. اتصال اینترنت خود را بررسی کنید.', 0, 'network', error);
  }

  if (response.status === 204) return {} as T;

  const contentType = response.headers.get('content-type') ?? '';
  let data: unknown = null;
  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  } else {
    const text = await response.text().catch(() => '');
    data = text || null;
  }

  if (!response.ok) {
    const payloadObject = (data ?? {}) as { message?: string; code?: string };
    if (response.status === 401 && redirectOnUnauthorized) redirectToLogin();
    // A non-JSON error body means the request never reached the API: the host
    // answered with the SPA shell or its own error page. Saying that outright
    // beats a bare status code, which reads like an application bug.
    const apiMissing = !contentType.includes('application/json');
    throw new ApiError(
      payloadObject.message ||
        (apiMissing
          ? `سرویس API در دسترس نیست (کد ${response.status}). به‌نظر می‌رسد بخش سرور روی این میزبان مستقر نشده است.`
          : `خطای سرور: ${response.status}`),
      response.status,
      payloadObject.code || (apiMissing ? 'api_unavailable' : 'error'),
      data,
    );
  }

  return data as T;
}

export const get = <T>(endpoint: string, params?: Record<string, unknown>, options: ApiRequestOptions = {}) =>
  request<T>(endpoint, { ...options, method: 'GET', params });

export const post = <T>(endpoint: string, body?: ApiRequestOptions['body'], options: ApiRequestOptions = {}) =>
  request<T>(endpoint, { ...options, method: 'POST', body });

export const patch = <T>(endpoint: string, body?: ApiRequestOptions['body'], options: ApiRequestOptions = {}) =>
  request<T>(endpoint, { ...options, method: 'PATCH', body });

export const put = <T>(endpoint: string, body?: ApiRequestOptions['body'], options: ApiRequestOptions = {}) =>
  request<T>(endpoint, { ...options, method: 'PUT', body });

export const del = <T>(endpoint: string, options: ApiRequestOptions = {}) =>
  request<T>(endpoint, { ...options, method: 'DELETE' });
