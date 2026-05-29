"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { UserTable } from "@/components/admin/user-table";
import { users } from "@/lib/mock-data";

export default function UsersPage() {
  const attendeeCount = users.filter((u) => u.role === "attendee").length;
  const organizerCount = users.filter((u) => u.role === "organizer").length;
  const adminCount = users.filter((u) => u.role === "admin").length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader title="User Management" description={`${users.length} total users`} />
      <div className="flex items-center gap-3 mb-6">
        <Badge variant="secondary">{attendeeCount} Attendees</Badge>
        <Badge variant="default">{organizerCount} Organizers</Badge>
        <Badge variant="accent">{adminCount} Admins</Badge>
      </div>
      <UserTable />
    </motion.div>
  );
}
