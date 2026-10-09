import assert from "node:assert/strict";
import test from "node:test";
import { canCalculateAfterHoursGap, normalizeMarketStatus } from "../lib/market-session.ts";

test("normalizes provider session values without leaking generic MARKET", () => {
  assert.equal(normalizeMarketStatus("market", true), "OPEN");
  assert.equal(normalizeMarketStatus("market", false), "CLOSED");
  assert.equal(normalizeMarketStatus("extended", true), "AFTER-HOURS");
  assert.equal(normalizeMarketStatus("after_hours", false), "AFTER-HOURS");
  assert.equal(normalizeMarketStatus("postmarket", false), "AFTER-HOURS");
  assert.equal(normalizeMarketStatus("pre_market", true), "PRE-MARKET");
  assert.equal(normalizeMarketStatus("pre_market", false), "PRE-MARKET");
  assert.equal(normalizeMarketStatus("holiday", false), "HOLIDAY");
  assert.equal(normalizeMarketStatus("unexpected", true), "UNKNOWN");
});

test("permits a live gap only outside the regular session", () => {
  assert.equal(canCalculateAfterHoursGap("OPEN", true), false);
  assert.equal(canCalculateAfterHoursGap("PRE-MARKET", true), false);
  assert.equal(canCalculateAfterHoursGap("CLOSED", false), true);
  assert.equal(canCalculateAfterHoursGap("AFTER-HOURS", true), true);
  assert.equal(canCalculateAfterHoursGap("AFTER-HOURS", false), false);
});
