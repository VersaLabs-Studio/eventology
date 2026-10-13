'use client';

// ============================================================================
// FollowOrganizerButton — attendee → organizer follow toggle (V1.6 HO-4)
// ============================================================================
// Backed by migration 037 (organizer_follows), not the HO-A person-to-person
// graph. Reads the shared followed-id set and flips it optimistically.
// ============================================================================

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { UserCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  useFollowedOrganizerIds,
  useFollowOrganizer,
  useUnfollowOrganizer,
} from "@/hooks/use-organizer-follows";
import { useLocale } from "@/lib/i18n";

interface FollowOrganizerButtonProps {
  organizerId: string;
  organizerName: string;
  className?: string;
}

export function FollowOrganizerButton({ organizerId, organizerName, className }: FollowOrganizerButtonProps) {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { data: followedIds } = useFollowedOrganizerIds();
  const { mutate: follow, isPending: following } = useFollowOrganizer();
  const { mutate: unfollow, isPending: unfollowing } = useUnfollowOrganizer();

  // Organizer joins can come back null under RLS; the transformer then yields an empty id.
  if (!organizerId) return null;

  const isFollowing = followedIds?.has(organizerId) ?? false;
  const name = { name: organizerName };

  const onClick = () => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(pathname ?? "/")}`);
      return;
    }
    if (isFollowing) {
      unfollow(organizerId, {
        onSuccess: () => toast.success(t("following.unfollowedToast", name)),
        onError: (err) => toast.error(err.message),
      });
    } else {
      follow(organizerId, {
        onSuccess: () => toast.success(t("following.followedToast", name)),
        onError: (err) => toast.error(err.message),
      });
    }
  };

  return (
    <Button
      type="button"
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      onClick={onClick}
      disabled={following || unfollowing}
      aria-pressed={isFollowing}
      aria-label={isFollowing ? t("following.unfollowAria", name) : t("following.followAria", name)}
      className={cn("rounded-xl font-bold min-h-[44px]", className)}
    >
      {isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
      {isFollowing ? t("following.following") : t("following.follow")}
    </Button>
  );
}
