import type { DataStatus, SymbolKey } from "@/data/types";

export type BinanceErrorKind = "MISSING_CREDENTIALS" | "TIMEOUT" | "RATE_LIMITED" | "INVALID_CREDENTIALS" | "EMPTY_RESPONSE" | "ASSET_NOT_FOUND" | "PROVIDER_ERROR";

export type BinanceRequestProof = {
  endpoint: string;
  statusCode: number;
  latencyMs: number;
  providerRequestId: string | null;
  observedAt: string;
};

export type BinanceIntegration = {
  status: DataStatus;
  module: "Binance Stocks Trading Market Data";
  provider: "Binance Developer API";
  symbol: SymbolKey | string;
  endpoints: string[];
  documentationUrl: string;
  observedAt: string;
  latencyMs: number | null;
  requestId: string;
  providerRequestId: string | null;
  responseStatus: number | null;
  requests: BinanceRequestProof[];
  quoteMaxAgeSeconds: number | null;
  tokenizedAsset: null | { assetCode: string; assetName: string; underlyingEquitySymbol: string; multiplier: string; multiplierValid: boolean };
  quote: null | { symbol: string; bidPrice: string; askPrice: string; bidSize: number; askSize: number };
  marketInfo: null | { symbol: string; tradability: string; tradabilityUpdateTime: number; overnightSupported: boolean; extendedSession: boolean; timezone?: string };
  error: null | { kind: BinanceErrorKind; message: string };
};
