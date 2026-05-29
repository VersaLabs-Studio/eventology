"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ShieldCheck, XCircle, ExternalLink } from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";
import type { Organizer } from "@/lib/types";

interface OrganizerVerificationCardProps {
  organizer: Organizer;
  onVerify?: () => void;
  onReject?: () => void;
}

export function OrganizerVerificationCard({ organizer, onVerify, onReject }: OrganizerVerificationCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar size="xl">
            <AvatarImage src={organizer.avatar} />
            <AvatarFallback>{getInitials(organizer.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold">{organizer.name}</h3>
            <p className="text-sm text-muted-foreground">{organizer.email}</p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{organizer.bio}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>{organizer.eventsCount} events</span>
              <span>Member since {formatDate(organizer.joinedDate)}</span>
            </div>
            {organizer.website && (
              <a href={organizer.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline mt-1">
                <ExternalLink className="h-3 w-3" /> {organizer.website}
              </a>
            )}
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs bg-muted px-2 py-1 rounded-md">Business License</span>
              <span className="text-xs bg-muted px-2 py-1 rounded-md">ID Document</span>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Button size="sm" variant="default" onClick={onVerify}>
                <ShieldCheck className="mr-1 h-4 w-4" /> Verify
              </Button>
              <Button size="sm" variant="destructive" onClick={onReject}>
                <XCircle className="mr-1 h-4 w-4" /> Reject
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
