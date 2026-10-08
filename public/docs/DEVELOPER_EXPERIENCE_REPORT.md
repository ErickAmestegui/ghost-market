# Developer Experience Report

Date: 2026-10-08

Timezone: America/La_Paz (UTC−04:00)

Checkpoint: 12:34:07 to 19:11:41

This report contains only calls and observations exercised for Ghost Market Beta 0.6. It does not manufacture successful credentials, markets or agent capabilities.

## 1. Executive Summary

The target pipeline was official xStock registry → BSC contract proof → executable on-chain market → traditional reference/session → LIVE AFTER-HOURS GAP. xStocks, BSC RPC, PancakeSwap inspection, session normalization and a server-only Binance adapter were completed. Authenticated Binance success is blocked by the absent server secret; no audited pool passed the quality gates. The round covered approximately 6 hours 38 minutes of wall-clock implementation, waiting and QA, not uninterrupted coding time.

## 2. Onboarding

The checkpoint began at `2026-10-08T12:34:07-04:00`. The first recorded live provider probe, `GET /api/v2/public/assets/AAPLx`, returned HTTP 200 in 4,090 ms. Binance requires an account/API key with access to the documented Stocks Trading `MARKET_DATA` routes, configured only as server secret `BINANCE_API_KEY`. Confusion centered on Binance asset codes versus xStocks chain deployments, quote freshness without a payload timestamp, and `tradability` not being a session calendar.

## 3. Documentation Used

- Binance market data: `https://developers.binance.com/en/docs/catalog/advanced-trading-stocks-trading/api/rest-api/market-data` — useful paths/header/schema; missing chain address, quote timestamp, normalized status and next open.
- Binance authentication: `https://developers.binance.com/en/docs/products/spot/rest-api` — useful security conventions; missing a Stocks Trading-specific permission walkthrough.
- xStocks Assets: `https://docs.xstocks.fi/apis/openapi/assets/get_public_assets_by_symbol` — useful ISIN/deployments/trading period; missing response timestamp and deployment-version guidance.
- xStocks price-data: `https://docs.xstocks.fi/apis/openapi/assets/get_public_assets_by_symbol_price_data` — useful quote; missing source time, bid/ask, venue and executable semantics.
- xStocks Oracles: `https://docs.xstocks.fi/apis/openapi/oracles/get_public_oracles_by_symbol` — useful provider/feed metadata; missing value/update time in the same response.
- BNB RPC: `https://docs.bnbchain.org/bnb-smart-chain/developers/json_rpc/json-rpc-endpoint/` — useful chain/endpoints; missing public-endpoint rate and retry guarantees.
- PancakeSwap V2: `https://developer.pancakeswap.finance/contracts/v2/addresses` — useful factory/router addresses; missing a typed nonstandard-token market-quality example.

Each provider would benefit from typed examples, explicit timestamps, normalized statuses and consistent request IDs.

## 4. Binance API Experience

Unauthenticated probes intentionally sent no key:

| Endpoint | Parameters | Result | Latency | Request ID |
| --- | --- | --- | ---: | --- |
| `tokenized-assets` | none | HTTP 400, `-2014`, API-key format invalid | 1,016 ms | none |
| `quote` | `symbol=AAPL` | HTTP 400, `-2014`, API-key format invalid | 550 ms | none |
| `exchangeInfo` | `symbol=AAPL` | HTTP 400, `-2014`, API-key format invalid | 566 ms | none |

The product returns `MISSING_CREDENTIALS` before an upstream request when the secret is absent. Implemented states are `MISSING_CREDENTIALS`, `INVALID_CREDENTIALS`, `RATE_LIMITED`, `TIMEOUT`, `ASSET_NOT_FOUND`, `EMPTY_RESPONSE` and `PROVIDER_ERROR`. Fault states are unit-tested, but no authenticated success, rate-limit incident or provider request ID is claimed without a credential.

## 5. xStocks Experience

All calls below returned HTTP 200 on one verification pass:

| Asset | ISIN | BSC contract | Registry | Price | Oracle |
| --- | --- | --- | ---: | ---: | ---: |
| AAPLx | `CH1436219187` | `0x9d275685dc284c8eb1c79f6aba7a63dc75ec890a` | 1,184 ms | 836 ms | 2,355 ms |
| NVDAx | `CH1436219195` | `0xc845b2894dbddd03858fd2d643b4ef725fe0849d` | 479 ms | 1,065 ms | 815 ms |
| TSLAx | `CH1436219252` | `0x8ad3c73f833d3f9a523ab01476625f269aeb7cf0` | 461 ms | 2,453 ms | 790 ms |

