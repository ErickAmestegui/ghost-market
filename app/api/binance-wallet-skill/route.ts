import { NextRequest, NextResponse } from "next/server";
import type { BinanceWalletSkillEvidence, WalletSkillRequestProof } from "@/data/binance-wallet-skill";
import type { SymbolKey } from "@/data/types";
import { isSuccessfulWalletSkillPayload, normalizeOndoTokenPrice, percentDifference, selectOndoBscAsset, type WalletSkillListItem } from "@/lib/binance-wallet-skill-validation";

const BASE = "https://www.binance.com";
const DOCS = "https://github.com/binance/binance-skills-hub/blob/main/skills/binance-web3/binance-tokenized-securities-info/SKILL.md";
const SYMBOLS = new Set<SymbolKey>(["AAPL", "NVDA", "TSLA"]);
const HEADERS = { "Accept-Encoding": "identity", "User-Agent": "binance-web3/1.1 (Skill)" };

type ProviderPayload<T> = { code?: string; success?: boolean; data?: T; message?: string; msg?: string };

async function providerGet<T>(name: WalletSkillRequestProof["name"], path: string) {
  const observedAt = new Date().toISOString();
  const started = performance.now();
  const response = await fetch(`${BASE}${path}`, { headers: HEADERS, cache: "no-store", signal: AbortSignal.timeout(8_000) });
  const raw = await response.text();
  let payload: ProviderPayload<T>;
  try {
    payload = JSON.parse(raw) as ProviderPayload<T>;
  } catch {
    const contentType = response.headers.get("content-type")?.split(";")[0] ?? "unknown";
    const proof: WalletSkillRequestProof = {
      name,
      endpoint: `${BASE}${path}`,
      statusCode: response.status,
      businessCode: null,
      success: false,
      latencyMs: Math.round(performance.now() - started),
      observedAt,
      providerRequestId: response.headers.get("x-trace-id") ?? response.headers.get("x-request-id") ?? response.headers.get("cf-ray"),
    };
    throw Object.assign(new Error(`Binance Wallet Skill provider returned a non-JSON response (HTTP ${response.status}; content-type ${contentType}).`), { proof });
  }
  const proof: WalletSkillRequestProof = {
    name,
    endpoint: `${BASE}${path}`,
    statusCode: response.status,
    businessCode: payload.code ?? null,
    success: isSuccessfulWalletSkillPayload(payload),
    latencyMs: Math.round(performance.now() - started),
    observedAt,
    providerRequestId: response.headers.get("x-trace-id") ?? response.headers.get("x-request-id") ?? response.headers.get("cf-ray"),
  };
  if (!response.ok || !proof.success) throw Object.assign(new Error(payload.message ?? payload.msg ?? `Binance Wallet Skill provider returned HTTP ${response.status}`), { proof });
  return { data: payload.data as T, proof };
}

function unavailable(symbol: string, observedAt: string, requestId: string, requests: WalletSkillRequestProof[], kind: NonNullable<BinanceWalletSkillEvidence["error"]>["kind"], message: string): BinanceWalletSkillEvidence {
  return { status: "UNAVAILABLE", module: "Binance Wallet Skill · Tokenized Securities Info", provider: "Binance Skills Hub / Binance Web3 Wallet", skillVersion: "1.1", symbol, documentationUrl: DOCS, observedAt, latencyMs: null, requestId, requests, asset: null, assessment: { verdict: "UNAVAILABLE", accepted: [], missing: ["A business-valid Ondo response for the requested BSC ticker"], risks: ["No conclusion is promoted when provider validation fails"] }, error: { kind, message } };
}

