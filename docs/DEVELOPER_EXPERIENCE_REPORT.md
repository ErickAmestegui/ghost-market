# Developer Experience Report

Report date: 2026-10-08  
Timezone: America/La_Paz (UTC−04:00)  
Integration checkpoint: 2026-10-08T12:34:07-04:00 to 2026-10-08T19:11:41-04:00

This report records only calls, responses and implementation work actually exercised for Ghost Market Beta 0.6. Missing credentials, rejected pools and untested capabilities are stated directly.

## 1. Executive Summary

The attempted pipeline was: official xStock registry → BSC contract proof → executable on-chain market quality → traditional reference/session status → LIVE AFTER-HOURS GAP.

Completed integrations:

- Official xStocks registry, price-data and oracle metadata for AAPLx, NVDAx and TSLAx.
- BNB Smart Chain mainnet reads for chain, block, bytecode and ERC-20 values.
- PancakeSwap V2 pair discovery, reserve reading, spot price, estimated USD liquidity and $100 price-impact gates.
- A server-only Binance Stocks Trading adapter with payload validation and explicit error states.
- A normalized session model: `OPEN`, `CLOSED`, `PRE-MARKET`, `AFTER-HOURS`, `HOLIDAY` or `UNKNOWN`.

Blocked items:

- A successful Binance call is blocked because `BINANCE_API_KEY` is absent from the local and production server environments.
- No audited BSC pool met both ≥$1,000 estimated liquidity and ≤2% estimated price impact for $100, so no live gap is calculated.
- Public GitHub repository and demo video publication require external accounts/URLs not available in this environment.

The wall-clock interval for this integration and verification round was approximately 6 hours 38 minutes. It includes implementation, repeated network probes, documentation work, build/test cycles and waiting; it is not represented as uninterrupted coding time.

## 2. Onboarding

- Work checkpoint started at `2026-10-08T12:34:07-04:00`.
- The first recorded successful live provider probe was `GET /api/v2/public/assets/AAPLx`: HTTP 200 in 4,090 ms. The measured request itself succeeded in 4.09 seconds; no claim is made about a longer account-setup interval because xStocks is public.
- The first Binance paths tested were `tokenized-assets`, `quote?symbol=AAPL` and `exchangeInfo?symbol=AAPL`.
- Binance credentials require a Binance account, an API key permitted to use the documented Stocks Trading `MARKET_DATA` endpoints, and a server-side `BINANCE_API_KEY` deployment secret. The key must never use a public frontend prefix.

Exact confusion points encountered:

1. Binance Stocks Trading uses underlying symbols and Binance asset codes, while xStocks uses symbols such as `AAPLx` and chain-specific deployment addresses. The two identifiers cannot be treated as interchangeable provenance.
2. Binance documents a latest quote as at most approximately five seconds old, but the quote payload has no explicit source timestamp.
3. `exchangeInfo.tradability` is not a normalized traditional-market session status or calendar.
4. A request ID header was not documented consistently for the three market-data endpoints.
5. xStocks collection pagination rejected `pageSize=200`; the observed maximum is 100.

## 3. Documentation Used

### Binance Stocks Trading Market Data

URL: `https://developers.binance.com/en/docs/catalog/advanced-trading-stocks-trading/api/rest-api/market-data`

- Useful: base URL, three endpoint paths, `X-MBX-APIKEY`, symbol parameter, response fields and the approximately five-second quote-age statement.
- Missing: source timestamp in the quote payload, normalized session status, next market open and contract address by chain.
- Unclear: whether provider request IDs are guaranteed in response headers and how asset codes map to third-party tokenized-stock deployments.
- Suggested change: publish a full authenticated example for each endpoint and a single cross-chain asset mapping example.

### Binance REST authentication

URL: `https://developers.binance.com/en/docs/products/spot/rest-api`

- Useful: general API-key security types, headers, timing and error conventions.
- Missing: a Stocks Trading-specific credential walkthrough linked directly from the market-data page.
- Unclear: which account/API-key permissions are required for these newer `MARKET_DATA` routes.
- Suggested change: add a credential checklist and safe server example beside the endpoint catalog.

### xStocks Assets API

URL: `https://docs.xstocks.fi/apis/openapi/assets/get_public_assets_by_symbol`

- Useful: issuer symbol, ISIN, underlying symbol, deployments, wrapper address and trading-period metadata.
- Missing: a response-level observed timestamp and explicit versioning for deployment changes.
- Unclear: canonical hostname, because examples/documentation can refer to both xStocks and Backed domains.
- Suggested change: document one canonical base URL and return `observedAt` plus deployment validity dates.

