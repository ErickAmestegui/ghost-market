import assert from "node:assert/strict";
import test from "node:test";
import { matchesRequestedSymbol, RequestGenerationGate } from "../lib/integration-integrity.ts";

test("accepts responses only for the requested ticker", () => {
  assert.equal(matchesRequestedSymbol("AAPL", "aapl"), true);
  assert.equal(matchesRequestedSymbol("AAPL", "NVDA"), false);
  assert.equal(matchesRequestedSymbol("TSLA", undefined), false);
});

test("rejects out-of-order responses during rapid AAPL → NVDA → TSLA → AAPL changes", async () => {
  const gate = new RequestGenerationGate();
  const accepted: string[] = [];
  const schedule = (symbol: string, delay: number) => {
    const generation = gate.begin();
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        if (gate.isCurrent(generation)) accepted.push(symbol);
        resolve();
      }, delay);
    });
  };

  const requests = [
    schedule("AAPL-old", 30),
    schedule("NVDA", 20),
    schedule("TSLA", 10),
    schedule("AAPL-current", 1),
  ];
  await Promise.all(requests);
  assert.deepEqual(accepted, ["AAPL-current"]);
});

test("invalidating a generation prevents a late response from being accepted", () => {
  const gate = new RequestGenerationGate();
  const generation = gate.begin();
  gate.invalidate();
  assert.equal(gate.isCurrent(generation), false);
});
