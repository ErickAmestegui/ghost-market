import { NextRequest, NextResponse } from "next/server";
import type { BinanceWeb3RequestProof, BinanceWeb3RwaAsset, BinanceWeb3RwaIntegration } from "@/data/binance-web3-rwa";
import type { DataStatus, SymbolKey } from "@/data/types";
import { buildWeb3PreHash, buildWeb3RequestPath, signWeb3Request } from "@/lib/binance-web3-auth";
import { classifyWeb3RwaError } from "@/lib/binance-web3-errors";

const BASE_URL = "https://web3.binance.com";
const DOCS_URL = "https://web3.binance.com/en/dev-docs/catalog/web3-wallet/api/rest-api/rwa-data";
const AUTH_URL = "https://web3.binance.com/en/dev-docs/authentication";
const SYMBOLS = new Set<SymbolKey>(["NVDA", "AAPL", "TSLA"]);

type ApiEnvelope<T> = { code?: number; msg?: string; data?: T; timestamp?: number; success?: boolean };
type SearchAsset = { platformId?: string; binanceChainId?: string; tokenContractAddress?: string; tokenSymbol?: string; assetType?: number };
type SearchResult = { ticker?: string; companyName?: string; assets?: SearchAsset[] };
type PriceItem = { binanceChainId?: string; tokenContractAddress?: string; platformId?: string; tokenPrice?: string; referencePrice?: string; tokenPriceUpdatedAt?: number };
type Profile = { tokenToShareRatio?: string; protections?: Record<string, { supported?: boolean; url?: string | null }> };
type Market = { statusInfo?: { openState?: boolean; marketStatus?: string; reasonCode?: string | null; reasonMsg?: string | null; nextOpenTime?: number | null; nextCloseTime?: number | null }; marketData?: { referencePrice?: string; volumeShares24H?: string; marketCap?: string } };

