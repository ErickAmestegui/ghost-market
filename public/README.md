# Ghost Market Beta 0.6

Ghost Market separates verified BNB Chain evidence from a deterministic market-analysis demo. It is not a trading app, forecast or investment recommendation.

## LIVE EVIDENCE

- Official xStocks registry and issuer provenance.
- BNB Smart Chain contract and block reads.
- PancakeSwap V2 pair discovery, reserves, liquidity and price-impact controls.
- Binance Stocks Trading Market Data through a server-only API key.

`LIVE`, `CACHED`, `REJECTED`, `UNAVAILABLE` and `SIMULATED` have different meanings and are never conflated.

## DETERMINISTIC DEMO

Ghost Brain, Council, Score, Consensus, scenarios, research, replay, Break the Consensus and The Morning After use versioned simulated fixtures.

## Current state

The xStock contracts are verifiable. Binance credentials are not configured. Observed PancakeSwap V2 liquidity is absent or below the acceptance threshold, so the LIVE AFTER-HOURS GAP correctly reports INCOMPLETE EVIDENCE.

See `/docs/ARCHITECTURE.md`, `/docs/CONTRACTS.md` and `/docs/DEVELOPER_EXPERIENCE_REPORT.md`.

## Server configuration

Configure `BINANCE_API_KEY` only as a server secret. The browser never receives it. Safe outcomes are `MISSING_CREDENTIALS`, `INVALID_CREDENTIALS`, `RATE_LIMITED`, `TIMEOUT`, `ASSET_NOT_FOUND`, `EMPTY_RESPONSE` and `PROVIDER_ERROR`.

## Local verification

Requires Node.js ≥22.13.0. Run `npm run install:ci`, `npm test`, `npm run lint`, `npm run build` and `npm run dev`.

## Documentation

- [Architecture](/docs/ARCHITECTURE.md)
- [Contracts and provenance](/docs/CONTRACTS.md)
- [Developer Experience Report](/docs/DEVELOPER_EXPERIENCE_REPORT.md)
- [License](/LICENSE.txt)

## External publication limits

Authenticated Binance success, a public repository URL, a demo-video URL and anonymous-site access require owner-provided credentials or authorization. No URL, successful response or access claim is invented.
