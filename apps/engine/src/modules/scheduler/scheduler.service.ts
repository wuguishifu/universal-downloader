import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { OnEvent } from '../events/event.decorator';
import { QueueService } from '../queue/queue.service';
import { WorkerService } from '../worker/worker.service';

const MAX_CONCURRENT_DOWNLOADS = 10;

@Injectable()
export class SchedulerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly workerService: WorkerService,
  ) {}

  onApplicationBootstrap(): void {
    this.tick();
  }

  @OnEvent('download:queued')
  public onDownloadQueued() {
    this.tick();
  }

  @OnEvent('download:started')
  public onDownloadStarted() {
    this.tick();
  }

  @OnEvent('download:finished')
  public onDownloadFinished() {
    this.tick();
  }

  @OnEvent('download:failed')
  public onDownloadFailed() {
    this.tick();
  }

  private tick() {
    let capacity = MAX_CONCURRENT_DOWNLOADS - this.queueService.countInProgress();

    while (capacity > 0) {
      const job = this.queueService.claimNextQueued();
      if (!job) break;

      this.workerService
        .run(job)
        .catch((err) => this.logger.error('unexpected worker error', err));

      capacity--;
    }
  }
}
