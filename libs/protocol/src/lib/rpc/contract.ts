import z from 'zod';

type Handler = {
  requestPayload?: z.ZodType;
  responsePayload?: z.ZodType;
};

const downloadSchema = z.object({ id: z.string() });

export const messages = {
  addDownload: {
    requestPayload: z.object({
      url: z.string(),
    }),
    responsePayload: z.never(),
  },
  listDownloads: {
    requestPayload: z.never(),
    responsePayload: downloadSchema.array(),
  },
} as const satisfies Record<string, Handler>;

export type RpcMessageKey = keyof typeof messages;

export type RpcRequest<T extends RpcMessageKey> = z.infer<
  (typeof messages)[T]['requestPayload']
>;

export type RpcResponse<T extends RpcMessageKey> = z.infer<
  (typeof messages)[T]['responsePayload']
>;

export interface Transport {
  send: (data: string) => Promise<string>;
}
