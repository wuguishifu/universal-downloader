import { ensureDaemonRunning, socketPath } from '@udl/daemon';
import { RpcClient } from '@udl/protocol';
import { SocketTransportClient } from '@udl/transport';
import path from 'node:path';

// The cli can't depend on the engine app directly (apps may only depend on
// libs, per this workspace's module boundaries), so the entry path is
// supplied out of band. The default here is only a dev-workspace fallback —
// a real install will need to set this to wherever the engine binary is
// actually bundled alongside the cli.
const ENGINE_ENTRY =
  process.env.UDL_ENGINE_ENTRY ??
  path.resolve(process.cwd(), 'apps/engine/dist/main.js');

async function main(): Promise<void> {
  const [, , command, ...args] = process.argv;

  await ensureDaemonRunning({ entry: ENGINE_ENTRY });

  const client = new RpcClient(new SocketTransportClient(socketPath));

  switch (command) {
    case 'add': {
      const [url] = args;
      if (!url) throw new Error('usage: udl add <url>');
      await client.call('addDownload', { url });
      console.log(`added ${url}`);
      break;
    }

    case 'list': {
      const downloads = await client.call('listDownloads');
      if (downloads.length === 0) {
        console.log('no downloads');
        break;
      }
      for (const download of downloads) {
        console.log(download.id);
      }
      break;
    }

    default:
      throw new Error(
        `unknown command: ${command ?? '(none)'}\nusage: udl <add|list>`,
      );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
