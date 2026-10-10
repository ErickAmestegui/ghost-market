
/*
 * GHOST GUARDIAN — ON-CHAIN LIQUIDITY ANALYSIS
 * Binance Agentic Wallet + BNB Smart Chain
 *
 * READ ONLY — NO TRADING — NO TRANSACTIONS
 */

const RPC = "https://bsc-dataseed.bnbchain.org";

const FACTORY = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
const PAIR = "0xe545e390d757f7071b48d3bea88c912df497c3ee";

const AAPLON = "0x390a684ef9cade28a7ad0dfa61ab1eb3842618c4";
const USDT = "0x55d398326f99059fF775485246999027B3197955";

const AMOUNT_USDT = 6;
const ASSUMED_V2_FEE = 0.0025;
const MAX_DEVIATION_PERCENT = 5;

async function rpc(method, params) {
  const response = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params
    }),
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    throw new Error(`RPC HTTP ${response.status}`);
  }

  const body = await response.json();

  if (
    body.error ||
    typeof body.result !== "string" ||
    !/^0x[0-9a-fA-F]*$/.test(body.result)
  ) {
    throw new Error(
      body.error?.message ?? "Invalid RPC response"
    );
  }

  return body.result;
}

function decodeAddress(hex) {
  if (hex.length !== 66) {
    throw new Error("Invalid address response");
  }

  return "0x" + hex.slice(-40).toLowerCase();
}

function decodeUint(hex) {
  if (hex.length !== 66) {
    throw new Error("Invalid integer response");
  }

  return BigInt(hex);
}

function formatUnits(value, decimals) {
  const s = value.toString().padStart(decimals + 1, "0");

  if (decimals === 0) return s;

  const whole = s.slice(0, -decimals);
  const fraction = s.slice(-decimals).replace(/0+$/, "");

  return whole + (fraction ? "." + fraction : "");
}

