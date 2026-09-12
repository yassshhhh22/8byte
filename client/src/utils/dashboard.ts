import type {
  DashboardMetrics,
  HoldingWithFundamentals,
  MoverDatum,
  PortfolioResponse,
  SectorChartDatum,
  SectorSummary,
} from "../types/portfolio";

const SHORT_SECTOR_NAMES: Record<SectorSummary["name"], string> = {
  "Financial Sector": "Financial",
  "Tech Sector": "Technology",
  Consumer: "Consumer",
  Power: "Power",
  "Pipe Sector": "Pipes",
  Others: "Others",
};

export function getDashboardMetrics(
  portfolio: PortfolioResponse,
  holdings: HoldingWithFundamentals[],
): DashboardMetrics {
  return {
    currentValue: portfolio.summary.totalPresentValue,
    investedCapital: portfolio.summary.totalInvestment,
    gainLoss: portfolio.summary.gainLoss,
    returnPercent: portfolio.summary.gainLossPercent,
    pricedHoldings: portfolio.meta.pricedHoldings,
    totalHoldings: portfolio.meta.totalHoldings,
    winners: holdings.filter((holding) => holding.gainLoss !== null && holding.gainLoss > 0).length,
    losers: holdings.filter((holding) => holding.gainLoss !== null && holding.gainLoss < 0).length,
  };
}

export function getSectorChartData(sectors: SectorSummary[]): SectorChartDatum[] {
  const totalInvestment = sectors.reduce((total, sector) => total + sector.investment, 0);
  return sectors.map((sector) => ({
    name: sector.name,
    shortName: SHORT_SECTOR_NAMES[sector.name],
    investment: sector.investment,
    allocationPercent: totalInvestment === 0 ? 0 : (sector.investment / totalInvestment) * 100,
    gainLossPercent: sector.gainLossPercent,
    isComplete: sector.holdingCount === sector.pricedHoldingCount,
  }));
}

export function getMovers(holdings: HoldingWithFundamentals[], limit = 3) {
  const priced: MoverDatum[] = holdings
    .filter(
      (holding): holding is HoldingWithFundamentals & {
        gainLoss: number;
        gainLossPercent: number;
      } => holding.gainLoss !== null && holding.gainLossPercent !== null,
    )
    .map(({ id, name, exchangeCode, gainLoss, gainLossPercent }) => ({
      id,
      name,
      exchangeCode,
      gainLoss,
      gainLossPercent,
    }));

  const gainers = priced
    .filter((holding) => holding.gainLossPercent > 0)
    .sort((a, b) => b.gainLossPercent - a.gainLossPercent)
    .slice(0, limit);
  const laggards = priced
    .filter((holding) => holding.gainLossPercent < 0)
    .sort((a, b) => a.gainLossPercent - b.gainLossPercent)
    .slice(0, limit);

  return { gainers, laggards };
}
