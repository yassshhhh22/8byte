import { describe, expect, it } from "vitest";
import { TtlCache } from "../src/services/cache.service.js";

describe("TtlCache", () => {
  it("distinguishes fresh entries from retained stale entries", () => {
    let now = 1000;
    const cache = new TtlCache<string, number>(100, () => now);
    cache.set("price", 42);

    expect(cache.getFresh("price")?.value).toBe(42);
    now = 1100;
    expect(cache.getFresh("price")).toBeUndefined();
    expect(cache.getAny("price")?.value).toBe(42);
  });
});

