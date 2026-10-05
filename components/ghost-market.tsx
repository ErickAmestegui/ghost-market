"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, CircleHelp, Search, X } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  calculateGhostConfidence, calculateGhostConsensus, calculateReopenError,
  formatAge, formatCompactCurrency, getMarketFixture, getOnChainMarkets,
  getTraditionalMarketData, symbols, type OnChainVenue, type SymbolKey,
} from "@/lib/market-data";

type Mode = "live" | "historical";
declare global { interface Document { modelContext?: { registerTool: (tool: Record<string, unknown>, options?: { signal?: AbortSignal }) => void | Promise<void> } } }
const money = (value: number) => `$${value.toFixed(2)}`;

export default function GhostMarket() {
  const [symbol, setSymbol] = useState<SymbolKey>("NVDA");
  const [mode, setMode] = useState<Mode>("live");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<OnChainVenue | null>(null);
  const fixture = getMarketFixture(symbol);
  const traditional = getTraditionalMarketData(symbol);
  const venues = getOnChainMarkets(symbol);
  const consensus = useMemo(() => calculateGhostConsensus(venues), [venues]);
  const confidence = calculateGhostConfidence(traditional, venues);
  const premium = ((consensus - traditional.price) / traditional.price) * 100;
  const reopenError = calculateReopenError(consensus, fixture.historicalReopen);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(context.registerTool({
        name: "select_market_view", title: "Seleccionar vista de mercado",
        description: "Selecciona una acción compatible y cambia entre el escáner en vivo y la comprobación histórica de reapertura.",
        inputSchema: { type: "object", properties: { symbol: { type: "string", enum: ["NVDA", "AAPL", "TSLA"] }, mode: { type: "string", enum: ["live", "historical"] } }, required: ["symbol", "mode"], additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input: unknown) {
          const next = input as { symbol?: SymbolKey; mode?: Mode };
          if (!next || !symbols.some((item) => item.symbol === next.symbol) || !["live", "historical"].includes(next.mode ?? "")) throw new Error("Elige un símbolo y un modo compatibles.");
          setSymbol(next.symbol!); setMode(next.mode!); return { symbol: next.symbol, mode: next.mode };
        },
      }, { signal: lifecycle.signal })).catch(() => undefined);
    } catch {}
    return () => lifecycle.abort();
  }, []);

  return <TooltipProvider><main className="min-h-screen overflow-hidden bg-[#070908] text-[#f2f0e8]">
    <div className="noise" aria-hidden="true" />
    <header className="relative z-30 mx-auto flex h-20 max-w-[1480px] items-center justify-between border-b border-white/[0.08] px-5 sm:px-8 lg:px-12">
      <div className="flex items-center gap-3"><GhostMark/><span className="font-display text-lg tracking-[0.16em]">GHOST MARKET</span></div>
      <div className="flex items-center gap-3 sm:gap-6">
        <nav aria-label="Market view" className="flex items-center rounded-full border border-white/10 bg-white/[0.025] p-1 text-[11px] tracking-[0.13em]">
          {(["live", "historical"] as Mode[]).map((item) => <button key={item} onClick={() => setMode(item)} className={`rounded-full px-3 py-2 transition sm:px-4 ${mode === item ? "bg-[#d6f5e9] text-[#07100d]" : "text-[#8d9691] hover:text-white"}`}>{item === "live" ? "EN VIVO" : "HISTÓRICO"}</button>)}
        </nav><DemoBadge/>
      </div>
    </header>
    <section className="relative z-10 mx-auto max-w-[1480px] px-5 pb-10 pt-10 sm:px-8 lg:px-12 lg:pt-12">
      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_330px] lg:gap-10">
        <div>
          <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div><p className="mb-3 flex items-center gap-2 text-xs tracking-[0.2em] text-[#eb7f5e]"><span className="h-1.5 w-1.5 rounded-full bg-[#eb7f5e] shadow-[0_0_12px_#eb7f5e]"/> WALL STREET ESTÁ CERRADO</p><h1 className="font-display max-w-[850px] text-[clamp(2.25rem,5vw,5.1rem)] leading-[0.94] tracking-[-0.035em]">LOS MERCADOS ON-CHAIN<br/><span className="text-[#b8d8ce]">SIGUEN EN MOVIMIENTO</span></h1></div>
            <div className="relative w-full md:w-[290px]"><p className="mb-2 text-[10px] tracking-[0.2em] text-[#67716c]">INSTRUMENTO ANALIZADO</p><button onClick={() => setPickerOpen(!pickerOpen)} aria-expanded={pickerOpen} className="flex w-full items-center justify-between border-b border-white/20 py-3 text-left transition hover:border-[#9ee8d1]"><span className="flex items-center gap-3"><Search className="h-4 w-4 text-[#7b8781]"/><span><b className="font-medium">{fixture.company}</b> <span className="ml-2 text-sm text-[#78817d]">{symbol}</span></span></span><ChevronDown className={`h-4 w-4 transition ${pickerOpen ? "rotate-180" : ""}`}/></button>
              {pickerOpen && <div className="absolute right-0 z-40 mt-2 w-full border border-white/10 bg-[#0d110f]/95 p-1 shadow-2xl backdrop-blur-xl">{symbols.map((item) => <button key={item.symbol} onClick={() => { setSymbol(item.symbol); setPickerOpen(false); }} className={`flex w-full items-center justify-between px-4 py-3 text-sm hover:bg-white/5 ${symbol === item.symbol ? "text-[#9ee8d1]" : "text-[#d7d8d2]"}`}><span>{item.company}</span><span className="font-mono text-xs text-[#6e7773]">{item.symbol}</span></button>)}</div>}
            </div>
          </div>
          {mode === "live" ? <Scanner traditional={traditional} venues={venues} consensus={consensus} premium={premium} symbol={symbol} onVenue={setSelectedVenue}/> : <Historical fixture={fixture} consensus={consensus} reopenError={reopenError}/>} 
        </div>
        <ConfidencePanel score={confidence} traditionalAge={traditional.referenceAgeMinutes}/>
      </div>
      <footer className="mt-8 flex flex-col gap-3 border-t border-white/[0.07] pt-5 text-[10px] tracking-[0.14em] text-[#5f6864] sm:flex-row sm:items-center sm:justify-between"><span>OBSERVACIÓN SIMULADA DE MERCADOS TOKENIZADOS · NO ES UN PRODUCTO DE INVERSIÓN</span><span>PRECIOS ACTUALIZADOS SOLO PARA DEMOSTRACIÓN</span></footer>
    </section>
    <VenueSheet venue={selectedVenue} traditionalPrice={traditional.price} referenceAge={traditional.referenceAgeMinutes} onOpenChange={(open) => !open && setSelectedVenue(null)}/>
  </main></TooltipProvider>;
}

