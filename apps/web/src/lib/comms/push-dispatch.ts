// ============================================================================
// Push dispatch sweep — delivers device pushes for in-app notifications that
// were written OUTSIDE the notify() pipeline (cron agents, the SQL-side
// waitlist promotion, any direct `notifications` insert).
//
// Idempotency, two layers:
//   1. Rows already dispatched through notify() have a 'push' row in
//      notification_deliveries — those are skipped.
//   2. Every row the sweep processes gets metadata.pushed = true, so it is
//      never scanned twice (including users with no tokens or push disabled).
//
// Best-effort like the rest of the comms layer: never throws.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import { getChannelProvider } from './index';
import { loadUserAddress, loadUserPrefs } from './notify';
import type { ChannelAddress } from './provider';

interface SweepRow {
  id: string;
  user_id: string;
  title: string;
  message: string;
  action_url: string | null;
  metadata: Record<string, unknown> | null;
}

export interface PushSweepResult {
  scanned: number;
  sent: number;
  skippedNoTokens: number;
  skippedDisabled: number;
  failed: number;
}

export async function pushUnsentNotifications(
  supabase: SupabaseClient,
  opts: { sinceHours?: number; limit?: number } = {}
): Promise<PushSweepResult> {
  const sinceHours = opts.sinceHours ?? 48;
  const limit = opts.limit ?? 200;
  const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000).toISOString();

  const result: PushSweepResult = {
    scanned: 0,
    sent: 0,
    skippedNoTokens: 0,
    skippedDisabled: 0,
    failed: 0,
  };

  const { data: rows, error } = await supabase
    .from('notifications')
    .select('id, user_id, title, message, action_url, metadata')
    .gte('created_at', since)
    .is('metadata->pushed', null)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error || !rows || rows.length === 0) return result;

  const candidates = rows as SweepRow[];

  // Layer 1: skip anything notify() already pushed (delivery row exists).
  const { data: delivered } = await supabase
    .from('notification_deliveries')
    .select('notification_id')
    .eq('channel', 'push')
    .in('notification_id', candidates.map((r) => r.id));
  const alreadyPushed = new Set(
    (delivered ?? []).map((d) => (d as { notification_id: string }).notification_id)
  );

  // Per-user caches so a burst of notifications doesn't re-query tokens/prefs.
  const addressCache = new Map<string, ChannelAddress>();
  const pushEnabledCache = new Map<string, boolean>();
  const provider = getChannelProvider('push');

  for (const row of candidates) {
    result.scanned += 1;

    // Always stamp the row so it never rescans, whatever the outcome below.
    const markPushed = async () => {
      await supabase
        .from('notifications')
        .update({ metadata: { ...(row.metadata ?? {}), pushed: true } })
        .eq('id', row.id);
    };

    try {
      if (alreadyPushed.has(row.id)) {
        await markPushed();
        continue;
      }

      let pushEnabled = pushEnabledCache.get(row.user_id);
      if (pushEnabled === undefined) {
        const prefs = await loadUserPrefs(supabase, row.user_id);
        pushEnabled = prefs.channelPrefs.push;
        pushEnabledCache.set(row.user_id, pushEnabled);
      }
      if (!pushEnabled) {
        result.skippedDisabled += 1;
        await markPushed();
        continue;
      }

      let address = addressCache.get(row.user_id);
      if (!address) {
        address = await loadUserAddress(supabase, row.user_id);
        addressCache.set(row.user_id, address);
      }
      if (!address.pushTokens || address.pushTokens.length === 0) {
        result.skippedNoTokens += 1;
        await markPushed();
        continue;
      }

      const sendResult = await provider.send(address, {
        subject: row.title,
        textBody: (row.message ?? '').split('\n')[0]?.slice(0, 120) ?? '',
        metadata: { url: row.action_url ?? '/notifications' },
      });

      await supabase.from('notification_deliveries').insert({
        notification_id: row.id,
        channel: 'push',
        status: sendResult.success ? 'sent' : 'failed',
        provider: sendResult.providerName,
        provider_ref: sendResult.providerRef ?? null,
        ...(sendResult.success ? { sent_at: new Date().toISOString() } : {}),
        ...(sendResult.error ? { error: sendResult.error } : {}),
        attempts: 1,
      });

      if (sendResult.success) result.sent += 1;
      else result.failed += 1;
      await markPushed();
    } catch (err) {
      result.failed += 1;
      console.warn(
        `[push-dispatch] failed for notification ${row.id}:`,
        err instanceof Error ? err.message : 'Unknown error'
      );
      try {
        await markPushed();
      } catch {
        // Leave for the next sweep.
      }
    }
  }

  return result;
}
