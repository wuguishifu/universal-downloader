import {
  decodePayload,
  encodePayload,
  messages,
  RpcMessageKey,
  RpcRequest,
  RpcResponse,
  Transport,
} from './contract.js';

export class RpcClient {
  constructor(private readonly transport: Transport) {}

  async call<T extends RpcMessageKey>(
    type: T,
    ...[payload]: RpcRequest<T> extends void ? [] : [payload: RpcRequest<T>]
  ): Promise<RpcResponse<T>> {
    const result = await this.transport.send(type, encodePayload(payload));
    // `messages[type].responsePayload` is resolved against T's constraint
    // (the full RpcMessageKey union) rather than the literal T, so TS
    // collapses the call's return type to one arbitrary member instead of
    // RpcResponse<T>. `type` is the literal key actually used to pick the
    // schema above, so the runtime-validated result is guaranteed to match
    // RpcResponse<T> — assert it here at this one boundary.
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const parsed = messages[type].responsePayload.parse(
      decodePayload(result),
    ) as RpcResponse<T>;
    return parsed;
  }
}
