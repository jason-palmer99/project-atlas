import { resolve } from "path";
import { config } from "dotenv";

// Load .env from api dir first, then fall back to monorepo root
config({ path: resolve(__dirname, "../.env") });
config({ path: resolve(__dirname, "../../../.env") });

import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors();

  const port = process.env.API_PORT || 3000;
  await app.listen(port);
  console.log(`Atlas API running on http://localhost:${port}`);
}

bootstrap();
