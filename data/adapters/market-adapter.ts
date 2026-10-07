import type { GhostSession, SymbolKey } from "@/data/types";

export interface MarketDataAdapter {
  readonly id: string;
  readonly mode: "LIVE" | "CACHED" | "SIMULATED";
  getSession(symbol: SymbolKey): GhostSession;
}

