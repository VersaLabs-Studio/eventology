"use client";

import * as React from "react";
import { Star, MessageSquare, Plus, AlertTriangle, ShieldCheck, Check, ThumbsUp, Users, Calendar, Clock, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEventReviews, useCreateReview } from "@/hooks/use-reviews";
import { useMyRegistrations } from "@/hooks/use-registrations";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface EventReviewsProps {
  event: {
    id: string;
    slug: string;
    title: string;
    end_date?: string;
    date?: string;
  };
}

export function EventReviews({ event }: EventReviewsProps) {
  const [page, setPage] = React.useState(1);
  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = React.useState(5);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [isSubmittingLocal, setIsSubmittingLocal] = React.useState(false);
  const [hoveredStar, setHoveredStar] = React.useState(0);

  const { data, isLoading, isError, refetch } = useEventReviews(event.slug, page, 5);
  const { data: myRegs, isLoading: regLoading } = useMyRegistrations();
  const { isAuthenticated, user } = useAuth();
  const createReview = useCreateReview();

  // Check if current user registered for this event and has not cancelled
  const userRegistration = myRegs?.data?.find(
    (r) => r.event_id === event.id && r.status !== "cancelled"
  );

  const hasAttended = !!userRegistration;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      toast.error("Please select a star rating.");
      return;
    }

    setIsSubmittingLocal(true);
    createReview.mutate(
      {
        event_id: event.id,
        rating,
        title: title.trim() || undefined,
        content: content.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Review submitted! It will appear after moderation.");
          setOpen(false);
          // reset form
          setRating(5);
          setTitle("");
          setContent("");
          refetch();
        },
        onError: (err: Error & { status?: number; code?: string }) => {
          if (err.status === 409 || err.code === "ALREADY_REVIEWED") {
            toast.error("You have already reviewed this event.");
          } else {
            toast.error(err.message || "Failed to submit review.");
          }
        },
        onSettled: () => {
          setIsSubmittingLocal(false);
        },
      }
    );
  };

  const reviews = data?.data ?? [];
  const aggregate = data?.aggregate ?? { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  const totalReviews = aggregate.count;

  return (
    <div className="mt-12 border-t border-border pt-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display font-semibold text-2xl flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" /> Attendee Reviews
          </h2>
          <p className="text-muted-foreground text-sm">
            Hear from verified attendees of this event.
          </p>
        </div>

        {isAuthenticated ? (
          hasAttended ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow">
                  <Plus className="h-4 w-4" /> Write a Review
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-card border border-border shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="font-display">Write a Review</DialogTitle>
                  <DialogDescription>
                    Share your experience attending &ldquo;{event.title}&rdquo;.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Rating</Label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoveredStar(star)}
                          onMouseLeave={() => setHoveredStar(0)}
                          className="focus:outline-none transition-transform active:scale-90"
                          whileTap={{ scale: 0.9 }}
                          whileHover={{ scale: 1.1 }}
                        >
                          <Star
                            className={`h-7 w-7 transition-all duration-200 ${star <= (hoveredStar || rating)
                                ? "fill-accent text-accent scale-110" : "text-muted-foreground hover:text-accent"
                            }`}
                          />
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="review-title">Title (Optional)</Label>
                    <Input
                      id="review-title"
                      placeholder="Summarize your review"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={255}
                      className="bg-muted/50 transition-all focus:bg-muted/80"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="review-content">Review Description (Optional)</Label>
                    <Textarea
                      id="review-content"
                      placeholder="What did you think of the event? Venue, speakers, organization, etc."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      maxLength={5000}
                      rows={4}
                      className="bg-muted/50 transition-all focus:bg-muted/80 resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full font-bold min-h-[44px] shadow-lg hover:shadow-xl transition-shadow"
                    disabled={isSubmittingLocal}
                  >
                    {isSubmittingLocal ? "Submitting..." : "Submit Review"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          ) : (
            <div className="text-sm px-4 py-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500/90 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Only verified attendees can submit reviews.</span>
            </div>
          )
        ) : (
          <div className="text-sm px-4 py-2.5 rounded-lg bg-muted/50 border border-border text-muted-foreground flex items-center gap-2">
            <span>Please login to submit a review.</span>
          </div>
        )}
      </div>

      {/* Aggregate stars display */}
      {totalReviews > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-[30%_70%] gap-8 p-8 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/80 shadow-lg mb-8 hover:shadow-xl transition-shadow"
        >
          <div className="flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-border pb-6 md:pb-0 md:pr-6">
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 15 }}
              className="text-5xl font-extrabold tracking-tight text-foreground"
            >
              {aggregate.average}
            </motion.span>
            <div className="flex items-center gap-0.5 my-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.div
                  key={star}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + star * 0.05 }}
                >
                  <Star
                    className={`h-5 w-5 transition-all ${star <= Math.round(aggregate.average) ? "fill-accent text-accent" : "text-muted-foreground/30"}`}
                  />
                </motion.div>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-primary/60" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {totalReviews} verified {totalReviews === 1 ? "review" : "reviews"}
              </span>
            </div>
          </div>

          <div className="space-y-3 flex flex-col justify-center">
            {([5, 4, 3, 2, 1] as const).map((stars) => {
              const count = aggregate.distribution[stars] || 0;
              const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <motion.div
                  key={stars}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + (6 - stars) * 0.05 }}
                  className="flex items-center gap-3 text-sm group"
                >
                  <span className="w-3 font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{stars}</span>
                  <Star className="h-4 w-4 text-accent fill-accent shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="flex-1 relative">
                    <Progress value={percent} className="h-2.5" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-foreground/70">
                        {percent > 10 ? `${percent.toFixed(0)}%` : ""}
                      </span>
                    </div>
                  </div>
                  <span className="w-10 text-right text-xs text-muted-foreground font-medium group-hover:text-foreground transition-colors">{count}</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      ) : null}

      {/* Reviews List */}
      {isLoading ? (
        <div className="space-y-5">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/70 space-y-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </motion.div>
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-8 rounded-2xl border border-dashed border-border/80 bg-destructive/5">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1 text-foreground">Failed to load reviews</h3>
              <p className="text-xs text-muted-foreground">Please try again later</p>
            </div>
          </div>
        </div>
      ) : reviews.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center py-16 rounded-3xl border border-dashed border-border/80 bg-muted/30 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <div>
              <h3 className="font-semibold text-base mb-2 text-foreground">No reviews yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                {hasAttended
                  ? "You attended this event! Be the first to share your thoughts."
                  : "There are no reviews for this event yet."
                }
              </p>
            </div>
            {hasAttended && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => setOpen(true)}
                  variant="outline"
                  className="mt-2 font-medium"
                >
                  <Plus className="mr-2 h-4 w-4" /> Write Review
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            {reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 30 }}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/70 hover:border-border/50 transition-all space-y-3 shadow-sm hover:shadow-md group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar size="sm" className="ring-2 ring-primary/20 ring-offset-2 ring-offset-card">
                      <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-accent/20">
                        {getInitials("Attendee")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">Verified Attendee</span>
                        <span className="inline-flex items-center gap-0.5 text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-success/20">
                          <BadgeCheck className="h-2.5 w-2.5" /> Verified
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Calendar className="h-3 w-3 text-muted-foreground/60" />
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {new Date(review.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 bg-muted/30 px-2 py-1 rounded-full">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3.5 w-3.5 transition-all ${star <= review.rating ? "fill-accent text-accent" : "text-muted-foreground/20"}`}
                      />
                    ))}
                  </div>
                </div>

                {review.title && (
                  <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                    {review.title}
                  </h4>
                )}
                {review.content && (
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {review.content}
                  </p>
                )}
              </motion.div>
            ))}

            {/* Simple Pagination */}
            {data && data.meta.total > 5 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-between pt-6 border-t border-border/50"
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="font-medium hover:bg-muted/50 transition-colors"
                >
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground bg-muted/30 px-3 py-1 rounded-full">
                  Page {page} of {Math.ceil(data.meta.total / 5)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * 5 >= data.meta.total}
                  className="font-medium hover:bg-muted/50 transition-colors"
                >
                  Next
                </Button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}