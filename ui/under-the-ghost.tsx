import type { Locale } from "@/data/types";

export function UnderTheGhost({ locale }: { locale: Locale }) {
  const stages = locale === "en" ? [
    ["01", "TRADITIONAL MARKET", "Closing reference freezes", "WAITING"],
    ["02", "TOKENIZED REPRESENTATION", "The instrument remains observable", "CONNECTED"],
    ["03", "BNB CHAIN", "Market state continues on-chain", "DEMO"],
    ["04", "MARKET OBSERVATIONS", "Price, spread, freshness, activity", "LIVE"],
    ["05", "GHOST ENGINE", "Consensus, confidence, event detection", "LIVE"],
    ["06", "GHOST BRAIN", "Evidence, hypotheses, research and watch", "DEMO"],
  ] : [
    ["01", "MERCADO TRADICIONAL", "La referencia de cierre se congela", "EN ESPERA"],
    ["02", "REPRESENTACIÓN TOKENIZADA", "El instrumento continúa observable", "CONECTADO"],
    ["03", "BNB CHAIN", "El estado del mercado continúa on-chain", "DEMO"],
    ["04", "OBSERVACIONES DE MERCADO", "Precio, spread, frescura y actividad", "ACTIVO"],
    ["05", "GHOST ENGINE", "Consenso, confianza y detección de eventos", "ACTIVO"],
    ["06", "GHOST BRAIN", "Evidencia, hipótesis, investigación y vigilancia", "DEMO"],
  ];
  return <section className="under-ghost" id="under-the-ghost">
    <div className="section-kicker">UNDER THE GHOST · TECHNICAL PATH</div>
    <div className="under-grid">
      <div><h2>{locale === "en" ? <>THE SIGNAL<br/>BENEATH THE SCREEN</> : <>LA SEÑAL<br/>BAJO LA PANTALLA</>}</h2><p>{locale === "en" ? "The beta normalizes simulated observations through an interface-independent engine. Its demo adapter can later be replaced with verified BNB Chain data without rebuilding the visualization." : "La beta normaliza observaciones simuladas mediante un motor independiente de la interfaz. Su adaptador demo puede reemplazarse después con datos verificados de BNB Chain sin rehacer la visualización."}</p><div className="chain-proof"><span>BSC MAINNET</span><b>DATA SOURCE · SIMULATED</b><em>NO TRANSACTION CREATED</em></div></div>
      <ol>{stages.map(([number, title, text, status]) => <li key={number}><span>{number}</span><div><b>{title}</b><p>{text}</p></div><em>{status}</em></li>)}</ol>
    </div>
  </section>;
}

