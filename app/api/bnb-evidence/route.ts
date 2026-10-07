import { NextResponse } from "next/server";
import type { BnbEvidence } from "@/data/bnb-evidence";

const RPC_URL = "https://bsc-dataseed.bnbchain.org";
const WBNB_CONTRACT = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const response = await fetch(RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: method, method, params }),
    signal: AbortSignal.timeout(7_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`BNB RPC returned ${response.status}`);
  const payload = await response.json() as { result?: T; error?: { message?: string } };
  if (payload.error || payload.result === undefined) throw new Error(payload.error?.message ?? "BNB RPC returned no result");
  return payload.result;
}

function formatTokenSupply(hex: string) {
  const raw = BigInt(hex);
  const whole = raw / BigInt(10) ** BigInt(18);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(whole);
}

export async function GET() {
  const observedAt = new Date().toISOString();
  try {
    const [chainHex, blockHex] = await Promise.all([
      rpc<string>("eth_chainId", []),
      rpc<string>("eth_blockNumber", []),
    ]);
    const [block, totalSupplyHex] = await Promise.all([
      rpc<{ number: string; hash: string; timestamp: string }>("eth_getBlockByNumber", [blockHex, false]),
      rpc<string>("eth_call", [{ to: WBNB_CONTRACT, data: "0x18160ddd" }, blockHex]),
    ]);
    const blockNumber = Number.parseInt(block.number, 16);
    const evidence: BnbEvidence = {
      status: "LIVE",
      integrationStatus: "verified",
      network: "BSC Mainnet",
      chainId: Number.parseInt(chainHex, 16),
      blockNumber,
      blockHash: block.hash,
      timestamp: new Date(Number.parseInt(block.timestamp, 16) * 1_000).toISOString(),
      sourceName: "BNB Chain Public JSON-RPC",
      sourceUrl: RPC_URL,
      contractName: "Wrapped BNB (WBNB)",
      contractAddress: WBNB_CONTRACT,
      valueLabel: "totalSupply() at observed block",
      value: `${formatTokenSupply(totalSupplyHex)} WBNB`,
      explorerBlockUrl: `https://bscscan.com/block/${blockNumber}`,
      explorerContractUrl: `https://bscscan.com/token/${WBNB_CONTRACT}`,
      observedAt,
    };
    return NextResponse.json(evidence, { headers: { "cache-control": "public, max-age=15, s-maxage=30" } });
  } catch (error) {
    const unavailable: BnbEvidence = {
      status: "SIMULATED",
      integrationStatus: "unavailable",
      network: "BSC Mainnet",
      chainId: 56,
      blockNumber: null,
      blockHash: null,
      timestamp: null,
      sourceName: "BNB Chain Public JSON-RPC",
      sourceUrl: RPC_URL,
      contractName: null,
      contractAddress: null,
      valueLabel: null,
      value: null,
      explorerBlockUrl: null,
      explorerContractUrl: null,
      observedAt,
      error: error instanceof Error ? error.message : "BNB evidence unavailable",
    };
    return NextResponse.json(unavailable, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
