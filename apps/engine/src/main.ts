import { NestFactory } from '@nestjs/core';
import {
  acquireDaemonLock,
  DaemonAlreadyRunningError,
  pidFilePath,
} from '@udl/daemon';
import { AppModule } from './app/app.module';

async function bootstrap() {
  try {
    acquireDaemonLock(pidFilePath);
  } catch (error) {
    if (error instanceof DaemonAlreadyRunningError) {
      // startup race lost, another instance of daemon already running
      return;
    }
    throw error;
  }

  const app = await NestFactory.createApplicationContext(AppModule);
  app.enableShutdownHooks();
}

bootstrap();
