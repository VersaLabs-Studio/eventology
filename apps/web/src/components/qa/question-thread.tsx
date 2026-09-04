'use client';

// ============================================================================
// QuestionThread — the full Q&A surface for an event (HO-B)
// ============================================================================
// Composes AskQuestionForm + per-question vote/pin/hide/delete + AnswerList.
// Mounts as a section on the event detail page. Fails soft: if the endpoint
// errors the section hides (matches the event page's section conventions).
// ============================================================================

import * as React from "react";
import { motion } from "framer-motion";
import { EyeOff, MessageCircleQuestion, Pin, PinOff, Trash2, Triangle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useEventQa, useVoteQuestion, useUnvoteQuestion, useDeleteQuestion, useModerateQuestion } from "@/hooks/use-event-qa";
import { AskQuestionForm } from "./ask-question-form";
import { AnswerList } from "./answer-list";
import { useLocale } from "@/lib/i18n";
import { getInitials } from "@/lib/utils";

function formatQaDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function QuestionThread({ slug, eventId }: { slug: string; eventId: string }) {
  const { t } = useLocale();
  const { user, isAuthenticated } = useAuth();
  const { data, isLoading, isError } = useEventQa(slug);
  const { mutate: vote, isPending: voting } = useVoteQuestion();
  const { mutate: unvote, isPending: unvoting } = useUnvoteQuestion();
  const { mutate: deleteQuestion } = useDeleteQuestion();
  const { mutate: moderate } = useModerateQuestion();

  const questions = data?.data ?? [];
  const isHost = data?.viewer?.isHost ?? false;

  const toggleVote = (questionId: string, myVote: boolean) => {
    if (myVote) unvote(questionId, { onError: (e) => toast.error(e.message) });
    else vote(questionId, { onError: (e) => toast.error(e.message) });
  };

  const moderateWithToast = (args: { questionId: string; is_pinned?: boolean; is_hidden?: boolean }) => {
    moderate(args, { onError: (e) => toast.error(e.message) });
  };

  return (
    <section className="mt-8" aria-label={t("qa.title")}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-xl flex items-center gap-2">
          <MessageCircleQuestion className="h-5 w-5 text-primary" />
          {t("qa.title")}
          {data && (
            <span className="text-sm font-bold text-muted-foreground">({data.meta.total})</span>
          )}
        </h2>
      </div>

      {/* Composer */}
      <div className="mb-6">
        <AskQuestionForm eventId={eventId} />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        // Fail soft: the section collapses rather than blocking the page.
        null
      ) : questions.length === 0 ? (
        <div className="text-center py-8 rounded-xl bg-muted/30 border border-border/40">
          <MessageCircleQuestion className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{t("qa.empty")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => {
            const voteBusy = voting || unvoting;
            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`rounded-xl border p-4 transition-colors ${
                  q.is_pinned
                    ? "border-primary/40 bg-primary/5"
                    : "border-border/60 bg-card"
                } ${q.is_hidden ? "opacity-60" : ""}`}
              >
                <div className="flex items-start gap-3">
                  {/* Vote column */}
                  {isAuthenticated ? (
                    <button
                      onClick={() => toggleVote(q.id, q.my_vote)}
                      disabled={voteBusy}
                      aria-pressed={q.my_vote}
                      aria-label={q.my_vote ? t("qa.unvote") : t("qa.vote")}
                      className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-[44px] rounded-xl border transition-colors ${
                        q.my_vote
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40"
                      }`}
                    >
                      <Triangle className="h-3 w-3 fill-current" />
                      <span className="text-[11px] font-black tabular-nums">{q.upvotes}</span>
                    </button>
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center gap-0.5 min-w-[44px] rounded-xl border border-border/60 text-muted-foreground"
                      aria-label={`${q.upvotes} ${t("qa.votes")}`}
                    >
                      <Triangle className="h-3 w-3 fill-current" />
                      <span className="text-[11px] font-black tabular-nums">{q.upvotes}</span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {q.is_pinned && (
                        <Badge className="h-4 px-1.5 text-[9px] font-extrabold uppercase gap-0.5">
                          <Pin className="h-2.5 w-2.5" />
                          {t("qa.pinnedBadge")}
                        </Badge>
                      )}
                      {q.is_hidden && (
                        <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-bold uppercase">
                          <EyeOff className="h-2.5 w-2.5 mr-0.5" />
                          {t("qa.hiddenBadge")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground leading-snug mt-0.5 whitespace-pre-wrap break-words">
                      {q.body}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar size="sm" className="h-5 w-5">
                        {q.author?.avatar_url ? <AvatarImage src={q.author.avatar_url} alt="" /> : null}
                        <AvatarFallback className="text-[8px]">
                          {getInitials(q.author?.full_name ?? "?")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[11px] font-bold text-muted-foreground">
                        {q.author?.full_name ?? "?"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatQaDate(q.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Host controls: pin + hide (server rejects non-hosts 403) */}
                  {isHost && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary"
                        onClick={() => moderateWithToast({ questionId: q.id, is_pinned: !q.is_pinned })}
                        aria-label={q.is_pinned ? t("qa.unpin") : t("qa.pin")}
                      >
                        {q.is_pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                        onClick={() => moderateWithToast({ questionId: q.id, is_hidden: !q.is_hidden })}
                        aria-label={q.is_hidden ? t("qa.unhide") : t("qa.hide")}
                      >
                        <EyeOff className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}

                  {/* Author can always delete their own question; host too.
                      (RLS eq_delete_own_or_host scopes the actual delete.) */}
                  {isAuthenticated && (user?.id === q.author_id || isHost) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                      onClick={() => deleteQuestion(q.id, { onError: (e) => toast.error(e.message) })}
                      aria-label={t("qa.delete")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                <AnswerList questionId={q.id} answers={q.answers} />
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}
