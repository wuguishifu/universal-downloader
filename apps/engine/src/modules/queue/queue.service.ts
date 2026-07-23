import { Injectable } from '@nestjs/common';
import { EventsService } from '../events/events.service';

@Injectable()
export class QueueService {
  private readonly downloads: string[] = [];

  constructor(private readonly eventsService: EventsService) {}

  addDownload(url: string): void {
    this.downloads.push(url);
    this.eventsService.emit('download:queued', { url });
  }

  listDownloads(): { id: string }[] {
    return this.downloads.map((url) => ({ id: url }));
  }
}
