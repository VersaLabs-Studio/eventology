'use client';

// ============================================================================
// Calendar Subscribe Card — tokenized ICS feed management (HO-K)
// ============================================================================
// Surface: /(public)/settings. Shows the active feed URL per kind
// (my_events / saved) with copy, rotate (POST — old URL dies with 410), and
// revoke (DELETE). The URL contains no identity — the token IS the secret,
// so it is revealed only here, on demand, for its owner.
// ============================================================================

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarFeedKeys } from "@eventology/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarPlus, Copy, RefreshCw, Trash2, CalendarRange } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n";

interface FeedToken {
  id: string;
  kind: 'my_events' | 'saved';
  token: string;
  created_at: string;
}

function useInvalidateFeed() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: CalendarFeedKeys.all() });
}

export function CalendarSubscribeCard() {
  const { t } = useLocale();
  const invalidate = useInvalidateFeed();

  const q = useQuery<{ data: FeedToken[] }>({
    queryKey: CalendarFeedKeys.mine(),
    queryFn: async () => {
      const res = await fetch('/api/protected/me/calendar-feed');
      if (!res.ok) throw new Error('load failed');
      return res.json();
    },
  });

  const rotate = useMutation<FeedToken, Error, Kind>({
    mutationFn: async (kind) => {
      const res = await fetch('/api/protected/me/calendar-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: { message?: string } }).error?.message ?? t('calendarFeed.rotateFailed'));
      }
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast.success(t('calendarFeed.rotated'));
    },
    onError: (e) => toast.error(e.message),
  });

  const revoke = useMutation<{ ok: boolean }, Error, Kind>({
    mutationFn: async (kind) => {
      const res = await fetch(`/api/protected/me/calendar-feed?kind=${kind}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(t('calendarFeed.revokeFailed'));
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast.success(t('calendarFeed.revoked'));
    },
    onError: () => toast.error(t('calendarFeed.revokeFailed')),
  });

  const copy = async (token: string) => {
    const url = feedUrl(token);
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('calendarFeed.copied'));
    } catch {
      toast.error(t('calendarFeed.copyFailed'));
    }
  };

  if (q.isLoading) {
    return <Skeleton className="h-48 w-full rounded-2xl" />;
  }
  if (q.isError) return null; // settings surface must not break over this card

  const tokens = q.data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display font-extrabold tracking-tight flex items-center gap-2">
          <CalendarRange className="h-5 w-5 text-primary" />
          {t('calendarFeed.title')}
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">{t('calendarFeed.description')}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <FeedRow
          kind="my_events"
          label={t('calendarFeed.myEvents')}
          hint={t('calendarFeed.myEventsHint')}
          token={tokens.find((tok) => tok.kind === 'my_events')?.token ?? null}
          copy={copy}
          onRotate={() => rotate.mutate('my_events')}
          onRevoke={() => revoke.mutate('my_events')}
          pending={rotate.isPending || revoke.isPending}
        />
        <FeedRow
          kind="saved"
          label={t('calendarFeed.saved')}
          hint={t('calendarFeed.savedHint')}
          token={tokens.find((tok) => tok.kind === 'saved')?.token ?? null}
          copy={copy}
          onRotate={() => rotate.mutate('saved')}
          onRevoke={() => revoke.mutate('saved')}
          pending={rotate.isPending || revoke.isPending}
        />
        <p className="text-xs text-muted-foreground">{t('calendarFeed.securityNote')}</p>
      </CardContent>
    </Card>
  );
}

type Kind = 'my_events' | 'saved';

function feedUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  return `${base}/api/public/calendar/${token}`;
}

function FeedRow({
  kind,
  label,
  hint,
  token,
  copy,
  onRotate,
  onRevoke,
  pending,
}: {
  kind: Kind;
  label: string;
  hint: string;
  token: string | null;
  copy: (token: string) => void;
  onRotate: () => void;
  onRevoke: () => void;
  pending: boolean;
}) {
  const { t } = useLocale();

  return (
    <div className="rounded-xl border border-border/60 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-semibold text-sm">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
        </div>
        {!token && (
          <Button size="sm" variant="outline" className="rounded-xl font-bold" onClick={onRotate} disabled={pending}>
            <CalendarPlus className="h-4 w-4 mr-1.5" />
            {t('calendarFeed.create')}
          </Button>
        )}
      </div>

      {token && (
        <>
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 border border-border/60 px-3 py-2">
            <code className="text-xs truncate flex-1 select-all" aria-label={`${label} URL`}>
              {t('calendarFeed.urlMasked')}
            </code>
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => copy(token)} aria-label={t('calendarFeed.copyUrl')}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="rounded-xl" onClick={onRotate} disabled={pending}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              {t('calendarFeed.rotate')}
            </Button>
            <Button size="sm" variant="ghost" className="rounded-xl text-destructive hover:text-destructive" onClick={onRevoke} disabled={pending}>
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              {t('calendarFeed.revoke')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
