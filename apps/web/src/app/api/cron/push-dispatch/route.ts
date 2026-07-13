import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isAuthorizedCron } from '@/lib/cron';
import { pushUnsentNotifications } from '@/lib/comms/push-dispatch';

/**
 * GET /api/cron/push-dispatch — Push delivery sweep (Part 2 §7.2 close-out)
 *
 * Sends device pushes for in-app notifications created outside the notify()
 * pipeline (cron agents, SQL-side waitlist promotion). Idempotent via
 * notification metadata.pushed + existing push delivery rows.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } },
      { status: 401 }
    );
  }

  const supabase = createServiceClient();
  const result = await pushUnsentNotifications(supabase, { sinceHours: 48 });
  return NextResponse.json({ ok: true, ...result });
}
