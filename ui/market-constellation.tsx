"use client";

import type { CSSProperties } from "react";
import type { ConfidenceResult, ConsensusResult, GhostEvent, Locale, ReferencePrice, VenueObservation } from "@/data/types";

const money = (value: number) => `$${value.toFixed(2)}`;
const compact = (value: number) => new Intl.NumberFormat("en-US", { notation: "compact", style: "currency", currency: "USD", maximumFractionDigits: 1 }).format(value);

const PATHS = {
  a: "M205 135 C320 160 360 230 480 280",
  b: "M755 120 C635 150 610 225 480 280",
  c: "M760 455 C635 420 605 335 480 280",
} as const;

export function MarketConstellation({
  reference,
  venues,
  consensus,
  confidence,
  removedIds,
  breakMode,
  currentEvent,
  onVenue,
  locale,
}: {
  reference: ReferencePrice;
  venues: VenueObservation[];
  consensus: ConsensusResult;
  confidence: ConfidenceResult;
  removedIds: Set<string>;
  breakMode: boolean;
  currentEvent: GhostEvent;
  onVenue: (venue: VenueObservation) => void;
  locale: Locale;
}) {
  const divergence = ((consensus.price - reference.price) / reference.price) * 100;
  const weightFor = (id: string) => consensus.weights.find((weight) => weight.venueId === id)?.weight ?? 0;

  return (
    <div className="constellation" aria-label="Market Constellation">
      <div className="constellation-grid" aria-hidden="true" />
      <svg className="constellation-links" viewBox="0 0 960 560" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <filter id="ghost-glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        {venues.map((venue) => {
          const removed = removedIds.has(venue.id);
          const weight = weightFor(venue.id);
          const activeEvent = currentEvent.venueId === venue.id;
          return <g key={venue.id} className={removed ? "link-removed" : activeEvent ? "link-alert" : ""}>
            <path d={PATHS[venue.id]} className="influence-link" style={{ "--weight": Math.max(1.2, weight * 13) } as CSSProperties}/>
            {!removed && <circle r="3.4" className="signal-particle"><animateMotion dur={`${Math.max(1.4, 3.1 - weight * 3)}s`} repeatCount="indefinite" path={PATHS[venue.id]}/></circle>}
          </g>;
        })}
        <path d="M190 458 C320 420 360 345 480 280" className="reference-link" />
      </svg>

      {venues.map((venue) => {
        const weight = weightFor(venue.id);
        const removed = removedIds.has(venue.id);
        const activeEvent = currentEvent.venueId === venue.id;
        return <button
          key={venue.id}
          type="button"
          onClick={() => onVenue(venue)}
          aria-pressed={removed}
          className={`constellation-node node-${venue.id} ${removed ? "is-removed" : ""} ${activeEvent ? "has-event" : ""}`}
        >
          <span className="node-heading"><span><i/>{venue.name}</span><em>{venue.sourceStatus}</em></span>
          <strong>{money(venue.price)}</strong>
          <span className="node-influence"><span style={{ width: `${weight * 100}%` }}/></span>
          <span className="node-meta"><b>{removed ? (locale === "en" ? "SOURCE REMOVED" : "FUENTE RETIRADA") : `${Math.round(weight * 100)}% ${locale === "en" ? "INFLUENCE" : "INFLUENCIA"}`}</b><span>{compact(venue.liquidity.availableUsd)} · {venue.liquidity.spreadBps} BPS</span></span>
        </button>;
      })}

      <div className="constellation-node reference-node">
        <span className="node-heading"><span>{locale === "en" ? "TRADITIONAL CLOSE" : "CIERRE TRADICIONAL"}</span><em>{reference.sourceStatus}</em></span>
        <strong>{money(reference.price)}</strong>
        <span className="frozen-signal">{locale === "en" ? "FROZEN" : "CONGELADO"} · {reference.capturedAt}</span>
      </div>

      <div className="ghost-core">
        <span className="ghost-orbit orbit-one"/>
        <span className="ghost-orbit orbit-two"/>
        <span className="core-label">GHOST CONSENSUS</span>
        <strong>{money(consensus.price)}</strong>
        <span className={`core-divergence ${divergence < 0 ? "negative" : ""}`}>{divergence >= 0 ? "+" : ""}{divergence.toFixed(2)}% {locale === "en" ? "VS CLOSE" : "VS CIERRE"}</span>
        <span className="core-confidence"><b>{confidence.score}%</b> {locale === "en" ? "CONFIDENCE" : "CONFIANZA"}</span>
      </div>

      <div className={`constellation-event severity-${currentEvent.severity}`}>
        <span>{currentEvent.time}</span><strong>{currentEvent.title}</strong><p>{locale === "en" ? eventEnglish(currentEvent) : currentEvent.detail}</p>
      </div>
      <div className="constellation-mode">{breakMode ? (locale === "en" ? "OUTLIER EXPERIMENT IN PROGRESS" : "EXPERIMENTO DE OUTLIER EN CURSO") : (locale === "en" ? "OBSERVING NORMALIZED MARKET SIGNALS" : "OBSERVANDO SEÑALES NORMALIZADAS")}</div>
    </div>
  );
}

function eventEnglish(event: GhostEvent) {
  if (event.id === "break") return event.detail;
  const details: Record<GhostEvent["type"], string> = {
    MARKET_CLOSE: "The traditional reference freezes while tokenized markets continue.",
    ACTIVITY_CHANGE: "On-chain observations begin to separate from the frozen reference.",
    PRICE_DIVERGENCE: "Orbit Desk moves away from the group as its spread widens.",
    LIQUIDITY_DROP: "Orbit Desk loses depth and therefore loses influence.",
    CONSENSUS_SHIFT: "A fresh Lumen Pool observation moves the weighted consensus.",
    VENUE_RECOVERY: "The three observations begin to converge again.",
    CONSENSUS_STABLE: "Agreement improves before the traditional market opens.",
  };
  return details[event.type];
}

