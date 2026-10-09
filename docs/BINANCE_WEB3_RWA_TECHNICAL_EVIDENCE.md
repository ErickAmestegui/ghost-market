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

## Test result before credentials

The deployed Site environment was inspected without revealing secret values. It contained only the existing secret name `BINANCE_API_KEY`. The two Web3 secret names were absent.

Therefore no authenticated Binance Web3 provider request could be truthfully executed during this test. The Ghost Market endpoint returns `UNAVAILABLE / MISSING_CREDENTIALS`, an empty asset list, and performs no upstream request. This is an expected safety state, not a successful integration claim.

Local route verification at 2026-10-09 07:39 (UTC-04:00):

| Symbol | Ghost HTTP | Status | Error | Assets | Upstream requests | Ghost request ID |
| --- | ---: | --- | --- | ---: | ---: | --- |
| AAPL | 200 | UNAVAILABLE | MISSING_CREDENTIALS | 0 | 0 | `ad02a3d6-d80d-47fe-b860-8c89fe8fd124` |
| NVDA | 200 | UNAVAILABLE | MISSING_CREDENTIALS | 0 | 0 | `3912e1ef-1282-44b6-a7b1-d0fc94b67948` |
| TSLA | 200 | UNAVAILABLE | MISSING_CREDENTIALS | 0 | 0 | `166ffcd6-46ac-440f-8a0e-df8370bb2b66` |

Automated test suite: 19 passed, 0 failed. The build completed and exposed `/api/binance-web3-rwa` as a server route.

## Status policy

- `LIVE`: provider request succeeded and a token price timestamp is no older than five minutes.
- `CACHED`: provider returned real data, but the price timestamp is older than five minutes or absent.
- `UNAVAILABLE`: required credentials or an eligible asset are missing.
- `ERROR`: the provider rejected or failed the request.
- `SIMULATED`: never used by this adapter.

The RWA price does not bypass Ghost Market's independent DEX liquidity and price-impact controls.

## Pending verification

After both Web3 secrets are installed and a new Site version is deployed, execute the route for AAPL, NVDA and TSLA. Record each Ghost request ID, provider endpoint, HTTP status, Binance business code, latency, platform, contract, price timestamp and data status. Do not record headers, API Keys, Secret Keys or signatures.
