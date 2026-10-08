# Developer Experience Report — 2026-10-08

Actual requests returned HTTP 200 from the xStocks public Assets, price-data and Oracles endpoints for AAPLx, NVDAx and TSLAx. Measured local price-data latencies were 1,227 ms, 901 ms and 550 ms. The payload returns a quote without a source timestamp, so Ghost Market labels it CACHED.

Binance `tokenized-assets`, `quote` and `exchangeInfo` are implemented behind server-only `BINANCE_API_KEY`. The deployment has no key, so it returns UNAVAILABLE / MISSING_CREDENTIALS and no success result is claimed.

BNB RPC and PancakeSwap V2 reads found AAPLx/USDT and TSLAx/USDT pairs, but approximate total liquidity was only $0.01 and $9.26. Both are rejected. No NVDAx/USDT V2 pair was found.

Wallet, transactions, Wallet Skill, ERC-8004 and persistent agents are not implemented. Deterministic research/Council/scenarios are clearly simulated.

Full source report is maintained in `docs/DEVELOPER_EXPERIENCE_REPORT.md`.
