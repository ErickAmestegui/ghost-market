# Architecture

The browser calls three server routes: `/api/live-evidence`, `/api/bnb-evidence` and `/api/binance-integration`. The live path reads the official xStocks public API, BNB JSON-RPC and PancakeSwap V2. Binance credentials stay server-side. A separate deterministic client engine powers the simulated demo.

Statuses: LIVE is request-time verifiable; CACHED is real provider data without freshness proof; REJECTED is a real but weak observation; UNAVAILABLE means required evidence is absent; SIMULATED is a versioned fixture.

PancakeSwap pools require the official xStock/USDT pair, readable reserves, at least $1,000 estimated liquidity and no more than 2% estimated price impact for $100.

The LIVE AFTER-HOURS GAP additionally requires `CLOSED` or `AFTER-HOURS`, a Binance observation within 30 seconds and an accepted DEX block within five minutes. It pauses during `OPEN`. Provider values are normalized to `OPEN`, `CLOSED`, `PRE-MARKET`, `AFTER-HOURS`, `HOLIDAY` or `UNKNOWN`; generic `MARKET` is never displayed.

The Binance route isolates failures from the other integrations and validates that tokenized-assets, quote and exchangeInfo agree on the ticker before returning `LIVE`.

Live BNB reads fall back across three public BNB Chain RPC endpoints. Optional price/oracle calls can become `UNAVAILABLE` without erasing valid contract provenance.
