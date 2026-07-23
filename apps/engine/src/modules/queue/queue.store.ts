import { dataDir, queueFilePath } from '@udl/daemon';
import fs from 'node:fs';
import { DownloadJob } from './queue.types';

export function loadJobs(): DownloadJob[] {
  if (!fs.existsSync(queueFilePath)) return [];
  return JSON.parse(fs.readFileSync(queueFilePath, 'utf-8'));
}

export function saveJobs(jobs: DownloadJob[]): void {
  fs.mkdirSync(dataDir, { recursive: true });
  const tmpPath = `${queueFilePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(jobs, null, 2));
  fs.renameSync(tmpPath, queueFilePath);
}
