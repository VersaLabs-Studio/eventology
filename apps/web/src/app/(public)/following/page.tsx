"use client";

// ============================================================================
// /following — organizers the caller follows (V1.6 HO-4, signed-in)
// ============================================================================
// Same data as mobile (organizer_follows, migration 037). Each row carries
// the Follow toggle, so unfollowing happens in place.
// Golden template: (public)/lists/page.tsx.
// ============================================================================

import * as React from "react";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { BadgeCheck, CalendarDays, RefreshCw, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { FollowOrganizerButton } from "@/components/organizers/follow-organizer-button";
import { useAuth } from "@/hooks/use-auth";
import { useFollowedOrganizers, type FollowedOrganizer } from "@/hooks/use-organizer-follows";
import { getInitials } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

export default function FollowingPage() {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data, isLoading, isError, refetch } = useFollowedOrganizers();
  const organizers = data?.data ?? [];

  if (authLoading || (isAuthenticated && isLoading)) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-3">
        <Skeleton className="h-10 w-48 mb-3" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <PageHeader title={t("following.title")} description={t("following.subtitle")} />
        <EmptyState
          icon={Users}
          title={t("following.signInTitle")}
          description={t("following.signInBody")}
          action={{
            label: t("nav.login"),
            onClick: () => router.push(`/auth/login?redirect=${encodeURIComponent(pathname ?? "/following")}`),
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader
          title={t("following.title")}
          description={organizers.length > 0 ? t("following.count", { count: organizers.length }) : t("following.subtitle")}
        />

        {isError ? (
          <EmptyState
            icon={RefreshCw}
            title={t("following.loadErrorTitle")}
            description={t("common.error")}
            action={{ label: t("common.retry"), onClick: () => void refetch() }}
          />
        ) : organizers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={t("following.emptyTitle")}
            description={t("following.emptyBody")}
            action={{ label: t("saved.discover"), onClick: () => router.push("/discover") }}
          />
        ) : (
          <ul className="space-y-3">
            {organizers.map((organizer) => (
              <OrganizerRow key={organizer.id} organizer={organizer} />
            ))}
          </ul>
        )}
      </motion.div>
    </div>
  );
}

function OrganizerRow({ organizer }: { organizer: FollowedOrganizer }) {
  const { t } = useLocale();

  return (
    <motion.li initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-12 w-12 ring-1 ring-border shrink-0">
                <AvatarImage src={organizer.avatar_url ?? undefined} alt="" />
                <AvatarFallback className="font-bold bg-primary/10 text-primary">
                  {getInitials(organizer.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-bold text-sm text-foreground truncate flex items-center gap-1.5">
                  {organizer.name}
                  {organizer.is_verified && (
                    <BadgeCheck className="h-4 w-4 text-primary shrink-0" aria-label={t("following.verified")} />
                  )}
                </p>
                {organizer.bio && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{organizer.bio}</p>
                )}
                {organizer.events_count != null && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                    <CalendarDays className="h-3 w-3" aria-hidden="true" />
                    {t("common.eventsCount", { count: organizer.events_count })}
                  </p>
                )}
              </div>
            </div>
            <FollowOrganizerButton
              organizerId={organizer.id}
              organizerName={organizer.name}
              className="sm:w-auto w-full shrink-0"
            />
          </div>
        </CardContent>
      </Card>
    </motion.li>
  );
}
