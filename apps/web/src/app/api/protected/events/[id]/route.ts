import { createDocHandler, createUpdateHandler, createDeleteHandler } from '@/lib/api';
import { updateEventSchema } from '@eventology/schemas';

// GET by id — authed so organizers can read their own draft/pending events
// (public endpoint only returns approved events by slug).
export const GET = createDocHandler('events', 'id', true);
export const PUT = createUpdateHandler('events', updateEventSchema);
export const DELETE = createDeleteHandler('events');
