import { NextRequest, NextResponse } from "next/server";
import type { LiveEvidence, LiveEvidenceStatus } from "@/data/live-evidence";
import type { SymbolKey } from "@/data/types";
import { evaluateDexQuality } from "@/lib/dex-quality";
import { normalizeMarketStatus } from "@/lib/market-session";

const XSTOCKS_API = "https://api.xstocks.fi/api/v2";
const RPC_URLS = [
  "https://bsc-dataseed.bnbchain.org",
  "https://bsc-dataseed1.bnbchain.org",
  "https://bsc-dataseed2.bnbchain.org",
];
const PANCAKE_V2_FACTORY = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
const USDT = "0x55d398326f99059ff775485246999027b3197955";
const ZERO = "0x0000000000000000000000000000000000000000";
const SYMBOLS: Record<SymbolKey, { tokenSymbol: `${SymbolKey}x`; expectedContract: string }> = {
  AAPL: { tokenSymbol: "AAPLx", expectedContract: "0x9d275685dc284c8eb1c79f6aba7a63dc75ec890a" },
  NVDA: { tokenSymbol: "NVDAx", expectedContract: "0xc845b2894dbddd03858fd2d643b4ef725fe0849d" },
  TSLA: { tokenSymbol: "TSLAx", expectedContract: "0x8ad3c73f833d3f9a523ab01476625f269aeb7cf0" },
};

type AssetResponse = {
  name?: string; symbol?: string; isin?: string; underlyingSymbol?: string;
  trading?: { currentPeriod?: string; openNow?: boolean; nextChangeAt?: string; tradingHoursMode?: string; exchange?: { timezone?: string } };
  deployments?: Array<{ address?: string; wrapperAddressV2?: string; network?: string }>;
};
type OracleResponse = { nodes?: Array<{ managedBy?: string; feedType?: string; metadata?: { feedId?: string; verifierContract?: string } }> };

function padAddress(address: string) { return address.toLowerCase().replace(/^0x/, "").padStart(64, "0"); }
function lastAddress(value: string) { return `0x${value.slice(-40)}`.toLowerCase(); }
function hexNumber(value: string) { return Number.parseInt(value, 16); }
function units(value: bigint, decimals: number) { return Number(value) / 10 ** decimals; }

async function json<T>(url: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
      if (!response.ok) throw new Error(`${new URL(url).hostname} returned ${response.status}`);
      return response.json() as Promise<T>;
    } catch (error) { lastError = error; }
  }
  throw lastError instanceof Error ? lastError : new Error(`${new URL(url).hostname} request failed`);
}

async function optionalJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5_000) });
    if (!response.ok) return fallback;
    return response.json() as Promise<T>;
  } catch { return fallback; }
}

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  let lastError: unknown;
  for (const rpcUrl of RPC_URLS) {
    try {
      const response = await fetch(rpcUrl, {
        method: "POST", headers: { "content-type": "application/json" }, cache: "no-store",
        body: JSON.stringify({ jsonrpc: "2.0", id: method, method, params }), signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) throw new Error(`${new URL(rpcUrl).hostname} returned ${response.status}`);
      const payload = await response.json() as { result?: T; error?: { message?: string } };
      if (payload.result === undefined || payload.error) throw new Error(payload.error?.message ?? `${method} returned no result`);
      return payload.result;
    } catch (error) { lastError = error; }
  }
  throw lastError instanceof Error ? lastError : new Error(`${method} failed across BNB RPC endpoints`);
}

async function call(to: string, data: string, block = "latest") { return rpc<string>("eth_call", [{ to, data }, block]); }

function rejectedDex(reason: string, blockNumber: number | null = null, blockTimestamp: string | null = null): LiveEvidence["dex"] {
  return { status: reason.includes("NO VERIFIED") ? "UNAVAILABLE" : "REJECTED", venue: "PancakeSwap V2", pairAddress: null, baseAddress: null, quoteAddress: USDT, quoteSymbol: "USDT", spotPriceUsd: null, liquidityUsd: null, priceImpact100UsdPct: null, poolFeeBps: 25, spreadBps: null, blockNumber, blockTimestamp, explorerUrl: null, rejectionReason: reason };
}

