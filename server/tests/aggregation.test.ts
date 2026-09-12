import { describe, expect, it } from "vitest";
import { CONFIGURED_HOLDINGS } from "../src/data/symbolMap.js";
import { aggregatePortfolio } from "../src/domain/aggregation.js";
import type { QuoteSnapshot } from "../src/types/portfolio.js";

function quote(holdingId: string, cmp: number | null, status: QuoteSnapshot["status"] = "fresh"): QuoteSnapshot {
  return {
    holdingId,
    symbol: holdingId,
    cmp,
    marketState: "REGULAR",
    sourceTimestamp: "2026-09-12T10:00:00.000Z",
    fetchedAt: "2026-09-12T10:00:01.000Z",
    status,
  };
}

describe("portfolio aggregation", () => {
  it("aggregates complete holding, sector, and portfolio values", () => {
    const quotes = new Map(CONFIGURED_HOLDINGS.map((holding) => [holding.id, quote(holding.id, holding.purchasePrice + 10)]));
    const result = aggregatePortfolio(CONFIGURED_HOLDINGS, quotes);

    expect(result.summary.totalInvestment).toBe(1543060);
    expect(result.sectors).toHaveLength(6);
    expect(result.pricedHoldings).toBe(26);
    expect(result.quoteStatus).toBe("fresh");
    expect(result.summary.totalPresentValue).not.toBeNull();
    expect(result.summary.gainLoss).toBeGreaterThan(0);
  });

  it("marks complete cached data stale without discarding totals", () => {
    const quotes = new Map(
      CONFIGURED_HOLDINGS.map((holding, index) => [
        holding.id,
        quote(holding.id, holding.purchasePrice, index === 0 ? "stale" : "fresh"),
      ]),
    );
    const result = aggregatePortfolio(CONFIGURED_HOLDINGS, quotes);

    expect(result.quoteStatus).toBe("stale");
    expect(result.summary.totalPresentValue).toBe(1543060);
  });

  it("makes affected aggregate market values unavailable for partial data", () => {
    const missing = CONFIGURED_HOLDINGS[0];
    const quotes = new Map(
      CONFIGURED_HOLDINGS.slice(1).map((holding) => [holding.id, quote(holding.id, holding.purchasePrice)]),
    );
    const result = aggregatePortfolio(CONFIGURED_HOLDINGS, quotes);
    const affectedSector = result.sectors.find((sector) => sector.name === missing.sector);
    const unaffectedSector = result.sectors.find((sector) => sector.name === "Tech Sector");

    expect(result.quoteStatus).toBe("partial");
    expect(result.pricedHoldings).toBe(25);
    expect(result.summary.totalPresentValue).toBeNull();
    expect(result.summary.gainLoss).toBeNull();
    expect(affectedSector?.presentValue).toBeNull();
    expect(unaffectedSector?.presentValue).not.toBeNull();
  });

  it("reports an entirely unpriced portfolio as unavailable", () => {
    const result = aggregatePortfolio(CONFIGURED_HOLDINGS, new Map());

    expect(result.quoteStatus).toBe("unavailable");
    expect(result.pricedHoldings).toBe(0);
    expect(result.summary.totalPresentValue).toBeNull();
  });
});

