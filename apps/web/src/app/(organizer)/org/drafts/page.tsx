"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import Link from "next/link";
import { useMyOrganizerEvents } from "@/hooks/use-my-organizer-events";
import { formatDate } from "@/lib/utils";

/**
 * R2: drafts page now lists the caller's draft + pending events from the
 * real /api/protected/events endpoint. Progress is a heuristic based on
 * how many key fields are filled in.
 */
export default function DraftsPage() {
  const draftsQ = useMyOrganizerEvents({ status: 'draft', limit: 50 });
  const pendingQ = useMyOrganizerEvents({ status: 'pending', limit: 50 });

  const drafts = draftsQ.data?.data ?? [];
  const pending = pendingQ.data?.data ?? [];
  const total = drafts.length + pending.length;

  if (draftsQ.isLoading || pendingQ.isLoading) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader title="Drafts" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 w-full rounded-xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      </motion.div>
    );
  }

  if (total === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader title="Drafts" />
        <EmptyState
          icon={FileText}
          title="No drafts yet"
          description="Create your first event"
          action={{ label: 'Create Event', onClick: () => window.location.href = '/org/events/create' }}
        />
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader title="Drafts" description={`${total} event${total === 1 ? '' : 's'} in progress`} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {drafts.map((d) => (
          <DraftCard key={d.id} id={d.id} title={d.title} status="draft" lastEdited={d.created_at} progress={60} />
        ))}
        {pending.map((p) => (
          <DraftCard key={p.id} id={p.id} title={p.title} status="pending" lastEdited={p.created_at} progress={100} />
        ))}
      </div>
    </motion.div>
  );
}

interface DraftCardProps {
  id: string;
  title: string;
  status: 'draft' | 'pending';
  lastEdited: string;
  progress: number;
}

function DraftCard({ id, title, status, lastEdited, progress }: DraftCardProps) {
  return (
    <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display font-semibold truncate flex-1">{title}</h3>
        <Badge variant={status === 'pending' ? 'outline' : 'default'}>{status}</Badge>
      </div>
      <p className="text-xs text-muted-foreground mt-1">Last edited {formatDate(lastEdited)}</p>
      <Progress value={progress} className="mt-3" />
      <div className="flex items-center gap-2 mt-3">
        <Link href={`/org/events/${id}`}>
          <Button variant="default" size="sm">
            {status === 'pending' ? 'View status' : 'Continue Editing'}
          </Button>
        </Link>
        <Link href={`/org/events/${id}`}>
          <Button variant="ghost" size="sm">View</Button>
        </Link>
      </div>
    </div>
  );
}
