import test from "node:test";
import assert from "node:assert/strict";
import { canonicalJson, invokeGuardian, receiptHash, validateGuardianResponse } from "../skills/ghost-guardian/scripts/invoke.mjs";

const amount = 6;

function validBody(status = "REJECTED") {
  const dossier = {
    status,
    mode: "READ_ONLY",
    transactions: 0,
    input: { asset: "AAPLon", amountUsdt: amount, chainId: 56 },
    routes: status === "INSUFFICIENT EVIDENCE" ? [] : [{ route: "PancakeSwap V2 · direct AAPLon/USDT" }],
  };
  const receipt = {
    integrityClaim: "SHA-256 detects dossier changes. It is not a signature, attestation, or safe-to-trade claim.",
    dossier,
  };
  return { ...dossier, receipt, receiptHashSha256: receiptHash(receipt) };
}

test("skill helper canonicalizes and verifies its receipt", () => {
  assert.equal(canonicalJson({ z: 2, a: 1 }), '{"a":1,"z":2}');
  assert.equal(validateGuardianResponse(validBody(), amount).status, "REJECTED");
  assert.throws(() => validateGuardianResponse({ ...validBody(), transactions: 1 }, amount), /read-only boundary/);
  assert.throws(() => validateGuardianResponse({ ...validBody(), receiptHashSha256: "0".repeat(64) }, amount), /SHA-256/);
});

test("skill helper accepts structured 503 evidence without hiding it", async () => {
  const fetchImpl = async () => new Response(JSON.stringify(validBody("INSUFFICIENT EVIDENCE")), {
    status: 503,
    headers: { "content-type": "application/json" },
  });
  const result = await invokeGuardian({ amount, endpoint: "https://example.invalid", timeoutMs: 1_000 }, fetchImpl);
  assert.equal(result.status, "INSUFFICIENT EVIDENCE");
});

test("skill helper retries one rate limit and then validates the response", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    if (calls === 1) return new Response(JSON.stringify({ error: "rate limited" }), { status: 429, headers: { "retry-after": "0" } });
    return new Response(JSON.stringify(validBody()), { status: 200, headers: { "content-type": "application/json" } });
  };
  const result = await invokeGuardian({ amount, endpoint: "https://example.invalid", timeoutMs: 1_000 }, fetchImpl);
  assert.equal(result.status, "REJECTED");
  assert.equal(calls, 2);
});

test("skill helper rejects non-JSON HTTP failures", async () => {
  const fetchImpl = async () => new Response("bad gateway", { status: 502 });
  await assert.rejects(
    invokeGuardian({ amount, endpoint: "https://example.invalid", timeoutMs: 1_000 }, fetchImpl),
    /non-JSON content/,
  );
});
