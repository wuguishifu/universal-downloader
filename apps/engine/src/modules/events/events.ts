import z from 'zod';

export const eventsConfig = {
  'download:queued': z.object({
    url: z.string(),
  }),
  'download:started': z.object({}),
  'download:finished': z.object({}),
} as const satisfies Record<string, z.ZodObject>;

export type EventsConfig = typeof eventsConfig;
export type Event = keyof EventsConfig;
export type EventPayload<T extends Event> = z.infer<EventsConfig[T]>;
