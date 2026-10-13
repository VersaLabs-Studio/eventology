'use client';

// ============================================================================
// SaveEventButton — bookmark toggle for an event (V1.6 HO-4)
// ============================================================================
// Reads the shared saved-id set (one request per page, however many cards)
// and flips it optimistically. Signed-out viewers are sent to log in and
// returned to the page they were on.
//
// `overlay` sits on top of imagery (cards, hero); `toolbar` matches the
// h-9 icon buttons in the event detail action row.
// ============================================================================

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useSavedEventIds, useSaveEvent, useUnsaveEvent } from "@/hooks/use-saved-events";
import { useLocale } from "@/lib/i18n";

interface SaveEventButtonProps {
  eventId: string;
  variant?: "overlay" | "toolbar";
  className?: string;
}

export function SaveEventButton({ eventId, variant = "overlay", className }: SaveEventButtonProps) {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { data: savedIds } = useSavedEventIds();
  const { mutate: save, isPending: saving } = useSaveEvent();
  const { mutate: unsave, isPending: unsaving } = useUnsaveEvent();

  const isSaved = savedIds?.has(eventId) ?? false;
  const label = isSaved ? t("saved.unsaveAria") : t("saved.saveAria");

  const onClick = (e: React.MouseEvent) => {
    // Cards wrap their content in a link; never let the toggle navigate.
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(pathname ?? "/")}`);
      return;
    }

    if (isSaved) {
      unsave(eventId, {
        onSuccess: () => toast.success(t("saved.removedToast")),
        onError: (err) => toast.error(err.message),
      });
    } else {
      save(eventId, {
        onSuccess: () => toast.success(t("saved.savedToast")),
        onError: (err) => toast.error(err.message),
      });
    }
  };

  const Icon = isSaved ? BookmarkCheck : Bookmark;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving || unsaving}
      aria-pressed={isSaved}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-70",
        variant === "overlay"
          ? "h-10 w-10 rounded-full border border-white/25 bg-black/35 text-white backdrop-blur-md hover:bg-black/55"
          : "h-9 w-9 rounded-lg border border-border/50 bg-muted/50 text-foreground hover:bg-muted hover:text-primary",
        isSaved && variant === "overlay" && "bg-primary/90 border-primary hover:bg-primary",
        isSaved && variant === "toolbar" && "text-primary border-primary/40 bg-primary/10",
        className
      )}
    >
      <Icon className={cn("h-4 w-4", isSaved && "fill-current")} aria-hidden="true" />
    </button>
  );
}
