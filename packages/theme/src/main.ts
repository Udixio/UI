import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppService } from './app.service';

export async function main(): Promise<[AppService, () => Promise<void>]> {
  const app = await NestFactory.create(AppModule);
  const appService = app.get(AppService);

  const close = () => app.close();
  return [appService, close];
}
