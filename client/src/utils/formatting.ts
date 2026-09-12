const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const signedCurrencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
});

const numberFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number | null, signed = false): string {
  if (value === null) return "—";
  return (signed ? signedCurrencyFormatter : currencyFormatter).format(value);
}

export function formatPercent(value: number | null, signed = false): string {
  if (value === null) return "—";
  const sign = signed && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatNumber(value: number | null): string {
  return value === null ? "—" : numberFormatter.format(value);
}

export function formatTimestamp(value: string | null | undefined): string {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : new Intl.DateTimeFormat("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(date);
}

