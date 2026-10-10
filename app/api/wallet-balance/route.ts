import { NextRequest, NextResponse } from "next/server";
import { formatWeiToBnb, isBscAddress } from "@/lib/wallet-lens";

const RPC_URLS = [
  "https://bsc-dataseed.bnbchain.org",
  "https://bsc-dataseed1.bnbchain.org",
  "https://bsc-dataseed2.bnbchain.org",
];

async function rpc<T>(method: string, params: unknown[]) {
  let lastError: unknown;
  for (const rpcUrl of RPC_URLS) {
    try {
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: method, method, params }),
        signal: AbortSignal.timeout(7_000),
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`${new URL(rpcUrl).hostname} returned ${response.status}`);
      const payload = await response.json() as { result?: T; error?: { message?: string } };
      if (payload.error || payload.result === undefined) throw new Error(payload.error?.message ?? "BNB RPC returned no result");
      return { result: payload.result, rpcUrl };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`${method} failed across BNB RPC endpoints`);
}

export async function POST(request: NextRequest) {
  const readAt = new Date().toISOString();
  try {
    const body = await request.json() as { address?: unknown };
    const address = typeof body.address === "string" ? body.address.trim() : "";
    if (!isBscAddress(address)) {
      return NextResponse.json({ status: "ERROR", error: "Enter a valid 0x-prefixed BSC public address." }, { status: 400, headers: { "cache-control": "no-store" } });
    }

    const [chain, balance, blockNumber] = await Promise.all([
      rpc<string>("eth_chainId", []),
      rpc<string>("eth_getBalance", [address, "latest"]),
      rpc<string>("eth_blockNumber", []),
    ]);
    const block = await rpc<{ number: string; hash: string; timestamp: string }>("eth_getBlockByNumber", [blockNumber.result, false]);
    const sourceBlockNumber = Number.parseInt(block.result.number, 16);
    return NextResponse.json({
      status: "LIVE",
      address,
      network: "BNB Smart Chain Mainnet",
      chainId: Number.parseInt(chain.result, 16),
      balanceBnb: formatWeiToBnb(balance.result),
      balanceWei: balance.result,
      source: "BNB Chain Public JSON-RPC",
      sourceUrl: balance.rpcUrl,
      sourceBlockNumber,
      sourceBlockHash: block.result.hash,
      sourceTimestamp: new Date(Number.parseInt(block.result.timestamp, 16) * 1_000).toISOString(),
      readAt,
      explorerUrl: `https://bscscan.com/address/${address}`,
      ownershipClaimed: false,
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return NextResponse.json({
      status: "ERROR",
      error: error instanceof Error ? error.message : "BNB balance is temporarily unavailable.",
      readAt,
    }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
