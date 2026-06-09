import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import type { EntityKey } from '@eventology/config';
import { ENTITY_CONFIG } from '@eventology/config';
import type { ZodSchema } from 'zod';
import type { ErrorEnvelope } from './list-handler';

// ---------------------------------------------------------------------------
// Helper: server-controlled fields that must never be updated by the client
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
  'is_approved', // D10-001: reviews moderation — admin-only via separate route
  'is_flagged',  // D10-001: reviews moderation — admin-only via separate route
  'flag_reason', // D10-001: reviews moderation — admin-only via separate route
  'last_message_at',
  'last_seen_at',
  'last_message',
  'read_by',
  'metadata', // handled per-entity if needed
]);

// ---------------------------------------------------------------------------
// Factory: createUpdateHandler
// ---------------------------------------------------------------------------

/**
 * Creates a PUT handler for a given entity.
 * Validates the request body with a Zod schema, enforces auth,
 * strips server-controlled fields, and updates the database row by ID.
 * RLS enforces ownership.
 *
 * @param entity - Entity key from ENTITY_CONFIG
 * @param schema - Zod schema for the update body (typically partial)
 */
export function createUpdateHandler<T>(entity: EntityKey, schema: ZodSchema<T>) {
  const config = ENTITY_CONFIG[entity];

  return async function PUT(
    req: NextRequest,
    { params }: { params: Promise<Record<string, string>> }
  ) {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: { code: 'MISSING_PARAM', message: 'Missing id' } } satisfies ErrorEnvelope,
        { status: 400 }
      );
    }

    // Use authenticated client so RLS resolves auth.uid() to the profile UUID
    const supabase = await createAuthedClient(session.user.id);

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

    // Update - RLS enforces ownership (organizer can only update their own events)
    const { data, error } = await supabase
      .from(config.table)
      .update(clientData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // Map RLS denial to 403
      if (error.code === 'PGRST116' || error.message.includes('row-level security')) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'Not authorized to update this resource' } } satisfies ErrorEnvelope,
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  };
}
