import {
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
    payload: RpcRequest<T>,
  ): Promise<RpcResponse<T>> {
    try {
      const result = await this.transport.send(JSON.stringify(payload));
      // `messages[type].responsePayload` is resolved against T's constraint
      // (the full RpcMessageKey union) rather than the literal T, so TS
      // collapses the call's return type to one arbitrary member instead of
      // RpcResponse<T>. `type` is the literal key actually used to pick the
      // schema above, so the runtime-validated result is guaranteed to match
      // RpcResponse<T> — assert it here at this one boundary.
      const parsed = messages[type].responsePayload.parse(
        JSON.parse(result),
      ) as RpcResponse<T>;
      return parsed;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