function numberOrNull(value: unknown) {
  const parsed = typeof value === "string" || typeof value === "number" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function dateOrNull(value: unknown) {
  const number = numberOrNull(value);
  return number == null ? null : new Date(number).toISOString();
}

function safeMessage(message: string) {
  return message.replace(/(?:api[-_ ]?key|secret|signature|token)\s*[:=]\s*[^\s,"}]+/gi, "credential=[redacted]").slice(0, 400);
}

async function web3Get<T>(path: string, query: Array<[string, string]>, apiKey: string, secretKey: string) {
  const requestPath = buildWeb3RequestPath(path, query);
  const timestamp = new Date().toISOString();
  const signature = await signWeb3Request(secretKey, buildWeb3PreHash(timestamp, "GET", requestPath));
  const started = performance.now();
  const response = await fetch(`${BASE_URL}${requestPath}`, {
    headers: { "X-OC-APIKEY": apiKey, "X-OC-TIMESTAMP": timestamp, "X-OC-SIGN": signature, "X-OC-RECV-WINDOW": "10000" },
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  const text = await response.text();
  let payload: ApiEnvelope<T>;
  try { payload = JSON.parse(text) as ApiEnvelope<T>; }
  catch { payload = { code: response.status, msg: text || `HTTP ${response.status}` }; }
  const proof: BinanceWeb3RequestProof = { endpoint: `${BASE_URL}${requestPath}`, statusCode: response.status, businessCode: typeof payload.code === "number" ? payload.code : null, providerMessage: payload.msg ?? null, latencyMs: Math.round(performance.now() - started), observedAt: timestamp };
  if (!response.ok || payload.success === false || (typeof payload.code === "number" && payload.code !== 0)) {
    const error = new Error(payload.msg || `Binance Web3 returned HTTP ${response.status}`) as Error & { httpStatus: number; businessCode: number | null; proof: BinanceWeb3RequestProof };
    error.httpStatus = response.status; error.businessCode = proof.businessCode; error.proof = proof; throw error;
  }
  return { data: payload.data, proof };
}

function freshness(value: unknown, updatedAt: number | undefined): DataStatus {
  if (numberOrNull(value) == null) return "UNAVAILABLE";
  if (!updatedAt) return "CACHED";
  return Date.now() - updatedAt <= 5 * 60_000 ? "LIVE" : "CACHED";
}

export async function GET(request: NextRequest) {
  const symbol = (request.nextUrl.searchParams.get("symbol")?.toUpperCase() || "AAPL") as SymbolKey;
  const observedAt = new Date().toISOString();
  const requestId = crypto.randomUUID();
  const apiKey = process.env.BINANCE_WEB3_API_KEY;
  const secretKey = process.env.BINANCE_WEB3_SECRET_KEY;
  const headers = { "cache-control": "private, no-store", "x-ghost-request-id": requestId };
  const base = { module: "Binance Web3 RWA Data API", provider: "Binance Web3 API", symbol, documentationUrl: DOCS_URL, authenticationUrl: AUTH_URL, observedAt, requestId } as const;
  const unavailable = (kind: BinanceWeb3RwaIntegration["error"] extends infer E ? E : never, statusCode: number | null = null) => NextResponse.json({ ...base, status: "UNAVAILABLE", latencyMs: null, responseStatus: statusCode, credentialState: apiKey && secretKey ? "CONFIGURED" : "MISSING", requests: [], assets: [], error: kind } satisfies BinanceWeb3RwaIntegration, { headers });

  if (!SYMBOLS.has(symbol)) return unavailable({ kind: "ASSET_NOT_FOUND", message: `${symbol} is not supported by Ghost Market.` }, 404);
  if (!apiKey || !secretKey) return unavailable({ kind: "MISSING_CREDENTIALS", message: "Binance Web3 API Key and Secret Key are not configured on the server." });

  const proofs: BinanceWeb3RequestProof[] = [];
  try {
    const search = await web3Get<SearchResult[]>("/api/v1/dex/market/rwa/search", [["keyword", symbol]], apiKey, secretKey);
    proofs.push(search.proof);
    const match = search.data?.find((item) => item.ticker?.toUpperCase() === symbol);
    const candidates = (match?.assets ?? []).filter((asset) => asset.binanceChainId === "56" && asset.tokenContractAddress && (asset.platformId === "ondo" || asset.platformId === "bstock"));
    if (!candidates.length) return NextResponse.json({ ...base, status: "UNAVAILABLE", latencyMs: search.proof.latencyMs, responseStatus: 200, credentialState: "CONFIGURED", requests: proofs, assets: [], error: { kind: "ASSET_NOT_FOUND", message: `Binance Web3 returned no Ondo or bStocks BSC asset for ${symbol}.` } } satisfies BinanceWeb3RwaIntegration, { headers });

    const addresses = candidates.map((asset) => asset.tokenContractAddress!).join(",");
    const prices = await web3Get<PriceItem[]>("/api/v1/dex/market/rwa/price", [["binanceChainId", "56"], ["tokenContractAddresses", addresses]], apiKey, secretKey);
    proofs.push(prices.proof);
    const details = await Promise.all(candidates.map(async (candidate) => {
      const query: Array<[string, string]> = [["binanceChainId", "56"], ["tokenContractAddress", candidate.tokenContractAddress!]];
      const [profile, market] = await Promise.all([
        web3Get<Profile>("/api/v1/dex/market/rwa/underlying-profile", query, apiKey, secretKey),
        web3Get<Market>("/api/v1/dex/market/rwa/underlying-market", query, apiKey, secretKey),
      ]);
      proofs.push(profile.proof, market.proof);
      return { candidate, profile: profile.data, market: market.data };
    }));

    const assets: BinanceWeb3RwaAsset[] = details.map(({ candidate, profile, market }) => {
      const price = prices.data?.find((item) => item.tokenContractAddress?.toLowerCase() === candidate.tokenContractAddress!.toLowerCase());
      return {
        platformId: candidate.platformId!, binanceChainId: "56", tokenContractAddress: candidate.tokenContractAddress!, tokenSymbol: candidate.tokenSymbol ?? symbol,
        companyName: match?.companyName ?? symbol, assetType: candidate.assetType ?? 1, status: freshness(price?.tokenPrice, price?.tokenPriceUpdatedAt), tokenPrice: numberOrNull(price?.tokenPrice),
        referencePrice: numberOrNull(price?.referencePrice ?? market?.marketData?.referencePrice), priceUpdatedAt: dateOrNull(price?.tokenPriceUpdatedAt), tokenToShareRatio: profile?.tokenToShareRatio ?? null,
        marketStatus: market?.statusInfo?.marketStatus ?? null, openState: market?.statusInfo?.openState ?? null, reasonCode: market?.statusInfo?.reasonCode ?? null,
        reasonMessage: market?.statusInfo?.reasonMsg ?? null, nextOpenAt: dateOrNull(market?.statusInfo?.nextOpenTime), nextCloseAt: dateOrNull(market?.statusInfo?.nextCloseTime),
        volume24HShares: numberOrNull(market?.marketData?.volumeShares24H), marketCapUsd: numberOrNull(market?.marketData?.marketCap),
        protections: Object.entries(profile?.protections ?? {}).map(([name, item]) => ({ name, supported: item.supported === true, url: item.url ?? null })),
      };
    });
    const status: DataStatus = assets.some((asset) => asset.status === "LIVE") ? "LIVE" : assets.some((asset) => asset.status === "CACHED") ? "CACHED" : "UNAVAILABLE";
    const incomplete = status === "UNAVAILABLE" ? { kind: "PROVIDER_ERROR" as const, message: "Binance Web3 returned matching RWA assets without a usable token price." } : null;
    return NextResponse.json({ ...base, status, latencyMs: Math.max(...proofs.map((item) => item.latencyMs)), responseStatus: 200, credentialState: "CONFIGURED", requests: proofs, assets, error: incomplete } satisfies BinanceWeb3RwaIntegration, { headers });
  } catch (caught) {
    const error = caught as Error & { httpStatus?: number; businessCode?: number | null; proof?: BinanceWeb3RequestProof };
    if (error.proof) proofs.push(error.proof);
    const kind = error.name === "TimeoutError" ? "TIMEOUT" : classifyWeb3RwaError(error.httpStatus ?? 500, error.businessCode ?? null);
    const responseStatus = error.httpStatus ?? null;
    return NextResponse.json({ ...base, status: "ERROR", latencyMs: error.proof?.latencyMs ?? null, responseStatus, credentialState: "CONFIGURED", requests: proofs, assets: [], error: { kind, message: safeMessage(error.message) } } satisfies BinanceWeb3RwaIntegration, { status: kind === "RATE_LIMITED" ? 429 : kind === "TIMEOUT" ? 504 : 502, headers });
  }
}
