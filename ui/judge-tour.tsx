"use client";

import { ArrowLeft, ArrowRight, X } from "lucide-react";
import type { Locale } from "@/data/types";

const STEPS = [
  { en: "Ghost Brain signal", es: "Señal de Ghost Brain", detailEn: "See what changed after Wall Street closed.", detailEs: "Descubre qué cambió después del cierre." },
  { en: "Verifiable evidence", es: "Evidencia verificable", detailEn: "Separate live BNB evidence from simulated market data.", detailEs: "Separa evidencia BNB real de datos de mercado simulados." },
  { en: "Consensus under pressure", es: "Consenso bajo presión", detailEn: "Watch Ghost down-weight a false outlier.", detailEs: "Observa cómo Ghost reduce el peso de un outlier falso." },
  { en: "The Morning After", es: "La mañana siguiente", detailEn: "Compare the overnight consensus with the simulated open.", detailEs: "Compara el consenso nocturno con la apertura simulada." },
  { en: "BNB technical proof", es: "Prueba técnica BNB", detailEn: "Finish with network provenance and integration status.", detailEs: "Finaliza con procedencia de red y estado de integración." },
];

export function JudgeTour({ locale, step, onStep, onExit }: { locale: Locale; step: number; onStep: (step: number) => void; onExit: () => void }) {
  const item = STEPS[step];
  return <div className="judge-tour" role="dialog" aria-label={locale === "en" ? "60-second BNB demo" : "Demo BNB de 60 segundos"}>
    <div className="tour-progress"><span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}/></div><div className="tour-copy"><b>{locale === "en" ? `STEP ${step + 1} OF ${STEPS.length}` : `PASO ${step + 1} DE ${STEPS.length}`}</b><strong>{item[locale]}</strong><p>{locale === "en" ? item.detailEn : item.detailEs}</p></div><div className="tour-actions"><button onClick={() => onStep(step - 1)} disabled={step === 0}><ArrowLeft/>{locale === "en" ? "BACK" : "ATRÁS"}</button><button className="tour-next" onClick={() => step === STEPS.length - 1 ? onExit() : onStep(step + 1)}>{step === STEPS.length - 1 ? (locale === "en" ? "FINISH" : "FINALIZAR") : (locale === "en" ? "NEXT" : "SIGUIENTE")}<ArrowRight/></button><button className="tour-exit" onClick={onExit}><X/>{locale === "en" ? "EXIT DEMO" : "SALIR"}</button></div>
  </div>;
}
