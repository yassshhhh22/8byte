import type { ConfiguredHolding, QuoteSnapshot } from "../types/portfolio.js";
import { YahooFinanceProvider } from "../providers/yahooFinance.provider.js";
import { TtlCache } from "./cache.service.js";

export interface QuoteProvider {
  fetchQuotes(holdings: readonly ConfiguredHolding[]): Promise<Map<string, QuoteSnapshot>>;
}

export class QuoteService {
  private inFlight: Promise<Map<string, QuoteSnapshot>> | null = null;

  constructor(
    private readonly provider: QuoteProvider = new YahooFinanceProvider(),
    private readonly cache = new TtlCache<string, QuoteSnapshot>(10_000),
    private readonly now: () => Date = () => new Date(),
  ) {}

  async getQuotes(holdings: readonly ConfiguredHolding[]): Promise<Map<string, QuoteSnapshot>> {
    const cached = holdings.map((holding) => [holding.id, this.cache.getFresh(holding.id)] as const);
    if (cached.every(([, entry]) => entry !== undefined)) {
      return new Map(cached.map(([id, entry]) => [id, entry!.value]));
    }

    if (this.inFlight) return this.inFlight;
    this.inFlight = this.refresh(holdings).finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  private async refresh(holdings: readonly ConfiguredHolding[]): Promise<Map<string, QuoteSnapshot>> {
    let fetched: Map<string, QuoteSnapshot>;
    try {
      fetched = await this.provider.fetchQuotes(holdings);
    } catch {
      fetched = new Map();
    }

    const fetchedAt = this.now().toISOString();
    return new Map(
      holdings.map((holding) => {
        const result = fetched.get(holding.id);
        if (result?.cmp !== null && result?.cmp !== undefined) {
          this.cache.set(holding.id, result);
          return [holding.id, result];
        }

        const previous = this.cache.getAny(holding.id)?.value;
        if (previous?.cmp !== null && previous?.cmp !== undefined) {
          return [holding.id, { ...previous, status: "stale" as const }];
        }

        return [
          holding.id,
          result ?? {
            holdingId: holding.id,
            symbol: holding.yahooSymbol,
            cmp: null,
            marketState: null,
            sourceTimestamp: null,
            fetchedAt,
            status: "unavailable" as const,
          },
        ];
      }),
    );
  }
}
