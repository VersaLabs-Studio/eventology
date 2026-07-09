import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string | React.ReactNode;
  action?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, breadcrumb, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      {breadcrumb && <div className="mb-2">{breadcrumb}</div>}
      <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4")}>
        <div className="min-w-0">
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
            {title}
          </h1>
          {description && typeof description === "string" ? (
            <p className="mt-1.5 text-muted-foreground">{description}</p>
          ) : (
            <div className="mt-1.5 text-muted-foreground">{description}</div>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
