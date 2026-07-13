import { NextRequest } from 'next/server';

/**
 * Shared guard for /api/cron/* AI Workflow Agents (Part 2 §6.2).
 *
 * These routes are invoked by a scheduler (Vercel Cron / Supabase pg_cron),
 * never by a browser. Every request must carry `Authorization: Bearer
 * ${CRON_SECRET}`. Vercel Cron attaches this header automatically when
 * CRON_SECRET is set in the project env. If CRON_SECRET is unset we FAIL
 * CLOSED (deny) so an unconfigured deploy can't expose the endpoints.
 */
export function isAuthorizedCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get('authorization') ?? '';
  return header === `Bearer ${secret}`;
}
