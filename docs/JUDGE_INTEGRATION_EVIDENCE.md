# Judge integration evidence

This dossier separates public runtime behavior from point-in-time local research. It documents the smallest reproducible, non-sensitive evidence set for the Binance Wallet Skill, Binance Agentic Wallet CLI, Ghost Guardian and BNB Agent Studio work completed for Ghost Market.

## Evidence labels

| Label | Meaning in this document |
| --- | --- |
| `LIVE` | Read during a request from a verifiable source. |
| `CACHED` | Real provider data without a provider timestamp proving request-time freshness. |
| `SIMULATED` | Versioned deterministic fixture, never presented as live evidence. |
| `LOCAL VERIFIED` | Reproduced in a private local lab. It does not prove public runtime behavior. |
| `NOT DEPLOYED` | Not running on the public Ghost Market Site. |

The public Golden Edition was built from commit `d7669e25a2e9927d9e0d449fa374d5f2497cad62` and published as Sites version 19. Later documentation-only commits do not change that application behavior. The public URL is <https://ghost-market-beta.lorgiogc.chatgpt.site/>.

## Evidence matrix

| Integration | Evidence status | What was verified | What is not claimed |
| --- | --- | --- | --- |
| Binance Wallet Skill | Route and UI deployed; identity can be `LIVE`; price remains `CACHED` | The public read-only adapter validates Binance business success, BSC chain ID 56, the Ondo `AAPLon` identity, contract and shares multiplier. A point-in-time local test succeeded for AAPL, NVDA and TSLA. | No wallet connection, signature, transaction, trade or independently fresh price. Provider HTML or other invalid responses become `UNAVAILABLE`. |
| Binance Agentic Wallet CLI | `LOCAL VERIFIED`, `NOT DEPLOYED` | A read-only quote request for 6 USDT to AAPLon returned about 0.01778 AAPLon. The captured run recorded `ACTION: NO TRADE` and zero transactions. | The quote route was not independently identified, and no approval, swap, transfer, signature or order was submitted. |
| Ghost Guardian | `LOCAL VERIFIED`, `NOT DEPLOYED` | The scripts cross-checked the Binance quote and Wallet Skill identity, read BSC mainnet, inspected one specific PancakeSwap V2 AAPLon/USDT pool and rejected the hypothetical 6 USDT route at about 87.97% deviation from pool spot. | Not an autonomous agent, not a whole-market liquidity survey, not a trade recommendation and not proof that every route is unsafe. |
| BNB Agent Studio / Ghost Analyst | `LOCAL VERIFIED`, `NOT DEPLOYED` | A local Studio workspace configured Pieverse `auto/free`; its bounded test requires the model to call the read-only `ghost_aaplon_research` tool before making AAPLon claims. The tool reports Wallet Skill and one-pool BSC evidence, missing checks, `NO_TRADE` and zero transactions. | No public agent endpoint or deployment. No claim that x402, ERC-8004 or ERC-8183 was exercised or completed for Ghost Market. No paid flow was tested. |

## 1. Binance Wallet Skill

The deployed server route is `app/api/binance-wallet-skill/route.ts`. Validation lives in `lib/binance-wallet-skill-validation.ts`, and the detailed point-in-time result is recorded in [BINANCE_WALLET_SKILL_EVIDENCE.md](BINANCE_WALLET_SKILL_EVIDENCE.md).

Freshness policy is intentionally conservative:

- identity, issuer, contract and multiplier may be `LIVE` when read and validated during the request;
- token price is `CACHED` because the observed provider payload had no source timestamp;
- non-JSON, malformed, inconsistent or failed provider responses are `UNAVAILABLE`;
- Ondo AAPLon and xStocks AAPLx remain distinct assets and contracts.

Manual reproduction requires no wallet credential: run Ghost Market locally, request `/api/binance-wallet-skill?symbol=AAPL`, and inspect the status and request-proof fields. Public-provider availability is time- and region-dependent.

## 2. Binance Agentic Wallet CLI

The local lab used the CLI quote operation only:

