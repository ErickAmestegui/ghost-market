import assert from "node:assert/strict";
import test from "node:test";
import { isSuccessfulWalletSkillPayload, normalizeOndoTokenPrice, percentDifference, selectOndoBscAsset } from "../lib/binance-wallet-skill-validation.ts";

test("selects only the requested Ondo asset on BSC", () => {
  const selected = selectOndoBscAsset([
    { chainId: "1", contractAddress: "0x1111111111111111111111111111111111111111", symbol: "AAPLon", ticker: "AAPL", type: 1, multiplier: "1" },
    { chainId: "56", contractAddress: "0x390a684ef9cade28a7ad0dfa61ab1eb3842618c4", symbol: "AAPLon", ticker: "AAPL", type: 1, multiplier: "1.003" },
  ], "AAPL");
  assert.equal(selected?.chainId, "56");
  assert.equal(selected?.symbol, "AAPLon");
});

test("normalizes token price by the shares multiplier", () => {
  const normalized = normalizeOndoTokenPrice("337.60093065100347828", "1.003376073740221058");
  assert.ok(normalized !== null);
  assert.ok(Math.abs(normalized - 336.465) < 1e-9);
  assert.ok(Math.abs(percentDifference(normalized, "336.465") ?? 1) < 1e-9);
});

test("requires both HTTP-level payload success fields", () => {
  assert.equal(isSuccessfulWalletSkillPayload({ code: "000000", success: true }), true);
  assert.equal(isSuccessfulWalletSkillPayload({ code: "40304", success: false }), false);
  assert.equal(isSuccessfulWalletSkillPayload({ code: "000000", success: false }), false);
});
