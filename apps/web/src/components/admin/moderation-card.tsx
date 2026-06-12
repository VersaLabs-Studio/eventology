"use client";

import * as React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, ShieldCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { AdminEventRow } from "@/app/api/protected/admin/events/pending/route";

interface ModerationCardProps {
  event: AdminEventRow;
  onApprove?: () => void;
  onReject?: () => void;
  isPending?: boolean;
}

export function ModerationCard({ event, onApprove, onReject, isPending }: ModerationCardProps) {
  const [showRejectDialog, setShowRejectDialog] = React.useState(false);
  const [reason, setReason] = React.useState("");

  const handleConfirmReject = () => {
    if (!reason.trim()) return;
    onReject?.();
    setShowRejectDialog(false);
    setReason("");
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <div className="relative h-40 sm:h-auto sm:w-48 shrink-0 bg-muted">
          {event.banner_image && (
            <Image src={event.banner_image} alt={event.title} fill className="object-cover" sizes="192px" />
          )}
        </div>
        <CardContent className="flex-1 p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="min-w-0">
              <h3 className="font-display font-semibold truncate">{event.title}</h3>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <span className="truncate">{event.organizer?.name ?? "—"}</span>
                {event.organizer?.is_verified && <ShieldCheck className="h-4 w-4 text-primary shrink-0" />}
              </div>
            </div>
            {event.category && <Badge variant="secondary">{event.category.name}</Badge>}
          </div>
          {event.short_description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{event.short_description}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Submitted: {formatDate(event.created_at)}</span>
            <span>Event: {formatDate(event.start_date)}</span>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Button size="sm" variant="default" onClick={onApprove} disabled={isPending}>
              <CheckCircle className="mr-1 h-4 w-4" /> Approve
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setShowRejectDialog(true)} disabled={isPending}>
              <XCircle className="mr-1 h-4 w-4" /> Reject
            </Button>
          </div>

          {showRejectDialog && (
            <div className="mt-3 p-3 rounded-lg bg-muted border border-border space-y-2">
              <textarea
                className="w-full min-h-[80px] rounded-lg border border-border bg-background p-2 text-sm"
                placeholder="Rejection reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={handleConfirmReject} disabled={isPending || !reason.trim()}>
                  Confirm Reject
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowRejectDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
