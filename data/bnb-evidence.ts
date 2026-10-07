import type { DataStatus } from "@/data/types";

export type BnbEvidence = {
  status: DataStatus;
  integrationStatus: "verified" | "unavailable";
  network: string;
  chainId: number;
  blockNumber: number | null;
  blockHash: string | null;
  timestamp: string | null;
  sourceName: string;
  sourceUrl: string;
  contractName: string | null;
  contractAddress: string | null;
  valueLabel: string | null;
  value: string | null;
  explorerBlockUrl: string | null;
  explorerContractUrl: string | null;
  observedAt: string;
  error?: string;
};
