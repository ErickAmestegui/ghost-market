"use client";

import Image from "next/image";
import { ArrowRight, Bot, CheckCircle2, ExternalLink, FileCheck2, Fingerprint, Search, ShieldCheck } from "lucide-react";
import type { Locale } from "@/data/types";

const tx = (locale: Locale, en: string, es: string) => locale === "en" ? en : es;

export function HomeExperience({ locale, onInvestigate, onReplay, onJudge }: { locale: Locale; onInvestigate: () => void; onReplay: () => void; onJudge: () => void }) {
  return <section className="new-home page-shell">
    <div className="home-hero">
      <div className="home-message">
        <span className="network-pill"><i /> BSC MAINNET · CHAIN 56 · READ ONLY</span>
        <p className="eyebrow">GHOST MARKET · EVIDENCE-FIRST RESEARCH</p>
        <h1>{tx(locale, "Wall Street closes. The questions don't.", "El mercado cierra. Las preguntas no.")}</h1>
        <p className="home-lead">{tx(locale, "Investigate tokenized stocks on BNB Chain. Verify contracts, liquidity and evidence before trusting a price.", "Investigá acciones tokenizadas en BNB Chain. Verificá contratos, liquidez y evidencia antes de confiar en un precio.")}</p>
        <div className="home-actions">
          <button className="primary-action" onClick={onInvestigate}><Search />{tx(locale, "Investigate now", "Investigar ahora")}<ArrowRight /></button>
          <button className="secondary-action" onClick={onReplay}><FileCheck2 />{tx(locale, "Explore real evidence", "Ver una investigación real")}</button>
        </div>
        <button className="judge-entry" onClick={onJudge}><span>90 SEC</span><strong>THE EVIDENCE ROOM</strong><small>{tx(locale, "A guided judge path · no wallet", "Recorrido guiado para jueces · sin wallet")}</small><ArrowRight /></button>
      </div>

      <div className="home-visual" aria-label={tx(locale, "Historical investigation preview", "Vista previa de investigación histórica")}>
        <div className="ghost-desk"><Image src="/ghost-companion.png" alt={tx(locale, "Ghost detective with magnifying glass", "Detective Ghost con lupa")} width={250} height={250} priority /><span>{tx(locale, "Follow the evidence", "Seguí la evidencia")}</span></div>
        <button className="evidence-preview" onClick={onReplay}>
          <header><span>HISTORICAL EVIDENCE</span><b>RECEIPT 01 / 02</b></header>
          <div className="preview-pair"><div><small>ASSET / INPUT</small><strong>AAPLon · 6 USDT</strong></div><div><small>NETWORK</small><strong>BSC · 56</strong></div></div>
          <div className="preview-route"><small>CHECKED ROUTE</small><strong>PancakeSwap V2 · AAPLon/USDT</strong></div>
          <div className="preview-verdict"><div><small>DECISION</small><strong>REJECTED</strong></div><div><small>EST. IMPACT</small><strong>88.18%</strong></div></div>
          <p><ShieldCheck /> {tx(locale, "Saved at block 126,952,690 · SHA-256 verified", "Guardado en bloque 126.952.690 · SHA-256 verificado")}</p>
          <span className="preview-link">{tx(locale, "Open the full investigation", "Abrir investigación completa")}<ArrowRight /></span>
        </button>
      </div>
    </div>

    <div className="proof-strip" aria-label={tx(locale, "Verified capabilities", "Capacidades verificadas")}>
      <span><ShieldCheck />{tx(locale, "BSC evidence", "Evidencia BSC")}</span>
      <span><Search />{tx(locale, "Read-only research", "Investigación read-only")}</span>
      <span><Fingerprint />SHA-256 receipts</span>
      <span><Bot />API + agent Skill</span>
    </div>

    <div className="home-explain">
      <header><p className="eyebrow">{tx(locale, "HOW GHOST THINKS", "CÓMO PIENSA GHOST")}</p><h2>{tx(locale, "Verify. Investigate. Understand.", "Verificá. Investigá. Entendé.")}</h2><p>{tx(locale, "One narrow question, an evidence trail you can inspect, and an answer that preserves every unknown.", "Una pregunta concreta, una cadena de evidencia inspeccionable y una respuesta que conserva cada incógnita.")}</p></header>
      <div className="home-steps">
        <article><b>01</b><ShieldCheck /><h3>{tx(locale, "Verify identity", "Verificá identidad")}</h3><p>{tx(locale, "Confirm the BSC contract, token symbol and factory-derived pool.", "Confirmá contrato BSC, símbolo del token y pool derivada de la factory.")}</p></article>
        <article><b>02</b><Search /><h3>{tx(locale, "Investigate the route", "Investigá la ruta")}</h3><p>{tx(locale, "Read block-tagged reserves and estimate impact for a bounded hypothetical amount.", "Leé reservas etiquetadas por bloque y estimá impacto para un monto hipotético limitado.")}</p></article>
        <article><b>03</b><CheckCircle2 /><h3>{tx(locale, "Understand the limits", "Entendé los límites")}</h3><p>{tx(locale, "See what passed, what failed and exactly what was not checked.", "Mirá qué pasó, qué falló y exactamente qué no fue revisado.")}</p></article>
      </div>
      <div className="real-result"><div><span>REAL SAVED RESULT</span><strong>6 USDT → REJECTED</strong><p>{tx(locale, "The checked pool held only 0.804226 USDT; its estimated impact was 88.18%. This finding is route-scoped, historical and not financial advice.", "La pool revisada tenía solo 0,804226 USDT; el impacto estimado fue 88,18 %. Este hallazgo es histórico, limitado a esa ruta y no es asesoramiento financiero.")}</p></div><button onClick={onReplay}>{tx(locale, "Verify both receipts", "Verificar ambos recibos")}<ExternalLink /></button></div>
    </div>
  </section>;
}
