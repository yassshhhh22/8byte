import { useCallback, useEffect, useRef, useState } from "react";
import { fetchPortfolio } from "../api/portfolioApi";
import type { PortfolioResponse } from "../types/portfolio";

const POLL_INTERVAL_MS = 15_000;

interface ActiveRequest {
  controller: AbortController;
}

export function usePortfolio() {
  const [data, setData] = useState<PortfolioResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeRequest = useRef<ActiveRequest | null>(null);
  const dataRef = useRef<PortfolioResponse | null>(null);

  const refresh = useCallback(async () => {
    if (activeRequest.current) return;
    const request = { controller: new AbortController() };
    activeRequest.current = request;
    setIsRefreshing(dataRef.current !== null);

    try {
      const next = await fetchPortfolio(request.controller.signal);
      if (activeRequest.current !== request) return;
      dataRef.current = next;
      setData(next);
      setError(null);
      setIsStale(false);
    } catch (requestError) {
      if (activeRequest.current !== request) return;
      if (requestError instanceof DOMException && requestError.name === "AbortError") return;
      setError("Prices could not be refreshed.");
      setIsStale(dataRef.current !== null);
    } finally {
      if (activeRequest.current === request) {
        activeRequest.current = null;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
      const request = activeRequest.current;
      activeRequest.current = null;
      request?.controller.abort();
    };
  }, [refresh]);

  return { data, isLoading, isRefreshing, isStale, error, refresh };
}
