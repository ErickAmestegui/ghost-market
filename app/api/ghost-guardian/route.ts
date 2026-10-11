import { NextRequest, NextResponse } from "next/server";
import {
  ASSUMED_V2_FEE, GUARDIAN_ASSET, GUARDIAN_CHAIN_ID, MAX_ROUTE_IMPACT_PERCENT, PANCAKE_V2_FACTORY,
  classifyGuardianRoute, decodeAddress, decodeString, decodeUint, estimateV2Route, explainGuardianDecision,
  formatUnits, padAddress, validateGuardianInput,
} from "@/lib/ghost-guardian";

const RPC_URLS = ["https://bsc-dataseed.bnbchain.org", "https://bsc.publicnode.com"];

async function rpc<T>(method: string, params: unknown[], id: string): Promise<{ result: T; source: string }> {
  let lastError: unknown;
  for (const source of RPC_URLS) {
    try {
      const response = await fetch(source, {
        method: "POST", headers: { "content-type": "application/json" }, cache: "no-store",
        body: JSON.stringify({ jsonrpc: "2.0", id, method, params }), signal: AbortSignal.timeout(8_000),
      });
      const body = await response.json() as { result?: T; error?: { message?: string } };
      if (!response.ok || body.error || body.result === undefined) throw new Error(body.error?.message ?? `RPC HTTP ${response.status}`);
      return { result: body.result, source };
    } catch (error) { lastError = error; }
  }
  throw lastError instanceof Error ? lastError : new Error(`${method} failed across public BSC RPC endpoints`);
}

