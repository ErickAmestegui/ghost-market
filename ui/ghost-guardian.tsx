"use client";

import { useState } from "react";
import { Blocks, CircleAlert, ExternalLink, FileSearch, LoaderCircle, Search, ShieldCheck, TriangleAlert } from "lucide-react";
import type { Locale } from "@/data/types";

type Report = {
  status: "REJECTED" | "INSUFFICIENT EVIDENCE" | "CANDIDATE FOR FURTHER REVIEW";
  requestId?: string; observedAt?: string; mode?: string; transactions?: number; error?: string;
  input?: { asset: string; amountUsdt: number; network: string; chainId: number };
  identity?: { ticker: string; tokenSymbol: string; tokenContract: string; bytecodePresent: boolean };
  freshness?: { blockNumber: number; blockTime: string; ghostObservedAt: string; source: string };
  routes?: Array<{ route: string; pair: string; factory: string; pairVerifiedByFactory: boolean; reserves: { token: number; tokenSymbol: string; counter: number; counterSymbol: string }; estimate: { outputToken: number; executionPriceUsdt: number; priceImpactPercent: number; assumedFeePercent: number }; decision: string }>;
  notChecked?: string[]; threshold?: { maxPriceImpactPercent: number; experimental: boolean };
  explanation?: { generator: string; text: string };
  sources?: Array<{ label: string; url: string }>;
  warnings?: string[];
};

const tx = (locale: Locale, en: string, es: string) => locale === "en" ? en : es;
const fmt = (value: number | undefined, digits = 4) => value == null ? "—" : value.toLocaleString("en-US", { maximumFractionDigits: digits });
const notCheckedEs: Record<string, string> = {
  "Other DEX pools or multi-hop routes": "Otras pools DEX o rutas multi-hop",
  "Aggregator / Agentic Wallet executable quote route": "Ruta de cotización ejecutable de agregador / Agentic Wallet",
  "Gas estimate": "Estimación de gas",
  "Token transfer taxes or restrictions": "Impuestos o restricciones de transferencia del token",
  "Independent reference-price freshness": "Frescura independiente del precio de referencia",
  "Route identity": "Identidad de la ruta", "Request-time reserves": "Reservas en tiempo de solicitud",
  "Price impact": "Impacto de precio", "Other routes": "Otras rutas",
};
const warningEs: Record<string, string> = {
  "Research result only. Never a safe-to-trade conclusion.": "Solo resultado de investigación. Nunca es una conclusión de que sea seguro operar.",
  "No order, approval, signature, transfer or transaction was requested or produced.": "No se solicitó ni produjo ninguna orden, aprobación, firma, transferencia o transacción.",
  "No cached or simulated fallback was used.": "No se usó ningún fallback cacheado o simulado.",
  "No transaction was requested or produced.": "No se solicitó ni produjo ninguna transacción.",
};

