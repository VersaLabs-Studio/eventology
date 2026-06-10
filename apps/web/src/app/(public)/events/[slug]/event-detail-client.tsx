"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
import { EventCard } from "@/components/shared/event-card";
import { FallbackImage } from "@/components/shared/fallback-image";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useEventBySlug, useEvents } from "@/hooks/use-events";
import { formatDate, formatCurrency, getInitials } from "@/lib/utils";
import {
  Calendar, Clock, MapPin, Share2, CheckCircle, Copy, ExternalLink, CalendarPlus, Download, Check, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadSingleEventICS, getGoogleCalendarLink } from "@/lib/calendar";
import { EventReviews } from "@/components/events/event-reviews-polished";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface CalendarDropdownItemProps {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  label: string;
  description: string;
  onClick: () => void;
}

function CalendarDropdownItem({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  description,
  onClick,
}: CalendarDropdownItemProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isClicked, setIsClicked] = React.useState(false);

  const handleClick = () => {
    setIsClicked(true);
    onClick();
    setTimeout(() => setIsClicked(false), 300);
  };

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      whileHover={{ scale: isClicked ? 0.98 : 1.01 }}
      whileTap={{ scale: 0.96 }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
        transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card
        ${isHovered ? "bg-primary/5 text-primary" : "hover:bg-muted/50"}
        ${isClicked ? "bg-primary/10" : ""}
      `}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <motion.div
        animate={{ scale: isHovered ? 1.1 : 1, rotate: isClicked ? 360 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`flex h-9 w-9 items-center justify-center rounded-full shrink-0 ${iconBg} ${iconColor} transition-all duration-200 ${isHovered ? "shadow-lg" : ""}`}
      >
        <Icon className="h-5 w-5" />
      </motion.div>
      <div className="flex-1 min-w-0 text-left">
        <p className="font-medium text-sm leading-tight truncate">{label}</p>
        <p className="text-xs text-muted-foreground leading-tight truncate">{description}</p>
      </div>
      <AnimatePresence>
        {isClicked && (
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -90 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0, rotate: 90 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex h-5 w-5 items-center justify-center text-primary shrink-0"
          >
            <Check className="h-4 w-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// Dynamic import — Leaflet touches window, so it must be client-only
const VenueMap = dynamic(
  () => import("@/components/shared/venue-map").then((mod) => mod.VenueMap),
  { ssr: false, loading: () => <Skeleton className="h-[200px] w-full rounded-xl" /> }
);

interface EventDetailClientProps {
  slug: string;
}

export default function EventDetailClient({ slug }: EventDetailClientProps) {
  const { data: event, isLoading, isError } = useEventBySlug(slug);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Banner skeleton with shimmer */}
        <div className="relative aspect-[21/9] w-full rounded-2xl overflow-hidden bg-muted/50">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-8">
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="font-display font-bold text-2xl text-foreground">Event Not Found</h1>
          <p className="text-muted-foreground max-w-md">
            The event you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link href="/events">
            <Button variant="outline" className="min-h-[44px] rounded-xl font-bold">
              Browse Events
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return <EventDetailContent event={event} />;
}

function EventDetailContent({ event }: { event: import("@/lib/types").Event }) {
  const [galleryOpen, setGalleryOpen] = React.useState<string | null>(null);

  // Fetch similar events from the same category
  const { data: similarData } = useEvents({ limit: 4, category: event.category.slug });
  const similar = (similarData?.data ?? []).filter((e) => e.id !== event.id).slice(0, 3);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `Check out ${event.title} on Eventology!`;

  const shareOptions = [
    {
      icon: Copy,
      label: "Copy Link",
      action: () => {
        navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied!");
      }
    },
    {
      icon: Share2,
      label: "Native Share",
      action: async () => {
        if (navigator.share) {
          try {
            await navigator.share({
              title: event.title,
              text: shareText,
              url: shareUrl,
            });
            toast.success("Shared successfully!");
          } catch (err) {
            if ((err as Error).name !== 'AbortError') {
              toast.error("Failed to share.");
            }
          }
        } else {
          toast.info("Native share not supported on this device. Copied link instead.");
          navigator.clipboard.writeText(shareUrl);
        }
      }
    },
    {
      icon: ExternalLink,
      label: "Share on X",
      action: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, "_blank")
    },
    {
      icon: ExternalLink,
      label: "Share on Telegram",
      action: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, "_blank")
    },
    {
      icon: ExternalLink,
      label: "Share on WhatsApp",
      action: () => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, "_blank")
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="relative aspect-[21/9] rounded-2xl overflow-hidden mb-6">
          <FallbackImage
            src={event.bannerImage}
            alt={event.title}
            categoryHint={event.category?.slug || "default"}
            aspectRatio="none"
            className="w-full h-full rounded-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10" />
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="backdrop-blur-md bg-secondary/90 text-white border-none">{event.category.name}</Badge>
              {event.isFeatured && <Badge variant="accent" className="shadow-accent-glow border-none">Featured</Badge>}
            </div>
            <h1 className="font-display font-bold text-3xl text-white drop-shadow-lg">{event.title}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-white/80">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(event.date)}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
            </div>
          </div>
          <div className="absolute top-4 right-4 z-20">
            <div className="relative group">
              <button className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors border border-white/20">
                <Share2 className="h-4 w-4 text-white" />
              </button>
              <div className="absolute right-0 top-12 w-48 bg-card/95 backdrop-blur-xl rounded-xl border border-border shadow-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                {shareOptions.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={opt.action}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-left font-medium min-h-[36px]"
                  >
                    <opt.icon className="h-4 w-4 shrink-0" /> {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky detail bar — glassmorphism */}
        <div className="sticky top-16 z-30 backdrop-blur-xl bg-background/80 border-b border-border/60 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 mb-6">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDate(event.date)}</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{event.time}</span>
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{event.location}</span>
              <span className="font-medium text-primary">{event.ticketType === "free" ? "Free" : `From ${formatCurrency(event.ticketTiers[0]?.price ?? 0)}`}</span>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-lg bg-muted/50 hover:bg-muted border border-border/50 text-foreground hover:text-primary transition-colors"
                    aria-label="Add to Calendar"
                  >
                    <CalendarPlus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="center" className="bg-card text-card-foreground border border-border shadow-xl rounded-xl px-3 py-1.5 text-xs">
                  Add to Calendar
                </TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 rounded-lg bg-muted/50 hover:bg-muted border border-border/50 text-foreground font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <CalendarPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add to Calendar</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="w-64 bg-card/95 backdrop-blur-xl border border-border shadow-xl rounded-xl p-2 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                >
                  <AnimatePresence mode="popLayout">
                    <CalendarDropdownItem
                      icon={Download}
                      iconBg="bg-primary/15"
                      iconColor="text-primary"
                      label="Download ICS File"
                      description="Save to Apple Calendar, Outlook, or any calendar app"
                      onClick={() => {
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
                        toast.success("ICS file downloaded");
                      }}
                    />
                    <CalendarDropdownItem
                      icon={Calendar}
                      iconBg="bg-success/15"
                      iconColor="text-success"
                      label="Google Calendar"
                      description="Open in Google Calendar web app"
                      onClick={() => {
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
                        toast.success("Opening Google Calendar");
                      }}
                    />
                  </AnimatePresence>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link href={`/register/${event.id}`}>
                <Button variant="accent" size="sm" className="font-bold h-9 rounded-lg min-h-[44px]">Register Now</Button>
              </Link>
            </div>
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
              {event.gallery.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {event.gallery.slice(0, 4).map((img, idx) => (
                    <button key={idx} onClick={() => setGalleryOpen(img)} className="relative aspect-video rounded-xl overflow-hidden hover:opacity-90 transition-opacity border border-border/40">
                      <FallbackImage
                        src={img}
                        alt={`Gallery ${idx + 1}`}
                        categoryHint={event.category?.slug || "default"}
                        aspectRatio="video"
                        className="w-full h-full rounded-none"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 rounded-xl bg-muted/30 border border-border/40">
                  <p className="text-sm text-muted-foreground">No gallery images yet.</p>
                </div>
              )}
            </section>

            {/* Verified Attendee Reviews Section */}
            <EventReviews event={{ id: event.id, slug: event.slug, title: event.title, date: event.date }} />

            {similar.length > 0 && (
              <section className="mt-12">
                <h2 className="font-display font-semibold text-xl mb-4">You Might Also Like</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {similar.map((e) => (
                    <EventCard key={e.id} event={e} />
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <Card className="sticky top-24 shadow-lg overflow-hidden border-border/60">
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
                        <Progress value={tier.capacity > 0 ? (tier.sold / tier.capacity) * 100 : 0} className="mt-2 h-1.5" />
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
                <VenueMap
                  lat={event.coordinates.lat}
                  lng={event.coordinates.lng}
                  title={event.location}
                  address={event.address}
                  height="200px"
                />
                <p className="text-xs text-muted-foreground mt-2">{event.address}, {event.subCity}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>

      <Dialog open={!!galleryOpen} onOpenChange={() => setGalleryOpen(null)}>
        <DialogContent className="max-w-3xl p-2 bg-card/95 backdrop-blur-xl border-border/60">
          {galleryOpen && (
            <div className="relative aspect-video">
              <FallbackImage
                src={galleryOpen}
                alt="Gallery"
                aspectRatio="video"
                className="w-full h-full rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
