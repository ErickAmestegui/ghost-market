import assert from "node:assert/strict";
import test from "node:test";
import { classifyBinanceError } from "../lib/binance-errors.ts";

test("Binance failures map to explicit product states", () => {
  assert.equal(classifyBinanceError(401, "invalid API key"), "INVALID_CREDENTIALS");
  assert.equal(classifyBinanceError(403, "Request blocked by CloudFront WAF"), "PROVIDER_BLOCKED");
  assert.equal(classifyBinanceError(429, "too many requests"), "RATE_LIMITED");
  assert.equal(classifyBinanceError(408, "timeout"), "TIMEOUT");
  assert.equal(classifyBinanceError(404, "unknown symbol"), "ASSET_NOT_FOUND");
  assert.equal(classifyBinanceError(500, ""), "EMPTY_RESPONSE");
  assert.equal(classifyBinanceError(500, "gateway failure"), "PROVIDER_ERROR");
});
