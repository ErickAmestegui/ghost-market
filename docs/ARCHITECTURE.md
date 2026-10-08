# Ghost Market architecture

## Trust boundary

Ghost Market runs two deliberately separate paths.

1. **LIVE EVIDENCE** reads official xStocks metadata, BNB Smart Chain state and PancakeSwap V2 pools at request time. Binance Stocks Trading data is requested only by the server and is unavailable until a server-side API key is configured.
2. **DETERMINISTIC DEMO** runs versioned fixtures through pure consensus, confidence, scoring, replay and scenario functions. It is never promoted to `LIVE`.

```text
Browser
  ├─ /api/live-evidence
  │    ├─ xStocks public Assets API (official registry, market period, cached price)
  │    ├─ xStocks public Oracles API (feed provenance)
  │    ├─ BNB public JSON-RPC (contract bytecode, symbol, block)
  │    └─ PancakeSwap V2 factory/pair (pair discovery and reserves)
  ├─ /api/bnb-evidence
  │    └─ BNB public JSON-RPC (independent contract proof)
  ├─ /api/binance-integration
  │    └─ Binance Stocks Trading Market Data (server-only API key)
  └─ deterministic client engine
       ├─ consensus
       ├─ confidence
       ├─ Ghost Score
       └─ replay / scenarios / research
```

## Status semantics

- `LIVE`: read during the request from a verifiable source.
- `CACHED`: real provider data, but the provider does not prove request-time freshness.
- `REJECTED`: real observation that failed a quality threshold.
- `UNAVAILABLE`: source, market, credential or required value is absent.
- `SIMULATED`: versioned fixture used only by the deterministic demo.

## Weak-signal controls

A PancakeSwap V2 pool is accepted only when:

- the pair is returned by the verified factory;
- the pair contains the official xStock BSC address and BSC USDT;
- reserves are readable at an observed BSC block;
- estimated USD liquidity is at least $1,000; and
- estimated price impact for a $100 quote is no more than 2%.

Otherwise the observation is shown as `REJECTED` or `NO VERIFIED MARKET FOUND`. A rejected pool never feeds the LIVE AFTER-HOURS GAP.

## Security and privacy

- `BINANCE_API_KEY` is read only inside the server route.
- No wallet connection, signature or transaction is requested.
- No API secret is serialized to the browser or committed to source.
- External values are rendered as data, never executed as instructions.
