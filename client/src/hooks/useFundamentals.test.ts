import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchFundamentals } from "../api/portfolioApi";
import { fundamentalsFixture } from "../test/fixtures";
import { useFundamentals } from "./useFundamentals";

vi.mock("../api/portfolioApi", () => ({
  fetchPortfolio: vi.fn(),
  fetchFundamentals: vi.fn(),
}));

const mockedFetchFundamentals = vi.mocked(fetchFundamentals);

describe("useFundamentals", () => {
  beforeEach(() => mockedFetchFundamentals.mockReset());

  it("loads once and supports a manual forced refresh", async () => {
    mockedFetchFundamentals.mockResolvedValue(fundamentalsFixture);
    const { result, unmount } = renderHook(() => useFundamentals());

    await act(async () => {
      await Promise.resolve();
    });
    expect(mockedFetchFundamentals).toHaveBeenCalledWith(false, expect.any(AbortSignal));

    await act(async () => {
      await result.current.refresh(true);
    });
    expect(mockedFetchFundamentals).toHaveBeenLastCalledWith(true, expect.any(AbortSignal));
    expect(mockedFetchFundamentals).toHaveBeenCalledTimes(2);
    unmount();
  });
});

