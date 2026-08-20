/**
 * NOAFAR API SERVICE
 * Single entry point for all network requests.
 * Supports mock interception with realistic 300-600ms network delay.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const env = (import.meta as any)?.env || {};
const API_BASE_URL = env.VITE_API_BASE_URL || '/api';
const USE_MOCKS = env.VITE_USE_MOCKS === 'false' ? false : true;

export interface ApiRequestOptions extends RequestInit {
  params?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockHandler?: () => any;
}

export class ApiError extends Error {
  status: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem('noafar:auth:token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('noafar:auth:token', token);
}

export function clearAuthToken(): void {
  localStorage.removeItem('noafar:auth:token');
  localStorage.removeItem('noafar:auth:user');
}

/**
 * Simulate network delay between 300ms and 600ms
 */
export async function simulateDelay(min = 300, max = 600): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export async function request<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { params, mockHandler, ...fetchOptions } = options;

  // Handle Mock Mode Interception
  if (USE_MOCKS && mockHandler) {
    await simulateDelay();
    try {
      const mockResult = await mockHandler();
      return mockResult as T;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError('Mock handler execution error', 500, err);
    }
  }

  // Construct URL with query parameters
  const url = new URL(
    endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`,
    window.location.origin
  );

  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        if (Array.isArray(val)) {
          val.forEach((item) => url.searchParams.append(key, String(item)));
        } else {
          url.searchParams.append(key, String(val));
        }
      }
    });
  }

  // Prepare Headers with JWT
  const headers = new Headers(fetchOptions.headers || {});
  if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(url.toString(), {
      ...fetchOptions,
      headers,
    });

    if (response.status === 401) {
      clearAuthToken();
      const currentPath = window.location.pathname + window.location.search;
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = `/login?returnTo=${encodeURIComponent(currentPath)}`;
      }
      throw new ApiError('احراز هویت منقضی شده است. لطفاً مجدداً وارد شوید.', 401);
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }
      throw new ApiError(
        errorData?.message || `خطای سرور: ${response.status}`,
        response.status,
        errorData
      );
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('خطا در برقراری ارتباط با سرور', 0, error);
  }
}
