import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  type ColumnVisibilityState,
  createColumnHelper,
  createSortedRowModel,
  FlexRender,
  type Row,
  rowSortingFeature,
  columnVisibilityFeature,
  tableFeatures,
  type Table,
  type SortingState,
  useTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Check, ChevronDown, Columns3, ListFilter, Rows3, Search, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { usePersistentState } from "../hooks/usePersistentState";
import type { DataStatus, HoldingWithFundamentals, PortfolioViewMode, SectorName, SectorSummary, TableDensity } from "../types/portfolio";
import { formatCurrency, formatNumber, formatPercent, formatTimestamp } from "../utils/formatting";

const SECTOR_COLORS: Record<SectorName, string> = {
  "Financial Sector": "#22d3ee", "Tech Sector": "#60a5fa", Consumer: "#a78bfa",
  Power: "#f59e0b", "Pipe Sector": "#34d399", Others: "#f472b6",
};

function gainClass(value: number | null): string {
  if (value === null || value === 0) return "text-[var(--text-secondary)]";
  return value > 0 ? "text-[var(--positive)]" : "text-[var(--negative)]";
}

function statusClass(status: DataStatus) {
  return status === "fresh" ? "status-fresh" : status === "stale" ? "status-stale" : "status-unavailable";
}

const features = tableFeatures({
  columnVisibilityFeature,
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
});
const columnHelper = createColumnHelper<typeof features, HoldingWithFundamentals>();
const columns = columnHelper.columns([
  columnHelper.accessor("name", {
    header: "Particulars", enableHiding: false,
    cell: ({ row }) => (
      <div className="min-w-[180px]">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[var(--text)]">{row.original.name}</span>
          {row.original.quoteStatus !== "fresh" ? <span className={`mini-status ${statusClass(row.original.quoteStatus)}`}>{row.original.quoteStatus}</span> : null}
        </div>
        <span className="text-[10px] text-[var(--muted)]">{row.original.exchangeCode}</span>
      </div>
    ),
  }),
  columnHelper.accessor("purchasePrice", { header: "Purchase Price", cell: ({ getValue }) => formatCurrency(getValue()) }),
  columnHelper.accessor("quantity", { header: "Qty", cell: ({ getValue }) => formatNumber(getValue()) }),
  columnHelper.accessor("investment", { header: "Investment", cell: ({ getValue }) => formatCurrency(getValue()) }),
  columnHelper.accessor("portfolioPercent", { header: "Portfolio %", cell: ({ getValue }) => formatPercent(getValue()) }),
  columnHelper.accessor((holding) => `${holding.exchange} ${holding.exchangeCode}`, {
    id: "exchange", header: "NSE/BSE",
    cell: ({ row }) => <span className="exchange-pill">{row.original.exchange} <span>{row.original.exchangeCode}</span></span>,
  }),
  columnHelper.accessor("cmp", { header: "CMP", cell: ({ getValue }) => formatCurrency(getValue()) }),
  columnHelper.accessor("presentValue", { header: "Present Value", cell: ({ getValue }) => formatCurrency(getValue()) }),
  columnHelper.accessor("gainLoss", {
    header: "Gain/Loss",
    cell: ({ row }) => <div className={gainClass(row.original.gainLoss)}><div className="font-medium">{formatCurrency(row.original.gainLoss, true)}</div><div className="text-[10px]">{formatPercent(row.original.gainLossPercent, true)}</div></div>,
  }),
  columnHelper.accessor("pe", { header: "P/E", cell: ({ getValue }) => formatNumber(getValue()) }),
  columnHelper.accessor("eps", { header: "Latest Earnings (EPS)", cell: ({ getValue }) => formatNumber(getValue()) }),
]);

