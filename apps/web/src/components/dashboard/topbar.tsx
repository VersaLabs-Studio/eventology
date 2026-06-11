"use client";

import * as React from "react";
import { Search, Moon, Sun } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { NotificationBell } from "@/components/comms/notification-bell";

interface TopbarProps {
  breadcrumb?: string;
  onToggleTheme?: () => void;
  isDark?: boolean;
}

export function DashboardTopbar({ breadcrumb, onToggleTheme, isDark }: TopbarProps) {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {breadcrumb && <span className="text-foreground font-medium">{breadcrumb}</span>}
      </div>

      <div className="flex items-center gap-3">
        <button className="h-9 w-9 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
          <Search className="h-4 w-4 text-muted-foreground" />
        </button>
        <NotificationBell />
        {onToggleTheme && (
          <button onClick={onToggleTheme} className="h-9 w-9 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        )}
        <Avatar size="sm">
          <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Kidus" />
          <AvatarFallback>{getInitials("Kidus Yilma")}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
