import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedCron } from '@/lib/cron';
import { GET as runTrending } from '../trending/route';
import { GET as runModeration } from '../moderation/route';
import { GET as runStaleDrafts } from '../stale-drafts/route';
import { GET as runRecaps } from '../recaps/route';
import { GET as runPushDispatch } from '../push-dispatch/route';

/**
 * GET /api/cron/daily — Vercel-Hobby orchestrator.
 *
 * The Hobby plan allows only 2 cron jobs, each daily. This route runs the
 * agents that would otherwise each need their own schedule (trending,
 * moderation, stale-drafts, recaps, push-dispatch) in sequence, reusing
 * their handlers directly — no logic duplication. Every agent is
 * idempotent (metadata dedup keys), so daily cadence is safe, just coarser.
 * On the Pro plan, restore the granular per-agent schedule recorded in
 * docs/V1.5_PLAN.md and drop this route from vercel.json.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const AGENTS: Array<[string, (req: NextRequest) => Promise<Response>]> = [
  ['trending', runTrending],
  ['moderation', runModeration],
  ['stale-drafts', runStaleDrafts],
  ['recaps', runRecaps],
  ['push-dispatch', runPushDispatch],
];

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } },
      { status: 401 }
    );
  }

  const results: Record<string, unknown> = {};
  for (const [name, run] of AGENTS) {
    try {
      // The incoming request already carries the cron authorization, so the
      // child handlers' own guards pass on the same request object.
      const res = await run(req);
      results[name] = { status: res.status, body: await res.json() };
    } catch (err) {
      results[name] = {
        status: 500,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  return NextResponse.json({ ok: true, results });
}
