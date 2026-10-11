#!/usr/bin/env node

import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

export const DEFAULT_ENDPOINT = "https://ghost-market-beta.lorgiogc.chatgpt.site/api/ghost-guardian";
export const ALLOWED_STATUSES = new Set(["REJECTED", "INSUFFICIENT EVIDENCE", "CANDIDATE FOR FURTHER REVIEW"]);

export function canonicalJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
}

export function receiptHash(receipt) {
  return createHash("sha256").update(canonicalJson(receipt), "utf8").digest("hex");
}

function parseArgs(argv) {
  const args = { amount: 6, endpoint: DEFAULT_ENDPOINT, timeoutMs: 15_000 };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (flag === "--amount" && value) { args.amount = Number(value); index += 1; continue; }
    if (flag === "--endpoint" && value) { args.endpoint = value; index += 1; continue; }
    if (flag === "--timeout-ms" && value) { args.timeoutMs = Number(value); index += 1; continue; }
    if (flag === "--help") {
      console.log("Usage: node scripts/invoke.mjs [--amount 6] [--timeout-ms 15000] [--endpoint URL]");
      return null;
    }
    throw new Error(`Unknown or incomplete argument: ${flag}`);
  }
  if (!Number.isFinite(args.amount) || args.amount < 0.1 || args.amount > 25) throw new Error("--amount must be between 0.1 and 25 USDT");
  if (!Number.isInteger(args.timeoutMs) || args.timeoutMs < 1_000 || args.timeoutMs > 60_000) throw new Error("--timeout-ms must be between 1000 and 60000");
  const endpoint = new URL(args.endpoint);
  if (!/^https?:$/.test(endpoint.protocol)) throw new Error("--endpoint must use http or https");
  args.endpoint = endpoint.toString();
  args.amount = Math.round(args.amount * 100) / 100;
  return args;
}

function retryDelayMs(response) {
  const raw = response.headers.get("retry-after");
  const seconds = raw === null ? Number.NaN : Number(raw);
  if (Number.isFinite(seconds)) return Math.min(Math.max(seconds * 1_000, 0), 5_000);
  const date = raw ? Date.parse(raw) : Number.NaN;
  if (Number.isFinite(date)) return Math.min(Math.max(date - Date.now(), 0), 5_000);
  return 1_000;
}

async function parseJson(response) {
  const text = await response.text();
  try { return JSON.parse(text); }
  catch { throw new Error(`Endpoint returned non-JSON content (HTTP ${response.status})`); }
}

export function validateGuardianResponse(body, requestAmount) {
  if (!body || typeof body !== "object") throw new Error("Response must be a JSON object");
  if (!ALLOWED_STATUSES.has(body.status)) throw new Error("Response contains an unsupported Guardian status");
  if (body.mode !== "READ_ONLY" || body.transactions !== 0) throw new Error("Response violated the read-only boundary");
  if (body.input?.asset !== "AAPLon" || body.input?.chainId !== 56 || body.input?.amountUsdt !== requestAmount) throw new Error("Response input identity did not match the request");
  if (!Array.isArray(body.routes) || body.routes.length > 1) throw new Error("Response contains an unexpected route set");
  if (body.routes.length === 1 && body.routes[0]?.route !== "PancakeSwap V2 · direct AAPLon/USDT") throw new Error("Response contains an unsupported route");
  if (!body.receipt || typeof body.receiptHashSha256 !== "string") throw new Error("Response is missing its receipt or SHA-256 hash");
  const computed = receiptHash(body.receipt);
  if (computed !== body.receiptHashSha256) throw new Error("Receipt SHA-256 verification failed");
  if (body.receipt?.integrityClaim !== "SHA-256 detects dossier changes. It is not a signature, attestation, or safe-to-trade claim.") throw new Error("Receipt integrity claim is missing or changed");
  return body;
}

export async function invokeGuardian({ amount, endpoint, timeoutMs }, fetchImpl = fetch) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let response;
    try {
      response = await fetchImpl(endpoint, {
        method: "POST",
        headers: { "accept": "application/json", "content-type": "application/json", "user-agent": "ghost-guardian-skill/1.0" },
        body: JSON.stringify({ asset: "AAPLon", amountUsdt: amount }),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      if (error?.name === "TimeoutError" || error?.name === "AbortError") throw new Error(`Ghost Guardian timed out after ${timeoutMs} ms`);
      throw new Error(`Ghost Guardian network error: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (response.status === 429) {
      if (attempt === 0) { await new Promise((resolve) => setTimeout(resolve, retryDelayMs(response))); continue; }
      throw new Error("Ghost Guardian rate limit persisted after one bounded retry (HTTP 429)");
    }

    const body = await parseJson(response);
    const structuredInsufficientEvidence = response.status === 503 && body?.status === "INSUFFICIENT EVIDENCE";
    if (!response.ok && !structuredInsufficientEvidence) throw new Error(`Ghost Guardian failed with HTTP ${response.status}: ${body?.error ?? "unknown error"}`);
    return validateGuardianResponse(body, amount);
  }
  throw new Error("Ghost Guardian request exhausted its retry budget");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args) return;
  const body = await invokeGuardian(args);
  console.log(JSON.stringify(body, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