function Scanner({ traditional, venues, consensus, premium, symbol, onVenue }: { traditional: ReturnType<typeof getTraditionalMarketData>; venues: OnChainVenue[]; consensus: number; premium: number; symbol: SymbolKey; onVenue: (v: OnChainVenue) => void }) {
  return <div className="scanner-shell relative min-h-[580px] overflow-hidden border border-white/[0.1] bg-[#0a0d0b]/75 px-4 py-7 sm:px-8 sm:py-8"><div className="scan-beam" aria-hidden="true"/><div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-white/[0.06] px-5 py-3 text-[9px] tracking-[0.2em] text-[#53605a] sm:px-8"><span>ESCÁNER DE PRECIO FANTASMA / {symbol}</span><span className="flex items-center gap-2"><i className="live-dot"/> OBSERVANDO</span></div>
    <div className="relative z-10 mx-auto flex max-w-[920px] flex-col items-center pt-12"><div className="frozen-node text-center"><p className="instrument-label">REFERENCIA TRADICIONAL <span className="ml-2 text-[#e88768]">CONGELADA</span></p><div className="font-display mt-2 text-4xl tracking-tight text-[#d7d5ce] sm:text-5xl">{money(traditional.price)}</div><p className="mt-2 font-mono text-[11px] text-[#68716d]">ANTIGÜEDAD {formatAge(traditional.referenceAgeMinutes)} · MERCADO CERRADO</p></div><div className="relative h-16 w-[80%] max-w-[680px]" aria-hidden="true"><div className="frozen-line"/></div>
      <div className="relative grid w-full grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5"><svg className="pointer-events-none absolute -top-6 left-0 hidden h-[170px] w-full overflow-visible sm:block" viewBox="0 0 900 170" preserveAspectRatio="none" aria-hidden="true"><path className="flow-path" d="M150,25 C200,100 390,78 450,155"/><path className="flow-path delay-1" d="M450,25 C450,90 450,105 450,155"/><path className="flow-path delay-2" d="M750,25 C700,100 510,78 450,155"/></svg>
        {venues.map((venue,index) => <button key={venue.id} onClick={() => onVenue(venue)} className="venue-node group relative z-10 min-h-[118px] border border-[#9ee8d1]/20 bg-[#0c1512]/90 p-4 text-left transition hover:-translate-y-1 hover:border-[#9ee8d1]/60 hover:bg-[#10201a]"><span className="mb-4 flex items-center justify-between text-[10px] tracking-[0.15em] text-[#6f7c76]"><span>{venue.name.toUpperCase()}</span><i className={`venue-pulse pulse-${index}`}/></span><span className="font-display text-2xl text-[#d8f4e9] sm:text-3xl">{money(venue.price)}</span><span className="mt-2 flex justify-between font-mono text-[9px] text-[#66746e]"><span>{venue.network}</span><span>SPREAD {venue.spreadBps} BPS</span></span></button>)}
      </div><div className="relative h-20 w-px bg-gradient-to-b from-[#9ee8d1]/35 to-[#9ee8d1]" aria-hidden="true"><span className="particle"/></div><div className="consensus-node relative w-full max-w-[430px] border border-[#a5f0d8]/45 bg-[#0b1713] px-6 py-6 text-center shadow-[0_0_70px_rgba(119,232,196,0.12)] sm:px-10"><div className="corner corner-a"/><div className="corner corner-b"/><p className="instrument-label text-[#9ee8d1]">CONSENSO FANTASMA</p><div className="font-display mt-2 text-5xl tracking-tight text-[#e6fff7] sm:text-6xl">{money(consensus)}</div><p className="mt-3 font-mono text-sm text-[#83d9bf]">+{premium.toFixed(2)}% <span className="text-[#61736c]">VS REFERENCIA TRADICIONAL</span></p></div>
    </div></div>;
}

function ConfidencePanel({ score, traditionalAge }: { score: number; traditionalAge: number }) {
  const checks = ["VARIOS MERCADOS COINCIDEN","LIQUIDEZ RAZONABLE","SPREADS OBSERVADOS ESTRECHOS"];
  return <aside className="border-l border-white/[0.08] pl-0 lg:sticky lg:top-8 lg:pl-8"><div className="flex items-center justify-between border-b border-white/[0.08] pb-4"><span className="instrument-label">CONFIANZA FANTASMA</span><Tooltip><TooltipTrigger aria-label="¿Qué es la Confianza Fantasma?"><CircleHelp className="h-4 w-4 text-[#66716c]"/></TooltipTrigger><TooltipContent className="max-w-[280px] bg-[#dfece7] px-4 py-3 text-sm leading-relaxed text-[#101713]">Mide la calidad y el grado de acuerdo de los datos observados; no la probabilidad de ganar dinero.</TooltipContent></Tooltip></div><div className="my-7 flex items-end gap-3"><span className="font-display text-7xl leading-none text-[#dff8ef]">{score}</span><span className="mb-2 text-lg text-[#5d6863]">/ 100</span></div><p className="mb-6 text-sm tracking-[0.12em] text-[#9ee8d1]">CONFIANZA {score >= 85 ? "MODERADA–ALTA" : score >= 70 ? "MODERADA" : "BAJA–MODERADA"}</p><div className="score-track mb-8"><span style={{width:`${score}%`}}/></div><div className="space-y-4 border-t border-white/[0.08] pt-6 text-[11px] tracking-[0.07em]">{checks.map(item => <p key={item} className="flex gap-3 text-[#acb8b2]"><span className="text-[#85d9bf]">✓</span>{item}</p>)}<p className="flex gap-3 text-[#9e8c81]"><span className="text-[#dd896d]">△</span>LA REFERENCIA TRADICIONAL TIENE {formatAge(traditionalAge)}</p><p className="flex gap-3 text-[#9e8c81]"><span className="text-[#dd896d]">△</span>EL MERCADO TRADICIONAL ESTÁ CERRADO</p></div><div className="mt-9 border border-white/[0.08] p-4 text-xs leading-relaxed text-[#68736d]">La confianza describe la calidad de los datos y el acuerdo entre mercados. No predice rentabilidad ni precios futuros.</div></aside>;
}

function Historical({ fixture, consensus, reopenError }: { fixture: ReturnType<typeof getMarketFixture>; consensus:number; reopenError:number }) {
  return <div className="scanner-shell relative flex min-h-[580px] flex-col items-center justify-center overflow-hidden border border-white/[0.1] bg-[#0a0d0b]/75 px-5 py-16 text-center"><div className="historical-rings" aria-hidden="true"/><p className="relative z-10 mb-10 text-[10px] tracking-[0.22em] text-[#66726c]">{fixture.historicalLabel} · DATOS DEMO</p><div className="historical-step relative z-10"><span>CONSENSO FANTASMA FINAL</span><strong>{money(consensus)}</strong></div><div className="history-arrow">↓</div><div className="historical-step relative z-10"><span>REAPERTURA OFICIAL DEL MERCADO</span><strong>{money(fixture.historicalReopen)}</strong></div><div className="history-arrow">↓</div><div className="relative z-10 border border-[#9ee8d1]/35 bg-[#0c1713] px-10 py-6 shadow-[0_0_50px_rgba(119,232,196,0.09)]"><span className="instrument-label text-[#9ee8d1]">ERROR FANTASMA</span><div className="font-display mt-2 text-5xl text-[#e8fff7]">{reopenError.toFixed(2)}%</div></div><p className="relative z-10 mt-8 max-w-xl text-sm leading-relaxed text-[#7b8781]">La Comprobación de Reapertura mide qué tan cerca estuvo el consenso final on-chain de la siguiente referencia del mercado tradicional. Es una revisión retrospectiva de precisión, no una prueba de poder predictivo.</p></div>;
}

function VenueSheet({ venue, traditionalPrice, referenceAge, onOpenChange }: { venue:OnChainVenue|null; traditionalPrice:number; referenceAge:number; onOpenChange:(open:boolean)=>void }) {
  if(!venue) return null; const difference=((venue.price-traditionalPrice)/traditionalPrice)*100;
  const metrics=[["Referencia tradicional",money(traditionalPrice)],["Precio tokenizado",money(venue.price)],["Prima / descuento",`${difference>=0?"+":""}${difference.toFixed(2)}%`],["Liquidez disponible",formatCompactCurrency(venue.liquidity)],["Diferencial observado",`${venue.spreadBps} bps`],["Antigüedad de referencia",formatAge(referenceAge)]];
  return <Sheet open={Boolean(venue)} onOpenChange={onOpenChange}><SheetContent className="w-full border-white/10 bg-[#0b0f0d] p-0 text-[#ecebe4] sm:max-w-[520px]" showCloseButton={false}><SheetHeader className="border-b border-white/[0.08] p-7 sm:p-9"><div className="mb-5 flex items-center justify-between"><DemoBadge/><button aria-label="Cerrar detalles del mercado" onClick={()=>onOpenChange(false)} className="rounded-full border border-white/10 p-2 text-[#74807a] hover:text-white"><X className="h-4 w-4"/></button></div><SheetTitle className="font-display text-3xl font-normal tracking-tight text-[#f0efe7]">¿POR QUÉ ESTE PRECIO ES DIFERENTE?</SheetTitle><SheetDescription className="mt-2 text-sm leading-relaxed text-[#6e7973]">Los mercados on-chain siguen operando mientras la referencia tradicional permanece congelada.</SheetDescription></SheetHeader><div className="overflow-y-auto p-7 sm:p-9"><div className="mb-9 flex items-end justify-between"><div><p className="instrument-label">{venue.name.toUpperCase()} · {venue.network}</p><p className="font-display mt-2 text-5xl text-[#ddf9ef]">{money(venue.price)}</p></div><span className="mb-1 font-mono text-sm text-[#8de0c6]">+{difference.toFixed(2)}%</span></div><dl className="divide-y divide-white/[0.07] border-y border-white/[0.07]">{metrics.map(([label,value])=><div key={label} className="flex items-center justify-between py-4 text-sm"><dt className="text-[#6f7a74]">{label}</dt><dd className="font-mono text-[#d8dad4]">{value}</dd></div>)}</dl><div className="mt-8 border-l border-[#9ee8d1]/40 pl-5"><p className="mb-2 text-xs tracking-[0.14em] text-[#98dcc7]">LECTURA EN CLARO</p><p className="text-sm leading-7 text-[#89958f]">Este mercado tokenizado valora {venue.name} ligeramente por encima de la última cotización tradicional. La diferencia puede reflejar información fuera de horario, liquidez del mercado y el costo de operar un activo tokenizado menos líquido. Es una prima observada, no un pronóstico.</p></div></div></SheetContent></Sheet>;
}

function DemoBadge(){return <span className="whitespace-nowrap border border-[#d58a6f]/25 bg-[#d58a6f]/[0.06] px-2.5 py-1.5 text-[9px] tracking-[0.18em] text-[#d88d73]">DATOS DEMO</span>}
function GhostMark(){return <span className="relative block h-7 w-7" aria-hidden="true"><span className="absolute inset-x-1 top-0 h-5 rounded-t-full border border-[#b9e4d6] border-b-0"/><span className="absolute bottom-0 left-1 h-2 w-2 rotate-45 border-b border-l border-[#b9e4d6]"/><span className="absolute bottom-0 left-[11px] h-2 w-2 rotate-45 border-b border-l border-[#b9e4d6]"/><span className="absolute bottom-0 right-1 h-2 w-2 rotate-45 border-b border-l border-[#b9e4d6]"/></span>}
