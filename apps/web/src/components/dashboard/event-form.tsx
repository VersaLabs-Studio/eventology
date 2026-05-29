"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { ImageUpload } from "@/components/shared/image-upload";
import { TicketTierEditor } from "@/components/dashboard/ticket-tier-editor";
import { Separator } from "@/components/ui/separator";
import { categories } from "@/lib/mock-data";

export function EventForm() {
  const [title, setTitle] = React.useState("");
  const [shortDescription, setShortDescription] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [eventType, setEventType] = React.useState("");
  const [date, setDate] = React.useState("");
  const [startTime, setStartTime] = React.useState("");
  const [endTime, setEndTime] = React.useState("");
  const [venue, setVenue] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [subCity, setSubCity] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [tags, setTags] = React.useState("");

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
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Event Type</Label>
              <Select value={eventType} onValueChange={setEventType}>
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
            <Label>Date</Label>
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
                {["Bole", "Arada", "Kirkos", "Lideta", "Yeka", "Kolfe Keranio", "Nifas Silk-Lafto", "Addis Ketema", "Akaki Kality", "Gulele"].map((s) => (
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
            <ImageUpload />
          </div>
          <div>
            <Label>Gallery Images (up to 4)</Label>
            <div className="grid grid-cols-2 gap-3">
              <ImageUpload />
              <ImageUpload />
              <ImageUpload />
              <ImageUpload />
            </div>
          </div>
        </div>
      </section>

      <Separator />

      <section>
        <h3 className="font-display font-semibold text-lg mb-4">5. Description</h3>
        <RichTextEditor value={description} onChange={setDescription} />
      </section>

      <Separator />

      <section>
        <h3 className="font-display font-semibold text-lg mb-4">6. Tickets</h3>
        <TicketTierEditor />
      </section>

      <Separator />

      <section>
        <h3 className="font-display font-semibold text-lg mb-4">7. Tags</h3>
        <Input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Comma-separated tags (e.g., technology, innovation, addis)"
        />
      </section>

      <Separator />

      <div className="flex items-center gap-3 pb-8">
        <Button variant="outline">Save as Draft</Button>
        <Button variant="secondary">Preview</Button>
        <Button variant="accent">Submit for Review</Button>
      </div>
    </div>
  );
}
