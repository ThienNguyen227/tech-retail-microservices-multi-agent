import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 1. Kết nối gRPC Microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'inventory',
      protoPath: join(__dirname, 'proto/inventory.proto'),
      url: '0.0.0.0:50051',
      loader: {
        keepCase: true,
      },
    },
  });

  // 2. Khởi động gRPC
  await app.startAllMicroservices();

  // 3. Khởi động HTTP
  const port = process.env.PORT ?? 3006;
  await app.listen(port);
  console.log(`Inventory HTTP running on: http://localhost:${port}`);
  console.log(`Inventory gRPC running on: 0.0.0.0:50051`);
}
bootstrap();