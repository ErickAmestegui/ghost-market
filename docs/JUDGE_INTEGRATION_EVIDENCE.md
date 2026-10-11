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

The public URL is <https://ghost-market-beta.lorgiogc.chatgpt.site/>. The deployment commit and Sites version are recorded in each release report; GitHub `main` is kept aligned with the deployed source.

## Evidence matrix

| Integration | Evidence status | What was verified | What is not claimed |
| --- | --- | --- | --- |
| Binance Wallet Skill | Route and UI deployed; identity can be `LIVE`; price remains `CACHED` | The public read-only adapter validates Binance business success, BSC chain ID 56, the Ondo `AAPLon` identity, contract and shares multiplier. A point-in-time local test succeeded for AAPL, NVDA and TSLA. | No wallet connection, signature, transaction, trade or independently fresh price. Provider HTML or other invalid responses become `UNAVAILABLE`. |
| Binance Agentic Wallet CLI | `LOCAL VERIFIED`, `NOT DEPLOYED` | A fresh read-only quote request for 6 USDT to AAPLon returned `0.017807767342594459 AAPLon`; zero transactions. A local risk gate combines the quote status with the public Guardian dossier. | The quote route and gas were not attributed, and no approval, swap, transfer, signature or order was submitted. The quote is not presented as an independently verified executable route. |
| Ghost Guardian | `PUBLIC LIVE` | The public API reads BSC mainnet at request time, verifies one PancakeSwap V2 AAPLon/USDT pair, applies bounded route math and returns a canonical JSON receipt with SHA-256 integrity hash. | Not a whole-market liquidity survey, not a trade recommendation and not proof that every route is unsafe. The hash is not a signature or attestation. |
| BNB Agent Studio / Ghost Analyst | Tool target `PUBLIC LIVE`; model harness `LOCAL VERIFIED`, `NOT DEPLOYED` | Pieverse `auto/free` selected and invoked `ghost_guardian_investigate_route` in a real local run; the tool called the public Guardian API, returned block-tagged evidence and zero transactions. | No public model/agent service. The stricter neutral-prose retest hit provider rate limiting and remains pending. No x402, ERC-8004, ERC-8183 or paid flow is claimed. |

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

The repository's `scripts/ghost-guardian/guardian-crosscheck.mjs` contains the exact public token contracts, validates the JSON response and refuses to treat a failed or inconsistent quote as evidence. The latest observed, anonymized result was `6 USDT -> 0.017807767342594459 AAPLon`; earlier local captures were approximately `0.01778 AAPLon`. All records state zero transactions. Quote output may move between calls and carries no route-attribution proof in this evidence.

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
- the LLM-callable tool `ghost_guardian_investigate_route`, whose bounded implementation calls the public Guardian endpoint read-only;
- response-contract checks requiring an allowed status, `READ_ONLY` and zero transactions.

The local harness observed one real model tool call. The returned dossier was route-scoped and included the public request ID, BSC block, `NOT CHECKED` items and zero transactions. The deterministic public UI remains the authoritative explanation layer; model prose is not silently presented as verified evidence.

The model test was rerun. Two calls successfully selected the public Guardian tool; the harness was then tightened after qualitative wording exceeded the raw dossier. In the final authorized retest on 2026-10-10 (Bolivia time), the existing `auto/free` harness was executed once and Pieverse returned `Too Many Requests` after the runtime's built-in three attempts. No second execution or workaround was attempted. The stricter neutral-prose result remains pending, not passed. The agent was not deployed and no paid route was exercised. See [BNB Agent Studio Nightwatch evidence](BNB_AGENT_STUDIO_NIGHTWATCH_EVIDENCE.md).

## Security and reproducibility controls

- `.env*` is ignored except `.env.example`; examples contain names/placeholders only.
- generated Guardian evidence is ignored by `scripts/ghost-guardian/.gitignore`.
- BNB Agent Studio `.studio/` and `agentcore/.env.local` are excluded in the separate lab.
- no lab directory, wallet store, key, session, QR code, credential or balance record is copied into this repository;
- public documentation contains only contracts, sanitized example outputs, status semantics and file hashes;
- all claims are bounded to the observed source, time and route.

This repository does not claim deployed Agentic Wallet execution, a deployed Ghost Guardian/Analyst agent, x402 payments, ERC-8004 identity or ERC-8183 jobs. Those would require separate implementation, security review and explicit authorization.
