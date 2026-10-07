import type { Locale } from "@/data/types";

export function UnderTheGhost({ locale }: { locale: Locale }) {
  const stages = locale === "en" ? [
    ["01", "TRADITIONAL REFERENCE", "Frozen close used only by the replay", "SIMULATED"],
    ["02", "XSTOCK CONTRACT", "Selected AAPLx, NVDAx or TSLAx contract", "LIVE IF VERIFIED"],
    ["03", "BNB CHAIN RPC", "Bytecode, decimals, supply and block proof", "LIVE"],
    ["04", "BINANCE MARKET DATA", "Official Stocks Trading endpoints", "NEEDS API KEY"],
    ["05", "GHOST ENGINE", "Consensus, confidence and outlier stress test", "DETERMINISTIC"],
    ["06", "AGENT / EXECUTION", "Wallet Skill, identity and trading route", "NOT IMPLEMENTED"],
  ] : [
    ["01", "REFERENCIA TRADICIONAL", "Cierre congelado usado solo por el replay", "SIMULADO"],
    ["02", "CONTRATO XSTOCK", "Contrato AAPLx, NVDAx o TSLAx seleccionado", "LIVE SI SE VERIFICA"],
    ["03", "RPC DE BNB CHAIN", "Bytecode, decimales, supply y bloque", "LIVE"],
    ["04", "DATOS DE BINANCE", "Endpoints oficiales de Stocks Trading", "REQUIERE API KEY"],
    ["05", "GHOST ENGINE", "Consenso, confianza y prueba de outlier", "DETERMINISTA"],
    ["06", "AGENTE / EJECUCIÓN", "Wallet Skill, identidad y ruta de trading", "NO IMPLEMENTADO"],
  ];
  return <section className="under-ghost" id="under-the-ghost">
    <div className="section-kicker">UNDER THE GHOST · TECHNICAL PATH</div>
    <div className="under-grid">
      <div><h2>{locale === "en" ? <>THE SIGNAL<br/>BENEATH THE SCREEN</> : <>LA SEÑAL<br/>BAJO LA PANTALLA</>}</h2><p>{locale === "en" ? "The beta separates verifiable BSC contract proof from its deterministic market simulation. Missing credentials or adapters are shown as unavailable—never disguised as live data." : "La beta separa la prueba verificable del contrato en BSC de su simulación determinista. Las credenciales o adaptadores faltantes aparecen como no disponibles, nunca como datos en vivo."}</p><div className="chain-proof"><span>BSC MAINNET</span><b>XSTOCK CONTRACT · LIVE WHEN VERIFIED</b><em>NO TRANSACTION CREATED</em></div></div>
      <ol>{stages.map(([number, title, text, status]) => <li key={number}><span>{number}</span><div><b>{title}</b><p>{text}</p></div><em>{status}</em></li>)}</ol>
    </div>
  </section>;
}

