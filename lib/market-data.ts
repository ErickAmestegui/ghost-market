export type SymbolKey = "NVDA" | "AAPL" | "TSLA";

export type TraditionalMarket = {
  price: number;
  referenceAgeMinutes: number;
  status: "closed";
  nextOpen: string;
};

export type OnChainVenue = {
  id: string;
  name: string;
  network: string;
  price: number;
  liquidity: number;
  spreadBps: number;
  volume24h: number;
};

type MarketFixture = {
  company: string;
  symbol: SymbolKey;
  traditional: TraditionalMarket;
  venues: OnChainVenue[];
  historicalReopen: number;
  historicalLabel: string;
};

const FIXTURES: Record<SymbolKey, MarketFixture> = {
  NVDA: {
    company: "NVIDIA",
    symbol: "NVDA",
    traditional: { price: 184.42, referenceAgeMinutes: 207, status: "closed", nextOpen: "MON 09:30 ET" },
    venues: [
      { id: "a", name: "Venue A", network: "BNB CHAIN", price: 185.31, liquidity: 2180000, spreadBps: 14, volume24h: 842000 },
      { id: "b", name: "Venue B", network: "ON-CHAIN", price: 185.08, liquidity: 1760000, spreadBps: 11, volume24h: 631000 },
      { id: "c", name: "Venue C", network: "ON-CHAIN", price: 185.46, liquidity: 940000, spreadBps: 19, volume24h: 397000 },
    ],
    historicalReopen: 185.11,
    historicalLabel: "SEP 27–30 CLOSED SESSION",
  },
  AAPL: {
    company: "Apple",
    symbol: "AAPL",
    traditional: { price: 227.79, referenceAgeMinutes: 207, status: "closed", nextOpen: "MON 09:30 ET" },
    venues: [
      { id: "a", name: "Venue A", network: "BNB CHAIN", price: 228.18, liquidity: 2840000, spreadBps: 9, volume24h: 1100000 },
      { id: "b", name: "Venue B", network: "ON-CHAIN", price: 228.07, liquidity: 2210000, spreadBps: 12, volume24h: 769000 },
      { id: "c", name: "Venue C", network: "ON-CHAIN", price: 228.33, liquidity: 1320000, spreadBps: 15, volume24h: 506000 },
    ],
    historicalReopen: 228.05,
    historicalLabel: "SEP 20–23 CLOSED SESSION",
  },
  TSLA: {
    company: "Tesla",
    symbol: "TSLA",
    traditional: { price: 249.98, referenceAgeMinutes: 207, status: "closed", nextOpen: "MON 09:30 ET" },
    venues: [
      { id: "a", name: "Venue A", network: "BNB CHAIN", price: 252.06, liquidity: 1490000, spreadBps: 22, volume24h: 914000 },
      { id: "b", name: "Venue B", network: "ON-CHAIN", price: 251.61, liquidity: 1120000, spreadBps: 27, volume24h: 721000 },
      { id: "c", name: "Venue C", network: "ON-CHAIN", price: 252.38, liquidity: 780000, spreadBps: 31, volume24h: 482000 },
    ],
    historicalReopen: 251.72,
    historicalLabel: "SEP 13–16 CLOSED SESSION",
  },
};

export const symbols = Object.values(FIXTURES).map(({ company, symbol }) => ({ company, symbol }));
export function getTraditionalMarketData(symbol: SymbolKey) { return FIXTURES[symbol].traditional; }
export function getOnChainMarkets(symbol: SymbolKey) { return FIXTURES[symbol].venues; }
export function getMarketFixture(symbol: SymbolKey) { return FIXTURES[symbol]; }

export function calculateGhostConsensus(venues: OnChainVenue[]) {
  const weightedTotal = venues.reduce((sum, venue) => sum + venue.price * venue.liquidity, 0);
  const totalLiquidity = venues.reduce((sum, venue) => sum + venue.liquidity, 0);
  return weightedTotal / totalLiquidity;
}

export function calculateGhostConfidence(traditional: TraditionalMarket, venues: OnChainVenue[]) {
  const prices = venues.map((venue) => venue.price);
  const dispersionPct = ((Math.max(...prices) - Math.min(...prices)) / calculateGhostConsensus(venues)) * 100;
  const avgSpread = venues.reduce((sum, venue) => sum + venue.spreadBps, 0) / venues.length;
  const totalLiquidity = venues.reduce((sum, venue) => sum + venue.liquidity, 0);
  const agreement = Math.max(0, 35 - dispersionPct * 18);
  const liquidity = Math.min(25, (totalLiquidity / 5000000) * 25);
  const spread = Math.max(0, 25 - avgSpread * 0.45);
  const freshness = Math.max(0, 15 - traditional.referenceAgeMinutes / 32);
  return Math.round(agreement + liquidity + spread + freshness);
}

export function calculateReopenError(consensus: number, reopenPrice: number) {
  return Math.abs((consensus - reopenPrice) / reopenPrice) * 100;
}
export function formatAge(minutes: number) { return `${Math.floor(minutes / 60)}h ${minutes % 60}m`; }
export function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);
}
