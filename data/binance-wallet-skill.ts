import type { DataStatus, SymbolKey } from "@/data/types";

export type WalletSkillRequestProof = {
  name: "symbol-list" | "rwa-meta" | "asset-status" | "dynamic";
  endpoint: string;
  statusCode: number;
  businessCode: string | null;
  success: boolean;
  latencyMs: number;
  observedAt: string;
  providerRequestId: string | null;
};

export type BinanceWalletSkillEvidence = {
  status: DataStatus;
  module: "Binance Wallet Skill · Tokenized Securities Info";
  provider: "Binance Skills Hub / Binance Web3 Wallet";
  skillVersion: "1.1";
  symbol: SymbolKey | string;
  documentationUrl: string;
  observedAt: string;
  latencyMs: number | null;
  requestId: string;
  requests: WalletSkillRequestProof[];
  asset: null | {
    chainId: "56";
    network: "BSC Mainnet";
    contractAddress: string;
    tokenSymbol: string;
    ticker: string;
    issuer: "Ondo Finance";
    multiplier: number;
    tokenPriceUsd: number;
    normalizedPerShareUsd: number;
    stockReferenceUsd: number | null;
    normalizedDifferencePct: number | null;
    priceStatus: "CACHED";
    totalHolders: number | null;
    circulatingSupply: number | null;
    marketStatus: string | null;
    openState: boolean | null;
    reasonCode: string | null;
    dailyAttestationUrl: string | null;
    monthlyAttestationUrl: string | null;
  };
  assessment: {
    verdict: "ACCEPTED_WITH_LIMITATIONS" | "UNAVAILABLE";
    accepted: string[];
    missing: string[];
    risks: string[];
  };
  error: null | { kind: "ASSET_NOT_FOUND" | "INVALID_PROVIDER_RESPONSE" | "TIMEOUT" | "PROVIDER_ERROR"; message: string };
};