```text
baw market-order quote --fromTokenQty 6 --fromToken <USDT contract> --toToken <AAPLon contract> --binanceChainId 56 --slippage 1 --json
```

The repository's `scripts/ghost-guardian/guardian-crosscheck.mjs` contains the exact public token contracts, validates the JSON response and refuses to treat a failed or inconsistent quote as evidence. The observed, anonymized result was approximately `6 USDT -> 0.01778 AAPLon`; a second local capture differed by less than 0.02% in output. Both records state zero transactions.

The local evidence files are deliberately not committed because adjacent wallet state and sessions must remain private. Their SHA-256 fingerprints at review time were:

- `guardian-aapl-evidence.txt`: `9895D3844669B6A56E0897D5F49B37FCA291BBA3605234EED881F3F2EB8A9938`
- `guardian-binance-proof.txt`: `D4115FC75442A1A41B2F72C77AAD063FEE6762614DAF2BD2454E44C4373D34D4`

These hashes are chain-of-custody aids, not substitutes for public evidence. Reproduction requires a separately installed and locally connected Agentic Wallet; do not share `.env`, wallet directories, sessions, QR codes, addresses, balances or key material.

## 3. Ghost Guardian

The auditable source is under [`scripts/ghost-guardian`](../scripts/ghost-guardian/README.md). `guardian-final.mjs` orchestrates three read-only stages:

1. validate Wallet Skill identity and the Agentic Wallet quote;
2. verify AAPLon directly on BSC mainnet;
3. read one PancakeSwap V2 AAPLon/USDT pair, estimate a hypothetical constant-product swap with the documented fee assumption, and compare output with pool spot.

The captured run checked BSC block `126777620`. It found the selected pair, estimated about `0.0019793887 AAPLon` output for 6 USDT and calculated about `87.97%` deviation. The experimental 5% rule therefore returned `REJECTED_V2_ONLY`. This is intentionally narrower than a claim about all DEXs or all routes.

The local aggregate evidence file had SHA-256 `5FA9D66C194777B3C39AF75AF38F5397D55EEE7F705475B8A2B49012E9829F21`. It remains ignored by Git. To reproduce, install Node.js and the Agentic Wallet CLI, connect a local wallet without exporting its secrets, then run `node guardian-final.mjs` from the script directory. The command performs reads and a quote; it contains no transaction submission step.

## 4. BNB Agent Studio / Ghost Analyst

The separate local workspace was scaffolded with BNB Agent Studio and configured with:

- provider `pieverse-llm`;
- model `auto/free`;
- a bounded local test with at most four model steps;
- the LLM-callable tool `ghost_aaplon_research`, whose implementation is read-only;
- explicit `NO_TRADE` and `transactionsExecuted: 0` results.

The tool combines Wallet Skill research with the same narrowly scoped PancakeSwap V2 reserve analysis. Its result marks the source timestamp as unverified, other DEX routes as not checked, the Agentic Wallet route as unknown, and gas/full execution simulation as absent. The local harness checks that the model actually invoked the research tool before accepting the run.

Only source/configuration and prior local-test evidence were inspected for this documentation pass. The test was not rerun because it would call an external model and was unnecessary to document the existing result. The agent was not deployed, no paid route was exercised, and no public endpoint is claimed.

## Security and reproducibility controls

- `.env*` is ignored except `.env.example`; examples contain names/placeholders only.
- generated Guardian evidence is ignored by `scripts/ghost-guardian/.gitignore`.
- BNB Agent Studio `.studio/` and `agentcore/.env.local` are excluded in the separate lab.
- no lab directory, wallet store, key, session, QR code, credential or balance record is copied into this repository;
- public documentation contains only contracts, sanitized example outputs, status semantics and file hashes;
- all claims are bounded to the observed source, time and route.

This repository does not claim deployed Agentic Wallet execution, a deployed Ghost Guardian/Analyst agent, x402 payments, ERC-8004 identity or ERC-8183 jobs. Those would require separate implementation, security review and explicit authorization.
