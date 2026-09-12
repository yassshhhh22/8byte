import { describe, expect, it, vi } from "vitest";
import { CONFIGURED_HOLDINGS } from "../src/data/symbolMap.js";
import { TtlCache } from "../src/services/cache.service.js";
import { QuoteService, type QuoteProvider } from "../src/services/quote.service.js";
import type { QuoteSnapshot } from "../src/types/portfolio.js";

function quoteMap(price = 100): Map<string, QuoteSnapshot> {
  return new Map(
    CONFIGURED_HOLDINGS.slice(0, 2).map((holding) => [
      holding.id,
      {
        holdingId: holding.id,
        symbol: holding.yahooSymbol,
        cmp: price,
        marketState: "REGULAR",
        sourceTimestamp: "2026-09-12T10:00:00.000Z",
        fetchedAt: "2026-09-12T10:00:01.000Z",
        status: "fresh" as const,
      },
    ]),
  );
}

describe("QuoteService", () => {
  const holdings = CONFIGURED_HOLDINGS.slice(0, 2);

  it("uses last-known-good quotes as stale fallbacks", async () => {
    let now = 1000;
    const provider = {
      fetchQuotes: vi.fn().mockResolvedValueOnce(quoteMap()).mockRejectedValueOnce(new Error("down")),
    } satisfies QuoteProvider;
    const service = new QuoteService(
      provider,
      new TtlCache<string, QuoteSnapshot>(100, () => now),
      () => new Date(now),
    );

    expect((await service.getQuotes(holdings)).get(holdings[0].id)?.status).toBe("fresh");
    now = 1100;
    const stale = await service.getQuotes(holdings);

    expect(stale.get(holdings[0].id)).toMatchObject({ cmp: 100, status: "stale" });
    expect(provider.fetchQuotes).toHaveBeenCalledTimes(2);
  });

  it("coalesces concurrent cache misses into one provider request", async () => {
    let resolveFetch!: (value: Map<string, QuoteSnapshot>) => void;
    const provider = {
      fetchQuotes: vi.fn(
        () =>
          new Promise<Map<string, QuoteSnapshot>>((resolve) => {
            resolveFetch = resolve;
          }),
      ),
    } satisfies QuoteProvider;
    const service = new QuoteService(provider);

    const first = service.getQuotes(holdings);
    const second = service.getQuotes(holdings);
    expect(provider.fetchQuotes).toHaveBeenCalledTimes(1);

    resolveFetch(quoteMap(200));
    const [firstResult, secondResult] = await Promise.all([first, second]);
    expect(firstResult).toEqual(secondResult);
  });
});
