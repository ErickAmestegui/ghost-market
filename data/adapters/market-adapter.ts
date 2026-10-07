import type { GhostSession, SymbolKey } from "@/data/types";

export interface MarketDataAdapter {
  readonly id: string;
  readonly mode: "LIVE" | "HISTORICAL" | "DEMO";
  getSession(symbol: SymbolKey): GhostSession;
}

