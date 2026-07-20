import { Transport } from '@udl/protocol';
import net from 'node:net';
import readline from 'node:readline';
import { socketUrl } from './constants.js';
import { socketResponseSchema } from './types.js';

export class SocketTransport implements Transport {
  private socket = net.createConnection(socketUrl);

  private readonly pending = new Map<
    string,
    {
      resolve: (payload: string) => void;
      reject: (error: Error) => void;
    }
  >();

  constructor() {
    const rl = readline.createInterface({
      input: this.socket,
    });

    rl.on('line', (message) => this.handleMessage(message));
  }

  send(data: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      this.pending.set(id, { resolve, reject });
      this.socket.write(data + '\n');
    });
  }

  handleMessage(line: string) {
    try {
      const message = socketResponseSchema.parse(JSON.parse(line));

      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);

      if (message.type === 'response') {
        return pending.resolve(message.payload);
      } else {
        return pending.reject(new Error(message.error));
      }
    } catch (error) {
      console.error(error);
    }
  }
}
