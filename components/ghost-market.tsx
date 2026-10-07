"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, CircleHelp, FlaskConical, Menu, Search, X } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { marketDataAdapter } from "@/data/adapters";
import type { ConsensusWeight, GhostEvent, GhostSession, Locale, SymbolKey, VenueObservation } from "@/data/types";
import { calculateGhostConfidence } from "@/engine/confidence";
import { calculateGhostConsensus } from "@/engine/consensus";
import { calculateGhostScore } from "@/engine/ghost-score";
import { calculateReopenError, getCurrentEvent, getReplayFrame } from "@/engine/replay";
import { CinematicIntro } from "@/ui/cinematic-intro";
import { IntelligenceLayer } from "@/ui/intelligence-layer";
import { MarketConstellation } from "@/ui/market-constellation";
import { JudgeTour } from "@/ui/judge-tour";
import { BnbHeroEvidence, OnchainEvidence, useIntegrationEvidence } from "@/ui/onchain-evidence";
import { ReplayControls } from "@/ui/replay-controls";
import { UnderTheGhost } from "@/ui/under-the-ghost";

type View = "replay" | "morning";
type Mode = "simple" | "pro";
declare global { interface Document { modelContext?: { registerTool: (tool: Record<string, unknown>, options?: { signal?: AbortSignal }) => void | Promise<void> } } }

const SYMBOLS: Array<{ symbol: SymbolKey; company: string }> = [{ symbol: "NVDA", company: "NVIDIA" }, { symbol: "AAPL", company: "Apple" }, { symbol: "TSLA", company: "Tesla" }];
const money = (value: number) => `$${value.toFixed(2)}`;
const compact = (value: number) => new Intl.NumberFormat("en-US", { notation: "compact", style: "currency", currency: "USD", maximumFractionDigits: 1 }).format(value);
const tr = (locale: Locale, en: string, es: string) => locale === "en" ? en : es;

