'use client';

// ============================================================================
// LivePanel — the live event layer (HO-M)
// ============================================================================
// Mounts ONLY within the server-computed live window (start_date <= now <=
// end_date — LOCKED: the panel receives `isLive`; it never computes the
// window client-side). Renders the realtime announcement stream (attendee +
// host), the polled attendee count, and — host only — the composer.
// Connection states are explicit: connecting → loading → live | error.
// ============================================================================

import { motion } from "framer-motion";
import { Radio, Loader2, AlertCircle, Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLiveEvent } from "@/lib/hooks/use-live-event";
import { LiveAttendeeCount } from "@/components/live/live-attendee-count";
import { AnnounceComposer } from "@/components/live/announce-composer";
import { useLocale } from "@/lib/i18n";

export function LivePanel({ eventId, isLive }: { eventId: string; isLive: boolean }) {
  const { t } = useLocale();
  const { announcements, status, isHost, post, posting } = useLiveEvent(eventId, isLive);

  // LOCKED: the live panel mounts only in the live window.
  if (!isLive) return null;

  return (
    <Card className="border-primary/30 shadow-glow">
      <CardHeader>
        <CardTitle className="font-display font-extrabold tracking-tight flex items-center gap-2 flex-wrap">
          <span className="relative flex h-3 w-3" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
          </span>
          {t("live.title")}
          {status === "live" && <LiveAttendeeCount eventId={eventId} />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === "connecting" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("live.connecting")}
          </div>
        )}

        {status === "loading" && (
          <div className="space-y-2" aria-busy="true">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}

        {status === "error" && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            {t("live.error")}
          </div>
        )}

        {status === "live" && (
          <>
            {/* Host-only composer */}
            {isHost && (
              <div className="rounded-xl border border-border/60 p-3">
                <p className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Megaphone className="h-3.5 w-3.5" />
                  {t("live.composerTitle")}
                </p>
                <AnnounceComposer onPost={post} posting={posting} />
              </div>
            )}

            {/* Announcement stream */}
            {announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {isHost ? t("live.emptyHost") : t("live.empty")}
              </p>
            ) : (
              <ul className="space-y-2.5" aria-live="polite" aria-label={t("live.title")}>
                {announcements.map((a) => (
                  <motion.li
                    key={a.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-border/60 bg-muted/30 px-3.5 py-2.5"
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{a.body}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {new Date(a.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </motion.li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
