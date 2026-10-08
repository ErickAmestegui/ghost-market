"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, Database, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react";
import type { BnbEvidence } from "@/data/bnb-evidence";
import type { BinanceIntegration } from "@/data/binance-integration";
import type { LiveEvidence, LiveEvidenceStatus } from "@/data/live-evidence";
import type { DataStatus, Locale, SymbolKey } from "@/data/types";

const tr = (locale: Locale, en: string, es: string) => locale === "en" ? en : es;
const money = (value: number | null | undefined, digits = 2) => value == null ? "—" : `$${value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

export function useIntegrationEvidence(symbol: SymbolKey) {
  const [evidence, setEvidence] = useState<BnbEvidence | null>(null);
  const [binance, setBinance] = useState<BinanceIntegration | null>(null);
  const [live, setLive] = useState<LiveEvidence | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    const now = new Date().toISOString();
    const fallback: BnbEvidence = { status: "ERROR", integrationStatus: "unavailable", network: "BSC Mainnet", chainId: 56, blockNumber: null, blockHash: null, timestamp: null, sourceName: "BNB Chain Public JSON-RPC", sourceUrl: "https://bsc-dataseed.bnbchain.org", contractName: null, contractAddress: null, valueLabel: null, value: null, explorerBlockUrl: null, explorerContractUrl: null, observedAt: now, error: "Connection unavailable", provider: "xStocks", underlyingSymbol: symbol, tokenSymbol: `${symbol}x` as BnbEvidence["tokenSymbol"], decimals: null, codePresent: false };
    try {
      const [chainResponse, binanceResponse, liveResponse] = await Promise.all([
        fetch(`/api/bnb-evidence?symbol=${symbol}`, { cache: "no-store" }),
        fetch(`/api/binance-integration?symbol=${symbol}`, { cache: "no-store" }),
        fetch(`/api/live-evidence?symbol=${symbol}`, { cache: "no-store" }),
      ]);
      setEvidence(await chainResponse.json() as BnbEvidence);
      setBinance(await binanceResponse.json() as BinanceIntegration);
      setLive(await liveResponse.json() as LiveEvidence);
    } catch {
      setEvidence(fallback);
      setLive(null);
      setBinance({ status: "ERROR", module: "Binance Stocks Trading Market Data", provider: "Binance Developer API", symbol, endpoints: ["/sapi/v1/equity/market/tokenized-assets", `/sapi/v1/equity/market/quote?symbol=${symbol}`, `/sapi/v1/equity/market/exchangeInfo?symbol=${symbol}`], documentationUrl: "https://developers.binance.com/en/docs/catalog/advanced-trading-stocks-trading/api/rest-api/market-data", observedAt: now, latencyMs: null, requestId: null, tokenizedAsset: null, quote: null, marketInfo: null, error: { kind: "UPSTREAM_ERROR", message: "Integration proof could not be loaded." } });
    } finally { setLoading(false); }
  }, [symbol]);
  useEffect(() => { const timer = setTimeout(() => { void load(); }, 0); return () => clearTimeout(timer); }, [load]);
  return { evidence, binance, live, loading, reload: load };
}

export function DataBadge({ status }: { status: DataStatus | LiveEvidenceStatus | "LOADING" }) {
  return <span className={`data-status status-${status.toLowerCase()}`}>{status}</span>;
}

export function BnbHeroEvidence({ locale, evidence, live, loading, onOpen }: { locale: Locale; evidence: BnbEvidence | null; live: LiveEvidence | null; loading: boolean; onOpen: () => void }) {
  const verified = evidence?.status === "LIVE" && live?.registry?.status === "LIVE";
  const observedAt = live?.observedAt ?? evidence?.observedAt;
  const updated = observedAt ? new Date(observedAt).toLocaleTimeString(locale === "en" ? "en-US" : "es-BO", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";
  return <button className="bnb-hero-evidence" onClick={onOpen} aria-label={tr(locale, "View BNB Chain evidence", "Ver evidencia de BNB Chain")}>
    <div><Database/><span>BUILT ON BNB CHAIN · {live?.tokenSymbol ?? evidence?.tokenSymbol ?? "xSTOCK"}</span><DataBadge status={loading ? "LOADING" : verified ? "LIVE" : "UNAVAILABLE"}/></div>
    <dl><div><dt>{tr(locale, "NETWORK", "RED")}</dt><dd>BSC Mainnet</dd></div><div><dt>CHAIN ID</dt><dd>56</dd></div><div><dt>{tr(locale, "LAST BLOCK", "ÚLTIMO BLOQUE")}</dt><dd>{evidence?.blockNumber?.toLocaleString() ?? live?.dex?.blockNumber?.toLocaleString() ?? "—"}</dd></div><div><dt>{tr(locale, "CONNECTION", "CONEXIÓN")}</dt><dd>{verified ? tr(locale, "VERIFIED", "VERIFICADA") : tr(locale, "UNAVAILABLE", "NO DISPONIBLE")}</dd></div><div><dt>{tr(locale, "SOURCE", "FUENTE")}</dt><dd>{verified ? "xStocks + BNB RPC" : "BNB Public RPC"}</dd></div><div><dt>{tr(locale, "UPDATED", "ACTUALIZADO")}</dt><dd>{updated}</dd></div></dl>
    <p>{verified ? tr(locale, "LIVE contract + issuer provenance · market prices have independent status", "Contrato + procedencia del emisor LIVE · los precios tienen estado independiente") : tr(locale, "VERIFICATION UNAVAILABLE · NO LIVE CLAIM", "VERIFICACIÓN NO DISPONIBLE · SIN AFIRMACIÓN LIVE")}</p>
  </button>;
}

export function OnchainEvidence({ locale, evidence, binance, live, loading, reload }: { locale: Locale; evidence: BnbEvidence | null; binance: BinanceIntegration | null; live: LiveEvidence | null; loading: boolean; reload: () => void }) {
  const binanceMid = binance?.quote ? (Number(binance.quote.bidPrice) + Number(binance.quote.askPrice)) / 2 : null;
  const marketClosed = live?.market?.currentPeriod ? live.market.currentPeriod !== "market" : null;
  const gapReady = marketClosed === true && live?.dex?.status === "LIVE" && binance?.status === "LIVE" && binanceMid !== null;
  const gapUsd = gapReady ? live!.dex.spotPriceUsd! - binanceMid! : null;
  const gapPct = gapReady ? gapUsd! / binanceMid! * 100 : null;
  const shortHash = evidence?.blockHash ? `${evidence.blockHash.slice(0, 10)}…${evidence.blockHash.slice(-8)}` : "—";
  const registry = live?.registry;
  const dex = live?.dex;

  return <section className="onchain-evidence" id="evidence">
    <div className="evidence-title"><div><span>{tr(locale, "LIVE EVIDENCE MODE", "MODO EVIDENCIA LIVE")} · BNB CHAIN</span><h2>{tr(locale, "PROVENANCE BEFORE PRICE.", "PROCEDENCIA ANTES QUE PRECIO.")}</h2><p>{tr(locale, "Every claim below has its own status. A real contract does not automatically make a market price reliable, and a moving animation never makes data live.", "Cada afirmación tiene su propio estado. Un contrato real no convierte automáticamente un precio en fiable, y una animación activa nunca convierte datos en live.")}</p></div><div className="evidence-state"><button onClick={reload} disabled={loading} aria-label={tr(locale, "Refresh integration proof", "Actualizar prueba de integración")}><RefreshCw/></button></div></div>

    <article className={`live-gap ${gapReady ? "complete" : "incomplete"}`}>
      <div className="live-gap-heading"><div><span>PRIMARY SIGNAL · LIVE AFTER-HOURS GAP</span><h3>{marketClosed === false ? tr(locale, "PAUSED WHILE THE TRADITIONAL MARKET IS OPEN", "PAUSADA MIENTRAS EL MERCADO TRADICIONAL ESTÁ ABIERTO") : gapReady ? tr(locale, "VERIFIED GAP AVAILABLE", "BRECHA VERIFICADA DISPONIBLE") : tr(locale, "INCOMPLETE EVIDENCE", "EVIDENCIA INCOMPLETA")}</h3></div><DataBadge status={gapReady ? "LIVE" : "UNAVAILABLE"}/></div>
      <div className="live-gap-values"><div><span>{tr(locale, "ON-CHAIN PRICE", "PRECIO ON-CHAIN")}</span><strong>{dex?.status === "LIVE" ? money(dex.spotPriceUsd) : "—"}</strong><small>{dex?.status === "REJECTED" ? tr(locale, "Observed pool rejected", "Pool observado rechazado") : dex?.venue ?? "PancakeSwap V2"}</small></div><i>−</i><div><span>{tr(locale, "TRADITIONAL REFERENCE", "REFERENCIA TRADICIONAL")}</span><strong>{binance?.status === "LIVE" ? money(binanceMid) : "—"}</strong><small>Binance Developer API</small></div><i>=</i><div><span>{tr(locale, "AFTER-HOURS GAP", "BRECHA FUERA DE HORARIO")}</span><strong>{gapPct == null ? "—" : `${gapPct >= 0 ? "+" : ""}${gapPct.toFixed(2)}%`}</strong><small>{gapUsd == null ? tr(locale, "Not calculated", "No calculada") : `${gapUsd >= 0 ? "+" : ""}${money(gapUsd)}`}</small></div></div>
      <div className="live-gap-meta"><span>{tr(locale, "MARKET STATUS", "ESTADO DEL MERCADO")} <b>{live?.market?.currentPeriod?.toUpperCase() ?? "UNAVAILABLE"}</b></span><span>{tr(locale, "NEXT CHANGE", "PRÓXIMO CAMBIO")} <b>{live?.market?.nextChangeAt ? new Date(live.market.nextChangeAt).toLocaleString(locale === "en" ? "en-US" : "es-BO") : "—"}</b></span><span>{tr(locale, "LIQUIDITY", "LIQUIDEZ")} <b>{dex?.liquidityUsd == null ? "—" : money(dex.liquidityUsd)}</b></span><span>{tr(locale, "CONFIDENCE", "CONFIANZA")} <b>{gapReady ? tr(locale, "EVIDENCE COMPLETE", "EVIDENCIA COMPLETA") : "UNAVAILABLE"}</b></span></div>
      {!gapReady && <p className="gap-warning"><TriangleAlert/>{marketClosed === false ? tr(locale, "Ghost Market will not label a regular-session difference as an after-hours gap.", "Ghost Market no etiqueta una diferencia de sesión regular como brecha fuera de horario.") : tr(locale, "The gap stays blank until both a valid Binance reference and an accepted on-chain market are available. Simulated scores are never substituted.", "La brecha queda vacía hasta contar con una referencia válida de Binance y un mercado on-chain aceptado. Nunca se sustituyen con scores simulados.")}</p>}
    </article>

    <div className="verification-ladder">{(live?.verification ?? []).map((item) => <a key={item.label} href={item.url ?? undefined} target={item.url ? "_blank" : undefined} rel="noreferrer"><ShieldCheck/><span>{item.label}<small>{item.detail}</small></span><DataBadge status={item.status}/></a>)}</div>

    <div className="proof-grid proof-grid-wide">
      <article className="proof-card"><header><div><span>OFFICIAL XSTOCKS REGISTRY</span><b>{registry?.assetName ?? live?.tokenSymbol ?? "Asset provenance"}</b></div><DataBadge status={loading ? "LOADING" : registry?.status ?? "UNAVAILABLE"}/></header><dl><EvidenceItem label={tr(locale, "PROVIDER", "PROVEEDOR")} value={registry?.provider ?? "xStocks / Backed Assets"}/><EvidenceItem label="ISIN" value={registry?.isin ?? "—"}/><EvidenceItem label={tr(locale, "OFFICIAL BSC CONTRACT", "CONTRATO BSC OFICIAL")} value={registry?.contractAddress ?? "UNAVAILABLE"} href={registry?.contractAddress ? `https://bscscan.com/token/${registry.contractAddress}` : null}/><EvidenceItem label={tr(locale, "REGISTRY RESPONSE", "RESPUESTA DEL REGISTRO")} value={registry?.apiUrl ?? "UNAVAILABLE"} href={registry?.apiUrl}/><EvidenceItem label={tr(locale, "ISSUER DOCUMENTATION", "DOCUMENTACIÓN DEL EMISOR")} value="Backed Assets legal documentation" href={registry?.legalUrl}/></dl></article>
      <article className="proof-card"><header><div><span>BNB CHAIN PUBLIC RPC</span><b>eth_getCode · symbol() · totalSupply()</b></div><DataBadge status={loading ? "LOADING" : evidence?.status ?? "ERROR"}/></header><dl><EvidenceItem label={tr(locale, "CONTRACT", "CONTRATO")} value={evidence?.contractAddress ?? "UNAVAILABLE"} href={evidence?.explorerContractUrl}/><EvidenceItem label={tr(locale, "CHAIN / BLOCK", "CADENA / BLOQUE")} value={`${evidence?.chainId ?? 56} / ${evidence?.blockNumber?.toLocaleString() ?? "—"}`} href={evidence?.explorerBlockUrl}/><EvidenceItem label="BLOCK HASH" value={shortHash}/><EvidenceItem label={evidence?.valueLabel ?? tr(locale, "ON-CHAIN VALUE", "VALOR ON-CHAIN")} value={evidence?.value ?? "UNAVAILABLE"}/><EvidenceItem label={tr(locale, "TIMESTAMP", "MARCA DE TIEMPO")} value={evidence?.timestamp ? new Date(evidence.timestamp).toLocaleString(locale === "en" ? "en-US" : "es-BO") : "—"}/></dl></article>
      <article className="proof-card"><header><div><span>BINANCE DEVELOPER API</span><b>Stocks Trading Market Data</b></div><DataBadge status={loading ? "LOADING" : binance?.status ?? "UNAVAILABLE"}/></header><dl><EvidenceItem label="ENDPOINTS" value="tokenized-assets · quote · exchangeInfo" href={binance?.documentationUrl}/><EvidenceItem label={tr(locale, "BINANCE ASSET", "ACTIVO BINANCE")} value={binance?.tokenizedAsset ? `${binance.tokenizedAsset.assetCode} · ${binance.tokenizedAsset.assetName}` : "UNAVAILABLE"}/><EvidenceItem label={tr(locale, "REFERENCE QUOTE", "COTIZACIÓN DE REFERENCIA")} value={binanceMid == null ? "UNAVAILABLE" : money(binanceMid)}/><EvidenceItem label={tr(locale, "TRADABILITY", "OPERABILIDAD")} value={binance?.marketInfo?.tradability ?? "UNAVAILABLE"}/><EvidenceItem label="REQUEST ID" value={binance?.requestId ?? tr(locale, "Not supplied", "No proporcionado")}/><EvidenceItem label={tr(locale, "LATENCY", "LATENCIA")} value={binance?.latencyMs == null ? "—" : `${binance.latencyMs} ms`}/></dl>{binance?.error && <p className="proof-error"><b>{binance.error.kind}</b> · {binance.error.message}</p>}</article>
    </div>

    <div className="dex-proof"><div><span>PANCAKESWAP V2 · VERIFIED POOL CHECK</span><h3>{dex?.status === "LIVE" ? tr(locale, "MARKET ACCEPTED", "MERCADO ACEPTADO") : dex?.status === "REJECTED" ? tr(locale, "WEAK SIGNAL REJECTED", "SEÑAL DÉBIL RECHAZADA") : tr(locale, "NO VERIFIED MARKET FOUND", "NO SE ENCONTRÓ UN MERCADO VERIFICADO")}</h3><p>{dex?.rejectionReason ?? (dex?.status === "LIVE" ? tr(locale, "Pool passed the minimum liquidity and price-impact controls.", "El pool superó los controles mínimos de liquidez e impacto de precio.") : tr(locale, "Checking official deployments and verified BNB markets. No price is promoted before validation.", "Comprobando despliegues oficiales y mercados BNB verificados. Ningún precio se publica antes de validarlo."))}</p></div><dl><EvidenceItem label={tr(locale, "PAIR", "PAR")} value={dex?.pairAddress ?? "UNAVAILABLE"} href={dex?.explorerUrl}/><EvidenceItem label={tr(locale, "OBSERVED SPOT", "SPOT OBSERVADO")} value={money(dex?.spotPriceUsd)}/><EvidenceItem label={tr(locale, "POOL LIQUIDITY", "LIQUIDEZ DEL POOL")} value={money(dex?.liquidityUsd)}/><EvidenceItem label={tr(locale, "PRICE IMPACT · $100", "IMPACTO DE PRECIO · $100")} value={dex?.priceImpact100UsdPct == null ? "—" : `${dex.priceImpact100UsdPct.toFixed(2)}%`}/><EvidenceItem label={tr(locale, "POOL FEE / SPREAD", "COMISIÓN / SPREAD")} value={`${dex?.poolFeeBps ?? 25} bps / ${tr(locale, "spread unavailable", "spread no disponible")}`}/><EvidenceItem label={tr(locale, "BLOCK", "BLOQUE")} value={dex?.blockNumber?.toLocaleString() ?? "—"} href={dex?.blockNumber ? `https://bscscan.com/block/${dex.blockNumber}` : null}/></dl></div>

    <div className="availability-grid"><div><span>{tr(locale, "OFFICIAL REFERENCE", "REFERENCIA OFICIAL")}</span><DataBadge status={live?.reference?.status ?? "UNAVAILABLE"}/><p>{live?.reference?.priceUsd ? `${money(live.reference.priceUsd)} · ${tr(locale, "provider timestamp not supplied", "timestamp del proveedor no incluido")}` : tr(locale, "No xStocks reference returned.", "xStocks no devolvió referencia.")}</p></div><div><span>{tr(locale, "ORACLE PROVENANCE", "PROCEDENCIA DEL ORÁCULO")}</span><DataBadge status={live?.oracle?.status ?? "UNAVAILABLE"}/><p>{live?.oracle?.provider ? `${live.oracle.provider} · ${live.oracle.feedType} · ${live.oracle.feedId?.slice(0, 14)}…` : tr(locale, "No BSC oracle metadata returned.", "No se devolvieron metadatos del oráculo BSC.")}</p></div><div><span>{tr(locale, "AGENT / WALLET PROOF", "PRUEBA DE AGENTE / WALLET")}</span><DataBadge status="UNAVAILABLE"/><p>{tr(locale, "Not implemented. No wallet connection, signature or transaction is simulated.", "No implementado. No se simula conexión de wallet, firma ni transacción.")}</p></div></div>
    <div className="provenance-note"><b>{tr(locale, "PROVENANCE RULE", "REGLA DE PROCEDENCIA")}</b><p>{tr(locale, "LIVE means a value was read during this request from a verifiable source. CACHED is real provider data without request-time freshness. REJECTED is a real observation that failed quality controls. SIMULATED belongs only to the deterministic demo.", "LIVE significa que el valor se leyó durante esta solicitud desde una fuente verificable. CACHED es dato real del proveedor sin frescura de la solicitud. REJECTED es una observación real que falló controles de calidad. SIMULATED pertenece solo a la demo determinista.")}</p><small>Request ID: {live?.requestId ?? "—"} · {live?.latencyMs == null ? "—" : `${live.latencyMs} ms`} · {live?.observedAt ? new Date(live.observedAt).toISOString() : "—"}</small></div>
  </section>;
}

function EvidenceItem({ label, value, href }: { label: string; value: string; href?: string | null }) {
  const content = <><span>{label}</span><strong>{value}</strong>{href && <ArrowUpRight/>}</>;
  return href ? <a href={href} target="_blank" rel="noreferrer">{content}</a> : <div>{content}</div>;
}
