"use client";

import * as React from "react";
import Link from "next/link";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories } from "@/hooks/use-categories";
import { Tag, Cpu, Briefcase, Palette, Heart, GraduationCap, Music, UtensilsCrossed, Users } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Cpu, Briefcase, Palette, Heart, GraduationCap, Music, UtensilsCrossed, Users, Tag,
};

function CategoriesContent() {
  const { data, isLoading, isError } = useCategories();

  const categories = (data?.data ?? []).filter((c) => c.is_active);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Browse Categories"
        description={isLoading ? "Loading categories…" : `${categories.length} categories`}
      />

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <EmptyState
          icon={Tag}
          title="Failed to load categories"
          description="Please check your connection and try again."
        />
      )}

      {!isLoading && !isError && categories.length === 0 && (
        <EmptyState
          icon={Tag}
          title="No categories yet"
          description="Categories will appear here once they are created."
        />
      )}

      {!isLoading && !isError && categories.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((cat, idx) => {
            const Icon = iconMap[cat.icon] || Tag;
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Link href={`/categories/${cat.slug}`}>
                  <Card hoverable className="group transition-all duration-300 hover:border-primary/40 hover:shadow-xl">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div
                        className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 bg-muted"
                      >
                        <Icon className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <h3 className="font-display font-bold text-base mb-1 group-hover:text-primary transition-colors">
                        {cat.name}
                      </h3>
                      {cat.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {cat.description}
                        </p>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {cat.event_count} {cat.event_count === 1 ? "event" : "events"}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense>
      <CategoriesContent />
    </Suspense>
  );
}