export default function GhostMarket() {
  const [symbol, setSymbol] = useState<SymbolKey>("AAPL");
  const [view, setView] = useState<View>("replay");
  const [locale, setLocale] = useState<Locale>("en");
  const [mode, setMode] = useState<Mode>("simple");
  const [introVisible, setIntroVisible] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<VenueObservation | null>(null);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [breakStage, setBreakStage] = useState(0);
  const [demoStep, setDemoStep] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const progressRef = useRef(progress);
  const breakTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const { evidence: bnbEvidence, binance: binanceIntegration, loading: bnbLoading, reload: reloadEvidence } = useIntegrationEvidence(symbol);
  const finishIntro = useCallback(() => setIntroVisible(false), []);
  const clearBreakTimers = useCallback(() => { breakTimersRef.current.forEach(clearTimeout); breakTimersRef.current = []; }, []);

  useEffect(() => {
    const savedLocale = localStorage.getItem("ghost-locale");
    const savedMode = localStorage.getItem("ghost-mode");
    if (savedLocale === "en" || savedLocale === "es") setLocale(savedLocale);
    if (savedMode === "simple" || savedMode === "pro") setMode(savedMode);
  }, []);
  const changeLocale = (next: Locale) => { setLocale(next); localStorage.setItem("ghost-locale", next); };
  const changeMode = (next: Mode) => { setMode(next); localStorage.setItem("ghost-mode", next); };
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);

  const session = marketDataAdapter.getSession(symbol);
  const frame = useMemo(() => getReplayFrame(session, progress), [session, progress]);
  const intelligenceFrame = useMemo(() => getReplayFrame(session, 0.68), [session]);
  const intelligenceConsensus = useMemo(() => calculateGhostConsensus(intelligenceFrame.venues), [intelligenceFrame.venues]);
  const intelligenceConfidence = useMemo(() => calculateGhostConfidence(session.close, intelligenceFrame.venues, intelligenceConsensus), [session.close, intelligenceFrame.venues, intelligenceConsensus]);
  const observedVenues = useMemo(() => frame.venues.map((venue) => venue.id !== "b" || breakStage < 2 ? venue : {
    ...venue, price: Math.round((venue.price + 3.76) * 100) / 100, quoteAgeSeconds: 83, reliability: 0.62,
    liquidity: { availableUsd: Math.round(venue.liquidity.availableUsd * 0.18), activityUsd: Math.round(venue.liquidity.activityUsd * 0.31), spreadBps: 96 },
  }), [frame.venues, breakStage]);
  const consensus = useMemo(() => calculateGhostConsensus(observedVenues), [observedVenues]);
  const baselineConsensus = useMemo(() => calculateGhostConsensus(frame.venues), [frame.venues]);
  const confidence = useMemo(() => calculateGhostConfidence(session.close, observedVenues, consensus), [session.close, observedVenues, consensus]);
  const baselineConfidence = useMemo(() => calculateGhostConfidence(session.close, frame.venues, baselineConsensus), [session.close, frame.venues, baselineConsensus]);
  const normalEvent = useMemo(() => getCurrentEvent(session, progress), [session, progress]);
  const currentEvent: GhostEvent = breakStage > 0 ? { id: "break", atMinute: 0, time: "02:17 AM", type: "PRICE_DIVERGENCE", venueId: "b", severity: "critical", title: breakStage < 2 ? "INJECTING SIMULATED OUTLIER" : breakStage < 4 ? "UNUSUAL DIVERGENCE DETECTED" : "SIGNAL DOWN-WEIGHTED", detail: tr(locale, breakStage < 2 ? "A controlled demo event is beginning." : breakStage < 4 ? "Ghost is checking liquidity, spread, freshness and agreement." : "Ghost did not blindly follow the outlier price.", breakStage < 2 ? "Comienza un evento demo controlado." : breakStage < 4 ? "Ghost revisa liquidez, spread, frescura y acuerdo." : "Ghost no siguió ciegamente el precio atípico.") } : normalEvent;

  useEffect(() => { progressRef.current = progress; }, [progress]);
  useEffect(() => {
    if (!playing) return;
    let animationFrame = 0;
    const initial = progressRef.current >= 0.999 ? 0 : progressRef.current;
    if (initial === 0 && progressRef.current >= 0.999) setProgress(0);
    const startedAt = performance.now();
    const tick = (now: number) => { const next = Math.min(1, initial + (now - startedAt) / 15_000); setProgress(next); if (next < 1) animationFrame = requestAnimationFrame(tick); else setPlaying(false); };
    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [playing]);
  useEffect(() => { if (progress < 0.999 || playing) return; const timer = setTimeout(() => setView("morning"), 850); return () => clearTimeout(timer); }, [progress, playing]);
  useEffect(() => { clearBreakTimers(); setProgress(0); setPlaying(false); setBreakStage(0); }, [symbol, clearBreakTimers]);
  useEffect(() => () => clearBreakTimers(), [clearBreakTimers]);
  useEffect(() => { if (view === "morning") { clearBreakTimers(); setBreakStage(0); } }, [view, clearBreakTimers]);
  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try { void Promise.resolve(context.registerTool({ name: "control_ghost_market", title: "Control Ghost Market", description: "Select an asset and open Ghost Replay or The Morning After.", inputSchema: { type: "object", properties: { symbol: { type: "string", enum: ["NVDA", "AAPL", "TSLA"] }, view: { type: "string", enum: ["replay", "morning"] } }, required: ["symbol", "view"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute(input: unknown) { const next = input as { symbol?: SymbolKey; view?: View }; if (!next || !SYMBOLS.some((item) => item.symbol === next.symbol) || !["replay", "morning"].includes(next.view ?? "")) throw new Error("Choose a supported symbol and view."); setSymbol(next.symbol!); setView(next.view!); return next; } }, { signal: lifecycle.signal })).catch(() => undefined); } catch {}
    return () => lifecycle.abort();
  }, []);

  const scrub = (next: number) => { setPlaying(false); setProgress(next); setView("replay"); };
  const reset = () => { clearBreakTimers(); setPlaying(false); setProgress(0); setView("replay"); setBreakStage(0); };
  const runBreakExperiment = () => {
    clearBreakTimers();
    if (breakStage > 0) { setBreakStage(0); return; }
    setPlaying(false); setView("replay"); setProgress(0.62); setBreakStage(1);
    breakTimersRef.current = [2, 3, 4].map((stage, index) => setTimeout(() => setBreakStage(stage), [900, 2600, 4600][index]));
  };
  const jumpToAnomaly = () => { setView("replay"); setProgress(617 / 1049); setPlaying(false); setTimeout(() => document.getElementById("observatory")?.scrollIntoView({ behavior: "smooth" }), 40); };
  const enterMarket = () => document.getElementById("market")?.scrollIntoView({ behavior: "smooth" });
  const baseGhostScore = calculateGhostScore(session.close, intelligenceFrame.venues, intelligenceConsensus, intelligenceConfidence);

  useEffect(() => {
    if (demoStep === null) return;
    const ids = ["market", "evidence", "observatory", "morning-after", "under-the-ghost"];
    if (demoStep === 2 && breakStage === 0) runBreakExperiment();
    if (demoStep === 3) setView("morning"); else if (demoStep < 3) setView("replay");
    const timer = setTimeout(() => document.getElementById(ids[demoStep])?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    return () => clearTimeout(timer);
  }, [demoStep]);

  return <TooltipProvider><main className={`ghost-app ${mode === "simple" ? "simple-mode" : "pro-mode"} min-h-screen overflow-hidden bg-[#060807] text-[#f2f0e8]`}>
    {introVisible && <CinematicIntro locale={locale} onDone={finishIntro}/>}<div className="noise" aria-hidden="true" />
    <Header view={view} onView={setView} locale={locale} onLocale={changeLocale} mode={mode} onMode={changeMode} mobileOpen={mobileMenuOpen} onMobileOpen={setMobileMenuOpen}/>
    <div className="ghost-status"><i/><span>GHOST // {breakStage > 0 && view === "replay" ? "ANOMALY DETECTED" : playing ? "ANALYZING" : "LISTENING"}</span><b>3 {tr(locale, "simulated markets indexed", "mercados simulados indexados")} · {tr(locale, "deterministic replay", "replay determinista")}</b></div>
    <section className="hero-band" id="overview"><div className="hero-copy"><p className="status-line"><span/> WALL STREET · {tr(locale, "CLOSED", "CERRADO")}</p><h1>WALL STREET SLEEPS.<br/><em>THE MARKET DOESN&apos;T.</em></h1><p>{tr(locale, "Evidence-led intelligence for tokenized stocks after hours: live BSC contract proof plus a deterministic market simulation.", "Inteligencia basada en evidencia para acciones tokenizadas fuera de horario: contrato verificado en BSC más una simulación determinista del mercado.")}</p><div className="hero-actions"><button onClick={() => setDemoStep(0)}>{tr(locale, "WATCH THE 60-SECOND BNB DEMO", "VER DEMO BNB DE 60 SEGUNDOS")}</button><button onClick={enterMarket}>{tr(locale, "EXPLORE FREELY", "EXPLORAR LIBREMENTE")}</button></div><div className="hero-stats"><span><b>3</b>{tr(locale, "demo assets", "activos demo")}</span><span><b>1</b>{tr(locale, "selected xStock verified", "xStock seleccionado verificado")}</span><span><b>1</b>{tr(locale, "deterministic stress test", "prueba determinista")}</span><DataLabel/></div></div><div className="hero-controls"><BnbHeroEvidence locale={locale} evidence={bnbEvidence} binance={binanceIntegration} loading={bnbLoading} onOpen={() => document.getElementById("evidence")?.scrollIntoView({ behavior: "smooth" })}/><SymbolPicker locale={locale} symbol={symbol} company={session.company} open={pickerOpen} onOpen={setPickerOpen} onSelect={setSymbol}/></div></section>
    <OnchainEvidence locale={locale} evidence={bnbEvidence} binance={binanceIntegration} loading={bnbLoading} reload={reloadEvidence}/>
    <IntelligenceLayer locale={locale} symbol={symbol} session={session} venues={intelligenceFrame.venues} consensus={intelligenceConsensus} confidence={intelligenceConfidence} ghostScore={baseGhostScore} onInvestigate={() => document.getElementById("discover")?.scrollIntoView({ behavior: "smooth" })} onReplayMoment={jumpToAnomaly} onSelectSymbol={(next) => { setSymbol(next); setTimeout(() => document.getElementById("market")?.scrollIntoView({ behavior: "smooth" }), 80); }}/>
    {view === "replay" ? <section className="observatory-shell" id="observatory"><div className="observatory-topline"><span>MARKET CONSTELLATION / {symbol}</span><span>{tr(locale, "SIMULATED NIGHT · OCT 04–05", "NOCHE SIMULADA · 04–05 OCT")}</span><DataLabel/></div><div className="observatory-layout"><div className="constellation-column"><MarketConstellation locale={locale} reference={session.close} venues={observedVenues} consensus={consensus} confidence={confidence} removedIds={new Set()} breakMode={breakStage > 0} currentEvent={currentEvent} onVenue={setSelectedVenue}/>{breakStage >= 2 && <ImpactStrip locale={locale} beforePrice={baselineConsensus.price} afterPrice={consensus.price} beforeConfidence={baselineConfidence.score} afterConfidence={confidence.score}/>}<ReplayControls locale={locale} progress={progress} playing={playing} currentTime={frame.time} events={session.events} maxMinute={session.frames.at(-1)!.atMinute} onPlay={() => setPlaying((value) => !value)} onReset={reset} onScrub={scrub}/></div><EnginePanel locale={locale} venues={observedVenues} consensus={consensus} confidence={confidence} breakStage={breakStage} baselineConsensus={baselineConsensus} onBreak={runBreakExperiment}/></div></section> : <div id="morning-after"><MorningAfter locale={locale} symbol={symbol} session={session} onReplay={() => { reset(); setPlaying(true); }}/></div>} 
    <UnderTheGhost locale={locale}/>
    <footer className="site-footer"><span>GHOST MARKET BETA 0.5 · BNB CHAIN TOKENIZED MARKETS</span><span>{tr(locale, "Ghost Market provides market intelligence and analytical tools. It does not provide financial advice. Simulated scenarios may be incorrect.", "Ghost Market ofrece herramientas de inteligencia y análisis de mercado. No proporciona asesoramiento financiero. Los escenarios simulados pueden ser incorrectos.")}</span></footer>
    <VenueSheet locale={locale} venue={selectedVenue} weight={selectedVenue ? consensus.weights.find((item) => item.venueId === selectedVenue.id) : undefined} referencePrice={session.close.price} onOpenChange={(open) => !open && setSelectedVenue(null)}/>{demoStep !== null && <JudgeTour locale={locale} step={demoStep} onStep={setDemoStep} onExit={() => setDemoStep(null)}/>} 
  </main></TooltipProvider>;
}

function Header({ view, onView, locale, onLocale, mode, onMode, mobileOpen, onMobileOpen }: { view: View; onView: (view: View) => void; locale: Locale; onLocale: (locale: Locale) => void; mode: Mode; onMode: (mode: Mode) => void; mobileOpen: boolean; onMobileOpen: (open: boolean) => void }) {
  const nav = [[tr(locale, "OVERVIEW", "RESUMEN"), "overview"], [tr(locale, "BRAIN", "CEREBRO"), "market"], [tr(locale, "EVIDENCE", "EVIDENCIA"), "evidence"], [tr(locale, "COUNCIL", "CONSEJO"), "council"], [tr(locale, "SCENARIOS", "ESCENARIOS"), "scenarios"], [tr(locale, "RESEARCH", "INVESTIGACIÓN"), "discover"], ["REPLAY", "observatory"], [tr(locale, "SYSTEM", "SISTEMA"), "under-the-ghost"]] as const;
  const [activeSection, setActiveSection] = useState("overview");
  useEffect(() => {
    const ids = [...nav.map(([, id]) => id), "morning-after"];
    const observer = new IntersectionObserver((entries) => { const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]; if (visible) setActiveSection(visible.target.id); }, { rootMargin: "-25% 0px -60% 0px", threshold: [0, .2, .5] });
    ids.forEach((id) => { const node = document.getElementById(id); if (node) observer.observe(node); });
    return () => observer.disconnect();
  }, [view]);
  const go = (id: string) => { onMobileOpen(false); if (id === "morning-after") onView("morning"); if (id === "observatory") onView("replay"); setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 60); };
  return <header className="site-header"><button className="brand" onClick={() => go("overview")} aria-label={tr(locale, "Ghost Market overview", "Resumen de Ghost Market")}><GhostMark/><span>GHOST MARKET</span><b>BETA 0.4</b></button><nav aria-label={tr(locale, "Ghost Market sections", "Secciones de Ghost Market")}>{nav.map(([label, id]) => <button className={activeSection === id ? "active" : ""} key={id} onClick={() => go(id)}>{label}</button>)}<button className={activeSection === "morning-after" ? "active" : ""} onClick={() => go("morning-after")}>{tr(locale, "MORNING", "APERTURA")}</button></nav><div className="header-tools"><div className="mode-switch" aria-label={tr(locale, "Display mode", "Modo de visualización")}><button className={mode === "simple" ? "active" : ""} onClick={() => onMode("simple")}>SIMPLE</button><button className={mode === "pro" ? "active" : ""} onClick={() => onMode("pro")}>PRO</button></div><div className="language-switch" aria-label={tr(locale, "Language", "Idioma")}><button className={locale === "en" ? "active" : ""} onClick={() => onLocale("en")}>EN</button><i>/</i><button className={locale === "es" ? "active" : ""} onClick={() => onLocale("es")}>ES</button></div><button className="evidence-button" onClick={() => go("evidence")}>{tr(locale, "VIEW BNB EVIDENCE", "VER EVIDENCIA BNB")}</button><button className="mobile-menu-button" onClick={() => onMobileOpen(!mobileOpen)} aria-expanded={mobileOpen} aria-label={tr(locale, "Open menu", "Abrir menú")}><Menu/></button></div>{mobileOpen && <div className="mobile-nav"><div>{nav.map(([label, id]) => <button className={activeSection === id ? "active" : ""} key={id} onClick={() => go(id)}>{label}</button>)}<button className={activeSection === "morning-after" ? "active" : ""} onClick={() => go("morning-after")}>{tr(locale, "MORNING AFTER", "LA MAÑANA SIGUIENTE")}</button></div><div className="mobile-settings"><button onClick={() => onMode(mode === "simple" ? "pro" : "simple")}>{mode === "simple" ? "PRO MODE" : "SIMPLE MODE"}</button><button onClick={() => onLocale(locale === "en" ? "es" : "en")}>{locale === "en" ? "ESPAÑOL" : "ENGLISH"}</button><button onClick={() => go("evidence")}>{tr(locale, "BNB EVIDENCE", "EVIDENCIA BNB")}</button></div></div>}</header>;
}

