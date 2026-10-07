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
  return <button className="bnb-hero-evidence" onClick={onOpen} aria-label={tr(locale, "View BNB Chain evidence", "Ver evidencia de BNB Chain")}>
    <div><Database/><span>{evidence?.tokenSymbol ?? "xSTOCK"} · BSC MAINNET</span><DataBadge status={loading ? "LOADING" : evidence?.status ?? "ERROR"}/></div>
    <dl><div><dt>PROVIDER</dt><dd>{evidence?.provider ?? "xStocks"}</dd></div><div><dt>CHAIN ID</dt><dd>{evidence?.chainId ?? 56}</dd></div><div><dt>{tr(locale, "LAST BLOCK", "ÚLTIMO BLOQUE")}</dt><dd>{evidence?.blockNumber?.toLocaleString() ?? "—"}</dd></div><div><dt>BINANCE API</dt><dd>{binance?.status ?? "UNAVAILABLE"}</dd></div></dl>
    <p>{evidence?.status === "LIVE" ? tr(locale, `LIVE contract proof for ${evidence.tokenSymbol} · market prices remain simulated`, `Contrato ${evidence.tokenSymbol} verificado · los precios de mercado siguen simulados`) : tr(locale, "CONTRACT VERIFICATION UNAVAILABLE · MARKET DATA SIMULATED", "VERIFICACIÓN DE CONTRATO NO DISPONIBLE · DATOS SIMULADOS")}</p>
  </button>;
}

export function OnchainEvidence({ locale, evidence, binance, loading, reload }: { locale: Locale; evidence: BnbEvidence | null; binance: BinanceIntegration | null; loading: boolean; reload: () => void }) {
  const shortHash = evidence?.blockHash ? `${evidence.blockHash.slice(0, 10)}…${evidence.blockHash.slice(-8)}` : "—";
  const midQuote = binance?.quote ? ((Number(binance.quote.bidPrice) + Number(binance.quote.askPrice)) / 2).toFixed(2) : null;
  return <section className="onchain-evidence" id="evidence">
    <div className="evidence-title"><div><span>INTEGRATION PROOF · BNB CHAIN</span><h2>{tr(locale, "VERIFIABLE, SOURCE BY SOURCE.", "VERIFICABLE, FUENTE POR FUENTE.")}</h2><p>{tr(locale, "The selected xStock contract is verified directly on BSC when marked LIVE. Binance quotes are shown only when the server has valid credentials. The analytical venues below remain simulated.", "El contrato xStock seleccionado se verifica directamente en BSC cuando aparece LIVE. Las cotizaciones de Binance solo se muestran con credenciales válidas en el servidor. Los mercados analíticos inferiores siguen siendo simulados.")}</p></div><div className="evidence-state"><button onClick={reload} disabled={loading} aria-label={tr(locale, "Refresh integration proof", "Actualizar prueba de integración")}><RefreshCw/></button></div></div>
    <div className="proof-grid">
      <article className="proof-card"><header><div><span>BNB CHAIN PUBLIC RPC</span><b>eth_getCode · eth_call · eth_getBlockByNumber</b></div><DataBadge status={loading ? "LOADING" : evidence?.status ?? "ERROR"}/></header><dl><EvidenceItem label="ASSET" value={`${evidence?.tokenSymbol ?? "—"} · ${evidence?.provider ?? "xStocks"}`}/><EvidenceItem label="CONTRACT" value={evidence?.contractAddress ?? "Unavailable"} href={evidence?.explorerContractUrl}/><EvidenceItem label="CHAIN / BLOCK" value={`${evidence?.chainId ?? 56} / ${evidence?.blockNumber?.toLocaleString() ?? "Unavailable"}`} href={evidence?.explorerBlockUrl}/><EvidenceItem label="BLOCK HASH" value={shortHash}/><EvidenceItem label={evidence?.valueLabel ?? "ON-CHAIN VALUE"} value={evidence?.value ?? "Unavailable"}/><EvidenceItem label="TIMESTAMP" value={evidence?.timestamp ? new Date(evidence.timestamp).toLocaleString(locale === "en" ? "en-US" : "es-BO") : "Unavailable"}/></dl>{evidence?.error && <p className="proof-error">{evidence.error}</p>}</article>
      <article className="proof-card"><header><div><span>BINANCE DEVELOPER API</span><b>{binance?.module ?? "Stocks Trading Market Data"}</b></div><DataBadge status={loading ? "LOADING" : binance?.status ?? "UNAVAILABLE"}/></header><dl><EvidenceItem label="ENDPOINT" value="tokenized-assets + latest quote"/><EvidenceItem label="ASSET" value={binance?.tokenizedAsset ? `${binance.tokenizedAsset.assetCode} · ${binance.tokenizedAsset.assetName}` : `${evidence?.tokenSymbol ?? "xStock"} verification pending`}/><EvidenceItem label="REFERENCE QUOTE" value={midQuote ? `$${midQuote} bid/ask midpoint` : "UNAVAILABLE"}/><EvidenceItem label="REQUEST ID" value={binance?.requestId ?? "Not supplied"}/><EvidenceItem label="LATENCY" value={binance?.latencyMs === null || binance?.latencyMs === undefined ? "Unavailable" : `${binance.latencyMs} ms`}/><EvidenceItem label="TIMESTAMP" value={binance?.observedAt ? new Date(binance.observedAt).toLocaleString(locale === "en" ? "en-US" : "es-BO") : "Unavailable"}/></dl>{binance?.error && <p className="proof-error"><b>{binance.error.kind}</b> · {binance.error.message}</p>}</article>
    </div>
    <div className="availability-grid"><div><span>ON-CHAIN TOKEN PRICE</span><DataBadge status="UNAVAILABLE"/><p>{tr(locale, "No verified DEX pool or oracle adapter is configured.", "No existe un adaptador verificado de pool DEX u oráculo.")}</p></div><div><span>LIQUIDITY / ROUTE</span><DataBadge status="UNAVAILABLE"/><p>{tr(locale, "No trading route is claimed; no transaction can be created.", "No se declara una ruta de trading ni se puede crear una transacción.")}</p></div><div><span>AGENT PROOF</span><DataBadge status="UNAVAILABLE"/><p>{tr(locale, "No Wallet Skill, ERC-8004 identity or persistent agent runtime is deployed.", "No existe Wallet Skill, identidad ERC-8004 ni runtime persistente desplegado.")}</p></div></div>
    <div className="provenance-note"><b>{tr(locale, "PROVENANCE RULE", "REGLA DE PROCEDENCIA")}</b><p>{tr(locale, "LIVE means the value was read during this request from a verifiable source. UNAVAILABLE means the adapter or credentials are missing. SIMULATED and DEMO never represent live market evidence.", "LIVE significa que el valor se leyó durante esta solicitud desde una fuente verificable. UNAVAILABLE indica que falta el adaptador o las credenciales. SIMULATED y DEMO nunca representan evidencia de mercado en vivo.")}</p></div>
  </section>;
}

function EvidenceItem({ label, value, href }: { label: string; value: string; href?: string | null }) {
  const content = <><span>{label}</span><strong>{value}</strong>{href && <ArrowUpRight/>}</>;
  return href ? <a href={href} target="_blank" rel="noreferrer">{content}</a> : <div>{content}</div>;
}
