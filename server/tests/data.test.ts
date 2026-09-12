import { describe, expect, it } from "vitest";
import { HOLDINGS } from "../src/data/holdings.js";
import { CONFIGURED_HOLDINGS, SYMBOL_MAP } from "../src/data/symbolMap.js";
import { calculateInvestment } from "../src/domain/calculations.js";
import { SECTOR_NAMES } from "../src/types/portfolio.js";

const EXPECTED_SECTOR_TOTALS = {
  "Financial Sector": 328450,
  "Tech Sector": 337820,
  Consumer: 263565,
  Power: 158860,
  "Pipe Sector": 198656,
  Others: 255709,
};

describe("static portfolio data", () => {
  it("contains exactly 26 unique active holdings in six sectors", () => {
    expect(HOLDINGS).toHaveLength(26);
    expect(new Set(HOLDINGS.map((holding) => holding.id)).size).toBe(26);
    expect(new Set(HOLDINGS.map((holding) => holding.sector))).toEqual(new Set(SECTOR_NAMES));
  });

  it("reconciles to the workbook investment totals", () => {
    const sectorTotals = Object.fromEntries(
      SECTOR_NAMES.map((sector) => [
        sector,
        HOLDINGS.filter((holding) => holding.sector === sector).reduce(
          (total, holding) => total + calculateInvestment(holding.purchasePrice, holding.quantity),
          0,
        ),
      ]),
    );

    expect(sectorTotals).toEqual(EXPECTED_SECTOR_TOTALS);
    expect(Object.values(sectorTotals).reduce((total, value) => total + value, 0)).toBe(1543060);
  });

  it("contains valid inputs and complete provider mappings", () => {
    for (const holding of CONFIGURED_HOLDINGS) {
      expect(holding.id).toBeTruthy();
      expect(holding.name).toBeTruthy();
      expect(holding.purchasePrice).toBeGreaterThan(0);
      expect(holding.quantity).toBeGreaterThan(0);
      expect(holding.yahooSymbol).toBeTruthy();
      expect(holding.googleSymbol).toBeTruthy();
      expect(SYMBOL_MAP[holding.id]).toBeDefined();
    }
  });

  it("does not contain the sold positions", () => {
    const names = HOLDINGS.map((holding) => holding.name.toLowerCase());
    expect(names).not.toContain("infy");
    expect(names).not.toContain("happeist mind");
    expect(names).not.toContain("easemytrip");
  });
});

