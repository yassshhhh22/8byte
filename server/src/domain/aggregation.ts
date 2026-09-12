import { SECTOR_NAMES } from "../types/portfolio.js";
import type {
  AggregateQuoteStatus,
  ConfiguredHolding,
  HoldingValuation,
  PortfolioSummary,
  QuoteSnapshot,
  SectorSummary,
} from "../types/portfolio.js";
import {
  calculateGainLoss,
  calculateGainLossPercent,
  calculateInvestment,
  calculatePortfolioPercent,
  calculatePresentValue,
} from "./calculations.js";

export interface AggregatedPortfolio {
  holdings: HoldingValuation[];
  sectors: SectorSummary[];
  summary: PortfolioSummary;
  pricedHoldings: number;
  quoteStatus: AggregateQuoteStatus;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function aggregateMarketValues(
  holdings: HoldingValuation[],
  investment: number,
): Pick<SectorSummary, "presentValue" | "gainLoss" | "gainLossPercent"> {
  if (holdings.some((holding) => holding.presentValue === null)) {
    return { presentValue: null, gainLoss: null, gainLossPercent: null };
  }

  const presentValue = sum(holdings.map((holding) => holding.presentValue as number));
  const gainLoss = presentValue - investment;
  return {
    presentValue,
    gainLoss,
    gainLossPercent: calculateGainLossPercent(gainLoss, investment),
  };
}

export function getAggregateQuoteStatus(holdings: HoldingValuation[]): AggregateQuoteStatus {
  const priced = holdings.filter((holding) => holding.cmp !== null);
  if (priced.length === 0) return "unavailable";
  if (priced.length < holdings.length) return "partial";
  if (priced.some((holding) => holding.quoteStatus === "stale")) return "stale";
  return "fresh";
}

export function aggregatePortfolio(
  configuredHoldings: readonly ConfiguredHolding[],
  quotes: ReadonlyMap<string, QuoteSnapshot>,
): AggregatedPortfolio {
  const investments = configuredHoldings.map((holding) =>
    calculateInvestment(holding.purchasePrice, holding.quantity),
  );
  const totalInvestment = sum(investments);

  const holdings: HoldingValuation[] = configuredHoldings.map((holding, index) => {
    const quote = quotes.get(holding.id);
    const cmp = quote?.cmp ?? null;
    const investment = investments[index];
    const presentValue = calculatePresentValue(cmp, holding.quantity);
    const gainLoss = calculateGainLoss(presentValue, investment);

    return {
      id: holding.id,
      name: holding.name,
      sector: holding.sector,
      purchasePrice: holding.purchasePrice,
      quantity: holding.quantity,
      exchange: holding.exchange,
      exchangeCode: holding.exchangeCode,
      investment,
      portfolioPercent: calculatePortfolioPercent(investment, totalInvestment),
      cmp,
      presentValue,
      gainLoss,
      gainLossPercent: calculateGainLossPercent(gainLoss, investment),
      quoteStatus: quote?.status ?? "unavailable",
      quoteTimestamp: quote?.sourceTimestamp ?? null,
    };
  });

  const sectors = SECTOR_NAMES.map((name): SectorSummary => {
    const sectorHoldings = holdings.filter((holding) => holding.sector === name);
    const investment = sum(sectorHoldings.map((holding) => holding.investment));
    return {
      name,
      investment,
      ...aggregateMarketValues(sectorHoldings, investment),
      holdingCount: sectorHoldings.length,
      pricedHoldingCount: sectorHoldings.filter((holding) => holding.cmp !== null).length,
    };
  });

  const marketValues = aggregateMarketValues(holdings, totalInvestment);
  return {
    holdings,
    sectors,
    summary: {
      totalInvestment,
      totalPresentValue: marketValues.presentValue,
      gainLoss: marketValues.gainLoss,
      gainLossPercent: marketValues.gainLossPercent,
    },
    pricedHoldings: holdings.filter((holding) => holding.cmp !== null).length,
    quoteStatus: getAggregateQuoteStatus(holdings),
  };
}

