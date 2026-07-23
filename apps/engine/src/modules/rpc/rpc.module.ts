import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { RpcService } from './rpc.service';

@Module({
  imports: [QueueModule],
  providers: [RpcService],
})
export class RpcModule {}
