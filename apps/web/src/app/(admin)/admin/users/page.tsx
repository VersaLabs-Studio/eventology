"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserTable } from "@/components/admin/user-table";
import { useQuery } from "@tanstack/react-query";

interface AdminUsersResponse {
  data: Array<{ role: "attendee" | "organizer" | "admin" }>;
  meta: { total: number; page: number; limit: number };
}

async function fetchUsers(): Promise<AdminUsersResponse> {
  const res = await fetch("/api/protected/admin/users?limit=200", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load users");
  return res.json();
}

export default function UsersPage() {
  const usersQ = useQuery({
    queryKey: ["admin", "users", "counts"],
    queryFn: fetchUsers,
    staleTime: 30_000,
  });

  const users = usersQ.data?.data ?? [];
  const attendeeCount = users.filter((u) => u.role === "attendee").length;
  const organizerCount = users.filter((u) => u.role === "organizer").length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const totalCount = usersQ.data?.meta.total ?? users.length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title="User Management"
        description={
          usersQ.isLoading
            ? "Loading..."
            : `${totalCount} total users`
        }
      />
      <div className="flex items-center gap-3 mb-6">
        <Badge variant="secondary">{attendeeCount} Attendees</Badge>
        <Badge variant="default">{organizerCount} Organizers</Badge>
        <Badge variant="accent">{adminCount} Admins</Badge>
      </div>
      {usersQ.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <UserTable />
      )}
    </motion.div>
  );
}
