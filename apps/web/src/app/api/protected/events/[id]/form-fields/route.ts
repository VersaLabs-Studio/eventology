import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import {
  createEventFormFieldSchema,
  updateEventFormFieldSchema,
  reorderEventFormFieldsSchema,
} from '@eventology/schemas';
import type { ErrorEnvelope, ListEnvelope } from '@/lib/api';

/**
 * /api/protected/events/[id]/form-fields — organizer custom registration
 * questions (HO-I).
 *
 *   GET    ?fieldId absent → ordered list for the builder (host UI)
 *   POST   create a field (appended at the end of the order)
 *   PATCH  ?fieldId=<uuid> → update label/type/options/required/position
 *   DELETE ?fieldId=<uuid> → remove a field (answers cascade)
 *
 * Host authorization is RLS truth: eff_write_host requires
 * fn_is_event_host; eff_select_all makes GET public-read but this route
 * keeps the list host-scoped for the builder UI (the public render path is
 * /api/public/events/[slug]/form-fields).
 */

// POST / PATCH / DELETE share the fieldId query param.
async function requireFieldId(req: NextRequest): Promise<string | null> {
  return req.nextUrl.searchParams.get('fieldId');
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: _req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'Missing event id' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);

  // Host gate for the builder surface (RLS would allow public reads; the
  // builder is host-only by tier placement). fn_is_event_host (039).
  const { data: isHost } = await supabase.rpc('fn_is_event_host', {
    p_event_id: id,
    p_user: session.user.id,
  });
  if (isHost !== true) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Not the host of this event' } } satisfies ErrorEnvelope,
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from('event_form_fields')
    .select('*')
    .eq('event_id', id)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: data ?? [],
    meta: { total: data?.length ?? 0, page: 1, limit: 100 },
  } satisfies ListEnvelope<unknown>);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
      { error: { code: 'MISSING_PARAM', message: 'Missing event id' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Request body must be valid JSON' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const parsed = createEventFormFieldSchema.safeParse(body);
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

  const supabase = await createAuthedClient(session.user.id);

  // Append at the end unless an explicit position was provided.
  let position = parsed.data.position;
  if (position === undefined) {
    const { count } = await supabase
      .from('event_form_fields')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', id);
    position = count ?? 0;
  }

  const { data, error } = await supabase
    .from('event_form_fields')
    .insert({
      event_id: id, // from the URL — never the client
      label: parsed.data.label,
      field_type: parsed.data.field_type,
      options: parsed.data.options ?? null,
      required: parsed.data.required,
      position,
    })
    .select()
    .single();

  if (error) {
    // eff_write_host RLS denial → caller is not a host.
    if (error.code === '42501' || error.message.includes('row-level security')) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Not the host of this event' } } satisfies ErrorEnvelope,
        { status: 403 }
      );
    }
    // FK violation → event does not exist.
    if (error.code === '23503') {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Event not found' } } satisfies ErrorEnvelope,
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const { id } = await params;
  const fieldId = await requireFieldId(req);
  if (!id || !fieldId) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'event id and fieldId are required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Request body must be valid JSON' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const parsed = updateEventFormFieldSchema.safeParse(body);
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

  const supabase = await createAuthedClient(session.user.id);

  const { data, error } = await supabase
    .from('event_form_fields')
    .update(parsed.data)
    .eq('id', fieldId)
    .eq('event_id', id) // scope to the URL event — field theft across events impossible
    .select()
    .single();

  if (error) {
    if (error.code === '42501' || error.message.includes('row-level security')) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Not the host of this event' } } satisfies ErrorEnvelope,
        { status: 403 }
      );
    }
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Field not found' } } satisfies ErrorEnvelope,
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const { id } = await params;
  const fieldId = await requireFieldId(req);
  if (!id || !fieldId) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'event id and fieldId are required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);

  const { error } = await supabase
    .from('event_form_fields')
    .delete()
    .eq('id', fieldId)
    .eq('event_id', id);

  if (error) {
    if (error.code === '42501' || error.message.includes('row-level security')) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Not the host of this event' } } satisfies ErrorEnvelope,
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

/**
 * PUT — reorder. Body: { field_ids: [...] } — the full ordered list; the
 * route reindexes positions to match (the ordered-list designer).
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
      { error: { code: 'MISSING_PARAM', message: 'Missing event id' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Request body must be valid JSON' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const parsed = reorderEventFormFieldsSchema.safeParse(body);
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

  const supabase = await createAuthedClient(session.user.id);

  // Sequential update — event-scoped + host RLS guards each row.
  for (let i = 0; i < parsed.data.field_ids.length; i++) {
    const { error } = await supabase
      .from('event_form_fields')
      .update({ position: i })
      .eq('id', parsed.data.field_ids[i])
      .eq('event_id', id);
    if (error) {
      if (error.code === '42501' || error.message.includes('row-level security')) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'Not the host of this event' } } satisfies ErrorEnvelope,
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}
