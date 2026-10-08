import type { DataStatus, SymbolKey } from "@/data/types";

export type BinanceErrorKind = "MISSING_CREDENTIALS" | "TIMEOUT" | "RATE_LIMIT" | "INVALID_CREDENTIALS" | "EMPTY_RESPONSE" | "UNSUPPORTED_ASSET" | "UPSTREAM_ERROR";

export type BinanceIntegration = {
  status: DataStatus;
  module: "Binance Stocks Trading Market Data";
  provider: "Binance Developer API";
  symbol: SymbolKey;
  endpoints: string[];
  documentationUrl: string;
  observedAt: string;
  latencyMs: number | null;
  requestId: string | null;
  tokenizedAsset: null | { assetCode: string; assetName: string; underlyingEquitySymbol: string; multiplier: string; multiplierValid: boolean };
  quote: null | { bidPrice: string; askPrice: string; bidSize: number; askSize: number };
  marketInfo: null | { symbol: string; tradability: string; tradabilityUpdateTime: number; overnightSupported: boolean; extendedSession: boolean };
  error: null | { kind: BinanceErrorKind; message: string };
};
