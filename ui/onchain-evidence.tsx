"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, Database, RefreshCw } from "lucide-react";
import type { BnbEvidence } from "@/data/bnb-evidence";
import type { BinanceIntegration } from "@/data/binance-integration";
import type { DataStatus, Locale, SymbolKey } from "@/data/types";

const tr = (locale: Locale, en: string, es: string) => locale === "en" ? en : es;

export function useIntegrationEvidence(symbol: SymbolKey) {
  const [evidence, setEvidence] = useState<BnbEvidence | null>(null);
  const [binance, setBinance] = useState<BinanceIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    const fallback: BnbEvidence = { status: "ERROR", integrationStatus: "unavailable", network: "BSC Mainnet", chainId: 56, blockNumber: null, blockHash: null, timestamp: null, sourceName: "BNB Chain Public JSON-RPC", sourceUrl: "https://bsc-dataseed.bnbchain.org", contractName: null, contractAddress: null, valueLabel: null, value: null, explorerBlockUrl: null, explorerContractUrl: null, observedAt: new Date().toISOString(), error: "Connection unavailable", provider: "xStocks", underlyingSymbol: symbol, tokenSymbol: `${symbol}x` as BnbEvidence["tokenSymbol"], decimals: null, codePresent: false };
    try {
      const [chainResponse, binanceResponse] = await Promise.all([
        fetch(`/api/bnb-evidence?symbol=${symbol}`, { cache: "no-store" }),
        fetch(`/api/binance-integration?symbol=${symbol}`, { cache: "no-store" }),
      ]);
      setEvidence(await chainResponse.json() as BnbEvidence);
      setBinance(await binanceResponse.json() as BinanceIntegration);
    } catch {
      setEvidence(fallback);
      setBinance({ status: "ERROR", module: "Binance Stocks Trading Market Data", provider: "Binance Developer API", symbol, endpoints: ["/sapi/v1/equity/market/tokenized-assets", `/sapi/v1/equity/market/quote?symbol=${symbol}`], observedAt: new Date().toISOString(), latencyMs: null, requestId: null, tokenizedAsset: null, quote: null, error: { kind: "UPSTREAM_ERROR", message: "Integration proof could not be loaded." } });
    } finally { setLoading(false); }
  }, [symbol]);
  useEffect(() => { void load(); }, [load]);
  return { evidence, binance, loading, reload: load };
}

export function DataBadge({ status }: { status: DataStatus | "LOADING" }) {
  return <span className={`data-status status-${status.toLowerCase()}`}>{status}</span>;
}

