import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import { CONFIGURED_HOLDINGS } from "../src/data/symbolMap.js";
import {
  GoogleFinanceProvider,
  parseGoogleFinanceHtml,
  type FetchLike,
} from "../src/providers/googleFinance.provider.js";

async function fixture(name: string): Promise<string> {
  return readFile(new URL(`../fixtures/google-finance/${name}.html`, import.meta.url), "utf8");
}

describe("Google Finance parser", () => {
  it("extracts P/E and EPS from label-value containers", async () => {
    expect(parseGoogleFinanceHtml(await fixture("complete"))).toEqual({ pe: 14.05, eps: 51.21 });
  });

  it("supports unavailable P/E and negative EPS", async () => {
    expect(parseGoogleFinanceHtml(await fixture("missing-pe"))).toEqual({ pe: null, eps: 12.4 });
    expect(parseGoogleFinanceHtml(await fixture("negative-eps"))).toEqual({ pe: null, eps: -3.75 });
  });

  it("walks through tooltip wrappers and financial table cells", () => {
    const html = `
      <main>
        <div>
          <span data-is-tooltip-wrapper="true">
            <div>P/E ratio</div><div role="tooltip">Trailing ratio description</div>
          </span>
          <div>13.84</div>
        </div>
        <table><tbody><tr>
          <td><span><div>Earnings per share</div><div role="tooltip">Description</div></span></td>
          <td>51.20</td>
        </tr></tbody></table>
      </main>`;

    expect(parseGoogleFinanceHtml(html)).toEqual({ pe: 13.84, eps: 51.2 });
  });

  it("rejects an unrecognized page structure", async () => {
    const html = await fixture("unexpected");
    expect(() => parseGoogleFinanceHtml(html)).toThrow("metrics were not found");
  });
});

describe("GoogleFinanceProvider", () => {
  it("fetches the configured Google symbol and returns normalized data", async () => {
    const fetchImpl = vi.fn<FetchLike>().mockResolvedValue(
      new Response(await fixture("complete"), { status: 200 }),
    );
    const holding = CONFIGURED_HOLDINGS[0];
    const provider = new GoogleFinanceProvider(fetchImpl, 1000, () => new Date("2026-09-12T10:00:00Z"));

    const result = await provider.fetchFundamental(holding);

    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(String(fetchImpl.mock.calls[0][0])).toContain(encodeURIComponent(holding.googleSymbol));
    expect(result).toMatchObject({ holdingId: holding.id, pe: 14.05, eps: 51.21, status: "fresh" });
  });

  it("rejects non-success responses", async () => {
    const provider = new GoogleFinanceProvider(
      vi.fn<FetchLike>().mockResolvedValue(new Response("blocked", { status: 429 })),
    );
    await expect(provider.fetchFundamental(CONFIGURED_HOLDINGS[0])).rejects.toThrow("HTTP 429");
  });
});
