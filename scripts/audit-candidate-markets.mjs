const RPC_URL = "https://bsc-dataseed.bnbchain.org";
const XSTOCKS_API = "https://api.xstocks.fi/api/v2";
const FACTORY = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
const ZERO = "0x0000000000000000000000000000000000000000";
const QUOTES = [
  { symbol: "USDT", address: "0x55d398326f99059ff775485246999027b3197955" },
  { symbol: "USDC", address: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d" },
];
const CANDIDATES = ["SPYx", "QQQx"];

const padAddress = (address) => address.toLowerCase().replace(/^0x/, "").padStart(64, "0");
const lastAddress = (value) => `0x${value.slice(-40)}`.toLowerCase();
const units = (value, decimals) => Number(value) / 10 ** decimals;

async function rpc(method, params) {
  const response = await fetch(RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: method, method, params }),
  });
  const payload = await response.json();
  if (!response.ok || payload.error || payload.result === undefined) throw new Error(payload.error?.message ?? `RPC ${method} failed`);
  return payload.result;
}

const call = (to, data, block) => rpc("eth_call", [{ to, data }, block]);

async function inspectPair(base, quote, block) {
  const pair = lastAddress(await call(FACTORY, `0xe6a43905${padAddress(base.address)}${padAddress(quote.address)}`, block));
  if (pair === ZERO) return { base: base.kind, quote: quote.symbol, status: "NO_PAIR" };
  const [token0Hex, token1Hex, reservesHex, baseDecimalsHex, quoteDecimalsHex] = await Promise.all([
    call(pair, "0x0dfe1681", block),
    call(pair, "0xd21220a7", block),
    call(pair, "0x0902f1ac", block),
    call(base.address, "0x313ce567", block),
    call(quote.address, "0x313ce567", block),
  ]);
  const token0 = lastAddress(token0Hex);
  const token1 = lastAddress(token1Hex);
  if (!((token0 === base.address && token1 === quote.address) || (token1 === base.address && token0 === quote.address))) throw new Error("Pair token mismatch");
  const reserve0 = BigInt(`0x${reservesHex.slice(2, 66)}`);
  const reserve1 = BigInt(`0x${reservesHex.slice(66, 130)}`);
  const baseIs0 = token0 === base.address;
  const baseReserve = units(baseIs0 ? reserve0 : reserve1, Number.parseInt(baseDecimalsHex, 16));
  const quoteReserve = units(baseIs0 ? reserve1 : reserve0, Number.parseInt(quoteDecimalsHex, 16));
  const spotPriceUsd = baseReserve > 0 ? quoteReserve / baseReserve : null;
  const liquidityUsd = quoteReserve * 2;
  const amountIn = 100 * 0.9975;
  const amountOut = baseReserve * amountIn / (quoteReserve + amountIn);
  const executionPrice = amountOut > 0 ? 100 / amountOut : null;
  const priceImpact100UsdPct = spotPriceUsd && executionPrice ? (executionPrice / spotPriceUsd - 1) * 100 : null;
  const accepted = Boolean(spotPriceUsd && liquidityUsd >= 1_000 && priceImpact100UsdPct !== null && priceImpact100UsdPct <= 2);
  return { base: base.kind, quote: quote.symbol, status: accepted ? "ACCEPTED" : "REJECTED", pair, baseReserve, quoteReserve, spotPriceUsd, liquidityUsd, priceImpact100UsdPct };
}

const block = await rpc("eth_blockNumber", []);
const findings = [];
for (const symbol of CANDIDATES) {
  const response = await fetch(`${XSTOCKS_API}/public/assets/${symbol}`);
  if (!response.ok) throw new Error(`${symbol} registry returned ${response.status}`);
  const asset = await response.json();
  const deployment = asset.deployments?.find((item) => item.network === "BinanceSmartChain");
  if (!deployment?.address) {
    findings.push({ symbol, status: "NO_OFFICIAL_BSC_DEPLOYMENT" });
    continue;
  }
  const bases = [{ kind: "native", address: deployment.address.toLowerCase() }];
  if (deployment.wrapperAddressV2) bases.push({ kind: "wrapper-v2", address: deployment.wrapperAddressV2.toLowerCase() });
  const markets = [];
  for (const base of bases) for (const quote of QUOTES) markets.push(await inspectPair(base, quote, block));
  findings.push({ symbol, isin: asset.isin, contract: deployment.address, wrapper: deployment.wrapperAddressV2 ?? null, block: Number.parseInt(block, 16), markets });
}

console.log(JSON.stringify(findings, null, 2));
