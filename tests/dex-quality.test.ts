import test from "node:test";
import assert from "node:assert/strict";
import { evaluateDexQuality } from "../lib/dex-quality.ts";

test("accepts a liquid market with bounded price impact", () => {
  assert.deepEqual(evaluateDexQuality(185.25, 25_000, 0.82), {
    accepted: true,
    reason: null,
  });
});

test("rejects an empty or invalid spot price", () => {
  const result = evaluateDexQuality(null, 25_000, 0.82);
  assert.equal(result.accepted, false);
  assert.match(result.reason ?? "", /INVALID OR EMPTY SPOT PRICE/);
});

test("rejects a pool below the minimum liquidity threshold", () => {
  const result = evaluateDexQuality(185.25, 9.26, 0.2);
  assert.equal(result.accepted, false);
  assert.match(result.reason ?? "", /LIQUIDITY BELOW/);
});

test("rejects excessive price impact even when liquidity passes", () => {
  const result = evaluateDexQuality(185.25, 25_000, 2.01);
  assert.equal(result.accepted, false);
  assert.match(result.reason ?? "", /PRICE IMPACT ABOVE 2%/);
});
