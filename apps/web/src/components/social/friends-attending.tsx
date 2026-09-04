'use client';

// ============================================================================
// FriendsAttending — avatar stack of followed users registered for an event
// (HO-A). Mounted on the event detail page and the register page.
// ============================================================================
// Renders NOTHING when the viewer is signed out or no followed users are
// registered — absence is a normal state, not an error.
// ============================================================================

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { UserFollowKeys } from "@eventology/config";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { getInitials } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useLocale } from "@/lib/i18n";

interface SocialResponse {
  followers: number;
  following: number;
  friendsAttending: Array<{ id: string; full_name: string; avatar_url: string | null }>;
}

export function FriendsAttending({ eventId }: { eventId: string }) {
  const { t } = useLocale();
  const { isAuthenticated, user } = useAuth();

  const { data, isLoading } = useQuery<SocialResponse>({
    // Session-scoped server-side; the path id only satisfies the public route.
    queryKey: [...UserFollowKeys.byUser(user?.id ?? ""), "event", eventId],
    queryFn: async () => {
      const res = await fetch(`/api/public/users/${user?.id}/social?eventId=${eventId}`);
      if (!res.ok) throw new Error("Failed to load friends attending");
      return res.json();
    },
    enabled: isAuthenticated && !!user?.id && !!eventId,
    staleTime: 30_000,
  });

  if (!isAuthenticated || !user?.id) return null;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-4 w-32 mb-3" />
          <div className="flex -space-x-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-8 rounded-full ring-2 ring-background" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const friends = data?.friendsAttending ?? [];
  // Empty is normal: render nothing rather than an empty card.
  if (friends.length === 0) return null;

  const [first, ...rest] = friends;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2 shrink-0">
              {friends.slice(0, 5).map((friend) => (
                <span
                  key={friend.id}
                  className="relative h-8 w-8 rounded-full ring-2 ring-background overflow-hidden bg-primary/10"
                  title={friend.full_name}
                >
                  {friend.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={friend.avatar_url} alt={friend.full_name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="h-full w-full flex items-center justify-center text-[10px] font-black text-primary">
                      {getInitials(friend.full_name)}
                    </span>
                  )}
                </span>
              ))}
              {friends.length > 5 && (
                <span className="relative h-8 w-8 rounded-full ring-2 ring-background bg-muted flex items-center justify-center text-[10px] font-black text-muted-foreground">
                  +{friends.length - 5}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-snug">
              {rest.length > 0
                ? t("social.friendsAttendingMany", { name: first.full_name, count: rest.length })
                : t("social.friendsAttendingOne", { name: first.full_name })}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
