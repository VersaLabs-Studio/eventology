"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MapEmbed } from "@/components/shared/map-embed";
import { EventCard } from "@/components/shared/event-card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getEventBySlug, getEventsByCategory } from "@/lib/mock-data";
import { formatDate, formatCurrency, getInitials } from "@/lib/utils";
import {
  Calendar, Clock, MapPin, Share2, CheckCircle, Copy, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import type { Event } from "@/lib/types";
import { notFound } from "next/navigation";

export default function EventDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const event = getEventBySlug(slug);

  if (!event) notFound();

  return <EventDetailContent event={event} />;
}

function EventDetailContent({ event }: { event: Event }) {
  const [galleryOpen, setGalleryOpen] = React.useState<string | null>(null);
  const similar = getEventsByCategory(event.category.slug).filter((e) => e.id !== event.id).slice(0, 3);

  const shareOptions = [
    { icon: Copy, label: "Copy Link", action: () => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); } },
    { icon: ExternalLink, label: "Share", action: () => window.open(`https://twitter.com/intent/tweet?url=${window.location.href}&text=${event.title}`, "_blank") },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="relative aspect-[21/9] rounded-2xl overflow-hidden mb-6">
          <Image src={event.bannerImage} alt={event.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 1024px" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{event.category.name}</Badge>
              {event.isFeatured && <Badge variant="accent">Featured</Badge>}
            </div>
            <h1 className="font-display font-bold text-3xl text-white">{event.title}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-white/70">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(event.date)}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
            </div>
          </div>
          <div className="absolute top-4 right-4">
            <div className="relative group">
              <button className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                <Share2 className="h-4 w-4 text-white" />
              </button>
              <div className="absolute right-0 top-12 w-48 bg-card rounded-xl border border-border shadow-lg p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                {shareOptions.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={opt.action}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                  >
                    <opt.icon className="h-4 w-4" /> {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="sticky top-16 z-30 bg-card/80 backdrop-blur-xl border-b border-border -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 mb-6">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDate(event.date)}</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{event.time}</span>
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{event.location}</span>
              <span className="font-medium text-primary">{event.ticketType === "free" ? "Free" : `From ${formatCurrency(event.ticketTiers[0].price)}`}</span>
            </div>
            <Link href={`/register/${event.id}`}>
              <Button variant="accent">Register Now</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-8">
          <div>
            <section>
              <h2 className="font-display font-semibold text-xl mb-4">About This Event</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: event.description }} />
            </section>

            <section className="mt-8">
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            </section>

            <section className="mt-8">
              <h2 className="font-display font-semibold text-xl mb-4">Gallery</h2>
              <div className="grid grid-cols-2 gap-3">
                {event.gallery.slice(0, 4).map((img, idx) => (
                  <button key={idx} onClick={() => setGalleryOpen(img)} className="relative aspect-video rounded-lg overflow-hidden hover:opacity-90 transition-opacity">
                    <Image src={img} alt={`Gallery ${idx + 1}`} fill className="object-cover" sizes="(max-width: 768px) 50vw, 300px" />
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-8">
              <h2 className="font-display font-semibold text-xl mb-4">You Might Also Like</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {similar.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <Card className="sticky top-24 shadow-md overflow-hidden">
              <CardHeader>
                <CardTitle className="font-display font-extrabold tracking-tight">Select Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  {event.ticketTiers.map((tier) => (
                    <div key={tier.id} className="flex items-center justify-between p-3 rounded-xl border border-border/80 hover:border-primary bg-card transition-all">
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="font-bold text-sm text-foreground truncate">{tier.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{tier.description}</p>
                        <Progress value={(tier.sold / tier.capacity) * 100} className="mt-2 h-1.5" />
                        <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-wider">{tier.sold}/{tier.capacity} sold</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-extrabold text-sm text-primary">{tier.price === 0 ? "Free" : formatCurrency(tier.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href={`/register/${event.id}`} className="block">
                  <Button variant="accent" size="lg" className="w-full min-h-[48px] rounded-xl font-extrabold text-sm shadow-accent-glow">
                    Register Now
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar size="lg">
                    <AvatarImage src={event.organizer.avatar} />
                    <AvatarFallback>{getInitials(event.organizer.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="font-medium text-sm">{event.organizer.name}</p>
                      {event.organizer.verified && <CheckCircle className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{event.organizer.eventsCount} events · {event.organizer.totalAttendees} attendees</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{event.organizer.bio}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-sm mb-2">Location</h4>
                <MapEmbed location={event.location} coordinates={event.coordinates} />
                <p className="text-xs text-muted-foreground mt-2">{event.address}, {event.subCity}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>

      <Dialog open={!!galleryOpen} onOpenChange={() => setGalleryOpen(null)}>
        <DialogContent className="max-w-3xl p-2">
          {galleryOpen && (
            <div className="relative aspect-video">
              <Image src={galleryOpen} alt="Gallery" fill className="object-cover rounded-lg" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
