import { Event, Registration, PlatformStats } from "../types";
import { events } from "./events";
import { categories } from "./categories";
export { events } from "./events";
export { categories } from "./categories";
export { organizers } from "./organizers";
export { users } from "./users";
export { registrations } from "./registrations";
export * from "./analytics";
export * from "./audit-log";

export function getEventBySlug(slug: string): Event | undefined {
  return events.find((e) => e.slug === slug);
}

export function getEventById(id: string): Event | undefined {
  return events.find((e) => e.id === id);
}

export function getEventsByCategory(categorySlug: string): Event[] {
  return events.filter((e) => e.category.slug === categorySlug);
}

export function getFeaturedEvents(): Event[] {
  return events.filter((e) => e.isFeatured);
}

export function getUpcomingEvents(): Event[] {
  const now = new Date();
  return events.filter((e) => new Date(e.date) >= now).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function getEventRegistrations(eventId: string): Registration[] {
  const { registrations } = require("./registrations");
  return registrations.filter((r: Registration) => r.eventId === eventId);
}

export function searchEvents(query: string): Event[] {
  const q = query.toLowerCase();
  return events.filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.shortDescription.toLowerCase().includes(q) ||
      e.organizer.name.toLowerCase().includes(q) ||
      e.tags.some((t) => t.toLowerCase().includes(q)) ||
      e.location.toLowerCase().includes(q) ||
      e.address.toLowerCase().includes(q)
  );
}

export function getEventsBySubCity(subCity: string): Event[] {
  return events.filter((e) => e.subCity.toLowerCase() === subCity.toLowerCase());
}

export function getOrganizerEvents(organizerId: string): Event[] {
  return events.filter((e) => e.organizer.id === organizerId);
}

export function getPlatformStats(): PlatformStats {
  const { platformStats } = require("./analytics");
  return platformStats;
}
