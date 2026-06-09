"use client";

import * as React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QRCode } from "@/components/shared/qr-code";
import { Calendar, MapPin, Clock, Download, CalendarPlus } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadSingleEventICS, getGoogleCalendarLink } from "@/lib/calendar";
import type { Ticket } from "@/lib/types";

interface TicketViewProps {
  ticket: Ticket;
}

export function TicketView({ ticket }: TicketViewProps) {
  const { event } = ticket;

  return (
    <div className="max-w-lg mx-auto">
      <Card className="overflow-hidden print:shadow-none print:border">
        <div className="relative h-32">
          <Image src={event.bannerImage} alt={event.title} fill className="object-cover" sizes="500px" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <h2 className="font-display font-semibold text-lg text-white">{event.title}</h2>
            <p className="text-sm text-white/70">{event.organizer.name}</p>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="flex justify-center mb-6">
            <QRCode data={ticket.qrData} size={180} />
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Attendee</span>
              <span className="font-medium">{ticket.attendeeName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{ticket.attendeeEmail}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ticket</span>
              <Badge variant="secondary">{ticket.ticketTier}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(event.date)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Time</span>
              <span className="font-medium flex items-center gap-1"><Clock className="h-3 w-3" />{event.time} - {event.endTime}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Venue</span>
              <span className="font-medium flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Address</span>
              <span className="font-medium text-right max-w-[200px]">{event.address}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="default" className="flex-1" onClick={() => window.print()}><Download className="mr-2 h-4 w-4" />Print / Save</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex-1">
                  <CalendarPlus className="mr-2 h-4 w-4" />Add to Calendar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card border border-border">
                <DropdownMenuItem className="cursor-pointer hover:bg-muted" onClick={() => {
                  downloadSingleEventICS({
                    id: event.id,
                    title: event.title,
                    description: event.description,
                    short_description: event.shortDescription,
                    start_date: event.date,
                    end_date: event.endDate,
                    venue_name: event.location,
                    venue_address: event.address,
                    slug: event.slug,
                  });
                }}>
                  Download ICS File
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-muted" onClick={() => {
                  const link = getGoogleCalendarLink({
                    title: event.title,
                    description: event.description,
                    short_description: event.shortDescription,
                    start_date: event.date,
                    end_date: event.endDate,
                    venue_name: event.location,
                    venue_address: event.address,
                    slug: event.slug,
                  });
                  window.open(link, '_blank');
                }}>
                  Google Calendar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/10 flex items-start gap-3">
        <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          📧 Reminders will be sent 24h and 1h before the event.
        </p>
      </div>
    </div>
  );
}
