'use client';

// ============================================================================
// FollowUserButton — optimistic follow/unfollow toggle (HO-A)
// ============================================================================
// Initial state comes from the public social endpoint (`isFollowing`, present
// only for signed-in callers). Flips instantly on click; the mutation hooks
// roll back on failure and invalidate the follow + feed caches.
// ============================================================================

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { UserFollowKeys } from "@eventology/config";
import { UserCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useFollowUser, useUnfollowUser } from "@/hooks/use-user-follows";
import { useLocale } from "@/lib/i18n";

interface SocialResponse {
  followers: number;
  following: number;
  friendsAttending: Array<{ id: string; full_name: string; avatar_url: string | null }>;
  isFollowing?: boolean;
}

interface FollowUserButtonProps {
  userId: string;
  /** Hide the label, icon-only (still 44px touch target). */
  iconOnly?: boolean;
}

export function FollowUserButton({ userId, iconOnly = false }: FollowUserButtonProps) {
  const { t } = useLocale();
  const { isAuthenticated, user } = useAuth();
  const { mutate: follow, isPending: isFollowingPending } = useFollowUser();
  const { mutate: unfollow, isPending: isUnfollowingPending } = useUnfollowUser();

  // Viewer's own id — used to hide the button on one's own profile row.
  const selfId = user?.id;

  const { data: social } = useQuery<SocialResponse>({
    queryKey: UserFollowKeys.byUser(userId),
    queryFn: async () => {
      const res = await fetch(`/api/public/users/${userId}/social`);
      if (!res.ok) throw new Error("Failed to load social state");
      return res.json();
    },
    enabled: isAuthenticated && !!userId,
    staleTime: 30_000,
  });

  // Local optimistic flip seeded from the server state.
  const [optimisticFollowing, setOptimisticFollowing] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    setOptimisticFollowing(null);
  }, [social?.isFollowing]);

  if (!isAuthenticated) {
    return (
      <Link href="/auth/login">
        <Button variant="outline" size="sm" className="rounded-xl font-bold min-h-[44px]">
          {iconOnly ? <UserPlus className="h-4 w-4" /> : t("social.follow")}
        </Button>
      </Link>
    );
  }

  // Never offer a self-follow control.
  if (selfId === userId) return null;

  const isFollowing = optimisticFollowing ?? social?.isFollowing ?? false;
  const isPending = isFollowingPending || isUnfollowingPending;

  const toggle = () => {
    setOptimisticFollowing(!isFollowing);
    if (isFollowing) {
      unfollow(userId, { onError: () => setOptimisticFollowing(isFollowing) });
    } else {
      follow(userId, { onError: () => setOptimisticFollowing(isFollowing) });
    }
  };

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      className="rounded-xl font-bold min-h-[44px]"
      onClick={toggle}
      disabled={isPending}
      aria-pressed={isFollowing}
      aria-label={isFollowing ? t("social.unfollow") : t("social.follow")}
    >
      {isFollowing ? (
        <>
          <UserCheck className="h-4 w-4" />
          {!iconOnly && t("social.following")}
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          {!iconOnly && t("social.follow")}
        </>
      )}
    </Button>
  );
}
