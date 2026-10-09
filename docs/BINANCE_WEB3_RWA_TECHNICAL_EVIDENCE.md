# Binance Web3 RWA Data — Technical Evidence

Updated: 2026-10-09 (America/La_Paz)

## Scope

Ghost Market now contains a server-only adapter for the official Binance Web3 RWA Data API. It preserves the existing Binance Stocks Trading, BNB Chain JSON-RPC, xStocks and PancakeSwap integrations. It never creates a transaction.

## Official endpoints implemented

- `GET /build/api/v1/dex/market/rwa/search?keyword={AAPL|NVDA|TSLA}`
- `GET /build/api/v1/dex/market/rwa/price?binanceChainId=56&tokenContractAddresses=...`
- `GET /build/api/v1/dex/market/rwa/underlying-profile?binanceChainId=56&tokenContractAddress=...`
- `GET /build/api/v1/dex/market/rwa/underlying-market?binanceChainId=56&tokenContractAddress=...`

The search result is restricted to BSC (`binanceChainId=56`) and the official `ondo` and `bstock` platform identifiers.

## Authentication implementation

Requests are signed only on the server with HMAC-SHA256 and Base64 encoding. The pre-hash is:

`timestamp + HTTP_METHOD + exact_request_path_including_/build + body`

Required runtime secrets:

- `BINANCE_WEB3_API_KEY`
- `BINANCE_WEB3_SECRET_KEY`

They map to the provider headers `X-OC-APIKEY` and the HMAC input. Neither value is returned to the client or written to logs.

## Verified production diagnostic

The deployed Site environment was inspected without revealing values. `BINANCE_API_KEY`, `BINANCE_WEB3_API_KEY` and `BINANCE_WEB3_SECRET_KEY` are present and marked secret.

At `2026-10-09T17:10:06Z`, a temporary authenticated production diagnostic executed exactly two signed, read-only requests. The route was removed afterward and verified inaccessible.

| Endpoint | HTTP | Business code | Provider message | UTC timestamp | Latency | Provider request ID |
| --- | ---: | ---: | --- | --- | ---: | --- |
| `GET /build/api/v1/dex/market/rwa/platforms` | 200 | `40304` | `Service not available due to compliance restriction` | `2026-10-09T17:10:06.697Z` | 869 ms | not supplied |
| `GET /build/api/v1/dex/market/supported/chain` | 200 | `40304` | `Service not available due to compliance restriction` | `2026-10-09T17:10:06.688Z` | 857 ms | not supplied |

Diagnostic request ID: `f27b5cb7-bdf7-4202-be73-d9ace4248be4`. No credential, signature or authentication header was recorded. Because the same code affected an RWA endpoint and a general Market endpoint, the observed restriction is broader than the RWA module alone. It does not prove that every Binance Web3 product is blocked.

## Status policy

- `LIVE`: provider request succeeded and a token price timestamp is no older than five minutes.
- `CACHED`: provider returned real data, but the price timestamp is older than five minutes or absent.
- `UNAVAILABLE`: required credentials or an eligible asset are missing.
- `ERROR`: the provider rejected or failed the request.
- `SIMULATED`: never used by this adapter.

The RWA price does not bypass Ghost Market's independent DEX liquidity and price-impact controls.

## Pending provider resolution

The current response requires an official Binance resolution or authorization. No VPN, proxy, alternate identity, region change or credential rotation is used to evade the restriction. AAPL, NVDA and TSLA cannot be marked LIVE until the provider returns successful RWA search/price payloads with valid platform, BSC contract and timestamps.