export function BnbHeroEvidence({ locale, evidence, binance, loading, onOpen }: { locale: Locale; evidence: BnbEvidence | null; binance: BinanceIntegration | null; loading: boolean; onOpen: () => void }) {
  const connection = loading ? tr(locale, "CHECKING", "VERIFICANDO") : evidence?.status === "LIVE" ? tr(locale, "VERIFIED", "VERIFICADA") : tr(locale, "UNAVAILABLE", "NO DISPONIBLE");
  const updated = evidence?.observedAt ? new Date(evidence.observedAt).toLocaleTimeString(locale === "en" ? "en-US" : "es-BO", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";
  return <button className="bnb-hero-evidence" onClick={onOpen} aria-label={tr(locale, "View BNB Chain evidence", "Ver evidencia de BNB Chain")}>
    <div><Database/><span>BUILT ON BNB CHAIN · {evidence?.tokenSymbol ?? "xSTOCK"}</span><DataBadge status={loading ? "LOADING" : evidence?.status ?? "ERROR"}/></div>
    <dl><div><dt>{tr(locale, "NETWORK", "RED")}</dt><dd>{evidence?.network ?? "BSC Mainnet"}</dd></div><div><dt>CHAIN ID</dt><dd>{evidence?.chainId ?? 56}</dd></div><div><dt>{tr(locale, "LAST BLOCK", "ÚLTIMO BLOQUE")}</dt><dd>{evidence?.blockNumber?.toLocaleString() ?? "—"}</dd></div><div><dt>{tr(locale, "CONNECTION", "CONEXIÓN")}</dt><dd>{connection}</dd></div><div><dt>{tr(locale, "SOURCE", "FUENTE")}</dt><dd>{evidence?.sourceName ?? "BNB Public RPC"}</dd></div><div><dt>{tr(locale, "UPDATED", "ACTUALIZADO")}</dt><dd>{updated}</dd></div></dl>
    <p>{evidence?.status === "LIVE" ? tr(locale, `LIVE contract proof for ${evidence.tokenSymbol} · market prices remain simulated`, `Contrato ${evidence.tokenSymbol} verificado · los precios de mercado siguen simulados`) : tr(locale, "CONTRACT VERIFICATION UNAVAILABLE · MARKET DATA SIMULATED", "VERIFICACIÓN DE CONTRATO NO DISPONIBLE · DATOS SIMULADOS")}</p>
  </button>;
}

export function OnchainEvidence({ locale, evidence, binance, loading, reload }: { locale: Locale; evidence: BnbEvidence | null; binance: BinanceIntegration | null; loading: boolean; reload: () => void }) {
  const shortHash = evidence?.blockHash ? `${evidence.blockHash.slice(0, 10)}…${evidence.blockHash.slice(-8)}` : "—";
  const midQuote = binance?.quote ? ((Number(binance.quote.bidPrice) + Number(binance.quote.askPrice)) / 2).toFixed(2) : null;
  return <section className="onchain-evidence" id="evidence">
    <div className="evidence-title"><div><span>{tr(locale, "INTEGRATION PROOF", "PRUEBA DE INTEGRACIÓN")} · BNB CHAIN</span><h2>{tr(locale, "VERIFIABLE, SOURCE BY SOURCE.", "VERIFICABLE, FUENTE POR FUENTE.")}</h2><p>{tr(locale, "The selected xStock contract is verified directly on BSC when marked LIVE. Binance quotes are shown only when the server has valid credentials. The analytical venues below remain simulated.", "El contrato xStock seleccionado se verifica directamente en BSC cuando aparece LIVE. Las cotizaciones de Binance solo se muestran con credenciales válidas en el servidor. Los mercados analíticos inferiores siguen siendo simulados.")}</p></div><div className="evidence-state"><button onClick={reload} disabled={loading} aria-label={tr(locale, "Refresh integration proof", "Actualizar prueba de integración")}><RefreshCw/></button></div></div>
    <div className="proof-grid">
      <article className="proof-card"><header><div><span>BNB CHAIN PUBLIC RPC</span><b>eth_getCode · symbol() · totalSupply() · eth_getBlockByNumber</b></div><DataBadge status={loading ? "LOADING" : evidence?.status ?? "ERROR"}/></header><dl><EvidenceItem label={tr(locale, "ASSET", "ACTIVO")} value={`${evidence?.tokenSymbol ?? "—"} · ${evidence?.provider ?? "xStocks"}`}/><EvidenceItem label={tr(locale, "CONTRACT", "CONTRATO")} value={evidence?.contractAddress ?? tr(locale, "Unavailable", "No disponible")} href={evidence?.explorerContractUrl}/><EvidenceItem label={tr(locale, "CHAIN / BLOCK", "CADENA / BLOQUE")} value={`${evidence?.chainId ?? 56} / ${evidence?.blockNumber?.toLocaleString() ?? tr(locale, "Unavailable", "No disponible")}`} href={evidence?.explorerBlockUrl}/><EvidenceItem label="BLOCK HASH" value={shortHash}/><EvidenceItem label={evidence?.valueLabel ?? tr(locale, "ON-CHAIN VALUE", "VALOR ON-CHAIN")} value={evidence?.value ?? tr(locale, "Unavailable", "No disponible")}/><EvidenceItem label={tr(locale, "SOURCE", "FUENTE")} value={evidence?.sourceName ?? "BNB Chain Public JSON-RPC"} href={evidence?.sourceUrl}/><EvidenceItem label={tr(locale, "TIMESTAMP", "MARCA DE TIEMPO")} value={evidence?.timestamp ? new Date(evidence.timestamp).toLocaleString(locale === "en" ? "en-US" : "es-BO") : tr(locale, "Unavailable", "No disponible")}/></dl>{evidence?.error && <p className="proof-error">{tr(locale, "The BNB contract proof is temporarily unavailable. No blockchain value was fabricated.", "La prueba del contrato BNB no está disponible temporalmente. No se inventó ningún valor de blockchain.")}</p>}</article>
      <article className="proof-card"><header><div><span>BINANCE DEVELOPER API</span><b>{binance?.module ?? "Stocks Trading Market Data"}</b></div><DataBadge status={loading ? "LOADING" : binance?.status ?? "UNAVAILABLE"}/></header><dl><EvidenceItem label="ENDPOINT" value="tokenized-assets + latest quote"/><EvidenceItem label={tr(locale, "ASSET", "ACTIVO")} value={binance?.tokenizedAsset ? `${binance.tokenizedAsset.assetCode} · ${binance.tokenizedAsset.assetName}` : tr(locale, `${evidence?.tokenSymbol ?? "xStock"} verification pending`, `Verificación de ${evidence?.tokenSymbol ?? "xStock"} pendiente`)}/><EvidenceItem label={tr(locale, "REFERENCE QUOTE", "COTIZACIÓN DE REFERENCIA")} value={midQuote ? `$${midQuote} bid/ask midpoint` : "UNAVAILABLE"}/><EvidenceItem label="REQUEST ID" value={binance?.requestId ?? tr(locale, "Not supplied", "No proporcionado")}/><EvidenceItem label={tr(locale, "LATENCY", "LATENCIA")} value={binance?.latencyMs === null || binance?.latencyMs === undefined ? tr(locale, "Unavailable", "No disponible") : `${binance.latencyMs} ms`}/><EvidenceItem label={tr(locale, "TIMESTAMP", "MARCA DE TIEMPO")} value={binance?.observedAt ? new Date(binance.observedAt).toLocaleString(locale === "en" ? "en-US" : "es-BO") : tr(locale, "Unavailable", "No disponible")}/></dl>{binance?.error && <p className="proof-error"><b>{binance.error.kind}</b> · {tr(locale, "The Binance adapter is unavailable; no quote is shown.", "El adaptador de Binance no está disponible; no se muestra ninguna cotización.")}</p>}</article>
    </div>
    <div className="availability-grid"><div><span>{tr(locale, "ON-CHAIN TOKEN PRICE", "PRECIO ON-CHAIN DEL TOKEN")}</span><DataBadge status="UNAVAILABLE"/><p>{tr(locale, "No verified DEX pool or oracle adapter is configured.", "No existe un adaptador verificado de pool DEX u oráculo.")}</p></div><div><span>{tr(locale, "LIQUIDITY / ROUTE", "LIQUIDEZ / RUTA")}</span><DataBadge status="UNAVAILABLE"/><p>{tr(locale, "No trading route is claimed; no transaction can be created.", "No se declara una ruta de trading ni se puede crear una transacción.")}</p></div><div><span>{tr(locale, "AGENT PROOF", "PRUEBA DE AGENTE")}</span><DataBadge status="UNAVAILABLE"/><p>{tr(locale, "No Wallet Skill, ERC-8004 identity or persistent agent runtime is deployed.", "No existe Wallet Skill, identidad ERC-8004 ni runtime persistente desplegado.")}</p></div></div>
    <div className="provenance-note"><b>{tr(locale, "PROVENANCE RULE", "REGLA DE PROCEDENCIA")}</b><p>{tr(locale, "LIVE means the value was read during this request from a verifiable source. UNAVAILABLE means the adapter or credentials are missing. SIMULATED and DEMO never represent live market evidence.", "LIVE significa que el valor se leyó durante esta solicitud desde una fuente verificable. UNAVAILABLE indica que falta el adaptador o las credenciales. SIMULATED y DEMO nunca representan evidencia de mercado en vivo.")}</p></div>
  </section>;
}

function EvidenceItem({ label, value, href }: { label: string; value: string; href?: string | null }) {
  const content = <><span>{label}</span><strong>{value}</strong>{href && <ArrowUpRight/>}</>;
  return href ? <a href={href} target="_blank" rel="noreferrer">{content}</a> : <div>{content}</div>;
}
