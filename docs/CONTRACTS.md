# Verified contracts and sources

## xStocks on BNB Smart Chain

| Asset | Token | BSC address | Official registry | Explorer |
| --- | --- | --- | --- | --- |
| Apple | AAPLx | `0x9d275685dc284c8eb1c79f6aba7a63dc75ec890a` | `https://api.xstocks.fi/api/v2/public/assets/AAPLx` | `https://bscscan.com/token/0x9d275685dc284c8eb1c79f6aba7a63dc75ec890a` |
| NVIDIA | NVDAx | `0xc845b2894dbddd03858fd2d643b4ef725fe0849d` | `https://api.xstocks.fi/api/v2/public/assets/NVDAx` | `https://bscscan.com/token/0xc845b2894dbddd03858fd2d643b4ef725fe0849d` |
| Tesla | TSLAx | `0x8ad3c73f833d3f9a523ab01476625f269aeb7cf0` | `https://api.xstocks.fi/api/v2/public/assets/TSLAx` | `https://bscscan.com/token/0x8ad3c73f833d3f9a523ab01476625f269aeb7cf0` |

The runtime does not trust this table by itself. It independently requires the official xStocks Assets API to return the same address for `network=BinanceSmartChain`, then reads bytecode and `symbol()` from BNB Chain.

## Infrastructure

- Network: BNB Smart Chain mainnet
- Chain ID: `56`
- BNB public RPC: `https://bsc-dataseed.bnbchain.org`
- BscScan: `https://bscscan.com`
- PancakeSwap V2 factory: `0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73`
- PancakeSwap V2 router: `0x10ED43C718714eb63d5aA57B78B54704E256024E`
- BSC USDT: `0x55d398326f99059ff775485246999027b3197955`
- BSC USDC: `0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d`

## Provenance links

- xStocks developer documentation: `https://docs.xstocks.fi/developers`
- xStocks public API: `https://api.xstocks.fi/api/v2/public`
- Issuer/legal documentation: `https://assets.backed.fi/legal-documentation`
- Binance Stocks Trading Market Data: `https://developers.binance.com/en/docs/catalog/advanced-trading-stocks-trading/api/rest-api/market-data`
- PancakeSwap developer documentation: `https://developer.pancakeswap.finance`

## Important distinction

Binance tokenized assets may use Binance asset codes such as `AAPLB`. They are not used to authenticate the xStocks contract. xStocks contract provenance comes from the official xStocks registry and issuer documentation; Binance is used only for its own supported asset/reference metadata when a valid server credential is available.

## Audited candidates not added

The reproducible audit script `scripts/audit-candidate-markets.mjs` inspected official native and wrapper BSC deployments against PancakeSwap V2 USDT and USDC at block `126,528,816`.

- SPYx official BSC contract: `0x90a2a4c76b5d8c0bc892a69ea28aa775a8f2dd48`.
- SPYx/USDC pair: `0xa42b9bcf5d40348d04c8ef139e213bc4923f8e8c`; estimated liquidity `$0.00247069672807582`; estimated $100 impact `8,094,882.87%`. Rejected.
- QQQx official BSC contract: `0xa753a7395cae905cd615da0b82a53e0560f250af`.
- QQQx native/wrapper checks against USDT/USDC returned no V2 pair.

Neither asset passed the unchanged ≥$1,000 liquidity and ≤2% impact requirements, so neither is exposed as a supported product asset.
