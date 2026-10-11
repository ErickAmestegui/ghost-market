"use client";

import { ArrowRight, Bot, CircleAlert, Clock3, Code2, FileCheck2, Fingerprint, Search, ShieldCheck } from "lucide-react";
import type { Locale } from "@/data/types";

const tx = (locale: Locale, en: string, es: string) => locale === "en" ? en : es;
export function EvidenceRoom({ locale, onGuardian, onReplay, onExit }: { locale: Locale; onGuardian: () => void; onReplay: () => void; onExit: () => void }) {
  const steps = [
    [ShieldCheck, tx(locale, "Purpose", "Propósito"), tx(locale, "Test whether one narrow route has enough evidence—not whether an asset is a good investment.", "Comprobar si una ruta concreta tiene evidencia suficiente, no si un activo es una buena inversión.")],
    [Search, tx(locale, "Token identity", "Identidad del token"), tx(locale, "AAPLon contract bytecode, symbol and its PancakeSwap V2 pair are checked on BSC.", "Se revisan en BSC el bytecode, símbolo y par PancakeSwap V2 de AAPLon.")],
    [FileCheck2, tx(locale, "Real finding", "Hallazgo real"), tx(locale, "A saved 6 USDT investigation was REJECTED at 88.18% estimated route impact.", "Una investigación guardada de 6 USDT fue REJECTED con 88,18 % de impacto estimado.")],
    [Fingerprint, tx(locale, "Integrity", "Integridad"), tx(locale, "Each dossier is canonicalized and hashed with SHA-256; this detects edits but is not a signature.", "Cada expediente se canonicaliza y se hashea con SHA-256; detecta cambios, pero no es una firma.")],
    [Clock3, tx(locale, "Historical memory", "Memoria histórica"), tx(locale, "Two authentic snapshots show NO OBSERVED CHANGE between blocks 126,952,690 and 126,960,194.", "Dos capturas auténticas muestran NO OBSERVED CHANGE entre los bloques 126.952.690 y 126.960.194.")],
    [Bot, tx(locale, "Agent interface", "Interfaz para agentes"), tx(locale, "A public read-only endpoint and packaged Skill reproduce the same bounded workflow.", "Un endpoint público read-only y una Skill empaquetada reproducen el mismo flujo limitado.")],
    [CircleAlert, tx(locale, "Honest boundary", "Límite honesto"), tx(locale, "No wallet, signature or transaction. Gas, transfer restrictions, other routes and fresh reference prices remain unchecked.", "Sin wallet, firma ni transacción. Gas, restricciones de transferencia, otras rutas y precios de referencia frescos no fueron revisados.")],
  ] as const;
  return <section className="page-shell evidence-room">
    <div className="room-hero"><div><span className="room-kicker">JUDGE MODE · ≈ 90 SEC</span><h1>THE EVIDENCE ROOM</h1><p>{tx(locale, "One investigation. Real evidence. Zero transactions.", "Una investigación. Evidencia real. Cero transacciones.")}</p></div><div className="room-mark"><Search /><span>CASE 006</span></div></div>
    <div className="room-layout"><ol>{steps.map(([Icon, title, detail], index) => <li key={title}><b>{String(index + 1).padStart(2, "0")}</b><Icon /><div><h2>{title}</h2><p>{detail}</p>{index === 2 && <button onClick={onGuardian}>{tx(locale, "Open Guardian", "Abrir Guardian")}<ArrowRight /></button>}{index === 4 && <button onClick={onReplay}>{tx(locale, "Verify the replay", "Verificar el replay")}<ArrowRight /></button>}</div></li>)}</ol><aside><span>CASE SUMMARY</span><dl><div><dt>Asset</dt><dd>AAPLon</dd></div><div><dt>Network</dt><dd>BNB Chain · 56</dd></div><div><dt>Input</dt><dd>6 USDT · hypothetical</dd></div><div><dt>Route</dt><dd>PancakeSwap V2 direct</dd></div><div><dt>Decision</dt><dd>REJECTED</dd></div><div><dt>Transactions</dt><dd>0</dd></div></dl><a href="https://github.com/ErickAmestegui/ghost-market" target="_blank" rel="noreferrer"><Code2 />GitHub source<ArrowRight /></a><button onClick={onExit}>{tx(locale, "Return to the full product", "Volver al producto completo")}</button></aside></div>
  </section>;
}
