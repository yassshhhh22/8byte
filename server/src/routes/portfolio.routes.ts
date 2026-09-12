import { Router } from "express";
import type { createPortfolioController } from "../controllers/portfolio.controller.js";

type PortfolioController = ReturnType<typeof createPortfolioController>;

export function createPortfolioRouter(controller: PortfolioController): Router {
  const router = Router();
  router.get("/health", controller.health);
  router.get("/portfolio", controller.portfolio);
  router.get("/fundamentals", controller.fundamentals);
  return router;
}
