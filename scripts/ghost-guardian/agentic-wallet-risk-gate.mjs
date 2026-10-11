import { execFileSync } from "node:child_process";

const USDT = "0x55d398326f99059fF775485246999027B3197955";
const AAPLON = "0x390a684ef9cade28a7ad0dfa61ab1eb3842618c4";
const GUARDIAN = "https://ghost-market-beta.lorgiogc.chatgpt.site/api/ghost-guardian";
const args = [
  "market-order", "quote", "--fromTokenQty", "6", "--fromToken", USDT,
  "--toToken", AAPLON, "--binanceChainId", "56", "--slippage", "1", "--json",
];

function readOnlyQuote() {
  const raw = process.platform === "win32"
    ? execFileSync("cmd.exe", ["/d", "/s", "/c", ["baw", ...args].join(" ")], { encoding: "utf8", timeout: 30_000, windowsHide: true })
    : execFileSync("baw", args, { encoding: "utf8", timeout: 30_000 });
  const body = JSON.parse(raw);
  const quote = body?.data;
  if (body?.success !== true || quote?.fromCoinSymbol !== "USDT" || quote?.toCoinSymbol !== "AAPLon" || Number(quote?.fromCoinAmount) !== 6 || !(Number(quote?.toCoinAmount) > 0) || Number(quote?.slippage) !== 0.01) {
    throw new Error("Agentic Wallet quote response failed validation");
  }
  return quote;
}

const quote = readOnlyQuote();
const response = await fetch(GUARDIAN, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ asset: "AAPLon", amountUsdt: 6 }), signal: AbortSignal.timeout(20_000),
});
const guardian = await response.json();
if (!guardian?.status || guardian?.transactions !== 0) throw new Error("Ghost Guardian response failed validation");

console.log(JSON.stringify({
  runAt: new Date().toISOString(),
  mode: "LOCAL_READ_ONLY",
  agenticWallet: {
    status: "QUOTE_RECEIVED_ROUTE_NOT_ATTRIBUTED",
    input: `${quote.fromCoinAmount} ${quote.fromCoinSymbol}`,
    output: `${quote.toCoinAmount} ${quote.toCoinSymbol}`,
    requestedSlippage: quote.slippage,
  },
  publicGuardian: {
    status: guardian.status,
    requestId: guardian.requestId,
    blockNumber: guardian.freshness?.blockNumber ?? "NOT_VERIFIED",
    checkedRoute: guardian.routes?.[0]?.route ?? "NOT_VERIFIED",
    priceImpactPercent: guardian.routes?.[0]?.estimate?.priceImpactPercent ?? "NOT_VERIFIED",
  },
  overallStatus: "INSUFFICIENT EVIDENCE",
  reason: "The Agentic Wallet quote route and gas were not attributed; the independently checked direct PancakeSwap V2 route is evaluated separately.",
  transactions: 0,
  action: "RESEARCH_ONLY",
}, null, 2));
