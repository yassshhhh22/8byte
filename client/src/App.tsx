import { AlertTriangle, RotateCcw } from "lucide-react";
import { lazy, Suspense, useMemo } from "react";
import { DashboardHeader } from "./components/DashboardHeader";
import { LoadingState } from "./components/LoadingState";
import { PortfolioSummary } from "./components/PortfolioSummary";
import { useFundamentals } from "./hooks/useFundamentals";
import { usePortfolio } from "./hooks/usePortfolio";
import { useTheme } from "./hooks/useTheme";
import type { AggregateQuoteStatus, HoldingWithFundamentals } from "./types/portfolio";
import { getDashboardMetrics } from "./utils/dashboard";

const PortfolioAnalytics = lazy(() =>
  import("./components/PortfolioAnalytics").then((module) => ({ default: module.PortfolioAnalytics })),
);
const PortfolioTable = lazy(() =>
  import("./components/PortfolioTable").then((module) => ({ default: module.PortfolioTable })),
);

export default function App() {
  const portfolio = usePortfolio();
  const fundamentals = useFundamentals();
  const { theme, toggleTheme } = useTheme();

  const holdings = useMemo<HoldingWithFundamentals[]>(() => {
    if (!portfolio.data) return [];
    const byHolding = new Map((fundamentals.data?.holdings ?? []).map((item) => [item.holdingId, item]));
    return portfolio.data.holdings.map((holding) => {
      const fundamental = byHolding.get(holding.id);
      return { ...holding, pe: fundamental?.pe ?? null, eps: fundamental?.eps ?? null, fundamentalStatus: fundamental?.status ?? "unavailable" };
    });
  }, [portfolio.data, fundamentals.data]);

  const googleStatus: AggregateQuoteStatus = fundamentals.data === null || fundamentals.data.meta.available === 0
    ? "unavailable" : fundamentals.data.meta.unavailable > 0 ? "partial" : "fresh";
  const refreshAll = () => void Promise.all([portfolio.refresh(), fundamentals.refresh(true)]);
  const isRefreshing = portfolio.isRefreshing || fundamentals.isLoading;
  const header = <DashboardHeader
    fundamentalsAt={fundamentals.data?.meta.fetchedAt} generatedAt={portfolio.data?.meta.generatedAt ?? ""}
    googleCoverage={fundamentals.data ? `${fundamentals.data.meta.available}/${fundamentals.data.meta.available + fundamentals.data.meta.unavailable}` : undefined}
    googleStatus={googleStatus} isRefreshing={isRefreshing} onRefresh={refreshAll} onToggleTheme={toggleTheme} theme={theme}
    yahooCoverage={portfolio.data ? `${portfolio.data.meta.pricedHoldings}/${portfolio.data.meta.totalHoldings}` : "0/26"}
    yahooStatus={portfolio.data ? (portfolio.isStale ? "stale" : portfolio.data.meta.quoteStatus) : "unavailable"}
  />;

  if (portfolio.isLoading && !portfolio.data) return <>{header}<main className="app-shell py-5 sm:py-7"><LoadingState /></main></>;
  if (!portfolio.data) return <>{header}<main className="app-shell py-8"><div className="error-state" role="alert"><AlertTriangle aria-hidden="true" size={24} /><div><h2>Portfolio data is unavailable</h2><p>{portfolio.error ?? "The live portfolio could not be loaded."}</p></div><button className="primary-button" onClick={() => void portfolio.refresh()} type="button"><RotateCcw size={15} />Retry</button></div></main></>;

  const metrics = getDashboardMetrics(portfolio.data, holdings);
  const notice = [portfolio.error, fundamentals.error].filter(Boolean).join(" ");
  return <>{header}<main className="app-shell py-5 sm:py-7">
    <div className="mb-5 flex flex-col gap-1 sm:mb-6"><p className="eyebrow">Live portfolio intelligence</p><div className="flex flex-wrap items-end justify-between gap-2"><h2 className="text-xl font-semibold sm:text-2xl">Performance at a glance</h2><p className="text-xs text-[var(--muted)]">Snapshot analytics, updated automatically every 15 seconds</p></div></div>
    {notice ? <div className="notice-banner" role="status"><AlertTriangle aria-hidden="true" size={16} /><span>{notice}{portfolio.isStale ? " Last successful prices remain visible." : ""}</span></div> : null}
    <PortfolioSummary metrics={metrics} />
    <div className="mt-3 sm:mt-4">
      <Suspense fallback={<div className="grid gap-3 lg:grid-cols-12"><div className="skeleton h-80 lg:col-span-4" /><div className="skeleton h-80 lg:col-span-5" /><div className="skeleton h-80 lg:col-span-3" /></div>}>
        <PortfolioAnalytics holdings={holdings} sectors={portfolio.data.sectors} />
      </Suspense>
    </div>
    <div aria-busy={portfolio.isRefreshing} className="mt-6 sm:mt-8">
      <Suspense fallback={<div className="skeleton h-96" />}>
        <PortfolioTable holdings={holdings} sectors={portfolio.data.sectors} />
      </Suspense>
    </div>
    <p aria-live="polite" className="sr-only">{isRefreshing ? "Refreshing portfolio data." : notice ? notice : "Portfolio data is up to date."}</p>
  </main></>;
}
