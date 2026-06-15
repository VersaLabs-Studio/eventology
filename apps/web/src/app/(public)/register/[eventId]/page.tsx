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
import { Calendar, MapPin, Ticket, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { paymentsEnabled } from "@/lib/config/features";
import { useLocale } from "@/lib/i18n";

/**
 * R3 / A1 — Payments-off gating.
 *
 * When `NEXT_PUBLIC_PAYMENTS_ENABLED` is `false` (the MVP default):
 *   - Paid tiers render disabled with a "Tickets on sale soon" badge.
 *   - The submit button always takes the free path
 *     (no `checkout_url`, ticket issued immediately).
 *   - A "Payments are coming soon" notice is shown above the form.
 *
 * When the flag is `true` (post-MVP), the paid flow is restored with
 * zero code changes.
 */
export default function RegisterPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const { user } = useAuth();
  const { t } = useLocale();
  const paymentsOn = paymentsEnabled();

  const { data: event, isLoading, isError } = useEventBySlug(eventId);
  const createRegistration = useCreateRegistration();

  // Tiers the user can actually select. When payments are off we filter
  // out any paid tier; if every tier is paid, the form is replaced with
  // a "Tickets on sale soon" placeholder.
  const selectableTiers = React.useMemo(() => {
    const all = event?.ticketTiers ?? [];
    if (paymentsOn) return all;
    return all.filter((t) => t.price === 0);
  }, [event, paymentsOn]);

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

  // Auto-select the first SELECTABLE tier (skips paid tiers when off)
  React.useEffect(() => {
    if (selectableTiers.length && !selectedTier) {
      setSelectedTier(selectableTiers[0].id);
    }
    // If the previously selected tier is no longer selectable (e.g. user
    // toggled the flag), clear it so the placeholder renders.
    if (selectedTier && !selectableTiers.find((t) => t.id === selectedTier)) {
      setSelectedTier(null);
    }
  }, [selectableTiers, selectedTier]);

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
          title={t('registration.eventNotFound')}
          description={t('registration.eventNotFoundBody')}
          action={{ label: t('registration.browseEvents'), onClick: () => router.push("/events") }}
        />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTier) {
      toast.error(t('registration.pleaseSelectTier'));
      return;
    }

    if (!attendeeName || !attendeeEmail) {
      toast.error(t('registration.pleaseFillNameEmail'));
      return;
    }

    setIsSubmitting(true);

    try {
      // The server already enforces the same gate (paymentsEnabledServer)
      // in the registrations route — this client-side check is defense
      // in depth, never the only line.
      const tier = selectableTiers.find((t) => t.id === selectedTier);
      if (!tier) {
        toast.error(t('registration.notAvailable'));
        setIsSubmitting(false);
        return;
      }

      const result = await createRegistration.mutateAsync({
        event_id: event.id,
        ticket_tier_id: selectedTier,
        attendee_name: attendeeName,
        attendee_email: attendeeEmail,
        attendee_phone: attendeePhone || undefined,
      });

      // R3 / A1: when payments are off, the server never returns a
      // `checkout_url` (the paid path is short-circuited server-side too).
      const resultData = result as { checkout_url?: string; registration?: { id: string } };
      if (resultData.checkout_url && paymentsOn) {
        toast.success(t('registration.successPaid'));
        router.push(resultData.checkout_url);
      } else {
        toast.success(t('registration.successFree'));
        router.push("/my-events");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('registration.failed');
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTierData = event.ticketTiers?.find((t) => t.id === selectedTier);
  const isFree = !selectedTierData || selectedTierData.price === 0;

  // Payments-off + no free tiers → there's nothing to register for.
  if (!paymentsOn && selectableTiers.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <PageHeader title={t('registration.title', { event: event.title })} />
          <Card>
            <CardContent className="p-8 text-center space-y-3">
              <Clock className="h-10 w-10 text-accent mx-auto" />
              <h3 className="font-display font-bold text-lg">{t('payments.ticketsOnSaleSoon')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('payments.ticketsOnSaleSoonBody')}
              </p>
              <Link href={`/events/${event.slug}`} className="inline-block">
                <Button variant="outline" className="min-h-[44px] rounded-xl font-bold">
                  {t('payments.backToEvent')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader title={t('registration.title', { event: event.title })} />

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
              {isFree ? t('events.free') : `From ${formatCurrency(selectedTierData?.price ?? 0)}`}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            {!paymentsOn && (
              <div className="mb-4 rounded-xl border border-accent/30 bg-accent/5 p-3 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground mb-1">{t('payments.noticeTitle')}</p>
                <p>{t('payments.noticeBody')}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Ticket Tier Selection */}
              {event.ticketTiers && event.ticketTiers.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-3">{t('registration.selectTier')}</label>
                  <div className="space-y-2">
                    {event.ticketTiers.map((tier) => {
                      const isPaid = tier.price > 0;
                      const disabled = !paymentsOn && isPaid;
                      const isSelected = selectedTier === tier.id;
                      return (
                        <label
                          key={tier.id}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : disabled
                                ? "border-border bg-muted/30 cursor-not-allowed opacity-60"
                                : "border-border hover:border-primary/50 cursor-pointer"
                          }`}
                          aria-disabled={disabled}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="tier"
                              value={tier.id}
                              checked={isSelected}
                              disabled={disabled}
                              onChange={() => !disabled && setSelectedTier(tier.id)}
                              className="h-4 w-4 text-primary disabled:cursor-not-allowed"
                              aria-label={tier.name}
                            />
                            <div>
                              <p className="font-medium text-sm">{tier.name}</p>
                              {tier.description && (
                                <p className="text-xs text-muted-foreground">{tier.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {disabled && (
                              <Badge variant="outline" className="text-[10px]">{t('payments.soon')}</Badge>
                            )}
                            <p className="font-extrabold text-sm text-primary">
                              {tier.price === 0 ? t('registration.free') : formatCurrency(tier.price)}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Attendee Info */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">
                    {t('registration.fullName')} *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={attendeeName}
                    onChange={(e) => setAttendeeName(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('registration.fullNamePlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">
                    {t('auth.email')} *
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={attendeeEmail}
                    onChange={(e) => setAttendeeEmail(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('registration.emailPlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-1">
                    {t('registration.phone')}
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={attendeePhone}
                    onChange={(e) => setAttendeePhone(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('registration.phonePlaceholder')}
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
                  t('registration.processing')
                ) : isFree ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {t('registration.registerNow')}
                  </>
                ) : (
                  <>
                    <Ticket className="mr-2 h-4 w-4" />
                    {t('registration.continueToPayment')}
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
