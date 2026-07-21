import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { logFilePath, pidFilePath, socketPath } from './paths.js';
import { isDaemonRunning } from './pidfile.js';

export type EnsureDaemonRunningOptions = {
  entry: string;
  timeoutMs?: number;
};

export async function ensureDaemonRunning(
  options: EnsureDaemonRunningOptions,
): Promise<void> {
  if (isDaemonRunning(pidFilePath)) return;
  spawnDaemon(options.entry);
  await waitForSocket(options.timeoutMs ?? 5000);
}

function spawnDaemon(entry: string): void {
  fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
  const log = fs.openSync(logFilePath, 'a');
  // compiled engine binaries are directly executable; a .js entry (dev
  // workflow) still needs to be run through the current runtime, since
  // process.execPath is the engine binary itself once the cli is compiled
  const isScript = entry.endsWith('.js');
  const child = spawn(
    isScript ? process.execPath : entry,
    isScript ? [entry] : [],
    {
      detached: true,
      stdio: ['ignore', log, log],
    },
  );
  child.unref();
}

// the daemon only accepts connections once rpc + transport servers have finished binding
function waitForSocket(timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const probe = net.createConnection(socketPath);

      probe.once('connect', () => {
        probe.end();
        resolve();
      });

      probe.once('error', () => {
        probe.destroy();
        if (Date.now() >= deadline) {
          reject(
            new Error(`daemon did not become ready within ${timeoutMs}ms`),
          );
          return;
        }
        setTimeout(attempt, 50);
      });
    };

    attempt();
  });
}
