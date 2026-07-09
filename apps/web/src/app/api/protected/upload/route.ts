import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createAuthedClient } from '@/lib/supabase/server';
import type { ErrorEnvelope } from '@/lib/api';

// ============================================================================
// POST /api/protected/upload
// Proxy for Supabase Storage uploads. The browser client cannot upload
// directly because it has no Supabase session (auth is better-auth), so
// auth.uid() would be null and the storage RLS (own-folder write) would deny.
// This route authenticates via better-auth, then uploads with the
// server-signed Supabase JWT (createAuthedClient) so RLS resolves
// auth.uid() = the caller's profile id. The upload path prefix is forced to
// the caller's id server-side — never trusted from the client.
// ============================================================================

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = /^image\//;

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Expected multipart form data' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const file = form.get('file');
  const bucket = typeof form.get('bucket') === 'string' && form.get('bucket') ? (form.get('bucket') as string) : 'event-banners';

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'No file provided' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }
  if (!ALLOWED.test(file.type)) {
    return NextResponse.json(
      { error: { code: 'INVALID_FILE', message: 'Only image files are allowed' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: { code: 'FILE_TOO_LARGE', message: 'File must be 5MB or smaller' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const ext = file.name.includes('.') ? file.name.split('.').pop()! : 'png';
  const fileName = `${crypto.randomUUID()}.${ext}`;
  // Server-forced prefix — RLS requires foldername[1] === auth.uid().
  const path = `${session.user.id}/${fileName}`;

  const supabase = await createAuthedClient(session.user.id);
  const arrayBuffer = await file.arrayBuffer();
  const { error: upErr } = await supabase.storage
    .from(bucket)
    .upload(path, arrayBuffer, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (upErr) {
    return NextResponse.json(
      { error: { code: 'UPLOAD_FAILED', message: upErr.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({ url: urlData.publicUrl });
}
