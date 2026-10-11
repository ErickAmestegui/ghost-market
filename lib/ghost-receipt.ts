export const GHOST_RECEIPT_SCHEMA = "ghost-investigation-receipt/1.0";
export const GHOST_GUARDIAN_ALGORITHM = "ghost-guardian-route-research/2.1";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export function canonicalJson(value: JsonValue): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
}

export async function sha256Canonical(value: JsonValue) {
  const bytes = new TextEncoder().encode(canonicalJson(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function buildGuardianReceipt(dossier: Record<string, unknown>, rpcSource?: string) {
  const blockNumber = (dossier.freshness as { blockNumber?: number } | undefined)?.blockNumber;
  const input = dossier.input as { asset?: string; amountUsdt?: number; chainId?: number } | undefined;
  return {
    schemaVersion: GHOST_RECEIPT_SCHEMA,
    canonicalization: "JSON keys sorted recursively; UTF-8; no whitespace",
    integrityClaim: "SHA-256 detects dossier changes. It is not a signature, attestation, or safe-to-trade claim.",
    generatedBy: {
      product: "Ghost Guardian 2.0",
      algorithmVersion: GHOST_GUARDIAN_ALGORITHM,
      execution: "PUBLIC_RUNTIME_READ_ONLY",
    },
    toolInvocations: [
      {
        tool: "BNB_CHAIN_JSON_RPC",
        methods: ["eth_chainId", "eth_blockNumber", "eth_getBlockByNumber", "eth_getCode", "eth_call"],
        publicParameters: { endpoint: rpcSource ?? "UNAVAILABLE", chainId: input?.chainId ?? 56, blockNumber: blockNumber ?? "NOT_VERIFIED" },
      },
      {
        tool: "PANCAKESWAP_V2_FACTORY_AND_PAIR",
        methods: ["getPair", "token0", "token1", "getReserves"],
        publicParameters: { asset: input?.asset ?? "AAPLon", hypotheticalAmountUsdt: input?.amountUsdt ?? "NOT_AVAILABLE" },
      },
    ],
    dossier,
  } as JsonValue;
}
