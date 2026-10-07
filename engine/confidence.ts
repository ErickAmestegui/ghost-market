import type { ConfidenceResult, ConsensusResult, ReferencePrice, VenueObservation } from "@/data/types";

export function calculateGhostConfidence(reference: ReferencePrice, venues: VenueObservation[], consensus: ConsensusResult): ConfidenceResult {
  if (!venues.length || !consensus.price) return { score: 0, label: "LOW", evidence: [{ tone: "warning", label: "No active observations" }] };
  const deviations = venues.map((venue) => Math.abs(venue.price - consensus.price) / consensus.price * 100);
  const averageDeviation = deviations.reduce((sum, value) => sum + value, 0) / deviations.length;
  const totalLiquidity = venues.reduce((sum, venue) => sum + venue.liquidity.availableUsd, 0);
  const averageSpread = venues.reduce((sum, venue) => sum + venue.liquidity.spreadBps, 0) / venues.length;
  const averageAge = venues.reduce((sum, venue) => sum + venue.quoteAgeSeconds, 0) / venues.length;
  const sourceScore = Math.min(22, venues.length * 7.34);
  const agreementScore = Math.max(0, 28 - averageDeviation * 28);
  const liquidityScore = Math.min(22, totalLiquidity / 250_000);
  const spreadScore = Math.max(0, 17 - averageSpread * 0.32);
  const freshnessScore = Math.max(0, 11 - averageAge / 8);
  const score = Math.round(Math.min(100, sourceScore + agreementScore + liquidityScore + spreadScore + freshnessScore));
  const label = score >= 88 ? "HIGH" : score >= 76 ? "MODERATE–HIGH" : score >= 58 ? "MODERATE" : "LOW";
  const evidence: ConfidenceResult["evidence"] = [
    { tone: venues.length === 3 ? "positive" : "warning", label: `${venues.length} active observation${venues.length === 1 ? "" : "s"}` },
    { tone: totalLiquidity >= 3_000_000 ? "positive" : "warning", label: totalLiquidity >= 3_000_000 ? "Healthy observed liquidity" : "Limited observed liquidity" },
    { tone: averageDeviation < 0.45 ? "positive" : "warning", label: averageDeviation < 0.45 ? "Sources broadly agree" : "Sources are diverging" },
    { tone: averageAge < 30 ? "positive" : "warning", label: averageAge < 30 ? "Recent demo observations" : "One or more stale observations" },
    { tone: averageSpread < 24 ? "positive" : "warning", label: averageSpread < 24 ? "Spreads remain contained" : "Wider spreads reduce confidence" },
    { tone: "warning", label: `${reference.sourceStatus} reference · traditional market closed` },
  ];
  return { score, label, evidence };
}

