import type { FundamentalsResponse, PortfolioResponse } from "../types/portfolio";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

async function requestJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function fetchPortfolio(signal?: AbortSignal): Promise<PortfolioResponse> {
  return requestJson<PortfolioResponse>("/api/portfolio", signal);
}

export function fetchFundamentals(
  forceRefresh = false,
  signal?: AbortSignal,
): Promise<FundamentalsResponse> {
  const query = forceRefresh ? "?refresh=true" : "";
  return requestJson<FundamentalsResponse>(`/api/fundamentals${query}`, signal);
}

