import { Module } from '@nestjs/common';
import { DownloadsModule } from '../downloads/downloads.module';
import { RpcService } from './rpc.service';

@Module({
  imports: [DownloadsModule],
  providers: [RpcService],
})
export class RpcModule {}
