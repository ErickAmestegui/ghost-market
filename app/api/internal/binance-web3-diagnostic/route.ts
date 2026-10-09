import { NextRequest, NextResponse } from "next/server";
import { buildWeb3PreHash, buildWeb3RequestPath, signWeb3Request } from "@/lib/binance-web3-auth";

const BASE_URL = "https://web3.binance.com";
type ProviderEnvelope = { code?: number; msg?: string; timestamp?: number; success?: boolean };
type DiagnosticResult = { endpoint: string; method: "GET"; http: number | null; businessCode: number | null; message: string; timestampUtc: string; latencyMs: number | null; requestId: string | null };

function safeEqual(left: string, right: string) {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index];
  return difference === 0;
}

function safeMessage(value: unknown) {
  const message = typeof value === "string" ? value : "Provider response unavailable";
  return message.replace(/(?:api[-_ ]?key|secret|signature|token)\s*[:=]\s*[^\s,"}]+/gi, "credential=[redacted]").slice(0, 300);
}

async function signedRead(path: string, apiKey: string, secretKey: string): Promise<DiagnosticResult> {
  const method = "GET" as const;
  const requestPath = buildWeb3RequestPath(path);
  const requestedAt = new Date().toISOString();
  const signature = await signWeb3Request(secretKey, buildWeb3PreHash(requestedAt, method, requestPath));
  const started = performance.now();
  try {
    const response = await fetch(`${BASE_URL}${requestPath}`, { method, headers: { "X-OC-APIKEY": apiKey, "X-OC-TIMESTAMP": requestedAt, "X-OC-SIGN": signature, "X-OC-RECV-WINDOW": "10000" }, cache: "no-store", signal: AbortSignal.timeout(10_000) });
    const text = await response.text();
    let payload: ProviderEnvelope = {};
    try { payload = JSON.parse(text) as ProviderEnvelope; } catch { payload = { msg: text || `HTTP ${response.status}` }; }
    const timestampUtc = typeof payload.timestamp === "number" && Number.isFinite(payload.timestamp) ? new Date(payload.timestamp).toISOString() : requestedAt;
    return { endpoint: requestPath, method, http: response.status, businessCode: typeof payload.code === "number" ? payload.code : null, message: safeMessage(payload.msg ?? (payload.success === true ? "success" : `HTTP ${response.status}`)), timestampUtc, latencyMs: Math.round(performance.now() - started), requestId: response.headers.get("x-request-id") ?? response.headers.get("x-binance-request-id") ?? response.headers.get("trace-id") };
  } catch (caught) {
    const error = caught as Error;
    return { endpoint: requestPath, method, http: null, businessCode: null, message: safeMessage(error.name === "TimeoutError" ? "Request timed out" : error.message), timestampUtc: requestedAt, latencyMs: Math.round(performance.now() - started), requestId: null };
  }
}

export async function GET(request: NextRequest) {
  const expectedToken = process.env.GHOST_DIAGNOSTIC_TOKEN;
  const suppliedToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!expectedToken || !safeEqual(suppliedToken, expectedToken)) return NextResponse.json({ error: "Not found" }, { status: 404, headers: { "cache-control": "private, no-store" } });
  const apiKey = process.env.BINANCE_WEB3_API_KEY;
  const secretKey = process.env.BINANCE_WEB3_SECRET_KEY;
  if (!apiKey || !secretKey) return NextResponse.json({ error: "Web3 credentials unavailable" }, { status: 503, headers: { "cache-control": "private, no-store" } });
  const diagnosticRequestId = crypto.randomUUID();
  const [rwaPlatforms, marketSupportedChains] = await Promise.all([
    signedRead("/api/v1/dex/market/rwa/platforms", apiKey, secretKey),
    signedRead("/api/v1/dex/market/supported/chain", apiKey, secretKey),
  ]);
  return NextResponse.json({ diagnosticRequestId, results: [rwaPlatforms, marketSupportedChains] }, { headers: { "cache-control": "private, no-store", "x-ghost-request-id": diagnosticRequestId } });
}
