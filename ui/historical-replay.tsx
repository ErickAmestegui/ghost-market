"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Blocks, CheckCircle2, ExternalLink, FileJson2, Fingerprint, LoaderCircle, ShieldCheck, TriangleAlert } from "lucide-react";
import type { Locale } from "@/data/types";

type ReceiptFile = { receipt: { schemaVersion: string; dossier: { status: string; requestId: string; observedAt: string; input: { amountUsdt: number }; freshness: { blockNumber: number; blockTime: string }; routes: Array<{ route: string; reserves: { token: number; counter: number }; estimate: { priceImpactPercent: number }; decision: string }>; sources: Array<{ label: string; url: string }> } }; receiptHashSha256: string };
type VerifiedReceipt = ReceiptFile & { file: string; verified: boolean; computedHash: string };
const FILES = ["ghost-investigation-442cf727-5ef2-4d06-8f38-83fcf94b717f.json", "ghost-investigation-b7e22486-0042-4b41-9e72-b06d8a3011ad.json"];
const tx = (locale: Locale, en: string, es: string) => locale === "en" ? en : es;

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
}
async function hash(value: unknown) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical(value)));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function HistoricalReplay({ locale, onInvestigate, onJudge }: { locale: Locale; onInvestigate: () => void; onJudge: () => void }) {
  const [receipts, setReceipts] = useState<VerifiedReceipt[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { let active = true; Promise.all(FILES.map(async (file) => { const response = await fetch(`/receipts/${file}`); if (!response.ok) throw new Error(`HTTP ${response.status}`); const item = await response.json() as ReceiptFile; const computedHash = await hash(item.receipt); return { ...item, file, computedHash, verified: item.receipt.schemaVersion === "ghost-investigation-receipt/1.0" && computedHash === item.receiptHashSha256 }; })).then((items) => { if (active) setReceipts(items.sort((a, b) => a.receipt.dossier.observedAt.localeCompare(b.receipt.dossier.observedAt))); }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : String(reason)); }); return () => { active = false; }; }, []);
  const unchanged = useMemo(() => receipts.length === 2 && JSON.stringify(receipts[0].receipt.dossier.routes[0]?.reserves) === JSON.stringify(receipts[1].receipt.dossier.routes[0]?.reserves) && receipts[0].receipt.dossier.routes[0]?.estimate.priceImpactPercent === receipts[1].receipt.dossier.routes[0]?.estimate.priceImpactPercent && receipts[0].receipt.dossier.status === receipts[1].receipt.dossier.status, [receipts]);

  return <section className="page-shell replay-page">
    <div className="replay-hero"><div><p className="eyebrow">AUTHENTIC HISTORICAL REPLAY</p><h1>{tx(locale, "Two receipts. One unchanged observation.", "Dos recibos. Una observación sin cambios.")}</h1><p>{tx(locale, "Ghost loads the original saved files, verifies their canonical SHA-256 in your browser and compares only what those snapshots contain.", "Ghost carga los archivos originales, verifica su SHA-256 canónico en tu navegador y compara solo lo que contienen esas capturas.")}</p></div><div className="replay-seal"><Fingerprint /><b>{receipts.length === 2 && receipts.every((item) => item.verified) ? "2 / 2 VERIFIED" : "VERIFYING"}</b><span>ZERO TRANSACTIONS</span></div></div>
    {error && <div className="replay-error"><TriangleAlert />{tx(locale, "The source receipts could not be loaded: ", "No se pudieron cargar los recibos fuente: ")}{error}</div>}
    {!error && receipts.length === 0 && <div className="replay-loading"><LoaderCircle className="spin" />{tx(locale, "Verifying source files…", "Verificando archivos fuente…")}</div>}
    {receipts.length === 2 && <>
      <div className={`change-banner ${unchanged ? "unchanged" : "changed"}`}><CheckCircle2 /><div><span>{unchanged ? "NO OBSERVED CHANGE" : "CHANGE OBSERVED"}</span><p>{unchanged ? tx(locale, "Reserves, estimated impact and decision are identical across the two saved observations.", "Reservas, impacto estimado y decisión son idénticos en las dos observaciones guardadas.") : tx(locale, "At least one compared field differs.", "Al menos un campo comparado difiere.")}</p></div></div>
      <div className="replay-timeline">{receipts.map((item, index) => { const dossier = item.receipt.dossier; const route = dossier.routes[0]; return <article key={item.file}><header><span>SNAPSHOT {index + 1}</span><b className={item.verified ? "verified" : "failed"}>{item.verified ? "SHA-256 VERIFIED" : "HASH FAILED"}</b></header><div className="replay-block"><Blocks /><div><small>BLOCK</small><strong>{dossier.freshness.blockNumber.toLocaleString()}</strong><time>{new Date(dossier.observedAt).toLocaleString(locale === "en" ? "en-US" : "es-BO")}</time></div></div><dl><div><dt>Route</dt><dd>{route.route}</dd></div><div><dt>USDT reserve</dt><dd>{route.reserves.counter}</dd></div><div><dt>AAPLon reserve</dt><dd>{route.reserves.token}</dd></div><div><dt>{tx(locale, "Estimated impact", "Impacto estimado")}</dt><dd>{route.estimate.priceImpactPercent.toFixed(8)}%</dd></div><div><dt>{tx(locale, "Decision", "Decisión")}</dt><dd className="rejected">{dossier.status}</dd></div></dl><div className="receipt-integrity"><Fingerprint /><code>{item.receiptHashSha256}</code></div><footer><a href={`/receipts/${item.file}`} target="_blank" rel="noreferrer"><FileJson2 />{tx(locale, "View source receipt", "Ver recibo fuente")}</a><a href={`https://bscscan.com/block/${dossier.freshness.blockNumber}`} target="_blank" rel="noreferrer">BscScan<ExternalLink /></a></footer></article>; })}</div>
      <div className="replay-boundary"><ShieldCheck /><div><strong>{tx(locale, "What this replay proves", "Qué demuestra este replay")}</strong><p>{tx(locale, "The two files are internally unchanged and record the same route result at two different blocks. They do not prove that reserves were independently re-read from archive RPC at those historical blocks, nor do they describe other routes or current conditions.", "Los dos archivos mantienen su integridad y registran el mismo resultado de ruta en dos bloques distintos. No prueban que las reservas se hayan releído de forma independiente mediante RPC de archivo en esos bloques históricos, ni describen otras rutas o condiciones actuales.")}</p></div></div>
      <div className="replay-actions"><button className="primary-action" onClick={onInvestigate}>{tx(locale, "Run a current investigation", "Ejecutar investigación actual")}<ArrowRight /></button><button className="secondary-action" onClick={onJudge}>THE EVIDENCE ROOM</button></div>
    </>}
  </section>;
}
