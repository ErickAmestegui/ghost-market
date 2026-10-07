import type { GhostEvent, GhostSession, ReplayFrame, SymbolKey, VenueObservation } from "@/data/types";

type SymbolConfig = {
  company: string;
  close: number;
  nextOpen: number;
  volatility: number;
  liquidity: [number, number, number];
  history: number[];
};

const CONFIG: Record<SymbolKey, SymbolConfig> = {
  NVDA: { company: "NVIDIA", close: 184.42, nextOpen: 185.11, volatility: 1, liquidity: [2_180_000, 1_760_000, 940_000], history: [0.42, 1.08, 0.24, 0.71] },
  AAPL: { company: "Apple", close: 227.79, nextOpen: 228.05, volatility: 0.72, liquidity: [2_840_000, 2_210_000, 1_320_000], history: [0.31, 0.63, 0.18, 0.44] },
  TSLA: { company: "Tesla", close: 249.98, nextOpen: 251.72, volatility: 1.55, liquidity: [1_490_000, 1_120_000, 780_000], history: [0.88, 1.42, 0.37, 1.16] },
};

const VENUES = [
  { id: "a" as const, name: "Helix Market" },
  { id: "b" as const, name: "Orbit Desk" },
  { id: "c" as const, name: "Lumen Pool" },
];

const BLUEPRINT = [
  { atMinute: 0, time: "4:00 PM", offsets: [0.03, 0.01, -0.02], liquidity: [1, 1, 1], spreads: [12, 14, 19], ages: [18, 31, 46], activity: [0.18, 0.13, 0.08], eventIds: ["close"] },
  { atMinute: 133, time: "6:13 PM", offsets: [0.16, 0.12, 0.07], liquidity: [1.02, 0.97, 0.92], spreads: [11, 15, 18], ages: [12, 27, 35], activity: [0.34, 0.29, 0.17], eventIds: ["activity"] },
  { atMinute: 342, time: "9:42 PM", offsets: [0.29, 1.12, 0.23], liquidity: [1.04, 0.88, 0.9], spreads: [12, 42, 20], ages: [9, 16, 33], activity: [0.48, 0.62, 0.24], eventIds: ["divergence"] },
  { atMinute: 560, time: "1:20 AM", offsets: [0.38, 0.74, 0.31], liquidity: [1.01, 0.46, 0.84], spreads: [13, 51, 22], ages: [21, 52, 38], activity: [0.53, 0.36, 0.29], eventIds: ["liquidity"] },
  { atMinute: 715, time: "3:55 AM", offsets: [0.47, 0.58, 0.83], liquidity: [1.06, 0.58, 0.91], spreads: [12, 34, 29], ages: [8, 29, 11], activity: [0.66, 0.43, 0.55], eventIds: ["shift"] },
  { atMinute: 870, time: "6:30 AM", offsets: [0.45, 0.49, 0.54], liquidity: [1.08, 0.73, 0.96], spreads: [10, 23, 20], ages: [7, 18, 15], activity: [0.78, 0.57, 0.62], eventIds: ["recovery"] },
  { atMinute: 990, time: "8:30 AM", offsets: [0.48, 0.43, 0.52], liquidity: [1.11, 0.8, 1.02], spreads: [9, 17, 17], ages: [5, 8, 12], activity: [0.91, 0.71, 0.69], eventIds: ["stable"] },
  { atMinute: 1049, time: "9:29 AM", offsets: [0.39, 0.35, 0.44], liquidity: [1.13, 0.84, 1.05], spreads: [8, 15, 16], ages: [3, 5, 7], activity: [1, 0.81, 0.76], eventIds: [] },
] as const;

function roundPrice(value: number) { return Math.round(value * 100) / 100; }

function buildVenues(config: SymbolConfig, frame: (typeof BLUEPRINT)[number]): VenueObservation[] {
  return VENUES.map((venue, index) => ({
    ...venue,
    network: "BNB CHAIN",
    sourceStatus: "DEMO",
    price: roundPrice(config.close * (1 + (frame.offsets[index] * config.volatility) / 100)),
    quoteAgeSeconds: frame.ages[index],
    reliability: [0.96, 0.88, 0.82][index],
    liquidity: {
      availableUsd: Math.round(config.liquidity[index] * frame.liquidity[index]),
      spreadBps: Math.round(frame.spreads[index] * (0.75 + config.volatility * 0.25)),
      activityUsd: Math.round(config.liquidity[index] * frame.activity[index]),
    },
  }));
}

function makeEvents(symbol: SymbolKey): GhostEvent[] {
  return [
    { id: "close", atMinute: 0, time: "4:00 PM", type: "MARKET_CLOSE", title: "WALL STREET CLOSED", detail: `${symbol} deja una referencia tradicional congelada.`, severity: "info" },
    { id: "activity", atMinute: 133, time: "6:13 PM", type: "ACTIVITY_CHANGE", title: "ACTIVITY CHANGE", detail: "Las observaciones on-chain empiezan a separarse de la referencia.", severity: "info" },
    { id: "divergence", atMinute: 342, time: "9:42 PM", type: "PRICE_DIVERGENCE", title: "PRICE DIVERGENCE", detail: "Orbit Desk se aleja del grupo y su spread aumenta.", venueId: "b", severity: "critical" },
    { id: "liquidity", atMinute: 560, time: "1:20 AM", type: "LIQUIDITY_DROP", title: "LIQUIDITY DROP", detail: "La profundidad de Orbit Desk cae y pierde influencia.", venueId: "b", severity: "warning" },
    { id: "night-signal", atMinute: 617, time: "2:17 AM", type: "PRICE_DIVERGENCE", title: "COORDINATED DIVERGENCE", detail: "Tres mercados reaccionan; Orbit Desk rompe temporalmente el consenso.", venueId: "b", severity: "critical" },
    { id: "shift", atMinute: 715, time: "3:55 AM", type: "CONSENSUS_SHIFT", title: "CONSENSUS SHIFT", detail: "Lumen Pool registra una nueva observación y mueve el consenso.", venueId: "c", severity: "warning" },
    { id: "recovery", atMinute: 870, time: "6:30 AM", type: "VENUE_RECOVERY", title: "VENUE RECOVERY", detail: "Las tres fuentes vuelven a aproximarse.", venueId: "b", severity: "info" },
    { id: "stable", atMinute: 990, time: "8:30 AM", type: "CONSENSUS_STABLE", title: "CONSENSUS STABLE", detail: "El acuerdo mejora antes de la apertura tradicional.", severity: "info" },
  ];
}

function makeFrames(config: SymbolConfig): ReplayFrame[] {
  return BLUEPRINT.map((frame, index) => ({
    id: `frame-${index}`,
    atMinute: frame.atMinute,
    time: frame.time,
    venues: buildVenues(config, frame),
    eventIds: [...frame.eventIds],
  }));
}

export const MOCK_SESSIONS = Object.fromEntries(
  (Object.keys(CONFIG) as SymbolKey[]).map((symbol) => {
    const config = CONFIG[symbol];
    const session: GhostSession = {
      symbol,
      company: config.company,
      dateLabel: "NOCHE SIMULADA · 04–05 OCT",
      close: { symbol, price: config.close, capturedAt: "4:00 PM ET", status: "closed", sourceStatus: "DEMO" },
      nextOpenPrice: config.nextOpen,
      frames: makeFrames(config),
      events: makeEvents(symbol),
      historicalNights: config.history.map((differencePct, index) => ({ label: `NIGHT ${index + 1}`, differencePct, sourceStatus: "DEMO" })),
    };
    return [symbol, session];
  }),
) as Record<SymbolKey, GhostSession>;

