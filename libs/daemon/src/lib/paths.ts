import os from 'node:os';
import path from 'node:path';

export const runtimeDir = path.join(os.tmpdir(), 'udl');
export const socketPath = path.join(runtimeDir, 'engine.sock');
export const pidFilePath = path.join(runtimeDir, 'engine.pid');
export const logFilePath = path.join(runtimeDir, 'engine.log');

export const dataDir = path.join(os.homedir(), '.udl');
export const queueFilePath = path.join(dataDir, 'queue.json');
export const downloadsDir = path.join(os.homedir(), 'Downloads');
