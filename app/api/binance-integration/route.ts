import { NextRequest, NextResponse } from "next/server";
import type { BinanceIntegration } from "@/data/binance-integration";
import type { SymbolKey } from "@/data/types";
import { classifyBinanceError } from "@/lib/binance-errors";

const BASE_URL = "https://api.binance.com";
const ASSETS_ENDPOINT = "/sapi/v1/equity/market/tokenized-assets";
const QUOTE_ENDPOINT = "/sapi/v1/equity/market/quote";
const SYMBOLS = new Set<SymbolKey>(["NVDA", "AAPL", "TSLA"]);

async function binanceFetch(path: string, apiKey: string) {
  const started = performance.now();
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "X-MBX-APIKEY": apiKey },
    signal: AbortSignal.timeout(7_000),
    cache: "no-store",
  });
  const text = await response.text();
  const requestId = response.headers.get("x-request-id") ?? response.headers.get("x-mbx-uuid");
  if (!response.ok) {
    const error = new Error(text || `Binance returned ${response.status}`) as Error & { status?: number; requestId?: string | null };
    error.status = response.status; error.requestId = requestId; throw error;
  }
  if (!text.trim()) {
    const error = new Error("Binance returned an empty response") as Error & { status?: number; requestId?: string | null };
    error.status = 200; error.requestId = requestId; throw error;
  }
  return { data: JSON.parse(text) as unknown, requestId, latencyMs: Math.round(performance.now() - started) };
}

export async function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get("symbol")?.toUpperCase() as SymbolKey | undefined;
  const symbol: SymbolKey = requested && SYMBOLS.has(requested) ? requested : "AAPL";
  const observedAt = new Date().toISOString();
  const apiKey = process.env.BINANCE_API_KEY;
  const base: Omit<BinanceIntegration, "status" | "latencyMs" | "requestId" | "tokenizedAsset" | "quote" | "error"> = {
    module: "Binance Stocks Trading Market Data", provider: "Binance Developer API", symbol,
    endpoints: [ASSETS_ENDPOINT, `${QUOTE_ENDPOINT}?symbol=${symbol}`], observedAt,
  };
  if (!apiKey) return NextResponse.json({ ...base, status: "UNAVAILABLE", latencyMs: null, requestId: null, tokenizedAsset: null, quote: null, error: { kind: "MISSING_CREDENTIALS", message: "BINANCE_API_KEY is not configured on the server." } } satisfies BinanceIntegration);

  try {
    const [assetsResult, quoteResult] = await Promise.all([
      binanceFetch(ASSETS_ENDPOINT, apiKey),
      binanceFetch(`${QUOTE_ENDPOINT}?symbol=${encodeURIComponent(symbol)}`, apiKey),
    ]);
    const assets = assetsResult.data as Array<NonNullable<BinanceIntegration["tokenizedAsset"]>>;
    const asset = assets.find((item) => item?.underlyingEquitySymbol === symbol) ?? null;
    if (!asset) return NextResponse.json({ ...base, status: "UNAVAILABLE", latencyMs: Math.max(assetsResult.latencyMs, quoteResult.latencyMs), requestId: assetsResult.requestId ?? quoteResult.requestId, tokenizedAsset: null, quote: null, error: { kind: "UNSUPPORTED_ASSET", message: `${symbol} is not present in Binance tokenized assets.` } } satisfies BinanceIntegration);
    const quotePayload = quoteResult.data as { bidPrice: string; askPrice: string; bidSize: number; askSize: number };
    return NextResponse.json({ ...base, status: "LIVE", latencyMs: Math.max(assetsResult.latencyMs, quoteResult.latencyMs), requestId: assetsResult.requestId ?? quoteResult.requestId, tokenizedAsset: asset, quote: quotePayload, error: null } satisfies BinanceIntegration, { headers: { "cache-control": "private, no-store" } });
  } catch (caught) {
    const error = caught as Error & { status?: number; requestId?: string | null };
    const kind = error.name === "TimeoutError" ? "TIMEOUT" : classifyBinanceError(error.status ?? 500, error.message);
    return NextResponse.json({ ...base, status: "ERROR", latencyMs: null, requestId: error.requestId ?? null, tokenizedAsset: null, quote: null, error: { kind, message: error.message } } satisfies BinanceIntegration, { status: 502, headers: { "cache-control": "no-store" } });
  }
}