function SymbolPicker({ locale, symbol, company, open, onOpen, onSelect }: { locale: Locale; symbol: SymbolKey; company: string; open: boolean; onOpen: (open: boolean) => void; onSelect: (symbol: SymbolKey) => void }) {
  return <div className="symbol-picker"><span>{tr(locale, "INSTRUMENT", "INSTRUMENTO")}</span><button onClick={() => onOpen(!open)} aria-expanded={open}><Search/><b>{company}</b><em>{symbol}</em><ChevronDown className={open ? "rotate" : ""}/></button>{open && <div className="symbol-menu">{SYMBOLS.map((item) => <button key={item.symbol} onClick={() => { onSelect(item.symbol); onOpen(false); }} className={symbol === item.symbol ? "selected" : ""}><span>{item.company}</span><b>{item.symbol}</b></button>)}</div>}</div>;
}

function EnginePanel({ locale, venues, consensus, confidence, breakStage, baselineConsensus, onBreak }: { locale: Locale; venues: VenueObservation[]; consensus: ReturnType<typeof calculateGhostConsensus>; confidence: ReturnType<typeof calculateGhostConfidence>; breakStage: number; baselineConsensus: ReturnType<typeof calculateGhostConsensus>; onBreak: () => void }) {
  return <aside className="engine-panel"><div className="engine-heading"><span>GHOST ENGINE</span><Tooltip><TooltipTrigger aria-label={tr(locale, "What Ghost Confidence means", "Qué significa Ghost Confidence")}><CircleHelp/></TooltipTrigger><TooltipContent className="max-w-[300px] bg-[#dfece7] px-4 py-3 text-sm leading-relaxed text-[#101713]">{tr(locale, "Measures data quality and agreement—not profit probability.", "Mide calidad y acuerdo de datos, no probabilidad de ganancia.")}</TooltipContent></Tooltip></div><div className="confidence-readout"><span>CONFIDENCE</span><strong>{confidence.score}<small>%</small></strong><em>{confidence.label}</em><div><span style={{ width: `${confidence.score}%` }}/></div></div><div className="weights-section"><div className="section-title"><span>SOURCE INFLUENCE</span><b>{tr(locale, "WHY THIS WEIGHT?", "¿POR QUÉ ESTE PESO?")}</b></div>{venues.map((venue) => { const weight = consensus.weights.find((item) => item.venueId === venue.id); const before = baselineConsensus.weights.find((item) => item.venueId === venue.id); return <div key={venue.id} className={`weight-row ${breakStage >= 2 && venue.id === "b" ? "outlier" : ""}`}><div><span><i/>{venue.name}</span><b>{breakStage >= 2 && venue.id === "b" ? `${Math.round((before?.weight ?? 0) * 100)}% → ` : ""}{Math.round((weight?.weight ?? 0) * 100)}%</b></div><p>{weightReason(locale, venue, weight)}</p><div><span style={{ width: `${(weight?.weight ?? 0) * 100}%` }}/></div></div>; })}</div><div className="formula-note"><b>EXPLAINABLE BY DESIGN</b><p>30% liquidity · 20% spread · 18% freshness · 14% activity · 12% agreement · 6% reliability</p></div>{breakStage > 0 && <div className="break-diagnostics"><b>GHOST // {breakStage < 2 ? "SIMULATING" : breakStage < 4 ? "ANALYZING" : "DOWN-WEIGHTED"}</b>{[tr(locale, "Checking liquidity", "Revisando liquidez"), tr(locale, "Checking spread", "Revisando spread"), tr(locale, "Checking freshness", "Revisando frescura"), tr(locale, "Comparing agreement", "Comparando acuerdo")].map((label, index) => <span key={label} className={breakStage > index ? "done" : ""}><i/>{label}</span>)}</div>}<div className="confidence-evidence">{confidence.evidence.slice(0, 5).map((item) => <p key={item.label} className={item.tone}><span>{item.tone === "positive" ? "✓" : "△"}</span>{item.label}</p>)}</div><button type="button" className={`break-button ${breakStage > 0 ? "armed" : ""}`} onClick={onBreak}><FlaskConical/><span><b>{breakStage > 0 ? tr(locale, "RESET EXPERIMENT", "REINICIAR EXPERIMENTO") : "BREAK THE CONSENSUS"}</b><small>{breakStage > 0 ? tr(locale, "Restore the observed source", "Restaurar la fuente observada") : tr(locale, "Watch Ghost reject a false outlier", "Mira cómo Ghost rechaza un outlier falso")}</small></span></button></aside>;
}

function weightReason(locale: Locale, venue: VenueObservation, weight?: ConsensusWeight) {
  if (!weight) return tr(locale, "Awaiting active observation", "Esperando observación activa");
  const strongest = Object.entries(weight.factors).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([key]) => key);
  const en: Record<string, string> = { liquidity: "deep liquidity", spread: "healthy spread", freshness: "fresh quote", activity: "strong activity", agreement: "price agreement", reliability: "source reliability" };
  const es: Record<string, string> = { liquidity: "liquidez profunda", spread: "spread saludable", freshness: "cotización reciente", activity: "actividad fuerte", agreement: "acuerdo de precio", reliability: "fiabilidad de fuente" };
  const labels = locale === "en" ? en : es;
  return `${labels[strongest[0]]} · ${labels[strongest[1]]} · ${venue.quoteAgeSeconds}s`;
}

