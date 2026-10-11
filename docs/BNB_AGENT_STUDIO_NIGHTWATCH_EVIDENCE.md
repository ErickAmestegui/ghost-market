# Ghost Nightwatch — BNB Agent Studio evidence

## Status boundary

- Ghost Guardian HTTP tool: **PUBLIC LIVE** at `POST /api/ghost-guardian`.
- BNB Agent Studio model and tool harness: **LOCAL VERIFIED, NOT PUBLICLY DEPLOYED**.
- Payments, signing, swaps, approvals, transfers and transactions: **NOT IMPLEMENTED / NOT EXECUTED**.
- x402, ERC-8004 and ERC-8183: **NOT CLAIMED**.

The local Studio workspace exposes `ghost_guardian_investigate_route`. Its only input is `amount_usdt` from 0.1 through 25. It sends `{ "asset": "AAPLon", "amountUsdt": 6 }` to the public Guardian endpoint and rejects responses outside the documented status contract, `READ_ONLY` mode, or zero transactions.

## Sanitized reproducible transcript

Run date: 2026-10-11 UTC. Provider/model: Pieverse `auto/free`. Maximum model steps: four.

```text
USER: Investigate tokenized Apple AAPLon on BSC for a hypothetical 6 USDT input.
MODEL TOOL CALLS: 1
TOOL SELECTED: ghost_guardian_investigate_route
PUBLIC INPUT: amount_usdt=6
PUBLIC ENDPOINT: https://ghost-market-beta.lorgiogc.chatgpt.site/api/ghost-guardian
TOOL RESULT: REJECTED
OBSERVED BLOCK: 126933857
TRANSACTIONS: 0
FINAL SCOPE: one factory-verified PancakeSwap V2 AAPLon/USDT route; other routes, gas, transfer restrictions and independent reference-price freshness remained NOT CHECKED.
```

The first two successful model runs did invoke the required tool. Their prose layer also used qualitative language stronger than the raw dossier. That prose is not accepted as public evidence. The harness was therefore tightened to remove provider reasoning tags from the public transcript and fail on advice/safety/loss language. A subsequent retry reached the provider's `Too Many Requests` limit, so the stricter prose gate is **SOURCE IMPLEMENTED, RETEST PENDING**. The tool invocation itself remains directly observed and locally verified.

No `.studio` directory, environment file, wallet store, session, key, address or balance was copied into the repository. The test loads its existing local model configuration without logging values.
