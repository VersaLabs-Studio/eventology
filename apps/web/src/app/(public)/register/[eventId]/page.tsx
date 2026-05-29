"use client";

import * as React from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { RegistrationForm } from "@/components/public/registration-form";
import { getEventById } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { Calendar, MapPin } from "lucide-react";
import { notFound } from "next/navigation";

export default function RegisterPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const event = getEventById(eventId);

  if (!event) notFound();

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader title={`Register for ${event.title}`} />

        <Card className="mb-6">
          <div className="relative h-32 rounded-t-xl overflow-hidden">
            <Image src={event.bannerImage} alt={event.title} fill className="object-cover" sizes="500px" />
          </div>
          <CardContent className="p-4">
            <h3 className="font-display font-semibold">{event.title}</h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />{formatDate(event.date)}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />{event.location}
            </div>
            <Badge variant="secondary" className="mt-2">{event.ticketType === "free" ? "Free" : `From ETB ${event.ticketTiers[0].price}`}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <RegistrationForm eventId={event.id} eventTitle={event.title} ticketTier={event.ticketTiers[0].name} />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
