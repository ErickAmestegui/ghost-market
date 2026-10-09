export type NormalizedMarketStatus = "OPEN" | "CLOSED" | "PRE-MARKET" | "AFTER-HOURS" | "HOLIDAY" | "UNKNOWN";

export function normalizeMarketStatus(period: string | null | undefined, openNow: boolean | null | undefined): NormalizedMarketStatus {
  const normalized = period?.trim().toLowerCase().replace(/[_\s]+/g, "-") ?? "";
  if (["pre", "premarket", "pre-market"].includes(normalized)) return "PRE-MARKET";
  if (["extended", "afterhours", "after-hours", "postmarket", "post-market", "overnight"].includes(normalized)) return "AFTER-HOURS";
  if (["holiday", "market-holiday"].includes(normalized)) return "HOLIDAY";
  if (["closed", "close"].includes(normalized)) return "CLOSED";
  if (["market", "regular", "regular-hours", "open"].includes(normalized)) return openNow === false ? "CLOSED" : "OPEN";
  return "UNKNOWN";
}

export function canCalculateAfterHoursGap(status: NormalizedMarketStatus, openNow?: boolean | null) {
  if (status === "AFTER-HOURS") return openNow === true;
  return status === "CLOSED";
}
