'use client';

// ============================================================================
// JoinOnlineButton — gated stream/meeting reveal for virtual/hybrid (HO-I)
// ============================================================================
// Fetches /api/protected/events/[id]/join-link, which serves the URL ONLY
// to confirmed attendees and hosts (403 otherwise). The URL never touches
// a public payload. Hybrid events show it next to the venue info; pure
// online events use it as the primary "venue".
// ============================================================================

import * as React from "react";
import { MonitorPlay, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n";

export function JoinOnlineButton({ eventId }: { eventId: string }) {
  const { t } = useLocale();
  const [pending, setPending] = React.useState(false);

  const join = async () => {
    setPending(true);
    try {
      const res = await fetch(`/api/protected/events/${eventId}/join-link`);
      if (res.status === 403) {
        toast.error(t("events.joinNotAttendee"));
        return;
      }
      if (!res.ok) {
        toast.error(t("events.joinFailed"));
        return;
      }
      const { url } = (await res.json()) as { url: string };
      window.open(url, "_blank", "noopener");
    } catch {
      toast.error(t("events.joinFailed"));
    } finally {
      setPending(false);
    }
  };

  return (
    <Button onClick={join} disabled={pending} className="w-full min-h-[44px] rounded-xl font-bold">
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <MonitorPlay className="h-4 w-4 mr-2" />
      )}
      {t("events.joinOnline")}
      <ExternalLink className="h-3.5 w-3.5 ml-2 opacity-60" />
    </Button>
  );
}
