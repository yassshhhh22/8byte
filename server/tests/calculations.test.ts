import { describe, expect, it } from "vitest";
import {
  calculateGainLoss,
  calculateGainLossPercent,
  calculateInvestment,
  calculatePortfolioPercent,
  calculatePresentValue,
} from "../src/domain/calculations.js";

describe("portfolio calculations", () => {
  it("calculates investment and cost-basis portfolio percentage", () => {
    expect(calculateInvestment(1490, 50)).toBe(74500);
    expect(calculatePortfolioPercent(74500, 1543060)).toBeCloseTo(4.8280689);
    expect(calculatePortfolioPercent(10, 0)).toBe(0);
  });

  it("calculates present value and a positive gain", () => {
    const presentValue = calculatePresentValue(1700.15, 50);
    const gainLoss = calculateGainLoss(presentValue, 74500);

    expect(presentValue).toBeCloseTo(85007.5);
    expect(gainLoss).toBeCloseTo(10507.5);
    expect(calculateGainLossPercent(gainLoss, 74500)).toBeCloseTo(14.103);
  });

  it("calculates a negative gain", () => {
    const presentValue = calculatePresentValue(100, 10);
    const gainLoss = calculateGainLoss(presentValue, 1500);

    expect(gainLoss).toBe(-500);
    expect(calculateGainLossPercent(gainLoss, 1500)).toBeCloseTo(-33.3333);
  });

  it("keeps unavailable prices and dependent values null", () => {
    const presentValue = calculatePresentValue(null, 10);
    const gainLoss = calculateGainLoss(presentValue, 1000);

    expect(presentValue).toBeNull();
    expect(gainLoss).toBeNull();
    expect(calculateGainLossPercent(gainLoss, 1000)).toBeNull();
  });
});

