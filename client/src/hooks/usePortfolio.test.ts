import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchPortfolio } from "../api/portfolioApi";
import { portfolioFixture } from "../test/fixtures";
import { usePortfolio } from "./usePortfolio";

vi.mock("../api/portfolioApi", () => ({
  fetchPortfolio: vi.fn(),
  fetchFundamentals: vi.fn(),
}));

const mockedFetchPortfolio = vi.mocked(fetchPortfolio);

describe("usePortfolio", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockedFetchPortfolio.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fetches immediately and approximately every 15 seconds", async () => {
    mockedFetchPortfolio.mockResolvedValue(portfolioFixture);
    const { result, unmount } = renderHook(() => usePortfolio());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.data).toEqual(portfolioFixture);
    expect(mockedFetchPortfolio).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    expect(mockedFetchPortfolio).toHaveBeenCalledTimes(2);
    unmount();
  });

  it("keeps the previous response and marks it stale after a refresh failure", async () => {
    mockedFetchPortfolio
      .mockResolvedValueOnce(portfolioFixture)
      .mockRejectedValueOnce(new Error("network"));
    const { result, unmount } = renderHook(() => usePortfolio());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });

    expect(result.current.isStale).toBe(true);
    expect(result.current.data).toEqual(portfolioFixture);
    expect(result.current.error).toBe("Prices could not be refreshed.");
    unmount();
  });

  it("does not overlap requests and aborts on unmount", async () => {
    let resolveRequest!: (value: typeof portfolioFixture) => void;
    mockedFetchPortfolio.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const { unmount } = renderHook(() => usePortfolio());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    expect(mockedFetchPortfolio).toHaveBeenCalledTimes(1);

    unmount();
    expect(mockedFetchPortfolio.mock.calls[0][0]?.aborted).toBe(true);
    resolveRequest(portfolioFixture);
  });
});
