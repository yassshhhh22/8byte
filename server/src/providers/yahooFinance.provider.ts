import YahooFinance from "yahoo-finance2";
import type { ConfiguredHolding, QuoteSnapshot } from "../types/portfolio.js";
import { yahooQuoteSchema } from "../validation/marketData.schema.js";

export interface YahooQuoteClient {
  quote(
    symbols: string[],
    options: {
      return: "array";
      fields: ["symbol", "regularMarketPrice", "marketState", "regularMarketTime"];
    },
  ): Promise<unknown>;
}

function toIsoTimestamp(value: Date | string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export class YahooFinanceProvider {
  constructor(
    private readonly client: YahooQuoteClient = new YahooFinance({
      suppressNotices: ["yahooSurvey"],
    }) as YahooQuoteClient,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async fetchQuotes(holdings: readonly ConfiguredHolding[]): Promise<Map<string, QuoteSnapshot>> {
    const raw = await this.client.quote(
      holdings.map((holding) => holding.yahooSymbol),
      {
        return: "array",
        fields: ["symbol", "regularMarketPrice", "marketState", "regularMarketTime"],
      },
    );

    const results = Array.isArray(raw) ? raw : [];
    const bySymbol = new Map(
      results.flatMap((candidate) => {
        const parsed = yahooQuoteSchema.safeParse(candidate);
        return parsed.success ? [[parsed.data.symbol, parsed.data] as const] : [];
      }),
    );
    const fetchedAt = this.now().toISOString();

    return new Map(
      holdings.map((holding) => {
        const result = bySymbol.get(holding.yahooSymbol);
        const snapshot: QuoteSnapshot = result
          ? {
              holdingId: holding.id,
              symbol: holding.yahooSymbol,
              cmp: result.regularMarketPrice,
              marketState: result.marketState ?? null,
              sourceTimestamp: toIsoTimestamp(result.regularMarketTime),
              fetchedAt,
              status: "fresh",
            }
          : {
              holdingId: holding.id,
              symbol: holding.yahooSymbol,
              cmp: null,
              marketState: null,
              sourceTimestamp: null,
              fetchedAt,
              status: "unavailable",
            };
        return [holding.id, snapshot];
      }),
    );
  }
}
