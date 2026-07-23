import { Module } from '@nestjs/common';
import { RpcModule } from './modules/rpc/rpc.module';

@Module({
  imports: [RpcModule],
})
export class AppModule {}