const call = async (to: string, data: string, block: string, id: string) => (await rpc<string>("eth_call", [{ to, data }, block], id)).result;

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const observedAt = new Date().toISOString();
  const baseHeaders = { "cache-control": "no-store", "x-ghost-request-id": requestId };
  let input: unknown;
  try { input = await request.json(); } catch { return NextResponse.json({ status: "INSUFFICIENT EVIDENCE", error: "Request body must be valid JSON.", requestId }, { status: 400, headers: baseHeaders }); }
  const body = input as { asset?: unknown; amountUsdt?: unknown };
  const validation = validateGuardianInput(body.asset, body.amountUsdt);
  if (!validation.ok) return NextResponse.json({ status: "INSUFFICIENT EVIDENCE", error: validation.error, requestId }, { status: 400, headers: baseHeaders });

  try {
    const chain = await rpc<string>("eth_chainId", [], requestId);
    const chainId = Number(BigInt(chain.result));
    if (chainId !== GUARDIAN_CHAIN_ID) throw new Error(`Unexpected chain ID ${chainId}`);
    const blockRead = await rpc<string>("eth_blockNumber", [], requestId);
    const blockHex = blockRead.result;
    const blockNumber = Number(BigInt(blockHex));
    const block = (await rpc<{ timestamp?: string }>("eth_getBlockByNumber", [blockHex, false], requestId)).result;
    if (!block.timestamp) throw new Error("Block timestamp missing");
    const blockTime = new Date(Number(BigInt(block.timestamp)) * 1000).toISOString();

    const factoryData = `0xe6a43905${padAddress(GUARDIAN_ASSET.contract)}${padAddress(GUARDIAN_ASSET.counterContract)}`;
    const [code, tokenSymbolRaw, pairRaw] = await Promise.all([
      (await rpc<string>("eth_getCode", [GUARDIAN_ASSET.contract, blockHex], requestId)).result,
      call(GUARDIAN_ASSET.contract, "0x95d89b41", blockHex, requestId),
      call(PANCAKE_V2_FACTORY, factoryData, blockHex, requestId),
    ]);
    const tokenSymbol = decodeString(tokenSymbolRaw);
    const pair = decodeAddress(pairRaw);
    if (code === "0x" || tokenSymbol !== GUARDIAN_ASSET.id || /^0x0{40}$/.test(pair)) throw new Error("Contract identity or factory pair verification failed");

    const [token0Raw, token1Raw, reservesRaw, tokenDecimalsRaw, counterDecimalsRaw] = await Promise.all([
      call(pair, "0x0dfe1681", blockHex, requestId), call(pair, "0xd21220a7", blockHex, requestId),
      call(pair, "0x0902f1ac", blockHex, requestId), call(GUARDIAN_ASSET.contract, "0x313ce567", blockHex, requestId),
      call(GUARDIAN_ASSET.counterContract, "0x313ce567", blockHex, requestId),
    ]);
    const token0 = decodeAddress(token0Raw);
    const token1 = decodeAddress(token1Raw);
    const wanted = [GUARDIAN_ASSET.contract.toLowerCase(), GUARDIAN_ASSET.counterContract.toLowerCase()];
    if (!wanted.includes(token0) || !wanted.includes(token1) || token0 === token1) throw new Error("Factory pair contains unexpected tokens");
    const packed = reservesRaw.slice(2);
    if (packed.length !== 192) throw new Error("Invalid getReserves response");
    const reserve0 = BigInt(`0x${packed.slice(0, 64)}`);
    const reserve1 = BigInt(`0x${packed.slice(64, 128)}`);
    const tokenDecimals = Number(decodeUint(tokenDecimalsRaw));
    const counterDecimals = Number(decodeUint(counterDecimalsRaw));
    const tokenReserveRaw = token0 === GUARDIAN_ASSET.contract.toLowerCase() ? reserve0 : reserve1;
    const counterReserveRaw = token0 === GUARDIAN_ASSET.counterContract.toLowerCase() ? reserve0 : reserve1;
    const tokenReserve = Number(formatUnits(tokenReserveRaw, tokenDecimals));
    const counterReserve = Number(formatUnits(counterReserveRaw, counterDecimals));
    const estimate = estimateV2Route(validation.amount, counterReserve, tokenReserve);
    const decision = classifyGuardianRoute(estimate.priceImpactPercent);

    return NextResponse.json({
      status: decision, requestId, observedAt, mode: "READ_ONLY", transactions: 0,
      input: { asset: GUARDIAN_ASSET.id, amountUsdt: validation.amount, network: "BNB Smart Chain Mainnet", chainId },
      identity: { ticker: GUARDIAN_ASSET.ticker, tokenSymbol, tokenContract: GUARDIAN_ASSET.contract, bytecodePresent: code !== "0x" },
      freshness: { blockNumber, blockTime, ghostObservedAt: observedAt, source: blockRead.source },
      routes: [{
        route: "PancakeSwap V2 · direct AAPLon/USDT", pair, factory: PANCAKE_V2_FACTORY, pairVerifiedByFactory: true,
        reserves: { token: tokenReserve, tokenSymbol, counter: counterReserve, counterSymbol: GUARDIAN_ASSET.counterAsset },
        estimate: { outputToken: estimate.output, executionPriceUsdt: estimate.executionPrice, priceImpactPercent: estimate.priceImpactPercent, assumedFeePercent: ASSUMED_V2_FEE * 100 },
        decision,
      }],
      notChecked: ["Other DEX pools or multi-hop routes", "Aggregator / Agentic Wallet executable quote route", "Gas estimate", "Token transfer taxes or restrictions", "Independent reference-price freshness"],
      threshold: { maxPriceImpactPercent: MAX_ROUTE_IMPACT_PERCENT, experimental: true },
      explanation: { generator: "DETERMINISTIC_EVIDENCE_EXPLAINER", text: explainGuardianDecision(decision, estimate.priceImpactPercent, validation.amount) },
      sources: [
        { label: "BNB Chain public JSON-RPC", url: blockRead.source },
        { label: "AAPLon contract", url: `https://bscscan.com/address/${GUARDIAN_ASSET.contract}` },
        { label: "PancakeSwap V2 pair", url: `https://bscscan.com/address/${pair}` },
        { label: "Observed block", url: `https://bscscan.com/block/${blockNumber}` },
      ],
      warnings: ["Research result only. Never a safe-to-trade conclusion.", "No order, approval, signature, transfer or transaction was requested or produced."],
    }, { headers: baseHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Public BSC evidence was unavailable";
    return NextResponse.json({
      status: "INSUFFICIENT EVIDENCE", requestId, observedAt, mode: "READ_ONLY", transactions: 0,
      input: { asset: GUARDIAN_ASSET.id, amountUsdt: validation.amount, network: "BNB Smart Chain Mainnet", chainId: GUARDIAN_CHAIN_ID },
      routes: [], notChecked: ["Route identity", "Request-time reserves", "Price impact", "Other routes", "Gas estimate"],
      explanation: { generator: "DETERMINISTIC_EVIDENCE_EXPLAINER", text: explainGuardianDecision("INSUFFICIENT EVIDENCE", null, validation.amount) },
      error: message, warnings: ["No cached or simulated fallback was used.", "No transaction was requested or produced."],
    }, { status: 503, headers: baseHeaders });
  }
}
