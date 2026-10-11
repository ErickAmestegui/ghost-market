const PUBLIC_GUARDIAN_ENDPOINT =
  "https://ghost-market-beta.lorgiogc.chatgpt.site/api/ghost-guardian";

export type GhostGuardianStatus =
  | "REJECTED"
  | "INSUFFICIENT EVIDENCE"
  | "CANDIDATE FOR FURTHER REVIEW";

export async function investigateGhostGuardianRoute(amountUsdt: number) {
  if (!Number.isFinite(amountUsdt) || amountUsdt < 0.1 || amountUsdt > 25) {
    throw new Error("amountUsdt must be between 0.1 and 25");
  }
  const response = await fetch(PUBLIC_GUARDIAN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ asset: "AAPLon", amountUsdt }),
    signal: AbortSignal.timeout(20_000),
  });
  const report = await response.json() as Record<string, unknown>;
  const allowed = new Set<GhostGuardianStatus>([
    "REJECTED", "INSUFFICIENT EVIDENCE", "CANDIDATE FOR FURTHER REVIEW",
  ]);
  if (!allowed.has(report.status as GhostGuardianStatus) || report.mode !== "READ_ONLY" || report.transactions !== 0) {
    throw new Error("Invalid Ghost Guardian response contract");
  }
  return { publicDeployment: PUBLIC_GUARDIAN_ENDPOINT, toolStatus: "PUBLIC_LIVE", ...report };
}
