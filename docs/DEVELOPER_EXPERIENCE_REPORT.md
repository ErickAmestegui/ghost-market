# Developer Experience Report — Ghost Market Beta 0.6

Report date: 2026-10-08  
Timezone: America/La_Paz (UTC−04:00)  
Implementation checkpoint: 2026-10-08T12:34:07-04:00

This report records only integrations and observations actually exercised while building this beta. It intentionally records missing credentials and rejected markets instead of manufacturing successful results.

## 1. Binance Stocks Trading Market Data

Official documentation:

`https://developers.binance.com/en/docs/catalog/advanced-trading-stocks-trading/api/rest-api/market-data`

Implemented server-only endpoints:

- `GET https://api.binance.com/sapi/v1/equity/market/tokenized-assets`
- `GET https://api.binance.com/sapi/v1/equity/market/quote?symbol={AAPL|NVDA|TSLA}`
- `GET https://api.binance.com/sapi/v1/equity/market/exchangeInfo?symbol={AAPL|NVDA|TSLA}`

Authentication: `X-MBX-APIKEY` from server environment variable `BINANCE_API_KEY`. No signature is required for these documented `MARKET_DATA` endpoints.

Observed in this deployment: `BINANCE_API_KEY` is not configured. The runtime therefore returns `UNAVAILABLE / MISSING_CREDENTIALS` before making an upstream request. No success payload, request ID or latency has been fabricated.

Handled states: success, missing credential, invalid credential, rate limit, timeout, unsupported asset, empty quote and upstream error.

Friction and suggestions:

- The documentation clearly lists the three endpoints and header requirement.
- A dedicated demo/test credential or sandbox response would make hackathon verification easier.
- `exchangeInfo.tradability` describes whether an asset can be traded, but it is not a complete exchange-session calendar. A first-class `marketStatus`, `currentSession`, `nextOpenAt` and source timestamp would remove ambiguity.
- A response-level request ID should be documented consistently for support and audit trails.

## 2. xStocks public API

Official documentation:

- `https://docs.xstocks.fi/developers`
- `https://docs.xstocks.fi/apis/openapi`

Requests executed on 2026-10-08:

- `GET /api/v2/public/assets/AAPLx` → HTTP 200, 4,090 ms measured locally.
- `GET /api/v2/public/assets/AAPLx/price-data` → HTTP 200, 1,227 ms; payload shape `{ "quote": 338.515 }`.
- `GET /api/v2/public/assets/NVDAx/price-data` → HTTP 200, 901 ms; payload shape `{ "quote": 235.5315 }`.
- `GET /api/v2/public/assets/TSLAx/price-data` → HTTP 200, 550 ms; payload shape `{ "quote": 373.1275 }`.
- `GET /api/v2/public/oracles/{symbol}?network=BinanceSmartChain&page=0&pageSize=50` → HTTP 200 for AAPLx, NVDAx and TSLAx; measured latencies 2,507 ms, 2,907 ms and 1,595 ms respectively.

Useful fields returned by the Assets endpoint: issuer symbol, ISIN, underlying symbol, BSC deployment address, wrapper address, trading-hours mode, current period, open/closed state and next session change.

Useful fields returned by the Oracles endpoint: provider (`Chainlink`), feed type (`PullBased`), feed ID, verifier contract and BSC network.

Friction and suggestions:

- The public API is unusually useful for contract provenance and eliminates hardcoded-address trust.
- `price-data` returns a quote without a source timestamp, age, venue breakdown or explicit source label in the payload. Ghost Market must therefore label it `CACHED`, not `LIVE`.
- Adding `observedAt`, `sourceAsOf`, `session`, `bid`, `ask`, `provider` and `isIndicative` would materially improve market-quality evaluation.
- The documentation and examples alternate between `api.xstocks.fi` and `api.backed.fi`; a canonical-host note would help integrators.

## 3. BNB Chain and PancakeSwap

Network: BNB Smart Chain mainnet, chain ID 56.  
RPC used: `https://bsc-dataseed.bnbchain.org`.  
Methods exercised: `eth_chainId`, `eth_blockNumber`, `eth_getCode`, `eth_getBlockByNumber` and `eth_call`.

Contract checks read bytecode, `symbol()`, `decimals()` and `totalSupply()` at an observed block. The runtime then checks PancakeSwap V2 factory `getPair(xStock, USDT)` and reads pair `token0()`, `token1()` and `getReserves()` when a pair exists.

Observed pool discovery on 2026-10-08:

- AAPLx/USDT pair `0xee109cc926ce216b3d2490f674300c15131b12b5` existed, but measured reserves implied approximately $0.01 total USD liquidity. It is rejected.
- TSLAx/USDT pair `0xdc5d5068f5af6ee4981ece4f245843430be32a96` existed, but measured reserves implied approximately $9.26 total USD liquidity. It is rejected.
- No PancakeSwap V2 NVDAx/USDT pair was returned. The UI reports `NO VERIFIED MARKET FOUND`.

The pool price is only an observation. It is never accepted when estimated liquidity is under $1,000 or estimated $100 price impact is over 2%. The PancakeSwap V2 pool fee is shown separately from spread because V2 reserves do not expose an order-book spread.

## 4. Wallet, agent and CLI experience

- Wallet: not implemented. The beta does not request connection, signature or transaction.
- Agent identity / ERC-8004: not implemented and not claimed.
- AI: deterministic research, questions, Council and scenarios use versioned evidence fixtures. No model-generated answer is presented as autonomous or live.
- CLI/deployment: build, tests, source publication and Sites deployment are automated locally. No secret is written to repository files.

## 5. Product decision

The most important integration finding is that a real token contract is not sufficient evidence of a usable market. The live interface therefore treats contract provenance, market/reference data and DEX quality as separate gates. At the time of this report, the verified BSC contracts are real, while the discovered V2 liquidity is too weak to support a credible after-hours gap. The correct output is `INCOMPLETE EVIDENCE`, not a synthetic number.
