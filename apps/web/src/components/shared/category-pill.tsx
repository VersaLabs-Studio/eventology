"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Category } from "@/lib/types";
import { Tag, Cpu, Briefcase, Palette, Heart, GraduationCap, Music, UtensilsCrossed, Users } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Cpu, Briefcase, Palette, Heart, GraduationCap, Music, UtensilsCrossed, Users,
};

interface CategoryPillProps {
  category: Category;
  active?: boolean;
  className?: string;
}

export function CategoryPill({ category, active, className }: CategoryPillProps) {
  const Icon = iconMap[category.icon] || Tag;

  return (
    <Link href={`/events?category=${category.slug}`}>
      <Badge
        variant={active ? "default" : "outline"}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-sm cursor-pointer transition-all",
          active ? "bg-primary text-primary-foreground" : "hover:bg-primary/10",
          className
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        {category.name}
      </Badge>
    </Link>
  );
}
