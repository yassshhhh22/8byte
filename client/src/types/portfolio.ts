export type SectorName =
  | "Financial Sector"
  | "Tech Sector"
  | "Consumer"
  | "Power"
  | "Pipe Sector"
  | "Others";

export type DataStatus = "fresh" | "stale" | "unavailable";
export type AggregateQuoteStatus = DataStatus | "partial";

export interface Holding {
  id: string;
  name: string;
  sector: SectorName;
  purchasePrice: number;
  quantity: number;
  exchange: "NSE" | "BSE";
  exchangeCode: string;
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

export interface PortfolioResponse {
  meta: {
    generatedAt: string;
    quoteProvider: "yahoo-finance2";
    quoteStatus: AggregateQuoteStatus;
    pricedHoldings: number;
    totalHoldings: number;
    partial: boolean;
  };
  summary: {
    totalInvestment: number;
    totalPresentValue: number | null;
    gainLoss: number | null;
    gainLossPercent: number | null;
  };
  sectors: SectorSummary[];
  holdings: Holding[];
}

export interface Fundamental {
  holdingId: string;
  pe: number | null;
  eps: number | null;
  fetchedAt: string;
  status: DataStatus;
}

export interface FundamentalsResponse {
  meta: {
    provider: "google-finance";
    fetchedAt: string;
    available: number;
    unavailable: number;
  };
  holdings: Fundamental[];
}

export interface HoldingWithFundamentals extends Holding {
  pe: number | null;
  eps: number | null;
  fundamentalStatus: DataStatus;
}

export type PortfolioViewMode = "grouped" | "all";
export type TableDensity = "comfortable" | "compact";

export interface DashboardMetrics {
  currentValue: number | null;
  investedCapital: number;
  gainLoss: number | null;
  returnPercent: number | null;
  pricedHoldings: number;
  totalHoldings: number;
  winners: number;
  losers: number;
}

export interface SectorChartDatum {
  name: SectorName;
  shortName: string;
  investment: number;
  allocationPercent: number;
  gainLossPercent: number | null;
  isComplete: boolean;
}

export interface MoverDatum {
  id: string;
  name: string;
  exchangeCode: string;
  gainLoss: number;
  gainLossPercent: number;
}
