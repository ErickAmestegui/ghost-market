"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Brain, ChevronDown, ChevronUp, Eye, Radio, Search, Sparkles, X } from "lucide-react";
import { marketDataAdapter } from "@/data/adapters";
import { PULSE_ITEMS } from "@/data/mock/intelligence";
import type { ConfidenceResult, ConsensusResult, GhostSession, Locale, SymbolKey, VenueObservation } from "@/data/types";
import { calculateGhostConfidence } from "@/engine/confidence";
import { calculateGhostConsensus } from "@/engine/consensus";
import { calculateGhostScore, type GhostScoreResult } from "@/engine/ghost-score";
import { getReplayFrame } from "@/engine/replay";

type Copy = { en: string; es: string };
const t = (locale: Locale, copy: Copy) => copy[locale];
const money = (value: number) => `$${value.toFixed(2)}`;

function researchScore(symbol: SymbolKey) {
  const session = marketDataAdapter.getSession(symbol);
  const frame = getReplayFrame(session, 0.68);
  const consensus = calculateGhostConsensus(frame.venues);
  const confidence = calculateGhostConfidence(session.close, frame.venues, consensus);
  return calculateGhostScore(session.close, frame.venues, consensus, confidence).score;
}

type GuidedAnswer = { question: string; fact: string; inference: string; sources: string; limited: boolean };