async function main() {
  console.log("\n👻 GHOST GUARDIAN — LIQUIDITY ANALYSIS");
  console.log("======================================\n");

  // 1. Verify BSC mainnet.
  const chainId = Number(BigInt(await rpc("eth_chainId", [])));

  if (chainId !== 56) {
    throw new Error("Wrong blockchain");
  }

  // Use the same block for all contract reads.
  const blockHex = await rpc("eth_blockNumber", []);
  const blockNumber = BigInt(blockHex);

  const call = (to, data) =>
    rpc("eth_call", [{ to, data }, blockHex]);

  // 2. Verify the pair through PancakeSwap V2 Factory.
  const pad = address =>
    address.toLowerCase().slice(2).padStart(64, "0");

  const factoryCall =
    "0xe6a43905" + pad(AAPLON) + pad(USDT);

  const factoryResult = await call(FACTORY, factoryCall);
  const discoveredPair = decodeAddress(factoryResult);

  if (discoveredPair !== PAIR.toLowerCase()) {
    throw new Error("Pair does not match PancakeSwap Factory");
  }

  // 3. Read pair tokens, reserves and decimals.
  const [token0Hex, token1Hex, reservesHex, decAHex, decUHex] =
    await Promise.all([
      call(PAIR, "0x0dfe1681"),
      call(PAIR, "0xd21220a7"),
      call(PAIR, "0x0902f1ac"),
      call(AAPLON, "0x313ce567"),
      call(USDT, "0x313ce567")
    ]);

  const token0 = decodeAddress(token0Hex);
  const token1 = decodeAddress(token1Hex);

  const expectedTokens = [
    AAPLON.toLowerCase(),
    USDT.toLowerCase()
  ];

  if (
    !expectedTokens.includes(token0) ||
    !expectedTokens.includes(token1) ||
    token0 === token1
  ) {
    throw new Error("Unexpected tokens in pool");
  }

  const reservesData = reservesHex.slice(2);

  if (reservesData.length !== 192) {
    throw new Error("Invalid getReserves response");
  }

  const reserve0 = BigInt(
    "0x" + reservesData.slice(0, 64)
  );

  const reserve1 = BigInt(
    "0x" + reservesData.slice(64, 128)
  );

  const decimalsA = Number(decodeUint(decAHex));
  const decimalsU = Number(decodeUint(decUHex));

  if (
    ![decimalsA, decimalsU].every(
      d => Number.isInteger(d) && d >= 0 && d <= 36
    )
  ) {
    throw new Error("Invalid token decimals");
  }

  const rawA = token0 === AAPLON.toLowerCase()
    ? reserve0 : reserve1;

  const rawU = token0 === USDT.toLowerCase()
    ? reserve0 : reserve1;

  const reserveA = Number(formatUnits(rawA, decimalsA));
  const reserveU = Number(formatUnits(rawU, decimalsU));

  console.log("NETWORK: BNB Smart Chain");
  console.log("CHAIN ID:", chainId);
  console.log("BLOCK:", blockNumber.toString());
  console.log("DEX: PancakeSwap V2");
  console.log("PAIR VERIFIED: YES");

  console.log("\nPOOL RESERVES:");
  console.log("AAPLon:", formatUnits(rawA, decimalsA));
  console.log("USDT:", formatUnits(rawU, decimalsU));

  if (
    !Number.isFinite(reserveA) ||
    !Number.isFinite(reserveU) ||
    reserveA <= 0 ||
    reserveU <= 0
  ) {
    console.log("\nPOOL STATUS: EMPTY OR INVALID");
    console.log("FINAL DECISION: UNAVAILABLE");
    console.log("ACTION: NO TRADE");
    return;
  }

  // 4. Estimate a hypothetical swap using the V2
  // constant-product formula and assumed 0.25% fee.
  const effectiveInput =
    AMOUNT_USDT * (1 - ASSUMED_V2_FEE);

  const estimatedOutput =
    (reserveA * effectiveInput) /
    (reserveU + effectiveInput);

  const spotOutput =
    (AMOUNT_USDT * reserveA) / reserveU;

  const deviationPercent =
    (1 - estimatedOutput / spotOutput) * 100;

  if (
    !Number.isFinite(estimatedOutput) ||
    !Number.isFinite(deviationPercent)
  ) {
    throw new Error("Cannot calculate estimated swap");
  }

  console.log("\n🔍 HYPOTHETICAL SWAP ANALYSIS");
  console.log("--------------------------------");

  console.log("INPUT:", AMOUNT_USDT, "USDT");
  console.log(
    "ESTIMATED OUTPUT:",
    estimatedOutput.toFixed(10),
    "AAPLon"
  );

  console.log(
    "DEVIATION VS POOL SPOT:",
    deviationPercent.toFixed(2) + "%"
  );

  console.log(
    "ASSUMED V2 FEE:",
    (ASSUMED_V2_FEE * 100).toFixed(2) + "%"
  );

  console.log(
    "RISK THRESHOLD:",
    MAX_DEVIATION_PERCENT + "%"
  );

  // 5. Apply a decision ONLY to this PancakeSwap V2 route.
  console.log("\n🛡️ GHOST GUARDIAN DECISION");
  console.log("--------------------------------");

  if (deviationPercent > MAX_DEVIATION_PERCENT) {
    console.log("V2 POOL DECISION: REJECTED");
    console.log("REASON: Excessive estimated execution deviation.");
  } else {
    console.log("V2 POOL DECISION: REVIEW");
    console.log("REASON: Additional verification required.");
  }

  console.log("OTHER DEX ROUTES: NOT VERIFIED");
  console.log("BINANCE WALLET QUOTE ROUTE: UNKNOWN");
  console.log("SOURCE PRICE FRESHNESS: NOT VERIFIED");
  console.log("GAS COST: NOT VERIFIED");

  console.log("\nACTION: NO TRADE");
  console.log("TRANSACTIONS EXECUTED: 0");

  console.log("\nNOTE:");
  console.log(
    "This estimate applies only to this V2 pool, " +
    "not to other possible routing sources."
  );
}

main().catch(error => {
  console.log("\nSTATUS: UNAVAILABLE");
  console.log("ERROR:", error.message);
  console.log("ACTION: NO TRADE");
  process.exitCode = 1;
});