export async function GET(request: NextRequest) {
  const started = performance.now();
  const requested = request.nextUrl.searchParams.get("symbol")?.toUpperCase() as SymbolKey | undefined;
  const symbol: SymbolKey = requested && requested in SYMBOLS ? requested : "AAPL";
  const config = SYMBOLS[symbol];
  const observedAt = new Date().toISOString();
  const requestId = crypto.randomUUID();
  const assetUrl = `${XSTOCKS_API}/public/assets/${config.tokenSymbol}`;
  const priceUrl = `${assetUrl}/price-data`;
  const oracleUrl = `${XSTOCKS_API}/public/oracles/${config.tokenSymbol}?network=BinanceSmartChain&page=0&pageSize=50`;

  try {
    const [asset, price, oracle, blockHex] = await Promise.all([
      json<AssetResponse>(assetUrl),
      optionalJson<{ quote?: number }>(priceUrl, { quote: undefined }),
      optionalJson<OracleResponse>(oracleUrl, { nodes: [] }),
      rpc<string>("eth_blockNumber", []),
    ]);
    const deployment = asset.deployments?.find((item) => item.network === "BinanceSmartChain");
    const contract = deployment?.address?.toLowerCase() ?? null;
    const contractMatches = contract === config.expectedContract;
    if (!contract || !contractMatches) throw new Error(`Official xStocks registry did not return the expected ${config.tokenSymbol} BSC contract`);

    const [code, symbolHex, block] = await Promise.all([
      rpc<string>("eth_getCode", [contract, blockHex]),
      call(contract, "0x95d89b41", blockHex),
      rpc<{ number: string; timestamp: string }>("eth_getBlockByNumber", [blockHex, false]),
    ]);
    const blockNumber = hexNumber(block.number);
    const blockTimestamp = new Date(hexNumber(block.timestamp) * 1_000).toISOString();
    const symbolClean = symbolHex.slice(2);
    const symbolLength = Number.parseInt(symbolClean.slice(64, 128), 16);
    const onchainSymbol = new TextDecoder().decode(Uint8Array.from((symbolClean.slice(128, 128 + symbolLength * 2).match(/.{2}/g) ?? []), (part) => Number.parseInt(part, 16))).replace(/\0/g, "");
    const symbolVerified = onchainSymbol === config.tokenSymbol;
    const contractExists = code !== "0x";

    let dex = rejectedDex("NO VERIFIED MARKET FOUND", blockNumber, blockTimestamp);
    const pairHex = await call(PANCAKE_V2_FACTORY, `0xe6a43905${padAddress(contract)}${padAddress(USDT)}`, blockHex);
    const pair = lastAddress(pairHex);
    if (pair !== ZERO) {
      const [token0Hex, token1Hex, reservesHex, baseDecimalsHex, quoteDecimalsHex] = await Promise.all([
        call(pair, "0x0dfe1681", blockHex), call(pair, "0xd21220a7", blockHex), call(pair, "0x0902f1ac", blockHex),
        call(contract, "0x313ce567", blockHex), call(USDT, "0x313ce567", blockHex),
      ]);
      const token0 = lastAddress(token0Hex);
      const token1 = lastAddress(token1Hex);
      const reserve0 = BigInt(`0x${reservesHex.slice(2, 66)}`);
      const reserve1 = BigInt(`0x${reservesHex.slice(66, 130)}`);
      const baseDecimals = hexNumber(baseDecimalsHex);
      const quoteDecimals = hexNumber(quoteDecimalsHex);
      const baseIs0 = token0 === contract;
      if (!((token0 === contract && token1 === USDT) || (token1 === contract && token0 === USDT))) throw new Error("PancakeSwap pair token mismatch");
      const baseReserve = units(baseIs0 ? reserve0 : reserve1, baseDecimals);
      const quoteReserve = units(baseIs0 ? reserve1 : reserve0, quoteDecimals);
      const spot = baseReserve > 0 ? quoteReserve / baseReserve : null;
      const liquidity = quoteReserve * 2;
      const amountIn = 100 * 0.9975;
      const amountOut = baseReserve * amountIn / (quoteReserve + amountIn);
      const executionPrice = amountOut > 0 ? 100 / amountOut : null;
      const impact = spot && executionPrice ? (executionPrice / spot - 1) * 100 : null;
      const quality = evaluateDexQuality(spot, liquidity, impact);
      dex = {
        status: quality.accepted ? "LIVE" : "REJECTED", venue: "PancakeSwap V2", pairAddress: pair, baseAddress: contract,
        quoteAddress: USDT, quoteSymbol: "USDT", spotPriceUsd: spot, liquidityUsd: liquidity,
        priceImpact100UsdPct: impact, poolFeeBps: 25, spreadBps: null, blockNumber, blockTimestamp,
        explorerUrl: `https://bscscan.com/address/${pair}`,
        rejectionReason: quality.reason,
      };
    }

    const oracleNode = oracle.nodes?.[0];
    const priceOk = Number.isFinite(price.quote) && Number(price.quote) > 0;
    const registryStatus: LiveEvidenceStatus = contractExists && symbolVerified ? "LIVE" : "ERROR";
    const result: LiveEvidence = {
      status: registryStatus, symbol, tokenSymbol: config.tokenSymbol, observedAt,
      latencyMs: Math.round(performance.now() - started), requestId,
      registry: { status: "LIVE", provider: "xStocks / Backed Assets", assetName: asset.name ?? null, isin: asset.isin ?? null, underlyingSymbol: asset.underlyingSymbol ?? null, contractAddress: contract, wrapperAddress: deployment?.wrapperAddressV2 ?? null, network: "BinanceSmartChain", apiUrl: assetUrl, docsUrl: "https://docs.xstocks.fi/developers", legalUrl: "https://assets.backed.fi/legal-documentation" },
      market: { status: "LIVE", currentPeriod: asset.trading?.currentPeriod ?? null, normalizedStatus: normalizeMarketStatus(asset.trading?.currentPeriod, asset.trading?.openNow), openNow: asset.trading?.openNow ?? null, nextChangeAt: asset.trading?.nextChangeAt ?? null, tradingHoursMode: asset.trading?.tradingHoursMode ?? null, timezone: asset.trading?.exchange?.timezone ?? "America/New_York", observedAt, source: "xStocks Public Assets API" },
      reference: { status: priceOk ? "CACHED" : "UNAVAILABLE", priceUsd: priceOk ? Number(price.quote) : null, timestamp: null, age: "PROVIDER_TIMESTAMP_NOT_SUPPLIED", source: "xStocks price-data (provider-cached)", url: priceUrl },
      oracle: { status: oracleNode ? "LIVE" : "UNAVAILABLE", provider: oracleNode?.managedBy ?? null, feedType: oracleNode?.feedType ?? null, feedId: oracleNode?.metadata?.feedId ?? null, verifierContract: oracleNode?.metadata?.verifierContract ?? null, url: oracleUrl },
      dex,
      verification: [
        { label: "CONTRACT EXISTS", status: contractExists ? "LIVE" : "ERROR", detail: contractExists ? `Bytecode observed at BSC block ${blockNumber}` : "No bytecode returned", url: `https://bscscan.com/token/${contract}` },
        { label: "SYMBOL VERIFIED", status: symbolVerified ? "LIVE" : "ERROR", detail: symbolVerified ? `symbol() returned ${onchainSymbol}` : `Expected ${config.tokenSymbol}; received ${onchainSymbol || "empty"}`, url: `https://bscscan.com/token/${contract}` },
        { label: "ISSUER/PROVIDER VERIFIED", status: contractMatches ? "LIVE" : "ERROR", detail: `Official xStocks Assets API maps ${config.tokenSymbol} to this BSC deployment`, url: assetUrl },
        { label: "MARKET DATA VERIFIED", status: priceOk ? "CACHED" : "UNAVAILABLE", detail: priceOk ? "Official provider returned a cached reference quote without a source timestamp" : "No provider quote returned", url: priceUrl },
      ], error: null,
    };
    return NextResponse.json(result, { headers: { "cache-control": "public, max-age=10, s-maxage=20", "x-ghost-request-id": requestId } });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Live evidence unavailable";
    return NextResponse.json({ status: "ERROR", symbol, tokenSymbol: config.tokenSymbol, observedAt, latencyMs: Math.round(performance.now() - started), requestId, error: { kind: caught instanceof DOMException && caught.name === "TimeoutError" ? "TIMEOUT" : "UPSTREAM_ERROR", message } }, { status: 503, headers: { "cache-control": "no-store", "x-ghost-request-id": requestId } });
  }
}
