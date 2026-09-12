import { useCallback, useEffect, useRef, useState } from "react";
import { fetchFundamentals } from "../api/portfolioApi";
import type { FundamentalsResponse } from "../types/portfolio";

interface ActiveRequest {
  controller: AbortController;
}

export function useFundamentals() {
  const [data, setData] = useState<FundamentalsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeRequest = useRef<ActiveRequest | null>(null);

  const refresh = useCallback(async (forceRefresh = false) => {
    if (activeRequest.current) return;
    const request = { controller: new AbortController() };
    activeRequest.current = request;
    setIsLoading(true);

    try {
      const next = await fetchFundamentals(forceRefresh, request.controller.signal);
      if (activeRequest.current !== request) return;
      setData(next);
      setError(null);
    } catch (requestError) {
      if (activeRequest.current !== request) return;
      if (requestError instanceof DOMException && requestError.name === "AbortError") return;
      setError("Fundamentals could not be loaded.");
    } finally {
      if (activeRequest.current === request) {
        activeRequest.current = null;
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refresh(false);
    return () => {
      const request = activeRequest.current;
      activeRequest.current = null;
      request?.controller.abort();
    };
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
