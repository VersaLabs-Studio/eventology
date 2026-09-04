'use client';

// ============================================================================
// AskQuestionForm — composer for new questions on an event (HO-B)
// ============================================================================
// Signed-in gate: anonymous users get a sign-in prompt instead of the form.
// Validated client-side against the same 3..1000 bounds as the server schema.
// ============================================================================

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, MessageCircleQuestion, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useAskQuestion } from "@/hooks/use-event-qa";
import { useLocale } from "@/lib/i18n";

const MIN_LENGTH = 3;
const MAX_LENGTH = 1000;

export function AskQuestionForm({ eventId }: { eventId: string }) {
  const { t } = useLocale();
  const { isAuthenticated } = useAuth();
  const { mutate: ask, isPending } = useAskQuestion(eventId);

  const [draft, setDraft] = React.useState("");
  const trimmed = draft.trim();
  const canSubmit = trimmed.length >= MIN_LENGTH && trimmed.length <= MAX_LENGTH;

  if (!isAuthenticated) {
    return (
      <Link
        href="/auth/login"
        className="flex items-center justify-center gap-2 min-h-[48px] rounded-xl border border-dashed border-border text-sm font-bold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
      >
        <MessageCircleQuestion className="h-4 w-4" />
        {t("qa.signInToAsk")}
      </Link>
    );
  }

  const submit = () => {
    if (!canSubmit) return;
    ask(trimmed, {
      onSuccess: () => {
        setDraft("");
        toast.success(t("qa.questionPosted"));
      },
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={t("qa.askPlaceholder")}
        rows={3}
        maxLength={MAX_LENGTH}
        className="rounded-xl resize-none text-sm"
        aria-label={t("qa.askPlaceholder")}
      />
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
          {draft.length}/{MAX_LENGTH}
        </span>
        <Button
          size="sm"
          onClick={submit}
          disabled={isPending || !canSubmit}
          className="rounded-xl font-bold min-h-[40px]"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          {t("qa.askButton")}
        </Button>
      </div>
    </motion.div>
  );
}
