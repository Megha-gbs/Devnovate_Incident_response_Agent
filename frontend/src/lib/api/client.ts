import { ApiError } from '@/types';

/**
 * Whether the app is running in mock mode.
 *
 * Mock mode is active when:
 *  - User has manually toggled mock mode in browser (localStorage: 'opsmind_mock_mode' = 'true')
 *  - NEXT_PUBLIC_USE_MOCK_API=true (environment override)
 *  - NEXT_PUBLIC_API_BASE_URL is empty/unset (no backend configured)
 */
export function isMockMode(): boolean {
  if (typeof window !== 'undefined') {
    const userPreference = window.localStorage.getItem('opsmind_mock_mode');
    if (userPreference === 'true') return true;
    if (userPreference === 'false') return false;
  }

  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_API;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (useMock === 'true') return true;
  if (!baseUrl || baseUrl.trim() === '') return true;
  return false;
}

/**
 * Programmatically toggle mock mode for rapid testing or offline recovery.
 */
export function setMockMode(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('opsmind_mock_mode', enabled ? 'true' : 'false');
    window.dispatchEvent(new Event('opsmind:mode_changed'));
  }
}

export function getApiBaseUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url || url.trim() === '') return null;
  const trimmed = url.replace(/\/$/, '');
  if (trimmed.endsWith('/api') || trimmed.endsWith('/api/v1')) {
    return trimmed;
  }
  return `${trimmed}/api/v1`;
}

/**
 * Core fetch wrapper. All API calls go through here.
 * Throws ApiError on non-2xx responses — never exposes raw stack traces.
 */
export async function baseRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const baseUrl = getApiBaseUrl();

  if (!baseUrl) {
    throw new ApiError(
      0,
      'No backend API URL configured. Set NEXT_PUBLIC_API_BASE_URL in your environment or use Mock Mode.',
      path,
    );
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${baseUrl}${normalizedPath}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options?.headers ?? {}),
      },
      ...options,
    });
  } catch {
    // Network-level failure (offline, CORS, server down, etc.)
    throw new ApiError(
      0,
      `Unable to reach backend at ${baseUrl}. Ensure the server is active and CORS is permitted.`,
      normalizedPath,
    );
  }

  if (!res.ok) {
    let message = res.statusText || 'An unexpected error occurred.';
    try {
      const body = await res.text();
      if (body) {
        try {
          const json = JSON.parse(body) as { detail?: string; message?: string };
          message = json.detail ?? json.message ?? body;
        } catch {
          message = body;
        }
      }
    } catch {
      // ignore body-read errors
    }

    if (res.status === 404) {
      message = `Backend endpoint 404: "${normalizedPath}" not found on ${baseUrl}.`;
    }

    throw new ApiError(res.status, message, normalizedPath);
  }

  const json = await res.json();
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return (json as { data: T }).data;
  }
  return json as T;
}
