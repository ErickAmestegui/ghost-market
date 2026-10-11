import test from "node:test";
import assert from "node:assert/strict";
import { classifyGuardianRoute, estimateV2Route, explainGuardianDecision, validateGuardianInput } from "../lib/ghost-guardian.ts";
import { buildGuardianReceipt, canonicalJson, sha256Canonical } from "../lib/ghost-receipt.ts";

test("accepts only the bounded AAPLon research request", () => {
  assert.deepEqual(validateGuardianInput("AAPLon", 6), { ok: true, amount: 6 });
  assert.equal(validateGuardianInput("AAPLx", 6).ok, false);
  assert.equal(validateGuardianInput("AAPLon", 0).ok, false);
  assert.equal(validateGuardianInput("AAPLon", 25.1).ok, false);
  assert.equal(validateGuardianInput("AAPLon", "not-a-number").ok, false);
});

test("constant-product impact rises as input consumes more of the pool", () => {
  const small = estimateV2Route(1, 100, 50);
  const large = estimateV2Route(25, 100, 50);
  assert.ok(small.output > 0);
  assert.ok(large.priceImpactPercent > small.priceImpactPercent);
  assert.ok(Math.abs(small.spotOutput - 0.5) < 1e-12);
});

test("classifies only the evaluated route against the experimental threshold", () => {
  assert.equal(classifyGuardianRoute(5.01), "REJECTED");
  assert.equal(classifyGuardianRoute(5), "CANDIDATE FOR FURTHER REVIEW");
  assert.equal(classifyGuardianRoute(Number.NaN), "INSUFFICIENT EVIDENCE");
});

test("evidence explanation keeps unchecked routes and safety limits explicit", () => {
  const text = explainGuardianDecision("REJECTED", 87.97, 6);
  assert.match(text, /single PancakeSwap V2/);
  assert.match(text, /does not apply to routes that were not checked/);
  assert.doesNotMatch(text, /safe to trade/i);
});

test("guardian source contains no credential or transaction methods", async () => {
  const source = await import("node:fs/promises").then((fs) => fs.readFile(new URL("../app/api/ghost-guardian/route.ts", import.meta.url), "utf8"));
  assert.doesNotMatch(source, /private[_ -]?key|seed phrase|eth_sendTransaction|eth_sign|approve\(/i);
});

test("receipt canonicalization and SHA-256 are stable across object key order", async () => {
  const first = { z: 2, a: { y: true, x: "evidence" } };
  const second = { a: { x: "evidence", y: true }, z: 2 };
  assert.equal(canonicalJson(first), canonicalJson(second));
  assert.equal(await sha256Canonical(first), await sha256Canonical(second));
  assert.match(await sha256Canonical(first), /^[0-9a-f]{64}$/);
});

test("receipt identifies public tools and limits the integrity claim", () => {
  const receipt = buildGuardianReceipt({
    status: "REJECTED",
    input: { asset: "AAPLon", amountUsdt: 6, chainId: 56 },
    freshness: { blockNumber: 123 },
  }, "https://public-rpc.example");
  const serialized = canonicalJson(receipt);
  assert.match(serialized, /BNB_CHAIN_JSON_RPC/);
  assert.match(serialized, /PANCAKESWAP_V2_FACTORY_AND_PAIR/);
  assert.match(serialized, /not a signature, attestation, or safe-to-trade claim/);
  assert.doesNotMatch(serialized, /private[_ -]?key|seed phrase/i);
});
