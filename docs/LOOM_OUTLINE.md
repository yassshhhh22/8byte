# Five-Minute Loom Outline

## 0:00-0:30 - Problem

Explain the supplied portfolio, the three live fields, the refresh requirement, and why provider failures matter.

## 0:30-1:15 - Dashboard

Show sector grouping, the four summary values, price and fundamental freshness, and responsive table scrolling.

## 1:15-2:00 - Architecture

Show the independent Yahoo and Google request paths and explain why Google is not coupled to 15-second polling.

## 2:00-2:45 - Provider Strategy

Explain explicit symbols, Yahoo batching, Google concurrency four, the two cache durations, and serverless cache limitations.

## 2:45-3:30 - Backend Structure

Show static data, pure calculations, provider adapters, services, and the three routes. Demonstrate that external payloads never reach React.

## 3:30-4:15 - Failures and Tests

Show stale fallback, partial coverage, null handling, the ₹1,543,060 invariant, and fixture-driven provider tests.

## 4:15-5:00 - Limitations

Discuss unofficial data sources, Google HTML fragility, process-local caching, licensed production data, and the absence of unnecessary infrastructure.

