import type { FundamentalsResponse, PortfolioResponse } from "../types/portfolio";

export const portfolioFixture: PortfolioResponse = {
  meta: {
    generatedAt: "2026-09-12T10:00:00.000Z",
    quoteProvider: "yahoo-finance2",
    quoteStatus: "fresh",
    pricedHoldings: 1,
    totalHoldings: 1,
    partial: false,
  },
  summary: {
    totalInvestment: 74500,
    totalPresentValue: 85000,
    gainLoss: 10500,
    gainLossPercent: 14.0939,
  },
  sectors: [
    {
      name: "Financial Sector",
      investment: 74500,
      presentValue: 85000,
      gainLoss: 10500,
      gainLossPercent: 14.0939,
      holdingCount: 1,
      pricedHoldingCount: 1,
    },
  ],
  holdings: [
    {
      id: "hdfc-bank",
      name: "HDFC Bank",
      sector: "Financial Sector",
      purchasePrice: 1490,
      quantity: 50,
      exchange: "NSE",
      exchangeCode: "HDFCBANK",
      investment: 74500,
      portfolioPercent: 4.828,
      cmp: 1700,
      presentValue: 85000,
      gainLoss: 10500,
      gainLossPercent: 14.0939,
      quoteStatus: "fresh",
      quoteTimestamp: "2026-09-12T10:00:00.000Z",
    },
  ],
};

export const fundamentalsFixture: FundamentalsResponse = {
  meta: {
    provider: "google-finance",
    fetchedAt: "2026-09-12T10:00:00.000Z",
    available: 1,
    unavailable: 0,
  },
  holdings: [
    {
      holdingId: "hdfc-bank",
      pe: 14.05,
      eps: 51.21,
      fetchedAt: "2026-09-12T10:00:00.000Z",
      status: "fresh",
    },
  ],
};

