import assert from "node:assert/strict";
import test from "node:test";
import { MOCK_SESSIONS } from "../data/mock/sessions.ts";
import { calculateGhostConfidence } from "../engine/confidence.ts";
import { calculateGhostConsensus } from "../engine/consensus.ts";
import { calculateGhostScore } from "../engine/ghost-score.ts";
import { getReplayFrame } from "../engine/replay.ts";

test("every demo asset produces one bounded, deterministic Ghost Score", () => {
  for (const symbol of ["NVDA", "AAPL", "TSLA"] as const) {
    const session = MOCK_SESSIONS[symbol];
    const frame = getReplayFrame(session, 0.68);
    const consensus = calculateGhostConsensus(frame.venues);
    const confidence = calculateGhostConfidence(session.close, frame.venues, consensus);
    const first = calculateGhostScore(session.close, frame.venues, consensus, confidence);
    const second = calculateGhostScore(session.close, frame.venues, consensus, confidence);
    assert.deepEqual(first, second);
    assert.ok(first.score >= 0 && first.score <= 100);
    assert.equal(consensus.activeVenueIds.length, 3);
  }
});

test("weakening an outlier reduces its consensus influence", () => {
  const frame = getReplayFrame(MOCK_SESSIONS.AAPL, 0.68);
  const baseline = calculateGhostConsensus(frame.venues);
  const stressed = calculateGhostConsensus(frame.venues.map((venue) => venue.id === "b" ? { ...venue, quoteAgeSeconds: 83, reliability: 0.62, liquidity: { ...venue.liquidity, availableUsd: venue.liquidity.availableUsd * 0.18, spreadBps: 96 } } : venue));
  const before = baseline.weights.find((item) => item.venueId === "b")!.weight;
  const after = stressed.weights.find((item) => item.venueId === "b")!.weight;
  assert.ok(after < before);
});
