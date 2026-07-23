import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventsModule } from './modules/events/events.module';
import { RpcModule } from './modules/rpc/rpc.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    EventsModule,
    SchedulerModule,
    RpcModule,
  ],
})
export class AppModule {}
