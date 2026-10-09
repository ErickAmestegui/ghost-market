import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { buildWeb3PreHash, buildWeb3RequestPath, signWeb3Request } from "../lib/binance-web3-auth.ts";
import { classifyWeb3RwaError } from "../lib/binance-web3-errors.ts";

test("includes the mandatory /build prefix and preserves encoded query order", () => {
  assert.equal(
    buildWeb3RequestPath("/api/v1/dex/market/rwa/search", [["keyword", "NVDA & AI"]]),
    "/build/api/v1/dex/market/rwa/search?keyword=NVDA%20%26%20AI",
  );
});

test("generates the documented HMAC-SHA256 Base64 signature", async () => {
  const timestamp = "2026-10-09T12:00:00.000Z";
  const path = "/build/api/v1/dex/market/rwa/search?keyword=NVDA";
  const preHash = buildWeb3PreHash(timestamp, "GET", path);
  const expected = createHmac("sha256", "test-secret").update(preHash, "utf8").digest("base64");
  assert.equal(await signWeb3Request("test-secret", preHash), expected);
});

test("maps official Binance Web3 authentication errors", () => {
  assert.equal(classifyWeb3RwaError(401, 40101), "INVALID_CREDENTIALS");
  assert.equal(classifyWeb3RwaError(401, 40102), "INVALID_SIGNATURE");
  assert.equal(classifyWeb3RwaError(401, 40103), "TIMESTAMP_REJECTED");
  assert.equal(classifyWeb3RwaError(403, 40104), "INSUFFICIENT_PERMISSION");
  assert.equal(classifyWeb3RwaError(429, 42900), "RATE_LIMITED");
});
