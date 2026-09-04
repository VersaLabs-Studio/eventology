'use client';

// ============================================================================
// EventGallery — attendee photo gallery (HO-F)
// ============================================================================
// Shows RLS-scoped media for an event (public: approved only; uploaders see
// their pending/hidden; hosts see + moderate everything). Reactions are
// idempotent toggles. Hides entirely when there are no photos and the viewer
// cannot upload.
// ============================================================================

import * as React from "react";
import { motion } from "framer-motion";
import { EyeOff, Heart, Images, Pin, Trash2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useEventMedia, useReactMedia, useModerateMedia, useDeleteMedia, type MediaItem } from "@/hooks/use-event-media";
import { useLocale } from "@/lib/i18n";
import { UploadPhotos } from "./upload-photos";

function MediaTile({
  media,
  isHost,
  onOpen,
}: {
  media: MediaItem;
  isHost: boolean;
  onOpen: () => void;
}) {
  const { t } = useLocale();
  const { isAuthenticated } = useAuth();
  const { mutate: react } = useReactMedia();
  const { mutate: moderate } = useModerateMedia();
  const { mutate: deleteMedia } = useDeleteMedia();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`group relative aspect-video overflow-hidden rounded-xl border ${
        media.status !== "approved" ? "opacity-60 border-dashed" : "border-border/40"
      }`}
    >
      <button onClick={onOpen} className="block h-full w-full" aria-label={media.caption ?? t("gallery.openPhoto")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={media.storage_path}
          alt={media.caption ?? t("gallery.openPhoto")}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </button>

      {/* Status badge for non-approved (visible to uploader/host only) */}
      {media.status !== "approved" && (
        <Badge variant="outline" className="absolute top-2 left-2 text-[9px] uppercase bg-background/80">
          <EyeOff className="h-2.5 w-2.5 mr-0.5" />
          {media.status === "pending" ? t("gallery.pendingBadge") : t("gallery.hiddenBadge")}
        </Badge>
      )}

      {/* Reaction pill */}
      <button
        onClick={() => {
          if (!isAuthenticated) {
            toast.error(t("gallery.signInToReact"));
            return;
          }
          react(
            { mediaId: media.id, react: !media.my_reaction },
            { onError: (e) => toast.error(e.message) }
          );
        }}
        className={`absolute bottom-2 left-2 flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold backdrop-blur-md transition-colors ${
          media.my_reaction
            ? "bg-destructive/90 text-white"
            : "bg-background/70 text-foreground hover:bg-background/90"
        }`}
        aria-pressed={media.my_reaction}
        aria-label={t("gallery.react")}
      >
        <Heart className={`h-3 w-3 ${media.my_reaction ? "fill-current" : ""}`} />
        <span className="tabular-nums">{media.reaction_count}</span>
      </button>

      {/* Host moderation + delete (own or host — server enforces) */}
      <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1">
        {isHost && media.status !== "approved" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg bg-background/80 text-foreground hover:text-primary"
            onClick={() => moderate({ mediaId: media.id, status: "approved" }, { onError: (e) => toast.error(e.message) })}
            aria-label={t("gallery.approve")}
          >
            <Pin className="h-3 w-3" />
          </Button>
        )}
        {isHost && media.status === "approved" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg bg-background/80 text-foreground hover:text-foreground"
            onClick={() => moderate({ mediaId: media.id, status: "hidden" }, { onError: (e) => toast.error(e.message) })}
            aria-label={t("gallery.hide")}
          >
            <EyeOff className="h-3 w-3" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg bg-background/80 text-foreground hover:text-destructive"
          onClick={() => deleteMedia(media.id, { onError: (e) => toast.error(e.message) })}
          aria-label={t("qa.delete")}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </motion.div>
  );
}

export function EventGallery({ slug }: { slug: string }) {
  const { t } = useLocale();
  const { isAuthenticated } = useAuth();
  const { data, isLoading } = useEventMedia(slug);
  const [openId, setOpenId] = React.useState<string | null>(null);

  const media = data?.data ?? [];
  const isHost = data?.viewer?.isHost ?? false;
  const open = media.find((m) => m.id === openId) ?? null;

  if (isLoading) {
    return (
      <section className="mt-8" aria-label={t("gallery.title")}>
        <h2 className="font-display font-semibold text-xl mb-4">{t("gallery.title")}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video w-full rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  // Nothing to show and the viewer can't contribute → collapse the section.
  if (media.length === 0 && !isAuthenticated) return null;

  return (
    <section className="mt-8" aria-label={t("gallery.title")}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-xl flex items-center gap-2">
          <Images className="h-5 w-5 text-primary" />
          {t("gallery.title")}
          {media.length > 0 && (
            <span className="text-sm font-bold text-muted-foreground">({media.length})</span>
          )}
        </h2>
        {isAuthenticated && <UploadPhotos slug={slug} />}
      </div>

      {media.length === 0 ? (
        <div className="text-center py-8 rounded-xl bg-muted/30 border border-border/40">
          <p className="text-sm text-muted-foreground">{t("gallery.empty")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {media.map((m) => (
            <MediaTile key={m.id} media={m} isHost={isHost} onOpen={() => setOpenId(m.id)} />
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-w-3xl p-2 bg-card/95 backdrop-blur-xl border-border/60">
          {open && (
            <div>
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={open.storage_path}
                  alt={open.caption ?? t("gallery.openPhoto")}
                  className="w-full max-h-[70vh] object-contain rounded-lg"
                />
              </div>
              {open.caption && (
                <p className="text-sm text-muted-foreground mt-2 px-2">{open.caption}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
