import z from 'zod';

export const eventsConfig = {
  'download:queued': z.object({
    id: z.string(),
    url: z.string(),
  }),
  'download:started': z.object({
    id: z.string(),
    url: z.string(),
  }),
  'download:finished': z.object({
    id: z.string(),
    url: z.string(),
  }),
  'download:failed': z.object({
    id: z.string(),
    url: z.string(),
    error: z.string(),
  }),
} as const satisfies Record<string, z.ZodObject>;

export type EventsConfig = typeof eventsConfig;
export type Event = keyof EventsConfig;
export type EventPayload<T extends Event> = z.infer<EventsConfig[T]>;
