import type { ConfidenceResult, ConsensusResult, ReferencePrice, VenueObservation } from "@/data/types";

export type GhostScoreResult = {
  score: number;
  label: "WEAK" | "WATCH" | "STRONG";
  factors: Array<{ label: string; value: number; positive: boolean }>;
};

export function calculateGhostScore(reference: ReferencePrice, venues: VenueObservation[], consensus: ConsensusResult, confidence: ConfidenceResult): GhostScoreResult {
  const divergence = Math.abs((consensus.price - reference.price) / reference.price) * 100;
  const totalActivity = venues.reduce((sum, venue) => sum + venue.liquidity.activityUsd, 0);
  const totalLiquidity = venues.reduce((sum, venue) => sum + venue.liquidity.availableUsd, 0);
  const spread = venues.reduce((sum, venue) => sum + venue.liquidity.spreadBps, 0) / Math.max(1, venues.length);
  const divergenceSignal = Math.min(22, divergence * 25);
  const activitySignal = Math.min(18, totalActivity / 210_000);
  const liquiditySignal = Math.min(16, totalLiquidity / 310_000);
  const agreementSignal = confidence.score * 0.35;
  const spreadPenalty = Math.max(0, (spread - 18) * 0.28);
  const score = Math.round(Math.max(0, Math.min(100, 23 + divergenceSignal + activitySignal + liquiditySignal + agreementSignal - spreadPenalty)));
  return {
    score,
    label: score >= 78 ? "STRONG" : score >= 55 ? "WATCH" : "WEAK",
    factors: [
      { label: "Cross-market agreement", value: Math.round(confidence.score * 0.94), positive: true },
      { label: "Observed liquidity", value: Math.round(Math.min(100, totalLiquidity / 52_000)), positive: true },
      { label: "Persistent divergence", value: Math.round(Math.min(100, divergence * 64)), positive: divergence > 0.35 },
      { label: "Unusual activity", value: Math.round(Math.min(100, totalActivity / 27_000)), positive: true },
      { label: "Volatility risk", value: Math.round(Math.min(100, spread * 2.2)), positive: false },
    ],
  };
}
