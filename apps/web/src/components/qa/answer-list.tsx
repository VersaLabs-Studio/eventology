'use client';

// ============================================================================
// AnswerList — answers under a question, official-first (HO-B)
// ============================================================================
// Renders each answer with an "Organizer" badge when is_official. Own answers
// get hide/unhide + delete controls. Includes the inline answer form for
// signed-in users (attendees and hosts can both answer).
// ============================================================================

import * as React from "react";
import { motion } from "framer-motion";
import { BadgeCheck, EyeOff, Loader2, Send, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useLocale } from "@/lib/i18n";
import { getInitials } from "@/lib/utils";
import {
  useAnswerQuestion,
  useDeleteAnswer,
  useToggleAnswerVisibility,
  type QaAnswer,
} from "@/hooks/use-event-qa";

function formatQaDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function AnswerList({ questionId, answers }: { questionId: string; answers: QaAnswer[] }) {
  const { t } = useLocale();
  const { user, isAuthenticated } = useAuth();
  const { mutate: answer, isPending } = useAnswerQuestion(questionId);
  const { mutate: toggleVisibility } = useToggleAnswerVisibility();
  const { mutate: deleteAnswer } = useDeleteAnswer();

  const [draft, setDraft] = React.useState("");

  if (answers.length === 0 && !isAuthenticated) return null;

  const submit = () => {
    const trimmed = draft.trim();
    if (trimmed.length === 0) return;
    answer(trimmed, { onSuccess: () => setDraft("") });
  };

  return (
    <div className="mt-3 space-y-3 border-l-2 border-border/60 pl-4 ml-6">
      {answers.map((ans) => {
        const isOwn = user?.id === ans.author_id;
        return (
          <motion.div
            key={ans.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl bg-muted/30 border border-border/40 p-3"
          >
            <div className="flex items-start gap-2.5">
              <Avatar size="sm">
                {ans.author?.avatar_url ? <AvatarImage src={ans.author.avatar_url} alt="" /> : null}
                <AvatarFallback className="text-[10px]">
                  {getInitials(ans.author?.full_name ?? "?")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-foreground">
                    {ans.author?.full_name ?? t("qa.anonymous")}
                  </span>
                  {ans.is_official && (
                    <Badge className="h-4 px-1.5 text-[9px] font-extrabold uppercase gap-0.5">
                      <BadgeCheck className="h-2.5 w-2.5" />
                      {t("qa.organizerBadge")}
                    </Badge>
                  )}
                  {ans.is_hidden && (
                    <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-bold uppercase">
                      <EyeOff className="h-2.5 w-2.5 mr-0.5" />
                      {t("qa.hiddenBadge")}
                    </Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground">{formatQaDate(ans.created_at)}</span>
                </div>
                <p className="text-sm text-foreground/90 mt-1 whitespace-pre-wrap break-words">{ans.body}</p>

                {isOwn && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px] font-bold text-muted-foreground hover:text-foreground"
                      onClick={() => toggleVisibility({ answerId: ans.id, is_hidden: !ans.is_hidden })}
                    >
                      <EyeOff className="h-3 w-3 mr-1" />
                      {ans.is_hidden ? t("qa.unhide") : t("qa.hide")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px] font-bold text-muted-foreground hover:text-destructive"
                      onClick={() => deleteAnswer(ans.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      {t("qa.delete")}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}

      {isAuthenticated && (
        <div className="flex items-end gap-2 pt-1">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("qa.answerPlaceholder")}
            rows={2}
            maxLength={2000}
            className="min-h-[44px] text-sm rounded-xl resize-none"
            aria-label={t("qa.answerPlaceholder")}
          />
          <Button
            size="sm"
            className="h-[44px] rounded-xl font-bold shrink-0"
            onClick={submit}
            disabled={isPending || draft.trim().length === 0}
            aria-label={t("qa.answerButton")}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}

export function AnswerListSkeleton() {
  return (
    <div className="mt-3 space-y-3 border-l-2 border-border/60 pl-4 ml-6">
      <Skeleton className="h-16 w-full rounded-xl" />
    </div>
  );
}
