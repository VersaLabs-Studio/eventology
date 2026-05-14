"use client";

import * as React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, ShieldCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Event } from "@/lib/types";

interface ModerationCardProps {
  event: Event;
  onApprove?: () => void;
  onReject?: () => void;
}

export function ModerationCard({ event, onApprove, onReject }: ModerationCardProps) {
  const [showRejectDialog, setShowRejectDialog] = React.useState(false);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <div className="relative h-40 sm:h-auto sm:w-48 shrink-0">
          <Image src={event.bannerImage} alt={event.title} fill className="object-cover" sizes="192px" />
        </div>
        <CardContent className="flex-1 p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-display font-semibold">{event.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">{event.organizer.name}</span>
                {event.organizer.verified && <ShieldCheck className="h-4 w-4 text-primary" />}
              </div>
            </div>
            <Badge variant="secondary">{event.category.name}</Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{event.shortDescription}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Submitted: {formatDate(event.createdAt)}</span>
            <span>Event: {formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Button size="sm" variant="default" onClick={onApprove}>
              <CheckCircle className="mr-1 h-4 w-4" /> Approve
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setShowRejectDialog(true)}>
              <XCircle className="mr-1 h-4 w-4" /> Reject
            </Button>
          </div>

          {showRejectDialog && (
            <div className="mt-3 p-3 rounded-lg bg-muted border border-border">
              <textarea
                className="w-full min-h-[80px] rounded-lg border border-border bg-background p-2 text-sm"
                placeholder="Rejection reason..."
              />
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="destructive" onClick={() => { setShowRejectDialog(false); onReject?.(); }}>Confirm Reject</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