### xStocks price-data API

URL: `https://docs.xstocks.fi/apis/openapi/assets/get_public_assets_by_symbol_price_data`

- Useful: a simple provider quote for the selected tokenized asset.
- Missing: quote timestamp, bid/ask, venue, source and executable/not-executable flag.
- Unclear: how stale the cached quote can become outside traditional hours.
- Suggested change: return `sourceAsOf`, `observedAt`, `provider`, `bid`, `ask` and `isIndicative`.

### xStocks Oracles API

URL: `https://docs.xstocks.fi/apis/openapi/oracles/get_public_oracles_by_symbol`

- Useful: oracle manager, feed type, feed ID, verifier contract and target network.
- Missing: current value and update timestamp in the same response.
- Unclear: how a pull-based feed should be queried by a frontend-only verifier.
- Suggested change: provide a chain-specific read example from feed discovery through verified value.

### BNB Chain JSON-RPC

URL: `https://docs.bnbchain.org/bnb-smart-chain/developers/json_rpc/json-rpc-endpoint/`

- Useful: BSC mainnet chain ID and public RPC endpoint list.
- Missing: recommended public-endpoint retry budgets and explicit service guarantees.
- Unclear: which endpoints are appropriate for production traffic versus occasional verification.
- Suggested change: publish latency/rate-limit expectations and a documented multi-RPC fallback recipe.

### PancakeSwap V2 contracts

URLs: `https://developer.pancakeswap.finance/contracts/v2/addresses` and `https://developer.pancakeswap.finance`

- Useful: factory/router addresses and V2 contract model.
- Missing: a supported market-discovery endpoint and USD-liquidity/price-impact example for nonstandard tokens.
- Unclear: whether a discovered pool should be considered canonical without additional indexer metadata.
- Suggested change: provide typed examples for `getPair`, reserve normalization and small-quote impact.

## 4. Binance API Experience

Server adapter endpoints and parameters:

| Endpoint | Parameters | Observed unauthenticated result | Measured latency | Request ID |
| --- | --- | --- | ---: | --- |
| `/sapi/v1/equity/market/tokenized-assets` | none | HTTP 400, code `-2014`, `API-key format invalid.` | 1,016 ms | not supplied |
| `/sapi/v1/equity/market/quote` | `symbol=AAPL` | HTTP 400, code `-2014`, `API-key format invalid.` | 550 ms | not supplied |
| `/sapi/v1/equity/market/exchangeInfo` | `symbol=AAPL` | HTTP 400, code `-2014`, `API-key format invalid.` | 566 ms | not supplied |

These direct probes intentionally sent no API key. The product route does not make an upstream call when `BINANCE_API_KEY` is absent; it returns `UNAVAILABLE / MISSING_CREDENTIALS` with a Ghost-generated request ID. No secret was logged or returned.

Implemented and unit-tested classifications are `MISSING_CREDENTIALS`, `INVALID_CREDENTIALS`, `RATE_LIMITED`, `TIMEOUT`, `ASSET_NOT_FOUND`, `EMPTY_RESPONSE` and `PROVIDER_ERROR`. Rate limiting, timeout and empty-body handling have deterministic tests/guards, but were not claimed as live upstream incidents. A successful authenticated payload, upstream request ID and authenticated latency remain unmeasured because no valid credential was available.

Validation refuses `LIVE` when the asset is absent, exchange metadata is absent, the quote symbol differs, bid/ask are invalid, `multiplierValid` is false, or the body is empty. The API documents that an unknown `exchangeInfo` symbol may return an empty array with HTTP 200, so HTTP success alone is not enough.

## 5. xStocks Experience

All rows were observed with HTTP 200 on 2026-10-08. Latencies below are one measured verification pass and may vary.

| Asset | ISIN | Official BSC contract | Registry | Price-data | Oracle |
| --- | --- | --- | ---: | ---: | ---: |
| AAPLx | `CH1436219187` | `0x9d275685dc284c8eb1c79f6aba7a63dc75ec890a` | 1,184 ms | 836 ms | 2,355 ms |
| NVDAx | `CH1436219195` | `0xc845b2894dbddd03858fd2d643b4ef725fe0849d` | 479 ms | 1,065 ms | 815 ms |
| TSLAx | `CH1436219252` | `0x8ad3c73f833d3f9a523ab01476625f269aeb7cf0` | 461 ms | 2,453 ms | 790 ms |

Endpoint patterns:

