"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import type { GhostEvent } from "@/data/types";
import type { Locale } from "@/data/types";

export function ReplayControls({ progress, playing, currentTime, events, maxMinute, onPlay, onReset, onScrub, locale }: {
  progress: number;
  playing: boolean;
  currentTime: string;
  events: GhostEvent[];
  maxMinute: number;
  onPlay: () => void;
  onReset: () => void;
  onScrub: (progress: number) => void;
  locale: Locale;
}) {
  return <div className="replay-console">
    <div className="replay-actions">
      <button type="button" className="replay-primary" onClick={onPlay}>
        {playing ? <Pause/> : <Play/>}
        <span>{locale === "en" ? (playing ? "PAUSE THE NIGHT" : progress >= 1 ? "REPLAY AGAIN" : progress > 0 ? "CONTINUE THE NIGHT" : "REPLAY THE NIGHT") : (playing ? "PAUSAR LA NOCHE" : progress >= 1 ? "REPETIR" : progress > 0 ? "CONTINUAR LA NOCHE" : "REPRODUCIR LA NOCHE")}</span>
      </button>
      <button type="button" className="replay-reset" aria-label="Reiniciar replay" onClick={onReset}><RotateCcw/></button>
      <div className="replay-clock"><span>{locale === "en" ? "NIGHT CLOCK" : "RELOJ NOCTURNO"}</span><strong>{currentTime}</strong></div>
    </div>
    <div className="timeline-wrap">
      <input aria-label="Posición del Ghost Replay" type="range" min="0" max="1000" value={Math.round(progress * 1000)} onChange={(event) => onScrub(Number(event.target.value) / 1000)} />
      <div className="timeline-fill" style={{ width: `${progress * 100}%` }}/>
      {events.map((event) => <button
        key={event.id}
        type="button"
        className={`event-marker marker-${event.severity}`}
        style={{ left: `${event.atMinute / maxMinute * 100}%` }}
        onClick={() => onScrub(event.atMinute / maxMinute)}
        aria-label={`${event.time}: ${event.title}`}
      ><span><b>{event.time}</b>{event.title}</span></button>)}
    </div>
    <div className="timeline-labels"><span>4:00 PM · {locale === "en" ? "CLOSE" : "CIERRE"}</span><span>{locale === "en" ? "MIDNIGHT" : "MEDIANOCHE"}</span><span>9:29 AM · PRE-OPEN</span></div>
  </div>;
}

