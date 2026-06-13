"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, getInitials } from "@/lib/utils";
import { toast } from "sonner";
import type { AdminUserRow } from "@/app/api/protected/admin/users/route";

interface AdminUsersResponse {
  data: AdminUserRow[];
  meta: { total: number; page: number; limit: number };
}

const USERS_QUERY_KEY = ["admin", "users"] as const;

async function fetchUsers(): Promise<AdminUsersResponse> {
  const res = await fetch("/api/protected/admin/users?limit=200", { cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? "Failed to load users");
  }
  return (await res.json()) as AdminUsersResponse;
}

async function patchUser(input: { id: string; is_active?: boolean; role?: "attendee" | "organizer" | "admin" }): Promise<AdminUserRow> {
  const res = await fetch(`/api/protected/admin/users/${input.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(input.is_active !== undefined ? { is_active: input.is_active } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? "Failed to update user");
  }
  return (await res.json()) as AdminUserRow;
}

function useAdminUsers() {
  return useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: fetchUsers,
    staleTime: 30_000,
  });
}

function useToggleUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: patchUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

export function UserTable() {
  const { data, isLoading, error } = useAdminUsers();
  const toggle = useToggleUser();

  const handleActivateToggle = (user: AdminUserRow) => {
    toggle.mutate(
      { id: user.id, is_active: !user.is_active },
      {
        onSuccess: (updated) => {
          toast.success(updated.is_active ? "User activated" : "User deactivated");
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update user"),
      }
    );
  };

  const columns: Column<AdminUserRow>[] = [
    {
      key: "full_name",
      header: "Name",
      render: (user) => (
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarImage src={user.avatar_url ?? undefined} />
            <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <span className="font-medium block truncate">{user.full_name}</span>
            {user.phone && <span className="text-xs text-muted-foreground">{user.phone}</span>}
          </div>
        </div>
      ),
      sortable: true,
    },
    { key: "email", header: "Email", sortable: true },
    {
      key: "role",
      header: "Role",
      render: (user) => {
        const v = user.role === "admin" ? "accent" : user.role === "organizer" ? "default" : "secondary";
        return <Badge variant={v}>{user.role}</Badge>;
      },
      sortable: true,
    },
    {
      key: "is_active",
      header: "Status",
      render: (user) => (
        <span className={`inline-flex items-center gap-1 text-xs ${user.is_active ? "text-success" : "text-destructive"}`}>
          <span className={`h-2 w-2 rounded-full ${user.is_active ? "bg-success" : "bg-destructive"}`} />
          {user.is_active ? "Active" : "Inactive"}
        </span>
      ),
      sortable: true,
    },
    { key: "created_at", header: "Joined", render: (user) => formatDate(user.created_at), sortable: true },
    { key: "events_attended", header: "Events", sortable: true },
    {
      key: "actions",
      header: "Actions",
      render: (user) => (
        <button
          onClick={() => handleActivateToggle(user)}
          disabled={toggle.isPending}
          className="h-8 rounded-md border border-border bg-background px-3 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          {user.is_active ? "Deactivate" : "Activate"}
        </button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <p className="text-sm text-destructive">{error instanceof Error ? error.message : "Failed to load users"}</p>
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={data?.data ?? []}
      searchable
      searchPlaceholder="Search by name or email..."
      searchKeys={["full_name", "email"]}
    />
  );
}
