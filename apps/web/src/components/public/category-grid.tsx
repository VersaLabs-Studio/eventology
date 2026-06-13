"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Cpu, Briefcase, Palette, Heart, GraduationCap, Music, UtensilsCrossed, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  event_count?: number;
}

interface ListResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number };
}

const iconMap: Record<string, LucideIcon> = {
  Cpu, Briefcase, Palette, Heart, GraduationCap, Music, UtensilsCrossed, Users,
};

function tintStyle(hex: string | null): React.CSSProperties {
  if (!hex) return {};
  return { backgroundColor: `${hex}33` };
}

function iconColor(hex: string | null): string {
  return hex ?? '#10B981';
}

/**
 * R2: Category grid now hits the real /api/public/categories. The
 * `event_count` field is optional (categories may not have a denormalized
 * count); we show a "—" placeholder when missing rather than 0.
 */
export function CategoryGrid() {
  const q = useQuery<ListResponse<Category>>({
    queryKey: ['categories', 'grid'],
    queryFn: async () => {
      const res = await fetch('/api/public/categories?limit=100');
      if (!res.ok) throw new Error('Failed to load categories');
      return res.json();
    },
    staleTime: 60_000,
  });

  if (q.isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const cats = q.data?.data ?? [];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cats.map((cat, idx) => {
        const Icon = iconMap[cat.icon ?? ''] ?? Users;
        const color = iconColor(cat.color);
        return (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.05 }}
          >
            <Link
              href={`/events?category=${cat.slug}`}
              className="block p-5 rounded-xl bg-card border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center mb-3"
                style={tintStyle(cat.color)}
              >
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
              <h3 className="font-display font-semibold text-sm">{cat.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {typeof cat.event_count === 'number' ? `${cat.event_count} events` : 'Browse →'}
              </p>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
