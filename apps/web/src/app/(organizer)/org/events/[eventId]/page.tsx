"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatCard } from "@/components/shared/stat-card";
import { getEventById } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { Calendar, Eye, TrendingUp, Percent, Edit3, Copy, MoreHorizontal } from "lucide-react";
import { notFound } from "next/navigation";

export default function EventManagePage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const event = getEventById(eventId);

  if (!event) notFound();

  const capacityPercent = Math.round((event.registrations / event.capacity) * 100);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title={event.title}
        description={event.shortDescription}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={event.status === "approved" ? "success" : "default"}>{event.status}</Badge>
            <Button variant="outline" size="sm"><Edit3 className="mr-1 h-4 w-4" /> Edit</Button>
            <Button variant="outline" size="sm"><Copy className="mr-1 h-4 w-4" /> Duplicate</Button>
            <button className="h-9 w-9 rounded-lg hover:bg-muted flex items-center justify-center"><MoreHorizontal className="h-4 w-4" /></button>
          </div>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="check-in">Check-In</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard title="Views" value={event.views} icon={Eye} />
            <StatCard title="Registrations" value={event.registrations} icon={Calendar} />
            <StatCard title="Capacity" value={`${capacityPercent}%`} icon={TrendingUp} />
            <StatCard title="Conversion" value={`${event.registrations > 0 ? Math.round((event.registrations / event.views) * 100) : 0}%`} icon={Percent} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-6">
            <div className="relative aspect-video rounded-xl overflow-hidden">
              <Image src={event.bannerImage} alt={event.title} fill className="object-cover" sizes="600px" />
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{formatDate(event.date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{event.location}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <Badge variant="secondary">{event.category.name}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tickets</p>
                <p className="font-medium">{event.ticketTiers.length} tier(s)</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="registrations">
          <Link href={`/org/events/${event.id}/registrations`}>
            <Button variant="accent">View All Registrations</Button>
          </Link>
        </TabsContent>

        <TabsContent value="analytics">
          <Link href={`/org/events/${event.id}/analytics`}>
            <Button variant="accent">View Analytics</Button>
          </Link>
        </TabsContent>

        <TabsContent value="check-in">
          <Link href={`/org/events/${event.id}/check-in`}>
            <Button variant="accent">Open Check-In</Button>
          </Link>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
