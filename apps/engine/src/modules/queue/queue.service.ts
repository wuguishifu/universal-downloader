import { downloadsDir } from '@udl/daemon';
import { Injectable, OnModuleInit } from '@nestjs/common';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { EventsService } from '../events/events.service';
import { loadJobs, saveJobs } from './queue.store';
import { DownloadJob } from './queue.types';

@Injectable()
export class QueueService implements OnModuleInit {
  private jobs: DownloadJob[] = [];

  constructor(private readonly eventsService: EventsService) {}

  onModuleInit(): void {
    this.jobs = loadJobs();

    for (const job of this.jobs) {
      if (job.status !== 'in-progress') continue;

      const partPath = `${job.destinationPath}.part`;
      const finishedBeforeCrash =
        fs.existsSync(job.destinationPath) && !fs.existsSync(partPath);

      if (finishedBeforeCrash) {
        job.status = 'completed';
      } else {
        fs.rmSync(partPath, { force: true });
        job.status = 'queued';
        job.error = undefined;
      }
      job.updatedAt = new Date().toISOString();
    }

    this.persist();
  }

  addDownload(url: string): void {
    const now = new Date().toISOString();
    const job: DownloadJob = {
      id: crypto.randomUUID(),
      url,
      status: 'queued',
      destinationPath: this.resolveDestinationPath(url),
      createdAt: now,
      updatedAt: now,
    };
    this.jobs.push(job);
    this.persist();
    this.eventsService.emit('download:queued', { id: job.id, url: job.url });
  }

  listDownloads(): {
    id: string;
    url: string;
    status: DownloadJob['status'];
    error?: string;
  }[] {
    return this.jobs.map(({ id, url, status, error }) => ({
      id,
      url,
      status,
      error,
    }));
  }

  claimNextQueued(): DownloadJob | undefined {
    const job = this.jobs.find((job) => job.status === 'queued');
    if (!job) return undefined;
    job.status = 'in-progress';
    job.updatedAt = new Date().toISOString();
    this.persist();
    return job;
  }

  countInProgress(): number {
    return this.jobs.filter((job) => job.status === 'in-progress').length;
  }

  hasActiveJobs(): boolean {
    return this.jobs.some(
      (job) => job.status === 'queued' || job.status === 'in-progress',
    );
  }

  markCompleted(id: string): void {
    const job = this.jobs.find((job) => job.id === id);
    if (!job) return;
    job.status = 'completed';
    job.error = undefined;
    job.updatedAt = new Date().toISOString();
    this.persist();
  }

  markFailed(id: string, error: string): void {
    const job = this.jobs.find((job) => job.id === id);
    if (!job) return;
    job.status = 'failed';
    job.error = error;
    job.updatedAt = new Date().toISOString();
    this.persist();
  }

  private resolveDestinationPath(url: string): string {
    const baseName = this.filenameFromUrl(url);
    const ext = path.extname(baseName);
    const stem = baseName.slice(0, baseName.length - ext.length);

    const claimedPaths = new Set(
      this.jobs
        .filter((job) => job.status === 'queued' || job.status === 'in-progress')
        .map((job) => job.destinationPath),
    );

    let candidate = path.join(downloadsDir, baseName);
    let attempt = 1;
    while (fs.existsSync(candidate) || claimedPaths.has(candidate)) {
      candidate = path.join(downloadsDir, `${stem} (${attempt})${ext}`);
      attempt++;
    }
    return candidate;
  }

  private filenameFromUrl(url: string): string {
    try {
      const base = path.basename(new URL(url).pathname);
      return base || 'download';
    } catch {
      return 'download';
    }
  }

  private persist(): void {
    saveJobs(this.jobs);
  }
}