- Registry: `https://api.xstocks.fi/api/v2/public/assets/{AAPLx|NVDAx|TSLAx}`
- Price: `https://api.xstocks.fi/api/v2/public/assets/{symbol}/price-data`
- Oracle: `https://api.xstocks.fi/api/v2/public/oracles/{symbol}?network=BinanceSmartChain&page=0&pageSize=50`

Observed price payloads were AAPLx `338.515`, NVDAx `235.5315` and TSLAx `373.1275`. Because the price payload is only `{ "quote": number }` and does not include a source timestamp, Ghost Market classifies it as `CACHED`, never request-time `LIVE`.

Issuer/provider validation requires the official Assets response to identify the xStock, return its ISIN and map `network=BinanceSmartChain` to the expected contract. The runtime then independently requires bytecode and a matching on-chain `symbol()` result. A correct symbol alone is not provider provenance.

An asset-list request with `pageSize=200` returned HTTP 400 with `Validation error` and `Number must be less than or equal to 100`; retrying with 100 succeeded.

## 6. BNB Chain RPC Experience

Endpoint exercised: `https://bsc-dataseed.bnbchain.org`, BSC mainnet chain ID 56.

One sequential AAPLx verification pass measured:

| Call | Result | Latency |
| --- | --- | ---: |
| `eth_chainId` | success | 1,061 ms |
| `eth_blockNumber` | success | 505 ms |
| `eth_getCode` | bytecode returned | 1,043 ms |
| `eth_getBlockByNumber` | block/timestamp returned | 500 ms |
| `eth_call symbol()` | success | 544 ms |
| `eth_call decimals()` | success | 736 ms |
| `eth_call totalSupply()` | success | 679 ms |

The application pins related contract/pool reads to the same observed block where practical, because parallel `latest` calls can otherwise cross a block boundary. During development, restricted-network DNS failures occurred before network access was granted; retrying after permission restored the calls. A later NVDAx browser check exposed a 10-second upstream timeout. The final runtime fails over in order across `bsc-dataseed.bnbchain.org`, `bsc-dataseed1.bnbchain.org` and `bsc-dataseed2.bnbchain.org`; optional price/oracle failures no longer erase valid contract proof.

## 7. PancakeSwap Experience

Pair discovery called `getPair(base, quote)` on the PancakeSwap V2 factory `0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73`. For a returned pair, the runtime reads `token0`, `token1` and `getReserves`, then normalizes with each token's `decimals()`. The documented V2 router `0x10ED43C718714eb63d5aA57B78B54704E256024E` was reviewed as the execution contract, but no router quote or transaction was sent because Ghost Market is not a trading app and the pools failed quality controls.

Observed xStock/USDT findings:

- AAPLx: pair `0xee109cc926ce216b3d2490f674300c15131b12b5`; derived total USD liquidity was approximately $0.01. Rejected.
- TSLAx: pair `0xdc5d5068f5af6ee4981ece4f245843430be32a96`; derived total USD liquidity was approximately $9.26. Rejected.
- NVDAx: factory returned no verified V2 USDT pair. Reported as `NO VERIFIED MARKET FOUND`.

The initial AAPLx/TSLAx observation retained normalized price/liquidity outputs, not a separate permanent raw-reserve transcript; this report does not invent missing reserve integers. The reproducible route reads reserves again at the displayed BSC block.

Acceptance requires estimated USD liquidity ≥$1,000 and estimated price impact for a $100 quote ≤2%, using the V2 constant-product formula with the 25 bps pool fee. A V2 reserve pool has no order-book spread, so the UI shows pool fee and reports spread unavailable instead of inventing one.

Additional candidate audit at BSC block `126,528,816`:

- SPYx native/USDC pair `0xa42b9bcf5d40348d04c8ef139e213bc4923f8e8c`: base reserve `0.000000570002090945`, quote reserve `0.00123534836403791`, estimated liquidity `$0.00247069672807582`, and estimated $100 impact `8,094,882.87%`. Rejected.
- SPYx native/USDT and both wrapper pairs: no pair.
- QQQx native/wrapper against USDT/USDC: no pair.

No additional asset was added because none passed the unchanged gates.

## 8. Tokenized-Stock Findings

A deployed token proves contract existence, not a tradable market. An official registry mapping adds issuer provenance, but still does not prove executable liquidity. A near-empty pool can display a mathematically valid spot price while a small order moves it by millions of percent. That risk is more important outside traditional hours, when reference data may be stale and arbitrage routes may be inactive.

