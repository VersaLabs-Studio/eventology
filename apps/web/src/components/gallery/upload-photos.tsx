'use client';

// ============================================================================
// UploadPhotos — attendee photo upload trigger (HO-F)
// ============================================================================
// Thin trigger over useUploadMedia: picks multiple images, runs them through
// the EXISTING /api/protected/upload seam (bucket 'event-media', image-only,
// 5MB), then registers the metadata rows. The server attendee-gates the
// registration (403 NOT_ATTENDED surfaces as a toast).
// ============================================================================

import * as React from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUploadMedia } from "@/hooks/use-event-media";
import { useLocale } from "@/lib/i18n";

export function UploadPhotos({ slug }: { slug: string }) {
  const { t } = useLocale();
  const { mutate: upload, isPending } = useUploadMedia(slug);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ''; // allow re-picking the same file
    if (files.length === 0) return;

    const tooBig = files.find((f) => f.size > 5 * 1024 * 1024);
    if (tooBig) {
      toast.error(t("gallery.fileTooLarge"));
      return;
    }

    upload(
      { files },
      {
        onSuccess: () => toast.success(t("gallery.uploaded", { count: files.length })),
        onError: (err) => toast.error(err.message),
      }
    );
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={pick}
        aria-hidden="true"
        tabIndex={-1}
      />
      <Button
        variant="outline"
        size="sm"
        className="rounded-xl font-bold min-h-[36px]"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
        ) : (
          <ImagePlus className="h-4 w-4 mr-1.5" />
        )}
        {t("gallery.upload")}
      </Button>
    </>
  );
}
