import { describe, expect, it, vi } from "vitest";
import { CONFIGURED_HOLDINGS } from "../src/data/symbolMap.js";
import { TtlCache } from "../src/services/cache.service.js";
import {
  FundamentalsService,
  type FundamentalProvider,
} from "../src/services/fundamentals.service.js";
import type { FundamentalSnapshot } from "../src/types/portfolio.js";

describe("FundamentalsService", () => {
  it("limits concurrency and isolates individual failures", async () => {
    const holdings = CONFIGURED_HOLDINGS.slice(0, 6);
    let active = 0;
    let maximumActive = 0;
    const provider: FundamentalProvider = {
      async fetchFundamental(holding) {
        active += 1;
        maximumActive = Math.max(maximumActive, active);
        await new Promise((resolve) => setTimeout(resolve, 5));
        active -= 1;
        if (holding.id === holdings[2].id) throw new Error("blocked");
        return {
          holdingId: holding.id,
          pe: 20,
          eps: 5,
          fetchedAt: "2026-09-12T10:00:00.000Z",
          status: "fresh",
        };
      },
    };
    const service = new FundamentalsService(provider, undefined, 2);

    const result = await service.getFundamentals(holdings);

    expect(maximumActive).toBeLessThanOrEqual(2);
    expect(result.meta).toMatchObject({ available: 5, unavailable: 1 });
    expect(result.holdings.find((item) => item.holdingId === holdings[2].id)?.status).toBe(
      "unavailable",
    );
  });

  it("returns cached data and marks it stale after a failed refresh", async () => {
    let now = 1000;
    const holding = CONFIGURED_HOLDINGS[0];
    const provider = {
      fetchFundamental: vi
        .fn()
        .mockResolvedValueOnce({
          holdingId: holding.id,
          pe: 14,
          eps: 50,
          fetchedAt: new Date(now).toISOString(),
          status: "fresh",
        })
        .mockRejectedValueOnce(new Error("down")),
    } satisfies FundamentalProvider;
    const cache = new TtlCache<string, FundamentalSnapshot>(100, () => now);
    const service = new FundamentalsService(provider, cache, 4, () => new Date(now));

    await service.getFundamentals([holding]);
    now = 1100;
    const result = await service.getFundamentals([holding], true);

    expect(result.holdings[0]).toMatchObject({ pe: 14, eps: 50, status: "stale" });
  });

  it("coalesces simultaneous refresh requests", async () => {
    const holding = CONFIGURED_HOLDINGS[0];
    const provider = {
      fetchFundamental: vi.fn(async () => ({
        holdingId: holding.id,
        pe: 14,
        eps: 50,
        fetchedAt: new Date().toISOString(),
        status: "fresh" as const,
      })),
    } satisfies FundamentalProvider;
    const service = new FundamentalsService(provider);

    await Promise.all([
      service.getFundamentals([holding], true),
      service.getFundamentals([holding], true),
    ]);

    expect(provider.fetchFundamental).toHaveBeenCalledTimes(1);
  });
});

