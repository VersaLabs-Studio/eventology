"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ShieldCheck, XCircle, ExternalLink } from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";
import type { AdminOrganizerRow } from "@/app/api/protected/admin/organizers/route";

interface OrganizerVerificationCardProps {
  organizer: AdminOrganizerRow;
  onVerify?: () => void;
  onReject?: () => void;
  isPending?: boolean;
}

export function OrganizerVerificationCard({ organizer, onVerify, onReject, isPending }: OrganizerVerificationCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar size="xl">
            <AvatarImage src={organizer.avatar_url ?? undefined} />
            <AvatarFallback>{getInitials(organizer.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold">{organizer.name}</h3>
              {organizer.is_verified && <Badge variant="success">Verified</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{organizer.email}</p>
            {organizer.bio && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{organizer.bio}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>{organizer.events_count} events</span>
              <span>Member since {formatDate(organizer.created_at)}</span>
            </div>
            {organizer.website && (
              <a
                href={organizer.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
              >
                <ExternalLink className="h-3 w-3" /> {organizer.website}
              </a>
            )}
            {organizer.verification_notes && (
              <div className="mt-2 p-2 rounded-md bg-muted text-xs text-muted-foreground">
                <span className="font-medium">Notes:</span> {organizer.verification_notes}
              </div>
            )}
            <div className="flex items-center gap-2 mt-4">
              {!organizer.is_verified && onVerify && (
                <Button size="sm" variant="default" onClick={onVerify} disabled={isPending}>
                  <ShieldCheck className="mr-1 h-4 w-4" /> Verify
                </Button>
              )}
              {organizer.verification_status !== "rejected" && onReject && (
                <Button size="sm" variant="destructive" onClick={onReject} disabled={isPending}>
                  <XCircle className="mr-1 h-4 w-4" /> Reject
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
