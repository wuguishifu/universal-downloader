import { RpcMessageKey, Transport } from '@udl/protocol';
import net from 'node:net';
import readline from 'node:readline';
import { socketResponseSchema } from './types.js';

export class SocketTransportClient implements Transport {
  private readonly socket: net.Socket;

  private readonly pending = new Map<
    string,
    {
      resolve: (payload: string) => void;
      reject: (error: Error) => void;
    }
  >();

  constructor(socketPath: string) {
    this.socket = net.createConnection(socketPath);

    const rl = readline.createInterface({
      input: this.socket,
    });

    rl.on('line', (message) => this.handleMessage(message));
  }

  send(type: RpcMessageKey, payload: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      this.pending.set(id, { resolve, reject });
      this.socket.write(JSON.stringify({ id, type, payload }) + '\n');
    });
  }

  handleMessage(line: string) {
    const message = socketResponseSchema.parse(JSON.parse(line));

    const pending = this.pending.get(message.id);
    if (!pending) return;
    this.pending.delete(message.id);

    if (message.type === 'response') {
      return pending.resolve(message.payload);
    } else {
      return pending.reject(new Error(message.error));
    }
  }
}
