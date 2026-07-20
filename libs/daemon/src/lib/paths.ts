import os from 'node:os';
import path from 'node:path';

export const runtimeDir = path.join(os.tmpdir(), 'udl');
export const socketPath = path.join(runtimeDir, 'engine.sock');
export const pidFilePath = path.join(runtimeDir, 'engine.pid');
export const logFilePath = path.join(runtimeDir, 'engine.log');
