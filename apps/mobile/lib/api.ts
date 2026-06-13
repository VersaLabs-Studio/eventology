// ============================================================================
// Typed API Client — thin wrapper over fetch
// ============================================================================
// Reuses the @eventology/schemas database types and the @eventology/config
// query-key factory. Single source of truth for HTTP — every screen calls
// `api.get<T>(path)` / `api.post<T>(path, body)` / etc.
//
// Auth: when a session is available, the better-auth client attaches the
// cookie. This module does not manage auth state — callers pass the token
// in via `setAuthToken()` from the auth context.
// ============================================================================

import Constants from 'expo-constants';

const API_BASE_URL: string =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_API_URL ??
  'http://localhost:3000';

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  status: number;
}

export class ApiClientError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details: unknown;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiClientError';
    this.code = error.code;
    this.status = error.status;
    this.details = error.details;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  headers?: Record<string, string>;
  cache?: 'default' | 'no-store' | 'reload' | 'force-cache';
}

function buildUrl(path: string, query?: Record<string, string | number | undefined>): string {
  const url = path.startsWith('http') ? new URL(path) : new URL(path, API_BASE_URL);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v));
      }
    }
  }
  return url.toString();
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = buildUrl(path, opts.query);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
    ...opts.headers,
  };
  if (authToken) headers.Cookie = authToken;

  const init: RequestInit = {
    method: opts.method ?? 'GET',
    headers,
  };
  if (opts.body) init.body = JSON.stringify(opts.body);
  if (opts.cache) init.cache = opts.cache;

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    throw new ApiClientError({
      code: 'NETWORK_ERROR',
      message,
      status: 0,
    });
  }

  // 204 — no body
  if (res.status === 204) {
    return undefined as T;
  }

  // Try to parse the body. Some endpoints return non-JSON on success (rare).
  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      // Non-JSON body — keep raw text
      body = { error: { code: 'INVALID_RESPONSE', message: text } };
    }
  }

  if (!res.ok) {
    const err = (body as { error?: { code?: string; message?: string; details?: unknown } } | null)?.error;
    throw new ApiClientError({
      code: err?.code ?? 'UNKNOWN_ERROR',
      message: err?.message ?? `Request failed with status ${res.status}`,
      details: err?.details,
      status: res.status,
    });
  }

  return body as T;
}

export const api = {
  get: <T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...(opts ?? {}), method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method'>) =>
    request<T>(path, { ...(opts ?? {}), method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method'>) =>
    request<T>(path, { ...(opts ?? {}), method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method'>) =>
    request<T>(path, { ...(opts ?? {}), method: 'PUT', body }),
  delete: <T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...(opts ?? {}), method: 'DELETE' }),
};

export { API_BASE_URL };
