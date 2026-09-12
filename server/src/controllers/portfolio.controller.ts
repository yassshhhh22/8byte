import type { NextFunction, Request, Response } from "express";
import { CONFIGURED_HOLDINGS } from "../data/symbolMap.js";
import { HttpError } from "../middleware/errorHandler.js";
import type { FundamentalsService } from "../services/fundamentals.service.js";
import type { PortfolioService } from "../services/portfolio.service.js";
import { refreshQuerySchema } from "../validation/marketData.schema.js";

export interface PortfolioControllerDependencies {
  portfolioService: Pick<PortfolioService, "getPortfolio">;
  fundamentalsService: Pick<FundamentalsService, "getFundamentals">;
}

export function createPortfolioController(dependencies: PortfolioControllerDependencies) {
  return {
    health: (_request: Request, response: Response) => {
      response.json({
        status: "ok",
        service: "portfolio-api",
        timestamp: new Date().toISOString(),
      });
    },

    portfolio: async (_request: Request, response: Response, next: NextFunction) => {
      try {
        response.json(await dependencies.portfolioService.getPortfolio());
      } catch (error) {
        next(error);
      }
    },

    fundamentals: async (request: Request, response: Response, next: NextFunction) => {
      const query = refreshQuerySchema.safeParse(request.query);
      if (!query.success) {
        next(new HttpError(400, "INVALID_QUERY", "refresh must be either true or false"));
        return;
      }

      try {
        response.json(
          await dependencies.fundamentalsService.getFundamentals(
            CONFIGURED_HOLDINGS,
            query.data.refresh,
          ),
        );
      } catch (error) {
        next(error);
      }
    },
  };
}

