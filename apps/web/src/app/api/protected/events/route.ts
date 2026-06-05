import { createCreateHandler } from '@/lib/api';
import { createEventSchema } from '@eventology/schemas';

export const POST = createCreateHandler('events', createEventSchema);
