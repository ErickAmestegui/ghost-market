# Binance Wallet Skill — verified technical evidence

## Scope

Ghost Market uses the official `binance-tokenized-securities-info` Skill, version 1.1, from Binance Skills Hub as a read-only evidence source. The integration does not connect a wallet, request a signature, submit transactions or use trading permissions.

Official Skill source: <https://github.com/binance/binance-skills-hub/tree/main/skills/binance-web3/binance-tokenized-securities-info>

## Verified AAPL test

Observed at `2026-10-10T03:15:37Z` through `2026-10-10T03:16:01Z` UTC.

| Check | Verified result |
| --- | --- |
| Symbol list | HTTP 200 · business code `000000` · `success: true` |
| BSC deployment | Chain ID `56` · `AAPLon` · ticker `AAPL` |
| Contract | `0x390a684ef9cade28a7ad0dfa61ab1eb3842618c4` |
| Issuer | `Apple (Ondo)` / Ondo Finance |
| Multiplier | `1.003376073740221058` shares per token |
| Metadata | HTTP 200 · business code `000000` · `success: true` |
| Asset status | HTTP 200 · business code `000000` · `offhours` · `TRADING` |
| Dynamic data | HTTP 200 · business code `000000` · `success: true` |
| Provider request ID | Not supplied in observed response headers |

The observed token price was `337.60093065100347828` USD. Applying the Skill's required formula, `token price ÷ shares multiplier`, produced `336.465` USD per share, matching the returned stock reference at the captured instant. This is a point-in-time test result, not a forecast or a current quote.

## Product treatment

- Identity, issuer, BSC contract and multiplier are accepted as LIVE evidence read during the request.
- Price is labeled CACHED because the provider does not supply a source timestamp.
- Ondo and xStocks remain separate representations with different contracts and issuer provenance.
- Ondo data never replaces the primary xStocks source and does not enter Ghost Consensus without independent DEX liquidity and price-impact evidence.
- The Skill's `volume24h` field is not treated as DEX liquidity; the official Skill states that it represents US stock activity.
- The signed Binance Web3 RWA integration remains separately labeled `COMPLIANCE_RESTRICTED` when it returns business code `40304`.

## Reproduce

1. Start Ghost Market locally.
2. Request `/api/binance-wallet-skill?symbol=AAPL`.
3. Confirm `status: LIVE`, `asset.chainId: "56"`, `asset.ticker: "AAPL"`, and four request proofs with HTTP `200`, business code `000000`, and `success: true`.
4. Open Demo → Pro → Research to inspect the accepted facts, missing evidence and rejection reasons.

The same server route supports `NVDA` and `TSLA`. A verification run after implementation returned business-valid BSC Ondo records for all three tickers.

## Limitations

- Public Binance Wallet endpoints may be subject to regional availability and provider changes.
- No provider source timestamp was returned for price freshness.
- No on-chain Ondo DEX liquidity is inferred from the Skill response.
- This is a read-only information Skill, not proof of Agentic Wallet transaction capability.
