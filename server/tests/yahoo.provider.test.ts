import { describe, expect, it, vi } from "vitest";
import { CONFIGURED_HOLDINGS } from "../src/data/symbolMap.js";
import { YahooFinanceProvider, type YahooQuoteClient } from "../src/providers/yahooFinance.provider.js";

describe("YahooFinanceProvider", () => {
  const holdings = CONFIGURED_HOLDINGS.slice(0, 2);

  it("batches symbols and normalizes valid quotes", async () => {
    const quote = vi.fn().mockResolvedValue([
      {
        symbol: holdings[0].yahooSymbol,
        regularMarketPrice: 1700.15,
        marketState: "REGULAR",
        regularMarketTime: new Date("2026-09-12T10:00:00.000Z"),
      },
      {
        symbol: holdings[1].yahooSymbol,
        regularMarketPrice: 7000,
        marketState: "CLOSED",
        regularMarketTime: 1789207200000,
      },
    ]);
    const provider = new YahooFinanceProvider(
      { quote } as YahooQuoteClient,
      () => new Date("2026-09-12T10:00:05.000Z"),
    );

    const result = await provider.fetchQuotes(holdings);

    expect(quote).toHaveBeenCalledTimes(1);
    expect(quote.mock.calls[0][0]).toEqual(holdings.map((holding) => holding.yahooSymbol));
    expect(result.get(holdings[0].id)).toMatchObject({
      cmp: 1700.15,
      status: "fresh",
      sourceTimestamp: "2026-09-12T10:00:00.000Z",
    });
  });

  it("marks missing, null, and malformed quotes unavailable", async () => {
    const provider = new YahooFinanceProvider({
      quote: vi.fn().mockResolvedValue([
        { symbol: holdings[0].yahooSymbol, regularMarketPrice: null },
        { symbol: holdings[1].yahooSymbol, regularMarketPrice: "7000" },
      ]),
    } as YahooQuoteClient);

    const result = await provider.fetchQuotes(holdings);
    expect(result.get(holdings[0].id)?.cmp).toBeNull();
    expect(result.get(holdings[1].id)?.status).toBe("unavailable");
  });

  it("propagates a batch failure to the fallback service", async () => {
    const provider = new YahooFinanceProvider({
      quote: vi.fn().mockRejectedValue(new Error("Yahoo unavailable")),
    } as YahooQuoteClient);

    await expect(provider.fetchQuotes(holdings)).rejects.toThrow("Yahoo unavailable");
  });
});

