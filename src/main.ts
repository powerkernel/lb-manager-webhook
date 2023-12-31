import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';

async function bootstrap() {
  const httpsOptions = {
    key: fs.readFileSync('./secrets/tls.key'),
    cert: fs.readFileSync('./secrets/tls.crt'),
  };
  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });

  await app.listen(3000);
}
bootstrap();
