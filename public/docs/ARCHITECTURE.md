# Architecture

The browser calls three server routes: `/api/live-evidence`, `/api/bnb-evidence` and `/api/binance-integration`. The live path reads the official xStocks public API, BNB JSON-RPC and PancakeSwap V2. Binance credentials stay server-side. A separate deterministic client engine powers the simulated demo.

Statuses: LIVE is request-time verifiable; CACHED is real provider data without freshness proof; REJECTED is a real but weak observation; UNAVAILABLE means required evidence is absent; SIMULATED is a versioned fixture.

PancakeSwap pools require the official xStock/USDT pair, readable reserves, at least $1,000 estimated liquidity and no more than 2% estimated price impact for $100.
