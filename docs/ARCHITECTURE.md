# Architecture

The workbook supplies only portfolio identity and purchase data. Runtime CMP, P/E, EPS, present value, and gain/loss values are never read from it. `holdings.ts` owns the 26 active records, while `symbolMap.ts` owns explicit Yahoo and Google identifiers.

Provider responses stop at adapter boundaries. Yahoo and Google payloads are validated or parsed into small internal snapshots before services or React see them.

## Request Flow

~~~text
React usePortfolio
  -> GET /api/portfolio every 15 seconds
  -> QuoteService
  -> 10-second cache or one Yahoo batch
  -> pure portfolio calculations
  -> sector and portfolio aggregation

React useFundamentals
  -> GET /api/fundamentals on load or manual refresh
  -> FundamentalsService
  -> 30-minute cache or Google requests at concurrency four
  -> independently settled normalized results
~~~

The two flows do not call or depend on each other. React joins their final records by holdingId.

## Failure Behavior

An expired successful cache entry is retained. If its next provider request fails, the service returns that entry with stale status. If no successful value exists, the field is null and the holding is unavailable.

One missing quote produces a partial portfolio response. Investment and coverage stay available. Market value and P&L totals become unavailable for the affected sector and the overall portfolio.

The client retains the previous complete response only when the HTTP refresh itself fails. A successful partial response replaces the old response because server fallback decisions are authoritative.

## Security and Deployment

Helmet sets baseline response headers. CORS accepts requests without an Origin header and configured exact browser origins only. Errors are converted to a small public shape without provider bodies, HTML, or stack traces.

Vercel deploys client/ and server/ as separate projects. Express runs as one Vercel Function. No database, credentials, authentication, WebSockets, background worker, or shared cache is used.
