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
    responsePayload: z.void(),
  },
  listDownloads: {
    requestPayload: z.void(),
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

// `JSON.stringify(undefined)` returns the *value* `undefined`, not a string,
// so payload-less messages (anything typed `void` above) can't round-trip
// through a `string`-typed wire format the normal way. Encode "no payload"
// as `''` on both sides instead.
export function encodePayload(value: unknown): string {
  return value === undefined ? '' : JSON.stringify(value);
}

export function decodePayload(raw: string): unknown {
  return raw === '' ? undefined : JSON.parse(raw);
}

export interface Transport {
  send: (type: RpcMessageKey, payload: string) => Promise<string>;
}
