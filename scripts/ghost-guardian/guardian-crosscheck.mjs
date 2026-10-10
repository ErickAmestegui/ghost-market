
import { execFileSync } from "node:child_process";

const USDT = "0x55d398326f99059fF775485246999027B3197955";
const AAPLON = "0x390a684ef9cade28a7ad0dfa61ab1eb3842618c4";
const BASE = "https://www.binance.com";

async function skillRequest(path) {
  const response = await fetch(BASE + path, {
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "identity",
      "User-Agent": "binance-web3/1.1 (Skill)"
    },
    signal: AbortSignal.timeout(15000)
  });

  const type = response.headers.get("content-type") || "";

  if (!response.ok || !type.includes("json")) {
    throw new Error(
      `Wallet Skill unavailable: HTTP ${response.status}, ${type}`
    );
  }

  const body = await response.json();

  if (body.success !== true || String(body.code) !== "000000") {
    throw new Error(
      `Wallet Skill business error: ${body.code ?? "unknown"}`
    );
  }

  return body.data;
}

function walletQuote() {
  const command = [
    "baw market-order quote",
    "--fromTokenQty 6",
    `--fromToken ${USDT}`,
    `--toToken ${AAPLON}`,
    "--binanceChainId 56",
    "--slippage 1",
    "--json"
  ].join(" ");

  const raw = execFileSync(
    "cmd.exe",
    ["/d", "/s", "/c", command],
    { encoding: "utf8", timeout: 30000, windowsHide: true }
  );

  const body = JSON.parse(raw);
  const q = body.data;

  if (
    body.success !== true ||
    q?.fromCoinSymbol !== "USDT" ||
    q?.toCoinSymbol !== "AAPLon" ||
    Number(q.fromCoinAmount) !== 6 ||
    !(Number(q.toCoinAmount) > 0) ||
    Number(q.slippage) !== 0.01
  ) {
    throw new Error("Wallet quote invalid or unavailable");
  }

  return q;
}

async function main() {
  console.log("GHOST GUARDIAN — CROSS-SOURCE RESEARCH");
  console.log("-------------------------------------");

  const tokens = await skillRequest(
    "/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/rwa/stock/detail/list/ai?type=1"
  );

  if (!Array.isArray(tokens)) {
    throw new Error("Invalid token list");
  }

  const token = tokens.find(t =>
    String(t.chainId) === "56" &&
    t.ticker === "AAPL" &&
    t.symbol === "AAPLon" &&
    t.type === 1 &&
    t.contractAddress?.toLowerCase() === AAPLON.toLowerCase()
  );

  if (!token) {
    throw new Error("AAPLon identity not confirmed by Skill");
  }

  const params = `chainId=56&contractAddress=${AAPLON}`;

  const [details, market] = await Promise.all([
    skillRequest(
      "/bapi/defi/v2/public/wallet-direct/buw/wallet/market/token/rwa/dynamic/ai?" + params
    ),
    skillRequest(
      "/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/rwa/asset/market/status/ai?" + params
    )
  ]);

  const price = Number(details?.tokenInfo?.price);
  const multiplier = Number(details?.tokenInfo?.sharesMultiplier);
  const listedMultiplier = Number(token.multiplier);

  if (
    details?.ticker !== "AAPL" ||
    details?.symbol !== "AAPLon" ||
    !Number.isFinite(price) || price <= 0 ||
    !Number.isFinite(multiplier) || multiplier <= 0 ||
    Math.abs(multiplier - listedMultiplier) > 0.000001
  ) {
    throw new Error("Skill returned inconsistent token data");
  }

  const quote = walletQuote();
  const impliedPrice = 6 / Number(quote.toCoinAmount);
  const difference = Math.abs(impliedPrice - price) / price * 100;

  console.log("\nWALLET SKILL:");
  console.log("Identity: AAPLon / Ondo / BSC");
  console.log("Contract: confirmed against Binance token list");
  console.log("Shares per token:", multiplier);
  console.log("Provider token price:", price.toFixed(4), "USD");
  console.log("Normalized per share:", (price / multiplier).toFixed(4), "USD");
  console.log("Market reason:", market.reasonCode ?? "UNKNOWN");

  console.log("\nAGENTIC WALLET:");
  console.log("Input: 6 USDT");
  console.log("Quoted output:", quote.toCoinAmount, "AAPLon");
  console.log("Implied price:", impliedPrice.toFixed(4), "USD/token");

  console.log("\nCOMPARISON:");
  console.log("Difference:", difference.toFixed(3) + "%");
  console.log(
    "Price agreement:",
    difference <= 2 ? "WITHIN 2% TEST THRESHOLD" : "DIVERGENCE DETECTED"
  );

  console.log("\nFINAL DECISION: UNAVAILABLE");
  console.log("Reason: Independent DEX liquidity, execution impact, gas and source-price freshness are not fully verified.");
  console.log("Both sources are Binance-related, not independent oracles.");
  console.log("ACTION: NO TRADE");
  console.log("TRANSACTIONS: 0");
}

main().catch(error => {
  console.log("\nFINAL DECISION: UNAVAILABLE");
  console.log("Reason:", error.message);
  console.log("ACTION: NO TRADE");
  process.exitCode = 1;
});
