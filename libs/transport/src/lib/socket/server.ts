import { RpcMessageKey, ServerTransport } from '@udl/protocol';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import readline from 'node:readline';
import { socketUrl } from './constants.js';
import { socketRequestSchema } from './types.js';

type RequestHandler = (type: RpcMessageKey, payload: string) => Promise<string>;

export class SocketTransportServer implements ServerTransport {
  private readonly server = net.createServer((socket) =>
    this.handleConnection(socket),
  );
  private handler: RequestHandler | undefined;

  onRequest(handler: RequestHandler) {
    this.handler = handler;
  }

  listen(): Promise<void> {
    fs.mkdirSync(path.dirname(socketUrl), { recursive: true });
    fs.rmSync(socketUrl, { force: true });

    return new Promise((resolve) => {
      this.server.listen(socketUrl, resolve);
    });
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close((error) => (error ? reject(error) : resolve()));
    });
  }

  private handleConnection(socket: net.Socket) {
    const rl = readline.createInterface({ input: socket });
    rl.on('line', (line) => this.handleLine(socket, line));
  }

  private async handleLine(socket: net.Socket, line: string) {
    let id: string | undefined;
    try {
      const request = socketRequestSchema.parse(JSON.parse(line));
      id = request.id;

      if (!this.handler) throw new Error('no request handler registered');
      // The concrete RPC methods live in `@udl/protocol`'s `messages` map,
      // not here — the transport stays agnostic to what methods exist and
      // leaves unknown-method validation to the handler it's given.
      const payload = await this.handler(
        request.type as RpcMessageKey,
        request.payload,
      );

      socket.write(JSON.stringify({ type: 'response', id, payload }) + '\n');
    } catch (error) {
      if (!id) {
        console.error(error);
        return;
      }
      socket.write(
        JSON.stringify({
          type: 'error',
          id,
          error: error instanceof Error ? error.message : String(error),
        }) + '\n',
      );
    }
  }
}
