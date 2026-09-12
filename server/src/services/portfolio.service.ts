import { CONFIGURED_HOLDINGS } from "../data/symbolMap.js";
import { aggregatePortfolio } from "../domain/aggregation.js";
import type { PortfolioResponse } from "../types/portfolio.js";
import { QuoteService } from "./quote.service.js";

export class PortfolioService {
  constructor(
    private readonly quoteService = new QuoteService(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  async getPortfolio(): Promise<PortfolioResponse> {
    const aggregated = aggregatePortfolio(
      CONFIGURED_HOLDINGS,
      await this.quoteService.getQuotes(CONFIGURED_HOLDINGS),
    );

    return {
      meta: {
        generatedAt: this.now().toISOString(),
        quoteProvider: "yahoo-finance2",
        quoteStatus: aggregated.quoteStatus,
        pricedHoldings: aggregated.pricedHoldings,
        totalHoldings: CONFIGURED_HOLDINGS.length,
        partial: aggregated.quoteStatus === "partial",
      },
      summary: aggregated.summary,
      sectors: aggregated.sectors,
      holdings: aggregated.holdings,
    };
  }
}