export async function GET(request: NextRequest) {
  const observedAt = new Date().toISOString();
  const requestId = crypto.randomUUID();
  const symbol = (request.nextUrl.searchParams.get("symbol") ?? "AAPL").toUpperCase();
  const proofs: WalletSkillRequestProof[] = [];
  if (!SYMBOLS.has(symbol as SymbolKey)) return NextResponse.json(unavailable(symbol, observedAt, requestId, proofs, "ASSET_NOT_FOUND", "Only AAPL, NVDA and TSLA are supported by this beta."), { status: 400 });
  const started = performance.now();
  try {
    const list = await providerGet<WalletSkillListItem[]>("symbol-list", "/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/rwa/stock/detail/list/ai?type=1");
    proofs.push(list.proof);
    const candidate = selectOndoBscAsset(list.data ?? [], symbol);
    if (!candidate?.contractAddress || !candidate.symbol || !candidate.multiplier) return NextResponse.json(unavailable(symbol, observedAt, requestId, proofs, "ASSET_NOT_FOUND", `Binance did not return a valid Ondo ${symbol} deployment on BSC.`), { status: 404 });
    const query = `chainId=56&contractAddress=${encodeURIComponent(candidate.contractAddress)}`;
    const [meta, status, dynamic] = await Promise.all([
      providerGet<{ name?: string; symbol?: string; ticker?: string; type?: number; dailyAttestationReports?: string; monthlyAttestationReports?: string }>("rwa-meta", `/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/rwa/meta/ai?${query}`),
      providerGet<{ openState?: boolean; marketStatus?: string; reasonCode?: string }>("asset-status", `/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/rwa/asset/market/status/ai?${query}`),
      providerGet<{ symbol?: string; ticker?: string; type?: number; tokenInfo?: Record<string, string>; stockInfo?: Record<string, string | null>; statusInfo?: { openState?: boolean; marketStatus?: string; reasonCode?: string } }>("dynamic", `/bapi/defi/v2/public/wallet-direct/buw/wallet/market/token/rwa/dynamic/ai?${query}`),
    ]);
    proofs.push(meta.proof, status.proof, dynamic.proof);
    const identityValid = meta.data?.ticker === symbol && meta.data?.symbol === candidate.symbol && meta.data?.type === 1 && dynamic.data?.ticker === symbol && dynamic.data?.symbol === candidate.symbol && dynamic.data?.type === 1;
    const dynamicMultiplier = dynamic.data?.tokenInfo?.sharesMultiplier;
    const normalized = normalizeOndoTokenPrice(dynamic.data?.tokenInfo?.price, dynamicMultiplier);
    if (!identityValid || normalized == null || Number(candidate.multiplier) !== Number(dynamicMultiplier)) return NextResponse.json(unavailable(symbol, observedAt, requestId, proofs, "INVALID_PROVIDER_RESPONSE", "Binance returned inconsistent identity, multiplier or price fields."), { status: 502 });
    const stockReference = Number(dynamic.data?.stockInfo?.price);
    const stockReferenceUsd = Number.isFinite(stockReference) && stockReference > 0 ? stockReference : null;
    const full = (path?: string) => path ? `https://bin.bnbstatic.com${path}` : null;
    const result: BinanceWalletSkillEvidence = {
      status: "LIVE",
      module: "Binance Wallet Skill · Tokenized Securities Info",
      provider: "Binance Skills Hub / Binance Web3 Wallet",
      skillVersion: "1.1",
      symbol,
      documentationUrl: DOCS,
      observedAt,
      latencyMs: Math.round(performance.now() - started),
      requestId,
      requests: proofs,
      asset: {
        chainId: "56", network: "BSC Mainnet", contractAddress: candidate.contractAddress, tokenSymbol: candidate.symbol, ticker: symbol,
        issuer: "Ondo Finance", multiplier: Number(dynamicMultiplier), tokenPriceUsd: Number(dynamic.data!.tokenInfo!.price), normalizedPerShareUsd: normalized,
        stockReferenceUsd, normalizedDifferencePct: percentDifference(normalized, stockReferenceUsd), priceStatus: "CACHED",
        totalHolders: Number.isFinite(Number(dynamic.data?.tokenInfo?.totalHolders)) ? Number(dynamic.data?.tokenInfo?.totalHolders) : null,
        circulatingSupply: Number.isFinite(Number(dynamic.data?.tokenInfo?.circulatingSupply)) ? Number(dynamic.data?.tokenInfo?.circulatingSupply) : null,
        marketStatus: status.data?.marketStatus ?? dynamic.data?.statusInfo?.marketStatus ?? null,
        openState: status.data?.openState ?? dynamic.data?.statusInfo?.openState ?? null,
        reasonCode: status.data?.reasonCode ?? dynamic.data?.statusInfo?.reasonCode ?? null,
        dailyAttestationUrl: full(meta.data?.dailyAttestationReports), monthlyAttestationUrl: full(meta.data?.monthlyAttestationReports),
      },
      assessment: {
        verdict: "ACCEPTED_WITH_LIMITATIONS",
        accepted: [`${candidate.symbol} identity and Ondo issuer metadata`, "BSC chain ID 56 and provider-returned contract", "Per-share normalization using the live multiplier"],
        missing: ["Provider source timestamp for the price", "On-chain DEX liquidity and price impact for this Ondo token"],
        risks: ["Ondo and xStocks are different issuers and contracts", "The Skill's volume24h field is US stock volume, not DEX liquidity"],
      },
      error: null,
    };
    return NextResponse.json(result, { headers: { "cache-control": "public, max-age=15, s-maxage=30" } });
  } catch (caught) {
    const proof = (caught as { proof?: WalletSkillRequestProof }).proof;
    if (proof) proofs.push(proof);
    const timeout = caught instanceof DOMException && caught.name === "TimeoutError";
    const body = unavailable(symbol, observedAt, requestId, proofs, timeout ? "TIMEOUT" : "PROVIDER_ERROR", caught instanceof Error ? caught.message : "Binance Wallet Skill provider request failed.");
    return NextResponse.json(body, { status: 502 });
  }
}