export function IntelligenceLayer({ locale, symbol, session, venues, consensus, confidence, ghostScore, onInvestigate, onReplayMoment, onSelectSymbol }: {
  locale: Locale;
  symbol: SymbolKey;
  session: GhostSession;
  venues: VenueObservation[];
  consensus: ConsensusResult;
  confidence: ConfidenceResult;
  ghostScore: GhostScoreResult;
  onInvestigate: () => void;
  onReplayMoment: () => void;
  onSelectSymbol: (symbol: SymbolKey) => void;
}) {
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [researching, setResearching] = useState(false);
  const [researchStep, setResearchStep] = useState(0);
  const [researchDone, setResearchDone] = useState(false);
  const [answer, setAnswer] = useState<GuidedAnswer | null>(null);
  const [customQuestion, setCustomQuestion] = useState("");
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
    const supported = /signal|anomal|explain|confidence|market|señal|anomal|explica|confianza|mercado/i.test(question);
    const anomalyQuestion = /strangest anomaly|anomalía más extraña/i.test(question);
    setAnswer({
      question,
      fact: anomalyQuestion ? (locale === "en" ? `DEMO VENUE B is the strangest anomaly: it has the widest spread (${venues[1]?.liquidity.spreadBps ?? "—"} bps) and the largest visible price separation in this replay.` : `DEMO VENUE B es la anomalía más extraña: tiene el spread más amplio (${venues[1]?.liquidity.spreadBps ?? "—"} bps) y la mayor separación visible de precio en este replay.`) : (locale === "en" ? `Three simulated tokenized markets price ${symbol} above the frozen reference. Their calculated agreement is ${confidence.score}%.` : `Tres mercados tokenizados simulados valoran ${symbol} sobre la referencia congelada. Su acuerdo calculado es ${confidence.score}%.`),
      inference: anomalyQuestion ? (locale === "en" ? "Its weaker freshness, spread and liquidity make it a candidate outlier; the engine therefore reduces its influence instead of treating it as truth." : "Su menor frescura, spread y liquidez lo convierten en posible outlier; el motor reduce su influencia en vez de tratarlo como verdad.") : supported ? (locale === "en" ? "The observations are consistent with coordinated repricing, but they do not establish a cause or predict the next open." : "Las observaciones son compatibles con un repricing coordinado, pero no demuestran una causa ni predicen la próxima apertura.") : (locale === "en" ? "There is not enough evidence in this demo to answer that question reliably." : "No hay evidencia suficiente en esta demo para responder esa pregunta de forma fiable."),
      sources: `${venues.map((venue) => venue.name).join(" · ")} · ${t(locale, { en: "frozen traditional reference", es: "referencia tradicional congelada" })}`,
      limited: !supported,
    });
  };

  const selectDiscovery = (next: SymbolKey) => {
    onSelectSymbol(next);
    setEvidenceOpen(true);
    setTimeout(() => document.getElementById("market")?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  return <section className="intelligence-zone" id="ghost-ai">
    <div className="curiosity-hook" role="button" tabIndex={0} onClick={onReplayMoment} onKeyDown={(event) => event.key === "Enter" && onReplayMoment()}>
      <span>02:17 AM · {symbol}</span><strong>{t(locale, { en: "SOMETHING HAPPENED WHILE WALL STREET SLEPT.", es: "ALGO OCURRIÓ MIENTRAS WALL STREET DORMÍA." })}</strong><p>{t(locale, { en: "3 markets reacted. 1 market broke consensus. Ghost noticed.", es: "3 mercados reaccionaron. 1 rompió el consenso. Ghost lo detectó." })}</p><button>{t(locale, { en: "SEE WHAT HAPPENED", es: "VER QUÉ OCURRIÓ" })} <ArrowUpRight/></button>
    </div>

    <div className="intelligence-layout">
      <div className="intelligence-main">
        <section className="whisper-section" id="market">
          <div className="section-eyebrow"><Brain/> GHOST BRAIN · {t(locale, { en: "DETERMINISTIC DEMO ANALYSIS", es: "ANÁLISIS DEMO DETERMINISTA" })}</div>
          <div className="whisper-head"><div><p>{t(locale, { en: "WHAT IS THE MARKET WHISPERING?", es: "¿QUÉ ESTÁ SUSURRANDO EL MERCADO?" })}</p><h2>{t(locale, { en: "THE MARKET IS UNEASY TONIGHT.", es: "EL MERCADO ESTÁ INQUIETO ESTA NOCHE." })}</h2></div><div className="score-orbit"><span>GHOST SCORE</span><strong>{ghostScore.score}</strong><small>/ 100 · {ghostScore.label}</small></div></div>
          <div className="signal-ribbon"><div><span>{t(locale, { en: "STRONGEST SIGNAL", es: "SEÑAL MÁS FUERTE" })}</span><strong>{symbol}</strong></div><div><span>GHOST CONSENSUS</span><strong>{money(consensus.price)}</strong></div><div><span>{t(locale, { en: "DIVERGENCE", es: "DIVERGENCIA" })}</span><strong>{divergence >= 0 ? "+" : ""}{divergence.toFixed(2)}%</strong></div><div><span>{t(locale, { en: "MARKETS AGREEING", es: "MERCADOS DE ACUERDO" })}</span><strong>3 / 3</strong></div></div>
          <blockquote>{t(locale, {
            en: "Something changed after Wall Street closed. The movement is broad, persistent and supported by observed liquidity. It does not currently resemble a single-pool pricing anomaly.",
            es: "Algo cambió después del cierre de Wall Street. El movimiento es amplio, persistente y está respaldado por la liquidez observada. Por ahora no parece una anomalía aislada de un solo pool.",
          })}</blockquote>
          <div className="intel-actions"><button onClick={onInvestigate}>{t(locale, { en: "INVESTIGATE", es: "INVESTIGAR" })}</button><button onClick={() => document.getElementById("evidence")?.scrollIntoView({ behavior: "smooth" })}><Eye/>{t(locale, { en: "SHOW EVIDENCE", es: "VER EVIDENCIA" })}</button><button onClick={() => document.getElementById("scenarios")?.scrollIntoView({ behavior: "smooth" })}>{t(locale, { en: "RUN SCENARIOS", es: "EJECUTAR ESCENARIOS" })}</button><button onClick={() => document.getElementById("guided-questions")?.scrollIntoView({ behavior: "smooth" })}>{t(locale, { en: "ASK A QUESTION", es: "HACER UNA PREGUNTA" })}</button></div>
          {evidenceOpen && <EvidencePanel locale={locale} session={session} venues={venues} consensus={consensus} confidence={confidence} onClose={() => setEvidenceOpen(false)}/>} 
        </section>

        <section className="brain-ledger">
          <div className="brain-ledger-intro"><span>GHOST BRAIN / {symbol}</span><h2>{t(locale, { en: "FACTS FIRST. HYPOTHESES LABELED.", es: "PRIMERO LOS HECHOS. HIPÓTESIS ETIQUETADAS." })}</h2><p>{t(locale, { en: "Ghost separates what the data shows from what might explain it.", es: "Ghost separa lo que muestran los datos de lo que podría explicarlos." })}</p></div>
          <div className="brain-ledger-body">
            <LedgerRow label={t(locale, { en: "FACTS", es: "HECHOS" })} tone="fact" text={t(locale, { en: `All three observed markets price ${symbol} above the frozen close. Combined observed liquidity is ${(totalLiquidity / 1_000_000).toFixed(1)}M USD.`, es: `Los tres mercados observados valoran ${symbol} sobre el cierre congelado. La liquidez observada combinada es ${(totalLiquidity / 1_000_000).toFixed(1)}M USD.` })}/>
            <LedgerRow label={t(locale, { en: "EVIDENCE", es: "EVIDENCIA" })} tone="evidence" text={t(locale, { en: `Agreement is ${confidence.score}% with ${(totalActivity / 1_000_000).toFixed(1)}M USD in simulated activity.`, es: `El acuerdo es ${confidence.score}% con ${(totalActivity / 1_000_000).toFixed(1)}M USD de actividad simulada.` })}/>
            <LedgerRow label={t(locale, { en: "RISKS", es: "RIESGOS" })} tone="risk" text={t(locale, { en: "One venue has a wider spread and the traditional reference is stale while the market remains closed.", es: "Una fuente tiene un spread más amplio y la referencia tradicional está desactualizada mientras el mercado sigue cerrado." })}/>
            <LedgerRow label={t(locale, { en: "UNCONFIRMED HYPOTHESIS", es: "HIPÓTESIS NO CONFIRMADA" })} tone="hypothesis" text={t(locale, { en: "Coordinated repricing is more plausible than a single-source error, but external catalysts are not confirmed.", es: "El repricing coordinado parece más plausible que un error aislado, pero no hay catalizadores externos confirmados." })}/>
            <LedgerRow label={t(locale, { en: "WHAT TO WATCH NEXT", es: "QUÉ OBSERVAR AHORA" })} tone="watch" text={t(locale, { en: "Whether the premium persists while spreads narrow and whether independent sources add context.", es: "Si la prima persiste mientras los spreads se reducen y si fuentes independientes aportan contexto." })}/>
          </div>
        </section>

        <section className="score-explainer">
          <button className="score-toggle" onClick={() => setScoreOpen((open) => !open)}><span><b>GHOST SCORE</b><small>{t(locale, { en: "Signal strength and evidence quality — not profit probability", es: "Fuerza de señal y calidad de evidencia; no probabilidad de ganancia" })}</small></span><strong>{ghostScore.score} / 100</strong>{scoreOpen ? <ChevronUp/> : <ChevronDown/>}</button>
          {scoreOpen && <div className="score-factors">{ghostScore.factors.map((factor) => <div key={factor.label}><span>{factor.positive ? "+" : "−"} {factor.label}</span><i><b style={{ width: `${factor.value}%` }}/></i><strong>{factor.value}</strong></div>)}</div>}
        </section>

        <ScoreRelationship locale={locale}/>

        <Council locale={locale}/>
        <ScenarioEngine locale={locale} symbol={symbol} consensusPrice={consensus.price}/>

        <section className="research-lab" id="discover">
          <div><span>DETERMINISTIC DEMO RESEARCH · SIMULATED</span><h2>{t(locale, { en: "LET GHOST INVESTIGATE THE NIGHT.", es: "DEJA QUE GHOST INVESTIGUE LA NOCHE." })}</h2><p>{t(locale, { en: "A deterministic research run compares simulated prices, liquidity, anomalies and context. It is not an autonomous live agent.", es: "Una investigación determinista compara precios simulados, liquidez, anomalías y contexto. No es un agente autónomo conectado en vivo." })}</p></div>
          {!researching && !researchDone && <button onClick={startResearch}><Sparkles/>{t(locale, { en: "FIND SOMETHING INTERESTING TONIGHT", es: "ENCONTRAR ALGO INTERESANTE ESTA NOCHE" })}</button>}
          {researching && <div className="research-progress"><strong>GHOST // RESEARCHING</strong>{researchSteps.map((step, index) => <span key={step} className={index < researchStep ? "done" : index === researchStep ? "active" : ""}><i/>{step}</span>)}</div>}
          {researchDone && <Discoveries locale={locale} onSelect={selectDiscovery}/>} 
        </section>

        <section className="ask-ghost" id="guided-questions">
          <div className="section-eyebrow"><Search/> {t(locale, { en: "GUIDED QUESTIONS", es: "PREGUNTAS GUIADAS" })} · SIMULATED</div><h2>{t(locale, { en: "QUESTION THE EVIDENCE.", es: "INTERROGA LA EVIDENCIA." })}</h2><p>{t(locale, { en: "A deterministic explainer limited to the observations in this demo. It is not an open chatbot and never gives financial advice.", es: "Un explicador determinista limitado a las observaciones de esta demo. No es un chatbot abierto ni ofrece asesoramiento financiero." })}</p>
          <form className="guided-question-form" onSubmit={(event) => { event.preventDefault(); if (customQuestion.trim()) ask(customQuestion.trim()); }}><label htmlFor="ghost-question">{t(locale, { en: "Ask about the current evidence", es: "Pregunta sobre la evidencia actual" })}</label><div><input id="ghost-question" value={customQuestion} onChange={(event) => setCustomQuestion(event.target.value)} placeholder={t(locale, { en: `What supports the ${symbol} signal?`, es: `¿Qué respalda la señal de ${symbol}?` })}/><button disabled={!customQuestion.trim()} type="submit">{t(locale, { en: "CHECK EVIDENCE", es: "REVISAR EVIDENCIA" })}</button></div></form>
          <div className="question-grid">{questions.map((question) => <button key={question} onClick={() => ask(question)}>{question}<ArrowUpRight/></button>)}</div>
          {answer && <div className={`ghost-answer ${answer.limited ? "limited" : ""}`}><span>GUIDED RESPONSE · SIMULATED ANALYSIS</span><h3>{answer.question}</h3><dl><div><dt>{t(locale, { en: "FACTS", es: "HECHOS" })}</dt><dd>{answer.fact}</dd></div><div><dt>{t(locale, { en: "INFERENCE", es: "INFERENCIA" })}</dt><dd>{answer.inference}</dd></div><div><dt>{t(locale, { en: "OBSERVATIONS USED", es: "OBSERVACIONES UTILIZADAS" })}</dt><dd>{answer.sources}</dd></div></dl><div><b>{symbol}</b><span>{money(consensus.price)}</span><span>{confidence.score}% confidence</span><span>{ghostScore.score} Ghost Score</span></div></div>}
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
  return <div className="evidence-panel"><div className="evidence-head"><div><span>SHOW EVIDENCE · SIMULATED</span><h3>{t(locale, { en: "TRACE THE CONCLUSION", es: "RASTREA LA CONCLUSIÓN" })}</h3></div><button aria-label={locale === "en" ? "Close evidence" : "Cerrar evidencia"} onClick={onClose}><X/></button></div><div className="evidence-columns"><div><b>{t(locale, { en: "SIMULATED DATA", es: "DATOS SIMULADOS" })}</b><p>{t(locale, { en: "Traditional reference", es: "Referencia tradicional" })}: {money(session.close.price)}</p>{venues.map((venue) => <p key={venue.id}>{venue.name}: {money(venue.price)} · ${(venue.liquidity.availableUsd / 1_000_000).toFixed(2)}M · {venue.liquidity.spreadBps} bps · {venue.quoteAgeSeconds}s</p>)}</div><div><b>{t(locale, { en: "DETERMINISTIC ANALYSIS", es: "ANÁLISIS DETERMINISTA" })}</b><p>Ghost Consensus: {money(consensus.price)}</p><p>Weighted Confidence: {confidence.score}%</p><p>{t(locale, { en: "Sources compared", es: "Fuentes comparadas" })}: {venues.length}</p></div><div><b>{t(locale, { en: "LABELED INFERENCE", es: "INFERENCIA ETIQUETADA" })}</b><p>{t(locale, { en: "Movement is coordinated and supported by observed liquidity.", es: "El movimiento es coordinado y está respaldado por liquidez observada." })}</p><em>{t(locale, { en: "HYPOTHESIS — external cause not confirmed", es: "HIPÓTESIS — causa externa no confirmada" })}</em></div></div></div>;
}

function ScoreRelationship({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const metrics = [
    ["GHOST SCORE", { en: "Overall signal strength and evidence quality.", es: "Fuerza general de la señal y calidad de evidencia." }],
    ["MARKET AGREEMENT", { en: "How closely the observed markets match.", es: "Qué tan cerca coinciden los mercados observados." }],
    ["CONSENSUS CONFIDENCE", { en: "Reliability of the weighted aggregate price.", es: "Fiabilidad del precio agregado ponderado." }],
    ["COUNCIL ASSESSMENT", { en: "Qualitative stress test from competing perspectives.", es: "Prueba cualitativa desde perspectivas opuestas." }],
  ] as const;
  return <section className="score-relationship"><button onClick={() => setOpen((value) => !value)} aria-expanded={open}><span>{t(locale, { en: "HOW THESE SCORES RELATE", es: "CÓMO SE RELACIONAN ESTAS MÉTRICAS" })}</span><small>{t(locale, { en: "None is a probability of profit", es: "Ninguna es probabilidad de ganancia" })}</small>{open ? <ChevronUp/> : <ChevronDown/>}</button>{open && <div>{metrics.map(([name, copy]) => <article key={name}><b>{name}</b><p>{t(locale, copy)}</p></article>)}</div>}</section>;
}

function Council({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const agents = [
    ["BULL", { en: "Accept: three simulated markets remain above the frozen close.", es: "Aceptado: tres mercados simulados permanecen sobre el cierre congelado." }, "support", "3/3 markets · persistence"],
    ["BEAR", { en: "Accept as risk: the premium could partly revert before the open.", es: "Aceptado como riesgo: la prima podría revertirse parcialmente antes de abrir." }, "oppose", "stale reference · volatility"],
    ["LIQUIDITY", { en: "Accept with caveat: combined liquidity supports analysis, but one venue is weaker.", es: "Aceptado con cautela: la liquidez combinada permite analizar, pero una fuente es más débil." }, "support", "liquidity · spread"],
    ["SKEPTIC", { en: "Reject as primary explanation: no single venue dominates the weighted price.", es: "Rechazado como explicación principal: ninguna fuente domina el precio ponderado." }, "neutral", "source influence · outlier test"],
  ] as const;
  return <section className={`council ${open ? "open" : "collapsed"}`} id="council"><button className="council-toggle" onClick={() => setOpen((value) => !value)} aria-expanded={open}><span><b>GHOST COUNCIL · SIMULATED</b><small>{t(locale, { en: "Four perspectives stress-test the same evidence", es: "Cuatro perspectivas ponen a prueba la misma evidencia" })}</small></span><strong>{t(locale, { en: "COUNCIL ASSESSMENT · MODERATE", es: "EVALUACIÓN DEL CONSEJO · MODERADA" })}</strong>{open ? <ChevronUp/> : <ChevronDown/>}</button>{open && <div className="council-layout"><div className="council-copy"><h2>{t(locale, { en: "THE SIGNAL IS DEBATED BEFORE IT IS JUDGED.", es: "LA SEÑAL SE DEBATE ANTES DE SER EVALUADA." })}</h2><p>{t(locale, { en: "Each role cites the observation used; the judge states why it is accepted or rejected.", es: "Cada rol cita la observación usada; el juez explica por qué se acepta o rechaza." })}</p></div><div className="agent-list">{agents.map(([name, copy, stance, citation]) => <div className={`agent-row ${stance}`} key={name}><span>{name}</span><p>{t(locale, copy)}</p><small>{t(locale, { en: "EVIDENCE", es: "EVIDENCIA" })} · {citation}</small></div>)}<div className="judge-row"><span>JUDGE</span><strong>{t(locale, { en: "Accept signal with explicit liquidity and reference-age caveats", es: "Acepta la señal con cautelas explícitas de liquidez y antigüedad" })}</strong><p>{t(locale, { en: "Qualitative assessment only—not a profit probability.", es: "Evaluación cualitativa; no es probabilidad de ganancia." })}</p></div></div></div>}</section>;
}

function ScenarioEngine({ locale, symbol, consensusPrice }: { locale: Locale; symbol: SymbolKey; consensusPrice: number }) {
  const weights: Record<SymbolKey, [number, number, number]> = { NVDA: [34, 49, 17], AAPL: [24, 61, 15], TSLA: [41, 37, 22] };
  const [bull, base, bear] = weights[symbol];
  const scenarios = [
    ["BULL", consensusPrice * (symbol === "TSLA" ? 1.015 : 1.009), bull, { en: "Premium persists while activity rises and spreads narrow.", es: "La prima persiste mientras aumenta la actividad y se reducen los spreads." }, { en: "Invalidated if agreement breaks below 65%.", es: "Se invalida si el acuerdo cae por debajo de 65%." }, "MEDIUM", { en: "False momentum from thin liquidity.", es: "Impulso falso por baja liquidez." }],
    ["BASE", consensusPrice * 0.999, base, { en: "Markets stabilize near the observed consensus.", es: "Los mercados se estabilizan cerca del consenso observado." }, { en: "Invalidated by a new cross-market divergence.", es: "Se invalida con una nueva divergencia entre mercados." }, "MODERATE–HIGH", { en: "The reference remains stale.", es: "La referencia sigue desactualizada." }],
    ["BEAR", consensusPrice * 0.981, bear, { en: "Premium fades as spreads widen and activity falls.", es: "La prima desaparece al ampliarse los spreads y caer la actividad." }, { en: "Invalidated if premium persists with stronger liquidity.", es: "Se invalida si la prima persiste con mayor liquidez." }, "LOW–MEDIUM", { en: "Overweighting one noisy venue.", es: "Sobreponderar una fuente ruidosa." }],
  ] as const;
  const [open, setOpen] = useState("BASE");
  return <section className="scenario-engine" id="scenarios"><div className="section-eyebrow">SCENARIO ENGINE · {symbol} · SIMULATED</div><div className="scenario-head"><h2>{t(locale, { en: "MULTIPLE FUTURES. NO GUARANTEES.", es: "MÚLTIPLES FUTUROS. SIN GARANTÍAS." })}</h2><p>{t(locale, { en: "Asset-specific weights are calculated deterministically from each demo dataset.", es: "Los pesos por activo se calculan de forma determinista desde cada conjunto de datos demo." })}</p></div><div className="scenario-track">{scenarios.map(([name, price, probability, condition, invalidator, level, risk]) => <button key={name} onClick={() => setOpen(name)} className={open === name ? "active" : ""}><span>{name}</span><strong>{money(price)}</strong><i style={{ width: `${probability}%` }}/><b>{probability}%</b>{open === name && <div className="scenario-detail"><p><em>{t(locale, { en: "NECESSARY CONDITIONS", es: "CONDICIONES NECESARIAS" })}</em>{t(locale, condition)}</p><p><em>{t(locale, { en: "INVALIDATOR", es: "INVALIDADOR" })}</em>{t(locale, invalidator)}</p><p><em>{t(locale, { en: "CONFIDENCE", es: "CONFIANZA" })}</em>{level}</p><p><em>{t(locale, { en: "MAIN RISK", es: "RIESGO PRINCIPAL" })}</em>{t(locale, risk)}</p></div>}</button>)}</div><small>{t(locale, { en: "Scenario weights are analytical estimates, not forecasts or investment probabilities.", es: "Los pesos de escenarios son estimaciones analíticas, no pronósticos ni probabilidades de inversión." })}</small></section>;
}

function Discoveries({ locale, onSelect }: { locale: Locale; onSelect: (symbol: SymbolKey) => void }) {
  const descriptions: Record<SymbolKey, Copy> = { NVDA: { en: "Strong coordinated divergence", es: "Fuerte divergencia coordinada" }, TSLA: { en: "Unusual activity with wider spreads", es: "Actividad inusual con spreads más amplios" }, AAPL: { en: "Cross-market disagreement", es: "Desacuerdo entre mercados" } };
  const items = (["NVDA", "AAPL", "TSLA"] as SymbolKey[]).map((item) => ({ symbol: item, score: researchScore(item), description: descriptions[item] })).sort((a, b) => b.score - a.score);
  return <div className="discoveries"><span>TONIGHT&apos;S DISCOVERIES · SIMULATED</span>{items.map(({ symbol: item, score, description }, index) => <button key={item} onClick={() => onSelect(item)}><b>#{index + 1}</b><strong>{item}</strong><p>{t(locale, description)}</p><em>GHOST SCORE {score}</em><ArrowUpRight/></button>)}</div>;
}

function GhostPulse({ locale, symbol }: { locale: Locale; symbol: SymbolKey }) {
  const [collapsed, setCollapsed] = useState(false);
  const [filter, setFilter] = useState<"all" | "support" | "challenge">("all");
  const items = useMemo(() => PULSE_ITEMS[symbol].filter((item) => filter === "all" || item.stance === filter), [filter, symbol]);
  return <aside className={`ghost-pulse ${collapsed ? "collapsed" : ""}`} id="pulse"><button className="pulse-collapse" onClick={() => setCollapsed((value) => !value)} aria-expanded={!collapsed}><Radio/><span>GHOST PULSE</span>{collapsed ? <ChevronDown/> : <ChevronUp/>}</button>{!collapsed && <><div className="pulse-summary"><span>SOCIAL NARRATIVE · SIMULATED</span><h3>{t(locale, { en: `Synthetic discussion cautiously supports the ${symbol} signal.`, es: `La conversación sintética apoya con cautela la señal de ${symbol}.` })}</h3><div><p><b>1</b>{t(locale, { en: "high-trust support", es: "apoyo de alta confianza" })}</p><p><b>1</b>{t(locale, { en: "credible challenge", es: "objeción creíble" })}</p><p><b>1</b>{t(locale, { en: "neutral context", es: "contexto neutral" })}</p></div><small>SIMULATED SOCIAL CONFIDENCE · MODERATE</small></div><div className="pulse-filters"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>{t(locale, { en: "All", es: "Todo" })}</button><button className={filter === "support" ? "active" : ""} onClick={() => setFilter("support")}>{t(locale, { en: "Supports", es: "Apoya" })}</button><button className={filter === "challenge" ? "active" : ""} onClick={() => setFilter("challenge")}>{t(locale, { en: "Challenges", es: "Cuestiona" })}</button></div><div className="pulse-feed">{items.map((item) => <article key={item.id}><header><span>{item.platform}</span><b>SIMULATED SOURCE</b><time>{item.minutesAgo}m</time></header><h4>{item.source}</h4><p>“{item.excerpt[locale]}”</p><footer><span>DEMO TRUST {item.trust}</span><b className={item.stance}>{item.stance === "support" ? "SUPPORTS GHOST" : item.stance === "challenge" ? "CHALLENGES GHOST" : "NEUTRAL CONTEXT"}</b></footer></article>)}</div><div className="pulse-interpretation"><span>GHOST INTERPRETATION · SIMULATED</span><p>{t(locale, { en: "The synthetic supporting source acknowledges the divergence, while a synthetic dissenting source keeps liquidity risk in view.", es: "La fuente sintética favorable reconoce la divergencia, mientras una fuente sintética disidente mantiene visible el riesgo de liquidez." })}</p></div><small className="reputation-note">SIMULATED REPUTATION MODEL · {t(locale, { en: "No fabricated accuracy history", es: "Sin historial de precisión inventado" })}</small></>}
  </aside>;
}
