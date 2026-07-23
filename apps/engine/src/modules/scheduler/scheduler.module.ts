import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { WorkerModule } from '../worker/worker.module';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [QueueModule, WorkerModule],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
