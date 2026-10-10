# Ghost Guardian — Agentic Wallet & BSC Risk Research

Ghost Guardian is a read-only research prototype built for Ghost Market and BNB Hack: Tokenized Stocks Edition.

## What it does

1. Uses Binance Agentic Wallet CLI to request a real USDT/AAPLon swap quote.
2. Uses Binance Tokenized Securities Info to verify Ondo token information and compare prices.
3. Reads BNB Smart Chain mainnet directly to verify the AAPLon contract.
4. Checks the PancakeSwap V2 AAPLon/USDT pool, its reserves and a hypothetical swap.
5. Rejects the evaluated V2 route when its estimated execution deviation exceeds the experimental 5% threshold.

## Reproduction

Requirements:

- Node.js 24
- Binance Agentic Wallet CLI (`@binance/agentic-wallet`)
- a locally connected Agentic Wallet
- internet access to Binance public endpoints and BSC RPC

From this folder:

```bash
node guardian-final.mjs
```

The investigation runs three verification stages and produces a local evidence file.

## Observed results

During testing on October 10, 2026:

- Binance Wallet Skills and Agentic Wallet queries succeeded.
- AAPLon was verified on BSC mainnet, Chain ID 56.
- The PancakeSwap V2 route showed approximately 87.97% estimated deviation for a hypothetical 6 USDT swap.
- The evaluated V2 route was marked `REJECTED_V2_ONLY`.
- No transactions were executed.

These observations are time-dependent and may change.

## Security and limitations

- Read-only operations only.
- No trading, signing, transfers or payments.
- Wallet credentials and sessions are never committed.
- The Binance quote route is unknown and may differ from the evaluated PancakeSwap V2 route.
- The V2 fee assumption is 0.25%.
- Other DEX routes and independent liquidity sources are not fully evaluated.
- Price freshness and gas costs are not independently verified.
- This is a rule-based research prototype, not an autonomous AI agent.
- The experimental command-line prototype is not deployed to the public Ghost Market website.

The generated evidence text file remains local and is excluded from Git.
