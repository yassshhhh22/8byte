import type { AggregateQuoteStatus, DataStatus } from "../types/portfolio";

const STATUS_STYLES: Record<AggregateQuoteStatus, string> = {
  fresh: "status-fresh",
  stale: "status-stale",
  partial: "status-stale",
  unavailable: "status-unavailable",
};

export function SourceStatus({
  label,
  status,
  detail,
}: {
  label: string;
  status: AggregateQuoteStatus | DataStatus;
  detail?: string;
}) {
  return (
    <span className={`status-badge ${STATUS_STYLES[status]}`}>
      <span className="status-dot" aria-hidden="true" />
      <span className="font-semibold">{label}</span>
      <span className="capitalize">{status}</span>
      {detail ? <span className="opacity-70">{detail}</span> : null}
    </span>
  );
}
