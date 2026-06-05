"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { useEventBySlug } from "@/hooks/use-events";
import { useCreateRegistration } from "@/hooks/use-registrations";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Calendar, MapPin, Ticket, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export default function RegisterPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const { user } = useAuth();

  const { data: event, isLoading, isError } = useEventBySlug(eventId);
  const createRegistration = useCreateRegistration();

  const [selectedTier, setSelectedTier] = React.useState<string | null>(null);
  const [attendeeName, setAttendeeName] = React.useState("");
  const [attendeeEmail, setAttendeeEmail] = React.useState("");
  const [attendeePhone, setAttendeePhone] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Pre-fill with user data
  React.useEffect(() => {
    if (user) {
      setAttendeeName(user.name ?? "");
      setAttendeeEmail(user.email ?? "");
    }
  }, [user]);

  // Auto-select first tier
  React.useEffect(() => {
    if (event?.ticketTiers?.length && !selectedTier) {
      setSelectedTier(event.ticketTiers[0].id);
    }
  }, [event, selectedTier]);

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <EmptyState
          icon={Ticket}
          title="Event not found"
          description="This event may have been removed or is no longer available."
          action={{ label: "Browse Events", onClick: () => router.push("/events") }}
        />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTier) {
      toast.error("Please select a ticket tier");
      return;
    }

    if (!attendeeName || !attendeeEmail) {
      toast.error("Please fill in your name and email");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createRegistration.mutateAsync({
        event_id: event.id,
        ticket_tier_id: selectedTier,
        attendee_name: attendeeName,
        attendee_email: attendeeEmail,
        attendee_phone: attendeePhone || undefined,
      });

      // Check if there's a checkout URL (paid flow)
      const resultData = result as { checkout_url?: string; registration?: { id: string } };
      if (resultData.checkout_url) {
        toast.success("Registration created! Redirecting to payment...");
        router.push(resultData.checkout_url);
      } else {
        toast.success("Registration successful! Your ticket has been issued.");
        router.push("/my-events");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTierData = event.ticketTiers?.find((t) => t.id === selectedTier);
  const isFree = !selectedTierData || selectedTierData.price === 0;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader title={`Register for ${event.title}`} />

        <Card className="mb-6">
          <div className="relative h-32 rounded-t-xl overflow-hidden">
            <Image
              src={event.bannerImage || "/placeholder-event.jpg"}
              alt={event.title}
              fill
              className="object-cover"
              sizes="500px"
            />
          </div>
          <CardContent className="p-4">
            <h3 className="font-display font-semibold">{event.title}</h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />{formatDate(event.date)}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />{event.location}
            </div>
            <Badge variant="secondary" className="mt-2">
              {isFree ? "Free" : `From ${formatCurrency(selectedTierData?.price ?? 0)}`}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Ticket Tier Selection */}
              {event.ticketTiers && event.ticketTiers.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-3">Select Ticket Tier</label>
                  <div className="space-y-2">
                    {event.ticketTiers.map((tier) => (
                      <label
                        key={tier.id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedTier === tier.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="tier"
                            value={tier.id}
                            checked={selectedTier === tier.id}
                            onChange={() => setSelectedTier(tier.id)}
                            className="h-4 w-4 text-primary"
                          />
                          <div>
                            <p className="font-medium text-sm">{tier.name}</p>
                            {tier.description && (
                              <p className="text-xs text-muted-foreground">{tier.description}</p>
                            )}
                          </div>
                        </div>
                        <p className="font-extrabold text-sm text-primary">
                          {tier.price === 0 ? "Free" : formatCurrency(tier.price)}
                        </p>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Attendee Info */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">
                    Full Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={attendeeName}
                    onChange={(e) => setAttendeeName(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Abebe Kebede"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">
                    Email *
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={attendeeEmail}
                    onChange={(e) => setAttendeeEmail(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="abebe@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-1">
                    Phone (optional)
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={attendeePhone}
                    onChange={(e) => setAttendeePhone(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="+251 9XX XXX XXX"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="accent"
                size="lg"
                className="w-full min-h-[48px] rounded-xl font-extrabold text-sm"
                disabled={isSubmitting || !selectedTier}
              >
                {isSubmitting ? (
                  "Processing..."
                ) : isFree ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Register Now
                  </>
                ) : (
                  <>
                    <Ticket className="mr-2 h-4 w-4" />
                    Continue to Payment
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
