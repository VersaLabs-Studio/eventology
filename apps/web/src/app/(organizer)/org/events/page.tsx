"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, CalendarDays, Eye, Pencil, Trash2 } from "lucide-react";
import { useMyOrganizerEvents } from "@/hooks/use-my-organizer-events";
import { useDeleteEvent } from "@/hooks/use-events";
import { formatDate } from "@/lib/utils";
import { FallbackImage } from "@/components/shared/fallback-image";

const statusColors: Record<string, "success" | "warning" | "default" | "destructive"> = {
  approved: "success", draft: "warning", pending: "default", rejected: "destructive",
};

export default function OrgEventsPage() {
  const [tab, setTab] = React.useState("all");
  const [confirmingId, setConfirmingId] = React.useState<string | null>(null);

  const { data, isLoading, isError } = useMyOrganizerEvents({
    limit: 50,
    status: tab === "all" ? undefined : tab,
  });

  const deleteEvent = useDeleteEvent();

  const events = data?.data ?? [];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title="My Events"
        action={
          <Link href="/org/events/create">
            <Button variant="accent"><Plus className="mr-2 h-4 w-4" /> Create Event</Button>
          </Link>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="approved">Published</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-6">
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
                  <Skeleton className="h-16 w-16 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          )}

          {isError && (
            <EmptyState
              icon={CalendarDays}
              title="Failed to load events"
              description="Please check your connection and try again."
            />
          )}

          {!isLoading && !isError && events.length === 0 && (
            <EmptyState
              icon={CalendarDays}
              title={`No ${tab === "all" ? "" : tab + " "}events`}
              description="Create your first event to get started."
            />
          )}

          {!isLoading && !isError && events.length > 0 && (
            <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-all">
                <FallbackImage
                  src={event.banner_image ?? ""}
                  alt={event.title}
                  aspectRatio="square"
                  className="h-16 w-16 shrink-0 rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <Link href={`/org/events/${event.id}`} className="font-medium text-sm hover:text-primary transition-colors line-clamp-1">
                    {event.title}
                  </Link>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{formatDate(event.start_date)}</span>
                    <span>{event.registrations_count} registrations</span>
                    <span>{event.views_count} views</span>
                  </div>
                </div>
                  <Badge variant={statusColors[event.status] || "default"}>{event.status}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        aria-label={`Actions for ${event.title}`}
                        className="h-9 w-9 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {confirmingId === event.id ? (
                        <>
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            Delete this event?
                          </div>
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive/10"
                            disabled={deleteEvent.isPending}
                            onSelect={(e) => {
                              e.preventDefault();
                              deleteEvent.mutate(event.id, {
                                onSuccess: () => setConfirmingId(null),
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setConfirmingId(null); }}>
                            Cancel
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href={`/org/events/${event.id}`}>
                              <Eye className="h-4 w-4" /> View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/org/events/${event.id}`}>
                              <Pencil className="h-4 w-4" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive/10"
                            onSelect={(e) => { e.preventDefault(); setConfirmingId(event.id); }}
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
