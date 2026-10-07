export type SymbolKey = "NVDA" | "AAPL" | "TSLA";
export type Locale = "en" | "es";
export type DataStatus = "LIVE" | "CACHED" | "SIMULATED" | "DEMO" | "UNAVAILABLE" | "ERROR";

export type ReferencePrice = {
  symbol: SymbolKey;
  price: number;
  capturedAt: string;
  status: "closed" | "open";
  sourceStatus: DataStatus;
};

export type LiquidityMetrics = {
  availableUsd: number;
  spreadBps: number;
  activityUsd: number;
};

export type VenueObservation = {
  id: "a" | "b" | "c";
  name: string;
  network: "BNB CHAIN";
  sourceStatus: DataStatus;
  price: number;
  quoteAgeSeconds: number;
  reliability: number;
  liquidity: LiquidityMetrics;
};

export type MarketObservation = {
  reference: ReferencePrice;
  venues: VenueObservation[];
};

export type ConsensusWeight = {
  venueId: VenueObservation["id"];
  weight: number;
  score: number;
  factors: {
    liquidity: number;
    spread: number;
    freshness: number;
    activity: number;
    agreement: number;
    reliability: number;
  };
};

export type ConsensusResult = {
  price: number;
  weights: ConsensusWeight[];
  activeVenueIds: VenueObservation["id"][];
};

export type ConfidenceResult = {
  score: number;
  label: "LOW" | "MODERATE" | "MODERATE–HIGH" | "HIGH";
  evidence: Array<{ tone: "positive" | "warning"; label: string }>;
};

export type GhostEventType =
  | "MARKET_CLOSE"
  | "ACTIVITY_CHANGE"
  | "PRICE_DIVERGENCE"
  | "LIQUIDITY_DROP"
  | "CONSENSUS_SHIFT"
  | "VENUE_RECOVERY"
  | "CONSENSUS_STABLE";

export type GhostEvent = {
  id: string;
  atMinute: number;
  time: string;
  type: GhostEventType;
  title: string;
  detail: string;
  venueId?: VenueObservation["id"];
  severity: "info" | "warning" | "critical";
};

export type ReplayFrame = {
  id: string;
  atMinute: number;
  time: string;
  venues: VenueObservation[];
  eventIds: string[];
};

export type HistoricalNight = {
  label: string;
  differencePct: number;
  sourceStatus: DataStatus;
};

export type GhostSession = {
  symbol: SymbolKey;
  company: string;
  dateLabel: string;
  close: ReferencePrice;
  nextOpenPrice: number;
  frames: ReplayFrame[];
  events: GhostEvent[];
  historicalNights: HistoricalNight[];
};

export type PulseItem = {
  id: string;
  platform: "X" | "REDDIT" | "OFFICIAL" | "SYNTHETIC";
  source: string;
  excerpt: { en: string; es: string };
  stance: "support" | "challenge" | "context";
  trust: number;
  minutesAgo: number;
};

