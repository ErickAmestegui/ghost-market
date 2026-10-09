import assert from "node:assert/strict";
import test from "node:test";
import { normalizePulseItems } from "../lib/pulse.ts";

const validItem = {
  id: "AAPL-p1",
  platform: "SYNTHETIC" as const,
  source: "High-trust supporting source",
  trust: 90,
  minutesAgo: 5,
  stance: "support" as const,
  excerpt: { en: "Demo observation", es: "Observación demo" },
};

test("normalizes null, undefined, primitives and non-array records to an empty list", () => {
  for (const value of [null, undefined, 42, "pulse", {}, { AAPL: null }, { AAPL: {} }]) {
    assert.deepEqual(normalizePulseItems(value, "AAPL"), []);
  }
});

test("selects the active asset array from the Pulse record", () => {
  assert.deepEqual(normalizePulseItems({ AAPL: [validItem], NVDA: [] }, "AAPL"), [validItem]);
});

test("drops malformed Pulse entries without throwing", () => {
  assert.deepEqual(normalizePulseItems({ AAPL: [null, {}, validItem] }, "AAPL"), [validItem]);
});
