import z from 'zod';

export const socketRequestSchema = z.object({
  id: z.string(),
  type: z.string(),
  payload: z.string(),
});
export type SocketRequest = z.infer<typeof socketRequestSchema>;

export const socketResponseSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('response'),
    id: z.string(),
    payload: z.string(),
  }),
  z.object({
    type: z.literal('error'),
    id: z.string(),
    error: z.string(),
  }),
]);
export type SocketResponse = z.infer<typeof socketResponseSchema>;
