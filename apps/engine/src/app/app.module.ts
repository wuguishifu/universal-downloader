import { Module } from '@nestjs/common';
import { RpcModule } from './rpc/rpc.module';

@Module({
  imports: [RpcModule],
})
export class AppModule {}
