"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Database, RefreshCw } from "lucide-react";
import type { BnbEvidence } from "@/data/bnb-evidence";
import type { DataStatus, Locale } from "@/data/types";

export function useBnbEvidence() {
  const [evidence, setEvidence] = useState<BnbEvidence | null>(null);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/bnb-evidence", { cache: "no-store" });
      const payload = await response.json() as BnbEvidence;
      setEvidence(payload);
    } catch {
      setEvidence({ status: "SIMULATED", integrationStatus: "unavailable", network: "BSC Mainnet", chainId: 56, blockNumber: null, blockHash: null, timestamp: null, sourceName: "BNB Chain Public JSON-RPC", sourceUrl: "https://bsc-dataseed.bnbchain.org", contractName: null, contractAddress: null, valueLabel: null, value: null, explorerBlockUrl: null, explorerContractUrl: null, observedAt: new Date().toISOString(), error: "Connection unavailable" });
    } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  return { evidence, loading, reload: load };
}

export function DataBadge({ status }: { status: DataStatus | "LOADING" }) {
  return <span className={`data-status status-${status.toLowerCase()}`}>{status}</span>;
}

export function BnbHeroEvidence({ locale, evidence, loading, onOpen }: { locale: Locale; evidence: BnbEvidence | null; loading: boolean; onOpen: () => void }) {
  return <button className="bnb-hero-evidence" onClick={onOpen} aria-label={locale === "en" ? "View BNB Chain evidence" : "Ver evidencia de BNB Chain"}>
    <div><Database/><span>BUILT ON BNB CHAIN</span><DataBadge status={loading ? "LOADING" : evidence?.status ?? "SIMULATED"}/></div>
    <dl><div><dt>NETWORK</dt><dd>{evidence?.network ?? "BSC Mainnet"}</dd></div><div><dt>CHAIN ID</dt><dd>{evidence?.chainId ?? 56}</dd></div><div><dt>{locale === "en" ? "LAST BLOCK" : "ÚLTIMO BLOQUE"}</dt><dd>{evidence?.blockNumber?.toLocaleString() ?? "—"}</dd></div><div><dt>{locale === "en" ? "SOURCE" : "FUENTE"}</dt><dd>{evidence?.integrationStatus === "verified" ? "PUBLIC RPC" : "INTEGRATION PENDING"}</dd></div></dl>
    <p>{evidence?.status === "LIVE" ? (locale === "en" ? "VERIFIED BNB NETWORK EVIDENCE · MARKET PRICES REMAIN SIMULATED" : "EVIDENCIA BNB VERIFICADA · LOS PRECIOS DE MERCADO SIGUEN SIMULADOS") : "SIMULATED MARKET DATA · BNB INTEGRATION IN PROGRESS"}</p>
  </button>;
}

export function OnchainEvidence({ locale, evidence, loading, reload }: { locale: Locale; evidence: BnbEvidence | null; loading: boolean; reload: () => void }) {
  const shortHash = evidence?.blockHash ? `${evidence.blockHash.slice(0, 10)}…${evidence.blockHash.slice(-8)}` : "—";
  return <section className="onchain-evidence" id="evidence">
    <div className="evidence-title"><div><span>ON-CHAIN EVIDENCE · BNB CHAIN</span><h2>{locale === "en" ? "VERIFIABLE, SOURCE BY SOURCE." : "VERIFICABLE, FUENTE POR FUENTE."}</h2><p>{locale === "en" ? "This network reading is real when marked LIVE. Ghost Market prices and intelligence remain simulated until a verified market-data adapter replaces the demo provider." : "Esta lectura de red es real cuando aparece como LIVE. Los precios y la inteligencia de Ghost Market siguen simulados hasta sustituir el proveedor demo por datos de mercado verificados."}</p></div><div className="evidence-state"><DataBadge status={loading ? "LOADING" : evidence?.status ?? "SIMULATED"}/><button onClick={reload} disabled={loading} aria-label={locale === "en" ? "Refresh BNB evidence" : "Actualizar evidencia BNB"}><RefreshCw/></button></div></div>
    <div className="evidence-ledger"><EvidenceItem label="NETWORK" value={evidence?.network ?? "BSC Mainnet"}/><EvidenceItem label="CHAIN ID" value={String(evidence?.chainId ?? 56)}/><EvidenceItem label="BLOCK" value={evidence?.blockNumber?.toLocaleString() ?? "Unavailable"} href={evidence?.explorerBlockUrl}/><EvidenceItem label="BLOCK HASH" value={shortHash}/><EvidenceItem label="ON-CHAIN TIMESTAMP" value={evidence?.timestamp ? new Date(evidence.timestamp).toLocaleString(locale === "en" ? "en-US" : "es-BO") : "Unavailable"}/><EvidenceItem label="DATA SOURCE" value={evidence?.sourceName ?? "BNB Chain Public JSON-RPC"}/><EvidenceItem label="CONTRACT" value={evidence?.contractName ?? "Not read"} subvalue={evidence?.contractAddress ?? undefined} href={evidence?.explorerContractUrl}/><EvidenceItem label={evidence?.valueLabel ?? "VALUE READ"} value={evidence?.value ?? "Unavailable"}/></div>
    <div className="provenance-note"><b>{locale === "en" ? "PROVENANCE RULE" : "REGLA DE PROCEDENCIA"}</b><p>{locale === "en" ? "LIVE means this value came from the BNB public RPC during this request. SIMULATED means the interface is showing demo-only market information. No transaction is created and no signature is requested." : "LIVE significa que el valor provino del RPC público de BNB durante esta solicitud. SIMULATED indica información de mercado creada para la demo. No se crea ninguna transacción ni se solicita una firma."}</p></div>
  </section>;
}

function EvidenceItem({ label, value, subvalue, href }: { label: string; value: string; subvalue?: string; href?: string | null }) {
  const content = <><span>{label}</span><strong>{value}</strong>{subvalue && <small>{subvalue}</small>}{href && <ArrowUpRight/>}</>;
  return href ? <a href={href} target="_blank" rel="noreferrer">{content}</a> : <div>{content}</div>;
}
