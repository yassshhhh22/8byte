import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import type { ConfiguredHolding, FundamentalSnapshot } from "../types/portfolio.js";

export interface ParsedFundamentals {
  pe: number | null;
  eps: number | null;
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function parseNumber(value: string): number | null {
  const normalized = normalizeText(value)
    .replace(/[₹$,]/g, "")
    .replace(/−/g, "-");
  if (normalized === "" || normalized === "-" || normalized.toLowerCase() === "n/a") return null;
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function ownText($: cheerio.CheerioAPI, element: AnyNode): string {
  return normalizeText($(element).clone().children().remove().end().text());
}

function findMetric(
  $: cheerio.CheerioAPI,
  acceptedLabels: readonly string[],
): { found: boolean; value: number | null } {
  const labels = new Set(acceptedLabels.map((label) => label.toLowerCase()));
  let found = false;

  for (const element of $("body *").toArray()) {
    if (!labels.has(ownText($, element).toLowerCase())) continue;
    found = true;

    let current = $(element);
    for (let depth = 0; depth < 4; depth += 1) {
      if (current.is("tr")) break;

      let sibling = current.next();
      while (sibling.length > 0) {
        if (sibling.attr("role") === "tooltip" || sibling.attr("aria-hidden") === "true") {
          sibling = sibling.next();
          continue;
        }

        const text = normalizeText(sibling.text());
        if (text === "") {
          sibling = sibling.next();
          continue;
        }

        return { found: true, value: parseNumber(text) };
      }

      const parent = current.parent();
      if (parent.length === 0 || parent.is("body")) break;
      current = parent;
    }
  }

  return { found, value: null };
}

export function parseGoogleFinanceHtml(html: string): ParsedFundamentals {
  const $ = cheerio.load(html);
  const pe = findMetric($, ["P/E ratio", "PE ratio"]);
  const eps = findMetric($, ["EPS", "Earnings per share"]);

  if (!pe.found && !eps.found) {
    throw new Error("Google Finance metrics were not found in the response");
  }

  return { pe: pe.value, eps: eps.value };
}

export type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export class GoogleFinanceProvider {
  constructor(
    private readonly fetchImpl: FetchLike = fetch,
    private readonly timeoutMs = 5000,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async fetchFundamental(holding: ConfiguredHolding): Promise<FundamentalSnapshot> {
    const url = `https://www.google.com/finance/quote/${encodeURIComponent(holding.googleSymbol)}?hl=en`;
    const response = await this.fetchImpl(url, {
      headers: {
        "accept-language": "en-US,en;q=0.9",
        "user-agent": "8byte-portfolio-dashboard/1.0",
      },
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Google Finance returned HTTP ${response.status}`);
    }

    const parsed = parseGoogleFinanceHtml(await response.text());
    return {
      holdingId: holding.id,
      pe: parsed.pe,
      eps: parsed.eps,
      fetchedAt: this.now().toISOString(),
      status: "fresh",
    };
  }
}