export function PortfolioTable({ sectors, holdings }: { sectors: SectorSummary[]; holdings: HoldingWithFundamentals[] }) {
  const [query, setQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState<"all" | SectorName>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | DataStatus>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [viewMode, setViewMode] = usePersistentState<PortfolioViewMode>("portfolio-view", "grouped");
  const [density, setDensity] = usePersistentState<TableDensity>("portfolio-density", "comfortable");
  const [columnVisibility, setColumnVisibility] = usePersistentState<ColumnVisibilityState>("portfolio-columns", {});
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const reduceMotion = useReducedMotion();

  const filteredHoldings = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return holdings.filter((holding) => {
      const matchesQuery = !normalizedQuery || `${holding.name} ${holding.exchangeCode}`.toLocaleLowerCase().includes(normalizedQuery);
      return matchesQuery && (sectorFilter === "all" || holding.sector === sectorFilter) && (statusFilter === "all" || holding.quoteStatus === statusFilter);
    });
  }, [holdings, query, sectorFilter, statusFilter]);

  const table = useTable({
    features, data: filteredHoldings, columns, state: { sorting, columnVisibility }, onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
  });
  const rows = table.getRowModel().rows;
  const hasFilters = query !== "" || sectorFilter !== "all" || statusFilter !== "all";
  const clearFilters = () => { setQuery(""); setSectorFilter("all"); setStatusFilter("all"); };

  return (
    <section aria-labelledby="holdings-heading" className="holdings-section">
      <div className="holdings-heading">
        <div><p className="eyebrow">Position ledger</p><div className="flex items-baseline gap-2"><h2 id="holdings-heading">Portfolio holdings</h2><span className="text-xs tabular-nums text-[var(--muted)]">{rows.length}/{holdings.length}</span></div></div>
        <div className="segmented-control" aria-label="Holdings view">
          <button aria-pressed={viewMode === "grouped"} onClick={() => setViewMode("grouped")} type="button">Grouped</button>
          <button aria-pressed={viewMode === "all"} onClick={() => setViewMode("all")} type="button">All holdings</button>
        </div>
      </div>
      <div className="table-toolbar">
        <label className="search-field"><Search aria-hidden="true" size={15} /><span className="sr-only">Search holdings</span><input onChange={(event) => setQuery(event.target.value)} placeholder="Search company or symbol" type="search" value={query} />{query ? <button aria-label="Clear search" onClick={() => setQuery("")} type="button"><X size={14} /></button> : null}</label>
        <label className="select-wrap"><span className="sr-only">Filter by sector</span><select onChange={(event) => setSectorFilter(event.target.value as "all" | SectorName)} value={sectorFilter}><option value="all">All sectors</option>{sectors.map((sector) => <option key={sector.name} value={sector.name}>{sector.name}</option>)}</select><ChevronDown aria-hidden="true" size={14} /></label>
        <label className="select-wrap"><span className="sr-only">Filter by quote status</span><select onChange={(event) => setStatusFilter(event.target.value as "all" | DataStatus)} value={statusFilter}><option value="all">All statuses</option><option value="fresh">Fresh</option><option value="stale">Stale</option><option value="unavailable">Unavailable</option></select><ChevronDown aria-hidden="true" size={14} /></label>
        {hasFilters && rows.length > 0 ? <button className="text-button" onClick={clearFilters} type="button">Reset filters</button> : null}
        <div className="ml-auto flex items-center gap-2">
          <button className="toolbar-button" onClick={() => setDensity((current) => current === "compact" ? "comfortable" : "compact")} type="button"><Rows3 aria-hidden="true" size={15} /><span className="hidden sm:inline">{density === "compact" ? "Compact" : "Comfortable"}</span></button>
          <ColumnMenu table={table} />
        </div>
      </div>
      {rows.length === 0 ? <div className="empty-state"><ListFilter aria-hidden="true" size={24} /><p>No holdings match these filters.</p><button className="text-button" onClick={clearFilters} type="button">Reset filters</button></div> : (
        <><DesktopTable density={density} rows={rows} sectors={sectors} table={table} viewMode={viewMode} /><MobileHoldings expanded={expanded} rows={rows} setExpanded={setExpanded} viewMode={viewMode} reduceMotion={Boolean(reduceMotion)} /></>
      )}
    </section>
  );
}

