import { NextRequest, NextResponse } from "next/server";
import type { BinanceIntegration } from "@/data/binance-integration";
import type { SymbolKey } from "@/data/types";
import { classifyBinanceError } from "@/lib/binance-errors";
import { validateBinancePayload } from "@/lib/binance-validation";

const BASE_URL = "https://api.binance.com";
const ASSETS_ENDPOINT = "/sapi/v1/equity/market/tokenized-assets";
const QUOTE_ENDPOINT = "/sapi/v1/equity/market/quote";
const EXCHANGE_ENDPOINT = "/sapi/v1/equity/market/exchangeInfo";
const DOCS_URL = "https://developers.binance.com/en/docs/catalog/advanced-trading-stocks-trading/api/rest-api/market-data";
const SYMBOLS = new Set<SymbolKey>(["NVDA", "AAPL", "TSLA"]);

async function binanceFetch(path: string, apiKey: string, allowEmpty = false) {
  const started = performance.now();
  const observedAt = new Date().toISOString();
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "X-MBX-APIKEY": apiKey },
    signal: AbortSignal.timeout(7_000),
    cache: "no-store",
  });
  const text = await response.text();
  const requestId = response.headers.get("x-request-id") ?? response.headers.get("x-mbx-uuid");
  const proof = { endpoint: path, statusCode: response.status, providerRequestId: requestId, latencyMs: Math.round(performance.now() - started), observedAt };
  if (!response.ok) {
    const error = new Error(text || `Binance returned ${response.status}`) as Error & { status?: number; requestId?: string | null; proof?: typeof proof };
    error.status = response.status; error.requestId = requestId; error.proof = proof; throw error;
  }
  if (!text.trim() && !allowEmpty) {
    const error = new Error("Binance returned an empty response") as Error & { status?: number; requestId?: string | null; proof?: typeof proof };
    error.status = 200; error.requestId = requestId; error.proof = proof; throw error;
  }
  return { data: text.trim() ? JSON.parse(text) as unknown : null, proof };
}

function safeProviderMessage(message: string) {
  return message.replace(/(?:api[-_ ]?key|signature|token)\s*[:=]\s*[^\s,"}]+/gi, "credential=[redacted]").slice(0, 500);
}

export async function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get("symbol")?.toUpperCase();
  const symbol = requested || "AAPL";
  const observedAt = new Date().toISOString();
  const requestId = crypto.randomUUID();
  const apiKey = process.env.BINANCE_API_KEY;
  const base: Omit<BinanceIntegration, "status" | "latencyMs" | "providerRequestId" | "responseStatus" | "requests" | "tokenizedAsset" | "quote" | "marketInfo" | "error"> = {
    module: "Binance Stocks Trading Market Data", provider: "Binance Developer API", symbol,
    endpoints: [ASSETS_ENDPOINT, `${QUOTE_ENDPOINT}?symbol=${symbol}`, `${EXCHANGE_ENDPOINT}?symbol=${symbol}`], documentationUrl: DOCS_URL, observedAt, requestId, quoteMaxAgeSeconds: 5,
  };
  const headers = { "cache-control": "private, no-store", "x-ghost-request-id": requestId };
  if (!SYMBOLS.has(symbol as SymbolKey)) return NextResponse.json({ ...base, status: "UNAVAILABLE", latencyMs: null, providerRequestId: null, responseStatus: 404, requests: [], tokenizedAsset: null, quote: null, marketInfo: null, error: { kind: "ASSET_NOT_FOUND", message: `${symbol} is not a supported Ghost Market asset.` } } satisfies BinanceIntegration, { status: 404, headers });
  if (!apiKey) return NextResponse.json({ ...base, status: "UNAVAILABLE", latencyMs: null, providerRequestId: null, responseStatus: null, requests: [], tokenizedAsset: null, quote: null, marketInfo: null, error: { kind: "MISSING_CREDENTIALS", message: "BINANCE_API_KEY is not configured on the server." } } satisfies BinanceIntegration, { headers });

  try {
    const [assetsResult, quoteResult, exchangeResult] = await Promise.all([
      binanceFetch(ASSETS_ENDPOINT, apiKey),
      binanceFetch(`${QUOTE_ENDPOINT}?symbol=${encodeURIComponent(symbol)}`, apiKey, true),
      binanceFetch(`${EXCHANGE_ENDPOINT}?symbol=${encodeURIComponent(symbol)}`, apiKey),
    ]);
    const requests = [assetsResult.proof, quoteResult.proof, exchangeResult.proof];
    const latencyMs = Math.max(...requests.map((item) => item.latencyMs));
    const providerRequestId = requests.map((item) => item.providerRequestId).find(Boolean) ?? null;
    const validation = validateBinancePayload(symbol, assetsResult.data, quoteResult.data, exchangeResult.data);
    if (!validation.ok) return NextResponse.json({ ...base, status: "UNAVAILABLE", latencyMs, providerRequestId, responseStatus: 200, requests, tokenizedAsset: validation.asset, quote: null, marketInfo: validation.marketInfo, error: { kind: validation.kind, message: validation.message } } satisfies BinanceIntegration, { headers });
    return NextResponse.json({ ...base, status: "LIVE", latencyMs, providerRequestId, responseStatus: 200, requests, tokenizedAsset: validation.asset, quote: validation.quote, marketInfo: validation.marketInfo, error: null } satisfies BinanceIntegration, { headers });
  } catch (caught) {
    const error = caught as Error & { status?: number; requestId?: string | null; proof?: BinanceIntegration["requests"][number] };
    const kind = error.name === "TimeoutError" ? "TIMEOUT" : classifyBinanceError(error.status ?? 500, error.message);
    const status = kind === "RATE_LIMITED" ? 429 : kind === "TIMEOUT" ? 504 : 502;
    return NextResponse.json({ ...base, status: "ERROR", latencyMs: error.proof?.latencyMs ?? null, providerRequestId: error.requestId ?? null, responseStatus: error.status ?? null, requests: error.proof ? [error.proof] : [], tokenizedAsset: null, quote: null, marketInfo: null, error: { kind, message: safeProviderMessage(error.message) } } satisfies BinanceIntegration, { status, headers });
  }
}
