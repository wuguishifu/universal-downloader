import fs from 'node:fs';
import path from 'node:path';

export class DaemonAlreadyRunningError extends Error {
  constructor(readonly pid: number) {
    super(`daemon already running (pid ${pid})`);
    this.name = 'DaemonAlreadyRunningError';
  }
}

export function readPidFile(pidFilePath: string): number | undefined {
  try {
    const pid = Number(fs.readFileSync(pidFilePath, 'utf8').trim());
    return Number.isInteger(pid) ? pid : undefined;
  } catch {
    return undefined;
  }
}

export function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // ESRCH: no process alive with this pid
    // EPERM: process exists but we can't use it so treat it as alive
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return (error as NodeJS.ErrnoException).code === 'EPERM';
  }
}

export function isDaemonRunning(pidFilePath: string): boolean {
  const pid = readPidFile(pidFilePath);
  return pid !== undefined && isProcessAlive(pid);
}

// idempotently acquire the lock iff the process with the pid in the pidfile isn't alive
// this accounts for crashed processes that left behind the pidfile
export function acquireDaemonLock(pidFilePath: string): void {
  fs.mkdirSync(path.dirname(pidFilePath), { recursive: true });

  for (;;) {
    try {
      fs.writeFileSync(pidFilePath, String(process.pid), { flag: 'wx' });
      return;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;

      const existingPid = readPidFile(pidFilePath);
      if (existingPid !== undefined && isProcessAlive(existingPid)) {
        throw new DaemonAlreadyRunningError(existingPid);
      }

      fs.rmSync(pidFilePath, { force: true });
    }
  }
}

export function releaseDaemonLock(pidFilePath: string): void {
  fs.rmSync(pidFilePath, { force: true });
}
