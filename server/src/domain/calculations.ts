export function calculateInvestment(purchasePrice: number, quantity: number): number {
  return purchasePrice * quantity;
}

export function calculatePortfolioPercent(investment: number, totalInvestment: number): number {
  return totalInvestment === 0 ? 0 : (investment / totalInvestment) * 100;
}

export function calculatePresentValue(cmp: number | null, quantity: number): number | null {
  return cmp === null ? null : cmp * quantity;
}

export function calculateGainLoss(presentValue: number | null, investment: number): number | null {
  return presentValue === null ? null : presentValue - investment;
}

export function calculateGainLossPercent(gainLoss: number | null, investment: number): number | null {
  return gainLoss === null || investment === 0 ? null : (gainLoss / investment) * 100;
}

