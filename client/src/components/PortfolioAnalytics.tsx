import { ArrowDownRight, ArrowUpRight, CircleDollarSign } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HoldingWithFundamentals, SectorSummary } from "../types/portfolio";
import { formatCurrency, formatPercent } from "../utils/formatting";
import { getMovers, getSectorChartData } from "../utils/dashboard";

const SECTOR_COLORS = ["#22d3ee", "#60a5fa", "#a78bfa", "#f59e0b", "#34d399", "#f472b6"];

function Panel({ children, index, className = "" }: { children: React.ReactNode; index: number; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className={`analytics-panel ${className}`}
      initial={reduceMotion ? false : { opacity: 0, y: 22 }}
      transition={{ delay: 0.22 + index * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.section>
  );
}

export function PortfolioAnalytics({
  sectors,
  holdings,
}: {
  sectors: SectorSummary[];
  holdings: HoldingWithFundamentals[];
}) {
  const sectorData = getSectorChartData(sectors);
  const completePerformance = sectorData.filter((sector) => sector.isComplete && sector.gainLossPercent !== null);
  const { gainers, laggards } = getMovers(holdings);

  return (
    <div className="grid gap-3 lg:grid-cols-12">
      <Panel className="lg:col-span-4" index={0}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Capital structure</p>
            <h2>Allocation by sector</h2>
          </div>
          <CircleDollarSign aria-hidden="true" size={18} />
        </div>
        <div className="relative h-52" role="img" aria-label="Capital allocation by sector donut chart">
          <ResponsiveContainer height="100%" width="100%">
            <PieChart>
              <Pie
                animationDuration={900}
                data={sectorData}
                dataKey="investment"
                innerRadius="64%"
                nameKey="shortName"
                outerRadius="88%"
                paddingAngle={2}
                stroke="none"
              >
                {sectorData.map((sector, index) => (
                  <Cell fill={SECTOR_COLORS[index % SECTOR_COLORS.length]} key={sector.name} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 6 }}
                formatter={(value) => formatCurrency(Number(value))}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">Sectors</span>
            <strong className="text-2xl tabular-nums">{sectorData.length}</strong>
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-2" aria-label="Capital allocation details">
          {sectorData.map((sector, index) => (
            <li className="flex min-w-0 items-center gap-2 text-xs" key={sector.name}>
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: SECTOR_COLORS[index] }} />
              <span className="truncate text-[var(--muted)]">{sector.shortName}</span>
              <span className="ml-auto tabular-nums">{sector.allocationPercent.toFixed(1)}%</span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel className="lg:col-span-5" index={1}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Market snapshot</p>
            <h2>Sector performance</h2>
          </div>
          <span className="coverage-label">{completePerformance.length}/{sectorData.length} complete</span>
        </div>
        {completePerformance.length > 0 ? (
          <>
            <div className="h-[264px]" role="img" aria-label="Sector gain and loss percentage bar chart">
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={completePerformance} layout="vertical" margin={{ left: 4, right: 22, top: 8, bottom: 4 }}>
                  <XAxis
                    axisLine={false}
                    tick={{ fill: "var(--muted)", fontSize: 10 }}
                    tickFormatter={(value) => `${value}%`}
                    tickLine={false}
                    type="number"
                  />
                  <YAxis
                    axisLine={false}
                    dataKey="shortName"
                    tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                    tickLine={false}
                    type="category"
                    width={76}
                  />
                  <ReferenceLine stroke="var(--border-strong)" x={0} />
                  <Tooltip
                    contentStyle={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 6 }}
                    formatter={(value) => formatPercent(Number(value), true)}
                  />
                  <Bar animationDuration={850} dataKey="gainLossPercent" radius={[0, 3, 3, 0]}>
                    {completePerformance.map((sector) => (
                      <Cell fill={(sector.gainLossPercent ?? 0) >= 0 ? "var(--positive)" : "var(--negative)"} key={sector.name} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {completePerformance.length < sectorData.length ? (
              <p className="chart-note">Incomplete sectors are excluded, not counted as zero.</p>
            ) : null}
          </>
        ) : (
          <div className="chart-empty">Sector returns appear when every holding in a sector is priced.</div>
        )}
        <ul className="sr-only">
          {completePerformance.map((sector) => <li key={sector.name}>{sector.shortName}: {formatPercent(sector.gainLossPercent, true)}</li>)}
        </ul>
      </Panel>

      <Panel className="lg:col-span-3" index={2}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Price leaders</p>
            <h2>Market movers</h2>
          </div>
        </div>
        <div className="space-y-5">
          <MoverList icon={ArrowUpRight} items={gainers} label="Top gainers" positive />
          <MoverList icon={ArrowDownRight} items={laggards} label="Laggards" />
        </div>
      </Panel>
    </div>
  );
}

function MoverList({
  label,
  items,
  positive = false,
  icon: Icon,
}: {
  label: string;
  items: ReturnType<typeof getMovers>["gainers"];
  positive?: boolean;
  icon: typeof ArrowUpRight;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
        <Icon aria-hidden="true" className={positive ? "text-[var(--positive)]" : "text-[var(--negative)]"} size={14} />
        {label}
      </div>
      {items.length === 0 ? <p className="py-2 text-xs text-[var(--muted)]">No positions</p> : (
        <ol className="divide-y divide-[var(--border)]">
          {items.map((item) => (
            <li className="flex items-center gap-2 py-2.5" key={item.id}>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{item.name}</p>
                <p className="text-[10px] text-[var(--muted)]">{item.exchangeCode}</p>
              </div>
              <div className={`ml-auto text-right ${positive ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>
                <p className="text-xs font-semibold tabular-nums">{formatPercent(item.gainLossPercent, true)}</p>
                <p className="text-[10px] tabular-nums opacity-80">{formatCurrency(item.gainLoss, true)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
