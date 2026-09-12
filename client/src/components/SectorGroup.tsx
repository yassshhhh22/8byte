import type { HoldingWithFundamentals, SectorSummary } from "../types/portfolio";
import { formatCurrency, formatNumber, formatPercent } from "../utils/formatting";

function gainClass(value: number | null): string {
  if (value === null || value === 0) return "text-gray-700";
  return value > 0 ? "text-emerald-700" : "text-red-700";
}

export function SectorGroup({
  sector,
  holdings,
}: {
  sector: SectorSummary;
  holdings: HoldingWithFundamentals[];
}) {
  return (
    <tbody>
      <tr className="border-y border-gray-300 bg-gray-100 font-semibold text-gray-900">
        <th className="sticky left-0 z-10 bg-gray-100 px-3 py-2 text-left" scope="rowgroup">
          {sector.name}
        </th>
        <td className="px-3 py-2" colSpan={2}>
          {sector.pricedHoldingCount}/{sector.holdingCount} priced
        </td>
        <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(sector.investment)}</td>
        <td />
        <td />
        <td />
        <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(sector.presentValue)}</td>
        <td className={`px-3 py-2 text-right tabular-nums ${gainClass(sector.gainLoss)}`}>
          {formatCurrency(sector.gainLoss, true)}
        </td>
        <td colSpan={2} />
      </tr>
      {holdings.map((holding) => (
        <tr key={holding.id} className="border-b border-gray-200 bg-white hover:bg-gray-50">
          <th className="sticky left-0 z-10 bg-inherit px-3 py-2 text-left font-medium" scope="row">
            {holding.name}
            {holding.quoteStatus !== "fresh" ? (
              <span className="ml-2 text-xs font-normal capitalize text-amber-700">
                {holding.quoteStatus}
              </span>
            ) : null}
          </th>
          <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(holding.purchasePrice)}</td>
          <td className="px-3 py-2 text-right tabular-nums">{formatNumber(holding.quantity)}</td>
          <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(holding.investment)}</td>
          <td className="px-3 py-2 text-right tabular-nums">{formatPercent(holding.portfolioPercent)}</td>
          <td className="px-3 py-2 text-center">
            {holding.exchange} {holding.exchangeCode}
          </td>
          <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(holding.cmp)}</td>
          <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(holding.presentValue)}</td>
          <td className={`px-3 py-2 text-right tabular-nums ${gainClass(holding.gainLoss)}`}>
            <div>{formatCurrency(holding.gainLoss, true)}</div>
            <div className="text-xs">{formatPercent(holding.gainLossPercent, true)}</div>
          </td>
          <td className="px-3 py-2 text-right tabular-nums">{formatNumber(holding.pe)}</td>
          <td className="px-3 py-2 text-right tabular-nums">{formatNumber(holding.eps)}</td>
        </tr>
      ))}
    </tbody>
  );
}