function ImpactStrip({ locale, beforePrice, afterPrice, beforeConfidence, afterConfidence }: { locale: Locale; beforePrice: number; afterPrice: number; beforeConfidence: number; afterConfidence: number }) { return <div className="impact-strip"><span>{tr(locale, "OUTLIER DETECTED", "OUTLIER DETECTADO")}</span><p>Consensus <b>{money(beforePrice)}</b><i>→</i><strong>{money(afterPrice)}</strong></p><p>Confidence <b>{beforeConfidence}%</b><i>→</i><strong>{afterConfidence}%</strong></p><em>{tr(locale, "SIGNAL DOWN-WEIGHTED", "SEÑAL CON MENOR PESO")}</em></div>; }

function MorningAfter({ locale, symbol, session, onReplay }: { locale: Locale; symbol: SymbolKey; session: GhostSession; onReplay: () => void }) {
  const finalConsensus = calculateGhostConsensus(session.frames.at(-1)!.venues); const error = calculateReopenError(finalConsensus.price, session.nextOpenPrice); const absolute = Math.abs(finalConsensus.price - session.nextOpenPrice);
  return <section className="morning-shell"><div className="morning-atmosphere" aria-hidden="true"/><div className="morning-header"><span>THE MORNING AFTER · {symbol}</span><DemoBadge/></div><div className="morning-title"><p>9:30 AM · {tr(locale, "WALL STREET REOPENS", "WALL STREET REABRE")}</p><h2>{tr(locale, "WHAT DID GHOST", "¿QUÉ APRENDIÓ")}<br/><em>{tr(locale, "LEARN?", "GHOST?")}</em></h2></div><div className="morning-comparison"><div><span>09:29 · {tr(locale, "OVERNIGHT CONSENSUS", "CONSENSO NOCTURNO")}</span><strong>{money(finalConsensus.price)}</strong><small>SIMULATED DEMO RESULT</small></div><i>→</i><div><span>09:30 · {tr(locale, "SIMULATED OPEN", "APERTURA SIMULADA")}</span><strong>{money(session.nextOpenPrice)}</strong><small>SIMULATED DEMO RESULT</small></div><i>→</i><div className="difference"><span>GHOST ERROR</span><strong>{error.toFixed(2)}%</strong><small>{money(absolute)} · {tr(locale, "ABSOLUTE DIFFERENCE", "DIFERENCIA ABSOLUTA")}</small></div></div><div className="night-result"><span>SIMULATED DEMO RESULT · NOT LIVE HISTORICAL EVIDENCE</span><p>✓ {tr(locale, "Correct: the consensus stayed coherent across venues", "Correcto: el consenso se mantuvo coherente entre mercados")}</p><p>✓ {tr(locale, "Correct: the injected outlier was down-weighted", "Correcto: el outlier inyectado perdió influencia")}</p><p>△ {tr(locale, "Incorrect or unknown: no real catalyst was verified", "Incorrecto o desconocido: no se verificó un catalizador real")}</p><p>→ {tr(locale, "Learned: stale references and weak liquidity require explicit penalties", "Aprendizaje: referencias antiguas y baja liquidez requieren penalizaciones explícitas")}</p></div><div className="night-history"><span>{tr(locale, "SIMULATED NIGHT HISTORY", "HISTORIAL DE NOCHES SIMULADAS")}</span><div>{session.historicalNights.map((night) => <div key={night.label}><b>{night.label}</b><span><i style={{ width: `${Math.min(100, night.differencePct / 1.5 * 100)}%` }}/></span><strong>{night.differencePct.toFixed(2)}%</strong><em>{night.sourceStatus}</em></div>)}</div></div><div className="morning-note"><p>{tr(locale, "Reopen Check measures how close the final on-chain consensus was to the next traditional reference.", "Reopen Check mide qué tan cerca estuvo el consenso final de la siguiente referencia tradicional.")}</p><span>{tr(locale, "Source: deterministic demo session · Timestamp: simulated 09:30 AM. This does not prove predictive power.", "Fuente: sesión demo determinista · Timestamp: 09:30 simulado. Esto no demuestra poder predictivo.")}</span></div><button className="replay-morning" onClick={onReplay}>{tr(locale, "REPLAY THE NIGHT", "REPRODUCIR LA NOCHE")}</button></section>;
}

