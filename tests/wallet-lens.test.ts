import assert from "node:assert/strict";
import test from "node:test";
import { formatWeiToBnb, isBscAddress, parseChainId, shortAddress } from "../lib/wallet-lens.ts";

test("validates BSC public addresses without claiming ownership", () => {
  assert.equal(isBscAddress("0x0000000000000000000000000000000000000000"), true);
  assert.equal(isBscAddress("0x1234"), false);
  assert.equal(isBscAddress("not-an-address"), false);
});

test("formats hexadecimal wei balances safely", () => {
  assert.equal(formatWeiToBnb("0xde0b6b3a7640000"), "1");
  assert.equal(formatWeiToBnb("0x1121d33597384000"), "1.2345");
});

test("parses EIP-1193 chain IDs and abbreviates addresses", () => {
  assert.equal(parseChainId("0x38"), 56);
  assert.equal(parseChainId("56"), null);
  assert.equal(shortAddress("0x1234567890abcdef1234567890abcdef12345678"), "0x1234…5678");
});
