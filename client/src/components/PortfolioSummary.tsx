import { Activity, ArrowDownRight, ArrowUpRight, Landmark, Wallet } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { DashboardMetrics } from "../types/portfolio";
import { formatCurrency, formatPercent } from "../utils/formatting";

function valueTone(value: number | null) {
  if (value === null || value === 0) return "text-[var(--text)]";
  return value > 0 ? "text-[var(--positive)]" : "text-[var(--negative)]";
}

export function PortfolioSummary({ metrics }: { metrics: DashboardMetrics }) {
  const reduceMotion = useReducedMotion();
  const items = [
    {
      label: "Current value",
      value: formatCurrency(metrics.currentValue),
      icon: Wallet,
      detail: `${metrics.pricedHoldings} of ${metrics.totalHoldings} holdings priced`,
      tone: "text-[var(--text)]",
      featured: true,
    },
    {
      label: "Invested capital",
      value: formatCurrency(metrics.investedCapital),
      icon: Landmark,
      detail: "Purchase cost basis",
      tone: "text-[var(--text)]",
    },
    {
      label: "Total gain / loss",
      value: formatCurrency(metrics.gainLoss, true),
      icon: metrics.gainLoss !== null && metrics.gainLoss < 0 ? ArrowDownRight : ArrowUpRight,
      detail: `${metrics.winners} winners / ${metrics.losers} laggards`,
      tone: valueTone(metrics.gainLoss),
    },
    {
      label: "Portfolio return",
      value: formatPercent(metrics.returnPercent, true),
      icon: Activity,
      detail: "Against invested capital",
      tone: valueTone(metrics.returnPercent),
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-12">
      {items.map((item, index) => (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className={`metric-card ${item.featured ? "col-span-2 lg:col-span-5" : "lg:col-span-2"} ${index === 2 ? "lg:col-span-3" : ""} ${index === 3 ? "col-span-2 sm:col-span-1" : ""}`}
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          key={item.label}
          transition={{ delay: index * 0.08, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-start justify-between gap-3">
            <dt className="metric-label">{item.label}</dt>
            <item.icon aria-hidden="true" className="text-[var(--muted)]" size={17} strokeWidth={1.7} />
          </div>
          <dd className={`metric-value ${item.featured ? "text-[clamp(1.75rem,3vw,2.55rem)]" : "text-xl sm:text-2xl"} ${item.tone}`}>
            {item.value}
          </dd>
          <p className="mt-auto pt-3 text-[11px] text-[var(--muted)] sm:text-xs">{item.detail}</p>
        </motion.div>
      ))}
    </dl>
  );
}
