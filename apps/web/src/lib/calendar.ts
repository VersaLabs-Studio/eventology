/**
 * Calendar Utilities
 * Handles ICS file generation, formatting, and Google Calendar deep links.
 */

export function formatUTCDateTimeForICS(dateInput: Date | string): string {
  const date = new Date(dateInput);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

export function escapeICSString(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

export function getGoogleCalendarLink(event: {
  title: string;
  description?: string;
  short_description?: string;
  start_date: string;
  end_date: string;
  venue_name?: string;
  venue_address?: string;
  slug: string;
}): string {
  const location = event.venue_name
    ? (event.venue_address ? `${event.venue_name}, ${event.venue_address}` : event.venue_name)
    : (event.venue_address || 'Online');

  const desc = event.short_description || event.description?.replace(/<[^>]*>/g, '') || '';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://eventology.app');
  const url = `${baseUrl}/events/${event.slug}`;
  const fullDesc = `${desc}\n\nEvent Link: ${url}`;

  const startStr = formatUTCDateTimeForICS(event.start_date);
  const endStr = formatUTCDateTimeForICS(event.end_date);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startStr}/${endStr}&details=${encodeURIComponent(fullDesc)}&location=${encodeURIComponent(location)}`;
}

export function downloadSingleEventICS(event: {
  id: string;
  title: string;
  description?: string;
  short_description?: string;
  start_date: string;
  end_date: string;
  venue_name?: string;
  venue_address?: string;
  slug: string;
}) {
  const location = event.venue_name
    ? (event.venue_address ? `${event.venue_name}, ${event.venue_address}` : event.venue_name)
    : (event.venue_address || 'Online');

  const desc = event.short_description || event.description?.replace(/<[^>]*>/g, '') || '';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  const url = `${baseUrl}/events/${event.slug}`;
  const fullDesc = `${desc}\n\nEvent Link: ${url}`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@eventology.app`,
    `SUMMARY:${escapeICSString(event.title)}`,
    `DTSTART:${formatUTCDateTimeForICS(event.start_date)}`,
    `DTEND:${formatUTCDateTimeForICS(event.end_date)}`,
    `DESCRIPTION:${escapeICSString(fullDesc)}`,
    `LOCATION:${escapeICSString(location)}`,
    `URL:${url}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `${event.slug}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}
