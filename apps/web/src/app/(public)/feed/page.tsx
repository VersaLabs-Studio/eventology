"use client";

// ============================================================================
// /feed — Personalized Activity Feed (HO-A, signed-in gated)
// ============================================================================
// Golden template: (public)/my-events/page.tsx (list page shape) + factory
// hooks. Rows come from the materialized `feed_activities` read endpoint;
// visibility is RLS-enforced server-side.
// ============================================================================

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFeed } from "@/hooks/use-feed";
import { useAuth } from "@/hooks/use-auth";
import { FollowUserButton } from "@/components/social/follow-user-button";
import { getInitials } from "@/lib/utils";
import { DEFAULT_LOCALE, useLocale } from "@/lib/i18n";
import { Users, LogIn, Loader2, Bookmark, CalendarCheck, Star, UserPlus, Building2 } from "lucide-react";
import type { FeedItem, FeedVerb } from "@eventology/schemas";

const verbIcon: Record<FeedVerb, React.ComponentType<{ className?: string }>> = {
  saved_event: Bookmark,
  registered_event: CalendarCheck,
  reviewed_event: Star,
  followed_user: UserPlus,
  followed_organizer: Building2,
};

/** Compact relative timestamp ("3h ago") via the standard Intl API. */
function formatRelativeTime(dateStr: string): string {
  const rtf = new Intl.RelativeTimeFormat(DEFAULT_LOCALE, { numeric: "auto" });
  const diffMs = new Date(dateStr).getTime() - Date.now();
  const minutes = Math.round(diffMs / 60_000);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  const hours = Math.round(diffMs / 3_600_000);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  return rtf.format(Math.round(diffMs / 86_400_000), "day");
}

export default function FeedPage() {
  const { t } = useLocale();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const feed = useFeed({ limit: 20 });

  const items = React.useMemo(
    () => (feed.data?.pages.flatMap((page) => page.data) ?? []) as FeedItem[],
    [feed.data]
  );

  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        <Skeleton className="h-10 w-48" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <PageHeader title={t("feed.title")} description={t("feed.description")} />
          <EmptyState
            icon={LogIn}
            title={t("feed.signInRequired")}
            description={t("feed.signInDescription")}
            action={{ label: t("nav.login"), onClick: () => (window.location.href = "/auth/login") }}
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ staggerChildren: 0.07 }}
      >
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <PageHeader title={t("feed.title")} description={t("feed.description")} />
        </motion.div>

        {feed.isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Users}
            title={t("feed.emptyTitle")}
            description={t("feed.emptyDescription")}
            action={{ label: t("feed.browseEvents"), onClick: () => (window.location.href = "/events") }}
          />
        ) : (
          <>
            <div className="space-y-3">
              {items.map((item) => (
                <FeedItemCard key={item.id} item={item} />
              ))}
            </div>

            {feed.hasNextPage && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => feed.fetchNextPage()}
                  disabled={feed.isFetchingNextPage}
                  className="min-h-[44px] rounded-xl font-bold"
                >
                  {feed.isFetchingNextPage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("feed.loadMore")}
                </Button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}

function FeedItemCard({ item }: { item: FeedItem }) {
  const { t } = useLocale();
  const Icon = verbIcon[item.verb] ?? Bookmark;

  const actorName = item.actor?.full_name ?? t("feed.someone");
  // The activity's target label: an event title, a followed user, or an organizer.
  // (Cascade FKs guarantee the target row exists whenever the activity does.)
  const targetTitle =
    item.event?.title ??
    item.target_user?.full_name ??
    item.target_organizer?.name ??
    "";

  const targetHref = item.event
    ? `/events/${item.event.slug}`
    : item.target_organizer
      ? `/organizers/${item.target_organizer.slug}`
      : null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card hoverable>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="relative shrink-0">
              <Avatar size="default">
                {item.actor?.avatar_url ? (
                  <AvatarImage src={item.actor.avatar_url} alt={actorName} />
                ) : null}
                <AvatarFallback>{getInitials(actorName)}</AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center ring-2 ring-background">
                <Icon className="h-3 w-3" />
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground leading-snug">
                <span className="font-bold">{actorName}</span>{" "}
                {t(`feed.verb.${item.verb}`, { target: targetTitle })}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">{formatRelativeTime(item.created_at)}</p>
            </div>

            {/* Follow-back affordance when someone I follow follows a user */}
            {item.verb === "followed_user" && item.target_user && (
              <FollowUserButton userId={item.target_user.id} iconOnly />
            )}

            {item.event?.banner_image && targetHref && (
              <Link href={targetHref} className="shrink-0 hidden sm:block">
                <div className="relative h-14 w-14 rounded-lg overflow-hidden border border-border/40">
                  <Image
                    src={item.event.banner_image}
                    alt={item.event.title}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
