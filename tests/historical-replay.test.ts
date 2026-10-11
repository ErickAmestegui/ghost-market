import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { estimateV2Route } from "../lib/ghost-guardian.ts";
import { canonicalJson } from "../lib/ghost-receipt.ts";

const files = [
  "../public/receipts/ghost-investigation-442cf727-5ef2-4d06-8f38-83fcf94b717f.json",
  "../public/receipts/ghost-investigation-b7e22486-0042-4b41-9e72-b06d8a3011ad.json",
];

test("authentic historical receipts retain their canonical SHA-256", async () => {
  const loaded = await Promise.all(files.map(async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"))));
  for (const item of loaded) {
    assert.equal(item.receipt.schemaVersion, "ghost-investigation-receipt/1.0");
    const digest = createHash("sha256").update(canonicalJson(item.receipt)).digest("hex");
    assert.equal(digest, item.receiptHashSha256);
    assert.equal(item.receipt.dossier.transactions, 0);
    assert.equal(item.receipt.dossier.status, "REJECTED");
  }
  assert.ok(loaded[0].receipt.dossier.observedAt < loaded[1].receipt.dossier.observedAt);
  assert.equal(loaded[0].receipt.dossier.freshness.blockNumber, 126952690);
  assert.equal(loaded[1].receipt.dossier.freshness.blockNumber, 126960194);
});

test("6 USDT replay independently reproduces the AMM estimate and no-change finding", async () => {
  const loaded = await Promise.all(files.map(async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"))));
  const first = loaded[0].receipt.dossier.routes[0];
  const second = loaded[1].receipt.dossier.routes[0];
  const estimate = estimateV2Route(6, first.reserves.counter, first.reserves.token);
  assert.ok(Math.abs(estimate.output - first.estimate.outputToken) < 1e-18);
  assert.ok(Math.abs(estimate.priceImpactPercent - first.estimate.priceImpactPercent) < 1e-12);
  assert.deepEqual(first.reserves, second.reserves);
  assert.equal(first.estimate.priceImpactPercent, second.estimate.priceImpactPercent);
  assert.equal(first.decision, second.decision);
});
