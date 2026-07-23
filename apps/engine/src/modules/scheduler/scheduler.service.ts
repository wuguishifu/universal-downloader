import { Injectable } from '@nestjs/common';
import { OnEvent } from '../events/event.decorator';
import type { EventPayload } from '../events/events';

@Injectable()
export class SchedulerService {
  @OnEvent('download:queued')
  public onDownloadQueued(payload: EventPayload<'download:queued'>) {
    this.tick();
  }

  @OnEvent('download:started')
  public onDownloadStarted(payload: EventPayload<'download:started'>) {
    this.tick();
  }

  @OnEvent('download:finished')
  public onDownloadFinished(payload: EventPayload<'download:finished'>) {
    this.tick();
  }

  private tick() {}
}
