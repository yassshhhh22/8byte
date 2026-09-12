# 8byte Portfolio Dashboard

A full-stack dashboard for the supplied 26-stock portfolio. The Express API retrieves current market prices from Yahoo Finance, retrieves P/E and EPS from Google Finance, calculates holding and sector performance, and exposes normalized JSON to a small React client.

## Features

- 26 active holdings in six workbook-defined sectors
- Yahoo quote batching with a 10-second in-memory cache
- Google Finance parsing with concurrency limited to four requests and a 30-minute cache
- Isolated provider failures with fresh, stale, partial, and unavailable states
- Server-owned investment, present-value, gain/loss, and aggregation calculations
- 15-second price polling without overlapping browser requests
- Animated snapshot analytics with Recharts and truthful partial-data states
- Searchable, sortable TanStack holdings table plus expandable mobile rows
- Persistent dark/light themes with self-hosted Onest and Azeret Mono typography
- Focused Vitest, Testing Library, Supertest, and Playwright coverage

## Architecture

The repository uses npm workspaces:

~~~text
client/   React, Vite, TypeScript, Tailwind CSS, Recharts, TanStack Table, Motion
server/   Express, TypeScript, yahoo-finance2, Cheerio
docs/     Architecture, implementation challenges, Loom outline
~~~

The browser calls two independent data paths:

~~~text
GET /api/portfolio     -> Yahoo Finance -> calculations -> sector aggregation
GET /api/fundamentals  -> Google Finance -> P/E and EPS
~~~

The portfolio endpoint is polled every 15 seconds. Google Finance is loaded separately and is never called by that polling path.

## Portfolio Calculations

~~~text
Investment       = Purchase Price x Quantity
Portfolio %      = Holding Investment / Total Investment x 100
Present Value    = CMP x Quantity
Gain/Loss        = Present Value - Investment
Gain/Loss %      = Gain/Loss / Investment x 100
~~~

Sector values sum their holdings. The static investment must reconcile to ₹1,543,060. If a holding has neither a current nor stale CMP, its market values are null. The affected sector and overall portfolio market totals are also null rather than misleading partial sums.

## API

### GET /api/health

Returns API availability without contacting either market provider.

### GET /api/portfolio

Returns metadata, the portfolio summary, six sector summaries, and 26 valued holdings. It uses Yahoo Finance only.

### GET /api/fundamentals

Returns P/E, EPS, timestamps, and status by holding ID. Add ?refresh=true to bypass fresh cache entries. It uses Google Finance only.

Expected provider failures still return useful normalized records. Unexpected server errors use:

~~~json
{
  "error": "INTERNAL_ERROR",
  "message": "The server could not complete the request",
  "timestamp": "2026-09-12T10:00:00.000Z"
}
~~~

## Running Locally

Use Node.js 24 and npm.

~~~bash
npm install
~~~

Start the API and client in separate terminals:

~~~bash
npm run dev:server
npm run dev:client
~~~

The API defaults to http://localhost:3000 and the client to http://localhost:5173. Copy client/.env.example and server/.env.example when overrides are needed.

## Testing

~~~bash
npm test
npm run typecheck
npm run build
npm run test:e2e --workspace @8byte/client
~~~

Unit, integration, and browser tests do not contact live providers. The Playwright suite uses normalized fixtures and checks desktop, tablet, and mobile layouts. Run the explicit live smoke check separately:

~~~bash
npm run verify:providers --workspace @8byte/server
~~~

Google may legitimately omit P/E for loss-making companies. A Google failure may also indicate request blocking or a changed page structure rather than an invalid exchange symbol.

## Deployment

Create two Vercel projects from this repository:

1. Set the frontend project's root directory to client.
2. Set the backend project's root directory to server.
3. Select Node.js 24 for both projects.
4. Set VITE_API_BASE_URL on the client to the backend deployment URL.
5. Set CLIENT_ORIGIN on the server to the exact frontend deployment origin.
6. Deploy the backend first and verify all three endpoints before deploying the client.

The Express application is exported from server/src/index.ts, which Vercel detects as one function. The server cache is process-local and best-effort: a cold instance starts with an empty cache.

## Provider Limitations

Yahoo Finance and Google Finance do not provide guaranteed public APIs for this use case. Provider schemas, identifiers, rate limits, or HTML can change. This project validates and normalizes external data, limits Google concurrency, caches responses, and preserves last-known-good values, but it is not appropriate for investment decisions. A production service should use licensed market data and shared caching.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Challenges](docs/CHALLENGES.md)
- [Loom outline](docs/LOOM_OUTLINE.md)
