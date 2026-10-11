export const GUARDIAN_CHAIN_ID = 56;
export const GUARDIAN_ASSET = {
  id: "AAPLon",
  ticker: "AAPL",
  contract: "0x390a684ef9cade28a7ad0dfa61ab1eb3842618c4",
  counterAsset: "USDT",
  counterContract: "0x55d398326f99059fF775485246999027B3197955",
} as const;
export const PANCAKE_V2_FACTORY = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
export const MIN_INPUT_USDT = 0.1;
export const MAX_INPUT_USDT = 25;
export const ASSUMED_V2_FEE = 0.0025;
export const MAX_ROUTE_IMPACT_PERCENT = 5;

export type GuardianDecision = "REJECTED" | "INSUFFICIENT EVIDENCE" | "CANDIDATE FOR FURTHER REVIEW";

export function validateGuardianInput(asset: unknown, amount: unknown) {
  if (asset !== GUARDIAN_ASSET.id) return { ok: false as const, error: "Only the verified AAPLon / USDT research route is enabled in this release." };
  const parsed = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(parsed) || parsed < MIN_INPUT_USDT || parsed > MAX_INPUT_USDT) {
    return { ok: false as const, error: `Hypothetical input must be between ${MIN_INPUT_USDT} and ${MAX_INPUT_USDT} USDT.` };
  }
  return { ok: true as const, amount: Math.round(parsed * 100) / 100 };
}

export function padAddress(address: string) {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) throw new Error("Invalid contract address");
  return address.slice(2).toLowerCase().padStart(64, "0");
}

export function decodeAddress(hex: string) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(hex)) throw new Error("Invalid address response");
  return `0x${hex.slice(-40).toLowerCase()}`;
}

export function decodeUint(hex: string) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(hex)) throw new Error("Invalid integer response");
  return BigInt(hex);
}

export function decodeString(hex: string) {
  if (!/^0x[0-9a-fA-F]+$/.test(hex)) throw new Error("Invalid string response");
  const raw = hex.slice(2);
  const offset = Number(BigInt(`0x${raw.slice(0, 64)}`));
  const start = offset * 2;
  const length = Number(BigInt(`0x${raw.slice(start, start + 64)}`));
  if (!Number.isInteger(length) || length < 1 || length > 128) throw new Error("Invalid string length");
  const bytes = raw.slice(start + 64, start + 64 + length * 2);
  return new TextDecoder().decode(Uint8Array.from(bytes.match(/.{2}/g) ?? [], (value) => Number.parseInt(value, 16)));
}

export function formatUnits(value: bigint, decimals: number) {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) throw new Error("Invalid token decimals");
  const digits = value.toString().padStart(decimals + 1, "0");
  if (decimals === 0) return digits;
  const fraction = digits.slice(-decimals).replace(/0+$/, "");
  return `${digits.slice(0, -decimals)}${fraction ? `.${fraction}` : ""}`;
}

export function estimateV2Route(input: number, reserveIn: number, reserveOut: number, fee = ASSUMED_V2_FEE) {
  if (![input, reserveIn, reserveOut, fee].every(Number.isFinite) || input <= 0 || reserveIn <= 0 || reserveOut <= 0 || fee < 0 || fee >= 1) {
    throw new Error("Invalid route math input");
  }
  const effectiveInput = input * (1 - fee);
  const output = reserveOut * effectiveInput / (reserveIn + effectiveInput);
  const spotOutput = input * reserveOut / reserveIn;
  const priceImpactPercent = (1 - output / spotOutput) * 100;
  return { output, spotOutput, priceImpactPercent, executionPrice: input / output };
}

export function classifyGuardianRoute(priceImpactPercent: number): GuardianDecision {
  if (!Number.isFinite(priceImpactPercent)) return "INSUFFICIENT EVIDENCE";
  return priceImpactPercent > MAX_ROUTE_IMPACT_PERCENT ? "REJECTED" : "CANDIDATE FOR FURTHER REVIEW";
}

export function explainGuardianDecision(decision: GuardianDecision, impact: number | null, input: number) {
  if (decision === "REJECTED") return `This single PancakeSwap V2 AAPLon/USDT route was rejected because the verified pool reserves imply ${impact?.toFixed(2)}% execution impact for a hypothetical ${input} USDT input, above Ghost Guardian's experimental ${MAX_ROUTE_IMPACT_PERCENT}% review threshold. The finding does not apply to routes that were not checked.`;
  if (decision === "CANDIDATE FOR FURTHER REVIEW") return `The verified pool math stayed within the experimental impact threshold for ${input} USDT, but gas, alternative routes, token transfer behavior and an executable aggregator quote were not checked. This is not a safe-to-trade conclusion.`;
  return "The route could not be classified because one or more required request-time checks failed. Ghost Guardian does not substitute cached or simulated values for missing on-chain evidence.";
}
