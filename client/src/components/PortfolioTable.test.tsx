import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { portfolioFixture } from "../test/fixtures";
import type { HoldingWithFundamentals } from "../types/portfolio";
import { PortfolioTable } from "./PortfolioTable";

describe("PortfolioTable", () => {
  beforeEach(() => window.localStorage.clear());

  it("renders the required columns, sector summary, and holding data", () => {
    const holdings: HoldingWithFundamentals[] = portfolioFixture.holdings.map((holding) => ({
      ...holding,
      pe: 14.05,
      eps: 51.21,
      fundamentalStatus: "fresh",
    }));
    render(<PortfolioTable sectors={portfolioFixture.sectors} holdings={holdings} />);

    for (const heading of [
      "Particulars",
      "Purchase Price",
      "Qty",
      "Investment",
      "Portfolio %",
      "NSE/BSE",
      "CMP",
      "Present Value",
      "Gain/Loss",
      "P/E",
      "Latest Earnings (EPS)",
    ]) {
      expect(screen.getByRole("columnheader", { name: heading })).toBeInTheDocument();
    }

    expect(screen.getByRole("rowheader", { name: "Financial Sector" })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "HDFC Bank" })).toBeInTheDocument();
    expect(screen.getByText("14.05")).toBeInTheDocument();
    expect(screen.getByText("51.21")).toBeInTheDocument();
  });

  it("shows unavailable values as an em dash", () => {
    const holding: HoldingWithFundamentals = {
      ...portfolioFixture.holdings[0],
      cmp: null,
      presentValue: null,
      gainLoss: null,
      gainLossPercent: null,
      quoteStatus: "unavailable",
      pe: null,
      eps: null,
      fundamentalStatus: "unavailable",
    };
    const sector = {
      ...portfolioFixture.sectors[0],
      presentValue: null,
      gainLoss: null,
      gainLossPercent: null,
      pricedHoldingCount: 0,
    };

    render(<PortfolioTable sectors={[sector]} holdings={[holding]} />);
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(5);
  });

  it("searches holdings and provides a resettable empty state", async () => {
    const user = userEvent.setup();
    const holdings: HoldingWithFundamentals[] = portfolioFixture.holdings.map((holding) => ({
      ...holding,
      pe: 14.05,
      eps: 51.21,
      fundamentalStatus: "fresh",
    }));
    render(<PortfolioTable sectors={portfolioFixture.sectors} holdings={holdings} />);

    await user.type(screen.getByRole("searchbox", { name: "Search holdings" }), "missing");
    expect(screen.getByText("No holdings match these filters.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset filters" }));
    expect(screen.getByRole("rowheader", { name: "HDFC Bank" })).toBeInTheDocument();
  });

  it("expands the mobile holding details", async () => {
    const user = userEvent.setup();
    const holdings: HoldingWithFundamentals[] = portfolioFixture.holdings.map((holding) => ({
      ...holding,
      pe: 14.05,
      eps: 51.21,
      fundamentalStatus: "fresh",
    }));
    render(<PortfolioTable sectors={portfolioFixture.sectors} holdings={holdings} />);

    const mobileRow = screen.getByRole("button", { name: /HDFC Bank NSE/ });
    await user.click(mobileRow);

    expect(mobileRow).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Quote updated")).toBeInTheDocument();
    expect(screen.getByText("Latest Earnings (EPS)", { selector: "dt" })).toBeInTheDocument();
  });
});
