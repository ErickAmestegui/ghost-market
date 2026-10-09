import assert from "node:assert/strict";
import test from "node:test";
import { classifyRwaFreshness, isBscAddress, positiveNumberOrNull, timestampToIsoOrNull } from "../lib/binance-web3-validation.ts";
import { matchesRequestedSymbol } from "../lib/integration-integrity.ts";
import { classifyWeb3RwaError } from "../lib/binance-web3-errors.ts";

test("accepts only positive finite prices and valid BSC addresses", () => {
  assert.equal(positiveNumberOrNull("185.25"), 185.25);
  assert.equal(positiveNumberOrNull("0"), null);
  assert.equal(positiveNumberOrNull("not-a-price"), null);
  assert.equal(isBscAddress("0x1111111111111111111111111111111111111111"), true);
  assert.equal(isBscAddress("0x1234"), false);
});

test("labels fresh, stale, future and missing provider prices honestly", () => {
  const now = 2_000_000_000_000;
  assert.equal(classifyRwaFreshness("185.25", now - 30_000, now), "LIVE");
  assert.equal(classifyRwaFreshness("185.25", now - 600_000, now), "CACHED");
  assert.equal(classifyRwaFreshness("185.25", now + 120_000, now), "CACHED");
  assert.equal(classifyRwaFreshness("0", now, now), "UNAVAILABLE");
  assert.equal(classifyRwaFreshness("185.25", undefined, now), "CACHED");
});

test("rejects invalid timestamps and cross-symbol responses", () => {
  assert.equal(timestampToIsoOrNull("invalid"), null);
  assert.equal(matchesRequestedSymbol("AAPL", "aapl"), true);
  assert.equal(matchesRequestedSymbol("AAPL", "TSLA"), false);
  assert.equal(matchesRequestedSymbol("AAPL", undefined), false);
});

test("preserves Binance Web3 compliance restriction 40304 as an explicit error", () => {
  assert.equal(classifyWeb3RwaError(200, 40304), "COMPLIANCE_RESTRICTED");
});
