'use client';

// ============================================================================
// AnnounceComposer — host-only live announcement input (HO-M)
// ============================================================================
// 1–500 chars (mirrors the DB CHECK + Zod). Posting returns the created
// row which the parent appends (deduped against the realtime echo).
// ============================================================================

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, SendHorizonal } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { toast } from "sonner";

const MAX_BODY = 500;

export function AnnounceComposer({
  onPost,
  posting,
}: {
  onPost: (body: string) => Promise<boolean>;
  posting: boolean;
}) {
  const { t } = useLocale();
  const [body, setBody] = React.useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) {
      toast.error(t("live.emptyBody"));
      return;
    }
    try {
      const ok = await onPost(trimmed);
      if (ok) setBody("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("live.postFailed"));
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={MAX_BODY}
        placeholder={t("live.placeholder")}
        aria-label={t("live.placeholder")}
        className="w-full min-h-[72px] rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          {body.length}/{MAX_BODY}
        </span>
        <Button type="submit" size="sm" variant="accent" className="rounded-xl font-bold" disabled={posting || !body.trim()}>
          {posting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
          ) : (
            <SendHorizonal className="h-4 w-4 mr-1.5" />
          )}
          {posting ? t("live.posting") : t("live.post")}
        </Button>
      </div>
    </form>
  );
}
