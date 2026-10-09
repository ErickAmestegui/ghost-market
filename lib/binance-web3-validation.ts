import type { DataStatus } from "@/data/types";

const LIVE_MAX_AGE_MS = 5 * 60_000;
const MAX_CLOCK_SKEW_MS = 60_000;

export function positiveNumberOrNull(value: unknown) {
  const parsed = typeof value === "string" || typeof value === "number" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function timestampToIsoOrNull(value: unknown) {
  const parsed = typeof value === "string" || typeof value === "number" ? Number(value) : Number.NaN;
  if (!Number.isFinite(parsed)) return null;
  const date = new Date(parsed);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function classifyRwaFreshness(value: unknown, updatedAt: unknown, now = Date.now()): DataStatus {
  if (positiveNumberOrNull(value) == null) return "UNAVAILABLE";
  const timestamp = typeof updatedAt === "string" || typeof updatedAt === "number" ? Number(updatedAt) : Number.NaN;
  if (!Number.isFinite(timestamp)) return "CACHED";
  const age = now - timestamp;
  return age >= -MAX_CLOCK_SKEW_MS && age <= LIVE_MAX_AGE_MS ? "LIVE" : "CACHED";
}

export function isBscAddress(value: unknown): value is string {
  return typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value);
}
