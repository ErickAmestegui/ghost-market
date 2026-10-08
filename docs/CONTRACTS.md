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
- BSC USDT: `0x55d398326f99059ff775485246999027b3197955`

## Provenance links

- xStocks developer documentation: `https://docs.xstocks.fi/developers`
- xStocks public API: `https://api.xstocks.fi/api/v2/public`
- Issuer/legal documentation: `https://assets.backed.fi/legal-documentation`
- Binance Stocks Trading Market Data: `https://developers.binance.com/en/docs/catalog/advanced-trading-stocks-trading/api/rest-api/market-data`
- PancakeSwap developer documentation: `https://developer.pancakeswap.finance`

## Important distinction

Binance tokenized assets may use Binance asset codes such as `AAPLB`. They are not used to authenticate the xStocks contract. xStocks contract provenance comes from the official xStocks registry and issuer documentation; Binance is used only for its own supported asset/reference metadata when a valid server credential is available.
