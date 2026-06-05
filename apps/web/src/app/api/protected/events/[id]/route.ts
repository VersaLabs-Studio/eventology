import { createUpdateHandler, createDeleteHandler } from '@/lib/api';
import { updateEventSchema } from '@eventology/schemas';

export const PUT = createUpdateHandler('events', updateEventSchema);
export const DELETE = createDeleteHandler('events');
