'use client';

import { useQuery } from '@tanstack/react-query';
import type { EntityKey } from '@eventology/config';
import { ENTITY_CONFIG } from '@eventology/config';
import { QUERY_KEY_MAP } from './query-key-map';
import type { ErrorEnvelope } from '@/lib/api';

// ---------------------------------------------------------------------------
// Generic single-document hook
// ---------------------------------------------------------------------------

/**
 * Fetches a single entity by ID from the public or protected API.
 *
 * @param entity - Entity key from ENTITY_CONFIG
 * @param id     - Document ID (null to skip the query)
 * @param useProtected - Whether to use the protected API path
 */
export function useDoc<T = unknown>(
  entity: EntityKey,
  id: string | null,
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
  const queryKey = keyFactory?.doc(id!) ?? [entity, 'doc', id];

  return useQuery<T>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`${basePath}/${id}`);
      if (!res.ok) {
        const body: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? `Failed to fetch ${config.label}`);
      }
      return res.json();
    },
    enabled: !!id,
  });
}
