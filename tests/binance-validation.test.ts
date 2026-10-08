import assert from "node:assert/strict";
import test from "node:test";
import { validateBinancePayload } from "../lib/binance-validation.ts";

const asset = { assetCode: "AAPLB", assetName: "Apple", underlyingEquitySymbol: "AAPL", multiplier: "1", multiplierValid: true };
const quote = { symbol: "AAPL", bidPrice: "199.90", askPrice: "200.10", bidSize: 2, askSize: 3 };
const exchange = { timezone: "UTC", symbols: [{ symbol: "AAPL", tradability: "TRADABLE", tradabilityUpdateTime: 1, overnightSupported: true, extendedSession: true }] };

test("accepts a complete same-symbol Binance payload", () => {
  const result = validateBinancePayload("AAPL", [asset], quote, exchange);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.marketInfo.timezone, "UTC");
});

test("rejects an empty quote", () => {
  const result = validateBinancePayload("AAPL", [asset], null, exchange);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.kind, "EMPTY_RESPONSE");
});

test("rejects a mismatched quote ticker", () => {
  const result = validateBinancePayload("AAPL", [asset], { ...quote, symbol: "TSLA" }, exchange);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.kind, "PROVIDER_ERROR");
});

test("rejects a missing asset or exchange record", () => {
  const result = validateBinancePayload("AAPL", [], quote, { symbols: [] });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.kind, "ASSET_NOT_FOUND");
});
