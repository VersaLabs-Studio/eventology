import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { EntityKey } from '@eventology/config';
import { ENTITY_CONFIG } from '@eventology/config';

// ---------------------------------------------------------------------------
// Standard envelope types
// ---------------------------------------------------------------------------

export interface ListMeta {
  total: number;
  page: number;
  limit: number;
}

export interface ListEnvelope<T> {
  data: T[];
  meta: ListMeta;
}

export interface ErrorEnvelope {
  error: { code: string; message: string; details?: unknown };
}

/**
 * Escapes special characters in a PostgREST `.or()` search term.
 * Commas, parentheses, and asterisks break the filter syntax.
 */
export function escapeSearchTerm(term: string): string {
  return term.replace(/[,()*]/g, '\\$&');
}

// ---------------------------------------------------------------------------
// Factory: createListHandler
// ---------------------------------------------------------------------------

/**
 * Creates a GET list handler for a given entity.
 * Handles pagination, search, status filtering, and sorting.
 *
 * @param entity - Entity key from ENTITY_CONFIG
 */
export function createListHandler(entity: EntityKey) {
  const config = ENTITY_CONFIG[entity];

  return async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20)));
    const search = searchParams.get('search')?.trim() ?? '';
    const status = searchParams.get('status')?.trim() ?? '';
    const offset = (page - 1) * limit;

    let query = supabase
      .from(config.table)
      .select('*', { count: 'exact' })
      .order(config.sortField, { ascending: config.sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    // Full-text search across configured fields — escape special characters
    if (search && config.searchFields.length > 0) {
      const escaped = escapeSearchTerm(search);
      const orFilter = config.searchFields
        .map((field) => `${field}.ilike.%${escaped}%`)
        .join(',');
      query = query.or(orFilter);
    }

    // Status filter (if the table has a status column)
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data ?? [],
      meta: { total: count ?? 0, page, limit },
    } satisfies ListEnvelope<unknown>);
  };
}
