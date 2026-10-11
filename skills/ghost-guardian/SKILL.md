---
name: ghost-guardian
description: Investigate a bounded hypothetical AAPLon/USDT amount through Ghost Market's public read-only Ghost Guardian endpoint. Use for block-tagged evidence about the single PancakeSwap V2 pool on BNB Smart Chain; do not use for trades, predictions, whole-market routing, or safety claims.
---

# Ghost Guardian

Use the public `POST /api/ghost-guardian` endpoint to inspect one narrowly scoped route. This is a Ghost Market project skill, not an official Binance skill and not evidence of support from Binance, Ondo, PancakeSwap, or any other protocol.

## Invoke

Run from this skill directory with Node.js 20 or newer:

```bash
node scripts/invoke.mjs --amount 6
```

The helper sends exactly:

```json
{ "asset": "AAPLon", "amountUsdt": 6 }
```

It uses no credentials, times out, handles rate limits and HTTP failures, validates the response boundary, and recomputes the canonical receipt SHA-256 before printing JSON. See [references/example-request.json](references/example-request.json) for a copyable request body.

## Interpret the result

Report only the endpoint status:

- `REJECTED`: the evaluated route exceeded the experimental impact threshold.
- `INSUFFICIENT EVIDENCE`: one or more required request-time checks failed.
- `CANDIDATE FOR FURTHER REVIEW`: the evaluated route stayed within the threshold, but this is not approval or a safe-to-trade conclusion.

Preserve the returned block number, block time, observed time, checked route, unchecked items, warnings, receipt, and `receiptHashSha256`. Describe all values as point-in-time observations.

## Hard limits

- Scope is only `AAPLon`/`USDT` on BNB Smart Chain mainnet, chain ID `56`, through the direct factory-verified PancakeSwap V2 pool.
- Accepted hypothetical input is `0.1` through `25` USDT. The request does not move funds.
- Gas, other pools, multi-hop or aggregator routes, transfer taxes or restrictions, and independent reference-price freshness are `NOT CHECKED`.
- The receipt hash is SHA-256 over canonical JSON. It detects changes; it is not a signature, attestation, endorsement, or proof of safety.
- Never infer a trade recommendation, price prediction, whole-market liquidity conclusion, or transaction capability.
- Never request a wallet connection, private key, seed phrase, signature, approval, payment, transfer, or trade for this workflow.
- If the helper fails validation, report the failure and do not substitute cached, simulated, or fixture data as live evidence.
