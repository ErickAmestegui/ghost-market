import type { PulseItem, SymbolKey } from "@/data/types";

const common = {
  NVDA: [
    ["p1", "X", "Verified market researcher", 92, 8, "support", "Token-linked NVDA markets show a persistent premium across several venues; activity is broader than a single pool.", "Los mercados tokenizados de NVDA muestran una prima persistente en varias fuentes; la actividad no se limita a un solo pool."],
    ["p2", "REDDIT", "Long-standing technical contributor", 77, 14, "challenge", "Volume is unusual, but liquidity remains thin on one venue. Treat the headline move carefully.", "El volumen es inusual, pero una fuente aún tiene poca liquidez. Conviene interpretar el movimiento con cautela."],
    ["p3", "OFFICIAL", "BNB Chain status", 98, 21, "context", "Network status is operational; no incident affecting indexed market observations is reported.", "La red funciona con normalidad; no se reportan incidentes que afecten las observaciones indexadas."],
  ],
  AAPL: [
    ["p1", "X", "Token markets analyst", 88, 6, "support", "AAPL representations are moving together, although the divergence remains modest.", "Las representaciones de AAPL se mueven juntas, aunque la divergencia sigue siendo moderada."],
    ["p2", "REDDIT", "Options data contributor", 81, 18, "challenge", "The move lacks confirmation from broader technology-linked instruments.", "El movimiento carece de confirmación de otros instrumentos tecnológicos."],
    ["p3", "OFFICIAL", "Market data notice", 96, 27, "context", "The traditional reference remains the official closing price until the next session.", "La referencia tradicional continúa siendo el cierre oficial hasta la próxima sesión."],
  ],
  TSLA: [
    ["p1", "X", "Cross-market researcher", 90, 5, "support", "TSLA token markets show elevated activity and synchronized repricing after the close.", "Los mercados tokenizados de TSLA muestran mayor actividad y repricing sincronizado tras el cierre."],
    ["p2", "REDDIT", "Liquidity monitor", 83, 12, "challenge", "Spreads widened during the fastest move; part of the divergence may be execution noise.", "Los spreads se ampliaron durante el movimiento más rápido; parte de la divergencia puede ser ruido de ejecución."],
    ["p3", "OFFICIAL", "BNB Chain status", 98, 19, "context", "Indexed blocks are progressing normally in this simulated observation window.", "Los bloques indexados avanzan con normalidad durante esta ventana simulada."],
  ],
} satisfies Record<SymbolKey, Array<[string, PulseItem["platform"], string, number, number, PulseItem["stance"], string, string]>>;

export const PULSE_ITEMS: Record<SymbolKey, PulseItem[]> = Object.fromEntries(
  (Object.keys(common) as SymbolKey[]).map((symbol) => [symbol, common[symbol].map(([id, platform, source, trust, minutesAgo, stance, en, es]) => ({ id: `${symbol}-${id}`, platform, source, trust, minutesAgo, stance, excerpt: { en, es } }))]),
) as Record<SymbolKey, PulseItem[]>;
