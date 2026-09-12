import cors from "cors";
import express from "express";
import helmet from "helmet";
import {
  createPortfolioController,
  type PortfolioControllerDependencies,
} from "./controllers/portfolio.controller.js";
import { errorHandler, HttpError, notFoundHandler } from "./middleware/errorHandler.js";
import { createPortfolioRouter } from "./routes/portfolio.routes.js";
import { FundamentalsService } from "./services/fundamentals.service.js";
import { PortfolioService } from "./services/portfolio.service.js";

export interface AppOptions extends Partial<PortfolioControllerDependencies> {
  clientOrigins?: string[];
  requestTimeoutMs?: number;
}

function configuredOrigins(): string[] {
  return (process.env.CLIENT_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function createApp(options: AppOptions = {}) {
  const app = express();
  const clientOrigins = options.clientOrigins ?? configuredOrigins();
  const controller = createPortfolioController({
    portfolioService: options.portfolioService ?? new PortfolioService(),
    fundamentalsService: options.fundamentalsService ?? new FundamentalsService(),
  });

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || clientOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new HttpError(403, "ORIGIN_NOT_ALLOWED", "The request origin is not allowed"));
      },
    }),
  );
  app.use(express.json({ limit: "10kb" }));
  app.use((_request, response, next) => {
    response.setTimeout(options.requestTimeoutMs ?? 45_000, () => {
      if (!response.headersSent) {
        response.status(503).json({
          error: "REQUEST_TIMEOUT",
          message: "The server timed out while contacting a market data provider",
          timestamp: new Date().toISOString(),
        });
      }
    });
    next();
  });

  app.use("/api", createPortfolioRouter(controller));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

const app = createApp();
export default app;
