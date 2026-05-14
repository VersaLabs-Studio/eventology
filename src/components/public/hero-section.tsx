"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { SearchBar } from "@/components/shared/search-bar";
import { Calendar, Users, Building2 } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-[85vh] bg-gradient-to-br from-[#065F46] via-[#065F46]/95 to-[#065F46]/80 flex items-center overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "40px 40px" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="inline-block text-secondary font-medium text-sm mb-4">
            ✨ The #1 Event Platform in Addis Ababa
          </span>
          <h1 className="font-display font-bold text-5xl md:text-7xl text-white max-w-4xl mx-auto leading-tight">
            Discover Amazing Events in Addis Ababa
          </h1>
          <p className="text-white/70 text-xl max-w-2xl mx-auto mt-6">
            Find conferences, meetups, workshops, and more. Register in seconds.
          </p>

          <div className="flex justify-center mt-8">
            <SearchBar variant="hero" />
          </div>

          <div className="flex items-center justify-center gap-8 md:gap-12 mt-12 text-white/80">
            <div className="text-center">
              <p className="font-mono font-bold text-2xl md:text-3xl">2,000+</p>
              <p className="text-xs md:text-sm text-white/60 mt-1">Events</p>
            </div>
            <div className="text-center">
              <p className="font-mono font-bold text-2xl md:text-3xl">500+</p>
              <p className="text-xs md:text-sm text-white/60 mt-1">Organizers</p>
            </div>
            <div className="text-center">
              <p className="font-mono font-bold text-2xl md:text-3xl">50K+</p>
              <p className="text-xs md:text-sm text-white/60 mt-1">Attendees</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="hidden lg:block absolute right-10 top-20">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 w-56 rotate-6">
          <div className="h-24 bg-white/10 rounded-lg mb-2" />
          <div className="h-3 bg-white/10 rounded w-3/4 mb-1" />
          <div className="h-2 bg-white/10 rounded w-1/2" />
        </div>
      </div>
      <div className="hidden lg:block absolute left-10 bottom-20">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 w-48 -rotate-3">
          <div className="h-20 bg-white/10 rounded-lg mb-2" />
          <div className="h-3 bg-white/10 rounded w-2/3 mb-1" />
          <div className="h-2 bg-white/10 rounded w-1/3" />
        </div>
      </div>
    </section>
  );
}
