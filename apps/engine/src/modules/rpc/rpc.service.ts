import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import {
  createIdleTimer,
  IdleTimer,
  pidFilePath,
  releaseDaemonLock,
  socketPath,
} from '@udl/daemon';
import { RpcServer } from '@udl/protocol';
import { SocketTransportServer } from '@udl/transport';
import { QueueService } from '../queue/queue.service';

// once the daemon goes this long with no incoming RPC calls, it shuts
// itself down rather than sitting around holding resources.
const IDLE_TIMEOUT_MS = 30_000;

const noOpIdleTimer = { touch: () => undefined, stop: () => undefined };

@Injectable()
export class RpcService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly idleTimer: IdleTimer;
  private readonly server: RpcServer;

  constructor(downloads: QueueService) {
    this.idleTimer =
      process.env.DISABLE_IDLE_TIME === 'true'
        ? noOpIdleTimer
        : createIdleTimer(IDLE_TIMEOUT_MS, () => {
            // nest's shutdown hooks are wired to process signals (see
            // `app.enableShutdownHooks()` in main.ts) rather than to an in-process
            // `close()` call, so idling out reuses that same signal-driven path.
            process.kill(process.pid, 'SIGTERM');
          });

    this.server = new RpcServer(
      {
        addDownload: ({ url }: { url: string }) => {
          downloads.addDownload(url);
        },
        listDownloads: () => downloads.listDownloads(),
      },
      new SocketTransportServer(socketPath),
      { beforeRequest: () => this.idleTimer.touch() },
    );
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.server.listen();
  }

  async onApplicationShutdown(): Promise<void> {
    this.idleTimer.stop();
    await this.server.close();
    releaseDaemonLock(pidFilePath);
  }
}
