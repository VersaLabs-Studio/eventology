"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export default function DraftsPage() {
  const drafts: { title: string; lastEdited: string; progress: number }[] = [];

  if (drafts.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader title="Drafts" />
        <EmptyState
          icon={FileText}
          title="No drafts yet"
          description="Create your first event"
          action={{ label: "Create Event", onClick: () => window.location.href = "/org/events/create" }}
        />
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader title="Drafts" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {drafts.map((draft, idx) => (
          <div key={idx} className="p-4 rounded-xl bg-card border border-border shadow-sm">
            <h3 className="font-display font-semibold">{draft.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">Last edited {draft.lastEdited}</p>
            <Progress value={draft.progress} className="mt-3" />
            <div className="flex items-center gap-2 mt-3">
              <Button variant="default" size="sm">Continue Editing</Button>
              <Button variant="ghost" size="sm">Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