The xStocks provider quote is useful context but is not an executable BSC price and has no payload timestamp. Ghost Market therefore keeps provider quote (`CACHED`) separate from pool price (`LIVE` only after quality gates). The after-hours gap is blank whenever session status, fresh reference, accepted pool, freshness or provenance is incomplete.

## 9. AI Stack Feedback

- Wallet Skills: not used.
- Agentic Wallet: not used.
- ERC-8004: not used.
- x402: not used.
- BNB Agent Studio: not used.

No practical-use claim is made for these tools. A future wallet flow would require a real compatible wallet, BSC network validation, allowlisted contracts, a verified route, pre-signature simulation, explicit user confirmation and an audit trail. An agent-runtime claim would additionally require a persistent public runtime, verifiable identity, execution history and documented payment/auth boundaries. Concrete end-to-end reference applications, test identities and sandboxed transaction simulation would have shortened that work.

The current Ghost Brain, Research, Council and scenarios are deterministic functions over versioned fixtures. They are labeled `SIMULATED`; no model output is represented as live evidence.

## 10. API Pitfalls

- Missing Binance credentials: no authenticated success can be verified; the safe output is `MISSING_CREDENTIALS`.
- Real provider data without a timestamp: a current-looking number must remain `CACHED`.
- Correct on-chain `symbol()`: still insufficient to prove issuer ownership without the registry mapping.
- Existing pool with negligible liquidity: address existence must not promote its spot price.
- Minimal reserves: make the displayed spot price manipulable and the $100 impact extreme.
- Parallel `latest` calls: may observe different blocks; pin dependent reads to one block.
- Response latency: observed xStocks calls ranged from 461 ms to 2,453 ms in one pass, with an earlier AAPL registry call at 4,090 ms.
- Asset without pool: NVDAx, QQQx and multiple wrapper/quote combinations returned no V2 pair.
- Pagination: `pageSize=200` failed with HTTP 400; the accepted maximum was 100.

## 11. Redesign Suggestions

1. Provide one authenticated endpoint by ticker and chain returning asset identity, official contract, reference quote, source timestamp, normalized session and next change.
2. Return official addresses for every supported network with validity windows and issuer attestation links.
3. Add `sourceAsOf`, `observedAt`, bid/ask and indicative/executable semantics to reference quotes.
4. Standardize `OPEN`, `CLOSED`, `PRE-MARKET`, `AFTER-HOURS`, `HOLIDAY` and `UNKNOWN` across providers.
5. Include `nextOpenAt`, `nextCloseAt` and exchange timezone.
6. Add supported-pool/liquidity discovery or an official route-quality adapter.
7. Put complete server-side authentication examples beside the Stocks Trading endpoints.
8. Publish a typed TypeScript SDK with runtime schemas.
9. Offer an official sandbox/mock with realistic success, empty, stale, rate-limit and invalid-asset cases.
10. Standardize error bodies and document provider request-ID headers.

## 12. Requested Capabilities

- `GET /tokenized-equities/{symbol}?chainId=56` for canonical identity and chain contract.
- `GET /tokenized-equities/{symbol}/reference` with bid, ask, source timestamp and provider.
- `GET /market-session/{symbol}` with normalized status and next transition.
- `GET /tokenized-equities/{symbol}/markets?chainId=56` with verified pools and quote assets.
- `POST /quote` for a non-executing route simulation returning impact, fee, minimum received and block.
- A webhook or stream for reference/session changes.
- A discovery endpoint that maps Binance asset code, underlying ticker, ISIN and third-party token symbol without implying shared issuer provenance.
- Typed schemas and documented idempotent/request-ID behavior.

## 13. Final Honest Assessment

What works: official xStocks provenance, BSC contract/state proof, oracle metadata discovery, provider-cached quotes, PancakeSwap V2 reserve inspection, strict market-quality rejection, normalized session display, deterministic demo separation and safe Binance error handling.

What does not work yet: authenticated Binance success, a quality-approved xStock pool, a calculable LIVE AFTER-HOURS GAP, wallet/trading, public agent identity, public GitHub publication and video publication.

What was demonstrated: real contracts can be verified while their apparent markets are honestly rejected. The product can distinguish contract existence, provider provenance, cached reference data and executable-market quality without substituting simulated values.

What is not claimed: predictive power, profitable signals, executable liquidity, live Binance data, a connected wallet, autonomous trading or eligibility for agent/wallet prizes.

With more time and owner-provided access, the next steps would be: configure and verify the server-only Binance key, add RPC health telemetry, integrate an approved indexer/router quote for broader venue discovery, publish the reviewed repository, record the four-minute demo, and re-run public/incognito/device QA after public-site authorization.
