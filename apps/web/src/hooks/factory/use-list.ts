'use client';

import { useQuery } from '@tanstack/react-query';
import type { EntityKey } from '@eventology/config';
import { ENTITY_CONFIG } from '@eventology/config';
import { QUERY_KEY_MAP } from './query-key-map';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ListOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
  sort?: string;
  [key: string]: string | number | undefined;
}

/** Raw envelope returned by the API handlers */
interface ApiListEnvelope<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

/** Normalized response shape for consumers of useList */
export interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ---------------------------------------------------------------------------
// Generic list hook
// ---------------------------------------------------------------------------

/**
 * Generic list hook for any entity that has a public or protected API route.
 * Uses TanStack Query for caching and the entity config for API paths.
 *
 * @param entity - Entity key from ENTITY_CONFIG
 * @param options - Filter, pagination, and search options
 * @param useProtected - Whether to use the protected API path (default: false = public)
 */
export function useList<T = unknown>(
  entity: EntityKey,
  options?: ListOptions,
  useProtected = false
) {
  const config = ENTITY_CONFIG[entity];
  const basePath = useProtected ? config.protectedPath : config.publicPath;

  if (!basePath) {
    throw new Error(
      `Entity "${entity}" has no ${useProtected ? 'protected' : 'public'} API path configured.`
    );
  }

  const keyFactory = QUERY_KEY_MAP[entity];
  const queryKey = keyFactory
    ? keyFactory.list(options)
    : [entity, 'list', options];

  return useQuery<ListResponse<T>>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.page) params.set('page', String(options.page));
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.search) params.set('search', options.search);
      if (options?.status) params.set('status', options.status);
      if (options?.category) params.set('category', options.category);
      if (options?.sort) params.set('sort', options.sort);

      const url = params.toString() ? `${basePath}?${params}` : basePath;
      const res = await fetch(url);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: { message?: string } }).error?.message ?? `Failed to fetch ${config.labelPlural}`
        );
      }

      // Map envelope { data, meta: { total, page, limit } } → normalized shape
      const envelope: ApiListEnvelope<T> = await res.json();
      return {
        data: envelope.data,
        total: envelope.meta.total,
        page: envelope.meta.page,
        limit: envelope.meta.limit,
      };
    },
  });
}
