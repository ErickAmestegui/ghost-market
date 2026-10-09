import type { DataStatus, SymbolKey } from "@/data/types";

export type BinanceWeb3RwaErrorKind =
  | "MISSING_CREDENTIALS"
  | "INVALID_CREDENTIALS"
  | "INVALID_SIGNATURE"
  | "TIMESTAMP_REJECTED"
  | "INSUFFICIENT_PERMISSION"
  | "COMPLIANCE_RESTRICTED"
  | "RATE_LIMITED"
  | "ASSET_NOT_FOUND"
  | "TIMEOUT"
  | "PROVIDER_ERROR";

export type BinanceWeb3RequestProof = {
  endpoint: string;
  statusCode: number;
  businessCode: number | null;
  providerMessage: string | null;
  latencyMs: number;
  observedAt: string;
};

export type BinanceWeb3RwaIssue = {
  platformId: string;
  stage: "underlying-profile" | "underlying-market";
  kind: BinanceWeb3RwaErrorKind;
  message: string;
};

export type BinanceWeb3RwaAsset = {
  platformId: "ondo" | "bstock" | string;
  binanceChainId: string;
  tokenContractAddress: string;
  tokenSymbol: string;
  companyName: string;
  assetType: number;
  status: DataStatus;
  tokenPrice: number | null;
  referencePrice: number | null;
  priceUpdatedAt: string | null;
  tokenToShareRatio: string | null;
  marketStatus: string | null;
  openState: boolean | null;
  reasonCode: string | null;
  reasonMessage: string | null;
  nextOpenAt: string | null;
  nextCloseAt: string | null;
  volume24HShares: number | null;
  marketCapUsd: number | null;
  protections: Array<{ name: string; supported: boolean; url: string | null }>;
};

export type BinanceWeb3RwaIntegration = {
  status: DataStatus;
  module: "Binance Web3 RWA Data API";
  provider: "Binance Web3 API";
  symbol: SymbolKey | string;
  documentationUrl: string;
  authenticationUrl: string;
  observedAt: string;
  latencyMs: number | null;
  requestId: string;
  responseStatus: number | null;
  credentialState: "CONFIGURED" | "MISSING";
  requests: BinanceWeb3RequestProof[];
  assets: BinanceWeb3RwaAsset[];
  issues?: BinanceWeb3RwaIssue[];
  error: null | { kind: BinanceWeb3RwaErrorKind; message: string };
};
