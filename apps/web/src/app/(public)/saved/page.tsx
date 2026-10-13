"use client";

// ============================================================================
// /saved — the caller's bookmarked events (V1.6 HO-4, signed-in)
// ============================================================================
// Same data as the mobile Saved screen (saved_events, migration 036). Cards
// carry their own Save toggle, so unsaving happens in place.
// Golden template: (public)/lists/page.tsx.
// ============================================================================

import * as React from "react";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { Bookmark, CalendarSearch, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { EventCard } from "@/components/shared/event-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useSavedEvents } from "@/hooks/use-saved-events";
import { transformEvent } from "@/lib/transformers";
import { useLocale } from "@/lib/i18n";

export default function SavedEventsPage() {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data, isLoading, isError, refetch } = useSavedEvents();

  const events = React.useMemo(
    () => (data?.data ?? []).map((raw) => transformEvent(raw as Parameters<typeof transformEvent>[0])),
    [data]
  );

  if (authLoading || (isAuthenticated && isLoading)) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-10 w-56 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader title={t("saved.title")} description={t("saved.subtitle")} />
        <EmptyState
          icon={Bookmark}
          title={t("saved.signInTitle")}
          description={t("saved.signInBody")}
          action={{
            label: t("nav.login"),
            onClick: () => router.push(`/auth/login?redirect=${encodeURIComponent(pathname ?? "/saved")}`),
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader
          title={t("saved.title")}
          description={events.length > 0 ? t("saved.count", { count: events.length }) : t("saved.subtitle")}
        />

        {isError ? (
          <EmptyState
            icon={RefreshCw}
            title={t("saved.loadErrorTitle")}
            description={t("common.error")}
            action={{ label: t("common.retry"), onClick: () => void refetch() }}
          />
        ) : events.length === 0 ? (
          <EmptyState
            icon={CalendarSearch}
            title={t("saved.emptyTitle")}
            description={t("saved.emptyBody")}
            action={{ label: t("saved.discover"), onClick: () => router.push("/discover") }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
