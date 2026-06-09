"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ModerationCard } from "@/components/admin/moderation-card";
import { useEvents, useUpdateEvent } from "@/hooks/use-events";
import { useAdminReviews, useModerateReview } from "@/hooks/use-reviews";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShieldCheck, Star, Flag, Check, AlertOctagon, MessageSquare, Calendar } from "lucide-react";

export default function ModerationPage() {
  const [mode, setMode] = React.useState<"events" | "reviews">("events");
  const [tab, setTab] = React.useState("pending");

  // Events moderation queries
  const { data: pendingData, isLoading: pendingLoading, refetch: refetchPending } = useEvents({ limit: 50, status: "pending" });
  const { data: approvedData, isLoading: approvedLoading, refetch: refetchApproved } = useEvents({ limit: 50, status: "approved" });
  const { data: rejectedData, isLoading: rejectedLoading, refetch: refetchRejected } = useEvents({ limit: 50, status: "rejected" });

  const pendingEvents = pendingData?.data ?? [];
  const approvedEvents = approvedData?.data ?? [];
  const rejectedEvents = rejectedData?.data ?? [];

  const updateEvent = useUpdateEvent();

  const handleApproveEvent = (id: string) => {
    updateEvent.mutate(
      { id, data: { status: "approved" } },
      {
        onSuccess: () => {
          toast.success("Event approved and published.");
          refetchPending();
          refetchApproved();
        },
        onError: () => toast.error("Failed to approve event."),
      }
    );
  };

  const handleRejectEvent = (id: string) => {
    updateEvent.mutate(
      { id, data: { status: "rejected" } },
      {
        onSuccess: () => {
          toast("Event rejected. The organizer has been notified.");
          refetchPending();
          refetchRejected();
        },
        onError: () => toast.error("Failed to reject event."),
      }
    );
  };

  // Reviews moderation queries
  const { data: pendingReviewsData, isLoading: pendingReviewsLoading, refetch: refetchPendingReviews } = useAdminReviews("pending");
  const { data: approvedReviewsData, isLoading: approvedReviewsLoading, refetch: refetchApprovedReviews } = useAdminReviews("approved");
  const { data: flaggedReviewsData, isLoading: flaggedReviewsLoading, refetch: refetchFlaggedReviews } = useAdminReviews("flagged");

  const pendingReviews = pendingReviewsData?.data ?? [];
  const approvedReviews = approvedReviewsData?.data ?? [];
  const flaggedReviews = flaggedReviewsData?.data ?? [];

  const moderateReview = useModerateReview();

  const handleApproveReview = (id: string) => {
    moderateReview.mutate(
      { id, is_approved: true, is_flagged: false, flag_reason: null },
      {
        onSuccess: () => {
          toast.success("Review approved.");
          refetchPendingReviews();
          refetchApprovedReviews();
          refetchFlaggedReviews();
        },
        onError: () => toast.error("Failed to approve review."),
      }
    );
  };

  const handleFlagReview = (id: string, reason: string) => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for flagging.");
      return;
    }
    moderateReview.mutate(
      { id, is_approved: false, is_flagged: true, flag_reason: reason },
      {
        onSuccess: () => {
          toast.success("Review flagged.");
          refetchPendingReviews();
          refetchApprovedReviews();
          refetchFlaggedReviews();
        },
        onError: () => toast.error("Failed to flag review."),
      }
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title="Content Moderation"
        description="Review and publish events and user reviews."
      />

      {/* Mode Switcher */}
      <div className="flex gap-2 p-1 bg-muted rounded-xl w-fit mb-6 border border-border">
        <Button
          variant={mode === "events" ? "default" : "ghost"}
          className="font-bold rounded-lg px-6 h-9 text-sm"
          onClick={() => {
            setMode("events");
            setTab("pending");
          }}
        >
          <Calendar className="mr-2 h-4 w-4" /> Events ({pendingEvents.length})
        </Button>
        <Button
          variant={mode === "reviews" ? "default" : "ghost"}
          className="font-bold rounded-lg px-6 h-9 text-sm"
          onClick={() => {
            setMode("reviews");
            setTab("pending");
          }}
        >
          <MessageSquare className="mr-2 h-4 w-4" /> Reviews ({pendingReviews.length})
        </Button>
      </div>

      {mode === "events" ? (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="pending">Pending ({pendingEvents.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approvedEvents.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejectedEvents.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6 space-y-4">
            {pendingLoading && (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-xl" />
                ))}
              </div>
            )}
            {!pendingLoading && pendingEvents.length === 0 && (
              <EmptyState icon={ShieldCheck} title="No pending events" description="All events have been reviewed." />
            )}
            {!pendingLoading && pendingEvents.map((event) => (
              <ModerationCard
                key={event.id}
                event={event}
                onApprove={() => handleApproveEvent(event.id)}
                onReject={() => handleRejectEvent(event.id)}
              />
            ))}
          </TabsContent>

          <TabsContent value="approved" className="mt-6 space-y-4">
            {approvedLoading && (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            )}
            {!approvedLoading && approvedEvents.length === 0 && (
              <EmptyState icon={ShieldCheck} title="No approved events" description="No events are currently approved." />
            )}
            {!approvedLoading && approvedEvents.map((event) => (
              <div key={event.id} className="p-3.5 rounded-xl bg-card border border-border flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{event.title}</span>
                  <span className="text-xs text-muted-foreground">Organizer: {event.organizer.name}</span>
                </div>
                <Badge variant="success">Approved</Badge>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="rejected" className="mt-6 space-y-4">
            {rejectedLoading && (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            )}
            {!rejectedLoading && rejectedEvents.length === 0 && (
              <EmptyState icon={ShieldCheck} title="No rejected events" description="No events have been rejected." />
            )}
            {!rejectedLoading && rejectedEvents.map((event) => (
              <div key={event.id} className="p-3.5 rounded-xl bg-card border border-border flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{event.title}</span>
                  <span className="text-xs text-muted-foreground">Organizer: {event.organizer.name}</span>
                </div>
                <Badge variant="destructive">Rejected</Badge>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="pending">Pending ({pendingReviews.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approvedReviews.length})</TabsTrigger>
            <TabsTrigger value="flagged">Flagged ({flaggedReviews.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6 space-y-4">
            {pendingReviewsLoading && (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-xl" />
                ))}
              </div>
            )}
            {!pendingReviewsLoading && pendingReviews.length === 0 && (
              <EmptyState icon={ShieldCheck} title="No pending reviews" description="All reviews have been moderated." />
            )}
            {!pendingReviewsLoading && pendingReviews.map((review) => (
              <ReviewModCard
                key={review.id}
                review={review}
                onApprove={() => handleApproveReview(review.id)}
                onFlag={(reason) => handleFlagReview(review.id, reason)}
              />
            ))}
          </TabsContent>

          <TabsContent value="approved" className="mt-6 space-y-4">
            {approvedReviewsLoading && (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            )}
            {!approvedReviewsLoading && approvedReviews.length === 0 && (
              <EmptyState icon={ShieldCheck} title="No approved reviews" description="No reviews are approved yet." />
            )}
            {!approvedReviewsLoading && approvedReviews.map((review) => (
              <ReviewModCard
                key={review.id}
                review={review}
                onFlag={(reason) => handleFlagReview(review.id, reason)}
              />
            ))}
          </TabsContent>

          <TabsContent value="flagged" className="mt-6 space-y-4">
            {flaggedReviewsLoading && (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            )}
            {!flaggedReviewsLoading && flaggedReviews.length === 0 && (
              <EmptyState icon={ShieldCheck} title="No flagged reviews" description="No reviews have been flagged." />
            )}
            {!flaggedReviewsLoading && flaggedReviews.map((review) => (
              <ReviewModCard
                key={review.id}
                review={review}
                onApprove={() => handleApproveReview(review.id)}
              />
            ))}
          </TabsContent>
        </Tabs>
      )}
    </motion.div>
  );
}

interface ReviewModCardProps {
  review: any;
  onApprove?: () => void;
  onFlag?: (reason: string) => void;
}

function ReviewModCard({ review, onApprove, onFlag }: ReviewModCardProps) {
  const [showFlagInput, setShowFlagInput] = React.useState(false);
  const [reason, setReason] = React.useState("");

  return (
    <Card className="overflow-hidden border border-border bg-card">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">EVENT:</span>
              <span className="text-sm font-semibold hover:underline">
                {review.event?.title || "Unknown Event"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3.5 w-3.5 ${
                      star <= review.rating ? "fill-accent text-accent" : "text-muted-foreground/20"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground">
                ({review.rating} / 5)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {review.is_approved && <Badge variant="success">Approved</Badge>}
            {review.is_flagged && <Badge variant="destructive">Flagged</Badge>}
            {!review.is_approved && !review.is_flagged && <Badge variant="secondary">Pending Review</Badge>}
          </div>
        </div>

        <div className="space-y-1">
          {review.title && <h4 className="font-bold text-sm text-foreground">{review.title}</h4>}
          {review.content && <p className="text-xs text-muted-foreground leading-relaxed">{review.content}</p>}
        </div>

        {review.is_flagged && review.flag_reason && (
          <div className="p-3.5 rounded-xl bg-destructive/5 border border-destructive/10 text-xs text-destructive flex gap-2">
            <AlertOctagon className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Flagged Reason:</span> {review.flag_reason}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          {onApprove && (
            <Button size="sm" variant="default" className="font-bold" onClick={onApprove}>
              <Check className="mr-1 h-3.5 w-3.5" /> Approve
            </Button>
          )}

          {onFlag && (
            <Button size="sm" variant="outline" className="font-bold text-destructive hover:bg-destructive/5" onClick={() => setShowFlagInput(!showFlagInput)}>
              <Flag className="mr-1 h-3.5 w-3.5" /> Flag Review
            </Button>
          )}
        </div>

        {showFlagInput && (
          <div className="mt-3 p-3.5 rounded-xl bg-muted border border-border space-y-2">
            <textarea
              className="w-full min-h-[70px] rounded-lg border border-border bg-background p-2.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              placeholder="Reason for flagging (e.g. spam, inappropriate content)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" className="font-bold" onClick={() => { onFlag?.(reason); setShowFlagInput(false); }}>
                Confirm Flag
              </Button>
              <Button size="sm" variant="ghost" className="font-bold" onClick={() => setShowFlagInput(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
