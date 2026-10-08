# Contracts and provenance

- AAPLx: `0x9d275685dc284c8eb1c79f6aba7a63dc75ec890a`
- NVDAx: `0xc845b2894dbddd03858fd2d643b4ef725fe0849d`
- TSLAx: `0x8ad3c73f833d3f9a523ab01476625f269aeb7cf0`
- BNB Smart Chain mainnet, chain ID 56.
- PancakeSwap V2 factory: `0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73`.
- PancakeSwap V2 router: `0x10ED43C718714eb63d5aA57B78B54704E256024E`.
- BSC USDT: `0x55d398326f99059ff775485246999027b3197955`.
- BSC USDC: `0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d`.

Every request verifies the xStocks official registry address, BSC bytecode and on-chain `symbol()` before claiming contract provenance.

Official sources: `https://docs.xstocks.fi/developers`, `https://assets.backed.fi/legal-documentation`, `https://developers.binance.com/en/docs/catalog/advanced-trading-stocks-trading/api/rest-api/market-data`.

## Candidates not added

At BSC block `126,528,816`, the only audited SPYx/USDC V2 pair had approximately `$0.00247` liquidity and `8,094,882.87%` estimated impact for $100. QQQx native/wrapper checks against USDT/USDC returned no pair. Neither passed the unchanged ≥$1,000 and ≤2% gates.
