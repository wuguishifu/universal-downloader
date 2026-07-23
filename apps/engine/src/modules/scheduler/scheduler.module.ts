import { Module } from '@nestjs/common';
import { WorkerModule } from '../worker/worker.module';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [WorkerModule],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
