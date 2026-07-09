"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { ImageUpload } from "@/components/shared/image-upload";
import { TicketTierEditor } from "@/components/dashboard/ticket-tier-editor";
import { Separator } from "@/components/ui/separator";
import { AIGenerateButton } from "@/components/ai/ai-generate-button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories } from "@/hooks/use-categories-venues";
import { useCreateEvent } from "@/hooks/use-events";
import { toast } from "sonner";
import { ADDIS_SUB_CITIES } from "@eventology/config";
import { EVENT_TYPES } from "@eventology/schemas";

type EventType = (typeof EVENT_TYPES)[number];

/**
 * Create-only event form. Posts once to /api/protected/events with
 * status 'draft' (Save) or 'pending' (Submit for Review). Status is
 * server-controlled on update, so we never follow-up with a PUT.
 */
export function EventForm() {
  const router = useRouter();
  const catsQ = useCategories();
  const create = useCreateEvent();

  const [title, setTitle] = React.useState("");
  const [shortDescription, setShortDescription] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [eventType, setEventType] = React.useState<EventType>("conference");
  const [date, setDate] = React.useState("");
  const [startTime, setStartTime] = React.useState("");
  const [endTime, setEndTime] = React.useState("");
  const [venue, setVenue] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [subCity, setSubCity] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [tags, setTags] = React.useState("");

  // Real media state — uploaded to Supabase Storage (event-banners bucket).
  const [bannerImage, setBannerImage] = React.useState<string | null>(null);
  const [gallery, setGallery] = React.useState<(string | null)[]>(Array(4).fill(null));
  const setGallerySlot = (i: number, url: string | null) =>
    setGallery((prev) => prev.map((u, idx) => (idx === i ? url : u)));

  // AI-004: "✨ Generate" handlers — populate form fields from AI output
  function applyDescription(result: { description?: string; short_description?: string }) {
    if (result.description) setDescription(result.description);
    if (result.short_description) setShortDescription(result.short_description);
  }

  function applyTags(result: { tags?: string[] }) {
    if (result.tags && result.tags.length > 0) setTags(result.tags.join(", "));
  }

  const aiInput = {
    title,
    event_type: eventType || "conference",
    category: category || "General",
    venue_name: venue || null,
    start_date: date ? new Date(date).toISOString() : new Date().toISOString(),
    tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    short_description: shortDescription || null,
  };

  const submit = async (status: 'draft' | 'pending') => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!category) {
      toast.error('Category is required');
      return;
    }
    if (!date) {
      toast.error('Start date is required');
      return;
    }
    try {
      // Single POST — status is set server-side from this field (draft|pending only).
      // No follow-up PUT: status is SERVER_CONTROLLED and events UPDATE RLS is strict.
      const created = await create.mutateAsync({
        title: title.trim(),
        slug:
          (title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 50) ||
            `event-${Date.now()}`) + `-${Math.random().toString(36).slice(2, 8)}`,
        description: description || undefined,
        short_description: shortDescription || undefined,
        banner_image: bannerImage || undefined,
        category_id: category,
        event_type: eventType,
        ticket_type: 'paid',
        start_date: new Date(`${date}T${startTime || '09:00'}:00`).toISOString(),
        end_date: new Date(`${date}T${endTime || '17:00'}:00`).toISOString(),
        timezone: 'Africa/Addis_Ababa',
        venue_name: venue || undefined,
        venue_address: address || undefined,
        sub_city: subCity || undefined,
        capacity: 100,
        tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        gallery: gallery.filter((u): u is string => Boolean(u)),
        metadata: {},
        status,
      });
      toast.success(status === 'draft' ? 'Saved as draft' : 'Submitted for review');
      router.push(`/org/events/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const categories = catsQ.data?.data ?? [];
  const submitting = create.isPending;

  return (
    <div className="space-y-8 max-w-3xl">
      <section>
        <h3 className="font-display font-semibold text-lg mb-4">1. Basic Info</h3>
        <div className="space-y-4">
          <div>
            <Label>Event Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Addis Tech Summit 2026" />
          </div>
          <div>
            <Label>Short Description</Label>
            <Input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="Brief summary of your event" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              {catsQ.isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label>Event Type</Label>
              <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {["conference", "workshop", "meetup", "seminar", "networking", "concert", "exhibition", "training"].map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      <section>
        <h3 className="font-display font-semibold text-lg mb-4">2. Date & Time</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Start Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Start Time</Label>
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div>
            <Label>End Time</Label>
            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </div>
      </section>

      <Separator />

      <section>
        <h3 className="font-display font-semibold text-lg mb-4">3. Location</h3>
        <div className="space-y-4">
          <div>
            <Label>Venue Name</Label>
            <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g., Millennium Hall" />
          </div>
          <div>
            <Label>Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address" />
          </div>
          <div>
            <Label>Sub-City</Label>
            <Select value={subCity} onValueChange={setSubCity}>
              <SelectTrigger><SelectValue placeholder="Select sub-city" /></SelectTrigger>
              <SelectContent>
                {ADDIS_SUB_CITIES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <Separator />

      <section>
        <h3 className="font-display font-semibold text-lg mb-4">4. Media</h3>
        <div className="space-y-4">
          <div>
            <Label>Banner Image</Label>
            <ImageUpload value={bannerImage} onChange={setBannerImage} />
          </div>
          <div>
            <Label>Gallery Images (up to 4)</Label>
            <div className="grid grid-cols-2 gap-3">
              {gallery.map((url, i) => (
                <ImageUpload
                  key={i}
                  value={url}
                  onChange={(next) => setGallerySlot(i, next)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <Separator />

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-lg">5. Description</h3>
          <AIGenerateButton
            task="description"
            input={aiInput}
            onResult={applyDescription}
            label="Generate with AI"
          />
        </div>
        <RichTextEditor value={description} onChange={setDescription} />
      </section>

      <Separator />

      <section>
        <h3 className="font-display font-semibold text-lg mb-4">6. Tickets</h3>
        <TicketTierEditor />
      </section>

      <Separator />

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-lg">7. Tags</h3>
          <AIGenerateButton
            task="tags"
            input={{ title, description, event_type: eventType, category }}
            onResult={applyTags}
            label="Suggest tags"
          />
        </div>
        <Input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Comma-separated tags (e.g., technology, innovation, addis)"
        />
      </section>

      <Separator />

      <div className="flex items-center gap-3 pb-8">
        <Button variant="outline" onClick={() => submit('draft')} disabled={submitting}>
          {submitting ? 'Saving…' : 'Save as Draft'}
        </Button>
        <Button variant="secondary" type="button" disabled>
          Preview
        </Button>
        <Button variant="accent" onClick={() => submit('pending')} disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit for Review'}
        </Button>
      </div>
    </div>
  );
}
