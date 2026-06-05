import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import type { EntityKey } from '@eventology/config';
import { ENTITY_CONFIG } from '@eventology/config';
import type { ZodSchema } from 'zod';
import type { ErrorEnvelope } from './list-handler';

// ---------------------------------------------------------------------------
// Helper: server-controlled fields that must never come from the client
// ---------------------------------------------------------------------------

const SERVER_CONTROLLED_FIELDS = new Set([
  'id',
  'created_at',
  'updated_at',
  'status',
  'organizer_id',
  'profile_id',
  'user_id',
  'organizer_profile_id',
  'registrations_count',
  'views_count',
  'sold_count',
  'used_count',
  'is_featured',
  'featured_until',
  'rejection_reason',
  'verification_status',
  'verification_notes',
  'is_verified',
  'events_count',
  'total_attendees',
  'stripe_account_id',
  'paid_at',
  'refunded_at',
  'issued_at',
  'checked_in_at',
  'moderated_at',
  'moderated_by',
  'last_message_at',
  'last_seen_at',
  'last_message',
  'read_by',
  'metadata', // handled per-entity if needed
]);

// ---------------------------------------------------------------------------
// Factory: createCreateHandler
// ---------------------------------------------------------------------------

/**
 * Creates a POST handler for a given entity.
 * Validates the request body with a Zod schema, enforces auth,
 * forces server-controlled fields, and inserts into the database.
 *
 * @param entity - Entity key from ENTITY_CONFIG
 * @param schema - Zod schema for the request body
 */
export function createCreateHandler<T>(entity: EntityKey, schema: ZodSchema<T>) {
  const config = ENTITY_CONFIG[entity];

  return async function POST(req: NextRequest) {
    // Auth check
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
        { status: 401 }
      );
    }

    // Use authenticated client so RLS resolves auth.uid() to the profile UUID
    const supabase = await createAuthedClient(session.user.id);

    // Parse and validate body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: { code: 'INVALID_BODY', message: 'Request body must be valid JSON' } } satisfies ErrorEnvelope,
        { status: 400 }
      );
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: parsed.error.flatten(),
          },
        } satisfies ErrorEnvelope,
        { status: 400 }
      );
    }

    // Strip server-controlled fields from client input
    const clientData = { ...parsed.data } as Record<string, unknown>;
    for (const field of SERVER_CONTROLLED_FIELDS) {
      delete clientData[field];
    }

    // Entity-specific server-side injections
    if (entity === 'events') {
      // Resolve organizer_id from the caller's profile
      const { data: organizer } = await supabase
        .from('organizers')
        .select('id')
        .eq('profile_id', session.user.id)
        .maybeSingle();

      if (!organizer) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'No organizer profile found for this user' } } satisfies ErrorEnvelope,
          { status: 403 }
        );
      }

      clientData.organizer_id = organizer.id;
      clientData.status = 'draft'; // force initial status
    }

    // Insert
    const { data, error } = await supabase
      .from(config.table)
      .insert(clientData)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  };
}
