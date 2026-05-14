"use client";

import * as React from "react";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDate, getInitials } from "@/lib/utils";
import { users } from "@/lib/mock-data";
import type { User } from "@/lib/types";

const columns: Column<User>[] = [
  {
    key: "name",
    header: "Name",
    render: (user) => (
      <div className="flex items-center gap-2">
        <Avatar size="sm">
          <AvatarImage src={user.avatar} />
          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
        </Avatar>
        <span className="font-medium">{user.name}</span>
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
    key: "isActive",
    header: "Status",
    render: (user) => (
      <span className={`inline-flex items-center gap-1 text-xs ${user.isActive ? "text-success" : "text-destructive"}`}>
        <span className={`h-2 w-2 rounded-full ${user.isActive ? "bg-success" : "bg-destructive"}`} />
        {user.isActive ? "Active" : "Inactive"}
      </span>
    ),
    sortable: true,
  },
  { key: "joinedDate", header: "Joined", render: (user) => formatDate(user.joinedDate), sortable: true },
  { key: "eventsAttended", header: "Events", sortable: true },
  {
    key: "actions",
    header: "Actions",
    render: () => (
      <select className="h-8 rounded-md border border-border bg-background px-2 text-xs">
        <option>Actions</option>
        <option>Change Role</option>
        <option>Deactivate</option>
        <option>View Activity</option>
      </select>
    ),
  },
];

export function UserTable() {
  return (
    <DataTable
      columns={columns}
      data={users}
      searchable
      searchPlaceholder="Search by name or email..."
      searchKeys={["name", "email"]}
    />
  );
}
