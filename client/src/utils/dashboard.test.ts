import { describe, expect, it } from "vitest";
import { portfolioFixture } from "../test/fixtures";
import type { HoldingWithFundamentals } from "../types/portfolio";
import { getDashboardMetrics, getMovers, getSectorChartData } from "./dashboard";

const enrichedHoldings: HoldingWithFundamentals[] = portfolioFixture.holdings.map((holding) => ({
  ...holding,
  pe: 14.05,
  eps: 51.21,
  fundamentalStatus: "fresh",
}));

describe("dashboard selectors", () => {
  it("derives scoreboards and winner counts without changing portfolio totals", () => {
    expect(getDashboardMetrics(portfolioFixture, enrichedHoldings)).toEqual({
      currentValue: 85000,
      investedCapital: 74500,
      gainLoss: 10500,
      returnPercent: 14.0939,
      pricedHoldings: 1,
      totalHoldings: 1,
      winners: 1,
      losers: 0,
    });
  });

  it("builds investment allocation and preserves unavailable performance", () => {
    const sectors = [
      ...portfolioFixture.sectors,
      {
        name: "Tech Sector" as const,
        investment: 25500,
        presentValue: null,
        gainLoss: null,
        gainLossPercent: null,
        holdingCount: 1,
        pricedHoldingCount: 0,
      },
    ];
    const data = getSectorChartData(sectors);

    expect(data[0].allocationPercent).toBe(74.5);
    expect(data[1]).toMatchObject({
      shortName: "Technology",
      allocationPercent: 25.5,
      gainLossPercent: null,
      isComplete: false,
    });
  });

  it("ranks gain priced gainers and laggards while excluding nulls", () => {
    const gain = enrichedHoldings[0];
    const loss = { ...gain, id: "loss", name: "Loss Ltd", gainLoss: -500, gainLossPercent: -5 };
    const unavailable = { ...gain, id: "none", name: "No Price", gainLoss: null, gainLossPercent: null };

    expect(getMovers([gain, loss, unavailable])).toEqual({
      gainers: [expect.objectContaining({ id: gain.id, gainLossPercent: gain.gainLossPercent })],
      laggards: [expect.objectContaining({ id: "loss", gainLossPercent: -5 })],
    });
  });
});
