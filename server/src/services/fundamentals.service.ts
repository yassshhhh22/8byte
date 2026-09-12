import pLimit from "p-limit";
import { GoogleFinanceProvider } from "../providers/googleFinance.provider.js";
import type {
  ConfiguredHolding,
  FundamentalSnapshot,
  FundamentalsResponse,
} from "../types/portfolio.js";
import { TtlCache } from "./cache.service.js";

export interface FundamentalProvider {
  fetchFundamental(holding: ConfiguredHolding): Promise<FundamentalSnapshot>;
}

export class FundamentalsService {
  private inFlight: Promise<FundamentalsResponse> | null = null;

  constructor(
    private readonly provider: FundamentalProvider = new GoogleFinanceProvider(),
    private readonly cache = new TtlCache<string, FundamentalSnapshot>(30 * 60 * 1000),
    private readonly concurrency = 4,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async getFundamentals(
    holdings: readonly ConfiguredHolding[],
    forceRefresh = false,
  ): Promise<FundamentalsResponse> {
    if (!forceRefresh) {
      const cached = holdings.map((holding) => this.cache.getFresh(holding.id));
      if (cached.every((entry) => entry !== undefined)) {
        return this.toResponse(cached.map((entry) => entry!.value));
      }
    }

    if (this.inFlight) return this.inFlight;
    this.inFlight = this.refresh(holdings, forceRefresh).finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  private async refresh(
    holdings: readonly ConfiguredHolding[],
    forceRefresh: boolean,
  ): Promise<FundamentalsResponse> {
    const limit = pLimit(this.concurrency);
    const tasks = holdings.map(async (holding): Promise<FundamentalSnapshot> => {
      const fresh = forceRefresh ? undefined : this.cache.getFresh(holding.id)?.value;
      if (fresh) return fresh;

      try {
        const result = await limit(() => this.provider.fetchFundamental(holding));
        this.cache.set(holding.id, result);
        return result;
      } catch {
        const previous = this.cache.getAny(holding.id)?.value;
        if (previous) return { ...previous, status: "stale" };
        return {
          holdingId: holding.id,
          pe: null,
          eps: null,
          fetchedAt: this.now().toISOString(),
          status: "unavailable",
        };
      }
    });

    const settled = await Promise.allSettled(tasks);
    const values = settled.map((result, index): FundamentalSnapshot => {
      if (result.status === "fulfilled") return result.value;
      return {
        holdingId: holdings[index].id,
        pe: null,
        eps: null,
        fetchedAt: this.now().toISOString(),
        status: "unavailable",
      };
    });
    return this.toResponse(values);
  }

  private toResponse(holdings: FundamentalSnapshot[]): FundamentalsResponse {
    const available = holdings.filter((holding) => holding.status !== "unavailable").length;
    return {
      meta: {
        provider: "google-finance",
        fetchedAt: this.now().toISOString(),
        available,
        unavailable: holdings.length - available,
      },
      holdings,
    };
  }
}
