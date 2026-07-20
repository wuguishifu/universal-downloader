import {
  decodePayload,
  encodePayload,
  messages,
  RpcHandler,
  RpcHandlers,
  RpcMessageKey,
  RpcRequest,
  ServerTransport,
} from './contract.js';

export class RpcServer {
  constructor(
    private readonly handlers: RpcHandlers,
    private readonly transport: ServerTransport,
  ) {
    this.transport.onRequest((type, payload) => this.dispatch(type, payload));
  }

  listen() {
    return this.transport.listen();
  }

  close() {
    return this.transport.close();
  }

  private async dispatch(type: RpcMessageKey, payload: string) {
    const schema = messages[type];
    if (!schema) throw new Error(`unknown rpc method: ${type}`);

    const request = schema.requestPayload.parse(
      decodePayload(payload),
    ) as RpcRequest<RpcMessageKey>;

    // `this.handlers[type]` is resolved against RpcMessageKey (the full
    // union) rather than the literal key `type` holds at runtime, so TS
    // would otherwise compute it as an intersection of every handler's
    // parameter type. `type` is the same literal key used to pick the
    // schema above, so the zod-validated `request` is guaranteed to match
    // what this handler expects — assert it here at this one boundary.
    const handler = this.handlers[type] as RpcHandler<RpcMessageKey>;
    const result = await handler(request);

    return encodePayload(schema.responsePayload.parse(result));
  }
}
