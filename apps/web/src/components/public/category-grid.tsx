"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { categories } from "@/lib/mock-data";
import { Cpu, Briefcase, Palette, Heart, GraduationCap, Music, UtensilsCrossed, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Cpu, Briefcase, Palette, Heart, GraduationCap, Music, UtensilsCrossed, Users,
};

export function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {categories.map((cat, idx) => {
        const Icon = iconMap[cat.icon] || Users;
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
              <div className={`h-10 w-10 rounded-full ${cat.color} bg-opacity-20 flex items-center justify-center mb-3`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-display font-semibold text-sm">{cat.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{cat.eventCount} events</p>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