function ColumnMenu({ table }: { table: Table<typeof features, HoldingWithFundamentals> }) {
  return <DropdownMenu.Root><DropdownMenu.Trigger asChild><button className="toolbar-button" type="button"><Columns3 aria-hidden="true" size={15} /><span className="hidden sm:inline">Columns</span></button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content align="end" className="dropdown-content" sideOffset={7}><DropdownMenu.Label className="dropdown-label">Visible columns</DropdownMenu.Label>{table.getAllLeafColumns().filter((column) => column.getCanHide()).map((column) => <DropdownMenu.CheckboxItem checked={column.getIsVisible()} className="dropdown-item" key={column.id} onCheckedChange={(checked) => column.toggleVisibility(Boolean(checked))}><span className="check-slot"><DropdownMenu.ItemIndicator><Check size={13} /></DropdownMenu.ItemIndicator></span>{typeof column.columnDef.header === "string" ? column.columnDef.header : column.id}</DropdownMenu.CheckboxItem>)}</DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>;
}

function DesktopTable({ density, rows, sectors, table, viewMode }: { density: TableDensity; rows: Row<typeof features, HoldingWithFundamentals>[]; sectors: SectorSummary[]; table: Table<typeof features, HoldingWithFundamentals>; viewMode: PortfolioViewMode }) {
  const rowClass = density === "compact" ? "table-row-compact" : "table-row-comfortable";
  const groups = viewMode === "grouped" ? sectors.map((sector) => ({ sector, rows: rows.filter((row) => row.original.sector === sector.name) })).filter((group) => group.rows.length > 0) : [];
  return <div className="table-scroll hidden md:block"><table className="portfolio-table"><caption className="sr-only">Portfolio holdings {viewMode === "grouped" ? "grouped by sector" : "in one sortable list"}</caption><thead>{table.getHeaderGroups().map((headerGroup) => <tr key={headerGroup.id}>{headerGroup.headers.map((header) => <th className={header.column.id === "name" ? "sticky-name" : ""} key={header.id} scope="col">{header.isPlaceholder ? null : <button className={header.column.getCanSort() ? "sort-header" : ""} disabled={!header.column.getCanSort()} onClick={header.column.getToggleSortingHandler()} type="button"><FlexRender header={header} />{header.column.getCanSort() ? <SortIcon direction={header.column.getIsSorted()} /> : null}</button>}</th>)}</tr>)}</thead>{viewMode === "grouped" ? groups.map(({ sector, rows: sectorRows }) => <tbody key={sector.name}><SectorRow colSpan={table.getVisibleLeafColumns().length} sector={sector} />{sectorRows.map((row) => <HoldingRow className={rowClass} key={row.id} row={row} />)}</tbody>) : <tbody>{rows.map((row) => <HoldingRow className={rowClass} key={row.id} row={row} />)}</tbody>}</table></div>;
}

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "asc") return <ArrowUp aria-hidden="true" size={12} />;
  if (direction === "desc") return <ArrowDown aria-hidden="true" size={12} />;
  return <ArrowUpDown aria-hidden="true" className="opacity-35" size={12} />;
}

function SectorRow({ sector, colSpan }: { sector: SectorSummary; colSpan: number }) {
  return <tr className="sector-row"><th aria-label={sector.name} colSpan={colSpan} scope="rowgroup"><div className="flex items-center gap-3"><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: SECTOR_COLORS[sector.name] }} /><span className="font-semibold text-[var(--text)]">{sector.name}</span><span className="sector-stat">{sector.pricedHoldingCount}/{sector.holdingCount} priced</span><span className="ml-auto hidden gap-5 text-[11px] tabular-nums sm:flex"><span>Invested <strong>{formatCurrency(sector.investment)}</strong></span><span>Value <strong>{formatCurrency(sector.presentValue)}</strong></span><span className={gainClass(sector.gainLoss)}>P&amp;L <strong>{formatCurrency(sector.gainLoss, true)}</strong></span></span></div></th></tr>;
}

