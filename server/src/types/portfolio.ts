export const SECTOR_NAMES = [
  "Financial Sector",
  "Tech Sector",
  "Consumer",
  "Power",
  "Pipe Sector",
  "Others",
] as const;

export type SectorName = (typeof SECTOR_NAMES)[number];
export type Exchange = "NSE" | "BSE";
export type DataStatus = "fresh" | "stale" | "unavailable";
export type AggregateQuoteStatus = DataStatus | "partial";

export interface HoldingInput {
  id: string;
  name: string;
  sector: SectorName;
  purchasePrice: number;
  quantity: number;
  exchange: Exchange;
  exchangeCode: string;
}

export interface ProviderSymbols {
  yahooSymbol: string;
  googleSymbol: string;
}

export interface ConfiguredHolding extends HoldingInput, ProviderSymbols {}

export interface QuoteSnapshot {
  holdingId: string;
  symbol: string;
  cmp: number | null;
  marketState: string | null;
  sourceTimestamp: string | null;
  fetchedAt: string;
  status: DataStatus;
}

export interface FundamentalSnapshot {
  holdingId: string;
  pe: number | null;
  eps: number | null;
  fetchedAt: string;
  status: DataStatus;
}

export interface HoldingValuation extends HoldingInput {
  investment: number;
  portfolioPercent: number;
  cmp: number | null;
  presentValue: number | null;
  gainLoss: number | null;
  gainLossPercent: number | null;
  quoteStatus: DataStatus;
  quoteTimestamp: string | null;
}

export interface SectorSummary {
  name: SectorName;
  investment: number;
  presentValue: number | null;
  gainLoss: number | null;
  gainLossPercent: number | null;
  holdingCount: number;
  pricedHoldingCount: number;
}

export interface PortfolioSummary {
  totalInvestment: number;
  totalPresentValue: number | null;
  gainLoss: number | null;
  gainLossPercent: number | null;
}

export interface PortfolioResponse {
  meta: {
    generatedAt: string;
    quoteProvider: "yahoo-finance2";
    quoteStatus: AggregateQuoteStatus;
    pricedHoldings: number;
    totalHoldings: number;
    partial: boolean;
  };
  summary: PortfolioSummary;
  sectors: SectorSummary[];
  holdings: HoldingValuation[];
}

export interface FundamentalsResponse {
  meta: {
    provider: "google-finance";
    fetchedAt: string;
    available: number;
    unavailable: number;
  };
  holdings: FundamentalSnapshot[];
}

