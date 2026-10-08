import type { SymbolKey } from "@/data/types";
import type { NormalizedMarketStatus } from "@/lib/market-session";

export type LiveEvidenceStatus = "LIVE" | "CACHED" | "UNAVAILABLE" | "REJECTED" | "ERROR";

export type LiveEvidence = {
  status: LiveEvidenceStatus;
  symbol: SymbolKey;
  tokenSymbol: `${SymbolKey}x`;
  observedAt: string;
  latencyMs: number;
  requestId: string;
  registry: {
    status: LiveEvidenceStatus;
    provider: "xStocks / Backed Assets";
    assetName: string | null;
    isin: string | null;
    underlyingSymbol: string | null;
    contractAddress: string | null;
    wrapperAddress: string | null;
    network: "BinanceSmartChain";
    apiUrl: string;
    docsUrl: string;
    legalUrl: string;
  };
  market: {
    status: LiveEvidenceStatus;
    currentPeriod: string | null;
    normalizedStatus: NormalizedMarketStatus;
    openNow: boolean | null;
    nextChangeAt: string | null;
    tradingHoursMode: string | null;
    timezone: string;
    observedAt: string;
    source: "xStocks Public Assets API";
  };
  reference: {
    status: LiveEvidenceStatus;
    priceUsd: number | null;
    timestamp: null;
    age: "PROVIDER_TIMESTAMP_NOT_SUPPLIED";
    source: "xStocks price-data (provider-cached)";
    url: string;
  };
  oracle: {
    status: LiveEvidenceStatus;
    provider: string | null;
    feedType: string | null;
    feedId: string | null;
    verifierContract: string | null;
    url: string;
  };
  dex: {
    status: LiveEvidenceStatus;
    venue: "PancakeSwap V2";
    pairAddress: string | null;
    baseAddress: string | null;
    quoteAddress: string;
    quoteSymbol: "USDT";
    spotPriceUsd: number | null;
    liquidityUsd: number | null;
    priceImpact100UsdPct: number | null;
    poolFeeBps: 25;
    spreadBps: null;
    blockNumber: number | null;
    blockTimestamp: string | null;
    explorerUrl: string | null;
    rejectionReason: string | null;
  };
  verification: Array<{
    label: "CONTRACT EXISTS" | "SYMBOL VERIFIED" | "ISSUER/PROVIDER VERIFIED" | "MARKET DATA VERIFIED";
    status: LiveEvidenceStatus;
    detail: string;
    url: string | null;
  }>;
  error: null | { kind: string; message: string };
};
