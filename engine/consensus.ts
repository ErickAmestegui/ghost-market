import type { ConsensusResult, VenueObservation } from "@/data/types";

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

export function calculateGhostConsensus(venues: VenueObservation[]): ConsensusResult {
  if (!venues.length) return { price: 0, weights: [], activeVenueIds: [] };
  const maxLiquidity = Math.max(...venues.map((venue) => venue.liquidity.availableUsd));
  const maxActivity = Math.max(...venues.map((venue) => venue.liquidity.activityUsd));
  const medianPrice = median(venues.map((venue) => venue.price));

  const weighted = venues.map((venue) => {
    const deviationPct = Math.abs(venue.price - medianPrice) / medianPrice * 100;
    const factors = {
      liquidity: Math.sqrt(venue.liquidity.availableUsd / maxLiquidity),
      spread: 1 / (1 + venue.liquidity.spreadBps / 24),
      freshness: Math.exp(-venue.quoteAgeSeconds / 120),
      activity: Math.sqrt(venue.liquidity.activityUsd / maxActivity),
      agreement: 1 / (1 + deviationPct * 1.8),
      reliability: clamp(venue.reliability),
    };
    const score =
      factors.liquidity * 0.30 +
      factors.spread * 0.20 +
      factors.freshness * 0.18 +
      factors.activity * 0.14 +
      factors.agreement * 0.12 +
      factors.reliability * 0.06;
    return { venue, factors, score };
  });

  const totalScore = weighted.reduce((sum, item) => sum + item.score, 0);
  const weights = weighted.map(({ venue, score, factors }) => ({
    venueId: venue.id,
    score,
    weight: score / totalScore,
    factors,
  }));
  const price = weighted.reduce((sum, item, index) => sum + item.venue.price * weights[index].weight, 0);
  return { price, weights, activeVenueIds: venues.map((venue) => venue.id) };
}

