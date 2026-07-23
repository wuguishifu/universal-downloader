import { Injectable } from '@nestjs/common';
import { createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { EventsService } from '../events/events.service';
import { QueueService } from '../queue/queue.service';
import { DownloadJob } from '../queue/queue.types';

@Injectable()
export class WorkerService {
  constructor(
    private readonly queueService: QueueService,
    private readonly eventsService: EventsService,
  ) {}

  async run(job: DownloadJob): Promise<void> {
    const partPath = `${job.destinationPath}.part`;
    this.eventsService.emit('download:started', { id: job.id, url: job.url });

    try {
      await fs.mkdir(path.dirname(job.destinationPath), { recursive: true });

      const response = await fetch(job.url);
      if (!response.ok || !response.body) {
        throw new Error(`request failed with status ${response.status}`);
      }

      await pipeline(Readable.fromWeb(response.body), createWriteStream(partPath));
      await fs.rename(partPath, job.destinationPath);

      this.queueService.markCompleted(job.id);
      this.eventsService.emit('download:finished', {
        id: job.id,
        url: job.url,
      });
    } catch (err) {
      await fs.rm(partPath, { force: true });
      const message = err instanceof Error ? err.message : String(err);
      this.queueService.markFailed(job.id, message);
      this.eventsService.emit('download:failed', {
        id: job.id,
        url: job.url,
        error: message,
      });
    }
  }
}
