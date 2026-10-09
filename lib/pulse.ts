import type { PulseItem, SymbolKey } from "../data/types.ts";

function isPulseItem(value: unknown): value is PulseItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<PulseItem>;
  return typeof item.id === "string"
    && typeof item.source === "string"
    && typeof item.trust === "number"
    && typeof item.minutesAgo === "number"
    && (item.stance === "support" || item.stance === "challenge" || item.stance === "context")
    && typeof item.excerpt?.en === "string"
    && typeof item.excerpt?.es === "string";
}

export function normalizePulseItems(source: unknown, symbol: SymbolKey): PulseItem[] {
  const record = source && typeof source === "object" && !Array.isArray(source)
    ? source as Partial<Record<SymbolKey, unknown>>
    : null;
  const items = record ? record[symbol] : source;
  const safeItems = Array.isArray(items) ? items : [];
  return safeItems.filter(isPulseItem);
}
