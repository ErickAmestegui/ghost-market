import { NextRequest, NextResponse } from "next/server";
import type { BnbEvidence } from "@/data/bnb-evidence";

const RPC_URL = "https://bsc-dataseed.bnbchain.org";
const TOKENS = {
  NVDA: { tokenSymbol: "NVDAx", contract: "0xc845b2894dBddd03858fd2D643B4eF725fE0849d" },
  AAPL: { tokenSymbol: "AAPLx", contract: "0x9d275685dc284c8eb1c79f6aba7a63dc75ec890a" },
  TSLA: { tokenSymbol: "TSLAx", contract: "0x8ad3c73f833d3f9a523ab01476625f269aeb7cf0" },
} as const;
type SupportedSymbol = keyof typeof TOKENS;

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

function formatSupply(hex: string, decimals: number) {
  const raw = BigInt(hex);
  const base = BigInt(10) ** BigInt(decimals);
  const whole = raw / base;
  const remainder = (raw % base).toString().padStart(decimals, "0").slice(0, 4).replace(/0+$/, "");
  return `${new Intl.NumberFormat("en-US").format(whole)}${remainder ? `.${remainder}` : ""}`;
}

function decodeAbiString(hex: string) {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (clean.length < 128) throw new Error("Contract symbol() returned invalid ABI data");
  const offset = Number.parseInt(clean.slice(0, 64), 16) * 2;
  const length = Number.parseInt(clean.slice(offset, offset + 64), 16);
  const valueHex = clean.slice(offset + 64, offset + 64 + length * 2);
  if (!Number.isFinite(length) || valueHex.length !== length * 2) throw new Error("Contract symbol() could not be decoded");
  const bytes = Uint8Array.from(valueHex.match(/.{1,2}/g) ?? [], (value) => Number.parseInt(value, 16));
  return new TextDecoder().decode(bytes).replace(/\0/g, "").trim();
}

export async function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get("symbol")?.toUpperCase();
  const symbol: SupportedSymbol = requested && requested in TOKENS ? requested as SupportedSymbol : "AAPL";
  const token = TOKENS[symbol];
  const observedAt = new Date().toISOString();
  try {
    const [chainHex, blockHex, code] = await Promise.all([
      rpc<string>("eth_chainId", []),
      rpc<string>("eth_blockNumber", []),
      rpc<string>("eth_getCode", [token.contract, "latest"]),
    ]);
    if (code === "0x") throw new Error(`${token.tokenSymbol} contract bytecode unavailable`);
    const [block, symbolHex, decimalsHex, totalSupplyHex] = await Promise.all([
      rpc<{ number: string; hash: string; timestamp: string }>("eth_getBlockByNumber", [blockHex, false]),
      rpc<string>("eth_call", [{ to: token.contract, data: "0x95d89b41" }, blockHex]),
      rpc<string>("eth_call", [{ to: token.contract, data: "0x313ce567" }, blockHex]),
      rpc<string>("eth_call", [{ to: token.contract, data: "0x18160ddd" }, blockHex]),
    ]);
    const blockNumber = Number.parseInt(block.number, 16);
    const onChainSymbol = decodeAbiString(symbolHex);
    if (onChainSymbol !== token.tokenSymbol) throw new Error(`Contract symbol mismatch: expected ${token.tokenSymbol}, received ${onChainSymbol || "empty"}`);
    const decimals = Number.parseInt(decimalsHex, 16);
    const evidence: BnbEvidence = {
      status: "LIVE", integrationStatus: "verified", network: "BSC Mainnet",
      chainId: Number.parseInt(chainHex, 16), blockNumber, blockHash: block.hash,
      timestamp: new Date(Number.parseInt(block.timestamp, 16) * 1_000).toISOString(),
      sourceName: "BNB Chain Public JSON-RPC", sourceUrl: RPC_URL,
      contractName: `${onChainSymbol} · xStocks`, contractAddress: token.contract,
      valueLabel: "totalSupply() at observed block", value: `${formatSupply(totalSupplyHex, decimals)} ${token.tokenSymbol}`,
      explorerBlockUrl: `https://bscscan.com/block/${blockNumber}`,
      explorerContractUrl: `https://bscscan.com/token/${token.contract}`,
      observedAt, provider: "xStocks", underlyingSymbol: symbol, tokenSymbol: token.tokenSymbol,
      decimals, codePresent: true,
    };
    return NextResponse.json(evidence, { headers: { "cache-control": "public, max-age=15, s-maxage=30" } });
  } catch (error) {
    const unavailable: BnbEvidence = {
      status: "ERROR", integrationStatus: "unavailable", network: "BSC Mainnet", chainId: 56,
      blockNumber: null, blockHash: null, timestamp: null,
      sourceName: "BNB Chain Public JSON-RPC", sourceUrl: RPC_URL,
      contractName: `${token.tokenSymbol} · xStocks`, contractAddress: token.contract,
      valueLabel: null, value: null, explorerBlockUrl: null,
      explorerContractUrl: `https://bscscan.com/token/${token.contract}`, observedAt,
      error: error instanceof Error ? error.message : "BNB evidence unavailable",
      provider: "xStocks", underlyingSymbol: symbol, tokenSymbol: token.tokenSymbol,
      decimals: null, codePresent: false,
    };
    return NextResponse.json(unavailable, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
