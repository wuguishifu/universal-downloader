import { ensureDaemonRunning, socketPath } from '@udl/daemon';
import { RpcClient } from '@udl/protocol';
import { SocketTransportClient } from '@udl/transport';
import path from 'node:path';

// The cli can't depend on the engine app directly (apps may only depend on
// libs, per this workspace's module boundaries), so the entry path is
// supplied out of band. A real install places udl-engine next to udl (see
// install.sh), so the compiled binary finds it relative to its own path —
// process.execPath is the currently running executable itself once compiled,
// not a node/bun runtime, so this needs no PATH lookup or env var. Dev only
// falls back to the workspace-relative nx build output.
function defaultEngineEntry(): string {
  const execName = path.basename(process.execPath);
  if (execName === 'udl' || execName === 'udl.exe') {
    const engineName = execName === 'udl.exe' ? 'udl-engine.exe' : 'udl-engine';
    return path.join(path.dirname(process.execPath), engineName);
  }
  return path.resolve(process.cwd(), 'apps/engine/dist/main.js');
}

const ENGINE_ENTRY = process.env.UDL_ENGINE_ENTRY ?? defaultEngineEntry();

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
        const suffix = download.error ? ` (${download.error})` : '';
        console.log(`[${download.status}] ${download.url}${suffix}`);
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
