import { MOCK_SESSIONS } from "@/data/mock/sessions";
import type { MarketDataAdapter } from "@/data/adapters/market-adapter";
import type { SymbolKey } from "@/data/types";

export const mockMarketAdapter: MarketDataAdapter = {
  id: "ghost-demo-v0.2",
  mode: "SIMULATED",
  getSession(symbol: SymbolKey) {
    return MOCK_SESSIONS[symbol];
  },
};

