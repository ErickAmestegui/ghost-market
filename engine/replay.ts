import type { GhostSession, ReplayFrame, VenueObservation } from "@/data/types";

const lerp = (from: number, to: number, progress: number) => from + (to - from) * progress;

function interpolateVenue(from: VenueObservation, to: VenueObservation, progress: number): VenueObservation {
  return {
    ...from,
    price: lerp(from.price, to.price, progress),
    quoteAgeSeconds: Math.round(lerp(from.quoteAgeSeconds, to.quoteAgeSeconds, progress)),
    reliability: lerp(from.reliability, to.reliability, progress),
    liquidity: {
      availableUsd: Math.round(lerp(from.liquidity.availableUsd, to.liquidity.availableUsd, progress)),
      spreadBps: Math.round(lerp(from.liquidity.spreadBps, to.liquidity.spreadBps, progress)),
      activityUsd: Math.round(lerp(from.liquidity.activityUsd, to.liquidity.activityUsd, progress)),
    },
  };
}

export function getReplayFrame(session: GhostSession, progress: number): ReplayFrame {
  const clamped = Math.min(1, Math.max(0, progress));
  const targetMinute = clamped * session.frames.at(-1)!.atMinute;
  const nextIndex = session.frames.findIndex((frame) => frame.atMinute >= targetMinute);
  if (nextIndex <= 0) return session.frames[0];
  const next = session.frames[nextIndex];
  const previous = session.frames[nextIndex - 1];
  const localProgress = (targetMinute - previous.atMinute) / (next.atMinute - previous.atMinute);
  return {
    id: `interpolated-${targetMinute}`,
    atMinute: targetMinute,
    time: localProgress > 0.68 ? next.time : previous.time,
    eventIds: localProgress > 0.9 ? next.eventIds : previous.eventIds,
    venues: previous.venues.map((venue, index) => interpolateVenue(venue, next.venues[index], localProgress)),
  };
}

export function getCurrentEvent(session: GhostSession, progress: number) {
  const targetMinute = progress * session.frames.at(-1)!.atMinute;
  return [...session.events].reverse().find((event) => event.atMinute <= targetMinute) ?? session.events[0];
}

export function calculateReopenError(consensus: number, openPrice: number) {
  return Math.abs(consensus - openPrice) / openPrice * 100;
}

