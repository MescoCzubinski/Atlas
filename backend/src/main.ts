import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import type { NextFunction, Request, Response } from "express";
import { AppModule } from "./app.module";
import { configureApp } from "./common/app-setup";

const HEALTH_PATH = "/api/health"; // probed every few seconds, so not logged

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const http = new Logger("HTTP");
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl === HEALTH_PATH) return next();
    const start = Date.now();
    res.on("finish", () =>
      http.log(
        `${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`,
      ),
    );
    next();
  });

  configureApp(app);
  app.enableShutdownHooks();

  const port = Number(app.get(ConfigService).getOrThrow<string>("PORT"));
  await app.listen(port, "0.0.0.0");
  new Logger("Bootstrap").log(
    `API listening on :${port} (health: ${HEALTH_PATH})`,
  );
}
bootstrap();
