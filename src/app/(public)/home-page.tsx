"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { HeroSection } from "@/components/public/hero-section";
import { FeaturedCarousel } from "@/components/public/featured-carousel";
import { CategoryGrid } from "@/components/public/category-grid";
import { EventCard } from "@/components/shared/event-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, Ticket } from "lucide-react";
import { getUpcomingEvents } from "@/lib/mock-data";
import { ArrowRight } from "lucide-react";

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-8">
      <h2 className="font-display font-bold text-3xl text-foreground inline-block relative">
        {title}
        <span className="absolute -bottom-1 left-0 h-1 w-1/3 rounded-full bg-accent" />
      </h2>
    </div>
  );
}

function HowItWorksCard({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }) {
  return (
    <div className="text-center p-6">
      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Icon className="h-7 w-7 text-primary" />
      </div>
      <h3 className="font-display font-semibold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2">{description}</p>
    </div>
  );
}

export function PublicHomePage() {
  const [tab, setTab] = React.useState("all");

  const upcoming = getUpcomingEvents();
  const filtered = upcoming.filter((e) => {
    if (tab === "free") return e.ticketType === "free";
    return true;
  });
  const displayEvents = filtered.slice(0, 6);

  return (
    <>
      <HeroSection />

      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader title="Featured Events" />
          <FeaturedCarousel />
          <div className="text-center mt-8">
            <Link href="/events" className="text-primary font-medium hover:underline inline-flex items-center gap-1">
              View All Events → <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader title="Browse by Category" />
          <CategoryGrid />
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader title="Upcoming Events" />
          <Tabs value={tab} onValueChange={setTab} className="mb-8">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="free">Free</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayEvents.map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <EventCard event={event} />
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/events">
              <Button variant="outline" size="lg">See All Events →</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader title="How It Works" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <HowItWorksCard icon={Search} title="Discover" description="Browse hundreds of events across Addis Ababa" />
            <HowItWorksCard icon={UserPlus} title="Register" description="Sign up in 30 seconds with just your name, email, and phone" />
            <HowItWorksCard icon={Ticket} title="Attend" description="Get your digital ticket with QR code and show up" />
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary rounded-2xl p-12 text-center text-white">
            <h2 className="font-display font-bold text-3xl md:text-4xl">Ready to create your own event?</h2>
            <p className="text-white/70 mt-3 text-lg">Join hundreds of organizers using Eventology</p>
            <Link href="/auth/signup" className="inline-block mt-6">
              <Button variant="accent" size="lg">Get Started</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