export function GhostGuardian({ locale, displayMode }: { locale: Locale; displayMode: "simple" | "pro" }) {
  const [amount, setAmount] = useState("6");
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [report, setReport] = useState<Report | null>(null);
  const [showWhy, setShowWhy] = useState(false);

  const investigate = async () => {
    setState("loading"); setReport(null); setShowWhy(false);
    try {
      const response = await fetch("/api/ghost-guardian", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ asset: "AAPLon", amountUsdt: Number(amount) }) });
      setReport(await response.json() as Report);
    } catch {
      setReport({ status: "INSUFFICIENT EVIDENCE", error: tx(locale, "The live research endpoint could not be reached.", "No se pudo acceder al endpoint de investigación en vivo.") });
    } finally { setState("done"); }
  };

  const route = report?.routes?.[0];
  const tone = report?.status === "REJECTED" ? "rejected" : report?.status === "CANDIDATE FOR FURTHER REVIEW" ? "review" : "insufficient";
  return <section className="page-shell guardian-page">
    <div className="guardian-hero"><div><p className="eyebrow">GHOST GUARDIAN 2.0 · PUBLIC RUNTIME</p><h1>{tx(locale, "Investigate one route. Preserve every unknown.", "Investiga una ruta. Conserva cada incógnita.")}</h1><p>{tx(locale, "Request-time, read-only BSC research for a bounded hypothetical input. It verifies a single PancakeSwap V2 AAPLon/USDT pool and never requests a wallet, signature or trade.", "Investigación BSC en tiempo de solicitud y solo lectura para una entrada hipotética limitada. Verifica una sola pool PancakeSwap V2 AAPLon/USDT y nunca solicita wallet, firma ni operación.")}</p></div><div className="guardian-seal"><ShieldCheck /><b>READ ONLY</b><span>CHAIN 56</span></div></div>

    <div className="guardian-controls"><label><span>{tx(locale, "Tokenized asset", "Activo tokenizado")}</span><select aria-label={tx(locale, "Tokenized asset", "Activo tokenizado")} value="AAPLon" disabled><option>AAPLon · Ondo · BSC</option></select></label><label><span>{tx(locale, "Hypothetical input", "Entrada hipotética")}</span><div className="guardian-amount"><input type="number" min="0.1" max="25" step="0.1" value={amount} onChange={(event) => setAmount(event.target.value)} aria-label="USDT" /><b>USDT</b></div><small>0.1–25 USDT</small></label><button className="primary-action" onClick={investigate} disabled={state === "loading"}>{state === "loading" ? <LoaderCircle className="spin" /> : <Search />}{tx(locale, "Investigate Route", "Investigar ruta")}</button></div>
    <div className="guardian-safety"><ShieldCheck />{tx(locale, "No order · no approval · no signature · no transfer · no transaction", "Sin orden · sin aprobación · sin firma · sin transferencia · sin transacción")}</div>

    {report && <div className="guardian-report">
      <header className={`guardian-verdict ${tone}`}><div><span>{tx(locale, "AUDITABLE RESULT", "RESULTADO AUDITABLE")}</span><h2>{report.status}</h2><p>{report.error ?? tx(locale, "Applies only to the route and input shown below.", "Aplica solo a la ruta y entrada mostradas abajo.")}</p></div>{report.status === "REJECTED" ? <TriangleAlert /> : report.status === "CANDIDATE FOR FURTHER REVIEW" ? <FileSearch /> : <CircleAlert />}</header>
      {route && <div className="guardian-metrics"><article><span>{tx(locale, "Verified pool", "Pool verificada")}</span><strong>{tx(locale, route.route, "PancakeSwap V2 · ruta directa AAPLon/USDT")}</strong><small>{route.pairVerifiedByFactory ? tx(locale, "Factory match confirmed", "Coincidencia con factory confirmada") : "—"}</small></article><article><span>{tx(locale, "Request-time reserves", "Reservas en la solicitud")}</span><strong>{fmt(route.reserves.counter, 2)} {route.reserves.counterSymbol}</strong><small>{fmt(route.reserves.token, 6)} {route.reserves.tokenSymbol}</small></article><article><span>{tx(locale, "Estimated output", "Salida estimada")}</span><strong>{fmt(route.estimate.outputToken, 8)} AAPLon</strong><small>{fmt(route.estimate.executionPriceUsdt, 4)} USDT / token</small></article><article><span>{tx(locale, "Estimated impact", "Impacto estimado")}</span><strong>{fmt(route.estimate.priceImpactPercent, 2)}%</strong><small>{tx(locale, "Includes assumed 0.25% V2 fee", "Incluye fee V2 supuesto de 0,25%")}</small></article></div>}
      <div className="guardian-evidence-grid"><article><header><Blocks />{tx(locale, "Verified evidence", "Evidencia verificada")}</header><dl><div><dt>{tx(locale, "Network", "Red")}</dt><dd>{tx(locale, report.input?.network ?? "—", "BNB Smart Chain Mainnet")} · {report.input?.chainId ?? 56}</dd></div><div><dt>{tx(locale, "Contract", "Contrato")}</dt><dd>{report.identity?.tokenContract ?? tx(locale, "NOT VERIFIED", "NO VERIFICADO")}</dd></div><div><dt>Block</dt><dd>{report.freshness?.blockNumber?.toLocaleString() ?? tx(locale, "NOT VERIFIED", "NO VERIFICADO")}</dd></div><div><dt>{tx(locale, "Block time", "Hora de bloque")}</dt><dd>{report.freshness?.blockTime ? new Date(report.freshness.blockTime).toLocaleString(locale === "en" ? "en-US" : "es-BO") : tx(locale, "NOT VERIFIED", "NO VERIFICADO")}</dd></div></dl></article><article className="not-checked"><header><CircleAlert />NOT CHECKED</header>{(report.notChecked ?? []).map((item) => <p key={item}>{locale === "es" ? notCheckedEs[item] ?? item : item}</p>)}</article></div>
      <button className="guardian-why" onClick={() => setShowWhy((value) => !value)}><FileSearch /><span><b>{tx(locale, "Why this result?", "¿Por qué este resultado?")}</b><small>{tx(locale, "Generate an explanation strictly from the verified dossier", "Generar una explicación solo desde el expediente verificado")}</small></span></button>
      {showWhy && <div className="guardian-explanation"><span>{report.explanation?.generator ?? "DETERMINISTIC_EVIDENCE_EXPLAINER"}</span><p>{locale === "es" && route ? `Esta única ruta PancakeSwap V2 AAPLon/USDT fue rechazada porque las reservas verificadas de la pool implican ${route.estimate.priceImpactPercent.toFixed(2)}% de impacto de ejecución para una entrada hipotética de ${report.input?.amountUsdt} USDT, por encima del umbral experimental de revisión de ${report.threshold?.maxPriceImpactPercent}%. El hallazgo no aplica a rutas que no fueron revisadas.` : report.explanation?.text}</p><small>{tx(locale, "This is a deterministic evidence explainer, not a hidden or simulated LLM call.", "Este es un explicador determinista de evidencia, no una llamada oculta o simulada a un LLM.")}</small></div>}
      {displayMode === "pro" && <details className="guardian-pro" open><summary>{tx(locale, "Pro evidence dossier", "Expediente Pro")}</summary><dl><div><dt>Request ID</dt><dd>{report.requestId ?? "—"}</dd></div><div><dt>{tx(locale, "Observed", "Observado")}</dt><dd>{report.observedAt ?? "—"}</dd></div><div><dt>Mode / transactions</dt><dd>{report.mode ?? "READ_ONLY"} / {report.transactions ?? 0}</dd></div><div><dt>{tx(locale, "Threshold", "Umbral")}</dt><dd>{report.threshold ? `${report.threshold.maxPriceImpactPercent}% · EXPERIMENTAL` : "—"}</dd></div></dl><div className="guardian-links">{report.sources?.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}<ExternalLink /></a>)}</div></details>}
      <footer>{(report.warnings ?? []).map((warning) => <p key={warning}><TriangleAlert />{locale === "es" ? warningEs[warning] ?? warning : warning}</p>)}</footer>
    </div>}
    {state === "idle" && <div className="guardian-empty"><FileSearch /><h2>{tx(locale, "No route checked yet", "Aún no se revisó ninguna ruta")}</h2><p>{tx(locale, "Run the investigation to create a request-time dossier. Unchecked routes remain explicitly unknown.", "Ejecuta la investigación para crear un expediente en tiempo de solicitud. Las rutas no revisadas permanecen explícitamente desconocidas.")}</p></div>}
  </section>;
}
