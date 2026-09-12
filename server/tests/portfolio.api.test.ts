import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import type { FundamentalsResponse, PortfolioResponse } from "../src/types/portfolio.js";

const portfolioResponse: PortfolioResponse = {
  meta: {
    generatedAt: "2026-09-12T10:00:00.000Z",
    quoteProvider: "yahoo-finance2",
    quoteStatus: "partial",
    pricedHoldings: 25,
    totalHoldings: 26,
    partial: true,
  },
  summary: {
    totalInvestment: 1543060,
    totalPresentValue: null,
    gainLoss: null,
    gainLossPercent: null,
  },
  sectors: [],
  holdings: [],
};

const fundamentalsResponse: FundamentalsResponse = {
  meta: {
    provider: "google-finance",
    fetchedAt: "2026-09-12T10:00:00.000Z",
    available: 25,
    unavailable: 1,
  },
  holdings: [],
};

function testApp() {
  const portfolioService = { getPortfolio: vi.fn().mockResolvedValue(portfolioResponse) };
  const fundamentalsService = {
    getFundamentals: vi.fn().mockResolvedValue(fundamentalsResponse),
  };
  return {
    app: createApp({
      portfolioService,
      fundamentalsService,
      clientOrigins: ["http://localhost:5173"],
    }),
    portfolioService,
    fundamentalsService,
  };
}

describe("portfolio API", () => {
  it("returns health without contacting market providers", async () => {
    const { app, portfolioService, fundamentalsService } = testApp();
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: "ok", service: "portfolio-api" });
    expect(portfolioService.getPortfolio).not.toHaveBeenCalled();
    expect(fundamentalsService.getFundamentals).not.toHaveBeenCalled();
  });

  it("returns a partial portfolio as a successful response", async () => {
    const { app } = testApp();
    const response = await request(app).get("/api/portfolio");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(portfolioResponse);
  });

  it("validates and forwards the fundamentals refresh flag", async () => {
    const { app, fundamentalsService } = testApp();
    const response = await request(app).get("/api/fundamentals?refresh=true");

    expect(response.status).toBe(200);
    expect(fundamentalsService.getFundamentals).toHaveBeenCalledWith(expect.any(Array), true);

    const invalid = await request(app).get("/api/fundamentals?refresh=yes");
    expect(invalid.status).toBe(400);
    expect(invalid.body.error).toBe("INVALID_QUERY");
  });

  it("allows the configured origin and rejects other browser origins", async () => {
    const { app } = testApp();
    const allowed = await request(app)
      .get("/api/health")
      .set("Origin", "http://localhost:5173");
    const denied = await request(app)
      .get("/api/health")
      .set("Origin", "https://example.com");

    expect(allowed.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    expect(denied.status).toBe(403);
    expect(denied.body).toMatchObject({ error: "ORIGIN_NOT_ALLOWED" });
  });

  it("returns sanitized errors and a structured 404", async () => {
    const app = createApp({
      portfolioService: {
        getPortfolio: vi.fn().mockRejectedValue(new Error("secret provider details")),
      },
      fundamentalsService: {
        getFundamentals: vi.fn().mockResolvedValue(fundamentalsResponse),
      },
      clientOrigins: [],
    });

    const failure = await request(app).get("/api/portfolio");
    expect(failure.status).toBe(500);
    expect(failure.body).toMatchObject({
      error: "INTERNAL_ERROR",
      message: "The server could not complete the request",
    });
    expect(JSON.stringify(failure.body)).not.toContain("secret provider details");

    const missing = await request(app).get("/missing");
    expect(missing.status).toBe(404);
    expect(missing.body.error).toBe("NOT_FOUND");
  });
});