function HoldingRow({ row, className }: { row: Row<typeof features, HoldingWithFundamentals>; className: string }) {
  return <tr className={className}>{row.getVisibleCells().map((cell) => {
    const cellClass = `${cell.column.id === "name" ? "sticky-name" : ""} ${cell.column.id === "name" || cell.column.id === "exchange" ? "text-left" : "text-right tabular-nums"}`;
    return cell.column.id === "name"
      ? <th aria-label={row.original.name} className={cellClass} key={cell.id} scope="row"><FlexRender cell={cell} /></th>
      : <td className={cellClass} key={cell.id}><FlexRender cell={cell} /></td>;
  })}</tr>;
}

function MobileHoldings({ rows, expanded, setExpanded, viewMode, reduceMotion }: { rows: Row<typeof features, HoldingWithFundamentals>[]; expanded: Set<string>; setExpanded: Dispatch<SetStateAction<Set<string>>>; viewMode: PortfolioViewMode; reduceMotion: boolean }) {
  let currentSector: SectorName | null = null;
  return <div className="mobile-holdings md:hidden">{rows.map((row) => {
    const holding = row.original; const showSector = viewMode === "grouped" && holding.sector !== currentSector; currentSector = holding.sector; const isOpen = expanded.has(holding.id);
    return <div key={holding.id}>{showSector ? <div className="mobile-sector"><span style={{ background: SECTOR_COLORS[holding.sector] }} />{holding.sector}</div> : null}<motion.article className="mobile-holding" layout={!reduceMotion}><button aria-expanded={isOpen} className="w-full text-left" onClick={() => setExpanded((current) => { const next = new Set(current); next.has(holding.id) ? next.delete(holding.id) : next.add(holding.id); return next; })} type="button"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="truncate text-sm font-semibold">{holding.name}</h3>{holding.quoteStatus !== "fresh" ? <span className={`mini-status ${statusClass(holding.quoteStatus)}`}>{holding.quoteStatus}</span> : null}</div><p className="mt-0.5 text-[10px] text-[var(--muted)]">{holding.exchange} / {holding.exchangeCode}</p></div><ChevronDown aria-hidden="true" className={`mt-0.5 text-[var(--muted)] transition-transform ${isOpen ? "rotate-180" : ""}`} size={16} /></div><dl className="mt-3 grid grid-cols-3 gap-2"><MobileValue label="CMP" value={formatCurrency(holding.cmp)} /><MobileValue label="Invested" value={formatCurrency(holding.investment)} /><MobileValue className={gainClass(holding.gainLoss)} label="Gain / loss" value={formatPercent(holding.gainLossPercent, true)} /></dl></button><AnimatePresence initial={false}>{isOpen ? <motion.div animate={{ height: "auto", opacity: 1 }} className="overflow-hidden" exit={{ height: 0, opacity: 0 }} initial={reduceMotion ? false : { height: 0, opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}><dl className="mobile-detail-grid"><MobileValue label="Purchase price" value={formatCurrency(holding.purchasePrice)} /><MobileValue label="Quantity" value={formatNumber(holding.quantity)} /><MobileValue label="Portfolio" value={formatPercent(holding.portfolioPercent)} /><MobileValue label="Present value" value={formatCurrency(holding.presentValue)} /><MobileValue label="P/E" value={formatNumber(holding.pe)} /><MobileValue label="Latest Earnings (EPS)" value={formatNumber(holding.eps)} /><MobileValue label="Quote status" value={holding.quoteStatus} /><MobileValue label="Quote updated" value={formatTimestamp(holding.quoteTimestamp)} /></dl></motion.div> : null}</AnimatePresence></motion.article></div>;
  })}</div>;
}

function MobileValue({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return <div className={className}><dt className="text-[9px] uppercase tracking-[0.08em] text-[var(--muted)]">{label}</dt><dd className="mt-0.5 truncate text-xs font-medium tabular-nums capitalize">{value}</dd></div>;
}