function VenueSheet({ locale, venue, weight, referencePrice, onOpenChange }: { locale: Locale; venue: VenueObservation | null; weight?: ConsensusWeight; referencePrice: number; onOpenChange: (open: boolean) => void }) {
  if (!venue) return null; const difference = (venue.price - referencePrice) / referencePrice * 100;
  return <Sheet open={Boolean(venue)} onOpenChange={onOpenChange}><SheetContent className="w-full border-white/10 bg-[#090d0b] p-0 text-[#ecebe4] sm:max-w-[520px]" showCloseButton={false}><SheetHeader className="border-b border-white/[0.08] p-7 sm:p-9"><div className="mb-5 flex items-center justify-between"><DemoBadge/><button aria-label={tr(locale, "Close", "Cerrar")} onClick={() => onOpenChange(false)} className="rounded-full border border-white/10 p-2 text-[#74807a] hover:text-white"><X className="h-4 w-4"/></button></div><SheetTitle className="font-display text-3xl font-normal tracking-tight text-[#f0efe7]">{tr(locale, "WHY IS THIS PRICE DIFFERENT?", "¿POR QUÉ ESTE PRECIO ES DIFERENTE?")}</SheetTitle><SheetDescription className="mt-2 text-sm leading-relaxed text-[#7d8983]">{tr(locale, "Influence comes from observation quality, not the source name.", "La influencia surge de la calidad de la observación, no del nombre de la fuente.")}</SheetDescription></SheetHeader><div className="overflow-y-auto p-7 sm:p-9"><div className="venue-sheet-price"><span>{venue.name} · {venue.network}</span><strong>{money(venue.price)}</strong><em>{difference >= 0 ? "+" : ""}{difference.toFixed(2)}% VS CLOSE · {Math.round((weight?.weight ?? 0) * 100)}% WEIGHT</em></div><dl className="venue-metrics"><div><dt>{tr(locale, "Traditional reference", "Referencia tradicional")}</dt><dd>{money(referencePrice)}</dd></div><div><dt>{tr(locale, "Observed liquidity", "Liquidez observada")}</dt><dd>{compact(venue.liquidity.availableUsd)}</dd></div><div><dt>Spread</dt><dd>{venue.liquidity.spreadBps} bps</dd></div><div><dt>{tr(locale, "Quote freshness", "Frescura de cotización")}</dt><dd>{venue.quoteAgeSeconds}s</dd></div><div><dt>{tr(locale, "Observed activity", "Actividad observada")}</dt><dd>{compact(venue.liquidity.activityUsd)}</dd></div></dl><p className="venue-explanation">{tr(locale, "Ghost Engine normalizes these signals, penalizes divergence and converts the result into a relative weight. A valid price can still weigh less when liquidity drops, spreads widen or the observation becomes stale.", "Ghost Engine normaliza estas señales, penaliza la divergencia y convierte el resultado en un peso relativo. Un precio válido puede pesar menos si cae la liquidez, se amplía el spread o envejece la observación.")}</p></div></SheetContent></Sheet>;
}

function DemoBadge() { return <span className="demo-badge">SIMULATED</span>; }
function DataLabel() { return <span className="demo-badge">SIMULATED</span>; }
function GhostMark() { return <span className="ghost-mark" aria-hidden="true"><i/><i/><i/></span>; }