Patterns: `/public/assets/{symbol}`, `/public/assets/{symbol}/price-data`, and `/public/oracles/{symbol}?network=BinanceSmartChain&page=0&pageSize=50`. Observed quotes were 338.515, 235.5315 and 373.1275. Because price-data includes no source timestamp, it is `CACHED`. Provider proof requires official registry address/ISIN plus independent BSC bytecode and `symbol()`. `pageSize=200` returned HTTP 400; 100 succeeded.

## 6. BNB Chain RPC Experience

The primary endpoint was `https://bsc-dataseed.bnbchain.org`, chain ID 56. One sequential AAPLx pass measured: `eth_chainId` 1,061 ms; `eth_blockNumber` 505 ms; `eth_getCode` 1,043 ms; `eth_getBlockByNumber` 500 ms; `eth_call symbol()` 544 ms; `decimals()` 736 ms; `totalSupply()` 679 ms. Restricted-network DNS failed before permission was granted, and a later NVDAx browser probe exposed an upstream timeout. Dependent reads are pinned to one block. The final runtime fails over to `bsc-dataseed1.bnbchain.org` and `bsc-dataseed2.bnbchain.org`; optional price/oracle failures degrade independently.

## 7. PancakeSwap Experience

The V2 factory `0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73` discovered pairs; the documented router `0x10ED43C718714eb63d5aA57B78B54704E256024E` was reviewed but not called because no trade is offered. AAPLx/USDT pair `0xee109cc926ce216b3d2490f674300c15131b12b5` had approximately $0.01 derived liquidity. TSLAx/USDT pair `0xdc5d5068f5af6ee4981ece4f245843430be32a96` had approximately $9.26. Both were rejected. NVDAx returned no V2 USDT pair.

Acceptance remains ≥$1,000 liquidity and ≤2% estimated impact for $100. At BSC block `126,528,816`, SPYx/USDC pair `0xa42b9bcf5d40348d04c8ef139e213bc4923f8e8c` had base reserve `0.000000570002090945`, quote reserve `0.00123534836403791`, liquidity `$0.00247069672807582` and impact `8,094,882.87%`; rejected. QQQx native/wrapper checks against USDT/USDC returned no pair. No asset was added.

## 8. Tokenized-Stock Findings

Contract existence is not issuer proof, and issuer proof is not executable liquidity. Near-empty pools can display valid but manipulable spot prices. Provider quote is context, not an executable BSC price, and its missing timestamp prevents a live-freshness claim. Ghost Market leaves the gap blank when any session, reference, pool, freshness or provenance gate is incomplete.

## 9. AI Stack Feedback

Wallet Skills, Agentic Wallet, ERC-8004, x402 and Agent Studio were not used. Implementing them would require a real wallet, network checks, allowlists, route simulation, human confirmation, audit history and—where claimed—a persistent public runtime and verifiable identity. Deterministic Brain/Research/Council/scenario outputs remain `SIMULATED`; no practical agent-tool experience is claimed.

## 10. API Pitfalls

Observed pitfalls: absent credentials; real quotes without timestamp; matching symbol without issuer proof; pools with useless liquidity; spot manipulation from minimal reserves; block drift across parallel `latest` calls; provider latency up to 4,090 ms; collection pagination limits; and assets with no pair.

## 11. Redesign Suggestions

Provide a unified ticker/chain endpoint; official addresses per chain; timestamped bid/ask references; normalized session/next-open fields; verified pool discovery; complete authentication examples; a typed SDK; an official sandbox/mock; and consistent errors/request IDs.

## 12. Requested Capabilities

Requested APIs: canonical asset by ticker/chain; timestamped reference quote; normalized market-session calendar; verified on-chain markets; non-executing route simulation with impact/fee/block; update stream; and a mapping among Binance asset code, ticker, ISIN and third-party token symbol without implying common provenance.

## 13. Final Honest Assessment

Working: xStocks provenance, BSC contract proof, oracle metadata, cached references, V2 reserve inspection, quality rejection, normalized sessions and deterministic demo separation. Not working: authenticated Binance success, an accepted xStock pool, a live gap, wallet/trading, agent identity, public repository and video. Demonstrated: real evidence can be verified and weak evidence rejected. Not claimed: prediction, profit, executable liquidity, live Binance data or autonomous trading. Next: owner-configured Binance secret, RPC fallback, broader verified venue discovery, public repo/video publication and authorized anonymous-access QA.
