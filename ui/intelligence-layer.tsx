"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Brain, ChevronDown, ChevronUp, Eye, Radio, Search, Sparkles, X } from "lucide-react";
import { PULSE_ITEMS } from "@/data/mock/intelligence";
import type { ConfidenceResult, ConsensusResult, GhostSession, Locale, SymbolKey, VenueObservation } from "@/data/types";
import type { GhostScoreResult } from "@/engine/ghost-score";

type Copy = { en: string; es: string };
const t = (locale: Locale, copy: Copy) => copy[locale];
const money = (value: number) => `$${value.toFixed(2)}`;

export function IntelligenceLayer({ locale, symbol, session, venues, consensus, confidence, ghostScore, onInvestigate, onReplayMoment }: {
  locale: Locale;
  symbol: SymbolKey;
  session: GhostSession;
  venues: VenueObservation[];
  consensus: ConsensusResult;
  confidence: ConfidenceResult;
  ghostScore: GhostScoreResult;
  onInvestigate: () => void;
  onReplayMoment: () => void;
}) {
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [researching, setResearching] = useState(false);
  const [researchStep, setResearchStep] = useState(0);
  const [researchDone, setResearchDone] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const divergence = ((consensus.price - session.close.price) / session.close.price) * 100;
  const totalLiquidity = venues.reduce((sum, venue) => sum + venue.liquidity.availableUsd, 0);
  const totalActivity = venues.reduce((sum, venue) => sum + venue.liquidity.activityUsd, 0);

  const researchSteps = locale === "en"
    ? ["Scanning markets", "Comparing prices", "Detecting anomalies", "Checking liquidity", "Filtering weak signals", "Checking social context", "Ranking discoveries", "Generating report"]
    : ["Escaneando mercados", "Comparando precios", "Detectando anomalías", "Revisando liquidez", "Filtrando señales débiles", "Revisando contexto social", "Ordenando hallazgos", "Generando informe"];

  useEffect(() => {
    if (!researching) return;
    if (researchStep >= researchSteps.length) {
      const done = setTimeout(() => { setResearching(false); setResearchDone(true); }, 450);
      return () => clearTimeout(done);
    }
    const timer = setTimeout(() => setResearchStep((step) => step + 1), 420);
    return () => clearTimeout(timer);
  }, [researching, researchStep, researchSteps.length]);

  const startResearch = () => { setResearchDone(false); setResearchStep(0); setResearching(true); };
  const questions = locale === "en"
    ? ["Find the strongest signal tonight.", "What is the strangest anomaly?", `Explain ${symbol} like I'm new to DeFi.`, "Show high-confidence anomalies only."]
    : ["Encuentra la señal más fuerte de esta noche.", "¿Cuál es la anomalía más extraña?", `Explica ${symbol} para alguien nuevo en DeFi.`, "Muestra solo anomalías de alta confianza."];

  const ask = (question: string) => {
    setAnswer(locale === "en"
      ? `${symbol} is the strongest current demo signal. Three tokenized markets moved above the frozen close; agreement is ${confidence.score}% and observed liquidity remains sufficient. This is evidence of coordinated repricing, not a forecast.`
      : `${symbol} es la señal demo actual más fuerte. Tres mercados tokenizados se movieron sobre el cierre congelado; el acuerdo es ${confidence.score}% y la liquidez observada sigue siendo suficiente. Es evidencia de repricing coordinado, no un pronóstico.`);
  };

  return <section className="intelligence-zone" id="ghost-ai">
    <div className="curiosity-hook" role="button" tabIndex={0} onClick={onReplayMoment} onKeyDown={(event) => event.key === "Enter" && onReplayMoment()}>
      <span>02:17 AM · {symbol}</span><strong>{t(locale, { en: "SOMETHING HAPPENED WHILE WALL STREET SLEPT.", es: "ALGO OCURRIÓ MIENTRAS WALL STREET DORMÍA." })}</strong><p>{t(locale, { en: "3 markets reacted. 1 market broke consensus. Ghost noticed.", es: "3 mercados reaccionaron. 1 rompió el consenso. Ghost lo detectó." })}</p><button>{t(locale, { en: "SEE WHAT HAPPENED", es: "VER QUÉ OCURRIÓ" })} <ArrowUpRight/></button>
    </div>

    <div className="intelligence-layout">
      <div className="intelligence-main">
        <section className="whisper-section" id="market">
          <div className="section-eyebrow"><Brain/> GHOST BRAIN · {t(locale, { en: "AUTONOMOUS DEMO ANALYSIS", es: "ANÁLISIS AUTÓNOMO DEMO" })}</div>
          <div className="whisper-head"><div><p>{t(locale, { en: "WHAT IS THE MARKET WHISPERING?", es: "¿QUÉ ESTÁ SUSURRANDO EL MERCADO?" })}</p><h2>{t(locale, { en: "THE MARKET IS UNEASY TONIGHT.", es: "EL MERCADO ESTÁ INQUIETO ESTA NOCHE." })}</h2></div><div className="score-orbit"><span>GHOST SCORE</span><strong>{ghostScore.score}</strong><small>/ 100 · {ghostScore.label}</small></div></div>
          <div className="signal-ribbon"><div><span>{t(locale, { en: "STRONGEST SIGNAL", es: "SEÑAL MÁS FUERTE" })}</span><strong>{symbol}</strong></div><div><span>GHOST CONSENSUS</span><strong>{money(consensus.price)}</strong></div><div><span>{t(locale, { en: "DIVERGENCE", es: "DIVERGENCIA" })}</span><strong>{divergence >= 0 ? "+" : ""}{divergence.toFixed(2)}%</strong></div><div><span>{t(locale, { en: "MARKETS AGREEING", es: "MERCADOS DE ACUERDO" })}</span><strong>3 / 3</strong></div></div>
          <blockquote>{t(locale, {
            en: "Something changed after Wall Street closed. The movement is broad, persistent and supported by observed liquidity. It does not currently resemble a single-pool pricing anomaly.",
            es: "Algo cambió después del cierre de Wall Street. El movimiento es amplio, persistente y está respaldado por la liquidez observada. Por ahora no parece una anomalía aislada de un solo pool.",
          })}</blockquote>
          <div className="intel-actions"><button onClick={onInvestigate}>{t(locale, { en: "INVESTIGATE", es: "INVESTIGAR" })}</button><button onClick={() => setEvidenceOpen((open) => !open)}><Eye/>{t(locale, { en: "SHOW EVIDENCE", es: "VER EVIDENCIA" })}</button><button onClick={() => document.getElementById("scenarios")?.scrollIntoView()}>{t(locale, { en: "RUN SCENARIOS", es: "EJECUTAR ESCENARIOS" })}</button><button onClick={() => document.getElementById("ask-ghost")?.scrollIntoView()}>ASK GHOST</button></div>
          {evidenceOpen && <EvidencePanel locale={locale} session={session} venues={venues} consensus={consensus} confidence={confidence} onClose={() => setEvidenceOpen(false)}/>} 
        </section>

        <section className="brain-ledger">
          <div className="brain-ledger-intro"><span>GHOST BRAIN / {symbol}</span><h2>{t(locale, { en: "FACTS FIRST. HYPOTHESES LABELED.", es: "PRIMERO LOS HECHOS. HIPÓTESIS ETIQUETADAS." })}</h2><p>{t(locale, { en: "Ghost separates what the data shows from what might explain it.", es: "Ghost separa lo que muestran los datos de lo que podría explicarlos." })}</p></div>
          <div className="brain-ledger-body">
            <LedgerRow label={t(locale, { en: "FACTS", es: "HECHOS" })} tone="fact" text={t(locale, { en: `All three observed markets price ${symbol} above the frozen close. Combined observed liquidity is ${(totalLiquidity / 1_000_000).toFixed(1)}M USD.`, es: `Los tres mercados observados valoran ${symbol} sobre el cierre congelado. La liquidez observada combinada es ${(totalLiquidity / 1_000_000).toFixed(1)}M USD.` })}/>
            <LedgerRow label={t(locale, { en: "EVIDENCE", es: "EVIDENCIA" })} tone="evidence" text={t(locale, { en: `Agreement is ${confidence.score}% with ${(totalActivity / 1_000_000).toFixed(1)}M USD in simulated activity.`, es: `El acuerdo es ${confidence.score}% con ${(totalActivity / 1_000_000).toFixed(1)}M USD de actividad simulada.` })}/>
            <LedgerRow label={t(locale, { en: "RISKS", es: "RIESGOS" })} tone="risk" text={t(locale, { en: "One venue has a wider spread and the traditional reference is stale while the market remains closed.", es: "Una fuente tiene un spread más amplio y la referencia tradicional está desactualizada mientras el mercado sigue cerrado." })}/>
            <LedgerRow label={t(locale, { en: "AI HYPOTHESIS", es: "HIPÓTESIS DE IA" })} tone="hypothesis" text={t(locale, { en: "Coordinated repricing is more plausible than a single-source error, but external catalysts are not confirmed.", es: "El repricing coordinado parece más plausible que un error aislado, pero no hay catalizadores externos confirmados." })}/>
            <LedgerRow label={t(locale, { en: "WHAT TO WATCH NEXT", es: "QUÉ OBSERVAR AHORA" })} tone="watch" text={t(locale, { en: "Whether the premium persists while spreads narrow and whether independent sources add context.", es: "Si la prima persiste mientras los spreads se reducen y si fuentes independientes aportan contexto." })}/>
          </div>
        </section>

        <section className="score-explainer">
          <button className="score-toggle" onClick={() => setScoreOpen((open) => !open)}><span><b>GHOST SCORE</b><small>{t(locale, { en: "Signal strength and evidence quality — not profit probability", es: "Fuerza de señal y calidad de evidencia; no probabilidad de ganancia" })}</small></span><strong>{ghostScore.score} / 100</strong>{scoreOpen ? <ChevronUp/> : <ChevronDown/>}</button>
          {scoreOpen && <div className="score-factors">{ghostScore.factors.map((factor) => <div key={factor.label}><span>{factor.positive ? "+" : "−"} {factor.label}</span><i><b style={{ width: `${factor.value}%` }}/></i><strong>{factor.value}</strong></div>)}</div>}
        </section>

        <Council locale={locale}/>
        <ScenarioEngine locale={locale} symbol={symbol} consensusPrice={consensus.price}/>

        <section className="research-lab" id="discover">
          <div><span>GHOST RESEARCH · DEMO</span><h2>{t(locale, { en: "LET GHOST INVESTIGATE THE NIGHT.", es: "DEJA QUE GHOST INVESTIGUE LA NOCHE." })}</h2><p>{t(locale, { en: "A deterministic research run compares prices, liquidity, anomalies, social context and recent patterns.", es: "Una investigación determinista compara precios, liquidez, anomalías, contexto social y patrones recientes." })}</p></div>
          {!researching && !researchDone && <button onClick={startResearch}><Sparkles/>{t(locale, { en: "FIND SOMETHING INTERESTING TONIGHT", es: "ENCONTRAR ALGO INTERESANTE ESTA NOCHE" })}</button>}
          {researching && <div className="research-progress"><strong>GHOST // RESEARCHING</strong>{researchSteps.map((step, index) => <span key={step} className={index < researchStep ? "done" : index === researchStep ? "active" : ""}><i/>{step}</span>)}</div>}
          {researchDone && <Discoveries locale={locale} onInvestigate={onInvestigate}/>} 
        </section>

        <section className="ask-ghost" id="ask-ghost">
          <div className="section-eyebrow"><Search/> ASK GHOST · {t(locale, { en: "EVIDENCE-LED QUERY", es: "CONSULTA BASADA EN EVIDENCIA" })}</div><h2>{t(locale, { en: "ASK ABOUT TONIGHT'S MARKET.", es: "PREGUNTA SOBRE EL MERCADO DE ESTA NOCHE." })}</h2><p>{t(locale, { en: "This is not a generic chatbot. Every answer stays tied to the current demo observations.", es: "No es un chatbot genérico. Cada respuesta se vincula a las observaciones demo actuales." })}</p>
          <div className="question-grid">{questions.map((question) => <button key={question} onClick={() => ask(question)}>{question}<ArrowUpRight/></button>)}</div>
          {answer && <div className="ghost-answer"><span>GHOST RESPONSE · DEMO ANALYSIS</span><p>{answer}</p><div><b>{symbol}</b><span>{money(consensus.price)}</span><span>{confidence.score}% confidence</span><span>{ghostScore.score} Ghost Score</span></div></div>}
        </section>
      </div>
      <GhostPulse locale={locale} symbol={symbol}/>
    </div>
  </section>;
}

function LedgerRow({ label, tone, text }: { label: string; tone: string; text: string }) {
  return <div className={`ledger-row ${tone}`}><span>{label}</span><p>{text}</p></div>;
}

function EvidencePanel({ locale, session, venues, consensus, confidence, onClose }: { locale: Locale; session: GhostSession; venues: VenueObservation[]; consensus: ConsensusResult; confidence: ConfidenceResult; onClose: () => void }) {
  return <div className="evidence-panel"><div className="evidence-head"><div><span>SHOW EVIDENCE · DEMO DATA</span><h3>{t(locale, { en: "TRACE THE CONCLUSION", es: "RASTREA LA CONCLUSIÓN" })}</h3></div><button aria-label={locale === "en" ? "Close evidence" : "Cerrar evidencia"} onClick={onClose}><X/></button></div><div className="evidence-columns"><div><b>DATA</b><p>{t(locale, { en: "Traditional reference", es: "Referencia tradicional" })}: {money(session.close.price)}</p>{venues.map((venue) => <p key={venue.id}>{venue.name}: {money(venue.price)} · ${(venue.liquidity.availableUsd / 1_000_000).toFixed(2)}M · {venue.liquidity.spreadBps} bps · {venue.quoteAgeSeconds}s</p>)}</div><div><b>ANALYSIS</b><p>Ghost Consensus: {money(consensus.price)}</p><p>Weighted Confidence: {confidence.score}%</p><p>{t(locale, { en: "Sources compared", es: "Fuentes comparadas" })}: {venues.length}</p></div><div><b>AI INTERPRETATION</b><p>{t(locale, { en: "Movement is coordinated and supported by observed liquidity.", es: "El movimiento es coordinado y está respaldado por liquidez observada." })}</p><em>{t(locale, { en: "HYPOTHESIS — external cause not confirmed", es: "HIPÓTESIS — causa externa no confirmada" })}</em></div></div></div>;
}

function Council({ locale }: { locale: Locale }) {
  const agents = [
    ["BULL AGENT", { en: "Movement is confirmed across several markets and persists after the initial divergence.", es: "El movimiento se confirma en varios mercados y persiste tras la divergencia inicial." }, "support"],
    ["BEAR AGENT", { en: "Volatility remains elevated; the premium could partially revert before the open.", es: "La volatilidad sigue elevada; la prima podría revertirse parcialmente antes de la apertura." }, "oppose"],
    ["LIQUIDITY AGENT", { en: "Liquidity is sufficient for analysis, although one venue remains weaker.", es: "La liquidez es suficiente para analizar, aunque una fuente sigue siendo más débil." }, "support"],
    ["SKEPTIC AGENT", { en: "No single-pool anomaly dominates, but social evidence is still limited.", es: "No domina una anomalía aislada, pero la evidencia social aún es limitada." }, "neutral"],
  ] as const;
  return <section className="council" id="council"><div className="section-eyebrow">GHOST COUNCIL · {t(locale, { en: "COMPETING PERSPECTIVES", es: "PERSPECTIVAS EN COMPETENCIA" })}</div><div className="council-layout"><div className="council-copy"><h2>{t(locale, { en: "THE SIGNAL IS DEBATED BEFORE IT IS JUDGED.", es: "LA SEÑAL SE DEBATE ANTES DE SER EVALUADA." })}</h2><p>{t(locale, { en: "Four analytical roles test the same evidence from different directions.", es: "Cuatro roles analíticos prueban la misma evidencia desde distintos ángulos." })}</p></div><div className="agent-list">{agents.map(([name, copy, stance]) => <div className={`agent-row ${stance}`} key={name}><span>{name}</span><p>“{t(locale, copy)}”</p><b>{stance === "support" ? "SUPPORTS" : stance === "oppose" ? "CHALLENGES" : "CAUTION"}</b></div>)}<div className="judge-row"><span>JUDGE AGENT</span><strong>2 / 4 {t(locale, { en: "support · 1 challenge · 1 caution", es: "apoyan · 1 cuestiona · 1 pide cautela" })}</strong><p>{t(locale, { en: "Assessment: moderately strong · 78% confidence", es: "Evaluación: moderadamente fuerte · 78% de confianza" })}</p></div></div></div></section>;
}

function ScenarioEngine({ locale, symbol, consensusPrice }: { locale: Locale; symbol: SymbolKey; consensusPrice: number }) {
  const scenarios = [
    ["BULL", consensusPrice * 1.009, 32, { en: "Premium persists and liquidity increases.", es: "La prima persiste y aumenta la liquidez." }],
    ["BASE", consensusPrice * 0.999, 51, { en: "Markets stabilize near the observed consensus.", es: "Los mercados se estabilizan cerca del consenso observado." }],
    ["BEAR", consensusPrice * 0.981, 17, { en: "Premium fades as spreads widen.", es: "La prima desaparece mientras aumentan los spreads." }],
  ] as const;
  const [open, setOpen] = useState("BASE");
  return <section className="scenario-engine" id="scenarios"><div className="section-eyebrow">SCENARIO ENGINE · {symbol} · DEMO</div><div className="scenario-head"><h2>{t(locale, { en: "MULTIPLE FUTURES. NO GUARANTEES.", es: "MÚLTIPLES FUTUROS. SIN GARANTÍAS." })}</h2><p>{t(locale, { en: "Analytical scenarios describe conditions—not investment outcomes.", es: "Los escenarios analíticos describen condiciones, no resultados de inversión." })}</p></div><div className="scenario-track">{scenarios.map(([name, price, probability, condition]) => <button key={name} onClick={() => setOpen(name)} className={open === name ? "active" : ""}><span>{name}</span><strong>{money(price)}</strong><i style={{ width: `${probability}%` }}/><b>{probability}%</b>{open === name && <p><em>{t(locale, { en: "WHAT WOULD NEED TO HAPPEN", es: "QUÉ TENDRÍA QUE OCURRIR" })}</em>{t(locale, condition)}</p>}</button>)}</div><small>{t(locale, { en: "Probabilities are deterministic demo scenarios, not financial advice.", es: "Las probabilidades son escenarios demo deterministas, no asesoramiento financiero." })}</small></section>;
}

function Discoveries({ locale, onInvestigate }: { locale: Locale; onInvestigate: () => void }) {
  const items = [["#1", "NVDA", 91, { en: "Strong coordinated divergence", es: "Fuerte divergencia coordinada" }], ["#2", "TSLA", 82, { en: "Unusual activity with wider spreads", es: "Actividad inusual con spreads más amplios" }], ["#3", "AAPL", 76, { en: "Cross-market disagreement", es: "Desacuerdo entre mercados" }]] as const;
  return <div className="discoveries"><span>TONIGHT&apos;S DISCOVERIES · DEMO DATA</span>{items.map(([rank, symbol, score, description]) => <button key={symbol} onClick={onInvestigate}><b>{rank}</b><strong>{symbol}</strong><p>{t(locale, description)}</p><em>GHOST SCORE {score}</em><ArrowUpRight/></button>)}</div>;
}

function GhostPulse({ locale, symbol }: { locale: Locale; symbol: SymbolKey }) {
  const [collapsed, setCollapsed] = useState(false);
  const [filter, setFilter] = useState<"all" | "support" | "challenge">("all");
  const items = useMemo(() => PULSE_ITEMS[symbol].filter((item) => filter === "all" || item.stance === filter), [filter, symbol]);
  return <aside className={`ghost-pulse ${collapsed ? "collapsed" : ""}`} id="pulse"><button className="pulse-collapse" onClick={() => setCollapsed((value) => !value)} aria-expanded={!collapsed}><Radio/><span>GHOST PULSE</span>{collapsed ? <ChevronDown/> : <ChevronUp/>}</button>{!collapsed && <><div className="pulse-summary"><span>SOCIAL NARRATIVE · DEMO DATA</span><h3>{t(locale, { en: `Internet discussion cautiously supports the ${symbol} signal.`, es: `La conversación en internet apoya con cautela la señal de ${symbol}.` })}</h3><div><p><b>1</b>{t(locale, { en: "high-trust support", es: "apoyo de alta confianza" })}</p><p><b>1</b>{t(locale, { en: "credible challenge", es: "objeción creíble" })}</p><p><b>1</b>{t(locale, { en: "neutral context", es: "contexto neutral" })}</p></div><small>SOCIAL CONFIDENCE · MODERATE</small></div><div className="pulse-filters"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>{t(locale, { en: "All", es: "Todo" })}</button><button className={filter === "support" ? "active" : ""} onClick={() => setFilter("support")}>{t(locale, { en: "Supports", es: "Apoya" })}</button><button className={filter === "challenge" ? "active" : ""} onClick={() => setFilter("challenge")}>{t(locale, { en: "Challenges", es: "Cuestiona" })}</button></div><div className="pulse-feed">{items.map((item) => <article key={item.id}><header><span>{item.platform}</span><b>POST-CLOSE</b><time>{item.minutesAgo}m</time></header><h4>{item.source}</h4><p>“{item.excerpt[locale]}”</p><footer><span>TRUST {item.trust}</span><b className={item.stance}>{item.stance === "support" ? "SUPPORTS GHOST" : item.stance === "challenge" ? "CHALLENGES GHOST" : "NEUTRAL CONTEXT"}</b></footer></article>)}</div><div className="pulse-interpretation"><span>GHOST INTERPRETATION</span><p>{t(locale, { en: "High-trust sources acknowledge the divergence, while one credible source keeps liquidity risk in view.", es: "Fuentes de alta confianza reconocen la divergencia, mientras una fuente creíble mantiene visible el riesgo de liquidez." })}</p></div><small className="reputation-note">DEMO REPUTATION MODEL · {t(locale, { en: "No fabricated accuracy history", es: "Sin historial de precisión inventado" })}</small></>}
  </aside>;
}
