# Post-reset implementation plan

Manual handoff for the same Work conversation after the user's quota reset. Do not run this plan in the background or start it without a new user message.

## Protected state and deadline

- Hackathon deadline: **2026-10-11 12:00 UTC / 08:00 Bolivia**.
- Keep the published Sites v24 experience stable. Do not redesign it or redeploy it for documentation, scripts, or skill packaging.
- User-protected baseline: `705531bb8a0cf0ed26ec21c62380735bc2f66e7f`.
- At the immediate-skill handoff on 2026-10-10, remote `main` had advanced by one README-only commit to `65f876403e84b40d3ee5761a8ee717bd98249f07`. Re-fetch and reconcile this explicitly; never reset, force-push, or overwrite it.
- Forms, submitted deliverables, and the demo video are out of scope and must not change.
- Before any publication: run relevant tests, lint, build if application code changed, and a secret scan; confirm the public URL and GitHub describe the same capability.

## Priority order

### P0 — finish and review external skill packaging

Benefit: high. Risk: low. Deadline fit: excellent.

- Review `skills/ghost-guardian` with another real assistant invocation if time permits.
- Keep the public request contract limited to `AAPLon`, `0.1–25` hypothetical USDT, chain `56`, and the single direct PancakeSwap V2 AAPLon/USDT pool.
- Improve install/discovery metadata only if the target agent platform has a verified documented convention. Do not call it an official Binance skill or invent protocol support.
- Preserve timeout, bounded 429 handling, explicit HTTP failures, response-boundary checks, and local SHA-256 receipt verification.

### P1 — evidence-first asset comparator

Benefit: high. Risk: medium. Deadline fit: good if kept read-only and narrow.

- Compare xStocks `AAPLx`, Ondo `AAPLon`, and Binance `AAPLB` as distinct instruments, never interchangeable tickers.
- For each asset, show verified contract, chain, decimals, issuer/provider identity, source URL, observation time, and source-reported quote time when available.
- Compare prices or quotes only when primary/official sources can be verified at request time. Label unavailable or stale fields instead of filling gaps.
- Separate token identity, reference price, executable quote, and on-chain pool evidence. Never imply price parity, redeemability, or common backing without primary evidence.
- Stop before using credentials, accounts, wallet signatures, payments, or funds; request specific authorization if any become necessary.

### P2 — explain why waiting can be rational

Benefit: high. Risk: low. Deadline fit: good.

- Produce a criteria-based explanation, not financial advice or a claim that waiting is safe.
- Use verifiable gates such as market/session state, source freshness, identity consistency, liquidity/impact, route attribution, gas availability, and unresolved transfer restrictions.
- Map missing or contradictory evidence to `INSUFFICIENT EVIDENCE`; map a failed checked route to `REJECTED`; use `CANDIDATE FOR FURTHER REVIEW` only when all checks for that narrow route pass.
- State what new evidence would change the conclusion and timestamp every observation.

### P3 — investigation replay from genuine snapshots

Benefit: medium. Risk: medium. Deadline fit: conditional.

- Replay only immutable historical snapshots that were actually captured with block number, source, observed time, request parameters, and integrity hash.
- Keep fixtures and test doubles clearly labeled as tests; never present them as live or historical market evidence.
- Make replay deterministic and show which conclusions were available from that snapshot alone.
- If no qualifying snapshot exists, show “no replay evidence available” and do not manufacture one.

### P4 — research endpoint for agents

Benefit: medium. Risk: medium. Deadline fit: only after P0–P3 remain stable.

- Treat the current read-only Guardian endpoint as the minimal service contract before adding any broader orchestration.
- Specify request/response schemas, rate limits, timeouts, evidence provenance, idempotency expectations, and error states.
- Keep all agent consumers read-only and require them to preserve unchecked fields and receipt limitations.
- Do not add paid infrastructure, new secrets, or account dependencies for the hackathon unless separately authorized.

### P5 — x402 or identity experiments

Benefit: speculative. Risk: high. Deadline fit: poor; defer by default.

- A mock or local-only x402 demonstration must be labeled a test and must not imply a real payment occurred.
- Before any real x402 payment, paid endpoint, API key, wallet use, signature, ERC-8004 identity, funds movement, or on-chain transaction, stop and obtain explicit action-specific authorization.
- Record cost, recipient, network, exact operation, reversibility, and secret-handling plan before asking for approval.

## Stop conditions

- Stop rather than degrade the stable v24 deployment when remaining time is too short for tests and rollback.
- Stop on unclear licensing; do not copy competitor code without a compatible license. Product patterns may be reimplemented independently.
- Stop on secret exposure, unexplained Git drift, failing tests, unverifiable asset identity, or mismatch between the deployed URL and repository claims.
- Merge to `main` only when the complete branch is validated and can be integrated without force. Otherwise leave the reviewed branch and this handoff for the next manual session.
