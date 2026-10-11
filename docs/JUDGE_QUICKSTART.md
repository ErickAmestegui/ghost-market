# Ghost Market — Judge Quickstart (under 3 minutes)

**Value in one line:** Ghost Market is evidence-first market intelligence—an AI-assisted workflow that does not invent routes or trades when evidence is missing.

Public product: <https://ghost-market-beta.lorgiogc.chatgpt.site/>  
Video demo: <https://www.youtube.com/watch?v=puRMv_Wu2WA>

## 0:00–0:40 — Verify the evidence boundary

1. Open the [public Ghost Market Beta 0.9](https://ghost-market-beta.lorgiogc.chatgpt.site/).
2. In **Live Evidence**, inspect the badges and source links.
3. Read `LIVE` as request-time evidence and `CACHED` as real provider data without enough source-time proof. `SIMULATED` sections are deterministic demos and are never presented as live market evidence.

## 0:40–1:10 — Check the read-only wallet lens

1. Open **Wallet Lens**.
2. Either connect an EIP-1193 BSC wallet voluntarily or paste any valid BSC public address under **Investigate without a wallet**. The address may have a zero balance; no funds are required.
3. Confirm the visible boundary: public account/balance reads only—no signature, token approval, seed phrase or transaction. A connected account proves only that the wallet exposed a public address; it does not prove that a market is safe.

## 1:10–1:35 — Follow attributed context

1. Open **Social Pulse** and select an asset.
2. Follow an accepted official-news item back to the issuer source, or observe the explicit `UNAVAILABLE` state when no stable feed exists.
3. Confirm that issuer news and external social links are attributed context only: they do not change Ghost Score and do not replace contract, liquidity or execution evidence.

## 1:35–2:30 — Reproduce the Guardian decision

1. Return to **Live Evidence** and find **Ghost Guardian 2.0**.
2. Keep `AAPLon` selected, enter `6` USDT and click **Investigate Route**.
3. Inspect the block-tagged dossier. The expected route-scoped result is `REJECTED` for the factory-verified PancakeSwap V2 AAPLon/USDT pool because the observed liquidity and estimated impact fail the experimental controls. The exact block and values are request-time observations and may change.
4. Confirm the limits remain visible: other routes, Agentic Wallet route attribution, gas, transfer restrictions/taxes and independent reference-price freshness are `NOT CHECKED` where evidence is absent.
5. Download the **Ghost Investigation Receipt** JSON or use **Print receipt**. Its canonical SHA-256 is reproducible from the receipt content and detects changes; it is not a signature, certification or safe-to-trade claim.

## 2:30–3:00 — Inspect integration evidence

- [Judge integration evidence](JUDGE_INTEGRATION_EVIDENCE.md): sanitized, reproducible records for the Binance Wallet Skill, local Binance Agentic Wallet quote/risk gate, public Guardian and local Agent Studio harness.
- [BNB Agent Studio Nightwatch evidence](BNB_AGENT_STUDIO_NIGHTWATCH_EVIDENCE.md): a real Pieverse `auto/free` model → `ghost_guardian_investigate_route` tool → public Guardian endpoint → BSC run. **Exact boundary: `LOCAL VERIFIED / NOT PUBLICLY DEPLOYED`.** The final neutral-prose retest remained `PENDING` after Pieverse returned `Too Many Requests`; it is not claimed as passed.
- [Guardian source and reproduction guide](../scripts/ghost-guardian/README.md), [desktop capture](screenshots/ghost-market-desktop.png), [mobile capture](screenshots/ghost-market-mobile.png) and [video frame](screenshots/ghost-market-video-frame.png).
- [Official video demo](https://www.youtube.com/watch?v=puRMv_Wu2WA). The Developer Experience Report and final submission form were delivered privately; no public URL is claimed for them.

## Claim boundary

Ghost Market does not claim that the Agent Studio harness is public, that the Binance Agentic Wallet quote disclosed its route or gas, or that any asset or route is safe to trade. The public product performs read-only evidence checks. The local integrations executed zero signatures, approvals, transfers and transactions. Ghost Brain, Council and Score remain `SIMULATED`; x402, ERC-8004, ERC-8183 and autonomous persistence are not claimed.

---

**Resumen ES:** Abrí la beta, distinguí `LIVE` de `CACHED`, probá Wallet Lens sin fondos, revisá fuentes atribuidas en Social Pulse y ejecutá Guardian con 6 USDT para obtener un expediente limitado a un único pool, un recibo JSON y su SHA-256. Agent Studio y Agentic Wallet son evidencia local verificable, no agentes públicos ni ejecución de trades.
