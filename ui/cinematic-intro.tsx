"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/data/types";

export function CinematicIntro({ locale, onDone }: { locale: Locale; onDone: () => void }) {
  const [scene, setScene] = useState(0);
  useEffect(() => {
    if (sessionStorage.getItem("ghost-intro-seen")) { onDone(); return; }
    const timers = [900, 2300, 3900, 5600, 7400].map((time, index) => setTimeout(() => setScene(index + 1), time));
    const finish = setTimeout(() => { sessionStorage.setItem("ghost-intro-seen", "1"); onDone(); }, 8900);
    return () => { timers.forEach(clearTimeout); clearTimeout(finish); };
  }, [onDone]);
  const finish = () => { sessionStorage.setItem("ghost-intro-seen", "1"); onDone(); };
  return <div className="cinematic-intro" role="dialog" aria-label={locale === "en" ? "Ghost Market introduction" : "Introducción de Ghost Market"}>
    <button className="skip-intro" onClick={finish}>{locale === "en" ? "SKIP INTRO" : "SALTAR INTRO"} →</button>
    <div className={`intro-scene scene-${scene}`}>
      {scene <= 1 && <div><small>NEW YORK · 4:00 PM ET</small><h1>{locale === "en" ? "WALL STREET IS CLOSED." : "WALL STREET ESTÁ CERRADO."}</h1></div>}
      {scene === 2 && <div><small>{locale === "en" ? "BUT NVDA IS STILL MOVING." : "PERO NVDA SIGUE MOVIÉNDOSE."}</small><h1>NVDA</h1><p className="intro-tape">$184.42 <i>→</i> $184.47 <i>→</i> $184.39 <i>→</i> <b>$184.51</b></p></div>}
      {scene === 3 && <div><small>3 TOKENIZED MARKETS</small><h1>{locale === "en" ? "ARE STILL TRADING." : "SIGUEN OPERANDO."}</h1><p className="intro-sources"><span>HELIX MARKET</span><span>ORBIT DESK</span><span>LUMEN POOL</span></p></div>}
      {scene === 4 && <div><small>{locale === "en" ? "THEY DON'T AGREE." : "NO ESTÁN DE ACUERDO."}</small><h1>GHOST IS LISTENING.</h1><p className="intro-checks"><span>Checking liquidity...</span><span>Checking freshness...</span><span>Comparing market signals...</span><span>Detecting divergence...</span></p></div>}
      {scene >= 5 && <div className="intro-consensus"><small>GHOST CONSENSUS</small><h1>$184.44</h1><p>88% CONFIDENCE</p><span>GHOST MARKET // AWAKE</span></div>}
    </div>
  </div>;
}
